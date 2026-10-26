// CI-only comparison:
// node test/compare_exports.cjs SERIALIZE_DIST BACKUP_DIST [PREVIOUS_BACKUP_DIST]
// Each measurement uses a fresh child process; both implementations run on
// the same machine. Timing is informational, never a pass/fail threshold.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { gzipSync } = require('node:zlib');

function values(db, query) {
    return db.exec(query)[0].values;
}

function readLeb(bytes, offset) {
    let value = 0;
    let scale = 1;
    let byte;
    do {
        byte = bytes[offset++];
        value += (byte & 127) * scale;
        scale *= 128;
    } while (byte & 128);
    return { value, offset };
}

function leb(value) {
    const bytes = [];
    do {
        const low = value % 128;
        value = Math.floor(value / 128);
        bytes.push(low | (value ? 128 : 0));
    } while (value);
    return bytes;
}

// Change only the declared memory maximum for the constrained-memory test.
// The engine enforces the cap; application code and the initial memory are
// unchanged. Normal measurements use the original, unmodified WASM bytes.
function memoryLimits(bytes, capPages) {
    for (let offset = 8; offset < bytes.length;) {
        const sectionStart = offset;
        const id = bytes[offset++];
        const size = readLeb(bytes, offset);
        const end = size.offset + size.value;
        if (id === 5) {
            const count = readLeb(bytes, size.offset);
            const flags = readLeb(bytes, count.offset);
            const initial = readLeb(bytes, flags.offset);
            const maximum = readLeb(bytes, initial.offset);
            assert.equal(count.value, 1);
            assert.equal(flags.value, 1, 'Expected one unshared wasm32 memory with a maximum');
            assert.equal(maximum.offset, end);
            if (capPages !== undefined) {
                assert.ok(initial.value <= capPages && capPages <= maximum.value);
                const payload = Buffer.from([1, 1, ...leb(initial.value), ...leb(capPages)]);
                bytes = Buffer.concat([
                    bytes.subarray(0, sectionStart),
                    Buffer.from([5, ...leb(payload.length)]), payload, bytes.subarray(end)
                ]);
            }
            return { bytes, maximumMiB: (capPages ?? maximum.value) / 16 };
        }
        offset = end;
    }
    throw new Error('The WASM module has no declared memory');
}

async function worker(strategy, directory, mode, rows) {
    const binary = memoryLimits(fs.readFileSync(path.resolve(directory, 'sql-wasm.wasm')),
        mode === 'limited' ? 1024 : undefined);
    let memory;
    const SQL = await require(path.resolve(directory, 'sql-wasm.js'))({
        instantiateWasm(imports, receiveInstance) {
            const module = new WebAssembly.Module(binary.bytes);
            const instance = new WebAssembly.Instance(module, imports);
            memory = Object.values(instance.exports).find(value => value instanceof WebAssembly.Memory);
            assert.ok(memory, 'The module exports its linear memory');
            receiveInstance(instance, module);
            return instance.exports;
        }
    });
    const db = new SQL.Database();
    try {
        if (mode === 'behavior') {
            const outcomes = {};
            db.run('CREATE TABLE t(x); INSERT INTO t VALUES (1)');
            for (const [name, begin, expected] of [
                ['read_transaction', 'BEGIN; SELECT * FROM t', [[1]]],
                ['reserved_write_transaction', 'BEGIN IMMEDIATE', [[1]]],
                ['uncommitted_writes', 'BEGIN; INSERT INTO t VALUES (2)', [[1], [2]]]
            ]) {
                db.run(begin);
                let bytes;
                let error;
                try { bytes = db.export(); } catch (e) { error = e; }
                if (strategy !== 'serialize' && name !== 'read_transaction') {
                    assert.match(error && error.message, /busy or locked/);
                    outcomes[name] = 'rejected; source transaction intact';
                } else {
                    assert.ifError(error);
                    const copy = new SQL.Database(bytes);
                    try {
                        assert.deepEqual(values(copy, 'SELECT x FROM t ORDER BY x'), expected);
                    } finally {
                        copy.close();
                    }
                    outcomes[name] = 'exported; source transaction intact';
                }
                assert.deepEqual(values(db, 'SELECT x FROM t ORDER BY x'), expected);
                db.run('ROLLBACK');
                assert.deepEqual(values(db, 'SELECT x FROM t'), [[1]]);
            }
            db.run('PRAGMA query_only = ON');
            const copy = new SQL.Database(db.export());
            try {
                assert.deepEqual(values(copy, 'SELECT x FROM t'), [[1]]);
            } finally {
                copy.close();
            }
            assert.deepEqual(values(db, 'PRAGMA query_only'), [[1]]);
            outcomes.query_only = 'exported; setting preserved';
            return { ...outcomes, maximumWasmMiB: binary.maximumMiB };
        }

        db.run('CREATE TABLE payload(id INTEGER PRIMARY KEY, data BLOB);'
            + 'WITH RECURSIVE seq(n) AS (VALUES(1) UNION ALL '
            + 'SELECT n+1 FROM seq WHERE n < ' + rows + ') '
            + 'INSERT INTO payload SELECT n, zeroblob(4096) FROM seq;'
            + 'CREATE INDEX payload_length ON payload(length(data));');
        const beforeWasmMiB = memory.buffer.byteLength / 1048576;
        if (mode === 'limited') {
            const expectedBytes = values(db, 'PRAGMA page_count')[0][0]
                * values(db, 'PRAGMA page_size')[0][0];
            let bytes;
            let error;
            const start = performance.now();
            try { bytes = db.export(); } catch (e) { error = e; }
            const elapsedMs = performance.now() - start;
            if (strategy === 'serialize') {
                assert.match(error && error.message, /Unable to serialize database/);
            } else {
                assert.ifError(error);
                assert.equal(bytes.length, expectedBytes);
                const copy = new SQL.Database(bytes);
                try {
                    assert.deepEqual(values(copy, 'PRAGMA integrity_check'), [['ok']]);
                    assert.deepEqual(values(copy, 'SELECT count(*) FROM payload'), [[rows]]);
                } finally {
                    copy.close();
                }
            }
            assert.deepEqual(values(db, 'SELECT count(*) FROM payload'), [[rows]],
                'The source remains usable after the constrained-memory export');
            return {
                maximumWasmMiB: binary.maximumMiB,
                databaseMiB: expectedBytes / 1048576,
                beforeWasmMiB,
                afterWasmMiB: memory.buffer.byteLength / 1048576,
                result: error ? error.message : 'exported and integrity checked',
                elapsedMs
            };
        }
        global.gc();
        const beforeRss = process.memoryUsage().rss;
        const beforePeak = process.resourceUsage().maxRSS * 1024;
        let start = performance.now();
        let bytes = db.export();
        const firstMs = performance.now() - start;
        const outputBytes = bytes.length;
        const firstRss = process.memoryUsage().rss;
        const firstWasmMiB = memory.buffer.byteLength / 1048576;
        const samplesMs = [];
        for (let i = 0; i < 7; i++) {
            bytes = null;
            global.gc();
            start = performance.now();
            bytes = db.export();
            samplesMs.push(performance.now() - start);
            assert.equal(bytes.length, outputBytes);
        }
        // Capture export-only memory before opening the independent copy.
        const peakRss = process.resourceUsage().maxRSS * 1024;
        const copy = new SQL.Database(bytes);
        try {
            assert.deepEqual(values(copy, 'PRAGMA integrity_check'), [['ok']]);
            assert.deepEqual(values(copy,
                'SELECT count(*), sum(length(data)), min(id), max(id) FROM payload'),
            [[rows, rows * 4096, 1, rows]]);
        } finally {
            copy.close();
        }
        return { outputBytes, firstMs, samplesMs, beforeRss, beforePeak, firstRss,
            peakRss, beforeWasmMiB, firstWasmMiB };
    } finally {
        db.close();
    }
}

function median(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function child(strategy, directory, mode, rows = 0) {
    const result = spawnSync(process.execPath, [
        '--expose-gc', __filename, '--worker', strategy, directory, mode, String(rows)
    ], { encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return JSON.parse(result.stdout);
}

function compare() {
    const directories = {
        serialize: path.resolve(process.argv[2]),
        backup: path.resolve(process.argv[3])
    };
    if (process.argv[4]) {
        directories.backup_before = path.resolve(process.argv[4]);
    }
    const strategies = Object.keys(directories);
    const behavior = {};
    const constrainedMemory = {};
    const bundle = {};
    for (const strategy of Object.keys(directories)) {
        behavior[strategy] = child(strategy, directories[strategy], 'behavior');
        constrainedMemory[strategy] = child(strategy, directories[strategy], 'limited', 24576);
        bundle[strategy] = {};
        for (const file of ['sql-wasm.js', 'sql-wasm.wasm']) {
            const bytes = fs.readFileSync(path.join(directories[strategy], file));
            bundle[strategy][file] = { bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
        }
    }
    const measurements = [];
    for (const rows of [256, 4096, 16384, 32768, 131072]) {
        const trials = Object.fromEntries(strategies.map(strategy => [strategy, []]));
        for (let repeat = 0; repeat < 3; repeat++) {
            const order = repeat % 2 ? strategies.slice().reverse() : strategies;
            for (const strategy of order) {
                trials[strategy].push(child(strategy, directories[strategy], 'timing', rows));
            }
        }
        for (const strategy of Object.keys(trials)) {
            const runs = trials[strategy];
            measurements.push({
                strategy,
                rows,
                outputMiB: runs[0].outputBytes / 1048576,
                firstMs: median(runs.map(run => run.firstMs)),
                steadyMs: median(runs.flatMap(run => run.samplesMs)),
                beforeRssMiB: median(runs.map(run => run.beforeRss / 1048576)),
                firstRssMiB: median(runs.map(run => run.firstRss / 1048576)),
                peakRssMiB: median(runs.map(run => run.peakRss / 1048576)),
                beforeWasmMiB: median(runs.map(run => run.beforeWasmMiB)),
                firstWasmMiB: median(runs.map(run => run.firstWasmMiB)),
                runs
            });
        }
    }
    const report = {
        environment: { node: process.version, cpu: os.cpus()[0].model, platform: os.platform() },
        behavior, constrainedMemory, bundle, measurements
    };
    console.log(JSON.stringify(report, null, 2));
    const lines = [
        '## Export implementation comparison',
        '',
        'Same runner, optimized wasm, 3 fresh processes per strategy/size.',
        'First-export median: 3 samples; steady-state median: 21 samples (GC between exports).',
        'Peak RSS is the median process high-water mark after export, before round-trip validation.',
        'It includes setup/runtime memory and is not an isolated SQLite allocation measurement.',
        '',
        '| Approach | Output MiB | First export ms | Repeated export ms | Before RSS MiB | After first RSS MiB | Peak RSS MiB | WASM before/after MiB |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
        ...measurements.map(row => '| ' + [
            row.strategy, row.outputMiB.toFixed(2), row.firstMs.toFixed(2),
            row.steadyMs.toFixed(2), row.beforeRssMiB.toFixed(1),
            row.firstRssMiB.toFixed(1), row.peakRssMiB.toFixed(1),
            row.beforeWasmMiB.toFixed(1) + '/' + row.firstWasmMiB.toFixed(1)
        ].join(' | ') + ' |'),
        '',
        '### 64 MiB hard WASM cap with a larger database',
        '',
        ...Object.entries(constrainedMemory).map(([strategy, result]) =>
            '- ' + strategy + ': ' + result.databaseMiB.toFixed(2) + ' MiB database; '
            + result.beforeWasmMiB.toFixed(1) + ' → ' + result.afterWasmMiB.toFixed(1)
            + ' MiB WASM; ' + result.result + '.'),
        '',
        'Behavior and bundle sizes (including gzip) are in the JSON report above.'
    ];
    const markdown = lines.join('\n') + '\n';
    console.log(markdown);
    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
    }
}

if (process.argv[2] === '--worker') {
    worker(process.argv[3], process.argv[4], process.argv[5], Number(process.argv[6]))
        .then(result => console.log(JSON.stringify(result)))
        .catch(error => { console.error(error); process.exitCode = 1; });
} else {
    compare();
}

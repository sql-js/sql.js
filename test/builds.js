const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

function noAssetLoading() {
    throw new Error("The inline build must not load a companion asset");
}

async function testBrowserBuild(file) {
    const warnings = [];
    const messages = [];
    const worker = file.startsWith("worker.");
    const context = vm.createContext({
        console: { ...console, warn: (warning) => warnings.push(warning) },
        WebAssembly,
        TextDecoder,
        TextEncoder,
        atob,
        setTimeout,
        clearTimeout,
        fetch: noAssetLoading,
        XMLHttpRequest: noAssetLoading,
        location: { href: "file:///sqljs/" + file },
        postMessage: (message) => messages.push(message)
    });
    context.self = context;
    if (worker) {
        context.WorkerGlobalScope = function WorkerGlobalScope() {};
        context.importScripts = noAssetLoading;
    } else {
        context.window = context;
        context.document = { currentScript: { src: context.location.href } };
    }
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../dist", file), "utf8"), context);

    const first = context.initSqlJs({ locateFile: noAssetLoading });
    assert.equal(first, context.initSqlJs(), "Initialization is cached");
    const SQL = await first;
    const db = new SQL.Database();
    assert.equal(db.exec("SELECT 42 AS answer")[0].values[0][0], 42);
    db.close();

    if (worker) {
        await context.self.onmessage({ data: { id: 1, action: "open" } });
        await context.self.onmessage({ data: { id: 2, action: "exec", sql: "SELECT 42" } });
        assert.equal(messages[0].ready, true);
        assert.equal(messages[1].results[0].values[0][0], 42);
        await context.self.onmessage({ data: { id: 3, action: "close" } });
    }

    assert.equal(warnings.length, 0, "WebAssembly builds do not warn");
    console.log("OK   browser distribution " + file);
}

function testIsolatedNodeBuild(file) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sqljs-inline-"));
    try {
        const bundle = path.join(dir, file);
        fs.copyFileSync(path.join(__dirname, "../dist", file), bundle);
        execFileSync(process.execPath, ["--unhandled-rejections=strict", "-e", `
            const assert = require("node:assert/strict");
            const initSqlJs = require(process.argv[1]);
            let completed = false;
            process.on("beforeExit", () => assert.ok(completed, "Initialization must finish"));
            global.fetch = () => { throw new Error("Unexpected fetch"); };
            initSqlJs({ locateFile() { throw new Error("Unexpected locateFile"); } }).then(SQL => {
                const db = new SQL.Database();
                assert.equal(db.exec("SELECT 42")[0].values[0][0], 42);
                db.close();
                completed = true;
            });
        `, bundle], { timeout: 20000, stdio: "inherit" });
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    console.log("OK   isolated Node.js distribution " + file);
}

async function main() {
    for (const suffix of ["", "-debug"]) {
        const file = "sql-wasm-inline" + suffix + ".js";
        assert.equal(fs.existsSync(path.join(__dirname, "../dist", "sql-wasm-inline" + suffix + ".wasm")), false);
        testIsolatedNodeBuild(file);
        await testBrowserBuild(file);
        await testBrowserBuild("worker." + file);
    }
}

const timeout = setTimeout(() => {
    console.error("Distribution checks timed out");
    process.exit(1);
}, 30000);

main().then(() => {
    clearTimeout(timeout);
}, (error) => {
    clearTimeout(timeout);
    console.error(error);
    process.exitCode = 1;
});

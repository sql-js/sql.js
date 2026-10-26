exports.test = function(SQL, assert) {
    function values(db, query) {
        return db.exec(query)[0].values;
    }

    // A fresh database is exportable, including inside an empty transaction.
    for (const transaction of [false, true]) {
        const empty = new SQL.Database();
        let copy;
        try {
            if (transaction) empty.run('BEGIN');
            const bytes = empty.export();
            assert.ok(bytes instanceof Uint8Array);
            copy = new SQL.Database(bytes);
            assert.deepStrictEqual(copy.exec('SELECT * FROM sqlite_master'), []);
            if (transaction) empty.run('ROLLBACK');
            empty.run('CREATE TABLE after_export(x)');
        } finally {
            if (copy) copy.close();
            empty.close();
        }
    }

    const db = new SQL.Database();
    let copy;
    let cursor;
    let iterator;
    try {
        db.run('PRAGMA page_size = 1024; PRAGMA foreign_keys = ON;'
            + 'PRAGMA cache_size = 123; PRAGMA busy_timeout = 456;'
            + 'CREATE TABLE items(id INTEGER PRIMARY KEY, data BLOB);'
            + "INSERT INTO items VALUES (1, x'0080ff'), (2, NULL);"
            + 'CREATE TEMP TABLE scratch(x); INSERT INTO scratch VALUES (7);'
            + "ATTACH DATABASE ':memory:' AS aux;"
            + 'CREATE TABLE aux.other(x); INSERT INTO aux.other VALUES (9);');
        db.create_function('twice', x => 2 * x);
        db.create_aggregate('js_sum', {
            init: () => 0,
            step: (state, x) => state + x
        });
        const calls = [];
        db.updateHook((operation, database, table, rowId) => {
            calls.push([operation, database, table, rowId]);
        });
        cursor = db.prepare('SELECT id FROM items WHERE id >= ? ORDER BY id', [1]);
        assert.strictEqual(cursor.step(), true);
        assert.deepStrictEqual(cursor.get(), [1]);
        iterator = db.iterateStatements('SELECT id FROM items ORDER BY id; SELECT 42');
        const iterated = iterator.next().value;
        assert.strictEqual(iterated.step(), true);
        assert.deepStrictEqual(iterated.get(), [1]);
        const changes = db.getRowsModified();
        const rowId = values(db, 'SELECT last_insert_rowid()');

        const bytes = db.export();
        const originalBytes = bytes.slice();
        copy = new SQL.Database(bytes);
        assert.deepStrictEqual(values(copy, 'SELECT * FROM items ORDER BY id'), [
            [1, new Uint8Array([0, 128, 255])], [2, null]
        ], 'The snapshot contains main-database rows and blobs');
        assert.deepStrictEqual(values(copy, 'PRAGMA page_size'), [[1024]]);
        assert.throws(() => copy.exec('SELECT * FROM scratch'), /no such table/);
        assert.throws(() => copy.exec('SELECT * FROM aux.other'), /no such table/);

        assert.strictEqual(db.getRowsModified(), changes);
        assert.deepStrictEqual(values(db, 'SELECT last_insert_rowid()'), rowId);
        assert.deepStrictEqual(values(db, 'PRAGMA foreign_keys'), [[1]]);
        assert.deepStrictEqual(values(db, 'PRAGMA cache_size'), [[123]]);
        assert.deepStrictEqual(values(db, 'PRAGMA busy_timeout'), [[456]]);
        assert.deepStrictEqual(values(db, 'SELECT * FROM scratch'), [[7]]);
        assert.deepStrictEqual(values(db, 'SELECT * FROM aux.other'), [[9]]);
        assert.deepStrictEqual(values(db, 'SELECT twice(js_sum(id)) FROM items'), [[6]],
            'Custom functions and aggregates remain registered');
        assert.deepStrictEqual(values(db, "SELECT reverse('abc')"), [['cba']],
            'Extension functions remain registered');

        assert.strictEqual(cursor.step(), true);
        assert.deepStrictEqual(cursor.get(), [2], 'Cursor position and bindings survive');
        assert.strictEqual(cursor.step(), false);
        cursor.free();
        cursor = null;
        assert.strictEqual(iterated.step(), true);
        assert.deepStrictEqual(iterated.get(), [2], 'Iterator cursor survives');
        const next = iterator.next().value;
        assert.strictEqual(next.step(), true);
        assert.deepStrictEqual(next.get(), [42], 'Iterator can prepare its next statement');
        assert.strictEqual(iterator.next().done, true);
        iterator = null;

        assert.deepStrictEqual(calls, [], 'Export does not report updates');
        db.run('INSERT INTO items VALUES (3, NULL)');
        db.export();
        db.run('INSERT INTO items VALUES (4, NULL)');
        assert.deepStrictEqual(calls, [
            ['insert', 'main', 'items', 3], ['insert', 'main', 'items', 4]
        ], 'The hook survives repeated exports');
        db.updateHook(null);
        db.run('INSERT INTO items VALUES (5, NULL)');
        assert.strictEqual(calls.length, 2, 'The hook can still be unregistered');
        assert.deepStrictEqual(bytes, originalBytes,
            'Subsequent writes and exports do not change earlier snapshots');
        bytes[0] = 0;
        assert.strictEqual(db.export()[0], 83,
            'Mutating an exported array does not change the database');
    } finally {
        if (iterator) iterator.return();
        if (cursor) cursor.free();
        if (copy) copy.close();
        db.close();
    }
    assert.throws(() => db.export(), /Database closed/);

    // A snapshot includes uncommitted changes without ending the transaction.
    const transactional = new SQL.Database();
    let snapshot;
    let committed;
    try {
        transactional.run('CREATE TABLE t(x); INSERT INTO t VALUES (1);'
            + 'BEGIN; INSERT INTO t VALUES (2);'
            + 'SAVEPOINT saved; INSERT INTO t VALUES (3);');
        const bytes = transactional.export();
        snapshot = new SQL.Database(bytes);
        assert.deepStrictEqual(values(snapshot, 'SELECT x FROM t ORDER BY x'),
            [[1], [2], [3]], 'Export includes uncommitted changes');
        transactional.run('ROLLBACK TO saved');
        assert.deepStrictEqual(values(transactional, 'SELECT x FROM t ORDER BY x'),
            [[1], [2]], 'Savepoints survive export');
        transactional.run('ROLLBACK');
        assert.deepStrictEqual(values(transactional, 'SELECT x FROM t'), [[1]],
            'The transaction can still be rolled back after export');
        assert.deepStrictEqual(values(snapshot, 'SELECT x FROM t ORDER BY x'),
            [[1], [2], [3]], 'Rollback does not change the exported snapshot');

        transactional.run('BEGIN; INSERT INTO t VALUES (4)');
        const committedBytes = transactional.export();
        transactional.run('COMMIT');
        committed = new SQL.Database(committedBytes);
        assert.deepStrictEqual(values(transactional, 'SELECT x FROM t ORDER BY x'),
            [[1], [4]], 'The transaction can still be committed after export');
        assert.deepStrictEqual(values(committed, 'SELECT x FROM t ORDER BY x'),
            [[1], [4]]);
    } finally {
        if (committed) committed.close();
        if (snapshot) snapshot.close();
        transactional.close();
    }

    // Exclusive locking lets WAL work without shared-memory VFS methods.
    const wal = new SQL.Database();
    let walBytes;
    try {
        wal.run('PRAGMA locking_mode = EXCLUSIVE');
        assert.deepStrictEqual(values(wal, 'PRAGMA journal_mode = WAL'), [['wal']]);
        wal.run('PRAGMA wal_autocheckpoint = 0;'
            + 'CREATE TABLE t(x); INSERT INTO t VALUES (1);'
            + 'BEGIN; INSERT INTO t VALUES (2);');
        walBytes = wal.export();
        assert.deepStrictEqual([walBytes[18], walBytes[19]], [1, 1],
            'Exported files do not require WAL support');
        assert.deepStrictEqual(values(wal, 'PRAGMA journal_mode'), [['wal']],
            'The source keeps its journal mode');
        wal.run('ROLLBACK');
        assert.deepStrictEqual(values(wal, 'SELECT x FROM t'), [[1]]);
    } finally {
        wal.close();
    }
    const walCopy = new SQL.Database(walBytes);
    try {
        assert.deepStrictEqual(values(walCopy, 'SELECT x FROM t ORDER BY x'),
            [[1], [2]], 'A WAL snapshot opens independently after closing the source');
        walCopy.run('INSERT INTO t VALUES (3)');
    } finally {
        walCopy.close();
    }
};

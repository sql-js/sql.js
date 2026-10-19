exports.test = function(SQL, assert) {
    const db = new SQL.Database();
    const query = 'SELECT 42 AS "__proto__", 7 AS "constructor", '
        + '8 AS "hasOwnProperty", 1 AS duplicate, 2 AS duplicate';
    function checkRow(row) {
        assert.strictEqual(Object.getPrototypeOf(row), Object.prototype);
        assert.strictEqual(Object.hasOwn(row, '__proto__'), true);
        assert.strictEqual(row.__proto__, 42);
        assert.strictEqual(row.constructor, 7);
        assert.strictEqual(row.hasOwnProperty, 8);
        assert.strictEqual(row.duplicate, 2, 'Last duplicate column wins');
        assert.strictEqual(JSON.parse(JSON.stringify(row)).__proto__, 42);
    }
    try {
        const stmt = db.prepare(query);
        try {
            stmt.step();
            checkRow(stmt.getAsObject());
        } finally {
            stmt.free();
        }
        let rows = 0;
        db.each(query, row => { checkRow(row); rows++; });
        assert.strictEqual(rows, 1);
    } finally {
        db.close();
    }
};

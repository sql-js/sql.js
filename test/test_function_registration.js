exports.test = function(SQL, assert) {
    const db = new SQL.Database();
    const sum = { init: () => 0, step: (state, value) => state + value };
    function values(query) { return db.exec(query)[0].values; }
    try {
        db.create_aggregate('total', sum);
        db.create_function('total__finalize', () => 99);
        assert.deepStrictEqual(
            values('SELECT total(column1), total__finalize() FROM (VALUES (1),(2))'),
            [[3, 99]], 'SQL names cannot collide with aggregate callback storage'
        );
        db.create_aggregate('total', sum);
        assert.deepStrictEqual(values('SELECT total(4), total__finalize()'), [[4, 99]]);

        for (let i = 0; i < 10; i++) {
            db.create_function('__proto__', () => i);
            db.create_aggregate('constructor', sum);
            db.create_function('hasOwnProperty', () => 5);
            assert.deepStrictEqual(
                values('SELECT __proto__(), constructor(2), hasOwnProperty()'),
                [[i, 2, 5]], 'Prototype property names are ordinary SQL names'
            );
        }
        db.export();
        db.create_aggregate('total', sum);
        db.create_function('total__finalize', () => 8);
        assert.deepStrictEqual(values('SELECT total(6), total__finalize()'), [[6, 8]],
            'Registrations work after export resets the registry');
    } finally {
        db.close();
    }
};

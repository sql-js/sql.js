exports.test = function(SQL, assert) {
    const db = new SQL.Database();
    function values(query) { return db.exec(query)[0].values; }
    try {
        db.create_function('overload', () => 10);
        db.create_function('overload', value => value + 20);
        db.create_aggregate('overload', {
            init: () => 0, step: (state, a, b) => state + a + b
        });
        const query = 'SELECT overload(), overload(2), overload(3, 4)';
        assert.deepStrictEqual(values(query), [[10, 22, 7]], 'Arities coexist');
        db.create_function('OVERLOAD', value => value + 30);
        assert.deepStrictEqual(values(query), [[10, 32, 7]], 'Names ignore ASCII case');
        db.create_function('overload', (a, b) => a * b);
        assert.deepStrictEqual(values(query), [[10, 32, 12]], 'Scalar replaces aggregate');
        db.create_aggregate('OVERLOAD', {
            init: () => 0, step: (state, a, b) => state + a - b
        });
        assert.deepStrictEqual(values(query), [[10, 32, -1]], 'Aggregate replaces scalar');

        db.create_function('Ä', () => 1);
        db.create_function('ä', () => 2);
        assert.deepStrictEqual(values('SELECT Ä(), ä()'), [[1, 2]],
            'SQLite case folding only applies to ASCII');
    } finally {
        db.close();
    }
};

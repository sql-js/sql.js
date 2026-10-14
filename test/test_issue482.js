// test for https://github.com/sql-js/sql.js/issues/482
exports.test = function (sql, assert) {
    "use strict";
    // The WebAssembly stack is 5 MB, so SQL of this size cannot live on it
    var text = "a".repeat(6 * 1024 * 1024);
    var insert = "INSERT INTO t VALUES ('" + text + "', ?)";
    var lengths = "SELECT length(a) FROM t";

    var db = new sql.Database();
    db.run("CREATE TABLE t (a, b)");

    db.run("INSERT INTO t VALUES ('" + text + "', 1)");
    db.run(insert, [2]);
    var stmt = db.prepare(insert, [3]);
    stmt.step();
    stmt.free();

    assert.deepEqual(
        db.exec(lengths)[0].values,
        [[text.length], [text.length], [text.length]],
        "long SQL passed to run, run with params and prepare is executed"
    );
    assert.deepEqual(
        db.exec("SELECT b FROM t")[0].values,
        [[1], [2], [3]],
        "database is still usable after long SQL"
    );

    db.close();
};

if (module == require.main) {
    const target_file = process.argv[2];
    const sql_loader = require('./load_sql_lib');
    sql_loader(target_file).then((sql) => {
        require('test').run({
            'test issue482': function (assert) {
                exports.test(sql, assert);
            }
        });
    }).catch((e) => {
        console.error(e);
        assert.fail(e);
    });
}

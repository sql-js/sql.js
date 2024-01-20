// test for https://github.com/sql-js/sql.js/issues/561
exports.test = function (sql, assert) {
    // Create a database
    var db = new sql.Database();
    var len = 1000000;
    var many_a = "";
    for (var a = 'a'; many_a.length < len; a += a)
        if ((len / a.length) & 1)
            many_a += a;

    var res = db.exec("select length('" + many_a + "') as len");
    var expectedResult = [
        {
            columns: ['len'],
            values: [
                [len]
            ]
        }
    ];
    assert.deepEqual(res, expectedResult, "length of long string");
};

if (module == require.main) {
    const target_file = process.argv[2];
    const sql_loader = require('./load_sql_lib');
    sql_loader(target_file).then((sql) => {
        require('test').run({
            'test long sql string (issue 561)': function (assert) {
                exports.test(sql, assert);
            }
        });
    }).catch((e) => {
        console.error(e);
        assert.fail(e);
    });
}

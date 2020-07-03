exports.test = function (SQL, assert) {
    var db = new SQL.Database();

    db.create_aggregate(
        "js_sum",
        function () { return { sum: 0 }; },
        function (state, value) { state.sum += value; },
        function (state) { return state.sum; }
    );

    db.exec("CREATE TABLE test (col);");
    db.exec("INSERT INTO test VALUES (1), (2), (3);");
    var result = db.exec("SELECT js_sum(col) FROM test;");
    assert.equal(result[0].values[0][0], 6, "Simple aggregate function.");

    // TODO: Add test cases..
}
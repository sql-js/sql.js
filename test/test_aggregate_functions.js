exports.test = function (SQL, assert) {
    var db = new SQL.Database();

    db.create_aggregate(
        "sum",
        function () { return { sum: 0 }; },
        function (state, value) { state.sum += value; },
        function (state) { return state.sum; }
    );

    db.exec("CREATE TABLE test (col);");
    db.exec("INSERT INTO test VALUES (1), (2), (3);");
    var result = db.exec("SELECT sum(col) FROM test;");
    assert.equal(result[0].values[0][0], 6, "Simple aggregate function.");

    db.create_aggregate(
        "percentile",
        function () { return { vals: [], pctile: null }; }, // init
        function (state, value, pctile) {
            state.vals.push(value);
        },
        function (state) {
            return percentile(state.vals, state.pctile);
        }
    );
    var result = db.exec("SELECT percentile(col, 20) FROM test;");
    assert.equal(result[0].values[0][0], 1, "Aggregate function with two args");

    db.create_aggregate(
        "json_agg",
        function() { return { vals: [] }; },
        function(state, val) { state.vals.push(val); },
        function(state) { return JSON.stringify(state.vals); }
    );

    db.exec("CREATE TABLE test2 (col, col2);");
    db.exec("INSERT INTO test2 values ('four score', 12), ('and seven', 7), ('years ago', 1);");
    var result = db.exec("SELECT json_agg(col) FROM test2;");
    assert.deepEqual(JSON.parse(result[0].values[0]), ["four score", "and seven", "years ago"], "Aggregate function that returns JSON");
}

// helper function to calculate a percentile from an array. Will modify the
// array in-place.
function percentile(arr, p) {
    arr.sort();
    const pos = (arr.length - 1) * (p / 100);
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
        return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
        return arr[base];
    }
};


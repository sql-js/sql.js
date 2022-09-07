exports.test = function (SQL, assert) {
    function assertFloat(got, expected, message="", sigma=0.001) {
        assert.ok(got > expected - sigma && got < expected + sigma, message);
    }

    var db = new SQL.Database();

    db.create_aggregate(
        "sum", 0, {
            step: function (state, value) { return state + value; },
        }
    );

    db.exec("CREATE TABLE test (col);");
    db.exec("INSERT INTO test VALUES (1), (2), (3), (null);");
    var result = db.exec("SELECT sum(col) FROM test;");
    assert.equal(result[0].values[0][0], 6, "Simple aggregate function.");

    db.create_aggregate(
        "percentile", { vals: [], pctile: null },
        {
            step: function (state, value, pctile) {
                var typ = typeof value;
                if (typ == "number" || typ == "bigint") {
                    state.pctile = pctile;
                    state.vals.push(value);
                }
                return state;
            },
            finalize: function (state) {
                return percentile(state.vals, state.pctile);
            }
        }
    );
    result = db.exec("SELECT percentile(col, 80) FROM test;");
    assertFloat(result[0].values[0][0], 2.6, "Aggregate function with two args");

    db.create_aggregate(
        "json_agg", [], {
            step: (state, val) => [...state, val],
            finalize: (state) => JSON.stringify(state),
        }
    );

    db.exec("CREATE TABLE test2 (col, col2);");
    db.exec("INSERT INTO test2 values ('four score', 12), ('and seven', 7), ('years ago', 1);");
    result = db.exec("SELECT json_agg(col) FROM test2;");
    assert.deepEqual(JSON.parse(result[0].values[0]), ["four score", "and seven", "years ago"], "Aggregate function that returns JSON");

    result = db.exec("SELECT json_agg(col), json_agg(col2) FROM test2;");
    assert.deepEqual(result[0].values[0].map(JSON.parse), [["four score", "and seven", "years ago"], [12, 7, 1]], "Multiple aggregations at once");
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

if (module == require.main) {
    const target_file = process.argv[2];
    const sql_loader = require('./load_sql_lib');
    sql_loader(target_file).then((sql)=>{
        require('test').run({
            'test functions': function(assert, done){
                exports.test(sql, assert, done);
            }
        });
    })
    .catch((e)=>{
        console.error(e);
        assert.fail(e);
    });
}

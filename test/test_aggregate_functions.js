exports.test = function (SQL, assert) {
    var db = new SQL.Database();

    db.create_aggregate(
        "sum", {
            init: function () { return { sum: 0 }; },
            step: function (state, value) { state.sum += value; },
            finalize: function (state) { return state.sum; }
        }
    );

    db.exec("CREATE TABLE test (col);");
    db.exec("INSERT INTO test VALUES (1), (2), (3);");
    var result = db.exec("SELECT sum(col) FROM test;");
    assert.equal(result[0].values[0][0], 6, "Simple aggregate function.");

    db.create_aggregate(
        "percentile", {
            init: function () { return { vals: [], pctile: null }; }, // init
            step: function (state, value, pctile) {
                state.vals.push(value);
            },
            finalize: function (state) {
                return percentile(state.vals, state.pctile);
            }
        }
    );
    var result = db.exec("SELECT percentile(col, 20) FROM test;");
    assert.equal(result[0].values[0][0], 1, "Aggregate function with two args");

    db.create_aggregate(
        "json_agg", {
            init: function() { return { vals: [] }; },
            step: function(state, val) { state.vals.push(val); },
            finalize: function(state) { return JSON.stringify(state.vals); }
        }
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

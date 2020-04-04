
exports.test = function(sql, assert){
    "use strict";
    // Create a database
    var db = new sql.Database();
    var result;
    var value;

    // verify Infinity upper-bound
    result = db.exec("SELECT 1.7976931348623159e+308 AS value");
    value = result[0].values[0][0];
    assert.strictEqual(
        value,
        Infinity,
        "SELECT 1.7976931348623159e+308 is Infinity"
    );
    assert.notEqual(
        value,
        1.7976931348623157e+308,
        "SELECT 1.7976931348623159e+308 is Infinity"
    );

    // inline result value test
    result = db.exec("SELECT 1.7976931348623157e+308 AS value");
    value = result[0].values[0][0];
    assert.notEqual(
        value,
        Infinity,
        "SELECT 1.7976931348623157e+308 is not Infinity"
    );
    assert.strictEqual(
        value,
        1.7976931348623157e+308,
        "SELECT 1.7976931348623157e+308 is 1.7976931348623157e+308"
    );

    // bind result value test
    result = db.exec("SELECT ? AS value", [1.7976931348623157e+308]);
    value = result[0].values[0][0];
    assert.notEqual(
        value,
        Infinity,
        "SELECT ? AS value is not Infinity"
    );
    assert.strictEqual(
        value,
        1.7976931348623157e+308,
        "SELECT ? AS value is 1.7976931348623157e+308"
    );

    // CAST value test
    result = db.exec("SELECT CAST('1.7976931348623157e+308' AS REAL) AS value");
    value = result[0].values[0][0];
    assert.notEqual(
        value,
        Infinity,
        "SELECT CAST('1.7976931348623157e+308' AS REAL) is not Infinity"
    );
    assert.strictEqual(
        value,
        1.7976931348623157e+308,
        "SELECT CAST('1.7976931348623157e+308' AS REAL) is 1.7976931348623157e+308"
    );

    // Close the database and all associated statements
    db.close();
};

if (module == require.main) {
  const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test issue325': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}


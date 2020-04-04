
exports.test = function(sql, assert){
    "use strict";
    // Create a database
    var db = new sql.Database();

    // binding a large number 
    assert.strictEqual(
        db.exec("SELECT ?", [1.7976931348623157e+308])[0].values[0][0],
        1.7976931348623157e+308,
        "binding 1.7976931348623159e+308 as a parameter"
    );

    // inline result value test
    assert.strictEqual(
        db.exec("SELECT 1.7976931348623157e+308")[0].values[0][0],
        1.7976931348623157e+308,
        "SELECT 1.7976931348623157e+308 is 1.7976931348623157e+308"
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

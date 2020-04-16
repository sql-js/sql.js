exports.test = function(sql, assert){
  "use strict";
  // Create a database
  var db = new sql.Database();
  db.run("CREATE TABLE test (foo);");

  // getColumnNames() on empty table
  var stmt = db.prepare("SELECT * FROM test;");
  assert.deepEqual(stmt.getColumnNames(), ["foo"],
                   "getColumnNames() should work without step() & with empty result set");
  stmt.free();

  // Select/insert/select gives correct 2 element result
  result = db.exec(
    "SELECT * FROM test; "
    + "INSERT INTO test VALUES (42); "
    + "SELECT * FROM test"
  );

  assert.deepEqual(result,
    [
      {
        columns: ["foo"],
        values: []
      }, {
        columns: ["foo"],
        values: [[42]]
      },
    ], 
    "Return value of exec with 2 selects should be length 2 and contain correct values"
  );

  // Close the database and all associated statements
  db.close();
};

if (module == require.main) {
  const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test issue388': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

// See: https://github.com/sql-js/sql.js/issues/306
exports.test = function(sql, assert) {
  var errors = 0, runs=10000;
  for (var i=0; i<runs; i++) {
    var db = new sql.Database()
    try {
      db.exec("CREATE TABLE cats (name TEXT NOT NULL, age INTEGER NULL)")
      db.exec("INSERT INTO cats (name, age) VALUES (NULL, 3)")
    } catch (e) {
      errors += e.toString() === "Error: NOT NULL constraint failed: cats.name";
    }
    db.close()
  }
  assert.equal(errors, runs, "Multiple constraint violation errors do not trigger an OOM error");
};

if (module == require.main) {
  const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test memory leak on error': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

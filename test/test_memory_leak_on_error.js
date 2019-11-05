// See: https://github.com/kripken/sql.js/issues/306
exports.test = function(sql, assert) {
  var errors = [];
  for (var i=0; i<10000; i++) {
    var db = new sql.Database()
    try {
      db.exec("CREATE TABLE cats (name TEXT NOT NULL, age INTEGER NULL)")
      db.exec("INSERT INTO cats (name, age) VALUES (NULL, 3)")
    } catch (e) {
      errors[i] = e;
    }
    db.close()
  }
  assert.equal(
    errors.every(e => e.toString() === "Error: NOT NULL constraint failed: cats.name"),
    true,
    "Multiple constraint violation errors do not trigger an OOM error");
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

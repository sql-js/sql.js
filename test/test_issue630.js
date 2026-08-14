
exports.test = function(sql, assert) {
    "use strict";
    var db = new sql.Database();
    db.run("CREATE TABLE t (x); INSERT INTO t VALUES (1);");

    var before = sql.stackSave();
    for (var i = 0; i < 1000; i++) {
        db.exec("SELECT x FROM t");
    }
    assert.strictEqual(
        before - sql.stackSave(),
        0,
        "exec() should not leak stack memory after repeated successful calls"
    );

    for (var j = 0; j < 100; j++) {
        assert.throws(
            function () { db.exec("SELECT * FROM does_not_exist"); },
            "no such table: does_not_exist",
            "exec() should throw for a failing query"
        );
    }
    assert.strictEqual(
        before - sql.stackSave(),
        0,
        "exec() should not leak stack memory after repeated failing calls"
    );

    // Close the database and all associated statements
    db.close();
};

if (module == require.main) {
  const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test issue630': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}


exports.test = function(sql, assert){
    // Create a database
    var db = new sql.Database();

    // inline result value test
    var result = db.exec("SELECT 1.7976931348623157e+308 AS myResult");
    assert.strictEqual(result.length, 1, 'correct inline result length');
    assert.deepEqual(result[0].columns, ['myResult'], 'correct inline result column name');
    assert.strictEqual(result[0].values.length, 1, 'correct inline result values length');
    assert.strictEqual(result[0].values[0].length, 1, 'inline result values[0] length');
    assert.strictEqual(typeof result[0].values[0][0], 'number', 'correct inline result value is a number');
    assert.ok(result[0].values[0][0] > 1.7976931348623e+308, 'inline result value is not too small');
    assert.ok(result[0].values[0][0] < 1.797693134862316e+308, 'inline result value is not too large');
    assert.notEqual(result[0].values[0][0], Infinity, 'inline result value is not Infinity');

    // bind result value test
    var stmt = db.prepare("SELECT ? AS myResult");
    var res = stmt.getAsObject([1.7976931348623157e+308]);
    assert.ok(res.myResult, 'bind result value is valid and defined');
    assert.strictEqual(typeof res.myResult, 'number', 'bind result value is a number');
    assert.ok(res.myResult > 1.7976931348623e+308, 'bind result value is not too small');
    assert.ok(res.myResult < 1.797693134862316e+308, 'bind result value is not too large');
    assert.notEqual(res.myResult, Infinity, 'bind result value is not Infinity');

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


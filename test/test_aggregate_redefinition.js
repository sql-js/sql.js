exports.test = function(sql, assert) {
  // Test 1: Create a database, Register single function, close database, repeat 1000 times
  for (var i = 1; i <= 1000; i++) 
  {
    let lastStep = i == 1000;
    let db = new sql.Database();
    try {
      db.create_aggregate("TestFunction"+i, {step: (state, value) => i})
    } catch(e) {
      assert.ok(
        false,
        "Test 1: Recreate database "+i+"th times and register aggregate"
        +" function failed with exception:"+e
      );
      db.close();
      break;
    }
    var result = db.exec("SELECT TestFunction"+i+"(1)");
    var result_str = result[0]["values"][0][0];
    if(result_str != i || lastStep)
    {
      assert.equal(
        result_str,
        i,
        "Test 1: Recreate database "+i+"th times and register aggregate function"
      );
      db.close();
      break;
    }
    db.close();
  }

  // Test 2: Create a database, Register same function  1000 times, close database
  {
    let db = new sql.Database();
    for (var i = 1; i <= 1000; i++) 
    {
      let lastStep = i == 1000;
      try {
        db.create_aggregate("TestFunction", {step: (state, value) => i})
      } catch(e) {
        assert.ok(
          false,
          "Test 2: Reregister aggregate function "+i+"th times failed with"
          +" exception:"+e
        );
        break;
      }
      var result = db.exec("SELECT TestFunction(1)");
      var result_str = result[0]["values"][0][0];
      if(result_str != i || lastStep)
      {
        assert.equal(
          result_str,
          i,
          "Test 2: Reregister function "+i+"th times"
        );
        break;
      }
    }
    db.close();
  }
};


if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test creating multiple functions': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

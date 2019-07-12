exports.test = function(sql, assert) {
  // Test 1: Create a database, Register single function, close database, repeat 1000 times
  for (var i = 1; i <= 1000; i++) 
  {
    let db = new sql.Database();
    function add() {return i;}
    try
    {
      db.create_function("TestFunction"+i, add)
    }catch(e)
    {
      assert.ok(false,"Test 1: Recreate database "+i+"th times and register function failed with exception:"+e);
      break;
    }
    var result = db.exec("SELECT TestFunction"+i+"()");
    var result_str = result[0]["values"][0][0];
    assert.equal(result_str, i, "Test 1: Recreate database "+i+"th times and register function");
    db.close();
  }
  
  // Test 2: Create a database, Register same function  1000 times, close database, repeat
  {
    let db = new sql.Database();
    for (var i = 1; i <= 1000; i++) 
    {
      function add() {return i;}
      try
      {
        db.create_function("TestFunction", add);
      }catch(e)
      {
        assert.ok(false,"Test 2: Reregister function "+i+"th times failed with exception:"+e);
        break;
      }
      var result = db.exec("SELECT TestFunction()");
      var result_str = result[0]["values"][0][0];
      assert.equal(result_str, i, "Test 2: Reregister function "+i+"th times");
    }
    db.close();
  }
};


if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test functions recreeate': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

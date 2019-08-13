exports.test = function(SQL, assert){
  var db = new SQL.Database();
  db.exec("CREATE TABLE test (data); INSERT INTO test VALUES ('Hello World');");

  // Simple function, appends extra text on a string.
  function test_function(string_arg) {
    return "Function called with: " + string_arg;
  };

  // Register with SQLite.
  db.create_function("TestFunction", test_function);

  // Use in a query, check expected result.
  var result = db.exec("SELECT TestFunction(data) FROM test;");
  var result_str = result[0]["values"][0][0];
  assert.equal(result_str, "Function called with: Hello World", "Named functions can be registered");

  // 2 arg function, adds two ints together.
  db.exec("CREATE TABLE test2 (int1, int2); INSERT INTO test2 VALUES (456, 789);");

  function test_add(int1, int2) {
    return int1 + int2;
  };

  db.create_function("TestAdd", test_add);
  result = db.exec("SELECT TestAdd(int1, int2) FROM test2;");
  result_int = result[0]["values"][0][0];
  assert.equal(result_int, 1245, "Multiple argument functions can be registered");

  // Binary data function, tests which byte in a column is set to 0
  db.exec("CREATE TABLE test3 (data); INSERT INTO test3 VALUES (x'6100ff'), (x'ffffff00ffff');");

  function test_zero_byte_index(data) {
    // Data is a Uint8Array
    for (var i=0; i<data.length; i++) {
      if (data[i] === 0) {
        return i;
      }
    }
    return -1;
  };

  db.create_function("TestZeroByteIndex", test_zero_byte_index);
  result = db.exec("SELECT TestZeroByteIndex(data) FROM test3;");
  result_int0 = result[0]["values"][0][0];
  result_int1 = result[0]["values"][1][0];
  assert.equal(result_int0, 1, "Binary data works inside functions");
  assert.equal(result_int1, 3, "Binary data works inside functions");

  db.create_function("addOne", function (x) { return x + 1;} );
  result = db.exec("SELECT addOne(1);");
  assert.equal(result[0]["values"][0][0], 2, "Accepts anonymous functions");
 
  // Test api support of different sqlite types and special values
  db.create_function("identityFunction", function (x) { return x;} );
  var verbose=false;
  function canHandle(testData)
  {
    let result={};
    let ok=true;
    let sql_value=("sql_value" in testData)?testData.sql_value:(""+testData.value);
    function simpleEqual(a, b) {return a===b;}
    let value_equal=("equal" in testData)?testData.equal:simpleEqual;
    db.create_function("CheckTestValue", function (x) {return value_equal(testData.value,x)?12345:5678;});
    db.create_function("GetTestValue", function () {return testData.value; });  
    // Check sqlite to js value conversion
    result = db.exec("SELECT CheckTestValue("+sql_value+")==12345"); 
    if(result[0]["values"][0][0]!=1)
    {
      if(verbose)
        assert.ok(false, "Can accept "+testData.info);
      ok=false;
    }
    // Check js to sqlite value conversion
    result = db.exec("SELECT GetTestValue()");
    if(!value_equal(result[0]["values"][0][0],testData.value))
    {
      if(verbose)
        assert.ok(false, "Can return "+testData.info);
      ok=false;
    } 
    // Check sqlite to sqlite value conversion (identityFunction(x)==x)
    if(sql_value!=="null")
    {
      result = db.exec("SELECT identityFunction("+sql_value+")="+sql_value); 
    }else
    {
      result = db.exec("SELECT identityFunction("+sql_value+") is null"); 
    }
    if(result[0]["values"][0][0]!=1)
    {
      if(verbose)
        assert.ok(false, "Can pass "+testData.info);
      ok=false;
    } 
    return ok;
  }
  
  function numberEqual(a, b) {
      return (+a)===(+b);
  }
  
  function blobEqual(a, b) {
      if(((typeof a)!="object")||(!a)||((typeof b)!="object")||(!b)) return false;
      if (a.byteLength !== b.byteLength) return false;
      return a.every((val, i) => val === b[i]);
  }
  
  [
    {info:"null",value:null}, // sqlite special value null
    {info:"false",value:false,sql_value:"0",equal:numberEqual}, // sqlite special value (==false)
    {info:"true", value:true,sql_value:"1",equal:numberEqual}, // sqlite special value (==true)
    {info:"integer 0",value:0}, // sqlite special value (==false)
    {info:"integer 1",value:1}, // sqlite special value (==true)
    {info:"integer -1",value:-1},
    {info:"long integer 5e+9",value:5000000000}, // int64
    {info:"long integer -5e+9",value:-5000000000}, // negative int64
    {info:"double",value:0.5},
    {info:"string",value:"Test",sql_value:"'Test'"},
    {info:"empty string",value:"",sql_value:"''"},
    {info:"unicode string",value:"\uC7B8",sql_value:"CAST(x'EC9EB8' AS TEXT)"}, // unicode-hex: C7B8 utf8-hex: EC9EB8
    {info:"blob",value:new Uint8Array([0xC7,0xB8]),sql_value:"x'C7B8'",equal:blobEqual},
    {info:"empty blob",value:new Uint8Array([]),sql_value:"x''",equal:blobEqual}
  ].forEach(function(testData)
  {
    assert.ok(canHandle(testData),"Can handle "+testData.info);
  });
   
  db.create_function("throwFunction", function () { throw "internal exception"; return 5;} );    
  assert.throws(function(){db.exec("SELECT throwFunction()");},/internal exception/, "Can handle internal exceptions");
  
  db.create_function("customeObjectFunction", function () { return {test:123};} );    
  assert.throws(function(){db.exec("SELECT customeObjectFunction()");},/Wrong API use/, "Reports wrong API use");

  db.close();
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


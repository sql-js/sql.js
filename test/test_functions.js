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

  db.close();
};

if (module == require.main) {
  var sql = require('../js/sql.js');
  var assert = require("assert");
  exports.test(sql, assert);
}

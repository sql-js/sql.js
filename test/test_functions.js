exports.test = function(SQL, assert){
	var db = new SQL.Database();
	db.exec("CREATE TABLE test (data); INSERT INTO test VALUES ('Hello World');");
	
	// Simple function, appends extra text on a string.
	function test_function(string_arg) {
		return "Function called with: " + string_arg;
	};
	
	// Register with SQLite.
	db.create_function("TestFunction", 1, test_function);
	
	// Use in a query, check expected result.
	var result = db.exec("SELECT TestFunction(data) FROM test;");
	var result_str = result[0]["values"][0][0];
	assert.equal(result_str, "Function called with: Hello World");
	
	// 2 arg function, adds two ints together. 
	db.exec("CREATE TABLE test2 (int1, int2); INSERT INTO test2 VALUES (456, 789);");
	
	function test_add(int1, int2) {
		return int1 + int2;
	};
	
	db.create_function("TestAdd", 2, test_add);	
	result = db.exec("SELECT TestAdd(int1, int2) FROM test2;");	
	result_int = result[0]["values"][0][0];
	assert.equal(result_int, 1245);
	
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
	
	db.create_function("TestZeroByteIndex", 1, test_zero_byte_index);	
	result = db.exec("SELECT TestZeroByteIndex(data) FROM test3;");
	result_int0 = result[0]["values"][0][0];
	result_int1 = result[0]["values"][1][0];
	assert.equal(result_int0, 1);
	assert.equal(result_int1, 3);
	
	db.close();
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require("assert");
	exports.test(sql, assert);
}

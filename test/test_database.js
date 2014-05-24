exports.test = function(sql, assert) {
	assert.notEqual(sql.Database, undefined, "Should export a Database object");

	console.log("Testing database creation...");
	// Create a database
	var db = new sql.Database();
	assert.equal(Object.getPrototypeOf(db), sql.Database.prototype, "Creating a database object");

	// Execute some sql
	sqlstr = "CREATE TABLE test (a, b, c, d, e);";
	sqlstr += "INSERT INTO test VALUES (NULL, 42, 4.2, 'fourty two', x'42');";
	var res = db.exec(sqlstr);
	assert.deepEqual(res, [], "Table creation should not return anything");

	//Retrieving values
	sqlstr = "SELECT * FROM test;";
	var res = db.exec(sqlstr);
	var expectedResult =  [{
		columns : ['a','b','c','d','e'],
		values : [
			['','42','4.2','fourty two', String.fromCharCode(0x42)]
		 ]
	}];
	assert.deepEqual(res, expectedResult, "db.exec() return value");

	// Export the database to an Uint8Array containing the SQLite database file
	var binaryArray = db.export();
	assert.strictEqual(String.fromCharCode.apply(null,binaryArray.slice(0,6)), 'SQLite',
		      "The first 6 bytes of an SQLite database should form the word 'SQLite'");
	db.close();

	var db2 = new SQL.Database(binaryArray);
	result = db2.exec("SELECT * FROM test");
	assert.deepEqual(result, expectedResult,
		              "Exporting and re-importing the database should lead to the same database");
	db2.close();
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require('assert');
	exports.test(sql, assert);
}

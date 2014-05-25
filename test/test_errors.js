exports.test = function(sql, assert) {
	// Create a database
	var db = new sql.Database();

	// Execute some sql
	var res = db.exec("CREATE TABLE test (a, b, c, d, e);");

	assert.throws(function(){
		db.exec("I ain't be no valid sql ...");
	}, "Executing invalid SQL should throw an error");


	var stmt = db.prepare("INSERT INTO test (a) VALUES (?)");


	assert.throws(function(){
		stmt.bind([1,2,3]);
	}, "Binding too many parameters should throw an exception");

	assert.throws(function(){
		db.run("CREATE TABLE test (this,wont,work)");
	}, "Trying to create a table with a name that is already used should throw an error");

	stmt.run([2])
	assert.deepEqual(db.exec("SELECT a,b FROM test WHERE a=2"),
														[{columns:['a', 'b'],values:[[2, null]]}]
														, "Previous errors should not have spoiled the statement");

	db.close();

	assert.throws(function(){
		stmt.run([3]);
	}, "Statements should'nt be able to execute after the database is closed");
}

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require("assert");
	exports.test(sql, assert);
}

exports.test = function(sql, assert){
	// Create a database
	var db = new sql.Database();

	// Execute some sql
	sqlstr = "CREATE TABLE alphabet (letter, code);";
	db.exec(sqlstr);

	var result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
	assert.deepEqual(result, [{columns:['name'], values:[['alphabet']]}],
									"Table properly created");

	// Prepare a statement to insert values in tha database
	var stmt = db.prepare("INSERT INTO alphabet (letter,code) VALUES (?,?)");
	// Execute the statement several times
	stmt.run(['a',1]);
	stmt.run(['b',2.2]);
	stmt.run(['c']); // The second parameter will be bound to NULL

	// Free the statement
	stmt.free();

	result = db.exec("SELECT * FROM alphabet");
	assert.deepEqual(result,
									[{columns:['letter', 'code'], values:[['a','1'],['b','2.2'],['c','']]}],
									"Statement.run() should have added data to the database");

	var stmt = db.prepare("select 5 as nbr, '粵語😄' as str, null as nothing;");
	stmt.step(); // Run the statement
	assert.deepEqual(stmt.getColumnNames(), ['nbr','str','nothing'], 'Statement.GetColumnNames()');
	var res = stmt.getAsObject();
	assert.strictEqual(res.nbr, 5, 'Read number');
	assert.strictEqual(res.str, '粵語😄', "Read string");
	assert.strictEqual(res.nothing, null, "Read null");
	assert.deepEqual(res, {nbr:5, str:'粵語😄', nothing:null}, "Statement.getAsObject()");
	stmt.free();

	// Prepare an sql statement
	var stmt = db.prepare("SELECT * FROM alphabet WHERE code BETWEEN :start AND :end ORDER BY code");
	// Bind values to the parameters
	stmt.bind([0, 256]);
	// Execute the statement
	stmt.step();
	// Get one row of result
	result = stmt.get();
	assert.deepEqual(result, ['a',1], "Binding named parameters by their position");

	// Fetch the next row of result
	result = stmt.step();
	assert.equal(result, true);
	result = stmt.get();
	assert.deepEqual(result, ['b',2.2], "Fetching the next row of result");

	// Reset and reuse at once
	result = stmt.get([0, 1]);
	assert.deepEqual(result, ['a',1], "Reset and reuse at once");

	// Pass objects to get() and bind() to use named parameters
	result = stmt.get({':start':1, ':end':1});
	assert.deepEqual(result, ['a',1], "Binding named parameters");

	// Close the database and all associated statements
	db.close();
}

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require("assert");
	exports.test(sql, assert);
}

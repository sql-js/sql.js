exports.test = function(sql, assert) {
	// Create a database
	var db = new sql.Database();
	// Ultra-simple query
	var stmt = db.prepare("VALUES (?)");
	// Bind null to the parameter and get the result
	assert.deepEqual(stmt.get([null]), [null],
			"binding a null value to a statement parameter");
	db.close();
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require('assert');
	exports.test(sql, assert);
}

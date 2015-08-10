exports.test = function(sql, assert) {
  var db = new SQL.Database();
  db.exec("CREATE TABLE test (data); INSERT INTO test VALUES (x'6162ff'),(x'00')"); // Insert binary data. This is invalid UTF8 on purpose

  assert.equal(SQL.isComplete("SELECT COUNT(*) AS count FROM networklocation;"), true, "Statement is complete");
  assert.equal(SQL.isComplete("/* SELECT COUNT(*) AS count FROM networklocation"), false, "Statement is not complete");
  assert.equal(SQL.isComplete("SELECT COUNT(*) AS count FROM"), false, "Statement is complete");
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require('assert');
	var done = function(){process.exit();}
	exports.test(sql, assert, done);
}

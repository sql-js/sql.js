exports.test = function(sql, assert) {
	// Create a database
	var db = new sql.Database();
  db.run("CREATE TABLE foobar (value)");
  var expectedCount = 100;
  for (var i=0; i<expectedCount; i++) {
    db.run("INSERT INTO foobar VALUES ("+i+")");
  }
  var dbCopy = new sql.Database(db.export());
  var count = db.exec("SELECT COUNT(*) FROM foobar")[0].values[0][0];
  assert.equal(count, expectedCount, "export and reimport copies all the data");
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require('assert');
	var done = function(){process.exit();}
	exports.test(sql, assert, done);
}

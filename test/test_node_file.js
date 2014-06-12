exports.test = function(SQL, assert) {
	//Node filesystem module - You know that.
	var fs = require('fs');

	//Ditto, path module
	var path = require('path');

	var filebuffer = fs.readFileSync(path.join(__dirname, 'test.sqlite'));

	//Works
	var db = new SQL.Database(filebuffer);

	//[{"columns":["id","content"],"values":[["0","hello"],["1","world"]]}]
	var res = db.exec("SELECT * FROM test WHERE id = 0");
	assert.deepEqual(res,
									[{"columns":["id","content"],"values":[[0,"hello"]]}],
									"One should be able to read the contents of an SQLite database file read from disk");
	db.close();
}

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require("assert");
	exports.test(sql, assert);
}

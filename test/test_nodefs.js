exports.test = function(SQL, assert) {
	//Node filesystem module - You know that.
	var fs = require('fs');

	//Ditto, path module
	var path = require('path');

	SQL.mount('/nfs', __dirname);

	//Works
	var db = new SQL.Database('/nfs/test.sqlite');

	//[{"columns":["id","content"],"values":[["0","hello"],["1","world"]]}]
	var res = db.exec("SELECT * FROM test WHERE id = 0");
	assert.deepEqual(res,
									[{"columns":["id","content"],"values":[[0,"hello"]]}],
									"One should be able to read the mounted file from disk");
	db.close();
}

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test node file': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

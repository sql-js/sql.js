exports.test = function(SQL, assert){
	var db = new SQL.Database();
	db.exec("CREATE TABLE test (data); INSERT INTO test VALUES (x'6162ff'),(x'00')"); // Insert binary data. This is invalid UTF8 on purpose

	var stmt = db.prepare("INSERT INTO test VALUES (?)");
	var bigArray = new Uint8Array(1e6);
	bigArray[500] = 0x42
	stmt.run([ bigArray ]);

	var stmt = db.prepare("SELECT * FROM test ORDER BY length(data) DESC");

	stmt.step();
	var array = stmt.get()[0];
	assert.equal(array.length, bigArray.length, "BLOB read from the database should be the same size as the one that was inserted");
	for (var i=0; i<array.length; i++) {
		// Avoid doing 1e6 assert, to not pollute the console
		if (array[i]!==bigArray[i])
			assert.fail(array[i], bigArray[i] , "The blob stored in the database should be exactly the same as the one that was inserted");
	}

	stmt.step();
	var res = stmt.get();
	assert.deepEqual(res, [new Uint8Array([0x61, 0x62, 0xff])], "Reading BLOB");

	stmt.step();
	var res = stmt.get();
	assert.deepEqual(res, [new Uint8Array([0x00])], "Reading BLOB with a null byte");

	assert.strictEqual(stmt.step(), false, "stmt.step() should return false after all values were read");
	db.close();
};

if (module == require.main) {
	const target_file = process.argv[2];
	const sql_loader = require('./load_sql_lib');
	sql_loader(target_file).then((sql)=>{
		require('test').run({
			'test blob': function(assert){
				exports.test(sql, assert);
			}
		});
	})
	.catch((e)=>{
		console.error(e);
	});
}

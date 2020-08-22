exports.test = function(SQL, assert, done) {
  assert.notEqual(SQL.Database, undefined, "Should export a Database object");

  // Create a database
  var db = new SQL.Database();
  assert.equal(Object.getPrototypeOf(db), SQL.Database.prototype, "Creating a database object");

  // Execute some sql
  sqlstr = "CREATE TABLE test (a, b, c, d, e);";
  var res = db.exec(sqlstr);
  assert.deepEqual(res, [], "Creating a table should not return anything");

  db.run("INSERT INTO test VALUES (NULL, 42, 4.2, 'fourty two', x'42');");

  //Retrieving values
  sqlstr = "SELECT * FROM test;";
  var res = db.exec(sqlstr);
  var expectedResult =  [{
    columns : ['a','b','c','d','e'],
    values : [
      [null,42,4.2,'fourty two', new Uint8Array([0x42])]
    ]
  }];
  assert.deepEqual(res, expectedResult, "db.exec() return value");


  // Export the database to an Uint8Array containing the SQLite database file
  var binaryArray = db.export();
  assert.strictEqual(String.fromCharCode.apply(null,binaryArray.subarray(0,6)), 'SQLite',
                     "The first 6 bytes of an SQLite database should form the word 'SQLite'");
  db.close();

  var db2 = new SQL.Database(binaryArray);
  result = db2.exec("SELECT * FROM test");
  assert.deepEqual(result, expectedResult,
                   "Exporting and re-importing the database should lead to the same database");
  db2.close();

  db = new SQL.Database();
  assert.deepEqual(db.exec("SELECT * FROM sqlite_master"),
                   [],
                   "Newly created databases should be empty");
  // Testing db.each
  db.run("CREATE TABLE test (a,b); INSERT INTO test VALUES (1,'a'),(2,'b')");
  var count = 0, finished = false;
  db.each("SELECT * FROM test ORDER BY a", function callback (row){
    count++;
    if (count === 1) assert.deepEqual(row, {a:1,b:'a'}, 'db.each returns the correct 1st row');
    if (count === 2) assert.deepEqual(row, {a:2,b:'b'}, 'db.each returns the correct 2nd row');
  }, function last () {
    finished = true;
    assert.strictEqual(count, 2, "db.each returns the right number of rows");
    // No need to wait for this timeout anymore
    // In fact, if we do keep waiting for this, we'll get an error when it fires because we've already called done
    clearTimeout(testTimeoutId);
    done();
  });
  var testTimeoutId = setTimeout(function timeout(){
    if (!finished) {
      assert.fail("db.each should call its last callback after having returned the rows");
      done();
    }
  }, 3000);
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test database': function(assert, done){
        exports.test(sql, assert, done);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

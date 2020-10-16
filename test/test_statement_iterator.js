exports.test = function(SQL, assert) {
  // Create a database
  var db = new SQL.Database();

  // Multiline SQL
  var sqlstr = "CREATE TABLE test (x text, y integer);\n"
    + "INSERT INTO test\n"
    + "VALUES ('hello', 42), ('goodbye', 17);\n"
    + "SELECT * FROM test;\n"
    + " -- nothing here";
  var sqlstart = "CREATE TABLE test (x text, y integer);"

  // Manual iteration
  // Get an iterator
  var it = db.iterateStatements(sqlstr);

  // Get first item
  var x = it.next();
  assert.equal(x.done, false, "Valid iterator object produced");
  assert.equal(x.value.getSQL(), sqlstart, "Statement is for first query only");
  assert.equal(it.getRemainingSQL(), sqlstr.slice(sqlstart.length), "Remaining sql retrievable");

  // execute the first query
  x.value.step();

  // get and execute the second query
  x = it.next();
  assert.equal(x.done, false, "Second query found");
  x.value.step();

  // get and execute the third query
  x = it.next();
  assert.equal(x.done, false, "Third query found");
  x.value.step();
  assert.deepEqual(x.value.getColumnNames(), ['x', 'y'], "Third query is SELECT");

  // check for additional queries
  x = it.next();
  assert.equal(x.done, true, "Done reported after last query");

  // no more iterations should be allowed
  assert.throws(function(){ it.next(); }, "Invalid iterator", "Cannot iterate past end");

  db.run("DROP TABLE test;");

  // for...of
  var count = 0;
  for (let statement of db.iterateStatements(sqlstr)) {
      statement.step();
      count = count + 1;
  }
  assert.equal(count, 3, "For loop iterates correctly");

  var badsql = "SELECT * FROM test;garbage in, garbage out";

  // bad sql will stop iteration
  assert.throws(function(){
      for (let statement of db.iterateStatements(badsql)) {
          statement.step();
      }
  }, "Bad SQL stops iteration");

  // valid SQL executes, remaining SQL accessible after exception
  it = db.iterateStatements(badsql);
  var remains = '';
  try {
      for (let statement of it) {
          statement.step();
      }
  } catch {
      remains = it.getRemainingSQL();
  }
  assert.equal(remains, "garbage in, garbage out", "Remaining SQL accessible after exception");
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test statement iterator': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

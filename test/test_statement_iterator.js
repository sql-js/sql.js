exports.test = function(SQL, assert) {
  // Create a database
  var db = new SQL.Database();

  // Multiline SQL, with comments
  var sqlstr = "CREATE TABLE test (x text, y integer);\n"
    + "INSERT INTO test -- here's a single line comment\n"
    + "VALUES ('hello', 42), ('goodbye', 17);\n"
    + "/* Here's a multiline \n"
    + "   comment */ \n"
    + "SELECT * FROM test;\n"
    + " -- nothing here";

  // Get an iterator
  var it = db.iterateStatements(sqlstr);

  // Get first item
  var x = it.next();
  assert.equal(x.done, false, "Valid iterator object produced");
  assert.equal(x.value.getSQL(), "CREATE TABLE test (x text, y integer);", "Statement is for first query only");

  // execute the first query
  x.value.step();
  x.value.free()

  // get and execute the second query
  x = it.next();
  assert.equal(x.done, false, "Second query found");
  x.value.step();
  x.value.free();

  // get and execute the third query
  x = it.next();
  assert.equal(x.done, false, "Third query found");
  x.value.step();
  assert.equal(x.value.get(), ['hello', 42], "Third query row results correct");
  x.value.free();

  // check for additional queries
  x = it.next();
  assert.equal(x.done, true, "No more queries reported");

  x = it.next();
  assert.equal(x.done, true, "Advancing done iterator does nothing");
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

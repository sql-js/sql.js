exports.test = function(sql, assert) {

  assert.throws(function(){
    var db = new sql.Database([1,2,3]);
    db.exec("SELECT * FROM sqlite_master");
  },
                /not a database/,
                "Querying an invalid database should throw an error");

  // Create a database
  var db = new sql.Database();

  // Execute some sql
  var res = db.exec("CREATE TABLE test (a INTEGER PRIMARY KEY, b, c, d, e);");

  assert.throws(function(){
    db.exec("I ain't be no valid sql ...");
  },
                /syntax error/,
                "Executing invalid SQL should throw an error");

  assert.throws(function(){
    db.run("INSERT INTO test (a) VALUES (1)");
    db.run("INSERT INTO test (a) VALUES (1)");
  },
                /UNIQUE constraint failed/,
                "Inserting two rows with the same primary key should fail");

  var stmt = db.prepare("INSERT INTO test (a) VALUES (?)");


  assert.throws(function(){
    stmt.bind([1,2,3]);
  },
                /out of range/,
                "Binding too many parameters should throw an exception");

  assert.throws(function(){
    db.run("CREATE TABLE test (this,wont,work)");
  },
                /table .+ already exists/,
                "Trying to create a table with a name that is already used should throw an error");

  stmt.run([2]);
  assert.deepEqual(db.exec("SELECT a,b FROM test WHERE a=2"),
                   [{columns:['a', 'b'],values:[[2, null]]}],
                   "Previous errors should not have spoiled the statement");

  db.close();

  assert.throws(function(){
    stmt.run([3]);
  }, "Statements shouldn't be able to execute after the database is closed");
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test errors': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
  });
}

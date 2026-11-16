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

  // Errors carry SQLite's extended result code, by name and by number
  var codeOf = function(fn) {
    try {
      fn();
    } catch (e) {
      return [e.code, e.errcode];
    }
    assert.fail("Expected an error");
  };
  db = new sql.Database();
  db.run("PRAGMA foreign_keys = ON");
  db.run("CREATE TABLE parent (id INTEGER PRIMARY KEY)");
  db.run("CREATE TABLE child (id INTEGER PRIMARY KEY," +
    " parent INTEGER REFERENCES parent(id), name TEXT NOT NULL UNIQUE," +
    " age INTEGER CHECK (age >= 0))");
  db.run("INSERT INTO child (id, name) VALUES (1, 'a')");

  assert.deepEqual(codeOf(function() {
    db.run("INSERT INTO child (id, name) VALUES (1, 'b')");
  }), ["SQLITE_CONSTRAINT_PRIMARYKEY", 1555], "A primary key violation");
  assert.deepEqual(codeOf(function() {
    db.run("INSERT INTO child (name) VALUES ('a')");
  }), ["SQLITE_CONSTRAINT_UNIQUE", 2067], "A unique violation");
  assert.deepEqual(codeOf(function() {
    db.run("INSERT INTO child (name) VALUES (NULL)");
  }), ["SQLITE_CONSTRAINT_NOTNULL", 1299], "A not null violation");
  assert.deepEqual(codeOf(function() {
    db.run("INSERT INTO child (name, age) VALUES ('c', -1)");
  }), ["SQLITE_CONSTRAINT_CHECK", 275], "A check violation");
  assert.deepEqual(codeOf(function() {
    db.run("INSERT INTO child (name, parent) VALUES ('d', 9)");
  }), ["SQLITE_CONSTRAINT_FOREIGNKEY", 787], "A foreign key violation");
  assert.deepEqual(codeOf(function() {
    db.exec("SELEC 1");
  }), ["SQLITE_ERROR", 1], "A syntax error");
  assert.deepEqual(codeOf(function() {
    db.prepare("SELECT ?").bind([1, 2]);
  }), ["SQLITE_RANGE", 25], "Binding too many parameters");
  var insert = db.prepare("INSERT INTO child (name) VALUES (?)");
  assert.deepEqual(codeOf(function() {
    insert.run(["a"]);
  }), ["SQLITE_CONSTRAINT_UNIQUE", 2067], "A failing prepared statement");
  insert.free();
  db.close();

  assert.deepEqual(codeOf(function() {
    new sql.Database([1, 2, 3]).exec("SELECT * FROM sqlite_master");
  }), ["SQLITE_NOTADB", 26], "Opening something that is not a database");
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

// js -e "load('../js/sql.js')" test.js

function jsonCompare(x, y) {
  return JSON.stringify(x) == JSON.stringify(y);
}

function check(data, expected) {
  if (!jsonCompare(data, expected)) throw 'Comparison failed: Seeing ' + JSON.stringify(data, null, '  ') + ' but expected ' + JSON.stringify(expected, null, '  ') + ' at ' + new Error().stack;
}

function testBasics() {
  var db = SQL.open();

  db.exec("CREATE TABLE my_table(a INTEGER, b INTEGER, c VARCHAR(100));");
  db.exec("INSERT INTO my_table VALUES(1,13153,'thirteen thousand one hundred fifty three');");
  db.exec("INSERT INTO my_table VALUES(1,987,'some other number');");
  check(db.exec("SELECT count(*) FROM my_table;"), [[{ "column": "count(*)", "value": "2" }]]);

  var db2 = SQL.open();
  try {
    db2.exec("SELECT a, b, c FROM my_table;");
  } catch(e) {
    // Failure is expected, as the other db doesn't have that table!
    db2.close();

    check(db.exec("SELECT a, b, c FROM my_table;"), [
      [{ "column": "a", "value": "1" }, { "column": "b", "value": "13153" }, { "column": "c", "value": "thirteen thousand one hundred fifty three" }],
      [{ "column": "a", "value": "1" }, { "column": "b", "value": "987"   }, { "column": "c", "value": "some other number" }]
    ]);

    db.close();
    return;
  }

  throw 'reading from the second db should have failed!';
}

function testPersistence() {
  // Create a db with some data
  var db = SQL.open();
  db.exec("CREATE TABLE my_table(a INTEGER, b INTEGER, c VARCHAR(100));");
  db.exec("INSERT INTO my_table VALUES(1,987,'some other number');");
  db.exec("INSERT INTO my_table VALUES(5,6987,'moar numberz');");

  // Serialize it to a typed array
  var data = db.exportData();
  db.exec("DELETE FROM my_table;");
  check(db.exec("SELECT * FROM my_table;"), []); // make sure its gone
  db.close();

  // Create a new db with the data we saved from before
  var db2 = SQL.open(data);
  check(db2.exec("SELECT * FROM my_table;"), [
    [{ "column": "a", "value": "1" }, { "column": "b", "value": "987"  }, { "column": "c", "value": "some other number" }],
    [{ "column": "a", "value": "5" }, { "column": "b", "value": "6987" }, { "column": "c", "value": "moar numberz" }]
  ]);

  db2.close();
}

function testDateTime() {
  var db = SQL.open();
  check(db.exec("SELECT datetime('2012-04-16 12:35:57', '+1 days');"), [
    [{"column":"datetime('2012-04-16 12:35:57', '+1 days')","value":"2012-04-17 12:35:57"}]
  ]);
}

// Run tests

testBasics();
testPersistence();
testDateTime();

print('ok.');


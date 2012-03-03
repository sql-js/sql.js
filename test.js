// js -m -n -e "load('sql.js')" test.js

function test() {
  var db = SQL.open();

  print('created db');

  db.exec("CREATE TABLE my_table(a INTEGER, b INTEGER, c VARCHAR(100));");

  print('executed one command');

  db.exec("INSERT INTO my_table VALUES(1,13153,'thirteen thousand one hundred fifty three');");
  db.exec("INSERT INTO my_table VALUES(1,987,'some other number');");

  function report(data) {
    print(JSON.stringify(data, null, '  '));
  }

  report(db.exec("SELECT count(*) FROM my_table;"));

  // prints [{ "column": "count(*)", "value": "2" }]

  print('printed one report');

  var db2 = SQL.open();
  try {
    db2.exec("SELECT a, b, c FROM my_table;");
  } catch(e) {
    // Failure is expected, as the other db doesn't have that table!
    db2.close();

    report(db.exec("SELECT a, b, c FROM my_table;"));
    // prints [{ "column": "a", "value": "1" }, { "column": "b", "value": "13153" }, { "column": "c", "value": "thirteen thousand one hundred fifty three" }]
    //        [{ "column": "a", "value": "1" }, { "column": "b", "value": "987"   }, { "column": "c", "value": "some other number" }]

    db.close();
    return;
  }

  throw 'reading from the second db should have failed!';
}

test();


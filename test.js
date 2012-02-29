// js -m -n -e "load('sql.js')" test.js

var db = SQL.open(":memory:");

print('created db');

SQL.exec(db, "CREATE TABLE my_table(a INTEGER, b INTEGER, c VARCHAR(100));");

print('executed one command');

SQL.exec(db, "INSERT INTO my_table VALUES(1,13153,'thirteen thousand one hundred fifty three');");
SQL.exec(db, "INSERT INTO my_table VALUES(1,987,'some other number');");

function report(data) {
  print(JSON.stringify(data, null, '  '));
}

SQL.exec(db, "SELECT count(*) FROM my_table;", report);
// prints [{ "column": "count(*)", "value": "2" }]

print('printed one report');

SQL.exec(db, "SELECT a, b, c FROM my_table;", report);
// prints [{ "column": "a", "value": "1" }, { "column": "b", "value": "13153" }, { "column": "c", "value": "thirteen thousand one hundred fifty three" }]
//        [{ "column": "a", "value": "1" }, { "column": "b", "value": "987"   }, { "column": "c", "value": "some other number" }]


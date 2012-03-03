// js -m -n -e "load('sql.js')" test.js

var db = SQL.open();

print('created db');

db.exec("CREATE TABLE my_table(a INTEGER, b INTEGER, c VARCHAR(100));");

print('executed one command');

db.exec("INSERT INTO my_table VALUES(1,13153,'thirteen thousand one hundred fifty three');");
db.exec("INSERT INTO my_table VALUES(1,987,'some other number');");

function report(data) {
  print(JSON.stringify(data, null, '  '));
}

db.exec("SELECT count(*) FROM my_table;", report);
// prints [{ "column": "count(*)", "value": "2" }]

print('printed one report');

db.exec("SELECT a, b, c FROM my_table;", report);
// prints [{ "column": "a", "value": "1" }, { "column": "b", "value": "13153" }, { "column": "c", "value": "thirteen thousand one hundred fifty three" }]
//        [{ "column": "a", "value": "1" }, { "column": "b", "value": "987"   }, { "column": "c", "value": "some other number" }]

db.close();


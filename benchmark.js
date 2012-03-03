// js -m -n -e "load('sql.js')" benchmark.js

var then = Date.now();
function TIME(msg) {
  var now = Date.now();
  print(msg + ' : took ' + (now - then) + ' ms');
  then = now;
}

var db = SQL.open();
function report(data) {
  for (var i = 0; i < data.length; i++) {
    print(data[i].column + ' = ' + data[i].value + '\n');
  }
}
function RUN(cmd) {
  db.exec(cmd, report);
}

TIME("'startup'");

RUN("CREATE TABLE t1(a INTEGER, b INTEGER, c VARCHAR(100));");
TIME("create table");

RUN("BEGIN;");

// 25000 INSERTs in a transaction
for (var i = 0; i < 5000; i++) {
  RUN("INSERT INTO t1 VALUES(1,12345,'one 1 one 1 one 1');");
  RUN("INSERT INTO t1 VALUES(2,23422,'two two two two');");
  RUN("INSERT INTO t1 VALUES(3,31233,'three three 33333333333 three');");
  RUN("INSERT INTO t1 VALUES(4,41414,'FOUR four 4 phor FOUR 44444');");
  RUN("INSERT INTO t1 VALUES(5,52555,'five 5 FIVE Five phayve 55 5 5 5 5 55  5');");
}
TIME("25,000 inserts");

RUN("COMMIT;");
TIME("commit");

// Counts
RUN("SELECT count(*) FROM t1;");
RUN("SELECT count(*) FROM t1 WHERE a == 4");
RUN("SELECT count(*) FROM t1 WHERE b > 20000 AND b < 50000;");
RUN("SELECT count(*) FROM t1 WHERE c like '%three%';");
TIME("selects");

// Index
RUN("CREATE INDEX iiaa ON t1(a);");
RUN("CREATE INDEX iibb ON t1(b);");
TIME("create indexes");

RUN("SELECT count(*) FROM t1 WHERE a == 4");
RUN("SELECT count(*) FROM t1 WHERE b > 20000 AND b < 50000;");
TIME("selects with indexes");

db.close();


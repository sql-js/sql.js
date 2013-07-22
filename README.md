# sql.js

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.
no C bindings or node-gyp compilation here.

SQLite is public domain, sql.js is MIT licensed.

## Usage

```coffeescript
Sql = require 'node-sqlite-purejs'
Sql.open 'db/development.sqlite', {}, (err, db) ->
  throw err if err
  db.exec '''
  /* Demo DB */
  CREATE TABLE employees( id          integer,  name    text,
                          designation text,     manager integer,
                          hired_on    date,     salary  integer,
                          commission  float,    dept    integer);

  INSERT INTO employees VALUES (1,'JOHNSON','ADMIN',6,'12-17-1990',18000,NULL,4);
  INSERT INTO employees VALUES (2,'HARDING','MANAGER',9,'02-02-1998',52000,300,3);
  INSERT INTO employees VALUES (3,'TAFT','SALES I',2,'01-02-1996',25000,500,3);
  INSERT INTO employees VALUES (4,'HOOVER','SALES I',2,'04-02-1990',27000,NULL,3);
  INSERT INTO employees VALUES (5,'LINCOLN','TECH',6,'06-23-1994',22500,1400,4);
  INSERT INTO employees VALUES (6,'GARFIELD','MANAGER',9,'05-01-1993',54000,NULL,4);
  INSERT INTO employees VALUES (7,'POLK','TECH',6,'09-22-1997',25000,NULL,4);
  INSERT INTO employees VALUES (8,'GRANT','ENGINEER',10,'03-30-1997',32000,NULL,2);
  INSERT INTO employees VALUES (9,'JACKSON','CEO',NULL,'01-01-1990',75000,NULL,4);
  INSERT INTO employees VALUES (10,'FILLMORE','MANAGER',9,'08-09-1994',56000,NULL,2);
  INSERT INTO employees VALUES (11,'ADAMS','ENGINEER',10,'03-15-1996',34000,NULL,2);
  INSERT INTO employees VALUES (12,'WASHINGTON','ADMIN',6,'04-16-1998',18000,NULL,4);
  INSERT INTO employees VALUES (13,'MONROE','ENGINEER',10,'12-03-2000',30000,NULL,2);
  INSERT INTO employees VALUES (14,'ROOSEVELT','CPA',9,'10-12-1995',35000,NULL,1);
  '''

  db.exec "SELECT * FROM employees WHERE designation = 'CEO';", (err, results) ->
    assert.deepEqual [{"id":"9","name":"JACKSON","designation":"CEO","manager":"(null)","hired_on":"01-01-1990","salary":"75000","commission":"(null)","dept":"4"}], results
```

see [test/test.coffee](https://github.com/mikesmullin/node-sqlite-purejs/blob/stable/test/test.coffee) for more examples.

## Related

* [In-Browser/Client-Side Demo](http://kripken.github.io/sql.js/test/demo.html)


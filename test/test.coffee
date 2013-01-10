assert = require('chai').assert
Sql = require '../js/node-sqlite-purejs.js'
path = require 'path'
fs = require 'fs'
db_file = path.join __dirname, 'fixtures', 'db', 'development.sqlite'

describe 'Node SQLite', ->
  db = `undefined`
  beforeEach (done) ->
    if fs.existsSync db_file
      fs.unlinkSync db_file
    Sql.open db_file, {
      manual_load: true
      manual_save: true
      parse_multiple: true
    }, (err, _db) ->
      throw err if err
      db = _db
      done()

  it "can select", (done) ->
    db.exec 'SELECT 1 `id`;', (err, result) ->
      assert.deepEqual [{"id":"1"}], result
      done()

  # Kai Sellgren's original demo example
  it "can create table, insert, and select, returning last result in multi-query", (done) ->
    db.exec '''
    CREATE TABLE my_table(key INTEGER, value INTEGER, text VARCHAR(100));

    INSERT INTO my_table VALUES(1, 25, 'the first item');
    INSERT INTO my_table VALUES(2, 987, 'the second item');

    SELECT key, text FROM my_table WHERE value == 987;
    ''', (err, result) ->
      assert.deepEqual [{"key":"2","text":"the second item"}], result
      done()

  # Gurjeet Singh's demo example
  it "can bulk insert, select where, select aggregation functions, and group by", (done) ->
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
      assert.deepEqual [{"id":"9","name":"JACKSON","designation":"CEO","manager":null,"hired_on":"01-01-1990","salary":"75000","commission":null,"dept":"4"}], results

    db.exec "SELECT MAX(salary) AS 'Highest Salary' FROM employees;", (err, results) ->
      assert.deepEqual [{"Highest Salary":"75000"}], results

    db.exec """
    SELECT   dept, MAX(salary) As 'Highest Salary in department'
    FROM     employees
    GROUP BY dept;
    """, (err, results) ->
      assert.deepEqual [{"dept":"1","Highest Salary in department":"35000"},{"dept":"2","Highest Salary in department":"56000"},{"dept":"3","Highest Salary in department":"52000"},{"dept":"4","Highest Salary in department":"75000"}], results
      done()

  it "can write database to disk", (done) ->
    db.exec """
    CREATE TABLE cars (
      id INTEGER PRIMARY KEY ASC,
      color varchar(25)
    );
    """, (err) ->
      throw err if err
      db.save (err) ->
        throw err if err
        assert.ok fs.existsSync db_file
        done()

  it "can read database from disk", (done) ->
    Sql.open db_file, {}, (err, db) ->
      throw err if err
      db.exec """
      CREATE TABLE cars (
        id INTEGER PRIMARY KEY ASC,
        color varchar(25)
      );

      INSERT INTO cars (color) VALUES ('red');
      INSERT INTO cars (color) VALUES ('blue');
      INSERT INTO cars (color) VALUES ('green');
      """, (err, result) ->
        throw err if err
        Sql.open db_file, {}, (err, db) ->
          throw err if err
          db.exec 'SELECT * FROM cars;', (err, result) ->
            assert.deepEqual [{"id":"1","color":"red"},{"id":"2","color":"blue"},{"id":"3","color":"green"}], result
            done()

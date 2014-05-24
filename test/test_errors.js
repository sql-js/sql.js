var assert = require("assert");
var sql = require('../js/sql.js');

// Create a database
var db = new sql.Database();

// Execute some sql
var res = db.exec("CREATE TABLE test (a, b, c, d, e);");

assert.throws(function(){
  db.exec("I ain't be no valid sql ...");
}, "Executing invalid SQL should throw an error");


var stmt = db.prepare("INSERT INTO test (a) VALUES (?)");


assert.throws(function(){
  stmt.bind([1,2,3]);
}, "Binding too many parameters should throw an exception");

stmt.run([2]); // Previous errors should not hav spoiled the statement

db.close();

assert.throws(function(){
	stmt.run([3]);
}, "Statements should'nt be able to execute after the database is closed");

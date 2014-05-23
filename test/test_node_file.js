var assert = require ("assert");

//Node filesystem module - You know that.
var fs = require('fs');

//Ditto, path module
var path = require('path');

//Actual path I'm using to get to sql.js in my project. 
var SQL = require('../js/sql.js');

var filebuffer = fs.readFileSync(path.join(__dirname, 'test.sqlite'));

//Works
var db = new SQL.Database(filebuffer);

//[{"columns":["id","content"],"values":[["0","hello"],["1","world"]]}]
var res = db.exec("SELECT * FROM test WHERE id = 0");
assert.deepEqual(res, [{"columns":["id","content"],"values":[["0","hello"]]}]);

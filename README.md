# SQLite compiled to javascript
[![Build Status](https://travis-ci.org/lovasoa/sql.js.svg?branch=master)](http://travis-ci.org/lovasoa/sql.js)

This is my fork of sql.js, by kripken. Try it online here: http://lovasoa.github.io/sql.js/GUI/

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.
no C bindings or node-gyp compilation here.

SQLite is public domain, sql.js is MIT licensed.

## Usage

```javascript
var sql = require('./js/sql-api.js');
// or sql = window.SQL if you are in a browser

// Create a database
var db = new sql.Database();
// NOTE: You can also use new sql.Database(data) where
// data is an Uint8Array representing an SQLite database file

// Execute some sql
sqlstr = "CREATE TABLE hello (a int, b char);";
sqlstr += "INSERT INTO hello VALUES (0, 'hello');"
sqlstr += "INSERT INTO hello VALUES (1, 'world');"
db.run(sqlstr); // Run the query without returning anything

var res = db.exec("SELECT * FROM hello");
/*
[
	{columns:['a','b'], values:[[0,'hello'],[1,'world']]}
]
*/

// Prepare an sql statement
var stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

// Bind values to the parameters and fetch the results of the query
var result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
console.log(result); // Will print {a:1, b:'world'}

// Bind other values
stmt.bind([0, 'hello']);
while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']

// free the memory used by the statement
stmt.free();
// You can not use your statement anymore once it has been freed.
// But not freeing your statements causes memory leaks. You don't want that.

// Export the database to an Uint8Array containing the SQLite database file
var binaryArray = db.export();
```

## Demo
There is an online demo available here : http://lovasoa.github.io/sql.js/GUI

## Exemples
The test files provide up to date example of the use of the api.
### API usage
See : https://github.com/lovasoa/sql.js/blob/master/test/test_api.js
### Load sqlite database file from disk in node.js
See : https://github.com/lovasoa/sql.js/blob/master/test/test_node_file.js
### Use BLOBs in sqlite
See : https://github.com/lovasoa/sql.js/blob/master/test/test_blob.js

## Documentation
The API is fully documented here : http://lovasoa.github.io/sql.js/documentation/

## Differences from the original sql.js
 * Support for BLOBs
 * Support for prepared statements
 * Cleaner API
 * More recent version of SQLite (3.8.4)
 * Compiled to asm.js (should be faster, at least on firefox)
 * Changed API. Results now have the form <code>[{'columns':[], values:[]}]</code>
 * Improved GUI of the demo. It now has :
   * syntax highlighting
   * nice HTML tables to display results
   * ability to load and save sqlite database files

## Related

* [In-Browser/Client-Side Demo](http://lovasoa.github.io/sql.js/GUI/)


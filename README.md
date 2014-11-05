# SQLite compiled to javascript
[![Build Status](https://travis-ci.org/kripken/sql.js.svg?branch=master)](http://travis-ci.org/kripken/sql.js)

For the impatients, try the demo here: http://kripken.github.io/sql.js/GUI/

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.
no C bindings or node-gyp compilation here.

SQLite is public domain, sql.js is MIT licensed.

## Usage

```javascript
var sql = require('sql.js');
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
There is an online demo available here : http://kripken.github.io/sql.js/GUI

## Examples
The test files provide up to date example of the use of the api.
### Inside the browser
#### Example **HTML** file:
```html
<script src='js/sql.js'></script>
<script>
    //Create the database
    var db = new SQL.Database();
    // Run a query without reading the results
    db.run("CREATE TABLE test (col1, col2);");
    // Insert two rows: (1,111) and (2,222)
    db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

    // Prepare a statement
    var stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
    stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

    // Bind new values
    stmt.bind({$start:1, $end:2});
    while(stmt.step()) { //
        var row = stmt.getAsObject();
        // [...] do something with the row of result
    }
</script>
```

#### Creating a database from a file choosen by the user
`SQL.Database` constructor takes an array of integer representing a database file as an optional parameter.
The following code uses an HTML input as the source for loading a database:
```javascript
dbFileElm.onchange = function() {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function() {
		var Uints = new Uint8Array(r.result);
		db = new SQL.Database(Uints);
	}
	r.readAsArrayBuffer(f);
}
```
See : http://kripken.github.io/sql.js/GUI/gui.js

### Use from node.js

`sql.js` is [hosted on npm](https://www.npmjs.org/package/sql.js). To install it, you can simply run `npm install sql.js`.
Alternatively, you can simply download the file `sql.js`, from the download link below.

#### read a database from the disk:
```javascript
var fs = require('fs');
var SQL = require('sql.js');
var filebuffer = fs.readFileSync('test.sqlite');

// Load the db
var db = new SQL.Database(filebuffer);
```

#### write a database to the disk
You need to convert the result of `db.export` to a buffer
```javascript
var fs = require("fs");
// [...] (create the database)
var data = db.export();
var buffer = new Buffer(data);
fs.writeFileSync("filename.sqlite", buffer);
```

See : https://github.com/kripken/sql.js/blob/master/test/test_node_file.js

### Use as web worker
If you don't want to run CPU-intensive SQL queries in your main application thread,
you can use the *more limited* WebWorker API.

You will need to download `worker.sql.js`

Example:
```html
<script>
var worker = new Worker("js/worker.sql.js"); // You can find worker.sql.js in this repo
worker.onmessage = function() {
	console.log("Database opened");
	worker.onmessage = function(event){
		console.log(event.data); // The result of the query
	};
	worker.postMessage({
		id: 2,
		action: 'exec',
		sql: 'SELECT * FROM test'
	});
};

worker.onerror = function(e) {console.log("Worker error: ", e)};
worker.postMessage({
	id:1,
	action:'open',
	buffer:buf, /*Optional. An ArrayBuffer representing an SQLite Database file*/
});
</script>
```

See : https://github.com/kripken/sql.js/blob/master/test/test_worker.js

## Documentation
The API is fully documented here : http://kripken.github.io/sql.js/documentation/

## Downloads
 - You can download `sql.js` here : https://raw.githubusercontent.com/kripken/sql.js/master/js/sql.js
 - And the Web Worker version: https://raw.githubusercontent.com/kripken/sql.js/master/js/worker.sql.js

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

* [In-Browser/Client-Side Demo](http://kripken.github.io/sql.js/GUI/)


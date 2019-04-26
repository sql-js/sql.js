# SQLite compiled to javascript
[![Build Status](https://travis-ci.org/kripken/sql.js.svg?branch=master)](http://travis-ci.org/kripken/sql.js) [![CDNJS version](https://img.shields.io/cdnjs/v/sql.js.svg)](https://cdnjs.com/libraries/sql.js)

For the impatients, try the demo here: http://kripken.github.io/sql.js/examples/GUI

*sql.js* is a port of [SQLite](http://sqlite.org/about.html) to Webassembly, by compiling the SQLite C code with [Emscripten](http://kripken.github.io/emscripten-site/docs/introducing_emscripten/about_emscripten.html). It uses a [virtual database file stored in memory](https://kripken.github.io/emscripten-site/docs/porting/files/file_systems_overview.html), and thus **doesn't persist the changes** made to the database. However, it allows you to **import** any existing sqlite file, and to **export** the created database as a [javascript typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

There are no C bindings or node-gyp compilation here, sql.js is a simple javascript file, that can be used like any traditional javascript library. If you are building a native application in javascript (using Electron for instance), or are working in node.js, you will likely prefer to use [a native binding of SQLite to javascript](https://www.npmjs.com/package/sqlite3).

SQLite is public domain, sql.js is MIT licensed.

Sql.js predates WebAssembly, and thus started as an [asm.js](https://en.wikipedia.org/wiki/Asm.js) project. It still supports asm.js for backwards compatability.

## Version of binaries
Sql.js was last built with:
Emscripten version 1.38.30 (2019-04-16) [Release History](https://emscripten.org/docs/introducing_emscripten/release_notes.html)
SqlLite version: 3.28.0 (2019-04-16) [Release History](https://www.sqlite.org/changes.html)

## Documentation
A [full documentation](http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Database.html) generated from comments inside the source code, is available.

## Usage

```javascript
var initSqlJs = require('sql-wasm.js');
// or if you are in a browser:
//var initSqlJs = window.initSqlJs;

initSqlJs().then(function(SQL){

  // Create a database
  var db = new SQL.Database();
  // NOTE: You can also use new SQL.Database(data) where
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

  // You can also use javascript functions inside your SQL code
  // Create the js function you need
  function add(a, b) {return a+b;}
  // Specifies the SQL function's name, the number of it's arguments, and the js function to use
  db.create_function("add_js", add);
  // Run a query in which the function is used
  db.run("INSERT INTO hello VALUES (add_js(7, 3), add_js('Hello ', 'world'));"); // Inserts 10 and 'Hello world'

  // free the memory used by the statement
  stmt.free();
  // You can not use your statement anymore once it has been freed.
  // But not freeing your statements causes memory leaks. You don't want that.

  // Export the database to an Uint8Array containing the SQLite database file
  var binaryArray = db.export();
});

```

## Demo
There are a few examples [available here](https://kripken.github.io/sql.js/index.html). The most full-featured is the [Sqlite Interpreter](https://kripken.github.io/sql.js/examples/GUI/index.html).

## Examples
The test files provide up to date example of the use of the api.
### Inside the browser
#### Example **HTML** file:
```html
<meta charset="utf8" />
<html>
  <script src='/dist/sql-wasm.js'></script>
  <script>
    config = {
      locateFile: url => `/dist/${filename}` 
    }
    // The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
    // We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
    initSqlJs(config).then(function(SQL){
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
        console.log('Here is a row: ' + JSON.stringify(row));
      }
    });
  </script>
  <body>
    Output is in Javscript console
  </body>
</html>
```

#### Creating a database from a file choosen by the user
`SQL.Database` constructor takes an array of integer representing a database file as an optional parameter.
The following code uses an HTML input as the source for loading a database:
```javascript
dbFileElm.onchange = () => {
  var f = dbFileElm.files[0];
  var r = new FileReader();
  r.onload = function() {
    var Uints = new Uint8Array(r.result);
    db = new SQL.Database(Uints);
  }
  r.readAsArrayBuffer(f);
}
```
See : http://kripken.github.io/sql.js/examples/GUI/gui.js

#### Loading a database from a server

```javascript
var xhr = new XMLHttpRequest();
// For example: https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite
xhr.open('GET', '/path/to/database.sqlite', true);
xhr.responseType = 'arraybuffer';

xhr.onload = e => {
  var uInt8Array = new Uint8Array(this.response);
  var db = new SQL.Database(uInt8Array);
  var contents = db.exec("SELECT * FROM my_table");
  // contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
};
xhr.send();
```
See: https://github.com/kripken/sql.js/wiki/Load-a-database-from-the-server


### Use from node.js

`sql.js` is [hosted on npm](https://www.npmjs.org/package/sql.js). To install it, you can simply run `npm install sql.js`.
Alternatively, you can simply download `sql-wasm.js` and `sql-wasm.wasm`, from the download link below.

#### read a database from the disk:
```javascript
var fs = require('fs');
var initSqlJs = require('sql-wasm.js');
var filebuffer = fs.readFileSync('test.sqlite');
 
initSqlJs().then(function(SQL){
  // Load the db
  var db = new SQL.Database(filebuffer);
});

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

You will need to download [dist/worker.sql-wasm.js](dist/worker.sql-wasm.js) [dist/worker.sql-wasm.wasm](dist/worker.sql-wasm.wasm).

Example:
```html
<script>
  var worker = new Worker("/dist/worker.sql-wasm.js");
  worker.onmessage = () => {
    console.log("Database opened");
    worker.onmessage = event => {
      console.log(event.data); // The result of the query
    };
	
    worker.postMessage({
      id: 2,
      action: 'exec',
      sql: 'SELECT * FROM test'
    });
  };

  worker.onerror = e => console.log("Worker error: ", e);
  worker.postMessage({
    id:1,
    action:'open',
    buffer:buf, /*Optional. An ArrayBuffer representing an SQLite Database file*/
  });
</script>
```

See [examples/GUI/gui.js](examples/GUI/gui.js) for a full working example.

## Flavors/versions Targets/Downloads

This library includes both WebAssembly and asm.js versions of Sqlite. (WebAssembly is the newer, preferred way to compile to Javascript, and has superceded asm.js. It produces smaller, faster code.) Asm.js versions are included for compatibility.

## Upgrading from 0.x to 1.x

Version 1.0 of sql.js must be loaded asynchronously, whereas asm.js was able to be loaded synchronously. 

So in the past, you would:
```html
<script src='js/sql.js'></script>
<script>
  var db = new SQL.Database();
  //...
</script>
```
or:
```javascript
var SQL = require('sql.js');
var db = new QL.Database();
//...
```

Version 1.x:
```html
<script src='dist/sql-wasm.js'></script>
<script>
  initSqlJs({ locateFile: filename => `/dist/${filename}` }).then(function(SQL){
    var db = new SQL.Database();
    //...
  });
</script>
```
or:
```javascript
var initSqlJs = require('sql-wasm.js');
initSqlJs().then(function(SQL){
  var db = new SQL.Database();
  //...
});
```

`NOTHING` is now a reserved word in SQLite, whereas previously it was not. This could cause errors like `Error: near "nothing": syntax error`

### Downloading/Using: ###
Although asm.js files were distributed as a single Javascript file, WebAssembly libraries are most efficiently distributed as a pair of files, the `.js`  loader and the `.wasm` file, like [dist/sql-wasm.js]([dist/sql-wasm.js]) and [dist/sql-wasm.wasm]([dist/sql-wasm.wasm]). The `.js` file is reponsible for wrapping/loading the `.wasm` file. 




## Versions of sql.js included in `dist/`
 - `sql-wasm.js` : The Web Assembly version of Sql.js. Minified and suitable for production. Use this. If you use this, you will need to include/ship `sql-wasm.wasm` as well.
 - `sql-wasm-debug.js` : The Web Assembly, Debug version of Sql.js. Larger, with assertions turned on. Useful for local development. You will need to include/ship `sql-wasm-debug.wasm` if you use this.
 - `sql-asm.js` : The older asm.js version of Sql.js. Slower and larger. Provided for compatiblity reasons.
 - `sql-asm-memory-growth.js` : Asm.js doesn't allow for memory to grow by default, because it is slower and de-optimizes. If you are using sql-asm.js and you see this error (`Cannot enlarge memory arrays`), use this file.
 - `sql-asm-debug.js` : The _Debug_ asm.js version of Sql.js. Use this for local development.
 - `worker.*` - Web Worker versions of the above libraries. More limited API. See [examples/GUI/gui.js](examples/GUI/gui.js) for a good example of this.

## Compiling

- Install the EMSDK, [as described here](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
- Run `npm run rebuild`


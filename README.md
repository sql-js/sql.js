# SQLite compiled to JavaScript <img src="https://user-images.githubusercontent.com/552629/76405509-87025300-6388-11ea-86c9-af882abb00bd.png" width="40" height="40" />

[![CI status](https://github.com/sql-js/sql.js/workflows/CI/badge.svg)](https://github.com/sql-js/sql.js/actions)
[![npm](https://img.shields.io/npm/v/sql.js)](https://www.npmjs.com/package/sql.js)
[![CDNJS version](https://img.shields.io/cdnjs/v/sql.js.svg)](https://cdnjs.com/libraries/sql.js)

For the impatients, try the demo here: https://sql-js.github.io/sql.js/examples/GUI/

*sql.js* is a port of [SQLite](http://sqlite.org/about.html) to Webassembly, by compiling the SQLite C code with [Emscripten](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html), with [contributed math and string extension functions](https://www.sqlite.org/contrib?orderby=date) included. It uses a [virtual database file stored in memory](https://emscripten.org/docs/porting/files/file_systems_overview.html), and thus **doesn't persist the changes** made to the database. However, it allows you to **import** any existing sqlite file, and to **export** the created database as a [JavaScript typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

There are no C bindings or node-gyp compilation here, sql.js is a simple JavaScript file, that can be used like any traditional JavaScript library. If you are building a native application in JavaScript (using Electron for instance), or are working in node.js, you will likely prefer to use [a native binding of SQLite to JavaScript](https://www.npmjs.com/package/sqlite3).

SQLite is public domain, sql.js is MIT licensed.

Sql.js predates WebAssembly, and thus started as an [asm.js](https://en.wikipedia.org/wiki/Asm.js) project. It still supports asm.js for backwards compatibility.


## Documentation
A [full documentation](https://sql-js.github.io/sql.js/documentation/class/Database.html) generated from comments inside the source code, is available.

## Usage

By default, *sql.js* uses [wasm](https://developer.mozilla.org/en-US/docs/WebAssembly), and thus needs to load a `.wasm` file in addition to the javascript library. You can find this file in `./node_modules/sql.js/dist/sql-wasm.wasm` after installing sql.js from npm, and add it to your static assets or load it from [a CDN](https://cdnjs.com/libraries/sql.js). Then use the [`locateFile`](https://emscripten.org/docs/api_reference/module.html#Module.locateFile) property of the configuration object passed to `initSqlJs` to indicate where the file is. If you use an asset builder such as webpack, you can automate this. See [this demo of how to integrate sql.js with webpack (and react)](https://github.com/sql-js/react-sqljs-demo).

```javascript
const initSqlJs = require('sql.js');
// or if you are in a browser:
// var initSqlJs = window.initSqlJs;

const SQL = await initSqlJs({
  // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
  // You can omit locateFile completely when running in node
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.1.0/dist/${file}`
});

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

// You can also use JavaScript functions inside your SQL code
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
```

## Demo
There are a few examples [available here](https://sql-js.github.io/sql.js/index.html). The most full-featured is the [Sqlite Interpreter](https://sql-js.github.io/sql.js/examples/GUI/index.html).

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
      locateFile: filename => `/dist/${filename}`
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
    Output is in Javascript console
  </body>
</html>
```

#### Creating a database from a file chosen by the user
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
See : https://sql-js.github.io/sql.js/examples/GUI/gui.js

#### Loading a database from a server

```javascript
var xhr = new XMLHttpRequest();
// For example: https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite
xhr.open('GET', '/path/to/database.sqlite', true);
xhr.responseType = 'arraybuffer';

xhr.onload = e => {
  var uInt8Array = new Uint8Array(xhr.response);
  var db = new SQL.Database(uInt8Array);
  var contents = db.exec("SELECT * FROM my_table");
  // contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
};
xhr.send();
```
See: https://github.com/sql-js/sql.js/wiki/Load-a-database-from-the-server


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

See : https://github.com/sql-js/sql.js/blob/master/test/test_node_file.js

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
      action: "exec",
      sql: "SELECT age,name FROM test WHERE id=$id",
      params: { "$id": 1 }
    });
  };

  worker.onerror = e => console.log("Worker error: ", e);
  worker.postMessage({
    id:1,
    action:"open",
    buffer:buf, /*Optional. An ArrayBuffer representing an SQLite Database file*/
  });
</script>
```

See [examples/GUI/gui.js](examples/GUI/gui.js) for a full working example.

## Flavors/versions Targets/Downloads

This library includes both WebAssembly and asm.js versions of Sqlite. (WebAssembly is the newer, preferred way to compile to JavaScript, and has superceded asm.js. It produces smaller, faster code.) Asm.js versions are included for compatibility.

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
var db = new SQL.Database();
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
Although asm.js files were distributed as a single Javascript file, WebAssembly libraries are most efficiently distributed as a pair of files, the `.js`  loader and the `.wasm` file, like `sql-wasm.js` and `sql-wasm.wasm`. The `.js` file is responsible for loading the `.wasm` file. You can find these files on our [release page](https://github.com/sql-js/sql.js/releases)




## Versions of sql.js included in the [distributed artifacts](https://github.com/sql-js/sql.js/releases/latest)
For each [release](https://github.com/sql-js/sql.js/releases/), you will find a file called `sqljs.zip` in the *release assets*. It will contain:
 - `sql-wasm.js` : The Web Assembly version of Sql.js. Minified and suitable for production. Use this. If you use this, you will need to include/ship `sql-wasm.wasm` as well.
 - `sql-wasm-debug.js` : The Web Assembly, Debug version of Sql.js. Larger, with assertions turned on. Useful for local development. You will need to include/ship `sql-wasm-debug.wasm` if you use this.
 - `sql-asm.js` : The older asm.js version of Sql.js. Slower and larger. Provided for compatibility reasons.
 - `sql-asm-memory-growth.js` : Asm.js doesn't allow for memory to grow by default, because it is slower and de-optimizes. If you are using sql-asm.js and you see this error (`Cannot enlarge memory arrays`), use this file.
 - `sql-asm-debug.js` : The _Debug_ asm.js version of Sql.js. Use this for local development.
 - `worker.*` - Web Worker versions of the above libraries. More limited API. See [examples/GUI/gui.js](examples/GUI/gui.js) for a good example of this.

## Compiling

- Install the EMSDK, [as described here](https://emscripten.org/docs/getting_started/downloads.html)
- Run `npm run rebuild`

In order to enable extensions like JSON1 or FTS5, change the CFLAGS in the [Makefile](Makefile) and rebuild:

``` diff
CFLAGS = \
        -O2 \
        -DSQLITE_OMIT_LOAD_EXTENSION \
        -DSQLITE_DISABLE_LFS \
        -DSQLITE_ENABLE_FTS3 \
        -DSQLITE_ENABLE_FTS3_PARENTHESIS \
+       -DSQLITE_ENABLE_FTS5 \
+       -DSQLITE_ENABLE_JSON1 \
        -DSQLITE_THREADSAFE=0
```

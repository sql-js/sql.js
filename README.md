<img src="https://user-images.githubusercontent.com/552629/76405509-87025300-6388-11ea-86c9-af882abb00bd.png" width="40" height="40" />

# SQLite compiled to JavaScript

[![CI status](https://github.com/sql-js/sql.js/workflows/CI/badge.svg)](https://github.com/sql-js/sql.js/actions)
[![npm](https://img.shields.io/npm/v/sql.js)](https://www.npmjs.com/package/sql.js)
[![CDNJS version](https://img.shields.io/cdnjs/v/sql.js.svg)](https://cdnjs.com/libraries/sql.js)

*sql.js* is a javascript SQL database. It allows you to create a relational database and query it entirely in the browser. You can try it in [this online demo](https://sql.js.org/examples/GUI/). It uses a [virtual database file stored in memory](https://emscripten.org/docs/porting/files/file_systems_overview.html), and thus **doesn't persist the changes** made to the database. However, it allows you to **import** any existing sqlite file, and to **export** the created database as a [JavaScript typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

*sql.js* uses [emscripten](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html) to compile [SQLite](http://sqlite.org/about.html) to WebAssembly. It includes [contributed math and string extension functions](https://www.sqlite.org/contrib?orderby=date).

sql.js can be used like any traditional JavaScript library. If you are building a native application in JavaScript (using Electron for instance), or are working in node.js, you will likely prefer to use [a native binding of SQLite to JavaScript](https://www.npmjs.com/package/sqlite3). A native binding will not only be faster because it will run native code, but it will also be able to work on database files directly instead of having to load the entire database in memory, avoiding out of memory errors and further improving performances.

SQLite is public domain, sql.js is MIT licensed.

## API documentation
A [full API documentation](https://sql.js.org/documentation/) for all the available classes and methods is available.
It is generated from comments inside the source code, and is thus always up to date.

## Usage

For a single-file setup, use **`sql-wasm-inline.js`**. It embeds the WebAssembly binary in the JavaScript file, so there is no separate `.wasm` asset to serve and no `locateFile` configuration:

```javascript
const initSqlJs = require('sql.js/dist/sql-wasm-inline.js');
const SQL = await initSqlJs();
const db = new SQL.Database();
```

In a browser, load `<script src="/dist/sql-wasm-inline.js"></script>` and call `initSqlJs()` in the same way. This build requires WebAssembly support and uses the same asynchronous API as the default build. Embedding the binary makes the JavaScript file larger; the default build keeps it separate for independent caching and streaming compilation.

By default, *sql.js* uses [wasm](https://developer.mozilla.org/en-US/docs/WebAssembly), and thus needs to load a `.wasm` file in addition to the javascript library. You can find this file in `./node_modules/sql.js/dist/sql-wasm.wasm` after installing sql.js from npm, and instruct your bundler to add it to your static assets or load it from [a CDN](https://cdnjs.com/libraries/sql.js). Then use the [`locateFile`](https://emscripten.org/docs/api_reference/module.html#Module.locateFile) property of the configuration object passed to `initSqlJs` to indicate where the file is. If you use an asset builder such as webpack, you can automate this. See [this demo of how to integrate sql.js with webpack (and react)](https://github.com/sql-js/react-sqljs-demo).

```javascript
const initSqlJs = require('sql.js');
// or if you are in a browser:
// const initSqlJs = window.initSqlJs;

const SQL = await initSqlJs({
  // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
  // You can omit locateFile completely when running in node
  locateFile: file => `https://sql.js.org/dist/${file}`
});

// Create a database
const db = new SQL.Database();
// NOTE: You can also use new SQL.Database(data) where
// data is an Uint8Array representing an SQLite database file


// Execute a single SQL string that contains multiple statements
let sqlstr = "CREATE TABLE hello (a int, b char); \
INSERT INTO hello VALUES (0, 'hello'); \
INSERT INTO hello VALUES (1, 'world');";
db.run(sqlstr); // Run the query without returning anything

// Prepare an sql statement
const stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

// Bind values to the parameters and fetch the results of the query
const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
console.log(result); // Will print {a:1, b:'world'}

// Bind other values
stmt.bind([0, 'hello']);
while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']
// free the memory used by the statement
stmt.free();
// You can not use your statement anymore once it has been freed.
// But not freeing your statements causes memory leaks. You don't want that.

const res = db.exec("SELECT * FROM hello");
/*
[
  {columns:['a','b'], values:[[0,'hello'],[1,'world']]}
]
*/

// You can also use JavaScript functions inside your SQL code
// Create the js function you need
function add(a, b) {return a+b;}
// Specifies the SQL function's name, the number of it's arguments, and the js function to use
db.create_function("add_js", add);
// Run a query in which the function is used
db.run("INSERT INTO hello VALUES (add_js(7, 3), add_js('Hello ', 'world'));"); // Inserts 10 and 'Hello world'

// You can create custom aggregation functions, by passing a name
// and a set of functions to `db.create_aggregate`:
//
// - an `init` function. This function receives no argument and returns
//   the initial value for the state of the aggregate function.
// - a `step` function. This function takes two arguments
//    - the current state of the aggregation
//    - a new value to aggregate to the state
//  It should return a new value for the state.
// - a `finalize` function. This function receives a state object, and
//   returns the final value of the aggregate. It can be omitted, in which case
//   the final value of the state will be returned directly by the aggregate function.
//
// Here is an example aggregation function, `json_agg`, which will collect all
// input values and return them as a JSON array:
db.create_aggregate(
  "json_agg",
  {
    init: () => [],
    step: (state, val) => [...state, val],
    finalize: (state) => JSON.stringify(state),
  }
);

db.exec("SELECT json_agg(column1) FROM (VALUES ('hello'), ('world'))");
// -> The result of the query is the string '["hello","world"]'

// Export the database to an Uint8Array containing the SQLite database file
const binaryArray = db.export();
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
      const db = new SQL.Database();
      // Run a query without reading the results
      db.run("CREATE TABLE test (col1, col2);");
      // Insert two rows: (1,111) and (2,222)
      db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

      // Prepare a statement
      const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
      stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

      // Bind new values
      stmt.bind({$start:1, $end:2});
      while(stmt.step()) { //
        const row = stmt.getAsObject();
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
  const f = dbFileElm.files[0];
  const r = new FileReader();
  r.onload = function() {
    const Uints = new Uint8Array(r.result);
    db = new SQL.Database(Uints);
  }
  r.readAsArrayBuffer(f);
}
```
See : https://sql-js.github.io/sql.js/examples/GUI/gui.js

#### Loading a database from a server

##### using fetch

```javascript
const sqlPromise = initSqlJs({
  locateFile: file => `https://path/to/your/dist/folder/dist/${file}`
});
const dataPromise = fetch("/path/to/database.sqlite").then(res => res.arrayBuffer());
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));
```

##### using XMLHttpRequest

```javascript
const xhr = new XMLHttpRequest();
// For example: https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite
xhr.open('GET', '/path/to/database.sqlite', true);
xhr.responseType = 'arraybuffer';

xhr.onload = e => {
  const uInt8Array = new Uint8Array(xhr.response);
  const db = new SQL.Database(uInt8Array);
  const contents = db.exec("SELECT * FROM my_table");
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
const fs = require('fs');
const initSqlJs = require('sql.js');
const filebuffer = fs.readFileSync('test.sqlite');

initSqlJs().then(function(SQL){
  // Load the db
  const db = new SQL.Database(filebuffer);
});

```

#### write a database to the disk
You need to convert the result of `db.export` to a buffer
```javascript
const fs = require("fs");
// [...] (create the database)
const data = db.export();
const buffer = Buffer.from(data);
fs.writeFileSync("filename.sqlite", buffer);
```

See : https://github.com/sql-js/sql.js/blob/master/test/test_node_file.js

### Use as web worker
If you don't want to run CPU-intensive SQL queries in your main application thread,
you can use the *more limited* WebWorker API.

You will need to download `worker.sql-wasm.js` and `sql-wasm.wasm` from the [release page](https://github.com/sql-js/sql.js/releases).

For a single-file worker, use `worker.sql-wasm-inline.js`; it includes the WebAssembly binary and needs no companion file.

Example:
```html
<script>
  const worker = new Worker("/dist/worker.sql-wasm.js");
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
### Enabling BigInt support
If you need ```BigInt``` support, it is partially supported since most browsers now supports it including Safari.Binding ```BigInt``` is still not supported, only getting ```BigInt``` from the database is supported for now.

```html
<script>
  const stmt = db.prepare("SELECT * FROM test");
  const config = {useBigInt: true};
  /*Pass optional config param to the get function*/
  while (stmt.step()) console.log(stmt.get(null, config));

  /*OR*/
  const results = db.exec("SELECT * FROM test", config);
  console.log(results[0].values)
</script>
```
On WebWorker, you can just add ```config``` param before posting a message. With this, you wont have to pass config param on ```get``` function.

```html
<script>
  worker.postMessage({
    id:1,
    action:"exec",
    sql: "SELECT * FROM test",
    config: {useBigInt: true}, /*Optional param*/
  });
</script>
```

See [examples/GUI/gui.js](examples/GUI/gui.js) for a full working example.

## Flavors/versions Targets/Downloads

Choose between the default WebAssembly build, which loads a separate binary, and the inline build, which embeds it in one JavaScript file.

## Upgrading from 0.x to 1.x

Version 1.0 and later load asynchronously, whereas version 0.x loaded synchronously.

So in the past, you would:
```html
<script src='js/sql.js'></script>
<script>
  const db = new SQL.Database();
  //...
</script>
```
or:
```javascript
const SQL = require('sql.js');
const db = new SQL.Database();
//...
```

Version 1.x:
```html
<script src='dist/sql-wasm.js'></script>
<script>
  initSqlJs({ locateFile: filename => `/dist/${filename}` }).then(function(SQL){
    const db = new SQL.Database();
    //...
  });
</script>
```
or:
```javascript
const initSqlJs = require('sql.js');
initSqlJs().then(function(SQL){
  const db = new SQL.Database();
  //...
});
```

`NOTHING` is now a reserved word in SQLite, whereas previously it was not. This could cause errors like `Error: near "nothing": syntax error`

### Downloading and using builds

The [release page](https://github.com/sql-js/sql.js/releases/latest) provides `sql-wasm-inline.js` and `worker.sql-wasm-inline.js` as standalone downloads. The `sqljs-wasm.zip` archive contains the default JavaScript loader and WebAssembly binary; `sqljs-worker-wasm.zip` contains the worker loader and its binary.

The `sqljs-all.zip` archive and npm package include the following WebAssembly builds:

| Build | Companion file | Use |
| --- | --- | --- |
| `sql-wasm.js` | `sql-wasm.wasm` | Default production build for browsers and Node.js. |
| `sql-wasm-debug.js` | `sql-wasm-debug.wasm` | Development build with assertions. |
| `sql-wasm-browser.js` | `sql-wasm-browser.wasm` | Browser-only production build, selected by the npm browser export. |
| `sql-wasm-browser-debug.js` | `sql-wasm-browser-debug.wasm` | Browser-only development build. |
| `sql-wasm-inline.js` | None | Production build with the WebAssembly binary embedded. |
| `sql-wasm-inline-debug.js` | None | Inline development build with assertions. |
| `worker.sql-wasm.js` | `sql-wasm.wasm` | Production Web Worker build. |
| `worker.sql-wasm-debug.js` | `sql-wasm-debug.wasm` | Development Web Worker build. |
| `worker.sql-wasm-inline.js` | None | Single-file production Web Worker build. |
| `worker.sql-wasm-inline-debug.js` | None | Single-file development Web Worker build. |

Workers offer a more limited API. See [examples/GUI/gui.js](examples/GUI/gui.js) for an example.

## Compiling/Contributing

General consumers of this library don't need to read any further. (The compiled files are available via the [release page](https://github.com/sql-js/sql.js/releases).)

If you want to compile your own version of SQLite for WebAssembly, or want to contribute to this project, see [CONTRIBUTING.md](CONTRIBUTING.md).

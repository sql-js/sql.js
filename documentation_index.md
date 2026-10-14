# sql.js API documentation

## Introduction

If you need a quick introduction with code samples that you can copy-and-paste,
head over to [sql.js.org](https://sql.js.org/)

## Loading sql.js

The default `sql-wasm.js` build loads a separate `sql-wasm.wasm` binary. In browsers, use the `locateFile` configuration to specify its location.

To keep deployment in one JavaScript file, use `sql-wasm-inline.js`, which embeds the WebAssembly binary and needs no `locateFile` configuration:

```javascript
const initSqlJs = require("sql.js/dist/sql-wasm-inline.js");
const SQL = await initSqlJs();
const db = new SQL.Database();
```

In a browser, load `sql-wasm-inline.js` with a script tag and call `initSqlJs()`. For a single-file Web Worker, use `worker.sql-wasm-inline.js`. All builds require WebAssembly support and initialize asynchronously. Debug variants are also available; see the [build list](https://sql.js.org/#/README?id=downloading-and-using-builds).

## API

### The initSqlJs function

The root object in the API is the [`initSqlJs`](./global/#initsqljs) function,
that takes an [`SqlJsConfig`](./sqljsconfig/) parameter,
and returns a Promise that resolves to an [SqlJs](./sqljs/) object

### The SqlJs object

`initSqlJs` resolves to the main sql.js object, the [**`SqlJs`**](./module/sqljs/) module, which contains :

#### Database

[**Database**](./database/) is the main class, that represents an SQLite database.

#### Statement

The [**Statement**](./statement/) class is used for prepared statements.

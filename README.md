# SQLite compiled to javascript

This is my fork of sql.js, by kripken. Try it online here: http://lovasoa.github.io/sql.js/GUI/

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.
no C bindings or node-gyp compilation here.

SQLite is public domain, sql.js is MIT licensed.

## Usage

```javascript
var sql = require('./js/sql-api.js');

// Create a database
var db = new sql.Database();

// Execute some sql
sqlstr = "CREATE TABLE hello (a int, b char);";
sqlstr += "INSERT INTO hello VALUES (0, 'hello');"
sqlstr += "INSERT INTO hello VALUES (1, 'world');"
db.exec(sqlstr);

// Prepare an sql statement
var stmt = db.prepare("SELECT * FROM hello WHERE a=? AND b=?");

// Bind values to the parameters
stmt.bind([1, 'world']);

// Fetch the results of the query
while (stmt.step()) console.log(stmt.get()); // Will print [1, 'world']
```

## Differences from the original sql.js
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


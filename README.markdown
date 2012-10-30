
sql.js
======

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.

**[Demo](http://syntensity.com/static/sql.html)**

SQLite is public domain, sql.js is MIT licensed.


Usage
-----

See demo.html for an example use, and see test.js and the comments inside
for another example including the output you will receive.

The API is as follows:

 * SQL.open() creates a new database, returning a database object

 * SQL.open(data) creates a new database with given data, which should be
       a typed array of 8-bit values (typically generated from
       calling exportData, see below)

Database objects (created from SQL.open) have the following methods:

 * .exec(command) runs a command in the database, returning JSON output

 * .close() closes the database (this frees the memory it uses)

 * .exportData() serializes the data to a typed array of 8-bit values,
       which you can save using any method you like (localStorage,
       indexedDB, send to a remote server, etc.), and later re-use
       by calling SQL.open with that data.

Note that the output rows from .exec(..) look like

        [
          ["columname1", "columname2", "columname3"],
          ["row1value1", "row1value2", "row1value3"],
          ["row2value1", "row2value2", "row2value3"],
        ]

That is, it is a 2-dimensional array, whose first row contains column names, and
the rest of the rows contain the data.

Note that sql.js is *not* wrapped in a closure - it modifies the global scope. This
is done because when wrapped in a closure it becomes slower in most JS engines. To
be safe from global scope problems, you should either make sure your code doesn't
use the global scope, or wrap sql.js in a closure, something like

  var SQL = (function() {
    {{{ paste sql.js here }}}
    return SQL;
  })();
 
Another option is to run sql.js in a web worker.


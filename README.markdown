
sql.js
======

sql.js is a port of SQLite to JavaScript, by compiling the SQLite C code with Emscripten.

SQLite is public domain, sql.js is MIT licensed.


Usage
-----

See demo.html for an example use.

Note that sql.js is *not* wrapped in a closure - it modifies the global scope. This
is done because when wrapped in a closure it becomes slower in most JS engines. To
be safe from global scope problems, you should either make sure your code doesn't
use the global scope, or wrap sql.js in a closure, something like

  var SQL = (function() {
    {{{ paste sql.js here }}}
    return SQL;
  })();
 
Another option is to run sql.js in a web worker.


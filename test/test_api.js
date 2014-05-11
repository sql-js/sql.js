var sql = require('../js/sql-api.js');

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


// Resets the statement, so it can be used again with other values
stmt.reset()
// Bind other values
stmt.bind([0, 'hello']);
while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']


// free the memory used by the statement
stmt.free();
// You can not use your statement anymore once it has been freed.
// But not freeing your statements causes memory leaks. You don't want that.

// Export the database to an Uint8Array containing the SQLite database file
var binaryArray = db.export();
console.log(String.fromCharCode.apply(null,binaryArray.slice(0,6))); // The first 6 bytes form the word 'SQLite'

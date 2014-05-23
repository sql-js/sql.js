var assert = require("assert");
var SQL = require("../js/sql-api.js");

function toSimpleArray(arr) {
  return Array.prototype.slice.call(arr);
}

var db = new SQL.Database();
db.exec("CREATE TABLE test (data); INSERT INTO test VALUES (x'616200ff'),(x'00')"); // Insert binary data. This is invalid UTF8 on purpose


console.log("Testing writing BLOBs");
var stmt = db.prepare("INSERT INTO test VALUES (?)");
var bigArray = new Uint8Array(1e6);
bigArray[500] = 0x42
stmt.run([ bigArray ]);

console.log("Testing reading BLOBs");
var stmt = db.prepare("SELECT * FROM test ORDER BY length(data) DESC");

stmt.step();
var array = stmt.get()[0];
assert.equal(array.length, bigArray.length);
for (var i=0; i<array.length; i++) if (array[i]!==bigArray[i]) assert(false, "The blob stored in the database was altered");

stmt.step();
var res = stmt.get();
assert.deepEqual(res, [new Uint8Array([0x61, 0x62, 0x00, 0xff])]);

stmt.step();
var res = stmt.get();
assert.deepEqual(res, [new Uint8Array([0x00])]);

assert(stmt.step() === false, "All values should have been retrieved");

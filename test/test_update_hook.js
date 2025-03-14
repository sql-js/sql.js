exports.test = function(SQL, assert){
  var db = new SQL.Database();

  db.exec(
    "CREATE TABLE consoles (id INTEGER PRIMARY KEY, company TEXT, name TEXT);" +
    "INSERT INTO consoles VALUES (1, 'Sony', 'Playstation');" +
    "INSERT INTO consoles VALUES (2, 'Microsoft', 'Xbox');"
  );

  // {operation: undefined, databaseName: undefined, tableName: undefined, rowId: undefined};
  var updateHookCalls = []

  db.updateHook(function(operation, databaseName, tableName, rowId) {
    updateHookCalls.push({operation, databaseName, tableName, rowId});
  });

  // INSERT
  db.exec("INSERT INTO consoles VALUES (3, 'Sega', 'Saturn');");

  assert.deepEqual(updateHookCalls, [
    {operation: "insert", databaseName: "main", tableName: "consoles", rowId: 3}
  ], "insert a single row");

  // UPDATE
  updateHookCalls = []
  db.exec("UPDATE consoles SET name = 'Playstation 5' WHERE id = 1");

  assert.deepEqual(updateHookCalls, [
    {operation: "update", databaseName: "main", tableName: "consoles", rowId: 1}
  ], "update a single row");

  // UPDATE (multiple rows)
  updateHookCalls = []
  db.exec("UPDATE consoles SET name = name + ' [legacy]' WHERE id IN (2,3)");

  assert.deepEqual(updateHookCalls, [
    {operation: "update", databaseName: "main", tableName: "consoles", rowId: 2},
    {operation: "update", databaseName: "main", tableName: "consoles", rowId: 3},
  ], "update two rows");

  // DELETE
  updateHookCalls = []
  db.exec("DELETE FROM consoles WHERE company = 'Sega'");

  assert.deepEqual(updateHookCalls, [
    {operation: "delete", databaseName: "main", tableName: "consoles", rowId: 3}
  ], "delete a single row");

  // UNREGISTER
  updateHookCalls = []

  db.updateHook(null);

  db.exec("DELETE FROM consoles WHERE company = 'Microsoft'");

  assert.deepEqual(updateHookCalls, [], "unregister the update hook");

  // REGISTER AGAIN
  updateHookCalls = []

  db.updateHook(function(operation, databaseName, tableName, rowId) {
    updateHookCalls.push({operation, databaseName, tableName, rowId});
  });

  // need a where clause, just running "DELETE FROM consoles" would result in
  // a TRUNCATE and not yield any update hook callbacks
  db.exec("DELETE FROM consoles WHERE id > 0");

  assert.deepEqual(updateHookCalls, [
    {operation: 'delete', databaseName: 'main', tableName: 'consoles', rowId: 1}
  ], "register the update hook again");
}

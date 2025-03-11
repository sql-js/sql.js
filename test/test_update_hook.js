exports.test = function(SQL, assert){
  var db = new SQL.Database();

  db.exec(
    "CREATE TABLE consoles (id INTEGER PRIMARY KEY, company TEXT, name TEXT);" +
    "INSERT INTO consoles VALUES (1, 'Sony', 'Playstation');" +
    "INSERT INTO consoles VALUES (2, 'Microsoft', 'Xbox');"
  );

  // {operation: undefined, tableName: undefined, rowId: undefined};
  var updateHookCalls = []

  db.updateHook(function(operation, tableName, rowId) {
    updateHookCalls.push({operation, tableName, rowId});
  });

  // INSERT
  db.exec("INSERT INTO consoles VALUES (3, 'Sega', 'Saturn');");

  assert.deepEqual(updateHookCalls, [{operation: 'insert', tableName: 'consoles', rowId: 3}], 'insert a single row');
  updateHookCalls = []

  // UPDATE
  db.exec("UPDATE consoles SET name = 'Playstation 5' WHERE id = 1");

  assert.deepEqual(updateHookCalls, [{operation: 'update', tableName: 'consoles', rowId: 1}], 'update a single row');
  updateHookCalls = []

  // UPDATE (multiple rows)
  db.exec("UPDATE consoles SET name = name + ' [legacy]' WHERE id IN (2,3)");

  assert.deepEqual(updateHookCalls, [
    {operation: 'update', tableName: 'consoles', rowId: 2},
    {operation: 'update', tableName: 'consoles', rowId: 3},
  ], 'update two rows');
  updateHookCalls = []

  // DELETE
  db.exec("DELETE FROM consoles WHERE company = 'Sega'");

  assert.deepEqual(updateHookCalls, [{operation: 'delete', tableName: 'consoles', rowId: 3}], 'delete a single row');
  updateHookCalls = []
}


Module.Database = class Database {
  constructor(data) {}
  run(sql, params) {}
  exec(sql, params, config) {}
  each(sql, params, callback, done, config) {}
  prepare(sql, params) {}
  iterateStatements(sql) {}
  export() {}
  close() {}
  handleError(returnCode) {}
  getRowsModified() {}
  create_function() {}
  create_aggregate() {}
}

Module.Statement = class Statement {
  constructor(stmt, db) {}
  bind(values) {}
  step() {}
  getNumber(pos) {}
  getBigInt(pos) {}
  getString(pos) {}
  getBlob(pos) {}
  get(params, config) {}
  getColumnNames() {}
  getAsObject() {}
  getSQL() {}
  getNormalizedSQL() {}
  run(values) {}
  bindString(string, pos) {}
  bindBlob(array, pos) {}
  bindNumber(num, pos) {}
  bindNull(pos) {}
  bindVlaue(val, pos) {}
  bindFromObject(valuesObj) {}
  bindFromArray(values) {}
  reset() {}
  freemem() {}
  free() {}
}

Module.StatementItearator = class StatementIterator {
  constructor(sql, obj) {}
  next() {}
  finalize() {}
  getRemainingSQL() {}
  // [Symbol.iterator]() {} // XXX: Causes closure compiler error? com.google.javascript.rhino.Node cannot be cast to com.google.javascript.rhino.Node$StringNode
}

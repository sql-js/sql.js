var apiTemp = Runtime.stackAlloc(4);

Module['open'] = function(filename) {
  var ret = Module['ccall']('sqlite3_open', 'number', ['string', 'number'], [filename, apiTemp]);
  if (ret) throw 'SQLite exception: ' + ret;
  return getValue(apiTemp, 'i32');
}

Module['close'] = function(db) {
  var ret = Module['ccall']('sqlite3_close', 'number', ['number'], [db]);
  if (ret) throw 'SQLite exception: ' + ret;
}

var callbackTemp = FUNCTION_TABLE.length;
FUNCTION_TABLE.push(0, 0);

Module['exec'] = function(db, sql, callback) {
  setValue(apiTemp, 0, 'i32');
  if (callback) {
    FUNCTION_TABLE[callbackTemp] = function(notUsed, argc, argv, colNames) {
      var data = [];
      for (var i = 0; i < argc; i++) {
        data.push({
          'column': Pointer_stringify(getValue(colNames + i*Runtime.QUANTUM_SIZE, 'i32')),
          'value': Pointer_stringify(getValue(argv + i*Runtime.QUANTUM_SIZE, 'i32'))
        });
      }
      callback(data);
    };
  }
  var ret = Module['ccall']('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number'],
                            [db, sql, callback ? callbackTemp : 0, 0, apiTemp]);
  var errPtr = getValue(apiTemp, 'i32');
  if (ret || errPtr) {
    var msg = 'SQLite exception: ' + ret + ', ' + (errPtr ? Pointer_stringify(errPtr) : '');
    if (errPtr) _sqlite3_free(errPtr);
    throw msg;
  }
}

this['SQL'] = Module;


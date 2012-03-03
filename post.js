var apiTemp = Runtime.stackAlloc(4);
var dataTemp;

var callbackTemp = FUNCTION_TABLE.length;
FUNCTION_TABLE[callbackTemp] = function(notUsed, argc, argv, colNames) {
  var curr = [];
  for (var i = 0; i < argc; i++) {
    curr.push({
      'column': Pointer_stringify(getValue(colNames + i*Runtime.QUANTUM_SIZE, 'i32')),
      'value': Pointer_stringify(getValue(argv + i*Runtime.QUANTUM_SIZE, 'i32'))
    });
  }
  dataTemp.push(curr);
};
FUNCTION_TABLE.push(0, 0);

Module['open'] = function(filename) {
  filename = filename || ":memory:";
  var ret = Module['ccall']('sqlite3_open', 'number', ['string', 'number'], [filename, apiTemp]);
  if (ret) throw 'SQLite exception: ' + ret;
  return {
    ptr: getValue(apiTemp, 'i32'),

    'close': function() {
      var ret = Module['ccall']('sqlite3_close', 'number', ['number'], [this.ptr]);
      if (ret) throw 'SQLite exception: ' + ret;
    },

    'exec': function(sql) {
      setValue(apiTemp, 0, 'i32');
      dataTemp = [];
      var ret = Module['ccall']('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number'],
                                [this.ptr, sql, callbackTemp, 0, apiTemp]);
      var errPtr = getValue(apiTemp, 'i32');
      if (ret || errPtr) {
        var msg = 'SQLite exception: ' + ret + (errPtr ? ', ' + Pointer_stringify(errPtr) : '');
        if (errPtr) _sqlite3_free(errPtr);
        throw msg;
      }
      return dataTemp;
    }
  };
};

this['SQL'] = Module;


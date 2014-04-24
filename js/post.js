var apiTemp = Runtime.stackAlloc(4);
var dataTemp;

var sqlite3_open = Module.cwrap('sqlite3_open', 'number', ['string', 'number']);
var sqlite3_close = Module.cwrap('sqlite3_close', 'number', ['number']);
var sqlite3_exec = Module.cwrap('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']);
var sqlite3_free = Module.cwrap('sqlite3_free', '', ['number']);

var callbackTemp = Runtime.addFunction(function(notUsed, argc, argv, colNames) {
	var isNewResult = (dataTemp.length==0);

  var curresult = isNewResult ? null : dataTemp[dataTemp.length-1];
  var curvalues = [], curcolumns = [];

  for (var i = 0; i < argc; i++) {
		var column = Pointer_stringify(getValue(colNames + i*Runtime.QUANTUM_SIZE, 'i32'));
		var value = Pointer_stringify(getValue(argv + i*Runtime.QUANTUM_SIZE, 'i32'));
		curvalues.push(value);
		curcolumns.push(column);

  	if (!isNewResult && column !== curresult.columns[i]) {
			isNewResult = true;
  	}
  }
  if (isNewResult) {
		dataTemp.push({
			'columns' : curcolumns,
			'values' : [curvalues]
		});
  } else {
	  curresult.values.push(curvalues);
  }
});

var fileCounter = 0;

Module['open'] = function(data) {
  var filename = 'file_' + fileCounter++;
  if (data) {
    FS.createDataFile('/', filename, data, true, true);
  }
  var ret = sqlite3_open(filename, apiTemp);
  if (ret) throw 'SQLite exception: ' + ret;
  return {
    ptr: getValue(apiTemp, 'i32'),
    filename: filename,

    'close': function() {
      var ret = sqlite3_close(this.ptr);
      this.ptr = null;
      if (ret) throw 'SQLite exception: ' + ret;
    },

    'exec': function(sql) {
      if (!this.ptr) throw 'Database closed!';
      setValue(apiTemp, 0, 'i32');
      dataTemp = [];
      var ret = sqlite3_exec(this.ptr, sql, callbackTemp, 0, apiTemp);
      var errPtr = getValue(apiTemp, 'i32');
      if (ret || errPtr) {
        var msg = 'SQLite exception: ' + ret + (errPtr ? ', ' + Pointer_stringify(errPtr) : '');
        if (errPtr) sqlite3_free(errPtr);
        throw msg;
      }
      return dataTemp;
    },

    'exportData': function() {
      if (!this.ptr) throw 'Database closed!';
      return new Uint8Array(FS.root.contents[this.filename].contents);
    }
  };
};

this['SQL'] = Module;


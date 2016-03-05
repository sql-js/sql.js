var fs = require("fs");
Error.stackTraceLimit = 200;
var target = process.argv[2];
var file = target ? "../js/sql-"+target+".js" : "../js/sql.js";
var sql = require(file);

var files = fs.readdirSync(__dirname);
for (var i=0; i<files.length; i++) {
  var file = files[i];
  var m = /^test_(.+)\.js$/.exec(file);
  if (m !== null) {
	var name = m[1];
	var testModule = require("./" + file);
	if (testModule.test) exports['test ' + name] = testModule.test.bind(null, sql);
  }
}

if (module == require.main) require('test').run(exports);

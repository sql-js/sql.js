var fs = require("fs");
Error.stackTraceLimit = 200;
var sqlLibType = process.argv[2];
const sqlLibLoader = require('./load_sql_lib');

sqlLibLoader(sqlLibType).then((sql)=>{
  var files = fs.readdirSync(__dirname);
  for (var i=0; i<files.length; i++) {
    var file = files[i];
    var m = /^test_(.+)\.js$/.exec(file);
    if (m !== null) {
      var name = m[1];
      var testModule = require("./" + file);
      if (testModule.test) {
        exports['test ' + name] = testModule.test.bind(null, sql);
      }

    }
  }
  
  if (module == require.main) require('test').run(exports);
})
.catch((e)=>{
  console.error(e);
});

var fs = require("fs");
var nodeAssert = require("node:assert");
Error.stackTraceLimit = 200;
var sqlLibType = process.argv[2];
const sqlLibLoader = require('./load_sql_lib');

function runLegacyTest(testFn) {
  var legacyAssert = Object.create(nodeAssert);
  legacyAssert.throws = function throwsCompat(fn, expected, message) {
    if (typeof expected === "string") {
      if (typeof message === "undefined") {
        return nodeAssert.throws(fn, expected);
      }
      var thrown = null;
      try {
        fn();
      } catch (err) {
        thrown = err;
      }
      nodeAssert.ok(thrown, message || "Expected function to throw");
      nodeAssert.ok(
        String(thrown).indexOf(expected) !== -1,
        message || ("Expected error containing: " + expected)
      );
      return;
    }
    return nodeAssert.throws(fn, expected, message);
  };

  return new Promise(function executor(resolve, reject) {
    var doneCalled = false;
    function done(err) {
      if (doneCalled) return;
      doneCalled = true;
      if (err) reject(err);
      else resolve();
    }

    try {
      var result = testFn(legacyAssert, done);
      if (result && typeof result.then === "function") {
        result.then(function onResolve() {
          if (!doneCalled) resolve();
        }, reject);
      } else if (testFn.length < 2) {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function runAllTests(allTests) {
  var names = Object.keys(allTests);
  var passed = 0;
  var failed = 0;

  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    try {
      await runLegacyTest(allTests[name]);
      passed += 1;
      console.log("OK   " + name);
    } catch (err) {
      failed += 1;
      console.error("FAIL " + name);
      console.error(err && err.stack ? err.stack : err);
    }
  }

  console.log("Passed:" + passed + " Failed:" + failed + " Errors:0");
  process.exit(failed > 0 ? 1 : 0);
}

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
  
  if (module == require.main) {
    runAllTests(exports).catch(function onRunError(err) {
      console.error(err);
      process.exitCode = 1;
    });
  }
})
.catch((e)=>{
  console.error(e);
  process.exitCode = 1;
});

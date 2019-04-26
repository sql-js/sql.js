
// TODO: Instead of using tiny-worker, we could use the new Node 11 workers via
// node --experimental-worker test/all.js 
// Then we could do this:
//const { Worker } = require('worker_threads');
// But it turns out that the worker_threads interface is just different enough not to work. 
var Worker = require("tiny-worker");
var path = require("path");

exports.test = function(notUsed, assert, done) {
  
  // We keep running into issues trying to simulate the worker environment.
  // We really need headless testing of some sort
  console.error("Skipping: This test is 'expected' to fail because tiny-worker and workerjs don't simulate the environment well enough");
  done();
  return;

  // If it thinks it is running in a worker rather than Node, a few things fail. To fix it, in the code replace this:
  //
  //ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  //ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  // 
  // With this:
  //
  //ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB;
  //ENVIRONMENT_IS_WORKER = typeof importScripts === 'function' && !ENVIRONMENT_IS_NODE;
  //

  var target = process.argv[2];
  var file = target ? "sql-"+target : "sql-wasm";
  // If we use tiny-worker, we need to pass in this new cwd as the root of the file being loaded:
  const filename = "../dist/worker."+file+".js";
  var worker = new Worker(path.join(__dirname, filename), null, { cwd: path.join(__dirname, "../dist/") });
  
  // The following tests are continually overwriting worker.onmessage so that they 

  worker.onmessage = function(event) {
    var data = event.data;
    assert.strictEqual(data.id, 1, "Return the given id in the correct format");
    assert.deepEqual(data, {id:1, ready:true}, 'Correct data answered to the "open" query');

    worker.onmessage = function(event) {
      var data = event.data;
      assert.strictEqual(data.id, 2, "Correct id");
      var results = data.results;
      assert.strictEqual(Array.isArray(results), true, 'Correct result type');
      var row = results[0];
      assert.strictEqual(typeof row, 'object', 'Type of the returned row');
      assert.deepEqual(row.columns, ['num', 'str', 'hex'], 'Reading column names');
      assert.strictEqual(row.values[0][0], 1, 'Reading number');
      assert.strictEqual(row.values[0][1], 'a', 'Reading string');
      // Disabled because of our node worker library
      // assert.deepEqual(Array.from(row.values[0][2]), [0x00, 0x42], 'Reading BLOB');

      worker.onmessage = function(event) {
        var data = event.data;

        if (!data.finished) {
          data.row.hex = Array.from(data.row.hex);
          // assert.deepEqual(data.row, {num:1, str:'a', hex: [0x00, 0x42]}, "Read row from db.each callback");
        } else {
          worker.onmessage = function(event, a) {
            var data = event.data;
            buffer = []
            for(var p in data.buffer) {
              buffer += data.buffer[p]
            }
            assert.equal(typeof buffer.length, 'number', 'Export returns data');
            assert.notEqual(buffer.length, 0, 'Data returned is not empty');
            done();
          }
          worker.postMessage({action:'export'});
        }
      }
      worker.postMessage ({
        action: 'each',
        sql: 'SELECT * FROM test'
      })
    }
    var sqlstr = "CREATE TABLE test (num, str, hex);";
    sqlstr += "INSERT INTO test VALUES (1, 'a', x'0042');";
    sqlstr += "SELECT * FROM test;";
    worker.postMessage({
      id: 2,
      action: 'exec',
      sql: sqlstr
    });
  }
  worker.onerror = function (e) {
    // This doesn't appear to get thrown if there is an eval error in the worker
    console.log("Threw error: ", e);
    assert.fail(new Error(e),null,"Sould not throw an error");
    done();
  }
  worker.postMessage({id:1, action: 'open'});

  setTimeout(function ontimeout (){
    assert.fail(new Error("Worker should answer in less than 3 seconds"));
    done();
  }, 3000);
}

if (!Array.from) {
  Array.from = function(pseudoarray) {
    return Array.prototype.slice.call(pseudoarray);
  };
}

if (module == require.main) {
  process.on('unhandledRejection', r => console.log(r));

  require('test').run({
    'test worker': function(assert, done){
      exports.test(null, assert, done);
    }
  });

}

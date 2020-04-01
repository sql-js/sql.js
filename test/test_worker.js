// TODO: Instead of using puppeteer, we could use the new Node 11 workers via
// node --experimental-worker test/all.js
// Then we could do this:
//const { Worker } = require('worker_threads');
// But it turns out that the worker_threads interface is just different enough not to work.
var puppeteer = require("puppeteer");
var path = require("path");
var fs = require("fs");

exports.test = async function test(SQL, assert) {
  var target = process.argv[2];
  // init file
  var file = target ? "sql-" + target : "sql-wasm";
  if (file.indexOf('wasm') > -1 || file.indexOf('memory-growth') > -1) {
    console.error("Skipping worker test for " + file + ". Not implemented yet");
    return;
  };
  // If we use puppeteer, we need to pass in this new cwd as the root of the file being loaded:
  file = path.join(__dirname, "../dist/" + file + ".js");
  // test isomorphism - web-worker code can be safely loaded in nodejs
  require(file);
  // init puppeteer
  var browser = await puppeteer.launch({args:["--no-sandbox"]});
  var page = await browser.newPage();
  // inject file as <script> tag
  page.addScriptTag({ path: file });
  // wait 1 second for <script> tag to begin loading
  await page.waitFor(1000);
  // use builtin SQL.Worker
  var worker = await page.evaluateHandle(function (source) {
    return new Promise(async function (resolve) {
        var SQL = await initSqlJs();
        var url = URL.createObjectURL(new Blob([source]), { type: 'application/javascript; charset=utf-8' });
        resolve(new SQL.Worker(url));
    });
  }, fs.readFileSync(file, 'utf8'));
  // use builtin SQL.Worker.prototype.postMessage
  worker.postMessage = async function (msg) {
      return await worker.evaluate(function (worker, msg) {
          return worker.postMessage(msg);
      }, msg);
  };
  //!! console.error(worker);
  var data = await worker.postMessage({ action: 'open' });
  assert.strictEqual(data.id, 1, "Return the given id in the correct format");
  assert.deepEqual(data, { id: 1, ready: true }, 'Correct data answered to the "open" query');

  data = await worker.postMessage({
    action: 'exec',
    params: {
        ":num2": 2,
        "@str2": 'b',
        // test_worker.js has issue message-passing Uint8Array
        // but it works fine in real-world browser-usage
        // "$hex2": new Uint8Array([0x00, 0x42]),
        ":num3": 3,
        "@str3": 'c'
        // "$hex3": new Uint8Array([0x00, 0x44])
    },
    sql: "CREATE TABLE test (num, str, hex);" +
      "INSERT INTO test VALUES (1, 'a', x'0042');" +
      "INSERT INTO test VALUES (:num2, @str2, x'0043');" +
      // test passing params split across multi-statement "exec"
      "INSERT INTO test VALUES (:num3, @str3, x'0044');" +
      "SELECT * FROM test;"
  });
  assert.strictEqual(data.id, 2, "Correct id");
  // debug error
  assert.strictEqual(data.error, undefined, data.error);
  var results = data.results;
  assert.ok(Array.isArray(results), 'Correct result type');
  assert.strictEqual(results.length, 1, 'Expected exactly 1 table');
  var table = results[0];
  assert.strictEqual(typeof table, 'object', 'Type of the returned table');
  assert.deepEqual(table.columns, ['num', 'str', 'hex'], 'Reading column names');
  assert.strictEqual(table.values[0][0], 1, 'Reading number');
  assert.strictEqual(table.values[0][1], 'a', 'Reading string');
  assert.deepEqual(obj2array(table.values[0][2]), [0x00, 0x42], 'Reading BLOB byte');
  assert.strictEqual(table.values[1][0], 2, 'Reading number');
  assert.strictEqual(table.values[1][1], 'b', 'Reading string');
  assert.deepEqual(obj2array(table.values[1][2]), [0x00, 0x43], 'Reading BLOB byte');
  assert.strictEqual(table.values[2][0], 3, 'Reading number');
  assert.strictEqual(table.values[2][1], 'c', 'Reading string');
  assert.deepEqual(obj2array(table.values[2][2]), [0x00, 0x44], 'Reading BLOB byte');

  data = await worker.postMessage({ action: 'export' });
  var header = "SQLite format 3\0";
  var actual = "";
  for (let i = 0; i < header.length; i++) actual += String.fromCharCode(data.buffer[i]);
  assert.equal(actual, header, 'Data returned is an SQLite database file');
}

function obj2array(obj) {
  var buffer = []
  for (var p in obj) { buffer[p] = obj[p] }
  return buffer;
}

if (module == require.main) {
  process.on('unhandledRejection', r => console.log(r));

  require('test').run({
    'test worker': function (assert, done) {
      exports.test(null, assert).then(done);
    }
  });

}

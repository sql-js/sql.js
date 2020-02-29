// TODO: Instead of using tiny-worker, we could use the new Node 11 workers via
// node --experimental-worker test/all.js 
// Then we could do this:
//const { Worker } = require('worker_threads');
// But it turns out that the worker_threads interface is just different enough not to work. 
var puppeteer = require("puppeteer");
var path = require("path");
var fs = require("fs");

class Worker {
  constructor(handle) {
    this.handle = handle;
  }
  static async fromFile(file) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const source = fs.readFileSync(file, 'utf8');
    const worker = await page.evaluateHandle(x => {
      const url = URL.createObjectURL(new Blob([x]), { type: 'application/javascript; charset=utf-8' });
      return new Worker(url);
    }, source);
    return new Worker(worker);
  }
  async postMessage(msg) {
    return await this.handle.evaluate((worker, msg) => {
      return new Promise((accept, reject) => {
        setTimeout(reject, 20000, new Error("time out"));
        worker.onmessage = evt => accept(evt.data);
        worker.onerror = reject;
        worker.postMessage(msg);
      })
    }, msg);
  }
}

exports.test = async function test(SQL, assert) {
  var target = process.argv[2];
  var file = target ? "sql-" + target : "sql-wasm";
  if (file.indexOf('wasm') > -1 || file.indexOf('memory-growth') > -1) {
    console.error("Skipping worker test for " + file + ". Not implemented yet");
    return;
  };
  // If we use tiny-worker, we need to pass in this new cwd as the root of the file being loaded:
  const filename = "../dist/worker." + file + ".js";
  var worker = await Worker.fromFile(path.join(__dirname, filename));
  var data = await worker.postMessage({ id: 1, action: 'open' });
  assert.strictEqual(data.id, 1, "Return the given id in the correct format");
  assert.deepEqual(data, { id: 1, ready: true }, 'Correct data answered to the "open" query');

  data = await worker.postMessage({
    id: 2,
    action: 'exec',
    sql: "CREATE TABLE test (num, str, hex);" +
      "INSERT INTO test VALUES (1, 'a', x'0042');" +
      "SELECT * FROM test;"
  });
  assert.strictEqual(data.id, 2, "Correct id");
  var results = data.results;
  assert.ok(Array.isArray(results), 'Correct result type');
  assert.strictEqual(results.length, 1, 'Expected exactly 1 row');
  var row = results[0];
  assert.strictEqual(typeof row, 'object', 'Type of the returned row');
  assert.deepEqual(row.columns, ['num', 'str', 'hex'], 'Reading column names');
  assert.strictEqual(row.values[0][0], 1, 'Reading number');
  assert.strictEqual(row.values[0][1], 'a', 'Reading string');
  assert.deepEqual(obj2array(row.values[0][2]), [0x00, 0x42], 'Reading BLOB byte');

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

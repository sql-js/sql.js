// TODO: Instead of using puppeteer, we could use the new Node 11 workers via
// node --experimental-worker test/all.js
// Then we could do this:
//const { Worker } = require('worker_threads');
// But it turns out that the worker_threads interface is just different enough not to work.
var puppeteer = require("puppeteer");
var path = require("path");
var fs = require("fs");
const { env } = require("process");

class Worker {
  constructor(handle) {
    this.handle = handle;
  }
  static async fromFile(file) {
    const browser = await Worker.launchBrowser();
    const page = await browser.newPage();
    const source = fs.readFileSync(file, 'utf8');
    const worker = await page.evaluateHandle(x => {
      const url = URL.createObjectURL(new Blob([x]), { type: 'application/javascript; charset=utf-8' });
      return new Worker(url);
    }, source);
    return new Worker(worker);
  }

  static async launchBrowser(){
    try{
      return await puppeteer.launch({ headless: "new" });
    }
    catch(e){
      if (e.stack.includes('No usable sandbox!')){
        // It's possible that this exception is n expected error related to not having the ability to create a sandboxed user for Puppeteer in Docker. 
        // One way around this is to set up the Dockerfile to have a sandboxed user.
        // Details on getting Puppeteer running sandboxed while in Docker are here:
        // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker 
        // That seemed kinda complicated, so I'm working around it more quickly/straightforwardly by looking for an env variable we set in the Docker fil `RUN_WORKER_TEST_WITHOUT_PUPPETEER_SANDBOX`. 
        // -- Taytay
        if (env['RUN_WORKER_TEST_WITHOUT_PUPPETEER_SANDBOX']=="1"){
          // This tells puppeteer to launch without worrying about the sandbox.
          // That's not "safe" if you don't trust the code you're loading in the browser, 
          // but we're in a container and we know what we're testing.
          return await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new'
          });
        }
        else {
          console.warn("Puppeteer can't start due to a sandbox error. (Details follow.)\nFor a quick, but potentially dangerous workaround, you can set the environment variable 'RUN_WORKER_TEST_WITHOUT_PUPETEER_SANDBOX=1'.\nYou can also simply run this test in the Docker container defined in .devcontainer/Dockerfile.");
        }
      }
      // If we're here, we couldn't get out of this cleanly. Re-throw
      throw e;
    }
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
  // If we use puppeteer, we need to pass in this new cwd as the root of the file being loaded:
  const filename = "../dist/worker." + file + ".js";
  var worker = await Worker.fromFile(path.join(__dirname, filename));
  var data = await worker.postMessage({ id: 1, action: 'open' });
  assert.strictEqual(data.id, 1, "Return the given id in the correct format");
  assert.deepEqual(data, { id: 1, ready: true }, 'Correct data answered to the "open" query');

  data = await worker.postMessage({
    id: 2,
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

  // test worker properly opens db after closing
  await worker.postMessage({ action: "close" });
  await worker.postMessage({ action: "open" });
  data = await worker.postMessage({ action: "exec", sql: "SELECT 1" });
  assert.deepEqual(data.results, [{"columns":["1"],"values":[[1]]}]);
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

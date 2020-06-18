// TODO: Instead of using puppeteer, we could use the new Node 11 workers via
// node --experimental-worker test/all.js
// Then we could do this:
// const { Worker } = require('worker_threads');
// But it turns out that the worker_threads interface is just different enough
// not to work.

"use strict";

var fs = require("fs");
var path = require("path");
var puppeteer = require("puppeteer");

function obj2array(obj) {
    var buffer = [];
    Object.entries(obj).forEach(function (elem) {
        buffer[elem[0]] = elem[1];
    });
    return buffer;
}

function Worker(handle) {
    this.handle = handle;
}

Worker.fromFile = function (file) {
    return puppeteer.launch({
        // uncomment line below if running test inside docker as root
        // args: ["--no-sandbox"]
    }).then(function (browser) {
        return browser.newPage();
    }).then(function (page) {
        return page.evaluateHandle(function (x) {
            return new Worker(URL.createObjectURL(
                new Blob([x]),
                { type: "application/javascript; charset=utf-8" }
            ));
        }, fs.readFileSync(file, "utf8"));
    }).then(function (worker) {
        return new Worker(worker);
    });
};

Worker.prototype.postMessage = function (msg) {
    return this.handle.evaluate(function (worker, msg2) {
        return new Promise(function (accept, reject) {
            setTimeout(
                reject,
                20000,
                new Error("time out")
            );
            worker.onmessage = function (evt) {
                return accept(evt.data);
            };
            worker.onerror = reject;
            worker.postMessage(msg2);
        });
    }, msg);
};

exports.test = function test(SQL, assert) {
    var file;
    var promise;
    var worker;
    promise = Promise.resolve();
    file = (
        process.argv[2]
            ? "sql-" + process.argv[2]
            : "sql-wasm"
    );
    if (file.indexOf("wasm") > -1 || file.indexOf("memory-growth") > -1) {
        console.error(
            "Skipping worker test for " + file + ". Not implemented yet"
        );
        return promise;
    }
    // If we use puppeteer, we need to pass in this new cwd as the root
    // of the file being loaded:
    promise = promise.then(function () {
        return Worker.fromFile(
            path.join(__dirname, "../dist/worker." + file + ".js")
        );
    });
    promise = promise.then(function (data) {
        worker = data;
        return worker.postMessage({ id: 1, action: "open" });
    });
    promise = promise.then(function (data) {
        assert.strictEqual(
            data.id,
            1,
            "Return the given id in the correct format"
        );
        assert.deepEqual(
            data,
            { id: 1, ready: true },
            "Correct data answered to the \"open\" query"
        );
        return worker.postMessage({
            id: 2,
            action: "exec",
            params: {
                ":num2": 2,
                "@str2": "b",
                // test_worker.js has issue message-passing Uint8Array
                // but it works fine in real-world browser-usage
                // "$hex2": new Uint8Array([0x00, 0x42]),
                ":num3": 3,
                "@str3": "c"
            // "$hex3": new Uint8Array([0x00, 0x44])
            },
            sql: "CREATE TABLE test (num, str, hex);"
          + "INSERT INTO test VALUES (1, 'a', x'0042');"
          + "INSERT INTO test VALUES (:num2, @str2, x'0043');"
          // test passing params split across multi-statement "exec"
          + "INSERT INTO test VALUES (:num3, @str3, x'0044');"
          + "SELECT * FROM test;"
        });
    });
    promise = promise.then(function (data) {
        var results;
        var table;
        assert.strictEqual(data.id, 2, "Correct id");
        // debug error
        assert.strictEqual(data.error, undefined, data.error);
        results = data.results;
        assert.ok(Array.isArray(results), "Correct result type");
        assert.strictEqual(results.length, 1, "Expected exactly 1 table");
        table = results[0];
        assert.strictEqual(
            typeof table,
            "object",
            "Type of the returned table"
        );
        assert.deepEqual(
            table.columns,
            ["num", "str", "hex"],
            "Reading column names"
        );
        assert.strictEqual(table.values[0][0], 1, "Reading number");
        assert.strictEqual(table.values[0][1], "a", "Reading string");
        assert.deepEqual(
            obj2array(table.values[0][2]),
            [0x00, 0x42],
            "Reading BLOB byte"
        );
        assert.strictEqual(table.values[1][0], 2, "Reading number");
        assert.strictEqual(table.values[1][1], "b", "Reading string");
        assert.deepEqual(
            obj2array(table.values[1][2]),
            [0x00, 0x43],
            "Reading BLOB byte"
        );
        assert.strictEqual(table.values[2][0], 3, "Reading number");
        assert.strictEqual(table.values[2][1], "c", "Reading string");
        assert.deepEqual(
            obj2array(table.values[2][2]),
            [0x00, 0x44],
            "Reading BLOB byte"
        );
        return worker.postMessage({ action: "export" });
    });
    promise = promise.then(function (data) {
        var actual;
        var header;
        var i;
        actual = "";
        header = "SQLite format 3\0";
        for (i = 0; i < header.length; i += 1) {
            actual += String.fromCharCode(data.buffer[i]);
        }
        assert.equal(
            actual,
            header,
            "Data returned is an SQLite database file"
        );
        // test worker properly opens db after closing
        return worker.postMessage({ action: "close" });
    });
    promise = promise.then(function () {
        return worker.postMessage({ action: "open" });
    });
    promise = promise.then(function () {
        return worker.postMessage({ action: "exec", sql: "SELECT 1" });
    });
    promise = promise.then(function (data) {
        assert.deepEqual(data.results, [{ columns: ["1"], values: [[1]] }]);
    });
    return promise;
};

if (module === require.main) {
    process.on("unhandledRejection", function (r) {
        throw r;
    });
    require("test").run({
        "test worker": function (assert, done) {
            exports.test(null, assert).then(done);
        }
    });
}

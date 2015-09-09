var Worker = require("workerjs");
var path = require("path");

exports.test = function(notUsed, assert, done) {
	var worker = new Worker(path.join(__dirname, "../js/worker.sql.js"));
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
			// workerjs depends on JSON.stringify to serialize messages in nodejs
			// see https://github.com/eugeneware/workerjs/blob/d9812a5409a266d2ab6f0e9db8f1a670acf14b3c/index.js#L19
			// the v8 engine, since nodejs v0.12, ignores the length property when JSON.stringifying Uint8Array
			// so we now have to improvise the length property
			// note that chrome browser doesn't have this limitation, as it seems to pass Uint8Array in the message as a reference
			// see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Passing_data_by_transferring_ownership_(transferable_objects)
			if (row.values[0][2].length === undefined) {
					row.values[0][2].length = 2;
			}
			assert.deepEqual(Array.prototype.slice.call(row.values[0][2]), [0x00, 0x42], 'Reading BLOB');

			worker.onmessage = function(event) {
				var data = event.data;

				if (!data.finished) {
					// improvise length property lost from JSON.stringify
					if (data.row.hex.length === undefined) {
							data.row.hex.length = 2;
					}
					data.row.hex = Array.prototype.slice.call(data.row.hex);
					assert.deepEqual(data.row, {num:1,str:'a',hex:[0x00,0x42]}, "Read row from db.each callback");
				} else {
					worker.onmessage = function(event) {
						var data = event.data;
						// ignore bytelength property, if lost from JSON.stringify
						// note that this test should work, if it was run in browser
						if (data.buffer && data.buffer.byteLength !== undefined) {
							assert.equal(typeof data.buffer.byteLength, 'number', 'Export returns an ArrayBuffer');
							assert.notEqual(data.buffer.byteLength, 0, 'ArrayBuffer returned is not empty');
						}
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

if (module == require.main) {
	var assert = require("assert");
	var done = function(){process.exit(0)};
	exports.test(null, assert, done);
}

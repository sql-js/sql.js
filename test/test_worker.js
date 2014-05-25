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
			assert.deepEqual(Array.prototype.slice.call(row.values[0][2]), [0x00, 0x42], 'Reading BLOB');

			worker.onmessage = function(event) {
				var data = event.data;

				if (!data.finished) {
					data.row.hex = Array.prototype.slice.call(data.row.hex);
					assert.deepEqual(data.row, {num:1,str:'a',hex:[0x00,0x42]}, "Read row from db.each callback");
				} else {
					worker.onmessage = function(event) {
						var data = event.data;
						assert.equal(typeof data.buffer.byteLength, 'number', 'Export returns an ArrayBuffer');
						assert.notEqual(data.buffer.byteLength, 0, 'ArrayBuffer returned is not empty');
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

exports.test = function(sql, assert){
  // Create a database
  var db = new sql.Database();

  // Create table, insert data
  sqlstr = "CREATE TABLE IF NOT EXISTS Test_BigInt (someNumber BIGINT NOT NULL);" +
  "INSERT INTO Test_BigInt (someNumber) VALUES (1628675501000);";
  db.exec(sqlstr);

  var config = {useBigInt: true};

  var stmt = db.prepare("SELECT * FROM Test_BigInt;");
  stmt.step();

  assert.strictEqual(typeof stmt.get()[0], 'number', "Reading number value");
  assert.strictEqual(typeof stmt.get(null, config)[0], 'bigint', "Reading bigint value");
  stmt.free();

  // Binding a BigInt
  var probe = db.prepare("SELECT typeof(?1), ?1");
  var bound = function(value) {
    var row = probe.get([value], config);
    probe.reset();
    return row;
  };
  assert.deepEqual(bound(BigInt(42)), ["integer", BigInt(42)],
    "A BigInt is bound as an INTEGER");
  assert.deepEqual(bound(BigInt(-42)), ["integer", BigInt(-42)],
    "A negative BigInt is bound as an INTEGER");
  assert.deepEqual(bound(BigInt("9007199254740993")),
    ["integer", BigInt("9007199254740993")],
    "A BigInt past Number.MAX_SAFE_INTEGER is bound exactly");
  assert.deepEqual(bound(BigInt("9223372036854775807")),
    ["integer", BigInt("9223372036854775807")],
    "The largest 64-bit integer is bound exactly");
  assert.deepEqual(bound(BigInt("-9223372036854775808")),
    ["integer", BigInt("-9223372036854775808")],
    "The smallest 64-bit integer is bound exactly");
  assert.deepEqual(bound(BigInt("-4294967296")),
    ["integer", BigInt("-4294967296")],
    "A BigInt with a zero low word is bound exactly");

  assert.throws(function() {
    probe.bind([BigInt("9223372036854775808")]);
  }, RangeError, "A BigInt above the 64-bit range is refused");
  assert.throws(function() {
    probe.bind([BigInt("-9223372036854775809")]);
  }, RangeError, "A BigInt below the 64-bit range is refused");
  probe.free();

  // A bound BigInt compares as an integer, not as text
  db.run("CREATE TABLE ids (id INTEGER PRIMARY KEY, name TEXT)");
  db.run("INSERT INTO ids VALUES (?, 'big')", [BigInt("9007199254740995")]);
  assert.deepEqual(
    db.exec("SELECT name FROM ids WHERE id = ?", [BigInt("9007199254740995")]),
    [{columns: ["name"], values: [["big"]]}],
    "A BigInt parameter matches the integer it was stored as");
  assert.deepEqual(
    db.exec("SELECT ? + 1", [BigInt(41)]),
    [{columns: ["? + 1"], values: [[42]]}],
    "A BigInt parameter takes part in arithmetic as an integer");

  var named = db.prepare("SELECT typeof(:v), :v");
  assert.deepEqual(
    named.get({":v": BigInt("-9007199254740993")}, config),
    ["integer", BigInt("-9007199254740993")],
    "A BigInt bound by name is bound as an INTEGER");
  named.free();

  db.close();
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test big int': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

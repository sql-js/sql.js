const fs = require("node:fs");
const path = require("node:path");

async function initialize(config) {
  const target = process.argv[2] || "wasm";
  const file = require.resolve("../dist/sql-" + target + ".js");
  const cached = require.cache[file];
  delete require.cache[file];
  const initSqlJs = require(file);
  require.cache[file] = cached;
  if (target.startsWith("wasm") && !target.includes("inline")) {
    config.wasmBinary = fs.readFileSync(path.join(
      __dirname, "../dist/sql-" + target + ".wasm"
    ));
  }
  return initSqlJs(config);
}

exports.test = async function(SQL, assert) {
  const warnings = [];
  const warn = console.warn;
  console.warn = message => warnings.push(message);
  try {
    await testFunctions(assert, warnings);
  } finally {
    console.warn = warn;
  }
};

async function testFunctions(assert, warnings) {
  for (const config of [{}, { useOldExtensionFunctions: true }]) {
    warnings.length = 0;
    const SQL = await initialize(config);
    const db = new SQL.Database();
    try {
      db.exec("SELECT 42");
      assert.deepEqual(db.exec(`SELECT ln(1), log2(8), mod(5.5, 2),
        trunc(-1.9), pow(2, 3), ceiling(1.2), log(2, 8)`)[0].values,
      [[0, 3, 1.5, -1, 8, 2, 3]],
      "Native-only names and arities are available in legacy mode");
      assert.deepEqual(warnings, [],
        "Initialization, opening databases and native functions do not warn");
      assert.deepEqual(db.exec(`SELECT log(100), sqrt('abc'),
        sign('abc'), typeof(sign(2.5)), reverse('abc')`)[0].values,
      [[Math.log(100), 0, 0, "real", "cba"]]);
      assert.equal(warnings.length, 5, "Each legacy scalar call warns");
      assert.ok(warnings.every(message =>
        message.includes("deprecated") &&
        message.includes("next major version") &&
        message.includes("https://github.com/sql-js/sql.js/pull/647")
      ), "Usage warnings explain deprecation and link to the discussion");
      assert.ok(warnings[0].includes("log()"), "Warnings name the function");
      warnings.length = 0;
      db.exec("SELECT reverse(x) FROM (SELECT 'a' AS x UNION ALL SELECT 'b')");
      assert.equal(warnings.length, 2, "Legacy calls on separate rows each warn");
      warnings.length = 0;
      assert.deepEqual(db.exec(`SELECT stdev(x), variance(x), mode(x),
        median(x), lower_quartile(x), upper_quartile(x)
        FROM (SELECT 2 AS x UNION ALL SELECT 2)`)[0].values,
      [[0, 0, 2, 2, 2, 2]], "Legacy aggregates keep their results");
      assert.equal(warnings.length, 6, "Each legacy aggregate result warns");
      warnings.length = 0;
      db.exec("SELECT median(x) FROM (SELECT 1 AS x WHERE 0)");
      assert.equal(warnings.length, 1, "Empty aggregates also warn");
    } finally {
      db.close();
    }
  }

  warnings.length = 0;
  const native = await initialize({ useOldExtensionFunctions: false });
  const db = new native.Database();
  try {
    assert.deepEqual(db.exec(`SELECT log(100), ln(1), log(2, 8),
      sqrt('abc'), sign('abc'), sign(x'01'), sign(''),
      typeof(sign(2.5))`)[0].values,
    [[2, 0, 3, null, null, null, null, "integer"]]);
    db.run("CREATE TABLE t(a); CREATE INDEX ti ON t(sign(a));" +
      "CREATE TABLE g(a, b GENERATED ALWAYS AS (sign(a)));");
    db.run("INSERT INTO g(a) VALUES (-2.5), ('abc')");
    assert.deepEqual(db.exec("SELECT b FROM g")[0].values, [[-1], [null]],
      "Native sign works in generated columns");
    const reopened = new native.Database(db.export());
    try {
      assert.deepEqual(reopened.exec("SELECT b FROM g")[0].values,
        [[-1], [null]], "Schemas using native sign survive export and reopen");
    } finally {
      reopened.close();
    }
    for (const expression of [
      "atn2(1, 1)", "square(2)", "cot(1)", "coth(1)",
      "replicate('a', 2)", "difference('a', 'b')",
      "charindex('a', 'abc')", "charindex('a', 'abc', 1)",
      "leftstr('abc', 1)", "rightstr('abc', 1)", "reverse('abc')",
      "proper('abc')", "padl('a', 2)", "padr('a', 2)", "padc('a', 2)",
      "strfilter('abc', 'ab')", "stdev(1)", "variance(1)", "mode(1)",
      "median(1)", "lower_quartile(1)", "upper_quartile(1)"
    ]) {
      assert.throws(() => db.exec("SELECT " + expression), /no such function/,
        expression + " is not registered in native mode");
    }
  } finally {
    db.close();
  }
  assert.deepEqual(warnings, [], "Native mode does not warn");
}

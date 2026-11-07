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
  const warnings = [];
  const warn = console.warn;
  console.warn = message => warnings.push(message);
  try {
    return { SQL: await initSqlJs(config), warnings };
  } finally {
    console.warn = warn;
  }
}

exports.test = async function(SQL, assert) {
  for (const config of [{}, { useOldExtensionFunctions: true }]) {
    const legacy = await initialize(config);
    assert.ok(legacy.warnings.some(message =>
      message.includes("deprecated") &&
      message.includes("next major version") &&
      message.includes("https://github.com/sql-js/sql.js/pull/619")
    ), "Legacy mode warns with migration context");
    const db = new legacy.SQL.Database();
    try {
      assert.deepEqual(db.exec(`SELECT log(100), sqrt('abc'),
        sign('abc'), typeof(sign(2.5)), reverse('abc')`)[0].values,
      [[Math.log(100), 0, 0, "real", "cba"]]);
      assert.deepEqual(db.exec(`SELECT ln(1), log2(8), mod(5.5, 2),
        trunc(-1.9), pow(2, 3), ceiling(1.2), log(2, 8)`)[0].values,
      [[0, 3, 1.5, -1, 8, 2, 3]],
      "Native-only names and arities are available in legacy mode");
    } finally {
      db.close();
    }
  }

  const native = await initialize({ useOldExtensionFunctions: false });
  assert.deepEqual(native.warnings, [], "Native mode does not warn");
  const db = new native.SQL.Database();
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
    const reopened = new native.SQL.Database(db.export());
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
};

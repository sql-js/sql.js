exports.test = async function(sql, assert) {
  // Use database with a specified VFS.
  async function doVFS(vfs, filename) {
    const db = sql.Database.with_vfs(vfs, filename);
    try {
      db.run("CREATE TABLE tbl (x, y);");
      db.run("INSERT INTO tbl VALUES ('foo', 0), ('bar', 1), ('baz', 2);");
      return db.exec("SELECT SUM(y) FROM tbl;");
    } finally {
      db.close();
    }
  }

  let result;
  result = await doVFS("unix", "db");
  assert.strictEqual(result[0].values[0][0], 3, 'built-in unix VFS executes SQL');

  result = await doVFS("unix-none", "db");
  assert.strictEqual(result[0].values[0][0], 3, 'built-in unix-none VFS executes SQL');

  result = await doVFS("unregistered", "db").catch(e => e);
  assert.ok(result instanceof Error, 'unregistered VFS throws');

  // Export database with a specified filename.
  async function doExport(vfs, filename) {
    const db = sql.Database.with_vfs(vfs, filename);
    try {
      db.run("CREATE TABLE tbl (x, y);");
      db.run("INSERT INTO tbl VALUES ('foo', 0), ('bar', 1);");
      const exported = db.export();
      return String.fromCharCode.apply(null, exported.subarray(0,6));
    } finally {
      db.close();
    }
  }

  result = await doExport("unix", "foo");
  assert.strictEqual(result, "SQLite", 'built-in VFS exports');

  result = await doExport("unix", ":memory:").catch(e => e);
  assert.ok(result instanceof Error, ':memory: throws on export');
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test with_vfs': function(assert){
        return exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

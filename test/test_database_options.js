exports.test = async function(sql, assert) {
  async function doVFS(vfs) {
    var db = new sql.Database(null, { vfs });
    db.run("CREATE TABLE tbl (x, y);");
    db.run("INSERT INTO tbl VALUES ('foo', 0), ('bar', 1);");
    return db.exec("SELECT * FROM tbl;");
  }

  const vfsNone = await doVFS();
  assert.ok(vfsNone, 'no VFS executes SQL');

  const vfsValid = await doVFS("unix-none")
  assert.ok(vfsValid, 'valid VFS executes SQL');

  const vfsInvalid = await doVFS("not a vfs").catch(e => e);
  assert.ok(vfsInvalid instanceof Error, 'invalid VFS throws');

  async function doExport(filename) {
    // Specify database name
    var db = new sql.Database(null, { filename });
    db.run("CREATE TABLE tbl (x, y);");
    db.run("INSERT INTO tbl VALUES ('foo', 0), ('bar', 1);");

    // Check that export works.
    var binaryArray = db.export();
    db.close();
    return binaryArray;
  }

  const exportFile = await doExport('foo');
  assert.strictEqual(
      String.fromCharCode.apply(null, exportFile.subarray(0,6)), 'SQLite',
      'export custom filename valid');

  const exportMem = await doExport(':memory:').catch(e => e);
  assert.strictEqual(exportMem instanceof Error, true, 'export :memory: throws');
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test database options': function(assert){
        return exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

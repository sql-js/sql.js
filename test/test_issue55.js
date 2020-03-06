exports.test = function(SQL, assert) {
  var fs = require('fs');
  var path = require('path');

  var filebuffer = fs.readFileSync(path.join(__dirname, 'issue55.db'));

  //Works
  var db = new SQL.Database(filebuffer);

  var origCount = db.prepare("SELECT COUNT(*) AS count FROM networklocation").getAsObject({}).count;

  db.run("INSERT INTO networklocation (x, y, network_id, floor_id) VALUES (?, ?, ?, ?)", [123, 123, 1, 1]);

  var count = db.prepare("SELECT COUNT(*) AS count FROM networklocation").getAsObject({}).count;

  assert.equal(count, origCount + 1, "The row has been inserted");
  var dbCopy = new SQL.Database(db.export());
  var newCount = dbCopy.prepare("SELECT COUNT(*) AS count FROM networklocation").getAsObject({}).count;
  assert.equal(newCount, count, "export and reimport copies all the data");
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test issue 55': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}


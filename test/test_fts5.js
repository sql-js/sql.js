exports.test = function(sql, assert){
  // Create a database
  var db = new sql.Database();

  // Create table, insert data
  db.exec("CREATE VIRTUAL TABLE Test_Fts5 USING fts5(text);");
  db.exec("INSERT INTO Test_Fts5 VALUES ('welcome home'), ('wonderful'), ('thanks for all the fish');");

  var res = db.exec("SELECT * FROM Test_Fts5 WHERE Test_Fts5 MATCH 'welcome';");
  assert.deepEqual(res[0].values, [["welcome home"]], "full text search results");

  db.close();
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test errors': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
  });
}

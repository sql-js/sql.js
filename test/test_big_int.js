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

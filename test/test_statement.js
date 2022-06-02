
exports.test = function(sql, assert){
    // Create a database
    var db = new sql.Database();

    // Execute some sql
    sqlstr = "CREATE TABLE alphabet (letter, code);";
    db.exec(sqlstr);

    var result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    assert.deepEqual(result, [{columns:['name'], values:[['alphabet']]}],
                                    "Table properly created");

    // Prepare a statement to insert values in tha database
    var stmt = db.prepare("INSERT INTO alphabet (letter,code) VALUES (?,?)");
    // Execute the statement several times
    stmt.run(['a',1]);
    stmt.run(['b',2.2]);
    stmt.run(['c']); // The second parameter will be bound to NULL

    // Free the statement
    stmt.free();

    result = db.exec("SELECT * FROM alphabet");
    assert.deepEqual(result,
                     [{columns:['letter', 'code'], values:[['a',1],['b',2.2],['c',null]]}],
                            "Statement.run() should have added data to the database");

    db.run("CREATE TABLE data (nbr, str, no_value); INSERT INTO data VALUES (5, '粵語😄', NULL);");
    stmt = db.prepare("SELECT * FROM data");
    stmt.step(); // Run the statement
    assert.deepEqual(stmt.getColumnNames(), ['nbr','str','no_value'], 'Statement.GetColumnNames()');
    var res = stmt.getAsObject();
    assert.strictEqual(res.nbr, 5, 'Read number');
    assert.strictEqual(res.str, '粵語😄', "Read string");
    assert.strictEqual(res.no_value, null, "Read null");
    assert.deepEqual(res, {nbr:5, str:'粵語😄', no_value:null}, "Statement.getAsObject()");
    stmt.free();

    // getColumnNames() should work even if query returns no data 
    stmt = db.prepare("SELECT * FROM data WHERE nbr = -1");
    assert.deepEqual(stmt.getColumnNames(), ['nbr','str','no_value'], 'Statement.GetColumnNames()');
    stmt.free();

    stmt = db.prepare("SELECT str FROM data WHERE str=?");
    assert.deepEqual(stmt.getAsObject(['粵語😄']), {'str':'粵語😄'}, "UTF8 support in prepared statements");

    // Prepare an sql statement
    stmt = db.prepare("SELECT * FROM alphabet WHERE code BETWEEN :start AND :end ORDER BY code");
    // Bind values to the parameters
    stmt.bind([0, 256]);
    // Execute the statement
    stmt.step();
    // Get one row of result
    result = stmt.get();
    assert.deepEqual(result, ['a',1], "Binding named parameters by their position");

    // Fetch the next row of result
    result = stmt.step();
    assert.equal(result, true);
    result = stmt.get();
    assert.deepEqual(result, ['b',2.2], "Fetching the next row of result");

    // Reset and reuse at once
    result = stmt.get([0, 1]);
    assert.deepEqual(result, ['a',1], "Reset and reuse at once");

    // Pass objects to get() and bind() to use named parameters
    result = stmt.get({':start':1, ':end':1});
    assert.deepEqual(result, ['a',1], "Binding named parameters");

    // Prepare statement, pass null to bind() and check that it works
    stmt = db.prepare("SELECT 'bind-with-null'");
    result = stmt.bind(null);
    assert.equal(result, true);
    stmt.step();
    result = stmt.get();
    assert.equal(result,"bind-with-null")

    // Close the database and all associated statements
    db.close();
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test statement': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}


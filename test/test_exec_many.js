exports.test = function(sql, assert){
    // Create a database
    var db = new sql.Database();

    // test DDL
    var result = db.execMany("DROP TABLE IF EXISTS test;");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "sql": "DROP TABLE IF EXISTS test;"
        }],
        "DDL: DROP"
    );

    result = db.execMany("CREATE TABLE test (id INTEGER, age INTEGER, name TEXT)");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "sql": "CREATE TABLE test (id INTEGER, age INTEGER, name TEXT)"
        }],
        "DDL: CREATE"
    );

    // test modification queries
    result = db.execMany("INSERT INTO test VALUES (1, 1, 'Ling')");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 1,
            "sql": "INSERT INTO test VALUES (1, 1, 'Ling')"
        }],
        "INSERT 1"
    );

    result = db.execMany("INSERT INTO test VALUES (2, 10, 'Wendy'), (3, 7, 'Jeff')");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 2,
            "sql": "INSERT INTO test VALUES (2, 10, 'Wendy'), (3, 7, 'Jeff')"
        }],
        "INSERT many"
    );

    result = db.execMany("UPDATE test SET age = age + 1");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 3,
            "sql": "UPDATE test SET age = age + 1"
        }],
        "UPDATE"
    );

    result = db.execMany("DELETE FROM TEST WHERE name = 'Priya'");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 0,
            "sql": "DELETE FROM TEST WHERE name = 'Priya'"
        }],
        "DELETE"
    );

    // SELECT queries
    result = db.execMany("SELECT * FROM test");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "columns": ["id", "age", "name"],
            "values": [[1, 2, "Ling"], [2, 11, "Wendy"], [3, 8, "Jeff"]],
            "sql": "SELECT * FROM test"
        }],
        "SELECT many"
    );

    result = db.execMany("SELECT * FROM test WHERE name = 'Priya'");
    assert.deepEqual(
        result,
        [{
            "success": true,
            "columns": ["id", "age", "name"],
            "values": [],
            "sql": "SELECT * FROM test WHERE name = 'Priya'"
        }],
        "SELECT 0"
    );

    // test errors in query
    result = db.execMany("INSERT INTO test (blah, foo) VALUES ('hello', 42);");
    assert.deepEqual(
        result,
        [{
            "success": false,
            "error": "table test has no column named blah",
            "sql": "INSERT INTO test (blah, foo) VALUES ('hello', 42);"
        }],
        "Error result: INSERT"
    );

    result = db.execMany("SELECT blah FROM test");
    assert.deepEqual(
        result,
        [{
            "success": false,
            "error": "no such column: blah",
            "sql": "SELECT blah FROM test"
        }],
        "Error result: SELECT"
    );

    // test multiple statement and stop/no stop on error

    result = db.execMany(
        "INSERT INTO test VALUES (4, 17, 'Priya');"
        + "SELECT blah FROM test;"
        + "DELETE FROM test",
        true
    );
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 1,
            "sql": "INSERT INTO test VALUES (4, 17, 'Priya');"
        },
        {
            "success": false,
            "error": "no such column: blah",
            "sql": "SELECT blah FROM test;"
        }],
        "Multiple statements with stop on error"
    );

    result = db.execMany(
        "INSERT INTO test VALUES (5, 9, 'Azam');"
        + "SELECT blah FROM test;"
        + "DELETE FROM test;"
        + "SELECT id FROM test"
    );
    assert.deepEqual(
        result,
        [{
            "success": true,
            "rowsModified": 1,
            "sql": "INSERT INTO test VALUES (5, 9, 'Azam');"
        },
        {
            "success": false,
            "error": "no such column: blah",
            "sql": "SELECT blah FROM test;"
        },
        {
            "success": true,
            "rowsModified": 5,
            "sql": "DELETE FROM test;"
        },
        {
            "success": true,
            "columns": ["id"],
            "values": [],
            "sql": "SELECT id FROM test"
        }],
        "Multiple statements with no stop on error"
    );

    // Close the database
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

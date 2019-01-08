
exports.test = function (SQL, assert, done, sqlLibFilename) {
    if (!sqlLibFilename){
        // Whew - this is ugly and fragile and makes way too many assumptions about how these tests are run from all.js
        // However, this is the quickest way to make sure that we are testing the lib that is requested
        const targetFile = process.argv[2];
        sqlLibFilename = targetFile ? "../dist/sql-"+targetFile+".js" : "../dist/sql-wasm.js";
    }

    var initSqlJsLib1 = require(sqlLibFilename);
    initSqlJsLib1().then((sqlModule1) => {
        var initSqlJsLib2 = require(sqlLibFilename);
        initSqlJsLib2().then((sqlModule2) => {
            assert.equal(SQL, sqlModule1, "Initializing the module multiple times only creates it once");
            assert.equal(sqlModule1, sqlModule2, "Initializing the module multiple times only creates it once");
            var db1 = new sqlModule1.Database();
            assert.equal(Object.getPrototypeOf(db1), SQL.Database.prototype, "sqlModule1 has a Database object that has the same prototype as the originally loaded SQL module");
            assert.equal(Object.getPrototypeOf(db1), sqlModule2.Database.prototype, "sqlModule1 has a Database object that has the same prototype as the sqlModule2");
            
            
            var db2 = new sqlModule2.Database();
            assert.equal(Object.getPrototypeOf(db2), sqlModule1.Database.prototype, "sqlModule2 has a Database object that has the same prototype as the sqlModule1");

            done();
        });
    });
};

if (module == require.main) {
    const targetFile = process.argv[2];
    const loadSqlLib = require('./load_sql_lib');
    loadSqlLib(targetFile).then((sql) => {
        require('test').run({
            'test modularization': function (assert, done) {
                // TODO: Dry this up so that this code isn't duped between here and load_sql_lib.js
                var sqlJsLibFilename = targetFile ? "../dist/sql-"+targetFile+".js" : "../dist/sql-wasm.js";
                exports.test(sql, assert, done, sqlJsLibFilename);
            }
        })
    })
    .catch((e) => {
        console.error(e);
    });
}

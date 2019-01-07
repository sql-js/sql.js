module.exports = function(sqlLibraryType){
    var sqlLibraryType = process.argv[2];
    // Use sql-wasm.js by default
    var sqlJsLib = sqlLibraryType ? "../js/sql-"+sqlLibraryType+".js" : "../js/sql-wasm.js";
    begin = new Date();
    var initSqlJs = require(sqlJsLib);
    return initSqlJs().then((sql)=>{
        end = new Date();
        console.log(`Loaded and inited ${sqlJsLib} in ${end -begin}ms`);
        return sql;
    });
}

module.exports = function(sqlLibraryType){
    // Use sql-wasm.js by default
    var sqlJsLib = sqlLibraryType ? "../dist/sql-"+sqlLibraryType+".js" : "../dist/sql-wasm.js";
    begin = new Date();
    var initSqlJs = require(sqlJsLib);
    return initSqlJs().then((sql)=>{
        end = new Date();
        console.log(`Loaded and inited ${sqlJsLib} in ${end -begin}ms`);
        return sql;
    });
}

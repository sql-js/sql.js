module.exports = function(sqlLibraryType){
    // Use sql-wasm.js by default
    var sqlJsLib = sqlLibraryType ? "../dist/sql-"+sqlLibraryType+".js" : "../dist/sql-wasm.js";
    var moduleConfig = {};
    if (sqlLibraryType && sqlLibraryType.indexOf("wasm-browser") === 0) {
        var fs = require("fs");
        var path = require("path");
        var pathToFileURL = require("url").pathToFileURL;
        moduleConfig.locateFile = function(filename){
            return pathToFileURL(path.resolve(__dirname, "../dist", filename)).href;
        };
        moduleConfig.wasmBinary = fs.readFileSync(path.resolve(__dirname, "../dist/sql-wasm-browser.wasm"));
    }
    begin = new Date();
    var initSqlJs = require(sqlJsLib);
    return initSqlJs(moduleConfig).then((sql)=>{
        end = new Date();
        console.log(`Loaded and inited ${sqlJsLib} in ${end -begin}ms`);
        return sql;
    });
}

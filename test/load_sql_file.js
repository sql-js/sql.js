module.exports = function(sqlFileTarget){
    var sqlFileTarget = process.argv[2];
    var sqlJsLib = sqlFileTarget ? "../js/sql-"+sqlFileTarget+".js" : "../js/sql.js";
    begin = new Date();
    var initSqlJs = require(sqlJsLib);
    return initSqlJs().then((sql)=>{
        end = new Date();
        console.log(`Loaded and inited ${sqlJsLib} in ${end -begin}ms`);
        return sql;
    });
}

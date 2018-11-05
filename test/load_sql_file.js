module.exports = function(sqlFileTarget){
    var sqlFileTarget = process.argv[2];
    var file = sqlFileTarget ? "../js/sql-"+sqlFileTarget+".js" : "../js/sql.js";
    begin = new Date();
    var sqlModule = require(file);
    return sqlModule.ready.then((sql)=>{
        end = new Date();
        console.log(`Loaded and inited ${file} in ${end -begin}ms`);
        return sql;
    });
}

exports.test = function(sql, assert) {
    // Create a database
    var db = new sql.Database();

    // Execute some sql
    sqlstr = "CREATE TABLE COMPANY("+
"                     ID INT PRIMARY KEY     NOT NULL,"+
"                     NAME           TEXT    NOT NULL,"+
"                     AGE            INT     NOT NULL,"+
"                     ADDRESS        CHAR(50),"+
"                     SALARY         REAL"+
"                    );"+
"                  CREATE TABLE AUDIT("+
"                      EMP_ID INT NOT NULL,"+
"                      ENTRY_DATE TEXT NOT NULL"+
"                  );"+
"                  CREATE TRIGGER audit_log AFTER INSERT"+
"                  ON COMPANY"+
"                  BEGIN"+
"                     INSERT INTO AUDIT"+
"                        (EMP_ID, ENTRY_DATE)"+
"                      VALUES"+
"                        (new.ID, '2014-11-10');"+
"                  END;"+
"                  INSERT INTO COMPANY VALUES (73,'A',8,'',1200);"+
"                  SELECT * FROM AUDIT;"+
"                  INSERT INTO COMPANY VALUES (42,'B',8,'',1600);"+
"                  SELECT EMP_ID FROM AUDIT ORDER BY EMP_ID";
    var res = db.exec(sqlstr);
    var expectedResult =  [
    {
        columns : ['EMP_ID','ENTRY_DATE'],
        values : [
            [73, '2014-11-10']
         ]
    },
    {
        columns : ['EMP_ID'],
        values : [
            [42],[73]
         ]
    }
    ];
    assert.deepEqual(res, expectedResult,
            "db.exec with a statement that contains a ';'");
};

if (module == require.main) {
	const target_file = process.argv[2];
  const sql_loader = require('./load_sql_lib');
  sql_loader(target_file).then((sql)=>{
    require('test').run({
      'test issue 73': function(assert){
        exports.test(sql, assert);
      }
    });
  })
  .catch((e)=>{
    console.error(e);
    assert.fail(e);
  });
}

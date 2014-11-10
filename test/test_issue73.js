exports.test = function(sql, assert, done) {
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
"                  SELECT * FROM AUDIT;";
	var res = db.exec(sqlstr);
	var expectedResult =  [{
		columns : ['EMP_ID','ENTRY_DATE'],
		values : [
			[73, '2014-11-10']
		 ]
	}];
	assert.deepEqual(res, expectedResult);
};

if (module == require.main) {
	var sql = require('../js/sql.js');
	var assert = require('assert');
	var done = function(){process.exit();}
	exports.test(sql, assert, done);
}

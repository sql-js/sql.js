apiTemp = Runtime.stackAlloc(4);

SQLite = {
	# Constants are defined below
	errorMessages : [] # Will contain all SQLite error descriptions sorted by error codes
};

dataTemp = []
callbackTemp = Runtime.addFunction (notUsed, argc, argv, colNames) ->
	curresult = if (dataTemp.length is 0) then null else dataTemp[dataTemp.length-1]
	isNewResult = (curresult is null or argc isnt curresult.columns.length);
	curvalues = []
	curcolumns = []

	for i in [0...argc]
		column = Pointer_stringify getValue colNames + i*Runtime.QUANTUM_SIZE, 'i32'
		value  = Pointer_stringify getValue argv     + i*Runtime.QUANTUM_SIZE, 'i32'
		curvalues.push value
		curcolumns.push column
		if not isNewResult and column isnt curresult['columns'][i] then isNewResult = true

	if isNewResult
		dataTemp.push {
			'columns' : curcolumns
			'values' : [curvalues]
		}
	else
		curresult['values'].push curvalues
	# If the callback returns non-zero, the query is aborted
	return 0

class Statement
	constructor: (@stmt) ->
		@pos = 1 # Index of the leftmost parameter is 1
	step: ->
		@pos = 1
		ret = sqlite3_step @stmt
		if ret is SQLite.ROW then return true
		else if ret is SQLite.DONE then return false
		else throw 'SQLite error: ' + handleErrors ret
	getNumber: (pos = @pos++) -> sqlite3_column_double @stmt, pos
	getString: (pos = @pos++) -> sqlite3_column_text @stmt, pos
	get: -> # Get all fields
		for field in [0 ... sqlite3_data_count(@stmt)]
			type = sqlite3_column_type @stmt, field
			if type in [SQLite.INTEGER, SQLite.FLOAT] then @getNumber field
			else if type in [SQLite.TEXT, SQLite.BLOB] then @getString field
			else null
	bindString: (string, pos = @pos++) ->
		ret = sqlite3_bind_text @stmt, pos, string, -1, NULL
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	bindNumber: (num, pos = @pos++) ->
		ret = sqlite3_bind_double @stmt, pos, num
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	bindValue: (val, pos = @pos++) ->
		switch typeof val
			when "string" then @bindString val, pos
			when "number" then @bindNumber val, pos
			# Not binding a parameter is the same as binding it to NULL
	bind : (values) ->
		@bindValue v,i+1 for v,i in values # Index of the leftmost parameter is 1
		null
	reset : -> sqlite3_reset @stmt
	free: -> sqlite3_finalize @stmt

class Database
	# Open a new database:
	#create a new one or open an existing database stored in the byte array passed in first argument
	constructor: (data) ->
		@filename = 'dbfile_' + (0xffffffff*Math.random()>>>0)
		if data? then FS.createDataFile '/', @filename, data, true, true
		ret = sqlite3_open @filename, apiTemp
		if ret isnt SQLite.OK then throw 'SQLite error: ' + SQLite.errorMessages[ret]
		@db = getValue(apiTemp, 'i32')

	# Close the database
	close: ->
		ret = sqlite3_close @db
		if ret isnt 0 then throw 'SQLite error: ' + SQLite_codes[ret].msg
		FS.unlink '/' + @filename
		@db = null

	# Execute an SQL query, and returns the result
	exec: (sql) ->
		if not @db then throw "Database closed"
		dataTemp = []
		setValue apiTemp, 0, 'i32'
		ret = sqlite3_exec @db, sql, callbackTemp, 0, apiTemp
		err = handleErrors ret, apiTemp
		if err isnt null then throw 'SQLite error : ' + err
		return dataTemp

	# Prepare an SQL statement
	prepare: (sql) ->
		setValue apiTemp, 0, 'i32'
		ret = sqlite3_prepare_v2 @db, sql, -1, apiTemp, NULL
		err = handleErrors ret, NULL
		if err isnt null then throw 'SQLite error: ' + err
		pStmt = getValue apiTemp, 'i32' #  pointer to a statement, or null
		if pStmt is NULL then throw 'Nothing to prepare'
		return new Statement(pStmt)

	# Exports the contents of the database to a binary array
	export: -> new Uint8Array FS.root.contents[@filename].contents

handleErrors = (ret, errPtrPtr) ->
	if not errPtrPtr
		return if ret is SQLite.OK then null else SQLite.errorMessages[ret]
	else
		errPtr = getValue errPtrPtr, 'i32'
		if errPtr isnt NULL and errPtr isnt undefined
			msg = Pointer_stringify errPtr
			sqlite3_free errPtr
			return msg
		else return null

sqlite3_open = Module.cwrap 'sqlite3_open', 'number', ['string', 'number']
sqlite3_close = Module.cwrap 'sqlite3_close', 'number', ['number'];
sqlite3_exec = Module.cwrap 'sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']
sqlite3_free = Module.cwrap 'sqlite3_free', '', ['number']

# Prepared statements
## prepare
sqlite3_prepare_v2 = Module.cwrap 'sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']
## Bind parameters
#int sqlite3_bind_text(sqlite3_stmt*, int, const char*, int n, void(*)(void*));
sqlite3_bind_text = Module.cwrap 'sqlite3_bind_text', 'number', ['number', 'number', 'string', 'number', 'number']
#int sqlite3_bind_double(sqlite3_stmt*, int, double);
sqlite3_bind_double = Module.cwrap 'sqlite3_bind_double', 'number', ['number', 'number', 'number']

## Get values
# int sqlite3_step(sqlite3_stmt*)
sqlite3_step = Module.cwrap 'sqlite3_step', 'number', ['number']
# int sqlite3_data_count(sqlite3_stmt *pStmt);
sqlite3_data_count = Module.cwrap 'sqlite3_data_count', 'number', ['number']
sqlite3_column_double = Module.cwrap 'sqlite3_column_double', 'number', ['number', 'number']
sqlite3_column_text = Module.cwrap 'sqlite3_column_text', 'string', ['number', 'number']
sqlite3_column_type = Module.cwrap 'sqlite3_column_type', 'number', ['number', 'number']
# int sqlite3_reset(sqlite3_stmt *pStmt);
sqlite3_reset = Module.cwrap 'sqlite3_reset', 'number', ['number']
# int sqlite3_finalize(sqlite3_stmt *pStmt);
sqlite3_finalize = Module.cwrap 'sqlite3_finalize', 'number', ['number']

# Global constants
NULL = 0 # Null pointer

SQLite.OK=0
SQLite.errorMessages[0]="Successful result"
SQLite.ERROR=1
SQLite.errorMessages[1]="SQL error or missing database"
SQLite.INTERNAL=2
SQLite.errorMessages[2]="Internal logic error in SQLite"
SQLite.PERM=3
SQLite.errorMessages[3]="Access permission denied"
SQLite.ABORT=4
SQLite.errorMessages[4]="Callback routine requested an abort"
SQLite.BUSY=5
SQLite.errorMessages[5]="The database file is locked"
SQLite.LOCKED=6
SQLite.errorMessages[6]="A table in the database is locked"
SQLite.NOMEM=7
SQLite.errorMessages[7]="A malloc() failed"
SQLite.READONLY=8
SQLite.errorMessages[8]="Attempt to write a readonly database"
SQLite.INTERRUPT=9
SQLite.errorMessages[9]="Operation terminated by sqlite3_interrupt()"
SQLite.IOERR=10
SQLite.errorMessages[10]="Some kind of disk I/O error occurred"
SQLite.CORRUPT=11
SQLite.errorMessages[11]="The database disk image is malformed"
SQLite.NOTFOUND=12
SQLite.errorMessages[12]="Unknown opcode in sqlite3_file_control()"
SQLite.FULL=13
SQLite.errorMessages[13]="Insertion failed because database is full"
SQLite.CANTOPEN=14
SQLite.errorMessages[14]="Unable to open the database file"
SQLite.PROTOCOL=15
SQLite.errorMessages[15]="Database lock protocol error"
SQLite.EMPTY=16
SQLite.errorMessages[16]="Database is empty"
SQLite.SCHEMA=17
SQLite.errorMessages[17]="The database schema changed"
SQLite.TOOBIG=18
SQLite.errorMessages[18]="String or BLOB exceeds size limit"
SQLite.CONSTRAINT=19
SQLite.errorMessages[19]="Abort due to constraint violation"
SQLite.MISMATCH=20
SQLite.errorMessages[20]="Data type mismatch"
SQLite.MISUSE=21
SQLite.errorMessages[21]="Library used incorrectly"
SQLite.NOLFS=22
SQLite.errorMessages[22]="Uses OS features not supported on host"
SQLite.AUTH=23
SQLite.errorMessages[23]="Authorization denied"
SQLite.FORMAT=24
SQLite.errorMessages[24]="Auxiliary database format error"
SQLite.RANGE=25
SQLite.errorMessages[25]="2nd parameter to sqlite3_bind out of range"
SQLite.NOTADB=26
SQLite.errorMessages[26]="File opened that is not a database file"
SQLite.NOTICE=27
SQLite.errorMessages[27]="Notifications from sqlite3_log()"
SQLite.WARNING=28
SQLite.errorMessages[28]="Warnings from sqlite3_log()"
SQLite.ROW=100
SQLite.errorMessages[100]="sqlite3_step() has another row ready"
SQLite.DONE=101
SQLite.errorMessages[101]="sqlite3_step() has finished executing"

# Data types
SQLite.INTEGER=1
SQLite.FLOAT=2
SQLite.TEXT=3
SQLite.BLOB=4
SQLite.NULL=5


# Export the API
this['SQL'] = {'Database':Database}
Module[i] = this['SQL'][i] for i of this['SQL']

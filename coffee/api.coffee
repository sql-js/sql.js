#@copyright Ophir LOJKINE

apiTemp = Runtime.stackAlloc(4);

SQLite = {
	# Constants are defined below
	errorMessages : [] # Will contain all SQLite error descriptions sorted by error codes
};

dataTemp = []
callbackTemp = Runtime.addFunction (notUsed, argc, argv, colNames) ->
	curresult = if (dataTemp.length is 0) then null else dataTemp[dataTemp.length-1]
	isNewResult = (curresult is null or argc isnt curresult['columns'].length);
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

# Represents an prepared statement
class Statement
	# Statements can't be created by the API user, only by Database::prepare
	# @private
	# @nodoc
	constructor: (@stmt) ->
		@pos = 1 # Index of the leftmost parameter is 1

	### Bind values to the parameters

	SQL statements can have parameters, named *'?', '?NNN', ':VVV', '@VVV', '$VVV'*,
	where NNN is a number and VVV a string.
	This function binds these parameters to the given values.

	*Warning*: ':', '@', and '$' are included in the parameters names

	## Binding values to named parameters
	@example Bind values to named parameters
		var stmt = db.prepare("UPDATE test SET a=@newval WHERE id BETWEEN $mini AND $maxi");
		stmt.bind({$mini:10, $maxi:20, '@newval':5});
	- Create a statement that contains parameters like '$VVV', ':VVV', '@VVV'
	- Call Statement.bind with an object as parameter

	## Binding values to parameters
	@example Bind values to anonymous parameters
		var stmt = db.prepare("UPDATE test SET a=? WHERE id BETWEEN ? AND ?");
		stmt.bind([5, 10, 20]);
	 - Create a statement that contains parameters like '?', '?NNN'
	 - Call Statement.bind with an array as parameter

	## Value types
	Javascript type | SQLite type
	--- | ---
	number | REAL, INTEGER
	boolean | INTEGER
	string | TEXT
	Array, Uint8Array | BLOB
	null | NULL
	@see http://www.sqlite.org/datatype3.html

	@see http://www.sqlite.org/lang_expr.html#varparam
	@param values [Array,Object] The values to bind
	@return [Boolean] true if it worked
	@throw [String] SQLite Error
	###
	'bind' : (values) ->
		@['reset']()
		if Array.isArray values then @bindFromArray values else @bindFromObject values

	### Execute the statement, fetching the the next line of result,
	that can be retrieved with [Statement.get()](#get-dynamic) .

	@return [Boolean] true if a row of result available
	@throw [String] SQLite Error
	###
	'step': ->
		@pos = 1
		ret = sqlite3_step @stmt
		if ret is SQLite.ROW then return true
		else if ret is SQLite.DONE then return false
		else throw 'SQLite error: ' + handleErrors ret

	# Internal methods to retrieve data from the results of a statement that has been executed
	# @nodoc
	getNumber: (pos = @pos++) -> sqlite3_column_double @stmt, pos
	# @nodoc
	getString: (pos = @pos++) -> sqlite3_column_text @stmt, pos
	# @nodoc
	getBlob: (pos = @pos++) ->
		size = sqlite3_column_bytes @stmt, pos
		ptr = sqlite3_column_blob @stmt, pos
		result = new Uint8Array(size)
		result[i] = HEAP8[ptr+i] for i in [0 ... size]
		return result

	### Get one row of results of a statement.
	If the first parameter is not provided, step must have been called before get.
	@param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
	@return [Array] One row of result

	@example Print all the rows of the table test to the console

		var stmt = db.prepare("SELECT * FROM test");
		while (stmt.step()) console.log(stmt.get());
	###
	'get': (values) -> # Get all fields
		if values? then @['bind'](values) and @['step']()
		for field in [0 ... sqlite3_data_count(@stmt)]
			switch sqlite3_column_type @stmt, field
				when SQLite.INTEGER, SQLite.FLOAT then @getNumber field
				when SQLite.TEXT then @getString field
				when SQLite.BLOB then @getBlob field
				else null

	### Shorthand for bind + step + reset
	Bind the values, execute the statement, ignoring the rows it returns, and resets it
	@param [Array,Object] Value to bind to the statement
	###
	'run': (values) ->
		if values? then @['bind'](values)
		@['step']()
		@['reset']()

	# Internal methods to bind values to parameters
	# @private
	# @nodoc
	bindString: (string, pos = @pos++) ->
		strptr = allocate intArrayFromString(string), 'i8', ALLOC_NORMAL
		strfree = Runtime.addFunction -> _free strptr
		ret = sqlite3_bind_text @stmt, pos, strptr, -1, strfree
		if ret is SQLite.OK then return true
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	# @nodoc
	bindBlob: (array, pos = @pos++) ->
		blobptr = allocate array, 'i8', ALLOC_NORMAL
		blobfree = Runtime.addFunction -> _free blobptr
		ret = sqlite3_bind_blob @stmt, pos, blobptr, array.length, blobfree
		if ret is SQLite.OK then return true
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	# @private
	# @nodoc
	bindNumber: (num, pos = @pos++) ->
		bindfunc = if num is (num|0) then sqlite3_bind_int else sqlite3_bind_double
		ret = bindfunc @stmt, pos, num
		if ret is SQLite.OK then return true
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	# @nodoc
	bindNull: (pos = @pos++) -> sqlite3_bind_blob(@stmt, pos, 0,0,0) is SQLite.OK
	# Call bindNumber or bindString appropriatly
	# @private
	# @nodoc
	bindValue: (val, pos = @pos++) ->
		switch typeof val
			when "string" then @bindString val, pos
			when "number","boolean" then @bindNumber val+0, pos
			when "object"
				if val is null then @bindNull pos
				if val.length? then @bindBlob val, pos
				else throw "Wrong API use : tried to bind a value of an unknown type (#{val})."
	### Bind names and values of an object to the named parameters of the statement
	@param [Object]
	@private
	@nodoc
	###
	bindFromObject : (valuesObj) ->
		for name, value of valuesObj
			num = sqlite3_bind_parameter_index @stmt, name
			if num isnt 0 then @bindValue value, num
		return true
	### Bind values to numbered parameters
	@param [Array]
	@private
	@nodoc
	###
	bindFromArray : (values) ->
		@bindValue value, num+1 for value,num in values
		return true

	### Reset a statement, so that it's parameters can be bound to new values
	It also clears all previous bindings
	###
	'reset' : -> sqlite3_reset(@stmt) is SQLite.OK and sqlite3_clear_bindings(@stmt) is SQLite.OK
	### Free the memory used by the statement
	@return [Boolean] true in case of success
	###
	'free': -> sqlite3_finalize(@stmt) is SQLite.OK

# Represents an SQLite database
class Database
	# Open a new database either by creating a new one or opening an existing one,
	# stored in the byte array passed in first argument
	# @param data [Array<Integer>] An array of bytes representing an SQLite database file
	constructor: (data) ->
		@filename = 'dbfile_' + (0xffffffff*Math.random()>>>0)
		if data? then FS.createDataFile '/', @filename, data, true, true
		ret = sqlite3_open @filename, apiTemp
		if ret isnt SQLite.OK then throw 'SQLite error: ' + SQLite.errorMessages[ret]
		@db = getValue(apiTemp, 'i32')

	### Execute an SQL query, and returns the result
	@param sql [String] a string containing some SQL text to execute
	@return [Array<QueryResults>] An array of results.
	###
	'exec': (sql) ->
		if not @db then throw "Database closed"
		dataTemp = []
		setValue apiTemp, 0, 'i32'
		ret = sqlite3_exec @db, sql, callbackTemp, 0, apiTemp
		err = handleErrors ret, apiTemp
		if err isnt null then throw 'SQLite error : ' + err
		return dataTemp

	### Prepare an SQL statement
	@param sql [String] a string of SQL, that can contain placeholders ('?', ':VVV', ':AAA', '@AAA')
	@return [Statement] the resulting statement
	@throw [String] SQLite error
	###
	'prepare': (sql) ->
		setValue apiTemp, 0, 'i32'
		ret = sqlite3_prepare_v2 @db, sql, -1, apiTemp, NULL
		err = handleErrors ret, NULL
		if err isnt null then throw 'SQLite error: ' + err
		pStmt = getValue apiTemp, 'i32' #  pointer to a statement, or null
		if pStmt is NULL then throw 'Nothing to prepare'
		return new Statement(pStmt)

	### Exports the contents of the database to a binary array
	@return [Uint8Array] An array of bytes of the SQLite3 database file
	###
	'export': -> new Uint8Array FS.root.contents[@filename].contents

	### Close the database
	Databases must be closed, or the memory consumption will grow forever
	###
	'close': ->
		ret = sqlite3_close @db
		if ret isnt 0 then throw 'SQLite error: ' + SQLite_codes[ret].msg
		FS.unlink '/' + @filename
		@db = null

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

sqlite3_open = Module['cwrap'] 'sqlite3_open', 'number', ['string', 'number']
sqlite3_close = Module['cwrap'] 'sqlite3_close', 'number', ['number']
sqlite3_exec = Module['cwrap'] 'sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']
sqlite3_free = Module['cwrap'] 'sqlite3_free', '', ['number']

# Prepared statements
## prepare
sqlite3_prepare_v2 = Module['cwrap'] 'sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']
## Bind parameters

#int sqlite3_bind_text(sqlite3_stmt*, int, const char*, int n, void(*)(void*));
# We declare const char* as a number, because we will manually allocate the memory and pass a pointer to the function
sqlite3_bind_text = Module['cwrap'] 'sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']
sqlite3_bind_blob = Module['cwrap'] 'sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']
#int sqlite3_bind_double(sqlite3_stmt*, int, double);
sqlite3_bind_double = Module['cwrap'] 'sqlite3_bind_double', 'number', ['number', 'number', 'number']
#int sqlite3_bind_double(sqlite3_stmt*, int, int);
sqlite3_bind_int = Module['cwrap'] 'sqlite3_bind_int', 'number', ['number', 'number', 'number']
#int sqlite3_bind_parameter_index(sqlite3_stmt*, const char *zName);
sqlite3_bind_parameter_index = Module['cwrap'] 'sqlite3_bind_parameter_index', 'number', ['number', 'string']

## Get values
# int sqlite3_step(sqlite3_stmt*)
sqlite3_step = Module['cwrap'] 'sqlite3_step', 'number', ['number']
# int sqlite3_data_count(sqlite3_stmt *pStmt);
sqlite3_data_count = Module['cwrap'] 'sqlite3_data_count', 'number', ['number']
sqlite3_column_double = Module['cwrap'] 'sqlite3_column_double', 'number', ['number', 'number']
sqlite3_column_text = Module['cwrap'] 'sqlite3_column_text', 'string', ['number', 'number']
sqlite3_column_blob = Module['cwrap'] 'sqlite3_column_blob', 'number', ['number', 'number']
sqlite3_column_bytes = Module['cwrap'] 'sqlite3_column_bytes', 'number', ['number', 'number']
sqlite3_column_type = Module['cwrap'] 'sqlite3_column_type', 'number', ['number', 'number']
# int sqlite3_reset(sqlite3_stmt *pStmt);
sqlite3_reset = Module['cwrap'] 'sqlite3_reset', 'number', ['number']
sqlite3_clear_bindings = Module['cwrap'] 'sqlite3_clear_bindings', 'number', ['number']
# int sqlite3_finalize(sqlite3_stmt *pStmt);
sqlite3_finalize = Module['cwrap'] 'sqlite3_finalize', 'number', ['number']

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

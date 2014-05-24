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

### Represents an prepared statement.

Prepared statements allow you to have a template sql string,
that you can execute multiple times with different parameters.

You can't instantiate this class directly, you have to use a [Database](Database.html)
object in order to create a statement.

**Warning**: When you close a database (using db.close()), all its statements are
closed too and become unusable.

@see Database.html#prepare-dynamic
@see https://en.wikipedia.org/wiki/Prepared_statement
###
class Statement
	# Statements can't be created by the API user, only by Database::prepare
	# @private
	# @nodoc
	constructor: (@stmt) ->
		@pos = 1 # Index of the leftmost parameter is 1
		@allocatedmem = [] # Pointers to allocated memory, that need to be freed when the statemend is destroyed

	### Bind values to the parameters, after having reseted the statement

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
	@return [Array<String,Number,Uint8Array,null>] One row of result

	@example Print all the rows of the table test to the console

		var stmt = db.prepare("SELECT * FROM test");
		while (stmt.step()) console.log(stmt.get());
	###
	'get': (params) -> # Get all fields
		if params? then @['bind'](params) and @['step']()
		for field in [0 ... sqlite3_data_count(@stmt)]
			switch sqlite3_column_type @stmt, field
				when SQLite.INTEGER, SQLite.FLOAT then @getNumber field
				when SQLite.TEXT then @getString field
				when SQLite.BLOB then @getBlob field
				else null

	### Get the list of column names of a row of result of a statement.
	@return [Array<String>] The names of the columns
	@example

		var stmt = db.prepare("SELECT 5 AS nbr, x'616200' AS data, NULL AS nothing;");
		stmt.step(); // Execute the statement
		console.log(stmt.getColumnNames()); // Will print ['nbr','data','nothing']
	###
	'getColumnNames' : () ->
			sqlite3_column_name @stmt, i for i in [0 ... sqlite3_data_count(@stmt)]

	### Get one row of result as a javascript object, associating column names with
	their value in the current row.
	@param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
	@return [Object] The row of result
	@see [Statement.get](#get-dynamic)

	@example

		var stmt = db.prepare("SELECT 5 AS nbr, x'616200' AS data, NULL AS nothing;");
		stmt.step(); // Execute the statement
		console.log(stmt.getAsObject()); // Will print {nbr:5, data: Uint8Array([1,2,3]), nothing:null}
	###
	'getAsObject': (params) ->
		values = @['get'] params
		names  = @['getColumnNames']()
		rowObject = {}
		rowObject[name] = values[i] for name,i in names
		return rowObject

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
		bytes = intArrayFromString(string)
		@allocatedmem.push strptr = allocate bytes, 'i8', ALLOC_NORMAL
		ret = sqlite3_bind_text @stmt, pos, strptr, bytes.length, 0
		if ret is SQLite.OK then return true
		err = handleErrors ret
		if err isnt null then throw 'SQLite error : ' + err
	# @nodoc
	bindBlob: (array, pos = @pos++) ->
		@allocatedmem.push blobptr = allocate array, 'i8', ALLOC_NORMAL
		ret = sqlite3_bind_blob @stmt, pos, blobptr, array.length, 0
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
	It also clears all previous bindings, freeing the memory used by bound parameters.
	###
	'reset' : ->
		@freemem()
		sqlite3_reset(@stmt) is SQLite.OK and
		sqlite3_clear_bindings(@stmt) is SQLite.OK

	### Free the memory allocated during parameter binding
	###
	freemem : ->
		_free mem while mem = @allocatedmem.pop()
		return null

	### Free the memory used by the statement
	@return [Boolean] true in case of success
	###
	'free': ->
		@freemem()
		res = sqlite3_finalize(@stmt) is SQLite.OK
		@stmt = NULL
		return res

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
		@statements = [] # A list of all prepared statements of the database

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
		stmt = new Statement(pStmt)
		@statements.push(stmt)
		return stmt

	### Exports the contents of the database to a binary array
	@return [Uint8Array] An array of bytes of the SQLite3 database file
	###
	'export': -> new Uint8Array FS.root.contents[@filename].contents

	### Close the database, and all associated prepared statements.

	The memory associated to the database and all associated statements
	will be freed.

	**Warning**: A statement belonging to a database that has been closed cannot
	be used anymore.

	Databases **must** be closed, when you're finished with them, or the
	memory consumption will grow forever
	###
	'close': ->
		stmt['free']() for stmt in @statements
		ret = sqlite3_close_v2 @db
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

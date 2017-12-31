#@copyright Ophir LOJKINE

apiTemp = stackAlloc(4)

# Constants are defined in api-data.coffee
SQLite = {}

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
    constructor: (@stmt, @db) ->
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
        if not @stmt then throw "Statement closed"
        @['reset']()
        if Array.isArray values then @bindFromArray values else @bindFromObject values

    ### Execute the statement, fetching the the next line of result,
    that can be retrieved with [Statement.get()](#get-dynamic) .

    @return [Boolean] true if a row of result available
    @throw [String] SQLite Error
    ###
    'step': ->
        if not @stmt then throw "Statement closed"
        @pos = 1
        switch ret = sqlite3_step @stmt
            when SQLite.ROW  then return true
            when SQLite.DONE then return false
            else @db.handleError ret

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
        @db.handleError sqlite3_bind_text @stmt, pos, strptr, bytes.length-1, 0
        return true

    # @nodoc
    bindBlob: (array, pos = @pos++) ->
        @allocatedmem.push blobptr = allocate array, 'i8', ALLOC_NORMAL
        @db.handleError sqlite3_bind_blob @stmt, pos, blobptr, array.length, 0
        return true

    # @private
    # @nodoc
    bindNumber: (num, pos = @pos++) ->
        bindfunc = if num is (num|0) then sqlite3_bind_int else sqlite3_bind_double
        @db.handleError bindfunc @stmt, pos, num
        return true

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
                else if val.length? then @bindBlob val, pos
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
        sqlite3_clear_bindings(@stmt) is SQLite.OK and
        sqlite3_reset(@stmt) is SQLite.OK

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
        delete @db.statements[@stmt]
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
        @handleError sqlite3_open @filename, apiTemp
        @db = getValue(apiTemp, 'i32')
        RegisterExtensionFunctions(@db)
        @statements = {} # A list of all prepared statements of the database

    ### Execute an SQL query, ignoring the rows it returns.

    @param sql [String] a string containing some SQL text to execute
    @param params [Array] (*optional*) When the SQL statement contains placeholders, you can pass them in here. They will be bound to the statement before it is executed.

    If you use the params argument, you **cannot** provide an sql string that contains several
    queries (separated by ';')

    @example Insert values in a table
        db.run("INSERT INTO test VALUES (:age, :name)", {':age':18, ':name':'John'});

    @return [Database] The database object (useful for method chaining)
    ###
    'run' : (sql, params) ->
        if not @db then throw "Database closed"
        if params
            stmt = @['prepare'] sql, params
            stmt['step']()
            stmt['free']()
        else
            @handleError sqlite3_exec @db, sql, 0, 0, apiTemp
        return @

    ### Execute an SQL query, and returns the result.

    This is a wrapper against Database.prepare, Statement.step, Statement.get,
    and Statement.free.

    The result is an array of result elements. There are as many result elements
    as the number of statements in your sql string (statements are separated by a semicolon)

    Each result element is an object with two properties:
        'columns' : the name of the columns of the result (as returned by Statement.getColumnNames())
        'values' : an array of rows. Each row is itself an array of values

    ## Example use
    We have the following table, named *test* :

    | id | age |  name  |
    |:--:|:---:|:------:|
    | 1  |  1  | Ling   |
    | 2  |  18 | Paul   |
    | 3  |  3  | Markus |


    We query it like that:
    ```javascript
    var db = new SQL.Database();
    var res = db.exec("SELECT id FROM test; SELECT age,name FROM test;");
    ```

    `res` is now :
    ```javascript
        [
            {columns: ['id'], values:[[1],[2],[3]]},
            {columns: ['age','name'], values:[[1,'Ling'],[18,'Paul'],[3,'Markus']]}
        ]
    ```

    @param sql [String] a string containing some SQL text to execute
    @return [Array<QueryResults>] An array of results.
    ###
    'exec': (sql) ->
        if not @db then throw "Database closed"

        stack = stackSave()
        # Store the SQL string in memory. The string will be consumed, one statement
        # at a time, by sqlite3_prepare_v2_sqlptr.
        # Allocate at most 4 bytes per UTF8 char, +1 for the trailing '\0'
        nextSqlPtr = stackAlloc(sql.length<<2 + 1)
        writeStringToMemory sql, nextSqlPtr
        # Used to store a pointer to the next SQL statement in the string
        pzTail = stackAlloc(4)

        results = []
        while getValue(nextSqlPtr,'i8') isnt NULL
            setValue apiTemp, 0, 'i32'
            setValue pzTail, 0, 'i32'
            @handleError sqlite3_prepare_v2_sqlptr @db, nextSqlPtr, -1, apiTemp, pzTail
            pStmt = getValue apiTemp, 'i32' #  pointer to a statement, or null
            nextSqlPtr = getValue pzTail, 'i32'
            if pStmt is NULL then continue # Empty statement
            stmt = new Statement pStmt, this
            curresult = null
            while stmt['step']()
              if curresult is null
                curresult =
                  'columns' : stmt['getColumnNames']()
                  'values' : []
                results.push curresult
              curresult['values'].push stmt['get']()
            stmt['free']()
        stackRestore stack
        return results

    ### Execute an sql statement, and call a callback for each row of result.

    **Currently** this method is synchronous, it will not return until the callback has
    been called on every row of the result. But this might change.

    @param sql [String] A string of SQL text. Can contain placeholders that will be
    bound to the parameters given as the second argument
    @param params [Array<String,Number,null,Uint8Array>] (*optional*) Parameters to bind
    to the query
    @param callback [Function(Object)] A function that will be called on each row of result
    @param done [Function] A function that will be called when all rows have been retrieved

    @return [Database] The database object. Useful for method chaining

    @example Read values from a table
        db.each("SELECT name,age FROM users WHERE age >= $majority",
                        {$majority:18},
                        function(row){console.log(row.name + " is a grown-up.")}
                    );
    ###
    'each' : (sql, params, callback, done) ->
        if typeof params is 'function'
            done = callback
            callback = params
            params = undefined
        stmt = @['prepare'] sql, params
        while stmt['step']()
          callback(stmt['getAsObject']())
        stmt['free']()
        if typeof done is 'function' then done()

    ### Prepare an SQL statement
    @param sql [String] a string of SQL, that can contain placeholders ('?', ':VVV', ':AAA', '@AAA')
    @param params [Array] (*optional*) values to bind to placeholders
    @return [Statement] the resulting statement
    @throw [String] SQLite error
    ###
    'prepare': (sql, params) ->
        setValue apiTemp, 0, 'i32'
        @handleError sqlite3_prepare_v2 @db, sql, -1, apiTemp, NULL
        pStmt = getValue apiTemp, 'i32' #  pointer to a statement, or null
        if pStmt is NULL then throw 'Nothing to prepare'
        stmt = new Statement pStmt, this
        if params? then stmt.bind params
        @statements[pStmt] = stmt
        return stmt

    ### Exports the contents of the database to a binary array
    @return [Uint8Array] An array of bytes of the SQLite3 database file
    ###
    'export': ->
        stmt['free']() for _,stmt of @statements
        @handleError sqlite3_close_v2 @db
        binaryDb = FS.readFile @filename, encoding:'binary'
        @handleError sqlite3_open @filename, apiTemp
        @db = getValue apiTemp, 'i32'
        binaryDb

    ### Close the database, and all associated prepared statements.

    The memory associated to the database and all associated statements
    will be freed.

    **Warning**: A statement belonging to a database that has been closed cannot
    be used anymore.

    Databases **must** be closed, when you're finished with them, or the
    memory consumption will grow forever
    ###
    'close': ->
        stmt['free']() for _,stmt of @statements
        @handleError sqlite3_close_v2 @db
        FS.unlink '/' + @filename
        @db = null

    ### Analyze a result code, return null if no error occured, and throw
    an error with a descriptive message otherwise
    @nodoc
    ###
    handleError: (returnCode) ->
        if returnCode is SQLite.OK
            null
        else
            errmsg = sqlite3_errmsg @db
            throw new Error(errmsg)

    ### Returns the number of rows modified, inserted or deleted by the
    most recently completed INSERT, UPDATE or DELETE statement on the
    database Executing any other type of SQL statement does not modify
    the value returned by this function.

    @return [Number] the number of rows modified
    ###
    'getRowsModified': -> sqlite3_changes(@db)

    ### Register a custom function with SQLite
    @example Register a simple function
        db.create_function("addOne", function(x) {return x+1;})
        db.exec("SELECT addOne(1)") // = 2

    @param name [String] the name of the function as referenced in SQL statements.
    @param func [Function] the actual function to be executed.
    ###
    'create_function': (name, func) ->
        wrapped_func = (cx, argc, argv) ->
            # Parse the args from sqlite into JS objects
            args = []
            for i in [0...argc]
                value_ptr = getValue(argv+(4*i), 'i32')
                value_type = sqlite3_value_type(value_ptr)
                data_func = switch
                    when value_type == 1 then sqlite3_value_int
                    when value_type == 2 then sqlite3_value_double
                    when value_type == 3 then sqlite3_value_text
                    when value_type == 4 then (ptr) ->
                        size = sqlite3_value_bytes(ptr)
                        blob_ptr = sqlite3_value_blob(ptr)
                        blob_arg = new Uint8Array(size)
                        blob_arg[j] = HEAP8[blob_ptr+j] for j in [0 ... size]
                        blob_arg
                    else (ptr) -> null

                arg = data_func(value_ptr)
                args.push arg

            # Invoke the user defined function with arguments from SQLite
            result = func.apply(null, args)

            # Return the result of the user defined function to SQLite
            if not result
                sqlite3_result_null cx
            else
                switch typeof(result)
                    when 'number' then sqlite3_result_double(cx, result)
                    when 'string' then sqlite3_result_text(cx, result, -1, -1)

        # Generate a pointer to the wrapped, user defined function, and register with SQLite.
        func_ptr = addFunction(wrapped_func)
        @handleError sqlite3_create_function_v2 @db, name, func.length, SQLite.UTF8, 0, func_ptr, 0, 0, 0
        return @

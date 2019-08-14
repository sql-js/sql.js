import { SQLite, NULL } from "./Helper";
import { Statement } from "./Statement";
import { sqlite3_open, sqlite3_exec, sqlite3_prepare_v2_sqlptr, sqlite3_prepare_v2, sqlite3_close_v2, sqlite3_errmsg, sqlite3_changes, sqlite3_value_type, sqlite3_value_double, sqlite3_value_text, sqlite3_value_bytes, sqlite3_value_blob, sqlite3_result_error, sqlite3_result_int, sqlite3_result_double, sqlite3_result_text, sqlite3_result_null, sqlite3_result_blob, sqlite3_create_function_v2, RegisterExtensionFunctions } from "./lib/sqlite3";

const apiTemp = stackAlloc(4);

console.log(SQLite.OK)

// Represents an SQLite database
export default class Database {
  data: any;
  identifier: any;
  db: any;
  filename?: string;
  statements: {} = {};
  functions: {} = {};

  constructor(data: any, identifier: string = 'default') {
    this.data = data;
    this.identifier = identifier;
  }

  /* Mount the database
   */
  mount(): Promise<void> {
    return new Promise((resolve: () => void, reject: (arg0: any) => void) => {
      FS.mkdir("/sqleet");
      FS.mount(IDBFS, {}, "/sqleet");
      return FS.syncfs(true, (err: any) => {
        if (err) {
          return reject(err);
        }
        this.filename = "sqleet/" + this.identifier + ".db";
        this.handleError(sqlite3_open(this.filename, apiTemp));
        this.db = Module.getValue(apiTemp, "i32");
        RegisterExtensionFunctions(this.db);
        this.statements = {}; // A list of all prepared statements of the database
        this.functions = {}; // A list of all user function of the database (created by create_function call)
        return resolve();
      });
    });
  }

  /* Persist data on disk
   */
  saveChanges() {
    if (!this.db) {
      throw "Database closed";
    }
    return new Promise((resolve: () => void, reject: (arg0: any) => void) => {
      return FS.syncfs(false, (err: any) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  /* Execute an SQL query, ignoring the rows it returns.

    @param sql [String] a string containing some SQL text to execute
    @param params [Array] (*optional*) When the SQL statement contains placeholders, you can pass them in here. They will be bound to the statement before it is executed.

    If you use the params argument, you **cannot** provide an sql string that contains several
    queries (separated by ';')

    @example Insert values in a table
        db.run("INSERT INTO test VALUES (:age, :name)", {':age':18, ':name':'John'});

    @return [Database] The database object (useful for method chaining)
    */
  run(sql: any, params: any) {
    if (!this.db) {
      throw "Database closed";
    }
    if (params) {
      const stmt = this.prepare(sql, params);
      stmt.step();
      stmt.free();
    } else {
      this.handleError(sqlite3_exec(this.db, sql, 0, 0, apiTemp));
    }
    return this;
  }

  /* Execute an SQL query, and returns the result.

    This is a wrapper against Database.prepare, Statement.step, Statement.get,
    and Statement.free.

    The result is an array of result elements. There are as many result elements
    as the number of statements in your sql string (statements are separated by a semicolon)

    Each result element is an object with two properties:
        'columns' : the name of the columns of the result (as returned by Statement.getColumnNames())
        'values' : an array of rows. Each row is itself an array of values

    *# Example use
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
    */
  exec(sql: any) {
    if (!this.db) {
      throw "Database closed";
    }

    const stack = stackSave();

    // Store the SQL string in memory. The string will be consumed, one statement
    // at a time, by sqlite3_prepare_v2_sqlptr.
    // Note that if we want to allocate as much memory as could _possibly_ be used, we can
    // we allocate bytes equal to 4* the number of chars in the sql string.
    // It would be faster, but this is probably a premature optimization
    let nextSqlPtr = allocateUTF8OnStack(sql);

    // Used to store a pointer to the next SQL statement in the string
    const pzTail = stackAlloc(4);

    const results: any[] = [];
    while (Module.getValue(nextSqlPtr, "i8") !== NULL) {
      Module.setValue(apiTemp, 0, "i32");
      Module.setValue(pzTail, 0, "i32");
      this.handleError(
        sqlite3_prepare_v2_sqlptr(this.db, nextSqlPtr, -1, apiTemp, pzTail)
      );
      const pStmt = Module.getValue(apiTemp, "i32"); //  pointer to a statement, or null
      nextSqlPtr = Module.getValue(pzTail, "i32");

      if (pStmt === NULL) {
        continue; // Empty statement
      }

      const stmt = new Statement(pStmt, this);
      let curresult: any = null;

      while (stmt.step()) {
        if (curresult === null) {
          curresult = {
            columns: stmt.getColumnNames(),
            values: []
          };
          results.push(curresult);
        }
        curresult.push(stmt.get());
      }
      stmt.free();
    }
    stackRestore(stack);
    return results;
  }

  /* Execute an sql statement, and call a callback for each row of result.

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
    */
  each(sql: any, params: any, callback: (arg0?: {}) => void, done: () => void) {
    if (typeof params === "function") {
      done = () => callback();
      callback = params;
      params = undefined;
    }
    const stmt = this.prepare(sql, params);
    while (stmt.step()) {
      callback(stmt.getAsObject());
    }
    stmt.free();
    if (typeof done === "function") {
      return done();
    }
  }

  /* Prepare an SQL statement
    @param sql [String] a string of SQL, that can contain placeholders ('?', ':VVV', ':AAA', '@AAA')
    @param params [Array] (*optional*) values to bind to placeholders
    @return [Statement] the resulting statement
    @throw [String] SQLite error
    */
  prepare(sql: any, params: any) {
    Module.setValue(apiTemp, 0, "i32");
    this.handleError(sqlite3_prepare_v2(this.db, sql, -1, apiTemp, NULL));
    const pStmt = Module.getValue(apiTemp, "i32"); //  pointer to a statement, or null
    if (pStmt === NULL) {
      throw "Nothing to prepare";
    }
    const stmt = new Statement(pStmt, this);
    if (!params) {
      stmt.bind(params);
    }
    this.statements[pStmt] = stmt;
    return stmt;
  }

  /* Exports the contents of the database to a binary array
    @return [Uint8Array] An array of bytes of the SQLite3 database file
    */
  export () {
    for (let _statement in this.statements) {
      const stmt = this.statements[_statement];
      stmt.free();
    }
    for (let _function in this.functions) {
      const func = this.functions[_function];
      removeFunction(func);
    }
    this.functions = {};
    this.handleError(sqlite3_close_v2(this.db));
    if (!this.filename) {
      throw "Filename not available, did you used mount()?";
    }
    const binaryDb = FS.readFile(this.filename, {
      encoding: "binary"
    });
    this.handleError(sqlite3_open(this.filename, apiTemp));
    this.db = Module.getValue(apiTemp, "i32");
    return binaryDb;
  }

  /* Close the database, and all associated prepared statements.

    The memory associated to the database and all associated statements
    will be freed.

    **Warning**: A statement belonging to a database that has been closed cannot
    be used anymore.

    Databases **must** be closed, when you're finished with them, or the
    memory consumption will grow forever
    */
  close() {
    let _;
    for (_ in this.statements) {
      const stmt = this.statements[_];
      stmt["free"]();
    }
    for (_ in this.functions) {
      const func = this.functions[_];
      removeFunction(func);
    }
    this.functions = {};
    this.handleError(sqlite3_close_v2(this.db));
    return (this.db = null);
  }

  /* Delete the database
    Same as close but also remove the database from IndexedDB
  */
  wipe() {
    this.close();
    return FS.unlink("/" + this.filename);
  }

  /* Analyze a result code, return null if no error occured, and throw
    an error with a descriptive message otherwise
    @nodoc
    */
  handleError(returnCode: any) {
    if (returnCode === SQLite.OK) {
      return null;
    } else {
      const errmsg = sqlite3_errmsg(this.db);
      throw new Error(errmsg);
    }
  }

  /* Returns the number of rows modified, inserted or deleted by the
    most recently completed INSERT, UPDATE or DELETE statement on the
    database Executing any other type of SQL statement does not modify
    the value returned by this function.

    @return [Number] the number of rows modified
    */
  getRowsModified() {
    return sqlite3_changes(this.db);
  }

  /* Register a custom function with SQLite
    @example Register a simple function
        db.create_function("addOne", function(x) {return x+1;})
        db.exec("SELECT addOne(1)") // = 2

    @param name [String] the name of the function as referenced in SQL statements.
    @param func [Function] the actual function to be executed.
    */
  create_function(name: string, func: { apply: (arg0: null, arg1: any[]) => void; length: any; }) {
    const wrapped_func = function(cx: any, argc: any, argv: number) {
      // Parse the args from sqlite into JS objects
      let result;
      const args: any[] = [];
      for (
        let i = 0, end = argc, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--
      ) {
        const value_ptr = Module.getValue(argv + 4 * i, "i32");
        var value_type = sqlite3_value_type(value_ptr);
        const data_func = (() => {
          switch (false) {
            case value_type !== 1:
              return sqlite3_value_double;
            case value_type !== 2:
              return sqlite3_value_double;
            case value_type !== 3:
              return sqlite3_value_text;
            case value_type !== 4:
              return function(ptr: any) {
                const size = sqlite3_value_bytes(ptr);
                const blob_ptr = sqlite3_value_blob(ptr);
                const blob_arg = new Uint8Array(size);
                for (
                  let j = 0, end1 = size, asc1 = 0 <= end1; asc1 ? j < end1 : j > end1; asc1 ? j++ : j--
                ) {
                  blob_arg[j] = Module.HEAP8[blob_ptr + j];
                }
                return blob_arg;
              };
            default:
              return (ptr: any) => null;
          }
        })();

        const arg = data_func(value_ptr);
        args.push(arg);
      }

      // Invoke the user defined function with arguments from SQLite
      try {
        result = func.apply(null, args);
      } catch (error) {
        sqlite3_result_error(cx, error, -1);
        return;
      }

      // Return the result of the user defined function to SQLite
      switch (typeof result) {
        case "boolean":
          sqlite3_result_int(cx, result ? 1 : 0);
          break;
        case "number":
          sqlite3_result_double(cx, result);
          break;
        case "string":
          sqlite3_result_text(cx, result, -1, -1);
          break;
        case "object":
          if (result === null) {
            sqlite3_result_null(cx);
          } else if (result.length != null) {
            const blobptr = Module.allocate(result, "i8", Module.ALLOC_NORMAL);
            sqlite3_result_blob(cx, blobptr, result.length, -1);
            Module._free(blobptr);
          } else {
            sqlite3_result_error(
              cx,
              `Wrong API use : tried to return a value of an unknown type (${result}).`,
              -1
            );
          }
          break;
        default:
          sqlite3_result_null(cx);
      }
    };
    if (name in this.functions) {
      removeFunction(this.functions[name]);
      delete this.functions[name];
    }
    // Generate a pointer to the wrapped, user defined function, and register with SQLite.
    const func_ptr = addFunction(wrapped_func);
    this.functions[name] = func_ptr;
    this.handleError(
      sqlite3_create_function_v2(
        this.db,
        name,
        func.length,
        SQLite.UTF8,
        0,
        func_ptr,
        0,
        0,
        0
      )
    );
    return this;
  }
}
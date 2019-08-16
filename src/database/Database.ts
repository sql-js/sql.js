import { Database as DatabaseInterface } from '../interfaces/Database';
import { ConnectionOptions } from '../interfaces/ConnectionOptions';
import { SQLite, NULL_PTR } from './Helper';
import { Statement } from './Statement';
import { sqlite3_open, sqlite3_exec, sqlite3_prepare_v2_sqlptr, sqlite3_prepare_v2, sqlite3_close_v2, sqlite3_errmsg, sqlite3_changes, sqlite3_value_type, sqlite3_value_double, sqlite3_value_text, sqlite3_value_bytes, sqlite3_value_blob, sqlite3_result_error, sqlite3_result_int, sqlite3_result_double, sqlite3_result_text, sqlite3_result_null, sqlite3_result_blob, sqlite3_create_function_v2, RegisterExtensionFunctions } from './lib/sqlite3';

const apiTemp = stackAlloc(4);

export const whitelistedFunctions = [
  'mount',
  'saveChanges',
  'run',
  'exec',
  'prepare',
  'export',
  'close',
  'wipe',
  'getRowsModified',
  'createFunction',
];

export class Database implements DatabaseInterface {
  private pDatabase?: number;
  private filename?: string;
  private static readonly mountName = '/sqleet';

  // A list of all prepared statements of the database
  public statements: Record<number, Statement> = {};

  // A list of all user function of the database (created by create_function call)
  private functions = {};

  constructor(private options?: ConnectionOptions, private identifier: string = 'default') {}

  /* Mount the database
   */
  public mount(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.options || !this.options['key']) {
        return reject(new Error('An encryption key must be set, aborting the mount operation'));
      }

      FS.mkdir(Database.mountName);
      FS.mount(IDBFS, {}, Database.mountName);
      FS.syncfs(true, (error: any) => {
        if (error) {
          return reject(error);
        }

        const searchParams = new URLSearchParams();
        for (const option in this.options) {
          searchParams.set(option, this.options[option]);
        }

        this.filename = `${Database.mountName}/${this.identifier}.db`;

        this.handleError(sqlite3_open(`file:${this.filename}?${searchParams.toString()}`, apiTemp));
        this.pDatabase = Module.getValue(apiTemp, 'i32');

        RegisterExtensionFunctions(this.pDatabase);

        // Pragma defaults
        this.run('PRAGMA `encoding`="UTF-8";');

        return resolve();
      });
    });
  }

  // Persist data on disk
  public async saveChanges(): Promise<void> {
    this.ensureDatabaseIsOpen();
    return new Promise((resolve, reject) => {
      return FS.syncfs(false, (err: any) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
  
  /* Execute an SQL query, ignoring the rows it returns.

    If you use the params argument, you **cannot** provide an sql string that contains several
    queries (separated by ';')

    @example Insert values in a table
        db.run('INSERT INTO test VALUES (:age, :name)', {':age':18, ':name':'John'});
    */
  public async run(query: string, params?: any[]): Promise<void> {
    this.ensureDatabaseIsOpen();
    if (params) {
      const statementId = await this.prepare(query, params);
      this.statements[statementId].step();
      this.statements[statementId].free();
    } else {
      this.handleError(sqlite3_exec(this.pDatabase, query, 0, 0, apiTemp));
    }
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
    var res = db.exec('SELECT id FROM test; SELECT age,name FROM test;');
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
  public async exec(query: string): Promise<any[]> {
    this.ensureDatabaseIsOpen();

    const stack: number = stackSave();

    // Store the SQL string in memory. The string will be consumed, one statement
    // at a time, by sqlite3_prepare_v2_sqlptr.
    // Note that if we want to allocate as much memory as could _possibly_ be used, we can
    // we allocate bytes equal to 4* the number of chars in the sql string.
    // It would be faster, but this is probably a premature optimization
    let nextSqlPtr = allocateUTF8OnStack(query);

    // Used to store a pointer to the next SQL statement in the string
    const pzTail = stackAlloc(4);

    const results: any[] = [];
    while (Module.getValue(nextSqlPtr, 'i8') !== NULL_PTR) {
      Module.setValue(apiTemp, 0, 'i32');
      Module.setValue(pzTail, 0, 'i32');
      this.handleError(
        sqlite3_prepare_v2_sqlptr(this.pDatabase, nextSqlPtr, -1, apiTemp, pzTail)
      );
      const pStmt = Module.getValue(apiTemp, 'i32'); // Pointer to a statement, or null
      nextSqlPtr = Module.getValue(pzTail, 'i32');

      if (pStmt === NULL_PTR) {
        // Empty statement
        continue;
      }

      const stmt = new Statement(pStmt, this);
      let curresult;

      while (stmt.step()) {
        if (!curresult) {
          curresult = {
            columns: stmt.getColumnNames(),
            values: []
          };
          results.push(curresult);
        }
        curresult.values.push(stmt.get());
      }
      stmt.free();
    }
    stackRestore(stack);
    return results;
  }

  // Prepare an SQL statement
  public async prepare(query: string, params: any[]): Promise<number> {
    Module.setValue(apiTemp, 0, 'i32');
    this.handleError(sqlite3_prepare_v2(this.pDatabase, query, -1, apiTemp, NULL_PTR));

    // Pointer to a statement, or null
    const pStmt = Module.getValue(apiTemp, 'i32');
    if (pStmt === NULL_PTR) {
      throw new Error('Nothing to prepare');
    }

    const stmt = new Statement(pStmt, this);
    if (params) {
      stmt.bind(params);
    }
    this.statements[pStmt] = stmt;

    return pStmt;
  }

  /* Exports the contents of the database to a binary array
    @return [Uint8Array] An array of bytes of the SQLite3 database file
    */
  public async export(): Promise<Uint8Array> {
    this.close();

    if (!this.filename) {
      throw new Error('Filename not available, did you used mount()?');
    }
    const binaryDb = FS.readFile(this.filename, {
      encoding: 'binary'
    }) as Uint8Array;

    await this.mount();
    
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
  public async close(): Promise<void> {
    for (let _statement in this.statements) {
      const stmt = this.statements[_statement];
      stmt.free();
    }
    for (let _function in this.functions) {
      const func = this.functions[_function];
      removeFunction(func);
    }

    this.functions = {};
    this.statements = {};
    
    this.handleError(sqlite3_close_v2(this.pDatabase));

    this.pDatabase = undefined;
  }

  /* Delete the database
    Same as close but also remove the database from IndexedDB
  */
  public async wipe(): Promise<void> {
    this.close();

    if (!this.filename) {
      throw new Error('Filename not available, did you used mount()?');
    }
    FS.unlink(this.filename);
  }

  /* Returns the number of rows modified, inserted or deleted by the
    most recently completed INSERT, UPDATE or DELETE statement on the
    database Executing any other type of SQL statement does not modify
    the value returned by this function.

    @return [Number] the number of rows modified
    */
  public async getRowsModified(): Promise<number> {
    return sqlite3_changes(this.pDatabase);
  }

  /* Register a custom function with SQLite
    @example Register a simple function
        db.createFunction('addOne', function(x) {return x+1;})
        db.exec('SELECT addOne(1)') // = 2

    @param name [String] the name of the function as referenced in SQL statements.
    @param func [Function] the actual function to be executed.
    */
  /*public async createFunction(name: string, func: { apply: (arg0: null, arg1: any[]) => void; length: any; }): Promise<any> {
    const wrapped_func = function(cx: any, argc: any, argv: number) {
      // Parse the args from sqlite into JS objects
      let result;
      const args: any[] = [];
      for (
        let i = 0, end = argc, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--
      ) {
        const value_ptr = Module.getValue(argv + 4 * i, 'i32');
        var value_type = sqlite3_value_type(value_ptr);
        const data_func = (() => {
          switch (false) {
            case value_type !== SQLite.INTEGER:
              return sqlite3_value_double;
            case value_type !== SQLite.FLOAT:
              return sqlite3_value_double;
            case value_type !== SQLite.TEXT:
              return sqlite3_value_text;
            case value_type !== SQLite.BLOB:
              return (ptr: number) => {
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
        case 'boolean':
          sqlite3_result_int(cx, result ? 1 : 0);
          break;
        case 'number':
          sqlite3_result_double(cx, result);
          break;
        case 'string':
          sqlite3_result_text(cx, result, -1, -1);
          break;
        case 'object':
          if (result === null) {
            sqlite3_result_null(cx);
          } else if (result.length != null) {
            const blobptr = Module.allocate(result, 'i8', Module.ALLOC_NORMAL, NULL_PTR);
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
        this.pDatabase,
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
  }*/

  // Utils
  private ensureDatabaseIsOpen(): void {
    if (!this.pDatabase) {
      throw new Error('Database closed');
    }
  }
  // Analyze a result code, return void if no error occured otherwise throw an error with a descriptive message
  public handleError(returnCode: SQLite): void {
    if (returnCode !== SQLite.OK) {
      const errmsg = sqlite3_errmsg(this.pDatabase);
      throw new Error(errmsg);
    }
  }
}
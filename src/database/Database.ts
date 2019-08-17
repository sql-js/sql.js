import { SQLite, NULL_PTR } from './Helper';
import { Statement } from './Statement';
import { sqlite3_open, sqlite3_exec, sqlite3_prepare_v2_sqlptr, sqlite3_prepare_v2, sqlite3_close_v2, sqlite3_errmsg, sqlite3_changes, sqlite3_value_type, sqlite3_value_double, sqlite3_value_text, sqlite3_value_bytes, sqlite3_value_blob, sqlite3_result_error, sqlite3_result_int, sqlite3_result_double, sqlite3_result_text, sqlite3_result_null, sqlite3_result_blob, sqlite3_create_function_v2, RegisterExtensionFunctions } from './lib/sqlite3';

const apiTemp = stackAlloc(4);

declare const URLSearchParams: any;

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

type ExecResultInterface = {columns?: string[]; values: any[]};

export class Database {
  private pDatabase?: number;
  private filename?: string;
  private static readonly mountName = '/sqleet';

  // A list of all prepared statements of the database
  public statements: Record<number, Statement> = {};

  constructor() {}

  // Mount the database
  public mount(options?: ConnectionOptions, identifier: string = 'default'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.pDatabase) {
        return reject(new Error('Database is already mounted'));
      }

      if (!options || !options['key']) {
        return reject(new Error('An encryption key must be set, aborting the mount operation'));
      }

      FS.mkdir(Database.mountName);
      FS.mount(IDBFS, {}, Database.mountName);
      FS.syncfs(true, async (error: any) => {
        if (error) {
          return reject(error);
        }

        const searchParams = new URLSearchParams();
        for (const option in options) {
          searchParams.set(option, options[option]);
        }

        this.filename = `${Database.mountName}/${identifier}.db`;

        this.handleError(sqlite3_open(`file:${this.filename}?${searchParams.toString()}`, apiTemp));
        this.pDatabase = Module.getValue(apiTemp, 'i32');

        //RegisterExtensionFunctions(this.pDatabase);

        // Pragma defaults
        await this.run('PRAGMA `encoding`="UTF-8";');

        return resolve();
      });
    });
  }

  // Persist data on disk
  public async saveChanges(): Promise<void> {
    this.ensureDatabaseIsOpen();
    return new Promise((resolve, reject) => FS.syncfs(false, (err: any) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
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

    This is a wrapper against Database.prepare, Statement.execute, Statement.get,
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
    */
  public async exec(query: string): Promise<ExecResultInterface[]> {
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

    const results: ExecResultInterface[] = [];
    while (Module.getValue(nextSqlPtr, 'i8') !== NULL_PTR) {
      Module.setValue(apiTemp, 0, 'i32');
      Module.setValue(pzTail, 0, 'i32');

      this.handleError(
        sqlite3_prepare_v2_sqlptr(this.pDatabase, nextSqlPtr, -1, apiTemp, pzTail)
      );
      const pointerStatement = Module.getValue(apiTemp, 'i32'); // Pointer to a statement, or null
      nextSqlPtr = Module.getValue(pzTail, 'i32');

      if (pointerStatement === NULL_PTR) {
        // Empty statement
        continue;
      }

      const stmt = new Statement(pointerStatement, this);
      const curresult: ExecResultInterface = {
        columns: undefined,
        values: []
      };

      while (stmt.step()) {
        if (!curresult.columns) {
          curresult.columns = stmt.getColumnNames();
        }
        curresult.values.push(stmt.get());
      }
      results.push(curresult);
      stmt.free();
    }
    stackRestore(stack);
    return results;
  }

  // Prepare an SQL statement
  private prepare(query: string, params: any[]): number {
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

  // Exports the contents of the database to a binary array
  public async export(encoding: 'binary' | 'utf8' = 'binary'): Promise<Uint8Array | string> {
    await this.close();

    if (!this.filename) {
      throw new Error('Filename not available, did you used mount()?');
    }
    const binaryDb = FS.readFile(this.filename, {
      encoding
    });

    await this.mount();
    
    return binaryDb;
  }

  /* Save and close the database, and all associated prepared statements.

    The memory associated to the database and all associated statements
    will be freed.

    **Warning**: A statement belonging to a database that has been closed cannot
    be used anymore.

    Databases **must** be closed, when you're finished with them, or the
    memory consumption will grow forever
    */
  public async close(saveOnClose: boolean = true): Promise<void> {
    // Save changes by default
    if (saveOnClose) {
      await this.saveChanges();
    }

    // Close and free all statements
    for (const statement in this.statements) {
      this.statements[statement].free();
    }
    this.statements = {};

    // Close the database internally
    this.handleError(sqlite3_close_v2(this.pDatabase));

    // Wipe the pointer
    this.pDatabase = undefined;
  }

  /* Delete the database
    Same as close but also remove the database from IndexedDB
  */
  public async wipe(): Promise<void> {
    await this.close(false);
    if (!this.filename) {
      throw new Error('Filename not available, did you used mount()?');
    }
    FS.unlink(this.filename);
  }

  /* Returns the number of rows modified, inserted or deleted by the
    most recently completed INSERT, UPDATE or DELETE statement on the
    database Executing any other type of SQL statement does not modify
    the value returned by this function.
    */
  public async getRowsModified(): Promise<number> {
    return sqlite3_changes(this.pDatabase);
  }

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
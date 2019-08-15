import { SQLite, NULL, __range__ } from './Helper';
import { sqlite3_clear_bindings, sqlite3_reset, sqlite3_finalize, sqlite3_step, sqlite3_column_double, sqlite3_column_text, sqlite3_column_blob, sqlite3_column_bytes, sqlite3_data_count, sqlite3_column_name, sqlite3_bind_text, sqlite3_bind_blob, sqlite3_bind_int, sqlite3_bind_double, sqlite3_bind_parameter_index, sqlite3_column_type } from './lib/sqlite3';
import Database from './Database';

/* Represents a prepared statement.

Prepared statements allow you to have a template sql string,
that you can execute multiple times with different parameters.

You can't instantiate this class directly, you have to use a [Database](Database.html)
object in order to create a statement.

**Warning**: When you close a database (using db.close()), all its statements are
closed too and become unusable.

@see Database.html#prepare-dynamic
@see https://en.wikipedia.org/wiki/Prepared_statement
*/
export class Statement {
  private stmt: any;
  private database: Database;
  private pos: number = 1; // Index of the leftmost parameter is 1
  private allocatedMemory: number[] = []; // Pointers to allocated memory, that need to be freed when the statemend is destroyed

  // Statements can't be created by the API user, only by Database::prepare
  constructor(stmt: number, database: Database) {
    this.stmt = stmt;
    this.database = database;
  }

  /* Bind values to the parameters, after having reseted the statement

    SQL statements can have parameters, named *'?', '?NNN', ':VVV', '@VVV', '$VVV'*,
    where NNN is a number and VVV a string.
    This function binds these parameters to the given values.

    *Warning*: ':', '@', and '$' are included in the parameters names

    *# Binding values to named parameters
    @example Bind values to named parameters
        var stmt = db.prepare('UPDATE test SET a=@newval WHERE id BETWEEN $mini AND $maxi');
        stmt.bind({$mini:10, $maxi:20, '@newval':5});
    - Create a statement that contains parameters like '$VVV', ':VVV', '@VVV'
    - Call Statement.bind with an object as parameter

    *# Binding values to parameters
    @example Bind values to anonymous parameters
        var stmt = db.prepare('UPDATE test SET a=? WHERE id BETWEEN ? AND ?');
        stmt.bind([5, 10, 20]);
      - Create a statement that contains parameters like '?', '?NNN'
      - Call Statement.bind with an array as parameter

    *# Value types
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
    */
  bind(values: any) {
    if (!this.stmt) {
      throw new Error('Statement closed');
    }

    this.reset();

    if (typeof values !== 'object') {
      throw new Error('Could not bind unknown object type')
    }

    if (Array.isArray(values)) {
      return this.bindFromArray(values);
    } else {
      return this.bindFromObject(values);
    }
  }

  /* Execute the statement, fetching the the next line of result,
    that can be retrieved with [Statement.get()](#get-dynamic) .

    @return [Boolean] true if a row of result available
    @throw [String] SQLite Error
    */
  public step() {
    if (!this.stmt) {
      throw new Error('Statement closed');
    }

    this.pos = 1;
    
    const ret = sqlite3_step(this.stmt);
    switch (ret) {
      case SQLite.ROW:
        return true;
      case SQLite.DONE:
        return false;
      default:
        return this.database.handleError(ret);
    }
  }

  // Internal methods to retrieve data from the results of a statement that has been executed
  getNumber(pos) {
    if (!pos) {
      pos = this.pos = this.pos++;
    }
    return sqlite3_column_double(this.stmt, pos);
  }
  getString(pos) {
    if (!pos) {
      pos = this.pos = this.pos++;
    }
    return sqlite3_column_text(this.stmt, pos);
  }
  getBlob(pos) {
    if (!pos) {
      pos = this.pos = this.pos++;
    }
    const size = sqlite3_column_bytes(this.stmt, pos);
    const ptr = sqlite3_column_blob(this.stmt, pos);
    const result = new Uint8Array(size);
    for (
      let i = 0, end = size, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--
    ) {
      result[i] = Module.HEAP8[ptr + i];
    }
    return result;
  }

  /* Get one row of results of a statement.
    If the first parameter is not provided, step must have been called before get.
    @param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
    @return [Array<String,Number,Uint8Array,null>] One row of result

    @example Print all the rows of the table test to the console

        var stmt = db.prepare('SELECT * FROM test');
        while (stmt.step()) console.log(stmt.get());
    */
  get(params?: any[] | {}): any[] {
    // Get all fields
    if (params) {
      this.bind(params);
      this.step();
    }

    const result: any = [];
    for (let field = 0, i = 0, ref = sqlite3_data_count(this.stmt); (0 <= ref ? i < ref : i > ref); field = 0 <= ref ? ++i : --i) {
      const value = sqlite3_column_type(this.stmt, field);
      switch (value) {
        case SQLite.INTEGER:
        case SQLite.FLOAT:
          result.push(this.getNumber(field));
          break;
        case SQLite.TEXT:
          result.push(this.getString(field));
          break;
        case SQLite.BLOB:
          result.push(this.getBlob(field));
          break;
        default:
          result.push(null);
          break;
      }
    }

    return result;
  }

  /* Get the list of column names of a row of result of a statement.
    @return [Array<String>] The names of the columns
    @example

        var stmt = db.prepare('SELECT 5 AS nbr, x'616200' AS data, NULL AS null_value;');
        stmt.step(); // Execute the statement
        console.log(stmt.getColumnNames()); // Will print ['nbr','data','null_value']
    */
  getColumnNames() {
    return __range__(0, sqlite3_data_count(this.stmt), false).map(i =>
      sqlite3_column_name(this.stmt, i)
    );
  }

  /* Get one row of result as a javascript object, associating column names with
    their value in the current row.
    @param [Array,Object] Optional: If set, the values will be bound to the statement, and it will be executed
    @return [Object] The row of result
    @see [Statement.get](#get-dynamic)

    @example

      const stmt = db.prepare('SELECT 5 AS nbr, x'616200' AS data, NULL AS null_value;');
      stmt.step(); // Execute the statement
      console.log(stmt.getAsObject()); // Will print {nbr:5, data: Uint8Array([1,2,3]), null_value:null}
    */
  public getAsObject(params = undefined) {
    const values = this.get(params);
    const names = this.getColumnNames();

    const rowObject = {};
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      rowObject[name] = values[i];
    }
    return rowObject;
  }

  /* Shorthand for bind + step + reset
    Bind the values, execute the statement, ignoring the rows it returns, and resets it
    @param [Array,Object] Value to bind to the statement
    */
  public run(values) {
    if (values) {
      this.bind(values);
    }
    this.step();
    this.reset();
  }

  // Internal methods to bind values to parameters
  // @private
  // @nodoc
  bindString(string: string, pos: number = this.pos++) {
    const bytes = Module.intArrayFromString(string);
    const strptr = Module.allocate(bytes, 'i8', Module.ALLOC_NORMAL, NULL);
    this.allocatedMemory.push(strptr);
    this.database.handleError(
      sqlite3_bind_text(this.stmt, pos, strptr, bytes.length - 1, 0)
    );
    return true;
  }

  // @nodoc
  bindBlob(array: number[], pos: number = this.pos++) {
    let blobptr = Module.allocate(array, 'i8', Module.ALLOC_NORMAL, NULL);
    this.allocatedMemory.push(blobptr);
    this.database.handleError(
      sqlite3_bind_blob(this.stmt, pos, blobptr, array.length, 0)
    );
    return true;
  }

  // @private
  // @nodoc
  bindNumber(num: number, pos: number = this.pos++) {
    const IS_INT = (num | 0);
    const bindfunc = num === IS_INT ? sqlite3_bind_int : sqlite3_bind_double;
    this.database.handleError(bindfunc(this.stmt, pos, num));
    return true;
  }

  // @nodoc
  bindNull(pos: number = this.pos++) {
    return sqlite3_bind_blob(this.stmt, pos, 0, 0, 0) === SQLite.OK;
  }
  
  // Call bindNumber or bindString appropriatly
  // @private
  // @nodoc
  bindValue(value: any, pos: number = this.pos++) {
    switch (typeof value) {
      case 'string':
        return this.bindString(value, pos);
      case 'number':
        return this.bindNumber(value, pos);
      case 'boolean':
        return this.bindNumber(value ? 1 : 0, pos);
      case 'object':
        if (value === null) {
          return this.bindNull(pos);
        } else if (value.length != null) {
          return this.bindBlob(value, pos);
        }
    }

    throw new Error(`Wrong API use: tried to bind a value of an unknown type (${value}).`);
  }
  /* Bind names and values of an object to the named parameters of the statement
    @param [Object]
    @private
    @nodoc
    */
  bindFromObject(valuesObj) {
    for (let name in valuesObj) {
      const value = valuesObj[name];
      const num = sqlite3_bind_parameter_index(this.stmt, name);
      if (num !== 0) {
        this.bindValue(value, num);
      }
    }
    return true;
  }
  /* Bind values to numbered parameters
    @param [Array]
    @private
    @nodoc
    */
  bindFromArray(values) {
    for (let num = 0; num < values.length; num++) {
      const value = values[num];
      this.bindValue(value, num + 1);
    }
    return true;
  }

  /* Reset a statement, so that it's parameters can be bound to new values
    It also clears all previous bindings, freeing the memory used by bound parameters.
    */
  public reset() {
    this.freemem();
    return (
      sqlite3_clear_bindings(this.stmt) === SQLite.OK &&
      sqlite3_reset(this.stmt) === SQLite.OK
    );
  }

  /* Free the memory allocated during parameter binding
    */
  private freemem() {
    let mem: number | undefined;
    while (mem = this.allocatedMemory.pop()) {
      Module._free(mem);
    }
  }

  /* Free the memory used by the statement
    @return [Boolean] true in case of success
    */
  public free() {
    this.freemem();
    const res = sqlite3_finalize(this.stmt) === SQLite.OK;
    delete this.database.statements[this.stmt];
    this.stmt = NULL;
    return res;
  }
}

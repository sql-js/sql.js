---
title: Statement
kind: class
longname: Statement
description: "Represents a prepared statement. Prepared statements allow you to have a template sql string, that you can execute multiple times with different parameters. You can't instantiate this class directly, you have to use a {@link Database} object in order to create a statement. Warnings When you close a database (using db.close()), all its statements are closed too and become unusable. After calling db.prepare() you must manually free the assigned memory by calling Statement.free(). Failure to do this will cause subsequent 'DROP TABLE ...' statements to fail with 'Uncaught Error: database table is locked'. Statements can't be created by the API user directly, only by Database::prepare"
---

# Statement

<SourceLink href="/source/api-js/#L272" label="api.js:272" />

Represents a prepared statement. Prepared statements allow you to have a template sql string, that you can execute multiple times with different parameters.

You can't instantiate this class directly, you have to use a [Database](/database) object in order to create a statement.

**Warnings**

1. When you close a database (using db.close()), all its statements are closed too and become unusable.
1. After calling db.prepare() you must manually free the assigned memory by calling Statement.free(). Failure to do this will cause subsequent 'DROP TABLE ...' statements to fail with 'Uncaught Error: database table is locked'.

Statements can't be created by the API user directly, only by Database::prepare

**Alias:** `Statement`

- **See:**
  - [Database#prepare](/database#prepare)
  - [https://en.wikipedia.org/wiki/Prepared_statement](https://en.wikipedia.org/wiki/Prepared_statement)

---

## Constructor

<Signature code="new Statement(stmt1: number, db: Database): Statement" />

**Parameters**

- `stmt1` (number) — The SQLite statement reference
- `db` ([Database](/database)) — The database from which this statement was created

---

## Instance Methods

<MemberHeading id="bind" depth="3" name="bind" sig="bind(values: Statement.BindParams): boolean" />

<MemberMeta sourceHref="/source/api-js/#L326" sourceLabel="api.js:326" />

Bind values to the parameters, after having reseted the statement. If values is null, do nothing and return true.

SQL statements can have parameters, named _'?', '?NNN', ':VVV', '@VVV', '$VVV'_, where NNN is a number and VVV a string. This function binds these parameters to the given values.

_Warning_: ':', '@', and '$' are included in the parameters names

## Value types

| Javascript type   | SQLite type   |
| ----------------- | ------------- |
| number            | REAL, INTEGER |
| boolean           | INTEGER       |
| string            | TEXT          |
| Array, Uint8Array | BLOB          |
| null              | NULL          |

**Parameters**

- `values` ([Statement.BindParams](/statement#bindparams)) — The values to bind

**Returns**

- `boolean` — true if it worked

**Throws**

- `String` — SQLite Error

**Example**

Bind values to named parameters

```js
var stmt = db.prepare(
        "UPDATE test SET a=@newval WHERE id BETWEEN $mini AND $maxi"
    );
    stmt.bind({$mini:10, $maxi:20, '@newval':5});
```

Bind values to anonymous parameters

```js
// Create a statement that contains parameters like '?', '?NNN'
var stmt = db.prepare("UPDATE test SET a=? WHERE id BETWEEN ? AND ?");
// Call Statement.bind with an array as parameter
stmt.bind([5, 10, 20]);
```

- **See:**
  - [http://www.sqlite.org/datatype3.html](http://www.sqlite.org/datatype3.html)
  - [http://www.sqlite.org/lang_expr.html#varparam](http://www.sqlite.org/lang_expr.html#varparam)

<MemberHeading id="step" depth="3" name="step" sig="step(): boolean" />

<MemberMeta sourceHref="/source/api-js/#L344" sourceLabel="api.js:344" />

Execute the statement, fetching the the next line of result, that can be retrieved with `Statement.get`.

**Returns**

- `boolean` — true if a row of result available

**Throws**

- `String` — SQLite Error

<MemberHeading id="get" depth="3" name="get" sig="get(params?: Statement.BindParams): Array.<Database.SqlValue>" />

<MemberMeta sourceHref="/source/api-js/#L423" sourceLabel="api.js:423" />

Get one row of results of a statement. If the first parameter is not provided, step must have been called before.

**Parameters**

- `params` ([Statement.BindParams](/statement#bindparams), optional) — If set, the values will be bound to the statement before it is executed

**Returns**

- `Array.<`[`Database.SqlValue`](/database#sqlvalue)`>` — One row of result

**Example**

Print all the rows of the table test to the console

```js
var stmt = db.prepare("SELECT * FROM test");
    while (stmt.step()) console.log(stmt.get());

    <caption>Enable BigInt support</caption>
    var stmt = db.prepare("SELECT * FROM test");
    while (stmt.step()) console.log(stmt.get(null, {useBigInt: true}));
```

<MemberHeading id="getcolumnnames" depth="3" name="getColumnNames" sig="getColumnNames(): Array.<string>" />

<MemberMeta sourceHref="/source/api-js/#L464" sourceLabel="api.js:464" />

Get the list of column names of a row of result of a statement.

**Returns**

- `Array.<string>` — The names of the columns

**Example**

```js
var stmt = db.prepare(
        "SELECT 5 AS nbr, x'616200' AS data, NULL AS null_value;"
    );
    stmt.step(); // Execute the statement
    console.log(stmt.getColumnNames());
    // Will print ['nbr','data','null_value']
```

<MemberHeading
  id="getasobject"
  depth="3"
  name="getAsObject"
  sig="getAsObject(
	params?: Statement.BindParams,
): Object.<string, Database.SqlValue>"
/>

<MemberMeta sourceHref="/source/api-js/#L489" sourceLabel="api.js:489" />

Get one row of result as a javascript object, associating column names with their value in the current row.

**Parameters**

- `params` ([Statement.BindParams](/statement#bindparams), optional) — If set, the values will be bound to the statement, and it will be executed

**Returns**

- `Object.<string, `[`Database.SqlValue`](/database#sqlvalue)`>` — The row of result

**Example**

```js
var stmt = db.prepare(
            "SELECT 5 AS nbr, x'010203' AS data, NULL AS null_value;"
        );
        stmt.step(); // Execute the statement
        console.log(stmt.getAsObject());
        // Will print {nbr:5, data: Uint8Array([1,2,3]), null_value:null}
```

- **See:**
  - `Statement.get`

<MemberHeading id="getsql" depth="3" name="getSQL" sig="getSQL(): string" />

<MemberMeta sourceHref="/source/api-js/#L500" sourceLabel="api.js:500" />

Get the SQL string used in preparing this statement.

**Returns**

- `string` — The SQL string

<MemberHeading id="getnormalizedsql" depth="3" name="getNormalizedSQL" sig="getNormalizedSQL(): string" />

<MemberMeta sourceHref="/source/api-js/#L516" sourceLabel="api.js:516" />

Get the SQLite's normalized version of the SQL string used in preparing this statement. The meaning of "normalized" is not well-defined: see [the SQLite documentation](https://sqlite.org/c3ref/expanded_sql.html).

**Returns**

- `string` — The normalized SQL string

**Example**

```js
db.run("create table test (x integer);");
     stmt = db.prepare("select * from test where x = 42");
     // returns "SELECT*FROM test WHERE x=?;"
```

<MemberHeading id="run" depth="3" name="run" sig="run(values?: Statement.BindParams)" />

<MemberMeta sourceHref="/source/api-js/#L525" sourceLabel="api.js:525" />

Shorthand for bind + step + reset Bind the values, execute the statement, ignoring the rows it returns, and resets it

**Parameters**

- `values` ([Statement.BindParams](/statement#bindparams), optional) — Value to bind to the statement

<MemberHeading id="reset" depth="3" name="reset" sig="reset()" />

<MemberMeta sourceHref="/source/api-js/#L656" sourceLabel="api.js:656" />

Reset a statement, so that its parameters can be bound to new values It also clears all previous bindings, freeing the memory used by bound parameters.

<MemberHeading id="freemem" depth="3" name="freemem" sig="freemem()" />

<MemberMeta sourceHref="/source/api-js/#L665" sourceLabel="api.js:665" />

Free the memory allocated during parameter binding

<MemberHeading id="free" depth="3" name="free" sig="free(): boolean" />

<MemberMeta sourceHref="/source/api-js/#L675" sourceLabel="api.js:675" />

Free the memory used by the statement

**Returns**

- `boolean` — true in case of success

## Other

<MemberHeading id="bindparams" depth="3" name="BindParams" sig="BindParams: Array.<Database.SqlValue> | Object.<string, Database.SqlValue> | null" />

<MemberMeta badges="static" sourceHref="/source/api-js/#L288" sourceLabel="api.js:288" />

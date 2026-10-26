---
title: SqlJs
kind: module
longname: module:SqlJs
---

# SqlJs

<SourceLink href="/source/api-js/#L53" label="api.js:53" />

---

## Other

<MemberHeading id="statement" depth="3" name="Statement" sig="Statement" />

<MemberMeta sourceHref="/source/api-js/#L272" sourceLabel="api.js:272" />

Represents a prepared statement. Prepared statements allow you to have a template sql string, that you can execute multiple times with different parameters.

You can't instantiate this class directly, you have to use a [Database](/database) object in order to create a statement.

**Warnings**

1. When you close a database (using db.close()), all its statements are closed too and become unusable.
1. After calling db.prepare() you must manually free the assigned memory by calling Statement.free(). Failure to do this will cause subsequent 'DROP TABLE ...' statements to fail with 'Uncaught Error: database table is locked'.

Statements can't be created by the API user directly, only by Database::prepare

**Alias:** `Statement`

**Parameters**

- `stmt1` (number) — The SQLite statement reference
- `db` ([Database](/database)) — The database from which this statement was created

* **See:**
  - [Database#prepare](/database#prepare)
  - [https://en.wikipedia.org/wiki/Prepared_statement](https://en.wikipedia.org/wiki/Prepared_statement)

<MemberHeading id="statementiterator" depth="3" name="StatementIterator" sig="StatementIterator" />

<MemberMeta sourceHref="/source/api-js/#L725" sourceLabel="api.js:725" />

**Implements:&#x20;**`Iterator<Statement>`, `Iterable<Statement>`

An iterator over multiple SQL statements in a string, preparing and returning a Statement object for the next SQL statement on each iteration.

You can't instantiate this class directly, you have to use a [Database](/database) object in order to create a statement iterator

{@see Database#iterateStatements}

**Alias:** `StatementIterator`

**Parameters**

- `sql` (string) — A string containing multiple SQL statements
- `db` ([Database](/database)) — The database from which this iterator was created

**Example**

```js
// loop over and execute statements in string sql
for (let statement of db.iterateStatements(sql) {
    statement.step();
    // get results, etc.
    // do not call statement.free() manually, each statement is freed
    // before the next one is parsed
}

// capture any bad query exceptions with feedback
// on the bad sql
let it = db.iterateStatements(sql);
try {
    for (let statement of it) {
        statement.step();
    }
} catch(e) {
    console.log(
        `The SQL string "${it.getRemainingSQL()}" ` +
        `contains the following error: ${e}`
    );
}
```

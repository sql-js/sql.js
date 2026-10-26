---
title: StatementIterator
kind: class
longname: StatementIterator
description: An iterator over multiple SQL statements in a string, preparing and returning a Statement object for the next SQL statement on each iteration. You can't instantiate this class directly, you have to use a {@link Database} object in order to create a statement iterator {@see Database#iterateStatements}
---

# StatementIterator

**Implements:&#x20;**`Iterator<Statement>`, `Iterable<Statement>`

<SourceLink href="/source/api-js/#L738" label="api.js:738" />

An iterator over multiple SQL statements in a string, preparing and returning a Statement object for the next SQL statement on each iteration.

You can't instantiate this class directly, you have to use a [Database](/database) object in order to create a statement iterator

{@see Database#iterateStatements}

**Alias:** `StatementIterator`

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

---

## Constructor

<Signature
  code="new StatementIterator(
	sql: string,
	db: Database,
): StatementIterator"
/>

**Parameters**

- `sql` (string) — A string containing multiple SQL statements
- `db` ([Database](/database)) — The database from which this iterator was created

---

## Instance Methods

<MemberHeading id="next" depth="3" name="next" sig="next(): StatementIterator.StatementIteratorResult" />

<MemberMeta sourceHref="/source/api-js/#L762" sourceLabel="api.js:762" />

Prepare the next available SQL statement

**Returns**

- [`StatementIterator.StatementIteratorResult`](/statementiterator#statementiteratorresult)

**Throws**

- `String` — SQLite error or invalid iterator error

<MemberHeading id="return" depth="3" name="[&#x22;return&#x22;]" sig="['return'](): StatementIterator.StatementIteratorResult" />

<MemberMeta sourceHref="/source/api-js/#L815" sourceLabel="api.js:815" />

Free the resources held by this iterator, in case it will not be run to completion. This is called automatically when a for..of loop exits early (e.g. via break, return, or an exception), and can also be called manually.

**Returns**

- [`StatementIterator.StatementIteratorResult`](/statementiterator#statementiteratorresult)

<MemberHeading id="getremainingsql" depth="3" name="getRemainingSQL" sig="getRemainingSQL(): String" />

<MemberMeta sourceHref="/source/api-js/#L827" sourceLabel="api.js:827" />

Get any un-executed portions remaining of the original SQL string

**Returns**

- `String`

## Other

<MemberHeading id="statementiteratorresult" depth="3" name="StatementIteratorResult" sig="StatementIteratorResult: Object | Object" />

<MemberMeta badges="static" sourceHref="/source/api-js/#L758" sourceLabel="api.js:758" />

**Properties**

- `value` ([Statement](/module/sqljs#statement)) — the next available Statement (as returned by `Database.prepare`)
- `done` (boolean) — true if there are no more available statements

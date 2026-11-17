---
title: SqliteError
kind: typedef
longname: SqliteError
description: An error SQLite returned, thrown as an Error whose message is SQLite's. Its code and errcode say which error it was, so it can be told apart without reading the message.
---

# SqliteError

<SourceLink href="/source/api-js/#L51" label="api.js:51" />

An error SQLite returned, thrown as an `Error` whose message is SQLite's. Its `code` and `errcode` say which error it was, so it can be told apart without reading the message.

**Properties**

- `code` (string) — The name of SQLite's extended result code, such as `"SQLITE_CONSTRAINT_UNIQUE"`
- `errcode` (number) — The number of that code, such as `2067`, which is `SQL.constants.SQLITE_CONSTRAINT_UNIQUE`

**Type**

`Error`

**Example**

```js
try {
    db.run("INSERT INTO users (email) VALUES ('a@example.com')");
} catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
        // the email is taken
    }
}
```

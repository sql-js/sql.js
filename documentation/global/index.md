---
title: Globals
kind: global
longname: Globals
---

# Globals

---

## Instance Methods

<MemberHeading id="initsqljs" depth="3" name="initSqlJs" sig="initSqlJs(config: SqlJsConfig): SqlJs" />

<MemberMeta sourceHref="/source/api-js/#L55" sourceLabel="api.js:55" />

Asynchronously initializes sql.js

**Parameters**

- `config` ([SqlJsConfig](/sqljsconfig)) — module inititialization parameters

**Returns**

- [`SqlJs`](/sqljs)

**Example**

```js
initSqlJs({
 locateFile: name => '/path/to/assets/' + name
}).then(SQL => {
 const db = new SQL.Database();
 const result = db.exec("select 'hello world'");
 console.log(result);
})
```

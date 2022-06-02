# sql.js API documentation

## Introduction

If you need a quick intoduction with code samples that you can copy-and-paste,
head over to [sql.js.org](https://sql.js.org/)

## API

### The initSqlJs function

The root object in the API is the [`initSqlJs`](./global.html#initSqlJs) function,
that takes an [`SqlJsConfig`](./global.html#SqlJsConfig) parameter,
and returns an [SqlJs](./global.html#SqlJs) object

### The SqlJs object

`initSqlJs` returns the main sql.js object, the [**`SqlJs`**](./module-SqlJs.html) module, which contains :

#### Database

[**Database**](./Database.html) is the main class, that represents an SQLite database.

#### Statement

The [**Statement**](./Statement.html) class is used for prepared statements.

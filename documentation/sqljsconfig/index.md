---
title: SqlJsConfig
kind: typedef
longname: SqlJsConfig
---

# SqlJsConfig

<SourceLink href="/source/api-js/#L40" label="api.js:40" />

**Properties**

- `locateFile` (function, optional) — a function that returns the full path to a resource given its file name
- `useOldExtensionFunctions` (boolean, optional, default: true) — Register deprecated extension functions for backwards compatibility. Calling a legacy function prints a deprecation warning. Set to false to use SQLite's native functions without legacy overrides. The first initialization determines this option for all databases.

**Type**

`Object`

- **See:**
  - [https://emscripten.org/docs/api_reference/module.html](https://emscripten.org/docs/api_reference/module.html)

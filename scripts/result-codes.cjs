"use strict";

// Writes the names of SQLite's result codes, keyed by number, as read from
// the sqlite3.h the build compiles, so the table always matches the bundled
// SQLite. Usage: node scripts/result-codes.cjs <sqlite3.h> <output.js>
const fs = require("node:fs");
const process = require("node:process");

const [header, output] = process.argv.slice(2);
const source = fs.readFileSync(header, "utf8");

// The primary result codes are the block from SQLITE_OK to SQLITE_DONE.
const start = source.indexOf("#define SQLITE_OK ");
const end = source.indexOf("\n", source.indexOf("#define SQLITE_DONE "));
const codes = new Map();
const primary = /^#define (SQLITE_[A-Z_]+) +(\d+)/gm;
for (const [, name, value] of source.slice(start, end).matchAll(primary)) {
    codes.set(name, Number(value));
}
// Every extended result code is written as a primary one with a byte above it.
const extended = /^#define (SQLITE_[A-Z_]+) +\((SQLITE_[A-Z]+) *\| *\((\d+) *<< *8\)\)/gm;
for (const [, name, base, shift] of source.matchAll(extended)) {
    if (!codes.has(base)) throw new Error(`${name}: unknown result code ${base}`);
    codes.set(name, codes.get(base) | (Number(shift) << 8));
}
if (!codes.has("SQLITE_CONSTRAINT_UNIQUE")) {
    throw new Error(`no result codes found in ${header}`);
}

const entries = [...codes].map(([name, value]) => `    ${value}: ${JSON.stringify(name)}`);
fs.writeFileSync(output, `// Generated from ${header} by scripts/result-codes.cjs.\n`
    + `var SQLITE_CODE_NAMES = {\n${entries.join(",\n")}\n};\n`);

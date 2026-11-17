"use strict";

// Writes every integer constant sqlite3.h defines, and the names of its result
// codes, as a script the build runs before src/api.js.
// Usage: emcc -E -dM -x c sqlite3.h | node scripts/constants.cjs sqlite3.h
// The macros come from the C preprocessor on stdin; the header itself is read
// only for the comments that mark where its primary result codes are.
const fs = require("node:fs");
const process = require("node:process");

const macros = Object.fromEntries(
    [...fs.readFileSync(0, "utf8").matchAll(/^#define (SQLITE_\w+) (.+)$/gm)]
        .map(([, name, expr]) => [name, expr])
);

const constants = {};
function get(name) {
    if (name in constants) return constants[name];
    const expr = macros[name].replace(/\bSQLITE_\w+\b/g, (n) => `(${get(n)})`);
    // Integer arithmetic alone: anything else (a string, a cast, a function)
    // is not a constant JavaScript can hold.
    if (!/^(?:0[xX][\da-fA-F]+|[\s\d()|&^~<>+*/-])*$/.test(expr)) throw new Error(`${name} is not an integer`);
    const value = Function(`return (${expr})`)();
    if (!Number.isSafeInteger(value)) throw new Error(`${name} is not an integer`);
    constants[name] = value;
    return value;
}
for (const name of Object.keys(macros)) {
    try {
        get(name);
    } catch {
        // Not an integer constant.
    }
}

// The primary result codes are between sqlite3.h's beginning-of-error-codes
// and end-of-error-codes comments, and each extended one is defined as a
// primary one with a byte above it.
const header = fs.readFileSync(process.argv[2], "utf8");
const block = /\/\* beginning-of-error-codes \*\/([\s\S]*?)\/\* end-of-error-codes \*\//.exec(header);
if (!block) throw new Error("no error codes found in " + process.argv[2]);
const primary = new Set([...block[1].matchAll(/^#define (SQLITE_\w+)/gm)].map(([, name]) => name));
const resultCodes = Object.keys(constants).filter((name) => {
    if (primary.has(name)) return true;
    const base = /^\(\s*(SQLITE_\w+)\s*\|/.exec(macros[name]);
    return base !== null && primary.has(base[1]);
});
if (!resultCodes.includes("SQLITE_CONSTRAINT_UNIQUE")) throw new Error("no extended result codes found");

process.stdout.write("// Generated from sqlite3.h by scripts/constants.cjs.\n"
    + `var SQLITE_CONSTANTS = ${JSON.stringify(constants, null, 4)};\n`
    + `var SQLITE_RESULT_CODES = ${JSON.stringify(resultCodes, null, 4)};\n`);

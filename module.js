import * as wasm from "./dist/sql-wasm-module"

const def = await wasm.default();

export const Database = def.Database;

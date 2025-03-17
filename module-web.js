import * as wasm from "./dist/sql-wasm-module-web"

const def = await wasm.default();

export const Database = def.Database;

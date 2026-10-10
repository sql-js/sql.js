if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(
        "sql.js: the asm.js build is deprecated. "
        + "Use sql-wasm-inline.js (worker.sql-wasm-inline.js for workers) "
        + "for a single JavaScript file with embedded WebAssembly. "
        + "WebAssembly support is required. If you cannot migrate, please "
        + "tell us at https://github.com/sql-js/sql.js/issues/635."
    );
}

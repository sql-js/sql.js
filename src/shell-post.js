

        // The shell-pre.js and emcc-generated code goes above
        return Module;
    }); // The end of the promise being returned

  return initSqlJsPromise;
} // The end of our initSqlJs function

// This will allow the module to be used in ES6 or CommonJS
initSqlJs.default = initSqlJs;
if (typeof exports === 'object' && typeof module === 'object'){
    module.exports = initSqlJs;
}


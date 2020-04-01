/* global initSqlJs */
/* eslint-env worker */
/* eslint func-names: ["off"] */
/* eslint no-restricted-globals: ["error"] */


// encapsulate web-worker code to run in any env
(function () {
    "use strict";

    // isomorphism - do not run worker.js code if not in web-worker env
    if (!(
        typeof self === "object"
        && typeof importScripts === "function"
        && self
        && self.importScripts === importScripts
    )) {
        return;
    }

    // Declare toplevel variables
    var db;
    var sqlModuleReady;

    function onModuleReady(SQL) {
        function createDb(data) {
            if (db != null) db.close();
            db = new SQL.Database(data);
            return db;
        }

        var buff; var data; var result;
        data = this["data"];
        switch (data && data["action"]) {
            case "open":
                buff = data["buffer"];
                createDb(buff && new Uint8Array(buff));
                return postMessage({
                    id: data["id"],
                    ready: true
                });
            case "exec":
                if (db === null) {
                    createDb();
                }
                if (!data["sql"]) {
                    throw "exec: Missing query string";
                }
                return postMessage({
                    id: data["id"],
                    results: db.exec(data["sql"], data["params"])
                });
            case "each":
                if (db === null) {
                    createDb();
                }
                var callback = function callback(row) {
                    return postMessage({
                        id: data["id"],
                        row: row,
                        finished: false
                    });
                };
                var done = function done() {
                    return postMessage({
                        id: data["id"],
                        finished: true
                    });
                };
                return db.each(data["sql"], data["params"], callback, done);
            case "export":
                buff = db["export"]();
                result = {
                    id: data["id"],
                    buffer: buff
                };
                try {
                    return postMessage(result, [result]);
                } catch (error) {
                    return postMessage(result);
                }
            case "close":
                return db && db.close();
            default:
                throw new Error("Invalid action : " + (data && data["action"]));
        }
    }

    function onError(err) {
        return postMessage({
            id: this["data"]["id"],
            error: err["message"]
        });
    }

    // init web-worker onmessage event-handling
    db = null;
    sqlModuleReady = initSqlJs();
    self.onmessage = function onmessage(event) {
        return sqlModuleReady
            .then(onModuleReady.bind(event))
            .catch(onError.bind(event));
    };
}());

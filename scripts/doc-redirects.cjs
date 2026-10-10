"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Keep links to the pre-v5 JSDoc pages and member anchors working.
const aliases = {
    "Database.html": {
        route: "database/",
        fragments: {
            ".QueryExecResult": "database/queryexecresult/",
            ".SqlValue": "database/sqlvalue/",
            "~UpdateHookCallback": "database/updatehookcallback/"
        }
    },
    "Statement.html": {
        route: "statement/",
        fragments: { ".BindParams": "statement/bindparams/" }
    },
    "StatementIterator.html": {
        route: "statementiterator/",
        fragments: {
            ".StatementIteratorResult": "statementiterator/statementiteratorresult/"
        }
    },
    "global.html": {
        route: "global/",
        fragments: { SqlJs: "sqljs/", SqlJsConfig: "sqljsconfig/" }
    },
    "module-SqlJs.html": { route: "module/sqljs/" },
    "api.js.html": { route: "source/api-js/" }
};

for (const [filename, alias] of Object.entries(aliases)) {
    // Fail documentation generation if the new theme stops emitting a route.
    for (const route of [alias.route, ...Object.values(alias.fragments || {})]) {
        fs.accessSync(path.join("documentation", route, "index.html"));
    }
    const html = `<!doctype html>
<meta charset="utf-8">
<title>sql.js API documentation</title>
<p>This page has moved to <a href="./${alias.route}">the API documentation</a>.</p>
<script>
(function () {
    var alias = ${JSON.stringify(alias)};
    var fragment = decodeURIComponent(window.location.hash.slice(1));
    var route = (alias.fragments || {})[fragment];
    var hash = route ? "" : fragment.toLowerCase().replace(/-(dynamic|static)$/, "");
    window.location.replace("./" + (route || alias.route) + (hash ? "#" + hash : ""));
}());
</script>
`;
    fs.writeFileSync(path.join("documentation", filename), html);
}

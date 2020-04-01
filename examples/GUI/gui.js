(async function () {
    "use strict";
    var execBtn = document.getElementById("execute");
    var outputElm = document.getElementById('output');
    var errorElm = document.getElementById('error');
    var commandsElm = document.getElementById('commands');
    var dbFileElm = document.getElementById('dbfile');
    var savedbElm = document.getElementById('savedb');

    // Start the worker in which sql.js will run
    var SQL = await initSqlJs({
        locateFile: function (file) {
            return `../../dist/${file}`;
        }
    });
    var worker = new SQL.Worker("../../dist/sql-wasm-debug.js");

    // Open a database
    worker.postMessage({ action: 'open' });

    // Connect to the HTML element we 'print' to
    function print(text) {
        outputElm.innerHTML = text.replace(/\n/g, '<br>');
    }
    function error(e) {
        console.log(e);
        errorElm.style.height = '2em';
        errorElm.textContent = e.message;
    }

    function noerror() {
        errorElm.style.height = '0';
    }

    // Run a command in the database
    async function execute(commands) {
        tic();
        outputElm.textContent = "Fetching results...";
        var data;
        try {
            data = await worker.postMessage({ action: 'exec', sql: commands });
        } catch (errorCaught) {
            error({message: errorCaught});
            return;
        }
        var results = data.results;
        toc("Executing SQL");
        tic();
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
    }

    // Create an HTML table
    var tableCreate = function () {
        function valconcat(vals, tagName) {
            if (vals.length === 0) return '';
            var open = '<' + tagName + '>', close = '</' + tagName + '>';
            return open + vals.join(close + open) + close;
        }
        return function (columns, values) {
            var tbl = document.createElement('table');
            var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
            var rows = values.map(function (v) { return valconcat(v, 'td'); });
            html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
            tbl.innerHTML = html;
            return tbl;
        }
    }();

    // Execute the commands when the button is clicked
    function execEditorContents() {
        noerror()
        execute(editor.getValue() + ';');
    }
    execBtn.addEventListener("click", execEditorContents, true);

    // Performance measurement functions
    var tictime;
    if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
    function tic() { tictime = performance.now() }
    function toc(msg) {
        var dt = performance.now() - tictime;
        console.log((msg || 'toc') + ": " + dt + "ms");
    }

    // Add syntax highlihjting to the textarea
    var editor = CodeMirror.fromTextArea(commandsElm, {
        mode: 'text/x-mysql',
        viewportMargin: Infinity,
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        autofocus: true,
        extraKeys: {
            "Ctrl-Enter": execEditorContents,
            "Ctrl-S": savedb,
        }
    });

    // Load a db from a file
    dbFileElm.onchange = function () {
        var f = dbFileElm.files[0];
        var r = new FileReader();
        r.onload = async function () {
            tic();
            try {
                await worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
            }
            catch (exception) {
                await worker.postMessage({ action: 'open', buffer: r.result });
            }
            toc("Loading database from file");
            // Show the schema of the loaded database
            editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
            execEditorContents();
        }
        r.readAsArrayBuffer(f);
    }

    // Save the db to a file
    async function savedb() {
        tic();
        var data = await worker.postMessage({ action: 'export' });
        toc("Exporting the database");
        var arraybuff = data.buffer;
        var blob = new Blob([arraybuff]);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.href = window.URL.createObjectURL(blob);
        a.download = "sql.db";
        a.onclick = function () {
            setTimeout(function () {
                window.URL.revokeObjectURL(a.href);
            }, 1500);
        };
        a.click();
    }
    savedbElm.addEventListener("click", savedb, true);
}());

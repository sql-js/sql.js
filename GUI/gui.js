var execBtn = document.getElementById("execute");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var commandsElm = document.getElementById('commands');
var dbFileElm = document.getElementById('dbfile');
var savedbElm = document.getElementById('savedb');

// Connect to the HTML element we 'print' to
function print(text) {
    outputElm.innerHTML = text.replace(/\n/g, '<br>');
}
function error(e) {
  console.log(e);
	errorElm.style.height = '2em';
	errorElm.textContent = e.toString();
}
function noerror() {
		errorElm.style.height = '0';
}

// Open a database
var db = new SQL.Database();

// Run a command in the database
function execute(commands) {
  try {

  	tic();
    var data = db.exec(commands);
    toc("Executing SQL");

		tic();
    outputElm.innerHTML = "";
    for (var i=0; i<data.length; i++) {
    	outputElm.appendChild(tableCreate(data[i].columns, data[i].values));
    }
    toc("Displaying results");
  } catch(e) {
    error(e);
  }
}

// Create an HTML table
var tableCreate = function () {
  function valconcat(vals, tagName) {
    if (vals.length === 0) return '';
    var open = '<'+tagName+'>', close='</'+tagName+'>';
    return open + vals.join(close + open) + close;
  }
  return function (columns, values){
    var tbl  = document.createElement('table');
    var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
    var rows = values.map(function(v){ return valconcat(v, 'td'); });
    html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
	  tbl.innerHTML = html;
    return tbl;
  }
}();

// Execute the commands when the button is clicked
function execEditorContents () {
	noerror()
	execute (editor.getValue() + ';');
}
execBtn.addEventListener("click", execEditorContents, true);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) {window.performance = {now:Date.now}}
function tic () {tictime = performance.now()}
function toc(msg) {
	var dt = performance.now()-tictime;
	console.log((msg||'toc') + ": " + dt + "ms");
}

// Add syntax highlihjting to the textarea
var editor = CodeMirror.fromTextArea(commandsElm, {
    mode: 'text/x-mysql',
    viewportMargin: Infinity,
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets : true,
    autofocus: true
});

// Load a db from a file
dbFileElm.onchange = function() {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function() {
		var Uints = new Uint8Array(r.result);
		db.close(); // Close the old db (frees memory)
		db = new SQL.Database(Uints);
		// Show the schema of the loaded database
		editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
		execEditorContents();
	}
	r.readAsArrayBuffer(f);
}

// Save the db to a file
function savedb () {
	var arraybuff = db.export();
	var blob = new Blob([arraybuff]);
	var url = window.URL.createObjectURL(blob);
	window.location = url;
}
savedbElm.addEventListener("click", savedb, true);

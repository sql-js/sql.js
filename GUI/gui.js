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
	errorElm.style.height = '2em';
	errorElm.textContent = e.toString();
}
function noerror() {
		errorElm.style.height = '0';
}

// Open a database
var db = SQL.open();

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
function tableCreate(columns, values){
  var tbl  = document.createElement('table');

	var thead = document.createElement('thead');
	var tr = thead.insertRow();
	for(var j = 0; j < columns.length; j++){
		var th = document.createElement('th');
		th.appendChild(document.createTextNode(columns[j]));
		tr.appendChild(th);
	}
	tbl.appendChild(thead);

	for(var i = 0; i < values.length; i++){
		var tr = tbl.insertRow();
		for(var j = 0; j < columns.length; j++){
			var td = tr.insertCell();
			td.appendChild(document.createTextNode(values[i][j]));
		}
	}
  return tbl;
}

// Execute the commands when the button is clicked
function execEditorContents () {
	noerror()
	execute (editor.getValue() + ';');
}
execBtn.addEventListener("click", execEditorContents, true);

// Performance measurement functions
var tictime;
if (!performance) {performance = {now:Date.now}}
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
		db = SQL.open(Uints);
		// Show the schema of the loaded database
		editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
		execEditorContents();
	}
	r.readAsArrayBuffer(f);
}

// Save the db to a file
function savedb () {
	var arraybuff = db.exportData();
	var blob = new Blob([arraybuff]);
	var url = window.URL.createObjectURL(blob);
	window.location = url;
}
savedbElm.addEventListener("click", savedb, true);

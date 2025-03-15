// DOM Elements
const execBtn = document.getElementById("execute");
const outputElm = document.getElementById('output');
const errorElm = document.getElementById('error');
const commandsElm = document.getElementById('commands');
const dbFileElm = document.getElementById('dbfile');
const savedbElm = document.getElementById('savedb');
const editorStatusElm = document.getElementById('editorStatus');
const resultsStatusElm = document.getElementById('resultsStatus');
const queryTimeElm = document.getElementById('queryTime');
const panelResizerElm = document.getElementById('panelResizer');
const queryHistoryElm = document.getElementById('queryHistory');
const toggleHistoryBtn = document.getElementById('toggleHistory');
const resultsTabs = document.getElementById('resultsTabs');
const newTabBtn = document.getElementById('newTabBtn');

// State
let currentTabId = 'tab1';
let tabCounter = 1;
let queryHistory = [];
let isResizing = false;
let lastExecutionTime = 0;

// Start the worker in which sql.js will run
const worker = new Worker("../../dist/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: 'open' });

// Initialize resizable panels
initResizer();

// Initialize tabs
initTabs();

// Error handling
function error(e) {
	console.log(e);
	errorElm.style.height = 'auto';
	errorElm.textContent = e.message;
	errorElm.style.opacity = 1;
	
	updateStatus('error', `Error: ${e.message}`);
	
	setTimeout(() => {
		errorElm.style.opacity = 0;
		setTimeout(() => {
			errorElm.style.height = '0';
		}, 300);
	}, 5000);
}

function noerror() {
	errorElm.style.height = '0';
	errorElm.style.opacity = 0;
}

// Status updates
function updateStatus(type, message) {
	switch(type) {
		case 'executing':
			editorStatusElm.innerHTML = `<span class="status-info">Executing query...</span>`;
			resultsStatusElm.innerHTML = `<span class="status-info">Executing query...</span>`;
			break;
		case 'success':
			editorStatusElm.innerHTML = `<span class="status-success">Query executed successfully</span>`;
			resultsStatusElm.innerHTML = `<span class="status-success">${message}</span>`;
			break;
		case 'error':
			editorStatusElm.innerHTML = `<span class="status-error">Query failed</span>`;
			resultsStatusElm.innerHTML = `<span class="status-error">${message}</span>`;
			break;
		default:
			editorStatusElm.textContent = message;
			break;
	}
}

function updateQueryTime(time) {
	queryTimeElm.textContent = `Execution time: ${time.toFixed(2)}ms`;
	lastExecutionTime = time;
}

// Run a command in the database
function execute(commands, tabId = currentTabId) {
	tic();
	updateStatus('executing');
	
	// Get the output element for the current tab
	const tabOutputElm = document.querySelector(`#${tabId} .results-content`);
	if (!tabOutputElm) return;
	
	// Show loading indicator
	tabOutputElm.innerHTML = '<div class="loading"><div class="spinner"></div><span>Executing query...</span></div>';
	
	// Add to query history
	addToHistory(commands);
	
	worker.onmessage = function (event) {
		const results = event.data.results;
		const executionTime = toc("Executing SQL");
		
		if (!results) {
			error({message: event.data.error});
			return;
		}

		tic();
		tabOutputElm.innerHTML = "";
		
		if (results.length === 0) {
			tabOutputElm.innerHTML = '<div class="no-results">Query executed successfully. No results to display.</div>';
			updateStatus('success', 'Query executed with no results');
			return;
		}
		
		for (var i = 0; i < results.length; i++) {
			tabOutputElm.appendChild(tableCreate(results[i].columns, results[i].values));
		}
		
		const displayTime = toc("Displaying results");
		updateQueryTime(executionTime + displayTime);
		updateStatus('success', `Returned ${results.length} result set${results.length !== 1 ? 's' : ''}`);
	}
	
	worker.postMessage({ action: 'exec', sql: commands });
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
		
		if (values.length === 0) {
			html += '<tbody><tr><td colspan="' + columns.length + '" class="no-results">No results</td></tr></tbody>';
		} else {
			var rows = values.map(function (v) { return valconcat(v, 'td'); });
			html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
		}
		
		tbl.innerHTML = html;
		
		// Add a wrapper with a caption showing the number of rows
		var wrapper = document.createElement('div');
		wrapper.className = 'table-wrapper';
		var caption = document.createElement('div');
		caption.className = 'table-caption';
		caption.innerHTML = `
			<span>${values.length} row${values.length !== 1 ? 's' : ''}</span>
			<span>${columns.length} column${columns.length !== 1 ? 's' : ''}</span>
		`;
		wrapper.appendChild(caption);
		wrapper.appendChild(tbl);
		
		return wrapper;
	}
}();

// Execute the commands when the button is clicked
function execEditorContents() {
	noerror();
	
	// Create a new tab if needed
	if (document.querySelectorAll('.results-tabs .tab').length <= 2) { // Only the first tab and + button
		createNewTab();
	}
	
	execute(editor.getValue() + ';');
	
	// Add visual feedback for button click
	execBtn.classList.add('active');
	setTimeout(() => {
		execBtn.classList.remove('active');
	}, 200);
}

execBtn.addEventListener("click", execEditorContents);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
	return dt;
}

// Add syntax highlighting to the textarea
var editor = CodeMirror.fromTextArea(commandsElm, {
	mode: 'text/x-mysql',
	viewportMargin: Infinity,
	indentWithTabs: true,
	smartIndent: true,
	lineNumbers: true,
	matchBrackets: true,
	autofocus: true,
	theme: 'nord',
	extraKeys: {
		"Ctrl-Enter": execEditorContents,
		"Cmd-Enter": execEditorContents,
		"Ctrl-S": savedb,
		"Cmd-S": savedb,
		"Ctrl-Space": toggleQueryHistory,
	}
});

// Load a db from a file
dbFileElm.onchange = function () {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function () {
		worker.onmessage = function () {
			toc("Loading database from file");
			// Show the schema of the loaded database
			editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
			
			// Create a new tab for the results
			createNewTab();
			execEditorContents();
			
			// Show success notification
			showNotification('Database loaded successfully');
			updateStatus('success', 'Database loaded successfully');
		};
		tic();
		try {
			worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
		}
		catch (exception) {
			worker.postMessage({ action: 'open', buffer: r.result });
		}
	}
	r.readAsArrayBuffer(f);
}

// Save the db to a file
function savedb() {
	updateStatus('info', 'Saving database...');
	
	worker.onmessage = function (event) {
		toc("Exporting the database");
		var arraybuff = event.data.buffer;
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
		
		// Show success notification
		showNotification('Database saved successfully');
		updateStatus('success', 'Database saved successfully');
		
		// Add visual feedback for button click
		savedbElm.classList.add('active');
		setTimeout(() => {
			savedbElm.classList.remove('active');
		}, 200);
	};
	tic();
	worker.postMessage({ action: 'export' });
}
savedbElm.addEventListener("click", savedb);

// Create a notification system
function showNotification(message) {
	// Create notification element if it doesn't exist
	let notification = document.querySelector('.notification');
	if (!notification) {
		notification = document.createElement('div');
		notification.className = 'notification';
		document.body.appendChild(notification);
	}
	
	// Set message and show
	notification.textContent = message;
	notification.classList.add('show');
	
	// Hide after 3 seconds
	setTimeout(() => {
		notification.classList.remove('show');
	}, 3000);
}

// Initialize resizable panels
function initResizer() {
	const editorPanel = document.querySelector('.editor-panel');
	
	panelResizerElm.addEventListener('mousedown', function(e) {
		isResizing = true;
		document.body.classList.add('resizing');
		panelResizerElm.classList.add('active');
	});
	
	document.addEventListener('mousemove', function(e) {
		if (!isResizing) return;
		
		const containerWidth = document.querySelector('.app-container').offsetWidth;
		let newWidth;
		
		// Check if we're in mobile view (flexbox column)
		const isMobileView = window.getComputedStyle(document.querySelector('.app-container')).flexDirection === 'column';
		
		if (isMobileView) {
			// In mobile view, resize height instead of width
			const containerHeight = document.querySelector('.app-container').offsetHeight;
			const newHeight = e.clientY - editorPanel.getBoundingClientRect().top;
			const minHeight = 100;
			const maxHeight = containerHeight - 100;
			
			editorPanel.style.height = `${Math.min(Math.max(newHeight, minHeight), maxHeight)}px`;
		} else {
			// Desktop view - resize width
			newWidth = e.clientX - editorPanel.getBoundingClientRect().left;
			const minWidth = 200;
			const maxWidth = containerWidth - 200;
			
			editorPanel.style.width = `${Math.min(Math.max(newWidth, minWidth), maxWidth)}px`;
		}
		
		e.preventDefault();
	});
	
	document.addEventListener('mouseup', function() {
		if (isResizing) {
			isResizing = false;
			document.body.classList.remove('resizing');
			panelResizerElm.classList.remove('active');
		}
	});
}

// Initialize tabs
function initTabs() {
	// New tab button
	newTabBtn.addEventListener('click', createNewTab);
	
	// Tab click handler
	resultsTabs.addEventListener('click', function(e) {
		const target = e.target;
		
		// Handle tab close button
		if (target.classList.contains('tab-close')) {
			const tabId = target.parentElement.dataset.tab;
			closeTab(tabId);
			e.stopPropagation();
			return;
		}
		
		// Handle tab selection
		if (target.classList.contains('tab') && !target.id) {
			const tabId = target.dataset.tab;
			if (tabId) {
				setActiveTab(tabId);
			}
		}
	});
}

// Create a new results tab
function createNewTab() {
	tabCounter++;
	const tabId = `tab${tabCounter}`;
	
	// Create tab button
	const tab = document.createElement('button');
	tab.className = 'tab';
	tab.dataset.tab = tabId;
	tab.innerHTML = `Result ${tabCounter} <span class="tab-close">×</span>`;
	
	// Insert before the + button
	resultsTabs.insertBefore(tab, newTabBtn);
	
	// Create tab panel
	const tabPanel = document.createElement('div');
	tabPanel.className = 'tab-panel';
	tabPanel.id = tabId;
	
	// Create results content container
	const resultsContent = document.createElement('div');
	resultsContent.className = 'results-content';
	resultsContent.textContent = 'Execute a query to see results';
	
	tabPanel.appendChild(resultsContent);
	document.querySelector('.results-panel .panel-content').appendChild(tabPanel);
	
	// Set as active
	setActiveTab(tabId);
	
	return tabId;
}

// Set active tab
function setActiveTab(tabId) {
	// Update current tab id
	currentTabId = tabId;
	
	// Update tab buttons
	document.querySelectorAll('.results-tabs .tab').forEach(tab => {
		tab.classList.remove('active');
		if (tab.dataset.tab === tabId) {
			tab.classList.add('active');
		}
	});
	
	// Update tab panels
	document.querySelectorAll('.tab-panel').forEach(panel => {
		panel.classList.remove('active');
		if (panel.id === tabId) {
			panel.classList.add('active');
		}
	});
}

// Close a tab
function closeTab(tabId) {
	// Don't close if it's the last content tab
	const contentTabs = document.querySelectorAll('.results-tabs .tab:not(#newTabBtn)');
	if (contentTabs.length <= 1) {
		return;
	}
	
	// Remove tab button
	const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
	if (tab) {
		tab.remove();
	}
	
	// Remove tab panel
	const panel = document.getElementById(tabId);
	if (panel) {
		panel.remove();
	}
	
	// If we closed the active tab, activate another one
	if (currentTabId === tabId) {
		const firstTab = document.querySelector('.results-tabs .tab:not(#newTabBtn)');
		if (firstTab) {
			setActiveTab(firstTab.dataset.tab);
		}
	}
}

// Query history functions
function addToHistory(query) {
	// Limit history size
	if (queryHistory.length >= 20) {
		queryHistory.pop();
	}
	
	// Add to beginning of array
	queryHistory.unshift({
		query: query,
		timestamp: new Date(),
		executionTime: lastExecutionTime
	});
	
	// Update history UI
	updateHistoryUI();
}

function updateHistoryUI() {
	queryHistoryElm.innerHTML = '';
	
	queryHistory.forEach((item, index) => {
		const historyItem = document.createElement('div');
		historyItem.className = 'history-item';
		
		// Format timestamp
		const timestamp = item.timestamp;
		const timeString = timestamp.toLocaleTimeString();
		
		// Truncate query if too long
		const queryPreview = item.query.length > 60 ? 
			item.query.substring(0, 60) + '...' : 
			item.query;
		
		historyItem.innerHTML = `
			<div class="history-query" title="${item.query}">${queryPreview}</div>
			<div class="history-time">${timeString}</div>
		`;
		
		// Add click handler to load query
		historyItem.addEventListener('click', () => {
			editor.setValue(item.query);
			toggleQueryHistory();
		});
		
		queryHistoryElm.appendChild(historyItem);
	});
}

function toggleQueryHistory() {
	queryHistoryElm.classList.toggle('show');
}

// Toggle history button
toggleHistoryBtn.addEventListener('click', toggleQueryHistory);

// Close history when clicking outside
document.addEventListener('click', function(e) {
	if (queryHistoryElm.classList.contains('show') && 
			!queryHistoryElm.contains(e.target) && 
			e.target !== toggleHistoryBtn) {
		queryHistoryElm.classList.remove('show');
	}
});

// Initial status
updateStatus('info', 'Ready');

// Handle window resize
window.addEventListener('resize', function() {
	// Reset any explicit dimensions on mobile/desktop switch
	const isMobileView = window.innerWidth <= 768;
	const editorPanel = document.querySelector('.editor-panel');
	
	if (isMobileView) {
		editorPanel.style.width = '';
	} else {
		editorPanel.style.height = '';
	}
});

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	height: 100px;
	color: rgba(255, 255, 255, 0.7);
}

.spinner {
	width: 30px;
	height: 30px;
	border: 3px solid rgba(79, 190, 255, 0.3);
	border-radius: 50%;
	border-top-color: #4fbeff;
	animation: spin 1s ease-in-out infinite;
	margin-bottom: 15px;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.table-wrapper {
	margin-bottom: 20px;
}

.table-caption {
	color: rgba(255, 255, 255, 0.6);
	font-size: 0.85em;
	margin-bottom: 8px;
	text-align: right;
}

.no-results {
	color: rgba(255, 255, 255, 0.5);
	text-align: center;
	padding: 30px;
}

.notification {
	position: fixed;
	bottom: -60px;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(40, 60, 80, 0.9);
	color: #fff;
	padding: 12px 20px;
	border-radius: 8px;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	transition: bottom 0.3s ease;
	z-index: 1000;
	border-left: 3px solid #4fbeff;
}

.notification.show {
	bottom: 20px;
}

.button.active {
	transform: translateY(1px);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) inset;
}

.results-header, .editor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
	color: rgba(255, 255, 255, 0.7);
	font-weight: 500;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	margin: 15px 0;
}

.github-corner:hover .octo-arm {
	animation: octocat-wave 560ms ease-in-out;
}

@keyframes octocat-wave {
	0%, 100% { transform: rotate(0); }
	20%, 60% { transform: rotate(-25deg); }
	40%, 80% { transform: rotate(10deg); }
}

@media (max-width: 500px) {
	.github-corner:hover .octo-arm {
		animation: none;
	}
	.github-corner .octo-arm {
		animation: octocat-wave 560ms ease-in-out;
	}
}
`;
document.head.appendChild(style);

// Add keyboard shortcuts info
document.addEventListener('DOMContentLoaded', function() {
	const editorHeader = document.querySelector('.editor-header');
	if (editorHeader) {
		const shortcuts = document.createElement('div');
		shortcuts.className = 'shortcuts';
		shortcuts.innerHTML = '<span title="Execute: Ctrl/Cmd+Enter, Save: Ctrl/Cmd+S">Keyboard shortcuts</span>';
		editorHeader.appendChild(shortcuts);
	}
});

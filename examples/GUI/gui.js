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
	
	// Clear loading spinner in the current tab when an error occurs
	const tabOutputElm = document.querySelector(`#${currentTabId} .results-content`);
	if (tabOutputElm) {
		tabOutputElm.innerHTML = '';
		
		// Use error template
		const errorTemplate = document.getElementById('error-template');
		const errorClone = errorTemplate.content.cloneNode(true);
		const errorDiv = errorClone.querySelector('.error-result');
		
		// Set error message
		const errorMessage = document.createElement('span');
		errorMessage.slot = 'error-message';
		errorMessage.textContent = `Query failed: ${e.message}`;
		errorDiv.appendChild(errorMessage);
		
		tabOutputElm.appendChild(errorDiv);
	}
	
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
	const createStatusSpan = (className, text) => {
		const span = document.createElement('span');
		span.className = className;
		span.textContent = text;
		return span;
	};

	switch(type) {
		case 'executing':
			editorStatusElm.innerHTML = '';
			editorStatusElm.appendChild(createStatusSpan('status-info', 'Executing query...'));
			
			resultsStatusElm.innerHTML = '';
			resultsStatusElm.appendChild(createStatusSpan('status-info', 'Executing query...'));
			break;
			
		case 'success':
			editorStatusElm.innerHTML = '';
			editorStatusElm.appendChild(createStatusSpan('status-success', 'Query executed successfully'));
			
			resultsStatusElm.innerHTML = '';
			resultsStatusElm.appendChild(createStatusSpan('status-success', message));
			break;
			
		case 'error':
			editorStatusElm.innerHTML = '';
			editorStatusElm.appendChild(createStatusSpan('status-error', 'Query failed'));
			
			resultsStatusElm.innerHTML = '';
			resultsStatusElm.appendChild(createStatusSpan('status-error', message));
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
	
	// Check if we need to create a new tab
	// If the current tab is the initial tab and it hasn't been used yet, use it
	// Otherwise, create a new tab
	const currentTabPanel = document.getElementById(currentTabId);
	const isInitialUnusedTab = currentTabId === 'tab1' && 
		currentTabPanel && 
		currentTabPanel.querySelector('.results-content').innerHTML.includes('Results will be displayed here');
	
	if (!isInitialUnusedTab) {
		tabId = createNewTab();
	}
	
	// Get the output element for the current tab
	const tabOutputElm = document.querySelector(`#${tabId} .results-content`);
	if (!tabOutputElm) return;
	
	// Show loading indicator using template
	tabOutputElm.innerHTML = '';
	const loadingTemplate = document.getElementById('loading-template');
	const loadingClone = loadingTemplate.content.cloneNode(true);
	tabOutputElm.appendChild(loadingClone);
	
	// Add to query history
	addToHistory(commands);
	
	worker.onmessage = function (event) {
		const results = event.data.results;
		const executionTime = toc("Executing SQL");
		
		if (!results) {
			error({message: event.data.error || "Unknown error occurred"});
			return;
		}

		tic();
		tabOutputElm.innerHTML = "";
		
		if (results.length === 0) {
			const noResultsDiv = document.createElement('div');
			noResultsDiv.className = 'no-results';
			noResultsDiv.textContent = 'Query executed successfully. No results to display.';
			tabOutputElm.appendChild(noResultsDiv);
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
	
	// Set up error handling for the worker
	worker.onerror = function(e) {
		error(e);
	};
}

// Create an HTML table
var tableCreate = function () {
	return function (columns, values) {
		// Use the table template
		const tableTemplate = document.getElementById('table-template');
		const tableClone = tableTemplate.content.cloneNode(true);
		const wrapper = tableClone.querySelector('.table-wrapper');
		const table = tableClone.querySelector('table');
		
		// Set row and column counts
		wrapper.querySelector('.row-count').textContent = `${values.length} row${values.length !== 1 ? 's' : ''}`;
		wrapper.querySelector('.column-count').textContent = `${columns.length} column${columns.length !== 1 ? 's' : ''}`;
		
		// Create header cells
		const thead = table.querySelector('thead tr');
		thead.innerHTML = ''; // Clear the slot
		columns.forEach(column => {
			const th = document.createElement('th');
			th.textContent = column;
			thead.appendChild(th);
		});
		
		// Create data rows
		const tbody = table.querySelector('tbody');
		tbody.innerHTML = ''; // Clear the slot
		
		if (values.length === 0) {
			const emptyRow = document.createElement('tr');
			const emptyCell = document.createElement('td');
			emptyCell.className = 'no-results';
			emptyCell.textContent = 'No results';
			emptyCell.colSpan = columns.length;
			emptyRow.appendChild(emptyCell);
			tbody.appendChild(emptyRow);
		} else {
			values.forEach(rowData => {
				const row = document.createElement('tr');
				rowData.forEach(cellData => {
					const cell = document.createElement('td');
					cell.textContent = cellData;
					row.appendChild(cell);
				});
				tbody.appendChild(row);
			});
		}
		
		return wrapper;
	}
}();

// Execute the commands when the button is clicked
function execEditorContents() {
	noerror();
	
	// Use the current tab if it exists, otherwise create a new one
	try {
		execute(editor.getValue() + ';');
	} catch (e) {
		error(e);
	}
	
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
			
			// Execute the query (this will create a new tab if needed)
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
	
	// Clear existing content and set new message
	notification.textContent = '';
	notification.textContent = message;
	
	// Show notification
	notification.classList.add('show');
	
	// Hide after 3 seconds
	setTimeout(() => {
		notification.classList.remove('show');
	}, 3000);
}

// Initialize resizable panels
function initResizer() {
	const editorPanel = document.querySelector('.editor-panel');
	const isMobileView = window.matchMedia('(max-width: 768px)').matches;
	
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
		const isMobileView = window.matchMedia('(max-width: 768px)').matches;
		
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
	
	// Set initial width/height based on view
	if (isMobileView) {
		editorPanel.style.height = '50%';
		editorPanel.style.width = '';
	} else {
		editorPanel.style.width = '50%';
		editorPanel.style.height = '';
	}
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
	
	// Initialize the first tab
	const firstTab = document.querySelector('.tab[data-tab="tab1"]');
	if (firstTab) {
		// Clear the first tab's content
		firstTab.innerHTML = '';
		
		// Add the tab text directly
		firstTab.textContent = `Result ${tabCounter}`;
		
		// Add close button
		const closeBtn = document.createElement('span');
		closeBtn.className = 'tab-close';
		closeBtn.textContent = '×';
		firstTab.appendChild(closeBtn);
		
		setActiveTab('tab1');
	}
}

// Create a new results tab
function createNewTab() {
	tabCounter++;
	const tabId = `tab${tabCounter}`;
	
	// Create tab button using template
	const tabTemplate = document.getElementById('tab-template');
	const tabClone = tabTemplate.content.cloneNode(true);
	const tab = tabClone.querySelector('.tab');
	tab.dataset.tab = tabId;
	
	// Clear any existing content in the tab
	tab.innerHTML = '';
	
	// Add the tab text directly (no slots)
	tab.textContent = `Result ${tabCounter}`;
	
	// Add close button
	const closeBtn = document.createElement('span');
	closeBtn.className = 'tab-close';
	closeBtn.textContent = '×';
	tab.appendChild(closeBtn);
	
	// Insert before the + button
	resultsTabs.insertBefore(tab, newTabBtn);
	
	// Create tab panel using template
	const panelTemplate = document.getElementById('tab-panel-template');
	const panelClone = panelTemplate.content.cloneNode(true);
	const tabPanel = panelClone.querySelector('.tab-panel');
	tabPanel.id = tabId;
	
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
	
	queryHistory.forEach((item) => {
		// Use history item template
		const historyTemplate = document.getElementById('history-item-template');
		const historyClone = historyTemplate.content.cloneNode(true);
		const historyItem = historyClone.querySelector('.history-item');
		
		// Format timestamp
		const timestamp = item.timestamp;
		const timeString = timestamp.toLocaleTimeString();
		
		// Truncate query if too long
		const queryPreview = item.query.length > 60 ? 
			item.query.substring(0, 60) + '...' : 
			item.query;
		
		// Set query preview
		const queryPreviewEl = document.createElement('span');
		queryPreviewEl.slot = 'query-preview';
		queryPreviewEl.textContent = queryPreview;
		historyItem.querySelector('.history-query').appendChild(queryPreviewEl);
		historyItem.querySelector('.history-query').title = item.query;
		
		// Set query time
		const queryTimeEl = document.createElement('span');
		queryTimeEl.slot = 'query-time';
		queryTimeEl.textContent = timeString;
		historyItem.querySelector('.history-time').appendChild(queryTimeEl);
		
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

// Add keyboard shortcuts info
document.addEventListener('DOMContentLoaded', function() {
	const editorHeader = document.querySelector('.editor-header');
	if (editorHeader) {
		const shortcuts = document.createElement('div');
		shortcuts.className = 'shortcuts';
		
		// Create shortcut elements using template
		const addShortcut = (title, keyText) => {
			const shortcutTemplate = document.getElementById('shortcut-template');
			const shortcutClone = shortcutTemplate.content.cloneNode(true);
			const shortcut = shortcutClone.querySelector('span');
			shortcut.title = title;
			
			const keySlot = document.createElement('span');
			keySlot.slot = 'key';
			keySlot.textContent = keyText;
			shortcut.appendChild(keySlot);
			
			shortcuts.appendChild(shortcut);
		};
		
		// Add all shortcuts
		addShortcut('Execute: Ctrl/Cmd+Enter', 'Ctrl+Enter');
		addShortcut('Save DB: Ctrl/Cmd+S', 'Ctrl+S');
		addShortcut('Toggle History: Ctrl+Space', 'Ctrl+Space');
		
		editorHeader.appendChild(shortcuts);
	}
});

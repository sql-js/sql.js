// DOM Elements
const elements = {
	execBtn: document.getElementById("execute"),
	outputElm: document.getElementById('output'),
	errorElm: document.getElementById('error'),
	commandsElm: document.getElementById('commands'),
	dbFileElm: document.getElementById('dbfile'),
	savedbElm: document.getElementById('savedb'),
	editorStatusElm: document.getElementById('editorStatus'),
	resultsStatusElm: document.getElementById('resultsStatus'),
	queryTimeElm: document.getElementById('queryTime'),
	panelResizerElm: document.getElementById('panelResizer'),
	queryHistoryElm: document.getElementById('queryHistory'),
	toggleHistoryBtn: document.getElementById('toggleHistory'),
	resultsTabs: document.getElementById('resultsTabs'),
	newTabBtn: document.getElementById('newTabBtn'),
	snippetsToggleBtn: document.getElementById('toggleSnippets'),
	snippetsMenuElm: document.getElementById('snippetsMenu')
};

// State
const state = {
	currentTabId: 'tab1',
	tabCounter: 1,
	queryHistory: [],
	isResizing: false,
	lastExecutionTime: 0
};

// SQL Snippets
const sqlSnippets = {
	'basic-demo': {
		name: 'Basic Demo',
		sql: "-- Basic SQL Demo\n-- Create a simple employees table\nDROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  department TEXT,\n  salary NUMERIC,\n  hire_date DATE\n);\n\n-- Insert sample data\nINSERT INTO employees (name, department, salary, hire_date) VALUES\n  ('Alice Smith', 'Engineering', 85000, '2020-01-15'),\n  ('Bob Johnson', 'Marketing', 72000, '2019-03-20'),\n  ('Carol Williams', 'Engineering', 92000, '2018-11-07'),\n  ('Dave Brown', 'Finance', 115000, '2017-05-12'),\n  ('Eve Davis', 'Engineering', 110000, '2021-08-30');\n\n-- Query the data\nSELECT \n  department, \n  COUNT(*) as employee_count,\n  ROUND(AVG(salary), 2) as avg_salary\nFROM employees\nGROUP BY department\nORDER BY avg_salary DESC;"
	},
	'schema': {
		name: 'Show Schema',
		sql: "-- Show all tables in the database\nSELECT name, sql\nFROM sqlite_master\nWHERE type='table';"
	},
	'blog-app': {
		name: 'Blog App Schema',
		sql: "-- Complete Blog Application Schema\n\n-- Users table\nDROP TABLE IF EXISTS users;\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  username TEXT NOT NULL UNIQUE,\n  email TEXT UNIQUE,\n  password_hash TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert sample users\nINSERT INTO users (username, email, password_hash, created_at) VALUES\n  ('alice', 'alice@example.com', 'hash1', '2022-01-10'),\n  ('bob', 'bob@example.com', 'hash2', '2022-01-15'),\n  ('carol', 'carol@example.com', 'hash3', '2022-02-20');\n\n-- Posts table\nDROP TABLE IF EXISTS posts;\nCREATE TABLE posts (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  content TEXT NOT NULL,\n  published BOOLEAN DEFAULT 0,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n);\n\n-- Insert sample posts\nINSERT INTO posts (user_id, title, content, published, created_at) VALUES\n  (1, 'First Post', 'This is my first post content', 1, '2022-01-12'),\n  (1, 'Second Post', 'This is another post by Alice', 1, '2022-01-18'),\n  (2, 'Hello World', 'Bob\\'s first post content', 1, '2022-01-20'),\n  (3, 'Introduction', 'Hello from Carol', 1, '2022-02-25'),\n  (2, 'Draft Post', 'This is a draft', 0, '2022-02-28');\n\n-- Comments table\nDROP TABLE IF EXISTS comments;\nCREATE TABLE comments (\n  id INTEGER PRIMARY KEY,\n  post_id INTEGER NOT NULL,\n  user_id INTEGER NOT NULL,\n  content TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n);\n\n-- Insert sample comments\nINSERT INTO comments (post_id, user_id, content, created_at) VALUES\n  (1, 2, 'Great post!', '2022-01-13'),\n  (1, 3, 'I agree with Bob', '2022-01-14'),\n  (3, 1, 'Welcome Bob!', '2022-01-21'),\n  (4, 2, 'Nice to meet you Carol', '2022-02-26');\n\n-- Query: Show posts with comment counts\nSELECT \n  p.id, \n  p.title, \n  u.username as author,\n  COUNT(c.id) as comment_count\nFROM posts p\nJOIN users u ON p.user_id = u.id\nLEFT JOIN comments c ON c.post_id = p.id\nWHERE p.published = 1\nGROUP BY p.id\nORDER BY p.created_at DESC;"
	},
	'e-commerce': {
		name: 'E-commerce Schema',
		sql: "-- E-commerce Database Schema\n\n-- Products table\nDROP TABLE IF EXISTS products;\nCREATE TABLE products (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  description TEXT,\n  price DECIMAL(10,2) NOT NULL,\n  stock_quantity INTEGER NOT NULL DEFAULT 0,\n  category TEXT\n);\n\n-- Insert sample products\nINSERT INTO products (name, description, price, stock_quantity, category) VALUES\n  ('Smartphone', 'Latest model smartphone', 699.99, 50, 'Electronics'),\n  ('Laptop', 'High performance laptop', 1299.99, 25, 'Electronics'),\n  ('Headphones', 'Noise cancelling headphones', 199.99, 100, 'Electronics'),\n  ('T-shirt', 'Cotton t-shirt', 19.99, 200, 'Clothing'),\n  ('Jeans', 'Blue denim jeans', 49.99, 150, 'Clothing');\n\n-- Customers table\nDROP TABLE IF EXISTS customers;\nCREATE TABLE customers (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  address TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert sample customers\nINSERT INTO customers (name, email, address) VALUES\n  ('John Doe', 'john@example.com', '123 Main St'),\n  ('Jane Smith', 'jane@example.com', '456 Oak Ave'),\n  ('Mike Johnson', 'mike@example.com', '789 Pine Rd');\n\n-- Orders table\nDROP TABLE IF EXISTS orders;\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  customer_id INTEGER NOT NULL,\n  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  status TEXT DEFAULT 'pending',\n  total DECIMAL(10,2) NOT NULL,\n  FOREIGN KEY (customer_id) REFERENCES customers(id)\n);\n\n-- Insert sample orders\nINSERT INTO orders (customer_id, order_date, status, total) VALUES\n  (1, '2023-01-15', 'completed', 919.98),\n  (2, '2023-01-20', 'completed', 1299.99),\n  (3, '2023-02-01', 'processing', 249.98),\n  (1, '2023-02-15', 'pending', 199.99);\n\n-- Order items table\nDROP TABLE IF EXISTS order_items;\nCREATE TABLE order_items (\n  id INTEGER PRIMARY KEY,\n  order_id INTEGER NOT NULL,\n  product_id INTEGER NOT NULL,\n  quantity INTEGER NOT NULL,\n  price DECIMAL(10,2) NOT NULL,\n  FOREIGN KEY (order_id) REFERENCES orders(id),\n  FOREIGN KEY (product_id) REFERENCES products(id)\n);\n\n-- Insert sample order items\nINSERT INTO order_items (order_id, product_id, quantity, price) VALUES\n  (1, 1, 1, 699.99),\n  (1, 3, 1, 199.99),\n  (2, 2, 1, 1299.99),\n  (3, 4, 5, 19.99),\n  (3, 5, 3, 49.99),\n  (4, 3, 1, 199.99);\n\n-- Query: Show customer orders with items\nSELECT \n  c.name as customer,\n  o.id as order_id,\n  o.order_date,\n  o.status,\n  p.name as product,\n  oi.quantity,\n  oi.price,\n  (oi.quantity * oi.price) as subtotal\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id\nORDER BY o.order_date DESC, c.name;"
	},
	'recursive-query': {
		name: 'Recursive Query',
		sql: "-- Employee Hierarchy with Recursive CTE\n\n-- Create employees table with manager relationship\nDROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  title TEXT NOT NULL,\n  manager_id INTEGER,\n  salary NUMERIC,\n  FOREIGN KEY (manager_id) REFERENCES employees(id)\n);\n\n-- Insert sample hierarchical data\nINSERT INTO employees (id, name, title, manager_id, salary) VALUES\n  (1, 'Mark Johnson', 'CEO', NULL, 250000),\n  (2, 'Sarah Williams', 'CTO', 1, 180000),\n  (3, 'Michael Brown', 'CFO', 1, 175000),\n  (4, 'Patricia Davis', 'Engineering Director', 2, 150000),\n  (5, 'Robert Wilson', 'Finance Director', 3, 145000),\n  (6, 'Linda Miller', 'Senior Developer', 4, 120000),\n  (7, 'James Taylor', 'Senior Developer', 4, 120000),\n  (8, 'Elizabeth Anderson', 'Accountant', 5, 95000),\n  (9, 'David Thomas', 'Junior Developer', 6, 85000),\n  (10, 'Jennifer Jackson', 'Junior Developer', 7, 85000);\n\n-- Recursive query to show employee hierarchy\nWITH RECURSIVE employee_hierarchy AS (\n  -- Base case: top-level employees (no manager)\n  SELECT \n    id, \n    name, \n    title, \n    manager_id, \n    salary,\n    0 AS level,\n    name AS path\n  FROM employees\n  WHERE manager_id IS NULL\n  \n  UNION ALL\n  \n  -- Recursive case: employees with managers\n  SELECT \n    e.id, \n    e.name, \n    e.title, \n    e.manager_id, \n    e.salary,\n    eh.level + 1 AS level,\n    eh.path || ' > ' || e.name AS path\n  FROM employees e\n  JOIN employee_hierarchy eh ON e.manager_id = eh.id\n)\n\n-- Query the hierarchy\nSELECT \n  id,\n  printf('%.' || (level * 4) || 's%s', '', name) AS employee,\n  title,\n  level,\n  salary,\n  path\nFROM employee_hierarchy\nORDER BY path;"
	},
	'complex-subquery': {
		name: 'Complex Subqueries',
		sql: "-- Complex Subqueries Example\n\n-- Create sample tables\nDROP TABLE IF EXISTS departments;\nCREATE TABLE departments (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nDROP TABLE IF EXISTS employees;\nCREATE TABLE employees (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  department_id INTEGER,\n  salary NUMERIC,\n  hire_date DATE,\n  FOREIGN KEY (department_id) REFERENCES departments(id)\n);\n\nDROP TABLE IF EXISTS projects;\nCREATE TABLE projects (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  budget NUMERIC\n);\n\nDROP TABLE IF EXISTS employee_projects;\nCREATE TABLE employee_projects (\n  employee_id INTEGER,\n  project_id INTEGER,\n  hours_worked NUMERIC,\n  PRIMARY KEY (employee_id, project_id),\n  FOREIGN KEY (employee_id) REFERENCES employees(id),\n  FOREIGN KEY (project_id) REFERENCES projects(id)\n);\n\n-- Insert sample data\nINSERT INTO departments (id, name) VALUES\n  (1, 'Engineering'),\n  (2, 'Marketing'),\n  (3, 'Finance'),\n  (4, 'HR');\n\nINSERT INTO employees (id, name, department_id, salary, hire_date) VALUES\n  (1, 'Alice Smith', 1, 85000, '2020-01-15'),\n  (2, 'Bob Johnson', 2, 72000, '2019-03-20'),\n  (3, 'Carol Williams', 1, 92000, '2018-11-07'),\n  (4, 'Dave Brown', 3, 115000, '2017-05-12'),\n  (5, 'Eve Davis', 1, 110000, '2021-08-30'),\n  (6, 'Frank Miller', 2, 68000, '2020-04-18'),\n  (7, 'Grace Wilson', 3, 95000, '2019-12-01'),\n  (8, 'Henry Garcia', 4, 75000, '2021-02-15');\n\nINSERT INTO projects (id, name, budget) VALUES\n  (1, 'Website Redesign', 150000),\n  (2, 'Mobile App', 200000),\n  (3, 'Database Migration', 100000),\n  (4, 'Marketing Campaign', 80000);\n\nINSERT INTO employee_projects (employee_id, project_id, hours_worked) VALUES\n  (1, 1, 120), (1, 2, 80),\n  (2, 4, 150),\n  (3, 1, 100), (3, 2, 120), (3, 3, 40),\n  (4, 3, 60),\n  (5, 2, 180), (5, 3, 30),\n  (6, 4, 140),\n  (7, 3, 80);\n\n-- Complex query 1: Find employees who work on projects with a budget greater than average\nSELECT DISTINCT e.name, e.salary\nFROM employees e\nJOIN employee_projects ep ON e.id = ep.employee_id\nWHERE ep.project_id IN (\n  SELECT id FROM projects WHERE budget > (\n    SELECT AVG(budget) FROM projects\n  )\n)\nORDER BY e.salary DESC;\n\n-- Complex query 2: Find departments with employees who have above-average salaries\nSELECT \n  d.name AS department,\n  COUNT(*) AS employee_count,\n  ROUND(AVG(e.salary), 2) AS avg_salary\nFROM departments d\nJOIN employees e ON d.id = e.department_id\nWHERE e.salary > (\n  SELECT AVG(salary) FROM employees\n)\nGROUP BY d.id\nORDER BY avg_salary DESC;\n\n-- Complex query 3: Find employees who work on the most projects\nSELECT \n  e.name,\n  COUNT(ep.project_id) AS project_count,\n  SUM(ep.hours_worked) AS total_hours\nFROM employees e\nJOIN employee_projects ep ON e.id = ep.employee_id\nGROUP BY e.id\nHAVING COUNT(ep.project_id) = (\n  SELECT MAX(project_count)\n  FROM (\n    SELECT COUNT(project_id) AS project_count\n    FROM employee_projects\n    GROUP BY employee_id\n  )\n)\nORDER BY total_hours DESC;"
	},
	'window-functions': {
		name: 'Window Functions',
		sql: "-- Window Functions Example\n\n-- Create sales table\nDROP TABLE IF EXISTS sales;\nCREATE TABLE sales (\n  id INTEGER PRIMARY KEY,\n  salesperson TEXT NOT NULL,\n  region TEXT NOT NULL,\n  amount NUMERIC NOT NULL,\n  sale_date DATE NOT NULL\n);\n\n-- Insert sample data\nINSERT INTO sales (salesperson, region, amount, sale_date) VALUES\n  ('Alice', 'North', 12500, '2023-01-05'),\n  ('Bob', 'South', 8700, '2023-01-10'),\n  ('Carol', 'East', 15200, '2023-01-12'),\n  ('Dave', 'West', 7300, '2023-01-15'),\n  ('Alice', 'North', 9800, '2023-02-03'),\n  ('Bob', 'South', 11600, '2023-02-08'),\n  ('Carol', 'East', 14100, '2023-02-15'),\n  ('Dave', 'West', 9200, '2023-02-20'),\n  ('Alice', 'North', 16700, '2023-03-05'),\n  ('Bob', 'South', 10300, '2023-03-12'),\n  ('Carol', 'East', 12800, '2023-03-18'),\n  ('Dave', 'West', 8500, '2023-03-25');\n\n-- Window function queries\n\n-- 1. Running total of sales by salesperson\nSELECT\n  salesperson,\n  region,\n  sale_date,\n  amount,\n  SUM(amount) OVER (\n    PARTITION BY salesperson \n    ORDER BY sale_date\n  ) AS running_total\nFROM sales\nORDER BY salesperson, sale_date;\n\n-- 2. Rank salespeople by amount within each region\nSELECT\n  region,\n  salesperson,\n  amount,\n  RANK() OVER (\n    PARTITION BY region \n    ORDER BY amount DESC\n  ) AS region_rank\nFROM sales\nORDER BY region, region_rank;\n\n-- 3. Calculate moving average of last 2 sales\nSELECT\n  salesperson,\n  sale_date,\n  amount,\n  AVG(amount) OVER (\n    PARTITION BY salesperson \n    ORDER BY sale_date \n    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW\n  ) AS moving_avg_2\nFROM sales\nORDER BY salesperson, sale_date;\n\n-- 4. Compare each sale to the previous sale\nSELECT\n  salesperson,\n  sale_date,\n  amount,\n  LAG(amount, 1) OVER (\n    PARTITION BY salesperson \n    ORDER BY sale_date\n  ) AS previous_amount,\n  amount - LAG(amount, 1) OVER (\n    PARTITION BY salesperson \n    ORDER BY sale_date\n  ) AS amount_change\nFROM sales\nORDER BY salesperson, sale_date;"
	},
	'json-functions': {
		name: 'JSON Functions',
		sql: "-- SQLite JSON Functions Example\n\n-- Create table with JSON data\nDROP TABLE IF EXISTS users;\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  profile JSON\n);\n\n-- Insert sample data with JSON\nINSERT INTO users (name, profile) VALUES\n  ('Alice', '{\"age\": 28, \"city\": \"New York\", \"skills\": [\"Python\", \"SQL\", \"JavaScript\"], \"contact\": {\"email\": \"alice@example.com\", \"phone\": \"555-1234\"}}'),\n  ('Bob', '{\"age\": 35, \"city\": \"San Francisco\", \"skills\": [\"Java\", \"C++\", \"Ruby\"], \"contact\": {\"email\": \"bob@example.com\", \"phone\": \"555-5678\"}}'),\n  ('Carol', '{\"age\": 42, \"city\": \"Chicago\", \"skills\": [\"SQL\", \"R\", \"Tableau\"], \"contact\": {\"email\": \"carol@example.com\"}}'),\n  ('Dave', '{\"age\": 31, \"city\": \"Boston\", \"skills\": [\"Python\", \"SQL\"], \"contact\": {\"email\": \"dave@example.com\", \"phone\": \"555-9012\"}}');\n\n-- JSON queries\n\n-- 1. Extract simple values\nSELECT\n  name,\n  json_extract(profile, '$.age') AS age,\n  json_extract(profile, '$.city') AS city\nFROM users\nORDER BY age;\n\n-- 2. Filter based on JSON values\nSELECT name, profile\nFROM users\nWHERE json_extract(profile, '$.age') > 30\nORDER BY json_extract(profile, '$.age');\n\n-- 3. Check for array elements\nSELECT name\nFROM users\nWHERE json_extract(profile, '$.skills') LIKE '%SQL%'\nORDER BY name;\n\n-- 4. Extract nested values\nSELECT\n  name,\n  json_extract(profile, '$.contact.email') AS email,\n  json_extract(profile, '$.contact.phone') AS phone\nFROM users\nORDER BY name;\n\n-- 5. Count array elements\nSELECT\n  name,\n  json_array_length(json_extract(profile, '$.skills')) AS skill_count\nFROM users\nORDER BY skill_count DESC;"
	}
};

// Start the worker in which sql.js will run
const worker = new Worker("../../dist/worker.sql-wasm.js");
worker.onerror = handleError;

// Open a database
worker.postMessage({ action: 'open' });

// Initialize UI components
initResizer();
initTabs();
initKeyboardShortcuts();
initSnippetsMenu();

// Error handling
function handleError(e) {
	console.log(e);
	elements.errorElm.style.height = 'auto';
	elements.errorElm.textContent = e.message;
	elements.errorElm.style.opacity = 1;
	
	updateStatus('error', `Error: ${e.message}`);
	
	showErrorInCurrentTab(e.message);
	
	setTimeout(() => {
		elements.errorElm.style.opacity = 0;
		setTimeout(() => {
			elements.errorElm.style.height = '0';
		}, 300);
	}, 5000);
}

function showErrorInCurrentTab(errorMessage) {
	const tabOutputElm = document.querySelector(`#${state.currentTabId} .results-content`);
	if (!tabOutputElm) return;
	
	tabOutputElm.innerHTML = '';
	
	const errorTemplate = document.getElementById('error-template');
	const errorClone = errorTemplate.content.cloneNode(true);
	const errorDiv = errorClone.querySelector('.error-result');
	
	const errorMessageSpan = document.createElement('span');
	errorMessageSpan.slot = 'error-message';
	errorMessageSpan.textContent = `Query failed: ${errorMessage}`;
	errorDiv.appendChild(errorMessageSpan);
	
	tabOutputElm.appendChild(errorDiv);
}

function clearError() {
	elements.errorElm.style.height = '0';
	elements.errorElm.style.opacity = 0;
}

// Status updates
function updateStatus(type, message) {
	const createStatusSpan = (className, text) => {
		const span = document.createElement('span');
		span.className = className;
		span.textContent = text;
		return span;
	};

	const statusMap = {
		'executing': {
			editorStatus: createStatusSpan('status-info', 'Executing query...'),
			resultsStatus: createStatusSpan('status-info', 'Executing query...')
		},
		'success': {
			editorStatus: createStatusSpan('status-success', 'Query executed successfully'),
			resultsStatus: createStatusSpan('status-success', message)
		},
		'error': {
			editorStatus: createStatusSpan('status-error', 'Query failed'),
			resultsStatus: createStatusSpan('status-error', message)
		},
		'info': {
			editorStatus: createStatusSpan('status-info', message),
			resultsStatus: createStatusSpan('status-info', message)
		}
	};

	if (statusMap[type]) {
		elements.editorStatusElm.innerHTML = '';
		elements.editorStatusElm.appendChild(statusMap[type].editorStatus);
		
		elements.resultsStatusElm.innerHTML = '';
		elements.resultsStatusElm.appendChild(statusMap[type].resultsStatus);
	} else {
		elements.editorStatusElm.textContent = message;
	}
}

function updateQueryTime(time) {
	elements.queryTimeElm.textContent = `Execution time: ${time.toFixed(2)}ms`;
	state.lastExecutionTime = time;
}

// Run a command in the database
function execute(commands, tabId = state.currentTabId) {
	tic();
	updateStatus('executing');
	
	const tabToUse = determineTabForResults(tabId);
	const tabOutputElm = document.querySelector(`#${tabToUse} .results-content`);
	if (!tabOutputElm) return;
	
	showLoadingIndicator(tabOutputElm);
	addToHistory(commands);
	
	worker.onmessage = function (event) {
		handleQueryResults(event, tabOutputElm);
	};
	
	worker.postMessage({ action: 'exec', sql: commands });
	worker.onerror = handleError;
}

function determineTabForResults(tabId) {
	const currentTabPanel = document.getElementById(state.currentTabId);
	const isInitialUnusedTab = state.currentTabId === 'tab1' && 
		currentTabPanel && 
		currentTabPanel.querySelector('.results-content').innerHTML.includes('Results will be displayed here');
	
	return isInitialUnusedTab ? state.currentTabId : createNewTab();
}

function showLoadingIndicator(outputElement) {
	outputElement.innerHTML = '';
	const loadingTemplate = document.getElementById('loading-template');
	const loadingClone = loadingTemplate.content.cloneNode(true);
	outputElement.appendChild(loadingClone);
}

function handleQueryResults(event, outputElement) {
	const results = event.data.results;
	const executionTime = toc("Executing SQL");
	
	if (!results) {
		handleError({message: event.data.error || "Unknown error occurred"});
		return;
	}

	tic();
	outputElement.innerHTML = "";
	
	if (results.length === 0) {
		displayNoResults(outputElement);
		return;
	}
	
	displayResultSets(results, outputElement);
	
	const displayTime = toc("Displaying results");
	updateQueryTime(executionTime + displayTime);
	updateStatus('success', `Returned ${results.length} result set${results.length !== 1 ? 's' : ''}`);
}

function displayNoResults(outputElement) {
	const noResultsDiv = document.createElement('div');
	noResultsDiv.className = 'no-results';
	noResultsDiv.textContent = 'Query executed successfully. No results to display.';
	outputElement.appendChild(noResultsDiv);
	updateStatus('success', 'Query executed with no results');
}

function displayResultSets(results, outputElement) {
	results.forEach(result => {
		outputElement.appendChild(createResultTable(result.columns, result.values));
	});
}

// Create an HTML table for results
function createResultTable(columns, values) {
	const tableTemplate = document.getElementById('table-template');
	const tableClone = tableTemplate.content.cloneNode(true);
	const wrapper = tableClone.querySelector('.table-wrapper');
	const table = tableClone.querySelector('table');
	
	updateTableMetadata(wrapper, columns.length, values.length);
	createTableHeader(table, columns);
	createTableBody(table, columns, values);
	
	return wrapper;
}

function updateTableMetadata(wrapper, columnCount, rowCount) {
	wrapper.querySelector('.row-count').textContent = `${rowCount} row${rowCount !== 1 ? 's' : ''}`;
	wrapper.querySelector('.column-count').textContent = `${columnCount} column${columnCount !== 1 ? 's' : ''}`;
}

function createTableHeader(table, columns) {
	const thead = table.querySelector('thead tr');
	thead.innerHTML = '';
	
	columns.forEach(column => {
		const th = document.createElement('th');
		th.textContent = column;
		thead.appendChild(th);
	});
}

function createTableBody(table, columns, values) {
	const tbody = table.querySelector('tbody');
	tbody.innerHTML = '';
	
	if (values.length === 0) {
		createEmptyResultRow(tbody, columns.length);
	} else {
		values.forEach(rowData => {
			createTableRow(tbody, rowData);
		});
	}
}

function createEmptyResultRow(tbody, columnCount) {
	const emptyRow = document.createElement('tr');
	const emptyCell = document.createElement('td');
	emptyCell.className = 'no-results';
	emptyCell.textContent = 'No results';
	emptyCell.colSpan = columnCount;
	emptyRow.appendChild(emptyCell);
	tbody.appendChild(emptyRow);
}

function createTableRow(tbody, rowData) {
	const row = document.createElement('tr');
	rowData.forEach(cellData => {
		const cell = document.createElement('td');
		cell.textContent = cellData;
		row.appendChild(cell);
	});
	tbody.appendChild(row);
}

// Execute the commands when the button is clicked
function execEditorContents() {
	clearError();
	
	try {
		execute(editor.getValue() + ';');
	} catch (e) {
		handleError(e);
	}
	
	addButtonClickFeedback(elements.execBtn);
}

function addButtonClickFeedback(button) {
	button.classList.add('active');
	setTimeout(() => {
		button.classList.remove('active');
	}, 200);
}

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
var editor = CodeMirror.fromTextArea(elements.commandsElm, {
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

// Set default SQL query
editor.setValue(sqlSnippets['basic-demo'].sql);

// Load a db from a file
elements.dbFileElm.onchange = function () {
	loadDatabaseFromFile();
};

function loadDatabaseFromFile() {
	var f = elements.dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function () {
		worker.onmessage = function () {
			toc("Loading database from file");
			editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
			execEditorContents();
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
		downloadDatabaseFile(event.data.buffer);
		showNotification('Database saved successfully');
		updateStatus('success', 'Database saved successfully');
		addButtonClickFeedback(elements.savedbElm);
	};
	tic();
	worker.postMessage({ action: 'export' });
}

function downloadDatabaseFile(arraybuff) {
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

elements.savedbElm.addEventListener("click", savedb);

// Create a notification system
function showNotification(message) {
	let notification = document.querySelector('.notification');
	if (!notification) {
		notification = document.createElement('div');
		notification.className = 'notification';
		document.body.appendChild(notification);
	}
	
	notification.textContent = message;
	notification.classList.add('show');
	
	setTimeout(() => {
		notification.classList.remove('show');
	}, 3000);
}

// Initialize resizable panels
function initResizer() {
	const editorPanel = document.querySelector('.editor-panel');
	const isMobileView = window.matchMedia('(max-width: 768px)').matches;
	
	elements.panelResizerElm.addEventListener('mousedown', function(e) {
		state.isResizing = true;
		document.body.classList.add('resizing');
		elements.panelResizerElm.classList.add('active');
	});
	
	document.addEventListener('mousemove', function(e) {
		if (!state.isResizing) return;
		
		const isMobileView = window.matchMedia('(max-width: 768px)').matches;
		
		if (isMobileView) {
			resizePanelHeight(e, editorPanel);
		} else {
			resizePanelWidth(e, editorPanel);
		}
		
		e.preventDefault();
	});
	
	document.addEventListener('mouseup', function() {
		if (state.isResizing) {
			state.isResizing = false;
			document.body.classList.remove('resizing');
			elements.panelResizerElm.classList.remove('active');
		}
	});
	
	setInitialPanelSize(editorPanel, isMobileView);
}

function resizePanelHeight(e, panel) {
	const containerHeight = document.querySelector('.app-container').offsetHeight;
	const newHeight = e.clientY - panel.getBoundingClientRect().top;
	const minHeight = 100;
	const maxHeight = containerHeight - 100;
	
	panel.style.height = `${Math.min(Math.max(newHeight, minHeight), maxHeight)}px`;
}

function resizePanelWidth(e, panel) {
	const containerWidth = document.querySelector('.app-container').offsetWidth;
	const newWidth = e.clientX - panel.getBoundingClientRect().left;
	const minWidth = 200;
	const maxWidth = containerWidth - 200;
	
	panel.style.width = `${Math.min(Math.max(newWidth, minWidth), maxWidth)}px`;
}

function setInitialPanelSize(panel, isMobileView) {
	if (isMobileView) {
		panel.style.height = '50%';
		panel.style.width = '';
	} else {
		panel.style.width = '50%';
		panel.style.height = '';
	}
}

// Initialize tabs
function initTabs() {
	elements.newTabBtn.addEventListener('click', createNewTab);
	
	elements.resultsTabs.addEventListener('click', function(e) {
		const target = e.target;
		
		if (target.classList.contains('tab-close')) {
			const tabId = target.parentElement.dataset.tab;
			closeTab(tabId);
			e.stopPropagation();
			return;
		}
		
		if (target.classList.contains('tab') && !target.id) {
			const tabId = target.dataset.tab;
			if (tabId) {
				setActiveTab(tabId);
			}
		}
	});
	
	initializeFirstTab();
}

function initializeFirstTab() {
	const firstTab = document.querySelector('.tab[data-tab="tab1"]');
	if (firstTab) {
		firstTab.innerHTML = '';
		firstTab.textContent = `Result ${state.tabCounter}`;
		
		const closeBtn = document.createElement('span');
		closeBtn.className = 'tab-close';
		closeBtn.textContent = '×';
		firstTab.appendChild(closeBtn);
		
		setActiveTab('tab1');
	}
}

// Create a new results tab
function createNewTab() {
	state.tabCounter++;
	const tabId = `tab${state.tabCounter}`;
	
	createTabButton(tabId);
	createTabPanel(tabId);
	
	setActiveTab(tabId);
	
	return tabId;
}

function createTabButton(tabId) {
	const tabTemplate = document.getElementById('tab-template');
	const tabClone = tabTemplate.content.cloneNode(true);
	const tab = tabClone.querySelector('.tab');
	tab.dataset.tab = tabId;
	
	tab.innerHTML = '';
	tab.textContent = `Result ${state.tabCounter}`;
	
	const closeBtn = document.createElement('span');
	closeBtn.className = 'tab-close';
	closeBtn.textContent = '×';
	tab.appendChild(closeBtn);
	
	elements.resultsTabs.insertBefore(tab, elements.newTabBtn);
}

function createTabPanel(tabId) {
	const panelTemplate = document.getElementById('tab-panel-template');
	const panelClone = panelTemplate.content.cloneNode(true);
	const tabPanel = panelClone.querySelector('.tab-panel');
	tabPanel.id = tabId;
	
	document.querySelector('.results-panel .panel-content').appendChild(tabPanel);
}

// Set active tab
function setActiveTab(tabId) {
	state.currentTabId = tabId;
	
	document.querySelectorAll('.results-tabs .tab').forEach(tab => {
		tab.classList.toggle('active', tab.dataset.tab === tabId);
	});
	
	document.querySelectorAll('.tab-panel').forEach(panel => {
		panel.classList.toggle('active', panel.id === tabId);
	});
}

// Close a tab
function closeTab(tabId) {
	const contentTabs = document.querySelectorAll('.results-tabs .tab:not(#newTabBtn)');
	if (contentTabs.length <= 1) {
		return;
	}
	
	const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
	if (tab) {
		tab.remove();
	}
	
	const panel = document.getElementById(tabId);
	if (panel) {
		panel.remove();
	}
	
	if (state.currentTabId === tabId) {
		const firstTab = document.querySelector('.results-tabs .tab:not(#newTabBtn)');
		if (firstTab) {
			setActiveTab(firstTab.dataset.tab);
		}
	}
}

// Query history functions
function addToHistory(query) {
	if (state.queryHistory.length >= 20) {
		state.queryHistory.pop();
	}
	
	state.queryHistory.unshift({
		query: query,
		timestamp: new Date(),
		executionTime: state.lastExecutionTime
	});
	
	updateHistoryUI();
}

function updateHistoryUI() {
	elements.queryHistoryElm.innerHTML = '';
	
	if (state.queryHistory.length === 0) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'query-history-empty';
		emptyMessage.textContent = 'No query history yet';
		elements.queryHistoryElm.appendChild(emptyMessage);
		return;
	}
	
	state.queryHistory.forEach((item) => {
		const historyItem = createHistoryItem(item);
		elements.queryHistoryElm.appendChild(historyItem);
	});
}

function createHistoryItem(item) {
	const historyTemplate = document.getElementById('history-item-template');
	const historyClone = historyTemplate.content.cloneNode(true);
	const historyItem = historyClone.querySelector('.history-item');
	
	const timeString = item.timestamp.toLocaleTimeString();
	const queryPreview = truncateString(item.query, 60);
	
	const queryPreviewEl = document.createElement('span');
	queryPreviewEl.slot = 'query-preview';
	queryPreviewEl.textContent = queryPreview;
	historyItem.querySelector('.history-query').appendChild(queryPreviewEl);
	historyItem.querySelector('.history-query').title = item.query;
	
	const queryTimeEl = document.createElement('span');
	queryTimeEl.slot = 'query-time';
	queryTimeEl.textContent = timeString;
	historyItem.querySelector('.history-time').appendChild(queryTimeEl);
	
	historyItem.addEventListener('click', () => {
		editor.setValue(item.query);
		toggleQueryHistory();
	});
	
	return historyItem;
}

function truncateString(str, maxLength) {
	return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

function toggleQueryHistory() {
	// Don't open history if there are no items
	if (!elements.queryHistoryElm.classList.contains('show') && state.queryHistory.length === 0) {
		showNotification('No query history yet');
		return;
	}

	const historyElement = elements.queryHistoryElm;
	const isVisible = historyElement.classList.contains('show');
	
	if (!isVisible) {
		// Position the history panel over the editor
		const editorRect = editor.getWrapperElement().getBoundingClientRect();
		historyElement.style.width = `${editorRect.width - 20}px`;
		historyElement.style.top = '10px';
		historyElement.style.height = 'auto';
		historyElement.style.maxHeight = `${editorRect.height - 20}px`;
	}
	
	historyElement.classList.toggle('show');
}

function closeQueryHistory() {
	elements.queryHistoryElm.classList.remove('show');
}

// Toggle history button
elements.toggleHistoryBtn.addEventListener('click', toggleQueryHistory);

// Close history when clicking outside
document.addEventListener('click', function(e) {
	if (elements.queryHistoryElm.classList.contains('show') && 
			!elements.queryHistoryElm.contains(e.target) && 
			e.target !== elements.toggleHistoryBtn) {
		closeQueryHistory();
	}
});

// Close history when pressing Escape
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape' && elements.queryHistoryElm.classList.contains('show')) {
		closeQueryHistory();
	}
});

// Close history when editing code
editor.on('change', function() {
	if (elements.queryHistoryElm.classList.contains('show')) {
		closeQueryHistory();
	}
});

// Initial status
updateStatus('info', 'Ready');

// Handle window resize
window.addEventListener('resize', function() {
	const isMobileView = window.innerWidth <= 768;
	const editorPanel = document.querySelector('.editor-panel');
	
	if (isMobileView) {
		editorPanel.style.width = '';
	} else {
		editorPanel.style.height = '';
	}
});

// Add keyboard shortcuts info
function initKeyboardShortcuts() {
	document.addEventListener('DOMContentLoaded', function() {
		const editorHeader = document.querySelector('.editor-header');
		if (editorHeader) {
			const shortcuts = document.createElement('div');
			shortcuts.className = 'shortcuts';
			
			addShortcutInfo(shortcuts, 'Execute: Ctrl/Cmd+Enter', 'Ctrl+Enter');
			addShortcutInfo(shortcuts, 'Save DB: Ctrl/Cmd+S', 'Ctrl+S');
			addShortcutInfo(shortcuts, 'Toggle History: Ctrl+Space', 'Ctrl+Space');
			
			editorHeader.appendChild(shortcuts);
		}
	});
}

function addShortcutInfo(container, title, keyText) {
	const shortcutTemplate = document.getElementById('shortcut-template');
	const shortcutClone = shortcutTemplate.content.cloneNode(true);
	const shortcut = shortcutClone.querySelector('span');
	shortcut.title = title;
	
	const keySlot = document.createElement('span');
	keySlot.slot = 'key';
	keySlot.textContent = keyText;
	shortcut.appendChild(keySlot);
	
	container.appendChild(shortcut);
}

// Initialize snippets menu
function initSnippetsMenu() {
	if (!elements.snippetsToggleBtn || !elements.snippetsMenuElm) return;
	
	// Create snippet menu items
	for (const [id, snippet] of Object.entries(sqlSnippets)) {
		const item = document.createElement('div');
		item.className = 'snippet-item';
		item.textContent = snippet.name;
		item.dataset.snippetId = id;
		
		item.addEventListener('click', () => {
			editor.setValue(snippet.sql);
			toggleSnippetsMenu();
		});
		
		elements.snippetsMenuElm.appendChild(item);
	}
	
	// Toggle button event
	elements.snippetsToggleBtn.addEventListener('click', toggleSnippetsMenu);
	
	// Close menu when clicking outside
	document.addEventListener('click', function(e) {
		if (elements.snippetsMenuElm.classList.contains('show') && 
				!elements.snippetsMenuElm.contains(e.target) && 
				e.target !== elements.snippetsToggleBtn) {
			closeSnippetsMenu();
		}
	});
	
	// Close menu when pressing Escape
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && elements.snippetsMenuElm.classList.contains('show')) {
			closeSnippetsMenu();
		}
	});
}

function toggleSnippetsMenu() {
	const menuElement = elements.snippetsMenuElm;
	const isVisible = menuElement.classList.contains('show');
	
	if (!isVisible) {
		// Position the menu
		const toggleBtnRect = elements.snippetsToggleBtn.getBoundingClientRect();
		menuElement.style.top = `${toggleBtnRect.bottom + 5}px`;
		menuElement.style.right = `${window.innerWidth - toggleBtnRect.right}px`;
	}
	
	menuElement.classList.toggle('show');
	elements.snippetsToggleBtn.classList.toggle('active');
}

function closeSnippetsMenu() {
	elements.snippetsMenuElm.classList.remove('show');
	elements.snippetsToggleBtn.classList.remove('active');
}

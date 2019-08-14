export const sqlite3_open = Module.cwrap('sqlite3_open', 'number', ['string', 'number']);
export const sqlite3_close_v2 = Module.cwrap('sqlite3_close_v2', 'number', ['number']);
export const sqlite3_exec = Module.cwrap('sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']);
export const sqlite3_free = Module.cwrap('sqlite3_free', 'boolean', ['number']);
export const sqlite3_changes = Module.cwrap('sqlite3_changes', 'number', ['number']);
export const sqlite3_key = Module.cwrap('sqlite3_key', 'number', ['number', 'string', 'number']);
export const sqlite3_rekey = Module.cwrap('sqlite3_rekey', 'number', ['number', 'string', 'number']);

// Prepared statements
//# prepare
export const sqlite3_prepare_v2 = Module.cwrap('sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']);
// Version of sqlite3_prepare_v2 to which a pointer to a string that is already
// in memory is passed.
export const sqlite3_prepare_v2_sqlptr = Module.cwrap('sqlite3_prepare_v2', 'number', ['number', 'number', 'number', 'number', 'number']);
//# Bind parameters

//int sqlite3_bind_text(sqlite3_stmt*, int, export const char*, int n, void(*)(void*));
// We declare export const char* as a number, because we will manually allocate the memory and pass a pointer to the function
export const sqlite3_bind_text = Module.cwrap('sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']);
export const sqlite3_bind_blob = Module.cwrap('sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']);
//int sqlite3_bind_double(sqlite3_stmt*, int, double);
export const sqlite3_bind_double = Module.cwrap('sqlite3_bind_double', 'number', ['number', 'number', 'number']);
//int sqlite3_bind_double(sqlite3_stmt*, int, int);
export const sqlite3_bind_int = Module.cwrap('sqlite3_bind_int', 'number', ['number', 'number', 'number']);
//int sqlite3_bind_parameter_index(sqlite3_stmt*, export const char *zName);
export const sqlite3_bind_parameter_index = Module.cwrap('sqlite3_bind_parameter_index', 'number', ['number', 'string']);

//# Get values
// int sqlite3_step(sqlite3_stmt*)
export const sqlite3_step = Module.cwrap('sqlite3_step', 'number', ['number']);
export const sqlite3_errmsg = Module.cwrap('sqlite3_errmsg', 'string', ['number']);
// int sqlite3_data_count(sqlite3_stmt *pStmt);
export const sqlite3_data_count = Module.cwrap('sqlite3_data_count', 'number', ['number']);
export const sqlite3_column_double = Module.cwrap('sqlite3_column_double', 'number', ['number', 'number']);
export const sqlite3_column_text = Module.cwrap('sqlite3_column_text', 'string', ['number', 'number']);
export const sqlite3_column_blob = Module.cwrap('sqlite3_column_blob', 'number', ['number', 'number']);
export const sqlite3_column_bytes = Module.cwrap('sqlite3_column_bytes', 'number', ['number', 'number']);
export const sqlite3_column_type = Module.cwrap('sqlite3_column_type', 'number', ['number', 'number']);
//export const char *sqlite3_column_name(sqlite3_stmt*, int N);
export const sqlite3_column_name = Module.cwrap('sqlite3_column_name', 'string', ['number', 'number']);
// int sqlite3_reset(sqlite3_stmt *pStmt);
export const sqlite3_reset = Module.cwrap('sqlite3_reset', 'number', ['number']);
export const sqlite3_clear_bindings = Module.cwrap('sqlite3_clear_bindings', 'number', ['number']);
// int sqlite3_finalize(sqlite3_stmt *pStmt);
export const sqlite3_finalize = Module.cwrap('sqlite3_finalize', 'number', ['number']);

//# Create custom functions
export const sqlite3_create_function_v2 = Module.cwrap('sqlite3_create_function_v2', 'number', ['number', 'string', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
export const sqlite3_value_type = Module.cwrap('sqlite3_value_type', 'number', ['number']);
export const sqlite3_value_bytes = Module.cwrap('sqlite3_value_bytes', 'number', ['number']);
export const sqlite3_value_text = Module.cwrap('sqlite3_value_text', 'string', ['number']);
export const sqlite3_value_int = Module.cwrap('sqlite3_value_int', 'number', ['number']);
export const sqlite3_value_blob = Module.cwrap('sqlite3_value_blob', 'number', ['number']);
export const sqlite3_value_double = Module.cwrap('sqlite3_value_double', 'number', ['number']);
export const sqlite3_result_double = Module.cwrap('sqlite3_result_double', 'boolean', ['number', 'number']);
export const sqlite3_result_null = Module.cwrap('sqlite3_result_null', 'boolean', ['number']);
export const sqlite3_result_text = Module.cwrap('sqlite3_result_text', 'boolean', ['number', 'string', 'number', 'number']);
export const sqlite3_result_blob = Module.cwrap('sqlite3_result_blob', 'boolean', ['number', 'number', 'number', 'number']);
export const sqlite3_result_int = Module.cwrap('sqlite3_result_int', 'boolean', ['number','number']);
export const sqlite3_result_int64 = Module.cwrap('sqlite3_result_int64', 'boolean', ['number', 'number']);
export const sqlite3_result_error = Module.cwrap('sqlite3_result_error', 'boolean', ['number', 'string', 'number']);
export const RegisterExtensionFunctions = Module.cwrap('RegisterExtensionFunctions', 'number', ['number']);

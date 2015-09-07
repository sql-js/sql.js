sqlite3_open = Module['cwrap'] 'sqlite3_open', 'number', ['string', 'number']
sqlite3_close_v2 = Module['cwrap'] 'sqlite3_close_v2', 'number', ['number']
sqlite3_exec = Module['cwrap'] 'sqlite3_exec', 'number', ['number', 'string', 'number', 'number', 'number']
sqlite3_free = Module['cwrap'] 'sqlite3_free', '', ['number']

# Prepared statements
## prepare
sqlite3_prepare_v2 = Module['cwrap'] 'sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']
# Version of sqlite3_prepare_v2 to which a pointer to a string that is already
# in memory is passed.
sqlite3_prepare_v2_sqlptr = Module['cwrap'] 'sqlite3_prepare_v2', 'number', ['number', 'number', 'number', 'number', 'number']
## Bind parameters

#int sqlite3_bind_text(sqlite3_stmt*, int, const char*, int n, void(*)(void*));
# We declare const char* as a number, because we will manually allocate the memory and pass a pointer to the function
sqlite3_bind_text = Module['cwrap'] 'sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']
sqlite3_bind_blob = Module['cwrap'] 'sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']
#int sqlite3_bind_double(sqlite3_stmt*, int, double);
sqlite3_bind_double = Module['cwrap'] 'sqlite3_bind_double', 'number', ['number', 'number', 'number']
#int sqlite3_bind_double(sqlite3_stmt*, int, int);
sqlite3_bind_int = Module['cwrap'] 'sqlite3_bind_int', 'number', ['number', 'number', 'number']
#int sqlite3_bind_parameter_index(sqlite3_stmt*, const char *zName);
sqlite3_bind_parameter_index = Module['cwrap'] 'sqlite3_bind_parameter_index', 'number', ['number', 'string']

## Get values
# int sqlite3_step(sqlite3_stmt*)
sqlite3_step = Module['cwrap'] 'sqlite3_step', 'number', ['number']
sqlite3_errmsg = Module['cwrap'] 'sqlite3_errmsg', 'string', ['number']
# int sqlite3_data_count(sqlite3_stmt *pStmt);
sqlite3_data_count = Module['cwrap'] 'sqlite3_data_count', 'number', ['number']
sqlite3_column_double = Module['cwrap'] 'sqlite3_column_double', 'number', ['number', 'number']
sqlite3_column_text = Module['cwrap'] 'sqlite3_column_text', 'string', ['number', 'number']
sqlite3_column_blob = Module['cwrap'] 'sqlite3_column_blob', 'number', ['number', 'number']
sqlite3_column_bytes = Module['cwrap'] 'sqlite3_column_bytes', 'number', ['number', 'number']
sqlite3_column_type = Module['cwrap'] 'sqlite3_column_type', 'number', ['number', 'number']
#const char *sqlite3_column_name(sqlite3_stmt*, int N);
sqlite3_column_name = Module['cwrap'] 'sqlite3_column_name', 'string', ['number', 'number']
# int sqlite3_reset(sqlite3_stmt *pStmt);
sqlite3_reset = Module['cwrap'] 'sqlite3_reset', 'number', ['number']
sqlite3_clear_bindings = Module['cwrap'] 'sqlite3_clear_bindings', 'number', ['number']
# int sqlite3_finalize(sqlite3_stmt *pStmt);
sqlite3_finalize = Module['cwrap'] 'sqlite3_finalize', 'number', ['number']

## Helper methods
# int sqlite3_complete(const char *sql);
sqlite3_complete = Module['cwrap'] 'sqlite3_complete', 'number', ['string']

# Export the API
this['SQL'] = {
  'Database':Database,
  'Statement':Statement,
  'isComplete': (x) -> (sqlite3_complete x) == 1
}
Module[i] = this['SQL'][i] for i of this['SQL']

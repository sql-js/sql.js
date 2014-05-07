# Need $(EMSCRIPTEN), for example run with        emmake make

EMSCRIPTEN?=/usr/bin
EMCC=$(EMSCRIPTEN)/emcc -s RESERVED_FUNCTION_POINTERS=2  --closure 1 -O3 -s INLINING_LIMIT=10
CC=clang -O2
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_INT64_TYPE="long long int" -DSQLITE_THREADSAFE=0
EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec', '_sqlite3_free', '_sqlite3_data_count', '_sqlite3_column_type', '_sqlite3_column_text', '_sqlite3_column_double', '_sqlite3_prepare_v2', '_sqlite3_step', '_sqlite3_bind_text', '_sqlite3_bind_double', '_sqlite3_reset', '_sqlite3_finalize']"


all: js/sql.js test/benchmark.js test/benchmark

js/sql.js: c/sqlite3.bc js/pre.js js/post.js
	$(EMCC) -s ASM_JS=1 $(CFLAGS) c/sqlite3.c --pre-js js/pre.js --post-js js/post.js -o js/sql.js -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)

js/sql-faststart.js: c/sqlite3.bc js/pre.js js/post.js
	$(EMCC) -s ASM_JS=2 $(CFLAGS) c/sqlite3.c --pre-js js/pre.js --post-js js/post.js -o js/sql-faststart.js -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)

js/sql-api.js: c/sqlite3.bc js/api.js
	$(EMSCRIPTEN)/emcc -s RESERVED_FUNCTION_POINTERS=2 $(CFLAGS) c/sqlite3.c --post-js js/api.js -o js/sql-api.js -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)

js/api.js: js/api.coffee
	coffee -b -c js/api.coffee

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

test/benchmark.js: c/sqlite3.c c/benchmark.c
	$(EMCC) $(CFLAGS) c/sqlite3.bc c/benchmark.c -o test/benchmark.js

test/benchmark: c/benchmark.c c/sqlite3.c
	$(CC) $(CFLAGS) -pthread c/sqlite3.c c/benchmark.c -o test/benchmark -ldl

clean:
	rm -rf js/sql.js test/benchmark.js test/benchmark


# Need $(EMSCRIPTEN), for example run with        emmake make

EMSCRIPTEN?=/usr/bin
EMCC=$(EMSCRIPTEN)/emcc -s RESERVED_FUNCTION_POINTERS=2 -s OUTLINING_LIMIT=500 -O2
# -s INLINING_LIMIT=0
CC=clang -O2
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_INT64_TYPE="long long int" -DSQLITE_THREADSAFE=0


all: js/sql.js test/benchmark.js test/benchmark

js/sql.js: c/sqlite3.bc js/pre.js js/post.js
	$(EMCC) $(CFLAGS) c/sqlite3.c --pre-js js/pre.js --post-js js/post.js -o js/sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec', '_sqlite3_free', '_sqlite3_column_count', ' _sqlite3_column_type', '_sqlite3_column_text', '_sqlite3_column_double', '_sqlite3_prepare_v2', '_sqlite3_step']"

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

test/benchmark.js: c/sqlite3.c c/benchmark.c
	$(EMCC) $(CFLAGS) c/sqlite3.bc c/benchmark.c -o test/benchmark.js

test/benchmark: c/benchmark.c c/sqlite3.c
	$(CC) $(CFLAGS) -pthread c/sqlite3.c c/benchmark.c -o test/benchmark -ldl

clean:
	rm -rf js/sql.js test/benchmark.js test/benchmark


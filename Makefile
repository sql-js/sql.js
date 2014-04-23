# Need $(EMSCRIPTEN), for example run with        emmake make

EMSCRIPTEN?=/usr/bin
EMCC=$(EMSCRIPTEN)/emcc -s RESERVED_FUNCTION_POINTERS=2
# -s INLINING_LIMIT=0
CC=clang
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_THREADSAFE=0


all: js/sql.js test/benchmark.js test/benchmark

js/sql.js: c/sqlite3.c
	$(EMCC) $(CFLAGS) c/sqlite3.c c/main.c --pre-js js/pre.js --post-js js/post.js -o js/sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec']"

test/benchmark.js: c/sqlite3.c c/benchmark.c
	$(EMCC) $(CFLAGS) c/sqlite3.c c/benchmark.c -o test/benchmark.js

test/benchmark: c/benchmark.c
	$(CC) $(CFLAGS) -pthread -O2 c/sqlite3.c c/benchmark.c -o test/benchmark -ldl

clean:
	rm js/sql.js test/benchmark.js test/benchmark


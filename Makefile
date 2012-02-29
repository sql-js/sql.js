# Edit for your paths
EMSCRIPTEN=~/Dev/emscripten
EMCC=$(EMSCRIPTEN)/emcc
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION

all: sql.js benchmark

sql.js: sqlite3.c
	$(EMCC) $(CFLAGS) -O2 sqlite3.c main.c --post-js bindings.js -o sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec']"

benchmark: benchmark.c
	gcc $(CFLAGS) -pthread -O2 sqlite3.c benchmark.c -o benchmark

# INLINING?


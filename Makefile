# Edit for your paths
EMSCRIPTEN=~/Dev/emscripten
EMCC=$(EMSCRIPTEN)/emcc
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION

all: sql.js benchmark.html benchmark

sql.js: sqlite3.c
	$(EMCC) $(CFLAGS) -O2 sqlite3.c main.c --post-js bindings.js -o sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec']"

benchmark.html: sqlite3.c benchmark.c
	$(EMCC) $(CFLAGS) -O2 --closure 0 sqlite3.c benchmark.c --post-js bindings.js -o benchmark.html

benchmark: benchmark.c
	gcc $(CFLAGS) -pthread -O2 sqlite3.c benchmark.c -o benchmark

# INLINING?


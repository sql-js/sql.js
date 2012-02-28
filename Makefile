# Edit for your paths
EMSCRIPTEN=~/Dev/emscripten
EMCC=$(EMSCRIPTEN)/emcc

all: sql.js

sql.js: sqlite3.c
	$(EMCC) -O2 sqlite3.c main.c --post-js bindings.js -o sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec']"

# INLINING?


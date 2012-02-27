# Edit for your paths
EMSCRIPTEN=~/Dev/2emscripten
EMCC=$(EMSCRIPTEN)/emcc

all: sql.js

sql.js: sqlite3.c
	$(EMCC) -O1 sqlite3.c --post-js bindings.js -o sql.js


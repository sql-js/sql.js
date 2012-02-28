# Edit for your paths
EMSCRIPTEN=~/Dev/emscripten
EMCC=$(EMSCRIPTEN)/emcc

all: sql.js

sql.js: sqlite3.c
	$(EMCC) sqlite3.c --post-js bindings.js -o sql.js


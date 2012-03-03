# Edit for your paths
EMSCRIPTEN=~/Dev/emscripten
EMCC=$(EMSCRIPTEN)/emcc -O2
# -s INLINING_LIMIT=0
CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION

all: sql.js benchmark.html benchmark

sql.js: sqlite3.c
	$(EMCC) $(CFLAGS) sqlite3.c main.c --pre-js pre.js --post-js post.js -o sql.js -s EXPORTED_FUNCTIONS="['_sqlite3_open', '_sqlite3_close', '_sqlite3_exec']"

benchmark.html: sqlite3.c benchmark.c
	$(EMCC) $(CFLAGS) sqlite3.c benchmark.c -o benchmark.html

benchmark: benchmark.c
	gcc $(CFLAGS) -pthread -O2 sqlite3.c benchmark.c -o benchmark

clean:
	rm sql.js benchmark.html benchmark


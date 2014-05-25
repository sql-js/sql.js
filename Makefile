# Need $(EMSCRIPTEN), for example run with        emmake make

EMSCRIPTEN?=/usr/bin

EMCC=$(EMSCRIPTEN)/emcc

CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_INT64_TYPE="long long int" -DSQLITE_THREADSAFE=0

all: js/sql.js

debug: EMFLAGS= -O1 -g -s INLINING_LIMIT=10 
debug: js/sql-debug.js

optimized: EMFLAGS= --closure 1 -O3 -s INLINING_LIMIT=50
optimized: js/sql-optimized.js

js/sql.js: optimized
	cp js/sql-optimized.js js/sql.js

js/sql%.js: js/shell-pre.js js/sql%-raw.js js/shell-post.js
	cat $^ > $@

js/sql%-raw.js: c/sqlite3.bc js/api.js exported_functions
	$(EMCC) $(EMFLAGS) -s EXPORTED_FUNCTIONS=@exported_functions c/sqlite3.bc --post-js js/api.js -o $@

js/api.js: coffee/api.coffee coffee/exports.coffee coffee/api-data.coffee
	coffee --bare --compile --join $@ --compile $^

# Web worker API
worker: js/worker.sql.js
js/worker.js: coffee/worker.coffee
	coffee --bare --compile --join $@ --compile $^

js/worker.sql.js: js/sql.js js/worker.js
	cat $^ > $@

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

module.tar.gz: test package.json AUTHORS README.md js/sql.js
	tar --create --gzip $^ > $@

clean:
	rm -rf js/sql*.js js/api.js js/sql*-raw.js c/sqlite3.bc


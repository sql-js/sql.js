# Need $(EMSCRIPTEN), for example run with        emmake make

EMSCRIPTEN?=/usr/bin

EMCC=$(EMSCRIPTEN)/emcc -s RESERVED_FUNCTION_POINTERS=4
EMFLAGS= --closure 1 -O3 -s INLINING_LIMIT=50

CFLAGS=-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_INT64_TYPE="long long int" -DSQLITE_THREADSAFE=0

all: js/sql.js

noopt: EMFLAGS= -O0
noopt: js/sql.js
debug: EMFLAGS= -O1 -s INLINING_LIMIT=10 
debug: js/sql.js

# Old version, without prepared statements
js/sql.js: js/shell-pre.js js/sql-raw.js js/shell-post.js
	cat js/shell-pre.js js/sql-raw.js js/shell-post.js > js/sql.js

js/sql-raw.js: c/sqlite3.bc js/api.js exported_functions
	$(EMCC) $(EMFLAGS) -s EXPORTED_FUNCTIONS=@exported_functions c/sqlite3.bc --post-js js/api.js -o js/sql-raw.js

js/api.js: coffee/api.coffee
	coffee --bare --output js --compile coffee/api.coffee

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

clean:
	rm -rf js/sql.js js/api.js js/sql-raw.js c/sqlite3.bc


# Note: Last tested with version 1.38.15 of Emscripten

EMCC=emcc

CFLAGS=-O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS

# When compiling to WASM, enabling memory-growth is not expected to make much of an impact, so we enable it for all builds
EMFLAGS = \
	--memory-init-file 0 \
	-s RESERVED_FUNCTION_POINTERS=64 \
	-s WASM=1 \
	-s EXPORTED_FUNCTIONS=@exported_functions \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=@exported_runtime_methods \
	-s ALLOW_MEMORY_GROWTH=1

# TODO: Closure?	
EMFLAGS_OPTIMIZED= \
	-s INLINING_LIMIT=50 \
	-O3

EMFLAGS_DEBUG = \
	-s INLINING_LIMIT=10 \
	-O1

BITCODE_FILES = c/sqlite3.bc c/extension-functions.bc

all: js/sql.js js/sql-debug.js js/worker.sql.js js/worker.sql-debug.js

# sql-debug.js
js/sql-debug-raw.js: $(BITCODE_FILES) js/api.js exported_functions exported_runtime_methods
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) $(BITCODE_FILES) --pre-js js/api.js -o $@

js/sql-debug.js: js/shell-pre.js js/sql-debug-raw.js js/shell-post.js
	cat $^ > $@

# sql.js
js/sql-raw.js: $(BITCODE_FILES) js/api.js exported_functions exported_runtime_methods
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(BITCODE_FILES) --pre-js js/api.js -o $@

js/sql.js: js/shell-pre.js js/sql-raw.js js/shell-post.js
	cat $^ > $@

# Web worker API
worker: js/worker.sql.js js/worker.sql-debug.js
js/worker.js: coffee/worker.coffee
	cat $^ | coffee --bare --compile --stdio > $@

js/worker.sql.js: js/sql.js js/worker.js
	cat $^ > $@

js/worker.sql-debug.js: js/sql-debug.js js/worker.js
	cat $^ > $@


js/api.js: coffee/output-pre.js coffee/api.coffee coffee/exports.coffee coffee/api-data.coffee coffee/output-post.js
	cat coffee/api.coffee coffee/exports.coffee coffee/api-data.coffee | coffee --bare --compile --stdio > $@
	cat coffee/output-pre.js $@ coffee/output-post.js > js/api-wrapped.js
	mv js/api-wrapped.js $@

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

c/extension-functions.bc: c/extension-functions.c
	$(EMCC) $(CFLAGS) -s LINKABLE=1 c/extension-functions.c -o c/extension-functions.bc

module.tar.gz: test package.json AUTHORS README.md js/sql.js
	tar --create --gzip $^ > $@

clean:
	rm -rf js/sql.js js/api.js js/sql*-raw.js js/worker.sql.js js/worker.js js/worker.sql-debug.js c/sqlite3.bc c/extension-functions.bc



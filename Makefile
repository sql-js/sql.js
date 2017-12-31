EMCC=emcc

CFLAGS=-O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS

all: js/sql.js debug js/worker.sql.js memory-growth

# RESERVED_FUNCTION_POINTERS setting is used for registering custom functions
optimized: EMFLAGS= --memory-init-file 0 -O3 -s INLINING_LIMIT=50 -s RESERVED_FUNCTION_POINTERS=64
optimized: js/sql-optimized.js

memory-growth: EMFLAGS= --memory-init-file 0 -O3 -s INLINING_LIMIT=50 -s RESERVED_FUNCTION_POINTERS=64 -s ALLOW_MEMORY_GROWTH=1
memory-growth: js/sql-memory-growth.js

debug: EMFLAGS= -O1 -g -s INLINING_LIMIT=10 -s RESERVED_FUNCTION_POINTERS=64
debug: js/sql-debug.js

js/sql.js: optimized
	cp js/sql-optimized.js js/sql.js

js/sql%.js: js/shell-pre.js js/sql%-raw.js js/shell-post.js
	cat $^ > $@

js/sql%-raw.js: c/sqlite3.bc c/extension-functions.bc js/api.js exported_functions
	$(EMCC) $(EMFLAGS) -s EXPORTED_FUNCTIONS=@exported_functions -s EXTRA_EXPORTED_RUNTIME_METHODS=@exported_runtime_methods c/extension-functions.bc c/sqlite3.bc --post-js js/api.js -o $@ ;\

js/api.js: coffee/api.coffee coffee/exports.coffee coffee/api-data.coffee
	cat $^ | coffee --bare --compile --stdio > $@

# Web worker API
worker: js/worker.sql.js
js/worker.js: coffee/worker.coffee
	cat $^ | coffee --bare --compile --stdio > $@

js/worker.sql.js: js/sql.js js/worker.js
	cat $^ > $@

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

c/extension-functions.bc: c/extension-functions.c
	$(EMCC) $(CFLAGS) -s LINKABLE=1 c/extension-functions.c -o c/extension-functions.bc

module.tar.gz: test package.json AUTHORS README.md js/sql.js
	tar --create --gzip $^ > $@

clean:
	rm -rf js/sql.js js/api.js js/sql*-raw.js js/worker.sql.js js/worker.js js/sql-memory-growth.js c/sqlite3.bc c/extension-functions.bc



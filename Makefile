# Note: Last tested with version 1.38.15 of Emscripten

EMCC=emcc

CFLAGS=-O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS

# When compiling to WASM, enabling memory-growth is not expected to make much of an impact, so we enable it for all builds
EMFLAGS = \
	--memory-init-file 0 \
	-s RESERVED_FUNCTION_POINTERS=64 \
	-s EXPORTED_FUNCTIONS=@exported_functions \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=@exported_runtime_methods \
	-s SINGLE_FILE=0

EMFLAGS_WASM = \
	-s WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 

EMFLAGS_OPTIMIZED= \
	-s INLINING_LIMIT=50 \
	-O3 \
	--closure 1

EMFLAGS_DEBUG = \
	-s INLINING_LIMIT=10 \
	-O1

BITCODE_FILES = c/sqlite3.bc c/extension-functions.bc
OUTPUT_WRAPPER_FILES = src/shell-pre.js src/shell-post.js

all: optimized debug worker

# TODO: Emit a file showing which version of emcc and SQLite was used to compile the emitted output.
# TODO: Make it easier to use a newer version of Sqlite.

.PHONY: debug
debug: js/sql-asm-debug.js js/sql-wasm-debug.js

js/sql-asm-debug.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) js/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) -s WASM=0 $(BITCODE_FILES) --pre-js js/api.js -o $@
	mv $@ js/tmp-raw.js
	cat src/shell-pre.js js/tmp-raw.js src/shell-post.js > $@
	rm js/tmp-raw.js

js/sql-wasm-debug.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) js/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js js/api.js -o $@
	mv $@ js/tmp-raw.js
	cat src/shell-pre.js js/tmp-raw.js src/shell-post.js > $@
	rm js/tmp-raw.js


.PHONY: optimized
optimized: js/sql-asm.js js/sql-wasm.js js/sql-asm-memory-growth.js

js/sql-asm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) js/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s WASM=0 $(BITCODE_FILES) --pre-js js/api.js -o $@
	mv $@ js/tmp-raw.js
	cat src/shell-pre.js js/tmp-raw.js src/shell-post.js > $@
	rm js/tmp-raw.js

js/sql-wasm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) js/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js js/api.js -o $@
	mv $@ js/tmp-raw.js
	cat src/shell-pre.js js/tmp-raw.js src/shell-post.js > $@
	rm js/tmp-raw.js

js/sql-asm-memory-growth.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) js/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s WASM=0 -s ALLOW_MEMORY_GROWTH=1 $(BITCODE_FILES) --pre-js js/api.js -o $@
	mv $@ js/tmp-raw.js
	cat src/shell-pre.js js/tmp-raw.js src/shell-post.js > $@
	rm js/tmp-raw.js


# Web worker API
.PHONY: worker
worker: js/worker.sql-asm.js js/worker.sql-asm-debug.js js/worker.sql-wasm.js js/worker.sql-wasm-debug.js

js/worker.js: src/worker.coffee
	cat $^ | coffee --bare --compile --stdio > $@

js/worker.sql-asm.js: js/sql-asm.js js/worker.js
	cat $^ > $@

js/worker.sql-asm-debug.js: js/sql-asm-debug.js js/worker.js
	cat $^ > $@

js/worker.sql-wasm.js: js/sql-wasm.js js/worker.js
	cat $^ > $@

js/worker.sql-wasm-debug.js: js/sql-wasm-debug.js js/worker.js
	cat $^ > $@

# TODO: Replace Coffeescript with Typescript or raw JS
js/api.js: src/output-pre.js src/api.coffee src/exports.coffee src/api-data.coffee src/output-post.js
	cat src/api.coffee src/exports.coffee src/api-data.coffee | coffee --bare --compile --stdio > $@
	cat src/output-pre.js $@ src/output-post.js > js/api-wrapped.js
	mv js/api-wrapped.js $@

c/sqlite3.bc: c/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) c/sqlite3.c -o c/sqlite3.bc

c/extension-functions.bc: c/extension-functions.c
	$(EMCC) $(CFLAGS) -s LINKABLE=1 c/extension-functions.c -o c/extension-functions.bc

# TODO: This target appears to be unused. If we re-instatate it, we'll need to add more files inside of the JS folder
# module.tar.gz: test package.json AUTHORS README.md js/sql-asm.js
# 	tar --create --gzip $^ > $@

.PHONY: clean
clean:
	rm -f c/sqlite3.bc \
		c/extension-functions.bc \
		js/sql-asm.js \
		js/sql-asm-memory-growth.js \
		js/sql.wasm \
		js/sql-asm-debug.js \
		js/sql-debug.wasm \
		js/sql-wasm.js \
		js/sql-wasm.wasm \
		js/sql-wasm-debug.js \
		js/sql-wasm-debug.wasm \
		js/api.js \
		js/worker.js \
		js/worker.sql-asm.js \
		js/worker.sql-asm-debug.js \
		js/worker.sql-wasm.js \
		js/worker.sql-wasm-debug.js



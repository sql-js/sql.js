# Note: Last tested with version 1.38.15 of Emscripten

# TODO: Emit a file showing which version of emcc and SQLite was used to compile the emitted output.
# TODO: Make it easier to use a newer version of Sqlite.
# TODO: Create a release on Github with these compiled assets rather than checking them in
# TODO: Consider creating different files based on browser vs module usage: https://github.com/vuejs/vue/tree/dev/dist

EMCC=emcc

CFLAGS=-O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS

# When compiling to WASM, enabling memory-growth is not expected to make much of an impact, so we enable it for all builds
# Since tihs is a library and not a standalone executable, we don't want to catch unhandled Node process exceptions
# So, we do : `NODEJS_CATCH_EXIT=0`, which fixes issue: https://github.com/kripken/sql.js/issues/173 and https://github.com/kripken/sql.js/issues/262
EMFLAGS = \
	--memory-init-file 0 \
	-s RESERVED_FUNCTION_POINTERS=64 \
	-s EXPORTED_FUNCTIONS=@exported_functions \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=@exported_runtime_methods \
	-s SINGLE_FILE=0 \
	-s NODEJS_CATCH_EXIT=0

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

BITCODE_FILES = out/sqlite3.bc out/extension-functions.bc
OUTPUT_WRAPPER_FILES = src/shell-pre.js src/shell-post.js

all: optimized debug worker

.PHONY: debug
debug: dist/sql-asm-debug.js dist/sql-wasm-debug.js

dist/sql-asm-debug.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) -s WASM=0 $(BITCODE_FILES) --pre-js out/api.js -o $@
	mv $@ out/tmp-raw.js
	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
	rm out/tmp-raw.js

dist/sql-wasm-debug.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@
	mv $@ out/tmp-raw.js
	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
	rm out/tmp-raw.js

.PHONY: optimized
optimized: dist/sql-asm.js dist/sql-wasm.js dist/sql-asm-memory-growth.js

dist/sql-asm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s WASM=0 $(BITCODE_FILES) --pre-js out/api.js -o $@
	mv $@ out/tmp-raw.js
	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
	rm out/tmp-raw.js

dist/sql-wasm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@
	mv $@ out/tmp-raw.js
	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
	rm out/tmp-raw.js

dist/sql-asm-memory-growth.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js exported_functions exported_runtime_methods 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s WASM=0 -s ALLOW_MEMORY_GROWTH=1 $(BITCODE_FILES) --pre-js out/api.js -o $@
	mv $@ out/tmp-raw.js
	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
	rm out/tmp-raw.js


# Web worker API
.PHONY: worker
worker: dist/worker.sql-asm.js dist/worker.sql-asm-debug.js dist/worker.sql-wasm.js dist/worker.sql-wasm-debug.js

out/worker.js: src/worker.coffee
	cat $^ | coffee --bare --compile --stdio > $@

dist/worker.sql-asm.js: dist/sql-asm.js out/worker.js
	cat $^ > $@

dist/worker.sql-asm-debug.js: dist/sql-asm-debug.js out/worker.js
	cat $^ > $@

dist/worker.sql-wasm.js: dist/sql-wasm.js out/worker.js
	cat $^ > $@

dist/worker.sql-wasm-debug.js: dist/sql-wasm-debug.js out/worker.js
	cat $^ > $@

out/api.js: src/output-pre.js src/api.coffee src/exports.coffee src/api-data.coffee src/output-post.js
	cat src/api.coffee src/exports.coffee src/api-data.coffee | coffee --bare --compile --stdio > $@
	cat src/output-pre.js $@ src/output-post.js > out/api-wrapped.js
	mv out/api-wrapped.js $@

out/sqlite3.bc: sqlite/sqlite3.c
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) sqlite/sqlite3.c -o out/sqlite3.bc

out/extension-functions.bc: sqlite/extension-functions.c
	$(EMCC) $(CFLAGS) -s LINKABLE=1 sqlite/extension-functions.c -o out/extension-functions.bc

# TODO: This target appears to be unused. If we re-instatate it, we'll need to add more files inside of the JS folder
# module.tar.gz: test package.json AUTHORS README.md dist/sql-asm.js
# 	tar --create --gzip $^ > $@

.PHONY: clean
clean:
	rm -f out/* dist/*	



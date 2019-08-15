# Note: Last built with version 1.38.30 of Emscripten

# TODO: Emit a file showing which version of emcc and SQLite was used to compile the emitted output.
# TODO: Create a release on Github with these compiled assets rather than checking them in
# TODO: Consider creating different files based on browser vs module usage: https://github.com/vuejs/vue/tree/dev/dist

# I got this handy makefile syntax from : https://github.com/mandel59/sqlite-wasm (MIT License) Credited in LICENSE
# To use another version of Sqlite, visit https://www.sqlite.org/download.html and copy the appropriate values here:
SQLITE_AMALGAMATION = sqlite-amalgamation-3290000
SQLITE_AMALGAMATION_ZIP_URL = https://www.sqlite.org/2019/sqlite-amalgamation-3290000.zip
SQLITE_AMALGAMATION_ZIP_SHA512 = 3306ac3e37ec46f1b2ac74155756c82afadff7bf5b8b4c9b5516f5e8c1c785b5f50ec9b840482292f2f6c5d72cf6d9a78a0dfb727f0a9cf134b6c5522606e9b3
SQLITE_EXTENSION_HEADERS = sqlite3ext.h

SQLEET_AMALGAMATION = sqleet-v0.29.0
SQLEET_AMALGAMATION_ZIP_URL = https://github.com/resilar/sqleet/releases/download/v0.29.0/sqleet-v0.29.0-amalgamation.zip
SQLEET_AMALGAMATION_ZIP_SHA512 = 3783b4c995e89e8151642fcb5b6d43b57b3f835ee3d0e83be9b3de480da3ce3f8b73debc1d45681031d855b6f294044b87f1f830178a182c62742483ee73eee9

# Note that extension-functions.c hasn't been updated since 2010-02-06, so likely doesn't need to be updated 
EXTENSION_FUNCTIONS = extension-functions.c
EXTENSION_FUNCTIONS_URL = https://www.sqlite.org/contrib/download/extension-functions.c?get=25
EXTENSION_FUNCTIONS_SHA512 = 15d0d2b81ddc70b3ea9a268cc717e115031db1539024944ddce76ca9f1896467fa52e754ff8e18a40d9e8e26930c97531d5cd3140b7c128584aaa5e2cd16fb90

EMCC=emcc

CFLAGS=-O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DLONGDOUBLE_TYPE=double -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS

# When compiling to WASM, enabling memory-growth is not expected to make much of an impact, so we enable it for all builds
# Since tihs is a library and not a standalone executable, we don't want to catch unhandled Node process exceptions
# So, we do : `NODEJS_CATCH_EXIT=0`, which fixes issue: https://github.com/kripken/sql.js/issues/173 and https://github.com/kripken/sql.js/issues/262
EMFLAGS = \
	--memory-init-file 0 \
	-s RESERVED_FUNCTION_POINTERS=64 \
	-s EXPORTED_FUNCTIONS=@exports/functions.json \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=@exports/runtime_methods.json \
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

#all: optimized debug worker
all: optimized debug

.PHONY: debug
debug: dist/sql-wasm-debug.js

dist/sql-wasm-debug.js: $(BITCODE_FILES) out/api.js exports/functions.json exports/runtime_methods.json
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@

.PHONY: optimized
optimized: dist/sql-wasm.js

dist/sql-wasm.js: $(BITCODE_FILES) out/api.js exports/functions.json exports/runtime_methods.json 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@

dist/sql-asm-memory-growth.js: $(BITCODE_FILES) out/api.js exports/functions.json exports/runtime_methods.json 
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s WASM=0 -s ALLOW_MEMORY_GROWTH=1 $(BITCODE_FILES) --pre-js out/api.js -o $@

# Web worker API
#.PHONY: worker
#worker: dist/worker.sql-asm.js dist/worker.sql-asm-debug.js dist/worker.sql-wasm.js dist/worker.sql-wasm-debug.js
#
#out/worker.js: src/worker.coffee
#	cat $^ | coffee --bare --compile --stdio > $@
#
#dist/worker.sql-asm.js: dist/sql-asm.js out/worker.js
#	cat $^ > $@
#
#dist/worker.sql-asm-debug.js: dist/sql-asm-debug.js out/worker.js
#	cat $^ > $@
#
#dist/worker.sql-wasm.js: dist/sql-wasm.js out/worker.js
#	cat $^ > $@
#
#dist/worker.sql-wasm-debug.js: dist/sql-wasm-debug.js out/worker.js
#	cat $^ > $@

# Building it this way gets us a wrapper that _knows_ it's in worker mode, which is nice.
# However, since we can't tell emcc that we don't need the wasm generated, and just want the wrapper, we have to pay to have the .wasm generated
# even though we would have already generated it with our sql-wasm.js target above.
# This would be made easier if this is implemented: https://github.com/emscripten-core/emscripten/issues/8506
# dist/worker.sql-wasm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js out/worker.js exports/functions.json exports/runtime_methods.json dist/sql-wasm-debug.wasm
# 	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) -s ENVIRONMENT=worker -s $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o out/sql-wasm.js
# 	mv out/sql-wasm.js out/tmp-raw.js
# 	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js out/worker.js > $@
# 	#mv out/sql-wasm.wasm dist/sql-wasm.wasm
# 	rm out/tmp-raw.js

# dist/worker.sql-wasm-debug.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) out/api.js out/worker.js exports/functions.json exports/runtime_methods.json dist/sql-wasm-debug.wasm
# 	$(EMCC) -s ENVIRONMENT=worker $(EMFLAGS) $(EMFLAGS_DEBUG) -s ENVIRONMENT=worker -s WASM_BINARY_FILE=sql-wasm-foo.debug $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o out/sql-wasm-debug.js
# 	mv out/sql-wasm-debug.js out/tmp-raw.js
# 	cat src/shell-pre.js out/tmp-raw.js src/shell-post.js out/worker.js > $@
# 	#mv out/sql-wasm-debug.wasm dist/sql-wasm-debug.wasm
# 	rm out/tmp-raw.js

out/sqlite3.bc: sqlite-src/$(SQLEET_AMALGAMATION)
	# Generate llvm bitcode
	$(EMCC) $(CFLAGS) sqlite-src/$(SQLEET_AMALGAMATION)/sqleet.c -o $@

out/extension-functions.bc: sqlite-src/$(SQLEET_AMALGAMATION)/$(EXTENSION_FUNCTIONS)
	$(EMCC) $(CFLAGS) -s LINKABLE=1 sqlite-src/$(SQLEET_AMALGAMATION)/extension-functions.c -o $@

## Cache

.PHONY: clean-cache
clean-cache:
	rm -rf cache/*

cache/$(SQLITE_AMALGAMATION).zip:
	mkdir -p cache
	curl -LsSf '$(SQLITE_AMALGAMATION_ZIP_URL)' -o $@

cache/$(SQLEET_AMALGAMATION).zip:
	mkdir -p cache
	curl -LsSf '$(SQLEET_AMALGAMATION_ZIP_URL)' -o $@

cache/$(EXTENSION_FUNCTIONS):
	mkdir -p cache
	curl -LsSf '$(EXTENSION_FUNCTIONS_URL)' -o $@

## sqlite-src

.PHONY: clean-sqlite-src
clean-sqlite-src:
	rm -rf sqlite

.PHONY: sqlite-src
sqlite-src: sqlite-src/$(SQLITE_EXTENSION_HEADERS) sqlite-src/$(SQLEET_AMALGAMATION) sqlite-src/$(EXTENSION_FUNCTIONS)

sqlite-src/$(SQLEET_AMALGAMATION): cache/$(SQLEET_AMALGAMATION).zip
	mkdir -p sqlite-src
	echo '$(SQLEET_AMALGAMATION_ZIP_SHA512)  ./cache/$(SQLEET_AMALGAMATION).zip' > cache/check.txt
	shasum -a 512 -c cache/check.txt
	rm -rf $@
	unzip 'cache/$(SQLEET_AMALGAMATION).zip' -d sqlite-src/
	touch $@

sqlite-src/$(SQLEET_AMALGAMATION)/$(SQLITE_EXTENSION_HEADERS): cache/$(SQLITE_AMALGAMATION).zip
	mkdir -p sqlite-src
	echo '$(SQLITE_AMALGAMATION_ZIP_SHA512)  ./cache/$(SQLITE_AMALGAMATION).zip' > cache/check.txt
	shasum -a 512 -c cache/check.txt
	unzip 'cache/$(SQLITE_AMALGAMATION).zip' -d cache/
	sed -i '' 's/sqlite3.h/sqleet.h/g' 'cache/$(SQLITE_AMALGAMATION)/sqlite3ext.h'
	cp 'cache/$(SQLITE_AMALGAMATION)/sqlite3ext.h' $@

sqlite-src/$(SQLEET_AMALGAMATION)/$(EXTENSION_FUNCTIONS): sqlite-src/$(SQLEET_AMALGAMATION)/$(SQLITE_EXTENSION_HEADERS) cache/$(EXTENSION_FUNCTIONS)
	mkdir -p sqlite-src
	echo '$(EXTENSION_FUNCTIONS_SHA512)  ./cache/$(EXTENSION_FUNCTIONS)' > cache/check.txt
	shasum -a 512 -c cache/check.txt
	cp 'cache/$(EXTENSION_FUNCTIONS)' $@

.PHONY: clean 
clean: 
	rm -rf out/* dist/*	

.PHONY: clean-all
clean-all: 
	rm -rf out/* dist/* cache/*
	rm -rf sqlite-src/

# TODO: Emit a file showing which version of emcc and SQLite was used to compile the emitted output.

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
# Use the SINGLE_FILE=1 option so we can bundle the .wasm within the JS
EMFLAGS = \
	--memory-init-file 0 \
	-s RESERVED_FUNCTION_POINTERS=64 \
	-s EXPORTED_FUNCTIONS=@exports/functions.json \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=@exports/runtime_methods.json \
	-s SINGLE_FILE=0 \
	-s NODEJS_CATCH_EXIT=0 \
	-s SINGLE_FILE=1

EMFLAGS_WASM = \
	-s WASM=1 \
	-s ALLOW_MEMORY_GROWTH=1 

EMFLAGS_OPTIMIZED= \
	-s INLINING_LIMIT=50 \
	-O3
	# Do not use Closure, instead use Webpack production optimizations since Module becomes undefined otherwise
	#--closure 1

EMFLAGS_DEBUG = \
	-s INLINING_LIMIT=10 \
	-O1

BITCODE_FILES = out/sqlite3.bc out/extension-functions.bc

all: optimized debug

.PHONY: debug
debug: dist/sqleet-shared-worker-debug.js

dist/sqleet-shared-worker-debug.js: $(BITCODE_FILES) out/api.js exports/functions.json exports/runtime_methods.json
	# Generate shared-worker-debug.js
	$(EMCC) $(EMFLAGS) $(EMFLAGS_DEBUG) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@

.PHONY: optimized
optimized: dist/sqleet-shared-worker.js

dist/sqleet-shared-worker.js: $(BITCODE_FILES) out/api.js exports/functions.json exports/runtime_methods.json 
	# Generate sqleet-shared-worker.js
	$(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(EMFLAGS_WASM) $(BITCODE_FILES) --pre-js out/api.js -o $@

out/sqlite3.bc: sqlite-src/$(SQLEET_AMALGAMATION)
	# Generate sqleet llvm bitcode
	$(EMCC) $(CFLAGS) sqlite-src/$(SQLEET_AMALGAMATION)/sqleet.c -o $@

out/extension-functions.bc: sqlite-src/$(SQLEET_AMALGAMATION)/$(EXTENSION_FUNCTIONS)
	# Generate extension-functions llvm bitcode
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

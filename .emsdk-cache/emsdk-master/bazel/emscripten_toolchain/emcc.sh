#!/bin/bash

source external/emsdk/emscripten_toolchain/env.sh

exec python3 $EMSCRIPTEN/emcc.py "$@"

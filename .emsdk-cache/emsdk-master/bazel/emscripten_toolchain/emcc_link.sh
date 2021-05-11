#!/bin/bash

source external/emsdk/emscripten_toolchain/env.sh

exec python3 external/emsdk/emscripten_toolchain/link_wrapper.py "$@"

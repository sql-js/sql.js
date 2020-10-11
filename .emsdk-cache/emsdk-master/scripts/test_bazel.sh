#!/usr/bin/env bash

echo "test bazel"

set -x
set -e

# Get the latest version number from emscripten-releases-tag.txt.
VER=$(grep -oP '(?<=latest\": \")([\d\.]+)(?=\")' \
        emscripten-releases-tags.txt \
      | sed --expression "s/\./\\\./g")
# Based on the latest version number, get the commit hash for that version.
HASH=$(grep "${VER}" emscripten-releases-tags.txt \
      | grep -v latest \
      | cut -f4 -d\")
      
FAILMSG="!!! scripts/update_bazel_toolchain.sh needs to be run !!!"

# Ensure the WORKSPACE file is up to date with the latest version.
grep ${VER} bazel/WORKSPACE || (echo ${FAILMSG} && false)
grep ${HASH} bazel/WORKSPACE || (echo ${FAILMSG} && false)

cd bazel
bazel build //hello-world:hello-world-wasm

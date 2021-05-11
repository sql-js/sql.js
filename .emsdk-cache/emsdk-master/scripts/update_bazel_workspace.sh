#!/bin/bash
# This script will update emsdk/bazel/WORKSPACE to the latest version of
# emscripten. It reads emsdk/emscripten-releases-tags.txt to get the latest
# version number. Then, it downloads the prebuilts for that version and computes
# the sha256sum for the archive. It then puts all this information into the
# emsdk/bazel/WORKSPACE file.

ERR=0
# Attempt to change to the emsdk root directory
cd $(dirname $0)/..

# If the previous command succeeded. We are in the emsdk root. Check to make
# sure the files and directories we need are present.
if [[ $? = 0 ]]; then
  if [[ ! -f emscripten-releases-tags.txt ]]; then
    echo "Cannot find emscripten-releases-tags.txt."
    ERR=1
  fi

  if [[ ! -d bazel ]]; then
    echo "Cannot find the bazel directory."
    ERR=1
  elif [[ ! -f bazel/WORKSPACE ]]; then
    echo "Cannot find bazel/WORKSPACE."
    ERR=1
  fi
else
  ERR=1
fi

if [[ $ERR = 1 ]]; then
  echo "Unable to cd into the emsdk root directory."
  exit 1
fi

URL1=https://storage.googleapis.com/webassembly/emscripten-releases-builds/
URL2=/wasm-binaries.tbz2

# Get commit hash for $1 version
get_hash () {
  echo $(grep "$1" emscripten-releases-tags.txt | grep -v latest | cut -f4 -d\")
}

# Get sha256 for $1 os $2 hash
get_sha () {
  echo $(curl "${URL1}$1/$2${URL2}" 2>/dev/null | sha256sum | awk '{print $1}')
}

# Assemble dictionary line
revisions_item () {
  hash=$(get_hash $1)
  echo \
      "\   \"$1\": struct(\n" \
      "\       hash = \"$(get_hash ${hash})\",\n" \
      "\       sha_linux = \"$(get_sha linux ${hash})\",\n" \
      "\       sha_mac = \"$(get_sha mac ${hash})\",\n" \
      "\       sha_win = \"$(get_sha win ${hash})\",\n" \
      "\   ),"
}

append_revision () {
  sed -i "5 i $(revisions_item $1)" bazel/revisions.bzl
}

# Get the latest version number from emscripten-releases-tag.txt.
VER=$(grep -oP '(?<=latest\": \")([\d\.]+)(?=\")' \
        emscripten-releases-tags.txt \
      | sed --expression "s/\./\\\./g")

append_revision ${VER}

echo "Done!"

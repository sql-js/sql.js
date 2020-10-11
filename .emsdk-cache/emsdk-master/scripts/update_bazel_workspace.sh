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

URL1=https://storage.googleapis.com/webassembly/emscripten-releases-builds/linux/
URL2=/wasm-binaries.tbz2

# Get the latest version number from emscripten-releases-tag.txt.
VER=$(grep -oP '(?<=latest\": \")([\d\.]+)(?=\")' \
        emscripten-releases-tags.txt \
      | sed --expression "s/\./\\\./g")
# Based on the latest version number, get the commit hash for that version.
HASH=$(grep "${VER}" emscripten-releases-tags.txt \
      | grep -v latest \
      | cut -f4 -d\")
# Download and compute the sha256sum for the archive with the prebuilts.
SHA=$(curl "${URL1}${HASH}${URL2}" 2>/dev/null \
      | sha256sum \
      | awk '{print $1}')
# Get the line number on which the sha256 sum lives for emscripten.
# This will always be one line after the name of the rule.
SHALINE=$(($(grep -n 'name = "emscripten"' bazel/WORKSPACE \
      | sed 's/^\([[:digit:]]*\).*$/\1/')+1))

# Insert the new commit hash into the url.
sed -i "s!\(${URL1}\)\([[:alnum:]]*\)\(${URL2}\)!\1${HASH}\3!" bazel/WORKSPACE
# Insert the new version number.
sed -i "s!\(# emscripten \)\(.*\)!\1${VER}!" bazel/WORKSPACE
# Insert the new sha256 sum.
sed -i "${SHALINE}s!\"[[:alnum:]]*\"!\"${SHA}\"!" bazel/WORKSPACE

echo "Done!"

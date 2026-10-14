#!/usr/bin/env bash
set -euo pipefail

# Use the maintained runner and Node's built-in assertions.
exec node --unhandled-rejections=strict "$(dirname "$0")/all.js" "${1:-wasm}"

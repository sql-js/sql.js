"""Unpackages a bazel emscripten archive for use in a bazel BUILD rule.

This script will take a tar archive containing the output of the emscripten
toolchain. This file contains any output files produced by a wasm_cc_binary or a
cc_binary built with --config=wasm. The files are extracted into the given
output path.

The name of archive is expected to be of the format `foo` or `foo.XXX` and
the contents are expected to be foo.js and foo.wasm.

Several optional files may also be in the archive, including but not limited to
foo.js.mem, pthread-main.js, and foo.wasm.map.

If the file is not a tar archive, the passed file will simply be copied to its
destination.

This script and its accompanying Bazel rule should allow you to extract a
WebAssembly binary into a larger web application.
"""

import argparse
import os
import subprocess
import sys


def ensure(f):
  if not os.path.exists(f):
    with open(f, 'w'):
      pass


def check(f):
  if not os.path.exists(f):
    raise Exception('Expected file in archive: %s' % f)


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('--archive', help='The archive to extract from.')
  parser.add_argument('--output_path', help='The path to extract into.')
  args = parser.parse_args()

  basename = os.path.basename(args.archive)
  stem = basename.split('.')[0]

  # Check the type of the input file
  mimetype_bytes = subprocess.check_output(['file', '-Lb', '--mime-type', '--mime-encoding', args.archive])
  mimetype = mimetype_bytes.decode(sys.stdout.encoding)

  # If we have a tar, extract all files. If we have just a single file, copy it.
  if 'tar' in mimetype:
    subprocess.check_call(
        ['tar', 'xf', args.archive, '-C', args.output_path])
  elif 'binary' in mimetype:
    subprocess.check_call([
        'cp',
        args.archive,
        os.path.join(args.output_path, stem + '.wasm')])
  elif 'text' in mimetype:
    subprocess.check_call([
        'cp',
        args.archive,
        os.path.join(args.output_path, stem + '.js')])
  else:
    subprocess.check_call(['cp', args.archive, args.output_path])

  # At least one of these two files should exist at this point.
  ensure(os.path.join(args.output_path, stem + '.js'))
  ensure(os.path.join(args.output_path, stem + '.wasm'))

  # And can optionally contain these extra files.
  ensure(os.path.join(args.output_path, stem + '.wasm.map'))
  ensure(os.path.join(args.output_path, stem + '.worker.js'))
  ensure(os.path.join(args.output_path, stem + '.js.mem'))
  ensure(os.path.join(args.output_path, stem + '.data'))
  ensure(os.path.join(args.output_path, stem + '.fetch.js'))
  ensure(os.path.join(args.output_path, stem + '.js.symbols'))
  ensure(os.path.join(args.output_path, stem + '.wasm.debug.wasm'))
  ensure(os.path.join(args.output_path, stem + '.html'))


if __name__ == '__main__':
  main()

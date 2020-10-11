#!/usr/bin/env python3
# Copyright 2020 The Emscripten Authors.  All rights reserved.
# Emscripten is available under two separate licenses, the MIT license and the
# University of Illinois/NCSA Open Source License.  Both these licenses can be
# found in the LICENSE file.

"""Updates the python binaries that we cache store at
http://storage.google.com/webassembly.

We only supply binaries for windows and macOS, but we do it very different ways for those two OSes.

Windows recipe:
  1. Download the "embeddable zip file" version of python from python.org
  2. Remove .pth file to work around https://bugs.python.org/issue34841
  3. Download and install pywin32 in the `site-packages` directory
  4. Re-zip and upload to storage.google.com

macOS recipe:
  1. Clone cpython
  2. Use homebrew to install and configure openssl (for static linking!)
  3. Build cpython from source and use `make install` to create archive.
"""

import glob
import multiprocessing
import os
import urllib.request
import shutil
import subprocess
import sys
from subprocess import check_call

version = '3.7.4'
base = 'https://www.python.org/ftp/python/%s/' % version
revision = '2'

pywin32_version = '227'
pywin32_base = 'https://github.com/mhammond/pywin32/releases/download/b%s/' % pywin32_version

upload_base = 'gs://webassembly/emscripten-releases-builds/deps/'


def make_python_patch(arch):
    if arch == 'amd64':
      pywin32_filename = 'pywin32-%s.win-%s-py3.7.exe' % (pywin32_version, arch)
    else:
      pywin32_filename = 'pywin32-%s.%s-py3.7.exe' % (pywin32_version, arch)
    filename = 'python-%s-embed-%s.zip' % (version, arch)
    out_filename = 'python-%s-embed-%s+pywin32.zip' % (version, arch)
    if not os.path.exists(pywin32_filename):
        download_url = pywin32_base + pywin32_filename
        print('Downloading pywin32: ' + download_url)
        urllib.request.urlretrieve(download_url, pywin32_filename)

    if not os.path.exists(filename):
        download_url = base + filename
        print('Downloading python: ' + download_url)
        urllib.request.urlretrieve(download_url, filename)

    os.mkdir('python-embed')
    check_call(['unzip', '-q', os.path.abspath(filename)], cwd='python-embed')
    os.remove(os.path.join('python-embed', 'python37._pth'))

    os.mkdir('pywin32')
    rtn = subprocess.call(['unzip', '-q', os.path.abspath(pywin32_filename)], cwd='pywin32')
    assert rtn in [0, 1]

    os.mkdir(os.path.join('python-embed', 'lib'))
    shutil.move(os.path.join('pywin32', 'PLATLIB'), os.path.join('python-embed', 'lib', 'site-packages'))

    check_call(['zip', '-rq', os.path.join('..', out_filename), '.'], cwd='python-embed')

    upload_url = upload_base + out_filename
    print('Uploading: ' + upload_url)
    cmd = ['gsutil', 'cp', '-n', out_filename, upload_url]
    print(' '.join(cmd))
    check_call(cmd)

    # cleanup if everything went fine
    shutil.rmtree('python-embed')
    shutil.rmtree('pywin32')


def build_python():
    if sys.platform.startswith('darwin'):
        osname = 'macos'
        # Take some rather drastic steps to link openssl statically
        check_call(['brew', 'install', 'openssl', 'pkg-config'])
        os.remove('/usr/local/opt/openssl/lib/libssl.dylib')
        os.remove('/usr/local/opt/openssl/lib/libcrypto.dylib')
        os.environ['PKG_CONFIG_PATH'] = '/usr/local/opt/openssl/lib/pkgconfig/'
    else:
        osname = 'linux'

    src_dir = 'cpython'
    if not os.path.exists(src_dir):
      check_call(['git', 'clone', 'https://github.com/python/cpython'])
    check_call(['git', 'checkout', 'v' + version], cwd=src_dir)
    check_call(['./configure'], cwd=src_dir)
    check_call(['make', '-j', str(multiprocessing.cpu_count())], cwd=src_dir)
    check_call(['make', 'install', 'DESTDIR=install'], cwd=src_dir)

    install_dir = os.path.join(src_dir, 'install')

    # Install requests module.  This is needed in particualr on macOS to ensure
    # SSL certificates are available (certifi in installed and used by requests).
    pybin = os.path.join(src_dir, 'install', 'usr', 'local', 'bin', 'python3')
    pip = os.path.join(src_dir, 'install', 'usr', 'local', 'bin', 'pip3')
    check_call([pybin, pip, 'install', 'requests'])

    dirname = 'python-%s-%s' % (version, revision)
    os.rename(os.path.join(install_dir, 'usr', 'local'), dirname)
    tarball = 'python-%s-%s-%s.tar.gz' % (version, revision, osname)
    shutil.rmtree(os.path.join(dirname, 'lib', 'python3.7', 'test'))
    shutil.rmtree(os.path.join(dirname, 'include'))
    for lib in glob.glob(os.path.join(dirname, 'lib', 'lib*.a')):
      os.remove(lib)
    check_call(['tar', 'zcvf', tarball, dirname])
    print('Uploading: ' + upload_base + tarball)
    check_call(['gsutil', 'cp', '-n', tarball, upload_base + tarball])


def main():
    if sys.platform.startswith('win'):
        for arch in ('amd64', 'win32'):
            make_python_patch(arch)
    else:
        build_python()
    return 0


if __name__ == '__main__':
  sys.exit(main())

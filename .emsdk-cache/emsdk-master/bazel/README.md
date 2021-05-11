# Bazel Emscripten toolchain

## Setup Instructions

In `WORKSPACE` file, put:
```
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
    name = "emsdk",
    strip_prefix = "emsdk-c1589b55641787d55d53e883852035beea9aec3f/bazel",
    url = "https://github.com/emscripten-core/emsdk/archive/c1589b55641787d55d53e883852035beea9aec3f.tar.gz",
    sha256 = "7a58a9996b113d3e0675df30b5f17e28aa47de2e684a844f05394fe2f6f12e8e",
)

load("@emsdk//:deps.bzl", emsdk_deps = "deps")
emsdk_deps()

load("@emsdk//:emscripten_deps.bzl", emsdk_emscripten_deps = "emscripten_deps")
emsdk_emscripten_deps()
```

## Building

### Using --config=wasm

Put the following lines into your `.bazelrc`:
```
build:wasm --crosstool_top=//emscripten_toolchain:everything
build:wasm --cpu=wasm
build:wasm --host_crosstool_top=@bazel_tools//tools/cpp:toolchain
```

Simply pass `--config=wasm` when building a normal `cc_binary`. The result of
this build will be a tar archive containing any files produced by emscripten.

### Using wasm_cc_binary
First, write a new rule wrapping your `cc_binary`.

```
load("@rules_cc//cc:defs.bzl", "cc_binary")
load("@emsdk//emscripten_toolchain:wasm_rules.bzl", "wasm_cc_binary")

cc_binary(
    name = "hello-world",
    srcs = ["hello-world.cc"],
)

wasm_cc_binary(
    name = "hello-world-wasm",
    cc_target = ":hello-world",
)
```

Now you can run `bazel build :hello-world-wasm`. The result of this build will
be the individual files produced by emscripten. Note that some of these files
may be empty. This is because bazel has no concept of optional outputs for
rules.

`wasm_cc_binary` uses transition to use emscripten toolchain on `cc_target`
and all of its dependencies, and does not require amending `.bazelrc`. This
is the preferred way, since it also unpacks the resulting tarball.

# Bazel Emscripten toolchain

## Setup Instructions

1. Merge the `WORKSPACE` file in with your own at the root of your bazel
directory structure. If you don't have one, simply copy the file.
2. Merge the `bazelrc` file in with your `.bazelrc` file at the root of your
bazel directory structure. If you don't have one, simply copy the file and
rename it to `.bazelrc`. (Note the `.`)
3. Copy the `emscripten_toolchain` folder along with its contents to the root of
your bazel directory.

Your directory structure should look like this:
```
bazel_root/
├── .bazelrc
├── WORKSPACE
├── emscripten_toolchain/
│   ├── BUILD.bazel
│   ├── builddefs.bzl
│   ├── crosstool.bzl
│   ├── emar.sh
│   ├── emcc.sh
│   ├── emcc_link.sh
│   ├── emscripten.BUILD
│   ├── emscripten_config
│   ├── env.sh
│   ├── link_wrapper.py
│   ├── wasm_binary.py
│   ├── wasm_cc_binary.bzl
│   ├── wasm_rules.bzl
├── your_project_folder/
│   ├── your_project.file
```

## Building

### Using --config=wasm
Simply pass `--config=wasm` when building a normal `cc_binary`. The result of
this build will be a tar archive containing any files produced by emscripten.

### Using wasm_cc_binary
First, write a new rule wrapping your `cc_binary`.

```
load("@rules_cc//cc:defs.bzl", "cc_binary")
load("//emscripten_toolchain:wasm_rules.bzl", "wasm_cc_binary")

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

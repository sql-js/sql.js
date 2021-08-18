
# Compiling and Contributing

General consumers of this library don't need to read any further. (The compiled files are available via the [release page](https://github.com/sql-js/sql.js/releases).)

If you want to compile your own version of SQLite for WebAssembly, or want to contribute to this project, read on.

## Setting up your Development Environment

### Containerized Development Environment (Recommended) 

This project defines a standardized development environment using Docker (and the .devcontainer spec in particular). This allows for anyone on any platform to get up and running quickly. (VSCode is not technically required to make use of this standardized environment, but it makes containerized development so seamless that the non-VSCode path is not currently documented here.)

Standardizing our development environment has numerous benefits:
- Allows anyone on ANY platform (Linux, Mac, and Windows) to contribute or compile their own build.
- It's quicker and easier for any contributor to dive in and fix issues.
- (Practically) eliminates configuration bugs that are difficult for maintainers to reproduce. Also known as "works on my machine" issues.
- Allows us to write our scripts assuming that they're _always_ running in a single known environment of a single, known platform. 
- Ensure that all contributors use a known, standardized installation of EMSDK.
- Allows for a more clearly documented process for updating the EMSDK to a new version.
- End-Users that simply want to compile and install their own version of SQLite don't have to bother with EMSDK installation in their particular environment.

To get started:

1. Follow the [Installation Steps for Containerized Development in VSCode](https://code.visualstudio.com/docs/remote/containers#_installation). This includes installing Docker, VSCode, and the [Remote Development extension pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) for VSCode)
2. Clone this repository
3. Open the repository folder in VSCode. It will detect the presence of a .devcontainer and prompt you: "Folder contains a Dev Container configuration file. Reopen folder to develop in a container." Click "Reopen in container"

You're now ready to test the dev environment:

4. Click on Terminal->New Terminal to be dropped into a terminal inside the dev environment.
5. Run `$ npm install` to install the required modules
6. Run `$ npm test` to ensure all tests pass
7. Run `$ npm rebuild` to re-compile the project from scratch (using the version of EMSDK installed in the container).
8. Run `$ npm test` to ensure all tests pass after said rebuild

You're now ready for development!

### Host-based configuration (Not recommended)

If you're on a Mac or Linux-based host machine, you can install and use the EMSDK directly to perform a build.
Note that if you run into bugs with this configuration, we highly encourage you to use the containerized development environment instead, as detailed above.

Instructions:

1. [Install the EMSDK](https://emscripten.org/docs/getting_started/downloads.html)
2. Clone this repository
3. Run `$ npm install` to install the required modules
4. Run `$ npm test` to ensure all tests pass
5. Run `$ npm rebuild` to re-compile the project from scratch (using the version of EMSDK installed in the container).
6. Run `$ npm test` to ensure all tests pass after said rebuild

## Compiling SQLite with different options

In order to enable extensions like JSON1 or FTS5, change the CFLAGS in the [Makefile](Makefile) and run `npm run rebuild`:

``` diff
CFLAGS = \
        -O2 \
        -DSQLITE_OMIT_LOAD_EXTENSION \
        -DSQLITE_DISABLE_LFS \
        -DSQLITE_ENABLE_FTS3 \
        -DSQLITE_ENABLE_FTS3_PARENTHESIS \
+       -DSQLITE_ENABLE_FTS5 \
+       -DSQLITE_ENABLE_JSON1 \
        -DSQLITE_THREADSAFE=0
```

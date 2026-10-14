# Dependency inventory

SQL.js has no npm runtime dependencies. Its SQLite engine, compiler, contributor
tools, workflows, documentation, and browser examples still depend on the
components below. Review these together when updating dependencies.

| Component | Where it is selected | Update source / policy |
| --- | --- | --- |
| SQLite amalgamation | `Makefile` URL, directory, SHA3-256 | [Official downloads](https://sqlite.org/download.html); update all three together and verify the archive checksum. |
| SQLite math/string extension | `Makefile` URL and SHA1 | [Contributed source](https://www.sqlite.org/contrib/download/extension-functions.c?get=25); the 2010 source is unchanged, so retain its verified checksum. |
| Emscripten SDK | `.devcontainer/Dockerfile` | [Emscripten releases](https://github.com/emscripten-core/emscripten/releases); clone the matching SDK tag and install/activate that exact version. LLVM, Binaryen, Closure Compiler, and the SDK's internal Node are managed together by EMSDK. |
| Development image and OS utilities | `.devcontainer/Dockerfile`, `.devcontainer/devcontainer.json` | [Devcontainer images](https://github.com/devcontainers/images/tree/main/src/typescript-node); use Node 24 LTS on Debian 13 (trixie). The image and apt repositories supply Node/npm, TypeScript, Python 3, Git, Make, curl, unzip, wget, GnuPG, Java, and checksum tools. Rebuild with `docker build --pull` to refresh their supported distribution packages. |
| Node for host tools and CI | `.node-version`, both workflows | [Node releases](https://nodejs.org/en/download); CI reads the exact Node 24 LTS version from `.node-version`. Contributor tools use Node 24; the Emscripten 6 runtime floor is Node 18.3, pinned separately in `Makefile`. |
| npm publishing CLI | `.github/workflows/release.yml` | [npm releases](https://github.com/npm/cli/releases); pin the tested version. Trusted publishing requires OIDC and `id-token: write`. |
| ESLint, `@eslint/js`, globals, JSDoc, documentation theme | `package.json`, `package-lock.json` | npm registry stable releases; refresh the complete lockfile, including nested dependencies, and run `npm ci`, lint, tests, docs, and `npm audit`. `eslint.config.cjs` is the active lint configuration. |
| Checkout, Node setup, artifact upload/download, Pages deployment actions | `.github/workflows/*.yml` | Upstream stable releases; pin commit SHAs and record the corresponding release in comments. The local build action uses the same devcontainer as contributors. |
| GitHub release CLI | GitHub-hosted Ubuntu runner | [GitHub CLI](https://cli.github.com/manual/gh_release_create); supplied and updated by the runner image. It replaces the archived create-release/upload-release-asset actions, and preserves release asset names and labels. |
| Docsify | `index.html` | [Docsify releases](https://github.com/docsifyjs/docsify/releases); pin the same version for the script and stylesheet. |
| CodeMirror | `examples/GUI/index.html` | [CodeMirror 5](https://github.com/codemirror/codemirror5/releases); keep script, stylesheet, theme, and SQL mode at the same latest 5.x version. Version 6 uses a different editor API and needs a separate demo migration. |
| RequireJS | `examples/requireJS.html`, `test/sql-requireJS.html` | [RequireJS releases](https://github.com/requirejs/requirejs/releases); pin the same HTTPS CDN version in both pages. |
| Demo fonts | `examples/GUI/index.html` | Google Fonts' Inter and JetBrains Mono APIs are hosted services without a release-version pin. |

The Python example server uses only the Python 3 standard library. The main
JavaScript test runner uses Node's built-in assertions; `test/run.sh` delegates
to it. Historical standalone test-file entry points still refer to the retired
`test` module; use `npm test` or `test/run.sh` instead.

## Validation

Build all asm.js and WebAssembly variants with the updated container, then run
`npm ci`, `npm test`, `npm run doc`, and `npm audit`. Smoke-test the GUI editor,
Docsify homepage, generated API documentation, and AMD page in a browser. Check
workflow syntax and package the release assets without publishing them.

The documentation theme's major updates can change template paths, option
schemas, generated routes, and asset URLs. Check the `/documentation/` base path,
metadata, navigation, and links in `documentation_index.md` after regenerating.
`scripts/doc-redirects.cjs` preserves the old JSDoc pages and member links.
Pages deployment should consume the artifacts from the successful build job.
Actual Pages deployment, release creation, and npm publication happen only on
their existing master/tag triggers.

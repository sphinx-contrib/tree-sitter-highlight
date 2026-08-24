# Node.js binding

Provides syntax highlighting with Tree-sitter from Node.js, mirroring the
[Python](https://crates.io/crates/tree-sitter-highlight) binding.

```js
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const tsPython = require("tree-sitter-python");
const { search_parsers, highlight } = require("tree-sitter-highlight");

// Discover the parsers. `search_parsers` reads each grammar package's `queries/*.scm`
// files from disk and keeps the package's `language` object for later pointer extraction.
const parsers = search_parsers({
  python: tsPython,
  // pass `javascript: require("tree-sitter-javascript")` to add more languages
});

const code = highlight({
  source: "x = 1\ndef foo():\n    return x\n",
  language: "python",
  parsers,
  theme: { variable: { color: "#F8F8F2" }, function: { color: "#FF0000" } },
  format: "html",
  layout: "fragment",
  style: "classes",
});

console.log(code);
```

## API

### `search_parsers(parsers)`

`parsers` is an object mapping a language name to an imported `tree_sitter_*`
grammar package (the value of `require("tree-sitter-python")`).

Returns `{ lang: { language, highlights, injections, locals } }`, where:

- `language` is the grammar package's `language` object (the `napi_external`
  holding its `TSLanguage*`), kept so `highlight` can recover the pointer later;
- `highlights` / `injections` / `locals` are the full text of the corresponding
  `queries/{name}.scm` files (empty string when a file is absent).

Grammar packages that expose no usable `language` are skipped silently, so they
do not appear in the result.

### `highlight(options)`

`options`:

| field         | type                            | default      | notes                                   |
| ------------- | ------------------------------- | ------------ | --------------------------------------- |
| `source`      | `string`                        | —            | literal text; if omitted, `file` is read |
| `file`        | `string`                        | —            | path to read (`"-"` means stdin)         |
| `language`    | `string`                        | —            | language key into `parsers`              |
| `parsers`     | `object`                        | —            | the `search_parsers` output              |
| `theme`       | `object`                        | config theme | `name -> { color, bold, ... }`           |
| `format`      | `"html"\|"latex"\|"terminal"`   | `"html"`     |                                         |
| `layout`      | `"document"\|"line-numbers"\|"fragment"` | `"document"` | ignored for `terminal`  |
| `style`       | `"classes"\|"inline"\|"minimal"` | `"classes"`  | ignored for `terminal`                   |
| `prefix`      | `string`                        | `""`         | CSS/class prefix                         |
| `math_escape` | `string[]`                      | `[]`         | scope names whose LaTeX escapes enabled  |

Returns the highlighted document as a string.

## Building

The native addon is a Rust crate compiled with [napi-rs](https://napi.rs). Prebuilt
binaries are produced with [prebuildify](https://github.com/prebuild/prebuildify), which
compiles via napi and lays the artifact out under `prebuilds/<platform>-<arch>/` so it
can be loaded at runtime by [node-gyp-build](https://github.com/prebuild/node-gyp-build)
(the loader that pairs with prebuildify).

```sh
npm install
npm run build          # napi build -> tree_sitter_highlight.<triple>.node (local dev)
npm run prebuildify    # napi build + copy into prebuilds/linux-x64/tree_sitter_highlight.node
npm test
```

`index.js` loads the addon through `node-gyp-build(__dirname)`, preferring the
`prebuilds/` layout and falling back to a cargo-built cdylib
(`target/{debug,release}/libtree_sitter_highlight.so`) when no prebuild is present.

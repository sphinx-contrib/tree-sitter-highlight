// tree-sitter-highlight Node.js bindings.
//
// `highlight` is implemented in Rust (compiled to the native addon); `search_parsers` is a thin
// CommonJS shim because it needs `require.cache` to locate each grammar package's `queries/`
// directory — something only available from JavaScript, not the native addon context.
//
// The native addon is prebuilt into `prebuilds/<platform>-<arch>/tree_sitter_highlight.node` (via
// `npm run prebuildify`, which shells out to napi-cli to compile the Rust crate) and loaded at
// runtime with `node-gyp-build`, the loader that pairs with prebuildify. A cargo-built cdylib is
// used as a fallback when no prebuild is present.

const path = require("path");
const fs = require("fs");

// prebuildify layout: `prebuilds/<platform>-<arch>/tree_sitter_highlight.node`, resolved by
// `node-gyp-build` (the loader that pairs with prebuildify). napi-cli produces the per-triple
// `tree_sitter_highlight.<triple>.node` in this directory too, which node-gyp-build also finds.
function loadBinding() {
  try {
    return require("node-gyp-build")(__dirname);
  } catch (_) {
    // ignore and fall through to cargo build artifacts below
  }

  // Fall back to a cargo-built cdylib placed directly in this directory.
  const ext =
    process.platform === "win32"
      ? ".dll"
      : process.platform === "darwin"
        ? ".dylib"
        : ".so";
  const direct = path.join(__dirname, `tree_sitter_highlight${ext}`);
  if (fs.existsSync(direct)) {
    return require(direct);
  }

  // Fall back to the cargo-built shared library (libtree_sitter_highlight.so / .dylib / .dll).
  for (const profile of ["debug", "release"]) {
    const p = path.join(__dirname, "..", "..", "target", profile, `libtree_sitter_highlight${ext}`);
    if (fs.existsSync(p)) {
      return require(p);
    }
  }

  throw new Error(
    "Could not locate the tree-sitter-highlight native binding. Run `npm run build` (napi-cli) or `cargo build -p nodejs-tree-sitter-highlight`.",
  );
}

const binding = loadBinding();

// Find the package directory of a grammar module by matching it against `require.cache`.
//
// Node module objects carry no `__file__`, but in CommonJS `require.cache` maps each loaded file to
// a module record whose `exports` is identical (by reference) to the object the caller imported via
// `require(...)`. We walk the cache comparing each record's `exports` to `module` with `===`, then
// walk up to the directory containing `package.json` — that is the package root whose `queries/` we
// read.
function moduleDirOf(module) {
  const cache = require.cache;
  for (const file of Object.keys(cache)) {
    if (cache[file].exports === module) {
      let dir = path.dirname(file);
      while (dir && dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, "package.json"))) {
          return dir;
        }
        dir = path.dirname(dir);
      }
    }
  }
  throw new Error("cannot determine grammar module directory (not found in require.cache)");
}

function readQueryFile(dir, name, lang) {
  const base = path.join(dir, "queries");
  for (const p of [path.join(base, name), path.join(base, lang, name)]) {
    try {
      return fs.readFileSync(p, "utf8");
    } catch (_) {
      // try next candidate / fall through to empty string
    }
  }
  return "";
}

/**
 * Build the `{ lang: { language, highlights, injections, locals } }` registry expected by
 * `highlight`.
 *
 * @param {Object<string, object>} parsers map of language name -> imported grammar package
 *   (e.g. the result of `require("tree-sitter-python")`).
 * @returns {Object<string, {language: object, highlights: string, injections: string, locals: string}>}
 */
function search_parsers(parsers) {
  const result = {};
  for (const [lang, mod] of Object.entries(parsers)) {
    if (!mod || mod.language == null) {
      // Skip grammar packages that expose no usable `language`, silently.
      continue;
    }
    const dir = moduleDirOf(mod);
    result[lang] = {
      language: mod.language,
      highlights: readQueryFile(dir, "highlights.scm", lang),
      injections: readQueryFile(dir, "injections.scm", lang),
      locals: readQueryFile(dir, "locals.scm", lang),
    };
  }
  return result;
}

module.exports = {
  search_parsers,
  highlight: binding.highlight,
};

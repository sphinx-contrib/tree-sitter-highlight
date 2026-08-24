#!/usr/bin/env node
// End-to-end test for tree-sitter-highlight (Node.js binding).
//
// ES modules have no `require.cache`, so we recreate a CommonJS `require` via `createRequire`; the
// `search_parsers` shim relies on `require.cache` to locate grammar package directories.
import { createRequire } from "node:module";
import assert from "node:assert";

const require = createRequire(import.meta.url);
const { search_parsers, highlight } = require("../index.js");
const tsPython = require("tree-sitter-python");

// search_parsers: returns a registry keyed by language name.
const parsers = search_parsers({ python: tsPython });
assert.deepStrictEqual(Object.keys(parsers), ["python"]);

// The stored `language` is the grammar package's own `language` object.
assert.strictEqual(parsers.python.language, tsPython.language);
assert.ok(typeof parsers.python.highlights === "string" && parsers.python.highlights.length > 0);
// tree-sitter-python ships no injections/locals queries, so those are empty strings.
assert.strictEqual(parsers.python.injections, "");
assert.strictEqual(parsers.python.locals, "");

// A module without a usable `.language` is skipped silently.
const empty = search_parsers({ nope: require("../index.js") });
assert.deepStrictEqual(empty, {});

// highlight: produces HTML with class spans for the highlighted scopes.
const code = highlight({
  source: "x = 1\ndef foo():\n    return x\n",
  language: "python",
  parsers,
  theme: { variable: { color: "#F8F8F2" }, function: { color: "#FF0000" } },
  layout: "fragment",
  style: "classes",
  format: "html",
});
assert.ok(
  code.includes("<span class='function'>foo</span>"),
  `expected function span, got:\n${code}`,
);
assert.ok(
  code.includes("<span class='variable'>x</span>"),
  `expected variable span, got:\n${code}`,
);

console.log("tree-sitter-highlight: all tests passed");

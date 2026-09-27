'use strict';

// markdown-it plugin: highlight fenced code blocks with tree-sitter-highlight.
//
// On first use the plugin scans the host project's `node_modules` for every installed
// `tree-sitter-*` grammar package (and `@scope/tree-sitter-*`), requires each one, hands
// them to `search_parsers()` to build the parser registry, and then routes each code fence
// through `highlight()`. A fence's language must match a discovered grammar's name (the
// package `tree-sitter-javascript` registers the key `javascript`, so ```javascript``` works);
// unsupported languages fall back to markdown-it's default fence renderer, so no code block
// is ever dropped.

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const { search_parsers, highlight } = require('nodejs-tree-sitter-highlight');

// Packages whose name indicates they are *not* a plain grammar (bindgen helpers, config, etc.).
const IGNORE = new Set([
  'tree-sitter-cli',
  'tree-sitter-language',
  'tree-sitter-language-detection',
  'tree-sitter-wasm',
  'tree-sitter-node',
  'tree-sitter-compiler',
]);

// Derive the registry key for a grammar package name: `tree-sitter-javascript` -> `javascript`,
// `@scope/tree-sitter-foo` -> `foo`. This is the key a fence language must match.
function grammarKey(pkgName) {
  const base = pkgName.startsWith('@') ? pkgName.split('/')[1] : pkgName;
  return base.replace(/^tree-sitter-/, '');
}

// Collect candidate `tree-sitter-*` package names from a `node_modules` directory. Scans the top
// level and `@scope/` subdirectories (npm's flat install hoists scoped packages there).
function listGrammarPackages(nodeModules) {
  const names = [];
  if (!fs.existsSync(nodeModules)) return names;

  for (const entry of fs.readdirSync(nodeModules)) {
    if (entry[0] === '.') continue;
    const abs = path.join(nodeModules, entry);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch (_) {
      continue;
    }
    if (!stat.isDirectory()) continue;

    if (entry.startsWith('tree-sitter-') && !IGNORE.has(entry)) {
      names.push(entry);
    } else if (entry.startsWith('@')) {
      for (const sub of fs.readdirSync(abs)) {
        if (sub.startsWith('tree-sitter-') && !IGNORE.has(sub)) {
          names.push(`${entry}/${sub}`);
        }
      }
    }
  }
  return names;
}

// Load every discovered grammar package. `requireFrom` resolves from `basedir` so discovery uses
// the host project's node_modules. Returns `{ key: grammarModule }`.
function loadGrammars(basedir) {
  const requireFrom = createRequire(path.join(basedir, 'package.json'));
  const nodeModules = path.join(basedir, 'node_modules');
  const packages = listGrammarPackages(nodeModules);

  const modules = {};
  for (const pkgName of packages) {
    let mod;
    try {
      mod = requireFrom(pkgName);
    } catch (e) {
      console.warn(`[markdown-it-tree-sitter] failed to load grammar "${pkgName}": ${e.message}`);
      continue;
    }
    if (!mod || mod.language == null) continue; // not a usable grammar; skip silently
    const key = grammarKey(pkgName);
    if (!modules[key]) modules[key] = mod;
  }
  return modules;
}

// Plugin entry point. Usage: `md.use(markdownItTreeSitter, options)`.
//
// options:
//   basedir   directory whose node_modules is scanned for grammars (default: process.cwd())
//   theme     optional highlight theme (name -> { color, bold, ... })
//   layout    'fragment' | 'document' | 'line-numbers' (default 'fragment')
//   style     'inline' | 'classes' | 'minimal' (default 'inline')
function markdownItTreeSitter(md, options) {
  options = options || {};
  const basedir = options.basedir || process.cwd();

  // Discover grammars and build the registry once per plugin instance.
  const grammarModules = loadGrammars(basedir);
  const parsers = search_parsers(grammarModules);

  if (Object.keys(parsers).length === 0) {
    console.warn(
      '[markdown-it-tree-sitter] no tree-sitter-* grammars found in ' +
        path.join(basedir, 'node_modules') +
        '; falling back to default rendering for all code blocks.',
    );
  }

  // A fence language matches a registry key directly (case-insensitive).
  const resolveLang = (lang) => {
    if (!lang) return null;
    const key = lang.toLowerCase();
    return parsers[key] ? key : null;
  };

  const defaultFence = md.renderer.rules.fence;

  md.renderer.rules.fence = function (tokens, idx, opts, env, self) {
    const token = tokens[idx];
    const lang = token.info.trim().split(/\s+/)[0] || '';
    const key = resolveLang(lang);

    if (!key) {
      return defaultFence ? defaultFence(tokens, idx, opts, env, self) : '';
    }

    try {
      const highlighted = highlight({
        source: token.content,
        language: key,
        parsers,
        theme: options.theme,
        format: 'html',
        layout: options.layout || 'fragment',
        style: options.style || 'inline',
      });
      // markdown-it pairs the fence output with a trailing newline; replicate that.
      return highlighted + '\n';
    } catch (e) {
      console.warn(`[markdown-it-tree-sitter] highlight failed for "${lang}": ${e.message}`);
      return defaultFence ? defaultFence(tokens, idx, opts, env, self) : '';
    }
  };
}

module.exports = markdownItTreeSitter;

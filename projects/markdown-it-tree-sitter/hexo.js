'use strict';

// Hexo plugin: replace the native code-block highlighter with tree-sitter-highlight.
//
// Strategy: a post-render filter (`after_render:html`) scans the generated HTML for
// fenced code blocks (`<pre><code class="language-XX">…</code></pre>`), decodes the
// HTML entities back into source, runs tree-sitter highlighting, and swaps the block
// for the self-contained `<div class="highlight"><pre><code>…</code></pre></div>` the
// `tree-sitter-highlight` addon emits (its `<span>`s carry inline `style='color:…'`,
// so no extra stylesheet is needed). Blocks whose language is unsupported fall back to
// the original markup untouched.
//
// Enable / configure in `_config.yml`:
//   highlight:
//     enable: true                 # default true
//     theme: { ... }               # optional, overrides the built-in theme
//     languages:                   # optional, fence-lang -> npm grammar package
//       python: tree-sitter-python
//       ts: tree-sitter-typescript

// Default mapping of a fence language to an installed `tree-sitter-*` npm package.
// Every key becomes a registry key, so e.g. both `js` and `javascript` are accepted.
const DEFAULT_LANG_MAP = {
  javascript: 'tree-sitter-javascript',
  js: 'tree-sitter-javascript',
  bash: 'tree-sitter-bash',
  sh: 'tree-sitter-bash',
  shell: 'tree-sitter-bash',
  zsh: 'tree-sitter-bash',
};

let api = null; // the native highlight binding (null when disabled)
let parsers = null; // search_parsers() output, keyed by fence language
let theme = null;
let initialized = false; // guards one-time lazyInit

// Reverse a minimal subset of HTML entity encoding so tree-sitter sees real source.
// marked escapes `<`, `>`, `&`, `"`, and `'` inside code; we only need these reversed.
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&'); // must run last
}

function lazyInit(hexo) {
  if (initialized) return;
  initialized = true;

  const cfg =
    hexo.config.highlight && typeof hexo.config.highlight === 'object'
      ? hexo.config.highlight
      : {};
  if (cfg.enable === false) {
    api = null; // disabled; never load the addon
    return;
  }

  api = require('nodejs-tree-sitter-highlight');
  theme = cfg.theme;

  const langMap = Object.assign({}, DEFAULT_LANG_MAP, cfg.languages || {});

  // Build the registry keyed by fence language. Require each package once.
  const requested = {};
  const loaded = {};
  for (const [fenceLang, pkgName] of Object.entries(langMap)) {
    if (loaded[pkgName]) {
      requested[fenceLang] = loaded[pkgName];
      continue;
    }
    try {
      const mod = require(pkgName);
      loaded[pkgName] = mod;
      requested[fenceLang] = mod;
    } catch (e) {
      hexo.log.warn(`[tree-sitter-highlight] skipped grammar "${pkgName}": ${e.message}`);
    }
  }

  if (Object.keys(requested).length === 0) {
    hexo.log.warn('[tree-sitter-highlight] no grammar packages available; leaving code blocks untouched');
    api = null;
    return;
  }

  parsers = api.search_parsers(requested);
}

function highlightBlock(lang, escapedCode) {
  const key = lang.toLowerCase();
  if (!parsers[key]) return null; // unsupported language -> caller keeps original

  const source = decodeEntities(escapedCode).replace(/\n$/, '');
  try {
    return api.highlight({
      source,
      language: key,
      parsers,
      theme,
      format: 'html',
      layout: 'fragment',
      style: 'inline',
    });
  } catch (e) {
    return null; // highlight failed -> caller keeps original
  }
}

// Match `<pre><code ...>…</code></pre>`. Capture group 1 is the full opening `<code …>`
// tag (so we can read its `language-XXX` class); group 2 is the (entity-encoded) body.
const CODE_BLOCK_RE =
  /<pre>(<code[^>]*>)([\s\S]*?)<\/code><\/pre>/g;
const LANG_RE = /\blanguage-([\w+#.-]+)/;

function hexoTreeSitter() {
  hexo.extend.filter.register('after_render:html', function(str, data) {
    lazyInit(this);

    if (!api || !parsers) return str;

    return str.replace(CODE_BLOCK_RE, (whole, openTag, escapedCode) => {
      const langMatch = LANG_RE.exec(openTag);
      if (!langMatch) return whole; // no language -> leave as-is (plain <pre>)
      const highlighted = highlightBlock(langMatch[1], escapedCode);
      return highlighted == null ? whole : highlighted + '\n';
    });
  });
}
module.exports = hexoTreeSitter;

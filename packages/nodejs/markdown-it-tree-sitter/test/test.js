'use strict';

// Smoke test for the markdown-it tree-sitter plugin.
//
// Run with: node test/test.js  (from the package root, after `npm install`).

const assert = require('assert');
const MarkdownIt = require('markdown-it');
const plugin = require('../index.js');

function render(mdSource, options) {
  const md = new MarkdownIt();
  md.use(plugin, options || {});
  return md.render(mdSource);
}

let passed = 0;
function check(name, cond) {
  assert.ok(cond, `FAILED: ${name}`);
  console.log(`ok - ${name}`);
  passed++;
}

// 1. A discovered grammar (tree-sitter-javascript) is highlighted with inline styles.
const jsOut = render('```javascript\nconst x = 1;\n```\n');
check('javascript fence is highlighted (has <span style)', jsOut.includes('<span style'));
check('javascript fence keeps the highlight wrapper', jsOut.includes('class="highlight"'));
check('javascript code text survives', jsOut.includes('const x'));

// 2. A discovered grammar (tree-sitter-bash) works too.
const bashOut = render('```bash\necho hello\n```\n');
check('bash fence is highlighted', bashOut.includes('<span style'));

// 3. An unsupported language falls back to default rendering (no crash, no spans).
const unknownOut = render('```brainfuck\n+++[>]<-\n```\n');
check('unsupported language falls back to <pre><code', unknownOut.includes('<pre><code'));
check('unsupported language is NOT highlighted', !unknownOut.includes('class="highlight"'));

// 4. A fence with no language renders as plain code (no crash).
const noLangOut = render('```\nplain text\n```\n');
check('no-language fence renders as <pre><code', noLangOut.includes('<pre><code'));

// 5. basedir can point at a directory whose node_modules holds the grammars.
const explicitOut = render('```javascript\nlet y = 2\n```\n', { basedir: __dirname });
check('explicit basedir still highlights', explicitOut.includes('<span style'));

// 6. layout/style options are forwarded to highlight().
const docOut = render('```javascript\nconst z = 3\n```\n', { layout: 'document', style: 'classes' });
check('document+classes layout honors style', docOut.includes('class=') && docOut.includes('<html'));

console.log(`\n${passed} checks passed.`);

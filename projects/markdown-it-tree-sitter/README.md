# markdown-it-tree-sitter

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin that highlights
fenced code blocks with [tree-sitter-highlight](https://github.com/tree-sitter/tree-sitter)
(via the [`nodejs-tree-sitter-highlight`](https://github.com/tree-sitter/tree-sitter) binding).

Unlike highlighters that ship a fixed set of languages, this plugin **auto-discovers**
whatever [`tree-sitter-*`](https://www.npmjs.com/search?q=tree-sitter-) grammar packages
are installed in your project's `node_modules` and uses them — no manual language
registration required.

## Install

```sh
npm install markdown-it-tree-sitter markdown-it
# then add the grammars you need:
npm install tree-sitter-javascript tree-sitter-python tree-sitter-bash
```

## Usage

```js
const MarkdownIt = require('markdown-it');
const markdownItTreeSitter = require('markdown-it-tree-sitter');

const md = new MarkdownIt().use(markdownItTreeSitter);

md.render('```javascript\nconst x = 1;\n```\n');
// -> <div class="highlight"><pre><code>...<span style='color: #...'>const</span>...</code></pre></div>
```

Hexo uses:

`_config.yml`:

```yaml
# disable builtin highlighter
syntax_highlighter:
```

`script/tree-sitter.js`:

```javascript
const hexoTreeSitter = require('markdown-it-tree-sitter.hexo');
hexoTreeSitter()
```

### How language resolution works

On load the plugin scans `<basedir>/node_modules` for every directory named `tree-sitter-*`
(or `@scope/tree-sitter-*`), `require`s each one, and hands them to
`search_parsers()` to build the parser registry. The registry is keyed by the grammar name
with the `tree-sitter-` (and scope) prefix stripped — so the package `tree-sitter-javascript`
registers the key `javascript`, and a fence written as ```` ```javascript ```` is highlighted
with it. A fence whose language has no matching installed grammar is left to markdown-it's
default renderer, so no code block is ever dropped.

## Options

| option    | type                                            | default           | description                                                                 |
| --------- | ----------------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `basedir` | `string`                                        | `process.cwd()`   | Directory whose `node_modules` is scanned for `tree-sitter-*` grammars.      |
| `theme`   | `Record<string, {color, bold, ...}>`            | default theme     | Highlight theme mapping scope names to colors / styles.                      |
| `layout`  | `'fragment' \| 'document' \| 'line-numbers'`     | `'fragment'`      | Structure emitted around the highlighted code.                              |
| `style`   | `'inline' \| 'classes' \| 'minimal'`            | `'inline'`        | How token colors are applied (`inline` = self-contained `style='...'` spans). |

## License

MIT

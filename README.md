# tree-sitter-highlight

Language bindings for [tree-sitter-highlight](https://crates.io/crates/tree-sitter-highlight).

## Lua

```lua
local highlight = require "tree_sitter_highlight".highlight
local search_parsers = require "tree_sitter_highlight".search_parsers
local parsers = search_parsers {
    "/usr/lib/nvim",
    "/usr/share/nvim/runtime",
}
local code = highlight {
    file = "/home/user/.config/nvim/init.vim",
    source = nil,
    language = "vim",
    parsers = parsers,
    theme = { variable = { color = "#F8F8F2" } },
    format = "terminal",
    layout = "document",
    style = "classes",
    prefix = "TS",
    math_escape = {"comment", "string"},
}
```

### [ldoc](https://github.com/lunarmodules/ldoc/)

`config.ld`:

```lua
pretty = 'lxsh'
```

```sh
luarocks install ldoc
luarocks install texcat
luarocks install tree-sitter-XXX
ldoc .
```

[An example](https://texrocks.readthedocs.io/).

### [texlua](https://www.luatex.org/)

See [texcat](https://texrocks.readthedocs.io/en/latest/topics/texcat.md.html).

## Python

```python
import tree_sitter_bash
import tree_sitter_python
from tree_sitter_highlight import highlight, search_parsers


parsers = search_parsers(
    tree_sitter_python,
    # same as:
    # python=tree_sitter_python,
    sh = tree_sitter_bash,
)
code = highlight(
    file = "/home/user/.bashrc",
    source = nil,
    language = "sh",
    parsers = parsers,
    theme = {"variable": {"color": "#F8F8F2"}},
    format = "terminal",
    layout = "document",
    style = "classes",
    prefix = "TS",
    math_escape = ["comment", "string"],
)
```

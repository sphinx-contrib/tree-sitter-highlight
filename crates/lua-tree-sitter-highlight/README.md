# Lua binding

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

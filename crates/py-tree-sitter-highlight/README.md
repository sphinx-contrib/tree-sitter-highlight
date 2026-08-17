# Python binding

```python
import tree_sitter_bash
import tree_sitter_python
from tree_sitter_highlight import highlight, search_parsers


parsers = search_parsers(
    tree_sitter_python,
    # NOTE: same as
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

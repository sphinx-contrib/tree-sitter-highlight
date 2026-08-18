# sphinxcontrib-tree-sitter

Use tree-sitter to highlight code blocks.

## Usage

### CLI

```sh
python -m sphinxcontrib.tree_sitter /the/path/of/a/file
```

### sphinx

`docs/conf.py`:

```python
extensions = [
    "sphinxcontrib.tree_sitter",
]
```

`pyproject.toml`:

```toml
# ...
[project.optional-dependencies]
dev = [
  "sphinx",
  "tree-sitter-XXX",
]
```

```bash
uv sync
source .venv/bin/activate
sphinx-build docs _readthedocs/html
xdg-open _readthedocs/html/index.html
```

### markdown-it-py

```python
from markdown_it import MarkdownIt
from sphinxcontrib.tree_sitter.mdit_py_plugin import tree_sitter_plugin

md = MarkdownIt("commonmark", {"html": True}).use(tree_sitter_plugin)
code = md.render("""
```python
def f():
    print("Hello")
```
""")
```

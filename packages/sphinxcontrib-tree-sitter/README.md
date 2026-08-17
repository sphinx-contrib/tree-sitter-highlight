# sphinxcontrib-tree-sitter

Use tree-sitter to highlight code blocks in Sphinx.

## Usage

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

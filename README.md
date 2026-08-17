# tree-sitter-highlight

This project provides:

- Language bindings for [tree-sitter-highlight](https://crates.io/crates/tree-sitter-highlight).
  - [python](crates/py-tree-sitter-highlight)
  - [lua](crates/lua-tree-sitter-highlight)
- Some packages to use tree-sitter to highlight
  - [sphinx](https://github.com/sphinx-doc/sphinx):
    [sphinxcontrib-tree-sitter](packages/sphinxcontrib-tree-sitter)
  - [ldoc](https://github.com/lunarmodules/ldoc):
    [texcat](https://texrocks.readthedocs.io/en/latest/topics/texcat.md.html)
  - [LaTeX](https://www.latex-project.org/): also
    [texcat](https://texrocks.readthedocs.io/en/latest/topics/texcat.md.html)
  - [jekyll](https://github.com/jekyll/jekyll): TODO
  - [pandoc](http://github.com/pandoc/pandoc): TODO
  - [typst](https://github.com/typst/typst): TODO

## Bench

<!-- markdownlint-disable MD013 -->

```bash
$ hyperfine -Nw10 'python -m sphinxcontrib.tree_sitter pyproject.toml' 'texcat pyproject.toml' 'tree-sitter highlight pyproject.toml' 'pygmentize pyproject.toml' 'bat pyproject.toml'
Benchmark 1: python -m sphinxcontrib.tree_sitter pyproject.toml
  Time (mean ± σ):     367.2 ms ±  25.7 ms    [User: 307.1 ms, System: 51.4 ms]
  Range (min … max):   345.6 ms … 414.5 ms    10 runs

Benchmark 2: texcat pyproject.toml
  Time (mean ± σ):      70.3 ms ±   3.0 ms    [User: 61.0 ms, System: 8.3 ms]
  Range (min … max):    67.2 ms …  81.6 ms    42 runs

Benchmark 3: tree-sitter highlight pyproject.toml
  Time (mean ± σ):       5.8 ms ±   0.3 ms    [User: 2.6 ms, System: 2.9 ms]
  Range (min … max):     5.2 ms …   8.1 ms    531 runs

Benchmark 4: pygmentize pyproject.toml
  Time (mean ± σ):     250.5 ms ±  13.3 ms    [User: 221.1 ms, System: 24.3 ms]
  Range (min … max):   238.9 ms … 274.7 ms    10 runs

Benchmark 5: bat pyproject.toml
  Time (mean ± σ):      15.0 ms ±   3.4 ms    [User: 11.8 ms, System: 6.6 ms]
  Range (min … max):    11.7 ms …  29.4 ms    252 runs

Summary
  tree-sitter highlight pyproject.toml ran
    2.60 ± 0.60 times faster than bat pyproject.toml
   12.20 ± 0.86 times faster than texcat pyproject.toml
   43.47 ± 3.35 times faster than pygmentize pyproject.toml
   63.73 ± 5.71 times faster than python -m sphinxcontrib.tree_sitter pyproject.toml
```

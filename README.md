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
  - [pandoc](http://github.com/pandoc/pandoc): also
    [texcat](https://texrocks.readthedocs.io/en/latest/topics/texcat.md.html)
  - [jekyll](https://github.com/jekyll/jekyll): TODO
  - [typst](https://github.com/typst/typst): TODO

## Bench

<!-- markdownlint-disable MD013 -->

```bash
$ hyperfine -Nw10 'python -m sphinxcontrib.tree_sitter pyproject.toml' 'texcat pyproject.toml' 'tree-sitter highlight pyproject.toml' 'pygmentize pyproject.toml' 'bat pyproject.toml'
Benchmark 1: python -m sphinxcontrib.tree_sitter pyproject.toml
  Time (mean ± σ):     397.4 ms ±  64.9 ms    [User: 338.5 ms, System: 50.8 ms]
  Range (min … max):   335.9 ms … 503.8 ms    10 runs

Benchmark 2: texcat pyproject.toml
  Time (mean ± σ):      1.782 s ±  0.041 s    [User: 1.174 s, System: 0.600 s]
  Range (min … max):    1.746 s …  1.884 s    10 runs

Benchmark 3: tree-sitter highlight pyproject.toml
  Time (mean ± σ):       6.2 ms ±   0.4 ms    [User: 2.7 ms, System: 3.1 ms]
  Range (min … max):     5.5 ms …   8.3 ms    394 runs

Benchmark 4: pygmentize pyproject.toml
  Time (mean ± σ):     262.4 ms ±   2.6 ms    [User: 236.6 ms, System: 23.0 ms]
  Range (min … max):   258.9 ms … 268.5 ms    11 runs

Benchmark 5: bat pyproject.toml
  Time (mean ± σ):      12.6 ms ±   0.6 ms    [User: 10.4 ms, System: 5.7 ms]
  Range (min … max):    11.6 ms …  14.9 ms    223 runs

Summary
  tree-sitter highlight pyproject.toml ran
    2.04 ± 0.17 times faster than bat pyproject.toml
   42.38 ± 2.87 times faster than pygmentize pyproject.toml
   64.18 ± 11.32 times faster than python -m sphinxcontrib.tree_sitter pyproject.toml
  287.79 ± 20.36 times faster than texcat pyproject.toml
```

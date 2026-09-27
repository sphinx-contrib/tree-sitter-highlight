# tree-sitter-highlight

This project provides:

- Language bindings for [tree-sitter-highlight](https://crates.io/crates/tree-sitter-highlight).
  - [python](crates/py-tree-sitter-highlight)
  - [lua](crates/lua-tree-sitter-highlight)
  - [nodejs](crates/nodejs-tree-sitter-highlight)
- Some packages to use tree-sitter to highlight
  - python:
    - [sphinx](https://github.com/sphinx-doc/sphinx):
      [sphinxcontrib-tree-sitter](packages/python/sphinxcontrib-tree-sitter)
  - lua:
    - [ldoc](https://github.com/lunarmodules/ldoc):
      [texcat](packages/lua/texcat)
    - [LaTeX](https://www.latex-project.org/):
      [texcat](packages/lua/texcat)
    - [pandoc](http://github.com/pandoc/pandoc):
      [pancat](packages/lua/pancat)
  - nodejs:
    - [hexo](https://github.com/hexojs/hexo):
      [markdown-it-tree-sitter](packages/nodejs/markdown-it-tree-sitter)
  - ruby:
    - [jekyll](https://github.com/jekyll/jekyll): TODO
  - [typst](https://github.com/typst/typst): TODO

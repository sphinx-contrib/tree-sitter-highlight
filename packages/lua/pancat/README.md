# pancat

Lua must be same version as pandoc. So you must:

```bash
lx --lua-version=$PANDOC_LUA_VERSION add texcat
lx --lua-version=$PANDOC_LUA_VERSION shell
```

or:

```bash
luarocks --lua-version=$PANDOC_LUA_VERSION install texcat
eval $(luarocks --lua-version=$PANDOC_LUA_VERSION path)
```

For a markdown:

``````markdown
```python
def f():
    print("hello")
```
``````

```bash
pancat test.md
```

You can get LaTeX preamble for pandoc template:

```bash
texcat --format=latex --theme=monokai --style=minimal --language=python
```

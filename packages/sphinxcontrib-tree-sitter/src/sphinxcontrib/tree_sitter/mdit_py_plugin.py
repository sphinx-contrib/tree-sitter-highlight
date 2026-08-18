import re
from typing import Any

from pygments.styles import get_style_by_name
from tree_sitter_highlight import highlight

_PRE_RE = re.compile(r"<pre>.*?</pre>", re.S)
_THEME_ATTR_RE = re.compile(r"""tree_sitter\.theme\s*=\s*["']([^"']+)["']""")


def tree_sitter_plugin(md: Any, **options: Any) -> None:
    r"""Use ``tree_sitter_highlight`` to highlight fenced code blocks.

    Install it with::

        from sphinxcontrib.tree_sitter.mdit_py_plugin import (
            tree_sitter_plugin,
        )

        md = MarkdownIt().use(tree_sitter_plugin)

    The plugin replaces ``md.options["highlight"]`` so that every fenced
    code block whose language matches a discovered ``tree_sitter_*`` grammar
    is rendered by :func:`tree_sitter_highlight.highlight`. The discovered
    grammars come from :meth:`TreeSitterBridge.get_parsers`, including its
    query predicate rewriting.

    A per-block theme can be requested in the fence info string, e.g.::

        ```python tree_sitter.theme="monokai"
        def f(): ...
        ```

    which overrides the plugin-level default passed to ``.use`` (itself
    defaulting to ``None``, i.e. the host tree-sitter config theme).
    """
    from .highlighting import TreeSitterBridge

    parsers = TreeSitterBridge.get_parsers()
    default_theme = options.get("theme")

    def highlight_fn(
        source: str, lang_name: str, lang_attrs: str
    ) -> str | None:
        if not lang_name or lang_name not in parsers:
            return None

        theme = default_theme
        if lang_attrs and (m := _THEME_ATTR_RE.search(lang_attrs)):
            style = get_style_by_name(m.group(1))
            theme = TreeSitterBridge.get_theme(style)

        out = highlight(
            source=source,
            language=lang_name,
            theme=theme,
            parsers=parsers,
            format="html",
            layout="fragment",
            style="inline",
        )
        m = _PRE_RE.search(out)
        return m.group(0) if m else None

    md.options["highlight"] = highlight_fn

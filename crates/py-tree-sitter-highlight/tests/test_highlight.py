r"""Test highlight."""

import tree_sitter_python
from tree_sitter_highlight import highlight, search_parsers


class Test:
    r"""Test."""

    @staticmethod
    def test_highlight() -> None:
        parsers = search_parsers(tree_sitter_python)
        assert isinstance(
            parsers["python"]["language"], type(tree_sitter_python.language())
        )
        code = highlight(
            file=__file__,
            language="python",
            parsers=parsers,
            theme={"variable": {"color": "#F8F8F2"}},
            format="html",
            layout="fragment",
            style="classes",
        )
        assert "<span class='variable'>" in code

from markdown_it import MarkdownIt
from sphinxcontrib.tree_sitter.mdit_py_plugin import tree_sitter_plugin


def _md() -> MarkdownIt:
    return MarkdownIt("commonmark", {"breaks": True, "html": True}).use(
        tree_sitter_plugin
    )


class TestMditPlugin:
    def test_highlights_known_language(self) -> None:
        html = _md().render(
            "```python\ndef f:\n    print('Hello, World!')\n```\n"
        )
        assert html.startswith("<pre>")
        assert "<span" in html
        # colors applied inline
        assert "style=" in html
        # returned verbatim, no double <pre> wrapping
        assert html.count("<pre>") == 1

    def test_per_block_theme(self) -> None:
        html = _md().render(
            '```python tree_sitter.theme="monokai"\n'
            "def f:\n"
            "    print(x)\n"
            "```\n"
        )
        assert html.startswith("<pre>")
        assert "<span" in html

    def test_unknown_language_falls_back(self) -> None:
        html = _md().render("```unknowndef\ndef f\n```\n")
        assert "<pre><code" in html
        assert 'class="language-unknowndef"' in html

    def test_plain_code_block(self) -> None:
        html = _md().render("```\nplain\n```\n")
        assert "<pre><code" in html

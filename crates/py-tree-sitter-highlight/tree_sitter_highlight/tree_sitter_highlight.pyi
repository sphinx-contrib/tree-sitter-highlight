from __future__ import annotations

import sys
from typing import Any, Literal, TypedDict

if sys.version_info >= (3, 11):
    from typing import NotRequired
else:
    from typing_extensions import NotRequired

# An imported ``tree_sitter_*`` grammar package module object, e.g.
# ``import tree_sitter_bash``. The package exposes a ``language()`` function
# returning a pointer (as an ``int``) plus on-disk query files; this binding
# reads both.
GrammarModule = Any

HighlightFormat = Literal["terminal", "html", "latex"]
Layout = Literal["document", "line-numbers", "fragment"]
Style = Literal["classes", "inline", "minimal"]

__all__ = ["search_parsers", "highlight"]


class ParserEntry(TypedDict):
    """The per-language entry stored in the ``parsers`` mapping."""

    language: int
    """The grammar's ``language()`` value — the raw ``TSLanguage*`` address."""

    highlights: str
    """The text of the language's ``highlights.scm`` query."""

    injections: str
    """The text of the language's ``injections.scm`` query (may be empty)."""

    locals: str
    """The text of the language's ``locals.scm`` query (may be empty)."""


# Mapping of language name -> ParserEntry.
Parsers = dict[str, ParserEntry]

# A theme mapping highlight scope names to ``{color, bold, italic, ...}``.
Theme = dict[str, Any]


def search_parsers(
    *modules: GrammarModule,
    **named_modules: GrammarModule,
) -> Parsers:
    """Discover tree-sitter grammars and collect their queries.

    Each positional argument is an imported ``tree_sitter_*`` grammar module;
    the language name is derived by stripping the ``tree_sitter_`` prefix from
    the module's ``__name__``. Each keyword argument maps an explicit language
    name to its grammar module.

    Returns a :data:`Parsers` mapping where each value's ``language`` is the
    grammar's ``language()`` value (the raw ``TSLanguage*`` pointer address) and
    the three query strings are read from the package's ``queries/`` directory
    (falling back to the ``HIGHLIGHTS_QUERY`` / ``INJECTIONS_QUERY`` /
    ``LOCALS_QUERY`` module attributes).
    """


def highlight(
    *,
    source: str | None = None,
    file: str | None = None,
    language: str,
    parsers: Parsers,
    theme: Theme | None = None,
    format: HighlightFormat = "terminal",
    layout: Layout = "document",
    style: Style = "classes",
    prefix: str = "TS",
    math_escape: list[str] | None = None,
) -> str:
    """Syntax-highlight ``source`` (or the file at ``file``) and return markup.

    ``source`` is the literal text to highlight; when omitted, ``file`` is read
    instead (``file == "-"`` reads from standard input). ``language`` selects
    the top-level language from ``parsers``. ``parsers`` uses the same shape as
    :func:`search_parsers`'s return value. ``theme`` defaults to the host
    tree-sitter ``config.json`` theme when omitted. ``format`` selects the
    output backend (``terminal`` / ``html`` / ``latex``), ``layout`` and
    ``style`` are ignored for ``terminal``, and ``math_escape`` lists scope
    names whose contents use LaTeX math-mode escaping.
    """

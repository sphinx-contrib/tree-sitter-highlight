r"""This module can be called by
`python -m <https://docs.python.org/3/library/__main__.html>`_.
"""

from argparse import ArgumentParser

from pygments.styles import STYLE_MAP, get_style_by_name
from tree_sitter_highlight import highlight

from . import __version__
from .highlighting import TreeSitterBridge


def get_parser(parsers) -> ArgumentParser:
    r"""Get a parser for unit test."""
    parser = ArgumentParser()
    parser.add_argument("--version", version=__version__, action="version")

    parser.add_argument("files", nargs="*", help="file name")
    parser.add_argument(
        "--language",
        choices=parsers,
        help="set language",
    )
    parser.add_argument(
        "--theme",
        choices=STYLE_MAP,
        help="set theme",
    )
    parser.add_argument(
        "--format",
        default="terminal",
        choices=["latex", "html", "terminal"],
        help="output format (default: terminal)",
    )
    parser.add_argument(
        "--layout",
        default="document",
        choices=["fragment", "document", "line-numbers"],
        help="layout (default: document)",
    )
    parser.add_argument(
        "--style",
        default="classes",
        choices=["minimal", "classes", "inline"],
        help="style (default: classes)",
    )
    parser.add_argument(
        "--prefix", default="TS", help="command prefix for TeX (default: TS)"
    )
    parser.add_argument(
        "--math-escape",
        nargs="*",
        default=[],
        help="the scope to escape $math TeX code$",
    )
    parser.add_argument(
        "--injections",
        nargs="*",
        default=[],
        help="injection languages, all means all",
    )
    return parser


def main() -> None:
    r"""Parse arguments and provide shell completions."""
    parsers = TreeSitterBridge.get_parsers()
    parser = get_parser(parsers)
    args = parser.parse_args()

    from identify import identify

    theme = None
    if args.theme:
        style = get_style_by_name(args.theme)
        theme = TreeSitterBridge.get_theme(style)
    for file in args.files:
        language = args.language
        if language is None:
            tags = identify.tags_from_path(file)
            for tag in tags:
                if tag in parsers:
                    language = tag
                    break
            if language is None:
                language = "text"
        if language == "text":
            with open(file) as f:
                text = f.read()
            print(text)
        elif language in parsers:
            hlsource = highlight(
                file=file,
                language=language,
                parsers=parsers,
                theme=theme,
                layout=args.layout,
                style=args.style,
                prefix=args.prefix,
                math_escape=args.math_escape,
            )
            print(hlsource)
        else:
            print(f"No parser found for {language}")


if __name__ == "__main__":
    main()

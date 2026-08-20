import pkgutil
import re
from typing import Any

from pygments import highlight as pygmentize
from pygments.style import Style
from pygments.token import (
    Comment,
    Error,
    Generic,
    Keyword,
    Name,
    Number,
    Operator,
    String,
    Whitespace,
    _TokenType,
)
from sphinx.highlighting import PygmentsBridge
from sphinx.util import texescape
from tree_sitter_highlight import highlight, search_parsers


class TreeSitterBridge(PygmentsBridge):
    """A bridge for using Tree-sitter for syntax highlighting in Sphinx."""

    languages: list[str] = ["default"]
    scopes: dict[str, _TokenType | dict] = {
        "whitespace": Whitespace,
        "comment": Comment,
        "comment.error": Generic.Error,
        "comment.note": Comment.Preproc,
        "comment.todo": Comment.Special,
        "keyword": Keyword,
        "type": Keyword.Type,
        "keyword.pseudo": Keyword.Pseudo,
        "operator": Operator,
        "operator.special": Operator.Word,
        "variable.builtin": Name.Builtin,
        "function": Name.Function,
        "class": Name.Class,
        "namespace": Name.Namespace,
        "variable.special": Name.Exception,
        "variable": Name.Variable,
        "constant": Name.Constant,
        "label": Name.Label,
        "entity": Name.Entity,
        "property": Name.Attribute,
        "tag": Name.Tag,
        "function.special": Name.Decorator,
        "string": String,
        "string.doc": String.Doc,
        "string.interpol": String.Interpol,
        "string.escape": String.Escape,
        "string.special": String.Regex,
        "symbol": String.Symbol,
        "string.other": String.Other,
        "number": Number,
        "markup.heading": Generic.Heading,
        "markup.strikethrough": Generic.Subheading,
        "markup.deleted": Generic.Deleted,
        "markup.inserted": Generic.Inserted,
        "markup.italic": Generic.Emph,
        "markup.bold": Generic.Strong,
        "markup.underline": Generic.EmphStrong,
        "markup.quote": Generic.Prompt,
        "markup.inline": Generic.Output,
        "markup.list": Generic.Traceback,
        "error": Error,
    }

    @classmethod
    def from_bride(cls, bridge: PygmentsBridge) -> "TreeSitterBridge":
        """Create a TreeSitterBridge from an existing PygmentsBridge."""
        return cls(
            bridge.dest,
            bridge.formatter_args.get("style", "sphinx"),
            bridge.latex_engine,
        )

    @staticmethod
    def get_parsers() -> dict[str, Any]:
        modules = [
            __import__(name)
            for _, name, _ in pkgutil.iter_modules()
            if name.startswith("tree_sitter_")
        ]
        parsers = search_parsers(*modules)
        for parser in parsers.values():
            for name, query in parser.items():
                if not isinstance(query, str):
                    continue
                query = re.sub(r"#set!\s+@\S+", "#set! ", query)
                query = query.replace("@spell", "").replace("@nospell", "")

                query = query.replace("#any-eq", "#any-of")
                query = query.replace("#not-any-eq", "#not-any-of")

                query = re.sub(r"#has[^?]+", "#any-of", query)
                query = re.sub(r"#not-has[^?]+", "#not-any-of", query)

                query = query.replace("#match", "#any-of")
                query = query.replace("#not-match", "#not-any-of")

                query = re.sub(r"#vim[^?]+", "#any-of", query)
                query = re.sub(r"#not-vim[^?]+", "#not-any-of", query)
                query = re.sub(r"#any-vim[^?]+", "#any-of", query)
                query = re.sub(r"#not-any-vim[^?]+", "#not-any-of", query)

                query = re.sub(r"#lua[^?]+", "#any-of", query)
                query = re.sub(r"#not-lua[^?]+", "#not-any-of", query)
                query = re.sub(r"#any-lua[^?]+", "#any-of", query)
                query = re.sub(r"#not-any-lua[^?]+", "#not-any-of", query)
                parser[name] = query  # ty:ignore[invalid-key]
        return parsers

    @classmethod
    def get_theme(cls, style: "Style") -> dict[str, Any]:
        r"""Tree sitter doesn't support background and border colors."""
        theme = {}
        for scope, token_type in cls.scopes.items():
            if not isinstance(token_type, _TokenType):
                theme[scope] = token_type
                continue
            values = style.styles.get(token_type)
            if values is None:
                continue
            datum = {}
            for value in values.split():
                if value.startswith("bg:"):
                    continue
                if value.startswith("#"):
                    if len(value) < 7:
                        value = "#" + "".join([c * 2 for c in value[1:]])
                    datum["color"] = value
                bool_value = True
                if value.startswith("no"):
                    value = value[2:]
                    bool_value = False
                if value in ("bold", "italic", "underline"):
                    datum[value] = bool_value
            theme[scope] = datum
        return theme

    def highlight_block(
        self,
        source: str,
        lang: str,
        opts: dict[str, Any] | None = None,
        force: bool = False,
        location: Any = None,
        **kwargs: Any,
    ) -> str:
        format: str = self.dest
        prefix: str = self.formatter_args.get("commandprefix", "TS")
        style: Style = self.formatter_args["style"]
        theme = TreeSitterBridge.get_theme(style)
        parsers = TreeSitterBridge.get_parsers()
        if lang in parsers:
            hlsource = highlight(
                source=source,
                language=lang,
                parsers=parsers,
                theme=theme,
                format=format,  # ty:ignore[invalid-argument-type]
                layout="fragment",
                style="inline" if format == "html" else "classes",
                prefix=prefix,
                math_escape=[],
            )
        else:
            if lang not in TreeSitterBridge.languages:
                TreeSitterBridge.languages += [lang]
                print(f"tree sitter parser for language '{lang}' not found.")
            lexer = self.get_lexer(source, "none", opts, force, location)
            formatter = self.get_formatter(**kwargs)
            hlsource = pygmentize(source, lexer, formatter)
        if format != "html":
            hlsource = texescape.hlescape(hlsource, self.latex_engine)
        return hlsource

    def get_stylesheet(self) -> str:
        if self.dest == "html":
            return ""
        parsers = TreeSitterBridge.get_parsers()
        if parsers == {}:
            return ""
        language = "python" if "python" in parsers else next(iter(parsers))
        format: str = self.dest
        prefix: str = self.formatter_args.get("commandprefix", "TS")
        style: Style = self.formatter_args["style"]
        theme = TreeSitterBridge.get_theme(style)
        hlsource = highlight(
            source="",
            language=language,
            parsers=parsers,
            theme=theme,
            format=format,  # ty:ignore[invalid-argument-type]
            layout="fragment",
            style="minimal",
            prefix=prefix,
            math_escape=[],
        )
        return hlsource

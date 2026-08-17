from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sphinx.application import Sphinx

__version__ = "0.0.1"


def setup(_: "Sphinx") -> dict[str, str | bool]:
    from sphinx.highlighting import PygmentsBridge

    from .highlighting import TreeSitterBridge

    PygmentsBridge.highlight_block = TreeSitterBridge.highlight_block  # ty:ignore[invalid-assignment]
    PygmentsBridge.get_stylesheet = TreeSitterBridge.get_stylesheet  # ty:ignore[invalid-assignment]

    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }

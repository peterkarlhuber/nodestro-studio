"""Nodestro Studio: the graphical application of Nodestro and its local start (``nodestro``).

The studio ships the built interface (React, React Flow, Midnight Citron design), the user
documentation the interface and the Nodestro Assistant read, and the command ``nodestro``
that starts the complete local application: the HTTP API of ``nodestro-api`` (which runs
workflows with ``nodestro-runtime``) with the interface on one port.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("nodestro")
except PackageNotFoundError:  # pragma: no cover - running from a source checkout
    __version__ = "0.0.0"

__all__ = ["__version__"]

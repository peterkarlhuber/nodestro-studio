"""The complete local application: the Nodestro API plus the built interface and its documentation.

:func:`create_app` builds the API of ``nodestro-api`` with this package's documentation
(read by the Nodestro Assistant) and serves the built interface for every path that is not
an API route. The interface talks to the API only over HTTP (``/api``).
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
import logging
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from nodestro_api.app import create_app as create_api
from nodestro_api.context import AppConfig
from nodestro_runtime.extensions import Integration

_PACKAGE = Path(__file__).resolve().parent
#: The built interface (``npm run build`` writes it here; the wheel contains it).
STATIC_DIR = _PACKAGE / "static"


def docs_dir() -> Path | None:
    """The documentation chapters: inside the installed package, or ``frontend/src/docs/chapters`` of a checkout."""
    for candidate in (_PACKAGE / "docs", _PACKAGE.parents[1] / "frontend" / "src" / "docs" / "chapters"):
        if (candidate / "en").is_dir():
            return candidate
    return None


def studio_config(data_dir: Path | None = None) -> AppConfig:
    """The API configuration with the studio's interface and documentation (environment variables win)."""
    config = AppConfig.from_env()
    if data_dir is not None:
        config.data_dir = data_dir
    if config.static_dir is None and (STATIC_DIR / "index.html").is_file():
        config.static_dir = STATIC_DIR
    if config.docs_dir is None and not os.environ.get("NODESTRO_DOCS_DIR"):
        config.docs_dir = docs_dir()
    return config


def create_app(
    config: AppConfig | None = None,
    *,
    client_factory: Callable[[str], Any] | None = None,
    python_runner: Any | None = None,
    ocr_runner: Any | None = None,
    integrations: Iterable[Integration] | None = None,
    scheduler: bool = True,
) -> FastAPI:
    """The API with the interface; the arguments are the ones of :func:`nodestro_api.app.create_app`."""
    config = config or studio_config()
    if config.docs_dir is None:
        config.docs_dir = docs_dir()
    app = create_api(
        config,
        client_factory=client_factory,
        python_runner=python_runner,
        ocr_runner=ocr_runner,
        integrations=integrations,
        scheduler=scheduler,
    )
    if config.static_dir is not None and (config.static_dir / "index.html").is_file():
        _mount_frontend(app, config.static_dir)
    else:
        logging.getLogger(__name__).info("No built frontend found; serving the API only")
    return app


def _mount_frontend(app: FastAPI, static_dir: Path) -> None:
    """Serve the single-page app: real files as they are, every other path as index.html."""
    assets = static_dir / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")
    index = static_dir / "index.html"

    @app.get("/{path:path}", include_in_schema=False)
    async def frontend(path: str) -> Any:
        if path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = (static_dir / path).resolve()
        if path and candidate.is_file() and static_dir.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(index)

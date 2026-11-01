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
from starlette.middleware.gzip import GZipMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Route, request_response
from starlette.types import ASGIApp, Scope

_PACKAGE = Path(__file__).resolve().parent
#: The built interface (``npm run build`` writes it here; the wheel contains it).
STATIC_DIR = _PACKAGE / "static"

#: The files under ``/assets`` carry a content hash in their names (Vite): a new build gives them new names.
CACHE_HASHED = "public, max-age=31536000, immutable"
#: ``index.html`` and the other files of the interface keep their names: the browser revalidates them (ETag).
CACHE_REVALIDATE = "no-cache"
#: Smaller responses are sent as they are; gzip would save a few bytes at the price of a compression round.
GZIP_MINIMUM_SIZE = 1024
#: Close to level 9 in size for the JavaScript bundle at a fraction of the CPU time (it is compressed per request).
GZIP_LEVEL = 6


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
    """Serve the single-page app: real files as they are, every other path as index.html.

    Only the interface's own responses are gzip-compressed and get Cache-Control headers; the API routes and
    their event streams (``text/event-stream``) are registered before and never pass through this code.
    """
    assets = static_dir / "assets"
    if assets.is_dir():
        app.mount("/assets", _compressed(_HashedAssets(directory=assets)), name="assets")
    index = static_dir / "index.html"

    async def frontend(request: Request) -> Response:
        path: str = request.path_params["path"]
        if path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = (static_dir / path).resolve()
        if path and candidate.is_file() and static_dir.resolve() in candidate.parents:
            return FileResponse(candidate, headers={"Cache-Control": CACHE_REVALIDATE})
        return FileResponse(index, headers={"Cache-Control": CACHE_REVALIDATE})

    # Last, after every API route; GET (and HEAD) only, as before.
    app.router.routes.append(
        Route(
            "/{path:path}",
            _compressed(request_response(frontend)),
            methods=["GET"],
            name="frontend",
            include_in_schema=False,
        )
    )


def _compressed(asgi: ASGIApp) -> ASGIApp:
    """``asgi`` with gzip for clients that accept it (text responses of at least :data:`GZIP_MINIMUM_SIZE`)."""
    return GZipMiddleware(asgi, minimum_size=GZIP_MINIMUM_SIZE, compresslevel=GZIP_LEVEL)


class _HashedAssets(StaticFiles):
    """The built ``assets`` directory, cached by browsers for a year (the file names change with the content)."""

    def file_response(
        self, full_path: str | os.PathLike[str], stat_result: os.stat_result, scope: Scope, status_code: int = 200
    ) -> Response:
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers.setdefault("Cache-Control", CACHE_HASHED)
        return response

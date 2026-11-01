"""Test helpers: the complete studio application with scripted model answers, never calling a provider."""

from __future__ import annotations

from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from nodestro_api.context import AppConfig
from nodestro_runtime.testing import ScriptedClient
import pytest

from nodestro_studio.app import create_app


@pytest.fixture
def make_app(tmp_path: Path) -> Iterator[Callable[..., TestClient]]:
    """``make_app(script)`` -> a TestClient of the studio whose agents answer from ``script``.

    ``static_dir``: a built interface to serve (none by default).
    """
    clients: list[TestClient] = []

    def factory(
        script: dict[str, list[Any]] | None = None, *, client: Any = None, static_dir: Path | None = None
    ) -> TestClient:
        client = client or ScriptedClient(script or {})
        app = create_app(
            AppConfig(data_dir=tmp_path / f"data{len(clients)}", static_dir=static_dir),
            client_factory=lambda _provider: client,
            integrations=[],
            scheduler=False,
        )
        test_client = TestClient(app, base_url="http://127.0.0.1")
        test_client.__enter__()
        test_client.fake = client  # type: ignore[attr-defined]
        clients.append(test_client)
        return test_client

    yield factory
    for test_client in clients:
        test_client.__exit__(None, None, None)

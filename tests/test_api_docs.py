"""The studio serves its interface for every path that is not an API route."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from nodestro_api.context import AppConfig

from nodestro_studio.app import create_app


def test_docs_path_serves_the_app_and_api_reference_lives_under_api(tmp_path: Path) -> None:
    static = tmp_path / "static"
    static.mkdir()
    (static / "index.html").write_text("<html>Nodestro</html>")
    app = create_app(AppConfig(data_dir=tmp_path / "data", static_dir=static))
    with TestClient(app) as client:
        assert client.get("/docs/workflows").text == "<html>Nodestro</html>"
        assert client.get("/docs").text == "<html>Nodestro</html>"
        assert client.get("/api/docs").status_code == 200
        assert client.get("/api/openapi.json").json()["info"]["title"] == "Nodestro"

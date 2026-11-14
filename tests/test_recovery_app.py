"""Recovery mode in the studio (TABRION MIG-NOD-9): the built interface is served, and nothing else of the API."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient
from nodestro_api.context import AppConfig
import pytest
from starlette.websockets import WebSocketDisconnect

from nodestro_studio.app import create_app

INDEX = "<!doctype html><html><body><div id='root'></div></body></html>\n"


@pytest.mark.skipif(os.name != "posix", reason="recovery mode needs POSIX permissions")
def test_the_recovery_app_serves_the_interface_and_only_the_repair(tmp_path: Path) -> None:
    data = tmp_path / "data"
    static = tmp_path / "static"
    static.mkdir()
    (static / "index.html").write_text(INDEX)
    with TestClient(
        create_app(AppConfig(data_dir=data), integrations=[], scheduler=False), base_url="http://127.0.0.1"
    ):
        pass  # creates the desktop database
    os.chmod(data / "nodestro.db", 0o664)  # other users may change it: the start is refused, recovery mode starts

    app = create_app(AppConfig(data_dir=data, static_dir=static), integrations=[], scheduler=False)
    with TestClient(app, base_url="http://127.0.0.1") as client:
        assert app.state.recovery is True
        assert client.get("/api/health").json() == {"status": "ok", "mode": "recovery"}
        page = client.get("/")
        assert page.status_code == 200 and "id='root'" in page.text
        assert "id='root'" in client.get("/settings/maintenance").text  # the interface's own routes
        assert client.get("/api/recovery/database-permissions").json()["origin"] == "refused"
        for path in ("/api/workflows", "/api/runs", "/api/diagnostics", "/api/settings", "/api/library"):
            answer = client.get(path)
            assert answer.status_code == 404 and "id='root'" not in answer.text, path
        assert '"openapi"' not in client.get("/openapi.json").text  # no API description either
        with pytest.raises(WebSocketDisconnect), client.websocket_connect("/api/events/ws") as socket:
            socket.receive_text()
    assert (data / "nodestro.db").stat().st_mode & 0o777 == 0o664  # serving never repairs

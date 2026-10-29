"""Nodestro 0.1 data opens unchanged in the split platform (tests/upgrade/legacy-0.1.zip).

The archive is the data directory of the last version before the split (15e2076), written by
tests/upgrade/make_legacy_data.py: settings, a workflow with two versions, a finished and a paused
run, an agent template, a copied example, a publication and an API key.
"""

from __future__ import annotations

from collections.abc import Iterator
import json
from pathlib import Path
import time
from typing import Any
import zipfile

from fastapi.testclient import TestClient
from nodestro_api.context import AppConfig
from nodestro_runtime.testing import ScriptedClient, text
import pytest

from nodestro_studio.app import create_app

ARCHIVE = Path(__file__).parent / "upgrade" / "legacy-0.1.zip"


def wait(client: TestClient, run_id: str, *states: str) -> dict[str, Any]:
    for _ in range(300):
        run = client.get(f"/api/runs/{run_id}").json()
        if run["status"] in states:
            return dict(run)
        time.sleep(0.05)
    raise AssertionError(f"run {run_id} did not reach {states}")


@pytest.fixture
def legacy(tmp_path: Path) -> Iterator[tuple[TestClient, dict[str, Any]]]:
    data = tmp_path / "nodestro"
    with zipfile.ZipFile(ARCHIVE) as archive:
        archive.extractall(data)
    facts = json.loads((data / "LEGACY.json").read_text(encoding="utf-8"))
    script = {
        "WRITER": [text("## Angebot\n\nNeu geschrieben.") for _ in range(10)],
        "REVIEWER": [text("Neu geprüft.") for _ in range(10)],
    }
    scripted = ScriptedClient(script)
    app = create_app(
        AppConfig(data_dir=data), client_factory=lambda _provider: scripted, integrations=[], scheduler=False
    )
    with TestClient(app, base_url="http://127.0.0.1") as client:
        yield client, facts


def test_the_archive_comes_from_nodestro_0_1() -> None:
    with zipfile.ZipFile(ARCHIVE) as archive:
        facts = json.loads(archive.read("LEGACY.json"))
    assert facts["legacy_version"] == "0.1.0"
    assert facts["legacy_commit"] == "15e20768dea496820d4f8a286720176b47817da7"


def test_settings_and_provider_key_survive(legacy: tuple[TestClient, dict[str, Any]]) -> None:
    client, _facts = legacy
    settings = client.get("/api/settings").json()
    assert settings["language"] == "fr" and settings["default_budget_usd"] == 2.5
    anthropic = next(item for item in settings["providers"] if item["id"] == "anthropic")
    assert anthropic["configured"] is True
    assert "sk-ant" not in json.dumps(settings)


def test_workflows_versions_runs_and_templates_survive(legacy: tuple[TestClient, dict[str, Any]]) -> None:
    client, facts = legacy
    assert len(client.get("/api/workflows").json()) == facts["workflows"]
    workflow = client.get(f"/api/workflows/{facts['workflow_id']}").json()
    assert workflow["name"] == "Angebot (0.1)" and workflow["description"] == "Zweite Version"
    assert len(client.get(f"/api/workflows/{facts['workflow_id']}/versions").json()) == facts["workflow_versions"]
    run = client.get(f"/api/runs/{facts['run_id']}").json()
    assert run["status"] == "succeeded" and run["output"] == facts["run_output"]
    assert client.get(f"/api/workflows/{facts['example_workflow_id']}").status_code == 200
    assert facts["template_id"] in {item["id"] for item in client.get("/api/agents/templates").json()}


def test_an_old_workflow_runs_again(legacy: tuple[TestClient, dict[str, Any]]) -> None:
    client, facts = legacy
    run = client.post(f"/api/workflows/{facts['workflow_id']}/runs", json={"input": "ACME"}).json()
    assert wait(client, run["id"], "succeeded", "failed")["output"] == "Neu geprüft."


def test_a_paused_run_continues_after_the_upgrade(legacy: tuple[TestClient, dict[str, Any]]) -> None:
    client, facts = legacy
    assert client.get(f"/api/runs/{facts['paused_run_id']}").json()["status"] == "paused"
    pending = [item for item in client.get("/api/approvals").json() if item["run_id"] == facts["paused_run_id"]]
    assert [item["node_id"] for item in pending] == ["check"]
    client.post(f"/api/runs/{facts['paused_run_id']}/approvals/check", json={"decision": "approved"}).raise_for_status()
    assert wait(client, facts["paused_run_id"], "succeeded", "failed")["status"] == "succeeded"


def test_the_published_api_and_its_keys_survive(legacy: tuple[TestClient, dict[str, Any]]) -> None:
    client, facts = legacy
    keys = client.get("/api/api-keys").json()
    assert facts["api_key_id"] in {item["id"] for item in keys}
    publications = client.get(f"/api/workflows/{facts['workflow_id']}/api").json()
    assert facts["publication_slug"] in json.dumps(publications)
    fresh = client.post(
        "/api/api-keys",
        json={"name": "Nach dem Upgrade", "scopes": ["run", "read"], "publications": [facts["publication_id"]]},
    ).json()
    headers = {"Authorization": f"Bearer {fresh['token']}"}
    base = f"/api/published/{facts['publication_slug']}"
    assert client.get(base, headers=headers).json()["publication"] == facts["publication_slug"]
    started = client.post(f"{base}/runs", json={"input": "ACME"}, headers=headers).json()
    for _ in range(300):
        status = client.get(f"{base}/runs/{started['run_id']}", headers=headers).json()
        if status["status"] in ("succeeded", "failed"):
            break
        time.sleep(0.05)
    assert status["status"] == "succeeded"
    assert client.get(base, headers={"Authorization": "Bearer ndk_wrong"}).status_code == 401

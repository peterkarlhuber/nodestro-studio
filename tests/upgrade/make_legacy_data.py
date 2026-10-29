"""Writes the data directory of a Nodestro 0.1 installation for the upgrade test (legacy-0.1.zip).

Run it with the Python of a Nodestro 0.1 checkout (repository ``nodestro-legacy`` at 15e2076, the
last commit before the split), never in CI:

    python tests/upgrade/make_legacy_data.py --legacy /path/to/nodestro-legacy

Its agents answer from a script, nothing is paid. The provider key it stores is a placeholder,
not a credential.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys
import tempfile
import time
from typing import Any
import zipfile

HERE = Path(__file__).resolve().parent
#: A placeholder in the shape of a key: the upgrade test checks it is still configured, nothing else.
LEGACY_COMMIT = "15e20768dea496820d4f8a286720176b47817da7"
PLACEHOLDER_KEY = "sk-ant-placeholder-legacy-fixture-0000"


def agent(node_id: str, prompt: str) -> dict[str, Any]:
    return {
        "id": node_id,
        "type": "agent",
        "label": node_id.title(),
        "agent": {"name": node_id.title(), "system_prompt": prompt},
    }


def edge(source: str, target: str, handle: str | None = None) -> dict[str, Any]:
    return {"id": f"{source}-{target}", "source": source, "target": target, "source_handle": handle}


def wait(client: Any, run_id: str, *states: str) -> dict[str, Any]:
    for _ in range(300):
        run = client.get(f"/api/runs/{run_id}").json()
        if run["status"] in states:
            return dict(run)
        time.sleep(0.05)
    raise AssertionError(f"run {run_id} did not reach {states}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--legacy", type=Path, required=True, help="a checkout of Nodestro 0.1 (15e2076)")
    parser.add_argument("--out", type=Path, default=HERE / "legacy-0.1.zip")
    args = parser.parse_args()
    sys.path.insert(0, str(args.legacy / "backend" / "tests"))
    from fastapi.testclient import TestClient
    from nodestro import __version__
    from nodestro.app import create_app
    from nodestro.context import AppConfig

    from conftest import ScriptedClient, text

    script = {
        "WRITER": [text("## Angebot\n\nWir liefern 10 Stück bis Freitag.") for _ in range(20)],
        "REVIEWER": [text("Geprüft: in Ordnung.") for _ in range(20)],
    }
    scripted = ScriptedClient(script)
    with tempfile.TemporaryDirectory() as temp:
        data = Path(temp) / "nodestro"
        app = create_app(AppConfig(data_dir=data), client_factory=lambda _provider: scripted, scheduler=False)
        facts: dict[str, Any] = {
            "legacy_version": __version__,
            "legacy_commit": "15e20768dea496820d4f8a286720176b47817da7",
        }
        with TestClient(app) as client:
            client.put("/api/settings", json={"language": "fr", "api_key": PLACEHOLDER_KEY, "default_budget_usd": 2.5})
            body = {
                "name": "Angebot (0.1)",
                "nodes": [
                    {"id": "start", "type": "start"},
                    agent("writer", "WRITER"),
                    agent("reviewer", "REVIEWER"),
                    {"id": "out", "type": "output"},
                ],
                "edges": [edge("start", "writer"), edge("writer", "reviewer"), edge("reviewer", "out")],
            }
            workflow = client.post("/api/workflows", json=body).json()
            body["description"] = "Zweite Version"
            client.put(f"/api/workflows/{workflow['id']}", json=body).raise_for_status()
            run = client.post(f"/api/workflows/{workflow['id']}/runs", json={"input": "ACME"}).json()
            done = wait(client, run["id"], "succeeded")
            approval = client.post(
                "/api/workflows",
                json={
                    "name": "Freigabe (0.1)",
                    "nodes": [
                        {"id": "start", "type": "start"},
                        agent("writer", "WRITER"),
                        {"id": "check", "type": "approval", "label": "Prüfen", "approval": {"instructions": "Ok?"}},
                        {"id": "out", "type": "output"},
                    ],
                    "edges": [edge("start", "writer"), edge("writer", "check"), edge("check", "out", "approved")],
                },
            ).json()
            paused = client.post(f"/api/workflows/{approval['id']}/runs", json={"input": "x"}).json()
            wait(client, paused["id"], "paused")
            template = client.post(
                "/api/agents/templates",
                json={"name": "Prüfer (0.1)", "agent": {"name": "Prüfer", "system_prompt": "Prüfe."}},
            ).json()
            examples = client.get("/api/library", params={"language": "de"}).json()
            example = client.post(f"/api/library/{examples[0]['id']}/copy", json={"language": "de"}).json()
            published = client.post(
                f"/api/workflows/{workflow['id']}/api/publish", json={"slug": "angebot-legacy"}
            ).json()
            publication = published["publication"]
            key = client.post(
                "/api/api-keys", json={"name": "Legacy", "scopes": ["run", "read"], "publications": [publication["id"]]}
            ).json()
            facts.update(
                workflow_id=workflow["id"],
                workflow_versions=len(client.get(f"/api/workflows/{workflow['id']}/versions").json()),
                run_id=done["id"],
                run_output=done["output"],
                paused_run_id=paused["id"],
                approval_workflow_id=approval["id"],
                template_id=template["id"],
                example_workflow_id=example["id"],
                publication_id=publication["id"],
                publication_slug=publication["slug"],
                api_key_id=key["key"]["id"] if "key" in key else key["id"],
                workflows=len(client.get("/api/workflows").json()),
            )
        (data / "LEGACY.json").write_text(json.dumps(facts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        for leftover in data.glob("*.db-*"):
            leftover.unlink()
        with zipfile.ZipFile(args.out, "w", zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(data.rglob("*")):
                if path.is_file() and "python" not in path.relative_to(data).parts[:1]:
                    archive.write(path, path.relative_to(data).as_posix())
    shutil.rmtree(HERE / "__pycache__", ignore_errors=True)
    print(f"{args.out}: {json.dumps(facts, ensure_ascii=False)}")


if __name__ == "__main__":
    main()

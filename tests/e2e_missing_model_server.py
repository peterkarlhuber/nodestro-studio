"""Nodestro with a stand-in for the managed local model server, for the browser test of missing local models.

Usage: python tests/e2e_missing_model_server.py --data-dir DIR [--port 9610]

The defaults of a new installation stay: the assistant (and the Workflow Architect) use ``ollama:qwen3.5:9b``,
which is not installed, and agents use ``ollama:qwen3.5:4b``, which is. The managed server is a small fake Ollama
(``NODESTRO_OLLAMA_BINARY``): it lists the models of its model folder, and ``/api/pull`` reports progress and writes
the model into that folder, so the readiness check, the download job and the unattended check see a real folder.
Downloads fail on request (``POST /__e2e/pull`` with ``{"mode": "error" | "disk_full" | "ok", "seconds": n}``).

Model answers come from :mod:`architect_script` through scripted clients (Chat Completions shaped for the local
models, as Ollama answers); only the readiness check is told to look at the fake server anyway (an injected client
normally answers for its models itself). ``GET /__e2e/calls`` counts
the scripted requests, so the test sees that a continued action generated once. Nothing calls the internet: the Ollama
registry that the readiness check reads before a download (RT-062) is a stand-in too (:func:`fake_registry`), which
knows ``e2e-notools:1b``, a model outside the catalog whose manifest proves that it cannot call tools.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from types import SimpleNamespace
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from nodestro_runtime import local_readiness, local_registry
from nodestro_runtime.testing import ScriptedClient, ScriptedMessages, text
from pydantic import BaseModel
import uvicorn

from nodestro_studio.app import create_app, studio_config

from architect_script import AGENT, ANALYST, CODER, PLANNER, agent_spec, analysis, create_plan, slow, tool_proposal

FAKE_OLLAMA = """\
#!{python}
import http.server, json, os, pathlib, time, hashlib
host, port = os.environ["OLLAMA_HOST"].rsplit(":", 1)
store = pathlib.Path(os.environ["OLLAMA_MODELS"])
control = pathlib.Path({control!r})
SIZES = {{"qwen3.5:9b": 6600000000, "qwen3.5:4b": 3300000000, "qwen3-embedding:0.6b": 640000000}}

def split(name):
    model, _, tag = name.partition(":")
    return model, tag or "latest"

def manifest(name):
    model, tag = split(name)
    return store / "manifests" / "registry.ollama.ai" / "library" / model / tag

def digest(name):
    return "sha256:" + hashlib.sha256(name.encode()).hexdigest()

def installed():
    root = store / "manifests" / "registry.ollama.ai" / "library"
    found = []
    if root.is_dir():
        for model in sorted(root.iterdir()):
            for tag in sorted(model.iterdir()):
                name = model.name + ":" + tag.name
                found.append({{"name": name, "model": name, "size": SIZES.get(name, 1000000000),
                               "digest": digest(name)[7:], "details": {{}}}})
    return found

def install(name):
    blobs = store / "blobs"
    blobs.mkdir(parents=True, exist_ok=True)
    layer = digest(name)
    (blobs / layer.replace(":", "-")).write_bytes(name.encode())
    for part in blobs.glob(layer.replace(":", "-") + "-partial*"):
        part.unlink()
    path = manifest(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({{"schemaVersion": 2, "config": {{"digest": layer, "size": len(name)}}, "layers": []}}))

def settings():
    try:
        return json.loads(control.read_text())
    except (OSError, ValueError):
        return {{}}

class H(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass
    def reply(self, body, status=200):
        data = json.dumps(body).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        if self.path == "/api/version": self.reply({{"version": "0.40.14"}})
        elif self.path == "/api/tags": self.reply({{"models": installed()}})
        elif self.path == "/api/ps": self.reply({{"models": []}})
        else: self.reply({{"error": "not found"}}, 404)
    def do_DELETE(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{{}}")
        path = manifest(body.get("model", ""))
        if path.exists(): path.unlink(); self.reply({{}})
        else: self.reply({{"error": "model not found"}}, 404)
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{{}}")
        name = body.get("model", "")
        names = [m["name"] for m in installed()]
        if self.path == "/api/show":
            if name not in names: self.reply({{"error": "model '" + name + "' not found"}}, 404)
            elif "embedding" in name: self.reply({{"capabilities": ["embedding"], "model_info": {{}}}})
            else: self.reply({{"capabilities": ["completion", "tools", "vision", "thinking"], "model_info": {{}}}})
        elif self.path == "/api/pull": self.pull(name)
        else: self.reply({{"error": "not found"}}, 404)
    def line(self, item):
        data = (json.dumps(item) + "\\n").encode()
        self.wfile.write(b"%x\\r\\n%s\\r\\n" % (len(data), data)); self.wfile.flush()
    def pull(self, name):
        conf = settings()
        mode, seconds = conf.get("mode", "ok"), float(conf.get("seconds", 6))
        self.send_response(200); self.send_header("Content-Type", "application/x-ndjson")
        self.send_header("Transfer-Encoding", "chunked"); self.end_headers()
        total = SIZES.get(name, 1000000000)
        layer = digest(name)
        part = store / "blobs" / (layer.replace(":", "-") + "-partial-0")
        part.parent.mkdir(parents=True, exist_ok=True)
        try:
            done = json.loads(part.read_text()).get("Completed", 0)
        except (OSError, ValueError):
            done = 0
        try:
            self.line({{"status": "pulling manifest"}})
            steps = 24
            for index in range(steps):
                if mode != "ok" and index == steps // 2:
                    blob = str(store / "blobs" / layer.replace(":", "-"))
                    text = (blob + "-partial: write: no space left on device" if mode == "disk_full"
                            else "max retries exceeded: dial tcp: lookup registry.ollama.ai: "
                            "temporary failure in name resolution")
                    self.line({{"error": text}})
                    self.wfile.write(b"0\\r\\n\\r\\n")
                    return
                done = max(done, total * (index + 1) // steps)
                part.write_text(json.dumps({{"Completed": done}}))
                self.line({{"status": "pulling " + layer[7:19], "digest": layer, "total": total, "completed": done}})
                time.sleep(seconds / steps)
            for status in ("verifying sha256 digest", "writing manifest"):
                self.line({{"status": status}})
            install(name)
            self.line({{"status": "success"}})
            self.wfile.write(b"0\\r\\n\\r\\n")
        except (BrokenPipeError, ConnectionResetError):
            pass  # cancelled: the partial download stays and the next pull continues there
http.server.ThreadingHTTPServer((host, int(port)), H).serve_forever()
"""

DELAY = 0.5
ASSISTANT = "You are the Nodestro Assistant"
ROLES = {ANALYST: "analyst", PLANNER: "planner", AGENT: "agent", CODER: "coder", ASSISTANT: "assistant"}


def script() -> dict[str, list[Any]]:
    answers = {
        ANALYST: analysis(),
        PLANNER: create_plan(),
        AGENT: agent_spec(),
        CODER: tool_proposal(),
        ASSISTANT: text("The local model answered."),
    }
    return {key: [slow(value, DELAY) for _ in range(20)] for key, value in answers.items()}


def _output_class(name: str) -> type[BaseModel] | None:
    """The result model a structured request names (Chat Completions sends its class name as the schema name)."""
    for module in list(sys.modules.values()):
        if not getattr(module, "__name__", "").startswith(("nodestro_api", "nodestro_runtime")):
            continue
        found = getattr(module, name, None)
        if isinstance(found, type) and issubclass(found, BaseModel):
            return found
    return None


class LocalChat:
    """The local models' answers in the Chat Completions shape, from the same script (and the same call log)."""

    def __init__(self, script: ScriptedMessages) -> None:
        self.script = script
        self.chat = SimpleNamespace(completions=self)

    def create(self, **native: Any) -> Any:
        messages = native.get("messages") or []
        system = "\n".join(
            item["content"] if isinstance(item.get("content"), str) else json.dumps(item.get("content"))
            for item in messages
            if item.get("role") in ("system", "developer")
        )
        request: dict[str, Any] = {
            "system": system,
            "messages": [item for item in messages if item.get("role") not in ("system", "developer")],
            "model": native.get("model"),
        }
        schema = (native.get("response_format") or {}).get("json_schema") or {}
        output = _output_class(str(schema.get("name") or "")) if schema else None
        if output is not None:
            request["output_format"] = output
        answer = self.script.create(**request)
        if output is not None:
            text = answer.parsed_output.model_dump_json()
        else:
            text = "".join(getattr(block, "text", "") for block in answer.content)
        usage = {"prompt_tokens": 120, "completion_tokens": 40, "total_tokens": 160}
        if native.get("stream"):
            delta = {"index": 0, "delta": {"content": text}}
            return iter(
                [
                    {"id": "local", "model": native.get("model"), "choices": [delta]},
                    {"id": "local", "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}], "usage": usage},
                ]
            )
        return {
            "id": "local",
            "model": native.get("model"),
            "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
            "usage": usage,
        }


#: A model outside the catalog that the stand-in registry knows: its template never uses tools, and it has no parser.
NO_TOOLS = "e2e-notools:1b"


def fake_registry() -> None:
    """Replaces the registry reads of :mod:`nodestro_runtime.local_registry` (the real code reads the manifest, config
    and template and decides). Every other model is unknown there, as without internet access (the download sizes of a
    pull too, so a pull reports Ollama's own progress only)."""

    def layer(body: bytes, media: str) -> dict[str, Any]:
        return {"mediaType": media, "digest": "sha256:" + hashlib.sha256(body).hexdigest(), "size": len(body)}

    config, template = b'{"model_format": "gguf", "model_family": "llama"}', b"{{ .System }} {{ .Prompt }}"
    manifest = json.dumps(
        {
            "schemaVersion": 2,
            "config": layer(config, "application/vnd.docker.container.image.v1+json"),
            "layers": [
                layer(b"weights", "application/vnd.ollama.image.model"),
                layer(template, "application/vnd.ollama.image.template"),
            ],
        }
    ).encode()
    model, _, tag = NO_TOOLS.partition(":")
    root = f"https://{local_registry.REGISTRY}/v2/library/{model}"
    files = {f"{root}/manifests/{tag}": manifest}
    for body in (config, template):
        files[f"{root}/blobs/sha256:{hashlib.sha256(body).hexdigest()}"] = body

    def get(url: str, _accept: str, _limit: int) -> bytes:
        if url in files:
            return files[url]
        raise local_registry.RegistryError("not known to the test registry (no internet access in this test)")

    local_registry.get = get
    local_registry.clear_cache()


def install_fake_ollama(data_dir: Path) -> Path:
    folder = data_dir / "fake-ollama"
    folder.mkdir(parents=True, exist_ok=True)
    control = folder / "control.json"
    control.write_text(json.dumps({"mode": "ok", "seconds": 6}))
    binary = folder / "ollama"
    binary.write_text(FAKE_OLLAMA.format(python=sys.executable, control=str(control)))
    binary.chmod(0o755)
    os.environ["NODESTRO_OLLAMA_BINARY"] = str(binary)
    return control


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=9610)
    args = parser.parse_args()
    data_dir = Path(args.data_dir)
    control = install_fake_ollama(data_dir)
    fake_registry()
    client = ScriptedClient(script())
    # The readiness check asks the (fake) managed server although a scripted client answers the models.
    local_readiness._injected = lambda _ws: False  # type: ignore[assignment]
    local = LocalChat(client.messages)
    app = create_app(studio_config(data_dir), client_factory=lambda provider: local if provider == "ollama" else client)
    workspace = app.state.nodestro
    # Installed already: the agents' default model (the assistant's default, qwen3.5:9b, is missing).
    folder = workspace.local_models.models_dir()
    from fastapi.routing import APIRoute

    def calls() -> dict[str, Any]:
        counts: dict[str, int] = {}
        prompts: dict[str, list[str]] = {}
        for call in client.messages.calls:
            system = str(call.get("system", ""))
            role = next((name for key, name in ROLES.items() if key in system), "other")
            counts[role] = counts.get(role, 0) + 1
            prompts.setdefault(role, []).append(json.dumps(call.get("messages"), default=str)[:4000])
        return {"total": len(client.messages.calls), "by_role": counts, "prompts": prompts}

    def pull(body: dict[str, Any]) -> dict[str, Any]:
        control.write_text(json.dumps({"mode": body.get("mode", "ok"), "seconds": body.get("seconds", 6)}))
        return {"ok": True}

    async def tick(body: dict[str, Any]) -> dict[str, Any]:
        """Makes a schedule due now and runs the scheduler's tick (which otherwise comes every 20 seconds)."""
        from nodestro_api.schedules import COLLECTION, Schedule

        schedules = workspace.schedules
        schedule = Schedule.model_validate(workspace.store.get_raw(COLLECTION, body["id"]))
        schedule.enabled, schedule.next_run_at = True, schedules.clock()
        workspace.store.put(COLLECTION, schedule.id, schedule)
        return {"started": await schedules.tick()}

    app.router.routes.insert(0, APIRoute("/__e2e/tick", tick, methods=["POST"]))
    app.router.routes.insert(0, APIRoute("/__e2e/calls", calls, methods=["GET"]))
    app.router.routes.insert(0, APIRoute("/__e2e/pull", pull, methods=["POST"]))
    _preinstall(folder, "qwen3.5:4b")
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


def _preinstall(folder: Path, name: str) -> None:
    model, _, tag = name.partition(":")
    layer = "sha256:" + hashlib.sha256(name.encode()).hexdigest()
    (folder / "blobs").mkdir(parents=True, exist_ok=True)
    (folder / "blobs" / layer.replace(":", "-")).write_bytes(name.encode())
    path = folder / "manifests" / "registry.ollama.ai" / "library" / model / tag
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"schemaVersion": 2, "config": {"digest": layer, "size": len(name)}, "layers": []}))


if __name__ == "__main__":
    main()

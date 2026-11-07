"""A stand-in for the Ollama server, for the end-to-end suite of local models (tests/e2e_local_models_server.py).

Started by the studio's managed local model server as its "binary" (``NODESTRO_OLLAMA_BINARY`` points to a small
wrapper that runs this file): ``ollama serve`` with ``OLLAMA_HOST`` and ``OLLAMA_MODELS`` from the runtime, exactly
like the real program. Everything goes through HTTP, as with a real server:

- the models are an Ollama model folder (``manifests/registry.ollama.ai/...`` and ``blobs/sha256-...``), read with
  orkexa's own folder reader, so an offline package import by the runtime shows up here like in Ollama;
- ``/api/pull`` streams Ollama's progress lines (manifest, one measured layer, verify, write) and writes the model;
  a catalog model reports the catalog's digest, so the studio shows it as verified. Failures on request;
- ``/api/blobs`` and ``/api/create`` import a GGUF file (a file that does not start with ``GGUF`` is refused, as
  Ollama refuses it);
- ``/api/embed`` answers deterministic, normalized bag-of-words vectors (texts that share words are close);
- ``/api/generate`` answers a speed measurement, ``/v1/chat/completions`` (plain and streamed) answers agents.

The first command-line argument is a JSON control file the e2e server writes (``{"pull": "ok" | "error",
"seconds": n}``); every request a model answers is appended to ``calls.jsonl`` next to it.
"""

from __future__ import annotations

import hashlib
import http.server
import json
import math
import os
from pathlib import Path
import re
import sys
import time
from typing import Any

from orkexa.local.packages import scan_store

VERSION = "0.40.14"
DIMENSIONS = 1024
HOST, PORT = os.environ.get("OLLAMA_HOST", "127.0.0.1:11434").rsplit(":", 1)
STORE = Path(os.environ.get("OLLAMA_MODELS") or Path.home() / ".ollama" / "models")
CONTROL = Path(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1] != "serve" else STORE.parent / "control.json"
CALLS = CONTROL.parent / "calls.jsonl"
#: The digests the catalog lists for the models this server "downloads" (written by the e2e server).
CATALOG = CONTROL.parent / "catalog.json"
#: Models written by a pull report the catalog's digest (a real registry download has exactly that digest).
PULLED = CONTROL.parent / "pulled.json"


def _json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def control() -> dict[str, Any]:
    return _json(CONTROL)


def log_call(kind: str, model: str, text: str = "") -> None:
    with CALLS.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({"kind": kind, "model": model, "text": text[:400], "at": time.time()}) + "\n")


def split(name: str) -> tuple[str, str]:
    model, _, tag = name.partition(":")
    return model, tag or "latest"


def manifest_path(name: str) -> Path:
    model, tag = split(name)
    return STORE / "manifests" / "registry.ollama.ai" / "library" / model / tag


def blob_path(digest: str) -> Path:
    return STORE / "blobs" / digest.replace(":", "-")


def write_blob(data: bytes) -> tuple[str, int]:
    digest = "sha256:" + hashlib.sha256(data).hexdigest()
    path = blob_path(digest)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return digest, len(data)


def write_model(name: str, layers: list[tuple[str, int, str]], *, family: str) -> None:
    """A manifest with a config blob and ``layers`` (digest, size, media type), as Ollama writes it."""
    config, config_size = write_blob(json.dumps({"model_family": family, "model": name}).encode())
    manifest = {
        "schemaVersion": 2,
        "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
        "config": {
            "mediaType": "application/vnd.docker.container.image.v1+json",
            "digest": config,
            "size": config_size,
        },
        "layers": [{"mediaType": media, "digest": digest, "size": size} for digest, size, media in layers],
    }
    path = manifest_path(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest), encoding="utf-8")


def installed() -> list[dict[str, Any]]:
    if not (STORE / "blobs").is_dir():
        return []
    pulled = _json(PULLED)
    models = []
    for model in scan_store(STORE):
        size = sum(size for _digest, size in model.blobs)
        models.append(
            {
                "name": model.name,
                "model": model.name,
                "size": int(pulled.get(model.name, {}).get("size") or size),
                "digest": pulled.get(model.name, {}).get("digest") or model.digest,
                "details": {"format": "gguf"},
            }
        )
    return models


def is_embedding(name: str) -> bool:
    return "embed" in name or "mdenseon" in name


WORD = re.compile(r"[0-9a-zA-ZÀ-ÿ]+")


def embed(text: str) -> list[float]:
    vector = [0.0] * DIMENSIONS
    for word in WORD.findall(text.lower()):
        slot = int(hashlib.sha256(word.encode()).hexdigest()[:8], 16) % DIMENSIONS
        vector[slot] += 1.0
    if not any(vector):
        vector[0] = 1.0
    norm = math.sqrt(sum(x * x for x in vector))
    return [x / norm for x in vector]


def answer(model: str, messages: list[dict[str, Any]]) -> str:
    def content(item: dict[str, Any]) -> str:
        value = item.get("content")
        if isinstance(value, list):
            return " ".join(str(part.get("text", "")) for part in value if isinstance(part, dict))
        return str(value or "")

    asked = next((content(item) for item in reversed(messages) if item.get("role") == "user"), "")
    words = " ".join(asked.split())[:120]
    return f"Local answer from {model}: {words}"


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args: Any) -> None:
        pass

    def reply(self, body: Any, status: int = 200) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def empty(self, status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def body(self) -> bytes:
        return self.rfile.read(int(self.headers.get("Content-Length", 0) or 0))

    def json_body(self) -> dict[str, Any]:
        raw = self.body()
        try:
            data = json.loads(raw or b"{}")
        except ValueError:
            return {}
        return data if isinstance(data, dict) else {}

    # ---- streaming ----

    def begin(self, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()

    def chunk(self, data: bytes) -> None:
        self.wfile.write(b"%x\r\n%s\r\n" % (len(data), data))
        self.wfile.flush()

    def line(self, item: dict[str, Any]) -> None:
        self.chunk((json.dumps(item) + "\n").encode())

    def end(self) -> None:
        self.wfile.write(b"0\r\n\r\n")
        self.wfile.flush()

    # ---- routes ----

    def do_HEAD(self) -> None:
        match = re.fullmatch(r"/api/blobs/(sha256:[0-9a-f]{64})", self.path)
        self.empty(200 if match and blob_path(match.group(1)).is_file() else 404)

    def do_GET(self) -> None:
        if self.path == "/api/version":
            self.reply({"version": VERSION})
        elif self.path == "/api/tags":
            self.reply({"models": installed()})
        elif self.path == "/api/ps":
            self.reply({"models": []})
        elif self.path == "/v1/models":
            self.reply({"object": "list", "data": [{"id": m["name"], "object": "model"} for m in installed()]})
        else:
            self.reply({"error": "not found"}, 404)

    def do_DELETE(self) -> None:
        name = str(self.json_body().get("model") or "")
        path = manifest_path(name)
        if path.exists():
            path.unlink()
            self.reply({})
        else:
            self.reply({"error": f"model '{name}' not found"}, 404)

    def do_POST(self) -> None:
        blob = re.fullmatch(r"/api/blobs/(sha256:[0-9a-f]{64})", self.path)
        if blob:
            data = self.body()
            digest = "sha256:" + hashlib.sha256(data).hexdigest()
            if digest != blob.group(1):
                self.reply({"error": "digest mismatch"}, 400)
                return
            write_blob(data)
            self.empty(201)
            return
        body = self.json_body()
        name = str(body.get("model") or "")
        names = {model["name"] for model in installed()}
        if self.path == "/api/show":
            if name not in names:
                self.reply({"error": f"model '{name}' not found"}, 404)
            elif is_embedding(name):
                self.reply({"capabilities": ["embedding"], "model_info": {"qwen3.embedding_length": DIMENSIONS}})
            else:
                self.reply({"capabilities": ["completion", "tools"], "model_info": {"qwen35.context_length": 262144}})
        elif self.path == "/api/pull":
            self.pull(name)
        elif self.path == "/api/create":
            self.create(name, body)
        elif self.path == "/api/embed":
            if name not in names:
                self.reply({"error": f"model '{name}' not found, try pulling it first"}, 404)
                return
            inputs = body.get("input")
            texts = [inputs] if isinstance(inputs, str) else [str(item) for item in inputs or []]
            log_call("embed", name, f"{len(texts)} texts")
            self.reply({"model": name, "embeddings": [embed(text) for text in texts], "prompt_eval_count": 8})
        elif self.path == "/api/generate":
            if name not in names:
                self.reply({"error": f"model '{name}' not found"}, 404)
                return
            log_call("generate", name)
            self.reply(
                {"model": name, "response": "ok", "done": True, "eval_count": 50, "eval_duration": 5_000_000_000}
            )
        elif self.path == "/v1/chat/completions":
            self.chat(name, body)
        else:
            self.reply({"error": "not found"}, 404)

    def pull(self, name: str) -> None:
        conf = control()
        mode, seconds = conf.get("pull", "ok"), float(conf.get("seconds", 4))
        catalog = _json(CATALOG).get(name) or {}
        total = int(catalog.get("size") or 1_000_000_000)
        self.begin("application/x-ndjson")
        layer = "sha256:" + hashlib.sha256(name.encode()).hexdigest()
        try:
            self.line({"status": "pulling manifest"})
            steps = 20
            for index in range(steps):
                if mode == "error" and index == steps // 2:
                    self.line({"error": "max retries exceeded: dial tcp: lookup registry.ollama.ai: no such host"})
                    self.end()
                    return
                done = total * (index + 1) // steps
                self.line({"status": f"pulling {layer[7:19]}", "digest": layer, "total": total, "completed": done})
                time.sleep(seconds / steps)
            for status in ("verifying sha256 digest", "writing manifest"):
                self.line({"status": status})
            weights, size = write_blob(f"weights of {name}".encode())
            write_model(name, [(weights, size, "application/vnd.ollama.image.model")], family=name.split(":")[0])
            pulled = _json(PULLED)
            pulled[name] = {"digest": catalog.get("digest") or "", "size": total}
            PULLED.write_text(json.dumps(pulled), encoding="utf-8")
            log_call("pull", name)
            self.line({"status": "success"})
            self.end()
        except (BrokenPipeError, ConnectionResetError):
            pass  # cancelled by the client

    def create(self, name: str, body: dict[str, Any]) -> None:
        files = body.get("files") if isinstance(body.get("files"), dict) else {}
        layers = []
        for digest in files.values():
            path = blob_path(str(digest))
            if not path.is_file():
                self.reply({"error": f"blob {digest} not found"}, 400)
                return
            with path.open("rb") as handle:
                if handle.read(4) != b"GGUF":
                    self.reply({"error": "invalid file magic"}, 400)
                    return
            layers.append((str(digest), path.stat().st_size, "application/vnd.ollama.image.model"))
        if not layers:
            self.reply({"error": "neither 'from' or 'files' was specified"}, 400)
            return
        self.begin("application/x-ndjson")
        for status in ("parsing GGUF", "using existing layer", "writing manifest"):
            self.line({"status": status})
            time.sleep(0.2)
        write_model(name, layers, family="gguf")
        log_call("create", name)
        self.line({"status": "success"})
        self.end()

    def chat(self, name: str, body: dict[str, Any]) -> None:
        names = {model["name"] for model in installed()}
        if name not in names:
            self.reply({"error": {"message": f"model '{name}' not found", "type": "api_error"}}, 404)
            return
        messages = [item for item in body.get("messages") or [] if isinstance(item, dict)]
        text = answer(name, messages)
        log_call("chat", name, text)
        usage = {"prompt_tokens": 120, "completion_tokens": 40, "total_tokens": 160}
        created = int(time.time())
        if not body.get("stream"):
            self.reply(
                {
                    "id": "chatcmpl-e2e",
                    "object": "chat.completion",
                    "created": created,
                    "model": name,
                    "choices": [
                        {"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}
                    ],
                    "usage": usage,
                }
            )
            return
        self.begin("text/event-stream")
        base = {"id": "chatcmpl-e2e", "object": "chat.completion.chunk", "created": created, "model": name}
        events: list[dict[str, Any]] = [
            {**base, "choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}, "finish_reason": None}]}
        ]
        for part in re.findall(r"\S+\s*", text):
            events.append({**base, "choices": [{"index": 0, "delta": {"content": part}, "finish_reason": None}]})
        events.append({**base, "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]})
        events.append({**base, "choices": [], "usage": usage})
        for event in events:
            self.chunk(f"data: {json.dumps(event)}\n\n".encode())
            time.sleep(0.02)
        self.chunk(b"data: [DONE]\n\n")
        self.end()


def main() -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    http.server.ThreadingHTTPServer((HOST, int(PORT)), Handler).serve_forever()


if __name__ == "__main__":
    main()

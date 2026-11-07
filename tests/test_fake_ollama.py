"""The fake Ollama of the local models e2e suite (tests/fake_ollama.py) answers orkexa's real client as Ollama does."""

from __future__ import annotations

from collections.abc import Iterator
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request

from orkexa.local._http import OllamaError
from orkexa.local.client import OllamaClient
import pytest

FAKE = Path(__file__).with_name("fake_ollama.py")


def _free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


@pytest.fixture
def server(tmp_path: Path) -> Iterator[tuple[OllamaClient, Path]]:
    control = tmp_path / "fake" / "control.json"
    control.parent.mkdir()
    control.write_text(json.dumps({"pull": "ok", "seconds": 0.2}))
    (control.parent / "catalog.json").write_text(json.dumps({"qwen3.5:4b": {"digest": "a" * 64, "size": 3000}}))
    port = _free_port()
    env = {**os.environ, "OLLAMA_HOST": f"127.0.0.1:{port}", "OLLAMA_MODELS": str(tmp_path / "models")}
    process = subprocess.Popen([sys.executable, str(FAKE), str(control), "serve"], env=env)
    client = OllamaClient(f"http://127.0.0.1:{port}")
    try:
        deadline = time.monotonic() + 20
        while not client.is_running():
            assert time.monotonic() < deadline, "the fake server did not start"
            time.sleep(0.1)
        yield client, control
    finally:
        process.terminate()
        process.wait(10)


def test_downloads_report_progress_and_the_catalog_digest(server: tuple[OllamaClient, Path]) -> None:
    client, control = server
    assert client.version() == "0.40.14" and client.list_models() == []
    progress = list(client.pull("qwen3.5:4b"))
    measured = [item for item in progress if item.total]
    assert measured and measured[-1].completed == measured[-1].total == 3000
    assert progress[-1].status == "success"
    [model] = client.list_models()
    assert model.name == "qwen3.5:4b" and model.digest == "a" * 64
    assert "tools" in client.show("qwen3.5:4b").capabilities
    control.write_text(json.dumps({"pull": "error", "seconds": 0.2}))
    with pytest.raises(OllamaError):
        list(client.pull("qwen3-embedding:0.6b"))
    assert [item.name for item in client.list_models()] == ["qwen3.5:4b"]


def test_gguf_imports_embeddings_and_chat(server: tuple[OllamaClient, Path], tmp_path: Path) -> None:
    client, control = server
    gguf = tmp_path / "tiny.gguf"
    gguf.write_bytes(b"GGUF" + bytes(32))
    list(client.create_from_gguf("tiny:1", gguf))
    assert [item.name for item in client.list_models()] == ["tiny:1"]
    text = tmp_path / "text.gguf"
    text.write_text("not a model")
    with pytest.raises(OllamaError) as refused:
        list(client.create_from_gguf("text:1", text))
    assert "invalid file magic" in str(refused.value)
    control.write_text(json.dumps({"pull": "ok", "seconds": 0.1}))
    list(client.pull("qwen3-embedding:0.6b"))
    assert client.show("qwen3-embedding:0.6b").embedding_length == 1024
    vectors = client.embed("qwen3-embedding:0.6b", ["refunds are paid", "refunds paid", "weather today"]).embeddings
    close = sum(a * b for a, b in zip(vectors[0], vectors[1], strict=True))
    far = sum(a * b for a, b in zip(vectors[0], vectors[2], strict=True))
    assert close > far
    request = urllib.request.Request(
        f"{client.base_url}/v1/chat/completions",
        data=json.dumps({"model": "tiny:1", "messages": [{"role": "user", "content": "Hello there"}]}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        answer = json.loads(response.read())
    assert answer["choices"][0]["message"]["content"] == "Local answer from tiny:1: Hello there"
    calls = [json.loads(line)["kind"] for line in (control.parent / "calls.jsonl").read_text().splitlines()]
    assert calls == ["create", "pull", "embed", "chat"]

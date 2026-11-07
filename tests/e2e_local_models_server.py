"""Nodestro with a managed local model server that is a fake Ollama, for the end-to-end suite of local models.

Usage: python tests/e2e_local_models_server.py --data-dir DIR [--port 8027]

Unlike the other e2e servers, no model client is injected: the studio keeps the defaults of a new installation
(local models), starts its managed server (``NODESTRO_OLLAMA_BINARY``: a wrapper that runs tests/fake_ollama.py), and
every request goes over HTTP to that server, as with a real Ollama: setup and start, downloads with progress, GGUF
and offline package imports, the speed measurement, the semantic index (``/api/embed``) and agents
(``/v1/chat/completions``). Nothing calls the internet.

Test routes:

- ``POST /__e2e/control`` ``{"pull": "ok" | "error", "seconds": n}``: the next downloads succeed or fail.
- ``GET /__e2e/calls``: what the fake server answered (pull, create, embed, generate, chat), oldest first.
- ``GET /__e2e/files``: paths of prepared files for the import form (a GGUF file, a file that only has the
  extension, a folder that is no package, a valid offline package with the model ``e2e-tiny:1m``).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from typing import Any

from fastapi.routing import APIRoute
from nodestro_runtime.local_models import CATALOG
from orkexa.local.packages import export_package
import uvicorn

from nodestro_studio.app import create_app, studio_config

FAKE = Path(__file__).with_name("fake_ollama.py")
PACKAGE_MODEL = "e2e-tiny:1m"

WRAPPER = """\
#!{python}
# The managed "Ollama" of the e2e suite: runs tests/fake_ollama.py with its control file.
import runpy, sys
sys.argv = [{fake!r}, {control!r}] + sys.argv[1:]
runpy.run_path({fake!r}, run_name="__main__")
"""


def install_fake_ollama(data_dir: Path) -> Path:
    """Write the wrapper, the control file and the catalog's digests; point the runtime at the wrapper."""
    folder = data_dir / "fake-ollama"
    folder.mkdir(parents=True, exist_ok=True)
    control = folder / "control.json"
    control.write_text(json.dumps({"pull": "ok", "seconds": 4}), encoding="utf-8")
    catalog = {model.name: {"digest": model.digest, "size": model.download_bytes} for model in CATALOG}
    (folder / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
    binary = folder / "ollama"
    binary.write_text(WRAPPER.format(python=sys.executable, fake=str(FAKE), control=str(control)), encoding="utf-8")
    binary.chmod(0o755)
    os.environ["NODESTRO_OLLAMA_BINARY"] = str(binary)
    return control


def _blob(root: Path, data: bytes) -> tuple[str, int]:
    digest = "sha256:" + hashlib.sha256(data).hexdigest()
    path = root / "blobs" / digest.replace(":", "-")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return digest, len(data)


def prepare_files(data_dir: Path) -> dict[str, str]:
    """The files the import form is tested with (they live on "this computer", next to the data folder)."""
    files = data_dir / "e2e-files"
    files.mkdir(parents=True, exist_ok=True)
    gguf = files / "tiny-model.gguf"
    gguf.write_bytes(b"GGUF" + b"\x03\x00\x00\x00" + bytes(256))
    fake_gguf = files / "renamed-text.gguf"
    fake_gguf.write_text("This is a text file with a .gguf name.", encoding="utf-8")
    text = files / "notes.txt"
    text.write_text("Not a model.", encoding="utf-8")
    not_package = files / "not-a-package"
    not_package.mkdir(exist_ok=True)
    (not_package / "readme.txt").write_text("No orkexa-models.json here.", encoding="utf-8")
    # A valid offline package, written by orkexa from a model folder (the way it is made on a computer with internet).
    source = files / "source-models"
    weights = _blob(source, b"GGUF" + bytes(64))
    config = _blob(source, json.dumps({"model_family": "e2e"}).encode())
    manifest = {
        "schemaVersion": 2,
        "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
        "config": {
            "mediaType": "application/vnd.docker.container.image.v1+json",
            "digest": config[0],
            "size": config[1],
        },
        "layers": [{"mediaType": "application/vnd.ollama.image.model", "digest": weights[0], "size": weights[1]}],
    }
    model, tag = PACKAGE_MODEL.split(":")
    entry = source / "manifests" / "registry.ollama.ai" / "library" / model / tag
    entry.parent.mkdir(parents=True, exist_ok=True)
    entry.write_text(json.dumps(manifest), encoding="utf-8")
    package = files / "offline-package"
    export_package(source, [PACKAGE_MODEL], package)
    return {
        "gguf": str(gguf),
        "fake_gguf": str(fake_gguf),
        "text": str(text),
        "not_package": str(not_package),
        "missing": str(files / "does-not-exist.gguf"),
        "package": str(package),
        "package_model": PACKAGE_MODEL,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8027)
    args = parser.parse_args()
    data_dir = Path(args.data_dir)
    control = install_fake_ollama(data_dir)
    prepared = prepare_files(data_dir)
    app = create_app(studio_config(data_dir))

    def set_control(body: dict[str, Any]) -> dict[str, Any]:
        current = json.loads(control.read_text(encoding="utf-8"))
        current.update({key: body[key] for key in ("pull", "seconds") if key in body})
        control.write_text(json.dumps(current), encoding="utf-8")
        return current

    def calls() -> list[dict[str, Any]]:
        log = control.parent / "calls.jsonl"
        if not log.is_file():
            return []
        return [json.loads(line) for line in log.read_text(encoding="utf-8").splitlines() if line.strip()]

    def files() -> dict[str, str]:
        return prepared

    app.router.routes.insert(0, APIRoute("/__e2e/control", set_control, methods=["POST"]))
    app.router.routes.insert(0, APIRoute("/__e2e/calls", calls, methods=["GET"]))
    app.router.routes.insert(0, APIRoute("/__e2e/files", files, methods=["GET"]))
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

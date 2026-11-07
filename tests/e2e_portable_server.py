"""Nodestro for the browser test of a real portable package build (e2e/portable.mjs).

Usage: python tests/e2e_portable_server.py --data-dir DIR [--port 8087]

The build is real (nodestro_api.portable_build): uv downloads Python and wheels for this computer's platform into
``<data>/export-cache``. Set E2E_EXPORT_CACHE to a folder that outlives the run, and the cache is linked there, so a
second run builds from the cache without downloads (as the dialog's summary then says). Models are scripted and never
called: the workflow the suite publishes takes a branch without an agent.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from e2e_defaults import keep_cloud_defaults
from nodestro_runtime.testing import ScriptedClient
import uvicorn

from nodestro_studio.app import create_app, studio_config


def link_cache(data_dir: Path) -> None:
    """``<data>/export-cache`` points to E2E_EXPORT_CACHE when it is set (created if needed)."""
    shared = os.environ.get("E2E_EXPORT_CACHE", "").strip()
    if not shared:
        return
    target = Path(shared).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)
    cache = data_dir / "export-cache"
    if not cache.exists():
        cache.symlink_to(target, target_is_directory=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8087)
    args = parser.parse_args()
    data_dir = Path(args.data_dir)
    link_cache(data_dir)
    client = ScriptedClient({})
    app = create_app(studio_config(data_dir), client_factory=lambda _provider: client)
    keep_cloud_defaults(app)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

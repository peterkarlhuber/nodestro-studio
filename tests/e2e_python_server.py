"""Nodestro with a fake package index, for the browser test of the Python libraries.

Usage: python tests/e2e_python_server.py --data-dir DIR [--port 8020]

Packages come from :class:`conftest.FakeUv` (real virtual environments, modules written as
files), and installing pauses briefly so the browser can watch the progress. Agents answer from
a script. Nothing reaches PyPI or the API, and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import time
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from nodestro_runtime.testing import FakeUv, ScriptedClient, text, tool_use
import uvicorn

from nodestro_studio.app import create_app, studio_config

STATS = "tinystats\nimport tinycore\n\ndef spread(values):\n    return tinycore.span(values)\n"
INDEX: dict[str, list[tuple[str, list[str], str]]] = {
    "tinystats": [("1.0.0", ["tinycore>=1"], STATS), ("2.0.0", ["tinycore>=1"], STATS)],
    "tinycore": [("1.4.0", [], "tinycore\n\ndef span(values):\n    return max(values) - min(values)\n")],
}


class SlowUv(FakeUv):
    def sync(self, interpreter: Path, lock: str, *, log: Any) -> None:
        log("Resolved packages, installing …")
        time.sleep(1.2)
        super().sync(interpreter, lock, log=log)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8020)
    args = parser.parse_args()
    client = ScriptedClient({"SPREAD": [tool_use("spread", {"values": [1.0, 4.0]}), text("fertig")] * 5})
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client, python_runner=SlowUv(INDEX))
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

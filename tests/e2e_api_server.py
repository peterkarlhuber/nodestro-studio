"""Nodestro with a scripted model, for the browser test of published APIs and the export.

Usage: python tests/e2e_api_server.py --data-dir DIR [--port 8050]

Agents answer from a script chosen by a keyword in their system prompt, after a short pause so
the browser can watch a run progress. Nothing calls the model API and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import time
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from nodestro_runtime.testing import ScriptedClient, text
import uvicorn

from nodestro_studio.app import create_app, studio_config

DELAY = 0.3
REPEAT = 100


def slow(value: str) -> Any:
    def respond(_request: dict[str, Any]) -> Any:
        time.sleep(DELAY)
        return text(value)

    return respond


ANSWERS = {"WRITER": "## Angebot\n\nWir liefern 10 Stück bis Freitag."}


def script() -> dict[str, list[Any]]:
    return {key: [slow(value) for _ in range(REPEAT)] for key, value in ANSWERS.items()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8050)
    args = parser.parse_args()
    client = ScriptedClient(script())
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

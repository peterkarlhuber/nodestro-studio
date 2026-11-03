"""Nodestro with a scripted model, for the browser test of budget decisions (BUDGET-1).

Usage: python tests/e2e_budget_server.py --data-dir DIR [--port 8150]

Agents answer from a script chosen by a keyword in their system prompt (``BUDGETA``, ``BUDGETB``, ``BUDGETC``), so a
workflow with a tiny budget (e.g. 0.0001 USD) pauses before its first model request and waits for a person. Nothing
outside this computer is contacted and no key is needed; the answers come after a short pause so the browser can
watch the run continue.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import time
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from e2e_defaults import keep_cloud_defaults
from nodestro_runtime.testing import ScriptedClient, text
import uvicorn

from nodestro_studio.app import create_app, studio_config

DELAY = 0.3
REPEAT = 200


def slow(value: str) -> Any:
    def respond(_request: dict[str, Any]) -> Any:
        time.sleep(DELAY)
        return text(value)

    return respond


def script() -> dict[str, list[Any]]:
    return {
        "BUDGETA": [slow("Entwurf fertig.") for _ in range(REPEAT)],
        "BUDGETB": [slow("Geprüft und freigegeben.") for _ in range(REPEAT)],
        "BUDGETC": [slow("Kurz zusammengefasst.") for _ in range(REPEAT)],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8150)
    args = parser.parse_args()
    client = ScriptedClient(script())
    app = create_app(studio_config(Path(args.data_dir)), client_factory=lambda _provider: client)
    keep_cloud_defaults(app)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

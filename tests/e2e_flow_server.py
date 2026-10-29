"""Nodestro with a scripted model, for the browser test of decisions, approvals and automation.

Usage: python tests/e2e_flow_server.py --data-dir DIR [--port 8040]

Agents answer from a script chosen by a keyword in their system prompt: the classifier
always says ``complaint``, the other agents write a short text. Every answer comes after a
short pause, so the browser can watch runs, batches and test series progress. Nothing calls
the API and no key is needed.
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
# Enough answers for a few runs, a batch and a test series.
REPEAT = 300


def slow(value: str) -> Any:
    def respond(_request: dict[str, Any]) -> Any:
        time.sleep(DELAY)
        return text(value)

    return respond


ANSWERS = {
    "CLASSIFY": '{"category": "complaint", "priority": 2}',
    "COMPLAINTS": "Es tut uns leid. Wir ersetzen das Gerät kostenlos.",
    "GENERAL": "Danke für Ihre Nachricht.",
    "SUMMARY": "## Antwort\n\n- Kunde: zufrieden\n- Nächster Schritt: Versand",
}


def script() -> dict[str, list[Any]]:
    return {key: [slow(value) for _ in range(REPEAT)] for key, value in ANSWERS.items()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8040)
    args = parser.parse_args()
    client = ScriptedClient(script())
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

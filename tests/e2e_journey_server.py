"""Nodestro with a model that answers every request, for the journey baseline (UX-J).

Usage: python tests/e2e_journey_server.py --data-dir DIR [--port 8060]

Text agents answer with a fixed text, structured agents with a filled sample of their output model, and every
quality check passes (``AnswerAllClient``). So any example workflow runs to the end without a script. Nothing
calls a provider and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from nodestro_runtime.testing import AnswerAllClient
import uvicorn

from nodestro_studio.app import create_app, studio_config


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8060)
    args = parser.parse_args()
    client = AnswerAllClient()
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

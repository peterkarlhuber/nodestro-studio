"""Nodestro with a scripted model, for the browser test of the Workflow Architect.

Usage: python tests/e2e_architect_server.py --data-dir DIR [--port 8010]

Every request is answered from :mod:`architect_script` after a short pause, so the browser can
watch the progress. Nothing calls the API and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

from nodestro_runtime.testing import ScriptedClient
import uvicorn

from nodestro_studio.app import create_app, studio_config

from architect_script import (
    AGENT,
    AGENT_REVISION,
    ANALYST,
    CODER,
    PLANNER,
    REVISER_PLAN,
    agent_spec,
    analysis,
    create_plan,
    revise_plan,
    revision,
    slow,
    tool_proposal,
)

DELAY = 0.7
# Enough answers for several jobs; a cancelled job may use some of them.
REPEAT = 20


def script() -> dict[str, list[Any]]:
    # A revision of the created workflow: keep the SEO analysis, change the writer, add a critic.
    answers: dict[str, list[Any]] = {
        ANALYST: [analysis()],
        PLANNER: [create_plan()],
        REVISER_PLAN: [revise_plan("node_seo", "node_writer")],
        AGENT_REVISION: [revision()],
        AGENT: [agent_spec()],
        CODER: [tool_proposal()],
    }
    return {key: [slow(values[0], DELAY) for _ in range(REPEAT)] for key, values in answers.items()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8010)
    args = parser.parse_args()
    client = ScriptedClient(script())
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

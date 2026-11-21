"""Nodestro with conversations with own agents switched on, for the browser test of the conversation area.

Usage: python tests/e2e_conversations_server.py --data-dir DIR [--port 8083]

Sets ``NODESTRO_CONVERSATIONS=1`` for this process only (an isolated test instance; the switch stays off by default
in every other suite). Saves the agent template "Reiseberater" (system prompt TRAVELAGENT, a cloud model the scripted
client answers). Its first answer waits until the test releases it (``POST /api/e2e/release``), so the browser sees an
answer that is still being written; the next answers come at once, one of them names the file it was given.
Nothing outside this computer is contacted and no key is needed.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
import threading
from typing import Any

from e2e_defaults import keep_cloud_defaults

sys.path.insert(0, str(Path(__file__).parent))

AGENT = "TRAVELAGENT"
FIRST = "Vienna is the capital of Austria."
#: How long the first answer waits at most for the release (seconds); afterwards it answers anyway.
WAIT_S = 60

release = threading.Event()


def script() -> dict[str, list[Any]]:
    from nodestro_runtime.testing import text

    def first(_request: dict[str, Any]) -> Any:
        release.wait(WAIT_S)
        return text(FIRST)

    def about_files(request: dict[str, Any]) -> Any:
        seen = "plan.txt" in str(request.get("messages", ""))
        return text(f"I read your file: {'yes' if seen else 'no'}.")

    return {AGENT: [first, about_files, *[text("Noted.")] * 10]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8083)
    args = parser.parse_args()
    os.environ["NODESTRO_CONVERSATIONS"] = "1"  # this test instance only

    from nodestro_runtime.agent_templates import AgentTemplates
    from nodestro_runtime.schemas import DEFAULT_AGENT_MODEL, AgentConfig
    from nodestro_runtime.testing import ScriptedClient
    import uvicorn

    from nodestro_studio.app import create_app, studio_config

    client = ScriptedClient(script())
    app = create_app(studio_config(Path(args.data_dir)), client_factory=lambda _provider: client)
    keep_cloud_defaults(app)
    workspace = app.state.nodestro
    agent = AgentConfig(name="Reiseberater", system_prompt=f"{AGENT}: you plan trips.", model=DEFAULT_AGENT_MODEL)
    AgentTemplates(workspace.store).create(agent)

    def release_answer() -> dict[str, bool]:
        release.set()
        return {"released": True}

    # A test-only route, ahead of the studio's own routes (its page fallback would answer otherwise).
    app.add_api_route("/api/e2e/release", release_answer, methods=["POST"])
    app.router.routes[:] = app.router.routes[-1:] + app.router.routes[:-1]
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

"""Nodestro with per-call tool approvals switched on, for the browser test of the approval flow.

Usage: python tests/e2e_approvals_server.py --data-dir DIR [--port 8080] [--wait 20]

Sets ``NODESTRO_TOOL_APPROVALS=1`` for this process only (an isolated test instance; the switch stays off by default
everywhere else). It saves the user-authored tool ``send_message`` (no capability statement, so it counts as changing
data and reaching outside) and shortens the approval wait to ``--wait`` seconds so the timeout can be tested. The
agent whose system prompt contains APPROVALAGENT calls ``send_message`` with arguments that need careful display
(quotes, markup, umlauts, a line break), then answers. Nothing outside this computer is contacted and no key is needed.
"""

from __future__ import annotations

import argparse
from datetime import timedelta
import os
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

TOOL = "send_message"
ARGUMENTS = {"to": "kunde@example.org", "body": 'Grüße <b>"Angebot"</b> & Rabatt\nZeile 2'}

CODE = '''def send_message(to: str, body: str) -> str:
    """Send a message (test double: nothing is sent).

    Args:
        to: The recipient's address.
        body: The text of the message.

    Returns:
        A confirmation.
    """
    return f"sent to {to} ({len(body)} characters)"
'''

TESTS = '''from tool import send_message


def test_send_message():
    assert send_message("a@example.org", "hi") == "sent to a@example.org (2 characters)"
'''


def script() -> dict[str, list[Any]]:
    from nodestro_runtime.testing import text, tool_use

    turns: list[Any] = []
    for index in range(20):
        turns.append(tool_use(TOOL, ARGUMENTS, call_id=f"toolu_{index}"))
        turns.append(text(f"Done ({index})"))
    return {"APPROVALAGENT": turns}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--wait", type=float, default=20)
    args = parser.parse_args()
    os.environ["NODESTRO_TOOL_APPROVALS"] = "1"  # before the workspace opens: it reads the switch once

    from nodestro_runtime.testing import ScriptedClient
    from nodestro_runtime.tool_approvals import ToolApprovals, ToolGate, ToolPreGrants
    import uvicorn

    from nodestro_studio.app import create_app, studio_config

    client = ScriptedClient(script())
    app = create_app(studio_config(Path(args.data_dir)), client_factory=lambda _provider: client)
    workspace = app.state.nodestro
    assert workspace.runs.tool_gate is not None, "the switch did not turn the gate on"
    workspace.runs.tool_gate = ToolGate(
        ToolApprovals(workspace.store, wait=timedelta(seconds=args.wait), poll_seconds=0.2),
        pre_grants=ToolPreGrants(workspace.store).of_scope,
    )
    result, _ = workspace.tools.save_custom(CODE, TESTS, TOOL, trust=workspace.tools.editor_trust(TOOL, CODE))
    assert result.ok, result
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

"""Nodestro with conversations with own agents switched on, for the browser test of the conversation area.

Usage: python tests/e2e_conversations_server.py --data-dir DIR [--port 8083]

Sets ``NODESTRO_CONVERSATIONS=1`` for this process only (an isolated test instance; the switch stays off by default
in every other suite). Saves the agent template "Reiseberater" (system prompt TRAVELAGENT, a cloud model the scripted
client answers). Its first answer waits until the test releases it (``POST /api/e2e/release``), so the browser sees an
answer that is still being written; the next answers come at once, one of them names the file it was given.

Workflows as tools (N-20): also sets ``NODESTRO_WORKFLOW_TOOLS=1`` and ``NODESTRO_TOOL_APPROVALS=1`` for this process
only, saves the workflow "Quote" (a start form, an agent, an approval step and a Markdown result file), the agent
template "Accountant" that calls it in version 1 as the tool ``workflow_quote``, and "Clerk" without workflow tools
(the browser adds one in the agent library). Nothing outside this computer is contacted and no key is needed.
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
ACCOUNTANT = "ACCOUNTANT"
QUOTER = "QUOTER"
QUOTE_READY = "Your quote is ready."
FIRST = "Vienna is the capital of Austria."
#: How long the first answer waits at most for the release (seconds); afterwards it answers anyway.
WAIT_S = 60

release = threading.Event()


def script() -> dict[str, list[Any]]:
    from nodestro_runtime.testing import text, tool_use

    def first(_request: dict[str, Any]) -> Any:
        release.wait(WAIT_S)
        return text(FIRST)

    def about_files(request: dict[str, Any]) -> Any:
        seen = "plan.txt" in str(request.get("messages", ""))
        return text(f"I read your file: {'yes' if seen else 'no'}.")

    return {
        AGENT: [first, about_files, *[text("Noted.")] * 10],
        ACCOUNTANT: [tool_use("workflow_quote", {"customer": "ACME", "amount": 1200}), text(QUOTE_READY)] * 3,
        QUOTER: [text("Quote for ACME: 1200 EUR")] * 3,
    }


def quote_workflow() -> Any:
    """The "Quote" workflow: a start form (customer, amount), an agent, an approval step and a Markdown result file."""
    from nodestro_runtime.schemas import (
        AgentConfig,
        ApprovalConfig,
        Edge,
        InputField,
        Node,
        OutputNodeConfig,
        ResultFileSpec,
        StartConfig,
        WorkflowIn,
    )

    fields = [
        InputField(name="customer", label="Customer", required=True),
        InputField(name="amount", label="Amount", type="number", required=True),
    ]
    nodes = [
        Node(id="start", type="start", start=StartConfig(fields=fields)),
        Node(
            id="writer",
            type="agent",
            agent=AgentConfig(
                name="Quoter", system_prompt=QUOTER, task_template="Quote for {{form.customer}}: {{form.amount}}"
            ),
        ),
        Node(
            id="check",
            type="approval",
            label="Check the quote",
            approval=ApprovalConfig(instructions="Check the amount"),
        ),
        Node(id="out", type="output", output=OutputNodeConfig(files=[ResultFileSpec(format="md", name="quote")])),
    ]
    edges = [
        Edge(id="e1", source="start", target="writer"),
        Edge(id="e2", source="writer", target="check"),
        Edge(id="e3", source="check", target="out", source_handle="approved"),
    ]
    return WorkflowIn(name="Quote", description="Writes a quote for a customer.", nodes=nodes, edges=edges)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8083)
    args = parser.parse_args()
    os.environ["NODESTRO_CONVERSATIONS"] = "1"  # this test instance only
    os.environ["NODESTRO_WORKFLOW_TOOLS"] = "1"  # this test instance only (N-20)
    os.environ["NODESTRO_TOOL_APPROVALS"] = "1"  # a changing workflow tool is refused without the gate

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
    quote = workspace.save_workflow(quote_workflow())
    binding = workspace.runs.describe_workflow_tool(quote, 1, name="workflow_quote").binding
    accountant = AgentConfig(
        name="Accountant",
        system_prompt=f"{ACCOUNTANT}: you write quotes.",
        model=DEFAULT_AGENT_MODEL,
        workflow_tools=[binding],
    )
    AgentTemplates(workspace.store).create(accountant)
    clerk = AgentConfig(name="Clerk", system_prompt="CLERK: you file papers.", model=DEFAULT_AGENT_MODEL)
    AgentTemplates(workspace.store).create(clerk)

    def release_answer() -> dict[str, bool]:
        release.set()
        return {"released": True}

    # A test-only route, ahead of the studio's own routes (its page fallback would answer otherwise).
    app.add_api_route("/api/e2e/release", release_answer, methods=["POST"])
    app.router.routes[:] = app.router.routes[-1:] + app.router.routes[:-1]
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

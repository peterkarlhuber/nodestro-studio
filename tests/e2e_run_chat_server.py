"""Nodestro with an orchestrator, a nested team leader and slow teams, for the browser test of the live run chat.

Usage: python tests/e2e_run_chat_server.py --data-dir DIR [--port 8110]

Saves the teams "Langsam" and "Recherche" (one agent each; both wait until the test releases them), "Unterteam"
(its own orchestrator "Unterleitung" that delegates to Recherche) and the workflow "Teamleitung" whose
orchestrator "Leitung" runs Langsam and Unterteam in parallel (max_parallel 2). Its second decision finishes with
the answer "Beruecksichtigt: ja" when the person's instruction is in the decision prompt (between the guidance
markers), otherwise "Beruecksichtigt: nein". Questions about the run get a scripted text answer.

``POST /api/e2e/release`` (test only) lets the waiting teams finish; ``GET /api/e2e/calls`` lists the system
prompts the scripted model saw. Nothing outside this computer is contacted and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import threading
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

LEAD = "LEADBOSS"
SUB = "SUBBOSS"
ANSWER = "You answer a person's question about a workflow run"
INSTRUCTION = "Bitte nur eine kurze Antwort"
#: How long a team waits at most for the release (seconds); afterwards it finishes anyway.
WAIT_S = 120

release = threading.Event()


def edge(source: str, target: str) -> dict[str, Any]:
    return {"id": f"{source}-{target}", "source": source, "target": target}


def team(name: str, prompt: str) -> dict[str, Any]:
    return {
        "name": name,
        "description": f"Team {name}",
        "nodes": [
            {"id": "s", "type": "start", "position": {"x": 0, "y": 0}},
            {
                "id": "w",
                "type": "agent",
                "label": name,
                "position": {"x": 280, "y": 0},
                "agent": {"name": name, "system_prompt": prompt},
            },
        ],
        "edges": [edge("s", "w")],
    }


def led(name: str, label: str, instructions: str, members: list[str], *, parallel: int = 1) -> dict[str, Any]:
    return {
        "name": name,
        "description": f"Workflow {name} mit Orchestrator",
        "nodes": [
            {"id": "start", "type": "start", "position": {"x": 0, "y": 0}},
            {
                "id": "lead",
                "type": "orchestrator",
                "label": label,
                "position": {"x": 280, "y": 0},
                "orchestrator": {
                    "members": [{"workflow_id": member} for member in members],
                    "instructions": instructions,
                    "max_decisions": 6,
                    "max_parallel": parallel,
                },
            },
            {"id": "out", "type": "output", "position": {"x": 560, "y": 0}},
        ],
        "edges": [edge("start", "lead"), edge("lead", "out")],
    }


def user_text(request: dict[str, Any]) -> str:
    parts = []
    for message in request.get("messages", []):
        content = message["content"]
        if isinstance(content, str):
            parts.append(content)
        else:
            parts.extend(str(block.get("text", "")) for block in content if isinstance(block, dict))
    return "\n".join(parts)


def script(ids: dict[str, str]) -> dict[str, list[Any]]:
    from nodestro_runtime.testing import Parsed, text

    def decide(**values: Any) -> Any:
        def respond(request: dict[str, Any]) -> Any:
            fields = {key: value(ids) if callable(value) else value for key, value in values.items()}
            return Parsed(text("{}"), request["output_format"](**fields))

        return respond

    def finish_with_guidance(request: dict[str, Any]) -> Any:
        prompt = user_text(request)
        start, end = prompt.find("<<<guidance"), prompt.find("guidance>>>")
        found = 0 <= start < end and INSTRUCTION in prompt[start:end]
        answer = f"Beruecksichtigt: {'ja' if found else 'nein'}"
        return Parsed(text("{}"), request["output_format"](action="finish", answer=answer, reason="Teams fertig"))

    def slow(answer: str) -> Any:
        def respond(_request: dict[str, Any]) -> Any:
            release.wait(WAIT_S)
            return text(answer)

        return respond

    def reply(request: dict[str, Any]) -> Any:
        snapshot = "ja" if "<<<snapshot" in user_text(request) else "nein"
        return text(f"Zwei Teams arbeiten noch; die Leitung wartet auf sie. (Stand gelesen: {snapshot})")

    return {
        LEAD: [
            decide(
                action="parallel",
                members=lambda i: [i["slow"], i["sub"]],
                tasks=["Langsam arbeiten", "Unterteam leiten"],
                reason="Beides ist unabhängig",
            ),
            finish_with_guidance,
            # A second run (if a test starts one) finishes at once.
            decide(action="finish", answer="unused", reason="unused"),
        ],
        SUB: [
            decide(action="delegate", member=lambda i: i["research"], task="Fakten sammeln", reason="Recherche zuerst"),
            decide(action="finish", answer="Unterteam fertig", reason="Fakten da"),
        ],
        "SLOWTEAM": [slow("Langsames Ergebnis.")] * 3,
        "RESEARCHTEAM": [slow("Otter halten sich an den Pfoten fest.")] * 3,
        ANSWER: [reply] * 10,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8110)
    args = parser.parse_args()

    from nodestro_runtime.schemas import WorkflowIn
    from nodestro_runtime.testing import ScriptedClient
    import uvicorn

    from nodestro_studio.app import create_app, studio_config

    ids: dict[str, str] = {}
    client = ScriptedClient(script(ids))
    app = create_app(studio_config(Path(args.data_dir)), client_factory=lambda _provider: client)
    workspace = app.state.nodestro
    save = lambda item: workspace.save_workflow(WorkflowIn.model_validate(item))  # noqa: E731
    ids["slow"] = save(team("Langsam", "SLOWTEAM works slowly.")).id
    ids["research"] = save(team("Recherche", "RESEARCHTEAM finds facts.")).id
    ids["sub"] = save(led("Unterteam", "Unterleitung", SUB, [ids["research"]])).id
    save(led("Teamleitung", "Leitung", LEAD, [ids["slow"], ids["sub"]], parallel=2))

    def release_teams() -> dict[str, bool]:
        release.set()
        return {"released": True}

    def calls() -> list[str]:
        return [str(call.get("system", ""))[:80] for call in client.messages.calls]

    # Test-only routes, ahead of the studio's own routes (its page fallback would answer otherwise).
    app.add_api_route("/api/e2e/release", release_teams, methods=["POST"])
    app.add_api_route("/api/e2e/calls", calls, methods=["GET"])
    app.router.routes[:] = app.router.routes[-2:] + app.router.routes[:-2]
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

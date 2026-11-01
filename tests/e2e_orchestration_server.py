"""Nodestro with a dynamic orchestrator and three teams, for the browser test of orchestrated runs.

Usage: python tests/e2e_orchestration_server.py --data-dir DIR [--port 8100]

Saves the teams "Recherche", "Entwurf" (ends with an approval step that stops the orchestrator on a rejection) and
"Lektorat" (a start form with a ``tone`` choice) plus the workflow "Teamleitung" whose orchestrator assembles its
team at run time (staffing), may run two teams at once and may fill team parameters. The scripted orchestrator
answers two runs in order:

1. staff Recherche + Entwurf, run both in parallel (Entwurf waits for approval), after the approval staff Lektorat
   instead of Recherche, delegate to Lektorat with ``tone=formal``, finish;
2. staff Entwurf, delegate to it (waits for approval); the browser rejects, so the orchestrator stops.

Nothing outside this computer is contacted and no key is needed.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

BOSS = "You coordinate teams"


def edge(source: str, target: str) -> dict[str, Any]:
    return {"id": f"{source}-{target}", "source": source, "target": target}


def team(
    name: str, prompt: str, *, approval: bool = False, fields: list[dict[str, Any]] | None = None
) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = [
        {"id": "s", "type": "start", "position": {"x": 0, "y": 0}, **({"start": {"fields": fields}} if fields else {})},
        {
            "id": "w",
            "type": "agent",
            "label": name,
            "position": {"x": 280, "y": 0},
            "agent": {"name": name, "system_prompt": prompt},
        },
    ]
    edges = [edge("s", "w")]
    if approval:
        nodes.append(
            {
                "id": "ok",
                "type": "approval",
                "label": "Entwurf prüfen",
                "position": {"x": 560, "y": 0},
                "approval": {"on_reject": "stop"},
            }
        )
        edges.append(edge("w", "ok"))
    return {"name": name, "description": f"Team {name}", "nodes": nodes, "edges": edges}


def script(ids: dict[str, str]) -> dict[str, list[Any]]:
    from nodestro_runtime.testing import parsed, text

    def decide(**values: Any) -> Any:
        # The ids exist only once the teams are saved; the lambda reads them when the model answers.
        return parsed(
            lambda model: model(**{key: value(ids) if callable(value) else value for key, value in values.items()})
        )

    boss = [
        # run 1
        decide(action="staff", add=lambda i: [i["r"], i["d"]], reason="Recherche und Entwurf zuerst"),
        decide(
            action="parallel",
            members=lambda i: [i["r"], i["d"]],
            tasks=["Fakten zu Ottern", "Ersten Entwurf schreiben"],
            reason="Beides ist unabhängig",
        ),
        decide(action="staff", add=lambda i: [i["l"]], remove=lambda i: [i["r"]], reason="Jetzt nur noch glätten"),
        decide(
            action="delegate", member=lambda i: i["l"], task="Text glätten", values='{"tone": "formal"}', reason="Ton"
        ),
        decide(action="finish", answer="Fertiger Text über Otter", reason="Alles erledigt"),
        # run 2
        decide(action="staff", add=lambda i: [i["d"]], reason="Nur ein Entwurf"),
        decide(action="delegate", member=lambda i: i["d"], task="Entwurf schreiben", reason="Entwurf zuerst"),
        decide(action="finish", answer="unused", reason="unused"),
    ]
    return {
        BOSS: boss,
        "RESEARCHTEAM": [text("Otter halten sich an den Pfoten fest.")] * 4,
        "DRAFTTEAM": [text("Entwurf: Otter sind gesellig.")] * 4,
        "EDITTEAM": [text("Otter sind ausgesprochen gesellige Tiere.")] * 4,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8100)
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
    ids["r"] = save(team("Recherche", "RESEARCHTEAM finds facts.")).id
    ids["d"] = save(team("Entwurf", "DRAFTTEAM writes a draft.", approval=True)).id
    tone = [{"name": "tone", "label": "Ton", "type": "select", "options": ["formal", "locker"], "required": True}]
    ids["l"] = save(team("Lektorat", "EDITTEAM polishes the text.", fields=tone)).id
    save(
        {
            "name": "Teamleitung",
            "description": "Stellt das Team während des Laufs zusammen",
            "nodes": [
                {"id": "start", "type": "start", "position": {"x": 0, "y": 0}},
                {
                    "id": "lead",
                    "type": "orchestrator",
                    "label": "Leitung",
                    "position": {"x": 280, "y": 0},
                    "orchestrator": {
                        "members": [{"workflow_id": ids[key]} for key in ("r", "d", "l")],
                        "max_decisions": 8,
                        "max_parallel": 2,
                        "staffing": True,
                        "max_team": 2,
                        "allow_values": True,
                    },
                },
                {"id": "out", "type": "output", "position": {"x": 560, "y": 0}},
            ],
            "edges": [edge("start", "lead"), edge("lead", "out")],
        }
    )
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

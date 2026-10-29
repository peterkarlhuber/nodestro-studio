"""Nodestro with a scripted model, for the browser test of the Nodestro Assistant.

Usage: python tests/e2e_assistant_server.py --data-dir DIR [--port 8030]

The model decides from the conversation what to do, the way a real one would: look up the
documentation for a question about Nodestro, describe an attached workflow, propose a
handover when asked to implement something, write slowly (so the browser can cancel) and fail
once with a connection error (so the browser can retry). Nothing calls the API.
"""

from __future__ import annotations

import argparse
from collections.abc import Iterator
import json
from pathlib import Path
import re
import sys
import threading
from types import SimpleNamespace
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))

import anthropic
import httpx
from nodestro_runtime.testing import text, tool_use
import uvicorn

from nodestro_studio.app import create_app, studio_config

DELAY = 0.04
_HEADER = re.compile(r"<attached_object (\{.*?\})>")


def _field(item: Any, name: str) -> Any:
    return item.get(name) if isinstance(item, dict) else getattr(item, name, None)


def _blocks(content: Any) -> list[Any]:
    return [{"type": "text", "text": content}] if isinstance(content, str) else list(content or [])


def _last_question(messages: list[Any]) -> str:
    for item in reversed(messages):
        if _field(item, "role") != "user":
            continue
        texts = [
            _field(block, "text") or "" for block in _blocks(_field(item, "content")) if _field(block, "type") == "text"
        ]
        if texts:
            return "".join(texts)
    return ""


def _last_tool(messages: list[Any]) -> str | None:
    """The tool whose result the last message carries, if it is one."""
    if not messages or not any(
        _field(block, "type") == "tool_result" for block in _blocks(_field(messages[-1], "content"))
    ):
        return None
    for block in _blocks(_field(messages[-2], "content")) if len(messages) > 1 else []:
        if _field(block, "type") == "tool_use":
            return str(_field(block, "name"))
    return None


class _Stream:
    """Streams a scripted answer word by word, like the API."""

    def __init__(self, response: Any, *, delay: float = DELAY) -> None:
        self.response = response
        self.delay = delay

    def __enter__(self) -> _Stream:
        return self

    def __exit__(self, *exc: object) -> None:
        return None

    def __iter__(self) -> Iterator[SimpleNamespace]:
        usage = SimpleNamespace(
            input_tokens=1200, output_tokens=1, cache_read_input_tokens=0, cache_creation_input_tokens=0
        )
        yield SimpleNamespace(type="message_start", message=SimpleNamespace(model=self.response.model, usage=usage))
        for block in self.response.content:
            if block.type != "text":
                continue
            for word in re.findall(r"\S+\s*", block.text):
                threading.Event().wait(self.delay)
                yield SimpleNamespace(type="text", text=word)

    def get_final_message(self) -> Any:
        return self.response


class AssistantModel:
    """Plays the assistant's model from the conversation it receives."""

    def __init__(self) -> None:
        self.failed_once = False
        self.calls = 0

    def stream(self, **request: Any) -> _Stream:
        self.calls += 1
        messages = list(request.get("messages", []))
        question = _last_question(messages)
        tool = _last_tool(messages)
        # The user's own words come after the attached objects.
        lower = question.rsplit("The user's message:\n", 1)[-1].lower()
        headers = [json.loads(match) for match in _HEADER.findall(question)]

        if "judge" in lower:
            if tool is None:
                return _Stream(tool_use("search_docs", {"query": "Judge Qualitätsprüfung"}), delay=0)
            if tool == "search_docs":
                return _Stream(tool_use("read_docs", {"refs": ["agenten#qualitaet"]}, call_id="toolu_2"), delay=0)
            return _Stream(
                text(
                    "Die **Qualitätsprüfung** bewertet jedes Ergebnis eines Agenten mit einem zweiten Modell, "
                    "dem Judge:\n\n"
                    "| Schritt | Was passiert |\n| --- | --- |\n| 1 | Der Agent antwortet |\n"
                    "| 2 | Der Judge prüft das Kriterium |\n| 3 | Bei Bedarf überarbeitet der Agent |\n\n"
                    "Details: [Qualitätsprüfung](/docs/agenten#qualitaet)."
                )
            )
        if "umsetzen" in lower:
            if tool is None:
                attachment = next((item["attachment"] for item in headers if item["kind"] == "workflow"), "")
                return _Stream(
                    tool_use(
                        "propose_handover",
                        {
                            "target": "workflow_architect",
                            "instruction": "Füge vor dem Ergebnis einen Agenten hinzu, der den Text kritisch prüft.",
                            "attachment": attachment,
                        },
                    ),
                    delay=0,
                )
            return _Stream(
                text("Ich habe eine Übergabe an den Workflow-Architekten vorbereitet. Geändert wurde nichts.")
            )
        if "ausführlich" in lower:
            return _Stream(text(" ".join(f"Absatz{index}" for index in range(400))), delay=0.08)
        if "verbindung" in lower and not self.failed_once:
            self.failed_once = True
            raise anthropic.APIConnectionError(request=httpx.Request("POST", "https://api.anthropic.com/v1/messages"))
        if headers:
            described = "; ".join(f"{item['kind']} „{item['label']}“ ({item['version']})" for item in headers)
            return _Stream(text(f"Angehängt sehe ich: {described}. Ich habe nichts ausgeführt."))
        return _Stream(text(f"Antwort {self.calls}: Das steht so in der Dokumentation."))


class ScriptedClient:
    def __init__(self) -> None:
        self.messages = AssistantModel()
        self.beta = SimpleNamespace(messages=self.messages)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=8030)
    args = parser.parse_args()
    client = ScriptedClient()
    config = studio_config(Path(args.data_dir))
    app = create_app(config, client_factory=lambda _provider: client)
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()

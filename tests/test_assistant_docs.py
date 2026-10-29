"""The Nodestro Assistant with the studio's documentation (the chapters of the interface)."""

from __future__ import annotations

from collections.abc import Callable
import json
from pathlib import Path
import re
import time
from typing import Any

from fastapi.testclient import TestClient
from nodestro_runtime.testing import text, tool_use

from nodestro_studio.app import docs_dir

ASSISTANT = "You are the Nodestro Assistant"


def chat(client: TestClient) -> str:
    response = client.post("/api/assistant/conversations", json={})
    assert response.status_code == 201, response.text
    return str(response.json()["id"])


def wait(client: TestClient, conversation_id: str, timeout: float = 10) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        detail = client.get(f"/api/assistant/conversations/{conversation_id}").json()
        if not detail["streaming"]:
            return detail  # type: ignore[no-any-return]
        time.sleep(0.03)
    raise AssertionError("the assistant did not finish")


def send(client: TestClient, conversation_id: str, content: str, language: str = "de") -> dict[str, Any]:
    response = client.post(
        f"/api/assistant/conversations/{conversation_id}/messages", json={"content": content, "language": language}
    )
    assert response.status_code == 201, response.text
    return wait(client, conversation_id)


def requests_of(client: TestClient) -> list[dict[str, Any]]:
    return [call for call in client.fake.messages.calls if ASSISTANT in str(call.get("system"))]  # type: ignore[attr-defined]


def test_documentation_questions_read_sections_and_cite_them(make_app: Callable[..., TestClient]) -> None:
    client = make_app(
        {
            ASSISTANT: [
                tool_use("search_docs", {"query": "Judge Qualitätsprüfung"}, call_id="toolu_1"),
                tool_use("read_docs", {"refs": ["agenten#qualitaet"]}, call_id="toolu_2"),
                text("Ein Judge prüft das Ergebnis ([Qualitätsprüfung](/docs/agenten#qualitaet))."),
            ]
        }
    )
    conversation_id = chat(client)
    detail = send(client, conversation_id, "Wie funktioniert ein Judge-Agent?")
    answer = detail["history"][1]
    assert answer["status"] == "complete"
    assert [source["ref"] for source in answer["sources"]] == ["agenten#qualitaet"]
    assert answer["sources"][0]["link"] == "/docs/agenten#qualitaet"
    assert [step["kind"] for step in answer["steps"]] == [
        "generate",
        "docs_search",
        "generate",
        "docs_read",
        "generate",
    ]
    calls = requests_of(client)
    # The system prompt carries the table of contents of the German documentation, not every chapter.
    system = str(calls[0]["system"])
    assert "agenten#qualitaet" in system and "ki-architekt#ueberblick" in system
    assert len(system) < 20_000
    # The search found the section, and read_docs returned its full text.
    search_result = json.dumps(calls[1]["messages"][-1]["content"], ensure_ascii=False)
    assert "agenten#qualitaet" in search_result
    read_result = json.dumps(calls[2]["messages"][-1]["content"], ensure_ascii=False)
    assert "Link: /docs/agenten#qualitaet" in read_result


def test_the_documentation_index_reads_the_real_chapters_in_every_language() -> None:
    from nodestro_api.docs_index import DocsIndex

    docs = DocsIndex(docs_dir())
    assert docs.available
    assert docs.languages() == ["de", "en", "es", "fr", "it", "pt-BR"]
    german = {section.ref for chapter in docs.chapters("de") for section in chapter.sections}
    for language in docs.languages():
        refs = {section.ref for chapter in docs.chapters(language) for section in chapter.sections}
        assert refs == german, language
    # The chapter list matches the one the interface shows (frontend/src/docs/index.ts).
    source = (Path(__file__).parents[1] / "frontend/src/docs/index.ts").read_text(encoding="utf-8")
    shown = set(re.findall(r'\["([a-z-]+)", \w+\]', source))
    assert shown == {chapter.id for chapter in docs.chapters("en")}
    assert docs.search("judge", "en")[0].section.ref == "agenten#qualitaet"
    assert docs.search("Wie teste ich meinen Agenten?", "de")[0].section.ref == "agenten#agent-testen"
    assert docs.search("costs of a workflow", "en")[0].section.chapter in ("nutzung", "workflows")
    assert docs.search("dependencies libraries", "en")[0].section.chapter == "python-bibliotheken"
    assert docs.section("memory#arten", "fr") is not None and docs.section("memory#gibt-es-nicht", "fr") is None
    assert docs.search("the and of", "en") == []


def test_the_documentation_search_is_available_without_ai(make_app: Callable[..., TestClient]) -> None:
    client = make_app()
    hits = client.get("/api/assistant/docs/search", params={"q": "Knowledge Memory", "language": "en"}).json()
    assert hits and all(hit["link"].startswith("/docs/") for hit in hits)


def test_answers_follow_the_interface_language(make_app: Callable[..., TestClient]) -> None:
    client = make_app({ASSISTANT: [text("Bonjour"), text("Hola")]})
    conversation_id = chat(client)
    send(client, conversation_id, "Salut", language="fr")
    system = str(requests_of(client)[0]["system"])
    assert "write your answers in French" in system
    assert "Only if the user explicitly asks for another language" in system
    # The outline is the French documentation.
    from nodestro_api.docs_index import DocsIndex

    assert DocsIndex(docs_dir()).chapters("fr")[0].title in system
    send(client, conversation_id, "Hola", language="es")
    assert "write your answers in Spanish" in str(requests_of(client)[1]["system"])
    # Stored messages are never translated.
    history = client.get(f"/api/assistant/conversations/{conversation_id}").json()["history"]
    assert [m["content"] for m in history] == ["Salut", "Bonjour", "Hola", "Hola"]

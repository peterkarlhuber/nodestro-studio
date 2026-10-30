# Architektur

> Seit 0.2 ist Nodestro auf sechs Repositories verteilt (Runtime, API, Studio, SDK, Integrationen, Beispiele).
> Wie sie zusammenhängen, wie Versionen gepinnt werden und wie das Upgrade von 0.1 abläuft, steht in
> [PLATTFORM.md](PLATTFORM.md). Dieses Dokument beschreibt die Architektur innerhalb des laufenden Prozesses; die
> Modulnamen nennen das Paket, in dem ein Modul heute liegt.

Nodestro besteht aus einem einzigen lokalen Prozess. Ein FastAPI-Server stellt die REST-API und die gebaute
React-Oberfläche bereit, und `orkexa` übernimmt alles, was mit den KI-Anbietern zu tun hat. Nodestro nutzt den nativen,
anbieterunabhängigen `Agent` (`nodestro_runtime.providers` verwaltet Schlüssel, Endpunkte und Fähigkeiten).

```
Browser (React, React Flow)                                         nodestro-studio
   │  REST /api/*  ·  Server-Sent Events /api/runs/{id}/events
   ▼
FastAPI (nodestro_api.api) ──► Nodestro (nodestro_api.context)      nodestro-api
                                 │  Organisation, Assistenten, Architekt, Stapel, Zeitpläne,
                                 │  Veröffentlichen, Schlüssel, Netzwerk, Export, Sicherung
                                 ▼
                              Workspace (nodestro_runtime.workspace)  nodestro-runtime
                              ├─ Store            SQLite: Workflows, Läufe, Vorlagen, Einstellungen
                              ├─ RunManager       DAG-Engine, Live-Events, Budget, Abbruch
                              ├─ AgentBuilder     AgentConfig → orkexa.Agent
                              ├─ ToolLibrary      ToolRegistry, Sandbox, ToolBuilder
                              ├─ KnowledgeBase    SQLiteFileStore + SQLiteIndex (FTS5)
                              ├─ MemorySpaces     SQLiteMemory je Gedächtnis
                              ├─ ToolDrafts       KI-Tool-Entwürfe bis zur Freigabe
                              └─ Extensions       Tools und OCR aus Integrationen   ◄── nodestro-integrations
                                       │
                                       ▼
                              orkexa → Anthropic · OpenAI · Gemini · OpenAI-kompatibel/Ollama/vLLM
```

## Entscheidungen

| Thema | Entscheidung | Begründung |
| --- | --- | --- |
| Backend | Python 3.10+, FastAPI, uvicorn | Die Library ist Python. FastAPI liefert typisierte Endpunkte, OpenAPI und SSE ohne Zusatzdienste. |
| Persistenz | eine SQLite-Datei im Datenordner | Lokal, ohne Installation und transaktional. Die Library speichert Dateien, Index und Memory ohnehin in SQLite. |
| Agentenausführung | synchroner Orkexa-`Agent` in Worker-Threads | `refine()`, `ToolBuilder` und `AgentArchitect` sind synchron. Threads halten den Event-Loop für SSE frei, und unabhängige Agenten laufen parallel. |
| Live-Status | Server-Sent Events | Der Datenfluss geht nur in eine Richtung, die Verbindung wird automatisch neu aufgebaut, und es braucht keine WebSocket-Logik. |
| Frontend | React 19, TypeScript, Vite, React Flow, TanStack Query, zustand, CodeMirror | Das ist der verbreitetste Stack für Node-Editoren. React Flow bringt Zoom, Minimap und Ports mit, TanStack Query übernimmt Caching und Polling. |
| Auslieferung | Vite baut nach `src/nodestro_studio/static`, FastAPI liefert es aus | Ein Befehl (`nodestro`) und ein Port. Keine Node-Laufzeit im Betrieb. |
| Sicherheit | Bindung an `127.0.0.1`, eigene Tools nur in der Sandbox, Freigabe für KI-Tools | Nodestro ist kein SaaS, und fremder Code läuft nie im Serverprozess. |

## Workflow-Modell

Ein Workflow ist ein gerichteter azyklischer Graph aus sechs Knotenarten:

- **Start** liefert die Eingabe des Laufs (`{{run.input}}`), optional Dateien und optional ein Eingabeformular mit
  typisierten Feldern (`StartConfig.fields`, `{{form.<name>}}`, geprüft in `nodestro_runtime.forms`).
- **Agent** trägt eine vollständige `AgentConfig` (`nodestro_runtime.schemas`). Sie ist die serialisierbare Form aller
  `Agent`-Argumente (Modell als `anbieter:modell`) plus Nodestro-Ergänzungen: Wissen, Memory-Modus, Ausgabefelder, Qualitätsprüfung.
- **Entscheidung** wählt nach festen Regeln (`nodestro_runtime.conditions`) einen oder mehrere Zweige, ohne API-Aufruf.
- **Freigabe** pausiert den Lauf, bis eine Person freigibt oder ablehnt; Zweige `approved` und `rejected`.
- **Unterworkflow** führt einen anderen gespeicherten Workflow in fester oder neuester Version als eigenen,
  verknüpften Lauf aus; seine Kosten zählen im Budget des übergeordneten Laufs.
- **Ergebnis** sammelt die Ausgabe der verbundenen Agenten und schreibt auf Wunsch Ergebnisdateien
  (`nodestro_runtime.reports`).

Verbindungen aus Entscheidung und Freigabe nennen ihren Zweig in `Edge.source_handle`. Die Regeln des Datenflusses
(aktiv, übersprungen, blockiert, Zusammenführen) stehen in `nodestro_runtime.graph`.

Die Aufgabe eines Agenten ist eine Vorlage. `{{input}}` setzt alle Vorgänger ein, `{{run.input}}` die Workflow-Eingabe
und `{{Name}}` einen bestimmten Vorgänger. Vorgänger, die in der Vorlage nicht vorkommen, hängt Nodestro unter
„# Eingaben“ an, damit kein Ergebnis verloren geht.

## Ein Lauf

1. `POST /api/workflows/{id}/runs` prüft zuerst den Graphen und jede Agenten-Konfiguration und legt dann den Lauf an.
2. Der `RunManager` startet für jeden Knoten eine Coroutine. Sie wartet auf ihre Vorgänger und führt den Agenten in
   einem Thread aus. Ein Knoten, dessen Vorgänger gescheitert ist, ist blockiert; einer, zu dem kein gewählter Zweig
   führt, wird übersprungen. Andere Zweige laufen weiter. An einer Freigabe pausiert der Lauf und geht nach der
   Entscheidung an derselben Stelle weiter, auch nach einem Neustart.
3. Die Hooks des Agenten (`on_text`, `on_thinking`, `before_tool`, `after_tool`, `on_response`) erzeugen Events. Der
   Browser bekommt sie per SSE und aktualisiert Knoten, Panel und Kosten live.
4. Ein `BudgetTracker` pro Lauf zählt Tokens und Kosten aller Agenten und des Judges und bricht ab, sobald das Budget
   überschritten ist. Ein Abbruch durch dich setzt ein Event, das der nächste Hook prüft.
5. Ist die Qualitätsprüfung aktiv, läuft der Agent über `refine()` mit einem `Evaluator` als Judge.
6. Am Ende speichert Nodestro den Lauf mit Prompt, Text, Tool-Aufrufen, Ergebnis, Memory-Stand und Nutzung jedes
   Agenten.
7. Ein fehlgeschlagener Lauf lässt sich fortsetzen (`nodestro_runtime.resume`): Ein neuer, verknüpfter Lauf übernimmt
   Ergebnisse mit unverändertem Fingerabdruck ohne Kosten und führt den Rest erneut aus.

Stapelläufe (`nodestro_api.batches`), Testreihen (`nodestro_api.benchmarks`) und Zeitpläne (`nodestro_api.schedules`) starten
gewöhnliche Läufe über `nodestro_runtime.launcher.launch` mit eigenem `trigger`. Es gibt nur eine Engine; Budget, Freigaben
und Nutzung gelten für jeden Lauf gleich, und keine Kosten werden doppelt gezählt.

## Wissen und Memory

- Dateien liegen im `SQLiteFileStore`, Texte zusätzlich in Abschnitten im `SQLiteIndex` (FTS5). Ein Agent sieht über
  `ScopedFileStore` und `ScopedIndex` nur die ihm zugewiesenen Dateien.
- Für Wissen gibt es drei Modi:
  - **context**: Die Dateien stehen am Anfang des Gesprächs.
  - **on_demand**: Der Agent liest Dateien bei Bedarf per Tool.
  - **search**: Der Agent durchsucht den Index per Tool.
- Für Memory gibt es zwei Modi:
  - **run**: ein eigenes `EphemeralMemory` pro Agent und Lauf. Sein Stand wird mit dem Lauf gespeichert.
  - **persistent**: ein benannter `SQLiteMemory`-Namensraum, der Läufe überdauert und im Memory-Browser bearbeitbar ist.

## Tools

- **Eingebaut:** `calculator`, `current_datetime`, `days_between`, `text_statistics`. Sie laufen im Prozess.
- **Eigene Tools:** Python-Funktion plus Tests.
  - `check_tool_source` und `check_tool_tests` prüfen statisch.
  - Die Tests laufen in `SubprocessSandbox` oder `DockerSandbox`.
  - Aufgerufen wird das Tool später ebenfalls in der Sandbox.
- **Von der KI erstellt:** Ein `ToolBuilder` mit `CodingAgent` schreibt Code und Tests, bis die Tests bestehen
  (höchstens drei Versuche). Ein `CallbackApprover` wartet dann auf deine Entscheidung in der Oberfläche.

## Python-Bibliotheken

Tools dürfen Pakete von PyPI nutzen. Das Python von Nodestro bleibt dabei unverändert.

- **Erkennung** (`nodestro_runtime.python_deps`): `analyze()` liest Importe per AST und einen PEP-723-Kopf
  (`# /// script`). Standardbibliothek, `tool` und Laufzeitmodule brauchen nichts; bekannte Module werden auf
  Paketnamen abgebildet (`PIL` → `Pillow`). Unbekannte und dynamische Importe werden gemeldet, nie geraten.
- **Umgebungen** (`nodestro_runtime.python_envs`): je Scope (`workflow:<id>` oder `tool:<name>` für Tool-Tests) ein
  Dokument in `python_envs` mit Anforderungen, Lock (`uv pip compile --universal`), Freigaben und Verlauf, und ein
  venv unter `<data>/python/envs/`. `uv` kommt als Python-Paket mit; der Cache unter `<data>/python/cache` wird
  geteilt. Installiert wird in ein Staging-Verzeichnis, geprüft (Importe) und erst dann getauscht.
- **Freigabe:** `plan()` löst auf und zeigt neue und geänderte Pakete; `approve()` bindet die Freigaben an die
  Installations-ID (`<data>/python/installation-id`, nicht im Backup). Bestehende Locks dienen als Vorgabe beim
  Auflösen, daher gibt es keine stillen Upgrades.
- **Ausführung:** `SubprocessSandbox(python=<venv>/bin/python)` aus `orkexa`; `ToolBuilder.extra_imports`
  erlaubt die freigegebenen Module in der statischen Prüfung. Die Docker-Sandbox unterstützt keine Bibliotheken.
- **Einbindung:** `preflight()` meldet fehlende Freigaben, ein Lauf installiert eine freigegebene Umgebung bei
  Bedarf nach, Tool-Aufträge warten mit `awaiting_dependencies`, der Architekt sammelt nur. Export und Import tragen
  die Definition mit, eine neue Freigabe ist aber nötig. API unter `/api/python`.

## Workflow-Architekt

`nodestro_api.architect` entwirft einen ganzen Workflow aus einer Beschreibung oder überarbeitet einen bestehenden. Er ist
ein eigener Dienst neben der Ausführung und startet nie einen Lauf.

- **Ablauf je Auftrag** (ein Worker-Thread): Anforderungen analysieren (strukturierte Ausgabe, höchstens eine
  Rückfrage), Architektur planen, Ressourcen prüfen, Agenten konfigurieren (der bestehende `AgentArchitect`
  parallel je neuem Agenten, Vorlagen ohne KI-Aufruf), fehlende Tools entwerfen (`CodingAgent`, nur statisch
  geprüft), verbinden, validieren und präsentieren.
- **Validierung:** dieselbe `preflight()`-Prüfung wie vor einem Lauf. Erst korrigiert der Architekt deterministisch
  (Verbindungen, Platzhalter, Namen, Modelle), dann höchstens `architect_max_repairs`-mal mit der KI.
- **Fortschritt:** Jeder Schritt erzeugt Ereignisse (Phase, Protokoll mit Code und Parametern, Graph, Kosten), die
  per SSE unter `/api/architect/jobs/{id}/events` ankommen. Die Oberfläche übersetzt die Codes; es gibt keine
  geschätzten Fortschrittswerte.
- **Kosten:** Ein `BudgetTracker` je Auftrag hält beim Limit an. Alle Aufrufe landen einmal im Nutzungsprotokoll
  (Quelle `workflow_design`, Detail je Schritt).
- **Sicherheit:** Ein Entwurf ändert keinen gespeicherten Workflow. Überarbeitungen wendet der Editor als einen
  Undo-Schritt an; gespeichert wird erst beim Speichern, mit Versionsnotiz. Tool-Entwürfe (`ToolDrafts`) sind nicht
  registriert; `preflight()` meldet `config.tool_unapproved`, bis sie getestet und freigegeben sind.

## Nodestro Assistant

`nodestro_api.assistant` ist ein Chat für Fragen zur Bedienung und zu konkreten Objekten. Er nutzt nur vorhandene Teile:
das Assistenzmodell und den Schlüssel seines Anbieters aus den Einstellungen, den Orkexa-`Agent` für Streaming und Tool-Aufrufe, den
`Sanitizer` des Exports, `preflight()` und das Nutzungsprotokoll.

- **Wissen:** `nodestro_api.docs_index` liest die eingebaute Dokumentation (`frontend/src/docs/chapters`, im Wheel unter
  `nodestro/docs`) und durchsucht sie mit Schlüsselwörtern, ohne Vektordatenbank. Das Modell bekommt nur die
  Gliederung und holt Abschnitte gezielt mit den Tools `search_docs` und `read_docs`; gelesene Abschnitte werden als
  Quellen mit Link gespeichert.
- **Anhänge:** `nodestro_api.assistant_context` baut aus strukturierten Daten einen Snapshot je Objekt (Workflow, Agent,
  Tool, Memory, Wissen, Ausführung), maskiert Geheimnisse, kürzt große Texte nachvollziehbar und berechnet einen
  Fingerabdruck. Jede Nachricht speichert, mit welchen Snapshots sie gesendet wurde. *Kontext aktualisieren* legt
  einen neuen Snapshot an; alte Nachrichten verweisen weiter auf ihren. Ungespeicherte Editor-Stände kommen als
  `draft` mit, die Änderungserkennung für Entwürfe macht die Oberfläche per Fingerabdruck.
- **Vorschläge** der aktuellen Ansicht entstehen nur im Browser (`frontend/src/assistant/store.ts`) und werden erst
  mit einer ausdrücklichen Aktion angehängt.
- **Übergabe:** Das Tool `propose_handover` erzeugt nur eine Karte. Sie öffnet den Workflow-Architekten, den
  Agenten-Entwurf oder die Tool-Erstellung mit vorausgefüllter Beschreibung; gestartet wird dort durch den Nutzer.
- **Ablauf:** Je Antwort ein Thread; Ereignisse (Schritt, Text, Quelle, Übergabe, Nutzung) kommen per SSE unter
  `/api/assistant/conversations/{id}/messages/{mid}/events`. Abbrechen schließt den Stream; die bis dahin angefallenen
  Tokens werden geschätzt. Nach einem Neustart sind offene Antworten als unterbrochen markiert.
- **Speicher und Kosten:** Chats, Nachrichten und Snapshots liegen im SQLite-Store und im Backup. Jede Antwort ist
  genau ein Eintrag im Nutzungsprotokoll (Quelle `assistant`, mit Chat und Nachricht).

## Veröffentlichte APIs und Export

Ein Workflow wird ohne zweite Engine zur Web-API. Alles läuft über dieselbe `engine.py` wie im Studio.

- **Releases** (`nodestro_api.publishing`): *Veröffentlichen* friert die gespeicherte Workflow-Version als
  `ReleaseBundle` ein, mit den freigegebenen Tool-Quellen, den Unterworkflows in ihrer Version und den Python-Locks.
  Releases sind unveränderlich; eine Publication zeigt auf das aktive Release, Rollback setzt nur diesen Zeiger. Läufe
  speichern ihre `release_id`, auch beim Fortsetzen (`nodestro_runtime.resume` führt API-Läufe über den Serving-Kern fort).
- **Serving** (`nodestro_api.serving`): `ServingCore` prüft Schlüssel, Rechte, Limits und Idempotenz und startet Läufe
  über den normalen `RunManager` (Auslöser `api`). `build_router()` erzeugt die Routen unter
  `/api/published/{slug}` mit Schemas aus dem Eingabeformular, SSE mit `Last-Event-ID` und Fehlern im Format
  `{"error": {status, code, message, params}}`. Testläufe aus dem Studio gehen über `ServingCore.launch()` mit der
  Identität `studio`, also denselben Weg.
- **Schlüssel** (`nodestro_api.api_keys`): nur SHA-256 der Geheimnisse, Rechte und erlaubte Publications. Die Collections
  `api_keys` und `api_idempotency` sind lokal: Backups lassen sie aus, eine Wiederherstellung behält sie.
- **Netzwerk** (`nodestro_api.network`): Lokal antworten die Routen nur Loopback-Adressen (`lan.not_enabled`). Ein
  zweiter uvicorn-Server auf eigenem Port (Standard 8100, optional TLS) enthält nur die freigegebenen Publications
  und `/health`, nie die Studio-API. Er ist standardmäßig aus und wird nach einer Wiederherstellung abgeschaltet.
- **Export** (`nodestro_api.exporter`, `nodestro_api.standalone`): Die Laufzeitmodule werden aus ihren Importen bestimmt und
  Byte für Byte nach `app/workflow_runtime/` kopiert (Prüfsummen in `RUNTIME.json`). `standalone.create_app()` baut
  daraus dieselbe API ohne Studio. Das ZIP ist deterministisch; `orkexa` kommt als Git-Referenz oder
  mitgeliefert (MIT, mit Bestätigung). Wissen und Memory kommen nur bei ausdrücklicher Auswahl hinein, Schlüssel und
  Einstellungen nie.
- **Studio-Endpunkte** (`nodestro_api.api_publish`): Überblick, Prüfung, Veröffentlichen, Versionen, Schlüssel,
  Netzwerk, Testen, Export. Der optionale KI-Leitfaden (`nodestro_api.api_guide`) bekommt nur die erzeugte Doku, steht im
  Nutzungsprotokoll (Quelle `api_docs`) und kommt erst nach Übernahme in den Export.

## Sprachen

Die Oberfläche gibt es auf Deutsch, Englisch, Spanisch, Französisch, brasilianischem Portugiesisch und Italienisch.
Englisch ist die Rückfallsprache.

- **Texte:** i18next und react-i18next mit einer Datei je Sprache und Bereich unter
  `frontend/src/i18n/locales/<sprache>/<bereich>.json`. Alle Sprachen sind fest eingebaut, zur Laufzeit wird nichts
  übersetzt oder nachgeladen. Ein Test prüft, dass alle Sprachen dieselben Schlüssel haben, dass jeder im Code
  verwendete Schlüssel existiert und dass in Komponenten keine Sätze mehr fest stehen.
- **Wahl der Sprache:** Beim ersten Start entscheidet die Browsersprache, nicht unterstützte Sprachen fallen auf
  Englisch zurück. Eine Wahl unter *Einstellungen* gewinnt immer. Sie liegt im `localStorage` (`nodestro-language`)
  und zusätzlich in den Einstellungen des Backends. Umschalten rendert nur neu, es startet keinen Lauf und keine
  KI-Anfrage.
- **Zahlen und Daten** formatiert `Intl` in der gewählten Sprache. Kosten sind immer USD mit bis zu sechs
  Nachkommastellen.
- **Meldungen des Backends** (Fehler, Prüfergebnisse, Laufschritte) tragen einen stabilen Code mit Parametern und den
  englischen Originaltext (`nodestro_runtime.problems`). Die Oberfläche zeigt den Code in der gewählten Sprache und das
  Original unter *Technische Details*.
- **KI-Assistenten** (Agent Architect, Memory-Vorschlag, Nodestro Assistant) schreiben in der Oberflächensprache, außer der Nutzer
  verlangt ausdrücklich eine andere. Code, Bezeichner und JSON-Schlüssel bleiben englisch, erzeugte Tools ebenso.
  Bestehende Agenten, Prompts und Ergebnisse werden nie übersetzt, die Oberflächensprache ändert nicht, in welcher
  Sprache ein Agent antwortet.
- **Tools** behalten ihre englischen Metadaten für das Modell. Für eingebaute Tools zeigt die Oberfläche eine
  übersetzte Beschreibung.
- **Dokumentation:** `frontend/src/docs/chapters/<sprache>/<kapitel>.md`. Kapitel und Abschnitte haben in allen
  Sprachen dieselben IDs, damit Links aus den Hilfetexten überall passen. Die Dokumentation lädt erst beim ersten
  Aufruf.
- **Beispiel-Workflows** liegen als deklarative Vorlagen im Paket `nodestro_examples` (Repository `nodestro-examples`; Struktur in `templates/`, Texte je Sprache in `texts/<sprache>/`). Nichts wird automatisch angelegt: `POST /api/library/{id}/copy` erzeugt eine unabhängige Kopie in der gewählten Sprache, die Vorlage selbst ändert sich nie. Der Beispielteil des Doku-Kapitels „Beispiele“ wird mit `make example-docs` aus den Vorlagen erzeugt.
- **Prüfung im Browser:** `frontend/e2e/i18n.mjs` prüft Erkennung, Umschalten ohne Neuladen und ohne weitere
  Anfragen, das Speichern sowie alle Seiten in allen Sprachen auf abgeschnittene Texte und waagerechtes Scrollen.

## Verzeichnisse

```
src/nodestro_studio/    Studio-Anwendung: CLI `nodestro`, Auslieferung der Oberfläche und der Dokumentation
tests/                  pytest des Studios (Doku, CLI, Upgrade von 0.1) und die Server der Browser-Tests
platform/versions.json  die getesteten Commits aller Komponenten (siehe PLATTFORM.md)
frontend/src/api/       Typen und Client der REST-API
frontend/src/editor/    Canvas, Knoten, Inspector, Laufpanel, Editor-Zustand
frontend/src/architect/ Workflow-Architekt: Dialog, Fortschritt, Live-Graph, Prüfung, Diff
frontend/src/assistant/ Nodestro Assistant: Panel, Anhänge, Vorschläge, Übergaben
frontend/src/python/    Python-Bibliotheken: Status, Freigabe-Dialog, Wartung
frontend/src/runs/      Freigaben, Fortsetzen, Ergebnisdateien und Herkunft eines Laufs
frontend/src/publish/   Dialog „API & Export“: Veröffentlichen, Schlüssel, Netzwerk, Testen, Doku, Export
frontend/src/automation/ Dialoge für Stapelläufe, Testreihen und Kostenschätzung
frontend/src/pages/     Seiten der App
frontend/src/styles/    Midnight-Citron-Tokens und App-Styles
frontend/src/i18n/      Sprachwahl und Übersetzungen
frontend/src/docs/      Eingebaute Dokumentation je Sprache
frontend/e2e/           Playwright: Smoketest, Sprachen, Workflow-Architekt, Python-Bibliotheken, Assistant und
                        Ablauf (Entscheidung, Freigabe, Fortsetzen, Stapel, Testreihe, Zeitplan) und API & Export
```

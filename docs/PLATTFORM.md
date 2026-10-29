# Die Nodestro-Plattform

Seit Version 0.2 ist Nodestro auf sechs Repositories verteilt. Jedes hat eine klare Aufgabe, eigene Tests und eine
eigene CI. Zusammen ergeben sie dieselbe Anwendung wie Nodestro 0.1: derselbe Befehl `nodestro`, dieselben Daten in
`~/.nodestro`, dieselbe Oberfläche in sechs Sprachen im Design Midnight Citron, dieselben APIs und dieselben
24 Beispiele.

| Repository | Paket (Import) | Aufgabe |
| --- | --- | --- |
| [nodestro-runtime](https://github.com/peterkarlhuber/nodestro-runtime) | `nodestro-runtime` (`nodestro_runtime`) | Die Workflow-Engine ohne Server und Oberfläche: Schemas, Graph, Engine, Agentenbau auf Orkexa, Tools, Wissen, Memory, Dateien, Fortsetzen, Python-Umgebungen. Der `Workspace` bündelt alles für eine Datenablage. Erweiterungsvertrag für Integrationen. |
| [nodestro-api](https://github.com/peterkarlhuber/nodestro-api) | `nodestro-api` (`nodestro_api`) | Die HTTP-API (FastAPI): die Studio-REST-API unter `/api`, veröffentlichte Workflow-APIs mit Schlüsseln, LAN-Listener, Export als eigenständiges FastAPI-Projekt, Assistenten, Architekt, Stapel, Zeitpläne, Sicherungen. Befehl `nodestro-api`. OpenAPI-Vertrag in `openapi/nodestro-api.json`. |
| [nodestro-studio](https://github.com/peterkarlhuber/nodestro-studio) | `nodestro` (`nodestro_studio`) | Die Anwendung: React-Oberfläche, eingebaute Dokumentation, Befehl `nodestro`, Browser-Tests, Upgrade-Test und die Plattform-Pipeline. |
| [nodestro-sdk](https://github.com/peterkarlhuber/nodestro-sdk) | `nodestro-client` (`nodestro_client`), `@nodestro/client` | Clients für Python und TypeScript, aus dem OpenAPI-Vertrag generiert. Sie sprechen nur HTTP. |
| [nodestro-integrations](https://github.com/peterkarlhuber/nodestro-integrations) | `nodestro-integrations` (`nodestro_integrations`) | Erweiterungen über den Vertrag der Runtime. Heute: lokale OCR mit poppler und tesseract. |
| [nodestro-examples](https://github.com/peterkarlhuber/nodestro-examples) | `nodestro-examples` (`nodestro_examples`) | Die 24 Beispiel-Workflows in sechs Sprachen mit Beispieldateien und Testfällen. |

Das bisherige Repository `nodestro` bleibt unverändert als `nodestro-legacy` erhalten (Stand 15e2076, Version 0.1).

## Abhängigkeiten

```
                     nodestro-studio  (nodestro)
                    /       |        \          \
                   ▼        ▼         ▼          ▼
          nodestro-api   nodestro-integrations   (Oberfläche, Doku)
            /      \             |
           ▼        ▼            │
 nodestro-examples   │           │
           \         │           │
            ▼        ▼           ▼
              nodestro-runtime
                     │
                     ▼
     orkexa @ cbf6df3d6f727b96924f1ae66e60b469eeef58e6  (extern, unverändert)

 nodestro-sdk ──HTTP──► nodestro-api   (nur die Tests installieren die API)
```

Regeln, die `scripts/check_imports.py` in der Plattform-Pipeline prüft:

- Ein Paket importiert nie ein Paket, das über ihm steht. Die Runtime kennt weder API noch Studio, die API kennt
  das Studio nicht, Integrationen und Beispiele kennen nur die Runtime.
- Orkexa nutzen nur Runtime und API (die API für Assistenten, Architekt und Export). Es gibt keine zweite
  Agenten-Laufzeit und keine eigenen Anbieter-Adapter, Orkexa wird nicht kopiert.
- Nichts importiert `claude_agent` oder das alte Paket `nodestro`, und kein Paket hängt von `claude-agent` ab.

Die Runtime prüft ihre Seite zusätzlich in `tests/test_architecture.py`.

## Erweiterungsvertrag

Eine Integration ist ein Paket mit einem Einstiegspunkt der Gruppe `nodestro.integrations`, der eine
`nodestro_runtime.extensions.Integration` liefert (Vertrag `CONTRACT = 1`): Name, Version, optionale Tools für die
Tool-Bibliothek und optional eine OCR-Engine (`OcrEngine`-Protokoll: `available()`, `recognize(data, name)`).
`discover()` lädt alle installierten Integrationen. Lässt sich eine nicht laden, wird das protokolliert und sie
fehlt, die Runtime startet trotzdem. Eine Integration für einen anderen Vertrag lehnt die Runtime mit dem Fehler
`extension.contract` ab, statt sie halb zu nutzen. Das Studio installiert `nodestro-integrations` mit; die API
funktioniert auch ohne (dann ohne OCR, wie 0.1 ohne tesseract).

## Vertrauensgrenzen

- **Studio-API (`/api`)**: ohne Benutzerverwaltung und ohne eigene Schlüssel, deshalb standardmäßig nur auf
  `127.0.0.1`. Sie beantwortet nur Anfragen an `localhost`, Loopback-Adressen und die mit `--host` gewählte Adresse
  und nimmt Änderungen nur von ihren eigenen Seiten an (`nodestro_api.local_access`); so kann keine Webseite im
  Browser sie über DNS-Rebinding oder Cross-Site-Anfragen bedienen. `NODESTRO_ALLOWED_HOSTS` nennt weitere
  Hostnamen, etwa hinter einem Reverse Proxy.
- **Veröffentlichte APIs (`/api/published/...`)**: nur mit Nodestro-Schlüsseln (`ndk_...`, gespeichert als
  SHA-256), je Schlüssel auf Berechtigungen und Veröffentlichungen beschränkt; im Netz nur über den eigenen
  Listener, den der Benutzer ausdrücklich einschaltet.
- **Eigene Tools und KI-generierter Code** laufen nie im Prozess des Servers: standardmäßig in einem eigenen
  Python-Prozess mit Zeitlimit und den Rechten des Benutzers (keine Isolation), mit der Einstellung „Docker“ in einem
  Container. Anbieter-Schlüssel erscheinen weder in Antworten noch in Exporten.

## Versionen und Pins

- **Alle Komponenten haben dieselbe Version** (0.2.0). Eine Plattform-Version ist die Menge der Commits in
  [`platform/versions.json`](../platform/versions.json), die gemeinsam getestet wurden.
- **Jeder Verweis auf ein anderes Repository ist ein vollständiger Commit-SHA**, nie ein Branch und kein Tag:
  `nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@<sha>`. Orkexa bleibt auf
  `cbf6df3d6f727b96924f1ae66e60b469eeef58e6` (Orkexa hat keine Tags).
- **Jede Komponente pinnt nur ihre direkten Abhängigkeiten**, das Studio pinnt alle. pip bricht ab, wenn zwei Pins
  derselben Komponente verschieden sind; `scripts/check_versions.py` prüft das schon vorher und meldet genau, welcher
  Pin abweicht.
- **Merge mit Merge-Commit**, nicht Squash: Die gepinnten Commits stammen aus den Pull-Request-Branches und bleiben so
  auf `master` erreichbar. Nach einem Squash-Merge müssen die Pins auf die neuen Commits nachgezogen werden.

### Eine Komponente ändern

1. Änderung im Repository der Komponente, mit Tests, Merge.
2. In jedem Repository, das sie pinnt, den SHA aktualisieren (von unten nach oben: Runtime → Beispiele und
   Integrationen → API → Studio und SDK-Tests).
3. Im Studio `platform/versions.json` nachziehen. `python scripts/check_versions.py` muss „pins agree“ melden.
4. Die Plattform-Pipeline im Studio testet die neue Kombination als Ganzes.

Ändert sich der API-Vertrag, schreibt `python -m nodestro_api.openapi openapi/nodestro-api.json` die neue Datei (ein
Test in nodestro-api schlägt sonst fehl). Im SDK übernimmt `make contract` sie und erzeugt die Typen neu; die CI des
SDK prüft, dass Vertrag und Typen aktuell sind.

## CI und Zugriff

Alle Repositories und Orkexa sind privat. Jede CI richtet zuerst den Lesezugriff mit dem vorhandenen
Repository-Secret `NODESTRO_READ` ein (ein Token mit „Contents: Read“ auf `orkexa` und die `nodestro-*`-Repositories)
und bricht mit einer klaren Meldung ab, wenn es fehlt. Das Secret erscheint nie im Code, in Logs oder Artefakten.
`nodestro-legacy` behält seine CI mit `ORKEXA_TOKEN` unverändert.

| Repository | CI |
| --- | --- |
| runtime, examples, integrations, api | Python 3.10 und 3.13: ruff, ruff format, mypy (strict), pytest; Wheel bauen und in eine leere Umgebung installieren |
| integrations | zusätzlich echte OCR mit tesseract und poppler |
| api | zusätzlich OpenAPI-Vertrag und Export (der exportierte Workflow besteht seine eigenen Tests) |
| sdk | Python: ruff, mypy, pytest gegen einen echten Nodestro-Server mit simulierten Modellen, Vertrag und generierte Typen aktuell, Client ohne API installierbar; TypeScript: typecheck, vitest gegen denselben Server, Build und `npm pack` |
| studio | Backend (Python 3.10/3.13), Frontend (lint, typecheck, vitest, build), alle sieben Browser-Suiten |
| studio, `platform.yml` | Plattform-Pipeline, siehe unten |

Kein Test ruft einen kostenpflichtigen Anbieter auf. Alle Modellantworten kommen aus Skripten
(`nodestro_runtime.testing.ScriptedClient`). Einzige Netz-Ausnahme bleibt der ausdrücklich markierte Test, der ein echtes Paket von
PyPI mit uv installiert (`NODESTRO_NETWORK_TESTS=1`, kostenlos).

## Plattform-Pipeline

`.github/workflows/platform.yml` im Studio läuft bei jedem Push und Pull Request, wöchentlich und auf Knopfdruck:

1. **Pins:** `scripts/check_versions.py` liest jede Komponente am gepinnten Commit und prüft alle Verweise gegen
   `platform/versions.json`.
2. **Integration:** Das Studio wird mit allen gepinnten Komponenten installiert. `scripts/check_imports.py` prüft die
   Abhängigkeitsrichtung. Danach laufen die Testsuiten von Runtime, Beispielen, Integrationen und API am gepinnten
   Commit gegen genau diese Installation, ebenso die Tests des Studios mit dem Upgrade-Test.
3. **SDK:** Python- und TypeScript-SDK am gepinnten Commit gegen die installierte API.
4. **Browser:** Die Oberfläche wird gebaut und alle sieben Browser-Suiten laufen gegen die installierte Plattform.

## Upgrade von Nodestro 0.1

In der Python-Umgebung, in der Nodestro 0.1 installiert ist:

```bash
git clone https://github.com/peterkarlhuber/nodestro-studio.git && cd nodestro-studio
(cd frontend && npm ci && npm run build)    # die Oberfläche gehört ins Paket
pip install -U .                            # oder -e . für die Entwicklung
nodestro
```

Die Distribution heißt weiterhin `nodestro`, ein Upgrade ersetzt 0.1 an Ort und Stelle. Der Befehl `nodestro` hat
dieselben Optionen (`--host`, `--port`, `--data-dir`, `--no-browser`, `--reload`) und dieselben Umgebungsvariablen
(`NODESTRO_PORT`, `NODESTRO_HOST`, `NODESTRO_DATA_DIR`, `.env`). Der Datenordner `~/.nodestro` und die SQLite-Datenbank
werden ohne Migration weiter genutzt: Workflows mit ihren Versionen, Läufe, wartende Freigaben, Vorlagen,
Einstellungen und Anbieter-Schlüssel, veröffentlichte APIs und ihre Schlüssel. Der Test
`tests/test_upgrade.py` öffnet dazu einen echten Datenordner von 0.1 (`tests/upgrade/legacy-0.1.zip`, erzeugt mit
`tests/upgrade/make_legacy_data.py` aus nodestro-legacy 15e2076) und prüft genau das.

Neu ist nur: Wer die API ohne Oberfläche betreiben will, installiert `nodestro-api` und startet `nodestro-api` mit
denselben Optionen (ohne `--no-browser`).

## Export

Der Export eines Workflows als eigenständiges FastAPI-Projekt arbeitet wie in 0.1, mit der Wahl zwischen Orkexa aus
Git (gepinnter Commit) und gebündeltem Orkexa. Die Laufzeit liegt im Projekt jetzt als die Pakete `nodestro_runtime/`
und `nodestro_api/` (nur die benötigten Module, byte-identisch kopiert). `RUNTIME.json` nennt Versionen, Commits und
SHA-256 jeder Datei. Ein exportiertes Projekt braucht keines der Nodestro-Repositories.

## Herkunft

Der Code stammt aus `peterkarlhuber/nodestro` am Commit 15e20768dea496820d4f8a286720176b47817da7 (Merge von PR #14).
Die Aufteilung hat Module verschoben und Importe umgeschrieben, aber kein Verhalten geändert, mit vier notwendigen
Entkopplungen: `Workspace` als Kern der Runtime (die API erweitert ihn), Fortsetzen veröffentlichter Läufe über das
Protokoll `PublishedRuns`, die OCR als Integration, und die API liefert keine Oberfläche mehr aus (das macht das
Studio). Die Zuordnung der Dateien steht in `PROVENANCE.md` jedes Repositories.

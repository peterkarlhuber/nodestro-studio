# API und Export

Ein fertiger Workflow lässt sich als Web-API nutzen: direkt aus Nodestro heraus auf diesem Computer, oder als eigenständiges FastAPI-Projekt, das du überall betreiben kannst. Beide Wege verwenden dieselbe Workflow-Logik wie Nodestro selbst. Nichts wird neu generiert, und eine KI schreibt keinen Ablauf um.

## Überblick {#ueberblick}
<!-- keywords: api, rest, http, endpunkt, veröffentlichen, bereitstellen, deployment, fastapi, export, schnittstelle, integration -->

Öffne einen Workflow im Editor und klicke **API & Export**. Der Dialog hat sechs Bereiche:

| Bereich | Wofür |
|---|---|
| **Überblick** | Status, Adressen, Veröffentlichen, Versionen und die letzten API-Läufe |
| **Schlüssel & Zugriff** | API-Schlüssel und der optionale Zugriff aus dem Netzwerk |
| **Testen** | Eine Anfrage prüfen oder einen echten Testlauf starten |
| **Dokumentation** | Endpunkte, Beispiele für curl und Python, OpenAPI-Beschreibung |
| **Limits** | Name in der Adresse, Beschreibung und Grenzen |
| **Export** | Das eigenständige FastAPI-Projekt als ZIP |

Es gibt zwei Wege:

1. **Direkt bereitstellen:** Nodestro beantwortet Anfragen unter `/api/published/<name>/…`. Standardmäßig nur von diesem Computer aus.
2. **Exportieren:** Nodestro erzeugt ein Projekt mit Laufzeit, Workflow-Version, Tests, Beispielen und README. Du betreibst es ohne Nodestro, etwa auf einem Server oder in Docker.

Beide Wege laufen Schritt für Schritt wie in Nodestro: dieselben Agenten, Tools, Verzweigungen, Freigaben und Formulare.

## Veröffentlichen {#veroeffentlichen}
<!-- keywords: veröffentlichen, publish, version, einfrieren, prüfung, check, speichern, notiz -->

**Veröffentlichen** friert die zuletzt gespeicherte Fassung des Workflows ein, zusammen mit:

- den Agenten mit Modell, Anweisungen und Einstellungen,
- dem Code der verwendeten Tools in der freigegebenen Fassung (siehe [Freigabe von Tools](/docs/tools#freigabe)),
- den Unterworkflows in ihrer aktuellen Fassung (siehe [Unterworkflows](/docs/verzweigungen#unterworkflow)),
- dem Eingabeformular, aus dem Nodestro das Schema der Anfrage erzeugt.

Vorher prüft Nodestro den Workflow. Fehler verhindern das Veröffentlichen, Warnungen (etwa fehlende Kostengrenze oder Freigabeschritte) zeigt der Dialog an. Ungespeicherte Änderungen werden nicht veröffentlicht: Speichere zuerst.

Jede Veröffentlichung bekommt eine fortlaufende Nummer und optional eine Notiz. Spätere Änderungen im Editor ändern eine veröffentlichte Version nie. Sie gelangen erst mit dem nächsten Veröffentlichen in die API.

## Versionen und Zurückrollen {#versionen}
<!-- keywords: version, versionen, rollback, zurückrollen, aktiv, aktive version, unveränderlich, release -->

Die Liste **Versionen** zeigt jede veröffentlichte Version mit Datum, Notiz und Prüfergebnis. Eine davon ist **aktiv**: Anfragen an `/runs` verwenden sie.

- **Aktiv machen** wechselt die aktive Version sofort, ohne neu zu veröffentlichen. So rollst du auf eine frühere Version zurück.
- Laufende Läufe behalten ihre Version bis zum Ende, auch beim Fortsetzen nach einem Fehler.
- Clients können eine bestimmte Version gezielt aufrufen: `POST /api/published/<name>/versions/<nummer>/runs`.

Veröffentlichte Versionen lassen sich nicht bearbeiten. Das macht Ergebnisse nachvollziehbar: Jeder API-Lauf zeigt, mit welcher Version er lief.

## Ausschalten und Löschen {#abschalten}
<!-- keywords: abschalten, ausschalten, deaktivieren, pausieren, 503, löschen, entfernen -->

**Ausschalten** lehnt neue Läufe mit dem Status `503` und dem Code `publication.disabled` ab. Laufende Läufe laufen weiter. Beim Ausschalten kannst du sie wahlweise abbrechen. Status und Ergebnisse bestehender Läufe bleiben abrufbar. **Einschalten** macht die API wieder verfügbar.

**API löschen** entfernt alle Versionen, und Schlüssel verlieren den Zugriff auf sie. Das geht nur, wenn kein Lauf dieser API mehr läuft. Die Läufe selbst bleiben unter Ausführungen erhalten. Wird der Workflow gelöscht, verschwindet auch seine API.

## Endpunkte {#endpunkte}
<!-- keywords: endpunkte, url, adresse, runs, status, ergebnis, result, events, cancel, abbrechen, approve, resume, versions, openapi -->

Den Namen in der URL (z. B. `rechnungen-pruefen`) legst du beim Veröffentlichen fest und änderst ihn unter **Limits**. Alle Pfade beginnen mit `/api/published/<name>`:

| Methode und Pfad | Wirkung | Recht |
|---|---|---|
| `GET /` | Was die API erwartet, liefert und welche Versionen es gibt | `read` |
| `POST /runs` | Startet einen Lauf mit der aktiven Version | `run` |
| `POST /versions/<nummer>/runs` | Startet einen Lauf mit einer bestimmten Version | `run` |
| `GET /runs` | Die letzten Läufe dieser API | `read` |
| `GET /runs/<id>` | Status, Schritte, Kosten und Freigaben eines Laufs | `read` |
| `GET /runs/<id>/result` | Das Ergebnis eines beendeten Laufs | `read` |
| `GET /runs/<id>/events` | Fortschritt als Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Bricht einen Lauf ab | `run` |
| `GET /runs/<id>/approvals` | Wartende Freigaben mit dem, was zu prüfen ist | `read` |
| `POST /runs/<id>/approve` | Entscheidet eine Freigabe | `approve` |
| `POST /runs/<id>/resume` | Setzt einen fehlgeschlagenen Lauf fort | `run` |
| `GET /runs/<id>/files` | Ergebnisdateien eines Laufs | `read` |
| `GET /usage` | Läufe, Tokens und Kosten dieser API | `read` |
| `GET /openapi.json` | OpenAPI-Beschreibung nur dieser API | – |

Die vollständigen Schemas siehst du unter **Dokumentation**. Dort lädst du mit **OpenAPI-Beschreibung herunterladen** auch die OpenAPI-Datei herunter.

## Anfragen und Antworten {#aufrufen}
<!-- keywords: anfrage, request, body, json, input, values, formular, schema, dateien, base64, antwort, 202, run_id, idempotency -->

Der Körper einer Anfrage ist JSON. Hat der Workflow ein Eingabeformular, stehen die Felder unter `values`, mit Typen, Pflichtfeldern und Auswahlwerten wie im Formular. Sonst gibt es ein Textfeld `input`. Dateien kommen als Liste `files` mit `name`, `media_type` und `content_base64`. Alternativ nimmt die API Dateien als `multipart/form-data` an, siehe [Dateien über die API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/rechnungen-pruefen/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"betrag": 120, "lieferant": "ACME"}}'
```

Nodestro antwortet sofort mit `202` und einer `run_id` samt Links zu Status, Ergebnis und Ereignissen. Der Lauf arbeitet im Hintergrund. Frag den Status ab, bis er `succeeded`, `failed` oder `cancelled` ist, und hole dann das Ergebnis. Weitere Zustände: `queued`, `running` und `awaiting_approval`.

Passt eine Anfrage nicht zum Schema, antwortet die API mit `422` und nennt jedes fehlerhafte Feld. Mit dem Kopf `Idempotency-Key` startet eine wiederholte Anfrage (etwa nach einem Netzwerkfehler) keinen zweiten Lauf, sondern liefert den ersten.

## Synchron warten und Ereignisse {#synchron}
<!-- keywords: synchron, sync, warten, wait, blockierend, sse, server-sent events, stream, live, reconnect, last-event-id -->

Standardmäßig ist jede API asynchron. Unter **Limits** kannst du **Warten auf das Ergebnis erlauben** einschalten. Dann wartet `POST /runs?wait=30` bis zu der eingestellten Zeit auf das Ergebnis. Ist der Lauf bis dahin nicht fertig, kommt wie gewohnt `202`. Für Workflows mit Freigabeschritten ist das nicht möglich, weil ein Mensch entscheiden muss.

`GET /runs/<id>/events` liefert den Fortschritt als Server-Sent Events: Schritte beginnen und enden, Text entsteht, Freigaben warten, der Lauf endet. Prompts und Tool-Daten bleiben in Nodestro. Bricht die Verbindung ab, verbindet sich der Client mit dem Kopf `Last-Event-ID` neu und bekommt nur die verpassten Ereignisse.

## Freigaben über die API {#freigaben}
<!-- keywords: freigabe, approval, genehmigen, ablehnen, approve, reject, warten, awaiting_approval, mensch, human in the loop -->

Erreicht ein Lauf einen Freigabeschritt, wechselt er auf `awaiting_approval`. Entscheiden kannst du an zwei Stellen, und es zählt die erste Entscheidung:

- in Nodestro auf der Seite Freigaben (siehe [Die Seite Freigaben](/docs/verzweigungen#freigaben-seite)), mit dem Hinweis „aus der veröffentlichten API“,
- über `POST /runs/<id>/approve` mit `{"decision": "approved"}` oder `"rejected"` und optional einem Kommentar. Das braucht einen Schlüssel mit dem Recht `approve`.

Wartende Freigaben überstehen einen Neustart von Nodestro. Ein fehlgeschlagener Lauf lässt sich mit `POST /runs/<id>/resume` fortsetzen. Erfolgreiche Schritte werden dabei wiederverwendet. Schritte, die Tools aufgerufen haben, laufen nur mit `confirm_side_effects: true` erneut.

## API-Schlüssel {#schluessel}
<!-- keywords: schlüssel, api key, token, bearer, authorization, x-api-key, rechte, scopes, run, read, approve, widerrufen, rotieren, hash -->

Jede Anfrage braucht einen Schlüssel, entweder als `Authorization: Bearer <schlüssel>` oder als Kopf `X-API-Key`. Schlüssel legst du unter **Schlüssel & Zugriff** an:

- **Name:** wer den Schlüssel benutzt, z. B. der Name der Anwendung.
- **Rechte:** `run` startet, bricht ab und setzt fort, `read` liest Status, Ergebnisse und Ereignisse, `approve` entscheidet Freigaben.
- **Gültig für:** die APIs, die der Schlüssel aufrufen darf. Andere Workflows und die Oberfläche von Nodestro erreicht er nie.

Der Schlüssel wird **genau einmal** angezeigt. Nodestro speichert nur einen Hash und erkennt den Schlüssel später an seinem Anfang (`ndk_…`). **Sofort widerrufen** sperrt einen Schlüssel. **Durch neuen Schlüssel ersetzen** erzeugt einen neuen Schlüssel mit denselben Einstellungen und widerruft den alten. Schlüssel erscheinen nie in Protokollen, Traces, Backups oder Exporten. Nach vielen falschen Schlüsseln in kurzer Zeit antwortet die API vorübergehend mit `429`.

## Zugriff aus dem Netzwerk {#netzwerk}
<!-- keywords: netzwerk, lan, port, 8100, 0.0.0.0, andere geräte, tls, https, zertifikat, firewall, freigeben -->

Standardmäßig antworten veröffentlichte APIs nur diesem Computer. Andere Geräte bekommen `403` mit dem Code `lan.not_enabled`. Um Geräte in deinem Netzwerk zuzulassen:

1. Öffne **Schlüssel & Zugriff → Netzwerkeinstellungen** und schalte den Netzwerkzugriff ein. Nodestro öffnet einen **eigenen Port** (Standard `8100`).
2. Schalte bei jeder API **Im Netzwerk erreichbar** ein. Nur diese APIs sind über den Port erreichbar.

Über diesen Port ist nur die veröffentlichte API erreichbar, nie die Oberfläche von Nodestro, seine Einstellungen oder andere Workflows. Ist der Port belegt, zeigt der Dialog das an und Nodestro läuft normal weiter. Nach dem Wiederherstellen eines Backups ist der Netzwerkzugriff wieder aus.

## Sicherheit {#sicherheit}
<!-- keywords: sicherheit, tls, https, verschlüsselung, internet, reverse proxy, zertifikat, backup, geheimnisse -->

- Ohne TLS gehen Anfragen, Schlüssel und Ergebnisse **unverschlüsselt** durchs Netzwerk. Nutze den Netzwerkzugriff nur in Netzen, denen du vertraust, oder hinterlege ein Zertifikat und seinen Schlüssel (Dateipfade auf diesem Computer).
- Stelle Nodestro nicht direkt ins Internet. Dafür ist der Export gedacht, hinter einem Reverse Proxy mit TLS.
- Jeder Lauf kostet Geld beim Modellanbieter. Gib Schlüssel mit dem Recht `run` nur weiter, wenn du den Grenzen der API vertraust.
- Backups enthalten keine API-Schlüssel (siehe [Backup und Wiederherstellung](/docs/einstellungen#backup)). Beim Wiederherstellen bleiben die Schlüssel dieses Computers erhalten.

## Grenzen {#grenzen}
<!-- keywords: grenzen, limits, rate limit, 429, gleichzeitig, budget, tagesbudget, kosten, upload, dateigröße -->

Unter **Limits** legst du fest, wie viel eine API genutzt werden darf:

| Grenze | Standard |
|---|---|
| Gleichzeitige Läufe | 2 |
| Auf Freigabe wartende Läufe | 20 |
| Neue Läufe pro Minute und Schlüssel | 10 |
| Anfragen pro Minute und Schlüssel | 120 |
| Tagesbudget (Kosten der letzten 24 Stunden) | 5 USD |
| Kostengrenze pro Lauf | Budget des Workflows |
| Größe einer hochgeladenen Datei | 10 MB |

Wird eine Grenze überschritten, antwortet die API mit `429` und einem Code wie `limit.concurrent` oder `limit.daily_budget`, bei Ratenlimits mit dem Kopf `Retry-After`. Die Kostengrenze pro Lauf ergänzt das [Budget des Workflows](/docs/workflows#budget).

## Fehlermeldungen {#fehler}
<!-- keywords: fehler, error, code, status, 401, 403, 404, 409, 422, 429, 503, maschinenlesbar -->

Jeder Fehler hat dieselbe Form, damit Programme ihn auswerten können:

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Status | Bedeutung |
|---|---|
| `401` | Schlüssel fehlt oder ist ungültig (`auth.missing`, `auth.invalid`) |
| `403` | Recht fehlt (`auth.scope`) oder Zugriff aus dem Netzwerk ist aus |
| `404` | API, Version, Lauf oder Datei gibt es nicht |
| `409` | Passt nicht zum Zustand, z. B. Ergebnis eines laufenden Laufs (`run.not_finished`) |
| `422` | Die Anfrage passt nicht zum Schema (`request.invalid`) |
| `429` | Eine Grenze ist erreicht (`limit.*`) |
| `503` | API abgeschaltet (`publication.disabled`) oder der Anbieter eines Modells ist nicht eingerichtet (`model.unavailable`) |

## Testen in Nodestro {#testen}
<!-- keywords: testen, ausprobieren, prüfen, validieren, dry run, testlauf, beispiel -->

Unter **Testen** steht eine Beispielanfrage, die du anpassen kannst:

- **Anfrage prüfen** validiert den Körper genau wie die API, zeigt die Eingabe, die der Workflow bekäme, und startet nichts. Es entstehen keine Kosten.
- **Testlauf starten** startet einen echten Lauf der veröffentlichten Version über denselben Weg wie die API. Er wird wie jeder Lauf abgerechnet und erscheint unter Ausführungen als Testlauf aus Nodestro.

Für Regressionstests einer neuen Version eignen sich [Testreihen](/docs/automatisierung#testreihen): Sie laufen mit der gespeicherten Fassung, bevor du veröffentlichst.

## Überwachung {#ueberwachung}
<!-- keywords: überwachung, monitoring, läufe, ausführungen, herkunft, nutzung, kosten, statistik, api-läufe -->

API-Läufe erscheinen unter Ausführungen mit dem Auslöser **API**. Die Detailansicht nennt Version und Schlüssel, mit dem der Lauf gestartet wurde. Auf der Seite Nutzung haben Läufe veröffentlichter APIs einen eigenen Posten (siehe [Die Seite Nutzung](/docs/nutzung#statistik)). Der Überblick im Dialog zeigt die letzten Läufe dieser API, und `GET /usage` liefert dieselben Zahlen an Programme.

## Export als FastAPI-Projekt {#export}
<!-- keywords: export, exportieren, zip, fastapi, projekt, eigenständig, docker, uvicorn, readme, tests, pyproject, lock, deployment, server -->

Unter **Export** erzeugst du mit **ZIP erzeugen** aus einer veröffentlichten Version ein eigenständiges Projekt. Es enthält:

| Teil | Inhalt |
|---|---|
| `app/` | FastAPI-Anwendung mit denselben Endpunkten, Konfiguration, Schlüsselverwaltung |
| `nodestro_runtime/`, `nodestro_api/` | Die Laufzeit von Nodestro (nodestro-runtime und die HTTP-Schicht aus nodestro-api), unverändert kopiert; Versionen und Prüfsummen in `RUNTIME.json` |
| `workflow/` | Die eingefrorene Version mit Agenten, Tools und Unterworkflows |
| `pyproject.toml`, `requirements.lock` | Abhängigkeiten mit genauen Versionen |
| `tests/`, `examples/` | Tests ohne Modellaufrufe, eine Beispielanfrage und ein Python-Client |
| `README.md`, `Dockerfile`, `.env.example` | Installation, Konfiguration und Betrieb |

Brauchen Tools Python-Bibliotheken, übernimmt der Export genau die freigegebenen Versionen (siehe [Freigabe von Bibliotheken](/docs/python-bibliotheken#freigabe)). Vor dem Erzeugen zeigt der Dialog jede Datei und jeden Hinweis. Der Export enthält nie API-Schlüssel, Einstellungen oder andere Workflows. Dieselbe Version mit denselben Optionen ergibt Byte für Byte dieselbe ZIP-Datei.

Im exportierten Projekt erzeugt `python -m app.keys new` Schlüssel für deine Clients. Die Zugänge der KI-Anbieter setzt du als Umgebungsvariablen, etwa `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` oder `GEMINI_API_KEY`; README und `.env.example` nennen genau die Variablen, die die Workflow-Version braucht. Basis-URLs eigener Server werden mitexportiert, außer sie enthalten Zugangsdaten; dann setzt du sie selbst (z. B. `OLLAMA_BASE_URL`).

## Die Bibliothek Orkexa {#orkexa}
<!-- keywords: orkexa, bibliothek, repository, lizenz, mit, vendor, mitliefern, git, zugriff -->

Nodestro führt Agenten mit der Bibliothek **Orkexa** aus, die alle unterstützten Anbieter anspricht. Sie ist nicht auf PyPI und liegt in einem Repository, das derzeit privat ist. Der Export bietet deshalb zwei Wege:

- **Git-Referenz** (Standard): `pyproject.toml` verweist auf den genauen Commit. Wer das Projekt installiert, braucht Lesezugriff auf das Repository.
- **Quellcode beilegen:** Der Quellcode kommt nach `vendor/orkexa/` und das Projekt installiert sich ohne Zugriff auf das Repository. Die Bibliothek steht unter der MIT-Lizenz. Bestätige, dass du sie weitergeben darfst, bevor du dieses Projekt anderen gibst.

Ohne eines von beiden lässt sich das Projekt nicht installieren. Das README nennt den gewählten Weg.

## Wissen und Memory im Export {#daten}
<!-- keywords: wissen, knowledge, memory, daten, datenschutz, vertraulich, mitnehmen, einschließen, ausschließen -->

Wissensdateien und dauerhaftes Memory können vertrauliche Inhalte haben. Sie kommen deshalb **nur ins Projekt, wenn du sie einzeln auswählst**:

- **Wissen** (siehe [Wissen](/docs/wissen#ueberblick)): Ausgewählte Dateien werden mit ihrem Inhalt kopiert. Nicht ausgewählte fehlen, und die Agenten finden dort nichts.
- **Memory** (siehe [Dauerhaftes Memory](/docs/memory#dauerhaft)): Der aktuelle Inhalt eines ausgewählten Memory-Raums wird zum Startinhalt des Projekts. Danach entwickeln sich beide getrennt.

Die Prüfung vor dem Export listet, welche Agenten auf ausgelassene Daten zugreifen. Bei der direkten Bereitstellung nutzen API-Läufe das Wissen und Memory von Nodestro wie jeder andere Lauf.

## Integrationsleitfaden mit KI {#ki-anleitung}
<!-- keywords: ki, anleitung, guide, dokumentation, beschreibung, kosten, optional, prüfen, übernehmen, verwerfen -->

Standardmäßig entsteht der Export ohne KI und ohne Kosten: README und Beispiele kommen aus Vorlagen. Optional schreibt das Assistenzmodell aus der erzeugten Dokumentation einen Leitfaden in Prosa für die Nutzer deiner API (`docs/AI_GUIDE.md`). Dabei geht nur die Dokumentation der API an das Modell, keine Schlüssel und keine Daten. Das ist ein bezahlter Modellaufruf und erscheint auf der Seite Nutzung als „KI-Leitfaden für eine API“.

Der Leitfaden kommt erst nach deiner Prüfung in den Export: Lies ihn und klicke **Übernehmen** oder **Verwerfen**. Am Code und an den Endpunkten ändert er nichts.

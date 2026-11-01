# Einstellungen und Betrieb

Dieses Kapitel beschreibt alle Einstellungen, die Installation und den Start von Nodestro sowie die Tastenkürzel.

## KI-Anbieter {#anbieter}
<!-- keywords: api key, api-schlüssel, anbieter, provider, anthropic, openai, gemini, ollama, vllm, openai-kompatibel, basis-url, umgebungsvariable, .env, fähigkeiten -->

Nodestro führt Agenten über die Bibliothek Orkexa aus und arbeitet mit mehreren **KI-Anbietern** gleichzeitig: **Anthropic**, **OpenAI**, **Google Gemini** sowie eigenen Servern über einen **OpenAI-kompatiblen Endpunkt**, **Ollama** oder **vLLM**. Jeder Agent nutzt den Anbieter seines Modells. Ist dieser Anbieter nicht eingerichtet, startet der Lauf nicht; Nodestro weicht nie still auf einen anderen Anbieter aus. Fehlt der Anbieter des Standardmodells, erscheint oben rechts „KI-Anbieter einrichten“, oder „Standardmodell braucht …“, wenn schon ein anderer Anbieter eingerichtet ist.

Unter *Einstellungen → KI-Anbieter* hat jeder Anbieter einen eigenen Abschnitt:

- **Anthropic, OpenAI, Google Gemini:** API-Schlüssel eintragen und **Speichern**. Der Schlüssel liegt in der lokalen Datenbank, wird nie wieder angezeigt und nur an diesen Anbieter gesendet. **Entfernen** löscht ihn.
- **OpenAI-kompatibler Endpunkt, Ollama, vLLM:** die **Basis-URL** des Servers eintragen (z. B. `http://localhost:11434/v1` für Ollama) und **Endpunkt speichern**; ein API-Schlüssel ist optional. Der Anbieter gilt erst als eingerichtet, wenn eine Basis-URL gespeichert ist.
- **Was die Modelle können:** Für eigene Server gibst du an, ob ihre Modelle Tools, strukturierte Ausgabe, Bilder, PDF-Dokumente, Denkaufwand und weitere Fähigkeiten beherrschen. Nodestro nimmt nichts an: Eine Option, die ein Modell nicht kann oder deren Unterstützung unbekannt ist, meldet die Prüfung als Fehler, statt sie wegzulassen.
- **Verbindung testen** fragt beim Anbieter nur die Modellliste ab; das kostet nichts.
- **Erster Anbieter:** Speicherst du einen Schlüssel, während der Anbieter des Standardmodells noch nicht eingerichtet ist, nutzen neue Agenten ab jetzt ein Modell dieses Anbieters; eine Meldung sagt, welches. Das ändert nur die Einstellungen: Bestehende Workflows behalten ihre Modelle.

Schlüssel kannst du auch als **Umgebungsvariable** setzen, vor dem Start oder in einer **`.env`-Datei** im Ordner, in dem du `nodestro` startest. Umgebungsvariablen haben **Vorrang** vor gespeicherten Schlüsseln:

| Anbieter | Umgebungsvariable |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |
| OpenAI-kompatibel, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (optional) |

Ein Schlüssel aus früheren Versionen (damals nur für Anthropic) wird beim ersten Start automatisch zum Schlüssel von Anthropic in diesen Einstellungen.

## Modelle der Assistenten und Standardmodell {#modelle}
<!-- keywords: standardmodell, assistenzmodell, assistant model, default model, neue agenten -->

- **Standardmodell für neue Agenten:** Mit diesem Anbieter und Modell starten neue, leere Agenten (aus der Palette, in neuen Workflows und als leere Vorlage). Beim KI-Entwurf dient es als Ersatz, falls der Architekt ein nicht erlaubtes Modell vorschlägt. Bestehende Agenten bleiben unverändert.
- **Modell für die Assistenten:** Dieses Modell entwirft Agenten aus deiner Beschreibung, schreibt als Coding Agent Tools, schlägt Memory-Strukturen vor und beantwortet als [Nodestro Assistant](/docs/assistent) deine Fragen. Ein starkes Modell (Standard: Claude Opus 5.5 von Anthropic) liefert bessere Vorschläge. Der KI-Entwurf schlägt nur Modelle von Anbietern vor, die eingerichtet sind.

Beide Felder bestehen aus **Anbieter** und **Modell**. Das Modell wählst du aus der Liste oder tippst eine beliebige Modell-ID des Anbieters ein, zum Beispiel `gpt-5.5` bei OpenAI oder `llama3.1:8b` bei Ollama. Gespeichert wird es als `anbieter:modell` (etwa `openai:gpt-5.5`); ältere Angaben ohne Anbieter wie `claude-sonnet-5-5` gelten als Modelle von Anthropic.

Gehört das Standardmodell zu einem Anbieter, der nicht eingerichtet ist, während ein anderer eingerichtet ist, sagt ein Hinweis über der Modellwahl, dass neue Agenten und Beispielkopien damit nicht laufen können, und bietet das passende Modell des eingerichteten Anbieters an (*… verwenden*). Bestehende Workflows behalten ihre Modelle in jedem Fall.

Speichere Änderungen mit **Speichern** im Abschnitt *Modelle und Budget*.

## Standardbudget {#budget}
<!-- keywords: standardbudget, budget, limit, default budget -->

Das **Standardbudget pro Lauf** (anfangs 2 USD) gilt für alle Workflows ohne eigenes Budget. Leer bedeutet: kein Limit. Wie das Budget wirkt, steht unter [Budget pro Lauf](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: sandbox wählen, docker, python prozess, docker verfügbar -->

Hier wählst du, wo selbst geschriebene Tools laufen: **Python-Prozess** oder **Docker**. Die Änderung gilt sofort. Hinweise zeigen, ob Docker gefunden wurde und ob die **eingebaute Linux-Sandbox** aktiv ist; ist sie es nicht, steht der Grund dabei (zum Beispiel eine nicht getestete Linux-Distribution oder eine fehlende Kernel-Funktion). Ist Docker gewählt, aber nicht erreichbar, schlagen Tool-Tests und -Aufrufe fehl. Details stehen unter [Die Sandbox](/docs/tools#sandbox).

Von der KI erstellte Tools und Tools unbekannter Herkunft laufen nur isoliert: automatisch in der eingebauten Linux-Sandbox, sonst nur mit Docker; siehe [Vertrauen und Isolation](/docs/tools#vertrauen).

## Sprache {#sprache}
<!-- keywords: sprache, language, deutsch, englisch, spanisch, französisch, portugiesisch, italienisch, browsersprache, übersetzung, lokalisierung -->

Nodestro gibt es auf **Deutsch, Englisch, Spanisch, Französisch, Portugiesisch (Brasilien) und Italienisch**. Unter **Sprache der Oberfläche** wählst du eine davon oder **Automatisch (Browsersprache)**.

- **Erster Start:** Nodestro übernimmt die Sprache deines Browsers. Wird sie nicht unterstützt, erscheint Englisch.
- **Eigene Wahl:** Eine ausgewählte Sprache hat immer Vorrang und bleibt gespeichert, auch nach einem Neustart. Nodestro merkt sie sich im Browser und in den Einstellungen; ein anderer Browser übernimmt sie, solange er keine eigene Wahl hat.
- **Sofort wirksam:** Der Wechsel braucht keinen Neustart und startet weder einen Workflow noch einen KI-Aufruf.

Die Sprache betrifft nur die **Oberfläche**: Menüs, Hinweise, Fehlermeldungen, diese Dokumentation sowie Zahlen- und Datumsformate. Kosten werden immer in US-Dollar angezeigt, im Format der gewählten Sprache. Bei Fehlermeldungen des Servers kannst du unter **Technische Details** den Originaltext einsehen.

**Deine Inhalte bleiben unverändert.** Agenten, Prompts, Workflows, Tools, Wissen, Memory und Ergebnisse werden nie automatisch übersetzt. Ein bestehender Agent antwortet weiter in der Sprache seines Prompts, egal welche Oberflächensprache du wählst.

**KI-Assistenten:** Neue Entwürfe (Agenten, Memory-Strukturen) entstehen in der Oberflächensprache, solange du in deiner Beschreibung keine andere Sprache verlangst. Code, Bezeichner und JSON-Schlüssel bleiben immer Englisch.

## Darstellung {#darstellung}
<!-- keywords: theme, dunkel, hell, dark mode, light mode, farbschema, design, midnight citron -->

Oben rechts wechselst du zwischen **Dunkel** und **Hell**. Die Wahl wird im Browser gespeichert. Beide Varianten folgen dem Designsystem *Midnight Citron*. Auf schmalen Bildschirmen wird die Seitenleiste zu einer Symbolleiste.

## Backup und Wiederherstellung {#backup}
<!-- keywords: backup, sicherung, wiederherstellen, restore, export, zip, umzug, datensicherung -->

**Backup herunterladen** speichert alle Daten in einer ZIP-Datei: Workflows mit Versionen, Agenten-Vorlagen, eigene Tools, Wissensdateien, Memory, Ausführungen, Nutzungsdaten, Favoriten, Tags und Einstellungen. Die Datenbank wird dabei als konsistente Momentaufnahme gesichert, auch wenn gerade ein Lauf arbeitet.

Die **API-Schlüssel** der KI-Anbieter werden nie ins Backup geschrieben, ebenso wenig Basis-URLs mit Zugangsdaten. Beim Wiederherstellen bleiben die Schlüssel dieses Rechners erhalten.

**Aus Datei wiederherstellen** prüft die Datei zuerst vollständig: Format, Prüfsummen jeder Datei, die Datenbank und jeden gespeicherten Workflow und Lauf. Erst dann zeigt Nodestro, was das Backup enthält, im Vergleich zum aktuellen Stand. Ersetzt wird nur nach ausdrücklicher Bestätigung und nur, wenn kein Lauf aktiv ist. Vorher legt Nodestro automatisch eine Sicherung des aktuellen Stands an (`before-restore-….zip` im Ordner `backups` des Datenverzeichnisses); sie erscheint unter den Sicherungen auf diesem Rechner und lässt sich genauso wiederherstellen. Schlägt etwas fehl, bleiben die bisherigen Daten unverändert.

## Systemdiagnose {#diagnose}
<!-- keywords: diagnose, systemdiagnose, prüfen, fehler finden, verbindung, docker, sandbox, version, problem -->

**Diagnose starten** prüft, ob Nodestro auf diesem Rechner vollständig funktioniert, und zeigt für jeden Punkt **In Ordnung**, **Warnung** oder **Fehler** mit einer Erklärung und einem Lösungsvorschlag:

- Versionen von Nodestro, Orkexa, Python, SQLite und Betriebssystem
- Datenbank (lesbar, beschreibbar, unbeschädigt, Volltextsuche)
- Daten-, Tool- und Backup-Verzeichnis beschreibbar, freier Speicherplatz
- KI-Anbieter: welche eingerichtet sind und ob die Anbieter des Standard- und des Assistenzmodells dazugehören (ohne Schlüssel anzuzeigen)
- Docker und die Tool-Sandbox mit einem kleinen Testtool
- PDF-Unterstützung und die gebaute Oberfläche

Die Diagnose ist kostenlos und sendet nichts ins Internet. **Verbindung testen** fragt zusätzlich beim Anbieter des Standardmodells die Modellliste ab; im Abschnitt jedes Anbieters unter [KI-Anbieter](/docs/einstellungen#anbieter) testest du ihn einzeln. Das verbraucht keine Tokens und kostet nichts. API-Schlüssel und andere Zugangsdaten werden nie angezeigt.

## Installation und Start {#installation}
<!-- keywords: installation, start, kommandozeile, cli, port, host, data-dir, no-browser, reload, python, node -->

Voraussetzungen: Python 3.10 oder neuer und Node.js 20 oder neuer (nur zum Bauen der Oberfläche), optional Docker.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro startet unter `http://localhost:8000` und öffnet den Browser. Optionen des Befehls `nodestro`:

| Option | Umgebungsvariable | Bedeutung |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Adresse (Standard `127.0.0.1`). Nur Adressen dieses Rechners (`127.0.0.1`, `::1`, `localhost`) sind erlaubt, weil Nodestro noch keine Anmeldung hat |
| `--port` | `NODESTRO_PORT` | Port (Standard `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Datenverzeichnis (Standard `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Betriebsprofil (Standard `desktop`). `server` kann noch nicht gestartet werden |
| – | `NODESTRO_ALLOWED_HOSTS` | Weitere Namen dieses Rechners, unter denen Nodestro antwortet (kommagetrennt, z. B. `studio.localhost`). Andere Hostnamen, Änderungen von fremden Webseiten und von einem Proxy weitergeleitete Anfragen werden abgewiesen, damit keine Webseite im Browser Nodestro bedienen kann |
| `--no-browser` | – | Browser nicht automatisch öffnen |
| `--reload` | – | Bei Codeänderungen neu starten (Entwicklung) |

Beenden mit **Strg+C**. Laufende Läufe werden dabei abgebrochen.

> **Sicherheit:** Nodestro hat noch keine Benutzerverwaltung und antwortet deshalb nur diesem Rechner. `--host 0.0.0.0`, andere Netzwerkadressen oder Netzwerknamen in `NODESTRO_ALLOWED_HOSTS` brechen den Start ab, und Nodestro lässt sich nicht hinter einen Reverse Proxy stellen. Damit andere Geräte einen Workflow nutzen können, veröffentliche ihn als API: Veröffentlichte APIs nutzen API-Schlüssel und haben einen eigenen Netzwerkzugang (siehe *API und Export*).

## Nodestro auf einem Server {#server}
<!-- keywords: server, anmelden, anmeldung, abmelden, rolle, rollen, berechtigung, berechtigungen, arbeitsbereich, mandant, tenant, nur lesen, mitglieder, nodestro-server, sitzung abgelaufen -->

Nodestro Studio kann auch auf einem **Nodestro-Server** deiner Organisation laufen. Dann meldest du dich über den Anmeldedienst deiner Organisation an, und deine Daten liegen auf diesem Server statt auf deinem Rechner. In der Desktop-App und mit dem Befehl `nodestro` gibt es weder Anmeldung noch Rollen; dort gilt nichts von diesem Abschnitt.

**Anmelden und abmelden.** Öffnest du Nodestro, leitet der Server dich zur Anmeldung und danach zurück. Oben rechts steht dein Name mit deiner Rolle. Ein Klick öffnet dein Konto: Name, Rolle, **Arbeitsbereich**, deine Berechtigungen und **Abmelden**. Endet deine Sitzung, führt die nächste Aktion wieder zur Anmeldung und danach zurück zur selben Seite. Schlägt eine Anmeldung fehl (etwa weil sie zu lange gedauert hat), sagt ein Hinweis oben auf der Seite, was passiert ist, mit **Erneut anmelden**.

**Arbeitsbereiche.** Workflows, Läufe, Wissen und Einstellungen gehören zu einem Arbeitsbereich. Bist du Mitglied mehrerer Arbeitsbereiche, wechselst du in deinem Konto unter **Arbeitsbereich wechseln**; Nodestro lädt dann die Startseite des anderen Arbeitsbereichs. Die Einstellungen gelten für deinen aktuellen Arbeitsbereich auf diesem Server.

**Rollen und Berechtigungen.** Jede Rolle bringt feste Berechtigungen mit:

| Rolle | Berechtigungen |
|---|---|
| **Eigentümer** | Lesen, Bearbeiten, Ausführen, Verwalten |
| **Administrator** | Lesen, Bearbeiten, Ausführen, Verwalten |
| **Bearbeiter** | Lesen, Bearbeiten, Ausführen |
| **Ausführender** | Lesen, Ausführen |
| **Betrachter** | Lesen |

- **Lesen:** alles ansehen, auch Ausführungen und die Dokumentation.
- **Bearbeiten:** Workflows, Agenten-Vorlagen, Wissen und Memory anlegen und ändern.
- **Ausführen:** Workflows starten, Läufe abbrechen und fortsetzen, Freigaben entscheiden.
- **Verwalten:** Einstellungen, KI-Anbieter, verbundene Dienste, Regeln für Tool-Aufrufe, das Veröffentlichen von APIs und API-Schlüssel.
- **Installation verwalten** hat keine Rolle: Backup, Systemdiagnose und der Netzwerkzugang veröffentlichter APIs fehlen auf einem Server, darum kümmert sich der Betreiber.

**Was deine Rolle nicht darf, zeigt Nodestro vorher.** Solche Bedienelemente fehlen oder sind gesperrt, und daneben steht der Grund, etwa *Deine Rolle (Betrachter) darf das nicht: Dafür braucht es die Berechtigung „Bearbeiten“. Frag einen Administrator deines Nodestro-Servers.* Als **Betrachter** oder **Ausführender** steht oben auf jeder Seite ein Hinweis, dass du alles ansehen, aber nichts ändern (und als Betrachter nichts ausführen) kannst. Der Server prüft jede Anfrage trotzdem selbst.

**Mitglieder und Rollen** verwaltet der Betreiber des Servers mit der Kommandozeile `nodestro-server` (siehe Betriebshandbuch des Servers); in Nodestro Studio gibt es dafür keine Seite. Meldet die Anmeldung, dass dein Konto noch keinen Zugang hat, bitte eine Administratorin oder einen Administrator, dich hinzuzufügen.

**Daten.** Unten in der Seitenleiste steht statt *Lokal & privat* **Server deiner Organisation**: Deine Daten bleiben auf diesem Server und gehen nur an die KI-Anbieter, die dein Betreiber erlaubt. Um Sicherungen und die Installation kümmert sich der Betreiber. Aussagen wie „läuft nur auf deinem Rechner“ gelten nur für die Desktop-App und den Befehl `nodestro`.

## Tastenkürzel {#tastenkuerzel}
<!-- keywords: tastenkürzel, shortcuts, tastatur, keyboard, barrierefreiheit -->

<!-- widget: shortcuts -->

Außerdem gilt überall: **Tab** springt zum nächsten Bedienelement und zeigt dessen Erklärung, **Esc** schließt Dialoge und Erklärungen, **Enter** oder **Leertaste** löst Schaltflächen aus.

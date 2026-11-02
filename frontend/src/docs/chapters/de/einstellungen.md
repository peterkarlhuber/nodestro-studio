# Einstellungen und Betrieb

Dieses Kapitel beschreibt alle Einstellungen, die Installation und den Start von Nodestro sowie die Tastenkürzel.

## KI-Anbieter {#anbieter}
<!-- keywords: api key, api-schlüssel, anbieter, provider, anthropic, openai, gemini, ollama, vllm, openai-kompatibel, basis-url, umgebungsvariable, .env, fähigkeiten -->

Nodestro führt Agenten über die Bibliothek Orkexa aus und arbeitet mit mehreren **KI-Anbietern** gleichzeitig: **Anthropic**, **OpenAI**, **Google Gemini** sowie eigenen Servern über einen **OpenAI-kompatiblen Endpunkt**, **Ollama** oder **vLLM**. Jeder Agent nutzt den Anbieter seines Modells. Ist dieser Anbieter nicht eingerichtet, startet der Lauf nicht; Nodestro weicht nie still auf einen anderen Anbieter aus. Fehlt der Anbieter des Standardmodells, erscheint oben rechts „KI-Anbieter einrichten“, oder „Standardmodell braucht …“, wenn schon ein anderer Anbieter eingerichtet ist.

Unter *Einstellungen → KI-Anbieter* hat jeder Anbieter einen eigenen Abschnitt:

- **Anthropic, OpenAI, Google Gemini:** API-Schlüssel eintragen und **Speichern**. Der Schlüssel liegt in der lokalen Datenbank, wird nie wieder angezeigt und nur an diesen Anbieter gesendet. **Entfernen** löscht ihn.
- **OpenAI-kompatibler Endpunkt, Ollama, vLLM:** die **Basis-URL** des Servers eintragen (z. B. `http://localhost:11434/v1` für Ollama) und **Endpunkt speichern**; ein API-Schlüssel ist optional. Der Anbieter gilt erst als eingerichtet, wenn eine Basis-URL gespeichert ist.
- **Amazon Bedrock (AWS):** kein API-Schlüssel; du wählst eine AWS-Region und wie sich Nodestro bei AWS anmeldet, siehe [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
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

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, region, iam, rolle, profil, sso, inferenzprofil, arn, eu, datenresidenz, nur eu, converse, aws_region, sts -->

**Amazon Bedrock** führt Claude, Amazon Nova und andere Modelle über dein eigenes **AWS-Konto** aus, in der **AWS-Region**, die du wählst; die Kosten erscheinen auf deiner AWS-Rechnung. Bedrock hat **kein Feld für einen API-Schlüssel**: Nodestro meldet sich mit AWS-Zugangsdaten an und speichert nie AWS-Zugriffsschlüssel. Eine IAM-Rolle oder ein AWS-Profil ist kein Schlüssel, sie sagt AWS nur, wer fragt.

**Anmeldung auf dem Desktop.** Unter *Einstellungen → KI-Anbieter → Amazon Bedrock (AWS)* wählst du:

- **AWS-Standard-Zugangsdaten (Umgebung, SSO, Instanzrolle):** was die AWS-Werkzeuge auf diesem Computer finden, etwa nach `aws sso login`, aus `AWS_*`-Umgebungsvariablen oder von einer Instanzrolle.
- **AWS-Profil:** ein benanntes Profil aus `~/.aws/config`; du gibst nur seinen **Namen** ein, die Zugangsdaten bleiben in deiner AWS-Konfiguration.

In Nodestro Local (einem Container) gibt es nur die Standard-Zugangsdaten.

**Anmeldung auf einem Server.** Die eigenen AWS-Zugangsdaten des Servers werden nie für einen Arbeitsbereich verwendet. Bedrock bleibt aus, bis der Betreiber dem Arbeitsbereich eine eigene **AWS-Rolle** zuweist; die Karte zeigt dann *Vom Betreiber zugewiesene Rolle*, und du kannst die Rolle weder sehen noch ändern. Ohne Rolle steht dort *nicht verfügbar*: Frage deinen Betreiber. Er kann auch die Regionen begrenzen und für alle Arbeitsbereiche die EU-Datenresidenz vorschreiben (siehe [Nodestro auf einem Server](/docs/einstellungen#server)).

**Region.** Gib die Region ein, an die Anfragen gehen und die AWS abrechnet, zum Beispiel `eu-central-1` (Frankfurt). Das Feld schlägt gängige Regionen vor und lehnt Namen ab, die keine AWS-Regionen sind. Das Modell muss für dein Konto in dieser Region aktiviert sein.

**Modell.** Wähle im Agenten den Anbieter *Amazon Bedrock (AWS)*. Die Liste zeigt **vorgeschlagene** Modelle (EU-Inferenzprofile von Claude und Amazon Nova); ein Vorschlag heißt nicht, dass das Modell für dein Konto aktiviert ist. Du kannst jede **Modell-ID** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **Inferenzprofil-ID** (`eu.anthropic.claude-sonnet-5-5`) oder **ARN** (etwa eines Anwendungs-Inferenzprofils) eingeben; sie wird als `bedrock:<id>` gespeichert und genau so weitergegeben, wie du sie eingibst, mit allen Doppelpunkten (siehe [Modell](/docs/agenten#modell)).

**EU-Datenresidenz („Nur EU“).** Ist der Schalter an, prüft Nodestro vor der ersten Anfrage, dass die Region und jede Region, an die das Modell oder Inferenzprofil weiterleiten kann, EU-Regionen sind (Frankfurt, Stockholm, Mailand, Spanien, Irland, Paris), und sendet sonst nichts. Globale Inferenzprofile (`global.…`) werden immer abgelehnt; London und Zürich liegen in Europa, aber nicht in der EU. Die Prüfung gilt der Konfiguration, mit der Nodestro Anfragen sendet. Sie **garantiert nicht**, dass AWS alles in der EU verarbeitet: Protokollierung der Modellaufrufe, Missbrauchserkennung mit ihrer Aufbewahrung und die übrigen Einstellungen deines AWS-Kontos liegen außerhalb von Nodestro. Kontoweit setzt du das mit IAM und Service Control Policies durch. Schreibt dein Betreiber „Nur EU“ vor, bleibt der Schalter an.

**Verbindung prüfen.** Der Knopf meldet sich bei AWS an (`sts:GetCallerIdentity`) und macht einen kostenlosen Lesezugriff auf Bedrock (eine Modellliste). **Es wird kein Modell aufgerufen, es entstehen also keine Kosten.** Danach zeigt das Abzeichen *Verbindung geprüft* oder *Prüfung fehlgeschlagen* mit dem Grund; vorher *Nicht eingerichtet* oder *Eingerichtet*.

**Minimale IAM-Berechtigungen** der Rolle oder des Benutzers:

- `bedrock:InvokeModel` und `bedrock:InvokeModelWithResponseStream` auf dem Modell oder Inferenzprofil (die Converse-API nutzt diese); bei einem Inferenzprofil auch auf dem Basismodell in jeder Zielregion;
- `bedrock:GetInferenceProfile` auf dem Profil (Prüfung „Nur EU“) und `bedrock:GetGuardrail`, wenn du einen Guardrail nutzt;
- `sts:GetCallerIdentity` und `bedrock:ListFoundationModels` für *Verbindung prüfen*.

**Preise.** Bedrock wird **je Region** abgerechnet, nie mit den Preisen von Anthropic, auch nicht für Claude. Ein Preis gilt nur für die Regionen, die er nennt; eine nicht genannte Region hat **unbekannte** Kosten, nie 0, und der strenge Preismodus lehnt die Anfrage dann ab. Eigene Preise mit ihren Regionen trägst du unter [Modellpreise](/docs/nutzung#preise) ein. Deine AWS-Rechnung kann mehr enthalten, als Nodestro zählt (etwa Aufruf-Protokollierung, Guardrails oder andere AWS-Dienste).

**Was Bedrock bietet.** Tools, Streaming, Bilder und PDF-Dokumente, strukturierte Ausgabe und Denkaufwand hängen vom Modell ab; Optionen, die ein Modell nicht unterstützt oder deren Unterstützung unbekannt ist (ein eingegebener ARN, ein Anwendungs-Inferenzprofil), zeigt Nodestro abgeschaltet mit dem Grund. **Auf Bedrock nicht verfügbar**, auch nicht für Claude: Server-Tools wie die Websuche, Denkmodi, die Prompt-Caching-Einstellungen von Anthropic, Ersatzmodelle, Batches und Zitate.

**Tools und AWS-Zugangsdaten.** Auf dem Desktop hält Nodestro AWS-Zugangsdaten von Tools fern (Umgebungsvariablen und Abfragen des AWS SDK). Tool-Code in der einfachen Subprozess-Sandbox läuft aber als dein Benutzer und könnte die Dateien in `~/.aws` direkt lesen. Liegen echte AWS-Zugangsdaten auf dem Rechner, führe eigene und KI-erzeugte Tools in der eingebauten Sandbox oder in Containern aus (siehe [Sandbox](/docs/einstellungen#sandbox)).

**Fehlerbehebung nach Meldung:**

| Meldung | Was tun |
|---|---|
| Es wurden keine AWS-Zugangsdaten gefunden | Anmelden (`aws sso login`), Profil oder Umgebung prüfen, dann *Verbindung prüfen*. |
| AWS hat die Zugangsdaten nicht akzeptiert | Sie sind falsch oder abgelaufen: neu anmelden. |
| AWS hat den Zugriff verweigert | Die Berechtigungen oben erteilen und das Modell in der AWS-Konsole aktivieren. |
| Das AWS-Profil … gibt es nicht | Den Profilnamen mit `~/.aws/config` vergleichen. |
| Kein AWS-Regionsname / ungültig | Einen Namen wie `eu-central-1` verwenden. |
| In dieser Region nicht bekannt | Eine Modell-ID oder ein Inferenzprofil dieser Region verwenden. |
| Nicht erreichbar | Netzwerk, Proxy und Region prüfen. |
| Könnte die EU-Datenresidenz verletzen | Eine EU-Region und ein `eu.`-Profil oder ein Modell dieser Region verwenden. |
| Auf diesem Server nicht verfügbar | Den Betreiber bitten, dem Arbeitsbereich eine AWS-Rolle zuzuweisen. |

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
<!-- keywords: sandbox wählen, automatisch, docker, python prozess, docker verfügbar, eingebaute sandbox, linux sandbox, macos, windows, gesperrt, experimentell -->

Hier wählst du, wo Tools laufen. Die Änderung gilt sofort.

| Modus | Eigene Tools | KI-erstellte Tools und Tools unbekannter Herkunft |
|---|---|---|
| **Automatisch** (Standard) | Python-Prozess | eingebaute Linux-Sandbox, wenn sie verfügbar ist, sonst Docker, solange es läuft, sonst **gesperrt** |
| **Python-Prozess** | Python-Prozess | nur die eingebaute Linux-Sandbox, sonst **gesperrt**; Docker wird nicht verwendet |
| **Docker** | Docker | Docker; läuft Docker nicht, läuft kein Tool |

Für KI-erstellten Code weicht Nodestro nie auf einen ungeschützten Prozess aus. Hast du nie einen Modus gewählt, verwendet Nodestro *Automatisch*; ein in einer früheren Version gewählter Modus bleibt erhalten.

Unter der Auswahl zeigt Nodestro:

- den **Computer, auf dem Nodestro läuft**, mit seinem Betriebssystem. Das ist der Computer der Nodestro-Laufzeit, nicht das Gerät deines Browsers: Öffnest du Nodestro auf einem Server von einem Mac aus, zählt das System des Servers;
- wo KI-erstellte und eigene Tools **jetzt** laufen, oder dass sie **gesperrt** sind und warum;
- jede **Sandbox auf diesem Computer** mit ihrem Status: *Freigegeben* (darf KI-erstellten Code ausführen), *Experimentell, nicht verwendet*, *Nicht verfügbar*, *Nicht isoliert* (der Python-Prozess) oder *Hier nicht verwendet*.

Die eingebaute Linux-Sandbox ist unter Ubuntu 24.04 und Debian 13 (64-Bit Intel oder AMD) freigegeben, sobald ihr Selbsttest bestanden ist. Unter macOS hat Nodestro eine **experimentelle** Sandbox: Sie ist umgesetzt und getestet, aber noch nicht unabhängig geprüft; Nodestro zeigt sie deshalb an und verwendet sie nicht. Unter Windows gibt es noch keine eigene Sandbox. Auf beiden Systemen brauchen KI-erstellte Tools daher Docker. Details stehen unter [Die Sandbox](/docs/tools#sandbox) und [Vertrauen und Isolation](/docs/tools#vertrauen).

Auf einem Server und in Nodestro Local Docker läuft jedes Tool in einem Container; die Einstellung lässt sich dort nicht ändern.

## Docker installieren {#sandbox-docker}
<!-- keywords: docker installieren, docker desktop, docker engine, macos, windows, linux, wsl, docker starten, docker läuft nicht -->

KI-erstellte Tools brauchen Docker unter macOS und Windows sowie auf Linux-Systemen, auf denen die eingebaute Sandbox nicht verfügbar ist. Nodestro braucht nur ein laufendes Docker; das Container-Image wird beim ersten Gebrauch automatisch gebaut.

- **macOS:** Installiere [Docker Desktop für Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple Silicon oder Intel), öffne es einmal und warte, bis es meldet, dass es läuft.
- **Windows:** Installiere [Docker Desktop für Windows](https://docs.docker.com/desktop/setup/install/windows-install/) mit dem WSL-2-Backend, starte bei Nachfrage neu und starte Docker Desktop.
- **Linux:** Installiere die [Docker Engine](https://docs.docker.com/engine/install/) für deine Distribution und erlaube deinem Benutzer den Zugriff (Gruppe `docker`), oder verwende Docker Desktop für Linux.

Öffne danach *Einstellungen → Sandbox*: Mit **Automatisch** verwendet Nodestro Docker, sobald es läuft; *Docker verfügbar* wird angezeigt und KI-erstellte Tools sind nicht mehr gesperrt. Stoppt Docker, sind sie wieder gesperrt, bis es läuft; Nodestro wechselt nicht zum Python-Prozess.

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

Oben rechts wechselst du zwischen **Dunkel** und **Hell**. Die Wahl wird im Browser gespeichert. Beide Varianten folgen dem Designsystem *Midnight Citron*. Auf schmalen Bildschirmen ist die Seitenleiste ausgeblendet: Die Menütaste oben links (**Alle Seiten zeigen**) öffnet sie als Bereich, **Esc** schließt ihn wieder.

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
<!-- keywords: server, anmelden, anmeldung, abmelden, rolle, rollen, berechtigung, berechtigungen, arbeitsbereich, mandant, tenant, nur lesen, mitglieder, nodestro-server, set-role, remove-member, revoke-sessions, sitzung abgelaufen -->

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

**Mitglieder und Rollen** verwaltet der Betreiber des Servers mit Befehlen der Kommandozeile `nodestro-server`; in Nodestro Studio gibt es dafür keine Seite:

- `nodestro-server members TENANT` listet die Mitglieder eines Arbeitsbereichs mit ihren Rollen.
- `nodestro-server set-role TENANT USER ROLE` fügt eine Person hinzu oder ändert ihre Rolle (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` entfernt eine Person aus dem Arbeitsbereich und beendet ihre Sitzungen dort.
- `nodestro-server revoke-sessions USER` beendet alle Sitzungen einer Person (die Mitgliedschaften bleiben).

`USER` ist eine Benutzer-ID (`u_…`), eine bestätigte E-Mail-Adresse oder die Kennung beim Anmeldedienst. Der Server kennt eine Person erst, wenn sie sich einmal angemeldet hat; ein Arbeitsbereich behält immer mindestens eine Eigentümerin oder einen Eigentümer. Details stehen im Runbook des Repositorys nodestro-server (`docs/RUNBOOK.md`, Abschnitt *Members*). Meldet die Anmeldung, dass dein Konto noch keinen Zugang hat, bitte eine Administratorin oder einen Administrator, dich hinzuzufügen.

**Daten.** Unten in der Seitenleiste steht statt *Lokal & privat* **Server deiner Organisation**: Deine Daten bleiben auf diesem Server und gehen nur an die KI-Anbieter, die dein Betreiber erlaubt. Um Sicherungen und die Installation kümmert sich der Betreiber. Aussagen wie „läuft nur auf deinem Rechner“ gelten nur für die Desktop-App und den Befehl `nodestro`.

## Tastenkürzel {#tastenkuerzel}
<!-- keywords: tastenkürzel, shortcuts, tastatur, keyboard, barrierefreiheit -->

<!-- widget: shortcuts -->

Außerdem gilt überall: **Tab** springt zum nächsten Bedienelement und zeigt dessen Erklärung, **Esc** schließt Dialoge und Erklärungen, **Enter** oder **Leertaste** löst Schaltflächen aus.

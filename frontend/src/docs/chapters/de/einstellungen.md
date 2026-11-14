# Einstellungen und Betrieb

Dieses Kapitel beschreibt alle Einstellungen, die Installation und den Start von Nodestro sowie die Tastenkürzel.

## Orientierung in den Einstellungen {#ueberblick}
<!-- keywords: einstellungen, zahnrad, einstellungen öffnen, einstellungen durchsuchen, einstellung finden, breite, breiter, größe ändern, navigation, erweitert, strg+komma -->

- **Öffnen:** das Zahnrad oben rechts auf jeder Seite oder *Strg+,* (*⌘,* auf dem Mac). Die Einstellungen merken sich, woher du kommst: **Zurück** über der Navigation (oder erneut *Strg+,*) bringt dich dorthin. Eine Seite mit ungespeicherten Änderungen, etwa der Workflow-Editor, fragt vorher nach.
- **Suche:** *Einstellung finden …* über der Navigation durchsucht Namen, Erklärungen und Hilfetexte einzelner Einstellungen, in der Sprache der Oberfläche. Mit den Pfeiltasten wählst du einen Treffer, **Enter** springt hin: Geschlossene Bereiche öffnen sich, die Einstellung wird hervorgehoben und ihr Feld bekommt den Fokus.
- **Navigation:** Die Liste rechts zeigt die Abschnitte nach Themen und markiert den, den du gerade liest. In einem schmalen Fenster ist sie eine Leiste über dem Inhalt mit der Suche und *Zum Abschnitt*.
- **Breite:** Zieh den Rand zwischen Inhalt und Navigation, um die Einstellungen breiter oder schmaler zu machen. Per Tastatur fokussierst du den Rand (Tab) und nutzt die Pfeiltasten (mit Umschalt in größeren Schritten), Pos1 und Ende. Ein Doppelklick auf den Rand oder **Standardbreite** in der Navigation stellt den Standard wieder her. Die Breite wird in diesem Browser gespeichert.
- **Grundlegend und erweitert:** Zusammengehörige Einstellungen stehen unter einer Überschrift. Als *Erweitert* markierte Bereiche (etwa, was die Modelle eines OpenAI-kompatiblen Endpunkts können) bleiben geschlossen, bis du sie brauchst; ihr Abzeichen sagt, wie viele Werte vom Standard abweichen.
- **Speichern:** Die meisten Einstellungen wirken sofort. *Modelle und Budget* hat einen eigenen **Speichern**-Button; verlässt du die Seite dort mit ungespeicherten Änderungen, fragt Nodestro vorher nach.

## Lokale Modelle {#lokale-modelle}
<!-- keywords: lokales modell, ollama, offline, kein api-schlüssel, qwen, download, empfehlung, hardware, gpu, arbeitsspeicher, modellserver, mistral, europäisch, denkaufwand -->

→ [In Nodestro öffnen](/settings#settings-local-models)

Nodestro kann Agenten, Assistenten und die Wissenssuche mit **lokalen Modellen** über Ollama betreiben, ohne API-Schlüssel: Prompts und Dokumente bleiben auf diesem Computer. Eine neue Installation nutzt standardmäßig lokale Modelle (Agenten `ollama:qwen3.5:4b`, Assistent `ollama:qwen3.5:9b`); eine aktualisierte Installation behält ihre bisherigen Modelle.

*Einstellungen → Lokale Modelle* zeigt:

- **Zustand:** ob der Modellserver läuft und wer ihn bereitstellt. Auf dem Desktop startet Nodestro einen eigenen Server (ein eigener Prozess auf diesem Computer mit eigenem Modellordner); in Nodestro Local Docker ist es ein eigener Container; auf einem Server stellt ihn der Betreiber. Ein Ollama, das du schon betreibst, wird nur genutzt, wenn du seine Adresse beim Anbieter Ollama speicherst.
- **Laufzeit:** Fehlt sie, holt **Herunterladen und installieren** die festgelegte Version einmal und prüft ihre SHA-256-Prüfsumme. Ohne Internet installierst du sie aus ihrem Release-Archiv (siehe [Offline-Import](/docs/einstellungen#offline-import)). Jeder Schritt und sein Fortschritt werden angezeigt; siehe [Einrichtung und Downloads](/docs/einstellungen#lokale-einrichtung).
- **Empfohlen für diesen Computer:** ein Modell je Aufgabe (Sortieren, Schreiben, Agenten mit Tools, Analyse, Assistent, semantische Suche) aus den Anforderungen der Aufgabe, dem Arbeitsspeicher dieses Computers und den installierten Modellen. Ein installiertes Modell, das gut genug ist, kommt zuerst; Bei *Geeignet* und *Eingeschränkt* könnte ein größeres Modell es besser; der Grund steht unter dem Modell. Vorschläge ändern nie einen Agenten: Sein Modell wählst du im Editor.
- **Modelle:** die vorgeschlagenen Modelle mit Downloadgröße, Speicherbedarf und Lizenz; **Geprüft** heißt, die installierte Fassung ist die, die Nodestro geprüft hat.

**Europäische Modelle bevorzugen:** Qwen bleibt der Standard. Ist der Schalter an, schlagen die Empfehlungen bei gleich guter Eignung Modelle des europäischen Anbieters Mistral AI vor (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b`, für Programmierung `devstral-small-2:24b`), auch wenn sie erst heruntergeladen werden müssen; ein installiertes Modell bleibt die erste Alternative. Ein schwächeres Modell wird nie vorgeschlagen, und der Schalter nutzt nie einen Cloud-Dienst: Alle diese Modelle laufen auf diesem Computer. Ein Modell, das du einem Agenten selbst gibst, hat immer Vorrang, und der strikte Offline-Modus lehnt Downloads weiter ab. Für die semantische Suche schlägt der Schalter das europäische Modell `mdenseon:307m` (LightOn) vor, solange noch kein Embedding-Modell installiert ist. Es kommt nicht aus dem Ollama-Katalog: **Herunterladen** holt die festgelegten Originaldateien (1,2 GB), prüft ihre SHA-256-Prüfsummen, baut daraus das Modell und behält es nur, wenn es die Referenzvektoren exakt wiedergibt. Ein bestehender Index bleibt beim bisherigen Modell; ein Wechsel bedeutet, den Index neu aufzubauen.

**Denkaufwand:** Lokale Modelle, die „denken“ können, denken ab dem Denkaufwand *Mittel* ohne Grenze mit, und das Denken zählt zur maximalen Ausgabelänge. Auf einem Computer ohne Grafikkarte kann ein kleines Modell dafür viele Minuten brauchen. Für schnelle Schritte (Sortieren, Extrahieren, kurze strukturierte Antworten) stelle *Niedrig* ein: Dann antwortet das Modell ohne zu denken. Der von Nodestro gestartete Modellserver gibt jedem Modell 32.768 Tokens Kontext für Prompt, Denken und Antwort zusammen. Ein Ollama, das du selbst betreibst, starte mit `OLLAMA_CONTEXT_LENGTH=32768`; sein Standard von 4.096 Tokens ist für Agenten zu klein.

Kosten: Lokale Modelle haben **keine externe API-Abrechnung**. Lokale Betriebskosten (Hardware, Energie) erfasst Nodestro nicht. Ausführungen zeigen deshalb „lokal, keine API-Abrechnung“ statt einer Summe von 0, und gemischte Ausführungen nennen zusätzlich die Zahl der lokalen Anfragen.

## Einrichtung und Downloads: Fortschritt und Fehler {#lokale-einrichtung}
<!-- keywords: einrichten, einrichtung, installieren, fortschritt, schritt, downloadfortschritt, prozent, übertragungsrate, restzeit, hängt, abbrechen, fortsetzen, erneut versuchen, speicher voll, kein platz, netzwerkfehler, proxy, unterbrochen, eigenes ollama -->

**Herunterladen und installieren** (und **Starten**) richten den Modellserver als eine Aufgabe mit Schritten ein, die dem entsprechen, was Nodestro tatsächlich tut: *System und vorhandene Installation prüfen*, *Voraussetzungen prüfen* (strikter Offline-Modus, beschreibbarer Ordner, freier Speicher), *Ollama herunterladen*, *Download prüfen (SHA-256)*, *Ollama installieren*, *Server konfigurieren* (Modellordner, Kontextfenster), *Server starten*, *Erreichbarkeit prüfen*, *GPU und Hardware ermitteln* und *Modellserver bereit*. Ein Schritt, der nicht nötig ist, heißt *nicht nötig* und nennt den Grund, etwa wenn die Laufzeit Teil der Desktop-App oder schon installiert ist. Der laufende Schritt sagt „Schritt 3 von 10“; darunter bedeutet „Keine Aktion nötig“, dass du weiterarbeiten kannst, während es im Hintergrund weiterläuft. In Nodestro Local Docker und bei deinem eigenen Ollama prüft **Modellserver prüfen** nur, ob der Server antwortet und welche Hardware er nutzt: Nodestro startet, stoppt oder ändert einen solchen Server nie. Ein Ollama, das du selbst auf diesem Computer betreibst, bleibt auch dann unberührt, wenn Nodestro daneben seinen eigenen Server einrichtet.

Modell-Downloads folgen den Schritten von Ollama: *Freien Speicher prüfen*, *Dateiliste des Modells abrufen*, *Modelldateien herunterladen*, *Dateien prüfen (SHA-256)* und *Installation abschließen*. Jedes Modell hat unter **Aufgaben** einen eigenen Eintrag, und seine Zeile in der Modellliste zeigt statt des Download-Buttons den laufenden Schritt. Mehrere Modelle können gleichzeitig laden; dasselbe Modell lädt nur einmal.

Was der Fortschritt zeigt, ist gemessen, nie geschätzt:

- **Eine Prozentzahl** nur für einen Schritt, der Bytes zählt (ein Download, die Prüfsumme der Laufzeit). Jeder andere laufende Schritt hat einen bewegten Balken ohne Wert.
- **Datenmenge:** „400 MB von 1,5 GB“. Ollama nennt jede Datei eines Modells erst, wenn es sie beginnt; ein Modell-Download zeigt daher die aktuelle Datei („Datei 2: 225 MB von 525 MB“) und die bisher heruntergeladene Menge. Die Gesamtgröße steht fest, sobald Ollama die Dateien prüft.
- **Übertragungsrate** nach einigen Sekunden Messung und **Restzeit** nur, solange die Rate gleichmäßig ist (bei einem Modell: die Zeit für die aktuelle Datei). Kommen eine Weile keine Daten, sagt der Eintrag das: Der Download versucht es eine Weile selbst erneut, bevor er scheitert.
- **Fortgesetzt:** Was ein früherer, unterbrochener Versuch hinterlassen hat (ein abgebrochener Download, eine verlorene Verbindung, eine geschlossene App), bleibt erhalten und wird gezählt; **Fortsetzen** oder **Erneut versuchen** lädt nur den Rest.

Scheitert etwas, sagt der Eintrag **Aktion erforderlich**, was passiert ist und was zu tun ist: Internetverbindung oder Proxy prüfen, Platz schaffen oder einen anderen [Modellordner](/docs/einstellungen#offline-import) wählen, im strikten Offline-Modus aus einem Release-Archiv installieren und so weiter. Vor einem Download vergleicht Nodestro den freien Speicher des Modellordners mit der Größe des Modells und lehnt sofort ab, wenn es nicht passt. **Technische Details** zeigen die Details der Schritte (Pfade, Versionen, Adressen), die Dateien eines Modells und ein Protokoll.

Aufgaben hält Nodestro, nicht die Seite: Nach einem Neuladen der Seite erscheinen die laufende Einrichtung und die Downloads wieder mit ihrem Fortschritt. Wird Nodestro beendet, während eine Aufgabe läuft, steht sie beim nächsten Mal als unterbrochen in der Liste; **Fortsetzen** macht dort weiter, wo sie stehen geblieben ist. Es läuft immer nur eine Einrichtung, auch über mehrere Nodestro-Fenster hinweg.

## Benötigtes Modell nicht installiert {#modell-fehlt}
<!-- keywords: modell fehlt, modell nicht installiert, benötigtes modell, modell herunterladen, anderes modell wählen, model not found, fortfahren, server nicht erreichbar, berechtigung, administrator, unbeaufsichtigt, zeitplan, beheben -->

Braucht der KI-Architekt, der Assistent, der Entwurf oder Test eines Agenten, eine Ausführung oder die Wissenssuche ein lokales Modell, das gerade nicht nutzbar ist, startet Nodestro die Aktion nicht, sondern öffnet einen Dialog. Er sagt, **warum**: Das Modell ist nicht installiert (mit Downloadgröße, freiem Platz im [Modellordner](/docs/einstellungen#offline-import) und benötigtem Arbeitsspeicher), lokale Modelle sind noch nicht eingerichtet, der Modellserver startet oder antwortet nicht, der Speicher ist zu voll, das Modell kann nicht, was der Schritt braucht (Tool-Aufrufe, strukturierte Ergebnisse, Bilder, Embeddings), es ist für diesen Computer vermutlich zu groß, oder der Name ist kein lokales Modell. Er sagt auch, **wohin** das Modell gehört: auf diesen Computer, in den Local-Docker-Container, auf einen eingetragenen Modellserver oder auf den Nodestro-Server.

Der Dialog bietet nur an, was du hier tun darfst: **Modell herunterladen** (nach einer Unterbrechung **Download fortsetzen**), **Lokale Modelle einrichten**, **Erneut prüfen**, **Anderes Modell wählen** oder **Modellnamen kopieren** für einen Administrator. Ohne Berechtigung zum Installieren, auf einem Nodestro-Server (dort installiert der Betreiber) und im strikten Offline-Modus wird nichts heruntergeladen, und der Dialog sagt das. Lädt dasselbe Modell schon, etwa in einem anderen Fenster, folgt der Dialog diesem Download; ein zweiter startet nie.

Deine Eingaben bleiben, wo sie sind: die Beschreibung für den KI-Architekten, die Nachricht samt Dateien im Assistenten, die Testeingabe oder die Eingaben der Ausführung. Ist der Download fertig, prüft Nodestro, ob das Modell wirklich da ist und den Schritt kann; dann startet **Weiter** die Aktion einmal mit denselben Eingaben. Hakst du **Automatisch weitermachen, sobald das Modell bereit ist** an, geht es von selbst weiter, einmal. Du kannst den Dialog schließen, während der Download läuft: Er läuft unter **Aufgaben** weiter. **Anderes Modell wählen** listet nur bereite Modelle, die den Schritt können, lokale und Cloud-Modelle (die Kosten verursachen können); die Wahl gilt für diese eine Aktion und ändert deine Einstellungen nicht.

Zeitpläne, Stapelausführungen und veröffentlichte APIs laden nie etwas herunter. Eine Ausführung, die nicht starten kann, meldet das fehlende Modell (etwa beim letzten Lauf des Zeitplans) mit **Beheben**, das denselben Dialog öffnet, ohne von selbst etwas fortzusetzen.

## Dieser Computer, Kontextfenster und Geschwindigkeit {#lokale-hardware}
<!-- keywords: hardware, gpu, nur cpu, arbeitsspeicher, kontextfenster, ollama_context_length, geschwindigkeit, tokens pro sekunde, messen, cpu-sparmodus, denken verkürzt -->

*Einstellungen → Lokale Modelle → Dieser Computer* zeigt, was Nodestro erkannt hat: System, CPU-Kerne, Arbeitsspeicher, die Grafikkarte und ihren Speicher, ob der Modellserver läuft (und auf der GPU oder der CPU) und sein **Kontextfenster**: von Nodestro eingestellt für den Server, den es startet, von einem laufenden Server gemeldet oder für dein eigenes Ollama noch nicht bekannt. Die Spalte **Auf diesem Computer** in der Modellliste sagt, ob ein Modell auf der GPU läuft, auf der CPU (langsamer), ohne GPU zu langsam ist oder für diesen Speicher zu groß.

Hinweise erscheinen über der Liste, wenn sie zutreffen: ein zu kleines Kontextfenster (bei deinem eigenen Ollama: setze `OLLAMA_CONTEXT_LENGTH=32768` auf seinem Computer und starte es neu), keine Grafikkarte (rechne mit langsamen Antworten; am besten eignen sich kleine Modelle und der Denkaufwand *Niedrig* für einfache Schritte), zu wenig Arbeitsspeicher, ein Modell, das nicht passt, oder ein Modell, das als langsam gemessen wurde. Auch die Workflow-Prüfung warnt, wenn das Kontextfenster unter 16.384 Tokens liegt oder die Antwortgrenze eines Agenten nicht hineinpasst.

**Geschwindigkeit:** Nodestro schätzt keine Geschwindigkeiten. **Geschwindigkeit messen** bei einem installierten Sprachmodell führt eine kurze Generierung auf diesem Computer aus und zeigt die gemessenen Tokens pro Sekunde, wann gemessen wurde und ob das Modell auf der GPU oder der CPU lief.

**CPU-Sparmodus für Denkmodelle** (standardmäßig an): Auf einem Computer ohne Grafikkarte antworten Agenten mit Denkaufwand *Mittel* auf lokalen Denkmodellen ohne die lange Denkphase. Der Denkaufwand *Hoch* und eine ausdrücklich gesetzte Reasoning-Option werden nie verringert. Jeder so beantwortete Schritt trägt in der Ausführung und im Agententest das Abzeichen „Denken verkürzt: CPU-Sparmodus“. Schalte den Modus aus, damit Agenten immer wie eingestellt denken.

## Offline-Import und Modellordner {#offline-import}
<!-- keywords: offline, air gap, usb, gguf, offline-paket, sha-256, externe ssd, modellordner, kopieren -->

Für Computer ohne Internet importiert *Einstellungen → Lokale Modelle → Offline-Import* von einem Pfad auf dem Computer, auf dem Nodestro läuft (in Local Docker: im Import-Ordner):

- **Offline-Paket:** ein Ordner, der auf einem Computer mit Internet erstellt wurde (`orkexa-local export`). Jede Datei wird vor der Verwendung gegen ihre SHA-256-Prüfsumme geprüft.
- **GGUF-Datei:** eine Modelldatei; gib ihr den Namen, den Agenten verwenden (zum Beispiel `mein-modell:q4`), und bei Modellen, die Bilder lesen, den Vision-Projektor (`mmproj`).

**Modellordner:** Modelle sind groß. Wähle einen anderen Ordner, zum Beispiel auf einer externen SSD: **Dorthin kopieren und prüfen** kopiert jedes Modell, prüft es und wechselt erst dann (der alte Ordner bleibt erhalten); **Ordner so verwenden, wie er ist** wechselt zu einem Ordner, der schon Ollama-Modelle enthält.

## Modell aus lokalen Dateien bauen {#modell-bauen}
<!-- keywords: bauen, mdenseon, safetensors, vorlage, gguf, air gap, prüfsumme, referenzvektoren, embedding, index neu aufbauen -->

Manche Modelle gibt es nicht in der Ollama-Bibliothek; sie werden aus ihren Originaldateien gebaut. Derzeit ist das das europäische Embedding-Modell `mdenseon:307m` (LightOn, Apache-2.0). Mit Internet holt **Herunterladen** in der Modellliste die Dateien und baut das Modell. Ohne Internet (oder im strikten Offline-Modus) verwende *Einstellungen → Lokale Modelle → Aus lokalen Dateien bauen*: Kopiere die beiden Dateien von einem Computer mit Internet, gib ihre Pfade auf dem Computer an, auf dem Nodestro läuft (in Local Docker: im Import-Ordner), und wähle **Bauen und prüfen**. Es wird nichts heruntergeladen.

- **Gewichtsdatei:** `model.safetensors` aus `lightonai/mDenseOn`, Revision `a5fdb000f7a21da96c3bddde3a782ef777316df3`, 1,227,771,776 Bytes, SHA-256 `a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c`.
- **Vorlagendatei:** `mmBERT-Base-307M-F16.gguf` aus `mykor/mmBERT-base-GGUF`, Revision `66e31bd2787f6b5fe9b762a664f4899af38b0605`; SHA-256 der ersten 6,036,928 Bytes `a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901`. Die ganze Datei oder nur diese ersten Bytes (ihr Header) genügen.

Nodestro prüft beide Dateien gegen diese Prüfsummen, schreibt die Modelldatei, legt das Modell im Modellserver an und berechnet Referenztexte: Das Modell bleibt nur, wenn jeder Vektor mit der Referenz übereinstimmt. Die Liste zeigt den laufenden Schritt; **Abbrechen** stoppt den Bau. Schlägt er fehl, sagt die Meldung warum: eine Datei passt nicht zur Prüfsumme (falsche Datei, falsche Revision oder unvollständige Kopie), eine Datei fehlt, eine Datei passt nicht zum Modell, oder die Referenzvektoren stimmen nicht (das Modell wird wieder entfernt). **Erneut versuchen** startet ihn noch einmal mit denselben Pfaden.

Nach dem Bau erscheint das Modell als Embedding-Modell. Ein bestehender semantischer Index bleibt bei seinem Modell: Wähle das neue Modell unter [Wissenssuche](/docs/wissen#suchverfahren) und baue den Index neu auf; die Suche verwendet den alten Index, bis der neue vollständig ist.

## Strikter Offline-Modus {#offline}
<!-- keywords: strikt offline, air gap, keine cloud, vorabprüfung, downloads abgelehnt -->

Mit **Strikter Offline-Modus** lehnt die Prüfung vor jeder Ausführung Cloud-Modelle ab (auch als Ersatz-, Bewertungs- oder Orchestrator-Modell), einen Modellserver, der nicht auf diesem Computer läuft, Server-Tools wie die Websuche und entfernte MCP-Dienste; auch Downloads werden abgelehnt. Lokale Modelle, lokale Tools und lokale MCP-Server funktionieren weiter. Der Modus ändert keinen Workflow: Er lehnt nur ab, was den Computer verlassen würde.

## KI-Anbieter {#anbieter}
<!-- keywords: api key, api-schlüssel, anbieter, provider, anthropic, openai, gemini, ollama, vllm, openai-kompatibel, basis-url, umgebungsvariable, .env, fähigkeiten -->

→ [In Nodestro öffnen](/settings#settings-providers)

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

Administratoren legen außerdem das **Höchste Budget pro Lauf** fest (leer: keine Obergrenze): Kein Lauf darf damit starten oder darüber hinaus erhöht werden. Die **Frist für Budget-Entscheidungen** (1 bis 720 Stunden, anfangs 24) bestimmt, wie lange ein pausierter Lauf auf eine [Budget-Entscheidung](/docs/workflows#budget-freigabe) wartet, bevor er fehlschlägt. Wer entscheiden darf, steht unter [Wer entscheiden darf](/docs/workflows#budget-rechte).

## Ausgabelimits der Modelle {#ausgabelimits}
<!-- keywords: Ausgabelimit, max. Tokens, max_tokens, abgeschnitten, Architekt-Limit, Kontextfenster -->

Nodestros eigene KI-Schritte (der Workflow-Architekt, die Assistenten, Fragen zu einem Lauf, Entscheidungen des Orchestrators und die Qualitätsprüfung) haben keine eigenen Agenteneinstellungen. Unter **Ausgabelimits der Modelle** legst du fest, mit wie vielen Tokens jeder Schritt antworten darf; ein leeres Feld verwendet die eingebaute Vorgabe (zum Beispiel 32.000 für den Workflow-Plan des Architekten und 8.000 für seine Analyse). Agenten behalten ihre eigenen *Max. Tokens* im [Agenten-Editor](/docs/agenten#limits).

Der gesendete Wert ergibt sich aus drei Stufen: deiner Einstellung, sonst der Vorgabe, höchstens der dokumentierten maximalen Ausgabe des Modells (oder der Hälfte seines Kontextfensters bei einem lokalen Modell ohne bekanntes Maximum). Die Tabelle zeigt den Wert, der an das Assistenzmodell geht, und sagt, wenn er gesenkt wurde; nichts wird stillschweigend gekürzt.

Das Limit schließt das Denken des Modells ein. Ein höheres Limit erlaubt längere Antworten, umgeht aber nie ein Budget: Vor jeder Anfrage reserviert die Kostenprüfung genau diesen Wert.

**Abgeschnittene Antworten erneut anfordern:** Erreicht eine Antwort des Workflow-Architekten ihr Limit, wird sie einmal mit doppeltem Limit neu angefordert, höchstens mit dem *Höchsten Limit für eine Wiederholung* (anfangs 64.000) und dem Maximum des Modells. Die Wiederholung wird nur gesendet, wenn ihre vollen Kosten in das verbleibende Budget des Auftrags passen. Sonst, oder bei ausgeschalteter Wiederholung, endet der Auftrag mit einer Meldung, die den Schritt und sein Limit nennt.

## Sandbox {#sandbox}
<!-- keywords: sandbox wählen, automatisch, docker, python prozess, docker verfügbar, eingebaute sandbox, linux sandbox, macos, windows, gesperrt, experimentell -->

→ [In Nodestro öffnen](/settings#settings-sandbox)

Hier wählst du, wo Tools laufen. Die Änderung gilt sofort.

| Modus | Eigene Tools | KI-erstellte Tools und Tools unbekannter Herkunft |
|---|---|---|
| **Automatisch** (Standard, empfohlen) | Python-Prozess | nur Docker, sobald es die Prüfungen von Nodestro bestanden hat; sonst **gesperrt** |
| **Linux-Sandbox** (optional, nur Linux) | Python-Prozess | nur die eingebaute Linux-Sandbox, sonst **gesperrt**; ohne Python-Pakete von Drittanbietern, Tools, die sie brauchen, sind daher **gesperrt**; Docker wird nicht verwendet |
| **Python-Prozess** (nur für vertrauenswürdige Nutzung) | Python-Prozess | immer **gesperrt**; weder Docker noch die eingebaute Linux-Sandbox wird verwendet |
| **Docker** | Docker | Docker; läuft Docker nicht, läuft kein Tool |

Für KI-erstellten Code weicht Nodestro nie auf einen ungeschützten Prozess aus, und *Automatisch* weicht auch nie auf die eingebaute Linux-Sandbox aus: Sie wird nur verwendet, wenn du **Linux-Sandbox** wählst. Hast du nie einen Modus gewählt, verwendet Nodestro *Automatisch*; ein in einer früheren Version gewählter Modus bleibt erhalten. Hast du in einer früheren Version **Python-Prozess** gewählt, sind KI-erstellte Tools jetzt gesperrt: Dieser Modus führt sie nicht mehr in einer eingebauten Sandbox aus. Wähle **Automatisch** und starte Docker, oder unter Linux **Linux-Sandbox**.

Unter der Auswahl zeigt Nodestro:

- den **Computer, auf dem Nodestro läuft**, mit seinem Betriebssystem. Das ist der Computer der Nodestro-Laufzeit, nicht das Gerät deines Browsers: Öffnest du Nodestro auf einem Server von einem Mac aus, zählt das System des Servers;
- wo KI-erstellte und eigene Tools **jetzt** laufen, oder dass sie **gesperrt** sind und warum;
- jede **Sandbox auf diesem Computer** mit ihrem Status: *Freigegeben* (darf KI-erstellten Code ausführen), *Experimentell, nicht verwendet*, *Nicht verfügbar*, *Nicht isoliert* (der Python-Prozess) oder *Hier nicht verwendet*.

Die eingebaute Linux-Sandbox ist unter Ubuntu 24.04 und Debian 13 (64-Bit Intel oder AMD) freigegeben, sobald ihr Selbsttest bestanden ist; auf ARM64 ist sie nicht verfügbar. Unter macOS und Windows hat Nodestro keine eigene Sandbox: Die frühere experimentelle macOS-Sandbox wurde entfernt, und ihre Zeile sagt das. Auf beiden Systemen brauchen KI-erstellte Tools daher Docker oder eine kompatible Engine. Details stehen unter [Die Sandbox](/docs/tools#sandbox) und [Vertrauen und Isolation](/docs/tools#vertrauen).

Auf einem Server und in Nodestro Local Docker läuft jedes Tool in einem Container; die Einstellung lässt sich dort nicht ändern.

## Docker installieren {#sandbox-docker}
<!-- keywords: docker installieren, docker desktop, docker engine, macos, windows, linux, wsl, docker starten, docker läuft nicht, colima, orbstack, podman, rootless, gruppe docker, engine prüfen -->

Für KI-erstellte Tools ist mit *Automatisch* auf jedem System Docker oder eine kompatible Container-Engine nötig; unter Linux ist der Modus **Linux-Sandbox** die einzige Alternative, ohne Pakete von Drittanbietern. Nodestro selbst startet auch ohne Docker; nur KI-erstellte Tools bleiben gesperrt, bis eine geeignete Engine läuft. Eine laufende Engine findet Nodestro selbst, und das Container-Image wird beim ersten Gebrauch gebaut.

- **macOS:** Installiere [Docker Desktop für Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple Silicon oder Intel), öffne es einmal und warte, bis es meldet, dass es läuft. [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) und [Podman](https://podman.io/) werden ebenfalls akzeptiert, wenn sie die Prüfungen von Nodestro bestehen.
- **Windows:** Installiere [Docker Desktop für Windows](https://docs.docker.com/desktop/setup/install/windows-install/) mit dem WSL-2-Backend, starte bei Nachfrage neu und starte Docker Desktop. Es muss Linux-Container ausführen. Podman wird ebenfalls akzeptiert, wenn es die Prüfungen von Nodestro besteht.
- **Linux:** Installiere die [Docker Engine](https://docs.docker.com/engine/install/) für deine Distribution. Empfohlen ist [Docker ohne Root-Rechte (rootless)](https://docs.docker.com/engine/security/rootless/) mit Delegation von cgroup v2, damit die Grenzen greifen. Deinen Benutzer in die Gruppe `docker` aufzunehmen funktioniert auch, aber Mitglieder der Gruppe docker haben auf diesem Computer faktisch Root-Rechte. Podman wird ebenfalls akzeptiert.

**Nodestro prüft die Engine selbst.** Bevor eine Engine KI-erstellten Code ausführt, prüft Nodestro ihre Grenzen und ihren Systemaufruf-Filter (seccomp) und startet einen kleinen Testcontainer. Darin muss der Code als Benutzer ohne Rechte und ohne besondere Berechtigungen laufen, ohne Netzwerk, auf einem schreibgeschützten Dateisystem, mit durchgesetzten Grenzen für Speicher, Prozesse, CPU und offene Dateien und ohne Geheimnisse in der Umgebung. Eine Engine, die eine Prüfung nicht besteht, lehnt Nodestro ab, egal wie sie heißt; *Einstellungen → Sandbox* zeigt, welche Prüfung fehlschlug. Die Prüfungen werden nie gelockert. Nodestro prüft im Hintergrund, die Seite wartet also nie auf Docker; solange die Prüfung läuft, zeigt die Docker-Zeile *Wird geprüft* und aktualisiert sich selbst. Nachdem du die Engine gestartet oder geändert hast, klicke auf **Erneut prüfen**. Administratoren können außerdem auf **Selbsttest ausführen** klicken, um den Testcontainer sofort zu starten (**Sandbox vorbereiten**, solange das Sandbox-Image noch fehlt). Eine neue Prüfung starten nur Administratoren, und höchstens alle 10 Sekunden: sonst sagt die Seite, dass nichts neu geprüft wurde (und wann es wieder geht), und zeigt weiter das letzte Ergebnis. Andere Nutzer sehen den Zustand und jede Prüfung ohne technische Details.

**Welche Engine?** Unter Linux ist die Docker Engine der direkteste Weg, am besten ohne Root-Rechte mit Delegation von cgroup v2; Podman mit Root-Rechten geht auch. Podman ohne Root-Rechte kann an den Prüfungen scheitern, weil es nicht unbedingt alle Datei-Limits der Sandbox anwendet. Unter macOS und Windows nimmst du Docker Desktop oder eine der oben genannten Alternativen. Welche Engine du auch wählst, ihr Name entscheidet nicht: Nodestro verlässt sich auf seine eigenen Prüfungen auf deinem Computer.

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

## Anzeige des Denkens {#denken-anzeige}
<!-- keywords: denken, thinking, reasoning, zusammenfassung, gedanken, live, status, nicht übertragen, redacted -->

Während ein Modell arbeitet, zeigt Nodestro, was sein Anbieter vom Denken überträgt: im Assistenten, im Chat mit der Teamleitung eines Laufs, in Workflow-Läufen, im Workflow-Architekten und im Agententest. **Nodestro schreibt, ergänzt oder umschreibt nie selbst Denktext.** Behält ein Anbieter das Denken für sich, siehst du nur, dass das Modell nachdenkt, und warum es keinen Text gibt.

Die Anzeige trennt das Denken immer von der Antwort (gestrichelter Rahmen, eigene Beschriftung) und nennt einen dieser Zustände:

| Zustand | Bedeutung |
|---|---|
| *Denkt nach…* | Eine Denkphase läuft; es ist (noch) kein Text da, oder der Text ist ausgeblendet. |
| *Denktext* | Das Denken des Modells, wie es entstand (offene Modelle, etwa über Ollama oder vLLM). |
| *Zusammenfassung des Denkens* | Eine Zusammenfassung, die der Anbieter über Denken schreibt, das er nicht offenlegt (OpenAI, Gemini, Claude). |
| *Denken nicht übertragen* | Das Modell hat nachgedacht, der Anbieter hat aber keinen Text gesendet (verschlüsselt, weggelassen oder nicht angefordert). |
| *Denken nicht offengelegt* | Das Modell denkt nicht nach, oder sein Anbieter sendet das Denken nie. |

**Anzeige in diesem Browser** (Abschnitt *Anzeige des Denkens*): *Live anzeigen* öffnet den Text, während er ankommt, *Eingeklappt* (Standard) zeigt die Aktivität und lässt den Text einen Klick entfernt, *Nur Status* zeigt den Text nie. Der Assistent und der Chat mit der Teamleitung haben je Gespräch eine eigene Wahl (**Denken** unter der Eingabe bzw. der Einleitung); *Standard* folgt der globalen Wahl. Die Wahl bleibt in diesem Browser und ändert keinen Workflow und kein Gespräch.

**Anzeigen ist nicht Einschalten.** Ob und wie viel ein Modell denkt, legst du am Agenten fest ([Denken und Aufwand](/docs/agenten#denken)). Manche Anbieter senden Text nur auf Anfrage:

| Anbieter | Was live ankommt | Wie du Text erhältst |
|---|---|---|
| Anthropic (Claude 4 und neuer) | Zusammenfassung | Option *Gedanken anzeigen* des Agenten (*Zusammengefasst anzeigen*) |
| OpenAI (denkende Modelle) | Zusammenfassung; das Denken selbst nie | **Zusammenfassungen des Denkens anfordern** (Administration; OpenAI verlangt eventuell eine verifizierte Organisation) |
| OpenAI GPT-4o, GPT-4.1 | nichts: sie denken nicht | – |
| Gemini 2.5 und neuer | Zusammenfassung (Thought Summaries) | **Zusammenfassungen des Denkens anfordern** |
| Amazon Bedrock | Claude: Zusammenfassung; andere denkende Modelle: Denktext, wo das Modell ihn sendet | Request-Options des Agenten |
| Ollama, vLLM, OpenAI-kompatible Server | Denktext, wo der Server ihn abtrennt | Serverkonfiguration (etwa ein Reasoning-Parser) |

Zusammenfassungen anzufordern ändert keine Antwort und keine Kosten: Denk-Tokens berechnet der Anbieter, ob Text übertragen wird oder nicht. Die Denk-Optionen des Agenten zeigen, was sein Modell überträgt (*Denken live: …*).

## Backup und Wiederherstellung {#backup}
<!-- keywords: backup, sicherung, wiederherstellen, restore, export, zip, umzug, datensicherung -->

→ [In Nodestro öffnen](/settings#settings-backup)

**Backup herunterladen** speichert alle Daten in einer ZIP-Datei: Workflows mit Versionen, Agenten-Vorlagen, eigene Tools, Wissensdateien, Memory, Ausführungen, Nutzungsdaten, Favoriten, Tags und Einstellungen. Die Datenbank wird dabei als konsistente Momentaufnahme gesichert, auch wenn gerade ein Lauf arbeitet.

Die **API-Schlüssel** der KI-Anbieter werden nie ins Backup geschrieben, ebenso wenig Basis-URLs mit Zugangsdaten. Beim Wiederherstellen bleiben die Schlüssel dieses Rechners erhalten.

**Aus Datei wiederherstellen** prüft die Datei zuerst vollständig: Format, Prüfsummen jeder Datei, die Datenbank und jeden gespeicherten Workflow und Lauf. Erst dann zeigt Nodestro, was das Backup enthält, im Vergleich zum aktuellen Stand. Ersetzt wird nur nach ausdrücklicher Bestätigung und nur, wenn kein Lauf aktiv ist. Vorher legt Nodestro automatisch eine Sicherung des aktuellen Stands an (`before-restore-….zip` im Ordner `backups` des Datenverzeichnisses); sie erscheint unter den Sicherungen auf diesem Rechner und lässt sich genauso wiederherstellen. Schlägt etwas fehl, bleiben die bisherigen Daten unverändert.

## Systemdiagnose {#diagnose}
<!-- keywords: diagnose, systemdiagnose, prüfen, fehler finden, verbindung, docker, sandbox, version, problem -->

→ [In Nodestro öffnen](/settings#settings-diagnostics)

**Diagnose starten** prüft, ob Nodestro auf diesem Rechner vollständig funktioniert, und zeigt für jeden Punkt **In Ordnung**, **Warnung** oder **Fehler** mit einer Erklärung und einem Lösungsvorschlag:

- Versionen von Nodestro, Orkexa, Python, SQLite und Betriebssystem
- Datenbank (lesbar, beschreibbar, unbeschädigt, Volltextsuche)
- Daten-, Tool- und Backup-Verzeichnis beschreibbar, freier Speicherplatz
- KI-Anbieter: welche eingerichtet sind und ob die Anbieter des Standard- und des Assistenzmodells dazugehören (ohne Schlüssel anzuzeigen)
- Docker und die Tool-Sandbox mit einem kleinen Testtool
- PDF-Unterstützung und die gebaute Oberfläche

Die Diagnose ist kostenlos und sendet nichts ins Internet. **Verbindung testen** fragt zusätzlich beim Anbieter des Standardmodells die Modellliste ab; im Abschnitt jedes Anbieters unter [KI-Anbieter](/docs/einstellungen#anbieter) testest du ihn einzeln. Das verbraucht keine Tokens und kostet nichts. API-Schlüssel und andere Zugangsdaten werden nie angezeigt.

**Zugriffsrechte der Datenbank** (Desktop-App): Dürfen andere Benutzer dieses Computers die Datenbankdateien lesen, meldet die Diagnose das und bietet **Zugriffsrechte reparieren …** an (sobald keine Läufe aktiv sind). Nodestro startet dann im Reparaturmodus neu, zeigt jede Datei mit ihren jetzigen und neuen Rechten und ändert sie erst, wenn du bestätigst; geändert werden nur die Rechte, nie der Inhalt. Dürfen andere Benutzer die Datenbank sogar ändern, öffnet Nodestro beim Start von selbst diesen Reparaturmodus und sonst nichts, bis sie repariert ist oder du sie mit dem dort angezeigten Befehl `chmod 600 …` von Hand reparierst. Symbolische Links, Dateien mit weiterem Namen (Hardlinks) und Dateien anderer Benutzer werden nie geändert.

## Installation und Start {#installation}
<!-- keywords: installation, start, kommandozeile, cli, port, host, data-dir, no-browser, reload, python, node -->

Voraussetzungen: Python 3.11 oder neuer und Node.js 20 oder neuer (nur zum Bauen der Oberfläche), optional Docker.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -r platform/internal.txt -e .
nodestro
```

Nodestro startet unter `http://localhost:8000` und öffnet den Browser. Optionen des Befehls `nodestro`:

| Option | Umgebungsvariable | Bedeutung |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Adresse (Standard `127.0.0.1`). Nur Adressen dieses Rechners (`127.0.0.1`, `::1`, `localhost`) sind erlaubt, weil Nodestro noch keine Anmeldung hat |
| `--port` | `NODESTRO_PORT` | Port (Standard `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Datenverzeichnis (Standard `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Betriebsprofil (Standard `desktop`). Ein Nodestro-Server wird nicht mit diesem Befehl gestartet: Er läuft als eigene Server-Distribution von Nodestro, die der Betreiber deiner Organisation installiert |
| – | `NODESTRO_ALLOWED_HOSTS` | Weitere Namen dieses Rechners, unter denen Nodestro antwortet (kommagetrennt, z. B. `studio.localhost`). Andere Hostnamen, Änderungen von fremden Webseiten und von einem Proxy weitergeleitete Anfragen werden abgewiesen, damit keine Webseite im Browser Nodestro bedienen kann |
| `--no-browser` | – | Browser nicht automatisch öffnen |
| `--reload` | – | Bei Codeänderungen neu starten (Entwicklung) |

Beenden mit **Strg+C**. Laufende Läufe werden dabei abgebrochen.

> **Sicherheit:** Nodestro hat noch keine Benutzerverwaltung und antwortet deshalb nur diesem Rechner. `--host 0.0.0.0`, andere Netzwerkadressen oder Netzwerknamen in `NODESTRO_ALLOWED_HOSTS` brechen den Start ab, und Nodestro lässt sich nicht hinter einen Reverse Proxy stellen. Damit andere Geräte einen Workflow nutzen können, veröffentliche ihn als API: Veröffentlichte APIs nutzen API-Schlüssel und haben einen eigenen Netzwerkzugang (siehe *API und Export*).

## Nodestro auf einem Server {#server}
<!-- keywords: server, anmelden, anmeldung, abmelden, rolle, rollen, berechtigung, berechtigungen, arbeitsbereich, mandant, tenant, nur lesen, mitglieder, nodestro-server, set-role, remove-member, revoke-sessions, sitzung abgelaufen -->

Nodestro Studio kann auch auf einem **Nodestro-Server** deiner Organisation laufen. Dann meldest du dich über den Anmeldedienst deiner Organisation an, und deine Daten liegen auf diesem Server statt auf deinem Rechner. Mit dem Befehl `nodestro` gibt es weder Anmeldung noch Rollen; dort gilt nichts von diesem Abschnitt.

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

**Mitglieder und Rollen.** Eigentümer und Administratoren eines Arbeitsbereichs verwalten seine Mitglieder unter **Einstellungen › Mitglieder und Rollen**: die Rolle eines Mitglieds ändern oder es entfernen (seine Sitzungen in diesem Arbeitsbereich enden sofort). Nur Eigentümer vergeben, entziehen oder ändern die Eigentümerrolle, und ein Arbeitsbereich behält immer mindestens einen Eigentümer; jede Änderung steht im Zugriffsprotokoll des Arbeitsbereichs. Neue Mitglieder kommen über einen Einrichtungslink dazu; Einladungen gibt es noch nicht. Der Betreiber des Servers kann dasselbe mit Befehlen der Kommandozeile `nodestro-server` tun:

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

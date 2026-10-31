# Nutzung und Kosten

Nodestro zählt für jede Anfrage an einen KI-Anbieter die Tokens und schätzt die Kosten. Dieses Kapitel erklärt die Token-Arten, wie Kosten berechnet werden, wie Caching spart und was die Seite *Nutzung* zeigt.

## Überblick {#ueberblick}
<!-- keywords: nutzung, kosten, tokens, statistik, verbrauch, abrechnung -->

Tokens und Kosten siehst du an vier Stellen:

- auf jedem Agenten-Knoten nach einem Lauf,
- in der *Ausführungsübersicht* des Editors (live),
- in der Detailansicht jeder Ausführung, gesamt und je Agent,
- auf der Seite **Nutzung**, zusammengefasst über Tage, Workflows und Modelle.

Alle Kosten sind **Schätzungen nach Listenpreis**; maßgeblich ist die Abrechnung des jeweiligen Anbieters. Welche Preise gelten, siehst du unter [Modellpreise](/docs/nutzung#preise). Ist für ein Modell kein Preis bekannt, bleiben die Kosten **unbekannt** (angezeigt als „–“): Sie werden nie als 0 gezählt, und ein Budget begrenzt nur Kosten mit bekanntem Preis. Beträge stehen immer in US-Dollar, mit bis zu sechs Nachkommastellen und im Zahlenformat der gewählten Sprache (z. B. „0,0042 $“ auf Deutsch, „$0.0042“ auf Englisch).

## Token-Arten {#tokens}
<!-- keywords: token, input, output, eingabe, ausgabe, cache read, cache write, thinking tokens, anfragen, requests -->

| Art | Bedeutung |
|---|---|
| **Eingabe** | Alles, was an das Modell geht und nicht aus dem Cache kommt: System-Prompt, Aufgabe, Verlauf, Tool-Ergebnisse, Wissen. |
| **Ausgabe** | Alles, was das Modell schreibt, **einschließlich Denken** und Tool-Aufrufen. |
| **Aus dem Cache** | Eingabe, die aus dem Prompt-Cache gelesen wird; deutlich günstiger. |
| **In den Cache** | Eingabe, die in den Cache geschrieben wird; etwas teurer als normale Eingabe. |
| **Denken** | Der Anteil der Ausgabe, der auf Gedanken entfällt (sofern die API ihn meldet). |

**API-Anfragen** zählt die einzelnen Aufrufe der API. Ein Agent braucht mindestens eine Anfrage, dazu eine pro Tool-Runde, und die Qualitätsprüfung braucht je Prüfung und Überarbeitung weitere. Fahre über die Token-Zahl eines Agenten, um die Aufschlüsselung zu sehen.

## Wie Kosten berechnet werden {#kosten}
<!-- keywords: kosten berechnen, preis, preisliste, schätzung, mtok, websuche kosten, unbekannter preis -->

Für jede Anfrage multipliziert Nodestro die Token-Arten mit den Preisen des Modells (in US-Dollar pro Million Tokens) und addiert Gebühren für Websuchen (10 $ pro 1.000 Suchen). Die Summe aller Anfragen ergibt die Kosten des Agenten und des Laufs; ist ein Teil unbekannt, ist auch die Summe unbekannt. Die Berechnung übernimmt die Library Orkexa, mit der Preisliste, die Nodestro aktuell hält. Die Preise der Modelle im Katalog:

<!-- widget: models -->

Zeigt eine Ausführung **„–“** statt eines Betrags, konnte mindestens eine Anfrage nicht bepreist werden (z. B. ein unbekanntes Modell). Nodestro zeigt dann lieber keinen Betrag als einen zu niedrigen. Ist nur ein Teil unbekannt, zeigt die Seite *Nutzung* „mindestens …“: Die Summe der bekannten Kosten ist dann eine Untergrenze. Für das Budget zählt nur der bekannte Teil; im strengen Preismodus werden solche Anfragen gar nicht erst gesendet.

## Caching {#caching}
<!-- keywords: caching, prompt caching, cache, sparen, ttl, 5 minuten, 1 stunde, cache write -->

Mit **Prompt-Caching** (pro Agent unter *Erweitert*, standardmäßig an) merkt sich die API den gleichbleibenden Anfang einer Anfrage. Folgeanfragen mit demselben Anfang lesen ihn aus dem Cache:

- **Lesen** aus dem Cache kostet je nach Modell nur etwa 2,5 bis 10 % des normalen Eingabepreises.
- **Schreiben** in den 5-Minuten-Cache kostet das 1,25-Fache, in den 1-Stunden-Cache das 2-Fache des Eingabepreises.

Caching lohnt sich besonders, wenn ein Agent **mehrere Anfragen** macht (Tool-Runden, Qualitätsprüfung, Memory) oder wenn derselbe Workflow **mehrmals kurz hintereinander** läuft. Wissen im Modus *Im Kontext* steht am Anfang des Prompts und profitiert daher besonders.

**Cache-Dauer:** Der 5-Minuten-Cache verlängert sich bei jeder Nutzung. Wähle *1 Stunde* nur, wenn zwischen den Anfragen oft mehr als fünf Minuten liegen.

Wie viel aus dem Cache kam, siehst du in der Aufschlüsselung der Tokens („aus dem Cache“, „in den Cache“).

## Die Seite Nutzung {#statistik}
<!-- keywords: nutzungsseite, statistik, diagramm, pro tag, nach workflow, nach modell, zeitraum, agent-test, assistent, herkunft -->

Wähle oben den Zeitraum (7, 30 oder 90 Tage). Die Seite zeigt:

- **Kennzahlen:** Läufe, weitere KI-Vorgänge, API-Anfragen, Tokens (Eingabe und Ausgabe) und geschätzte Kosten.
- **Kosten pro Tag** als Balkendiagramm; fahre über einen Balken für Kosten und Zahl der Läufe.
- **Nach Workflow** und **Nach Modell** als Tabellen mit Anzahl, Tokens, Kosten und Anteil an den Gesamtkosten.
- **Nach Herkunft:** Workflow-Läufe, Agent-Tests, Agent-Entwurf mit KI, Memory-Assistent und Tool-Erstellung mit KI.
- **Letzte KI-Vorgänge außerhalb von Workflows** mit Zeitpunkt, Modell, Tokens und Kosten.

Läufe werden nach ihrem **Startzeitpunkt** zugeordnet. In *Nach Modell* zählt jeder Agent zum Modell, das in seiner Konfiguration steht; die Kosten seiner Qualitätsprüfung zählen dazu. Die übrigen KI-Vorgänge zählen zum Modell, das sie verwendet haben. Jede Anfrage wird genau einmal gezählt: Workflow-Läufe aus den gespeicherten Läufen, alles andere aus einem eigenen Protokoll. **Importierte Traces** sind nicht enthalten.

## Modellpreise {#preise}
<!-- keywords: modellpreise, preisliste, preis aktualisieren, synchronisierung, litellm, veraltet, individueller preis, vertragspreis, prüfung, preisänderung -->

Unter **Einstellungen → Modellpreise** steht jeder Preis mit Status, Qualität, Quelle und dem Zeitpunkt der letzten Prüfung. Die Preise kommen aus drei Quellen, in dieser Reihenfolge:

1. den verifizierten Preisen der Library Orkexa,
2. einer geprüften Preisdatei, die der Betreiber angibt (`NODESTRO_PRICE_SNAPSHOT_FILE`),
3. der öffentlichen Preisliste des Projekts LiteLLM (abschaltbar mit `NODESTRO_PRICE_LITELLM=off`).

Nodestro prüft die Preise alle 24 Stunden und auf Knopfdruck (*Preise jetzt prüfen*). Ändert sich ein Preis um mehr als 20 % und bestätigt das keine offizielle Quelle, wird die neue Preisliste nicht übernommen, sondern wartet auf deine **Prüfung**: *Übernehmen* oder *Ablehnen*. Ungültige Preise (negativ, unplausibel hoch, falsche Währung) werden nie übernommen.

| Status | Bedeutung |
|---|---|
| **Aktuell** | Vor kurzem geprüft. |
| **Länger nicht geprüft** / **Veraltet** | Seit mehr als 48 Stunden bzw. 7 Tagen nicht geprüft; die Kosten werden weiter berechnet, aber markiert. |
| **Wartet auf Prüfung** | Eine größere Änderung wartet auf deine Entscheidung; bis dahin gilt der bisherige Preis. |
| **Individuell** | Ein Preis, den du festgelegt hast. |
| **Unbekannt** | Kein Preis bekannt; die Kosten bleiben unbekannt. |

**Individuelle Preise**, zum Beispiel Vertragspreise oder Korrekturen, legst du in der Tabelle mit dem Stift fest. Sie haben Vorrang vor dem Referenzpreis; mit *Zurück zum Referenzpreis* gilt wieder die Preisliste. Jede Änderung steht im **Änderungsverlauf**, und jede gespeicherte Nutzung merkt sich, mit welcher Preisversion und Quelle sie berechnet wurde (unten auf der Seite *Nutzung*).

**Ohne Internet** bleiben die letzten gültigen Preise in Gebrauch; sie altern nur in den Status *Länger nicht geprüft* und *Veraltet*. Mit `NODESTRO_PRICE_SYNC=off` ändert sich ein Preis nur, wenn du die Prüfung selbst startest.

**Auf einem Server** pflegt der Betreiber die Referenzpreise: Ein Worker prüft sie, und Prüfungen entscheidet er mit `nodestro-server pricing approve` oder `reject`. Arbeitsbereiche sehen die Referenzpreise nur lesend und können eigene individuelle Preise festlegen.

## Preismodus {#preismodus}
<!-- keywords: preismodus, streng, strict, standard, unbekannter preis ablehnen, veralteter preis -->

Der **Preismodus** unter *Einstellungen → Modellpreise* legt fest, was bei fehlenden oder alten Preisen passiert:

- **Standard:** Anfragen laufen; ihre Kosten erscheinen als unbekannt oder als Untergrenze, und Veraltetes wird markiert.
- **Streng:** Eine Anfrage an ein Modell ohne bekannten Preis, oder mit einem Preis, der seit mehr als 7 Tagen nicht geprüft wurde, wird abgelehnt, bevor sie etwas kostet. So hält ein Budget auch dann, wenn ein Preis fehlt.

## Abgleich mit Anbieter-Rechnungen {#abgleich}
<!-- keywords: abgleich, rechnung, abrechnung, openai costs, anthropic cost report, admin key, abweichung -->

Optional vergleicht Nodestro seine Schätzungen mit dem, was **OpenAI** und **Anthropic** tatsächlich abgerechnet haben, pro Tag und Modell (*Einstellungen → Mit Anbieter-Rechnungen abgleichen*). Dafür braucht es einen **Admin-Schlüssel** der Abrechnungs-API des Anbieters, getrennt von den normalen API-Schlüsseln. Der Abgleich liest nur.

- **Desktop:** Admin-Schlüssel werden nicht gespeichert. Setze `NODESTRO_OPENAI_ADMIN_KEY` oder `NODESTRO_ANTHROPIC_ADMIN_KEY`, oder gib einen Schlüssel nur für einen Abgleich ein.
- **Server:** Der Schlüssel wird verschlüsselt gespeichert und nie wieder angezeigt.

Eine Zeile gilt als **abweichend**, wenn die Differenz mehr als 5 % **und** mehr als 1 US-Dollar beträgt (beide Schwellenwerte sind einstellbar). Die letzten Tage gelten als *noch nicht final*, weil die Anbieter ihre Abrechnung nachträglich ergänzen. Tage, an denen Nodestro selbst Kosten nicht kennt, erscheinen als *Schätzung unvollständig*.

## Kosten sparen {#sparen}
<!-- keywords: sparen, günstiger, kosten senken, optimieren, tipps -->

- **Kleinstes passendes Modell:** Haiku für einfache Schritte, Sonnet für die meisten, Opus nur, wo nötig.
- **Aufwand senken:** *Niedrig* oder *Mittel* reicht für viele Aufgaben und spart Denk-Tokens.
- **Caching anlassen.**
- **Wissen gezielt nutzen:** *Durchsuchen* oder *Bei Bedarf* statt großer Dateien *Im Kontext*.
- **Max. Tokens und Tool-Runden begrenzen**, damit ein Agent sich nicht verrennt.
- **Budget setzen**, damit ein Lauf nie mehr kostet als geplant.
- **Qualitätsprüfung gezielt einsetzen:** Jede Prüfung und Überarbeitung kostet zusätzlich.

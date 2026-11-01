# Agenten

Ein Agent ist ein KI-Modell mit einer Rolle, einer Aufgabe und optionalen Werkzeugen. Das Modell kann von Anthropic, OpenAI, Google Gemini oder einem eigenen Server stammen. Dieses Kapitel erklärt jede Einstellung im Inspektor, ihre Wirkung und typische Werte.

## Grundlagen {#grundlagen}
<!-- keywords: name, beschreibung, symbol, icon, inspektor, aufbau -->

Wähle einen Agenten auf der Arbeitsfläche; der Inspektor zeigt seine Konfiguration. Häufige Einstellungen stehen oben, seltener gebrauchte in aufklappbaren Abschnitten (*Tools*, *Wissen*, *Memory*, *Ausgabeformat*, *Denken und Aufwand*, *Qualitätsprüfung*, *Erweitert*). Rechts neben jedem Abschnittstitel steht eine Kurzfassung, z. B. „2 zugewiesen“. Die Kurzfassung nennt jede Einstellung, die von einem neuen Agenten abweicht, z. B. „1 Ersatzmodell · kein Caching“ unter *Erweitert*. Probleme bleiben sichtbar, auch wenn ein Abschnitt zugeklappt ist: Sein Titel zeigt „1 Fehler“ oder „2 Warnungen“, und die Links unter *Probleme in* oben öffnen den Abschnitt und springen dorthin. Ein Abschnitt bleibt so offen oder zu, wie du ihn gelassen hast, auch beim nächsten Agenten und nach dem Neuladen. Das merkt sich nur dieser Browser; der Workflow und seine Exporte ändern sich dadurch nicht.

- **Symbol:** Klicke auf das Symbol links oben, um ein anderes zu wählen. Es dient nur der Übersicht.
- **Name:** Erscheint auf der Arbeitsfläche und ist zugleich der Platzhalter `{{Name}}` für Nachfolger.
- **Beschreibung:** Ein Satz zur Rolle des Agenten. Sie erscheint auf dem Knoten und dient dem KI-Entwurf als Ausgangspunkt.

Über die Symbole oben rechts speicherst du den Agenten als **Vorlage** in der Bibliothek, **duplizierst** ihn (Strg+D) oder **löschst** ihn.

## Modell {#modell}
<!-- keywords: modell, model, opus, sonnet, haiku, fable, preis, auswahl, welches modell -->

Das Modell bestimmt Fähigkeiten, Geschwindigkeit und Preis. Wähle zuerst den **Anbieter** und dann das **Modell**: aus der Liste bekannter Modelle oder als beliebige Modell-ID des Anbieters, die du eintippst (etwa ein neues OpenAI-Modell oder `llama3.1:8b` bei Ollama). Noch nicht eingerichtete Anbieter tragen den Zusatz „nicht eingerichtet“. Die Tabelle zeigt die bekannten Modelle mit ihren Preisen pro Million Tokens; „–“ heißt, der Preis ist unbekannt. Für solche Modelle bleiben die Kosten **unbekannt** und werden nie als 0 gezählt.

<!-- widget: models -->

**Faustregeln:**

- **Haiku 5.5** für Klassifizieren, Extrahieren und kurze, klar umrissene Aufgaben.
- **Sonnet 5.5** für die meisten Agentenaufgaben; der Standard für neue Agenten.
- **Opus 5.5** für anspruchsvolles Denken, Planung, Code und lange Aufgaben mit vielen Tools.
- **Fable 5.1** für die schwierigsten Aufgaben, wenn Qualität wichtiger ist als Kosten.

Das Standardmodell für neue Agenten legst du in den [Einstellungen](/docs/einstellungen#modelle) fest, die Zugänge der Anbieter unter [KI-Anbieter](/docs/einstellungen#anbieter). Einige Optionen gibt es nur bei Modellen von Anthropic: Thinking und Gedanken anzeigen, Prompt-Caching, Ausweichmodelle und Server-Tools. Bei anderen Anbietern blendet der Inspektor sie aus; ist eine davon noch gesetzt, meldet die Prüfung einen Fehler, statt sie stillschweigend wegzulassen.

**Amazon Bedrock:** Modell-IDs gehen genau so weiter, wie du sie eingibst, mit Doppelpunkten und Schrägstrichen: `bedrock:anthropic.claude-sonnet-4-5-20250929-v1:0`, `bedrock:eu.anthropic.claude-sonnet-5-5` oder ein ARN wie `bedrock:arn:aws:bedrock:eu-central-1:111122223333:application-inference-profile/abc`. Nur der erste Doppelpunkt trennt den Anbieter ab. Die Modelle der Liste sind Vorschläge, keine für dein Konto aktivierten Modelle. Claude auf Bedrock ist ein eigener Anbieter: Die Anthropic-Optionen oben bleiben auch dafür aus, und Optionen wie strukturierte Ausgabe oder Denkaufwand folgen dem, was das Modell auf Bedrock unterstützt (unbekannt bei einem eingegebenen ARN). Siehe [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).

## System-Prompt {#system-prompt}
<!-- keywords: system prompt, rolle, anweisung, persona, prompt engineering -->

Der System-Prompt beschreibt dauerhaft, **wer** der Agent ist und **wie** er arbeitet. Er gilt für jede Aufgabe des Agenten und wird bei aktiviertem Caching günstig wiederverwendet.

Ein guter System-Prompt enthält:

1. **Rolle:** „Du bist ein Finanzanalyst mit Schwerpunkt Industrieunternehmen.“
2. **Vorgehen:** „Prüfe jede Zahl auf Zeitraum und Einheit. Rechne mit dem Taschenrechner-Tool.“
3. **Qualitätsanspruch:** „Nenne Unsicherheiten ausdrücklich.“
4. **Ausgabe:** Sprache, Länge, Format („Antworte auf Deutsch in höchstens 200 Wörtern als Liste.“).

Vermeide Anweisungen, die zur konkreten Eingabe gehören; die stehen in der **Aufgabe**.

## Aufgabe {#aufgabe}
<!-- keywords: aufgabe, task, template, vorlage, platzhalter -->

Die Aufgabe ist die Nachricht, die der Agent pro Lauf erhält. Sie kann Platzhalter enthalten: `{{input}}`, `{{run.input}}` und `{{Name eines Vorgängers}}`. Die Regeln stehen unter [Platzhalter in Aufgaben](/docs/workflows#platzhalter).

Steht in der Aufgabe kein Platzhalter, weist der Inspektor darauf hin: Die Ergebnisse der Vorgänger werden dann unter „# Eingaben“ angehängt.

## Tools zuweisen {#tools}
<!-- keywords: tools zuweisen, werkzeuge, server-tools, websuche, web fetch, code execution -->

Im Abschnitt **Tools** wählst du aus der Tool-Bibliothek, welche Funktionen der Agent aufrufen darf. Die Liste ist nach *Eingebaut*, *Eigene* und *KI-generiert* gruppiert; beim Darüberfahren erscheint die Beschreibung.

Darunter schaltest du die **Server-Tools von Anthropic** ein: *Websuche*, *Web-Abruf* und *Code-Ausführung*. Sie laufen auf den Servern von Anthropic (siehe [Server-Tools](/docs/tools#server-tools)). Server-Tools gibt es nur bei Modellen von Anthropic.

Der Agent entscheidet selbst, ob und wann er ein Tool aufruft, anhand des Namens und der Beschreibung. Wie oft er das darf, steuern [Max. Tool-Runden und Parallele Tools](/docs/agenten#limits); ob er muss, steuert [Tool-Choice](/docs/agenten#tool-choice).

## Wissen zuweisen {#wissen}
<!-- keywords: wissen zuweisen, dateien, pdf, kontext, bei bedarf, durchsuchen, zitate -->

Im Abschnitt **Wissen** weist du hochgeladene Dateien zu und wählst, **wie** der Agent sie bekommt:

- **Im Kontext:** Die Dateien stehen von Anfang an vollständig im Prompt.
- **Bei Bedarf:** Der Agent sieht einen Katalog und lädt Dateien selbst (Tool `files`).
- **Durchsuchen:** Der Agent sucht passende Textstellen (Tool `search`).

**Zitate aktivieren** lässt Antworten auf die genauen Fundstellen verweisen. Details und Empfehlungen stehen im Kapitel [Wissen](/docs/wissen#modi).

**Datei hochladen** im selben Abschnitt lädt eine oder mehrere Dateien direkt ins [Wissen](/docs/wissen#hochladen) und weist sie diesem Agenten zu. Die Datei ist sofort dauerhaft im Wissen gespeichert und kann auch von anderen Agenten genutzt werden; die Zuweisung ist eine normale Änderung des Agenten und wird mit dem Workflow gespeichert. *Rückgängig* oder *Verwerfen* entfernen nur die Zuweisung, nicht die Datei. Dateien, die du beim Start eines Laufs mitgibst, sind dagegen keine Wissensdateien: Sie gehören nur zu diesem Lauf.

## Memory {#memory}
<!-- keywords: memory, gedächtnis, notizen, pro lauf, dauerhaft, raum -->

Im Abschnitt **Memory** wählst du *Aus*, *Pro Lauf* oder *Dauerhaft* und bei dauerhaftem Memory einen **Memory-Raum**. Neue Räume legst du direkt hier an. **Mit KI einrichten** schlägt eine passende Dateistruktur vor. Alles Weitere steht im Kapitel [Memory](/docs/memory).

## Ausgabeformat {#ausgabeformat}
<!-- keywords: ausgabeformat, strukturiert, json, schema, felder, pydantic, feldname, typ, pflicht, output format -->

**Text (Markdown)** ist der Standard: Der Agent antwortet frei formuliert.

**Strukturiert (JSON)** zwingt den Agenten zu einem Objekt mit festen Feldern. Nodestro baut daraus ein JSON-Schema, die API liefert ein passendes Objekt, und das Ergebnis wird gegen das Schema geprüft. Nachfolger erhalten es als JSON; die Ausführung zeigt es formatiert.

Jedes Feld hat:

| Einstellung | Bedeutung |
|---|---|
| **Feldname** | Schlüssel im JSON, z. B. `summary` oder `key_metrics`. Erlaubt sind Buchstaben, Ziffern und `_`; der Name darf nicht mit einer Ziffer beginnen und muss eindeutig sein. Andere Zeichen werden beim Tippen durch `_` ersetzt. |
| **Typ** | *Text*, *Zahl* (Kommazahl), *Ganzzahl*, *Ja/Nein*, *Liste (Text)* oder *Liste (Zahlen)*. |
| **Beschreibung** | Erklärt dem Modell, was in das Feld gehört. Je genauer, desto besser. |
| **Pflicht** | Pflichtfelder sind immer gefüllt; optionale Felder dürfen `null` sein. |

**Beispiel** für eine Bewertung:

| Feldname | Typ | Beschreibung |
|---|---|---|
| `summary` | Text | Zusammenfassung in 2–3 Sätzen |
| `key_metrics` | Liste (Text) | Die wichtigsten Kennzahlen mit Einheit |
| `risk_score` | Ganzzahl | Risiko von 1 (gering) bis 5 (hoch) |
| `approved` | Ja/Nein | Ist die Analyse korrekt? |

Das Ergebnis sieht dann so aus:

```json
{
  "summary": "Umsatz und Marge sind deutlich gestiegen …",
  "key_metrics": ["Umsatzwachstum 27,6 %", "EBIT-Marge 16,8 %"],
  "risk_score": 2,
  "approved": true
}
```

**Einschränkungen:**

- Ein strukturiertes Format braucht mindestens ein Feld.
- Zitate lassen sich nicht mit einem strukturierten Format kombinieren.
- Lehnt das Modell eine Anfrage ab, gibt es kein Objekt; der Agent schlägt dann immer fehl, unabhängig von der Einstellung *Bei Ablehnung*.

## Denken und Aufwand {#denken}
<!-- keywords: effort, aufwand, thinking, denken, adaptive, between_tools, gedanken anzeigen, reasoning -->

**Aufwand (Effort)** bestimmt, wie gründlich das Modell arbeitet: *Niedrig*, *Mittel* (Standard), *Hoch*, *Sehr hoch* oder *Maximal*. Höherer Aufwand bedeutet mehr Denken, mehr Ausgabetokens und höhere Kosten, liefert bei schwierigen Aufgaben aber bessere Ergebnisse. *Modellstandard* überlässt die Wahl dem Modell.

**Thinking** legt fest, ob das Modell vor der Antwort nachdenkt:

| Einstellung | Wirkung | Einschränkung |
|---|---|---|
| *Modellstandard* / *Adaptiv* | Das Modell denkt, wenn es nützt. | – |
| *Nur zwischen Tool-Aufrufen* | Denkt nur zwischen Tool-Aufrufen, nicht vor der ersten Antwort. | Nur Sonnet 5.5 und nur bis Aufwand *Hoch*. |
| *Aus* | Kein Denken. | Nicht möglich bei Opus 5.5, Sonnet 5.5, Fable 5.1 und Fable 5; bei Opus 5 und Haiku 5.5 nur bis Aufwand *Hoch*. |

**Gedanken anzeigen** steuert, ob die Überlegungen in der Ausführung erscheinen: *Zusammengefasst anzeigen* (eine Zusammenfassung der Gedanken), *Fortschrittsmeldungen* (kurze Zwischenstände) oder *Weglassen*. Angezeigte Gedanken erscheinen im Tab *Gedanken*. Diese Einstellung lässt sich nicht mit Thinking *Aus* oder *Nur zwischen Tool-Aufrufen* kombinieren.

Gedanken zählen zu den **Ausgabetokens** und werden entsprechend berechnet.

Ist bei einem Modell unbekannt, ob es Denkaufwand unterstützt (eigene Server, unbekannte Modell-IDs), führt ein gesetzter Aufwand zu einem Fehler. Wähle dann *Modellstandard* oder gib die Fähigkeit unter [KI-Anbieter](/docs/einstellungen#anbieter) an. OpenAI-kompatible Endpunkte (etwa Ollama oder vLLM) nehmen gar keine Aufwand-Einstellung an; die Prüfung erklärt das und stellt mit **Aufwand auf Modellstandard setzen** den Agenten mit einem Klick um.

## Qualitätsprüfung {#qualitaet}
<!-- keywords: qualitätsprüfung, judge, evaluator, kriterien, überarbeitung, refine, llm as a judge, bewertung -->

Mit der Qualitätsprüfung prüft ein zweites Modell, der **Judge**, das Ergebnis des Agenten:

1. Der Agent erledigt seine Aufgabe.
2. Der Judge bewertet das Ergebnis **pro Kriterium** mit *bestanden* oder *nicht bestanden* und einer Begründung. Er sieht dabei auch die Tool-Aufrufe und deren Ergebnisse.
3. Hat ein Pflichtkriterium nicht bestanden, erhält der Agent die Begründung und überarbeitet seine Antwort.
4. Das wiederholt sich bis zur eingestellten Zahl an **Überarbeitungen** (0–5).

Das Ergebnis der Prüfung steht in der Ausführung beim Agenten: bestanden oder nicht, Anzahl der Versuche und die Begründung des Judges. Auch ein nicht bestandenes Ergebnis wird weitergegeben; der Lauf schlägt dadurch nicht fehl.

**Gute Kriterien** sind einzeln prüfbar: „Jede Zahl stammt aus einem Tool-Ergebnis“, „Nennt mindestens ein konkretes Risiko“, „Höchstens 150 Wörter“. Vage Kriterien wie „gut geschrieben“ führen zu unzuverlässigen Urteilen.

**Kosten:** Jede Prüfung und jede Überarbeitung ist eine zusätzliche Anfrage. Die Kosten des Judges zählen zum Agenten und zum Budget des Laufs. Eine neu eingeschaltete Prüfung startet mit dem Standardmodell aus den Einstellungen als **Judge-Modell**; du kannst es jederzeit ändern, und bestehende Prüfungen behalten ihr Modell. Agenten, die die KI entwirft (*Mit KI entwerfen* und der Workflow Architect), bekommen ebenso das Standardmodell als Judge; die Prüfung bleibt aus. Kann dieses Modell kein strukturiertes Urteil liefern, sagt der Entwurf das, und es wird kein anderes Modell gewählt. Die Kurzfassung des Abschnitts nennt den Judge. Ist der Judge dasselbe Modell wie der Agent, weist ein Hinweis darauf hin: Ein Modell bewertet die eigenen Antworten eher wohlwollend.

## Limits {#limits}
<!-- keywords: max tokens, max_tokens, tool runden, max_tool_rounds, parallele tools, max_parallel_tools, limit -->

| Einstellung | Standard | Wirkung |
|---|---|---|
| **Max. Tokens** | 8.000 | Höchstzahl an Ausgabetokens pro Antwort, inklusive Denken (bis 128.000). Ist sie erreicht, bricht der Agent mit `IncompleteResponseError` ab. |
| **Max. Tool-Runden** | 8 | Wie viele Runden aus Tool-Aufrufen der Agent pro Aufgabe machen darf (0–50). Danach endet er mit `MaxToolRoundsError`. Bei 0 darf er gar keine Tools aufrufen. |
| **Parallele Tools** | 1 | Wie viele Tool-Aufrufe einer Antwort gleichzeitig ausgeführt werden (1–16). Sinnvoll bei langsamen, unabhängigen Tools wie Websuchen. |

Erhöhe *Max. Tokens* bei langen Texten oder hohem Aufwand, und *Max. Tool-Runden*, wenn ein Agent viele Recherche-Schritte braucht.

## Tool-Choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, erzwingen, any, none, auto -->

| Einstellung | Wirkung |
|---|---|
| *Automatisch* | Das Modell entscheidet, ob es Tools nutzt (Standard). |
| *Keine Tools* | Das Modell antwortet ohne Tool-Aufrufe. |
| *Irgendein Tool erzwingen* | Die erste Antwort muss ein Tool-Aufruf sein. |
| *Bestimmtes Tool* | Die erste Antwort muss das gewählte Tool aufrufen. |

Opus 5.5, Sonnet 5.5 und Fable 5.1 lehnen erzwungene Tool-Aufrufe ab; die Prüfung meldet das. Verwende dort *Automatisch* mit einer Anweisung im System-Prompt oder ein strukturiertes Ausgabeformat.

## Tool-Fehler {#tool-fehler}
<!-- keywords: tool fehler, raise_tool_errors, fehlerbehandlung, toolexecutionerror -->

Ein Tool kann auf zwei Arten scheitern:

- **Erwartete Fehler** (das Tool meldet z. B. „unbekannte Zeitzone“): Der Agent erhält die Meldung immer als Ergebnis und kann reagieren.
- **Unerwartete Fehler** (ungültige Eingabe, Absturz, Zeitüberschreitung in der Sandbox): Mit **Tool-Fehler an das Modell zurückgeben** (Standard: an) sieht der Agent auch diese als Fehlerergebnis. Ist die Option aus, endet der Agent mit `ToolExecutionError`.

Fehlgeschlagene Tool-Aufrufe sind in der Ausführung mit einem Warnsymbol markiert.

## Prompt-Caching {#caching}
<!-- keywords: caching, cache, prompt caching, ttl, 5 minuten, 1 stunde -->

Ist **Prompt-Caching** an (Standard), speichert die API den gleichbleibenden Anfang einer Anfrage (System-Prompt, Tools, Wissen im Kontext, bisheriger Verlauf) zwischen. Folgeanfragen lesen ihn zu einem Bruchteil des Preises. Das lohnt sich bei Tool-Runden, Qualitätsprüfungen und wiederholten Läufen.

Die **Cache-Dauer** ist *5 Minuten* oder *1 Stunde*. Das Schreiben in den 1-Stunden-Cache kostet mehr. Details und Preise stehen unter [Caching und Kosten](/docs/nutzung#caching).

## Ablehnungen und Ausweichmodelle {#ablehnung}
<!-- keywords: ablehnung, refusal, fallback, ausweichmodell, sicherheit, refusalerror -->

Modelle können Anfragen aus Sicherheitsgründen ablehnen; manchmal ist das ein Fehlalarm.

**Bei Ablehnung durch das Modell:**

- *Als Fehler behandeln* (Standard): Der Agent schlägt mit `RefusalError` fehl; Nachfolger werden übersprungen.
- *Antworttext trotzdem übernehmen:* Der (meist leere) Text wird als Ergebnis weitergegeben.

**Ausweichmodelle:** Lehnt das Modell ab, beantwortet die API dieselbe Anfrage mit dem nächsten Modell der Liste. Kosten werden je antwortendem Modell berechnet. Sonnet 5.5 unterstützt keine eigene Liste; verwende Ausweichmodelle dort nicht.

## Beispiel-Nachrichten {#beispiele-nachrichten}
<!-- keywords: beispiele, few shot, beispiel nachrichten, messages, dialog -->

Beispiel-Nachrichten stehen vor der eigentlichen Aufgabe und zeigen dem Modell das gewünschte Format (Few-Shot-Prompting). Sie wechseln zwischen **Nutzer** und **Assistent**, beginnen mit einer Nutzer-Nachricht und enden mit einer Antwort des Assistenten. Leere Nachrichten werden ignoriert.

**Beispiel:** Nutzer: „Lieferung kam beschädigt an.“ – Assistent: „Kategorie: Reklamation · Dringlichkeit: hoch“.

## Request-Options {#request-options}
<!-- keywords: request options, betas, mcp, inference_geo, json, fortgeschritten -->

Für Fortgeschrittene: Ein JSON-Objekt, dessen Felder unverändert in jede API-Anfrage des Agenten übernommen werden, etwa `betas` oder Einstellungen, die Nodestro nicht eigens anbietet. Ungültiges JSON wird sofort markiert und nicht übernommen. Falsche Werte führen erst beim Lauf zu einem Fehler der API.

## Agent mit KI entwerfen {#ki-entwurf}
<!-- keywords: ki entwurf, agent beschreiben, architekt, agent architect, automatisch erstellen, dynamisch -->

Statt alles selbst einzustellen, beschreibst du den Agenten in eigenen Worten: Aufgabe, Eingaben, gewünschtes Ergebnis, Qualitätsanspruch. Der **Agent-Architekt** (das Assistenzmodell aus den Einstellungen) schlägt daraufhin vor:

- Name, Beschreibung und einen vollständigen System-Prompt,
- das günstigste geeignete Modell und den niedrigsten passenden Aufwand,
- passende vorhandene Tools und Server-Tools,
- Limits für Tokens und Tool-Runden.

Du siehst den Vorschlag mit den Kosten des Entwurfs und übernimmst ihn erst mit **Übernehmen**; danach bleibt alles editierbar. Im Editor behält der Agent beim Übernehmen seine bisherige Aufgabe.

Fehlen dem Architekten Fähigkeiten, nennt er **fehlende Tools** mit einer Beschreibung. Diese kannst du unter [Tools → Von KI erstellen](/docs/tools#ki-erstellen) erzeugen lassen. Der Architekt verwendet nur aktuelle Modelle, Aufwand höchstens *Sehr hoch*, höchstens 32.000 Tokens und 20 Tool-Runden.

Der Entwurf entsteht in der Sprache der Oberfläche, solange deine Beschreibung keine andere Sprache verlangt. Feldnamen und andere technische Bezeichner bleiben Englisch.

Aufrufbar über **Mit KI entwerfen** im Inspektor, **Agent beschreiben** in der Palette oder auf der Seite *Agentenbibliothek*.

## Agentenbibliothek {#bibliothek}
<!-- keywords: bibliothek, vorlage, template, wiederverwenden, agenten seite -->

Auf der Seite **Agentenbibliothek** verwaltest du wiederverwendbare Agenten-Vorlagen:

- **Leere Vorlage** oder **Agent beschreiben** legt eine neue Vorlage an.
- Im Editor speichert das Speichern-Symbol im Inspektor einen Agenten als Vorlage.
- Vorlagen bearbeitest du rechts mit demselben Formular wie im Editor; **Speichern** übernimmt, **Verwerfen** stellt den letzten Stand wieder her.
- Die neuesten acht Vorlagen erscheinen im Editor in der Palette unter **Aus der Bibliothek**.

Ein Agent aus einer Vorlage ist eine **Kopie**: Spätere Änderungen an der Vorlage wirken nicht auf bereits eingefügte Agenten.

## Agent testen {#agent-testen}
<!-- keywords: testen, test, ausprobieren, agent testen, probelauf, einzeln ausführen -->

**Agent testen** im Inspektor (im Editor und in der Agentenbibliothek) führt nur diesen einen Agenten mit seiner **aktuellen, auch ungespeicherten Konfiguration** aus:

1. Gib eine **Testeingabe** ein. Sie wird wie die Eingabe eines Laufs in die Aufgabe eingesetzt; Platzhalter für Vorgänger bleiben leer. Mit *Eingabe direkt als Aufgabe senden* geht nur dein Text an den Agenten.
2. **Test starten** zeigt die Antwort, alle Tool-Aufrufe, Fehler, Tokens, Kosten, Dauer und gegebenenfalls die Qualitätsprüfung.

Ein Test ist **kein Workflow-Lauf**: Er erscheint nicht unter *Ausführungen* und ändert keine Ergebnisse. Dauerhaftes Memory wird nur gelesen; der Test arbeitet auf einer Kopie. Ein Test ruft den Anbieter des Modells auf und **kann Geld kosten**; der Dialog nennt die Preise des Modells, sofern sie bekannt sind, und die Kosten erscheinen auf der Seite [Nutzung](/docs/nutzung#statistik).

## Validierung und Meldungen {#validierung}
<!-- keywords: validierung, fehlermeldung, problem, warnung, rot, inspektor meldung -->

Der Inspektor prüft jede Änderung mit den Regeln der Library, ohne die API aufzurufen:

- **Rote Meldungen** (Fehler) verhindern den Start, z. B. ein unbekanntes Tool, ein ungültiger Feldname, Thinking-Einstellungen, die das Modell nicht unterstützt, oder eine Qualitätsprüfung ohne Kriterium.
- **Gelbe Meldungen** (Warnungen) erlauben den Start, z. B. Code-Ausführung zusammen mit Websuche.
- **Graue Hinweise** informieren, z. B. dass Eingaben angehängt werden, weil die Aufgabe keinen Platzhalter enthält.

Häufige Meldungen und ihre Lösung stehen unter [Häufige Fehler](/docs/faq#haeufige-fehler).

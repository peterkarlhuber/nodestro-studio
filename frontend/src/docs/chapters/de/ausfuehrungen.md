# Ausführungen

Jeder Lauf eines Workflows wird vollständig aufgezeichnet: Eingabe, Ergebnisse, Aufgaben, Tool-Aufrufe, Gedanken, Memory, Fehler, Zeiten, Tokens und Kosten. Dieses Kapitel erklärt die Ansichten, die Status, den Export und Import von Traces und wie du Fehler interpretierst.

## Überblick {#ueberblick}
<!-- keywords: ausführungen, läufe, runs, historie, protokoll, trace -->

Läufe siehst du an zwei Stellen:

- **Im Editor** in der *Ausführungsübersicht* unter der Arbeitsfläche: der jeweils letzte Lauf dieses Workflows, live während er läuft.
- Auf der Seite **Ausführungen**: alle Läufe aller Workflows, mit Detailansicht.

Ausführungen bleiben erhalten, auch wenn du den Workflow änderst oder löschst; jeder Lauf speichert den Workflow so, wie er beim Start war.

## Live zusehen {#live}
<!-- keywords: live, streaming, zusehen, ausführungsübersicht, fortschritt, echtzeit -->

Während eines Laufs zeigt die **Ausführungsübersicht**:

- oben die Zahl der Agenten, API-Anfragen, Tokens und die geschätzten Kosten, laufend aktualisiert,
- links alle Agenten mit Status; ein Klick zeigt rechts deren Details, *Gesamtergebnis* das Ergebnis des Workflows,
- rechts den Text, den der gewählte Agent gerade schreibt, seine Tool-Aufrufe und (falls aktiviert) seine Gedanken.

Auf der Arbeitsfläche zeigt jeder Agent seinen Status, nach dem Lauf auch Tokens und Kosten. Verbindungen, über die Daten geflossen sind, sind hervorgehoben.

## Die Liste der Ausführungen {#liste}
<!-- keywords: liste, filter, status filter, workflow filter, löschen, herkunft -->

Die Seite **Ausführungen** listet die Läufe, neueste zuerst, mit Workflow, Status, Startzeit, Dauer, Anfragen, Tokens und Kosten. Unter dem Workflow-Namen steht die Eingabe oder die Fehlermeldung.

- **Filter:** nach Workflow, nach Status und nach Herkunft (*Eigene Läufe* oder *Importierte Traces*).
- **Löschen:** Papierkorb-Symbol; laufende Ausführungen lassen sich nicht löschen.
- **Trace importieren:** siehe [Traces importieren](/docs/ausfuehrungen#trace-import).

Die Liste aktualisiert sich alle fünf Sekunden.

## Die Detailansicht {#details}
<!-- keywords: details, detailansicht, ablauf, wasserfall, timeline, tabs, ergebnis, aufgabe, gedanken -->

Ein Klick auf einen Lauf öffnet die Detailansicht:

1. **Kennzahlen:** Status mit Gesamtdauer, API-Anfragen, Tokens (aufgeschlüsselt in Eingabe, Ausgabe, Cache und Denken) und geschätzte Kosten.
2. **Eingabe und Ergebnis** des Workflows nebeneinander.
3. **Ablauf:** ein Zeitstrahl aller Agenten in der Reihenfolge ihres Starts. Jeder Balken zeigt, wann der Agent lief; übereinanderliegende Balken liefen parallel. Daneben stehen Dauer, Tokens und Zahl der Tool-Aufrufe.
4. **Details des gewählten Agenten:** Dauer, Start- und Endzeit, Tokens, Anfragen und Kosten, ein eventueller Fehler, das Ergebnis der Qualitätsprüfung und die Tabs:

| Tab | Inhalt |
|---|---|
| **Ergebnis** | Die Ausgabe des Agenten, als Markdown oder formatiertes JSON. |
| **Aufgabe** | Die Aufgabe, wie sie nach dem Einsetzen der Platzhalter an den Agenten ging. Ideal, um Datenfluss-Probleme zu finden. |
| **Tools** | Jeder Tool-Aufruf mit Eingabe, Ergebnis, Zeitpunkt, Dauer und Erfolg. |
| **Gedanken** | Die Überlegungen des Modells (nur wenn *Gedanken anzeigen* aktiv war). |
| **Memory** | Die Notizen eines Agenten mit Memory *Pro Lauf*. |

Mit **Im Editor öffnen** gelangst du zum Workflow; **Abbrechen** stoppt einen laufenden Lauf.

Der Tab **Kontext** zeigt, was der Agent in diesem Lauf bekommen hat: System-Prompt, Aufgabe mit markierten Eingaben, Beispiel-Nachrichten, Tools, Wissen, Memory, Ausgabeformat und Qualitätsprüfung, jeweils mit der Konfiguration zum Startzeitpunkt. Zugangsdaten werden nie angezeigt.

## Status {#status}
<!-- keywords: status, fertig, fehler, übersprungen, abgebrochen, wartet, läuft, warteschlange -->

| Status | Bedeutung |
|---|---|
| **Wartet** | Der Knoten wartet, bis alle Vorgänger fertig sind. |
| **In Warteschlange** | Der Lauf ist angelegt und startet gleich. |
| **Läuft** | Wird gerade ausgeführt. |
| **Fertig** | Erfolgreich abgeschlossen. |
| **Fehler** | Fehlgeschlagen; die Meldung steht in den Details. Ein Lauf ist *Fehler*, sobald ein Knoten fehlschlägt. |
| **Übersprungen** | Der Knoten lief nicht, weil sein Zweig nicht gewählt wurde. Das ist kein Fehler. |
| **Blockiert** | Der Knoten lief nicht, weil ein Vorgänger fehlgeschlagen ist oder abgebrochen wurde. |
| **Wartet auf Freigabe** | Eine [Freigabe](/docs/verzweigungen#freigabe) wartet auf die Entscheidung einer Person. |
| **Pausiert** | Der Lauf wartet auf eine Freigabe und geht nach der Entscheidung weiter. |
| **Abgebrochen** | Durch *Abbrechen* gestoppt, abgelehnt, oder ein unvollständig exportierter Trace. |

Ein fehlgeschlagener oder abgebrochener Lauf lässt sich [fortsetzen](/docs/verzweigungen#fortsetzen). Läufe aus Zeitplänen, Stapelläufen, Testreihen und Unterworkflows zeigen ihre Herkunft in der Liste und in den Details.

## Das Ergebnis eines Laufs {#ergebnis}
<!-- keywords: ergebnis, output, gesamtergebnis, ausgabe des workflows, senke -->

- Gibt es **Ergebnis-Knoten**, ist deren Inhalt das Ergebnis. Ein Ergebnis-Knoten mit einem Vorgänger übernimmt dessen Ausgabe; mit mehreren Vorgängern ein Objekt mit einem Eintrag je Vorgänger.
- Gibt es **keinen** Ergebnis-Knoten, gelten die Agenten ohne Nachfolger als Ergebnis.
- Bei mehreren Ergebnis-Knoten (oder letzten Agenten) ist das Ergebnis ein Objekt mit einem Eintrag je Knoten, benannt nach dem Knoten.

## Läufe abbrechen {#abbrechen}
<!-- keywords: abbrechen, stoppen, cancel, beenden -->

**Abbrechen** (in der Ausführungsübersicht oder der Detailansicht) stoppt den Lauf. Laufende Agenten halten beim nächsten Schritt an (nächster Textabschnitt, nächste Anfrage oder nächster Tool-Aufruf); noch nicht gestartete Agenten werden nicht mehr ausgeführt. Bis dahin verbrauchte Tokens werden berechnet und angezeigt.

## Trace exportieren {#trace-export}
<!-- keywords: trace exportieren, export, json, run json, teilen, archivieren, bereinigen, anonymisieren, datenschutz, personenbezogene daten -->

**Trace exportieren** in der Detailansicht speichert einen Lauf als JSON-Datei: den Workflow zum Startzeitpunkt, Eingabe, Status, Ergebnis, und je Agent Aufgabe, Ergebnis, Text, Gedanken, Tool-Aufrufe mit Ein- und Ausgaben, Fehler, Qualitätsprüfung, Memory, Zeitstempel, Tokens und Kosten. Der Dialog bietet zwei Arten:

- **Vollständig:** alles, wie gespeichert. Gib die Datei nur weiter, wenn darin nichts Vertrauliches steht.
- **Bereinigt zum Teilen:** API-Schlüssel, Tokens, Passwörter und private Schlüssel werden immer ersetzt. Wahlweise ersetzt Nodestro auch **personenbezogene Daten** (E-Mail-Adressen, Telefonnummern, IBANs, Kartennummern, IP-Adressen) und entfernt ganze **Inhalte** (Eingaben, Prompts, Ausgaben, Tool-Daten, Memory); übrig bleiben dann Ablauf, Status, Modelle, Zeiten und Tokens.

Ersetzte Stellen erhalten Platzhalter wie `[EMAIL_1]`; gleiche Werte bekommen denselben Platzhalter. Bereinigt wird nur die heruntergeladene Kopie, der gespeicherte Lauf bleibt unverändert. Die Erkennung arbeitet mit Mustern und findet **nicht garantiert alles**, etwa keine Namen oder Adressen. Sieh dir die Datei vor dem Weitergeben an.

Tool-Ergebnisse sind auf 20.000 Zeichen pro Aufruf gekürzt.

## Traces importieren {#trace-import}
<!-- keywords: trace importieren, import, json, öffnen, ansehen, duplikat, wiederherstellen -->

**Trace importieren** auf der Seite *Ausführungen* öffnet exportierte Trace-Dateien wieder, auch mehrere auf einmal und auch auf einem anderen Rechner.

So funktioniert der Import:

- Der Trace erscheint als eigene Ausführung mit der Markierung **Importiert** und öffnet sich in der gewohnten Detailansicht: Ergebnisse, Agenten, Tool-Aufrufe, Ein- und Ausgaben, Fehler, Zeitstempel, Qualitätsprüfungen, Tokens und Kosten, soweit sie im Trace enthalten sind.
- **Nichts wird ausgeführt.** Es gibt keine Anfrage an einen KI-Anbieter und keine Kosten.
- Importierte Traces werden **dauerhaft gespeichert** und lassen sich wie jede Ausführung erneut öffnen, filtern, exportieren und löschen.
- **Vorhandene Ausführungen werden nie überschrieben:** Jeder Import bekommt eine neue ID; die ursprüngliche ID steht in der Detailansicht.
- **Duplikate:** Ist derselbe Lauf schon vorhanden (das Original oder ein früherer Import derselben Datei), legt Nodestro keine Kopie an, sondern öffnet die vorhandene Ausführung und weist darauf hin.
- **Unvollständige Traces:** Wurde ein Lauf exportiert, während er noch lief, erscheint er als *Abgebrochen* mit einem Hinweis.
- **Nutzung:** Importierte Läufe zählen nicht zur Nutzungsstatistik, weil ihre Kosten nicht in dieser Installation entstanden sind.
- **Im Editor öffnen** fehlt bei importierten Traces, weil der zugehörige Workflow hier meist nicht existiert. Den Workflow selbst überträgst du mit dem [Workflow-Export](/docs/workflows#import-export).

**Ungültige Dateien** werden mit einer verständlichen Meldung abgelehnt, ohne dass etwas gespeichert wird: kein JSON, ein Workflow-Export statt eines Traces, fehlende Pflichtfelder oder beschädigte Werte. Ein Trace darf höchstens 50 MB groß sein.

## Läufe vergleichen {#vergleich}
<!-- keywords: vergleich, vergleichen, unterschied, diff, gegenüberstellen, zwei läufe -->

Markiere in der Liste der Ausführungen zwei Läufe mit dem Kästchen am Zeilenanfang und klicke **Vergleichen**. Die Vergleichsansicht stellt beide nebeneinander:

- **Kennzahlen:** Status, Dauer, Anfragen, Eingabe- und Ausgabe-Tokens, Kosten, Tool-Aufrufe und fehlgeschlagene Agenten. Abweichende Zeilen sind markiert, mit der Differenz von B zu A.
- **Endergebnis:** als Zeilenvergleich (nur in A, nur in B) oder nebeneinander.
- **Agenten:** je Agent Modell, Status, Dauer, Tokens, Kosten, Tools, Fehler und Bewertung. Badges nennen, was sich unterscheidet; Ausgaben und Bewertungs-Rückmeldungen lassen sich direkt vergleichen.

Verglichen werden nur gespeicherte Daten, nichts wird erneut ausgeführt. Gehören die Läufe zum selben Workflow, werden Agenten über ihren Knoten zugeordnet, sonst über ihren Namen. Hat sich der Workflow zwischen den Läufen geändert, weist die Ansicht darauf hin. Auch importierte Traces lassen sich vergleichen.

## Fehler interpretieren {#fehler}
<!-- keywords: fehler, fehlermeldung, error, interpretieren, ursache, lösung, refusalerror, budgetexceedederror -->

Fehler stehen in der Ausführung beim Lauf (Zusammenfassung „Fehlgeschlagen: …“) und beim jeweiligen Agenten (rote Meldung). Die Meldung erscheint in der Sprache der Oberfläche und nennt meist den Fehlertyp. Unter **Technische Details** steht der Originaltext des Servers oder der API, etwa um ihn in einer Fehlermeldung weiterzugeben.

| Meldung | Bedeutung | Lösung |
|---|---|---|
| `BudgetExceededError` | Das Budget des Laufs ist aufgebraucht. | Budget im Workflow oder in den Einstellungen erhöhen, oder günstigere Modelle wählen. |
| `RefusalError` | Das Modell hat die Anfrage abgelehnt. | Aufgabe umformulieren, Ausweichmodelle festlegen oder *Antworttext trotzdem übernehmen* wählen. |
| `MaxToolRoundsError` | Mehr Tool-Runden als erlaubt. | *Max. Tool-Runden* erhöhen oder die Aufgabe präzisieren. |
| `IncompleteResponseError` | Die Antwort erreichte *Max. Tokens* oder das Kontextfenster. | *Max. Tokens* erhöhen, Wissen verkleinern. |
| `ToolExecutionError` | Ein Tool ist unerwartet fehlgeschlagen und *Tool-Fehler an das Modell zurückgeben* war aus. | Tool unter *Ausprobieren* testen, Option einschalten. |
| *Der KI-Anbieter meldete einen Fehler …* | Der Anbieter hat einen Fehler gemeldet (z. B. ungültiger Schlüssel, Überlastung, unbekannte Modell-ID, ungültige Request-Options). | Schlüssel und Modell-ID prüfen, später erneut versuchen, Request-Options prüfen. |
| *Übersprungen, weil ein vorheriger Knoten nicht erfolgreich war.* | Folge eines Fehlers weiter vorne. | Den ersten fehlgeschlagenen Agenten beheben. |
| *Der Lauf wurde abgebrochen.* | Jemand hat *Abbrechen* gewählt. | – |

Weitere Meldungen und Lösungen stehen unter [Häufige Fehler](/docs/faq#haeufige-fehler).

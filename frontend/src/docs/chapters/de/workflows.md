# Workflows

Ein Workflow verbindet Agenten zu einer Pipeline. Dieses Kapitel erklärt, wie du Workflows anlegst, Knoten verbindest, wie die Daten zwischen den Agenten fließen und wie du einen Lauf startest.

## Workflows anlegen und verwalten {#anlegen}
<!-- keywords: neuer workflow, erstellen, löschen, duplizieren, kopie, übersicht -->

Die Seite **Workflows** zeigt alle Workflows als Karten mit Anzahl der Agenten, letzter Änderung und dem Status des letzten Laufs.

Drei gleichwertige Wege zum Start stehen auf der Seite: **Mit KI erstellen** öffnet den Dialog für einen neuen Workflow mit dem [Workflow-Architekten](/docs/ki-architekt#neu-erstellen), **Mit einem Beispiel beginnen** öffnet die [Beispiel-Galerie](/docs/beispiele) und **Selbst aufbauen** öffnet denselben Dialog für einen leeren Workflow. Solange es keinen Workflow gibt, erscheinen sie als große Kacheln, danach als schmale Zeile über der Liste.

- **Neuer Workflow:** Name und optionale Beschreibung eingeben. Der neue Workflow enthält bereits *Start → Agent → Ergebnis*.
- **Mit KI erstellen:** Im selben Dialog beschreibst du dein Vorhaben, und der [Workflow-Architekt](/docs/ki-architekt#neu-erstellen) entwirft den Workflow zur Prüfung.
- **Öffnen:** Karte anklicken.
- **Duplizieren:** Kopie-Symbol auf der Karte. Die Kopie heißt „… (Kopie)“; Ausführungen werden nicht mitkopiert.
- **Löschen:** Papierkorb-Symbol. Bisherige Ausführungen bleiben unter *Ausführungen* erhalten.

## Favoriten und Tags {#favoriten-tags}
<!-- keywords: favorit, favoriten, stern, tag, tags, schlagwort, filtern, ordnen -->

Workflows, Agenten-Vorlagen und Tools lassen sich mit dem **Stern** als Favorit markieren. Favoriten stehen in den Listen immer oben. Über das **Etikett-Symbol** vergibst du Tags wie „Kunde A“ oder „Entwurf“; vorhandene Tags werden vorgeschlagen.

Über den Listen filterst du nach **Nur Favoriten** und nach einem Tag. Favoriten und Tags werden getrennt von den Objekten gespeichert: Sie ändern weder Workflows noch Agenten noch Tools und erscheinen auch in der [Suche](/docs/start#suche). Ordner gibt es bewusst nicht.

## Der Editor {#editor}
<!-- keywords: bereiche, größe ändern, trennlinie, eigenschaften, arbeitsfläche, canvas, palette, bausteine, inspektor, ausführungsübersicht, zoom, minimap -->

Der Editor besteht aus vier Bereichen:

1. **Titelleiste:** Name, *Export*, *Speichern*, *Agent hinzufügen* und *Workflow starten*.
2. **Arbeitsfläche:** die Knoten und Verbindungen. Oben links steht, ob es ungespeicherte Änderungen gibt und wie viele Agenten und Verbindungen der Workflow hat. Unten links findest du Zoom, *Alles anzeigen*, *Automatisch anordnen* sowie *Rückgängig* und *Wiederholen*. Oben rechts zeigt eine Übersichtskarte den gesamten Workflow.
3. **Bausteine (Palette):** *Agent* (leer), *Agent beschreiben* (die KI entwirft die Konfiguration), *Start*, *Ergebnis* und bis zu acht Vorlagen aus der Agenten-Bibliothek. Ziehe einen Baustein auf die Fläche oder klicke ihn an.
4. **Inspektor (rechts):** Ohne Auswahl zeigt er die Workflow-Einstellungen, sonst die Konfiguration des gewählten Knotens.

Unter der Arbeitsfläche liegt die **Ausführungsübersicht** mit dem letzten Lauf dieses Workflows.

Bausteine, Inspektor (Überschrift *Eigenschaften*) und Ausführungsübersicht sind Bereiche, die du anpassen kannst. Die Schaltfläche im Kopf eines Bereichs blendet ihn aus oder ein; ein ausgeblendeter Bereich lässt eine schmale Leiste stehen, und die Bausteine bleiben dann als Symbole erreichbar. Die Trennlinie zwischen Bereich und Arbeitsfläche ändert die Größe: Ziehe sie oder wähle sie mit *Tab* aus und nutze die Pfeiltasten (mit *Umschalt* in größeren Schritten). Ein Doppelklick auf die Trennlinie stellt die Standardgröße wieder her. Ist der Inspektor ausgeblendet, nennt seine Leiste den gewählten Knoten; ein Doppelklick auf einen Knoten zeigt seine Eigenschaften. Nodestro merkt sich die Aufteilung in diesem Browser für alle Workflows. Sie gehört nicht zum Workflow: Eine Änderung erzeugt nie ungespeicherte Änderungen oder einen Rückgängig-Schritt, und ein laufender Workflow läuft weiter.

## Knotenarten {#knoten}
<!-- keywords: start, ergebnis, output, agent, knoten, eingang, ausgang -->

| Knoten | Aufgabe | Eingänge | Ausgänge |
|---|---|---|---|
| **Start** | Liefert die Eingabe, die du beim Starten eingibst. Optional mit einem *Vorschlag für die Eingabe* oder einem [Eingabeformular](/docs/verzweigungen#eingabeformular). | keine | beliebig viele |
| **Agent** | Ruft sein KI-Modell mit seiner Konfiguration auf und liefert ein Ergebnis (Text oder JSON). | beliebig viele | beliebig viele |
| **Entscheidung** | Wählt nach festen Regeln einen oder mehrere Zweige, ohne KI-Anfrage. | einer oder mehrere | ein Ausgang je Zweig |
| **Freigabe** | Hält den Lauf an, bis eine Person freigibt oder ablehnt. | beliebig viele | *Freigegeben*, *Abgelehnt* |
| **Unterworkflow** | Führt einen anderen gespeicherten Workflow als einen Schritt aus. | beliebig viele | beliebig viele |
| **Ergebnis** | Sammelt die Ergebnisse der verbundenen Agenten als Ausgabe des Workflows, auf Wunsch auch als Dateien. | beliebig viele | keine |

Start- und Ergebnis-Knoten sind optional: Agenten ohne Vorgänger erhalten automatisch die Eingabe des Laufs, und ohne Ergebnis-Knoten gilt die Ausgabe der letzten Agenten als Ergebnis (siehe [Ergebnis eines Laufs](/docs/ausfuehrungen#ergebnis)). Entscheidung, Freigabe und Unterworkflow findest du in der Palette unter *Ablauf steuern*; mehr dazu unter [Verzweigungen und Freigaben](/docs/verzweigungen).

Jeder Knoten hat einen eindeutigen Namen. Legst du einen zweiten Agenten mit gleichem Namen an, hängt Nodestro eine Nummer an („Agent 2“). Der Name eines Agenten ist zugleich sein Platzhalter in Aufgaben.

## Agenten verbinden {#verbinden}
<!-- keywords: verbindung, kante, edge, port, ziehen, kreis, zyklus, löschen -->

Ziehe vom **rechten Punkt** (Ausgang) eines Knotens zum **linken Punkt** (Eingang) eines anderen. Eine Verbindung bedeutet: Der Zielknoten wartet, bis der Quellknoten fertig ist, und erhält dessen Ergebnis.

Nodestro verhindert ungültige Verbindungen und erklärt den Grund:

- Ein Knoten kann nicht mit sich selbst verbunden werden.
- Der Start-Knoten hat keinen Eingang, der Ergebnis-Knoten keinen Ausgang.
- Dieselbe Verbindung kann es nur einmal geben.
- **Keine Kreise:** Daten fließen immer in eine Richtung. Eine Verbindung, die zurück zu einem Vorgänger führt, wird abgelehnt.

Zum Löschen wählst du die Verbindung an und drückst **Entf** oder **Rücktaste**. Während eines Laufs leuchten Verbindungen auf, über die gerade Daten fließen.

## Datenfluss zwischen Agenten {#datenfluss}
<!-- keywords: datenfluss, eingabe, input, weitergabe, vorgänger, nachfolger, json, mehrere eingänge -->

So bekommt ein Agent seine Aufgabe:

1. Nodestro nimmt die **Aufgabe** des Agenten (Feld *Aufgabe* im Inspektor, Standard: `{{input}}`).
2. Platzhalter werden durch die Ergebnisse der **direkten Vorgänger** und die Eingabe des Laufs ersetzt.
3. Ergebnisse von Vorgängern, die in der Aufgabe nicht vorkommen, werden unter der Überschrift **„# Eingaben“** angehängt, jeweils mit dem Namen des Vorgängers als Zwischenüberschrift. So geht nie etwas still verloren.
4. Ist die Aufgabe danach leer, erhält der Agent die Eingabe des Laufs.

**Was weitergegeben wird:**

- Ein Text-Ergebnis wird als Text weitergegeben.
- Ein strukturiertes Ergebnis wird als formatiertes JSON weitergegeben.
- Der Start-Knoten gibt die Eingabe des Laufs weiter.
- Agenten ohne Vorgänger erhalten die Eingabe des Laufs.

Ein Agent sieht nur die Ergebnisse seiner **direkten** Vorgänger, nicht die von Knoten weiter vorne. Braucht er die ursprüngliche Eingabe, verwende `{{run.input}}`.

## Platzhalter in Aufgaben {#platzhalter}
<!-- keywords: platzhalter, template, {{input}}, {{run.input}}, variable, vorlage, aufgabe -->

| Platzhalter | Wird ersetzt durch |
|---|---|
| `{{input}}` | das Ergebnis des einzigen Vorgängers; bei mehreren Vorgängern alle Ergebnisse, jeweils als Abschnitt `## Name`; ohne Vorgänger die Eingabe des Laufs. Direkt nach einem Startknoten mit ausgefülltem Formular sind das nur die Formularwerte; für Formularwerte und zusätzlichen Text `{{run.input}}` verwenden |
| `{{run.input}}` (oder `{{workflow.input}}`) | die Eingabe beim Start des Workflows, an jeder Stelle des Workflows |
| `{{Name des Vorgängers}}` | das Ergebnis genau dieses direkten Vorgängers |

Groß- und Kleinschreibung spielen bei Platzhaltern keine Rolle. Im Inspektor erscheinen unter dem Aufgabenfeld Schaltflächen für alle direkten Vorgänger; ein Klick fügt den passenden Platzhalter ein.

**Beispiel:** Ein Autor-Agent hat die Vorgänger *Zielgruppe* und *Gliederung*:

```
Schreibe den Artikel zum Thema „{{run.input}}“.

Zielgruppe:
{{Zielgruppe}}

Gliederung:
{{Gliederung}}
```

> **Häufiger Fehler:** Benennst du einen Vorgänger um, passen alte Platzhalter nicht mehr. Ein unbekannter Platzhalter bleibt als Text stehen, und das Ergebnis des Vorgängers wird unter „# Eingaben“ angehängt. Prüfe nach dem Umbenennen die Aufgaben der Nachfolger.

## Eingabe-Vorschau {#eingabe-vorschau}
<!-- keywords: vorschau, eingabe, kontext, prompt ansehen, platzhalter prüfen, was bekommt der agent -->

Die Sektion **Eingabe-Vorschau** im Inspektor eines Agenten zeigt, was der Agent beim nächsten Lauf bekommen würde, ohne die API aufzurufen:

- den **System-Prompt** und die **Aufgabe** mit eingesetzten Platzhaltern. Jede eingesetzte Stelle ist markiert; fährst du darüber, siehst du ihre Herkunft.
- welche **Eingaben** vorhanden sind. Ergebnisse der Vorgänger stammen aus dem letzten Lauf dieses Workflows. Hat ein Vorgänger noch kein Ergebnis, steht an seiner Stelle ein gelb markierter Hinweis statt eines geratenen Werts.
- Platzhalter, die zu keinem verbundenen Vorgänger passen.
- die übrigen Teile des Kontexts: Beispiel-Nachrichten, Tools, Wissen, Memory, Ausgabeformat und Qualitätsprüfung.

Zugangsdaten in Request-Options werden nie angezeigt. Für einen abgeschlossenen Lauf zeigt der Tab **Kontext** in den [Details](/docs/ausfuehrungen#details), was der Agent damals bekommen hat.

## Parallele Ausführung {#parallel}
<!-- keywords: parallel, gleichzeitig, verzweigung, zusammenführen, reihenfolge -->

Jeder Knoten startet, sobald **alle** seine Vorgänger fertig sind. Knoten ohne gegenseitige Abhängigkeit laufen gleichzeitig. Im Beispiel *Blogartikel* arbeiten *Zielgruppe* und *Gliederung* parallel; der *Autor* startet erst, wenn beide fertig sind.

Parallele Zweige verkürzen die Laufzeit, kosten aber gleich viele Tokens wie nacheinander ausgeführte Agenten.

**Fehler in einem Zweig:** Schlägt ein Agent fehl, werden alle Knoten, die von ihm abhängen, **übersprungen**. Unabhängige Zweige laufen weiter. Der Lauf endet dann mit dem Status *Fehler*.

## Workflow-Einstellungen {#einstellungen}
<!-- keywords: name, beschreibung, inspektor, workflow einstellungen -->

Klicke auf eine leere Stelle der Arbeitsfläche, um im Inspektor die Einstellungen des Workflows zu sehen: **Name**, **Beschreibung** und **Budget pro Lauf**. Darunter stehen die Probleme, die einen Start verhindern, und eine Kurzübersicht der Bedienung.

## Budget pro Lauf {#budget}
<!-- keywords: budget, kostenlimit, limit, usd, dollar, abbruch, budgetexceedederror -->

Das Budget begrenzt die **geschätzten Kosten** eines Laufs in US-Dollar, über alle Agenten und Qualitätsprüfungen hinweg.

- Ist im Workflow kein Budget eingetragen, gilt das **Standardbudget** aus den Einstellungen (anfangs 2 USD).
- Ist auch dort nichts eingetragen, ist der Lauf unbegrenzt.
- Nach jeder Antwort der API werden die Kosten addiert. Ist das Budget überschritten, bricht der laufende Agent ab (Fehler `BudgetExceededError`), und weitere Anfragen werden nicht mehr gestellt.

Weil erst nach einer Antwort gezählt wird, kann eine einzelne Anfrage das Budget leicht überschreiten. Anfragen ohne bekannten Preis zählen mit 0.

## Prüfung vor dem Start {#pruefung}
<!-- keywords: prüfung, validierung, probleme, start gesperrt, fehler, warnung, hinweis -->

Nodestro prüft den Workflow bei jeder Änderung (nach einer halben Sekunde Pause), ohne die API aufzurufen und ohne Kosten:

- **Struktur:** Gibt es mindestens einen Agenten? Hat der Start-Knoten keine Eingänge und der Ergebnis-Knoten keine Ausgänge? Gibt es keine Kreise, keine doppelten und keine ins Leere zeigenden Verbindungen? Hat der Ergebnis-Knoten einen Eingang?
- **Agenten:** Jede Konfiguration wird mit den Regeln der Library geprüft. Agenten mit Fehlern zeigen auf der Arbeitsfläche „1 Problem“.
- **Verbindungen und Platzhalter:** Platzhalter, die zu keinem verbundenen Vorgänger passen, Agenten ohne Eingang, Ergebnisse, die nirgends ankommen, und doppelte Agentennamen.
- **Einstellungen:** nicht eingerichtete Anbieter, gelöschte Wissens- oder Startdateien, Modelle ohne bekannten Preis und ein Budget von 0.

Die Ergebnisse stehen im Inspektor des Workflows (Klick auf eine leere Stelle der Arbeitsfläche), sortiert nach **Fehlern** und **Hinweisen**. Ein Klick auf eine Meldung wählt den betroffenen Agenten aus oder markiert die betroffene Verbindung; fehlerhafte Verbindungen erscheinen rot gestrichelt.

Solange **Fehler** bestehen, ist **Workflow starten** gesperrt; fahre mit der Maus über die Schaltfläche, um die Gründe zu sehen. **Hinweise** blockieren den Start nicht; der Startdialog zeigt sie noch einmal.

## Einen Lauf starten {#starten}
<!-- keywords: starten, ausführen, run, startdialog, eingabe, dateien mitgeben -->

**Workflow starten** öffnet den Startdialog:

- **Eingabe:** Der Text, den alle Agenten am Start erhalten. Er ist mit dem *Vorschlag für die Eingabe* des Start-Knotens vorausgefüllt.
- **Dateien mitgeben (optional):** Wissensdateien, die nur für diesen Lauf direkt in den Kontext der ersten Agenten gelegt werden (siehe [Dateien beim Start mitgeben](/docs/wissen#start-dateien)).
- **Budget:** Der Dialog zeigt, welches Budget gilt.

Mit **Starten** speichert Nodestro den Workflow und beginnt den Lauf. Der Lauf verwendet den Stand des Workflows zum Startzeitpunkt; spätere Änderungen wirken erst beim nächsten Lauf. Ist der Anbieter eines Modells nicht eingerichtet, weist der Dialog darauf hin.

## Bedienung und Tastenkürzel {#bedienung}
<!-- keywords: tastenkürzel, shortcuts, strg+s, strg+z, rückgängig, wiederholen, entf, duplizieren, automatisch anordnen -->

<!-- widget: shortcuts -->

Weitere Hinweise:

- **Automatisch anordnen** ordnet die Knoten in Spalten nach ihrer Position im Datenfluss.
- **Alles anzeigen** zoomt so, dass der ganze Workflow sichtbar ist.
- Verlässt du den Editor mit ungespeicherten Änderungen, fragt Nodestro, ob gespeichert oder verworfen werden soll.
- Rückgängig merkt sich bis zu 80 Schritte. Das Verschieben eines Knotens ist ein Schritt, ebenso das Schreiben in einem Feld, bis du in ein anderes Feld oder einen anderen Knoten wechselst. Name, Beschreibung und Budget des Workflows gehören dazu.

- **Verbindungen löschen:** Klicke auf eine Verbindung. Sie wird hervorgehoben, und **Entf** oder **Rücktaste** löscht sie. Solange du in einem Eingabefeld schreibst, löschen diese Tasten nur Text. Auch das Löschen einer Verbindung lässt sich rückgängig machen.
- Die Leiste **Bausteine** ist beim Öffnen des Editors immer eingeklappt; aufgeklappt bleibt sie, bis du den Editor verlässt.

## Speichern und Verwerfen {#speichern}
<!-- keywords: speichern, verwerfen, ungespeichert, änderungen verwerfen, zurücksetzen -->

**Speichern** (oder **Strg+S**) übernimmt den aktuellen Stand und legt dabei eine neue [Version](/docs/workflows#versionen) an. Solange es ungespeicherte Änderungen gibt, steht in der Titelleiste **Verwerfen**.

**Verwerfen** wirft alle ungespeicherten Änderungen weg, einschließlich des Verlaufs von Rückgängig/Wiederholen, und lädt den zuletzt gespeicherten Stand neu. Dasselbe gilt, wenn du den Editor verlässt und im Dialog **Verwerfen** wählst: Beim nächsten Öffnen erscheint genau der gespeicherte Workflow.

## Versionen {#versionen}
<!-- keywords: version, versionen, verlauf, historie, wiederherstellen, zurück, alter stand -->

Jedes Speichern, das etwas ändert, wird als nummerierte **Version** mit Datum und Uhrzeit aufbewahrt. **Versionen** in der Titelleiste des Editors öffnet den Verlauf:

- **Als Version speichern** speichert die aktuellen Änderungen mit einer optionalen Beschreibung („vor dem Umbau der Recherche“).
- Mit dem Stift-Symbol ergänzt oder änderst du die Beschreibung einer Version.
- **Unterschiede** zeigt, was sich gegenüber dem Stand im Editor ändern würde: Agenten, Verbindungen, Name und Einstellungen.
- **Wiederherstellen** setzt den Workflow auf diese Version zurück und speichert das Ergebnis als **neue Version**. Keine Version wird überschrieben oder gelöscht.

Versionen sind unabhängig von Rückgängig/Wiederholen, das nur innerhalb einer Sitzung im Editor gilt. Läufe verwenden immer den Stand zum Startzeitpunkt. Wird ein Workflow gelöscht, werden auch seine Versionen gelöscht. Oben im Verlauf steht das **Testergebnis** der gespeicherten Version aus jeder Testreihe des Workflows (wie beim [Veröffentlichen](/docs/api-und-export#veroeffentlichen)).

## Import und Export {#import-export}
<!-- keywords: export, import, json, datei, teilen, backup, .nodestro.json -->

- **Export** (im Editor) speichert den Workflow als `<Name>.nodestro.json`: alle Knoten, Verbindungen, Positionen und Agenten-Einstellungen sowie Budget.
- **Importieren** (auf der Seite *Workflows*) lädt eine solche Datei als **neue Kopie** mit neuer ID. Vorhandene Workflows werden nie überschrieben.

**Nicht enthalten** sind Wissensdateien, Memory-Räume und eigene Tools; die Datei verweist nur auf deren IDs und Namen. Auf einem anderen Rechner müssen sie dort vorhanden sein, sonst meldet die Prüfung z. B. „Unbekannte Tools“.

Workflow-Export und Trace-Export sind verschiedene Dinge: Ein Workflow beschreibt den Ablauf, ein Trace einen konkreten Lauf mit Ergebnissen (siehe [Traces importieren](/docs/ausfuehrungen#trace-import)).

## Beispiele {#beispiele}
<!-- keywords: beispiel, vorlage, muster, pipeline, rezept, use case -->

**Linear: Recherche → Analyse → Review (Beispiel „Finanzanalyse“)**

1. *Research Agent* (Sonnet, Aufwand niedrig) extrahiert alle Zahlen mit Zeitraum und Einheit.
2. *Analysis Agent* bekommt das Tool `calculator` und rechnet Wachstum und Margen exakt aus. Aufgabe: `Berechne die wichtigsten Kennzahlen aus diesen Rechercheergebnissen: {{Research Agent}}`.
3. *Review Agent* prüft die Analyse und liefert ein **strukturiertes Ergebnis** mit `summary`, `key_figures`, `issues` und `approved`.

**Verzweigen und zusammenführen (Beispiel „Blogartikel“)**

1. Start mit dem Thema.
2. *Zielgruppe* und *Gliederung* laufen parallel.
3. *Autor* führt beide zusammen (`{{Zielgruppe}}`, `{{Gliederung}}`) und hat eine **Qualitätsprüfung** mit den Kriterien „folgt der Gliederung“ und „beantwortet die Fragen der Zielgruppe“.

**Klassifizieren und antworten**

1. *Einstufung* (Haiku, strukturierte Ausgabe mit `category`, `urgency` als Ganzzahl und `reason`).
2. *Antwort* (Sonnet) bekommt die Einstufung als JSON und die ursprüngliche Anfrage über `{{run.input}}`.

## Einschränkungen {#grenzen}
<!-- keywords: grenzen, einschränkungen, schleifen, bedingungen, if, loop, verzweigung -->

- **Keine Schleifen:** Ein Workflow ist ein gerichteter Graph ohne Kreise. Jeder Knoten läuft höchstens einmal pro Lauf. Bedingungen bildest du mit [Entscheidungen](/docs/verzweigungen#entscheidung); Knoten auf nicht gewählten Zweigen werden übersprungen.
- **Fortsetzen statt wiederholen:** Ein fehlgeschlagener oder abgebrochener Lauf lässt sich [fortsetzen](/docs/verzweigungen#fortsetzen); dabei entsteht ein neuer, verknüpfter Lauf.
- **Ein Lauf zur Zeit pro Workflow im Editor:** Solange ein Lauf aktiv ist, ist *Workflow starten* gesperrt. Mehrere Läufe gleichzeitig startest du mit einem [Stapellauf](/docs/automatisierung#stapel).
- **Stand zum Startzeitpunkt:** Änderungen während eines Laufs wirken erst beim nächsten Lauf.

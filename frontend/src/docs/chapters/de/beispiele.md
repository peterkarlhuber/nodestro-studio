# Beispiel-Workflows

Nodestro bringt 24 fertige Multi-Agenten-Workflows mit, einen für jedes typische Anwendungsfeld. Jedes Beispiel enthält Agenten mit System-Prompts, die Verbindungen, eine vorbereitete Testaufgabe mit erfundenen Daten und ein klar beschriebenes Ergebnis. Dieses Kapitel erklärt die Galerie, das Übernehmen und Anpassen und beschreibt jedes Beispiel einzeln.

## Die Galerie {#galerie}
<!-- keywords: beispiele, vorlagen, galerie, bibliothek, empfohlen, kategorien, startseite, hier starten, niveau, einfachste -->

Die Galerie steht auf der Seite **Workflows** unter deinen eigenen Workflows, klar davon getrennt. Sie zeigt einige empfohlene Beispiele, das einfachste zuerst, und die sechs Kategorien. Solange du noch keinen Workflow hast, trägt das einfachste Beispiel die Markierung **Hier starten**; danach ist die Galerie ein zugeklappter Bereich, der sich merkt, ob du ihn geöffnet hast. **Alle 24 Beispiele ansehen** öffnet die vollständige Galerie, ebenfalls im Bereich Workflows.

In der vollständigen Galerie suchst du nach Name, Fachgebiet, Beschreibung, Baustein oder Niveau und filterst nach Kategorie und **Niveau**. Die Beispiele sind nach Niveau geordnet, die einfachsten zuerst; das einfachste trägt **Hier starten**. Suche, Filter und eine geöffnete Vorschau stehen in der Adresse, sodass *Zurück* zur selben Auswahl führt. Jede Karte zeigt Fachgebiet, Name, Beschreibung, die Zahl der Agenten, das Niveau und das Muster. Beispiele aus sensiblen Bereichen tragen das Abzeichen **Fachlich prüfen**. Auch die [Suche](/docs/start#suche) findet Beispiele.

## Vorschau und Übernehmen {#uebernehmen}
<!-- keywords: vorschau, übernehmen, kopie, kopieren, vorlage, unverändert, kostenlos -->

Ein Klick auf eine Karte öffnet die **Vorschau**: den Ablauf als Grafik, jeden Agenten mit Rolle, Modell, Tools und den Ergebnissen, die er bekommt, die Anleitung und die Testaufgabe. Die Vorschau speichert nichts und ruft kein Modell auf.

Ganz oben in der Vorschau steht **Was du brauchst**: welchen KI-Anbieter und welche Modelle die Kopie nutzt und ob dieser Anbieter eingerichtet ist (sonst mit Link zu den Einstellungen), ob ein Lauf für eine Freigabe anhält, welche Wissens- und Beispieldateien mitkommen und ob eine Verbindung zu einem anderen Dienst nötig ist.

**Als Kopie übernehmen** legt einen eigenen Workflow an und öffnet ihn im Editor. Die Kopie ist unabhängig: Du kannst alles ändern, und die Vorlage bleibt immer unverändert. Übernimmst du ein Beispiel zweimal, entstehen zwei getrennte Workflows. Die Kopie beginnt mit Version 1 im [Versionsverlauf](/docs/workflows#versionen).

Ist **Testfälle als Testreihe übernehmen** angehakt (vorbelegt), bekommt die Kopie zusätzlich eine [Testreihe](/docs/automatisierung#testreihen) mit den vorbereiteten Testfällen; die nötigen Beispieldateien werden dabei als Eingabedateien der Kopie gespeichert. Übernehmen startet nie einen Lauf, legt keinen [Zeitplan](/docs/automatisierung#zeitplaene) an und veröffentlicht keine [API](/docs/api-und-export#veroeffentlichen); das entscheidest du später selbst.

Beispiele werden nie automatisch angelegt; nur was du übernimmst, erscheint unter deinen Workflows. Kosten entstehen erst, wenn du eine Kopie ausführst. Welche Modelle eine Kopie bekommt, richtet sich nach deinem Standardmodell: Ist es ein Modell von Anthropic, nutzt die Kopie die Modelle des Beispiels (Haiku, Sonnet oder Opus, je nach Aufgabe des Agenten). Gehört es zu einem anderen [Anbieter](/docs/einstellungen#anbieter), nutzen alle Agenten der Kopie dein Standardmodell, die anspruchsvollsten dein Modell der Assistenten, wenn es zum selben Anbieter gehört; Server-Tools, die nur bei Anthropic laufen, entfallen dann. Du kannst die Modelle einer Kopie jederzeit ändern. Kein Beispiel braucht Konten oder bezahlte Datenquellen. Einige Beispiele haben eine **Optionale Verbindung** zu einem anderen Dienst über MCP: Beim Übernehmen wählst du einen eingerichteten [verbundenen Dienst](/docs/tools#verbundene-dienste) oder den **Offline-Modus (Beispieldaten)**, der vorbelegt ist.

## Sprachen {#sprachen}
<!-- keywords: sprache, übersetzung, deutsch, englisch, kopie, prompts -->

Galerie und Vorschau erscheinen in der Sprache der Oberfläche. Namen, Beschreibungen, System-Prompts, Aufgaben und Testaufgabe der Kopie werden in der Sprache angelegt, die du in der Vorschau unter **Sprache der Kopie** wählst; vorbelegt ist die Sprache der Oberfläche.

Eine gespeicherte Kopie bleibt in ihrer Sprache, auch wenn du die Oberfläche später umstellst. Technische Bezeichner wie die Feldnamen der strukturierten Ausgabe und die Namen der Tools sind in allen Sprachen englisch.

## Muster und Rollen {#muster}
<!-- keywords: sequenziell, parallel, review, judge, qualitätsprüfung, rollen, struktur -->

Die Beispiele nutzen nur so viele Agenten, wie die Aufgabe braucht, meist drei oder vier.

- **Sequenziell:** Die Agenten arbeiten nacheinander; jeder baut auf dem Ergebnis seines Vorgängers auf.
- **Parallel:** Mehrere Agenten arbeiten gleichzeitig an derselben Eingabe, ein weiterer führt die Ergebnisse zusammen.
- **Verzweigt:** Eine Entscheidung oder eine Freigabe wählt den Weg; nicht jeder Agent läuft in jedem Lauf (siehe [Verzweigungen und Freigaben](/docs/verzweigungen)).
- **Review:** Ein prüfender Agent kontrolliert die Arbeit der anderen und liefert oft eine strukturierte Ausgabe mit festen Feldern.
- **Qualitätsprüfung:** Bei manchen Agenten bewertet eine eingebaute [Qualitätsprüfung](/docs/agenten#qualitaet) das Ergebnis nach festen Kriterien und lässt es bei Bedarf überarbeiten.

Die Karten in der Galerie zeigen außerdem, welche Bausteine ein Beispiel nutzt: Entscheidung, Freigabe, Eingabeformular, Unterworkflow, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge oder Gedächtnis.

Die Rollen in der Vorschau beschreiben, was ein Agent tut: Recherche, Analyse, Planung, Prüfung oder Text. Gerechnet wird mit den eingebauten Tools wie dem Rechner und der Datumsrechnung; sie kosten nichts extra.

## Testdaten {#testdaten}
<!-- keywords: testaufgabe, testdaten, synthetisch, erfunden, beispieldaten -->

Jede Testaufgabe beginnt mit dem Hinweis **SYNTHETISCHE BEISPIELDATEN**. Firmen, Personen, Zahlen und Regeln sind erfunden und dienen nur zum Ausprobieren. Nach dem Übernehmen steht die Testaufgabe als Vorschlag im Startknoten; ersetze sie dort durch deine eigenen Daten.

## Beispieldateien und Testfälle {#beispieldateien}
<!-- keywords: beispieldateien, testfälle, testreihe, datei, upload, pdf, excel, word, zip -->

Viele Beispiele haben ein optionales [Dateifeld](/docs/datei-eingaben#datei-felder), etwa für ein Stillstandsprotokoll als Excel, Angebote als PDF und Word oder einen Vertrag als Word-Datei. Die Vorschau bietet dazu kleine, erfundene **Beispieldateien** zum Herunterladen an, die zur Testaufgabe passen. Du kannst sie beim Starten der Kopie in das Dateifeld legen und so ausprobieren, wie das Beispiel mit Dateien arbeitet. Ohne Datei arbeiten die Agenten wie bisher mit dem Text.

Jedes Beispiel hat außerdem **Testfälle**, zum Beispiel einen Fall mit Text, einen mit Beispieldatei und, bei Beispielen mit Entscheidung, je einen Fall für jeden Weg. Jeder Testfall enthält Prüfungen auf Felder des Ergebnisses. Übernommene Testfälle findest du als Testreihe der Kopie; sie laufen erst, wenn du die Testreihe startest, und kosten dann wie normale Läufe.

Ergebnisdateien wie PDF, Word oder Excel legt der Lauf bei den [Dateien](/docs/dateien) ab. Schlägt ein Agent Erkenntnisse für das Wissen vor, wird davon nur gespeichert, was du ausdrücklich übernimmst.

## Sensible Bereiche {#sensible-bereiche}
<!-- keywords: finanzen, recht, personal, verwaltung, prüfung, haftung, beratung, vorsicht -->

Sechs Beispiele betreffen Finanzen, Recht, Personal oder Verwaltung: Finanzanalyse, Personalsuche, Vertragsprüfung, Haushaltsbudget, Immobilienvergleich und Bürgeranfrage. Ihre Agenten bekommen im System-Prompt zusätzlich die Anweisung, Unsicherheiten zu benennen und die Punkte aufzuführen, die eine fachkundige Person prüfen muss.

Die Ergebnisse sind Arbeitshilfen, keine Beratung und keine Entscheidung. Prüfe sie fachlich, bevor du sie verwendest, versendest oder veröffentlichst.

## Beispiele anpassen {#anpassen}
<!-- keywords: anpassen, ändern, eigene daten, wissen, modell, prompt -->

- **Eigene Daten:** Ersetze die Testaufgabe im Startknoten oder gib beim Starten eine eigene Eingabe ein.
- **Eigene Dateien:** Lege Dokumente für einen einzelnen Lauf direkt in das Dateifeld beim Starten; eine Wissenssammlung brauchst du dafür nicht.
- **Wissen:** Dokumente, die du dauerhaft brauchst, lädst du als [Wissen](/docs/wissen#modi) hoch und weist sie dem passenden Agenten zu.
- **Prompts und Aufgaben:** Die Aufgaben verweisen mit [Platzhaltern](/docs/workflows#platzhalter) auf ihre Vorgänger. Benennst du einen Agenten um, passe die Platzhalter an.
- **Aktuelle Daten:** Für Live-Informationen kannst du das [Server-Tool](/docs/tools#server-tools) Websuche ergänzen (nur mit Modellen von Anthropic); es kostet pro Suche extra.

Die Abschnitte unten nennen für jedes Beispiel konkrete Anpassungen.

<!-- examples:start -->

## Alle 24 Beispiele auf einen Blick {#uebersicht}

Jedes Beispiel steht in der Galerie und hat unten einen eigenen Abschnitt.

| Nr. | Beispiel | Bereich | Agenten | Muster |
|---|---|---|---|---|
| 1 | Maschinenstillstände analysieren | Produktion und Industrie | 3 | verzweigt |
| 2 | Reklamation mit 8D untersuchen | Qualitätsmanagement | 5 | verzweigt |
| 3 | Lieferantenangebote vergleichen | Logistik und Einkauf | 3 | parallel |
| 4 | SWOT-Strategie für ein KMU | Unternehmen und KMU | 4 | parallel |
| 5 | Finanzanalyse | Finanzen und Investments | 3 | sequenziell |
| 6 | Blogartikel | Marketing und Content | 3 | sequenziell |
| 7 | Individuelles Angebot vorbereiten | Vertrieb | 3 | sequenziell |
| 8 | Kundenanfragen beantworten | Kundenservice | 4 | verzweigt |
| 9 | Stelle ausschreiben und Interviews vorbereiten | Personalwesen | 5 | verzweigt |
| 10 | Forschungsfrage in Hypothesen übersetzen | Forschung und Entwicklung | 3 | adaptiv (Orchestrierung) |
| 11 | Code-Review mit Tests | Softwareentwicklung | 3 | parallel |
| 12 | Vertrag strukturieren und Prüfpunkte finden | Recht und Verwaltung | 5 | verzweigt |
| 13 | Persönlichen Lernplan erstellen | Bildung und Weiterbildung | 4 | parallel |
| 14 | Haushaltsbudget prüfen und sparen | Privatpersonen – Finanzen | 3 | sequenziell |
| 15 | Individuelle Reise planen | Privatpersonen – Reisen | 4 | verzweigt |
| 16 | Geschäftsidee bewerten | Selbstständige und Gründer | 2 | adaptiv (Orchestrierung) |
| 17 | Social-Media-Strategie entwickeln | Influencer und Content Creator | 3 | sequenziell |
| 18 | Immobilienangebote vergleichen | Immobilienwirtschaft | 3 | parallel |
| 19 | Bauverzögerungen analysieren | Bauwesen | 3 | adaptiv (Orchestrierung) |
| 20 | Speisekarte entwickeln und kalkulieren | Gastronomie | 3 | sequenziell |
| 21 | Anbauplanung für einen Betrieb | Landwirtschaft | 3 | sequenziell |
| 22 | Vereinsfest planen | Vereine | 4 | parallel |
| 23 | Spendenkampagne entwickeln | Gemeinnützige Organisationen | 3 | verzweigt |
| 24 | Bürgeranfrage beantworten | Öffentliche Einrichtungen | 3 | sequenziell |

## 1 · Maschinenstillstände analysieren {#production-downtime}
<!-- keywords: produktion und industrie, stillstandsanalyst, ursachenanalyst, maßnahmenplaner -->

**Bereich:** Produktion und Industrie · **Agenten:** 3 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Eingabeformular, Sub-Workflow, Ergebnisdateien, Dateien als Eingabe

Stillstände kosten Produktionszeit, doch in langen Protokollen gehen Muster leicht unter. Der Workflow macht aus einem Stillstandsprotokoll eine begründete, priorisierte Maßnahmenliste.

**So arbeiten die Agenten zusammen:** Zwei Agenten arbeiten parallel: Der Stillstandsanalyst rechnet Summen, Anteile und eine Pareto-Rangfolge mit dem Rechner-Tool, der Ursachenanalyst entwickelt Hypothesen nach den 6M. Der Maßnahmenplaner führt beides zusammen, und eine eingebaute Qualitätsprüfung kontrolliert, dass jede Maßnahme begründet ist. Liegt der Stillstandsanteil über dem Ziel von 3 %, startet ein Entscheidungsknoten einen Qualitäts-Sub-Workflow, der die Risiken der Maßnahmen bewertet und ihre Absicherung plant.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Stillstandsanalyst** | Wertet das Protokoll quantitativ aus und rechnet mit dem Rechner-Tool. (strukturierte Ausgabe; Tools: `calculator`) | Stillstandsprotokoll |
| **Ursachenanalyst** | Entwickelt Ursachenhypothesen nach den 6M und schlägt Prüfungen vor. | Stillstandsprotokoll |
| **Maßnahmenplaner** | Führt Analyse und Hypothesen zu priorisierten Maßnahmen zusammen. (mit Qualitätsprüfung) | Stillstandsanalyst, Ursachenanalyst |

**Eingabe:** Ein Stillstandsprotokoll (Datum, Schicht, Anlage, Dauer, Störcode, Notiz) und die geplante Produktionszeit. Das Protokoll kannst du als Tabelle in den Text einfügen oder als CSV- bzw. Excel-Datei in das optionale Dateifeld legen; die Beispieldatei „Stillstandsprotokoll_L2_KW14-15.xlsx“ enthält dieselben zwölf erfundenen Einträge wie die Testaufgabe.

**Beispieldateien:** `Stillstandsprotokoll_L2_KW14-15.xlsx`

**Testfälle:** Protokoll im Text, Ziel verfehlt (4,6 %); Ruhige Woche, Ziel eingehalten; Protokoll als Excel-Datei

**Ergebnis:** Eine priorisierte Tabelle mit Sofortmaßnahmen, Prüfaufträgen und dauerhaften Maßnahmen, jeweils mit erwarteter Wirkung, Aufwand, verantwortlicher Rolle und Kennzahl, dazu die Datenanalyse mit Stillstandsanteil und die drei wichtigsten nächsten Schritte. Der Lauf speichert alles zusätzlich als Markdown und als Excel-Datei mit den Tabellen.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Stillstandsanalyst prüft jede Zahl mit dem Rechner-Tool. Eine Qualitätsprüfung bewertet den Maßnahmenplan nach drei Kriterien (Bezug zu den Befunden, Priorisierung, Verantwortliche und Kennzahlen) und lässt den Maßnahmenplaner einmal nachbessern, wenn er sie verfehlt. Eine Bedingung vergleicht den Stillstandsanteil mit dem Ziel von 3 %: Liegt er darüber, läuft der Sub-Workflow Qualitätsabsicherung (Risikobewertung mit vereinfachter FMEA und Absicherungsplan), sonst entfällt er. Der Lauf zeigt, welcher Zweig genommen wurde. Kein Schritt wartet auf eine Person: Ursachen sind Hypothesen, die vor Ort zu prüfen sind, und die Maßnahmen sind Vorschläge für die verantwortliche Produktionsleitung.

**Warum diese Architektur:** Die Zahlenauswertung und die Ursachensuche betrachten dasselbe Protokoll aus verschiedenen Blickwinkeln und hängen nicht voneinander ab; deshalb laufen sie parallel, und erst der Maßnahmenplaner führt sie zusammen. Die Qualitätsabsicherung läuft nur, wenn das Ziel verfehlt ist, weil erst dann umfangreichere Maßnahmen zu erwarten sind, deren Risiken abgesichert werden müssen; im Zielbereich kostete sie nur Zeit und Geld. Sie ist ein Sub-Workflow, damit derselbe Baustein wiederverwendet und für sich getestet werden kann. Einen Orchestrator braucht es nicht, weil jedes Stillstandsprotokoll dieselben Schritte braucht.

**Anpassen:** Lege einen Export aus deinem MES oder deiner Tabellenkalkulation in das Dateifeld; auch lange Protokolle funktionieren, weil die Agenten große Dateien gezielt lesen. Für eine wöchentliche Auswertung kannst du die Kopie zeitgesteuert starten. Im System-Prompt des Maßnahmenplaners kannst du eure Methodik ergänzen, zum Beispiel TPM-Säulen oder ein festes Bewertungsschema.

## 2 · Reklamation mit 8D untersuchen {#quality-8d}
<!-- keywords: qualitätsmanagement, problembeschreibung d1–d3, ursachenanalyse d4, maßnahmenplanung d5–d7, 8d-bericht, notfall-eindämmung -->

**Bereich:** Qualitätsmanagement · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Freigabe, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge, Wissensdateien

Reklamationen verlangen schnelle Sofortmaßnahmen und eine saubere Ursachenklärung. Die 8D-Methode gibt die Schritte vor; der Workflow arbeitet sie strukturiert ab und dokumentiert sie einheitlich. Dabei prüft er auch, ob der Fehler schon einmal aufgetreten ist: Eine wiederkehrende Ursache heißt, dass eine frühere Abstellmaßnahme nicht gewirkt hat, und das gehört in den Bericht.

**So arbeiten die Agenten zusammen:** Eine sequenzielle Kette: Der erste Agent beschreibt das Problem und die Sofortmaßnahmen (D1 bis D3). Der zweite durchsucht die früheren 8D-Berichte des Unternehmens nach vergleichbaren Fällen und sucht die Ursachen für Entstehung und Nichtentdeckung (D4); er sagt dabei, ob eine Ursache wiederkehrt oder neu ist. Der dritte plant Abstell- und Vorbeugemaßnahmen (D5 bis D7). Der Berichtsagent fasst alles in einem strukturierten 8D-Bericht zusammen. Ein Entscheidungsknoten prüft den Schweregrad: In kritischen Fällen plant ein zusätzlicher Agent die Notfall-Eindämmung für die nächsten 24 Stunden. Bevor der Bericht an den Kunden geht, gibt ihn ein Mensch frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Problembeschreibung D1–D3** | Beschreibt Team, Problem (Ist/Ist-nicht) und Sofortmaßnahmen. (strukturierte Ausgabe) | Reklamation |
| **Ursachenanalyse D4** | Durchsucht frühere 8D-Berichte und sucht mit 5 Why die Ursachen für Entstehung und Nichtentdeckung. | Problembeschreibung D1–D3, Reklamation |
| **Maßnahmenplanung D5–D7** | Plant Abstellmaßnahmen, ihre Verifizierung und die Vorbeugung. | Ursachenanalyse D4 |
| **8D-Bericht** | Fasst alle Schritte in einem strukturierten 8D-Bericht zusammen. (strukturierte Ausgabe) | Problembeschreibung D1–D3, Ursachenanalyse D4, Maßnahmenplanung D5–D7, Notfall-Eindämmung |
| **Notfall-Eindämmung** | Plant bei kritischen Fällen die Eindämmung für die nächsten 24 Stunden. | Schweregrad |

**Eingabe:** Die Reklamation des Kunden mit Teil, Charge, Fehlerbild und Fehlerquote sowie bekannte interne Informationen zu Fertigung, Material und Prüfung. Reklamationsschreiben, Messdaten und Fotos des Fehlerbilds kannst du zusätzlich als Dateien anhängen; die Beispieldateien enthalten ein erfundenes Reklamationsschreiben (PDF) und Messwerte (Excel). Die früheren 8D-Berichte kommen aus der Wissenssammlung; ein erfundenes Archiv mit vier abgeschlossenen Berichten ist dabei.

**Beispieldateien:** `Reklamation_G-220_Charge_24-117.pdf`, `Messwerte_Rastnasen.xlsx`

**Testfälle:** Reklamation im Text; Reklamationsschreiben und Messwerte als Dateien

**Ergebnis:** Ein strukturierter 8D-Bericht mit je einem Feld für D1 bis D8 und einer Liste offener Punkte, die das Team noch klären muss; die Ursachenanalyse nennt die früheren Berichte, auf die sie sich stützt. Nach der Freigabe speichert der Lauf den Bericht als PDF und als bearbeitbare Word-Datei. Damit schließt sich der Lernkreis: Der Berichtsagent schlägt den fertigen 8D-Bericht für das Wissen vor, ein Mensch entscheidet, ob er gespeichert wird, und gespeicherte Berichte landen in derselben Sammlung wie die früheren Berichte, sodass die Ursachenanalyse sie bei künftigen Fällen findet.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Entscheidungsknoten ergänzt die Notfall-Eindämmung nur, wenn die Problembeschreibung den Fall als kritisch einstuft; die Ursachenanalyse entscheidet, welche früheren Berichte einschlägig sind, und zitiert sie, sodass jeder Verweis nachprüfbar ist. Es gibt keine Schleifen; jeder Schritt läuft einmal. Ein Mensch entscheidet zweimal: Bevor Dateien entstehen, gibt jemand den 8D-Bericht frei (eine Ablehnung beendet den Lauf ohne Dateien), und ein Mensch entscheidet, ob der fertige Bericht als Wissen gespeichert wird. Bis zur Freigabe bleibt der Bericht ein Entwurf.

**Warum diese Architektur:** 8D gibt eine feste Reihenfolge vor, in der jede Disziplin auf der vorherigen aufbaut; deshalb passt eine sequenzielle Kette besser als ein Orchestrator, und nur die Notfall-Eindämmung hängt vom Fall ab und ist eine Verzweigung. Die früheren Berichte sind durchsuchbares Wissen statt Text im Prompt: Das Archiv wächst mit jedem gespeicherten Fall, die Suche liefert nur die passenden Stellen, und Zitate zeigen, woher eine wiederkehrende Ursache stammt. Eine Prüfschleife wurde bewusst weggelassen, weil die Freigabe durch einen Menschen am Ende ohnehin den ganzen Bericht prüft.

**Wissensdateien (synthetisch, werden beim Kopieren angelegt):** Fruehere_8D-Berichte_Plastiform: Erfundenes Archiv mit vier abgeschlossenen 8D-Berichten des Kunststoffgehäuse-Lieferanten Plastiform GmbH; einer davon ist ein vergleichbarer Fall.

**Anpassen:** Ersetze die Testdaten durch eure Reklamation und hänge Prüfprotokolle, Zeichnungen oder Fotos direkt an. Ersetze die erfundenen früheren Berichte in der Wissenssammlung durch eure eigenen abgeschlossenen 8D-Berichte (Markdown, PDF oder Word); klare Überschriften mit Teil, Fehlerbild und Ursache je Bericht machen die Suche treffsicherer. Wenn ihr ein eigenes Formular nutzt, passe die Felder des Berichtsagenten unter „Ausgabeformat“ an.

## 3 · Lieferantenangebote vergleichen {#supplier-comparison}
<!-- keywords: logistik und einkauf, kostenanalyst, risikoanalyst, einkaufsempfehlung -->

**Bereich:** Logistik und Einkauf · **Agenten:** 3 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, optionale MCP-Anbindung

Der günstigste Stückpreis ist selten das günstigste Angebot, und die Versprechen eines Lieferanten sind nicht seine Lieferhistorie. Der Workflow vergleicht Angebote nach Gesamtkosten und Lieferrisiko, prüft die Historie der Lieferanten, wo sie vorliegt, und begründet eine Empfehlung für den Einkauf.

**So arbeiten die Agenten zusammen:** Kostenanalyst und Risikoanalyst arbeiten parallel. Der eine rechnet mit dem Rechner-Tool die Gesamtkosten (Total Cost of Ownership) je Angebot, der andere bewertet Lieferzeit, Abhängigkeiten, Kapazität und Qualität. Ist deine Kopie mit dem ERP-System verbunden, liest der Risikoanalyst die Lieferantenbewertung jedes Lieferanten mit list_suppliers und supplier_scorecard, nur lesend; ohne Verbindung nutzt er einen angehängten ERP-Export oder nur die Angebote und sagt, welche Historie fehlt. Die Einkaufsempfehlung wägt beides ab und liefert ein strukturiertes Ergebnis.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Kostenanalyst** | Rechnet die Gesamtkosten je Angebot mit dem Rechner-Tool. (Tools: `calculator`) | Angebote |
| **Risikoanalyst** | Bewertet Lieferzeit, Abhängigkeiten, Kapazität und Qualitätsrisiken. | Angebote |
| **Einkaufsempfehlung** | Wägt Kosten und Risiken ab und empfiehlt einen Lieferanten. (strukturierte Ausgabe) | Kostenanalyst, Risikoanalyst |

**Eingabe:** Mehrere Angebote mit Preis, Fracht, Lieferzeit, Mindestmenge, Zahlungsbedingungen und Qualitätsdaten sowie eure internen Kostensätze. Die Angebote kannst du in den Text schreiben oder als Dateien anhängen, auch gemischt als PDF, Word und Excel; die drei Beispieldateien zeigen genau das. Optional hängst du einen ERP-Export der Lieferantenbewertungen an (Excel oder CSV); im Beispielexport fehlt der Lieferant von Angebot B absichtlich, weil er neu ist und noch keine Historie hat.

**Beispieldateien:** `Angebot_A_Beispiel_Praezision.pdf`, `Angebot_B_Example_Components.docx`, `Angebot_C_Muster_Metallteile.xlsx`, `ERP_Lieferantenbewertung.xlsx`

**Testfälle:** Drei Angebote im Text; Drei Angebote als PDF, Word und Excel; Drei Angebote als Dateien plus ERP-Export

**Ergebnis:** Eine strukturierte Empfehlung mit Rangfolge, Begründungen, Risiken, Verhandlungspunkten und den getroffenen Annahmen. Die Risikobewertung nennt für jeden Lieferanten, woher seine Historie stammt: aus dem ERP-System, aus dem angehängten Export oder nur aus dem Angebot. Der Lauf speichert die Empfehlung zusätzlich als PDF-Bericht und als Excel-Datei mit je einem Blatt pro Liste.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Beide Analysen und die Abwägung laufen ohne Halt durch; das Rechnen übernimmt das Rechner-Tool, und der Lauf protokolliert jeden Schritt und jeden Tool-Aufruf. Die ERP-Verbindung ist optional und liest nur: Die Kopie bekommt die Tools list_suppliers und supplier_scorecard nur, wenn du sie mit einem MCP-Server verbindest, dessen Tools ein Administrator als nur lesend freigegeben hat; sonst läuft sie in einem deutlich gekennzeichneten Offline-Modus und tut nie so, als hätte sie ERP-Daten. Läufe ohne anwesende Person (Zeitpläne, Testreihen, Stapelverarbeitung) dürfen keine MCP-Tools nutzen, außer ein Administrator erlaubt unbeaufsichtigtes MCP ausdrücklich; nutze eine verbundene Kopie daher interaktiv. Kein Schritt wartet auf eine Freigabe: Die Empfehlung ist ein Entwurf, die Vergabeentscheidung bleibt bei dir.

**Warum diese Architektur:** Kosten und Risiko sind unabhängige Fragen, deshalb arbeiten zwei Spezialisten parallel und ein dritter wägt ab; das ist schneller und leichter nachzuprüfen als ein einzelner Agent für alles. Die Lieferantenhistorie kommt über eine Integration, weil sie im ERP-System liegt und sich laufend ändert; eine Wissensdatei wäre schnell veraltet, und der Offline-Modus mit Export hält das Beispiel auch ohne Verbindung nutzbar. Schleife und Freigabeschritt fehlen bewusst, weil das Ergebnis eine Empfehlung ist und keine Aktion.

**Optionale Anbindung: ERP-System (Lieferantenbewertung)** (Tools: `list_suppliers`, `supplier_scorecard`). Nur lesender Zugriff über MCP auf die Lieferantendaten eures ERP-Systems: list_suppliers listet die Lieferanten, supplier_scorecard liefert die Bewertung eines Lieferanten für die letzten 12 Monate (Liefertreue, Qualität in ppm, Reklamationen, offene 8D-Berichte, letztes Audit). Der Risikoanalyst prüft damit die Angebote gegen die erfasste Historie.

**Einrichtung:** Ein Administrator fügt den MCP-Server eures ERP-Systems unter Tools → Verbundene Dienste hinzu und gibt die beiden Tools list_suppliers und supplier_scorecard als nur lesend frei. Beim Kopieren des Beispiels wählst du diesen Server als Verbindung; ohne Verbindung läuft die Kopie im Offline-Modus. Zum Ausprobieren ohne ERP-System startest du auf dem Rechner mit der Nodestro-Desktop-App `python -m nodestro_examples.demo_mcp --language de`, fügst http://127.0.0.1:8765/mcp unter Tools → Verbundene Dienste mit der Zustimmung für einen lokalen Entwicklungsserver hinzu, gibst seine Tools als nur lesend frei und wählst ihn beim Kopieren. Der Demo-Server liest nur und liefert die synthetischen Daten des Beispielexports, nie echte Unternehmensdaten. Läufe ohne anwesende Person (Zeitpläne, Testreihen, Stapelverarbeitung) dürfen keine MCP-Tools nutzen, außer ein Administrator erlaubt unbeaufsichtigtes MCP ausdrücklich.

**Ohne Anbindung:** Offline-Modus: Es ist kein ERP-System verbunden. Der Risikoanalyst nutzt nur einen angehängten ERP-Export oder die Angebote und nennt die fehlende Lieferantenhistorie; er fragt nichts ab.

**Anpassen:** Hänge eure Angebote als Dateien an und trage Bedarf und Kostensätze in den Text ein. Für echte Lieferantenhistorie lässt du die ERP-Integration einrichten und wählst den Server beim Kopieren des Beispiels; sonst hängst du einen Export der Lieferantenbewertungen an. Wenn ihr feste Gewichtungen habt (zum Beispiel 50 % Kosten, 30 % Risiko, 20 % Qualität), ergänze sie im System-Prompt der Einkaufsempfehlung. Rahmenverträge kannst du als Wissen hinterlegen und dem Risikoanalysten zuweisen.

## 4 · SWOT-Strategie für ein KMU {#sme-swot}
<!-- keywords: unternehmen und kmu, interne analyse, umfeldanalyse, strategieentwickler, kritischer prüfer -->

**Bereich:** Unternehmen und KMU · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Ergebnisdateien

Viele kleine Unternehmen kennen ihre Probleme, aber nicht die beste Reihenfolge, sie anzugehen. Der Workflow erstellt eine SWOT-Analyse, leitet daraus Strategien ab und lässt sie von einem kritischen Prüfer hinterfragen.

**So arbeiten die Agenten zusammen:** Interne Analyse (Stärken, Schwächen) und Umfeldanalyse (Chancen, Risiken) laufen parallel. Der Strategieentwickler kombiniert beides zu Strategien nach der TOWS-Matrix und einem 90-Tage-Plan. Der kritische Prüfer sucht Schwachstellen und fehlende Informationen; das Ergebnis enthält Strategie und Prüfung. Am Ende wird das Ergebnis als Markdown- und PDF-Datei mit dem Lauf gespeichert.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Interne Analyse** | Arbeitet Stärken und Schwächen aus den Unternehmensdaten heraus. | Unternehmensprofil |
| **Umfeldanalyse** | Leitet Chancen und Risiken aus Markt und Umfeld ab. | Unternehmensprofil |
| **Strategieentwickler** | Entwickelt Strategien nach der TOWS-Matrix und einen 90-Tage-Plan. | Interne Analyse, Umfeldanalyse |
| **Kritischer Prüfer** | Hinterfragt die Strategie und deckt Schwachstellen auf. (strukturierte Ausgabe) | Strategieentwickler, Unternehmensprofil |

**Eingabe:** Ein kurzes Unternehmensprofil mit Kennzahlen, Angebot, Stärken, Problemen, Marktumfeld und Zielen.

**Testfälle:** Tischlerei mit ungeklärter Nachfolge

**Ergebnis:** Eine SWOT-Matrix mit abgeleiteten Strategien und einem 90-Tage-Plan sowie eine strukturierte kritische Prüfung mit Urteil, Schwachstellen, fehlenden Informationen und nächsten Schritten.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Alles läuft automatisch, kein Schritt wartet auf eine Person. Der kritische Prüfer erhält die Strategie und das ursprüngliche Unternehmensprofil und liefert ein strukturiertes Urteil mit tragfähigen Punkten, Schwachstellen, fehlenden Informationen und nächsten Schritten; er schickt die Strategie nicht zurück, sodass seine Kritik im Ergebnis sichtbar bleibt. Die Umfeldanalyse recherchiert nicht im Web: Sie arbeitet mit dem Profil und allgemeinem Branchenwissen und kennzeichnet, was vor Ort zu prüfen ist. Strategie und 90-Tage-Plan sind ein Entwurf für deine eigene Entscheidung.

**Warum diese Architektur:** Stärken und Schwächen kommen aus dem Unternehmen, Chancen und Risiken aus dem Markt; die beiden Analysen hängen nicht voneinander ab und laufen deshalb parallel. Die Strategie braucht beide und folgt daher als fester Schritt. Der Prüfer ist ein eigener Agent, der auch das ursprüngliche Profil sieht, und prüft die Strategie so an den Fakten statt nur an ihrer eigenen Begründung. Auf eine Überarbeitungsschleife wurde bewusst verzichtet: Eine Strategie soll nicht so lange geglättet werden, bis der Prüfer zustimmt, denn offene Widersprüche sind wertvolle Information für die Person, die entscheidet.

**Anpassen:** Beschreibe dein Unternehmen im gleichen Stil. Je genauer Zahlen und Ziele sind, desto konkreter wird die Strategie. Branchenstudien oder Kundenbefragungen kannst du als Wissen hochladen und der Umfeldanalyse zuweisen.

## 5 · Finanzanalyse {#financial-analysis}
<!-- keywords: finanzen und investments, recherche-agent, analyse-agent, review-agent -->

**Bereich:** Finanzen und Investments · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge

Kennzahlen aus Geschäftsberichten sind schnell zitiert, aber selten sauber nachgerechnet und eingeordnet. Der Workflow extrahiert die Zahlen, rechnet Margen und Wachstum exakt und lässt das Ergebnis kritisch prüfen.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Eine sequenzielle Kette mit drei Agenten: Der Recherche-Agent ordnet die Zahlen mit Zeitraum und Einheit, der Analyse-Agent berechnet Kennzahlen mit dem Rechner-Tool, und der Review-Agent prüft Rechenweg und Logik und fasst das Ergebnis strukturiert zusammen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Recherche-Agent** | Sammelt Kennzahlen und Kontext zu den Finanzdaten. | Aufgabe |
| **Analyse-Agent** | Berechnet Margen, Wachstum und Stabilitätskennzahlen mit dem Rechner-Tool. (Tools: `calculator`) | Recherche-Agent |
| **Review-Agent** | Prüft die Analyse und fasst sie strukturiert zusammen. (strukturierte Ausgabe) | Analyse-Agent, Recherche-Agent |

**Eingabe:** Finanzzahlen eines Unternehmens für mindestens zwei Jahre, zum Beispiel aus Geschäftsbericht oder Quartalsmitteilung, sowie bekannte Sondereffekte. Die Zahlen kannst du einfügen oder als Excel-, CSV- oder PDF-Datei anhängen; die Beispieldatei enthält die Kennzahlen der Testaufgabe.

**Beispieldateien:** `Kennzahlen_Beispiel_Industrie_AG.xlsx`

**Testfälle:** Kennzahlen im Text; Kennzahlen als Excel-Datei

**Ergebnis:** Eine strukturierte Prüfung mit Zusammenfassung, wichtigsten Kennzahlen, gefundenen Fehlern oder Risiken, Grenzen der Analyse und der Angabe, ob die Analyse als korrekt gilt, zusätzlich als PDF und Excel-Datei. Der Recherche-Agent schlägt die extrahierten Zahlen für das Wissen vor; übernommen wird nur, was du bestätigst. Das Ergebnis ist keine Anlageberatung.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Recherche-Agent extrahiert die Zahlen, der Analyse-Agent berechnet jede Kennzahl mit dem Rechner-Tool, und der Review-Agent prüft Rechnungen und Logik gegen die extrahierten Zahlen. Sein Ja/Nein-Urteil sagt, ob die Analyse als korrekt gilt; dieses Urteil hält den Lauf nicht an und löst keine Neuberechnung aus, sodass gefundene Fehler im Ergebnis sichtbar bleiben. Über das Wissen entscheidet eine Person: Die extrahierten Zahlen werden nur übernommen, wenn du sie bestätigst. Das Ergebnis ist keine Anlageberatung; vor Entscheidungen sollte jemand prüfen, der für die Zahlen verantwortlich ist.

**Warum diese Architektur:** Jeder Schritt braucht das Ergebnis des vorigen: Ohne saubere Zahlen gibt es keine korrekten Kennzahlen, ohne Kennzahlen nichts zu prüfen. Deshalb passt eine strikte Kette besser als paralleles Arbeiten oder ein Orchestrator. Rechnen mit dem Rechner-Tool statt mit dem Sprachmodell und die Prüfung durch einen eigenen Agenten verhindern plausibel wirkende, aber falsche Kennzahlen. Die Prüfung erhält auch die extrahierten Zahlen und kann so jede Kennzahl bis zu ihrer Quelle zurückverfolgen.

**Anpassen:** Hänge den Geschäftsbericht oder eure Kennzahlentabelle direkt an. Weitere Kennzahlen, etwa Verschuldungsgrad oder Free Cashflow, ergänzt du im System-Prompt des Analyse-Agenten. Für viele Unternehmen nacheinander eignet sich die Stapelverarbeitung mit einer Zeile je Unternehmen.

## 6 · Blogartikel {#blog-article}
<!-- keywords: marketing und content, briefing, autor, lektorat -->

**Bereich:** Marketing und Content · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Ergebnisdateien

Gute Artikel entstehen aus einem klaren Briefing: wer sie liest, aus welchem Blickwinkel und mit welchen Kernbotschaften. Der Workflow arbeitet wie eine kleine Redaktion und prüft das Ergebnis, bevor es veröffentlicht wird.

**So arbeiten die Agenten zusammen:** Ein schnelles Modell erstellt ein strukturiertes Briefing mit Zielgruppe, Blickwinkel, Gliederung und Kernbotschaften. Der Autor schreibt daraus den Artikel; eine eingebaute Qualitätsprüfung kontrolliert, ob er der Gliederung folgt und die Fragen der Leser beantwortet, und schickt ihn sonst einmal zur Überarbeitung zurück. Ein schnelles Lektorat prüft Länge und Lesbarkeit mit dem Textstatistik-Tool und kennzeichnet ungeprüfte Behauptungen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Briefing** | Legt Zielgruppe, Blickwinkel, Gliederung und Kernbotschaften in einem strukturierten Briefing fest. (strukturierte Ausgabe) | Thema |
| **Autor** | Schreibt den Artikel aus dem Briefing. (mit Qualitätsprüfung) | Briefing |
| **Lektorat** | Prüft Länge und Lesbarkeit und liefert die Endfassung. (Tools: `text_statistics`) | Autor |

**Eingabe:** Ein Thema in einem Satz. Optional ergänzt du Zielgruppe, Tonalität oder gewünschte Länge direkt in der Eingabe.

**Testfälle:** Thema in einem Satz

**Ergebnis:** Ein fertiger Artikel in Markdown mit Überschriften, eine Meta-Beschreibung und kurze Lektoratsnotizen mit Wortzahl und Hinweisen auf Aussagen, die vor der Veröffentlichung belegt werden sollten. Der Lauf speichert das Ergebnis zusätzlich als Markdown- und HTML-Datei, die du in dein CMS übernehmen kannst.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Briefing, Artikel und Lektorat laufen nacheinander; kein Schritt wartet auf eine Person. Eine eigene Qualitätsprüfung bewertet den Artikel nach zwei Kriterien (folgt der Gliederung, beantwortet die Fragen der Leser) und lässt ihn vom Autor einmal überarbeiten, wenn eines nicht erfüllt ist. Das Lektorat verändert den Inhalt nicht, sondern markiert Aussagen, die einen Beleg brauchen. Der Artikel ist ein Entwurf: Ob und wo er erscheint, entscheidest du.

**Warum diese Architektur:** Ein strukturiertes Briefing ersetzt zwei parallele Planer, deren Ergebnisse der Autor zusammenführen musste: Die Gliederung entstand früher, ohne die Zielgruppe zu kennen. Jetzt kommen Zielgruppe, Blickwinkel, Gliederung und Kernbotschaften aus einem Guss und erreichen den Autor als klar getrennte Felder. Der Autor hat eine Qualitätsprüfung mit automatischer Überarbeitung, weil dort die meisten Schwächen entstehen. Als Einsteigerbeispiel bleibt der Workflow bewusst eine kurze Kette ohne Verzweigungen, Schleifen oder Freigaben, damit jeder Schritt im Lauf nachvollziehbar ist.

**Anpassen:** Ändere das Thema in der Eingabe. Euren Styleguide kannst du als Wissen hochladen und Autor und Lektorat zuweisen. Die gewünschte Länge stellst du im System-Prompt des Autors ein, die Zahl der Abschnitte oder Kernbotschaften im System-Prompt des Briefings.

## 7 · Individuelles Angebot vorbereiten {#sales-offer}
<!-- keywords: vertrieb, bedarfsanalyst, lösungsberater, angebotsautor -->

**Bereich:** Vertrieb · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Fortgeschritten · **Bausteine:** Freigabe, Überarbeitungsschleife, Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Ein gutes Angebot beantwortet den tatsächlichen Bedarf des Kunden, nicht nur seine Stichworte. Der Workflow klärt den Bedarf, kalkuliert eine passende Lösung und entwirft ein vollständiges Angebot, das ein Mensch freigibt.

**So arbeiten die Agenten zusammen:** Der Bedarfsanalyst trennt ausdrückliche und unausgesprochene Anforderungen und sammelt offene Fragen. Der Lösungsberater stellt Positionen aus der Preisliste zusammen und rechnet mit dem Rechner-Tool, auch eine Variante innerhalb des Budgets. Der Angebotsautor schreibt das Angebot; eine eingebaute Qualitätsprüfung kontrolliert Vollständigkeit und Preise. Ein Eingabeformular nimmt die Eckdaten auf (Kunde, Termin, Budget, Montage am Wochenende). Danach gibt ein Mensch den Entwurf frei; eine Ablehnung mit Kommentar schickt ihn über eine Schleife zurück an den Angebotsautor, der ihn überarbeitet und erneut vorlegt.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Bedarfsanalyst** | Arbeitet ausdrückliche und unausgesprochene Anforderungen heraus. | Kundenanfrage |
| **Lösungsberater** | Stellt passende Positionen zusammen und kalkuliert mit dem Rechner-Tool. (Tools: `calculator`) | Bedarfsanalyst, Kundenanfrage |
| **Angebotsautor** | Schreibt den Angebotsentwurf für den Kunden. (mit Qualitätsprüfung; Tools: `calculator`) | Bedarfsanalyst, Lösungsberater |

**Eingabe:** Die Anfrage des Kunden und eure Preisliste mit Rabatten und Konditionen. Das Formular nimmt die Eckdaten auf; die Preisliste kannst du in den Text schreiben oder als Excel-, CSV- oder PDF-Datei anhängen, wie die Beispieldatei zeigt.

**Beispieldateien:** `Preisliste_Bueroausstattung.xlsx`

**Testfälle:** Anfrage und Preisliste im Text; Preisliste als Excel-Datei

**Ergebnis:** Ein Angebotsentwurf mit Anschreiben, Positionstabelle, Summen, Varianten, Annahmen und offenen Fragen. Erst nach deiner Freigabe speichert der Lauf das Angebot als PDF und als bearbeitbare Word-Datei; den Versand an den Kunden übernimmst du selbst.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Bedarfsanalyse, Kalkulation und Entwurf laufen ohne Wartezeit; eine eigene Qualitätsprüfung bewertet das Angebot nach drei Kriterien (alle Anforderungen behandelt, Preise passend zur Kalkulation, offene Punkte benannt) und lässt es bei Bedarf einmal überarbeiten. Dann entscheidet ein Mensch: Eine Freigabe erzeugt die Dateien, eine Ablehnung verlangt einen Kommentar und schickt das Angebot mit dem bisherigen Entwurf zurück an den Angebotsautor. Die Schleife erlaubt höchstens drei Überarbeitungsrunden; danach endet der Lauf als fehlgeschlagen. Bedarfsanalyse und Kalkulation des Lösungsberaters werden nicht wiederholt; ändert der Kommentar Mengen, Rabatte oder Lieferpositionen, rechnet der Angebotsautor die betroffenen Summen mit dem Rechner-Tool neu. Der Workflow verschickt nie etwas an den Kunden.

**Warum diese Architektur:** Jede Anfrage braucht dieselben Schritte in derselben Reihenfolge, deshalb passt eine feste Kette besser als ein Orchestrator. Die Preise rechnet das Rechner-Tool in einem eigenen Schritt, sodass der Autor Listenpreise von dort übernimmt, statt sie zu erfinden. Die Schleife an der Freigabe gibt es, weil Ablehnungen meist kleine Korrekturen sind, etwa eine Formulierung, ein Rabatthinweis oder eine fehlende offene Frage; mit dem Kommentar zu überarbeiten geht schneller als ein Neustart. Sie führt bewusst nur zum Angebotsautor zurück, der geänderte Mengen oder Rabatte mit dem Rechner-Tool neu rechnet, aber keine neuen Listenpreise hinzufügt; so bleibt die geprüfte Grundlage der Lösung erhalten.

**Anpassen:** Hänge deine aktuelle Preisliste als Datei an, dann genügt als Text die Kundenanfrage. Zahlungsbedingungen und Textbausteine ergänzt du im System-Prompt des Angebotsautors.

## 8 · Kundenanfragen beantworten {#customer-service}
<!-- keywords: kundenservice, klassifizierer, richtlinienprüfer, antwortverfasser, deeskalation -->

**Bereich:** Kundenservice · **Agenten:** 4 · **Muster:** verzweigt · **Niveau:** Einsteiger · **Bausteine:** Entscheidung, Freigabe, Überarbeitungsschleife, Eingabeformular, Dateien als Eingabe, optionale MCP-Anbindung

Im Kundenservice kommen viele Anfragen gleichzeitig an, und jede braucht die richtige Regel, die richtigen Bestelldaten und den richtigen Ton. Der Workflow sortiert die Anfragen, prüft Richtlinien und Fristen anhand der Bestelldaten und bereitet Antworten zur Freigabe vor.

**So arbeiten die Agenten zusammen:** Ein schneller Klassifizierer ordnet jede Anfrage nach Thema, Dringlichkeit und Stimmung. Der Richtlinienprüfer wendet die Servicerichtlinien an und rechnet Fristen mit dem Datums-Tool nach; ist deine Kopie mit dem Shopsystem verbunden, schlägt er jede Bestellung mit get_order nur lesend nach, sonst nutzt er die Bestelldaten aus den Anfragen oder einen angehängten Bestellexport. Der Antwortverfasser schreibt die Entwürfe; eine Qualitätsprüfung kontrolliert, dass nichts über die Richtlinien hinaus zugesagt wird. Ein Entscheidungsknoten schickt Eskalationen zuerst an einen Deeskalations-Agenten. Jeder Entwurf wartet auf eine Freigabe; eine Ablehnung mit Kommentar schickt die Entwürfe über eine Schleife zurück an den Antwortverfasser, der sie überarbeitet und erneut zur Freigabe vorlegt (höchstens drei Runden).

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Klassifizierer** | Ordnet jede Anfrage nach Thema, Dringlichkeit und Stimmung ein. (strukturierte Ausgabe) | Anfragen |
| **Richtlinienprüfer** | Wendet die Servicerichtlinien an und prüft Fristen mit dem Datums-Tool. (Tools: `days_between`) | Klassifizierer, Anfragen |
| **Antwortverfasser** | Schreibt freundliche Antwortentwürfe zur Freigabe. (mit Qualitätsprüfung) | Klassifizierer, Richtlinienprüfer, Deeskalation |
| **Deeskalation** | Bereitet den Umgang mit verärgerten Kunden vor und klärt, was eine Freigabe braucht. | Eskalation? |

**Eingabe:** Mehrere Kundenanfragen mit Bestellnummern, das heutige Datum und eure Servicerichtlinien, als Auszug im Text oder als Datei (PDF, Word, Markdown); die Beispieldatei enthält ausführlichere Richtlinien. Bestell- und Lieferdaten stammen aus den Anfragen, aus einem angehängten Bestellexport eures Shopsystems (JSON, CSV oder Excel) oder bei bestehender Verbindung direkt aus dem Shopsystem; der Beispielexport enthält die drei Bestellungen der Beispielanfragen.

**Beispieldateien:** `Servicerichtlinien_Musterkueche.pdf`, `Shop_Bestellungen_Musterkueche.json`

**Testfälle:** Vier Anfragen, eine verärgert; Eine freundliche Produktfrage; Richtlinien als PDF-Datei; Nur Bestellnummern, Bestellexport angehängt

**Ergebnis:** Für jede Anfrage eine Einordnung, die anzuwendende Regel mit Fristprüfung und ein Antwortentwurf, der vor dem Versand von einem Menschen freigegeben wird. Die Richtlinienprüfung nennt, woher die Bestelldaten stammen (Shopsystem, Export oder Anfrage) und welche fehlen.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: die Einordnung, die Eskalationsentscheidung (zur Deeskalation, wenn mindestens ein Kunde verärgert ist oder mehr verlangt, als die Richtlinien erlauben), die Richtlinienprüfung und die Entwürfe; das Datums-Tool rechnet Fristen, eine Qualitätsprüfung testet die Entwürfe gegen drei Kriterien (richtlinienkonform, Ton, keine Zusagen), und jeder Schritt wird protokolliert. Ein Mensch gibt jeden Entwurf frei, bevor etwas versendet wird: Eine Ablehnung braucht einen Kommentar und schickt die Entwürfe zurück an den Antwortverfasser; werden sie nach höchstens drei Runden weiter abgelehnt, endet der Lauf als fehlgeschlagen. Die Antworten bleiben Entwürfe; nichts wird automatisch versendet. Die Shop-Verbindung ist optional und liest nur: Die Kopie bekommt get_order nur, wenn du sie mit einem MCP-Server verbindest, dessen Tool ein Administrator als nur lesend freigegeben hat; sonst läuft sie in einem deutlich gekennzeichneten Offline-Modus. Läufe ohne anwesende Person (Zeitpläne, Testreihen, Stapelverarbeitung) dürfen keine MCP-Tools nutzen, außer ein Administrator erlaubt unbeaufsichtigtes MCP ausdrücklich.

**Warum diese Architektur:** Die Schritte bauen aufeinander auf (einordnen, prüfen, schreiben), daher genügt eine feste Kette mit einer Abzweigung für Eskalationen; ein Orchestrator brächte Kosten ohne Nutzen, und für das Einordnen reicht ein schnelles Modell. Bestelldaten kommen über eine Integration, weil sie im Shopsystem liegen und sich stündlich ändern; der Offline-Modus mit Export hält das Beispiel auch ohne Verbindung nutzbar. Die Freigabe mit Überarbeitungsschleife bleibt, weil die Antworten an Kunden gehen: Das letzte Wort hat ein Mensch.

**Optionale Anbindung: Shopsystem (Bestellungen)** (Tools: `get_order`). Nur lesende Bestellabfrage in eurem Shopsystem über MCP: get_order liefert Bestell- und Lieferdatum, Status, Artikel und den letzten Hinweis des Paketdienstes einer Bestellung. Der Richtlinienprüfer prüft damit Fristen anhand echter Bestelldaten statt anhand der Angaben der Kunden.

**Einrichtung:** Ein Administrator fügt den MCP-Server eures Shopsystems unter Tools → Verbundene Dienste hinzu und gibt dessen Tool get_order als nur lesend frei. Beim Kopieren des Beispiels wählst du diesen Server als Verbindung; ohne Verbindung läuft die Kopie im Offline-Modus. Zum Ausprobieren ohne Shopsystem startest du auf dem Rechner mit der Nodestro-Desktop-App `python -m nodestro_examples.demo_mcp --language de`, fügst http://127.0.0.1:8765/mcp unter Tools → Verbundene Dienste mit der Zustimmung für einen lokalen Entwicklungsserver hinzu, gibst seine Tools als nur lesend frei und wählst ihn beim Kopieren. Der Demo-Server liest nur und liefert die synthetischen Bestellungen des Beispielexports, nie echte Kundendaten. Läufe ohne anwesende Person (Zeitpläne, Testreihen, Stapelverarbeitung) dürfen keine MCP-Tools nutzen, außer ein Administrator erlaubt unbeaufsichtigtes MCP ausdrücklich.

**Ohne Anbindung:** Offline-Modus: Es ist kein Shopsystem verbunden. Der Richtlinienprüfer nutzt nur die Bestelldaten aus den Anfragen oder aus einem angehängten Bestellexport und nennt fehlende Bestelldaten; er fragt nichts ab.

**Anpassen:** Hänge eure vollständigen Richtlinien und FAQ als Datei an oder lade sie als Wissen hoch und weise sie dem Richtlinienprüfer zu, wenn sie dauerhaft gelten. Um Bestellungen live zu prüfen, lässt du die Shop-Integration einrichten und wählst den Server beim Kopieren des Beispiels. Den Ton eurer Marke (Du oder Sie, Grußformel) legst du im System-Prompt des Antwortverfassers fest. Viele Anfragen auf einmal bearbeitest du mit der Stapelverarbeitung; Läufe ohne anwesende Person dürfen die Shop-Verbindung aber nicht nutzen, gib Stapeln deshalb einen Bestellexport mit.

## 9 · Stelle ausschreiben und Interviews vorbereiten {#hr-recruiting}
<!-- keywords: personalwesen, stellenprofil, stellenanzeige, interviewleitfaden, fairness-prüfer, überarbeitung -->

**Bereich:** Personalwesen · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Freigabe, Ergebnisdateien

Gute Einstellungen beginnen mit einem klaren Profil und fairen, vergleichbaren Interviews. Der Workflow macht aus losen Notizen ein Stellenprofil, eine Anzeige und einen Interviewleitfaden, prüft alles auf Fairness und überlässt die Freigabe einem Menschen.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Profil-Agent ordnet Aufgaben und Anforderungen. Daraus entstehen parallel die Stellenanzeige und der Interviewleitfaden. Der Fairness-Prüfer kontrolliert beide auf diskriminierende oder unzulässige Formulierungen, etwa zu Alter oder Muttersprache, und nennt, was ein Mensch prüfen muss. Hat er Beanstandungen, leitet ein Entscheidungsknoten die Unterlagen an eine Überarbeitung, die seine Vorschläge umsetzt; sonst bleibt es bei den ersten Fassungen. Zum Schluss prüfen die einstellende Führungskraft oder HR Anzeige, Leitfaden, Fairness-Prüfung und gegebenenfalls die Überarbeitung und geben die Unterlagen frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Stellenprofil** | Ordnet Aufgaben, Muss- und Kann-Anforderungen und Kompetenzen. | Stellenbedarf |
| **Stellenanzeige** | Formuliert eine ansprechende, inklusive Stellenanzeige. | Stellenprofil |
| **Interviewleitfaden** | Bereitet strukturierte Interviewfragen mit Bewertungsankern vor. | Stellenprofil |
| **Fairness-Prüfer** | Prüft Anzeige und Leitfaden auf Diskriminierung und unzulässige Fragen. (strukturierte Ausgabe) | Stellenanzeige, Interviewleitfaden |
| **Überarbeitung** | Setzt die Änderungsvorschläge der Fairness-Prüfung in Anzeige und Leitfaden um. | Nachbesserung nötig? |

**Eingabe:** Notizen zur Stelle: Aufgaben, gewünschte Qualifikationen, Team, Rahmenbedingungen und Vergütung.

**Testfälle:** Notizen mit problematischen Wünschen

**Ergebnis:** Stellenprofil, Stellenanzeige und Interviewleitfaden mit Bewertungsankern, eine strukturierte Fairness-Prüfung und bei Beanstandungen eine überarbeitete Fassung mit Änderungsliste. Die Word-Datei erstellt der Lauf erst nach der Freigabe.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Fairness-Prüfer liefert ein strukturiertes Urteil; sind die Unterlagen nicht ohne Änderungen verwendbar, schickt ein Entscheidungsknoten sie in die Überarbeitung, sonst gehen sie direkt zur Freigabe. Welcher Zweig genommen wurde, ist im Lauf sichtbar. Die letzte Entscheidung bleibt bei einem Menschen: Die einstellende Führungskraft oder HR prüft alle Unterlagen bei der Freigabe; eine Ablehnung verlangt einen Kommentar und beendet den Lauf, erst eine Freigabe erzeugt die Word-Datei. Der Workflow erstellt nur Unterlagen: Er sieht, bewertet oder reiht nie echte Bewerbende.

**Warum diese Architektur:** Anzeige und Leitfaden hängen nur vom Profil ab, deshalb entstehen sie parallel und werden gemeinsam geprüft, was Anforderungen und Formulierungen einheitlich hält. Die Fairness-Prüfung wirkt als automatisches Tor: Die Überarbeitung kostet nur dann einen zusätzlichen Schritt, wenn es Beanstandungen gibt. Eine Schleife aus Prüfung und Überarbeitung gibt es bewusst nicht, weil Fairness- und Rechtsfragen nicht dadurch erledigt sein sollen, dass Modelle sich einig werden; der Mensch bei der Freigabe sieht Prüfung, Überarbeitung und offene Punkte nebeneinander. Die Sichtung von Bewerbungen ist bewusst ausgeklammert, weil sie nach der EU-KI-Verordnung Hochrisiko-KI wäre.

**Anpassen:** Ersetze die Notizen durch deinen Stellenbedarf. Euer Arbeitgeberprofil und eure Benefits kannst du als Wissen hinterlegen und dem Anzeigen-Agenten zuweisen. Rechtliche Vorgaben eures Landes ergänzt du im System-Prompt des Fairness-Prüfers. Erweitere den Workflow nicht ohne rechtliche Prüfung auf das Sichten, Bewerten oder Reihen von Bewerbungen: Solche Systeme gelten nach der EU-KI-Verordnung als Hochrisiko-KI.

## 10 · Forschungsfrage in Hypothesen übersetzen {#research-hypotheses}
<!-- keywords: forschung und entwicklung, fragestellungsanalyst, forschungskoordination, studienplaner -->

**Bereich:** Forschung und Entwicklung · **Agenten:** 3 · **Muster:** adaptiv (Orchestrierung) · **Niveau:** Fortgeschritten · **Bausteine:** Orchestrator mit Teams, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge, Budget und Grenzen

Gute Forschung beginnt mit einer präzisen, prüfbaren Frage und den passenden Methoden. Ein Werkstofftest braucht eine Poweranalyse, eine Interviewstudie einen Stichprobenplan und eine Einwilligungserklärung, und viele Fragen brauchen beides. Der Workflow analysiert die Frage und lässt eine Forschungskoordination genau die Methodenteams hinzuziehen, die die Frage braucht.

**So arbeiten die Agenten zusammen:** Der Fragestellungsanalyst strukturiert die Frage und fasst beigefügte Daten zusammen, weil die Teams ohne die Dateien arbeiten. Die Forschungskoordination, ein Orchestrator, beginnt immer mit dem Hypothesenteam und entscheidet dann: Messbare Zielgrößen gehen an das Statistikteam, dessen Studiendesign und Signifikanzniveau sie als Parameter setzt; Erfahrungen und Gründe gehen an das Team für qualitative Methoden; Menschen oder personenbezogene Daten holen das Team für Ethik und Datenschutz dazu. Hält ein Team eine Hypothese für nicht prüfbar, schickt die Koordination sie einmal an das Hypothesenteam zurück. Der Studienplaner macht aus allem einen Plan.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Fragestellungsanalyst** | Klärt Ziel, Variablen, Rahmenbedingungen und Wissenslücken. | Forschungsfrage |
| **Forschungskoordination** | Entscheidet, welche Methodenteams die Frage braucht, und setzt die Parameter des Statistikteams. (Orchestrator) | Fragestellungsanalyst |
| **Studienplaner** | Leitet aus der Analyse und den Ergebnissen der Methodenteams den Studienplan ab. | Fragestellungsanalyst, Forschungskoordination |

**Teams, die der Orchestrator einsetzen kann:**

| Team | Aufgabe | Fähigkeiten |
|---|---|---|
| **Hypothesenteam** | Macht aus einer analysierten Forschungsfrage prüfbare Hypothesen mit Nullhypothesen und messbaren Vorhersagen; überarbeitet sie nach einer Methodenkritik. | hypotheses, operationalisation |
| **Statistikteam** | Prüft quantitative Hypothesen an den Daten, wertet Vorversuchsdaten mit dem Rechner aus und schätzt die Stichprobengröße für ein vorgegebenes Design, Signifikanzniveau und eine Power. (Parameter: Studiendesign, Signifikanzniveau α, Angestrebte Power) | statistics, power analysis, quantitative methods |
| **Team qualitative Methoden** | Plant Interviews, Beobachtungen oder Fokusgruppen für Fragen nach Erfahrungen, Gründen und Verhalten: Stichprobe, Leitfaden und Auswertung. | qualitative methods, interviews, observation |
| **Team Ethik und Datenschutz** | Prüft Studien mit Menschen oder personenbezogenen Daten: Einwilligung, Datensparsamkeit, Anonymisierung, Beteiligung der Beschäftigtenvertretung und Ethikvotum. | research ethics, data protection, informed consent |

**Eingabe:** Eine Forschungsfrage mit Ziel, vorhandenen Daten aus Vorversuchen und Rahmenbedingungen wie Material, Zeit und Ausstattung. Messdaten und Dokumente kannst du als Dateien anhängen; die Beispieldatei enthält die Vorversuchsbewertungen je Blech.

**Beispieldateien:** `Vorversuch_PL-7.csv`

**Testfälle:** Frage und Vorversuch im Text; Vorversuchsdaten als CSV; Interviewstudie ohne Messwerte

**Ergebnis:** Ein Studienplan mit Hypothesen, Design, Stichprobengröße, Mess- oder Interviewmethode, Auswertung, Abbruchkriterien und offenen Risiken, zusätzlich als Word-Datei. Die Orchestrierungsansicht des Laufs zeigt, welche Methodenteams mit welchen Parametern beteiligt waren und welche weggelassen wurden und warum. Der Studienplaner schlägt den Plan für das Wissen vor; du entscheidest, ob er gespeichert wird.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Die Koordination entscheidet, welche Methodenteams arbeiten, und füllt das Formular des Statistikteams (Design, Signifikanzniveau, Power); jede Entscheidung wird mit Begründung festgehalten. Grenzen: höchstens 7 Entscheidungen, jedes Team höchstens zweimal, ein Budget von 4 USD pro Lauf. Kein Schritt wartet auf eine Person; der Plan ist ein Entwurf für die verantwortliche Forscherin oder den verantwortlichen Forscher.

**Warum diese Architektur:** Eine feste Kette würde immer eine Statistikkritik ausführen, auch bei einer Interviewstudie, in der es nichts zu rechnen gibt, und Ethik nur einbeziehen, wenn jemand daran denkt. Die Koordination wählt je Frage und übergibt dem Statistikteam strukturierte Parameter statt Freitext, sodass die Poweranalyse mit einem definierten Design rechnet. Analyse und Studienplan bleiben feste Schritte: Jede Studie braucht sie.

**Anpassen:** Ersetze Frage und Vorversuch durch deine eigenen und hänge Messdaten direkt an. Deine Statistikrichtlinien ergänzt du beim Agenten des Statistikteams. Braucht dein Fachgebiet ein weiteres Methodenteam, etwa ein Laborteam, speicherst du es als Workflow mit klarer Beschreibung und fügst es den Teams der Koordination hinzu.

## 11 · Code-Review mit Tests {#code-review}
<!-- keywords: softwareentwicklung, fehleranalyst, sicherheitsprüfer, verbesserung und tests -->

**Bereich:** Softwareentwicklung · **Agenten:** 3 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Ein zweiter Blick findet Fehler, bevor sie in Produktion gehen. Der Workflow prüft Code gleichzeitig auf Logikfehler und Sicherheitsprobleme und liefert eine verbesserte Fassung samt Tests.

**So arbeiten die Agenten zusammen:** Fehleranalyst und Sicherheitsprüfer arbeiten parallel am selben Code. Der Verbesserungs-Agent führt die Befunde zusammen, schreibt korrigierten Code und pytest-Tests; eine eingebaute Qualitätsprüfung kontrolliert, dass jeder Befund behandelt und durch Tests abgedeckt ist.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Fehleranalyst** | Sucht Logikfehler, Randfälle und Abweichungen von der Beschreibung. | Quellcode |
| **Sicherheitsprüfer** | Prüft den Code auf Sicherheitslücken und unsichere Muster. | Quellcode |
| **Verbesserung und Tests** | Schreibt korrigierten Code und pytest-Tests zu allen Befunden. (mit Qualitätsprüfung) | Fehleranalyst, Sicherheitsprüfer, Quellcode |

**Eingabe:** Ein Codeausschnitt mit kurzem Kontext: Sprache, Zweck und Umgebung, oder ein ganzes Projekt als ZIP-Archiv bzw. einzelne Dateien im Dateifeld. Archive werden nur gelesen, nie ausgeführt. Der Code bleibt unverändert in seiner Sprache; Erklärungen erscheinen in der Oberflächensprache. Die Beispieldatei ist ein kleines Python-Projekt mit eingebauten Fehlern.

**Beispieldateien:** `rabattrechner.zip`

**Testfälle:** Codeausschnitt im Text; Projekt als ZIP-Archiv

**Ergebnis:** Eine nach Schwere geordnete Liste der Befunde, der korrigierte Code und pytest-Tests, die jeden Befund abdecken, zusätzlich als Markdown-Datei. Die Tests werden nicht automatisch ausgeführt; führe sie lokal aus.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Eine Qualitätsprüfung durch ein zweites Modell liest die Antwort von „Verbesserung und Tests“ gegen drei Kriterien (jeder Befund behandelt, ein Test je behobenem Befund, vollständiger Code ohne Platzhalter); fällt ein Kriterium durch, überarbeitet der Agent seine Antwort einmal, und das Prüfergebnis wird mit dem Lauf festgehalten. Die Prüfung beurteilt den Text, sie führt den Code nicht aus. Kein Schritt wartet auf eine Person, ein eigenes Budget ist nicht gesetzt (es gilt das Standardbudget deines Arbeitsbereichs), und hochgeladene Archive werden nur gelesen, nie ausgeführt. Korrigierter Code und Tests sind ein Vorschlag: Prüfe sie und führe die Tests lokal aus, bevor du etwas übernimmst.

**Warum diese Architektur:** Fehler und Sicherheitsprobleme sind zwei unabhängige Blicke auf denselben Code, deshalb arbeiten Fehleranalyst und Sicherheitsprüfer parallel, und keiner wartet auf den anderen; der Verbesserungs-Agent bekommt zusätzlich den Originalcode, damit er die Befunde zusammenführen und Doppelungen entfernen kann. Die Qualitätsprüfung mit einer Überarbeitung gibt es, weil beim Zusammenführen zweier Reviews typischerweise ein Befund oder ein Test vergessen wird. Bewusst nicht verwendet wurde eine Koordination, denn jedes Review braucht beide Blicke; auch das Ausführen von Code oder Tests im Workflow fehlt absichtlich, damit fremder Code nie auf der Plattform läuft.

**Anpassen:** Hänge dein Projekt als ZIP an oder füge Code ein und nenne Sprache und Framework. Für andere Sprachen passe im Verbesserungs-Agenten das Testframework an, zum Beispiel Jest oder JUnit. Eure Coding-Guidelines kannst du als Wissen hinterlegen. Über die Workflow-API lässt sich das Review auch aus einer CI-Pipeline anstoßen.

## 12 · Vertrag strukturieren und Prüfpunkte finden {#contract-review}
<!-- keywords: recht und verwaltung, vertragsstrukturierer, klausel-erklärer, prüfpunkte-analyst, vertragsübersicht, kritische klauseln -->

**Bereich:** Recht und Verwaltung · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge, Wissensdateien

Verträge sind lang, und wichtige Klauseln verstecken sich in Details. Ob eine Klausel annehmbar ist, hängt außerdem von den eigenen Vorgaben des Unternehmens ab. Der Workflow gliedert einen Vertrag, erklärt ihn in einfacher Sprache und prüft ihn gegen das Vertrags-Playbook des Kunden, damit eine fachkundige Person sofort sieht, wo er abweicht. Er ersetzt keine Rechtsberatung.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Strukturierer erfasst Parteien, Laufzeit, Leistungen und Fristen. Darauf arbeiten parallel der Klausel-Erklärer (einfache Sprache) und der Prüfpunkte-Analyst; beide lesen den Vertrag selbst, als Text oder als hochgeladene Datei. Der Prüfpunkte-Analyst durchsucht für jede Klausel das Vertrags-Playbook des Unternehmens, zitiert den Playbook-Abschnitt und stuft die Klausel als Standard, Rückfallposition, Abweichung oder rote Linie ein. Findet er eine rote Linie oder eine andere kritische Klausel, ergänzt ein Entscheidungsknoten eine vertiefte Prüfung dieser Klauseln. Der Berichts-Agent führt alles zu einer strukturierten Übersicht mit Fragen für die Rechtsberatung zusammen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Vertragsstrukturierer** | Erfasst Parteien, Gegenstand, Laufzeit, Vergütung und Fristen. | Vertragstext |
| **Klausel-Erklärer** | Erklärt jede Klausel in einfacher Sprache. | Vertragsstrukturierer, Vertragstext |
| **Prüfpunkte-Analyst** | Prüft jede Klausel gegen das Vertrags-Playbook des Kunden und findet ungewöhnliche, einseitige oder fehlende Regelungen. (strukturierte Ausgabe) | Vertragsstrukturierer, Vertragstext |
| **Vertragsübersicht** | Führt Erklärungen und Prüfpunkte zu einer strukturierten Übersicht zusammen. (strukturierte Ausgabe) | Klausel-Erklärer, Prüfpunkte-Analyst, Kritische Klauseln |
| **Kritische Klauseln** | Prüft kritische Klauseln vertieft und bereitet Verhandlungsfragen vor. | Kritische Klauseln? |

**Eingabe:** Der Vertrag als Datei (PDF, Word, Markdown oder Text) im Feld „Vertrag als Datei“ oder als Text, möglichst mit Paragrafennummern. Die Datei lädst du direkt beim Start hoch; der Vertrag gehört nicht in die Wissenssammlung. Das Playbook kommt aus der Wissenssammlung; das erfundene Playbook der Muster Handels KG ist dabei. Die Beispieldatei enthält den erfundenen Vertrag der Testaufgabe.

**Beispieldateien:** `Software-Dienstleistungsvertrag_Beispiel.docx`

**Testfälle:** Vertrag im Text, mit kritischen Klauseln; Vertrag als Word-Datei, ohne Text; Ausgewogener Wartungsvertrag

**Ergebnis:** Eine strukturierte Übersicht mit Zusammenfassung, Eckdaten, erklärten Klauseln, Prüfpunkten und Fragen an eine Rechtsanwältin oder einen Rechtsanwalt, zusätzlich als PDF und als bearbeitbare Word-Datei. Jeder Prüfpunkt nennt den Playbook-Abschnitt, an dem er gemessen wurde, und Themen, zu denen das Playbook schweigt, sind als solche markiert. Der Strukturierer schlägt die Eckdaten des Vertrags für das Wissen vor, etwa für ein Vertragsverzeichnis; gespeichert wird nur, was du bestätigst. Das Ergebnis ist eine Arbeitshilfe und keine Rechtsberatung.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Prüfpunkte-Analyst stuft jede Klausel anhand des Playbooks ein und zählt die kritischen; jede rote Linie gilt als kritisch. Ist die Zahl größer als null, ergänzt der Entscheidungsknoten die vertiefte Prüfung der kritischen Klauseln, sonst entfällt sie. Kein Schritt wartet auf eine Person, und der Workflow verschickt nichts. Übersicht und Fragen sind die Grundlage für die Prüfung durch eine Anwältin oder einen Anwalt; was verhandelt wird, entscheiden die Beteiligten.

**Warum diese Architektur:** Erklären und Prüfen hängen nicht voneinander ab und laufen deshalb parallel auf der Struktur. Das Playbook ist durchsuchbares Wissen statt Text im Prompt: Die Rechtsabteilung pflegt es an einer Stelle, die Suche liefert nur den passenden Abschnitt, und das Zitat macht jede Einstufung nachvollziehbar. Die vertiefte Prüfung ist eine Verzweigung, weil sie ihre Kosten nur wert ist, wenn eine rote Linie überschritten wird. Ein Orchestrator wurde nicht verwendet, weil jeder Vertrag dieselben Schritte braucht.

**Wissensdateien (synthetisch, werden beim Kopieren angelegt):** Vertrags-Playbook_Muster_Handels_KG: Erfundenes Vertrags-Playbook der Muster Handels KG für Software- und Cloud-Verträge: Standardposition, Rückfallposition und rote Linie je Thema.

**Anpassen:** Lade deinen Vertrag beim Start als Datei hoch oder füge ihn ein. Ersetze das erfundene Playbook in der Wissenssammlung durch euer eigenes, am besten mit derselben Gliederung je Thema: Standardposition, akzeptable Rückfallposition und rote Linie. Themen, die euch wichtig sind, etwa Versicherung oder Auditrechte, ergänzt du einfach im Playbook; der Prüfpunkte-Analyst findet sie über die Suche.

## 13 · Persönlichen Lernplan erstellen {#learning-plan}
<!-- keywords: bildung und weiterbildung, lernstandsanalyse, lernplaner, erklärer, prüfungsautor -->

**Bereich:** Bildung und Weiterbildung · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Gedächtnis

Lernen klappt besser mit einem Plan, der beim eigenen Stand ansetzt. Der Workflow erstellt einen persönlichen Lernplan, erklärt die ersten Inhalte und prüft das Verständnis mit einem Quiz.

**So arbeiten die Agenten zusammen:** Die Lernstandsanalyse bestimmt Ausgangslage und Lücken, der Lernplaner erstellt daraus einen Wochenplan. Auf dieser Grundlage arbeiten parallel der Erklärer (Lerninhalte der gewählten Woche, auf Wunsch gestützt auf deine Kursunterlagen) und der Prüfungsautor (Wissenskontrolle mit Lösungen). Das Ergebnis enthält alle drei Teile. Lernstandsanalyse und Lernplaner teilen sich ein Gedächtnis: Sie lesen zuerst den Fortschritt der früheren Wochen und aktualisieren ihn am Ende, sodass jede Woche auf der vorigen aufbaut.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Lernstandsanalyse** | Bestimmt Ausgangslage, Lernziel und Lücken. | Lernziel |
| **Lernplaner** | Erstellt einen Wochenplan mit Lernzielen und Übungen. | Lernstandsanalyse |
| **Erklärer** | Erklärt die Inhalte der ersten Woche mit Beispielen und Übungen. | Lernplaner, Lernziel |
| **Prüfungsautor** | Erstellt eine Wissenskontrolle mit Lösungen zur ersten Woche. | Lernplaner |

**Eingabe:** Wer lernt, das Lernziel, verfügbare Zeit, Vorwissen und bevorzugter Lernstil. Im Formular wählst du die Woche, die ausgearbeitet wird, und kannst eigene Kursunterlagen anhängen; die Beispieldatei ist eine kurze Anleitung zu Pivot-Tabellen. Ab der zweiten Woche ergänzt du eine kurze Notiz, wie die letzte Woche lief (Quizergebnis, was schwer war); Lernstand, Ziele, erledigte Themen und Schwierigkeiten früherer Wochen werden gemerkt.

**Beispieldateien:** `Kurzanleitung_Pivot-Tabellen.docx`

**Testfälle:** Woche 1 ohne Unterlagen; Woche 2 mit Kursunterlage

**Ergebnis:** Ein vierwöchiger Lernplan mit Lernzielen je Woche, verständliche Erklärungen mit Übungen für die gewählte Woche und ein Quiz mit Lösungen und Erklärungen, zusätzlich als PDF zum Ausdrucken.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Zu Beginn jedes Laufs lesen Lernstandsanalyse und Lernplaner das Gedächtnis „learning-progress“ und aktualisieren es am Ende. Es enthält Lernstand, Ziele, erledigte Themen, Schwierigkeiten und den Plan in Kurzform, aber keine sensiblen persönlichen Daten. Das Gedächtnis gehört zu deiner Kopie und bleibt über Läufe hinweg erhalten; im Workflow-Editor siehst und löschst du seine Einträge beim Gedächtnis eines der beiden Agenten, etwa um einen falschen Eintrag zu korrigieren oder mit einer anderen lernenden Person neu zu beginnen. In der ersten Woche ist das Gedächtnis leer, und der Workflow arbeitet allein mit deiner Beschreibung. Kein Schritt wartet auf eine Person: Plan, Erklärungen und Quiz sind Vorschläge, die du an dein eigenes Tempo anpasst.

**Warum diese Architektur:** Lernen erstreckt sich über Wochen, doch jeder Lauf beginnt von vorn. Ohne Gedächtnis müsstest du deinen Fortschritt jede Woche neu beschreiben, und der Plan würde jedes Mal neu entstehen, statt auf der vorigen Woche aufzubauen. Das Gedächtnis trägt genau diesen veränderlichen Stand; Kursunterlagen, die gleich bleiben, gehören dagegen ins Wissen. Nur Lernstandsanalyse und Lernplaner merken sich etwas, weil sie entscheiden, was als Nächstes kommt; Erklärer und Prüfungsautor arbeiten parallel an der gewählten Woche des Plans und brauchen keine eigene Vorgeschichte.

**Anpassen:** Beschreibe dein eigenes Lernziel, es funktioniert für fast jedes Thema. Für die nächsten Wochen startest du den Workflow erneut und änderst im Formular die Woche. Kursunterlagen, die du dauerhaft nutzt, lädst du als Wissen hoch und weist sie dem Erklärer zu.

## 14 · Haushaltsbudget prüfen und sparen {#household-budget}
<!-- keywords: privatpersonen – finanzen, budgetanalyst, sparberater, realitätscheck -->

**Bereich:** Privatpersonen – Finanzen · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Am Monatsende ist oft weniger übrig als gedacht. Der Workflow rechnet ein Haushaltsbudget nach, findet Sparpotenzial und prüft, ob die Vorschläge im Alltag realistisch sind.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Budgetanalyst rechnet Summen, Überschuss und Anteile je Kategorie mit dem Rechner-Tool. Der Sparberater schätzt konkrete Einsparungen, ebenfalls nachgerechnet. Der Realitätscheck bekommt beide Ergebnisse, prüft Machbarkeit und liefert ein strukturiertes Ergebnis.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Budgetanalyst** | Rechnet Einnahmen, Ausgaben, Überschuss und Anteile mit dem Rechner-Tool. (Tools: `calculator`) | Haushaltsbudget |
| **Sparberater** | Findet konkrete Sparmöglichkeiten und schätzt ihren Effekt. (Tools: `calculator`) | Budgetanalyst, Haushaltsbudget |
| **Realitätscheck** | Prüft die Vorschläge auf Machbarkeit und fasst sie zusammen. (strukturierte Ausgabe) | Budgetanalyst, Sparberater |

**Eingabe:** Einnahmen, feste und variable Ausgaben eines Haushalts sowie ein Sparziel. Statt alles abzutippen, kannst du Kontoumsätze oder ein Haushaltsbuch als CSV- oder Excel-Datei anhängen; die Beispieldatei enthält einen erfundenen Monat.

**Beispieldateien:** `Kontoumsaetze_Maerz_2026.csv`

**Testfälle:** Budget im Text; Kontoumsätze als CSV

**Ergebnis:** Ein strukturierter Budgetcheck mit aktuellem Monatsüberschuss, Sparpotenzial, Maßnahmen, schnellen ersten Schritten und Hinweisen, zusätzlich als Excel-Datei. Er ersetzt keine Finanz- oder Schuldnerberatung.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Budgetanalyst und Sparberater rechnen jede Summe mit dem Rechner-Tool, und der Realitätscheck liefert feste Felder (Monatsüberschuss, Sparpotenzial, Maßnahmen, schnelle Schritte, Hinweise), die in die Excel-Datei einfließen. Das Beispiel ist als sensibel markiert: Jeder Agent ist angewiesen, die Punkte zu nennen, die eine fachkundige Person prüfen sollte, und nicht sicherer zu klingen, als die Daten erlauben. Es gibt keinen Freigabeschritt und keine automatische Überarbeitung; ein eigenes Budget ist nicht gesetzt (es gilt das Standardbudget deines Arbeitsbereichs). Es wird nichts überwiesen, gekündigt oder gebucht: Das Ergebnis ist eine Arbeitshilfe für deine eigenen Entscheidungen, keine Finanz- oder Schuldnerberatung.

**Warum diese Architektur:** Jeder Schritt baut auf dem vorigen auf: Einsparungen lassen sich erst schätzen, wenn das Budget steht, und erst prüfen, wenn beides vorliegt, deshalb genügt eine feste Kette. Das Rechner-Tool sorgt dafür, dass die Zahlen gerechnet statt geschätzt sind, und die strukturierten Felder machen Überschuss und Potenzial von Lauf zu Lauf vergleichbar. Statt einer Schleife gibt es einen eigenen, schlanken Realitätscheck, weil seine Aufgabe ist, unrealistische Ideen zu streichen, nicht Text zu polieren. Bewusst nicht verwendet: eine Bankanbindung und ein Gedächtnis, damit persönliche Kontodaten nur als Datei für diesen einen Lauf übergeben und nicht zwischen Läufen aufbewahrt werden.

**Anpassen:** Hänge deine eigenen Kontoumsätze an oder trage deine Zahlen ein; persönliche Prioritäten, etwa „Auto bleibt“, ergänzt du im Text. Kontoauszüge enthalten persönliche Daten: Sie bleiben bei dir und werden nur für diesen Lauf an das Modell gegeben.

## 15 · Individuelle Reise planen {#travel-plan}
<!-- keywords: privatpersonen – reisen, routenplaner, budgetplaner, organisationsplaner, reiseunterlagen -->

**Bereich:** Privatpersonen – Reisen · **Agenten:** 4 · **Muster:** verzweigt · **Niveau:** Einsteiger · **Bausteine:** Entscheidung, Eingabeformular, Ergebnisdateien

Eine gute Reise passt zu Interessen, Budget und Einschränkungen aller Mitreisenden. Der Workflow plant eine Route, rechnet das Budget nach und erstellt eine Checkliste für die Organisation.

**So arbeiten die Agenten zusammen:** Der Routenplaner entwirft einen Tagesplan nach Interessen und Rahmenbedingungen. Der Budgetplaner rechnet mit Rechner- und Datums-Tool Nächte und Kosten. Der Organisationsplaner führt alles zu einem Reiseplan mit Checkliste zusammen; eine Qualitätsprüfung kontrolliert Budget und Einschränkungen. Ein Eingabeformular nimmt Ziel, Daten, Reisende und Budget auf. Bei Auslandsreisen ergänzt ein Entscheidungsknoten eine Checkliste für Dokumente und Einreiseregeln.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Routenplaner** | Entwirft einen Tagesplan nach Interessen und Einschränkungen. | Reisewunsch |
| **Budgetplaner** | Rechnet Nächte und Kosten mit Rechner- und Datums-Tool nach. (Tools: `calculator`, `days_between`) | Routenplaner |
| **Organisationsplaner** | Führt Route und Budget zu einem Reiseplan mit Checkliste zusammen. (mit Qualitätsprüfung) | Routenplaner, Budgetplaner, Reiseunterlagen |
| **Reiseunterlagen** | Listet Dokumente, Versicherung und Einreiseregeln für Auslandsreisen. | Ausland? |

**Eingabe:** Wer reist, Ziel und Reisedaten, Budget, Interessen und Einschränkungen.

**Testfälle:** Familienreise nach Lissabon (Ausland); Wochenende im Inland

**Ergebnis:** Ein Reiseplan mit Tagesablauf, Budgettabelle und Checkliste, zusätzlich als PDF zum Mitnehmen. Preise und Öffnungszeiten sind Schätzungen aus allgemeinem Wissen und müssen vor der Buchung geprüft werden, denn der Workflow nutzt keine Live-Daten.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Entscheidungsknoten liest das Formularfeld „Reise ins Ausland“ und lässt den Agenten Reiseunterlagen nur laufen, wenn es angehakt ist; der Budgetplaner zählt die Nächte mit dem Datums-Tool und rechnet die Kosten mit dem Rechner zusammen. Eine Qualitätsprüfung durch ein zweites Modell liest den Plan des Organisationsplaners gegen drei Kriterien (im Budget, alle Einschränkungen beachtet, ungeprüfte Angaben markiert); fällt eines durch, wird der Plan einmal überarbeitet, und das Prüfergebnis wird mit dem Lauf festgehalten. Kein Schritt wartet auf eine Person, ein eigenes Budget ist nicht gesetzt (es gilt das Standardbudget deines Arbeitsbereichs). Gebucht wird nichts: Preise, Öffnungszeiten und Einreiseregeln sind Schätzungen, die du vor der Buchung prüfst.

**Warum diese Architektur:** Route, Budget und Organisation bauen aufeinander auf und bilden deshalb eine Kette; nur die Dokumenten-Checkliste hängt an einer Ja/Nein-Frage, die ein Entscheidungsknoten aus dem Formular beantwortet, sodass ein Inlandswochenende keine Passliste bezahlt. Nächte und Summen kommen aus Tools, weil Datums- und Rechenfehler die typische Schwäche von Sprachmodellen sind. Eine Live-Websuche ist bewusst nicht eingebaut: Ihre Ergebnisse ändern sich von Tag zu Tag, Läufe wären nicht reproduzierbar, das Beispiel hinge an einem kostenpflichtigen Server-Tool und ließe sich nicht unverändert weitergeben; stattdessen ist jeder Preis als Schätzung markiert, und du kannst die Websuche selbst ergänzen.

**Anpassen:** Trage deinen Reisewunsch ein. Wer aktuelle Preise und Öffnungszeiten möchte, kann dem Routenplaner das Server-Tool „Websuche“ hinzufügen; das kostet zusätzlich pro Suche.

## 16 · Geschäftsidee bewerten {#business-idea}
<!-- keywords: selbstständige und gründer, gründungscoach, investoren-jury -->

**Bereich:** Selbstständige und Gründer · **Agenten:** 2 · **Muster:** adaptiv (Orchestrierung) · **Niveau:** Fortgeschritten · **Bausteine:** Orchestrator mit Teams, Ergebnisdateien, Budget und Grenzen

Vor einer Gründung lohnt ein nüchterner Blick auf Markt, Zahlen und Risiken. Doch nicht jede Idee braucht dieselben Fachleute: Ein Fahrradreparaturservice braucht keine Genehmigungsexpertin, ein Getränke-Start-up schon. Der Workflow lässt einen Gründungscoach die passenden Fachteams zusammenstellen und eine Investoren-Jury ein begründetes Urteil fällen.

**So arbeiten die Agenten zusammen:** Der Gründungscoach ist ein Orchestrator: Er liest die Idee und entscheidet, welche von fünf Fachteams er einbezieht. Markt, Wirtschaftlichkeit und Risiken arbeiten bei jeder Idee parallel; Regulierung und Betrieb kommen nur dazu, wenn die Idee sie verlangt. Widersprechen sich Ergebnisse, stellt der Coach einem Team eine gezielte Nachfrage. Die Investoren-Jury wägt danach alle Berichte ab und liefert ein strukturiertes Urteil mit Punktzahl.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Gründungscoach** | Entscheidet, welche Fachteams die Idee braucht, lässt sie parallel arbeiten und stellt Nachfragen. (Orchestrator) | Geschäftsidee |
| **Investoren-Jury** | Wägt Markt, Zahlen und Risiken ab und fällt ein Urteil. (strukturierte Ausgabe) | Geschäftsidee, Gründungscoach |

**Teams, die der Orchestrator einsetzen kann:**

| Team | Aufgabe | Fähigkeiten |
|---|---|---|
| **Marktteam** | Schätzt Zielgruppen, Nachfrage, Zahlungsbereitschaft und Wettbewerb einer Geschäftsidee ein. | market analysis, target groups, competition |
| **Wirtschaftlichkeitsteam** | Rechnet Deckungsbeitrag, Break-even, Amortisation und Szenarien einer Geschäftsidee mit dem Rechner-Tool. | profitability, break-even, financial planning |
| **Risikoteam** | Sucht die Schwachstellen einer Geschäftsidee und günstige Wege, sie vor der Gründung zu testen. | risk analysis, validation experiments |
| **Regulierungsteam** | Ermittelt Genehmigungen, Anmeldungen, Kennzeichnung, Hygiene, Versicherung und Datenschutzpflichten, die eine Geschäftsidee berührt. | regulation, permits, licences, data protection |
| **Betriebsteam** | Prüft, ob eine Geschäftsidee wie beschrieben umsetzbar ist: Abläufe, Kapazität, Ausstattung, Lieferanten und Logistik. | operations, technology, logistics, suppliers |

**Eingabe:** Eine Beschreibung der Idee mit Angebot, Zielgruppen, Preisen, Kosten, Kapazität und bekannten Wettbewerbern.

**Testfälle:** Mobiler Fahrradreparaturservice; Kombucha-Manufaktur (regulierte Lebensmittel)

**Ergebnis:** Ein strukturiertes Urteil (weiterverfolgen, anpassen oder verwerfen) mit Punktzahl, Stärken, Risiken, zu prüfenden Annahmen und konkreten nächsten Schritten, zusätzlich als PDF-Bericht. Im Lauf zeigt die Orchestrierungsansicht, welche Teams der Coach gewählt hat, warum, mit welchem Auftrag und was jedes Team geliefert hat.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Coach entscheidet, welche Teams arbeiten, in welcher Reihenfolge und mit welchem Auftrag; jede Entscheidung wird mit Begründung festgehalten. Grenzen halten das im Rahmen: höchstens 6 Entscheidungen, jedes Team höchstens zweimal, höchstens 3 Teams gleichzeitig und ein Budget von 3 USD pro Lauf. Kein Schritt wartet auf eine Person; das Urteil ist die Grundlage für deine eigene Entscheidung.

**Warum diese Architektur:** Ein fester Workflow würde entweder jedes Mal alle fünf Fachteams laufen lassen und eine Genehmigungsanalyse bezahlen, die ein Fahrradservice nicht braucht, oder sie weglassen, wenn sie wichtig sind. Der Coach trifft genau diese Wahl, nachvollziehbar und innerhalb von Grenzen. Die Jury bleibt ein fester Schritt, weil ein vergleichbares, strukturiertes Urteil nicht davon abhängen soll, wie der Coach die Arbeit verteilt hat.

**Anpassen:** Beschreibe deine Idee mit deinen eigenen Zahlen. Für eine weitere Fachperson, etwa für Steuerfragen, speicherst du einen Workflow mit klarer Beschreibung und Fähigkeiten und fügst ihn den Teams des Coachs hinzu; der Coach entscheidet dann selbst, wann er gebraucht wird. Eigene Marktdaten lädst du als Wissen hoch und weist sie dem Marktanalysten im Marktteam zu.

## 17 · Social-Media-Strategie entwickeln {#creator-strategy}
<!-- keywords: influencer und content creator, strategieagent, ideenentwickler, redaktionsplaner -->

**Bereich:** Influencer und Content Creator · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Gedächtnis

Wer regelmäßig veröffentlicht, braucht eine klare Linie und einen Plan, der zum eigenen Zeitbudget passt. Der Workflow leitet aus Kennzahlen eine Strategie ab, sammelt passende Ideen und plant die Veröffentlichung.

**So arbeiten die Agenten zusammen:** Eine Kette aus drei Agenten: Der Strategieagent legt Positionierung, Content-Säulen und Ziele fest und wertet dazu angehängte Statistiken aus, der Ideenentwickler formuliert konkrete Beitragsideen mit Hook, der Redaktionsplaner verteilt sie auf vier Wochen. Der Ideenentwickler merkt sich seine Vorschläge in einem Gedächtnis, damit spätere Läufe keine Ideen wiederholen. Eine Qualitätsprüfung kontrolliert, ob Frequenz und Mischung realistisch sind.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Strategieagent** | Legt Positionierung, Content-Säulen und messbare Ziele fest. | Creator-Profil |
| **Ideenentwickler** | Entwickelt konkrete Beitragsideen mit Hook und Format. | Strategieagent |
| **Redaktionsplaner** | Verteilt die Ideen auf einen realistischen Vierwochenplan. (mit Qualitätsprüfung) | Strategieagent, Ideenentwickler |

**Eingabe:** Profil mit Plattformen, Kennzahlen, erfolgreichen Beiträgen, Zielgruppe, Zielen, verfügbarer Zeit und Startdatum. Statistiken kannst du zusätzlich als Screenshots oder als CSV-/Excel-Export anhängen; die Beispieldatei ist ein solcher Export.

**Beispieldateien:** `Beitragsstatistik_Maerz.csv`

**Testfälle:** Profil im Text; Profil mit Statistik-Export

**Ergebnis:** Ein vierwöchiger Redaktionsplan mit Datum, Plattform, Format, Idee, Hook und Call-to-Action, eingeleitet von einer kurzen Zusammenfassung der Strategie, zusätzlich als Excel-Datei zum Weiterplanen.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Der Ideenentwickler liest vor dem Start das Gedächtnis „creator-ideas“ und speichert am Ende jedes Laufs selbst die Arbeitstitel seiner neuen Ideen dort, ohne Bestätigungsschritt; unter Memory kannst du das Gedächtnis ansehen oder leeren. Eine Qualitätsprüfung durch ein zweites Modell liest den Plan des Redaktionsplaners gegen drei Kriterien (Frequenz passt zum Zeitbudget, Säulen ausgewogen, Ziele unterstützt); fällt eines durch, wird der Plan einmal überarbeitet, und das Prüfergebnis wird mit dem Lauf festgehalten. Kein Schritt wartet auf eine Person, ein eigenes Budget ist nicht gesetzt (es gilt das Standardbudget deines Arbeitsbereichs). Veröffentlicht wird nichts: Der Plan ist ein Entwurf, den du anpasst und selbst postest.

**Warum diese Architektur:** Strategie, Ideen und Redaktionsplan bauen streng aufeinander auf, deshalb genügt eine Kette aus drei Agenten; der Redaktionsplaner bekommt die Strategie zusätzlich direkt, damit er die Mischung an den Säulen messen kann. Ein Gedächtnis hat nur der Ideenentwickler, weil wiederholte Ideen das eigentliche Problem monatlicher Läufe sind, während die Strategie jedes Mal frisch aus den aktuellen Zahlen entstehen soll. Bewusst nicht verwendet: eine Live-Websuche nach Trends und eine Anbindung an die Plattformen, denn Trendergebnisse ändern sich täglich und machten Läufe weder reproduzierbar noch übertragbar, und ein Planentwurf soll nicht automatisch gepostet werden; die Strategie stützt sich stattdessen auf deine eigenen Statistiken.

**Anpassen:** Trage dein Profil und deine Kennzahlen ein oder hänge Screenshots deiner Statistiken an. Deinen Markenstil und Tabuthemen ergänzt du im System-Prompt des Ideenentwicklers. Das Gedächtnis „creator-ideas“ findest du unter Memory; leere es, wenn du neu anfangen willst. Für einen monatlichen Plan kannst du die Kopie zeitgesteuert starten.

## 18 · Immobilienangebote vergleichen {#real-estate}
<!-- keywords: immobilienwirtschaft, renditerechner, objekt- und lageanalyst, chancen-risiken-bewertung -->

**Bereich:** Immobilienwirtschaft · **Agenten:** 3 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Bei Immobilien entscheiden Zahlen und Lage gemeinsam. Der Workflow rechnet Rendite und Cashflow nach, analysiert Objekt und Lage und stellt Chancen und Risiken gegenüber.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Renditerechner berechnet Brutto- und Nettomietrendite sowie den monatlichen Cashflow mit dem Rechner-Tool, parallel bewertet der Objekt- und Lageanalyst Zustand, Rücklagen und Umfeld. Die Bewertung führt beides in einem strukturierten Vergleich zusammen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Renditerechner** | Rechnet Rendite, Finanzierung und Cashflow mit dem Rechner-Tool. (Tools: `calculator`) | Angebote |
| **Objekt- und Lageanalyst** | Bewertet Zustand, Rücklagen, Vermietbarkeit und Lage. | Angebote |
| **Chancen-Risiken-Bewertung** | Stellt Zahlen und Objektbewertung gegenüber und vergleicht strukturiert. (strukturierte Ausgabe) | Renditerechner, Objekt- und Lageanalyst |

**Eingabe:** Mindestens zwei Angebote mit Kaufpreis, Fläche, Miete, Hausgeld, Rücklagen und Lage sowie deine Finanzierungsannahmen. Exposés, Protokolle und Grundrisse hängst du als PDF, Word oder Bild an; die Beispieldateien enthalten ein Exposé mit Protokollauszug und einen Grundriss zu Angebot 2.

**Beispieldateien:** `Expose_Angebot_2_Altbau.pdf`, `Grundriss_Angebot_2.png`

**Testfälle:** Zwei Angebote im Text; Mit Exposé und Grundriss

**Ergebnis:** Ein strukturierter Vergleich mit Kennzahlen, bevorzugtem Angebot, Chancen, Risiken und Prüfpunkten vor einer Entscheidung, zusätzlich als PDF. Er ersetzt keine Finanz-, Steuer- oder Rechtsberatung und keine Besichtigung.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Beide Analysen laufen bei jedem Lauf parallel, und der Renditerechner rechnet jede Kennzahl mit dem Rechner-Tool, sodass jede Rechnung im Lauf nachvollziehbar ist. Kein Schritt wartet auf eine Person, und keine Qualitätsprüfung überarbeitet das Ergebnis; du kannst höchstens 8 Dateien anhängen. Weil Immobilienentscheidungen heikel sind, sind alle Agenten angewiesen, die Punkte zu nennen, die eine fachkundige Person prüfen muss, und keine größere Sicherheit zu vermitteln, als die Daten hergeben. Ein eigenes Budget ist nicht gesetzt, es gilt das Standardbudget deines Arbeitsbereichs; der Vergleich ist eine Arbeitshilfe für deine eigene Entscheidung, keine Kaufempfehlung.

**Warum diese Architektur:** Rendite und Lage sind unabhängige Fragen, deshalb laufen sie parallel, und erst die Bewertung wägt sie gegeneinander ab; die feste Struktur (Vergleich, bevorzugtes Angebot, Risiken, Prüfpunkte) macht Angebote von Lauf zu Lauf vergleichbar. Ein Orchestrator brächte nichts, weil jeder Vergleich beide Analysen braucht. Bewusst gibt es keine Live-Websuche nach Angebotspreisen oder Mietniveaus: Die Ergebnisse würden sich von Lauf zu Lauf ändern und wären nicht nachvollziehbar; deine Exposés, Protokolle und ein hinterlegter Mietspiegel halten die Grundlage fest und prüfbar.

**Anpassen:** Trage deine Angebote und Finanzierungsdaten ein und hänge Exposés, Protokolle der Eigentümerversammlung oder Grundrisse direkt an. Einen Mietspiegel, den du immer wieder brauchst, kannst du als Wissen hinterlegen und dem Objekt- und Lageanalysten zuweisen.

## 19 · Bauverzögerungen analysieren {#construction-delay}
<!-- keywords: bauwesen, terminanalyst, bauleitungskoordination, bericht an den bauherrn -->

**Bereich:** Bauwesen · **Agenten:** 3 · **Muster:** adaptiv (Orchestrierung) · **Niveau:** Fortgeschritten · **Bausteine:** Orchestrator mit Teams, Freigabe, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Ausgabevertrag, Budget und Grenzen

Verzögerungen auf der Baustelle haben unterschiedliche Ursachen, und jede Ursache braucht anderes Fachwissen: Frost muss dokumentiert werden, ein säumiger Lieferant braucht eine Behinderungsanzeige an die richtige Stelle, eine vom Bauherrn angeordnete Planänderung kann eine Bauzeitverlängerung begründen, und fehlendes Personal braucht einen Beschleunigungsplan. Der Workflow berechnet die Abweichungen und lässt eine Bauleitungskoordination genau die Fachteams hinzuziehen, die die Lage braucht.

**So arbeiten die Agenten zusammen:** Der Terminanalyst berechnet mit dem Datumswerkzeug den Verzug jedes Meilensteins und listet die vermuteten Ursachen. Die Bauleitungskoordination, ein Orchestrator, stellt zuerst aus den vier Fachteams ein Team von höchstens drei zusammen und verteilt dann Aufträge: das Baustellenteam für Witterung, Baugrund und Planänderungen, das Lieferkettenteam für Lieferanten und Nachunternehmer, das Nachtragsteam für Behinderungsanzeigen und Bauzeitverlängerung, das Beschleunigungsteam für Maßnahmen mit Kosten. Unabhängige Teams arbeiten parallel. Das Nachtragsteam hält für eine Person an: Sein Entwurf der Behinderungsanzeige wird erst verwendet, wenn die verantwortliche Bauleitung ihn abgezeichnet hat. Der Berichtsagent schreibt den Statusbericht, und bevor er an den Bauherrn geht, gibt eine Person ihn frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Terminanalyst** | Berechnet Verzug und kritischen Pfad mit dem Datums- und dem Rechenwerkzeug. (strukturierte Ausgabe; Tools: `days_between`, `calculator`) | Projektstatus |
| **Bauleitungskoordination** | Besetzt die Fachteams, die der Verzug braucht, und verteilt ihre Aufträge. (Orchestrator) | Terminanalyst |
| **Bericht an den Bauherrn** | Fasst Terminlage, Ursachen, Ansprüche und Maßnahmen sachlich für den Bauherrn zusammen. | Terminanalyst, Bauleitungskoordination |

**Teams, die der Orchestrator einsetzen kann:**

| Team | Aufgabe | Fähigkeiten |
|---|---|---|
| **Baustellen- und Planungsteam** | Untersucht technische Ursachen von Bauverzug: Witterung, Baugrund, Planänderungen und Bauablauf; ordnet Verzugstage mit Nachweisen zu. | technical causes, design changes, ground conditions, weather |
| **Lieferkettenteam** | Untersucht Verzug durch Lieferanten, Materiallieferungen und die Besetzung von Nachunternehmern; ordnet Verzugstage mit Nachweisen zu. | supply chain, subcontractors, material delivery |
| **Nachtragsteam** | Entwirft Behinderungsanzeigen und bewertet Ansprüche auf Bauzeitverlängerung für Verzug außerhalb des Bereichs des Auftragnehmers; eine Bauleitung zeichnet den Entwurf ab. (hält für eine Freigabe an) | contract, claims, notice of obstruction |
| **Beschleunigungsteam** | Entwickelt Beschleunigungsmaßnahmen für ein verzögertes Bauprojekt mit gewonnenen Tagen, Mehrkosten und neuer Fertigstellungsprognose. | recovery planning, acceleration, cost estimate |

**Eingabe:** Eine Terminübersicht mit geplanten und tatsächlichen Meilensteinen, Bemerkungen zu Ursachen, Berichtsdatum und Vertragsbedingungen, als Text oder als Dateien: Terminplan als Excel, Bautagebuch als PDF, Fotos als Bilder. Die Beispieldateien enthalten einen Terminplan und einen Auszug aus dem Bautagebuch.

**Beispieldateien:** `Terminplan_Kita_Sonnenblick.xlsx`, `Bautagebuch_Auszug_April_Mai.pdf`

**Testfälle:** Terminübersicht im Text; Terminplan und Bautagebuch als Dateien

**Ergebnis:** Ein sachlicher Statusbericht mit Terminlage, Ursachen und Verantwortungsbereichen, Anzeigen und Verlängerungsansprüchen, Beschleunigungsmaßnahmen mit Kosten, nötigen Entscheidungen und Risiken; nach der Freigabe als PDF und bearbeitbare Word-Datei. Die Orchestrierungsansicht zeigt, welche Teams die Koordination besetzt hat, was jedes als strukturierte Daten geliefert hat und warum. Fragen zu Vertragsstrafen und Bauzeitverlängerung bleiben der fachlichen und rechtlichen Prüfung vorbehalten.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Die Koordination wählt höchstens drei Teams, lässt höchstens zwei gleichzeitig arbeiten und gibt jedem Team höchstens zwei Aufträge; jede Besetzungs- und Auftragsentscheidung wird mit Begründung festgehalten. Eine Person entscheidet zweimal: Die Bauleitung zeichnet im Nachtragsteam den Entwurf der Behinderungsanzeige ab (eine Ablehnung beendet den Lauf), und eine Person gibt den Statusbericht frei, bevor Dateien entstehen. Grenzen: höchstens 8 Entscheidungen der Koordination, 50 Schritte, 40 Minuten und 4 USD pro Lauf.

**Warum diese Architektur:** Eine feste Kette behandelte jeden Verzug gleich: ein Ursachenanalyst, ein Maßnahmenplaner, egal ob das Problem Frost oder eine fehlende Anzeige war. Mit der Koordination kostet ein reiner Witterungsverzug keine Nachtragsprüfung, während eine vom Bauherrn angeordnete Planänderung das Nachtragsteam mit seiner Abzeichnung dazuholt. Die Teams liefern strukturierte Ergebnisse (Tage, Verantwortung, Nachweise), sodass der Bericht sie zusammenrechnen kann, statt Fließtext umzuformulieren. Terminberechnung, Bericht und abschließende Freigabe bleiben feste Schritte, weil jeder Bericht sie braucht.

**Anpassen:** Exportiere deinen Terminplan aus deiner Projektsoftware als Excel und hänge Bautagebuch und Fotos an. Passe das Nachtragsteam an deine Vertragsart an (etwa VOB/B, FIDIC oder eigene Bedingungen) und trage im Beschleunigungsteam die Kostensätze deines Unternehmens ein. Brauchst du eine weitere Fachrichtung, etwa die Haustechnik, speicherst du sie als Workflow mit klarer Beschreibung und fügst sie den Teams der Koordination hinzu.

## 20 · Speisekarte entwickeln und kalkulieren {#restaurant-menu}
<!-- keywords: gastronomie, konzeptentwickler, kalkulation, kartentexter -->

**Bereich:** Gastronomie · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Eine Speisekarte muss Gästen schmecken und sich rechnen. Der Workflow entwickelt Gerichte für eine Zielgruppe, kalkuliert Wareneinsatz und Preise und schreibt appetitliche Kartentexte.

**So arbeiten die Agenten zusammen:** Eine Kette aus drei Agenten: Der Konzeptentwickler stellt Gerichte mit Rezepturen zusammen, die Kalkulation rechnet Wareneinsatz und Verkaufspreise mit dem Rechner-Tool, der Kartentexter schreibt die Karte. Eine Qualitätsprüfung kontrolliert Zielgruppe, Preise und den Hinweis zu Allergenen. Das Ergebnis enthält Kalkulation und Karte.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Konzeptentwickler** | Stellt passende Gerichte mit Rezepturen und Mengen zusammen. | Konzept |
| **Kalkulation** | Rechnet Wareneinsatz und Verkaufspreise mit dem Rechner-Tool. (Tools: `calculator`) | Konzeptentwickler, Konzept |
| **Kartentexter** | Schreibt die Mittagskarte mit appetitlichen Beschreibungen. (mit Qualitätsprüfung) | Kalkulation, Konzeptentwickler |

**Eingabe:** Betriebsart, Zielgruppe, Anzahl und Art der Gerichte, Zielwareneinsatz, Preisrahmen und Einkaufspreise. Die Einkaufspreise kannst du einfügen oder als CSV- bzw. Excel-Datei anhängen, wie die Beispieldatei zeigt.

**Beispieldateien:** `Einkaufspreise_Beispielmuehle.csv`

**Testfälle:** Mittagskarte mit Preisen im Text; Einkaufspreise als CSV

**Ergebnis:** Eine Kalkulationstabelle mit Wareneinsatz und Preis je Gericht und eine fertige Mittagskarte mit kurzen Beschreibungen, zusätzlich als Word-Datei zum Gestalten und als Excel-Datei mit den Kalkulationstabellen. Allergene und Zusatzstoffe müssen anhand der tatsächlichen Rezepturen geprüft und gekennzeichnet werden.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Die drei Schritte laufen immer in derselben Reihenfolge; die Kalkulation rechnet mit dem Rechner-Tool und bekommt deine Einkaufspreise direkt aus der Eingabe, höchstens eine CSV- oder Excel-Datei bis 5 MB. Eine Qualitätsprüfung misst die Karte an drei Kriterien (Zielgruppe, Preise passend zur Kalkulation, Hinweis zu Allergenen); fällt eines durch, überarbeitet der Kartentexter die Karte einmal, und das Prüfergebnis wird mit Begründung im Lauf festgehalten (besteht sie auch dann nicht, läuft der Workflow weiter und die Prüfung gilt als nicht bestanden). Kein Schritt wartet auf eine Person, und ein eigenes Budget ist nicht gesetzt, es gilt das Standardbudget deines Arbeitsbereichs. Karte und Kalkulation sind Entwürfe: Preise, Portionsgrößen und Allergenkennzeichnung prüfst du vor dem Druck.

**Warum diese Architektur:** Jeder Schritt baut auf dem vorigen auf: keine Kalkulation ohne Gerichte, keine Karte ohne Preise, deshalb passt eine feste Kette; die Kalkulation bekommt die Preisliste zusätzlich direkt, damit sie nicht davon abhängt, dass der Konzeptentwickler Zahlen wiederholt. Die Qualitätsprüfung sitzt an der Karte, weil dort Preise von der Kalkulation abweichen können. Bewusst nicht verwendet: ein Orchestrator, weil die Schritte immer dieselben sind, und eine Live-Websuche nach Großhandelspreisen, die von Lauf zu Lauf schwanken und nicht zu deinem Lieferanten passen würden; deine eigene Preisliste macht die Kalkulation reproduzierbar.

**Anpassen:** Hänge deine aktuelle Einkaufspreisliste an und beschreibe deine Zielgruppe. Eure Standardrezepturen lädst du als Wissen hoch und weist sie der Kalkulation zu; Hausregeln wie Portionsgrößen ergänzt du im Konzeptentwickler. Für den Wechsel alle zwei Wochen kannst du die Kopie zeitgesteuert starten.

## 21 · Anbauplanung für einen Betrieb {#farm-planning}
<!-- keywords: landwirtschaft, fruchtfolgeplaner, deckungsbeitragsrechnung, plausibilitätsprüfung -->

**Bereich:** Landwirtschaft · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Die Anbauplanung muss Fruchtfolge, Böden, Verträge und Wirtschaftlichkeit zugleich berücksichtigen. Der Workflow schlägt eine Fruchtfolge vor, rechnet Deckungsbeiträge und prüft den Plan gegen die eigenen Regeln.

**So arbeiten die Agenten zusammen:** Eine Kette aus drei Agenten: Der Fruchtfolgeplaner ordnet jedem Schlag eine Kultur zu, die Deckungsbeitragsrechnung rechnet je Schlag und gesamt mit dem Rechner-Tool, und die Plausibilitätsprüfung kontrolliert Regeln und Risiken und liefert ein strukturiertes Ergebnis.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Fruchtfolgeplaner** | Ordnet jedem Schlag eine Kultur nach Regeln und Boden zu. | Betriebsdaten |
| **Deckungsbeitragsrechnung** | Rechnet Deckungsbeiträge je Schlag und gesamt mit dem Rechner-Tool. (Tools: `calculator`) | Fruchtfolgeplaner, Betriebsdaten |
| **Plausibilitätsprüfung** | Prüft den Plan gegen Regeln und Risiken und fasst zusammen. (strukturierte Ausgabe) | Fruchtfolgeplaner, Deckungsbeitragsrechnung |

**Eingabe:** Schläge mit Größe, Boden und Vorfrucht, eure Planungsregeln und Annahmen zu Erlösen und Kosten je Hektar. Schläge und Annahmen kannst du als Excel- oder CSV-Datei anhängen; die Beispieldatei enthält beide Tabellen der Testaufgabe.

**Beispieldateien:** `Schlagkartei_Beispielhof.xlsx`

**Testfälle:** Betrieb im Text; Schlagkartei als Excel-Datei

**Ergebnis:** Ein Anbauplan je Schlag mit Deckungsbeitrag, eine Regelprüfung, Risiken und offene Fragen, zusätzlich als Excel-Datei. Rechtliche Vorgaben, etwa zu Düngung oder Förderbedingungen, müssen anhand der aktuellen Regeln vor Ort geprüft werden.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Die drei Schritte laufen immer in derselben Reihenfolge; die Deckungsbeitragsrechnung rechnet jeden Schlag und die Summe mit dem Rechner-Tool, sodass die Zahlen im Lauf nachvollziehbar sind. Es gibt keine automatische Überarbeitung: Die Plausibilitätsprüfung ändert den Plan nicht, sondern listet Regelprüfung, Risiken und offene Fragen in einem strukturierten Ergebnis mit dem Gesamtdeckungsbeitrag als Zahl. Kein Schritt wartet auf eine Person; du kannst bis zu 3 Dateien mit je 10 MB anhängen, und ein eigenes Budget ist nicht gesetzt, es gilt das Standardbudget deines Arbeitsbereichs. Der Plan ist ein Entwurf, den du vor Saatgutbestellung oder Förderantrag an den aktuellen Regeln vor Ort prüfst.

**Warum diese Architektur:** Zuerst steht die Kulturwahl, die Deckungsbeiträge hängen von ihr ab, und die Prüfung braucht beides, deshalb passt eine feste Kette; die Plausibilitätsprüfung bekommt die Fruchtfolge zusätzlich direkt, um sie an deinen Regeln zu messen. Bewusst gibt es einen eigenen Prüfschritt, der Verstöße offen benennt, statt einer Qualitätsschleife, die den Plan stillschweigend umschreiben würde, denn Abweichungen in der Fruchtfolge sind Abwägungen, die du triffst. Keine Live-Websuche nach Preisen oder Vorgaben und kein Orchestrator: Online gefundene Preise und Auflagen ändern sich täglich und unterscheiden sich je Region, deine eigenen Annahmen halten die Rechnung reproduzierbar, und die Schritte sind für jeden Betrieb dieselben.

**Anpassen:** Hänge deine Schlagkartei und Kalkulationsdaten als Excel an und trage deine Planungsregeln ein. Bodenproben, die du jedes Jahr brauchst, lädst du als Wissen hoch und weist sie dem Fruchtfolgeplaner zu.

## 22 · Vereinsfest planen {#club-event}
<!-- keywords: vereine, ablaufplaner, budgetplaner, kommunikationsplaner, vorstandsvorlage -->

**Bereich:** Vereine · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Einsteiger · **Bausteine:** Ergebnisdateien

Vereinsfeste werden von Ehrenamtlichen in ihrer Freizeit organisiert. Der Workflow erstellt Zeitplan, Aufgaben, Budget und Kommunikation und fasst alles in einer Vorlage für die Vorstandssitzung zusammen.

**So arbeiten die Agenten zusammen:** Ablaufplaner und Budgetplaner arbeiten parallel; der eine rechnet mit dem Datums-Tool rückwärts vom Festtag, der andere rechnet das Budget mit dem Rechner-Tool. Der Kommunikationsplaner bereitet Einladungen und Beiträge passend zum Zeitplan vor. Die Vorstandsvorlage führt alles zusammen; eine Qualitätsprüfung achtet auf Vollständigkeit und Zuständigkeiten.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Ablaufplaner** | Plant Zeitplan, Aufgaben und Schichten rückwärts vom Festtag. (Tools: `days_between`) | Eckdaten |
| **Budgetplaner** | Rechnet Einnahmen, Ausgaben und Puffer mit dem Rechner-Tool. (Tools: `calculator`) | Eckdaten |
| **Kommunikationsplaner** | Bereitet Einladungen, Beiträge und eine Pressemitteilung vor. | Ablaufplaner |
| **Vorstandsvorlage** | Fasst Planung, Budget und Kommunikation für den Vorstand zusammen. (mit Qualitätsprüfung) | Ablaufplaner, Budgetplaner, Kommunikationsplaner |

**Eingabe:** Anlass, Datum, Ort, Gästezahl, Programmwünsche, Helfende, Budget und bekannte Kosten.

**Testfälle:** Sommerfest zum Vereinsjubiläum

**Ergebnis:** Eine Vorstandsvorlage mit Zeitplan bis zum Fest, Aufgaben und Zuständigkeiten, Schichtplan, Budget mit Überschuss oder Fehlbetrag, Kommunikationsplan und Beschlussvorschlägen, zusätzlich als Word-Datei zum Verschicken an den Vorstand.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Ablauf und Budget entstehen parallel, der Ablaufplaner rechnet mit dem Datums-Tool vom Festtag zurück, der Budgetplaner rechnet mit dem Rechner-Tool. Eine Qualitätsprüfung misst die Vorstandsvorlage an Vollständigkeit, Zuständigkeiten und Übereinstimmung mit dem Budget; fällt ein Kriterium durch, wird die Vorlage einmal überarbeitet, und das Prüfergebnis wird mit Begründung im Lauf festgehalten (besteht sie auch dann nicht, läuft der Workflow weiter und die Prüfung gilt als nicht bestanden). Kein Schritt wartet auf eine Person, und nichts wird verschickt; ein eigenes Budget ist nicht gesetzt, es gilt das Standardbudget deines Arbeitsbereichs. Die Vorlage ist ein Entwurf, über dessen Beschlussvorschläge der Vorstand entscheidet.

**Warum diese Architektur:** Ablauf und Budget hängen nicht voneinander ab und laufen parallel, der Kommunikationsplaner braucht den Zeitplan und folgt deshalb danach; die Vorstandsvorlage führt alles zusammen. Eine Freigabe im Workflow gibt es bewusst nicht, weil die eigentliche Freigabe die Vorstandssitzung selbst ist, und keine E-Mail- oder Kalenderanbindung, weil Ehrenamtliche Einladungen erst nach dem Beschluss selbst verschicken. Ein Orchestrator brächte nichts, weil jedes Fest dieselben vier Teile braucht.

**Anpassen:** Trage die Eckdaten deines Festes ein. Genehmigungen und Auflagen unterscheiden sich je nach Gemeinde; ergänze bekannte Vorgaben in der Eingabe. Logos und Vorlagen für Plakate können als Wissen hinterlegt werden.

## 23 · Spendenkampagne entwickeln {#nonprofit-campaign}
<!-- keywords: gemeinnützige organisationen, kampagnenentwickler, wirkungsanalyst, glaubwürdigkeitsprüfer -->

**Bereich:** Gemeinnützige Organisationen · **Agenten:** 3 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Überarbeitungsschleife, Ergebnisdateien, Wissensvorschläge

Spendenkampagnen brauchen eine bewegende Geschichte, aber auch ehrliche Aussagen zur Wirkung. Der Workflow entwickelt eine Kampagne, bewertet die mögliche Wirkung und prüft, ob Versprechen glaubwürdig und ethisch vertretbar sind.

**So arbeiten die Agenten zusammen:** Kampagnenentwickler und Wirkungsanalyst arbeiten parallel: Der eine entwirft Botschaft, Zielgruppen und Maßnahmen, der andere erstellt ein Wirkungsmodell mit Indikatoren und rechnet Kosten pro Kind mit dem Rechner-Tool. Der Glaubwürdigkeitsprüfer kontrolliert beides. Hält er die Kampagne nicht für glaubwürdig, schickt eine Bedingung sie mit seinen Hinweisen an den Kampagnenentwickler zurück; die überarbeitete Kampagne wird erneut geprüft, höchstens zweimal. Das Ergebnis enthält alle drei Teile.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Kampagnenentwickler** | Entwirft Botschaft, Zielgruppen, Kanäle und Zeitplan der Kampagne. | Projektbeschreibung |
| **Wirkungsanalyst** | Erstellt ein Wirkungsmodell mit Indikatoren und Kosten pro Kind. (Tools: `calculator`) | Projektbeschreibung |
| **Glaubwürdigkeitsprüfer** | Prüft Aussagen auf Übertreibung, Ethik und Belegbarkeit. (strukturierte Ausgabe) | Kampagnenentwickler, Wirkungsanalyst |

**Eingabe:** Organisation, Projekt, bisherige Ergebnisse, Ziel, Finanzbedarf, Kampagnenzeitraum und vorhandene Kanäle.

**Testfälle:** Lesepaten an Grundschulen

**Ergebnis:** Ein Kampagnenkonzept mit Zeitplan und Textentwürfen, ein Wirkungsmodell mit Indikatoren und eine strukturierte Prüfung auf übertriebene Aussagen, ethische Hinweise und einen Plan zur Wirkungsmessung, zusätzlich als Word-Datei. Der Wirkungsanalyst schlägt sein Wirkungsmodell für das Wissen vor, etwa für spätere Förderanträge; gespeichert wird nur, was du bestätigst.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: Das Ja/Nein-Urteil des Glaubwürdigkeitsprüfers zur Glaubwürdigkeit entscheidet, ob die Kampagne zur Überarbeitung zurückgeht; der Lauf zeigt, welcher Zweig genommen wurde. Der Kampagnenentwickler überarbeitet höchstens zweimal, jeweils mit den Hinweisen der Prüfung und seinem vorherigen Entwurf. Gilt die Kampagne danach immer noch nicht als glaubwürdig, läuft der Workflow trotzdem zum Ergebnis weiter, und die Hinweise der Prüfung zeigen, was noch offen ist. Kein Schritt wartet auf eine Person: Texte und Zahlen sind Entwürfe, die deine Organisation vor der Veröffentlichung prüft, besonders Aussagen zur Wirkung und Fotos von Kindern. Vorgeschlagene Wirkungsmodelle werden nur ins Wissen übernommen, wenn du sie bestätigst.

**Warum diese Architektur:** Glaubwürdigkeitsprobleme behebt am besten, wer den Text geschrieben hat; deshalb führt die Prüfung zum Kampagnenentwickler zurück, statt Probleme nur aufzulisten. Die Schleife ist auf zwei Runden begrenzt: Eine Kampagne, die danach noch übertreibt, braucht bessere Belege der Organisation, keine weiteren Umformulierungen. Das Wirkungsmodell bleibt außerhalb der Schleife, weil es auf den Projektdaten beruht, nicht auf den Kampagnentexten. Eine Freigabe ist nicht eingebaut, weil die Kampagne ein Entwurf bleibt und ohnehin außerhalb des Workflows veröffentlicht wird.

**Anpassen:** Beschreibe dein Projekt und deine bisherigen Ergebnisse so ehrlich wie möglich. Jahresberichte oder Evaluationen lädst du als Wissen hoch und weist sie dem Wirkungsanalysten zu.

## 24 · Bürgeranfrage beantworten {#citizen-inquiry}
<!-- keywords: öffentliche einrichtungen, anliegenanalyse, informationsaufbereitung, antwortentwurf -->

**Bereich:** Öffentliche Einrichtungen · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Freigabe, Überarbeitungsschleife, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge, Wissensdateien

Bürgeranfragen enthalten oft mehrere Anliegen und müssen korrekt, verständlich und ohne vorschnelle Zusagen beantwortet werden. Der Workflow zerlegt die Anfrage, findet die einschlägigen Regeln der Gemeinde, bereitet eine Antwort vor und überlässt die Entscheidung über den Versand der Sachbearbeitung.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Eine Kette aus drei Agenten und einer Freigabe: Die Anliegenanalyse trennt die Anliegen und ordnet Zuständigkeiten zu. Die Informationsaufbereitung durchsucht die hinterlegten Regeln der Gemeinde und die Unterlagen der Anfrage, zitiert die verwendeten Stellen und sagt, wenn keine Regel ein Anliegen abdeckt. Der Antwortentwurf formuliert eine bürgernahe Antwort; eine Qualitätsprüfung kontrolliert, dass nur belegte Regeln genannt und keine verbindlichen Zusagen gemacht werden. Danach prüft die Sachbearbeitung die Antwort; eine Ablehnung mit Kommentar schickt sie zur Überarbeitung an den Antwortentwurf zurück.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Anliegenanalyse** | Trennt die Anliegen und ordnet Zuständigkeiten und Dringlichkeit zu. | Bürgeranfrage |
| **Informationsaufbereitung** | Durchsucht die Regeln der Gemeinde und zitiert je Anliegen die einschlägigen Stellen. | Anliegenanalyse, Bürgeranfrage |
| **Antwortentwurf** | Formuliert eine sachliche, bürgernahe Antwort zur Freigabe. (mit Qualitätsprüfung) | Anliegenanalyse, Informationsaufbereitung |

**Eingabe:** Die Anfrage der Bürgerin oder des Bürgers, optional mit internen Informationen zum Fall, als Text oder als Dateien. Auch Fotos aus der Anfrage kannst du anhängen. Die Regeln der Gemeinde kommen aus der Wissenssammlung; ein erfundenes Regelwerk der Gemeinde Musterstadt ist dabei. Die Beispieldatei ist ein erfundenes Merkblatt der Gemeinde.

**Beispieldateien:** `Merkblatt_Nebengebaeude_und_Beleuchtung.pdf`

**Testfälle:** Gartenhaus und Straßenlaterne; Regeln als Merkblatt-Datei

**Ergebnis:** Ein Antwortentwurf in einfacher Sprache mit Zuständigkeiten, nächsten Schritten und Hinweisen für die Sachbearbeitung; nach der Freigabe zusätzlich als Word-Datei für euren Briefkopf. Die Word-Datei ist bereinigt: Personenbezogene Daten wie Namen, Adressen, Telefonnummern und E-Mail-Adressen sowie Zugangsdaten sind durch Platzhalter ersetzt; die Empfängerangaben setzt du selbst aus der Akte ein. Die Informationsaufbereitung schlägt die gefundenen Regeln mit Fundstelle für das Wissen vor; gespeichert wird nur, was du bestätigst.

**Was automatisch entschieden wird und wann ein Mensch eingreift:** Automatisch: die Anliegenanalyse, die Regelsuche mit Zitaten und die Qualitätsprüfung des Entwurfs (nur belegte Regeln, einfache Sprache, keine verbindliche Zusage). Ein Mensch entscheidet: Die Sachbearbeitung prüft jede Antwort vor dem Versand. Eine Ablehnung verlangt einen Kommentar und schickt den Entwurf mit dieser Rückmeldung an den Antwortentwurf zurück; nach höchstens 2 Überarbeitungen lässt eine weitere Ablehnung den Lauf ohne Datei scheitern. Der Workflow verschickt selbst nichts; auch die freigegebene Antwort ist ein Entwurf, den die Sachbearbeitung über die üblichen Wege versendet.

**Warum diese Architektur:** Jede Anfrage braucht dieselben Schritte, deshalb genügt eine feste Kette, und ein Orchestrator würde nur Kosten verursachen. Die Regeln sind durchsuchbares Wissen statt Text, der jeder Anfrage beigelegt wird: Die Informationsaufbereitung findet die passenden Stellen, zitiert sie und merkt, wenn nichts passt. Die Freigabe mit Überarbeitungsschleife gibt es, weil eine Antwort an Bürgerinnen und Bürger nach außen wirkt und die Sachbearbeitung den Fall am besten kennt. Eine Anbindung an das Mailsystem wurde bewusst weggelassen, damit der Versand eine menschliche Entscheidung bleibt.

**Wissensdateien (synthetisch, werden beim Kopieren angelegt):** Regeln_Gemeinde_Musterstadt: Erfundene Regeln der Gemeinde Musterstadt zu Nebengebäuden, Bebauungsplan Nr. 17, Straßenbeleuchtung, Sperrmüll, Bäumen und zur Bearbeitung von Anfragen.

**Anpassen:** Ersetze die erfundenen Regeln in der Wissenssammlung durch eure Satzungen, Merkblätter und Zuständigkeitslisten; klare Überschriften und Nummern machen die Zitate genau. Briefkopf und Grußformel ergänzt du im System-Prompt des Antwortentwurfs. Viele Anfragen auf einmal bearbeitest du mit der Stapelverarbeitung.

<!-- examples:end -->

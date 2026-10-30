# Beispiel-Workflows

Nodestro bringt 24 fertige Multi-Agenten-Workflows mit, einen für jedes typische Anwendungsfeld. Jedes Beispiel enthält Agenten mit System-Prompts, die Verbindungen, eine vorbereitete Testaufgabe mit erfundenen Daten und ein klar beschriebenes Ergebnis. Dieses Kapitel erklärt die Galerie, das Übernehmen und Anpassen und beschreibt jedes Beispiel einzeln.

## Die Galerie {#galerie}
<!-- keywords: beispiele, vorlagen, galerie, bibliothek, empfohlen, kategorien, startseite -->

Die Galerie steht auf der Seite **Workflows** unter deinen eigenen Workflows, klar davon getrennt. Sie zeigt einige empfohlene Beispiele und die sechs Kategorien. **Alle 24 Beispiele ansehen** öffnet die vollständige Galerie, ebenfalls im Bereich Workflows.

In der vollständigen Galerie suchst du nach Name, Fachgebiet und Beschreibung und filterst nach Kategorie. Jede Karte zeigt Fachgebiet, Name, Beschreibung, die Zahl der Agenten, das Niveau und das Muster. Beispiele aus sensiblen Bereichen tragen das Abzeichen **Fachlich prüfen**. Auch die [Suche](/docs/start#suche) findet Beispiele.

## Vorschau und Übernehmen {#uebernehmen}
<!-- keywords: vorschau, übernehmen, kopie, kopieren, vorlage, unverändert, kostenlos -->

Ein Klick auf eine Karte öffnet die **Vorschau**: den Ablauf als Grafik, jeden Agenten mit Rolle, Modell, Tools und den Ergebnissen, die er bekommt, die Anleitung und die Testaufgabe. Die Vorschau speichert nichts und ruft kein Modell auf.

**Als Kopie übernehmen** legt einen eigenen Workflow an und öffnet ihn im Editor. Die Kopie ist unabhängig: Du kannst alles ändern, und die Vorlage bleibt immer unverändert. Übernimmst du ein Beispiel zweimal, entstehen zwei getrennte Workflows. Die Kopie beginnt mit Version 1 im [Versionsverlauf](/docs/workflows#versionen).

Ist **Testfälle als Testreihe übernehmen** angehakt (vorbelegt), bekommt die Kopie zusätzlich eine [Testreihe](/docs/automatisierung#testreihen) mit den vorbereiteten Testfällen; die nötigen Beispieldateien werden dabei als Eingabedateien der Kopie gespeichert. Übernehmen startet nie einen Lauf, legt keinen [Zeitplan](/docs/automatisierung#zeitplaene) an und veröffentlicht keine [API](/docs/api-und-export#veroeffentlichen); das entscheidest du später selbst.

Beispiele werden nie automatisch angelegt; nur was du übernimmst, erscheint unter deinen Workflows. Kosten entstehen erst, wenn du eine Kopie ausführst. Die Beispiele nutzen Modelle von Anthropic; dafür genügt dieser [eingerichtete Anbieter](/docs/einstellungen#anbieter), und du kannst die Modelle einer Kopie jederzeit auf einen anderen Anbieter umstellen. Kein Beispiel braucht weitere Dienste, Konten oder bezahlte Datenquellen.

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
- **Aktuelle Daten:** Für Live-Informationen kannst du das [Server-Tool](/docs/tools#server-tools) Websuche ergänzen; es kostet pro Suche extra.

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
| 6 | Blogartikel | Marketing und Content | 4 | parallel |
| 7 | Individuelles Angebot vorbereiten | Vertrieb | 3 | sequenziell |
| 8 | Kundenanfragen beantworten | Kundenservice | 5 | verzweigt |
| 9 | Stelle ausschreiben und Interviews vorbereiten | Personalwesen | 5 | verzweigt |
| 10 | Forschungsfrage in Hypothesen übersetzen | Forschung und Entwicklung | 4 | sequenziell |
| 11 | Code-Review mit Tests | Softwareentwicklung | 3 | parallel |
| 12 | Vertrag strukturieren und Prüfpunkte finden | Recht und Verwaltung | 5 | verzweigt |
| 13 | Persönlichen Lernplan erstellen | Bildung und Weiterbildung | 4 | parallel |
| 14 | Haushaltsbudget prüfen und sparen | Privatpersonen – Finanzen | 3 | sequenziell |
| 15 | Individuelle Reise planen | Privatpersonen – Reisen | 4 | verzweigt |
| 16 | Geschäftsidee bewerten | Selbstständige und Gründer | 4 | parallel |
| 17 | Social-Media-Strategie entwickeln | Influencer und Content Creator | 3 | sequenziell |
| 18 | Immobilienangebote vergleichen | Immobilienwirtschaft | 3 | parallel |
| 19 | Bauverzögerungen analysieren | Bauwesen | 4 | parallel |
| 20 | Speisekarte entwickeln und kalkulieren | Gastronomie | 3 | sequenziell |
| 21 | Anbauplanung für einen Betrieb | Landwirtschaft | 3 | sequenziell |
| 22 | Vereinsfest planen | Vereine | 4 | parallel |
| 23 | Spendenkampagne entwickeln | Gemeinnützige Organisationen | 3 | parallel |
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

**Anpassen:** Lege einen Export aus deinem MES oder deiner Tabellenkalkulation in das Dateifeld; auch lange Protokolle funktionieren, weil die Agenten große Dateien gezielt lesen. Für eine wöchentliche Auswertung kannst du die Kopie zeitgesteuert starten. Im System-Prompt des Maßnahmenplaners kannst du eure Methodik ergänzen, zum Beispiel TPM-Säulen oder ein festes Bewertungsschema.

## 2 · Reklamation mit 8D untersuchen {#quality-8d}
<!-- keywords: qualitätsmanagement, problembeschreibung d1–d3, ursachenanalyse d4, maßnahmenplanung d5–d7, 8d-bericht, notfall-eindämmung -->

**Bereich:** Qualitätsmanagement · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Freigabe, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge

Reklamationen verlangen schnelle Sofortmaßnahmen und eine saubere Ursachenklärung. Die 8D-Methode gibt die Schritte vor; der Workflow arbeitet sie strukturiert ab und dokumentiert sie einheitlich.

**So arbeiten die Agenten zusammen:** Eine sequenzielle Kette: Der erste Agent beschreibt das Problem und die Sofortmaßnahmen (D1 bis D3), der zweite sucht die Ursachen für Entstehung und Nichtentdeckung (D4), der dritte plant Abstell- und Vorbeugemaßnahmen (D5 bis D7). Der Berichtsagent fasst alles in einem strukturierten 8D-Bericht zusammen. Ein Entscheidungsknoten prüft den Schweregrad: In kritischen Fällen plant ein zusätzlicher Agent die Notfall-Eindämmung für die nächsten 24 Stunden. Bevor der Bericht an den Kunden geht, gibt ihn ein Mensch frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Problembeschreibung D1–D3** | Beschreibt Team, Problem (Ist/Ist-nicht) und Sofortmaßnahmen. (strukturierte Ausgabe) | Reklamation |
| **Ursachenanalyse D4** | Sucht Ursachen für Entstehung und Nichtentdeckung mit 5-Why. | Problembeschreibung D1–D3, Reklamation |
| **Maßnahmenplanung D5–D7** | Plant Abstellmaßnahmen, ihre Verifizierung und die Vorbeugung. | Ursachenanalyse D4 |
| **8D-Bericht** | Fasst alle Schritte in einem strukturierten 8D-Bericht zusammen. (strukturierte Ausgabe) | Problembeschreibung D1–D3, Ursachenanalyse D4, Maßnahmenplanung D5–D7, Notfall-Eindämmung |
| **Notfall-Eindämmung** | Plant bei kritischen Fällen die Eindämmung für die nächsten 24 Stunden. | Schweregrad |

**Eingabe:** Die Reklamation des Kunden mit Teil, Charge, Fehlerbild und Fehlerquote sowie bekannte interne Informationen zu Fertigung, Material und Prüfung. Reklamationsschreiben, Messdaten und Fotos des Fehlerbilds kannst du zusätzlich als Dateien anhängen; die Beispieldateien enthalten ein erfundenes Reklamationsschreiben (PDF) und Messwerte (Excel).

**Beispieldateien:** `Reklamation_G-220_Charge_24-117.pdf`, `Messwerte_Rastnasen.xlsx`

**Testfälle:** Reklamation im Text; Reklamationsschreiben und Messwerte als Dateien

**Ergebnis:** Ein strukturierter 8D-Bericht mit je einem Feld für D1 bis D8 und einer Liste offener Punkte, die das Team noch klären muss. Nach der Freigabe speichert der Lauf den Bericht als PDF und als bearbeitbare Word-Datei. Der Berichtsagent schlägt außerdem Erkenntnisse für das Wissen vor; gespeichert wird nur, was du ausdrücklich übernimmst.

**Anpassen:** Ersetze die Testdaten durch eure Reklamation und hänge Prüfprotokolle, Zeichnungen oder Fotos direkt an. Wenn ihr ein eigenes Formular nutzt, passe die Felder des Berichtsagenten unter „Ausgabeformat“ an. Übernommene Erkenntnisse aus früheren Reklamationen kannst du dem Ursachenanalysten als Wissen zuweisen.

## 3 · Lieferantenangebote vergleichen {#supplier-comparison}
<!-- keywords: logistik und einkauf, kostenanalyst, risikoanalyst, einkaufsempfehlung -->

**Bereich:** Logistik und Einkauf · **Agenten:** 3 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Der günstigste Stückpreis ist selten das günstigste Angebot. Der Workflow vergleicht Angebote nach Gesamtkosten und Lieferrisiko und begründet eine Empfehlung für den Einkauf.

**So arbeiten die Agenten zusammen:** Kostenanalyst und Risikoanalyst arbeiten parallel. Der eine rechnet mit dem Rechner-Tool die Gesamtkosten (Total Cost of Ownership) je Angebot, der andere bewertet Lieferzeit, Abhängigkeiten und Qualität. Die Einkaufsempfehlung wägt beides ab und liefert ein strukturiertes Ergebnis.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Kostenanalyst** | Rechnet die Gesamtkosten je Angebot mit dem Rechner-Tool. (Tools: `calculator`) | Angebote |
| **Risikoanalyst** | Bewertet Lieferzeit, Abhängigkeiten, Kapazität und Qualitätsrisiken. | Angebote |
| **Einkaufsempfehlung** | Wägt Kosten und Risiken ab und empfiehlt einen Lieferanten. (strukturierte Ausgabe) | Kostenanalyst, Risikoanalyst |

**Eingabe:** Mehrere Angebote mit Preis, Fracht, Lieferzeit, Mindestmenge, Zahlungsbedingungen und Qualitätsdaten sowie eure internen Kostensätze. Die Angebote kannst du in den Text schreiben oder als Dateien anhängen, auch gemischt als PDF, Word und Excel; die drei Beispieldateien zeigen genau das.

**Beispieldateien:** `Angebot_A_Beispiel_Praezision.pdf`, `Angebot_B_Example_Components.docx`, `Angebot_C_Muster_Metallteile.xlsx`

**Testfälle:** Drei Angebote im Text; Drei Angebote als PDF, Word und Excel

**Ergebnis:** Eine strukturierte Empfehlung mit Rangfolge, Begründungen, Risiken, Verhandlungspunkten und den getroffenen Annahmen. Der Lauf speichert sie zusätzlich als PDF-Bericht und als Excel-Datei mit je einem Blatt pro Liste.

**Anpassen:** Hänge eure Angebote als Dateien an und trage Bedarf und Kostensätze in den Text ein. Wenn ihr feste Gewichtungen habt (zum Beispiel 50 % Kosten, 30 % Risiko, 20 % Qualität), ergänze sie im System-Prompt der Einkaufsempfehlung. Rahmenverträge oder Lieferantenbewertungen kannst du als Wissen hinterlegen und dem Risikoanalysten zuweisen.

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

**Anpassen:** Hänge den Geschäftsbericht oder eure Kennzahlentabelle direkt an. Weitere Kennzahlen, etwa Verschuldungsgrad oder Free Cashflow, ergänzt du im System-Prompt des Analyse-Agenten. Für viele Unternehmen nacheinander eignet sich die Stapelverarbeitung mit einer Zeile je Unternehmen.

## 6 · Blogartikel {#blog-article}
<!-- keywords: marketing und content, zielgruppe, gliederung, autor, lektorat -->

**Bereich:** Marketing und Content · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Einsteiger · **Bausteine:** Ergebnisdateien

Gute Artikel entstehen aus einer klaren Zielgruppe und einer durchdachten Gliederung. Der Workflow teilt die Arbeit wie in einer Redaktion auf und prüft das Ergebnis, bevor es veröffentlicht wird.

**So arbeiten die Agenten zusammen:** Zielgruppe und Gliederung entstehen parallel mit einem schnellen Modell. Der Autor schreibt daraus den Artikel; eine eingebaute Qualitätsprüfung kontrolliert, ob er der Gliederung folgt und die Fragen der Leser beantwortet. Das Lektorat prüft Länge und Lesbarkeit mit dem Textstatistik-Tool und kennzeichnet ungeprüfte Behauptungen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Zielgruppe** | Beschreibt Leser, ihre Fragen und ihren Wissensstand. | Thema |
| **Gliederung** | Entwirft Titel und Gliederung. | Thema |
| **Autor** | Schreibt den Artikel aus Gliederung und Zielgruppe. (mit Qualitätsprüfung) | Zielgruppe, Gliederung |
| **Lektorat** | Prüft Länge und Lesbarkeit und liefert die Endfassung. (Tools: `text_statistics`) | Autor |

**Eingabe:** Ein Thema in einem Satz. Optional ergänzt du Zielgruppe, Tonalität oder gewünschte Länge direkt in der Eingabe.

**Testfälle:** Thema in einem Satz

**Ergebnis:** Ein fertiger Artikel in Markdown mit Überschriften, eine Meta-Beschreibung und kurze Lektoratsnotizen mit Wortzahl und Hinweisen auf Aussagen, die vor der Veröffentlichung belegt werden sollten. Der Lauf speichert das Ergebnis zusätzlich als Markdown- und HTML-Datei, die du in dein CMS übernehmen kannst.

**Anpassen:** Ändere das Thema in der Eingabe. Euren Styleguide kannst du als Wissen hochladen und Autor und Lektorat zuweisen. Die gewünschte Länge stellst du im System-Prompt des Autors ein.

## 7 · Individuelles Angebot vorbereiten {#sales-offer}
<!-- keywords: vertrieb, bedarfsanalyst, lösungsberater, angebotsautor -->

**Bereich:** Vertrieb · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Fortgeschritten · **Bausteine:** Freigabe, Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Ein gutes Angebot beantwortet den tatsächlichen Bedarf des Kunden, nicht nur seine Stichworte. Der Workflow klärt den Bedarf, kalkuliert eine passende Lösung und entwirft ein vollständiges Angebot.

**So arbeiten die Agenten zusammen:** Der Bedarfsanalyst trennt ausdrückliche und unausgesprochene Anforderungen und sammelt offene Fragen. Der Lösungsberater stellt Positionen aus der Preisliste zusammen und rechnet mit dem Rechner-Tool, auch eine Variante innerhalb des Budgets. Der Angebotsautor schreibt das Angebot; eine eingebaute Qualitätsprüfung kontrolliert Vollständigkeit und Preise. Ein Eingabeformular nimmt die Eckdaten auf (Kunde, Termin, Budget, Montage am Wochenende); vor dem Versand gibt ein Mensch das Angebot frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Bedarfsanalyst** | Arbeitet ausdrückliche und unausgesprochene Anforderungen heraus. | Kundenanfrage |
| **Lösungsberater** | Stellt passende Positionen zusammen und kalkuliert mit dem Rechner-Tool. (Tools: `calculator`) | Bedarfsanalyst, Kundenanfrage |
| **Angebotsautor** | Schreibt den Angebotsentwurf für den Kunden. (mit Qualitätsprüfung) | Bedarfsanalyst, Lösungsberater |

**Eingabe:** Die Anfrage des Kunden und eure Preisliste mit Rabatten und Konditionen. Das Formular nimmt die Eckdaten auf; die Preisliste kannst du in den Text schreiben oder als Excel-, CSV- oder PDF-Datei anhängen, wie die Beispieldatei zeigt.

**Beispieldateien:** `Preisliste_Bueroausstattung.xlsx`

**Testfälle:** Anfrage und Preisliste im Text; Preisliste als Excel-Datei

**Ergebnis:** Ein Angebotsentwurf mit Anschreiben, Positionstabelle, Summen, Varianten, Annahmen und offenen Fragen. Erst nach deiner Freigabe speichert der Lauf das Angebot als PDF und als bearbeitbare Word-Datei.

**Anpassen:** Hänge deine aktuelle Preisliste als Datei an, dann genügt als Text die Kundenanfrage. Zahlungsbedingungen und Textbausteine ergänzt du im System-Prompt des Angebotsautors.

## 8 · Kundenanfragen beantworten {#customer-service}
<!-- keywords: kundenservice, klassifizierer, richtlinienprüfer, antwortverfasser, deeskalation, überarbeitung -->

**Bereich:** Kundenservice · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Einsteiger · **Bausteine:** Entscheidung, Freigabe, Eingabeformular, Dateien als Eingabe

Im Kundenservice kommen viele Anfragen gleichzeitig an, und jede braucht die richtige Regel und den richtigen Ton. Der Workflow sortiert die Anfragen, prüft Richtlinien und Fristen und bereitet Antworten zur Freigabe vor.

**So arbeiten die Agenten zusammen:** Ein schneller Klassifizierer ordnet jede Anfrage nach Thema, Dringlichkeit und Stimmung. Der Richtlinienprüfer wendet die Servicerichtlinien an und rechnet Fristen mit dem Datums-Tool nach. Der Antwortverfasser schreibt die Entwürfe; eine Qualitätsprüfung kontrolliert, dass nichts über die Richtlinien hinaus zugesagt wird. Ein Entscheidungsknoten schickt Eskalationen zuerst an einen Deeskalations-Agenten. Jeder Entwurf wartet auf eine Freigabe; eine Ablehnung mit Rückmeldung führt zu einer überarbeiteten Fassung.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Klassifizierer** | Ordnet jede Anfrage nach Thema, Dringlichkeit und Stimmung ein. (strukturierte Ausgabe) | Anfragen |
| **Richtlinienprüfer** | Wendet die Servicerichtlinien an und prüft Fristen mit dem Datums-Tool. (Tools: `days_between`) | Klassifizierer, Anfragen |
| **Antwortverfasser** | Schreibt freundliche Antwortentwürfe zur Freigabe. (mit Qualitätsprüfung) | Klassifizierer, Richtlinienprüfer, Deeskalation |
| **Deeskalation** | Bereitet den Umgang mit verärgerten Kunden vor und klärt, was eine Freigabe braucht. | Eskalation? |
| **Überarbeitung** | Überarbeitet die Entwürfe nach der Rückmeldung der Freigabe. | Antworten freigeben |

**Eingabe:** Mehrere Kundenanfragen mit Bestell- und Lieferdaten, das heutige Datum und eure Servicerichtlinien, als Auszug im Text oder als Datei (PDF, Word, Markdown); die Beispieldatei enthält ausführlichere Richtlinien.

**Beispieldateien:** `Servicerichtlinien_Musterkueche.pdf`

**Testfälle:** Vier Anfragen, eine verärgert; Eine freundliche Produktfrage; Richtlinien als PDF-Datei

**Ergebnis:** Für jede Anfrage eine Einordnung, die anzuwendende Regel mit Fristprüfung und ein Antwortentwurf, der vor dem Versand von einem Menschen freigegeben wird.

**Anpassen:** Hänge eure vollständigen Richtlinien und FAQ als Datei an oder lade sie als Wissen hoch und weise sie dem Richtlinienprüfer zu, wenn sie dauerhaft gelten. Den Ton eurer Marke (Du oder Sie, Grußformel) legst du im System-Prompt des Antwortverfassers fest. Viele Anfragen auf einmal bearbeitest du mit der Stapelverarbeitung.

## 9 · Stelle ausschreiben und Interviews vorbereiten {#hr-recruiting}
<!-- keywords: personalwesen, stellenprofil, stellenanzeige, interviewleitfaden, fairness-prüfer, überarbeitung -->

**Bereich:** Personalwesen · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Ergebnisdateien

Gute Einstellungen beginnen mit einem klaren Profil und fairen, vergleichbaren Interviews. Der Workflow macht aus losen Notizen ein Stellenprofil, eine Anzeige und einen Interviewleitfaden und prüft alles auf Fairness.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Profil-Agent ordnet Aufgaben und Anforderungen. Daraus entstehen parallel die Stellenanzeige und der Interviewleitfaden. Der Fairness-Prüfer kontrolliert beide auf diskriminierende oder unzulässige Formulierungen, etwa zu Alter oder Muttersprache, und nennt, was ein Mensch prüfen muss. Hat er Beanstandungen, leitet ein Entscheidungsknoten die Unterlagen an eine Überarbeitung, die seine Vorschläge umsetzt; sonst bleibt es bei den ersten Fassungen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Stellenprofil** | Ordnet Aufgaben, Muss- und Kann-Anforderungen und Kompetenzen. | Stellenbedarf |
| **Stellenanzeige** | Formuliert eine ansprechende, inklusive Stellenanzeige. | Stellenprofil |
| **Interviewleitfaden** | Bereitet strukturierte Interviewfragen mit Bewertungsankern vor. | Stellenprofil |
| **Fairness-Prüfer** | Prüft Anzeige und Leitfaden auf Diskriminierung und unzulässige Fragen. (strukturierte Ausgabe) | Stellenanzeige, Interviewleitfaden |
| **Überarbeitung** | Setzt die Änderungsvorschläge der Fairness-Prüfung in Anzeige und Leitfaden um. | Nachbesserung nötig? |

**Eingabe:** Notizen zur Stelle: Aufgaben, gewünschte Qualifikationen, Team, Rahmenbedingungen und Vergütung.

**Testfälle:** Notizen mit problematischen Wünschen

**Ergebnis:** Stellenprofil, Stellenanzeige und Interviewleitfaden mit Bewertungsankern, eine strukturierte Fairness-Prüfung und bei Beanstandungen eine überarbeitete Fassung mit Änderungsliste, zusätzlich als Word-Datei. Die Unterlagen müssen vor der Veröffentlichung von HR oder einer fachkundigen Person freigegeben werden.

**Anpassen:** Ersetze die Notizen durch deinen Stellenbedarf. Euer Arbeitgeberprofil und eure Benefits kannst du als Wissen hinterlegen und dem Anzeigen-Agenten zuweisen. Rechtliche Vorgaben eures Landes ergänzt du im System-Prompt des Fairness-Prüfers. Erweitere den Workflow nicht ohne rechtliche Prüfung auf das Sichten, Bewerten oder Reihen von Bewerbungen: Solche Systeme gelten nach der EU-KI-Verordnung als Hochrisiko-KI.

## 10 · Forschungsfrage in Hypothesen übersetzen {#research-hypotheses}
<!-- keywords: forschung und entwicklung, fragestellungsanalyst, hypothesenentwickler, methodenkritiker, versuchsplaner -->

**Bereich:** Forschung und Entwicklung · **Agenten:** 4 · **Muster:** sequenziell · **Niveau:** Fortgeschritten · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge

Gute Forschung beginnt mit einer präzisen, prüfbaren Frage. Der Workflow zerlegt eine Forschungsfrage, formuliert Hypothesen, lässt sie methodisch kritisieren und leitet einen realistischen Versuchsplan ab.

**So arbeiten die Agenten zusammen:** Eine sequenzielle Kette mit Rückgriff: Der Analyst klärt Variablen und Annahmen, der Hypothesen-Agent formuliert prüfbare Hypothesen mit Nullhypothesen, der Methodenkritiker prüft sie mit dem Rechner-Tool an den Vorversuchsdaten und benennt Störgrößen. Der Versuchsplaner nutzt Hypothesen und Kritik zusammen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Fragestellungsanalyst** | Klärt Ziel, Variablen, Rahmenbedingungen und Wissenslücken. | Forschungsfrage |
| **Hypothesenentwickler** | Formuliert prüfbare Hypothesen mit Vorhersagen und Nullhypothesen. | Fragestellungsanalyst |
| **Methodenkritiker** | Prüft Hypothesen auf Prüfbarkeit, Störgrößen und Datenlage. (Tools: `calculator`) | Hypothesenentwickler, Forschungsfrage |
| **Versuchsplaner** | Leitet aus Hypothesen und Kritik einen Versuchsplan ab. | Hypothesenentwickler, Methodenkritiker |

**Eingabe:** Eine Forschungsfrage mit Ziel, vorhandenen Daten aus Vorversuchen und Rahmenbedingungen wie Material, Zeit und Geräte. Messdaten und Unterlagen kannst du als Dateien anhängen; die Beispieldatei enthält die Vorversuchswerte je Blech.

**Beispieldateien:** `Vorversuch_PL-7.csv`

**Testfälle:** Frage und Vorversuch im Text; Vorversuchsdaten als CSV

**Ergebnis:** Ein Versuchsplan mit Hypothesen, Faktoren und Stufen, Stichprobengröße, Messmethode, Auswertung und Abbruchkriterien sowie den offenen Risiken, zusätzlich als Word-Datei. Der Versuchsplaner schlägt den Plan für das Wissen vor; ob er gespeichert wird, entscheidest du.

**Anpassen:** Ersetze Frage und Vorversuch durch deine eigenen und hänge Messdaten direkt an. Fachliteratur, die du immer wieder brauchst, lädst du als Wissen im Modus „Volltextsuche“ hoch und weist sie dem Analysten zu, damit er mit Zitaten arbeitet. Eure Statistikvorgaben ergänzt du beim Methodenkritiker.

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

**Anpassen:** Hänge dein Projekt als ZIP an oder füge Code ein und nenne Sprache und Framework. Für andere Sprachen passe im Verbesserungs-Agenten das Testframework an, zum Beispiel Jest oder JUnit. Eure Coding-Guidelines kannst du als Wissen hinterlegen. Über die Workflow-API lässt sich das Review auch aus einer CI-Pipeline anstoßen.

## 12 · Vertrag strukturieren und Prüfpunkte finden {#contract-review}
<!-- keywords: recht und verwaltung, vertragsstrukturierer, klausel-erklärer, prüfpunkte-analyst, vertragsübersicht, kritische klauseln -->

**Bereich:** Recht und Verwaltung · **Agenten:** 5 · **Muster:** verzweigt · **Niveau:** Fortgeschritten · **Bausteine:** Entscheidung, Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge

Verträge sind lang, und wichtige Klauseln verstecken sich in Details. Der Workflow gliedert einen Vertrag, erklärt ihn in einfacher Sprache und sammelt Punkte, die eine fachkundige Person prüfen sollte. Er ersetzt keine Rechtsberatung.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Der Strukturierer erfasst Parteien, Laufzeit, Leistungen und Fristen. Darauf arbeiten parallel der Klausel-Erklärer (einfache Sprache) und der Prüfpunkte-Analyst (ungewöhnliche oder einseitige Regelungen); beide lesen den Vertrag selbst, als Text oder als hochgeladene Datei. Findet der Prüfpunkte-Analyst kritische Klauseln, ergänzt ein Entscheidungsknoten eine vertiefte Prüfung dieser Klauseln. Der Berichts-Agent führt alles zu einer strukturierten Übersicht mit Fragen für die Rechtsberatung zusammen.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Vertragsstrukturierer** | Erfasst Parteien, Gegenstand, Laufzeit, Vergütung und Fristen. | Vertragstext |
| **Klausel-Erklärer** | Erklärt jede Klausel in einfacher Sprache. | Vertragsstrukturierer, Vertragstext |
| **Prüfpunkte-Analyst** | Findet ungewöhnliche, einseitige oder fehlende Regelungen. (strukturierte Ausgabe) | Vertragsstrukturierer, Vertragstext |
| **Vertragsübersicht** | Führt Erklärungen und Prüfpunkte zu einer strukturierten Übersicht zusammen. (strukturierte Ausgabe) | Klausel-Erklärer, Prüfpunkte-Analyst, Kritische Klauseln |
| **Kritische Klauseln** | Prüft kritische Klauseln vertieft und bereitet Verhandlungsfragen vor. | Kritische Klauseln? |

**Eingabe:** Der Vertrag als Datei (PDF, Word, Markdown oder Text) im Feld „Vertrag als Datei“ oder als Text, möglichst mit Paragrafennummern. Die Datei lädst du direkt beim Start hoch; eine Wissenssammlung brauchst du dafür nicht. Die Beispieldatei enthält den erfundenen Vertrag der Testaufgabe.

**Beispieldateien:** `Software-Dienstleistungsvertrag_Beispiel.docx`

**Testfälle:** Vertrag im Text, mit kritischen Klauseln; Vertrag als Word-Datei, ohne Text; Ausgewogener Wartungsvertrag

**Ergebnis:** Eine strukturierte Übersicht mit Zusammenfassung, Eckdaten, erklärten Klauseln, Prüfpunkten und Fragen an eine Rechtsanwältin oder einen Rechtsanwalt, zusätzlich als PDF und als bearbeitbare Word-Datei. Der Strukturierer schlägt die Eckdaten des Vertrags für das Wissen vor, etwa für ein Vertragsverzeichnis; gespeichert wird nur, was du bestätigst.

**Anpassen:** Lade deinen Vertrag beim Start als Datei hoch oder füge ihn ein. Eigene Prüfkriterien, etwa eure Mindestanforderungen an Haftung oder Datenschutz, ergänzt du im System-Prompt des Prüfpunkte-Analysten. Musterverträge, mit denen verglichen werden soll, kannst du als Wissen hinterlegen und dem Prüfpunkte-Analysten zuweisen.

## 13 · Persönlichen Lernplan erstellen {#learning-plan}
<!-- keywords: bildung und weiterbildung, lernstandsanalyse, lernplaner, erklärer, prüfungsautor -->

**Bereich:** Bildung und Weiterbildung · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Lernen klappt besser mit einem Plan, der beim eigenen Stand ansetzt. Der Workflow erstellt einen persönlichen Lernplan, erklärt die ersten Inhalte und prüft das Verständnis mit einem Quiz.

**So arbeiten die Agenten zusammen:** Die Lernstandsanalyse bestimmt Ausgangslage und Lücken, der Lernplaner erstellt daraus einen Wochenplan. Auf dieser Grundlage arbeiten parallel der Erklärer (Lerninhalte der gewählten Woche, auf Wunsch gestützt auf deine Kursunterlagen) und der Prüfungsautor (Wissenskontrolle mit Lösungen). Das Ergebnis enthält alle drei Teile.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Lernstandsanalyse** | Bestimmt Ausgangslage, Lernziel und Lücken. | Lernziel |
| **Lernplaner** | Erstellt einen Wochenplan mit Lernzielen und Übungen. | Lernstandsanalyse |
| **Erklärer** | Erklärt die Inhalte der ersten Woche mit Beispielen und Übungen. | Lernplaner, Lernziel |
| **Prüfungsautor** | Erstellt eine Wissenskontrolle mit Lösungen zur ersten Woche. | Lernplaner |

**Eingabe:** Wer lernt, das Lernziel, verfügbare Zeit, Vorwissen und bevorzugter Lernstil. Im Formular wählst du die Woche, die ausgearbeitet wird, und kannst eigene Kursunterlagen anhängen; die Beispieldatei ist eine kurze Anleitung zu Pivot-Tabellen.

**Beispieldateien:** `Kurzanleitung_Pivot-Tabellen.docx`

**Testfälle:** Woche 1 ohne Unterlagen; Woche 2 mit Kursunterlage

**Ergebnis:** Ein vierwöchiger Lernplan mit Lernzielen je Woche, verständliche Erklärungen mit Übungen für die gewählte Woche und ein Quiz mit Lösungen und Erklärungen, zusätzlich als PDF zum Ausdrucken.

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

**Anpassen:** Trage deinen Reisewunsch ein. Wer aktuelle Preise und Öffnungszeiten möchte, kann dem Routenplaner das Server-Tool „Websuche“ hinzufügen; das kostet zusätzlich pro Suche.

## 16 · Geschäftsidee bewerten {#business-idea}
<!-- keywords: selbstständige und gründer, marktanalyst, wirtschaftlichkeitsrechner, risikoanalyst, investoren-jury -->

**Bereich:** Selbstständige und Gründer · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Ergebnisdateien

Vor einer Gründung lohnt ein nüchterner Blick auf Markt, Zahlen und Risiken. Der Workflow lässt drei Fachleute gleichzeitig prüfen und eine Jury ein begründetes Urteil fällen.

**So arbeiten die Agenten zusammen:** Drei Agenten arbeiten parallel: Der Marktanalyst schätzt Zielgruppen und Wettbewerb, der Wirtschaftlichkeitsrechner rechnet Break-even und Szenarien mit dem Rechner-Tool, der Risikoanalyst sucht Schwachstellen. Die Investoren-Jury wägt alles ab und liefert ein strukturiertes Urteil mit Punktzahl.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Marktanalyst** | Schätzt Zielgruppen, Nachfrage und Wettbewerb ein. | Geschäftsidee |
| **Wirtschaftlichkeitsrechner** | Rechnet Deckungsbeitrag, Break-even und Szenarien mit dem Rechner-Tool. (Tools: `calculator`) | Geschäftsidee |
| **Risikoanalyst** | Sucht Schwachstellen und Risiken der Idee. | Geschäftsidee |
| **Investoren-Jury** | Wägt Markt, Zahlen und Risiken ab und fällt ein Urteil. (strukturierte Ausgabe) | Marktanalyst, Wirtschaftlichkeitsrechner, Risikoanalyst |

**Eingabe:** Eine Beschreibung der Idee mit Angebot, Zielgruppen, Preisen, Kosten, Kapazität und bekannten Wettbewerbern.

**Testfälle:** Mobiler Fahrradreparaturservice

**Ergebnis:** Ein strukturiertes Urteil (weiterverfolgen, anpassen oder verwerfen) mit Punktzahl, Stärken, Risiken, zu prüfenden Annahmen und konkreten nächsten Schritten zur Validierung, zusätzlich als PDF-Bericht.

**Anpassen:** Beschreibe deine Idee mit deinen Zahlen. Je ehrlicher die Annahmen, desto nützlicher das Urteil. Eigene Marktdaten oder Umfrageergebnisse lädst du als Wissen hoch und weist sie dem Marktanalysten zu.

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

**Anpassen:** Trage deine Angebote und Finanzierungsdaten ein und hänge Exposés, Protokolle der Eigentümerversammlung oder Grundrisse direkt an. Einen Mietspiegel, den du immer wieder brauchst, kannst du als Wissen hinterlegen und dem Objekt- und Lageanalysten zuweisen.

## 19 · Bauverzögerungen analysieren {#construction-delay}
<!-- keywords: bauwesen, terminanalyst, ursachenanalyst, maßnahmenplaner, bericht an den bauherrn -->

**Bereich:** Bauwesen · **Agenten:** 4 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Freigabe, Eingabeformular, Ergebnisdateien, Dateien als Eingabe

Verzögerungen auf der Baustelle summieren sich, und Bauherren brauchen schnell ein klares Bild. Der Workflow berechnet Abweichungen, ordnet Ursachen ein, entwickelt Gegenmaßnahmen und formuliert einen Statusbericht.

**So arbeiten die Agenten zusammen:** Terminanalyst und Ursachenanalyst arbeiten parallel. Der eine berechnet Verzüge und Puffer mit Datums- und Rechner-Tool, der andere ordnet Ursachen nach Verantwortungsbereich und Dokumentationsbedarf; beide werten auch angehängte Terminpläne, Bautagebücher und Fotos aus. Der Maßnahmenplaner entwickelt Beschleunigungsoptionen, der Berichtsagent fasst alles für den Bauherrn zusammen. Bevor der Bericht das Projektteam verlässt, gibt ihn ein Mensch frei.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Terminanalyst** | Berechnet Verzüge, Puffer und Folgen mit Datums- und Rechner-Tool. (Tools: `days_between`, `calculator`) | Projektstatus |
| **Ursachenanalyst** | Ordnet Ursachen nach Verantwortungsbereich und Dokumentationsbedarf ein. | Projektstatus |
| **Maßnahmenplaner** | Entwickelt Beschleunigungsmaßnahmen mit Kosten und Wirkung. | Terminanalyst, Ursachenanalyst |
| **Bericht an den Bauherrn** | Fasst Terminlage, Ursachen und Maßnahmen sachlich zusammen. | Terminanalyst, Maßnahmenplaner, Ursachenanalyst |

**Eingabe:** Eine Terminübersicht mit geplanten und tatsächlichen Meilensteinen, Bemerkungen zu den Ursachen, Stichtag und vertraglichen Rahmenbedingungen, als Text oder als Dateien: Terminplan als Excel, Bautagebuch als PDF, Fotos als Bild. Die Beispieldateien enthalten einen Terminplan und einen Bautagebuch-Auszug.

**Beispieldateien:** `Terminplan_Kita_Sonnenblick.xlsx`, `Bautagebuch_Auszug_April_Mai.pdf`

**Testfälle:** Terminübersicht im Text; Terminplan und Bautagebuch als Dateien

**Ergebnis:** Ein sachlicher Statusbericht mit Terminlage, Ursachen, Gegenmaßnahmen, Entscheidungsbedarf und Risiken. Nach der Freigabe speichert der Lauf ihn als PDF und als bearbeitbare Word-Datei. Fragen zu Vertragsstrafen und Bauzeitverlängerung bleiben der fachlichen und rechtlichen Prüfung vorbehalten.

**Anpassen:** Exportiere deinen Terminplan aus der Projektsoftware als Excel und hänge Bautagebuch und Fotos an. Für einen regelmäßigen Bericht kannst du die Kopie zeitgesteuert starten; die Freigabe wartet dann auf dich.

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

**Anpassen:** Trage die Eckdaten deines Festes ein. Genehmigungen und Auflagen unterscheiden sich je nach Gemeinde; ergänze bekannte Vorgaben in der Eingabe. Logos und Vorlagen für Plakate können als Wissen hinterlegt werden.

## 23 · Spendenkampagne entwickeln {#nonprofit-campaign}
<!-- keywords: gemeinnützige organisationen, kampagnenentwickler, wirkungsanalyst, glaubwürdigkeitsprüfer -->

**Bereich:** Gemeinnützige Organisationen · **Agenten:** 3 · **Muster:** parallel · **Niveau:** Fortgeschritten · **Bausteine:** Ergebnisdateien, Wissensvorschläge

Spendenkampagnen brauchen eine bewegende Geschichte, aber auch ehrliche Aussagen zur Wirkung. Der Workflow entwickelt eine Kampagne, bewertet die mögliche Wirkung und prüft, ob Versprechen glaubwürdig und ethisch vertretbar sind.

**So arbeiten die Agenten zusammen:** Kampagnenentwickler und Wirkungsanalyst arbeiten parallel: Der eine entwirft Botschaft, Zielgruppen und Maßnahmen, der andere erstellt ein Wirkungsmodell mit Indikatoren und rechnet Kosten pro Kind mit dem Rechner-Tool. Der Glaubwürdigkeitsprüfer kontrolliert beides; das Ergebnis enthält alle drei Teile.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Kampagnenentwickler** | Entwirft Botschaft, Zielgruppen, Kanäle und Zeitplan der Kampagne. | Projektbeschreibung |
| **Wirkungsanalyst** | Erstellt ein Wirkungsmodell mit Indikatoren und Kosten pro Kind. (Tools: `calculator`) | Projektbeschreibung |
| **Glaubwürdigkeitsprüfer** | Prüft Aussagen auf Übertreibung, Ethik und Belegbarkeit. (strukturierte Ausgabe) | Kampagnenentwickler, Wirkungsanalyst |

**Eingabe:** Organisation, Projekt, bisherige Ergebnisse, Ziel, Finanzbedarf, Kampagnenzeitraum und vorhandene Kanäle.

**Testfälle:** Lesepaten an Grundschulen

**Ergebnis:** Ein Kampagnenkonzept mit Zeitplan und Textentwürfen, ein Wirkungsmodell mit Indikatoren und eine strukturierte Prüfung auf übertriebene Aussagen, ethische Hinweise und einen Plan zur Wirkungsmessung, zusätzlich als Word-Datei. Der Wirkungsanalyst schlägt sein Wirkungsmodell für das Wissen vor, etwa für spätere Förderanträge; gespeichert wird nur, was du bestätigst.

**Anpassen:** Beschreibe dein Projekt und deine bisherigen Ergebnisse so ehrlich wie möglich. Jahresberichte oder Evaluationen lädst du als Wissen hoch und weist sie dem Wirkungsanalysten zu.

## 24 · Bürgeranfrage beantworten {#citizen-inquiry}
<!-- keywords: öffentliche einrichtungen, anliegenanalyse, informationsaufbereitung, antwortentwurf -->

**Bereich:** Öffentliche Einrichtungen · **Agenten:** 3 · **Muster:** sequenziell · **Niveau:** Einsteiger · **Bausteine:** Eingabeformular, Ergebnisdateien, Dateien als Eingabe, Wissensvorschläge

Bürgeranfragen enthalten oft mehrere Anliegen und müssen korrekt, verständlich und ohne vorschnelle Zusagen beantwortet werden. Der Workflow zerlegt die Anfrage, sucht die passenden Regeln aus den bereitgestellten Informationen und bereitet eine Antwort vor.

> Fachlich prüfen: Die Ergebnisse sind Arbeitshilfen und müssen von einer fachkundigen Person geprüft werden.

**So arbeiten die Agenten zusammen:** Eine Kette aus drei Agenten: Die Anliegenanalyse trennt die Anliegen und ordnet Zuständigkeiten zu, die Informationsaufbereitung sucht die einschlägigen Regeln ausschließlich aus dem bereitgestellten Auszug, und der Antwortentwurf formuliert eine bürgernahe Antwort. Eine Qualitätsprüfung kontrolliert, dass nur belegte Regeln genannt und keine verbindlichen Zusagen gemacht werden.

| Agent | Aufgabe | Bekommt |
|---|---|---|
| **Anliegenanalyse** | Trennt die Anliegen und ordnet Zuständigkeiten und Dringlichkeit zu. | Bürgeranfrage |
| **Informationsaufbereitung** | Sucht die einschlägigen Regeln nur aus den bereitgestellten Informationen. | Anliegenanalyse, Bürgeranfrage |
| **Antwortentwurf** | Formuliert eine sachliche, bürgernahe Antwort zur Freigabe. (mit Qualitätsprüfung) | Anliegenanalyse, Informationsaufbereitung |

**Eingabe:** Die Anfrage der Bürgerin oder des Bürgers und die relevanten internen Informationen, Regeln und Zuständigkeiten, als Auszug im Text oder als Dateien. Auch Fotos aus der Anfrage kannst du anhängen. Die Beispieldatei ist ein erfundenes Merkblatt der Gemeinde.

**Beispieldateien:** `Merkblatt_Nebengebaeude_und_Beleuchtung.pdf`

**Testfälle:** Gartenhaus und Straßenlaterne; Regeln als Merkblatt-Datei

**Ergebnis:** Ein Antwortentwurf in einfacher Sprache mit Zuständigkeiten, nächsten Schritten und Hinweisen für die Sachbearbeitung, zusätzlich als Word-Datei für euren Briefkopf. Die Informationsaufbereitung schlägt die gefundenen Regeln mit Fundstelle für das Wissen vor, damit spätere Anfragen darauf zugreifen können; gespeichert wird nur, was du bestätigst. Der Entwurf muss vor dem Versand fachlich geprüft und freigegeben werden.

**Anpassen:** Hänge eure Satzungen und Merkblätter an oder lade sie dauerhaft als Wissen hoch (Modus „Volltextsuche“ mit Zitaten) und weise sie der Informationsaufbereitung zu. Briefkopf und Grußformel ergänzt du im System-Prompt des Antwortentwurfs. Viele Anfragen auf einmal bearbeitest du mit der Stapelverarbeitung.

<!-- examples:end -->

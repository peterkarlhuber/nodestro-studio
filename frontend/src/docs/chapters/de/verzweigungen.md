# Verzweigungen und Freigaben

Workflows können mehr als eine feste Kette von Agenten sein: Eine **Entscheidung** wählt nach festen Regeln einen Weg, eine **Freigabe** hält den Lauf an, bis eine Person zustimmt oder ablehnt, ein **Unterworkflow** ruft einen anderen Workflow als einen Schritt auf. Dazu kommen **Eingabeformulare** für strukturierte Eingaben und das **Fortsetzen** fehlgeschlagener Läufe. Alles läuft mit derselben Ausführung wie jeder andere Workflow.

## Entscheidungen {#entscheidung}
<!-- keywords: entscheidung, verzweigung, bedingung, if, router, weiche, zweig, regel, condition -->

Eine **Entscheidung** (Palette, Gruppe *Ablauf steuern*) prüft ein Ergebnis mit festen Regeln und öffnet die passenden Zweige. Sie stellt **keine KI-Anfrage** und kostet nichts; das Ergebnis ist immer nachvollziehbar.

- Jede Regel ist ein **Zweig** mit eigenem Ausgang rechts am Knoten. Dazu kommt immer der Zweig **Sonst**, der greift, wenn keine Regel zutrifft.
- Verbindungen ziehst du vom Punkt des jeweiligen Zweigs zum nächsten Agenten. Eine Verbindung vom Knoten selbst ist nicht möglich; der Editor fordert dich dann auf, einen Zweig zu wählen.
- **Geprüftes Ergebnis:** Leer bedeutet das Ergebnis, das über die eingehende Verbindung ankommt. Kommen mehrere an, wählst du eines aus. Auch die Werte eines [Eingabeformulars](/docs/verzweigungen#eingabeformular) lassen sich prüfen.
- Agenten auf nicht gewählten Zweigen werden **übersprungen**. Das ist kein Fehler; der Lauf kann trotzdem *Fertig* sein.

Im Lauf zeigt die Entscheidung, welche Regeln zutrafen, welcher Wert geprüft wurde und warum gegebenenfalls *Sonst* gewählt wurde.

## Regeln {#regeln}
<!-- keywords: regel, operator, vergleich, gleich, enthält, größer, kleiner, leer, feld, json, modus -->

Eine Regel vergleicht ein **Feld** des Ergebnisses mit einem **Wert**. Das Feld ist ein Pfad in einer strukturierten Ausgabe, zum Beispiel `category` oder `customer.tier`; leer bedeutet das ganze Ergebnis. Ein Text, der JSON enthält (auch in einem Codeblock), wird als Daten gelesen.

| Vergleich | Bedeutung |
|---|---|
| gleich, ungleich | Text, Zahl oder Ja/Nein; Groß- und Kleinschreibung nur auf Wunsch |
| enthält, enthält nicht, beginnt mit, endet mit | Text |
| größer, größer gleich, kleiner, kleiner gleich | Zahlen oder Daten (JJJJ-MM-TT) |
| ist wahr, ist falsch | Ja/Nein (auch „ja“, „yes“, „true“, „1“) |
| ist eins von, ist keins von | Liste, Werte durch Kommas getrennt |
| ist leer, ist nicht leer | fehlende, leere Werte oder leere Listen |

- **Modus:** *Erste passende Regel* öffnet genau einen Zweig (die Reihenfolge zählt). *Alle passenden Regeln* öffnet jeden zutreffenden Zweig; sie laufen dann parallel.
- **Ungültige Daten:** Fehlt das Feld oder passt der Typ nicht (etwa „größer“ auf einen Text), nimmt die Entscheidung den *Sonst*-Zweig oder schlägt fehl, je nach Einstellung.

Damit Regeln zuverlässig greifen, gib dem Agenten davor eine [strukturierte Ausgabe](/docs/agenten#ausgabeformat) mit festen Feldern.

## Zweige zusammenführen {#zusammenfuehren}
<!-- keywords: zusammenführen, merge, zweige vereinen, übersprungen, blockiert -->

Ein Knoten wartet, bis alle Vorgänger erledigt sind. Er **läuft**, sobald mindestens eine eingehende Verbindung Daten liefert, er wird **übersprungen**, wenn keine liefert, und er ist **blockiert**, wenn ein Vorgänger fehlgeschlagen ist.

Zusammenführen braucht deshalb keine Einstellung: Ein Agent hinter beiden Zweigen einer Entscheidung läuft mit dem, was ankommt. Der Platzhalter eines Zweigs, der nicht lief, ergibt „-“. Die [Prüfung vor dem Start](/docs/workflows#pruefung) weist auf solche Stellen hin.

Entscheidungen und Freigaben reichen die Daten durch: Ein Agent dahinter erhält die Ergebnisse, die bei ihnen ankamen, unter den Namen der Agenten, die sie erzeugt haben.

## Schleifen {#schleifen}
<!-- keywords: schleife, loop, wiederholen, runde, iteration, qualitätsschleife, überarbeiten, feedback, limit -->

Eine **Schleife** lässt Schritte erneut laufen, bis ein Ergebnis passt, zum Beispiel *Entwurf → Prüfung → Entscheidung*: Ist die Prüfung nicht bestanden, geht es zurück zum Entwurf.

- **Anlegen:** Ziehe eine Verbindung von einem **Zweig** einer Entscheidung oder Freigabe zurück zu einem früheren Schritt. Nodestro legt sie als Schleife an (gestrichelt, mit „↻ max. 3×“) und öffnet sie im Inspektor. Von einem Agenten aus ist keine Verbindung zurück möglich: Jede Runde endet mit einer Entscheidung oder Freigabe.
- **Limit:** *Höchstens Runden* (2 bis 20) zählt den ersten Durchlauf mit. Jede Runde kostet erneut Tokens; das [Budget](/docs/workflows#budget) gilt für den ganzen Lauf.
- **Wenn das Limit erreicht ist:** Der Lauf endet als fehlgeschlagen („Die Schleife lief … mal, ohne ihr Ziel zu erreichen“), oder er folgt den anderen Zweigen der Entscheidung. Folgt keiner, werden die Schritte dahinter übersprungen.
- **Platzhalter:** In der Aufgabe eines Schritts in der Schleife ist `{{iteration}}` die Runde (ab 1), `{{previous}}` sein eigenes Ergebnis der Runde davor und `{{feedback}}`, was über die Schleife zurückkam (etwa die Begründung der Prüfung oder der Kommentar einer abgelehnten Freigabe). In der ersten Runde stehen beide für „-“.
- **Freigaben in Schleifen:** Eine abgelehnte Freigabe kann über ihren Zweig *Abgelehnt* zurück zur Überarbeitung führen; die nächste Runde wartet dann wieder auf eine Entscheidung.

Im Lauf zeigt jeder Schritt seine **Runde**; in den Details wählst du zwischen den Ergebnissen aller Runden. Schleifen dürfen ineinander liegen, sich aber nicht überschneiden. Wird ein fehlgeschlagener Lauf [fortgesetzt](#fortsetzen), läuft eine Schleife immer ganz neu.

## Freigaben {#freigabe}
<!-- keywords: freigabe, genehmigung, approval, human in the loop, prüfen, ablehnen, kommentar, pause -->

Eine **Freigabe** hält den Lauf an, bis eine Person die Ergebnisse **freigibt** oder **ablehnt**. Nichts wird je automatisch freigegeben, auch nicht bei Zeitplänen, Stapelläufen oder Testreihen.

- **Hinweis für die prüfende Person:** worauf sie achten soll.
- **Angezeigte Ergebnisse:** welche Ergebnisse sie sieht; ohne Auswahl alles, was ankommt.
- **Kommentar:** optional oder bei Ablehnung Pflicht. Spätere Agenten lesen ihn unter dem Namen der Freigabe; Ergebnisknoten, Ergebnisdateien und Entscheidungen erhalten ihn nicht. Er bleibt bei der Freigabe im Lauf gespeichert.
- **Bei Ablehnung:** dem Zweig **Abgelehnt** folgen oder den Lauf beenden. Ist am Zweig *Abgelehnt* nichts verbunden, endet dieser Weg einfach.

Während der Lauf wartet, hat er den Status **Pausiert**, die Freigabe **Wartet auf Freigabe**. Entscheiden kannst du in der Ausführungsübersicht des Editors, in der Detailansicht des Laufs oder auf der Seite **Freigaben**. Danach läuft der Lauf an derselben Stelle weiter. Offene Freigaben überstehen einen Neustart von Nodestro.

## Die Seite Freigaben {#freigaben-seite}
<!-- keywords: freigaben, offene freigaben, warteschlange, entscheiden, navigation, zähler -->

Die Seite **Freigaben** (Navigation, Gruppe *Automatisierung*) listet alle offenen Freigaben, die älteste zuerst, mit Workflow, Herkunft (manuell, Zeitplan, Stapel, Testreihe) und Wartezeit. Die Zahl neben dem Menüeintrag zeigt, wie viele warten.

Jede Karte zeigt den Hinweis, die zu prüfenden Ergebnisse, ein Kommentarfeld und die Knöpfe *Freigeben* und *Ablehnen*. Freigaben in Unterworkflows erscheinen hier ebenfalls, mit dem Pfad zum übergeordneten Lauf.

## Unterworkflows {#unterworkflow}
<!-- keywords: unterworkflow, subworkflow, verschachteln, wiederverwenden, baustein, version, kindlauf -->

Ein **Unterworkflow** führt einen anderen gespeicherten Workflow als einen Schritt aus. Sein Ergebnis kommt an wie das eines Agenten.

- **Version:** *Neueste Version* nimmt den aktuellen Stand; eine feste Version ändert sich nicht, wenn der andere Workflow später bearbeitet wird. Die Prüfung meldet, wenn es eine neuere Version gibt.
- **Eingabe:** was der Unterworkflow als Eingabe erhält; `{{input}}` ist das, was hier ankommt.
- **Werte für sein Eingabeformular:** Text oder Platzhalter wie `{{form.kunde}}` oder `{{Analyse}}`. Pflichtfelder ohne Wert meldet die Prüfung.
- Der Unterworkflow läuft als **eigener, verknüpfter Lauf**; in den Details führt ein Link dorthin. Kosten und Tokens zählen einmal, im Budget des übergeordneten Laufs. Hat der Unterworkflow ein eigenes Budget, gilt zusätzlich diese engere Grenze.
- Ein Workflow darf sich nicht selbst aufrufen, auch nicht über Umwege; mehr als fünf Ebenen sind nicht erlaubt.
- Wartet der Unterworkflow auf eine Freigabe, wartet der übergeordnete Lauf mit.

## Teams {#teams}
<!-- keywords: team, ausgabevertrag, vertrag, fähigkeiten, capabilities, strukturiertes ergebnis, run.output_contract -->

Ein **Team** ist ein Workflow, der als Unterworkflow ein festes Ergebnis verspricht. Zwei Einstellungen machen einen Workflow zum Team:

- **Ausgabevertrag** am Ergebnis-Knoten: die Felder (Name, Typ, Pflicht), die der Workflow liefert, wie beim strukturierten Ergebnis eines Agenten. Am Ende eines Laufs wird das Ergebnis geprüft. Es muss ein Objekt sein (oder JSON-Text eines Objekts), das jedes Pflichtfeld im richtigen Typ enthält. Andere Felder werden weggelassen. Passt das Ergebnis nicht, schlägt der Ergebnis-Knoten fehl und mit ihm der Lauf; ein übergeordneter Workflow bekommt nie ein ungeprüftes Ergebnis.
- **Fähigkeiten als Team** in den Workflow-Einstellungen: kurze Stichworte, was der Workflow kann (höchstens 20). Sie wandern mit dem Workflow (Versionen, Export) und helfen später, ein passendes Team zu finden. Sie vergeben keine Rechte.

Ein Workflow mit Ausgabevertrag liefert im übergeordneten Workflow ein Objekt mit genau diesen Feldern. Eine Entscheidung danach kann deshalb direkt auf ein Feld prüfen, etwa `score` größer oder gleich 5.

Die Prüfung vor dem Start warnt, wenn ein Agent vor dem Ergebnis als Text antwortet (dann hilft nur eine JSON-Antwort) oder wenn kein Agent ein Pflichtfeld liefert. Ungültige oder doppelte Feldnamen verhindern den Start.

Workflows mit Ausgabevertrag oder Fähigkeiten erscheinen in der Palette unter **Teams** und lassen sich direkt als Unterworkflow einsetzen. Im Inspektor eines Unterworkflows steht, was das Team liefert. Ein **Doppelklick** auf den Knoten öffnet das Team im Editor; die Brotkrumen oben führen zurück zum übergeordneten Workflow.

Ein Team lässt sich für sich allein prüfen: Lege für den Workflow eine [Testreihe](/docs/automatisierung#testreihen) an. Ihre Prüfungen können die Felder des Ausgabevertrags verwenden, etwa `score` größer oder gleich 5.

## Eingabeformulare {#eingabeformular}
<!-- keywords: formular, eingabeformular, felder, typ, pflichtfeld, standardwert, auswahl, datum, zahl, form -->

Statt eines freien Textfelds kann der **Start**-Knoten ein **Eingabeformular** haben. Der Startdialog fragt dann genau diese Felder ab und prüft sie, bevor der Lauf beginnt.

| Typ | Eingabe |
|---|---|
| Text, Langer Text | freier Text |
| Zahl | Zahl, auch mit Komma |
| Datum | JJJJ-MM-TT |
| Ja/Nein | Auswahl Ja oder Nein |
| Auswahl | einer der festgelegten Werte |
| Datei | eine oder mehrere Dateien aus dem [Wissen](/docs/wissen#start-dateien) |

Jedes Feld hat ein **Label**, einen **technischen Namen** (nur Buchstaben, Ziffern und _), optional einen Standardwert, eine Erklärung und *Pflichtfeld*. Agenten lesen einzelne Werte mit `{{form.name}}`; `{{run.input}}` enthält alle Werte als Zeilen „Label: Wert“, danach die optionale zusätzliche Eingabe. Entscheidungen vergleichen die Werte mit ihrem richtigen Typ.

Formulare nutzen auch [Zeitpläne](/docs/automatisierung#zeitplaene), [Stapelläufe](/docs/automatisierung#stapel) und [Testreihen](/docs/automatisierung#testreihen). Workflows ohne Formular verhalten sich wie bisher.

## Fehlgeschlagene Läufe fortsetzen {#fortsetzen}
<!-- keywords: fortsetzen, weitermachen, resume, wiederholen, neu starten, fehlgeschlagen, abgebrochen -->

Ein fehlgeschlagener oder abgebrochener Lauf lässt sich **fortsetzen** (Knopf *Fortsetzen* in der Detailansicht). Dabei entsteht ein **neuer, verknüpfter Lauf**; der alte bleibt unverändert.

- Vorher zeigt Nodestro für jeden Schritt, ob sein Ergebnis **übernommen** oder **neu ausgeführt** wird, und warum.
- Übernommen wird ein Ergebnis nur, wenn der Schritt erfolgreich war, sich weder er noch seine Tools, Verbindungen, Eingabe oder Dateien geändert haben und alle Vorgänger ebenfalls übernommen werden. Geänderte Schritte und alles dahinter laufen neu.
- Übernommene Ergebnisse kosten im neuen Lauf nichts; ihre Kosten bleiben beim alten Lauf und werden in der [Nutzung](/docs/nutzung) nicht doppelt gezählt.
- Freigabe-Entscheidungen übernommener Schritte gelten weiter und sind als übernommen gekennzeichnet; niemand wird doppelt gefragt.
- Hatten neu laufende Schritte bereits **eigene Tools** aufgerufen, die außerhalb von Nodestro wirken können (etwa eine Nachricht senden), musst du das ausdrücklich bestätigen.

Lässt sich nichts sicher übernehmen, bietet Nodestro einen vollständigen Neustart an. Importierte Traces und einzelne Unterworkflow-Läufe lassen sich nicht fortsetzen; setze dann den übergeordneten Lauf fort.

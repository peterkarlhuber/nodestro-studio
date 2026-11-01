# Automatisierung

Unter *Automatisierung* in der Navigation laufen Workflows ohne Klick auf *Starten*: **Stapelläufe** bearbeiten viele Eingaben auf einmal, **Testreihen** messen die Qualität eines Workflows und **Zeitpläne** starten Workflows regelmäßig. Jeder einzelne Lauf ist ein ganz normaler Lauf mit Trace, Budget und Nutzung; Freigaben warten wie immer auf eine Person.

## Stapelläufe {#stapel}
<!-- keywords: stapel, batch, viele eingaben, csv, excel, xlsx, json, tabelle, spalten, zuordnung, export -->

Ein **Stapellauf** führt einen Workflow für jede Zeile einer Tabelle aus, etwa für 200 Kundenanfragen.

1. Auf der Seite **Stapelläufe** *Neuer Stapellauf* wählen und den Workflow aussuchen.
2. Eine Tabelle hochladen: CSV (Komma oder Semikolon), Excel (XLSX) oder JSON (eine Liste von Objekten), höchstens 1.000 Zeilen und 10 MB.
3. Jeder Spalte ein Feld des [Eingabeformulars](/docs/verzweigungen#eingabeformular) oder die freie Eingabe zuordnen, oder sie ignorieren. Nodestro schlägt passende Zuordnungen vor.
4. Die Vorschau zählt gültige und ungültige Zeilen und zeigt die geschätzten Kosten. Ungültige Zeilen laufen nicht.
5. Starten. Die Detailseite zeigt Fortschritt, Kosten und jede Zeile mit Status und Link zu ihrem Lauf.

Ein Stapel lässt sich **pausieren** (laufende Läufe enden, neue starten nicht), **fortsetzen** und **abbrechen**. Ein Fehler in einer Zeile stoppt die anderen nicht. Wurde Nodestro während eines Stapels beendet, ist er *unterbrochen* und lässt sich fortsetzen. Die Ergebnisse lädst du als CSV oder JSON herunter.

## Grenzen, Kosten und eigene Tools {#grenzen}
<!-- keywords: grenzen, limit, kostenlimit, fehlerlimit, gleichzeitig, parallel, schätzung, kosten, rate limit, eigene tools -->

- **Gleichzeitig:** wie viele Läufe parallel laufen (1 bis 8). Mehr ist schneller, kann aber die Ratenlimits der API erreichen.
- **Kostenlimit (USD):** der Stapel stoppt, sobald die Summe erreicht ist. Zusätzlich gilt das [Budget pro Lauf](/docs/workflows#budget) für jeden einzelnen Lauf.
- **Höchstens Fehler:** der Stapel stoppt nach so vielen fehlgeschlagenen Läufen.
- **Geschätzte Kosten:** aus den letzten erfolgreichen Läufen des Workflows, mal der Zahl der Läufe. Gibt es noch keinen erfolgreichen Lauf, nennt Nodestro nur das Maximum aus Budget mal Anzahl.
- **Eigene Tools**, die außerhalb von Nodestro wirken können (etwa Nachrichten senden), würden bei jedem Lauf aufgerufen. Das musst du vor dem Start ausdrücklich bestätigen.
- Läufe, die auf eine **Freigabe** warten, belegen keinen Platz; sie laufen weiter, sobald jemand entscheidet.

Die Kosten aller Läufe erscheinen wie immer unter [Nutzung](/docs/nutzung), jeweils einmal.

## Testreihen {#testreihen}
<!-- keywords: testreihe, benchmark, testfall, prüfregel, qualität, regression, erwartetes ergebnis, bestanden -->

Eine **Testreihe** gehört zu einem Workflow und enthält feste **Testfälle**: eine Eingabe (Formularwerte, freier Text, Dateien), **Prüfregeln** für das Ergebnis und optional Kriterien für eine [KI-Bewertung](/docs/automatisierung#ki-bewertung).

- Prüfregeln nutzen dieselben Vergleiche wie [Entscheidungen](/docs/verzweigungen#regeln), etwa `category gleich complaint` oder `total größer 100`. Sie sind exakt und kosten nichts.
- *Testreihe ausführen* wählt die Workflow-Version (aktueller Stand oder eine ältere), Grenzen wie beim Stapellauf und ob die KI bewerten soll.
- Ein Fall ist **bestanden**, wenn sein Lauf erfolgreich war, alle Prüfregeln zutreffen und, falls bewertet, die KI ihn bestanden hat.
- Die Auswertung zeigt Bestehensquote, KI-Bewertung, Tokens, Kosten und Dauer sowie für jeden Fall die Details.

Eine Testreihe hat höchstens 200 Fälle. Ungültige Fälle (etwa ein Pflichtfeld ohne Wert) werden vor dem Start gemeldet und übersprungen.

## Testfall aus einem fehlgeschlagenen Lauf {#testfall-aus-lauf}
<!-- keywords: testfall aus lauf, fehler als test, regression, fehlgeschlagen, übernehmen, geschwärzt -->

Ist ein Lauf fehlgeschlagen, klicke in seinen Details auf **Als Testfall übernehmen**. Nodestro schlägt einen Testfall mit derselben Eingabe vor: Formularwerte, freier Text und Dateien.

- API-Schlüssel, Tokens und Passwörter werden immer durch Platzhalter wie `[API_KEY_1]` ersetzt, personenbezogene Daten (E-Mail-Adressen, Telefonnummern, IBANs …) ebenfalls, solange der Schalter an ist. Die Erkennung arbeitet mit Mustern und findet nicht alles; sieh dir die Vorschau an.
- Dateien werden verwendet, wie sie gespeichert sind, nicht kopiert und nicht geschwärzt. Gelöschte Dateien fallen weg und werden genannt, ebenso Werte, die nicht mehr zum aktuellen Formular passen.
- Gespeichert wird erst, wenn du eine Testreihe wählst (oder eine neue anlegst) und **Zur Testreihe hinzufügen** klickst. Der Lauf selbst bleibt unverändert.
- Der Fall merkt sich seine **Herkunft** (Lauf, Fehler, was ersetzt wurde) und zeigt sie in der Testreihe. Prüfregeln und Kriterien ergänzt du dort.

Ändert ein neuer Fall eine Testreihe, die ein [Freigabe-Gate](/docs/api-und-export#freigabe-gate) nutzt, muss sie vor der nächsten Veröffentlichung erneut laufen.

## KI-Bewertung {#ki-bewertung}
<!-- keywords: ki bewertung, judge, llm as judge, kriterien, bewertung, note, punktzahl -->

Für Fälle mit Kriterien (eins pro Zeile) bewertet ein separates KI-Modell das Ergebnis, auf Wunsch im Vergleich mit einem **erwarteten Ergebnis**. Standard ist das Modell der KI-Assistenten; du kannst in der Testreihe ein eigenes Modell eines eingerichteten Anbieters wählen.

Das Urteil ist überall als **KI-Bewertung** gekennzeichnet und ersetzt keine Prüfregel. Es kostet zusätzlich; diese Kosten stehen in der Auswertung und in der [Nutzung](/docs/nutzung) unter *KI-Bewertung von Testreihen*.

## Testläufe vergleichen {#testreihen-vergleichen}
<!-- keywords: vergleichen, version vergleichen, besser, schlechter, regression, vorher nachher -->

Wähle in der Liste der Testläufe zwei aus und klicke *Vergleichen*. Die Tabelle zeigt die Bestehensquote beider Läufe und für jeden Fall, ob er bestanden hat, markiert als **besser**, **schlechter**, **gleich** oder **geändert**.

So prüfst du nach jeder Änderung an Agenten, Prompts oder Tools, ob der Workflow besser geworden ist, und kannst eine ältere [Version](/docs/workflows#versionen) gegen den aktuellen Stand testen.

## Modelle vergleichen {#modelle-vergleichen}
<!-- keywords: modell vergleichen, anderes modell, günstiger, schneller, modellwahl, variante -->

Ob ein günstigeres oder stärkeres Modell für einen Agenten genügt, prüfst du mit derselben Testreihe. Schalte im Startdialog **Andere Modelle testen** ein und wähle für einzelne Agenten ein anderes Modell. Die Testfälle und die KI-Bewertung bleiben gleich, der gespeicherte Workflow ändert sich nicht.

Ein solcher Lauf braucht ein **Kostenlimit** unter [Grenzen](/docs/automatisierung#grenzen), weil frühere Läufe andere Modelle nutzten und nichts über die Kosten sagen. In der Liste trägt er das Zeichen **Modellvergleich** und nennt die ersetzten Modelle. Vergleiche ihn danach mit einem Lauf der gespeicherten Version. Er zählt nicht als Testergebnis dieser Version, weil er eine Variante getestet hat. Passt ein Modell, übernimmst du es im Agenten selbst.

## Modellwahl nach Messwerten {#modellwahl-nach-messwerten}
<!-- keywords: modellwahl, empfehlung, günstigstes modell, policy, messwerte, bestehensquote, modell übernehmen -->

Unter den Testläufen einer Testreihe zeigt **Modellwahl nach Messwerten**, welches Modell ein Agent nach deiner Regel nutzen sollte. Nodestro bewertet dabei nichts selbst: Es zählt nur, was abgeschlossene Testläufe gemessen haben.

- **Ziel:** geringste Kosten, kürzeste Laufzeit oder höchste Bestehensquote. Bei Gleichstand entscheidet die höhere Bestehensquote, dann der Modellname.
- **Mindest-Bestehensquote:** leer bedeutet, dass ein anderes Modell mindestens so viele Fälle bestehen muss wie das jetzige Modell in seinem gemessenen Lauf.
- **Keinen Fall verlieren:** eingeschaltet scheidet ein Modell aus, das einen Fall nicht besteht, den das jetzige Modell bestanden hat.
- **Unbekannte Kosten** zählen nie als 0. Ein Modell ohne bekannte Kosten kann beim Ziel *geringste Kosten* nicht gewinnen.

Als Messung gilt nur der neueste abgeschlossene Lauf je Modell mit demselben Workflow-Stand (außer den Modellen; Position und Namen zählen nicht), denselben Testfällen und derselben KI-Bewertung, denselben Modellen in allen anderen Agenten und einem Ergebnis für jeden Fall. Ändert sich ein Prompt oder ein Testfall, startest du die Läufe neu. Die Liste nennt, welche Läufe aus welchem Grund nicht genutzt wurden. Ohne passende Messung bleibt das jetzige Modell.

*Übernehmen* setzt das empfohlene Modell im Agenten und speichert den Workflow als neue [Version](/docs/workflows#versionen). Vorher ändert sich nichts. Die KI-Bewertung wird angezeigt, entscheidet aber nur über das Bestehen der Fälle mit.

## Zeitpläne {#zeitplaene}
<!-- keywords: zeitplan, schedule, cron, regelmäßig, täglich, wöchentlich, monatlich, stündlich, zeitzone, verpasst -->

Ein **Zeitplan** startet einen Workflow einmalig oder regelmäßig, mit festen Eingaben (Formularwerte, Text, Dateien).

- **Rhythmus:** einmal, alle paar Stunden, täglich, an gewählten Wochentagen oder monatlich an einem Tag (in kürzeren Monaten am letzten Tag).
- **Zeitzone:** Uhrzeiten gelten in der gewählten Zeitzone, auch über die Zeitumstellung hinweg. Eine Uhrzeit, die es beim Vorstellen nicht gibt, läuft eine Stunde später; eine doppelte beim Zurückstellen läuft einmal.
- **Nächste Starts:** der Dialog zeigt die nächsten Termine, bevor du speicherst.
- **Ausgeschaltet bis zum Einschalten:** ein neuer Zeitplan ist aus. Beim Einschalten prüft Nodestro alles, was ein Lauf braucht: den Workflow, die Eingaben, ein [Budget pro Lauf](/docs/einstellungen#budget) und die Bestätigung eigener Tools. Besteht er die Prüfung nicht, bleibt er aus und der Grund wird angezeigt.

Zeitpläne laufen nur, solange Nodestro läuft. Termine, die verstrichen sind, während Nodestro aus war, gelten als **verpasst**: *Überspringen* ignoriert sie, *Einmal nachholen* startet beim nächsten Start einen einzigen Lauf, egal wie viele verpasst wurden. Läufe aus Zeitplänen tragen in den [Ausführungen](/docs/ausfuehrungen#liste) die Herkunft *Zeitplan*.

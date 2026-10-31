# Begriffe

Die wichtigsten Begriffe von Nodestro, jeweils kurz erklärt und mit dem Kapitel, das mehr dazu sagt. Ähnliche Begriffe werden hier ausdrücklich voneinander abgegrenzt.

## Workflow {#workflow}
<!-- keywords: workflow, ablauf, knoten, verbindung, start, ergebnis -->

Ein **Workflow** ist ein Ablauf aus Knoten: ein Start, Agenten, Entscheidungen, Freigaben und ein Ergebnis. Die Verbindungen bestimmen, welcher Schritt die Ergebnisse welches anderen bekommt. Mehr unter [Knoten](/docs/workflows#knoten).

## Agent {#agent}
<!-- keywords: agent, ki, modell, system prompt, aufgabe, bibliothek -->

Ein **Agent** ist ein Schritt, in dem ein KI-Modell eine Aufgabe erledigt: mit Systemprompt, Aufgabe und optional Tools, Wissen und Memory. Agenten aus der **Agenten-Bibliothek** sind Vorlagen; im Workflow arbeitet jeweils eine eigene Kopie. Mehr unter [Agenten](/docs/agenten#grundlagen).

## Tool {#tool}
<!-- keywords: tool, werkzeug, funktion, sandbox -->

Ein **Tool** ist eine Funktion, die ein Agent während seiner Arbeit aufrufen kann, etwa ein Rechner oder eigener Python-Code. Das Modell entscheidet, wann es ein Tool nutzt; eigene Tools laufen in einer Sandbox. Mehr unter [Tools](/docs/tools#ueberblick).

## Wissen {#wissen}
<!-- keywords: wissen, knowledge, dokumente, dauerhaft, suche -->

**Wissen** sind Dokumente, die dauerhaft gespeichert bleiben und Agenten zugewiesen werden, zum Beispiel ein Handbuch oder eine Preisliste. Sie stehen jedem Lauf dieser Agenten zur Verfügung, bis du sie löschst. Mehr unter [Wissen](/docs/wissen#ueberblick).

## Eingabedatei {#eingabedatei}
<!-- keywords: eingabedatei, datei, upload, lauf, einmalig, unterschied wissen -->

Eine **Eingabedatei** lädst du beim Start eines Laufs hoch, etwa den Vertrag, der geprüft werden soll. Sie gehört nur zu diesem Lauf und landet nicht im Wissen. Was mehrere Läufe brauchen, gehört ins Wissen. Mehr unter [Eingabe oder Wissen?](/docs/datei-eingaben#eingabe-oder-wissen).

## Memory {#memory}
<!-- keywords: memory, gedächtnis, notizen, memory-raum -->

**Memory** sind Notizen, die ein Agent selbst schreibt und wieder liest. *Pro Lauf* gilt es nur für einen Lauf; *dauerhaft* liegt es in einem Memory-Raum und bleibt über Läufe hinweg erhalten. Anders als Wissen schreibt der Agent Memory selbst. Mehr unter [Memory-Arten](/docs/memory#arten).

## Ausführung (Lauf) {#ausfuehrung}
<!-- keywords: ausführung, lauf, run, status, ergebnis -->

Eine **Ausführung** oder ein **Lauf** ist ein einzelner Durchgang eines Workflows mit einer bestimmten Eingabe. Er hat einen Status, Kosten, ein Ergebnis und für jeden Schritt eine Detailansicht. Mehr unter [Status](/docs/ausfuehrungen#status).

## Version {#version}
<!-- keywords: version, speichern, verlauf, wiederherstellen -->

Jedes Speichern, das etwas ändert, legt eine nummerierte **Version** des Workflows an. Ältere Versionen kannst du ansehen, vergleichen und wiederherstellen. Mehr unter [Versionen](/docs/workflows#versionen).

## Veröffentlichung (API-Version) {#veroeffentlichung}
<!-- keywords: veröffentlichung, release, api-version, veröffentlichen, api -->

**Veröffentlichen** friert eine gespeicherte Version als API ein. Jede Veröffentlichung bekommt eine eigene Nummer; spätere Änderungen im Editor ändern sie nicht. Tools werden mit eingefroren, Wissen und dauerhaftes Memory liest die API live. Mehr unter [Veröffentlichen](/docs/api-und-export#veroeffentlichen).

## Testreihe {#testreihe}
<!-- keywords: testreihe, test, testfall, prüfregel, qualität -->

Eine **Testreihe** enthält feste Testfälle mit Eingaben und Prüfregeln für einen Workflow. Ein Testlauf führt sie für eine bestimmte Version aus und zeigt, wie viele Fälle bestanden haben. Mehr unter [Testreihen](/docs/automatisierung#testreihen).

## Freigabe {#freigabe}
<!-- keywords: freigabe, approval, mensch, genehmigen, ablehnen -->

Eine **Freigabe** ist ein Schritt, an dem der Lauf anhält, bis ein Mensch das bisherige Ergebnis genehmigt oder ablehnt. Mehr unter [Freigabe](/docs/verzweigungen#freigabe).

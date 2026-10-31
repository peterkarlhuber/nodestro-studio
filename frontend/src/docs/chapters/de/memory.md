# Memory

Mit Memory merkt sich ein Agent Dinge über eine einzelne Aufgabe hinaus: Vorlieben, Entscheidungen, Zwischenstände oder gelernte Regeln. Dieses Kapitel erklärt die Memory-Arten, Memory-Räume und den Memory-Browser.

## Wie Memory funktioniert {#ueberblick}
<!-- keywords: memory, gedächtnis, memory tool, /memories, notizen, erinnern -->

Nodestro nutzt das **Memory-Tool** von Orkexa: bei Modellen von Anthropic deren eigenes Memory-Tool, bei anderen Anbietern ein gewöhnliches Tool mit denselben Befehlen (das Modell muss dafür Tools beherrschen). Ein Agent mit Memory erhält ein kleines Dateisystem unter `/memories`, in dem er Textdateien selbst anlegt, liest, ändert, umbenennt und löscht. Das Modell entscheidet selbst, was es sich merkt: Typischerweise schaut es zu Beginn einer Aufgabe in sein Memory und hält danach Neues fest.

Memory ist **reiner Text** (meist Markdown). Für Originaldokumente wie PDFs ist [Wissen](/docs/wissen) gedacht.

## Memory-Arten {#arten}
<!-- keywords: keins, aus, pro lauf, dauerhaft, persistent, ephemeral, modus -->

| Art | Lebensdauer | Teilen | Einsatz |
|---|---|---|---|
| **Aus** | – | – | Der Agent merkt sich nichts über die Aufgabe hinaus (Standard). |
| **Pro Lauf** | ein Lauf | nein, jeder Agent hat sein eigenes | Notizblock für lange Aufgaben mit vielen Tool-Runden; die Notizen erscheinen danach in der Ausführung. |
| **Dauerhaft** | bis du es löschst | ja, über den Memory-Raum | Wissen, das über viele Läufe wächst: Kundenvorlieben, Projektstände, Entscheidungen. |

## Memory pro Lauf {#pro-lauf}
<!-- keywords: pro lauf, ephemeral, notizblock, scratchpad, memory tab -->

Bei *Pro Lauf* beginnt der Agent jeden Lauf mit einem leeren Memory. Was er sich notiert, siehst du in der Ausführung beim Agenten im Tab **Memory**. Andere Agenten desselben Laufs sehen diese Notizen nicht; Informationen zwischen Agenten fließen über die [Verbindungen](/docs/workflows#datenfluss).

## Dauerhaftes Memory und Memory-Räume {#dauerhaft}
<!-- keywords: dauerhaft, memory raum, space, teilen, gemeinsam, persistent, namespace -->

Bei *Dauerhaft* wählst du einen **Memory-Raum**. Ein Raum ist ein eigenes `/memories`-Dateisystem in der Nodestro-Datenbank. Er bleibt über Läufe und Neustarts erhalten.

- **Neuen Raum anlegen:** im Inspektor unter *Neuer Raum* einen Namen eingeben und **Anlegen** klicken, oder auf der Seite *Memory* über **Neues Gedächtnis**. Erlaubt sind Buchstaben, Ziffern, Leerzeichen, `_`, `.` und `-` (höchstens 64 Zeichen).
- **Teilen:** Mehrere Agenten mit demselben Raum lesen und schreiben dieselben Dateien, auch in verschiedenen Workflows. So kann z. B. ein Agent Kundenwünsche festhalten und ein anderer sie berücksichtigen.
- Ein im Inspektor angelegter Raum erscheint auf der Seite *Memory*, sobald der Agent die erste Datei geschrieben hat.

Laufen zwei Agenten mit demselben Raum parallel, greifen sie nacheinander zu; jede einzelne Änderung ist vollständig, aber sie können sich gegenseitig Inhalte überschreiben. Gib parallelen Agenten verschiedene Dateien oder Räume.

## Der Memory-Browser {#browser}
<!-- keywords: memory seite, browser, bearbeiten, datei anlegen, leeren, inhalt ansehen -->

Die Seite **Memory** zeigt alle Räume mit Anzahl und Größe der Dateien. Wähle einen Raum, um seine Dateien zu sehen:

- **Datei ansehen und bearbeiten:** Datei wählen, Text ändern, **Speichern**.
- **Datei anlegen:** Pfad eingeben (z. B. `kunden/vorlieben.md`); er wird unter `/memories` angelegt.
- **Datei löschen:** Papierkorb-Symbol neben dem Pfad.
- **Raum leeren:** löscht alle Dateien des Raums nach Rückfrage endgültig. Über den Dateien zeigt **Verwendet in**, welche Agenten und veröffentlichten APIs den Raum nutzen; die Rückfrage nennt sie ebenfalls.

Du kannst Memory so jederzeit prüfen, korrigieren oder vorbefüllen. Im Inspektor führt **Inhalt ansehen** direkt zum Raum des Agenten.

## Memory mit KI einrichten {#assistent}
<!-- keywords: memory assistent, mit ki einrichten, vorschlag, struktur, startdateien -->

**Mit KI einrichten** (im Inspektor bei *Dauerhaft*) schlägt eine Startstruktur vor:

1. Beschreibe, was sich der Agent merken soll, z. B. „Vorlieben einzelner Kunden, getroffene Entscheidungen und offene Punkte pro Projekt“.
2. Der Memory-Assistent (das Assistenzmodell aus den Einstellungen) schlägt zwei bis fünf Dateien mit Inhalt vor, darunter eine `README.md`, die dem Agenten die Struktur erklärt. Er erfindet keine Fakten, sondern lässt Platzhalter.
3. Prüfe und bearbeite die Vorschläge, wähle den Raum und klicke **In Raum speichern**. Der Agent wird dabei auf diesen Raum eingestellt.

Gespeichert wird erst nach deiner Bestätigung. Der Vorschlag kostet eine Anfrage an das Modell der Assistenten.

Die vorgeschlagenen Dateien entstehen in der Sprache der Oberfläche, solange deine Beschreibung keine andere verlangt. Dateinamen bleiben Englisch.

## Anwendungsfälle {#anwendungsfaelle}
<!-- keywords: anwendungsfälle, beispiele, kunden, projekt, lernen, präferenzen -->

- **Kundenbetreuung:** Ein Agent merkt sich Vorlieben und frühere Anliegen je Kunde in `kunden/<name>.md`.
- **Fortlaufende Projekte:** Ein Projekt-Agent führt `entscheidungen.md` und `offene-punkte.md` und knüpft beim nächsten Lauf daran an.
- **Lernende Prüfung:** Ein Review-Agent sammelt wiederkehrende Fehler in `fehlerkatalog.md` und prüft künftig gezielt darauf.
- **Lange Recherchen:** Mit *Pro Lauf* hält ein Agent Zwischenergebnisse fest, statt sie im Verlauf zu verlieren.

## Hinweise und Grenzen {#hinweise}
<!-- keywords: grenzen, sicherheit, geheimnisse, passwörter, kosten, memory tool name -->

- **Keine Geheimnisse:** Was ein Agent aus dem Memory liest, wird Teil der Anfrage an den KI-Anbieter. Speichere keine Passwörter oder Schlüssel.
- **Kosten:** Memory-Zugriffe sind Tool-Runden. Große Dateien kosten bei jedem Lesen Tokens; halte Dateien klein und gut gegliedert.
- **Pfade:** Alle Pfade liegen unter `/memories`. Pfade außerhalb davon werden abgelehnt.
- **Reservierter Name:** Der Tool-Name `memory` ist für das Memory-Tool vergeben; ein eigenes Tool dieses Namens kann nicht zusammen mit Memory verwendet werden.
- **Max. Tool-Runden:** Jede Memory-Aktion zählt als Tool-Aufruf. Erhöhe das Limit, wenn ein Agent viel liest und schreibt.

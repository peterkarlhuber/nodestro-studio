# Nodestro Assistant

Der Nodestro Assistant ist ein Chat, der dir überall in Nodestro hilft. Er beantwortet Fragen zur Bedienung auf Grundlage dieser Dokumentation, bespricht Workflows, Agenten, Tools, Memory, Wissen und Ausführungen, die du ihm ausdrücklich zeigst, und bereitet auf Wunsch eine Übergabe an den Workflow-Architekten, den Agenten-Entwurf oder die Tool-Erstellung vor. Er ändert selbst nichts.

## Überblick {#ueberblick}
<!-- keywords: assistant, assistent, chat, öffnen, panel, seitenleiste, tastenkürzel, ctrl j, breit, hilfe -->

Den Assistant öffnest du mit **Assistant** oben rechts in der Kopfzeile oder mit **Strg+J** (macOS: **⌘J**). Er erscheint als Seitenleiste rechts; dieselbe Schaltfläche oder **Schließen** blendet ihn wieder aus. Mit **Breiter** bekommt der Chat mehr Platz, auf kleinen Bildschirmen liegt er über der Seite.

Der Chat bleibt erhalten, während du zwischen Seiten wechselst, und auch nach einem Neuladen. Die Antworten erscheinen live, Markdown mit Listen, Tabellen und Codeblöcken wird formatiert. Während eine Antwort entsteht, siehst du, was der Assistant gerade tatsächlich tut: Dokumentation durchsuchen, Abschnitte lesen, Anhänge verarbeiten, Antwort erstellen oder eine Übergabe vorbereiten.

Der Assistant nutzt das **Modell für die Assistenten** aus den [Einstellungen](/docs/einstellungen#modelle) und den Zugang zu dessen Anbieter. Ist dieser Anbieter nicht eingerichtet, kannst du den Chat öffnen, aber keine Frage senden.

## Fragen zur Dokumentation {#fragen}
<!-- keywords: frage, dokumentation, quellen, zitat, link, erfunden, nicht dokumentiert, wie geht -->

Fragen wie „Wie teste ich meinen Agenten?“ oder „Was ist der Unterschied zwischen Wissen und Memory?“ beantwortet der Assistant aus dieser integrierten Dokumentation. Er sucht gezielt die passenden Abschnitte, liest sie und verweist in der Antwort mit Links darauf. Unter der Antwort stehen die gelesenen Abschnitte als **Quellen**; ein Klick öffnet sie.

Die Dokumentation ist seine einzige Wissensquelle über Nodestro. Findet er etwas dort nicht, sagt er das ausdrücklich, statt eine Funktion zu erfinden. Allgemeines Wissen, etwa über Prompt-Gestaltung, kennzeichnet er als solches.

## Objekte anhängen {#anhaenge}
<!-- keywords: anhängen, anhang, kontext, büroklammer, besprechen, workflow, agent, tool, memory, wissen, ausführung, trace -->

Damit der Assistant ein konkretes Objekt besprechen kann, hängst du es an. Dafür gibt es zwei Wege:

- **Mit Assistant besprechen** in der jeweiligen Ansicht: im Workflow-Editor, im Agenten-Inspektor, in der Agentenbibliothek, bei einem Tool, bei einer Ausführung, in einem Memory-Raum und bei einer Wissensdatei.
- Die **Büroklammer** im Eingabefeld öffnet eine Auswahl aller Workflows, Agenten-Vorlagen, Tools, Memory-Räume, Wissensdateien und Ausführungen.

Was der Assistant bekommt, hängt von der Art ab:

| Art | Inhalt |
| --- | --- |
| Workflow | Agenten, Verbindungen, Ausführungsreihenfolge, Einstellungen und das Ergebnis der [Prüfung vor dem Start](/docs/workflows#pruefung) |
| Agent | die vollständige Konfiguration mit Tools, Wissen und Konfigurationshinweisen |
| Tool | Code, Tests, Eingabeschema, Python-Bibliotheken mit Freigaben und wo es verwendet wird |
| Memory | die Dateiliste; den Inhalt nur von Dateien, die du ausdrücklich auswählst |
| Wissen | Name, Beschreibung und Typ; den Text nur, wenn du **Inhalt mitsenden** einschaltest |
| Ausführung | Status, Eingabe, Ergebnisse, Fehler, Tool-Aufrufe, Tokens und Kosten jedes Agenten |

Du kannst mehrere Objekte gleichzeitig anhängen und jedes einzeln mit **×** entfernen. Ein Anhang bleibt aktiv, bis du ihn entfernst, und geht mit jeder weiteren Nachricht mit. Die Anhänge stehen immer sichtbar über dem Eingabefeld.

## Kontextvorschläge {#vorschlaege}
<!-- keywords: vorschlag, vorgeschlagen, aktueller workflow, automatisch, bestätigen, ignorieren -->

Ist der Assistant geöffnet, schlägt er das Objekt der aktuellen Ansicht als Kontext vor, zum Beispiel den Workflow im Editor oder die geöffnete Ausführung. Vorschläge sind gestrichelt umrandet und mit **Vorschlag** markiert; angehängte Objekte haben einen durchgezogenen Rahmen.

Ein Vorschlag wird nicht gesendet. Erst **Hinzufügen** macht ihn zum Anhang; **Ignorieren** blendet ihn für diesen Chat aus. Die Vorschläge entstehen ohne KI-Aufruf allein aus der Ansicht, die du gerade offen hast.

## Versionen und ungespeicherte Änderungen {#versionen}
<!-- keywords: version, entwurf, ungespeichert, gespeichert, geändert, kontext aktualisieren, veraltet, gelöscht -->

Beim Anhängen hält Nodestro den Stand des Objekts fest. Jede Nachricht merkt sich genau die Stände, mit denen sie gesendet wurde; unter deiner Nachricht siehst du sie als **Gesendet mit**. Ein Klick zeigt, was der Assistant tatsächlich bekommen hat.

Ändert sich ein angehängtes Objekt danach, wird der Anhang als **geändert** markiert. **Kontext aktualisieren** übernimmt den neuen Stand für die folgenden Nachrichten. Frühere Nachrichten und Antworten bleiben unverändert und behalten ihren damaligen Stand. Wird ein Objekt gelöscht, steht der Anhang auf **nicht mehr vorhanden**; der Chat funktioniert weiter.

Hat der Workflow im Editor ungespeicherte Änderungen, entscheidest du selbst: **Gespeicherte Version** sendet den zuletzt gespeicherten Stand, **Ungespeicherten Entwurf** den aktuellen Stand des Editors. Ein Entwurf ist im Chat als **Entwurf** gekennzeichnet. Änderst du den Editor danach weiter, erscheint auch er als geändert.

## Analysen {#analyse}
<!-- keywords: analyse, verbessern, prüfen, fehler finden, optimieren, kosten senken, ausgeführt, getestet -->

Mit angehängten Objekten kann der Assistant zum Beispiel einen Workflow auf Schwachstellen untersuchen, einen System-Prompt verbessern, erklären, warum eine Ausführung fehlgeschlagen ist, oder bei einem Tool fehlende Tests aufzeigen.

Er arbeitet nur mit den Daten, die du angehängt hast. Er führt nichts aus und testet nichts, und er behauptet das auch nicht. Ob eine Verbesserung wirkt, prüfst du selbst, zum Beispiel mit dem [Agenten-Test](/docs/agenten#agent-testen) oder einem neuen Lauf.

## Übergabe an andere Funktionen {#uebergabe}
<!-- keywords: übergabe, übernehmen, architekt, umsetzen, agent erstellen, tool erstellen, vorschlag umsetzen -->

Bittest du ausdrücklich darum, eine Verbesserung umzusetzen, bereitet der Assistant eine Übergabe vor. Sie erscheint als Karte in der Antwort. Mit dem Knopf auf der Karte öffnest du die passende vorhandene Funktion, bereits mit der Beschreibung ausgefüllt:

- **[Workflow-Architekt](/docs/ki-architekt)**: einen angehängten Workflow überarbeiten oder einen neuen entwerfen.
- **[Agenten-Entwurf](/docs/agenten#ki-entwurf)**: einen neuen Agenten für einen angehängten Workflow beschreiben.
- **Tool-Erstellung** unter *Tools → Von KI erstellen*: ein neues Tool mit dem Coding Agent schreiben lassen.

Gestartet wird dort erst, wenn du es auslöst, und du prüfst das Ergebnis wie gewohnt, bevor sich etwas ändert. Der Assistant selbst verändert keine Workflows, führt keine Tools aus und übernimmt nichts ohne deine Bestätigung.

## Chats verwalten {#verlauf}
<!-- keywords: verlauf, chats, gespräch, neuer chat, umbenennen, löschen, titel, fortsetzen -->

**Neuer Chat** beginnt ein neues Gespräch, **Verlauf** zeigt alle bisherigen. Dort öffnest du einen Chat, um ihn fortzusetzen, benennst ihn um oder löschst ihn. Den Titel bildet Nodestro ohne KI-Aufruf aus deiner ersten Frage.

Chats werden lokal in der Nodestro-Datenbank gespeichert und sind Teil von [Backup und Wiederherstellung](/docs/einstellungen#backup). Sie werden nie übersetzt; ein Chat bleibt in der Sprache, in der er geführt wurde.

## Datenschutz und Sicherheit {#datenschutz}
<!-- keywords: datenschutz, sicherheit, api-schlüssel, geheimnis, passwort, maskiert, gesendet, prompt injection, anweisungen -->

An das Modell geht nur, was du schreibst, was du angehängt hast, und die Abschnitte der Dokumentation, die der Assistant liest. Das gerade geöffnete Objekt wird nie automatisch gesendet.

API-Schlüssel, Passwörter, Tokens und vergleichbare Werte werden vor dem Senden durch Platzhalter ersetzt, auch dein hinterlegter API-Schlüssel. Ein Hinweis im Anhang zeigt, wenn etwas ersetzt wurde. Was genau gesendet wurde, siehst du mit einem Klick auf einen Anhang oder auf **Gesendet mit**.

Sehr große Objekte werden gekürzt; der Anhang ist dann als **teilweise** markiert, und der Assistant weiß, dass er nur einen Teil gesehen hat. Anweisungen in angehängten Inhalten, etwa in einer Wissensdatei oder einer Tool-Ausgabe, behandelt der Assistant als Daten, nicht als Anweisungen an sich.

## Kosten {#kosten}
<!-- keywords: kosten, tokens, nutzung, preis, chat kosten, abgerechnet -->

Jede Antwort ist eine oder mehrere Anfragen an das Modell. Unter jeder Antwort stehen ihre Tokens und geschätzten Kosten, im Kopf des Chats die Summe des Chats. In der [Nutzungsübersicht](/docs/nutzung) erscheinen alle Anfragen unter der Herkunft **Nodestro Assistant**, jede genau einmal.

Bei einer abgebrochenen Antwort sind Teile bereits angefallen; diese werden geschätzt und als **geschätzt** gekennzeichnet.

## Abbrechen und Fehler {#fehler}
<!-- keywords: abbrechen, stopp, fehler, erneut versuchen, wiederholen, schlüssel ungültig, modell nicht verfügbar, verbindung -->

**Stopp** bricht eine laufende Antwort ab; was bis dahin geschrieben wurde, bleibt stehen. Schlägt eine Antwort fehl, nennt der Assistant den Grund, zum Beispiel einen fehlenden oder ungültigen API-Schlüssel, ein nicht verfügbares Modell, eine unterbrochene Verbindung oder zu viel Kontext. Mit **Erneut versuchen** wiederholst du die letzte Antwort.

Der Chat geht dabei nie verloren. Wird Nodestro während einer Antwort beendet, ist sie nach dem Neustart als unterbrochen markiert.

## Sprache {#sprache}
<!-- keywords: sprache, deutsch, englisch, antwort sprache, übersetzen -->

Der Assistant antwortet in der Sprache der Oberfläche (siehe [Sprache](/docs/einstellungen#sprache)), es sei denn, du bittest ausdrücklich um eine andere. Er liest die Dokumentation in derselben Sprache. Technische Bezeichner wie Tool-Namen, Feldnamen und Code bleiben englisch.

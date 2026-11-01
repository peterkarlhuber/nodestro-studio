# Einführung

Nodestro ist ein visuelles Studio für Multi-Agent-Workflows. Du verbindest KI-Agenten auf einer Arbeitsfläche zu einer Pipeline, startest sie und verfolgst jeden Schritt. Dieses Kapitel erklärt die Grundbegriffe und führt dich durch deinen ersten Workflow.

## Was ist Nodestro? {#ueberblick}
<!-- keywords: überblick, idee, n8n, orkexa, library, anbieter, anthropic, claude, openai, gemini -->

Nodestro (aus *Node* und *Maestro*) macht die Python-Library **Orkexa** über eine grafische Oberfläche nutzbar. Jeder **Knoten** auf der Arbeitsfläche ist ein Agent: ein KI-Modell von Anthropic, OpenAI, Google Gemini oder einem eigenen Server, mit eigener Rolle, eigenen Werkzeugen und eigenem Wissen. Über **Verbindungen** reichen die Agenten ihre Ergebnisse weiter.

Typische Einsatzzwecke:

- **Recherche und Bericht:** Ein Agent sammelt Fakten, ein zweiter rechnet nach, ein dritter schreibt den Bericht.
- **Parallele Perspektiven:** Mehrere Agenten bearbeiten dieselbe Eingabe gleichzeitig (z. B. Zielgruppe und Gliederung), ein letzter Agent führt alles zusammen.
- **Strukturierte Auswertung:** Ein Agent liefert ein geprüftes JSON-Objekt mit festen Feldern, das andere Programme weiterverarbeiten können.
- **Qualitätsgesicherte Texte:** Ein Judge prüft das Ergebnis anhand von Kriterien und lässt den Agenten nachbessern.

Nodestro läuft lokal auf deinem Rechner. Workflows, Ausführungen, Wissen und Memory liegen in einer SQLite-Datenbank. Daten verlassen den Rechner nur für Anfragen an die KI-Anbieter, die du eingerichtet hast.

## Grundbegriffe {#begriffe}
<!-- keywords: glossar, begriffe, knoten, lauf, run, trace, token -->

| Begriff | Bedeutung |
|---|---|
| **Workflow** | Ein gespeicherter Ablauf aus Knoten und Verbindungen. |
| **Knoten** | Ein Baustein auf der Arbeitsfläche: *Start*, *Agent* oder *Ergebnis*. |
| **Agent** | Ein KI-Modell mit System-Prompt, Aufgabe und optional Tools, Wissen, Memory und Ausgabeformat. |
| **Verbindung** | Leitet das Ergebnis eines Knotens an einen nachfolgenden Knoten weiter. |
| **Lauf (Ausführung)** | Eine einzelne Ausführung eines Workflows mit einer bestimmten Eingabe. |
| **Trace** | Das vollständige Protokoll eines Laufs: Eingaben, Ergebnisse, Tool-Aufrufe, Fehler, Zeiten, Tokens und Kosten. |
| **Tool** | Eine Funktion, die ein Agent selbst aufrufen kann, z. B. ein Taschenrechner oder die Websuche. |
| **Wissen** | Hochgeladene Dateien (PDFs, Bilder, Texte), die Agenten als Hintergrundmaterial nutzen. |
| **Memory** | Notizen, die ein Agent selbst anlegt und bei späteren Aufgaben wieder liest. |
| **Token** | Die Abrechnungseinheit der Modelle: ungefähr ein Wortteil. 1.000 Tokens entsprechen grob 700 Wörtern. |
| **Budget** | Eine Kostengrenze pro Lauf; wird sie überschritten, bricht der Lauf ab. |

## Erste Schritte {#erste-schritte}
<!-- keywords: anleitung, tutorial, quickstart, erster workflow, schnellstart -->

So erstellst du in wenigen Minuten deinen ersten Workflow:

1. **KI-Anbieter einrichten.** Öffne *Einstellungen → KI-Anbieter* und trage den API-Schlüssel eines Anbieters ein, etwa von Anthropic (oder setze vor dem Start eine Umgebungsvariable wie `ANTHROPIC_API_KEY`). Nutzt du einen anderen Anbieter, stelle dort auch das Standardmodell um. Ohne eingerichteten Anbieter kannst du alles bearbeiten, aber nichts ausführen.
2. **Workflow anlegen.** Klicke unter *Workflows* auf **Neuer Workflow**, gib einen Namen ein und bestätige mit **Anlegen und öffnen**. Der Editor öffnet sich mit drei Knoten: *Start*, *Neuer Agent* und *Ergebnis*, bereits verbunden.
3. **Agent konfigurieren.** Klicke auf den Agenten. Rechts erscheint der Inspektor. Gib dem Agenten einen Namen und schreibe einen System-Prompt, z. B. „Du bist ein erfahrener Lektor. Verbessere Rechtschreibung und Stil, ohne den Inhalt zu ändern.“
4. **Starten.** Klicke **Workflow starten**, gib einen Text ein und bestätige mit **Starten**. Nodestro speichert den Workflow automatisch.
5. **Zusehen.** In der *Ausführungsübersicht* unter der Arbeitsfläche siehst du live, was der Agent schreibt, welche Tools er aufruft, wie viele Tokens er verbraucht und was es kostet.
6. **Nachvollziehen.** Über **Details** gelangst du zur vollständigen Ausführung mit zeitlichem Ablauf.

> **Tipp:** Unter deinen Workflows findest du die Galerie mit 24 [Beispiel-Workflows](/docs/beispiele) für typische Aufgaben, zum Beispiel **Finanzanalyse** und **Blogartikel**. Eine Vorschau ist kostenlos; übernommene Beispiele sind eigene Kopien, die du frei ändern kannst.

## Die Oberfläche {#oberflaeche}
<!-- keywords: navigation, seitenleiste, menü, theme, dunkel, hell, layout -->

Die **Seitenleiste** links folgt dem Arbeitsablauf: erstellen, ausführen und prüfen, dann automatisieren.

- **Erstellen:** *Workflows* (deine Abläufe), *Agenten* (wiederverwendbare Vorlagen), *Tools*, *Wissen* und *Memory*.
- **Ausführen & prüfen:** *Ausführungen* (alle Läufe im Detail), *Freigaben* (Entscheidungen, auf die Läufe warten) und *Nutzung* (Tokens und Kosten über die Zeit).
- **Automatisieren & testen:** *Testreihen*, *Stapelläufe* und *Zeitpläne*.
- **Hilfe:** diese *Dokumentation* und die *Willkommen*-Seite.

Unten findest du die *Einstellungen*. Oben rechts wechselst du zwischen dunklem und hellem Farbschema; die Wahl wird im Browser gespeichert. Ist der Anbieter des Standardmodells nicht eingerichtet, erscheint dort ein Hinweis, der direkt zu den Einstellungen führt.

**Hilfe direkt an der Stelle:** Hinter vielen Bedienelementen steht ein kleines **?**-Symbol. Fahre mit der Maus darüber, fokussiere es mit der Tabulatortaste oder tippe es auf Touch-Geräten an: Es erscheint eine kurze Erklärung, oft mit einem Link zum passenden Abschnitt dieser Dokumentation. Das Buch-Symbol neben Seitentiteln öffnet das zugehörige Kapitel. Mit **Esc** schließt du eine Erklärung wieder.

Status werden überall als Text und Symbol angezeigt, nie nur als Farbe. Alle Bedienelemente sind auch per Tastatur erreichbar.

## Suche {#suche}
<!-- keywords: suche, suchen, finden, strg+k, cmd+k, schnellsuche -->

Das Suchfeld oben in der Titelleiste (oder **Strg+K**, auf dem Mac **⌘K**) durchsucht Workflows, Agenten in Workflows, die Agenten-Bibliothek, Tools, Wissen und diese Dokumentation. Die Treffer sind nach Art gruppiert; Favoriten erscheinen mit Stern.

Mit den Pfeiltasten wählst du einen Treffer, **Enter** öffnet ihn dort, wo er hingehört: einen Agenten im Editor seines Workflows, eine Vorlage in der Agenten-Bibliothek, ein Tool in der Tool-Bibliothek, eine Wissensdatei in der Liste und einen Abschnitt in der Dokumentation. Groß- und Kleinschreibung und Akzente spielen keine Rolle.

## Wo liegen meine Daten? {#daten}
<!-- keywords: datenschutz, speicherort, datenbank, sqlite, backup, nodestro_data_dir, ~/.nodestro -->

Alle Daten liegen in einer SQLite-Datenbank im Datenverzeichnis, standardmäßig `~/.nodestro` (änderbar mit `--data-dir` oder der Umgebungsvariable `NODESTRO_DATA_DIR`). Dort befinden sich:

- `nodestro.db` mit Workflows, Agenten-Vorlagen, Ausführungen, Einstellungen, Wissensdateien, Suchindex und Memory-Räumen,
- der Ordner `tools` mit eigenen und KI-erstellten Tools.

Zum **Sichern** kopierst du das Datenverzeichnis, während Nodestro beendet ist. An den Anbieter eines Agenten gehen nur die Inhalte, die der Agent für seine Anfrage braucht: System-Prompt, Aufgabe, zugewiesenes Wissen, Memory-Inhalte, die er liest, und Tool-Ergebnisse. Die API-Schlüssel werden nie in der Oberfläche angezeigt.

## Die Desktop-App {#desktop}
<!-- keywords: desktop, app, fenster, linux, installation, startlink, tauri -->

Neben dem Befehl `nodestro` gibt es Nodestro als Desktop-App (Vorschau für Linux x86_64, noch nicht signiert). Sie bringt ihr eigenes Python mit; außer WebKitGTK 4.1 (`libwebkit2gtk-4.1-0`) muss nichts installiert sein. Entpacken Sie das Archiv und starten Sie `nodestro-desktop`.

- Die App verwendet dasselbe Datenverzeichnis wie der Befehl (`~/.nodestro` oder `NODESTRO_DATA_DIR`). Es kann immer nur eines von beiden darauf zugreifen.
- Nur das Fenster der App kann dieses Nodestro verwenden. Andere Programme auf dem Computer und Webseiten im Browser werden abgewiesen (*Dieses Nodestro gehört zur Desktop-App, die es gestartet hat*). Der Startlink des Fensters gilt nur einmal; für ein neues Fenster starten Sie die App neu.
- Links zu anderen Websites öffnen sich im Browser.
- Das Schließen des Fensters beendet Nodestro. Endet es unerwartet, sagt das Fenster es und nennt die Protokolldatei.
- KI-erstellte Tools laufen isoliert in der eingebauten Linux-Sandbox; dafür muss nichts installiert werden (siehe [Tools](/docs/tools#sandbox)). Meldet *Einstellungen → Sandbox*, dass sie nicht verfügbar ist, laufen sie nur mit Docker.
- Versionen für macOS und Windows gibt es noch nicht.

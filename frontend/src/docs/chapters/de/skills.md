# Skills

Skills sind Anleitungen im offenen Agent-Skills-Format, die ein Agent lädt, wenn seine Aufgabe sie braucht. Dieses Kapitel erklärt, was ein Skill enthält, wie du Skills importierst und bearbeitest und wie Nodestro sie absichert.

## Was ein Skill ist {#ueberblick}
<!-- keywords: Skill, Agent Skills, SKILL.md, Anleitung, Front Matter, Kopfdaten, Referenzen -->

Ein Skill ist ein Ordner mit einer Datei `SKILL.md` und optional weiteren Dateien in `scripts/`, `references/` und `assets/`. `SKILL.md` beginnt mit Kopfdaten (Name, Beschreibung und optionale Felder wie Lizenz oder Kompatibilität), danach folgt die Anleitung in Markdown. Die Beschreibung sagt dem Modell, wann der Skill nützlich ist.

Alle Skills des Arbeitsbereichs stehen auf der Seite [Skills](/skills). Jede Karte zeigt Status, Version, Herkunft (eigener, importiert oder mitgeliefert) und ob der Skill Skripte enthält. Einem Agenten weist du einen Skill in einer festen Version zu, wie in der [Agentenbibliothek](/docs/agenten#bibliothek) beschrieben; eine neuere Version wird nie automatisch verwendet.

## Einen Skill importieren {#import}
<!-- keywords: importieren, ZIP, SKILL.md, Prüfbericht, Probelauf, neue Version -->

Wähle **Skill importieren** und dann eine ZIP-Datei mit einem Skill-Ordner oder eine einzelne `SKILL.md`. Nodestro prüft die Datei zuerst und speichert noch nichts. Der Prüfbericht nennt **Fehler**, die den Import verhindern, und **Warnungen**, die nur informieren, etwa über einen Namen, der nicht der Spezifikation folgt, oder über Skripte. Darunter siehst du Name, Beschreibung, Anleitung und die Dateien, die der Import speichern würde.

Gibt es schon einen Skill mit demselben Namen, speichert der Import die Datei als nächste Version dieses Skills, statt einen zweiten anzulegen.

## Versionen, Bearbeiten und Status {#versionen}
<!-- keywords: Version, bearbeiten, kopieren, umbenennen, exportieren, aktivieren, deaktivieren, archivieren, löschen -->

Jede Änderung wird als neue Version gespeichert; Speichern ohne Änderung behält die Version. In den Details eines Skills bearbeitest du den Text der `SKILL.md` (die übrigen Dateien bleiben, wie sie sind), siehst ältere Versionen an, erkennst, welche Agenten den Skill verwenden, und lädst jede Version als ZIP-Datei herunter.

Der Name eines Skills lässt sich durch Bearbeiten nicht ändern: Kopiere den Skill stattdessen unter einem neuen Namen. Ein **deaktivierter** Skill bleibt zugewiesen, aber Agenten, die ihn nutzen, laufen erst wieder, wenn du ihn aktivierst. Einen Skill, den Agenten noch verwenden, kannst du nicht löschen; **archiviere** ihn stattdessen. Archivieren und Löschen dürfen Administratoren.

## Sicherheit {#sicherheit}
<!-- keywords: Sicherheit, nicht vertrauenswürdig, Skripte, allowed-tools, Zugangsdaten, Prompt Injection -->

Ein importierter Skill stammt aus einer unbekannten Quelle. Nodestro gibt seine Anleitung dem Modell als nicht vertrauenswürdigen Inhalt, und Skripte in einem Skill werden **nie ausgeführt**. Ein Skill gewährt nie Tools: Das Feld `allowed-tools` wird angezeigt, aber ignoriert; Tools kommen allein aus den Einstellungen des Agenten. Prüfe den Inhalt eines importierten Skills, bevor du ihn mit Tools nutzt, die Daten schreiben oder ändern. Scheint eine Datei Zugangsdaten zu enthalten, warnt der Prüfbericht; entferne sie, bevor du den Skill teilst oder exportierst.

## Skill-Gruppen {#gruppen}
<!-- keywords: Gruppe, Skill-Gruppe, Gruppe hinzufügen, Mitglieder, Abteilung -->

Eine Gruppe bündelt Skills, die oft zusammen gebraucht werden, etwa alle Skills einer Abteilung. Auf der Seite [Skills](/skills) wechselst du zu **Gruppen**, um Gruppen anzulegen, zu bearbeiten und zu löschen und ihre Skills auszuwählen.

In den Einstellungen eines Agenten fügt **Gruppe hinzufügen** jeden aktiven Skill der Gruppe hinzu, den der Agent noch nicht hat: jeweils in seiner aktuellen Version und bei Bedarf geladen. Deaktivierte und archivierte Skills sowie Skills, die der Agent schon hat, werden übersprungen. Die Gruppe ist nur eine Kennzeichnung: Jeder Skill bleibt einzeln zugewiesen, und eine spätere Änderung der Gruppe ändert den Agenten nicht.

## Viele Skills: Vorauswahl {#vorauswahl}
<!-- keywords: Vorauswahl, viele Skills, Grenze, 100, am besten passend, Bewertung, BM25 -->

Ein Agent kann bis zu 100 Skills haben. Solange höchstens 20 davon bei Bedarf geladen werden, bietet jeder Schritt dem Agenten alle an. Bei mehr als 20 bietet jeder Schritt nur die 8 Skills an, die am besten zur Aufgabe passen, dazu jeden Skill mit **Immer** und jeden Skill, den ein Orchestrator empfohlen hat. Nodestro vergleicht die Aufgabe mit Name und Beschreibung jedes Skills; eine klare Beschreibung hilft also.

In den Details eines Laufs zeigt **Skill-Auswahl** für jeden Schritt, welche Skills angeboten wurden und ob es eine Vorauswahl gab. Bei einer Vorauswahl steht dort auch die Bewertung jedes Skills.

## Empfehlungen des Orchestrators {#empfehlungen}
<!-- keywords: Orchestrator, Empfehlung, empfohlene Skills, Team, Teamlauf -->

Ein Orchestrator kann Skills empfehlen, wenn er ein Team startet. Den Agenten des Teams werden diese Skills dann immer angeboten, sofern sie sie haben. Eine Empfehlung weist nie einen Skill zu: Ein empfohlener Skill, den ein Agent nicht hat, steht in der Skill-Auswahl als nicht zugewiesen. Die Details eines Teamlaufs zeigen die empfohlenen Skills oben an.

## Nutzung {#nutzung}
<!-- keywords: Nutzung, Statistik, geladen, angeboten, Erfolgsquote, Prüfungen, zuletzt genutzt -->

Auf der Seite [Skills](/skills) zeigt **Nutzung** für die letzten 7, 30 oder 90 Tage, wie oft jeder Skill angeboten und geladen wurde, in wie vielen Läufen, wie viele dieser Läufe erfolgreich waren, wie viele Qualitätsprüfungen bestanden wurden und wann der Skill zuletzt genutzt wurde. Die Zahlen sind ein Hinweis, kein Beweis: Ein Skill, der in einem erfolgreichen Lauf geladen wurde, hat den Erfolg nicht unbedingt bewirkt.

## Skripte als Tools nutzen {#skripte}
<!-- keywords: Skript, Tool, Coding Agent, Sandbox, Docker, freigeben, prüfen, Herkunft -->

Skripte in einem Skill werden nie ausgeführt. Um eines trotzdem zu nutzen, wähle **Als Tool nutzen …** neben der Datei in `scripts/`. Der Coding Agent schreibt dann auf Grundlage des Skripts ein Tool mit Tests. Die Tests laufen nur in der isolierenden Docker-Sandbox; ohne sie startet nichts. Danach prüft eine Person Code und Tests auf der Seite [Tools](/tools) und gibt das Tool frei. Bis dahin kann kein Agent es nutzen. Das Tool zeigt, aus welchem Skill-Skript es stammt.

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

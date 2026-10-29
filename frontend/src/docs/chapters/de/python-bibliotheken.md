# Python-Bibliotheken

Eigene und KI-erstellte Tools dürfen Bibliotheken von Drittanbietern wie `numpy`, `pandas`, `scipy` oder `requests` verwenden. Dieses Kapitel erklärt, wie Nodestro sie erkennt, warum du jede Bibliothek ausdrücklich freigibst und wie die getrennten Python-Umgebungen funktionieren.

## Überblick {#ueberblick}
<!-- keywords: bibliotheken, pakete, pypi, numpy, pandas, drittanbieter, abhängigkeiten, dependencies, uv -->

Die Standardbibliothek von Python reicht für viele Tools. Brauchst du mehr, gilt:

1. **Erkennen:** Nodestro liest die Importe im Code des Tools und ermittelt daraus die nötigen Pakete. Dabei wird nichts heruntergeladen.
2. **Freigeben:** Bevor etwas installiert wird, siehst du jedes Paket mit Version und gibst es frei. Ohne Freigabe wird nichts installiert.
3. **Installieren:** Nodestro installiert genau die freigegebenen Versionen mit dem Paketwerkzeug **uv** in eine eigene Umgebung im Datenordner.
4. **Ausführen:** Das Tool läuft in der Sandbox mit dem Python dieser Umgebung.

Das Python, mit dem Nodestro selbst läuft, bleibt immer unverändert. Workflows, deren Tools nur die Standardbibliothek nutzen, brauchen nichts davon und funktionieren wie bisher.

> **Wichtig:** Die Freigabe einer Bibliothek gibt nicht den Code eines Tools frei. Code und Tests prüfst und gibst du wie gewohnt frei (siehe [Freigabe](/docs/tools#freigabe)).

## Wie Bibliotheken erkannt werden {#erkennung}
<!-- keywords: import, from import, erkennung, modulname, paketname, pil, pillow, script, pep 723, dependencies, mehrdeutig -->

Nodestro wertet `import x` und `from x import y` aus:

- **Standardbibliothek** (`math`, `json`, `datetime` …) und das Modul `tool` in den Tests brauchen nichts.
- **Bekannte Module** werden dem richtigen Paket zugeordnet, auch wenn die Namen verschieden sind: `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- **Unbekannte Module** werden nicht geraten. Nodestro meldet sie und bittet um eine ausdrückliche Angabe.
- **Dynamische Importe** wie `importlib.import_module(name)` lassen sich nicht auflösen und werden gemeldet.
- Importe in einem `try: … except ImportError:` gelten als optional.

Pakete und Versionsbereiche gibst du ausdrücklich in einem Kopf am Anfang des Codes an (Format „inline script metadata“):

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

Erlaubt sind nur Paketname und Versionsangabe, keine Links oder lokalen Pfade.

## Freigabe {#freigabe}
<!-- keywords: freigabe, freigeben, genehmigen, version, indirekt, transitive, übersicht, installieren -->

Mit **Prüfen und freigeben** löst Nodestro die Versionen auf (dabei werden nur Paketinformationen geladen) und zeigt eine Übersicht:

| Spalte | Bedeutung |
|---|---|
| **Paket** und **Version** | Die genaue Version, die installiert würde |
| **Art** | *direkt* (ein Tool importiert es), *indirekt* (ein anderes Paket braucht es) oder *Laufzeit* (bringt Nodestro immer mit) |
| **Benötigt von** | Die Tools bzw. Pakete, die es brauchen |
| **Status** | *Neu*, *Freigegeben*, *Änderung alt → neu* oder *Entfällt* |

Prüfe die Liste und klicke **Freigeben und installieren**. Bibliotheken von Drittanbietern können auf Dateien und das Netzwerk zugreifen: Gib nur Pakete frei, die du kennst.

Nodestro speichert jede Freigabe mit Paket, Version und Zeitpunkt. Solange sich nichts ändert, fragt Nodestro nicht erneut. Eine neue Freigabe ist nötig, wenn:

- ein Tool ein **neues Paket** braucht,
- sich eine **Anforderung** ändert (z. B. ein neuer Versionsbereich) und dadurch eine andere Version nötig wird,
- sich die **Python-Version** geändert hat,
- die Freigaben von einem **anderen Computer** oder aus einem **Import** stammen.

Nodestro aktualisiert nie still: Bereits freigegebene Versionen werden beim erneuten Auflösen bevorzugt, und jede andere Version erscheint als *Änderung*.

## Bibliotheken im Workflow {#workflow}
<!-- keywords: workflow, umgebung, inspektor, status, starten, lauf, eigene umgebung, installieren -->

Jeder Workflow mit Bibliotheken bekommt eine **eigene Umgebung** mit eigenen Freigaben. Im Inspektor des Workflows (ohne gewählten Knoten) zeigt der Abschnitt **Python-Bibliotheken**:

- den **Status**: *Freigabe nötig*, *Installation ausstehend*, *Wird installiert*, *Freigegeben und installiert* oder *Installation fehlgeschlagen*,
- jedes benötigte Paket mit installierter Version und den Tools, die es nutzen,
- die Aktionen **Prüfen und freigeben**, **Installieren** und **Versionen ansehen**,
- den **Änderungsverlauf** mit Freigaben, Installationen und Importen.

Die [Prüfung](/docs/workflows#pruefung) meldet fehlende Freigaben als Fehler. Ein Workflow startet erst, wenn alle Bibliotheken freigegeben sind. Ist eine freigegebene Umgebung noch nicht installiert (z. B. nach dem Löschen), installiert Nodestro sie beim Start aus den freigegebenen Versionen.

Die Umgebung wird erst angelegt, wenn sie gebraucht wird. Heruntergeladene Pakete liegen in einem gemeinsamen Zwischenspeicher und werden von allen Umgebungen wiederverwendet, sodass eine zweite Umgebung mit denselben Paketen schnell installiert ist.

## Bibliotheken in Tools {#tools}
<!-- keywords: tool, eigenes tool, ki tool, coding agent, testumgebung, tests, ausprobieren, ohne bibliotheken -->

Für die **Tests** eines Tools mit Bibliotheken legt Nodestro eine eigene **Testumgebung** an:

- **Selbst schreiben:** *Prüfen und testen* meldet, welche Bibliotheken das Tool braucht. Die Tests laufen erst, wenn du sie im Abschnitt **Python-Bibliotheken des Tools** freigegeben hast. Danach prüfst du erneut und speicherst.
- **Von KI erstellen:** Schlägt der Coding Agent Bibliotheken vor, wartet der Auftrag mit dem Status *Wartet auf Bibliotheken*. Du siehst die Übersicht und wählst **Bibliotheken freigeben** (installieren, dann testen) oder **Ohne Bibliotheken neu schreiben**. Den Code gibst du danach wie gewohnt separat frei.
- **Ausprobieren** in der Bibliothek nutzt ebenfalls die Testumgebung des Tools.

Die Freigabe für die Tests gilt nicht automatisch für Workflows. Verwendet ein Workflow das Tool, gibst du die Bibliotheken dort frei; die Übersicht zeigt dabei, wo sie bereits freigegeben sind.

Tools mit Bibliotheken laufen mit großzügigeren Limits (60 Sekunden, 2 GB Speicher), weil das Laden von Paketen wie `pandas` Zeit braucht.

## KI-Workflow-Architekt {#architekt}
<!-- keywords: architekt, entwurf, tool entwurf, bibliotheken, nicht installiert -->

Der [KI-Workflow-Architekt](/docs/ki-architekt#tools-freigeben) darf Tool-Entwürfe mit Bibliotheken vorschlagen. Er sammelt die nötigen Pakete und zeigt sie in der Überprüfung des Entwurfs an, **installiert aber nichts**. Beim Testen eines Tool-Entwurfs gibst du die Bibliotheken für die Testumgebung frei; nach dem Übernehmen gibst du sie im Workflow frei.

## Versionen und Reproduzierbarkeit {#versionen}
<!-- keywords: version, lock, reproduzierbar, gepinnt, aktualisieren, upgrade, konflikt -->

Nach der Freigabe speichert Nodestro eine **vollständige Definition** aller Pakete mit genauer Version, auch der indirekten. Eine Umgebung lässt sich daraus jederzeit gleich wiederherstellen. Die Installation erfolgt in einen getrennten Ordner und ersetzt die bisherige Umgebung erst, wenn alles installiert ist und alle Importe funktionieren. Schlägt sie fehl, bleibt die bisherige Umgebung unverändert.

Brauchen zwei Tools eines Workflows unvereinbare Versionen, meldet Nodestro einen **Konflikt** und nennt in den technischen Details die beteiligten Pakete. Passe dann die Versionsangaben im Kopf `# /// script` an.

## Export, Import und Sicherung {#export}
<!-- keywords: export, import, sicherung, backup, anderer computer, portabel, definition -->

- **Export** eines Workflows enthält die Definition der Bibliotheken (Pakete und Versionen), aber keine installierten Dateien.
- **Import** übernimmt die Definition. Die Pakete müssen auf diesem Computer **erneut freigegeben** werden; die Übersicht zeigt die mitgebrachten Versionen.
- **Duplizieren** übernimmt die Versionen ebenfalls, verlangt aber eine eigene Freigabe.
- Eine **Sicherung** enthält Definitionen und Freigaben. Auf demselben Computer gelten die Freigaben nach dem Wiederherstellen weiter, auf einem anderen müssen sie erneut erteilt werden. Die Umgebungen selbst werden bei Bedarf neu installiert.

## Wartung und Bereinigung {#wartung}
<!-- keywords: wartung, bereinigen, aufräumen, speicher, zwischenspeicher, cache, verwaist, löschen, einstellungen -->

In den [Einstellungen](/docs/einstellungen) zeigt der Abschnitt **Python-Umgebungen** die Version von uv und Python, die Größe des Zwischenspeichers und jede Umgebung mit Besitzer, Paketanzahl, Größe und Installationszeit.

- **Umgebung löschen** entfernt die installierten Dateien. Die Freigaben bleiben; die Umgebung wird beim nächsten Bedarf neu installiert.
- **Verwaist** sind Umgebungen, deren Workflow oder Tool gelöscht wurde.
- **Verwaiste bereinigen** löscht alle verwaisten Umgebungen samt Definition und räumt den Zwischenspeicher auf.

Nodestro löscht nie eine Umgebung ohne deine Aktion.

## Probleme lösen {#probleme}
<!-- keywords: fehler, konflikt, nicht gefunden, netzwerk, uv fehlt, docker, installation fehlgeschlagen, protokoll -->

| Meldung | Abhilfe |
|---|---|
| **Für das Modul ist kein Paket bekannt** | Gib das Paket im Kopf `# /// script` an. |
| **Ein Import per Namen lässt sich nicht auflösen** | Importiere das Modul direkt mit `import`. |
| **Das Paket gibt es nicht** | Prüfe die Schreibweise des Paketnamens. |
| **Keine passende Version** / **Konflikt** | Lockere die Versionsangabe oder gleiche sie zwischen den Tools an. |
| **Paketverzeichnis nicht erreichbar** | Prüfe die Internetverbindung; installierte Umgebungen funktionieren auch offline. |
| **uv wurde nicht gefunden** | Installiere Nodestro neu; uv wird mitinstalliert. |
| **Nur in der Prozess-Sandbox** | Tools mit Bibliotheken laufen nicht in der Docker-Sandbox. Stelle die [Sandbox](/docs/einstellungen#sandbox) auf *Python-Prozess* um. |

Bei einer fehlgeschlagenen Installation zeigt das **Protokoll der Installation** die Ausgabe von uv. Mit **Erneut installieren** startest du einen neuen Versuch.

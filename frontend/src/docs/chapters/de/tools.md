# Tools

Tools sind Funktionen, die ein Agent selbst aufrufen kann, um etwas exakt zu berechnen, nachzuschlagen oder auszuführen. Dieses Kapitel erklärt die Tool-Arten, wie du eigene Tools schreibst oder von der KI erstellen lässt und wie Nodestro sie sicher ausführt.

## Wie Tools funktionieren {#ueberblick}
<!-- keywords: tool, funktion, function calling, tool use, arten, eingebaut, eigene, ki-generiert -->

Ein Tool hat einen **Namen**, eine **Beschreibung** und ein **Eingabeschema** (die Parameter). Das Modell sieht diese Angaben und entscheidet, ob ein Aufruf hilft. Ruft es ein Tool auf, führt Nodestro die Funktion aus und gibt das Ergebnis an das Modell zurück. Eine solche Runde heißt **Tool-Runde**; ein Agent kann mehrere hintereinander machen.

Die Seite **Tools** hat drei Bereiche: *Bibliothek*, *Selbst schreiben* und *Von KI erstellen*. Es gibt vier Arten von Tools:

| Art | Herkunft | Ausführung |
|---|---|---|
| **Eingebaut** | Mit Nodestro ausgeliefert, von Hand geschrieben und geprüft | im Nodestro-Prozess |
| **Eigenes Tool** | Von dir unter *Selbst schreiben* erstellt | in der Sandbox |
| **Von KI erstellt** | Vom Coding Agent geschrieben, von dir freigegeben | in der Sandbox |
| **Server-Tools** | Von Anthropic (Websuche, Web-Abruf, Code-Ausführung) | auf den Servern von Anthropic |

Tools aus der Bibliothek weist du im Inspektor eines Agenten zu, Server-Tools schaltest du dort ein (siehe [Tools zuweisen](/docs/agenten#tools)).

## Eingebaute Tools {#eingebaut}
<!-- keywords: calculator, taschenrechner, current_datetime, datum, uhrzeit, days_between, tage, text_statistics -->

| Tool | Zweck | Beispiel-Eingabe |
|---|---|---|
| `calculator` | Rechnet einen Ausdruck exakt aus: `+ - * / // % **`, Klammern, `pi`, `e` und `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Aktuelles Datum, Uhrzeit und Wochentag in einer Zeitzone (Standard *Europe/Vienna*). | `{"timezone": "Europe/Berlin"}` |
| `days_between` | Kalendertage zwischen zwei Daten (negativ, wenn das Ende davor liegt). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Zählt Zeichen, Wörter, Sätze und Absätze eines Textes. | `{"text": "…"}` |

Sprachmodelle rechnen im Kopf fehleranfällig. Gib Agenten, die mit Zahlen arbeiten, den `calculator` und weise im System-Prompt an, ihn zu benutzen.

Die Bibliothek zeigt die Beschreibungen eingebauter Tools in der Sprache der Oberfläche. Das Modell erhält immer die englische Originalbeschreibung, damit sich bestehende Agenten in jeder Sprache gleich verhalten.

## Server-Tools von Anthropic {#server-tools}
<!-- keywords: websuche, web search, web fetch, web-abruf, code execution, code-ausführung, server tools, quellen -->

| Server-Tool | Wirkung | Hinweise |
|---|---|---|
| **Websuche** | Sucht im Web und zitiert die Quellen. | Kostet zusätzlich 10 $ pro 1.000 Suchen; höchstens 5 Suchen pro Anfrage. |
| **Web-Abruf** | Lädt den Inhalt einer Webseite oder eines PDFs über eine URL. | Höchstens 5 Abrufe pro Anfrage. |
| **Code-Ausführung** | Führt Python in einer Sandbox von Anthropic aus. | Nicht zusammen mit Websuche oder Web-Abruf verwenden (die Prüfung warnt). |

Server-Tools laufen bei Anthropic, nicht auf deinem Rechner. Ihre Aufrufe erscheinen ebenfalls in der Ausführung.

## Die Tool-Bibliothek {#bibliothek}
<!-- keywords: bibliothek, ausprobieren, testen, eingabeschema, code ansehen -->

Links stehen alle Tools mit Art und Beschreibung, rechts die Details des gewählten Tools:

- **Eingabeschema:** Die Parameter als JSON-Schema, wie das Modell sie sieht.
- **Code und Tests ansehen** (bei eigenen und KI-erstellten Tools).
- **Ausprobieren:** Gib eine JSON-Eingabe ein (Nodestro füllt ein Gerüst vor) und klicke **Ausführen**. Das Tool läuft genauso, wie ein Agent es aufrufen würde, eigene Tools also in der Sandbox. Das kostet nichts, weil kein Modell beteiligt ist. Fehler werden rot angezeigt.

## Eigene Tools schreiben {#selbst-schreiben}
<!-- keywords: eigenes tool, python, funktion schreiben, docstring, typen, tests, selbst schreiben -->

Unter **Selbst schreiben** erstellst du ein Tool als Python-Funktion. Nodestro füllt ein Beispiel vor (Celsius in Fahrenheit).

1. **Name der Funktion:** genau der Name der Funktion im Code. Er wird zum Tool-Namen.
2. **Code:** eine Funktion mit **Typangaben** für alle Parameter und den Rückgabewert und einem **Docstring** im Google-Stil. Die erste Zeile wird zur Beschreibung, der Abschnitt `Args:` beschreibt die Parameter.
3. **Tests:** Funktionen `test_*`, die das Tool mit `from tool import <name>` importieren und mit `assert` prüfen.
4. **Prüfen und testen** führt die statische Prüfung und die Tests aus, ohne zu speichern.
5. **Speichern** prüft erneut und speichert nur, wenn alles bestanden ist.

**Beispiel:**

```python
def net_price(gross: float, vat_percent: float = 20.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 20 for 20 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_austrian_vat():
    assert net_price(120) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

Eine gute Beschreibung ist entscheidend: Das Modell wählt Tools nur anhand von Name, Beschreibung und Parameterbeschreibungen.

## Regeln für eigenen Code {#regeln}
<!-- keywords: regeln, statische prüfung, imports, erlaubte module, verboten, open, eval, reserviert, sicherheit -->

Eigener und KI-erstellter Code wird vor jeder Ausführung **statisch geprüft**. Erlaubt ist reine Berechnung ohne Ein- und Ausgabe:

- **Erlaubte Importe:** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- **Bibliotheken von Drittanbietern** wie `numpy` oder `pandas` sind erlaubt, wenn du sie freigibst. Sie laufen in einer eigenen Umgebung (siehe [Python-Bibliotheken](/docs/python-bibliotheken#erkennung)). Netzwerk- und Dateizugriffe sind über solche Bibliotheken möglich: Gib nur frei, was du kennst.
- **Verboten** sind u. a. `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, Zugriffe auf Attribute mit doppeltem Unterstrich, `global`, `async`/`await` sowie Anweisungen außerhalb von Funktionen (außer Importen, Klassen und Zuweisungen).
- **Keine Netzwerk- oder Dateizugriffe aus der Standardbibliothek:** Module wie `os`, `socket` oder `urllib` sind nicht erlaubt.
- **Reservierte Namen:** Namen eingebauter Tools sowie `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` und `load_tool` sind vergeben.
- **Tests sind Pflicht:** Ohne mindestens einen bestandenen Test wird nichts gespeichert.

Das **Prüfergebnis** zeigt Fehler der statischen Prüfung, jeden Test mit bestanden oder Fehlermeldung und die Ausgabe der Sandbox.

## Tools von der KI erstellen lassen {#ki-erstellen}
<!-- keywords: ki tool, coding agent, generieren, tool erstellen lassen, dynamisch, anforderung -->

Unter **Von KI erstellen** beschreibst du, was das Tool können soll (mindestens 10 Zeichen), z. B. „Berechne die Annuität eines Kredits aus Betrag, Jahreszins in Prozent und Laufzeit in Monaten.“

Dann läuft im Hintergrund:

1. Der **Coding Agent** (das Assistenzmodell aus den Einstellungen) schreibt Funktion und Tests.
2. Code und Tests werden **statisch geprüft**, die Tests laufen in der **Sandbox**.
3. Schlägt etwas fehl, erhält der Coding Agent die Fehlermeldung und korrigiert seinen Vorschlag; insgesamt **höchstens drei Versuche**.
4. Sind alle Tests bestanden, wartet der Auftrag auf deine **Freigabe**.

Jeder Auftrag zeigt Status, Anzahl der Versuche und die Kosten. Unter *Versuche ansehen* findest du den Code jedes Versuchs.

Du kannst die Anforderung in jeder Sprache schreiben. Das Tool selbst entsteht immer auf Englisch (Code, Namen, Docstring und Tests), denn der Docstring wird zur Beschreibung, die Agenten lesen.

**Gut geeignet** sind reine Berechnungen: Formeln, Umrechnungen, Datumsrechnungen, Textanalysen, Validierungen. **Nicht möglich** sind Tools, die das Internet, Dateien oder externe Dienste brauchen (siehe [Regeln](/docs/tools#regeln)).

## Freigabe {#freigabe}
<!-- keywords: freigabe, freigeben, ablehnen, approval, prüfen, genehmigen -->

Bevor ein KI-erstelltes Tool aufgenommen wird, siehst du Code, Tests und Testergebnisse. Prüfe:

- Tut die Funktion genau das, was du beschrieben hast?
- Decken die Tests die wichtigen Fälle ab, auch Grenzfälle?
- Ist die Beschreibung verständlich, damit Agenten das Tool richtig einsetzen?

**Freigeben** nimmt das Tool in die Bibliothek auf; alle Agenten können es dann nutzen. **Ablehnen** verwirft es. Ohne Entscheidung wird ein Auftrag nach **einer Stunde** automatisch abgelehnt.

> **Hinweis:** Aufträge werden nur im Arbeitsspeicher geführt. Beendest du Nodestro, verschwindet die Auftragsliste; freigegebene Tools bleiben erhalten.

## Die Sandbox {#sandbox}
<!-- keywords: sandbox, docker, subprocess, python prozess, isolation, sicherheit, timeout -->

Eigene und von der KI erstellte Tools laufen **nie im Nodestro-Prozess**. Tests und jeder spätere Aufruf laufen in einer Sandbox:

| Sandbox | Isolation | Grenzen |
|---|---|---|
| **Python-Prozess** (Standard für eigene Tools) | eigener Prozess mit leerer Umgebung in einem temporären Ordner; **keine** Sicherheitsgrenze | 15 Sekunden, 1 GB Speicher |
| **Eingebaute Linux-Sandbox** (automatisch für KI-erstellte Tools unter Ubuntu 24.04 und Debian 13) | kein Netzwerk, kein Zugriff auf deine Dateien, Schlüssel, die Nodestro-Daten oder andere Programme; keine neuen Prozesse; beschreibbar ist nur ein eigener temporärer Ordner | 15 Sekunden (60 mit Bibliotheken), 1 GB Speicher, 64 MB temporäre Dateien |
| **Docker** | Wegwerf-Container ohne Netzwerk, mit schreibgeschütztem Dateisystem, ohne Rechte | 20 Sekunden, 512 MB Speicher, 1 CPU |

Die eingebaute Linux-Sandbox braucht keine Installation: Sie nutzt Funktionen des Linux-Kernels (Landlock und seccomp). Nodestro prüft einmal beim Start, ob sie vorhanden sind und wirken; *Einstellungen → Sandbox* zeigt das Ergebnis und, falls sie nicht verfügbar ist, den Grund. Sie schützt nicht vor Fehlern im Linux-Kernel selbst und verbirgt nicht, ob eine Datei anderswo existiert; Docker bleibt als Alternative verfügbar.

Die Sandbox wählst du in den [Einstellungen](/docs/einstellungen#sandbox). Docker muss installiert sein und laufen, sonst schlagen Tests und Aufrufe fehl. Überschreitet ein Aufruf das Zeitlimit, gilt er als Fehler und der Prozess wird beendet.

## Vertrauen und Isolation {#vertrauen}
<!-- keywords: vertrauen, nicht vertrauenswürdig, herkunft, ki-generiert, docker nötig, isolation nötig, gesperrt, eingeschränkt, braucht isolation -->

Nodestro entscheidet nach der **Herkunft des Codes**, wo er laufen darf:

| Herkunft | Angezeigt als | Ohne Isolation (nur *Python-Prozess*) | Eingebaute Linux-Sandbox oder Docker |
|---|---|---|---|
| Eingebaute Tools und Integrationen | *Eingebaut* | im Nodestro-Prozess | im Nodestro-Prozess |
| Von dir unter *Selbst schreiben* geschrieben | *Von dir geschrieben* | läuft, ohne Isolation auf diesem Rechner | läuft (im *Python-Prozess* oder isoliert in Docker) |
| Von der KI erstellt (auch nach deiner Freigabe), Tool-Entwürfe des KI-Architekten, Tools unbekannter Herkunft | *Braucht Isolation* | **gesperrt** | läuft isoliert |

Der Python-Prozess ist keine Sicherheitsgrenze: Code darin läuft mit deinen Rechten. Deshalb führt Nodestro KI-generierten Code dort nie aus, und weder deine Freigabe noch eine Einstellung ändert das; es gibt keinen Schalter, der es trotzdem erlaubt. Wo die eingebaute Linux-Sandbox verfügbar ist, nutzt Nodestro sie für solchen Code automatisch. Ohne sie und ohne Docker:

- startet **Mit KI erstellen** nicht, und Tool-Entwürfe lassen sich weder testen noch freigeben;
- können Agenten mit einem Tool, das Isolation braucht, nicht laufen; die Workflow-Prüfung meldet das vor dem Start;
- können Tools, die Isolation brauchen, keine Bibliotheken von Drittanbietern nutzen.

Tools, die vor dieser Version gespeichert wurden, und alle Tools nach dem Wiederherstellen einer Sicherung gelten als unbekannter Herkunft, auch selbst geschriebene, weil ihre Herkunft nicht festgehalten wurde. Mit Isolation funktionieren sie weiter. Eine neue Version eines solchen Tools oder eine Kopie seines Codes in einem neuen Tool behält diesen Status.

## Verbundene Dienste {#verbundene-dienste}
<!-- keywords: mcp, model context protocol, externer dienst, verbundene dienste, server, token, freigabe, geändert -->

Über das **Model Context Protocol (MCP)** verbindest du externe Dienste, zum Beispiel eine Dokumentensuche oder ein Ticketsystem. Ihre Tools stehen Agenten wie jedes andere Tool zur Verfügung, aber erst nach deiner Prüfung. Du findest sie unter *Tools → Verbundene Dienste*.

1. **Dienst verbinden:** Name und Adresse des MCP-Endpunkts (nur `https`), bei Bedarf ein Zugangstoken. Auf dem Desktop kannst du für einen selbst entwickelten Server auf diesem Computer mit **Lokalen Entwicklungsserver erlauben** `http://127.0.0.1` oder `http://localhost` zulassen. Der Dialog prüft die Adresse schon beim Eintippen und sagt, was nicht passt; Fehler beim Speichern bleiben im Dialog stehen.
2. **Verbindung testen:** Nodestro handelt die Protokollversion aus und ruft die Tools des Dienstes ab. Jedes Tool beginnt als **Neu**.
3. **Prüfen und einstufen:** Du siehst Beschreibung, Parameter und Angaben des Dienstes. Das ist **fremder Text**: Nodestro zeigt ihn an, behandelt ihn aber nie als Anweisung. Stufe das Tool ein: **Nur lesend**, **Ändert Daten** oder **Löscht oder zerstört**. Die Angabe des Dienstes ist nur ein Hinweis. Vorgewählt ist „Ändert Daten“, oder „Löscht oder zerstört“, wenn der Dienst das angibt. Wählst du eine weniger strenge Stufe, als der Dienst angibt, erklärt ein Hinweis die Folgen, und **Freigeben** geht erst, wenn du **Ich habe das Tool geprüft: Die weniger strenge Einstufung stimmt** einschaltest.
4. **Freigeben:** Erst dann sehen Agenten das Tool, als `mcp__<dienst>__<tool>`. Du weist es einem Agenten zu wie jedes andere Tool.

Derzeit sind nur Tools nutzbar, die du als **nur lesend** einstufst; Tools, die Daten ändern, bleiben gesperrt, bis es die Freigabe pro Aufruf gibt. Auch ein lesendes Tool erhält alles, was der Agent ihm sendet: Verbinde nur Dienste, denen du diese Daten anvertraust.

**Änderungen:** Nodestro merkt sich einen Fingerabdruck jeder freigegebenen Definition und prüft ihn vor jedem Aufruf. Ändert der Dienst ein Tool, wird es **gesperrt**; Läufe, die es verwenden, schlagen mit einer klaren Meldung fehl. Du siehst die Änderung als Gegenüberstellung (bisher freigegeben, jetzt angeboten) und gibst sie frei oder lehnst sie ab.

**Zugangstokens** werden verschlüsselt gespeichert: auf dem Desktop mit einem Schlüssel aus dem Schlüsselbund des Betriebssystems, auf dem Server mit dem Serverschlüssel, getrennt je Mandant. Ohne sicheren Schlüsselspeicher gilt ein Token nur bis zum Schließen der App. Tokens erscheinen nie in Workflows, Exporten oder Protokollen.

**Grenzen:** Nodestro verbindet sich nie mit internen, lokalen oder Metadaten-Adressen, prüft jede aufgelöste Adresse direkt beim Verbinden und ignoriert Proxy-Einstellungen der Umgebung. Auf einem Server erlaubt der Betreiber die Adressen mit `NODESTRO_MCP_ENDPOINTS`. Zeitpläne, Stapel und veröffentlichte APIs verwenden Dienst-Tools erst, wenn der Betreiber das ausdrücklich einschaltet. Kosten externer Dienste kennt Nodestro nicht; sie erscheinen als **unbekannt**, nie als null.

**Betrieb:** Unter *Betrieb* sehen Administratoren, wie viele Dienstaufrufe gerade laufen, die Grenzen des Betreibers und je Dienst Aufrufe, Fehler und die Dauer des letzten Aufrufs. Ein Dienst, der mehrmals hintereinander fehlschlägt, wird kurz pausiert.

## Bei einem Dienst anmelden {#mcp-anmeldung}
<!-- keywords: mcp, oauth, anmelden, login, autorisierung, zugang, erneuern -->

Manche Dienste verwenden kein festes Token, sondern eine **Anmeldung (OAuth)**. Wähle beim Verbinden *OAuth* als Anmeldung und speichere. Klicke dann auf **Anmelden**: Nodestro öffnet die Anmeldeseite des Dienstes, du bestätigst dort den Zugang und kehrst zu *Tools → Verbundene Dienste* zurück. Teste die Verbindung, um die Tools abzurufen.

- Nodestro speichert den Zugang verschlüsselt wie ein Token und erneuert ihn selbst. Du siehst, wo du angemeldet bist, mit welchen Berechtigungen und wann sich der Zugang erneuert; den Zugang selbst zeigt Nodestro nie an.
- **Abmelden** entfernt den gespeicherten Zugang. Verlangt der Dienst eine neue Anmeldung, schlagen Läufe, die ihn verwenden, mit einer klaren Meldung fehl, bis du dich wieder anmeldest.
- Auf einem Server richtet der Betreiber die öffentliche Adresse von Nodestro ein; der Rücksprung von der Anmeldung geht nur dorthin.

## Dokumente eines Dienstes {#mcp-dokumente}
<!-- keywords: mcp, resources, ressourcen, dokumente, kontext, lesen -->

Bietet ein Dienst **Dokumente** (MCP-Ressourcen) an, erscheint beim Test der Verbindung ein zusätzliches Tool `resources/read` mit dem Hinweis *Dokumente des Dienstes*. Du prüfst es wie jedes andere Tool: Seine Beschreibung listet die Dokumente auf, die ein Agent lesen darf.

- Lesbar sind nur die aufgelisteten Dokumente; Adressmuster und andere Adressen sind ausgeschlossen.
- Ändert der Dienst seine Liste, wird das Tool gesperrt, bis du die neue Liste geprüft hast.
- Inhalte sind fremde Daten wie jedes Ergebnis eines Dienstes. Binäre Inhalte wie Bilder gibt Nodestro nicht an das Modell weiter.
- Rückfragen eines Dienstes an dich, eigene Modellaufrufe des Dienstes und Zugriff auf deine Ordner bietet Nodestro nicht an.

## Lokale Server {#lokale-dienste}
<!-- keywords: mcp, stdio, lokaler server, pypi, container, docker, pakete -->

Neben entfernten Diensten kannst du einen **lokalen MCP-Server** von PyPI betreiben, zum Beispiel einen Zeit- oder Rechendienst. Wähle als Art *Lokaler Server*, trage die Pakete (eines pro Zeile) und das Modul ein, das mit `python -m` gestartet wird.

1. **Pakete prüfen:** Nodestro löst die genauen Versionen mit Prüfsummen auf. Du siehst sie und gibst sie frei, wie bei den Bibliotheken eines Tools. Vorher wird nichts installiert.
2. **Installation:** Die Pakete kommen in ein eigenes Container-Image.
3. **Verbindung testen:** Der Server startet in einem isolierten Container und meldet seine Tools. Ab hier sind Prüfung und Freigabe dieselben wie bei entfernten Diensten.

Der Container hat **kein Netzwerk**, keinen Zugriff auf deine Dateien, Schlüssel oder andere Prozesse sowie begrenzten Speicher und begrenzte Prozesse. Deshalb gibt es lokale Server nur, wenn die Docker-Sandbox verwendet wird; Server, die das Internet oder Node.js brauchen, lassen sich so nicht betreiben. Ein lokaler Server erhält kein Token und keine Anmeldung.

## Versionen und Löschen {#versionen}
<!-- keywords: version, löschen, zurückziehen, revoke, aktualisieren, überschreiben -->

Speicherst du ein eigenes Tool mit einem Namen, den es schon gibt, entsteht eine **neue Version**; die bisherige wird zurückgezogen. Agenten nutzen immer die aktuelle Version. Die Bibliothek zeigt die Versionsnummer.

**Löschen** zieht ein Tool zurück. Agenten, denen es zugewiesen ist, melden danach „Unbekannte Tools“ und können nicht starten, bis du das Tool dort entfernst oder neu anlegst. Eingebaute Tools lassen sich nicht löschen. Unter der Beschreibung zeigt **Verwendet in**, welche Workflows und Agenten der Bibliothek das Tool nutzen; der Löschdialog nennt sie vor dem Löschen. Veröffentlichte APIs fehlen dort mit Absicht: Sie enthalten ihre eigene Kopie des Tools.

## Tool-Fehler verstehen {#fehler}
<!-- keywords: tool fehler, fehlgeschlagen, timeout, sandbox fehler, ungültige eingabe -->

In der Ausführung ist jeder Tool-Aufruf aufklappbar: Eingabe, Ergebnis, Zeitpunkt und Dauer. Fehlgeschlagene Aufrufe sind markiert. Typische Ursachen:

- **Ungültige Eingabe:** Das Modell hat Parameter falsch befüllt. Verbessere die Parameterbeschreibungen im Docstring.
- **Erwarteter Fehler des Tools** (z. B. Division durch null): Der Agent sieht die Meldung und kann es erneut versuchen.
- **Zeitüberschreitung oder Absturz in der Sandbox:** Prüfe das Tool unter *Ausprobieren* mit derselben Eingabe.
- **Docker nicht erreichbar:** Starte Docker oder wechsle zur Sandbox *Python-Prozess*.

Ob unerwartete Fehler den Agenten beenden, steuert die Einstellung [Tool-Fehler](/docs/agenten#tool-fehler).

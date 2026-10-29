# KI-Workflow-Architekt

Der Workflow-Architekt entwirft aus einer Beschreibung in natürlicher Sprache einen vollständigen Multi-Agenten-Workflow oder überarbeitet einen bestehenden. Er plant die Agenten, schreibt ihre Prompts, wählt Modelle, Tools, Wissen und Memory, verbindet alles und prüft das Ergebnis. Er schlägt nur vor: Gespeichert, überschrieben oder ausgeführt wird nichts ohne deine Entscheidung.

## Überblick {#ueberblick}
<!-- keywords: architekt, ki, entwurf, generieren, automatisch, workflow erstellen, assistent -->

Den Architekten erreichst du an zwei Stellen:

- **Mit KI erstellen** im Dialog für einen neuen Workflow auf der Seite *Workflows*.
- **KI-Architekt** in der Werkzeugleiste des Editors, mit den Modi **Neuen Workflow entwerfen** und **Aktuellen Workflow überarbeiten**.

Beide nutzen dieselbe Logik. Der Architekt arbeitet in acht Schritten: Anforderungen analysieren, Architektur planen, Ressourcen prüfen, Agenten konfigurieren, Tools entwerfen, Verbindungen erstellen, Workflow validieren und Entwurf präsentieren. Für die Validierung nutzt er dieselbe [Prüfung vor dem Start](/docs/workflows#pruefung) wie der Editor.

Er baut so einfach wie möglich: nur so viele Agenten, wie die Aufgabe braucht, parallel nur dort, wo Schritte wirklich unabhängig sind. Wo die Aufgabe es verlangt, plant er auch [Entscheidungen, Freigaben](/docs/verzweigungen), ein Eingabeformular und Ergebnisdateien; Schleifen gibt es nicht. Wer lieber von einer fertigen Vorlage ausgeht, findet sie unter den [Beispielen](/docs/beispiele).

Der manuelle Weg bleibt unverändert: Du kannst jeden Workflow weiterhin ohne KI anlegen und bearbeiten.

## Neuen Workflow erstellen {#neu-erstellen}
<!-- keywords: neu, erstellen, beschreibung, vorhaben, mit ki erstellen, anlegen -->

Beschreibe dein Vorhaben: das Ziel, die Eingaben, die gewünschten Ergebnisse und wichtige Einschränkungen. Fehlende Details ergänzt der Architekt mit Annahmen, die er dir danach zeigt. Mit **Workflow entwerfen** startet er.

Am Ende siehst du den Entwurf zur Prüfung. **Workflow anlegen** speichert ihn als neuen Workflow mit Version 1 im [Versionsverlauf](/docs/workflows#versionen) und öffnet ihn im Editor. Den Namen kannst du vorher ändern. Ein neuer Entwurf entsteht wie ein [manuell angelegter Workflow](/docs/workflows#anlegen) und wird nie automatisch ausgeführt.

## Bestehenden Workflow überarbeiten {#ueberarbeiten}
<!-- keywords: überarbeiten, ändern, erweitern, agent hinzufügen, revision, diff, rückgängig, undo -->

Im Editor wählst du **Aktuellen Workflow überarbeiten** und beschreibst die Änderung, zum Beispiel: „Füge vor dem Ergebnis einen Agenten hinzu, der die bisherigen Analysen kritisch überprüft.“ Der Architekt berücksichtigt Agenten, Einstellungen und Verbindungen des Workflows, auch ungespeicherte Änderungen im Editor.

Er ändert nur, was die Beschreibung verlangt. Agenten, die er nicht erwähnt, bleiben unverändert erhalten, mit ihren Prompts, Tools und Positionen. Der Vorschlag entsteht als separater Entwurf; die Ansicht **Änderungen** zeigt hinzugefügte, geänderte und entfernte Agenten mit den geänderten Feldern sowie neue und entfernte Verbindungen.

**Änderungen übernehmen** wendet den Entwurf im Editor als einen einzigen Schritt an, den **Rückgängig** vollständig zurücknimmt. Gespeichert wird erst, wenn du [speicherst](/docs/workflows#speichern); die neue Version im [Versionsverlauf](/docs/workflows#versionen) bekommt dann automatisch einen Vermerk zur KI-Überarbeitung.

Hast du ungespeicherte Änderungen, bietet die Prüfung **Aktuellen Stand vorher als Version speichern** an. Wurde der Workflow im Editor geändert, während der Architekt arbeitete, weist die Prüfung darauf hin, bevor du übernimmst.

## Den Fortschritt verfolgen {#fortschritt}
<!-- keywords: fortschritt, live, aktivitäten, protokoll, schritte, vorschau, graph, markierung -->

Während der Architekt arbeitet, siehst du drei Dinge:

- **Arbeitsschritte:** welche der acht Schritte erledigt sind und welcher gerade läuft.
- **Aktivitäten:** ein Protokoll dessen, was tatsächlich passiert ist, etwa welche Rollen geplant, welche vorhandenen Tools gefunden oder welche Verbindungen korrigiert wurden.
- **Workflow-Vorschau:** der Workflow wächst live mit. Markierungen zeigen, welche Agenten neu, geändert, unverändert, entfernt oder noch in Arbeit sind.

Alle Anzeigen beruhen auf echten Ereignissen des Servers. Es gibt keine geschätzten Prozentwerte und keine erfundenen Zwischenstände, und die internen Überlegungen des Modells werden nicht angezeigt.

## Rückfragen und Annahmen {#rueckfragen}
<!-- keywords: rückfrage, frage, annahme, unklar, sprache, mehrdeutig -->

Der Architekt fragt nur nach, wenn ohne die Antwort kein sinnvoller Workflow möglich ist. Dann beantwortest du die Frage mit **Antworten und weiter** oder lässt ihn mit **Mit Annahmen fortfahren** selbst entscheiden. In allen anderen Fällen trifft er Annahmen und listet sie in der Prüfung auf.

Prompts, Namen und Beschreibungen schreibt er in der Sprache der Oberfläche (siehe [Sprache](/docs/einstellungen#sprache)), es sei denn, deine Beschreibung verlangt ausdrücklich eine andere. Technische Bezeichner, Feldnamen der strukturierten Ausgabe, Tool-Namen und Code bleiben englisch. Beim Überarbeiten übersetzt er vorhandene Inhalte nie.

## Den Entwurf prüfen {#pruefen}
<!-- keywords: prüfen, review, validierung, entwurf, übernehmen, verwerfen, garantie -->

Die Prüfung zeigt:

- **Überblick:** die analysierten Anforderungen, Annahmen, Kosten und das Ergebnis der Validierung mit allen Warnungen.
- **Änderungen** (nur beim Überarbeiten): was sich gegenüber dem Workflow im Editor ändert.
- **Agenten:** Rolle, Modell, System-Prompt, Aufgabe, Tools, Wissen, Memory und strukturierte Ausgabe jedes Agenten.
- **Datenfluss:** welche Ergebnisse welcher Agent erhält; die Aufgaben verweisen mit [Platzhaltern](/docs/workflows#platzhalter) darauf.
- **Tools:** neue Tool-Entwürfe mit Code und Tests.

Probleme, die sich ohne KI beheben lassen, korrigiert der Architekt selbst, etwa fehlende Verbindungen oder falsche Platzhalter. Was danach noch blockiert, lässt er von der KI korrigieren, aber nur eine begrenzte Zahl von Malen. Verbleibende Probleme zeigt die Prüfung an.

Eine bestandene [Prüfung](/docs/workflows#pruefung) bedeutet, dass der Workflow technisch laufen kann. Sie garantiert keine fachlich richtigen Ergebnisse: Lies die Prompts und teste den Workflow mit echten Eingaben. **Entwurf verwerfen** löscht den Entwurf samt seinen Tool-Entwürfen; **Beschreibung anpassen** startet einen neuen Entwurf.

## Neue Tools freigeben {#tools-freigeben}
<!-- keywords: tool, entwurf, freigabe, code, sandbox, testen, registrieren, sicherheit -->

Der Architekt verwendet bevorzugt vorhandene Tools. Nur wenn keines passt und **Fehlende Tools als Entwurf schreiben** eingeschaltet ist, schreibt er ein neues Python-Tool mit Tests. Der Code wird dabei nur statisch geprüft und läuft nie, auch nicht in der [Sandbox](/docs/tools#sandbox).

Ein Tool-Entwurf ist nicht registriert. Du siehst Code und Tests in der Prüfung und unter *Tools* bei den Tool-Entwürfen. **In Sandbox testen** führt die Tests aus; **Freigeben und registrieren** testet erneut und nimmt das Tool nur bei bestandenen Tests in die Bibliothek auf, wie bei der normalen [Freigabe](/docs/tools#freigabe). **Ablehnen** löscht den Entwurf.

Solange ein Tool nicht freigegeben ist, meldet die Prüfung den Workflow als blockiert, und er lässt sich nicht starten. Die bestehenden Sicherheitsregeln für eigenen Code gelten unverändert. Wissens- und Memory-Zuordnungen sind ebenfalls nur Vorschläge, die du im Editor änderst.

## Kosten und Limits {#kosten}
<!-- keywords: kosten, limit, budget, korrekturen, nutzung, preis, usd -->

Jeder Entwurf ruft die KI mehrmals auf: für Analyse, Plan, jeden Agenten, Tool-Entwürfe und Korrekturen. Die bisherigen Kosten siehst du live im Fortschritt und in der Prüfung. Alle Aufrufe stehen genau einmal in der [Nutzungsübersicht](/docs/nutzung#statistik) unter *Workflow-Architekt*, aufgeschlüsselt nach Schritt.

Unter *Einstellungen* bei den [Modellen](/docs/einstellungen#modelle) legst du das **Kostenlimit** je Entwurf fest (leer bedeutet kein Limit) und wie viele **KI-Korrekturversuche** erlaubt sind (0 bis 5). Wird das Limit erreicht, hält der Architekt an. Er startet nie eine Workflow-Ausführung und ruft keine kostenpflichtigen externen Dienste auf.

## Abbrechen {#abbrechen}
<!-- keywords: abbrechen, stoppen, schließen, verwerfen, sicher -->

**Generierung abbrechen** stoppt den Architekten jederzeit. Es wird nichts gespeichert und kein Workflow verändert; die bis dahin angefallenen Kosten bleiben in der Nutzungsübersicht. Schließt du den Dialog während der Prüfung, fragt Nodestro nach, bevor der Entwurf verworfen wird.

## Grenzen {#grenzen}
<!-- keywords: grenzen, einschränkungen, maximal, agenten, schleifen -->

- Ein Entwurf hat höchstens zehn Agenten; Kreise im Ablauf werden entfernt.
- Es gelten dieselben [Einschränkungen](/docs/workflows#grenzen) wie für jeden Workflow: keine Schleifen. Unterworkflows plant der Architekt nicht; füge sie bei Bedarf selbst hinzu.
- Der Architekt kennt nur die Informationen aus deiner Beschreibung, dem Workflow und der Bibliothek. Fachliche Richtigkeit musst du selbst prüfen.

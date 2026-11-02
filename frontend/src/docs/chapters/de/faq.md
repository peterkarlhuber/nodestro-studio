# Fehlerbehebung und FAQ

Hier findest du Lösungen für häufige Meldungen und Antworten auf typische Fragen.

## Häufige Fehler {#haeufige-fehler}
<!-- keywords: fehler, problem, lösung, meldung, troubleshooting, geht nicht, funktioniert nicht -->

| Meldung oder Symptom | Ursache | Lösung |
|---|---|---|
| „Kein API-Schlüssel für …“ | Der Anbieter des Modells ist nicht eingerichtet. | Schlüssel unter *Einstellungen → KI-Anbieter* eintragen oder die Umgebungsvariable des Anbieters setzen, z. B. `ANTHROPIC_API_KEY`. |
| „Workflow starten“ ist gesperrt | Es gibt Probleme im Workflow, ein Lauf ist aktiv, oder auf einem Server fehlt deiner Rolle die Berechtigung. | Der Grund steht direkt neben der Schaltfläche; **Zeigen** führt zum Problem. Alle Probleme stehen im Inspektor ohne Auswahl. |
| „Der Workflow enthält einen Kreis …“ | Eine Verbindung führt zurück. | Die rückführende Verbindung löschen. |
| „Unbekannte Tools: …“ | Ein zugewiesenes Tool wurde gelöscht oder fehlt nach einem Import. | Tool im Inspektor entfernen oder in der Tool-Bibliothek neu anlegen. |
| „… erlaubt kein erzwungenes Tool …“ | Das Modell erlaubt kein erzwungenes Tool. | Tool-Choice auf *Automatisch* stellen. |
| „Bei … lässt sich Thinking nicht ausschalten“ | Das Modell erlaubt Thinking *Aus* nicht. | Thinking auf *Modellstandard* stellen und den Aufwand senken. |
| „‚Nur zwischen Tool-Aufrufen‘ unterstützt nur …“ | Nur Sonnet 5.5 bis Aufwand *Hoch* unterstützt das. | Modell oder Aufwand anpassen. |
| „Diese Anzeige der Gedanken passt nicht zur Thinking-Einstellung“ | *Gedanken anzeigen* passt nicht zu Thinking *Aus* oder *Nur zwischen Tool-Aufrufen*. | Eine der beiden Einstellungen ändern. |
| „Ungültiger Feldname …“ | Ein Feldname im Ausgabeformat enthält Sonderzeichen oder beginnt mit einer Ziffer. | Nur Buchstaben, Ziffern und `_` verwenden. |
| „Zitate lassen sich nicht mit einem strukturierten Ausgabeformat kombinieren“ | Beide Optionen sind aktiv. | Eine davon abschalten. |
| „Beispiel-Nachrichten müssen …“ | Die Beispiele wechseln nicht sauber ab. | Mit Nutzer beginnen, abwechseln, mit Assistent enden. |
| „Dauerhaftes Memory braucht einen Memory-Raum“ | Memory *Dauerhaft* ohne Raum. | Raum wählen oder anlegen. |
| Docker-Fehler bei Tools | Docker ist gewählt, läuft aber nicht. | Docker starten oder Sandbox *Automatisch* wählen. |
| KI-erstellte Tools sind unter macOS oder Windows gesperrt | Ohne Docker gibt es auf diesen Systemen keine freigegebene Sandbox. | [Docker installieren](/docs/einstellungen#sandbox-docker) und starten; *Automatisch* verwendet es dann. |
| Agent wurde *übersprungen* | Ein Vorgänger ist fehlgeschlagen. | Den ersten roten Agenten im Ablauf ansehen und beheben. |
| Ergebnis enthält „{{Name}}“ wörtlich | Der Platzhalter passt zu keinem direkten Vorgänger (z. B. nach Umbenennen). | Platzhalter über die Schaltflächen unter der Aufgabe neu einfügen. |
| Trace-Import: „Das ist ein exportierter Workflow …“ | Die Datei ist ein Workflow-Export. | Unter *Workflows → Importieren* öffnen. |

Die Meldungen erscheinen in der Sprache der Oberfläche; den Originaltext des Servers zeigt **Technische Details**. Fehler, die erst während eines Laufs auftreten, erklärt [Fehler interpretieren](/docs/ausfuehrungen#fehler).

## Häufige Fragen {#fragen}
<!-- keywords: faq, fragen, antworten, wie kann ich, warum -->

**Kostet das Bearbeiten von Workflows etwas?**
Nein. Kosten entstehen nur bei Läufen und bei den KI-Assistenten (Agent entwerfen, Tool erstellen, Memory vorschlagen). Die Prüfung im Editor, die Wissenssuche und *Tool ausprobieren* sind kostenlos.

**Warum weicht die Kostenschätzung von meiner Rechnung ab?**
Nodestro rechnet mit Listenpreisen. Rabatte, Steuern, andere Plattformen oder Sonderkonditionen sind nicht berücksichtigt.

**Kann ein Agent das Ergebnis eines Agenten sehen, der nicht direkt vor ihm liegt?**
Nein, nur die direkten Vorgänger. Verbinde ihn zusätzlich mit dem gewünschten Agenten; die ursprüngliche Eingabe erreichst du immer mit `{{run.input}}`.

**Kann ich einen Workflow verzweigen, je nach Ergebnis?**
Ja, mit einer [Entscheidung](/docs/verzweigungen#entscheidung): Sie prüft das Ergebnis mit festen Regeln und öffnet den passenden Zweig. Schleifen gibt es nicht.

**Wie übertrage ich einen Workflow auf einen anderen Rechner?**
Mit *Export* und *Importieren*. Wissensdateien, Memory-Räume und eigene Tools musst du dort separat anlegen.

**Wie zeige ich jemandem einen Lauf?**
Mit *Trace exportieren*. Die andere Person öffnet die Datei unter *Ausführungen → Trace importieren*, ohne den Workflow erneut auszuführen.

**Wird mein API-Schlüssel im Workflow-Export oder Trace gespeichert?**
Nein. Die Schlüssel liegen nur in Umgebungsvariablen oder in der lokalen Datenbank und kommen weder in Exporte noch in Backups.

**Warum sieht ein Agent eine Wissensdatei nicht?**
Prüfe, ob sie ihm im Inspektor zugewiesen ist, und welcher Modus gewählt ist. Bilder und gescannte PDFs sind im Modus *Durchsuchen* nicht auffindbar.

**Was passiert mit laufenden Läufen, wenn ich Nodestro beende?**
Sie werden abgebrochen. Was bis dahin gespeichert wurde, bleibt als Ausführung erhalten.

**Ändert ein Sprachwechsel meine Agenten?**
Nein. Die Sprache ändert nur die Oberfläche. Agenten, Prompts und Ergebnisse bleiben, wie sie sind, und Agenten antworten weiter in der Sprache ihres Prompts. Siehe [Sprache](/docs/einstellungen#sprache).

**Kann ich Claude über Amazon Bedrock statt mit einem Anthropic-Schlüssel nutzen?**
Ja, mit dem Anbieter *Amazon Bedrock (AWS)*: Er nutzt statt eines Schlüssels dein AWS-Konto, die Region und IAM-Berechtigungen, und AWS rechnet je Region ab. Optionen nur für Anthropic (Denken, Prompt-Caching-Einstellungen, Ersatzmodelle, Server-Tools) gibt es dort nicht. Siehe [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).

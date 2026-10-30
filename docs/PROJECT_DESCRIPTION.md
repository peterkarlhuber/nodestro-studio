# Nodestro – Visual AI Agent Studio

**Nodestro** (aus *Node* + *Maestro*) ist eine geplante visuelle Anwendung zum Erstellen, Konfigurieren und Verbinden von KI-Agenten. Ziel ist eine moderne, leicht bedienbare Entwicklungsumgebung, in der Nutzer ohne umfangreiche Programmierarbeit Multi-Agent-Workflows aufbauen und ausführen können.

## Grundlage

Nodestro soll **auf der bestehenden Python-Library `orkexa`** aufbauen, die Agenten anbieterunabhängig ausführt (Anthropic, OpenAI, Gemini sowie OpenAI-kompatible Endpunkte, Ollama und vLLM). Die Library wird der implementierenden KI separat bereitgestellt. Zunächst sind ihre tatsächlichen Klassen, Argumente, Schnittstellen und Funktionen zu untersuchen. Nodestro soll diese Möglichkeiten über eine verständliche Benutzeroberfläche zugänglich machen, statt ein eigenes Agenten-Framework neu zu schreiben.

## Kernidee: Agenten als Knoten

Der zentrale Arbeitsbereich ist ein **grafischer Workflow-Editor**, angelehnt an das Bedienprinzip von n8n. **Ein Knoten stellt einen Agenten dar.** Agenten können hinzugefügt, positioniert, verbunden und zu einem Workflow zusammengestellt werden. Über die Verbindungen werden Aufgaben, Informationen und Ergebnisse zwischen Agenten weitergereicht.

Workflows sollen erstellt, gespeichert, wieder geöffnet, gestartet und nachvollzogen werden können. Ein übersichtlicher Ausführungsstatus zeigt Ergebnisse, Tool-Aufrufe, Fehler sowie möglichst Tokenverbrauch und Kosten einzelner Agenten und des gesamten Workflows an.

## Agenten konfigurieren – manuell oder mit KI

Beim Erstellen oder Bearbeiten eines Agenten-Knotens sollen **alle in der Orkexa-Library (`Agent`) verfügbaren und sinnvoll konfigurierbaren Argumente** zugänglich sein, beispielsweise Anbieter und Modell, System-Prompt, Messages, Tools, Memory, Output-Format, Thinking/Effort, Caching, Limits und Tool-Choice. Die Oberfläche soll häufige Einstellungen einfach darstellen und fortgeschrittene Optionen bei Bedarf einblenden.

Alternativ kann der Nutzer **in natürlicher Sprache beschreiben, welchen Agenten er benötigt**. Ein Hintergrundagent erstellt daraus eine passende Konfiguration, etwa Rolle, System-Prompt, Modellwahl und Tool-Zuweisungen. Die Konfiguration bleibt sichtbar, editierbar und muss nicht ungeprüft übernommen werden. Vorhandene Möglichkeiten zur dynamischen Agentenerstellung in der Library sollen dabei genutzt werden.

## Tools und Memory

Tools sollen zentral angezeigt, verwaltet, bestehenden Agenten zugeordnet und wiederverwendet werden können. Der Nutzer soll ein Tool entweder aus vorhandenen Funktionen auswählen **oder in natürlicher Sprache beschreiben**. Ein Coding Agent kann daraus eine passende Python-Funktion mit Typen, Docstring und Tests entwickeln. Generierter Code muss vor der Freigabe geprüft und sicher ausgeführt werden. Bestehende Funktionen der Library für Tool-Definitionen und dynamische Erstellung sind wiederzuverwenden.

Auch **Memory** soll direkt am Agenten verständlich konfigurierbar sein: Unterstützte Memory-Arten sollen auswählbar sein, und die Einrichtung kann bei Bedarf durch einen Hintergrundagenten unterstützt werden. Welche Informationen ein Agent speichert oder erhält, soll nachvollziehbar sein.

## Hintergrundwissen und Dateien

Nutzer sollen **PDFs, Bilder, Textdateien und weitere unterstützte Dokumente** als Hintergrundwissen hinterlegen und einzelnen oder mehreren Agenten zuweisen können. Die vorhandenen Funktionen für Dateien, Retrieval/RAG und gegebenenfalls Memory sollen genutzt werden. Hochgeladene Inhalte sollen leicht zu finden, zu verwalten und wiederzuverwenden sein. Der konkrete Umfang richtet sich nach den tatsächlich verfügbaren Library-Schnittstellen.

## Gestaltung und Bedienung

Die Oberfläche soll **übersichtlich, ruhig, professionell und einfach verständlich** sein. Der Workflow-Editor steht im Mittelpunkt; Agenteneinstellungen erscheinen in klar strukturierten Panels. Komplexität soll durch progressive Offenlegung reduziert werden, ohne wichtige Library-Funktionen zu verstecken.

Das beigefügte Designsystem **„Midnight Citron“** ist die visuelle Grundlage. Es enthält Light- und Dark-Mode-Farbtokens, CSS, einen Designleitfaden und HTML-/Bildvorschauen. Ziel ist eine eigenständige, zurückhaltende Gestaltung, die auch bei vielen verknüpften Agenten gut lesbar bleibt.

## Umsetzung und Rahmen

Die Anwendung soll **zunächst lokal bzw. über `localhost`** nutzbar sein. Frontend, Backend und technische Architektur sind noch nicht festgelegt und sollen passend zur vorhandenen `orkexa`-Library gewählt und begründet werden. Der Fokus liegt zunächst auf einem funktionierenden, gut bedienbaren grafischen Agenten-Workflow-Editor; spätere Erweiterungen sollen möglich bleiben.

**Nicht Teil dieser Projektbeschreibung:** SaaS, Benutzerabonnements, Zahlungsabwicklung oder Unternehmensgründung.

### Auftrag an die implementierende KI

1. Analysiere zuerst die bereitgestellte `orkexa`-Library und ermittle ihre tatsächlichen Fähigkeiten.
2. Leite daraus ein bewusst schlankes Bedien- und Architekturkonzept für Nodestro ab.
3. Nutze die vorhandene Library als technische Basis für Agenten, Tools, Memory, Dateien und Ausführung.
4. Orientiere die Gestaltung am beigefügten Midnight-Citron-Designsystem.
5. Priorisiere **leichte Bedienbarkeit, Übersichtlichkeit, Verständlichkeit, Testbarkeit und Wiederverwendbarkeit** statt unnötiger Komplexität.

Das Ziel ist **eine intuitive visuelle Oberfläche für die vorhandene `orkexa`-Library**, keine Neuentwicklung der zugrunde liegenden Agentenlogik.

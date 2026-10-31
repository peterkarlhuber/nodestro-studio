# Wissen

Unter *Wissen* hinterlegst du Dateien, die Agenten als Hintergrundmaterial nutzen: Handbücher, Berichte, Verträge, Tabellen oder Bilder. Dieses Kapitel erklärt Formate, die drei Arten der Nutzung und wie die Suche funktioniert.

## Überblick {#ueberblick}
<!-- keywords: wissen, wissensbasis, dateien, hintergrundwissen, rag, dokumente -->

Wissen funktioniert in drei Schritten:

1. **Hochladen** auf der Seite *Wissen*. Texte und PDFs werden automatisch für die Volltextsuche indexiert.
2. **Zuweisen** im Inspektor eines Agenten (Abschnitt *Wissen*). Ein Agent sieht nur die Dateien, die ihm zugewiesen sind.
3. **Modus wählen:** *Im Kontext*, *Bei Bedarf* oder *Durchsuchen*.

Eine Datei kann beliebig vielen Agenten zugewiesen werden.

## Dateien hochladen {#hochladen}
<!-- keywords: hochladen, upload, drag and drop, ziehen, beschreibung -->

Klicke **Dateien hochladen** oder ziehe Dateien in die Ablagefläche; mehrere auf einmal sind möglich. Jede Datei zeigt Größe, Typ, Anzahl der indexierten Abschnitte und Alter. Der Dateiname öffnet das Original in einem neuen Tab.

Lädst du **genau dieselbe Datei** erneut hoch, entsteht kein Duplikat: Die Kennung ergibt sich aus dem Inhalt, und Name und Beschreibung werden aktualisiert.

Du kannst Dateien auch direkt im Abschnitt *Wissen* eines Agenten hochladen; sie landen hier, ohne Sammlung, und sind dem Agenten gleich zugewiesen ([Agenten](/docs/agenten#wissen)).

## Formate und Grenzen {#formate}
<!-- keywords: formate, pdf, bild, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, größe, limit, mb -->

| Art | Formate | Größe | Durchsuchbar |
|---|---|---|---|
| Dokumente | PDF | bis 20 MB | ja, Seite für Seite (PDFs mit Textebene oder nach OCR) |
| Office | Word (DOCX), Excel (XLSX), in Markdown umgewandelt | bis 20 MB | ja |
| Texte | TXT, Markdown, CSV, JSON, YAML, HTML, XML | bis 20 MB | ja |
| Bilder | PNG, JPEG, GIF, WebP | bis 5 MB | nein |

Texte müssen UTF-8-kodiert sein. Word und Excel werden beim Hochladen umgewandelt; Formeln werden gezeigt, nie berechnet (siehe [Word und Excel](/docs/dateien#dokumentformate)). **Gescannte PDFs** ohne Textebene werden gespeichert und können im Kontext oder bei Bedarf gelesen werden, sind aber erst nach einer [Texterkennung (OCR)](/docs/dateien#ocr) durchsuchbar.

## Indexierung {#indexierung}
<!-- keywords: index, indexierung, abschnitte, chunks, fts5, volltext -->

Beim Hochladen zerlegt Nodestro den Text in **Abschnitte** von etwa 1.500 Zeichen mit 200 Zeichen Überlappung, an Absatzgrenzen. PDFs werden Seite für Seite indexiert; Treffer tragen dann Titel wie „Bericht, p. 3“. Die Zahl der Abschnitte steht bei jeder Datei.

Der Index ist eine SQLite-Volltextsuche (FTS5 mit BM25-Ranking) direkt in der Nodestro-Datenbank. Es wird kein externer Dienst und kein Embedding-Modell benötigt, und die Indexierung kostet nichts.

## Die drei Modi {#modi}
<!-- keywords: im kontext, bei bedarf, durchsuchen, on demand, context, search, files tool, search tool, modus -->

| Modus | Was der Agent bekommt | Geeignet für | Kosten |
|---|---|---|---|
| **Im Kontext** | Alle zugewiesenen Dateien vollständig am Anfang des Prompts. | Wenige, kurze Dokumente, die immer gebraucht werden (Styleguide, Preisliste). Auch Bilder. | Jede Anfrage enthält alle Dateien; Caching macht Wiederholungen günstig. |
| **Bei Bedarf** | Einen Katalog (Name, Typ, Größe, Beschreibung) und das Tool `files`, mit dem er einzelne Dateien vollständig lädt. | Mittlere Sammlungen, aus denen pro Aufgabe nur einzelne Dateien relevant sind. Auch Bilder und gescannte PDFs. | Nur geladene Dateien kosten Tokens. |
| **Durchsuchen** | Das Tool `search`, das die passendsten Abschnitte mit Quellenangabe liefert (RAG). | Große Dokumente und Sammlungen, aus denen einzelne Fakten gebraucht werden. | Nur gefundene Abschnitte kosten Tokens. |

**Empfehlungen:**

- Im Modus *Bei Bedarf* entscheidet der Agent anhand der **Beschreibung**, welche Datei er lädt. Pflege aussagekräftige Beschreibungen.
- Im Modus *Durchsuchen* kann der Agent mehrfach mit verschiedenen Begriffen suchen. Weise im System-Prompt an, Aussagen mit Fundstellen zu belegen.
- Bilder und PDFs ohne Text sind im Modus *Durchsuchen* unsichtbar.

## Zitate {#zitate}
<!-- keywords: zitate, citations, quellen, fundstellen, belegen -->

**Zitate aktivieren** gilt für den Modus *Im Kontext*: Die Antwort verweist dann auf die genauen Stellen in den Dokumenten. Im Modus *Durchsuchen* liefern die Suchergebnisse immer Quellenangaben.

Zitate lassen sich **nicht mit einem strukturierten Ausgabeformat** kombinieren; die Prüfung meldet das als Fehler.

## Dateien beim Start mitgeben {#start-dateien}
<!-- keywords: dateien mitgeben, startdialog, einmalig, pro lauf, anhang -->

Im Startdialog kannst du unter **Dateien mitgeben** Wissensdateien für **diesen einen Lauf** auswählen. Sie werden direkt in den Kontext der ersten Agenten gelegt, also der Agenten, die mit dem Start verbunden sind oder keine Vorgänger haben. Spätere Agenten erhalten sie nicht, nur die Ergebnisse ihrer Vorgänger.

So kannst du einen Workflow z. B. jedes Mal mit einem anderen Vertrag starten, ohne die Agenten umzukonfigurieren. Die Datei muss vorher unter *Wissen* hochgeladen sein.

## Suche ausprobieren {#suche}
<!-- keywords: suche testen, suchbegriff, score, treffer, bm25, umlaute -->

Rechts auf der Seite *Wissen* testest du die Suche über **alle** indexierten Dateien, genau wie ein Agent im Modus *Durchsuchen* sie nutzt (der Agent sucht nur in seinen zugewiesenen Dateien). Jeder Treffer zeigt Titel, Textausschnitt und **Score** (Relevanz; höher ist besser).

Eigenschaften der Suche:

- Umlaute und Akzente werden vereinheitlicht: „Kase“ findet „Käse“.
- Wörter passen auch als Wortanfang: „Garantie“ findet „Garantiezeit“.
- Es ist eine Stichwortsuche, keine Bedeutungssuche: Synonyme werden nicht gefunden. Formuliere Suchbegriffe so, wie sie im Dokument stehen.

Das Filterfeld links durchsucht nur Dateinamen und Beschreibungen.

## Sammlungen und Herkunft {#sammlungen}
<!-- keywords: sammlung, sammlungen, ordnen, herkunft, übernommen, durchsuchbar -->

Sammlungen ordnen Wissensdateien, etwa „Verträge“ oder „Produktdaten“. Beim Hochladen wählst du unter *Hochladen in Sammlung* eine Sammlung; bei jeder Datei kannst du sie später ändern. Die Chips über der Liste filtern nach Sammlung. Agenten bekommen weiterhin genau die Dateien, die ihnen zugewiesen sind.

Inhalte aus Läufen (hochgeladene Dateien, Ergebnisdateien, Ergebnisse und Vorschläge von Agenten) kommen nur nach deiner Bestätigung ins Wissen, siehe [Ins Wissen übernehmen](/docs/datei-eingaben#knowledge-uebernahme). Solche Dateien zeigen unter *Herkunft*, aus welchem Workflow, Schritt und Lauf sie stammen und ob der Inhalt entnommen, erzeugt oder eine Annahme ist.

## Dateien verwalten {#verwalten}
<!-- keywords: beschreibung bearbeiten, löschen, verwalten, entfernen -->

- **Beschreibung:** direkt bei der Datei eintragen; sie wird beim Verlassen des Feldes gespeichert. Gute Beschreibungen nennen Inhalt, Zeitraum und Zweck, z. B. „Geschäftsbericht 2025 mit Bilanz und Risikobericht“.
- **Löschen:** Papierkorb-Symbol. Die Datei und ihr Index werden entfernt. Agenten, denen sie zugewiesen war, laufen weiter und erhalten sie einfach nicht mehr. **Verwendet in** unter dem Dateinamen nennt die Workflows, Agenten der Bibliothek und veröffentlichten APIs, die die Datei nutzen. Ist sie in Verwendung, zählt der Löschdialog diese Stellen vor dem Löschen auf.

## Tipps und häufige Fehler {#tipps}
<!-- keywords: tipps, fehler, agent findet nichts, zu teuer, kontext zu groß -->

- **Der Agent findet nichts:** Prüfe unter *Suche ausprobieren*, ob die Datei indexiert ist und der Begriff gefunden wird. Ist die Datei ein gescanntes PDF, nutze *Bei Bedarf*.
- **Läufe werden teuer:** Viele große Dateien *Im Kontext* füllen jede Anfrage. Wechsle zu *Bei Bedarf* oder *Durchsuchen*.
- **Kontextfenster überschritten:** Zu viele oder zu große Dateien im Kontext führen zu einem Fehler der API. Verteile das Wissen oder nutze die Suche.
- **Antwort ohne Quellen:** Bitte im System-Prompt ausdrücklich darum, Aussagen mit Fundstellen zu belegen.

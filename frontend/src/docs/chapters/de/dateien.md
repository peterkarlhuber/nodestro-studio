# Dateien und Dokumente

Nodestro schreibt Ergebnisse auf Wunsch als Dateien (Markdown, JSON, CSV, HTML, PDF, Word oder Excel) und liest neben PDFs und Texten auch Word- und Excel-Dateien. Gescannte PDFs lassen sich optional lokal per Texterkennung (OCR) lesbar machen. Alles läuft auf deinem Rechner, ohne zusätzliche Konten.

## Ergebnisdateien {#ergebnisdateien}
<!-- keywords: ergebnisdatei, datei, export, bericht, report, markdown, json, csv, html, pdf, download, bereinigen -->

Im Inspector des **Ergebnis**-Knotens legst du unter *Ergebnisdateien* fest, in welchen Formaten das Ergebnis am Ende jedes Laufs gespeichert wird. Ohne Eintrag entsteht keine Datei.

| Format | Inhalt |
|---|---|
| Markdown (.md) | das Ergebnis als Text; strukturierte Ergebnisse als Abschnitte |
| JSON (.json) | das Ergebnis als Daten |
| CSV (.csv) | eine Tabelle; braucht eine Liste von Datensätzen oder ein Objekt mit einfachen Werten |
| HTML (.html) | eine eigenständige Seite mit Überschriften, Listen und Tabellen |
| PDF (.pdf) | dieselben Inhalte auf A4-Seiten |
| Word (.docx) | ein Dokument mit Überschriften, Absätzen, Listen, Tabellen und Hervorhebungen |
| Excel (.xlsx) | Tabellen mit Zahlen-, Datums- und Ja/Nein-Spalten; mehrere Tabellen als eigene Blätter |

Mehrere Formate pro Lauf sind möglich. Alle Dateien entstehen lokal und ohne KI-Anfrage; über die veröffentlichte API und im exportierten Projekt sind sie genauso abrufbar.

- **Dateiname:** leer bedeutet der Name des Workflows.
- **Bereinigen:** ersetzt Zugangsdaten und personenbezogene Daten durch Platzhalter, wie beim [bereinigten Trace-Export](/docs/ausfuehrungen#trace-export).
- In der Detailansicht eines Laufs listet der Bereich **Ergebnisdateien** alle Dateien zum Ansehen, Herunterladen und Löschen. Mit *Datei erstellen* erzeugst du auch nachträglich eine Datei aus dem Gesamtergebnis oder dem Ergebnis eines einzelnen Schritts.
- Dateien gehören zum Lauf: Sie sind Teil von Backups und werden mit dem Lauf gelöscht. Eine Datei ist höchstens 10 MB groß.
- HTML wird in der Vorschau ohne Skripte angezeigt. Das PDF nutzt die Standardschriften; Zeichen außerhalb des westeuropäischen Zeichensatzes erscheinen als „?“.

Kann eine Datei nicht geschrieben werden (etwa CSV aus einem Fließtext), zeigt der Lauf die Datei mit dem Grund an; das Ergebnis selbst bleibt erhalten.

## Word und Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, tabellenblatt, formel, umwandeln, dokumentformate, office -->

**Word (DOCX)** und **Excel (XLSX)** kannst du im [Wissen](/docs/wissen#formate) hochladen wie andere Dateien. Nodestro wandelt sie beim Hochladen in Markdown um und speichert und durchsucht diesen Text; die Datei trägt den Hinweis „umgewandelt aus DOCX/XLSX“.

- **Word:** Absätze, Überschriften, Aufzählungen und Tabellen in der Reihenfolge des Dokuments.
- **Excel:** ein Abschnitt pro Tabellenblatt mit einer Tabelle der benutzten Zellen. **Formeln werden nie berechnet:** Die Zelle zeigt den Wert, den Excel gespeichert hat, und daneben die Formel als Text.
- Sehr große Tabellen werden gekürzt (höchstens 5.000 Zeilen und 200 Spalten pro Blatt); die Datei zeigt dann „gekürzt“.

Für [Stapelläufe](/docs/automatisierung#stapel) liest Nodestro Excel-Tabellen direkt als Zeilen ein.

## Texterkennung (OCR) {#ocr}
<!-- keywords: ocr, texterkennung, scan, gescannt, tesseract, bild pdf, textebene, unsicher -->

Gescannte PDFs ohne Textebene sind zunächst nicht durchsuchbar. Mit der **lokalen Texterkennung** lassen sie sich lesbar machen:

1. Installiere **Tesseract** mit den Sprachdaten deiner Dokumente (Deutsch, Englisch, Spanisch, Französisch, Italienisch oder Portugiesisch) sowie **pdftoppm** und **pdfinfo** (beide aus Poppler) auf deinem Rechner, zum Beispiel mit dem Paketmanager deines Systems.
2. Schalte in den [Einstellungen](/docs/einstellungen) unter *Texterkennung (OCR)* die Option *OCR für Scans verwenden* ein. Die Einstellung zeigt, ob Tesseract gefunden wurde.
3. Neue Scans werden beim Hochladen erkannt; bei vorhandenen klickst du im Wissen auf *Text erkennen (OCR)*.

Die Erkennung läuft vollständig lokal; es werden keine Daten gesendet. Unsicher erkannte Wörter werden im Text als `[?Wort]` markiert und gezählt, damit Agenten und du wissen, dass der Text Fehler enthalten kann. Prüfe wichtige Zahlen im Original.

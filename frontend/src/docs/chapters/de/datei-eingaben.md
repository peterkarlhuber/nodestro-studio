# Dateien als Eingabe

Workflows können Dateien direkt als Eingabe bekommen: Verträge, Rechnungen, Tabellen, Bilder oder ganze ZIP-Archive. Du lädst sie beim Start hoch, ohne sie vorher ins Wissen zu übernehmen. Nodestro prüft und liest sie lokal und gibt den Agenten genau so viel davon, wie sie brauchen.

## Überblick {#ueberblick}
<!-- keywords: datei, dateien, upload, hochladen, eingabe, input, dokument, anhang, start -->

- Im Eingabeformular des **Start**-Knotens legst du Felder vom Typ **Datei** an. Beim Start ziehst du Dateien in das Feld oder wählst sie aus.
- Auch ohne Formular kannst du im Startdialog unter *Dateien* Dateien hochladen oder aus dem Wissen wählen.
- Hochgeladene Dateien gehören zum **Lauf**, nicht zum Wissen. Sie stehen in der Detailansicht des Laufs unter *Erhaltene Dateien*.
- Was dauerhaft für alle Agenten verfügbar sein soll, übernimmst du ausdrücklich [ins Wissen](/docs/wissen#sammlungen).

## Datei-Felder {#datei-felder}
<!-- keywords: datei feld, dateifeld, formular, drag and drop, ziehen, ordner, auswählen -->

Ein Datei-Feld nimmt Dateien per Ziehen oder über **Dateien wählen** an. Jede Datei wird sofort hochgeladen und geprüft. Die Liste zeigt Name, Format, Größe, den Zustand und gegebenenfalls den Grund einer Ablehnung. Vor dem Start kannst du Dateien wieder entfernen und mit dem Augen-Symbol ansehen, was Nodestro gelesen hat.

Der Lauf startet erst, wenn alle Dateien hochgeladen sind. Abgelehnte Dateien werden nie Teil des Laufs.

Im Aufgabentext eines Agenten steht `{{form.<name>}}` für die Namen der Dateien des Felds. Die Inhalte bekommt der Agent zusätzlich, wie unter [Übergabe an Agenten](/docs/datei-eingaben#uebergabe) beschrieben. Mehr zu Formularen steht unter [Eingabeformulare](/docs/verzweigungen#eingabeformular).

## Feldeinstellungen {#feld-einstellungen}
<!-- keywords: einstellungen, erlaubte typen, mehrere dateien, höchstzahl, größe, mb, limit -->

Im Inspector des Start-Knotens hat jedes Datei-Feld den Abschnitt *Dateioptionen*. Geschlossen nennt er die aktuelle Wahl in einer Zeile, etwa „alle Formate · bis 20 MB · mehrere Dateien · Automatisch“. Geöffnet zeigt er diese Einstellungen:

| Einstellung | Bedeutung |
|---|---|
| Erlaubte Dateitypen | Gruppen (Text, Daten, Dokumente, Bilder, ZIP-Archive) oder einzelne Formate; nichts gewählt erlaubt alle |
| Mehrere Dateien | aus: genau eine Datei; an: mehrere Dateien |
| Höchstens Dateien | optionale Obergrenze bei mehreren Dateien |
| Höchstens MB pro Datei | Standard 20 MB, höchstens 50 MB |
| Übergabe an Agenten | *Automatisch*, *Immer den Inhalt* oder *Übersicht, Inhalt bei Bedarf* |

## Pflichtfelder und optionale Felder {#optionale-felder}
<!-- keywords: pflichtfeld, optional, leer, fehlt, nicht angegeben, ist leer -->

Jedes Feld, nicht nur Datei-Felder, ist entweder **Pflichtfeld** oder **optional**. Ein Pflichtfeld muss vor dem Start ausgefüllt sein. Ein leeres optionales Feld bleibt leer:

- Im Aufgabentext eines Agenten erscheint dafür „(not provided)“, damit der Agent erkennt, dass nichts angegeben wurde.
- Entscheidungsknoten sehen einen leeren Wert und können ihn mit *ist leer* prüfen.
- Leere Datei-Felder erzeugen keine Dateiverweise. Das gilt auch für Unterworkflows, veröffentlichte APIs und exportierte Projekte.

## Unterstützte Formate {#formate}
<!-- keywords: formate, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, bild, zip -->

| Gruppe | Formate | Was Nodestro liest |
|---|---|---|
| Text | TXT, Markdown, Quelltext | den Text |
| Daten | CSV, JSON, Excel (XLSX) | Tabellen mit Spalten; Excel mit allen Tabellenblättern |
| Dokumente | PDF, Word (DOCX) | Text mit Überschriften und Tabellen; Seiten bei PDFs |
| Bilder | PNG, JPG, WebP | das Bild; erkannter Text, wenn OCR eingeschaltet ist |
| Archive | ZIP | die Ordnerstruktur und jede enthaltene Datei einzeln |

Nodestro prüft den **echten Inhalt**, nicht nur die Endung: Eine umbenannte Datei, eine beschädigte Datei oder ein ungültiges JSON wird mit einem verständlichen Grund abgelehnt. Gescannte PDFs ohne Textebene werden mit OCR gelesen, wenn die Texterkennung eingeschaltet ist. Excel-Formeln werden nie berechnet; gelesen wird der gespeicherte Wert.

## Mehrere Dateien und Ordner {#mehrere-dateien}
<!-- keywords: mehrere dateien, ordner, verzeichnis, sammlung, relative pfade -->

Mit **Ordner wählen** oder durch Ziehen eines Ordners lädst du alle Dateien darin hoch. Die relativen Pfade bleiben im Dateinamen erhalten (etwa `Belege/2024/Rechnung.pdf`). Versteckte Systemdateien werden übersprungen. Für sehr viele Dateien eignet sich ein ZIP-Archiv besser.

## ZIP-Archive {#zip-archive}
<!-- keywords: zip, archiv, entpacken, baum, struktur, ordner, einzelne dateien -->

Ein ZIP-Archiv ist eine strukturierte Sammlung. Nodestro zeigt den Inhalt als Baum mit Größen und markiert, was gelesen werden kann. Klicke eine Datei im Baum an, um zu sehen, was Nodestro daraus liest.

Agenten bekommen zuerst eine **Übersicht** des Archivs und lesen dann gezielt einzelne Dateien mit dem Tool `input_files` (Befehle `list`, `read` und `search`). So bleibt ein großes Archiv im Rahmen des Kontexts. Archive im Archiv werden aufgelistet, aber nicht geöffnet.

## Übergabe an Agenten {#uebergabe}
<!-- keywords: übergabe, kontext, große dateien, tokens, kontextgrenze, multimodal, bild, ocr, übersicht -->

Agenten, die vom Start-Knoten Eingaben bekommen, erhalten die Dateien des Laufs. Nodestro wählt die Form so, dass Struktur erhalten bleibt und der Kontext nicht überläuft:

- **Text und Tabellen** gehen als Text an den Agenten, solange sie passen (rund 60.000 Zeichen pro Datei, 150.000 für alle Dateien zusammen).
- **PDFs** mit Textebene gehen als Dokument an den Agenten (Text und Layout), bis 100 Seiten.
- **Bilder** sieht der Agent selbst, wenn das Modell Bilder versteht. Sonst wird das vermerkt. Bei OCR siehst du, ob der Agent den erkannten Text oder das Bild bekommen hat.
- **Große Dateien und Archive** kommen als Übersicht. Der Agent liest benötigte Teile gezielt mit `input_files`, etwa bestimmte Seiten, ein Tabellenblatt oder Zeilenbereiche.

Mit der Einstellung *Übergabe an Agenten* erzwingst du den Inhalt oder die Übersicht. Hochgeladene Inhalte sind für Agenten immer **Daten, keine Anweisungen**: Nodestro kennzeichnet sie entsprechend.

## Nachvollziehen {#nachvollziehen}
<!-- keywords: nachvollziehen, trace, kontext, welche dateien, vorschau, modell gesendet, transparenz -->

- Die **Eingabe-Vorschau** eines Agenten zeigt vor dem Start, welche Dateien er bekommt und in welcher Form.
- In der Detailansicht eines Laufs zeigt der Reiter *Kontext* jedes Schritts, welche Dateien an das Modell gingen und wie (als Text, als PDF-Dokument, als Bild, als erkannter Text oder als Übersicht).
- Aufrufe von `input_files` stehen mit Ein- und Ausgabe unter *Tools*.
- *Erhaltene Dateien* listet alles, was der Lauf bekommen hat, und ob es inzwischen ins Wissen übernommen wurde.

## Eingabe oder Wissen? {#eingabe-oder-wissen}
<!-- keywords: unterschied, eingabe, wissen, knowledge, memory, dauerhaft, einmalig -->

| | Datei als Eingabe | Wissen | Memory |
|---|---|---|---|
| Wofür | Material dieses einen Laufs | Dokumente für viele Läufe und Agenten | Notizen, die ein Agent selbst schreibt |
| Gespeichert | beim Lauf | auf der Seite *Wissen* | im Memory-Raum |
| Durchsuchbar | nur innerhalb des Laufs | ja, für zugewiesene Agenten | über das Memory-Tool |

Eingabedateien landen nie automatisch im Wissen.

## Ins Wissen übernehmen {#knowledge-uebernahme}
<!-- keywords: übernehmen, wissen, knowledge, sammlung, bestätigen, herkunft, duplikat, ergebnis -->

Über **Zum Wissen** übernimmst du ausdrücklich:

- hochgeladene Dateien eines Laufs, bei ZIP-Archiven einzelne Dateien aus dem Baum,
- Ergebnisdateien (siehe [Ergebnisdateien](/docs/dateien#ergebnisdateien)),
- das Ergebnis eines Schritts und Vorschläge von Agenten.

Der Dialog zeigt vor dem Speichern, was gespeichert würde, ob die Datei durchsuchbar ist, ob es denselben Inhalt schon gibt (er wird nicht doppelt gespeichert) und ähnliche Inhalte. Erzeugte Texte kannst du vor dem Speichern bearbeiten und als *aus Quellen entnommen*, *von einem Agenten erzeugt* oder *Annahme* kennzeichnen. Du wählst eine Sammlung oder legst eine neue an.

Gespeichert wird erst nach deiner Bestätigung, und nur genau der geprüfte Inhalt: Änderst du danach etwas, prüfst du erneut. Jede Datei behält ihre Herkunft (Workflow, Schritt, Agent, Lauf, Zeitpunkt, Quelldateien). Laufende Workflows ändern sich dadurch nicht.

## Vorschläge von Agenten {#vorschlaege}
<!-- keywords: vorschlag, vorschläge, agent schlägt vor, propose_knowledge, wissen vorschlagen -->

Im Abschnitt *Wissen* eines Agenten schaltest du **Darf Inhalte fürs Wissen vorschlagen** ein. Der Agent bekommt dann das Tool `propose_knowledge` und sein Ergebnis wird nach dem Lauf als Vorschlag angeboten. Vorschläge erscheinen beim Schritt im Lauf und werden erst gespeichert, wenn du sie geprüft und bestätigt hast.

## Unterworkflows, Tests und Zeitpläne {#sub-workflows}
<!-- keywords: unterworkflow, testreihe, stapel, zeitplan, freigabe, fortsetzen, neustart -->

- **Unterworkflows:** Ein Datei-Feld des Unterworkflows bekommt mit `{{form.<feld>}}` die Dateien eines Felds oder mit `{{files}}` alle Dateien des Laufs. Es werden dieselben gespeicherten Dateien weitergegeben, keine Kopien.
- **Freigaben und Fortsetzen:** Die Dateien bleiben gespeichert, solange ein Lauf wartet, läuft oder pausiert, auch über einen Neustart von Nodestro hinweg.
- **Testfälle und Zeitpläne:** Dateien, die du dort hochlädst, bleiben für den Testfall oder [Zeitplan](/docs/automatisierung#zeitplaene) gespeichert und werden von jedem Lauf verwendet. Dateien früherer Läufe werden nie stillschweigend wiederverwendet.

## Dateien über die API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, upload, curl, export, fastapi -->

Veröffentlichte Workflows nehmen Dateien auf zwei Arten an:

- als JSON mit `name`, `media_type` und `content_base64` im Wert des Datei-Felds,
- als `multipart/form-data`: ein Teil pro Datei mit dem Namen des Datei-Felds, die übrigen Felder als JSON im Teil `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/vertraege-pruefen/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"kunde": "ACME"}' \
  -F "vertrag=@vertrag.pdf"
```

Es gelten dieselben Prüfungen und Grenzen wie in Nodestro. Ein [exportiertes FastAPI-Projekt](/docs/api-und-export#export) verarbeitet Dateien mit derselben Laufzeit. Hochgeladene Dateien sind nie Teil des Exports.

## Speicherung und Aufräumen {#speicherung}
<!-- keywords: speicherung, aufräumen, löschen, speicherplatz, backup, wiederherstellen -->

Hochgeladene Dateien liegen im Datenordner unter `inputs`, nicht in der Datenbank und nicht im Workflow. Gleiche Inhalte werden nur einmal gespeichert.

- Dateien wartender, laufender oder pausierter Läufe werden nie entfernt.
- Beim Start räumt Nodestro Dateien auf, die seit mehr als einem Tag nichts mehr nutzt. Unter *Einstellungen* siehst du den Speicherplatz und entfernst ungenutzte Dateien oder Dateien abgeschlossener Läufe ab einem bestimmten Alter.
- Beim Löschen eines Laufs werden seine Dateien freigegeben, wenn nichts anderes sie nutzt.
- Backups enthalten die Eingabedateien und stellen sie wieder her.

## Sicherheit {#sicherheit}
<!-- keywords: sicherheit, zip bombe, pfad, symlink, ausführen, makro, vertrauen -->

- Archive werden nie ausgeführt und nie auf die Festplatte entpackt. Nodestro liest einzelne Einträge im Speicher.
- Unsichere Pfade (etwa `../`), Verknüpfungen, verschlüsselte Einträge und Programmdateien werden übersprungen und im Baum gekennzeichnet.
- Grenzen schützen vor ZIP-Bomben: Archive mit mehr als 5.000 Einträgen, mehr als 512 MB entpackt oder auffälliger Kompression werden abgelehnt; einzelne Einträge über 25 MB werden übersprungen.
- Inhalte hochgeladener Dateien gelten als nicht vertrauenswürdig. Anweisungen darin befolgen Agenten nicht als Systemanweisung.

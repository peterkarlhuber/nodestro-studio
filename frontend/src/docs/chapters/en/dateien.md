# Files and documents

On request Nodestro writes results as files (Markdown, JSON, CSV, HTML, PDF, Word or Excel), and besides PDFs and texts it also reads Word and Excel files. Scanned PDFs can optionally be made readable with local text recognition (OCR). Everything runs on your computer, without extra accounts.

## Result files {#ergebnisdateien}
<!-- keywords: result file, file, export, report, markdown, json, csv, html, pdf, download, sanitize -->

In the inspector of the **Result** node, *Result files* sets the formats in which the result is saved at the end of every run. Without an entry no file is written.

| Format | Content |
|---|---|
| Markdown (.md) | the result as text; structured results as sections |
| JSON (.json) | the result as data |
| CSV (.csv) | a table; needs a list of records or an object of simple values |
| HTML (.html) | a standalone page with headings, lists and tables |
| PDF (.pdf) | the same content on A4 pages |
| Word (.docx) | a document with headings, paragraphs, lists, tables and emphasis |
| Excel (.xlsx) | tables with number, date and yes/no columns; several tables as separate sheets |

Several formats per run are possible. All files are created locally without an AI request; they are available the same way through the published API and in the exported project.

- **File name:** empty means the name of the workflow.
- **Sanitize:** replaces credentials and personal data with placeholders, like the [sanitized trace export](/docs/ausfuehrungen#trace-export).
- In a run's detail view, the **Result files** area lists every file to view, download and delete. *Create file* also creates a file afterwards from the overall result or from the result of a single step.
- Files belong to the run: they are part of backups and are deleted with the run. A file is at most 10 MB.
- HTML is shown in the preview without scripts. The PDF uses the standard fonts; characters outside the Western European character set appear as "?".

If a file cannot be written (say CSV from running text), the run shows the file with the reason; the result itself is kept.

## Word and Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, sheet, formula, convert, document formats, office -->

You can upload **Word (DOCX)** and **Excel (XLSX)** to [Knowledge](/docs/wissen#formate) like other files. Nodestro converts them to Markdown on upload and stores and searches that text; the file carries the note "converted from DOCX/XLSX".

- **Word:** paragraphs, headings, lists and tables in the order of the document.
- **Excel:** one section per sheet with a table of the used cells. **Formulas are never calculated:** the cell shows the value Excel saved and, next to it, the formula as text.
- Very large tables are shortened (at most 5,000 rows and 200 columns per sheet); the file then shows "shortened".

For [batch runs](/docs/automatisierung#stapel) Nodestro reads Excel tables directly as rows.

## Text recognition (OCR) {#ocr}
<!-- keywords: ocr, text recognition, scan, scanned, tesseract, image pdf, text layer, uncertain -->

Scanned PDFs without a text layer are not searchable at first. **Local text recognition** makes them readable:

1. Install **Tesseract** with the language data of your documents (German, English, Spanish, French, Italian or Portuguese) and **pdftoppm** and **pdfinfo** (both from Poppler) on your computer, for example with your system's package manager.
2. In [Settings](/docs/einstellungen), under *Text recognition (OCR)*, switch on *Use OCR for scans*. The setting shows whether Tesseract was found.
3. New scans are recognised on upload; for existing ones click *Recognise text (OCR)* in Knowledge.

Recognition runs entirely locally; no data is sent. Uncertain words are marked in the text as `[?word]` and counted, so agents and you know the text may contain errors. Check important figures in the original.

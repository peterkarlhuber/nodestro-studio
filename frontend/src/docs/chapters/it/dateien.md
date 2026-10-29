# File e documenti

Su richiesta Nodestro salva i risultati come file (Markdown, JSON, CSV, HTML, PDF, Word o Excel) e, oltre a PDF e testi, legge anche file Word ed Excel. I PDF scansionati possono facoltativamente essere resi leggibili con il riconoscimento del testo locale (OCR). Tutto gira sul tuo computer, senza account aggiuntivi.

## File di risultato {#ergebnisdateien}
<!-- keywords: file di risultato, file, esportare, report, markdown, json, csv, html, pdf, scaricare, ripulire -->

Nell'inspector del nodo **Risultato**, *File di risultato* stabilisce in quali formati il risultato viene salvato alla fine di ogni esecuzione. Senza voci non viene scritto alcun file.

| Formato | Contenuto |
|---|---|
| Markdown (.md) | il risultato come testo; i risultati strutturati come sezioni |
| JSON (.json) | il risultato come dati |
| CSV (.csv) | una tabella; richiede un elenco di record o un oggetto di valori semplici |
| HTML (.html) | una pagina autonoma con titoli, elenchi e tabelle |
| PDF (.pdf) | lo stesso contenuto su pagine A4 |
| Word (.docx) | un documento con titoli, paragrafi, elenchi, tabelle ed evidenziazioni |
| Excel (.xlsx) | tabelle con colonne di numeri, date e sì/no; più tabelle come fogli separati |

Sono possibili più formati per esecuzione. Tutti i file vengono creati localmente, senza richieste all’IA; sono disponibili allo stesso modo tramite l’API pubblicata e nel progetto esportato.

- **Nome del file:** vuoto significa il nome del workflow.
- **Ripulisci:** sostituisce credenziali e dati personali con segnaposto, come nell'[esportazione ripulita della traccia](/docs/ausfuehrungen#trace-export).
- Nella vista di dettaglio di un'esecuzione, l'area **File di risultato** elenca tutti i file da visualizzare, scaricare ed eliminare. Con *Crea file* crei un file anche in seguito, dal risultato complessivo o dal risultato di un singolo passaggio.
- I file appartengono all'esecuzione: fanno parte dei backup e vengono eliminati con l'esecuzione. Un file è al massimo di 10 MB.
- L'HTML viene mostrato nell'anteprima senza script. Il PDF usa i font standard; i caratteri fuori dal set dell'Europa occidentale compaiono come «?».

Se un file non può essere scritto (per esempio un CSV da un testo continuo), l'esecuzione mostra il file con il motivo; il risultato in sé resta.

## Word ed Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, foglio, formula, convertire, formati di documento, office -->

Puoi caricare **Word (DOCX)** ed **Excel (XLSX)** nella [Conoscenza](/docs/wissen#formate) come altri file. Nodestro li converte in Markdown al caricamento e salva e cerca quel testo; il file riporta l'indicazione «convertito da DOCX/XLSX».

- **Word:** paragrafi, titoli, elenchi e tabelle nell'ordine del documento.
- **Excel:** una sezione per foglio con una tabella delle celle usate. **Le formule non vengono mai calcolate:** la cella mostra il valore salvato da Excel e, accanto, la formula come testo.
- Le tabelle molto grandi vengono accorciate (al massimo 5.000 righe e 200 colonne per foglio); il file mostra allora «accorciato».

Per le [esecuzioni in serie](/docs/automatisierung#stapel) Nodestro legge le tabelle Excel direttamente come righe.

## Riconoscimento del testo (OCR) {#ocr}
<!-- keywords: ocr, riconoscimento del testo, scansione, scansionato, tesseract, pdf immagine, livello di testo, incerto -->

I PDF scansionati senza livello di testo all'inizio non sono ricercabili. Il **riconoscimento del testo locale** li rende leggibili:

1. Installa **Tesseract** e **pdftoppm** (Poppler) sul tuo computer, per esempio con il gestore di pacchetti del tuo sistema.
2. Nelle [Impostazioni](/docs/einstellungen), sotto *Riconoscimento del testo (OCR)*, attiva *Usa l'OCR per le scansioni*. L'impostazione mostra se Tesseract è stato trovato.
3. Le nuove scansioni vengono riconosciute al caricamento; per quelle esistenti fai clic su *Riconosci testo (OCR)* nella Conoscenza.

Il riconoscimento gira interamente in locale; nessun dato viene inviato. Le parole incerte vengono segnate nel testo come `[?parola]` e contate, così gli agenti e tu sapete che il testo può contenere errori. Controlla le cifre importanti nell'originale.

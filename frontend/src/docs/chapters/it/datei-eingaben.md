# File come input

I workflow possono ricevere file direttamente come input: contratti, fatture, fogli di calcolo, immagini o interi archivi ZIP. Li carichi all’avvio, senza inserirli prima nella conoscenza. Nodestro li verifica e li legge localmente e dà agli agenti esattamente ciò che serve loro.

## Panoramica {#ueberblick}
<!-- keywords: file, caricare, upload, input, documento, allegato, avvio -->

- Nel modulo di input del nodo **Avvio** aggiungi campi di tipo **File**. All’avvio trascini i file nel campo o li scegli.
- Anche senza modulo puoi caricare file o sceglierli dalla conoscenza in *File* nella finestra di avvio.
- I file caricati appartengono all’**esecuzione**, non alla conoscenza. Sono elencati nella vista dettagliata dell’esecuzione in *File ricevuti*.
- Ciò che deve restare disponibile per tutti gli agenti lo inserisci esplicitamente [nella conoscenza](/docs/wissen#sammlungen).

## Campi file {#datei-felder}
<!-- keywords: campo file, modulo, trascinamento, cartella, scegliere -->

Un campo file accetta file trascinati o tramite **Scegli file**. Ogni file viene caricato e verificato subito. L’elenco mostra nome, formato, dimensione, stato e, in caso di rifiuto, il motivo. Prima dell’avvio puoi rimuovere file e vedere con l’icona a occhio cosa ha letto Nodestro.

L’esecuzione parte solo quando tutti i file sono caricati. I file rifiutati non fanno mai parte dell’esecuzione.

Nel compito di un agente, `{{form.<nome>}}` indica i nomi dei file del campo. L’agente riceve inoltre i contenuti, come descritto in [Consegna agli agenti](/docs/datei-eingaben#uebergabe). Altro sui moduli: [Moduli di input](/docs/verzweigungen#eingabeformular).

## Impostazioni del campo {#feld-einstellungen}
<!-- keywords: impostazioni, tipi consentiti, più file, massimo, dimensione, mb, limite -->

Nell’inspector del nodo Avvio ogni campo file ha queste impostazioni:

| Impostazione | Significato |
|---|---|
| Tipi di file consentiti | gruppi (testo, dati, documenti, immagini, archivi ZIP) o singoli formati; senza selezione sono accettati tutti |
| Più file | disattivato: esattamente un file; attivato: più file |
| Numero massimo di file | limite facoltativo con più file |
| MB massimi per file | 20 MB di default, al massimo 50 MB |
| Consegna agli agenti | *Automatica*, *Sempre il contenuto* o *Panoramica, contenuto su richiesta* |

## Campi obbligatori e facoltativi {#optionale-felder}
<!-- keywords: obbligatorio, facoltativo, vuoto, mancante, non indicato, è vuoto -->

Ogni campo, non solo i campi file, è **obbligatorio** o **facoltativo**. Un campo obbligatorio va compilato prima dell’avvio. Un campo facoltativo vuoto resta vuoto:

- Nel compito di un agente appare come «(not provided)», così l’agente capisce che non è stato indicato nulla.
- I nodi decisionali vedono un valore vuoto e possono verificarlo con *è vuoto*.
- I campi file vuoti non creano riferimenti a file. Vale anche per sotto-workflow, API pubblicate e progetti esportati.

## Formati supportati {#formate}
<!-- keywords: formati, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, immagine, zip -->

| Gruppo | Formati | Cosa legge Nodestro |
|---|---|---|
| Testo | TXT, Markdown, codice sorgente | il testo |
| Dati | CSV, JSON, Excel (XLSX) | tabelle con colonne; Excel con tutti i fogli |
| Documenti | PDF, Word (DOCX) | testo con titoli e tabelle; pagine per i PDF |
| Immagini | PNG, JPG, WebP | l’immagine; testo riconosciuto se l’OCR è attivo |
| Archivi | ZIP | la struttura delle cartelle e ogni file contenuto singolarmente |

Nodestro verifica il **contenuto reale**, non solo l’estensione: un file rinominato, un file danneggiato o un JSON non valido viene rifiutato con un motivo comprensibile. I PDF scansionati senza livello di testo vengono letti con OCR se il riconoscimento del testo è attivo. Le formule di Excel non vengono mai calcolate; si legge il valore salvato.

## Più file e cartelle {#mehrere-dateien}
<!-- keywords: più file, cartella, directory, raccolta, percorsi relativi -->

Con **Scegli cartella**, o trascinando una cartella, carichi tutti i file che contiene. I percorsi relativi restano nel nome del file (ad es. `Ricevute/2024/Fattura.pdf`). I file di sistema nascosti vengono saltati. Per moltissimi file è meglio un archivio ZIP.

## Archivi ZIP {#zip-archive}
<!-- keywords: zip, archivio, estrarre, albero, struttura, cartella, singoli file -->

Un archivio ZIP è una raccolta strutturata. Nodestro ne mostra il contenuto come albero con le dimensioni e segna cosa si può leggere. Fai clic su un file dell’albero per vedere cosa ne legge Nodestro.

Gli agenti ricevono prima una **panoramica** dell’archivio e poi leggono singoli file con lo strumento `input_files` (comandi `list`, `read` e `search`). Così un archivio grande resta nei limiti del contesto. Gli archivi contenuti nell’archivio vengono elencati, ma non aperti.

## Consegna agli agenti {#uebergabe}
<!-- keywords: consegna, contesto, file grandi, token, limite di contesto, multimodale, immagine, ocr, panoramica -->

Gli agenti che ricevono input dal nodo Avvio ottengono i file dell’esecuzione. Nodestro sceglie la forma in modo da mantenere la struttura e non far traboccare il contesto:

- **Testi e tabelle** arrivano all’agente come testo finché ci stanno (circa 60.000 caratteri per file, 150.000 per tutti i file insieme).
- **I PDF** con livello di testo arrivano come documento (testo e impaginazione), fino a 100 pagine.
- **Le immagini** l’agente le vede direttamente se il modello comprende le immagini. Altrimenti viene segnalato. Con l’OCR vedi se l’agente ha ricevuto il testo riconosciuto o l’immagine.
- **File grandi e archivi** arrivano come panoramica. L’agente legge le parti necessarie con `input_files`, ad es. certe pagine, un foglio o intervalli di righe.

L’impostazione *Consegna agli agenti* impone il contenuto o la panoramica. Per gli agenti, il contenuto caricato è sempre un **dato, non un’istruzione**: Nodestro lo segnala di conseguenza.

## Tracciabilità {#nachvollziehen}
<!-- keywords: tracciabilità, trace, contesto, quali file, anteprima, inviato al modello, trasparenza -->

- L’**anteprima dell’input** di un agente mostra prima dell’avvio quali file riceve e in che forma.
- Nella vista dettagliata di un’esecuzione, la scheda *Contesto* di ogni passaggio mostra quali file sono andati al modello e come (come testo, come documento PDF, come immagine, come testo riconosciuto o come panoramica).
- Le chiamate a `input_files` compaiono con input e output in *Strumenti*.
- *File ricevuti* elenca tutto ciò che l’esecuzione ha ricevuto e se nel frattempo è stato inserito nella conoscenza.

## Input o conoscenza? {#eingabe-oder-wissen}
<!-- keywords: differenza, input, conoscenza, knowledge, memoria, permanente, una tantum -->

| | File come input | Conoscenza | Memoria |
|---|---|---|---|
| A cosa serve | materiale di questa esecuzione | documenti per molte esecuzioni e agenti | note che l’agente scrive da sé |
| Dove resta | con l’esecuzione | nella pagina *Conoscenza* | nello spazio di memoria |
| Ricercabile | solo nell’esecuzione | sì, per gli agenti assegnati | con lo strumento di memoria |

I file di input non finiscono mai automaticamente nella conoscenza.

## Inserire nella conoscenza {#knowledge-uebernahme}
<!-- keywords: inserire, conoscenza, raccolta, confermare, provenienza, duplicato, risultato -->

Con **Alla conoscenza** inserisci esplicitamente:

- i file caricati di un’esecuzione; per gli archivi ZIP, singoli file dall’albero,
- i file di risultato (vedi [File di risultato](/docs/dateien#ergebnisdateien)),
- il risultato di un passaggio e le proposte degli agenti.

Prima del salvataggio la finestra mostra cosa verrebbe salvato, se il file è ricercabile, se lo stesso contenuto esiste già (non viene salvato due volte) e contenuti simili. I testi generati si possono modificare prima del salvataggio e contrassegnare come *estratto dalle fonti*, *generato da un agente* o *ipotesi*. Scegli una raccolta o ne crei una nuova.

Nulla viene salvato prima della tua conferma, e solo esattamente il contenuto verificato: se cambi qualcosa dopo, verifichi di nuovo. Ogni file conserva la sua provenienza (workflow, passaggio, agente, esecuzione, momento, file di origine). I workflow in corso non cambiano.

## Proposte degli agenti {#vorschlaege}
<!-- keywords: proposta, proposte, l’agente propone, propose_knowledge, proporre conoscenza -->

Nella sezione *Conoscenza* di un agente attiva **Può proporre contenuti per la conoscenza**. L’agente riceve allora lo strumento `propose_knowledge` e il suo risultato viene proposto dopo l’esecuzione. Le proposte compaiono al passaggio dell’esecuzione e vengono salvate solo dopo che le hai verificate e confermate.

## Sotto-workflow, test e pianificazioni {#sub-workflows}
<!-- keywords: sotto-workflow, serie di test, lotto, pianificazione, approvazione, ripresa, riavvio -->

- **Sotto-workflow:** un campo file del sotto-workflow riceve con `{{form.<campo>}}` i file di un campo o con `{{files}}` tutti i file dell’esecuzione. Vengono passati gli stessi file salvati, senza copie.
- **Approvazioni e ripresa:** i file restano salvati finché un’esecuzione attende, è in corso o in pausa, anche dopo un riavvio di Nodestro.
- **Casi di test e pianificazioni:** i file che carichi lì restano salvati per il caso di test o la [pianificazione](/docs/automatisierung#zeitplaene) e vengono usati da ogni esecuzione. I file di esecuzioni precedenti non vengono mai riutilizzati in silenzio.

## File tramite l’API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, caricamento, curl, esportazione, fastapi -->

I workflow pubblicati accettano file in due modi:

- come JSON con `name`, `media_type` e `content_base64` nel valore del campo file,
- come `multipart/form-data`: una parte per file con il nome del campo file, gli altri campi come JSON nella parte `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/verifica-contratti/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"cliente": "ACME"}' \
  -F "contratto=@contratto.pdf"
```

Valgono le stesse verifiche e gli stessi limiti di Nodestro. Un [progetto FastAPI esportato](/docs/api-und-export#export) elabora i file con lo stesso motore. I file caricati non fanno mai parte dell’esportazione.

## Archiviazione e pulizia {#speicherung}
<!-- keywords: archiviazione, pulizia, eliminare, spazio su disco, backup, ripristino -->

I file caricati restano nella cartella dati in `inputs`, non nel database né nel workflow. Contenuti identici vengono salvati una sola volta.

- I file di esecuzioni in coda, in corso o in pausa non vengono mai rimossi.
- All’avvio Nodestro pulisce i file che nulla usa da più di un giorno. In *Impostazioni* vedi lo spazio occupato e rimuovi i file inutilizzati o quelli di esecuzioni concluse oltre una certa età.
- Eliminare un’esecuzione libera i suoi file se nient’altro li usa.
- I backup contengono i file di input e li ripristinano.

## Sicurezza {#sicherheit}
<!-- keywords: sicurezza, bomba zip, percorso, link simbolico, eseguire, macro, fiducia -->

- Gli archivi non vengono mai eseguiti né estratti su disco. Nodestro legge singole voci in memoria.
- Percorsi non sicuri (come `../`), collegamenti, voci cifrate e file di programma vengono saltati e segnalati nell’albero.
- Limiti proteggono dalle bombe ZIP: archivi con più di 5.000 voci, più di 512 MB estratti o compressione sospetta vengono rifiutati; le voci oltre 25 MB vengono saltate.
- Il contenuto dei file caricati non è attendibile. Gli agenti non seguono le istruzioni al suo interno come istruzioni di sistema.

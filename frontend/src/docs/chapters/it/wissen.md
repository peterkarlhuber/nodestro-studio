# Conoscenza

In *Conoscenza* salvi i file che gli agenti usano come materiale di riferimento: manuali, report, contratti, tabelle o immagini. Questo capitolo spiega i formati, i tre modi d'uso e come funziona la ricerca.

## Panoramica {#ueberblick}
<!-- keywords: conoscenza, base di conoscenza, file, conoscenza di contesto, rag, documenti -->

La conoscenza funziona in tre passaggi:

1. **Caricare** nella pagina *Conoscenza*. Testi e PDF vengono indicizzati automaticamente per la ricerca full-text.
2. **Assegnare** nell'ispettore di un agente (sezione *Conoscenza*). Un agente vede solo i file che gli sono assegnati.
3. **Scegliere la modalità:** *Nel contesto*, *Su richiesta* o *Ricerca*.

Un file può essere assegnato a quanti agenti vuoi.

## Caricare file {#hochladen}
<!-- keywords: caricare, upload, trascina e rilascia, trascinare, descrizione -->

Fai clic su **Carica file** o trascina i file nell'area di rilascio; puoi caricarne più di uno alla volta. Ogni file mostra dimensione, tipo, numero di sezioni indicizzate ed età. Il nome del file apre l'originale in una nuova scheda.

Se carichi di nuovo **esattamente lo stesso file**, non si crea un duplicato: l'identificativo deriva dal contenuto, e nome e descrizione vengono aggiornati.

Puoi anche caricare file direttamente nella sezione *Conoscenza* di un agente; arrivano qui, senza raccolta, e sono subito assegnati a quell’agente ([Agenti](/docs/agenten#wissen)).

## Formati e limiti {#formate}
<!-- keywords: formati, pdf, immagine, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, dimensione, limite, mb -->

| Tipo | Formati | Dimensione | Ricercabile |
|---|---|---|---|
| Documenti | PDF | fino a 20 MB | sì, pagina per pagina (PDF con livello di testo o dopo l'OCR) |
| Office | Word (DOCX), Excel (XLSX), convertiti in Markdown | fino a 20 MB | sì |
| Testi | TXT, Markdown, CSV, JSON, YAML, HTML, XML | fino a 20 MB | sì |
| Immagini | PNG, JPEG, GIF, WebP | fino a 5 MB | no |

I testi devono essere codificati in UTF-8. Word ed Excel vengono convertiti al caricamento; le formule vengono mostrate, mai calcolate (vedi [Word ed Excel](/docs/dateien#dokumentformate)). I **PDF scansionati** senza livello di testo vengono salvati e possono essere letti nel contesto o su richiesta, ma diventano ricercabili solo dopo un [riconoscimento del testo (OCR)](/docs/dateien#ocr).

## Indicizzazione {#indexierung}
<!-- keywords: indice, indicizzazione, sezioni, chunks, fts5, full-text -->

Al caricamento, Nodestro divide il testo in **sezioni** di circa 1.500 caratteri con 200 caratteri di sovrapposizione, ai confini dei paragrafi. I PDF vengono indicizzati pagina per pagina; i risultati hanno allora titoli come «Report, p. 3». Il numero di sezioni è indicato accanto a ogni file.

L'indice è una ricerca full-text SQLite (FTS5 con ranking BM25) direttamente nel database di Nodestro. Non servono servizi esterni né modelli di embedding, e l'indicizzazione non costa nulla.

## Le tre modalità {#modi}
<!-- keywords: nel contesto, su richiesta, ricerca, on demand, context, search, strumento files, strumento search, modalità -->

| Modalità | Cosa riceve l'agente | Adatta per | Costi |
|---|---|---|---|
| **Nel contesto** | Tutti i file assegnati, completi, all'inizio del prompt. | Pochi documenti brevi sempre necessari (guida di stile, listino prezzi). Anche immagini. | Ogni richiesta contiene tutti i file; la cache rende economiche le ripetizioni. |
| **Su richiesta** | Un catalogo (nome, tipo, dimensione, descrizione) e lo strumento `files`, con cui carica singoli file completi. | Raccolte medie in cui per ogni compito servono solo alcuni file. Anche immagini e PDF scansionati. | Costano token solo i file caricati. |
| **Ricerca** | Lo strumento `search`, che restituisce le sezioni più pertinenti con la fonte (RAG). | Documenti e raccolte grandi da cui servono singoli fatti. | Costano token solo le sezioni trovate. |

**Consigli:**

- In modalità *Su richiesta* l'agente decide quale file caricare in base alla **descrizione**. Cura descrizioni significative.
- In modalità *Ricerca* l'agente può cercare più volte con termini diversi. Chiedigli nel prompt di sistema di supportare le affermazioni con le fonti.
- Immagini e PDF senza testo sono invisibili in modalità *Ricerca*.

## Citazioni {#zitate}
<!-- keywords: citazioni, citations, fonti, passaggi, supportare -->

**Attiva le citazioni** vale per la modalità *Nel contesto*: la risposta rimanda allora ai passaggi esatti dei documenti. In modalità *Ricerca* i risultati riportano sempre le fonti.

Le citazioni **non si possono combinare con un formato di output strutturato**; la verifica lo segnala come errore.

## Allegare file all'avvio {#start-dateien}
<!-- keywords: allegare file, finestra di avvio, una tantum, per esecuzione, allegato -->

Nella finestra di avvio puoi scegliere in **Allega file** dei file di conoscenza per **questa singola esecuzione**. Vengono inseriti direttamente nel contesto dei primi agenti, cioè quelli collegati all'avvio o senza predecessori. Gli agenti successivi non li ricevono, ma solo i risultati dei loro predecessori.

Così puoi, per esempio, avviare un workflow ogni volta con un contratto diverso senza riconfigurare gli agenti. Il file deve essere stato caricato prima in *Conoscenza*.

## Provare la ricerca {#suche}
<!-- keywords: provare la ricerca, termine di ricerca, punteggio, score, risultati, bm25, accenti -->

A destra della pagina *Conoscenza* provi la ricerca su **tutti** i file indicizzati, esattamente come la usa un agente in modalità *Ricerca* (l'agente cerca solo nei file assegnati). Ogni risultato mostra titolo, estratto e **punteggio** (rilevanza; più alto è meglio).

Caratteristiche della ricerca:

- Gli accenti vengono uniformati: «citta» trova «città».
- Le parole corrispondono anche come inizio di parola: «contratt» trova «contratto» e «contrattuale».
- È una ricerca per parole chiave, non per significato: i sinonimi non vengono trovati. Formula i termini come compaiono nel documento.

Il campo filtro a sinistra cerca solo nei nomi dei file e nelle descrizioni.

## Raccolte e provenienza {#sammlungen}
<!-- keywords: raccolta, raccolte, ordinare, provenienza, inserito, ricercabile -->

Le raccolte raggruppano i file della conoscenza, ad es. «Contratti» o «Dati prodotto». Durante il caricamento scegli una raccolta in *Carica nella raccolta*; puoi cambiarla in seguito per ogni file. I chip sopra l’elenco filtrano per raccolta. Gli agenti ricevono sempre esattamente i file assegnati.

I contenuti delle esecuzioni (file caricati, file di risultato, risultati e proposte degli agenti) entrano nella conoscenza solo dopo la tua conferma, vedi [Inserire nella conoscenza](/docs/datei-eingaben#knowledge-uebernahme). Questi file mostrano in *Provenienza* da quale workflow, passaggio ed esecuzione provengono e se il contenuto è estratto, generato o un’ipotesi.

## Gestire i file {#verwalten}
<!-- keywords: modificare descrizione, eliminare, gestire, rimuovere -->

- **Descrizione:** inseriscila direttamente accanto al file; viene salvata quando esci dal campo. Una buona descrizione indica contenuto, periodo e scopo, per esempio «Relazione annuale 2025 con bilancio e relazione sui rischi».
- **Eliminare:** simbolo del cestino. Il file e il suo indice vengono rimossi. Gli agenti a cui era assegnato continuano a funzionare e semplicemente non lo ricevono più. **Usato in**, sotto il nome del file, indica i workflow, gli agenti della libreria e le API pubblicate che usano il file. Se è in uso, la finestra di eliminazione elenca questi punti prima di eliminarlo.

## Consigli ed errori frequenti {#tipps}
<!-- keywords: consigli, errori, l'agente non trova nulla, troppo costoso, contesto troppo grande -->

- **L'agente non trova nulla:** controlla in *Prova la ricerca* se il file è indicizzato e se il termine viene trovato. Se il file è un PDF scansionato, usa *Su richiesta*.
- **Le esecuzioni costano troppo:** molti file grandi *Nel contesto* riempiono ogni richiesta. Passa a *Su richiesta* o *Ricerca*.
- **Finestra di contesto superata:** troppi file, o file troppo grandi, nel contesto causano un errore dell'API. Distribuisci la conoscenza o usa la ricerca.
- **Risposta senza fonti:** chiedi esplicitamente nel prompt di sistema di supportare le affermazioni con le fonti.

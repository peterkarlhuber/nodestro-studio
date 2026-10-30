# Workflow di esempio

Nodestro include 24 workflow multi-agente pronti, uno per ogni tipico ambito di applicazione. Ogni esempio contiene agenti con prompt di sistema, i collegamenti, un compito di prova preparato con dati inventati e un risultato descritto chiaramente. Questo capitolo spiega la galleria, la copia e l'adattamento, e descrive ogni esempio singolarmente.

## La galleria {#galerie}
<!-- keywords: esempi, modelli, galleria, libreria, in evidenza, categorie, pagina iniziale -->

La galleria si trova nella pagina **Workflow**, sotto i tuoi workflow e chiaramente separata da essi. Mostra alcuni esempi in evidenza e le sei categorie. **Vedi tutti i 24 esempi** apre la galleria completa, anch'essa nell'area dei workflow.

Nella galleria completa cerchi per nome, ambito e descrizione e filtri per categoria. Ogni scheda mostra ambito, nome, descrizione, numero di agenti, livello e schema. Gli esempi degli ambiti sensibili hanno il badge **Richiede verifica esperta**. Anche la [ricerca](/docs/start#suche) trova gli esempi.

## Anteprima e copia {#uebernehmen}
<!-- keywords: anteprima, copiare, copia, modello, invariato, gratuito -->

Un clic su una scheda apre l'**anteprima**: il flusso come diagramma, ogni agente con ruolo, modello, strumenti e risultati che riceve, la guida e il compito di prova. L'anteprima non salva nulla e non chiama alcun modello.

**Copia nei miei workflow** crea un workflow tuo e lo apre nell'editor. La copia è indipendente: puoi cambiare tutto e il modello resta sempre invariato. Se copi un esempio due volte, ottieni due workflow separati. La copia parte dalla versione 1 nella [cronologia delle versioni](/docs/workflows#versionen).

Se **Aggiungere i casi di test come serie di test** è selezionato (predefinito), la copia riceve anche una [serie di test](/docs/automatisierung#testreihen) con i casi di test preparati; i file di esempio necessari vengono salvati come file di input della copia. La copia non avvia mai un'esecuzione, non crea mai una [pianificazione](/docs/automatisierung#zeitplaene) e non pubblica mai un'[API](/docs/api-und-export#veroeffentlichen); sei tu a deciderlo in seguito.

Gli esempi non vengono mai creati automaticamente; solo ciò che copi compare tra i tuoi workflow. I costi nascono solo quando esegui una copia. Gli esempi usano modelli di Anthropic; basta quel [provider configurato](/docs/einstellungen#anbieter), e puoi passare in qualsiasi momento i modelli di una copia a un altro provider. Nessun esempio richiede altri servizi, account o fonti di dati a pagamento.

## Lingue {#sprachen}
<!-- keywords: lingua, traduzione, tedesco, inglese, copia, prompt -->

La galleria e l'anteprima appaiono nella lingua dell'interfaccia. Nomi, descrizioni, prompt di sistema, compiti e compito di prova della copia vengono creati nella lingua che scegli nell'anteprima in **Lingua della copia**; predefinita è la lingua dell'interfaccia.

Una copia salvata resta nella sua lingua, anche se in seguito cambi l'interfaccia. Gli identificatori tecnici, come i nomi dei campi dell'output strutturato e i nomi degli strumenti, sono in inglese in tutte le lingue.

## Schemi e ruoli {#muster}
<!-- keywords: sequenziale, parallelo, revisione, giudice, controllo qualità, ruoli, struttura -->

Gli esempi usano solo gli agenti necessari al compito, di solito tre o quattro.

- **Sequenziale:** gli agenti lavorano uno dopo l'altro; ognuno si basa sul risultato del precedente.
- **Parallelo:** più agenti lavorano contemporaneamente sullo stesso input e un altro ne riunisce i risultati.
- **Ramificato:** una decisione o un'approvazione sceglie il percorso; non tutti gli agenti girano a ogni esecuzione (vedi [Ramificazioni e approvazioni](/docs/verzweigungen)).
- **Revisione:** un agente di verifica controlla il lavoro degli altri e spesso fornisce un output strutturato con campi fissi.
- **Controllo qualità:** per alcuni agenti un [controllo qualità](/docs/agenten#qualitaet) integrato valuta il risultato secondo criteri fissi e lo fa rivedere se necessario.

Le schede della galleria mostrano inoltre quali elementi usa un esempio: decisione, approvazione, modulo di input, sotto-workflow, file di risultato, file come input, proposte di conoscenza o memoria.

I ruoli nell'anteprima descrivono cosa fa un agente: ricerca, analisi, pianificazione, verifica o scrittura. I calcoli usano gli strumenti integrati, come la calcolatrice e il calcolo delle date; non costano nulla in più.

## Dati di prova {#testdaten}
<!-- keywords: compito di prova, dati di prova, sintetici, inventati, dati di esempio -->

Ogni compito di prova inizia con la nota **DATI DI ESEMPIO SINTETICI**. Aziende, persone, numeri e regole sono inventati e servono solo per provare. Dopo la copia il compito di prova è l'input suggerito del nodo di avvio; sostituiscilo lì con i tuoi dati.

## File di esempio e casi di test {#beispieldateien}
<!-- keywords: file di esempio, casi di test, serie di test, file, caricamento, pdf, excel, word, zip -->

Molti esempi hanno un [campo file](/docs/datei-eingaben#datei-felder) facoltativo, per esempio per un registro dei fermi in Excel, offerte in PDF e Word o un contratto come file Word. L'anteprima offre piccoli **file di esempio** fittizi da scaricare, coerenti con l'attività di prova. Puoi inserirli nel campo file all'avvio della copia e provare così come l'esempio lavora con i file. Senza file gli agenti lavorano con il testo come prima.

Ogni esempio ha inoltre dei **casi di test**, per esempio un caso con testo, uno con file di esempio e, negli esempi con decisione, un caso per ciascun percorso. Ogni caso di test contiene verifiche su campi del risultato. I casi di test copiati compaiono come serie di test della copia; vengono eseguiti solo quando avvii la serie e costano allora come normali esecuzioni.

L'esecuzione salva i file di risultato come PDF, Word o Excel in [File](/docs/dateien). Se un agente propone conoscenze da conservare, viene salvato solo ciò che adotti esplicitamente.

## Ambiti sensibili {#sensible-bereiche}
<!-- keywords: finanza, diritto, risorse umane, amministrazione, verifica, responsabilità, consulenza, cautela -->

Sei esempi riguardano finanza, diritto, risorse umane o amministrazione: analisi finanziaria, selezione del personale, revisione di contratti, bilancio familiare, confronto immobiliare e richiesta di un cittadino. I loro agenti ricevono nel prompt di sistema l'istruzione aggiuntiva di indicare le incertezze e di elencare i punti che una persona qualificata deve verificare.

I risultati sono strumenti di lavoro, non consulenza né una decisione. Verificali con competenza prima di usarli, inviarli o pubblicarli.

## Adattare gli esempi {#anpassen}
<!-- keywords: adattare, modificare, dati propri, conoscenza, modello, prompt -->

- **I tuoi dati:** sostituisci il compito di prova nel nodo di avvio o inserisci un tuo input all'avvio.
- **I tuoi file:** inserisci i documenti per una singola esecuzione direttamente nel campo file all'avvio; per questo non serve una raccolta di conoscenza.
- **Conoscenza:** carica i documenti che ti servono in modo permanente come [conoscenza](/docs/wissen#modi) e assegnali all'agente adatto.
- **Prompt e compiti:** i compiti fanno riferimento ai predecessori con dei [segnaposto](/docs/workflows#platzhalter). Se rinomini un agente, adatta i segnaposto.
- **Dati aggiornati:** per informazioni in tempo reale puoi aggiungere lo [strumento server](/docs/tools#server-tools) di ricerca web; costa un supplemento per ogni ricerca.

Le sezioni seguenti indicano adattamenti concreti per ogni esempio.

<!-- examples:start -->

## I 24 esempi in sintesi {#uebersicht}

Ogni esempio si trova nella galleria e ha una propria sezione qui sotto.

| N. | Esempio | Ambito | Agenti | Schema |
|---|---|---|---|---|
| 1 | Analizzare i fermi macchina | Produzione e industria | 3 | con diramazioni |
| 2 | Gestire un reclamo con l'8D | Gestione della qualità | 5 | con diramazioni |
| 3 | Confrontare offerte di fornitori | Logistica e acquisti | 3 | parallelo |
| 4 | Strategia SWOT per una piccola impresa | Imprese e PMI | 4 | parallelo |
| 5 | Analisi finanziaria | Finanza e investimenti | 3 | sequenziale |
| 6 | Articolo per il blog | Marketing e contenuti | 4 | parallelo |
| 7 | Preparare un'offerta su misura | Vendite | 3 | sequenziale |
| 8 | Rispondere alle richieste dei clienti | Servizio clienti | 5 | con diramazioni |
| 9 | Pubblicare un annuncio e preparare i colloqui | Risorse umane | 5 | con diramazioni |
| 10 | Trasformare una domanda di ricerca in ipotesi | Ricerca e sviluppo | 4 | sequenziale |
| 11 | Revisione del codice con test | Sviluppo software | 3 | parallelo |
| 12 | Strutturare un contratto e individuare i punti da verificare | Diritto e amministrazione | 5 | con diramazioni |
| 13 | Creare un piano di studio personale | Istruzione e formazione | 4 | parallelo |
| 14 | Verificare il bilancio familiare e risparmiare | Privati – finanze | 3 | sequenziale |
| 15 | Pianificare un viaggio personale | Privati – viaggi | 4 | con diramazioni |
| 16 | Valutare un'idea imprenditoriale | Lavoratori autonomi e fondatori | 4 | parallelo |
| 17 | Sviluppare una strategia per i social media | Influencer e creator di contenuti | 3 | sequenziale |
| 18 | Confrontare offerte immobiliari | Immobiliare | 3 | parallelo |
| 19 | Analizzare i ritardi di cantiere | Edilizia | 4 | parallelo |
| 20 | Sviluppare e calcolare un menù | Ristorazione | 3 | sequenziale |
| 21 | Pianificazione colturale di un'azienda agricola | Agricoltura | 3 | sequenziale |
| 22 | Organizzare la festa di un'associazione | Associazioni | 4 | parallelo |
| 23 | Sviluppare una campagna di raccolta fondi | Organizzazioni non profit | 3 | parallelo |
| 24 | Rispondere a una richiesta di un cittadino | Enti pubblici | 3 | sequenziale |

## 1 · Analizzare i fermi macchina {#production-downtime}
<!-- keywords: produzione e industria, analista dei fermi, analista delle cause, pianificatore delle azioni -->

**Ambito:** Produzione e industria · **Agenti:** 3 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, modulo di input, sotto-workflow, file di risultato, file come input

I fermi costano tempo di produzione, ma nei registri lunghi gli schemi si perdono facilmente. Il workflow trasforma un registro dei fermi in un elenco di misure motivato e ordinato per priorità.

**Come collaborano gli agenti:** Due agenti lavorano in parallelo: l'analista dei fermi calcola totali, quote e una classifica di Pareto con la calcolatrice, l'analista delle cause sviluppa ipotesi secondo le 6M. Il pianificatore delle azioni unisce i due risultati, e un controllo qualità integrato verifica che ogni misura sia motivata. Se la quota dei fermi supera l'obiettivo del 3 %, un nodo decisionale avvia un sotto-workflow di qualità che valuta i rischi delle misure e pianifica come metterle in sicurezza.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei fermi** | Analizza il registro in modo quantitativo e calcola con la calcolatrice. (output strutturato; Strumenti: `calculator`) | Registro dei fermi |
| **Analista delle cause** | Sviluppa ipotesi sulle cause secondo le 6M e propone verifiche. | Registro dei fermi |
| **Pianificatore delle azioni** | Unisce analisi e ipotesi in misure ordinate per priorità. (con controllo qualità) | Analista dei fermi, Analista delle cause |

**Input:** Un registro dei fermi (data, turno, macchina, durata, codice guasto, nota) e il tempo di produzione pianificato. Puoi incollare il registro nel testo come tabella o inserirlo nel campo file facoltativo come CSV o Excel; il file di esempio "Registro_fermi_L2_settimane14-15.xlsx" contiene le stesse dodici voci fittizie dell'attività di prova.

**File di esempio:** `Registro_fermi_L2_settimane14-15.xlsx`

**Casi di test:** Registro nel testo, obiettivo mancato (4,6 %); Quindicina tranquilla, obiettivo rispettato; Registro come file Excel

**Risultato:** Una tabella con priorità di azioni immediate, verifiche e azioni durature, ciascuna con effetto atteso, impegno, ruolo responsabile e indicatore, più l'analisi dei dati con la quota di fermi e i tre prossimi passi più importanti. L'esecuzione salva inoltre tutto in Markdown e in un file Excel con le tabelle.

**Come adattarlo:** Inserisci nel campo file un'esportazione dal tuo MES o dal tuo foglio di calcolo; funzionano anche registri lunghi, perché gli agenti leggono i file grandi in modo mirato. Per un'analisi settimanale puoi pianificare la copia. Nel prompt di sistema del pianificatore delle azioni puoi aggiungere il vostro metodo, per esempio i pilastri TPM o uno schema di valutazione fisso.

## 2 · Gestire un reclamo con l'8D {#quality-8d}
<!-- keywords: gestione della qualità, descrizione del problema d1–d3, analisi delle cause d4, pianificazione delle azioni d5–d7, rapporto 8d, contenimento d'emergenza -->

**Ambito:** Gestione della qualità · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, approvazione, modulo di input, file di risultato, file come input, proposte di conoscenza

I reclami richiedono un contenimento rapido e un'analisi delle cause solida. Il metodo 8D definisce i passi; il workflow li percorre in modo strutturato e li documenta in modo coerente.

**Come collaborano gli agenti:** Una catena sequenziale: il primo agente descrive il problema e le azioni di contenimento (D1–D3), il secondo cerca le cause di insorgenza e di mancata rilevazione (D4), il terzo pianifica azioni correttive e preventive (D5–D7). L'agente del rapporto riunisce tutto in un rapporto 8D strutturato. Un nodo decisionale verifica la gravità: nei casi critici un agente aggiuntivo pianifica il contenimento d'emergenza delle prossime 24 ore. Prima che il rapporto arrivi al cliente, una persona lo approva.

| Agente | Compito | Riceve |
|---|---|---|
| **Descrizione del problema D1–D3** | Descrive il team, il problema (è/non è) e le azioni di contenimento. (output strutturato) | Reclamo |
| **Analisi delle cause D4** | Cerca le cause di insorgenza e di mancata rilevazione con i 5 perché. | Descrizione del problema D1–D3, Reclamo |
| **Pianificazione delle azioni D5–D7** | Pianifica azioni correttive, la loro verifica e la prevenzione. | Analisi delle cause D4 |
| **Rapporto 8D** | Riunisce tutte le fasi in un rapporto 8D strutturato. (output strutturato) | Descrizione del problema D1–D3, Analisi delle cause D4, Pianificazione delle azioni D5–D7, Contenimento d'emergenza |
| **Contenimento d'emergenza** | Pianifica il contenimento delle prossime 24 ore nei casi critici. | Gravità |

**Input:** Il reclamo del cliente con pezzo, lotto, difetto e tasso di difettosità, più le informazioni interne note su produzione, materiale e controllo. Puoi allegare anche la lettera di reclamo, dati di misura e foto del difetto come file; i file di esempio contengono una lettera di reclamo fittizia (PDF) e delle misure (Excel).

**File di esempio:** `Reclamo_G-220_lotto_24-117.pdf`, `Misure_ganci.xlsx`

**Casi di test:** Reclamo nel testo; Lettera di reclamo e misure come file

**Risultato:** Un rapporto 8D strutturato con un campo per ciascuna disciplina da D1 a D8 e un elenco di punti aperti che il team deve ancora chiarire. Dopo l'approvazione, l'esecuzione salva il rapporto in PDF e come file Word modificabile. L'agente del rapporto propone inoltre conoscenze da conservare; viene salvato solo ciò che adotti esplicitamente.

**Come adattarlo:** Sostituisci i dati di prova con il tuo reclamo e allega direttamente verbali di controllo, disegni o foto. Se usi un modulo tuo, adatta i campi dell'agente del rapporto in "Formato di output". Le conoscenze adottate da reclami precedenti puoi assegnarle come conoscenza all'analisi delle cause.

## 3 · Confrontare offerte di fornitori {#supplier-comparison}
<!-- keywords: logistica e acquisti, analista dei costi, analista dei rischi, raccomandazione di acquisto -->

**Ambito:** Logistica e acquisti · **Agenti:** 3 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input

Il prezzo unitario più basso raramente è l'offerta più conveniente. Il workflow confronta le offerte per costo totale e rischio di fornitura e motiva una raccomandazione per gli acquisti.

**Come collaborano gli agenti:** L'analista dei costi e l'analista dei rischi lavorano in parallelo. Uno calcola il costo totale di possesso per offerta con la calcolatrice, l'altro valuta tempi di consegna, dipendenze e qualità. La raccomandazione di acquisto mette a confronto i due risultati e fornisce un esito strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei costi** | Calcola il costo totale per offerta con la calcolatrice. (Strumenti: `calculator`) | Offerte |
| **Analista dei rischi** | Valuta i rischi di tempi di consegna, dipendenza, capacità e qualità. | Offerte |
| **Raccomandazione di acquisto** | Mette a confronto costi e rischi e raccomanda un fornitore. (output strutturato) | Analista dei costi, Analista dei rischi |

**Input:** Più offerte con prezzo, trasporto, tempo di consegna, quantità minima, condizioni di pagamento e dati di qualità, più i vostri costi interni. Puoi scrivere le offerte nel testo o allegarle come file, anche miste in PDF, Word ed Excel; i tre file di esempio mostrano proprio questo.

**File di esempio:** `Offerta_A_Esempio_Precisione.pdf`, `Offerta_B_Esempio_Componenti.docx`, `Offerta_C_Campione_Parti_Metalliche.xlsx`

**Casi di test:** Tre offerte nel testo; Tre offerte in PDF, Word ed Excel

**Risultato:** Una raccomandazione strutturata con classifica, motivazioni, rischi, punti di negoziazione e ipotesi adottate. L'esecuzione la salva inoltre come rapporto PDF e come file Excel con un foglio per elenco.

**Come adattarlo:** Allega le vostre offerte come file e indica fabbisogno e costi nel testo. Se avete pesi fissi (per esempio 50 % costo, 30 % rischio, 20 % qualità), aggiungili nel prompt di sistema della raccomandazione di acquisto. Contratti quadro o valutazioni dei fornitori puoi salvarli come conoscenza e assegnarli all'analista dei rischi.

## 4 · Strategia SWOT per una piccola impresa {#sme-swot}
<!-- keywords: imprese e pmi, analisi interna, analisi del contesto, sviluppatore della strategia, revisore critico -->

**Ambito:** Imprese e PMI · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** file di risultato

Molte piccole imprese conoscono i propri problemi, ma non l'ordine migliore per affrontarli. Il workflow crea un'analisi SWOT, ne ricava strategie e le sottopone a un revisore critico.

**Come collaborano gli agenti:** L'analisi interna (punti di forza, debolezze) e l'analisi del contesto (opportunità, minacce) procedono in parallelo. Lo sviluppatore della strategia le combina in strategie secondo la matrice TOWS e un piano a 90 giorni. Il revisore critico cerca punti deboli e informazioni mancanti; il risultato contiene strategia e revisione. Alla fine il risultato viene salvato con l'esecuzione come file Markdown e PDF.

| Agente | Compito | Riceve |
|---|---|---|
| **Analisi interna** | Ricava punti di forza e debolezze dai dati aziendali. | Profilo aziendale |
| **Analisi del contesto** | Ricava opportunità e minacce dal mercato e dal contesto. | Profilo aziendale |
| **Sviluppatore della strategia** | Sviluppa strategie secondo la matrice TOWS e un piano a 90 giorni. | Analisi interna, Analisi del contesto |
| **Revisore critico** | Mette alla prova la strategia e scopre i punti deboli. (output strutturato) | Sviluppatore della strategia, Profilo aziendale |

**Input:** Un breve profilo aziendale con cifre chiave, offerta, punti di forza, problemi, contesto di mercato e obiettivi.

**Casi di test:** Falegnameria con successione non definita

**Risultato:** Una matrice SWOT con strategie derivate e un piano a 90 giorni, più una revisione critica strutturata con giudizio, punti deboli, informazioni mancanti e prossimi passi.

**Come adattarlo:** Descrivi la tua impresa nello stesso stile. Più precisi sono numeri e obiettivi, più concreta è la strategia. Puoi caricare studi di settore o sondaggi tra i clienti come conoscenza e assegnarli all'analisi del contesto.

## 5 · Analisi finanziaria {#financial-analysis}
<!-- keywords: finanza e investimenti, agente di ricerca, agente di analisi, agente di revisione -->

**Ambito:** Finanza e investimenti · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input, proposte di conoscenza

I numeri delle relazioni annuali vengono citati in fretta, ma raramente ricalcolati e messi nel contesto. Il workflow estrae i numeri, calcola con esattezza margini e crescita e fa rivedere criticamente il risultato.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Una catena sequenziale di tre agenti: l'agente di ricerca ordina i numeri con periodo e unità, l'agente di analisi calcola gli indicatori con la calcolatrice e l'agente di revisione controlla calcoli e logica e riassume il risultato in modo strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Agente di ricerca** | Raccoglie numeri e contesto dei dati finanziari. | Compito |
| **Agente di analisi** | Calcola margini, crescita e indici di stabilità con la calcolatrice. (Strumenti: `calculator`) | Agente di ricerca |
| **Agente di revisione** | Rivede l'analisi e la riassume in modo strutturato. (output strutturato) | Agente di analisi, Agente di ricerca |

**Input:** I dati finanziari di un'impresa per almeno due anni, per esempio dalla relazione annuale o trimestrale, e gli effetti straordinari noti. Puoi incollare i dati o allegarli come file Excel, CSV o PDF; il file di esempio contiene gli indicatori dell'attività di prova.

**File di esempio:** `Indicatori_Esempio_Industrie.xlsx`

**Casi di test:** Indicatori nel testo; Indicatori come file Excel

**Risultato:** Una verifica strutturata con sintesi, indicatori principali, errori o rischi trovati, limiti dell'analisi e indicazione se l'analisi è da considerare corretta, anche in PDF e come file Excel. L'agente di ricerca propone i dati estratti per la conoscenza; viene adottato solo ciò che confermi. Il risultato non è una consulenza sugli investimenti.

**Come adattarlo:** Allega direttamente la relazione annuale o la vostra tabella degli indicatori. Altri indicatori, come la leva finanziaria o il free cash flow, si aggiungono nel prompt di sistema dell'agente di analisi. Per molte imprese in sequenza conviene l'elaborazione in batch con una riga per impresa.

## 6 · Articolo per il blog {#blog-article}
<!-- keywords: marketing e contenuti, pubblico, scaletta, autore, redazione -->

**Ambito:** Marketing e contenuti · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Principiante · **Elementi:** file di risultato

I buoni articoli nascono da un pubblico chiaro e da una scaletta ben pensata. Il workflow divide il lavoro come una redazione e controlla il risultato prima della pubblicazione.

**Come collaborano gli agenti:** Pubblico e scaletta vengono creati in parallelo con un modello veloce. L'autore li trasforma nell'articolo; un controllo qualità integrato verifica che segua la scaletta e risponda alle domande dei lettori. La redazione controlla lunghezza e leggibilità con lo strumento di statistiche del testo e segnala le affermazioni non verificate.

| Agente | Compito | Riceve |
|---|---|---|
| **Pubblico** | Descrive i lettori, le loro domande e cosa sanno già. | Tema |
| **Scaletta** | Crea il titolo e la scaletta. | Tema |
| **Autore** | Scrive l'articolo a partire dalla scaletta e dal pubblico. (con controllo qualità) | Pubblico, Scaletta |
| **Redazione** | Controlla lunghezza e leggibilità e fornisce la versione finale. (Strumenti: `text_statistics`) | Autore |

**Input:** Un tema in una frase. Facoltativamente aggiungi il pubblico, il tono o la lunghezza desiderata direttamente nell'input.

**Casi di test:** Tema in una frase

**Risultato:** Un articolo finito in Markdown con titoli, una meta description e brevi note redazionali con il numero di parole e le affermazioni da documentare prima della pubblicazione. L'esecuzione salva inoltre il risultato come file Markdown e HTML da riprendere nel tuo CMS.

**Come adattarlo:** Cambia il tema nell'input. Puoi caricare la tua guida di stile come conoscenza e assegnarla all'autore e alla redazione. Imposta la lunghezza desiderata nel prompt di sistema dell'autore.

## 7 · Preparare un'offerta su misura {#sales-offer}
<!-- keywords: vendite, analista dei bisogni, consulente di soluzioni, redattore dell'offerta -->

**Ambito:** Vendite · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Avanzato · **Elementi:** approvazione, modulo di input, file di risultato, file come input

Una buona offerta risponde al bisogno reale del cliente, non solo alle sue parole chiave. Il workflow chiarisce il bisogno, calcola una soluzione adatta e redige un'offerta completa.

**Come collaborano gli agenti:** L'analista dei bisogni distingue requisiti espliciti e impliciti e raccoglie le domande aperte. Il consulente di soluzioni compone articoli dal listino e calcola con la calcolatrice, inclusa una variante entro il budget. Il redattore dell'offerta redige l'offerta; un controllo qualità integrato verifica completezza e prezzi. Un modulo di input raccoglie i dati chiave (cliente, scadenza, budget, montaggio nel fine settimana); prima dell'invio una persona approva l'offerta.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei bisogni** | Individua requisiti espliciti e impliciti. | Richiesta del cliente |
| **Consulente di soluzioni** | Compone articoli adatti e calcola con la calcolatrice. (Strumenti: `calculator`) | Analista dei bisogni, Richiesta del cliente |
| **Redattore dell'offerta** | Redige la bozza di offerta per il cliente. (con controllo qualità) | Analista dei bisogni, Consulente di soluzioni |

**Input:** La richiesta del cliente e il vostro listino con sconti e condizioni. Il modulo raccoglie i dati principali; il listino puoi scriverlo nel testo o allegarlo come file Excel, CSV o PDF, come mostra il file di esempio.

**File di esempio:** `Listino_arredo_ufficio.xlsx`

**Casi di test:** Richiesta e listino nel testo; Listino come file Excel

**Risultato:** Una bozza di offerta con lettera di accompagnamento, tabella delle voci, totali, varianti, ipotesi e domande aperte. Solo dopo la tua approvazione l'esecuzione salva l'offerta in PDF e come file Word modificabile.

**Come adattarlo:** Allega il tuo listino attuale come file; così basta la richiesta del cliente come testo. Condizioni di pagamento e testi standard si aggiungono nel prompt di sistema del redattore dell'offerta.

## 8 · Rispondere alle richieste dei clienti {#customer-service}
<!-- keywords: servizio clienti, classificatore, verificatore delle regole, redattore delle risposte, de-escalation, revisione -->

**Ambito:** Servizio clienti · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Principiante · **Elementi:** decisione, approvazione, modulo di input, file come input

Nel servizio clienti arrivano molte richieste insieme, e ognuna richiede la regola giusta e il tono giusto. Il workflow ordina le richieste, verifica regole e scadenze e prepara risposte da approvare.

**Come collaborano gli agenti:** Un classificatore veloce ordina ogni richiesta per argomento, urgenza e stato d'animo. Il verificatore delle regole applica la policy di servizio e ricalcola le scadenze con lo strumento delle date. Il redattore delle risposte scrive le risposte; un controllo qualità verifica che non si prometta nulla oltre la policy. Un nodo decisionale invia prima le escalation a un agente di de-escalation. Ogni bozza attende un'approvazione; un rifiuto con riscontro porta a una versione rivista.

| Agente | Compito | Riceve |
|---|---|---|
| **Classificatore** | Ordina ogni richiesta per argomento, urgenza e stato d'animo. (output strutturato) | Richieste |
| **Verificatore delle regole** | Applica la policy di servizio e verifica le scadenze con lo strumento delle date. (Strumenti: `days_between`) | Classificatore, Richieste |
| **Redattore delle risposte** | Scrive bozze di risposta cordiali da approvare. (con controllo qualità) | Classificatore, Verificatore delle regole, De-escalation |
| **De-escalation** | Prepara come gestire i clienti contrariati e cosa richiede un'approvazione. | Escalation? |
| **Revisione** | Rivede le bozze secondo il riscontro dell'approvazione. | Approvare le risposte |

**Input:** Più richieste di clienti con dati di ordine e consegna, la data di oggi e la vostra policy di servizio, come estratto nel testo o come file (PDF, Word, Markdown); il file di esempio contiene una policy più dettagliata.

**File di esempio:** `Policy_servizio_Cucina_Campione.pdf`

**Casi di test:** Quattro richieste, una arrabbiata; Una domanda gentile su un prodotto; Policy come file PDF

**Risultato:** Per ogni richiesta una classificazione, la regola applicabile con verifica delle scadenze e una bozza di risposta che una persona approva prima dell'invio.

**Come adattarlo:** Allega la vostra policy completa e le FAQ come file, oppure caricale come conoscenza e assegnale al verificatore delle regole se valgono in modo permanente. Il tono del tuo marchio (tu o Lei, formula di saluto) si definisce nel prompt di sistema del redattore delle risposte. Per molte richieste insieme usa l'elaborazione in batch.

## 9 · Pubblicare un annuncio e preparare i colloqui {#hr-recruiting}
<!-- keywords: risorse umane, profilo della posizione, annuncio di lavoro, traccia di colloquio, revisore dell'equità, revisione -->

**Ambito:** Risorse umane · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, file di risultato

Una buona selezione inizia con un profilo chiaro e colloqui equi e confrontabili. Il workflow trasforma note sparse in profilo della posizione, annuncio e traccia di colloquio e ne verifica l'equità.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** L'agente del profilo ordina compiti e requisiti. Da qui nascono in parallelo l'annuncio di lavoro e la traccia di colloquio. Il revisore dell'equità controlla entrambi alla ricerca di formulazioni discriminatorie o non ammesse, per esempio su età o madrelingua, e indica cosa deve verificare una persona. Se ha dei rilievi, un nodo decisionale passa i documenti a una revisione che applica le sue proposte; altrimenti restano le prime versioni.

| Agente | Compito | Riceve |
|---|---|---|
| **Profilo della posizione** | Ordina mansioni, requisiti indispensabili e desiderabili e competenze. | Fabbisogno di personale |
| **Annuncio di lavoro** | Scrive un annuncio di lavoro attraente e inclusivo. | Profilo della posizione |
| **Traccia di colloquio** | Prepara domande di colloquio strutturate con criteri di valutazione. | Profilo della posizione |
| **Revisore dell'equità** | Controlla annuncio e traccia per discriminazioni e domande non ammesse. (output strutturato) | Annuncio di lavoro, Traccia di colloquio |
| **Revisione** | Applica all'annuncio e alla traccia le modifiche proposte dalla verifica dell'equità. | Serve una revisione? |

**Input:** Note sulla posizione: mansioni, qualifiche desiderate, team, condizioni e retribuzione.

**Casi di test:** Note con richieste problematiche

**Risultato:** Profilo della posizione, annuncio di lavoro e traccia di colloquio con ancoraggi di valutazione, una verifica dell'equità strutturata e, in caso di rilievi, una versione rivista con l'elenco delle modifiche, anche come file Word. I documenti devono essere approvati dall'HR o da una persona competente prima della pubblicazione.

**Come adattarlo:** Sostituisci le note con il tuo fabbisogno di personale. Puoi salvare il tuo profilo di datore di lavoro e i benefit come conoscenza e assegnarli all'agente dell'annuncio. Aggiungi i requisiti di legge del tuo paese al prompt di sistema del revisore dell'equità. Non estendere il workflow alla selezione, valutazione o classificazione dei candidati senza una verifica legale: secondo il regolamento UE sull'IA tali sistemi sono IA ad alto rischio.

## 10 · Trasformare una domanda di ricerca in ipotesi {#research-hypotheses}
<!-- keywords: ricerca e sviluppo, analista della domanda, sviluppatore di ipotesi, critico metodologico, pianificatore sperimentale -->

**Ambito:** Ricerca e sviluppo · **Agenti:** 4 · **Schema:** sequenziale · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input, proposte di conoscenza

Una buona ricerca inizia con una domanda precisa e verificabile. Il workflow scompone una domanda di ricerca, formula ipotesi, le sottopone a una critica metodologica e ricava un piano sperimentale realistico.

**Come collaborano gli agenti:** Una catena sequenziale con ritorno: l'analista chiarisce variabili e presupposti, l'agente delle ipotesi formula ipotesi verificabili con ipotesi nulle, il critico metodologico le confronta con i dati preliminari usando la calcolatrice e indica i fattori di confondimento. Il pianificatore sperimentale usa insieme ipotesi e critica.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista della domanda** | Chiarisce obiettivo, variabili, vincoli e lacune di conoscenza. | Domanda di ricerca |
| **Sviluppatore di ipotesi** | Formula ipotesi verificabili con previsioni e ipotesi nulle. | Analista della domanda |
| **Critico metodologico** | Verifica la verificabilità delle ipotesi, i fattori di confondimento e i dati disponibili. (Strumenti: `calculator`) | Sviluppatore di ipotesi, Domanda di ricerca |
| **Pianificatore sperimentale** | Ricava un piano sperimentale da ipotesi e critica. | Sviluppatore di ipotesi, Critico metodologico |

**Input:** Una domanda di ricerca con obiettivo, dati di prove preliminari e vincoli come materiale, tempo e attrezzature. Puoi allegare dati di misura e documenti come file; il file di esempio contiene i valori della prova preliminare per lamiera.

**File di esempio:** `Prova_preliminare_PL-7.csv`

**Casi di test:** Domanda e prova preliminare nel testo; Dati della prova preliminare in CSV

**Risultato:** Un piano sperimentale con ipotesi, fattori e livelli, dimensione del campione, metodo di misura, analisi e criteri di interruzione, più i rischi aperti, anche come file Word. Il pianificatore sperimentale propone il piano per la conoscenza; sei tu a decidere se salvarlo.

**Come adattarlo:** Sostituisci domanda e prova preliminare con le tue e allega direttamente i dati di misura. La letteratura che ti serve spesso puoi caricarla come conoscenza in modalità "Ricerca" e assegnarla all'analista della domanda, così lavora con citazioni. Le vostre linee guida statistiche si aggiungono nel critico metodologico.

## 11 · Revisione del codice con test {#code-review}
<!-- keywords: sviluppo software, analista dei bug, revisore della sicurezza, correzione e test -->

**Ambito:** Sviluppo software · **Agenti:** 3 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input

Un secondo sguardo trova i bug prima che arrivino in produzione. Il workflow controlla contemporaneamente il codice per errori logici e problemi di sicurezza e fornisce una versione migliorata con test.

**Come collaborano gli agenti:** L'analista dei bug e il revisore della sicurezza lavorano in parallelo sullo stesso codice. L'agente di miglioramento unisce i rilievi e scrive codice corretto e test pytest; un controllo qualità integrato verifica che ogni rilievo sia trattato e coperto da test.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei bug** | Cerca errori logici, casi limite e scostamenti dalla descrizione. | Codice sorgente |
| **Revisore della sicurezza** | Controlla il codice per vulnerabilità e schemi non sicuri. | Codice sorgente |
| **Correzione e test** | Scrive codice corretto e test pytest per tutti i rilievi. (con controllo qualità) | Analista dei bug, Revisore della sicurezza, Codice sorgente |

**Input:** Un estratto di codice con un breve contesto: linguaggio, scopo e ambiente, oppure un intero progetto come archivio ZIP o singoli file nel campo file. Gli archivi vengono solo letti, mai eseguiti. Il codice resta invariato nel suo linguaggio; le spiegazioni compaiono nella lingua dell'interfaccia. Il file di esempio è un piccolo progetto Python con errori inseriti.

**File di esempio:** `calcolatore-sconti.zip`

**Casi di test:** Estratto di codice nel testo; Progetto come archivio ZIP

**Risultato:** Un elenco dei rilievi ordinato per gravità, il codice corretto e test pytest che coprono ogni rilievo, anche come file Markdown. I test non vengono eseguiti automaticamente; eseguili in locale.

**Come adattarlo:** Allega il tuo progetto come ZIP o incolla il codice indicando linguaggio e framework. Per altri linguaggi adatta il framework di test nell'agente di correzione, per esempio Jest o JUnit. Le vostre linee guida di codifica puoi salvarle come conoscenza. Tramite l'API del workflow la revisione può essere avviata anche da una pipeline CI.

## 12 · Strutturare un contratto e individuare i punti da verificare {#contract-review}
<!-- keywords: diritto e amministrazione, strutturatore del contratto, esplicatore delle clausole, analista dei punti da verificare, sintesi del contratto, clausole critiche -->

**Ambito:** Diritto e amministrazione · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, modulo di input, file di risultato, file come input, proposte di conoscenza

I contratti sono lunghi e le clausole importanti si nascondono nei dettagli. Il workflow struttura un contratto, lo spiega in linguaggio semplice e raccoglie i punti che una persona qualificata dovrebbe verificare. Non sostituisce una consulenza legale.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Lo strutturatore rileva parti, durata, prestazioni e scadenze. Su questa base lavorano in parallelo l'esplicatore delle clausole (linguaggio semplice) e l'analista dei punti da verificare (disposizioni insolite o sbilanciate); entrambi leggono il contratto da sé, come testo o come file caricato. Se l'analista trova clausole critiche, un nodo decisionale aggiunge un esame approfondito di quelle clausole. L'agente del rapporto riunisce tutto in una sintesi strutturata con domande per la consulenza legale.

| Agente | Compito | Riceve |
|---|---|---|
| **Strutturatore del contratto** | Rileva parti, oggetto, durata, corrispettivi e scadenze. | Testo del contratto |
| **Esplicatore delle clausole** | Spiega ogni clausola in linguaggio semplice. | Strutturatore del contratto, Testo del contratto |
| **Analista dei punti da verificare** | Individua disposizioni insolite, squilibrate o mancanti. (output strutturato) | Strutturatore del contratto, Testo del contratto |
| **Sintesi del contratto** | Unisce spiegazioni e punti da verificare in una panoramica strutturata. (output strutturato) | Esplicatore delle clausole, Analista dei punti da verificare, Clausole critiche |
| **Clausole critiche** | Esamina a fondo le clausole critiche e prepara domande per la negoziazione. | Clausole critiche? |

**Input:** Il contratto come file (PDF, Word, Markdown o testo) nel campo "Contratto come file" oppure come testo, possibilmente con la numerazione degli articoli. Il file lo carichi direttamente all'avvio; non ti serve una raccolta di conoscenza. Il file di esempio contiene il contratto fittizio dell'attività di prova.

**File di esempio:** `Contratto_servizio_software_esempio.docx`

**Casi di test:** Contratto nel testo, con clausole critiche; Contratto come file Word, senza testo; Contratto di manutenzione equilibrato

**Risultato:** Una sintesi strutturata con riepilogo, dati principali, clausole spiegate, punti da verificare e domande per un'avvocata o un avvocato, anche in PDF e come file Word modificabile. Lo strutturatore propone i dati principali del contratto per la conoscenza, per esempio per un registro dei contratti; viene salvato solo ciò che confermi.

**Come adattarlo:** Carica il tuo contratto come file all'avvio o incollalo. I tuoi criteri, per esempio requisiti minimi su responsabilità o protezione dei dati, si aggiungono nel prompt di sistema dell'analista dei punti da verificare. Contratti tipo con cui confrontare puoi salvarli come conoscenza e assegnarli a questo analista.

## 13 · Creare un piano di studio personale {#learning-plan}
<!-- keywords: istruzione e formazione, valutazione iniziale, pianificatore dello studio, tutor, autore del quiz -->

**Ambito:** Istruzione e formazione · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input

Si impara meglio con un piano che parte da dove sei. Il workflow crea un piano di studio personale, spiega i primi argomenti e verifica la comprensione con un quiz.

**Come collaborano gli agenti:** La valutazione iniziale determina punto di partenza e lacune, il pianificatore dello studio ne ricava un piano settimanale. Su questa base lavorano in parallelo il tutor (contenuti della settimana scelta, basati se vuoi sul tuo materiale del corso) e l'autore del quiz (verifica delle conoscenze con soluzioni). Il risultato contiene tutte e tre le parti.

| Agente | Compito | Riceve |
|---|---|---|
| **Valutazione iniziale** | Determina il punto di partenza, l'obiettivo di apprendimento e le lacune. | Obiettivo di apprendimento |
| **Pianificatore dello studio** | Crea un piano settimanale con obiettivi ed esercizi. | Valutazione iniziale |
| **Tutor** | Spiega i contenuti della prima settimana con esempi ed esercizi. | Pianificatore dello studio, Obiettivo di apprendimento |
| **Autore del quiz** | Crea una verifica delle conoscenze con soluzioni per la prima settimana. | Pianificatore dello studio |

**Input:** Chi impara, l'obiettivo, il tempo disponibile, le conoscenze pregresse e lo stile di apprendimento preferito. Nel modulo scegli la settimana da elaborare e puoi allegare materiale tuo; il file di esempio è una breve guida alle tabelle pivot.

**File di esempio:** `Guida_rapida_tabelle_pivot.docx`

**Casi di test:** Settimana 1 senza materiale; Settimana 2 con materiale del corso

**Risultato:** Un piano di studio di quattro settimane con obiettivi per settimana, spiegazioni chiare con esercizi per la settimana scelta e un quiz con soluzioni e spiegazioni, anche in PDF da stampare.

**Come adattarlo:** Descrivi il tuo obiettivo; funziona per quasi ogni argomento. Per le settimane successive avvia di nuovo il workflow e cambia la settimana nel modulo. Il materiale che usi sempre puoi caricarlo come conoscenza e assegnarlo al tutor.

## 14 · Verificare il bilancio familiare e risparmiare {#household-budget}
<!-- keywords: privati – finanze, analista del bilancio, consulente del risparmio, controllo di realtà -->

**Ambito:** Privati – finanze · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input

A fine mese spesso resta meno del previsto. Il workflow ricalcola un bilancio familiare, trova potenziali di risparmio e verifica se le proposte sono realistiche nella vita di tutti i giorni.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** L'analista del bilancio calcola totali, avanzo e quote per categoria con la calcolatrice. Il consulente del risparmio stima risparmi concreti, anch'essi ricalcolati. Il controllo di realtà riceve entrambi i risultati, ne verifica la fattibilità e fornisce un esito strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista del bilancio** | Calcola entrate, uscite, avanzo e quote con la calcolatrice. (Strumenti: `calculator`) | Bilancio familiare |
| **Consulente del risparmio** | Trova possibilità di risparmio concrete e ne stima l'effetto. (Strumenti: `calculator`) | Analista del bilancio, Bilancio familiare |
| **Controllo di realtà** | Verifica la fattibilità delle proposte e le riassume. (output strutturato) | Analista del bilancio, Consulente del risparmio |

**Input:** Entrate, spese fisse e variabili di una famiglia e un obiettivo di risparmio. Invece di digitare tutto, puoi allegare i movimenti del conto o un registro delle spese come file CSV o Excel; il file di esempio contiene un mese fittizio.

**File di esempio:** `Movimenti_conto_marzo_2026.csv`

**Casi di test:** Bilancio nel testo; Movimenti del conto in CSV

**Risultato:** Una verifica strutturata del bilancio con l'avanzo mensile attuale, il potenziale di risparmio, misure, primi passi rapidi e avvertenze, anche come file Excel. Non sostituisce una consulenza finanziaria o sul sovraindebitamento.

**Come adattarlo:** Allega i tuoi movimenti del conto o inserisci i tuoi numeri; priorità personali, come "l'auto resta", vanno nel testo. Gli estratti conto contengono dati personali: restano a te e vengono passati al modello solo per questa esecuzione.

## 15 · Pianificare un viaggio personale {#travel-plan}
<!-- keywords: privati – viaggi, pianificatore dell'itinerario, pianificatore del budget, pianificatore dell'organizzazione, documenti di viaggio -->

**Ambito:** Privati – viaggi · **Agenti:** 4 · **Schema:** con diramazioni · **Livello:** Principiante · **Elementi:** decisione, modulo di input, file di risultato

Un buon viaggio rispetta interessi, budget e limiti di tutti i viaggiatori. Il workflow pianifica un itinerario, ricalcola il budget e crea una checklist per l'organizzazione.

**Come collaborano gli agenti:** Il pianificatore dell'itinerario progetta un programma giorno per giorno in base a interessi e vincoli. Il pianificatore del budget calcola notti e costi con la calcolatrice e lo strumento delle date. Il pianificatore dell'organizzazione unisce tutto in un piano di viaggio con checklist; un controllo qualità verifica budget e vincoli. Un modulo di input raccoglie destinazione, date, viaggiatori e budget. Per i viaggi all'estero un nodo decisionale aggiunge una lista di documenti e regole d'ingresso.

| Agente | Compito | Riceve |
|---|---|---|
| **Pianificatore dell'itinerario** | Progetta un programma giornaliero in base a interessi e limiti. | Desideri di viaggio |
| **Pianificatore del budget** | Calcola notti e costi con la calcolatrice e lo strumento delle date. (Strumenti: `calculator`, `days_between`) | Pianificatore dell'itinerario |
| **Pianificatore dell'organizzazione** | Unisce itinerario e budget in un piano di viaggio con checklist. (con controllo qualità) | Pianificatore dell'itinerario, Pianificatore del budget, Documenti di viaggio |
| **Documenti di viaggio** | Elenca documenti, assicurazione e regole d'ingresso per i viaggi all'estero. | Estero? |

**Input:** Chi viaggia, destinazione e date, budget, interessi e limiti.

**Casi di test:** Viaggio in famiglia a Lisbona (estero); Fine settimana nel proprio paese

**Risultato:** Un piano di viaggio con programma giornaliero, tabella del budget e checklist, anche in PDF da portare con sé. Prezzi e orari sono stime basate su conoscenze generali e vanno verificati prima di prenotare, perché il workflow non usa dati in tempo reale.

**Come adattarlo:** Inserisci i tuoi desideri di viaggio. Se vuoi prezzi e orari aggiornati, puoi aggiungere lo strumento server "ricerca web" al pianificatore dell'itinerario; ha un costo aggiuntivo per ogni ricerca.

## 16 · Valutare un'idea imprenditoriale {#business-idea}
<!-- keywords: lavoratori autonomi e fondatori, analista di mercato, calcolatore della redditività, analista dei rischi, giuria di investitori -->

**Ambito:** Lavoratori autonomi e fondatori · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** file di risultato

Prima di avviare un'impresa vale la pena guardare con lucidità mercato, numeri e rischi. Il workflow fa esaminare l'idea contemporaneamente da tre esperti e una giuria emette un giudizio motivato.

**Come collaborano gli agenti:** Tre agenti lavorano in parallelo: l'analista di mercato stima target e concorrenza, il calcolatore della redditività determina punto di pareggio e scenari con la calcolatrice, l'analista dei rischi cerca i punti deboli. La giuria di investitori soppesa tutto e fornisce un giudizio strutturato con un punteggio.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista di mercato** | Stima target, domanda e concorrenza. | Idea imprenditoriale |
| **Calcolatore della redditività** | Calcola margine di contribuzione, punto di pareggio e scenari con la calcolatrice. (Strumenti: `calculator`) | Idea imprenditoriale |
| **Analista dei rischi** | Cerca punti deboli e rischi dell'idea. | Idea imprenditoriale |
| **Giuria di investitori** | Soppesa mercato, numeri e rischi ed emette un giudizio. (output strutturato) | Analista di mercato, Calcolatore della redditività, Analista dei rischi |

**Input:** Una descrizione dell'idea con offerta, target, prezzi, costi, capacità e concorrenti noti.

**Casi di test:** Servizio mobile di riparazione biciclette

**Risultato:** Un giudizio strutturato (proseguire, adattare o abbandonare) con punteggio, punti di forza, rischi, ipotesi da verificare e prossimi passi concreti per la validazione, anche come rapporto PDF.

**Come adattarlo:** Descrivi la tua idea con i tuoi numeri. Più oneste sono le ipotesi, più utile è il giudizio. Carica i tuoi dati di mercato o risultati di sondaggi come conoscenza e assegnali all'analista di mercato.

## 17 · Sviluppare una strategia per i social media {#creator-strategy}
<!-- keywords: influencer e creator di contenuti, agente della strategia, sviluppatore di idee, pianificatore dei contenuti -->

**Ambito:** Influencer e creator di contenuti · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input, memoria

Pubblicare con regolarità richiede una direzione chiara e un piano adatto al proprio tempo disponibile. Il workflow ricava una strategia dalle statistiche, raccoglie idee adatte e pianifica la pubblicazione.

**Come collaborano gli agenti:** Una catena di tre agenti: l'agente della strategia definisce posizionamento, pilastri dei contenuti e obiettivi e analizza a questo scopo le statistiche allegate, lo sviluppatore di idee formula idee concrete di post con un gancio e il pianificatore dei contenuti le distribuisce su quattro settimane. Lo sviluppatore di idee ricorda le sue proposte in una memoria, così le esecuzioni successive non ripetono le idee. Un controllo qualità verifica che frequenza e mix siano realistici.

| Agente | Compito | Riceve |
|---|---|---|
| **Agente della strategia** | Definisce posizionamento, pilastri di contenuto e obiettivi misurabili. | Profilo del creator |
| **Sviluppatore di idee** | Sviluppa idee concrete di post con gancio e formato. | Agente della strategia |
| **Pianificatore dei contenuti** | Distribuisce le idee in un piano realistico di quattro settimane. (con controllo qualità) | Agente della strategia, Sviluppatore di idee |

**Input:** Profilo con piattaforme, numeri, post di successo, pubblico, obiettivi, tempo disponibile e data di inizio. Puoi allegare anche le statistiche come screenshot o come esportazione CSV/Excel; il file di esempio è un'esportazione di questo tipo.

**File di esempio:** `Statistiche_post_marzo.csv`

**Casi di test:** Profilo nel testo; Profilo con esportazione delle statistiche

**Risultato:** Un piano editoriale di quattro settimane con data, piattaforma, formato, idea, gancio e call to action, introdotto da un breve riepilogo della strategia, anche come file Excel per continuare a pianificare.

**Come adattarlo:** Inserisci il tuo profilo e i tuoi numeri o allega screenshot delle tue statistiche. Lo stile del tuo marchio e i temi tabù si aggiungono nel prompt di sistema dello sviluppatore di idee. La memoria "creator-ideas" si trova in Memoria; svuotala se vuoi ricominciare. Per un piano mensile puoi pianificare la copia.

## 18 · Confrontare offerte immobiliari {#real-estate}
<!-- keywords: immobiliare, calcolatore del rendimento, analista di immobile e posizione, valutazione di opportunità e rischi -->

**Ambito:** Immobiliare · **Agenti:** 3 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input

Negli immobili numeri e posizione decidono insieme. Il workflow ricalcola rendimento e flusso di cassa, analizza l'immobile e la sua posizione e mette a confronto opportunità e rischi.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Il calcolatore del rendimento determina il rendimento lordo e netto da locazione e il flusso di cassa mensile con la calcolatrice, mentre l'analista di immobile e posizione valuta in parallelo stato, riserve e contesto. La valutazione unisce entrambi in un confronto strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Calcolatore del rendimento** | Calcola rendimento, finanziamento e flusso di cassa con la calcolatrice. (Strumenti: `calculator`) | Offerte |
| **Analista di immobile e posizione** | Valuta stato, riserve, locabilità e posizione. | Offerte |
| **Valutazione di opportunità e rischi** | Mette a confronto i numeri con la valutazione dell'immobile e confronta in modo strutturato. (output strutturato) | Calcolatore del rendimento, Analista di immobile e posizione |

**Input:** Almeno due offerte con prezzo di acquisto, superficie, affitto, spese condominiali, fondo di manutenzione e posizione, più le tue ipotesi di finanziamento. Annunci, verbali e planimetrie si allegano in PDF, Word o come immagine; i file di esempio contengono un annuncio con estratto del verbale e una planimetria dell'offerta 2.

**File di esempio:** `Annuncio_offerta_2_palazzo_epoca.pdf`, `Planimetria_offerta_2.png`

**Casi di test:** Due offerte nel testo; Con annuncio e planimetria

**Risultato:** Un confronto strutturato con indicatori, offerta preferita, opportunità, rischi e punti da verificare prima di una decisione, anche in PDF. Non sostituisce una consulenza finanziaria, fiscale o legale né un sopralluogo.

**Come adattarlo:** Inserisci le tue offerte e i dati di finanziamento e allega direttamente annunci, verbali dell'assemblea condominiale o planimetrie. Un osservatorio degli affitti che ti serve spesso puoi salvarlo come conoscenza e assegnarlo all'analista di immobile e posizione.

## 19 · Analizzare i ritardi di cantiere {#construction-delay}
<!-- keywords: edilizia, analista del cronoprogramma, analista delle cause, pianificatore delle contromisure, rapporto al committente -->

**Ambito:** Edilizia · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** approvazione, modulo di input, file di risultato, file come input

I ritardi in cantiere si sommano e i committenti hanno bisogno in fretta di un quadro chiaro. Il workflow calcola gli scostamenti, classifica le cause, sviluppa contromisure e scrive un rapporto sullo stato.

**Come collaborano gli agenti:** L'analista del cronoprogramma e l'analista delle cause lavorano in parallelo. Il primo calcola ritardi e margini con gli strumenti per date e calcoli, il secondo ordina le cause per ambito di responsabilità e necessità di documentazione; entrambi analizzano anche cronoprogrammi, giornali dei lavori e foto allegati. Il pianificatore delle contromisure sviluppa opzioni di accelerazione e l'agente del rapporto riassume tutto per il committente. Prima che il rapporto lasci il team di progetto, una persona lo approva.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista del cronoprogramma** | Calcola ritardi, margini e conseguenze con lo strumento delle date e la calcolatrice. (Strumenti: `days_between`, `calculator`) | Stato del progetto |
| **Analista delle cause** | Classifica le cause per ambito di responsabilità ed esigenze di documentazione. | Stato del progetto |
| **Pianificatore delle contromisure** | Sviluppa misure di accelerazione con costi ed effetti. | Analista del cronoprogramma, Analista delle cause |
| **Rapporto al committente** | Riassume in modo oggettivo situazione del cronoprogramma, cause e misure. | Analista del cronoprogramma, Pianificatore delle contromisure, Analista delle cause |

**Input:** Un cronoprogramma con traguardi previsti ed effettivi, note sulle cause, data del rapporto e condizioni contrattuali, come testo o come file: cronoprogramma in Excel, giornale dei lavori in PDF, foto come immagine. I file di esempio contengono un cronoprogramma e un estratto del giornale dei lavori.

**File di esempio:** `Cronoprogramma_asilo_Raggio_di_Sole.xlsx`, `Giornale_lavori_estratto_aprile_maggio.pdf`

**Casi di test:** Cronoprogramma nel testo; Cronoprogramma e giornale dei lavori come file

**Risultato:** Un rapporto di avanzamento oggettivo con situazione dei tempi, cause, contromisure, decisioni necessarie e rischi. Dopo l'approvazione l'esecuzione lo salva in PDF e come file Word modificabile. Le questioni su penali e proroga dei termini restano soggette a verifica tecnica e legale.

**Come adattarlo:** Esporta il tuo cronoprogramma dal software di progetto in Excel e allega giornale dei lavori e foto. Per un rapporto periodico puoi pianificare la copia; l'approvazione ti aspetterà.

## 20 · Sviluppare e calcolare un menù {#restaurant-menu}
<!-- keywords: ristorazione, sviluppatore del concept, calcolo dei costi, redattore del menù -->

**Ambito:** Ristorazione · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input

Un menù deve piacere agli ospiti e rendere. Il workflow sviluppa piatti per un target, calcola food cost e prezzi e scrive testi del menù invitanti.

**Come collaborano gli agenti:** Una catena di tre agenti: lo sviluppatore del concept compone piatti con ricette, il calcolo dei costi determina food cost e prezzi di vendita con lo strumento di calcolo, il redattore del menù scrive il menù. Un controllo qualità verifica target, prezzi e l'avvertenza sugli allergeni. Il risultato contiene il calcolo e il menù.

| Agente | Compito | Riceve |
|---|---|---|
| **Sviluppatore del concept** | Compone piatti adatti con ricette e quantità. | Concept |
| **Calcolo dei costi** | Calcola food cost e prezzi di vendita con la calcolatrice. (Strumenti: `calculator`) | Sviluppatore del concept, Concept |
| **Redattore del menù** | Scrive il menù del pranzo con descrizioni invitanti. (con controllo qualità) | Calcolo dei costi, Sviluppatore del concept |

**Input:** Tipo di locale, target, numero e tipo di piatti, food cost obiettivo, fascia di prezzo e prezzi d'acquisto. I prezzi d'acquisto puoi incollarli o allegarli come file CSV o Excel, come mostra il file di esempio.

**File di esempio:** `Prezzi_acquisto_Mulino_Esempio.csv`

**Casi di test:** Menù del pranzo con prezzi nel testo; Prezzi d'acquisto in CSV

**Risultato:** Una tabella di calcolo con food cost e prezzo per piatto e un menù del pranzo pronto con brevi descrizioni, anche come file Word da impaginare e come file Excel con le tabelle di calcolo. Allergeni e additivi vanno verificati e indicati in base alle ricette effettive.

**Come adattarlo:** Allega il tuo listino attuale dei prezzi d'acquisto e descrivi il tuo target. Le vostre ricette standard puoi caricarle come conoscenza e assegnarle al calcolo dei costi; regole della casa come le porzioni si aggiungono nello sviluppatore del concept. Per il cambio ogni due settimane puoi pianificare la copia.

## 21 · Pianificazione colturale di un'azienda agricola {#farm-planning}
<!-- keywords: agricoltura, pianificatore della rotazione, calcolo dei margini lordi, controllo di plausibilità -->

**Ambito:** Agricoltura · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input

La pianificazione colturale deve tenere conto contemporaneamente di rotazione, suoli, contratti e redditività. Il workflow propone una rotazione, calcola i margini lordi e verifica il piano rispetto alle tue regole.

**Come collaborano gli agenti:** Una catena di tre agenti: il pianificatore della rotazione assegna una coltura a ogni appezzamento, il calcolo dei margini lordi calcola ogni appezzamento e il totale con la calcolatrice e il controllo di plausibilità verifica regole e rischi e fornisce un esito strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Pianificatore della rotazione** | Assegna una coltura a ogni appezzamento secondo regole e suolo. | Dati aziendali |
| **Calcolo dei margini lordi** | Calcola i margini lordi per appezzamento e in totale con la calcolatrice. (Strumenti: `calculator`) | Pianificatore della rotazione, Dati aziendali |
| **Controllo di plausibilità** | Verifica il piano rispetto a regole e rischi e lo riassume. (output strutturato) | Pianificatore della rotazione, Calcolo dei margini lordi |

**Input:** Appezzamenti con superficie, suolo e coltura precedente, le vostre regole di pianificazione e ipotesi su ricavi e costi per ettaro. Appezzamenti e ipotesi puoi allegarli come file Excel o CSV; il file di esempio contiene entrambe le tabelle dell'attività di prova.

**File di esempio:** `Schedario_appezzamenti_Fattoria_Esempio.xlsx`

**Casi di test:** Azienda nel testo; Schedario degli appezzamenti come file Excel

**Risultato:** Un piano colturale per appezzamento con margine lordo, una verifica delle regole, rischi e domande aperte, anche come file Excel. I requisiti di legge, per esempio su concimazione o condizioni per i contributi, vanno verificati in base alle regole locali vigenti.

**Come adattarlo:** Allega il tuo schedario degli appezzamenti e i dati di calcolo in Excel e inserisci le tue regole di pianificazione. Le analisi del suolo che ti servono ogni anno puoi caricarle come conoscenza e assegnarle al pianificatore della rotazione.

## 22 · Organizzare la festa di un'associazione {#club-event}
<!-- keywords: associazioni, pianificatore del calendario, pianificatore del budget, pianificatore della comunicazione, documento per il direttivo -->

**Ambito:** Associazioni · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Principiante · **Elementi:** file di risultato

Le feste delle associazioni sono organizzate da volontari nel tempo libero. Il workflow crea calendario, compiti, budget e comunicazione e riassume tutto in un documento per la riunione del consiglio direttivo.

**Come collaborano gli agenti:** Il pianificatore del calendario e il pianificatore del budget lavorano in parallelo; uno fa il conto alla rovescia dalla festa con lo strumento delle date, l'altro calcola il budget con la calcolatrice. Il pianificatore della comunicazione prepara inviti e post in linea con il calendario. Il documento per il direttivo unisce tutto; un controllo qualità verifica completezza e responsabilità.

| Agente | Compito | Riceve |
|---|---|---|
| **Pianificatore del calendario** | Pianifica a ritroso dal giorno della festa calendario, compiti e turni. (Strumenti: `days_between`) | Dati principali |
| **Pianificatore del budget** | Calcola entrate, uscite e riserva con la calcolatrice. (Strumenti: `calculator`) | Dati principali |
| **Pianificatore della comunicazione** | Prepara inviti, post e un comunicato stampa. | Pianificatore del calendario |
| **Documento per il direttivo** | Riassume pianificazione, budget e comunicazione per il consiglio direttivo. (con controllo qualità) | Pianificatore del calendario, Pianificatore del budget, Pianificatore della comunicazione |

**Input:** Occasione, data, luogo, numero di ospiti, desideri per il programma, volontari, budget e costi noti.

**Casi di test:** Festa d'estate per l'anniversario dell'associazione

**Risultato:** Un documento per il direttivo con calendario fino alla festa, compiti e responsabili, piano dei turni, budget con avanzo o disavanzo, piano di comunicazione e proposte di delibera, anche come file Word da inviare al direttivo.

**Come adattarlo:** Inserisci i dati principali della tua festa. Permessi e prescrizioni variano da comune a comune; aggiungi i requisiti noti nell'input. Loghi e modelli di locandina possono essere salvati come conoscenza.

## 23 · Sviluppare una campagna di raccolta fondi {#nonprofit-campaign}
<!-- keywords: organizzazioni non profit, sviluppatore della campagna, analista dell'impatto, revisore della credibilità -->

**Ambito:** Organizzazioni non profit · **Agenti:** 3 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** file di risultato, proposte di conoscenza

Le campagne di raccolta fondi hanno bisogno di una storia che coinvolga, ma anche di affermazioni oneste sull'impatto. Il workflow sviluppa una campagna, valuta il possibile impatto e verifica se le promesse sono credibili ed eticamente corrette.

**Come collaborano gli agenti:** Lo sviluppatore della campagna e l'analista dell'impatto lavorano in parallelo: uno progetta messaggio, target e azioni, l'altro costruisce un modello di impatto con indicatori e calcola il costo per bambino con la calcolatrice. Il revisore della credibilità controlla entrambi; il risultato contiene tutte e tre le parti.

| Agente | Compito | Riceve |
|---|---|---|
| **Sviluppatore della campagna** | Progetta messaggio, target, canali e calendario della campagna. | Descrizione del progetto |
| **Analista dell'impatto** | Costruisce un modello di impatto con indicatori e il costo per bambino. (Strumenti: `calculator`) | Descrizione del progetto |
| **Revisore della credibilità** | Verifica le affermazioni per esagerazioni, etica ed evidenze. (output strutturato) | Sviluppatore della campagna, Analista dell'impatto |

**Input:** Organizzazione, progetto, risultati finora, obiettivo, fabbisogno, periodo della campagna e canali esistenti.

**Casi di test:** Padrini di lettura nelle scuole primarie

**Risultato:** Un concept di campagna con calendario e bozze di testi, un modello d'impatto con indicatori e una verifica strutturata di affermazioni esagerate, avvertenze etiche e un piano di misurazione dell'impatto, anche come file Word. L'analista dell'impatto propone il suo modello d'impatto per la conoscenza, per esempio per future richieste di finanziamento; viene salvato solo ciò che confermi.

**Come adattarlo:** Descrivi il tuo progetto e i tuoi risultati nel modo più onesto possibile. Carica bilanci sociali o valutazioni come conoscenza e assegnali all'analista dell'impatto.

## 24 · Rispondere a una richiesta di un cittadino {#citizen-inquiry}
<!-- keywords: enti pubblici, analisi delle questioni, preparazione delle informazioni, bozza di risposta -->

**Ambito:** Enti pubblici · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input, proposte di conoscenza

Le richieste dei cittadini contengono spesso più questioni e vanno risposte in modo corretto, chiaro e senza impegni affrettati. Il workflow scompone la richiesta, trova le regole pertinenti nelle informazioni fornite e prepara una risposta.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Una catena di tre agenti: l'analisi delle questioni separa le questioni e assegna le competenze, la preparazione delle informazioni cerca le regole pertinenti solo nell'estratto fornito e la bozza di risposta scrive una risposta comprensibile per il cittadino. Un controllo qualità verifica che si citino solo regole documentate e che non si assumano impegni vincolanti.

| Agente | Compito | Riceve |
|---|---|---|
| **Analisi delle questioni** | Separa le questioni e assegna competenze e urgenza. | Richiesta del cittadino |
| **Preparazione delle informazioni** | Cerca le regole pertinenti solo nelle informazioni fornite. | Analisi delle questioni, Richiesta del cittadino |
| **Bozza di risposta** | Scrive una risposta oggettiva e comprensibile da approvare. (con controllo qualità) | Analisi delle questioni, Preparazione delle informazioni |

**Input:** La richiesta della cittadina o del cittadino e le informazioni interne, regole e competenze pertinenti, come estratto nel testo o come file. Puoi allegare anche foto della richiesta. Il file di esempio è una scheda informativa fittizia del comune.

**File di esempio:** `Scheda_fabbricati_accessori_e_illuminazione.pdf`

**Casi di test:** Casetta da giardino e lampione; Regole come file della scheda informativa

**Risultato:** Una bozza di risposta in linguaggio semplice con competenze, prossimi passi e indicazioni per chi gestisce la pratica, anche come file Word per la vostra carta intestata. La preparazione delle informazioni propone le regole trovate, con il riferimento, per la conoscenza, così le richieste successive possono usarle; viene salvato solo ciò che confermi. La bozza va verificata e approvata nel merito prima dell'invio.

**Come adattarlo:** Allega i vostri regolamenti e schede informative oppure caricali in modo permanente come conoscenza (modalità "Ricerca" con citazioni) e assegnali alla preparazione delle informazioni. Carta intestata e formula di saluto si aggiungono nel prompt di sistema della bozza di risposta. Per molte richieste insieme usa l'elaborazione in batch.

<!-- examples:end -->

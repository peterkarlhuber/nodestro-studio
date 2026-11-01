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
| 6 | Articolo per il blog | Marketing e contenuti | 3 | sequenziale |
| 7 | Preparare un'offerta su misura | Vendite | 3 | sequenziale |
| 8 | Rispondere alle richieste dei clienti | Servizio clienti | 4 | con diramazioni |
| 9 | Pubblicare un annuncio e preparare i colloqui | Risorse umane | 5 | con diramazioni |
| 10 | Trasformare una domanda di ricerca in ipotesi | Ricerca e sviluppo | 3 | adattivo (orchestrazione) |
| 11 | Revisione del codice con test | Sviluppo software | 3 | parallelo |
| 12 | Strutturare un contratto e individuare i punti da verificare | Diritto e amministrazione | 5 | con diramazioni |
| 13 | Creare un piano di studio personale | Istruzione e formazione | 4 | parallelo |
| 14 | Verificare il bilancio familiare e risparmiare | Privati – finanze | 3 | sequenziale |
| 15 | Pianificare un viaggio personale | Privati – viaggi | 4 | con diramazioni |
| 16 | Valutare un'idea imprenditoriale | Lavoratori autonomi e fondatori | 2 | adattivo (orchestrazione) |
| 17 | Sviluppare una strategia per i social media | Influencer e creator di contenuti | 3 | sequenziale |
| 18 | Confrontare offerte immobiliari | Immobiliare | 3 | parallelo |
| 19 | Analizzare i ritardi di cantiere | Edilizia | 3 | adattivo (orchestrazione) |
| 20 | Sviluppare e calcolare un menù | Ristorazione | 3 | sequenziale |
| 21 | Pianificazione colturale di un'azienda agricola | Agricoltura | 3 | sequenziale |
| 22 | Organizzare la festa di un'associazione | Associazioni | 4 | parallelo |
| 23 | Sviluppare una campagna di raccolta fondi | Organizzazioni non profit | 3 | con diramazioni |
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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: l'analista dei fermi verifica ogni cifra con la calcolatrice. Un controllo qualità valuta il piano delle azioni secondo tre criteri (collegamento ai risultati, priorità, responsabili e indicatori) e fa rivedere una volta il pianificatore delle azioni se non li soddisfa. Una condizione confronta la quota dei fermi con l'obiettivo del 3 %: sopra l'obiettivo si avvia il sotto-workflow di assicurazione qualità (valutazione dei rischi con una FMEA semplificata e piano di verifica); altrimenti viene saltato. L'esecuzione mostra quale ramo è stato preso. Nessun passaggio attende una persona: le cause sono ipotesi da verificare in reparto e le azioni sono proposte per la direzione di produzione responsabile.

**Perché questa architettura:** La valutazione numerica e la ricerca delle cause guardano lo stesso registro da angolazioni diverse e non dipendono l'una dall'altra; per questo lavorano in parallelo e solo il pianificatore delle azioni le unisce. L'assicurazione qualità si avvia solo quando l'obiettivo è mancato, perché solo allora sono da attendersi azioni più ampie i cui rischi vanno messi in sicurezza; dentro l'obiettivo costerebbe solo tempo e denaro. È un sotto-workflow perché lo stesso modulo possa essere riutilizzato e testato da solo. Un orchestratore non serve, perché ogni registro dei fermi richiede gli stessi passaggi.

**Come adattarlo:** Inserisci nel campo file un'esportazione dal tuo MES o dal tuo foglio di calcolo; funzionano anche registri lunghi, perché gli agenti leggono i file grandi in modo mirato. Per un'analisi settimanale puoi pianificare la copia. Nel prompt di sistema del pianificatore delle azioni puoi aggiungere il vostro metodo, per esempio i pilastri TPM o uno schema di valutazione fisso.

## 2 · Gestire un reclamo con l'8D {#quality-8d}
<!-- keywords: gestione della qualità, descrizione del problema d1–d3, analisi delle cause d4, pianificazione delle azioni d5–d7, rapporto 8d, contenimento d'emergenza -->

**Ambito:** Gestione della qualità · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, approvazione, modulo di input, file di risultato, file come input, proposte di conoscenza, file di conoscenza

I reclami richiedono un contenimento rapido e un'analisi delle cause solida. Il metodo 8D definisce i passi; il workflow li percorre in modo strutturato e li documenta in modo coerente. Verifica anche se il difetto si è già presentato: una causa che ritorna significa che un'azione correttiva precedente non ha funzionato, e questo va scritto nel rapporto.

**Come collaborano gli agenti:** Una catena sequenziale: il primo agente descrive il problema e le azioni di contenimento (D1–D3). Il secondo cerca casi confrontabili nei rapporti 8D precedenti dell'azienda e le cause di insorgenza e di mancata rilevazione (D4), indicando se una causa è ricorrente o nuova. Il terzo pianifica azioni correttive e preventive (D5–D7). L'agente del rapporto riunisce tutto in un rapporto 8D strutturato. Un nodo decisionale verifica la gravità: nei casi critici un agente aggiuntivo pianifica il contenimento d'emergenza delle prossime 24 ore. Prima che il rapporto arrivi al cliente, una persona lo approva.

| Agente | Compito | Riceve |
|---|---|---|
| **Descrizione del problema D1–D3** | Descrive il team, il problema (è/non è) e le azioni di contenimento. (output strutturato) | Reclamo |
| **Analisi delle cause D4** | Consulta i rapporti 8D precedenti e cerca con i 5 perché le cause di insorgenza e di mancata rilevazione. | Descrizione del problema D1–D3, Reclamo |
| **Pianificazione delle azioni D5–D7** | Pianifica azioni correttive, la loro verifica e la prevenzione. | Analisi delle cause D4 |
| **Rapporto 8D** | Riunisce tutte le fasi in un rapporto 8D strutturato. (output strutturato) | Descrizione del problema D1–D3, Analisi delle cause D4, Pianificazione delle azioni D5–D7, Contenimento d'emergenza |
| **Contenimento d'emergenza** | Pianifica il contenimento delle prossime 24 ore nei casi critici. | Gravità |

**Input:** Il reclamo del cliente con pezzo, lotto, difetto e tasso di difettosità, più le informazioni interne note su produzione, materiale e controllo. Puoi allegare anche la lettera di reclamo, dati di misura e foto del difetto come file; i file di esempio contengono una lettera di reclamo fittizia (PDF) e delle misure (Excel). I rapporti 8D precedenti provengono dalla raccolta di conoscenza; è incluso un archivio fittizio con quattro rapporti chiusi.

**File di esempio:** `Reclamo_G-220_lotto_24-117.pdf`, `Misure_ganci.xlsx`

**Casi di test:** Reclamo nel testo; Lettera di reclamo e misure come file

**Risultato:** Un rapporto 8D strutturato con un campo per ciascuna disciplina da D1 a D8 e un elenco di punti aperti che il team deve ancora chiarire; l'analisi delle cause cita i rapporti precedenti su cui si basa. Dopo l'approvazione, l'esecuzione salva il rapporto in PDF e come file Word modificabile. Così si chiude il ciclo di apprendimento: l'agente del rapporto propone il rapporto 8D finito per la conoscenza, una persona decide se salvarlo, e i rapporti salvati finiscono nella stessa raccolta dei rapporti precedenti, così l'analisi delle cause li trova nei casi futuri.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il nodo decisionale aggiunge il contenimento d'emergenza solo quando la descrizione del problema classifica il caso come critico; l'analisi delle cause decide quali rapporti precedenti sono pertinenti e li cita, così ogni riferimento è verificabile. Non ci sono cicli; ogni passo viene eseguito una volta. Una persona decide due volte: prima che vengano creati i file, qualcuno approva il rapporto 8D (un rifiuto termina l'esecuzione senza file), e una persona decide se il rapporto finito viene salvato come conoscenza. Fino all'approvazione il rapporto resta una bozza.

**Perché questa architettura:** L'8D impone un ordine fisso in cui ogni disciplina si basa sulla precedente; per questo una catena sequenziale è più adatta di un orchestratore, e solo il contenimento d'emergenza dipende dal caso ed è una diramazione. I rapporti precedenti sono conoscenza consultabile anziché testo nel prompt: l'archivio cresce con ogni caso salvato, la ricerca porta solo i passaggi pertinenti e le citazioni mostrano da dove viene una causa ricorrente. Un ciclo di revisione è stato escluso di proposito, perché l'approvazione da parte di una persona alla fine controlla comunque l'intero rapporto.

**File di conoscenza (sintetici, creati durante la copia):** Rapporti_8D_precedenti_Plastiform: Archivio fittizio con quattro rapporti 8D chiusi del fornitore di alloggiamenti in plastica Plastiform S.r.l.; uno di essi è un caso confrontabile.

**Come adattarlo:** Sostituisci i dati di prova con il tuo reclamo e allega direttamente verbali di controllo, disegni o foto. Sostituisci i rapporti precedenti fittizi nella raccolta di conoscenza con i tuoi rapporti 8D chiusi (Markdown, PDF o Word); titoli chiari con pezzo, difetto e causa per ogni rapporto rendono la ricerca più precisa. Se usi un modulo tuo, adatta i campi dell'agente del rapporto in "Formato di output".

## 3 · Confrontare offerte di fornitori {#supplier-comparison}
<!-- keywords: logistica e acquisti, analista dei costi, analista dei rischi, raccomandazione di acquisto -->

**Ambito:** Logistica e acquisti · **Agenti:** 3 · **Schema:** parallelo · **Livello:** Avanzato · **Elementi:** modulo di input, file di risultato, file come input, collegamento MCP facoltativo

Il prezzo unitario più basso raramente è l'offerta più conveniente, e le promesse di un fornitore non sono il suo storico. Il workflow confronta le offerte per costo totale e rischio di fornitura, verifica lo storico dei fornitori quando è disponibile e motiva una raccomandazione per gli acquisti.

**Come collaborano gli agenti:** L'analista dei costi e l'analista dei rischi lavorano in parallelo. Uno calcola il costo totale di possesso per offerta con la calcolatrice, l'altro valuta tempi di consegna, dipendenze, capacità e qualità. Se la tua copia è collegata all'ERP, l'analista dei rischi legge la valutazione di ogni fornitore, in sola lettura, con list_suppliers e supplier_scorecard; senza collegamento usa un export ERP allegato o solo le offerte e dice quale storico manca. La raccomandazione di acquisto mette a confronto i due risultati e fornisce un esito strutturato.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei costi** | Calcola il costo totale per offerta con la calcolatrice. (Strumenti: `calculator`) | Offerte |
| **Analista dei rischi** | Valuta i rischi di tempi di consegna, dipendenza, capacità e qualità. | Offerte |
| **Raccomandazione di acquisto** | Mette a confronto costi e rischi e raccomanda un fornitore. (output strutturato) | Analista dei costi, Analista dei rischi |

**Input:** Più offerte con prezzo, trasporto, tempo di consegna, quantità minima, condizioni di pagamento e dati di qualità, più i vostri costi interni. Puoi scrivere le offerte nel testo o allegarle come file, anche miste in PDF, Word ed Excel; i tre file di esempio mostrano proprio questo. Facoltativamente alleghi un export ERP della valutazione fornitori (Excel o CSV); nell'export di esempio manca di proposito il fornitore dell'offerta B, che è nuovo e non ha ancora uno storico.

**File di esempio:** `Offerta_A_Esempio_Precisione.pdf`, `Offerta_B_Esempio_Componenti.docx`, `Offerta_C_Campione_Parti_Metalliche.xlsx`, `ERP_valutazione_fornitori.xlsx`

**Casi di test:** Tre offerte nel testo; Tre offerte in PDF, Word ed Excel; Tre offerte come file più export ERP

**Risultato:** Una raccomandazione strutturata con classifica, motivazioni, rischi, punti di negoziazione e ipotesi adottate. La valutazione dei rischi indica per ogni fornitore da dove viene il suo storico: dall'ERP, dall'export allegato o solo dall'offerta. L'esecuzione salva inoltre la raccomandazione come rapporto PDF e come file Excel con un foglio per elenco.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: le due analisi e la ponderazione procedono senza pause; i calcoli li fa la calcolatrice e l'esecuzione registra ogni passo e ogni chiamata a strumenti. Il collegamento all'ERP è facoltativo e legge soltanto: la copia riceve gli strumenti list_suppliers e supplier_scorecard solo se la colleghi a un server MCP i cui strumenti un amministratore ha approvato in sola lettura; altrimenti funziona in una modalità offline chiaramente indicata e non finge mai di avere dati ERP. Le esecuzioni senza una persona presente (pianificazioni, serie di test, elaborazione in batch) non possono usare strumenti MCP, a meno che un amministratore non consenta espressamente l'MCP non presidiato; usa quindi una copia collegata in modo interattivo. Nessun passo attende un'approvazione: la raccomandazione è una bozza e la decisione di acquisto resta a te.

**Perché questa architettura:** Costo e rischio sono domande indipendenti, perciò due specialisti lavorano in parallelo e un terzo ne pondera i risultati; è più veloce e più facile da verificare di un unico agente per tutto. Lo storico dei fornitori arriva tramite un'integrazione perché si trova nell'ERP e cambia di continuo; un file di conoscenza diventerebbe presto obsoleto, e la modalità offline con un export mantiene l'esempio utilizzabile anche senza collegamento. Mancano di proposito ciclo e approvazione, perché il risultato è una raccomandazione, non un'azione.

**Collegamento facoltativo: ERP (valutazione fornitori)** (Strumenti: `list_suppliers`, `supplier_scorecard`). Accesso in sola lettura tramite MCP ai dati fornitori del vostro ERP: list_suppliers elenca i fornitori, supplier_scorecard restituisce la valutazione di un fornitore degli ultimi 12 mesi (puntualità, qualità in ppm, reclami, rapporti 8D aperti, ultimo audit). L'analista dei rischi la usa per confrontare le offerte con lo storico registrato.

**Configurazione:** Un amministratore aggiunge il server MCP dell'ERP della tua azienda in Strumenti → Servizi collegati e approva i due strumenti list_suppliers e supplier_scorecard in sola lettura. Quando copi l'esempio scegli quel server come collegamento; senza collegamento la copia funziona in modalità offline. Per provarlo senza ERP, avvia `python -m nodestro_examples.demo_mcp --language it` sul computer con l'app desktop di Nodestro, aggiungi http://127.0.0.1:8765/mcp in Strumenti → Servizi collegati con il consenso per un server di sviluppo locale, approva i suoi strumenti in sola lettura e sceglilo quando copi. Il server demo legge soltanto e fornisce i dati sintetici dell'export di esempio, mai dati aziendali reali. Le esecuzioni senza una persona presente (pianificazioni, serie di test, elaborazione in batch) non possono usare strumenti MCP, a meno che un amministratore non consenta espressamente l'MCP non presidiato.

**Senza collegamento:** Modalità offline: nessun ERP è collegato. L'analista dei rischi usa solo un export ERP allegato o le offerte e indica lo storico fornitori mancante; non consulta nulla.

**Come adattarlo:** Allega le vostre offerte come file e indica fabbisogno e costi nel testo. Per usare lo storico reale dei fornitori, fai configurare l'integrazione ERP e scegli il server quando copi l'esempio; altrimenti allega un export della valutazione fornitori. Se avete pesi fissi (per esempio 50 % costo, 30 % rischio, 20 % qualità), aggiungili nel prompt di sistema della raccomandazione di acquisto. I contratti quadro puoi salvarli come conoscenza e assegnarli all'analista dei rischi.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Tutto si svolge automaticamente e nessun passaggio attende una persona. Il revisore critico riceve la strategia e il profilo originale dell'azienda e restituisce un giudizio strutturato con punti solidi, punti deboli, informazioni mancanti e prossimi passi; non rimanda indietro la strategia, così la sua critica resta visibile nel risultato. L'analisi del contesto non fa ricerche sul web: lavora con il profilo e con conoscenze generali del settore e segnala ciò che va verificato sul posto. La strategia e il piano a 90 giorni sono una bozza per la tua decisione.

**Perché questa architettura:** Punti di forza e di debolezza vengono dall'interno dell'azienda, opportunità e minacce dal mercato; le due analisi non dipendono l'una dall'altra e quindi lavorano in parallelo. La strategia ha bisogno di entrambe e segue perciò come passaggio fisso. Il revisore è un agente separato che vede anche il profilo originale, così confronta la strategia con i fatti e non solo con il suo stesso ragionamento. Un ciclo di revisione è stato escluso di proposito: una strategia non deve essere levigata finché il revisore è d'accordo, perché le contraddizioni aperte sono informazioni preziose per chi decide.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: l'agente di ricerca estrae le cifre, l'agente di analisi calcola ogni indicatore con la calcolatrice e l'agente di revisione controlla calcoli e logica rispetto alle cifre estratte. Il suo giudizio sì/no dice se l'analisi è considerata corretta; questo giudizio non ferma l'esecuzione né avvia un nuovo calcolo, così gli errori trovati restano visibili nel risultato. Sulla conoscenza decide una persona: le cifre estratte vengono adottate solo se le confermi. Il risultato non è una consulenza sugli investimenti; prima di decidere, dovrebbe controllarlo chi è responsabile delle cifre.

**Perché questa architettura:** Ogni passaggio ha bisogno del risultato del precedente: senza cifre pulite non ci sono indicatori corretti, e senza indicatori non c'è nulla da controllare. Per questo una catena rigida è più adatta del lavoro in parallelo o di un orchestratore. Calcolare con la calcolatrice invece che con il modello linguistico e far controllare il risultato da un agente separato evita indicatori plausibili ma sbagliati. La revisione riceve anche le cifre estratte e può così ricondurre ogni indicatore alla sua fonte.

**Come adattarlo:** Allega direttamente la relazione annuale o la vostra tabella degli indicatori. Altri indicatori, come la leva finanziaria o il free cash flow, si aggiungono nel prompt di sistema dell'agente di analisi. Per molte imprese in sequenza conviene l'elaborazione in batch con una riga per impresa.

## 6 · Articolo per il blog {#blog-article}
<!-- keywords: marketing e contenuti, brief, autore, redazione -->

**Ambito:** Marketing e contenuti · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** file di risultato

I buoni articoli nascono da un brief chiaro: chi li legge, con quale taglio e con quali messaggi chiave. Il workflow lavora come una piccola redazione e controlla il risultato prima della pubblicazione.

**Come collaborano gli agenti:** Un modello veloce prepara un brief strutturato con pubblico, taglio, scaletta e messaggi chiave. L'autore lo trasforma nell'articolo; un controllo qualità integrato verifica che segua la scaletta e risponda alle domande dei lettori e, in caso contrario, lo rimanda una volta in revisione. Una redazione veloce controlla lunghezza e leggibilità con lo strumento di statistiche del testo e segnala le affermazioni non verificate.

| Agente | Compito | Riceve |
|---|---|---|
| **Brief** | Definisce pubblico, taglio, scaletta e messaggi chiave in un brief strutturato. (output strutturato) | Tema |
| **Autore** | Scrive l'articolo a partire dal brief. (con controllo qualità) | Brief |
| **Redazione** | Controlla lunghezza e leggibilità e fornisce la versione finale. (Strumenti: `text_statistics`) | Autore |

**Input:** Un tema in una frase. Facoltativamente aggiungi il pubblico, il tono o la lunghezza desiderata direttamente nell'input.

**Casi di test:** Tema in una frase

**Risultato:** Un articolo finito in Markdown con titoli, una meta description e brevi note redazionali con il numero di parole e le affermazioni da documentare prima della pubblicazione. L'esecuzione salva inoltre il risultato come file Markdown e HTML da riprendere nel tuo CMS.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: brief, articolo e revisione redazionale si susseguono; nessun passo attende una persona. Un controllo qualità separato valuta l'articolo secondo due criteri (segue la scaletta, risponde alle domande dei lettori) e, se uno non è soddisfatto, lo fa rivedere una volta dall'autore. La redazione non cambia il contenuto, ma segnala le affermazioni che richiedono una fonte. L'articolo è una bozza: sei tu a decidere se e dove pubblicarlo.

**Perché questa architettura:** Un unico brief strutturato sostituisce due pianificatori in parallelo i cui risultati l'autore doveva conciliare: prima la scaletta nasceva senza conoscere il pubblico. Ora pubblico, taglio, scaletta e messaggi chiave nascono da un'unica idea e arrivano all'autore come campi ben separati. L'autore ha un controllo qualità con revisione automatica perché è lì che nasce la maggior parte dei punti deboli. Come esempio per principianti, il workflow resta di proposito una catena breve senza diramazioni, cicli o approvazioni, così ogni passo si può seguire nell'esecuzione.

**Come adattarlo:** Cambia il tema nell'input. Puoi caricare la tua guida di stile come conoscenza e assegnarla all'autore e alla redazione. Imposta la lunghezza desiderata nel prompt di sistema dell'autore e il numero di sezioni o di messaggi chiave nel prompt di sistema del brief.

## 7 · Preparare un'offerta su misura {#sales-offer}
<!-- keywords: vendite, analista dei bisogni, consulente di soluzioni, redattore dell'offerta -->

**Ambito:** Vendite · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Avanzato · **Elementi:** approvazione, ciclo di revisione, modulo di input, file di risultato, file come input

Una buona offerta risponde al bisogno reale del cliente, non solo alle sue parole chiave. Il workflow chiarisce il bisogno, calcola una soluzione adatta e redige un'offerta completa che una persona approva.

**Come collaborano gli agenti:** L'analista dei bisogni distingue requisiti espliciti e impliciti e raccoglie le domande aperte. Il consulente di soluzioni compone articoli dal listino e calcola con la calcolatrice, inclusa una variante entro il budget. Il redattore dell'offerta redige l'offerta; un controllo qualità integrato verifica completezza e prezzi. Un modulo di input raccoglie i dati chiave (cliente, scadenza, budget, montaggio nel fine settimana). Poi una persona approva la bozza; un rifiuto con commento la rimanda con un ciclo al redattore dell'offerta, che la rivede e la ripresenta.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista dei bisogni** | Individua requisiti espliciti e impliciti. | Richiesta del cliente |
| **Consulente di soluzioni** | Compone articoli adatti e calcola con la calcolatrice. (Strumenti: `calculator`) | Analista dei bisogni, Richiesta del cliente |
| **Redattore dell'offerta** | Redige la bozza di offerta per il cliente. (con controllo qualità; Strumenti: `calculator`) | Analista dei bisogni, Consulente di soluzioni |

**Input:** La richiesta del cliente e il vostro listino con sconti e condizioni. Il modulo raccoglie i dati principali; il listino puoi scriverlo nel testo o allegarlo come file Excel, CSV o PDF, come mostra il file di esempio.

**File di esempio:** `Listino_arredo_ufficio.xlsx`

**Casi di test:** Richiesta e listino nel testo; Listino come file Excel

**Risultato:** Una bozza di offerta con lettera di accompagnamento, tabella delle voci, totali, varianti, ipotesi e domande aperte. Solo dopo la tua approvazione l'esecuzione salva l'offerta in PDF e come file Word modificabile; l'invio al cliente resta compito tuo.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: analisi dei bisogni, calcolo e bozza procedono senza attese; un controllo qualità separato valuta l'offerta secondo tre criteri (tutti i requisiti trattati, prezzi coerenti con il calcolo, punti aperti indicati) e, se serve, la fa rivedere una volta. Poi decide una persona: l'approvazione crea i file, il rifiuto richiede un commento e rimanda l'offerta al redattore insieme alla bozza precedente. Il ciclo consente al massimo tre giri di revisione; dopo, l'esecuzione termina come non riuscita. L'analisi dei bisogni e il calcolo del consulente di soluzioni non vengono ripetuti; se il commento cambia quantità, sconti o voci di consegna, il redattore dell'offerta ricalcola i totali interessati con la calcolatrice. Il workflow non invia mai nulla al cliente.

**Perché questa architettura:** Ogni richiesta richiede gli stessi passi nello stesso ordine, perciò una catena fissa è più adatta di un orchestratore. I prezzi vengono calcolati con la calcolatrice in un passo a sé, così il redattore ne riprende i prezzi di listino invece di inventarli. Il ciclo all'approvazione esiste perché i rifiuti riguardano di solito piccole correzioni, come una formulazione, una nota sugli sconti o una domanda aperta mancante; rivedere con il commento è più rapido che ricominciare. Riporta di proposito solo al redattore dell'offerta, che ricalcola con la calcolatrice quantità o sconti modificati ma non aggiunge nuovi prezzi di listino; così la base verificata della soluzione resta intatta.

**Come adattarlo:** Allega il tuo listino attuale come file; così basta la richiesta del cliente come testo. Condizioni di pagamento e testi standard si aggiungono nel prompt di sistema del redattore dell'offerta.

## 8 · Rispondere alle richieste dei clienti {#customer-service}
<!-- keywords: servizio clienti, classificatore, verificatore delle regole, redattore delle risposte, de-escalation -->

**Ambito:** Servizio clienti · **Agenti:** 4 · **Schema:** con diramazioni · **Livello:** Principiante · **Elementi:** decisione, approvazione, ciclo di revisione, modulo di input, file come input, collegamento MCP facoltativo

Nel servizio clienti arrivano molte richieste insieme, e ognuna richiede la regola giusta, i dati d'ordine giusti e il tono giusto. Il workflow ordina le richieste, verifica regole e scadenze in base ai dati dell'ordine e prepara risposte da approvare.

**Come collaborano gli agenti:** Un classificatore veloce ordina ogni richiesta per argomento, urgenza e stato d'animo. Il verificatore delle regole applica la policy di servizio e ricalcola le scadenze con lo strumento delle date; se la tua copia è collegata al negozio online, consulta ogni ordine in sola lettura con get_order, altrimenti usa i dati d'ordine delle richieste o un export degli ordini allegato. Il redattore delle risposte scrive le risposte; un controllo qualità verifica che non si prometta nulla oltre la policy. Un nodo decisionale invia prima le escalation a un agente di de-escalation. Ogni bozza attende un'approvazione; un rifiuto con commento rimanda le bozze, tramite un ciclo, al redattore delle risposte, che le rivede e le sottopone di nuovo all'approvazione (al massimo tre giri).

| Agente | Compito | Riceve |
|---|---|---|
| **Classificatore** | Ordina ogni richiesta per argomento, urgenza e stato d'animo. (output strutturato) | Richieste |
| **Verificatore delle regole** | Applica la policy di servizio e verifica le scadenze con lo strumento delle date. (Strumenti: `days_between`) | Classificatore, Richieste |
| **Redattore delle risposte** | Scrive bozze di risposta cordiali da approvare. (con controllo qualità) | Classificatore, Verificatore delle regole, De-escalation |
| **De-escalation** | Prepara come gestire i clienti contrariati e cosa richiede un'approvazione. | Escalation? |

**Input:** Più richieste di clienti con numeri d'ordine, la data di oggi e la vostra policy di servizio, come estratto nel testo o come file (PDF, Word, Markdown); il file di esempio contiene una policy più dettagliata. Le date di ordine e consegna vengono dalle richieste, da un export degli ordini del vostro negozio allegato (JSON, CSV o Excel) o, con il collegamento, direttamente dal negozio; l'export di esempio contiene i tre ordini delle richieste di esempio.

**File di esempio:** `Policy_servizio_Cucina_Campione.pdf`, `Ordini_negozio_Cucina_Campione.json`

**Casi di test:** Quattro richieste, una arrabbiata; Una domanda gentile su un prodotto; Policy come file PDF; Solo numeri d'ordine, export degli ordini allegato

**Risultato:** Per ogni richiesta una classificazione, la regola applicabile con verifica delle scadenze e una bozza di risposta che una persona approva prima dell'invio. La verifica delle regole indica da dove vengono i dati d'ordine (negozio, export o richiesta) e quali mancano.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: la classificazione, la decisione di escalation (verso la de-escalation quando almeno un cliente è arrabbiato o chiede più di quanto la policy consenta), la verifica delle regole e le bozze; lo strumento delle date calcola le scadenze, un controllo qualità verifica le bozze secondo tre criteri (conforme alla policy, tono, nessuna promessa) e ogni passo viene registrato. Una persona approva ogni bozza prima di qualsiasi invio: un rifiuto richiede un commento e rimanda le bozze al redattore delle risposte; se dopo al massimo tre giri vengono ancora rifiutate, l'esecuzione termina come fallita. Le risposte restano bozze; nulla viene inviato automaticamente. Il collegamento al negozio è facoltativo e legge soltanto: la copia riceve get_order solo se la colleghi a un server MCP il cui strumento un amministratore ha approvato in sola lettura; altrimenti funziona in una modalità offline chiaramente indicata. Le esecuzioni senza una persona presente (pianificazioni, serie di test, elaborazione in batch) non possono usare strumenti MCP, a meno che un amministratore non consenta espressamente l'MCP non presidiato.

**Perché questa architettura:** I passi si basano l'uno sull'altro (classificare, verificare, scrivere), quindi basta una catena fissa con una diramazione per le escalation; un orchestratore aggiungerebbe costi senza benefici, e per classificare basta un modello veloce. I dati d'ordine arrivano tramite un'integrazione perché si trovano nel negozio e cambiano di ora in ora; la modalità offline con un export mantiene l'esempio utilizzabile anche senza collegamento. L'approvazione con ciclo di revisione resta perché le risposte vanno ai clienti: l'ultima parola spetta a una persona.

**Collegamento facoltativo: Negozio online (ordini)** (Strumenti: `get_order`). Consultazione degli ordini in sola lettura nel vostro negozio online tramite MCP: get_order restituisce le date di ordine e consegna, lo stato, gli articoli e l'ultima nota del corriere di un ordine. Il verificatore delle regole la usa per controllare le scadenze con dati d'ordine reali invece che con quanto dicono i clienti.

**Configurazione:** Un amministratore aggiunge il server MCP del vostro negozio online in Strumenti → Servizi collegati e approva il suo strumento get_order in sola lettura. Quando copi l'esempio scegli quel server come collegamento; senza collegamento la copia funziona in modalità offline. Per provarlo senza negozio, avvia `python -m nodestro_examples.demo_mcp --language it` sul computer con l'app desktop di Nodestro, aggiungi http://127.0.0.1:8765/mcp in Strumenti → Servizi collegati con il consenso per un server di sviluppo locale, approva i suoi strumenti in sola lettura e sceglilo quando copi. Il server demo legge soltanto e fornisce gli ordini sintetici dell'export di esempio, mai dati reali di clienti. Le esecuzioni senza una persona presente (pianificazioni, serie di test, elaborazione in batch) non possono usare strumenti MCP, a meno che un amministratore non consenta espressamente l'MCP non presidiato.

**Senza collegamento:** Modalità offline: nessun negozio online è collegato. Il verificatore delle regole usa solo i dati d'ordine delle richieste o di un export degli ordini allegato e indica quelli mancanti; non consulta nulla.

**Come adattarlo:** Allega la vostra policy completa e le FAQ come file, oppure caricale come conoscenza e assegnale al verificatore delle regole se valgono in modo permanente. Per controllare gli ordini dal vivo, fai configurare l'integrazione con il negozio e scegli il server quando copi l'esempio. Il tono del tuo marchio (tu o Lei, formula di saluto) si definisce nel prompt di sistema del redattore delle risposte. L'elaborazione in batch gestisce molte richieste insieme, ma le esecuzioni senza una persona presente non possono usare il collegamento al negozio: allega quindi ai batch un export degli ordini.

## 9 · Pubblicare un annuncio e preparare i colloqui {#hr-recruiting}
<!-- keywords: risorse umane, profilo della posizione, annuncio di lavoro, traccia di colloquio, revisore dell'equità, revisione -->

**Ambito:** Risorse umane · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, approvazione, file di risultato

Una buona selezione inizia con un profilo chiaro e colloqui equi e confrontabili. Il workflow trasforma note sparse in profilo della posizione, annuncio e traccia di colloquio, ne verifica l'equità e lascia l'approvazione a una persona.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** L'agente del profilo ordina compiti e requisiti. Da qui nascono in parallelo l'annuncio di lavoro e la traccia di colloquio. Il revisore dell'equità controlla entrambi alla ricerca di formulazioni discriminatorie o non ammesse, per esempio su età o madrelingua, e indica cosa deve verificare una persona. Se ha dei rilievi, un nodo decisionale passa i documenti a una revisione che applica le sue proposte; altrimenti restano le prime versioni. Infine il responsabile dell'assunzione o l'HR esamina annuncio, traccia, verifica dell'equità ed eventuale revisione e approva i documenti.

| Agente | Compito | Riceve |
|---|---|---|
| **Profilo della posizione** | Ordina mansioni, requisiti indispensabili e desiderabili e competenze. | Fabbisogno di personale |
| **Annuncio di lavoro** | Scrive un annuncio di lavoro attraente e inclusivo. | Profilo della posizione |
| **Traccia di colloquio** | Prepara domande di colloquio strutturate con criteri di valutazione. | Profilo della posizione |
| **Revisore dell'equità** | Controlla annuncio e traccia per discriminazioni e domande non ammesse. (output strutturato) | Annuncio di lavoro, Traccia di colloquio |
| **Revisione** | Applica all'annuncio e alla traccia le modifiche proposte dalla verifica dell'equità. | Serve una revisione? |

**Input:** Note sulla posizione: mansioni, qualifiche desiderate, team, condizioni e retribuzione.

**Casi di test:** Note con richieste problematiche

**Risultato:** Profilo della posizione, annuncio di lavoro e traccia di colloquio con ancoraggi di valutazione, una verifica dell'equità strutturata e, in caso di rilievi, una versione rivista con l'elenco delle modifiche. L'esecuzione crea il file Word solo dopo l'approvazione.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il revisore dell'equità fornisce un giudizio strutturato; se i documenti non sono utilizzabili senza modifiche, un nodo decisionale li manda in revisione, altrimenti passano direttamente all'approvazione. Il ramo seguito è visibile nell'esecuzione. La decisione finale resta a una persona: il responsabile dell'assunzione o l'HR controlla tutti i documenti all'approvazione; un rifiuto richiede un commento e termina l'esecuzione, e solo un'approvazione crea il file Word. Il workflow produce soltanto documenti: non vede, valuta né classifica mai candidati reali.

**Perché questa architettura:** Annuncio e traccia dipendono solo dal profilo, perciò nascono in parallelo e vengono verificati insieme, il che mantiene coerenti requisiti e formulazioni. La verifica dell'equità funziona come un filtro automatico: la revisione costa un passo in più solo quando ci sono rilievi. Di proposito non c'è un ciclo di verifica e revisione, perché le questioni di equità e di diritto non devono considerarsi risolte solo perché i modelli sono d'accordo tra loro; chi approva vede verifica, revisione e punti aperti fianco a fianco. La selezione dei candidati è esclusa di proposito, perché secondo il regolamento UE sull'IA sarebbe IA ad alto rischio.

**Come adattarlo:** Sostituisci le note con il tuo fabbisogno di personale. Puoi salvare il tuo profilo di datore di lavoro e i benefit come conoscenza e assegnarli all'agente dell'annuncio. Aggiungi i requisiti di legge del tuo paese al prompt di sistema del revisore dell'equità. Non estendere il workflow alla selezione, valutazione o classificazione dei candidati senza una verifica legale: secondo il regolamento UE sull'IA tali sistemi sono IA ad alto rischio.

## 10 · Trasformare una domanda di ricerca in ipotesi {#research-hypotheses}
<!-- keywords: ricerca e sviluppo, analista della domanda, coordinamento della ricerca, pianificatore dello studio -->

**Ambito:** Ricerca e sviluppo · **Agenti:** 3 · **Schema:** adattivo (orchestrazione) · **Livello:** Avanzato · **Elementi:** orchestratore con team, modulo di input, file di risultato, file come input, proposte di conoscenza, budget e limiti

Una buona ricerca comincia con una domanda precisa e verificabile e con i metodi giusti. Una prova sui materiali richiede un'analisi della potenza, uno studio con interviste un piano di campionamento e un modulo di consenso, e molte domande richiedono entrambi. Il workflow analizza la domanda e lascia che un coordinamento della ricerca coinvolga proprio i team metodologici di cui la domanda ha bisogno.

**Come collaborano gli agenti:** L'analista della domanda la struttura e riassume i dati allegati, perché i team lavorano senza i file. Il coordinamento della ricerca, un orchestratore, comincia sempre con il team ipotesi e poi decide: gli esiti misurabili vanno al team statistica, di cui imposta come parametri il disegno di studio e il livello di significatività; esperienze e motivazioni vanno al team metodi qualitativi; persone o dati personali coinvolgono il team etica e protezione dei dati. Se un team ritiene un'ipotesi non verificabile, il coordinamento la rimanda una volta al team ipotesi. Il pianificatore dello studio trasforma tutto in un piano.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista della domanda** | Chiarisce obiettivo, variabili, vincoli e lacune di conoscenza. | Domanda di ricerca |
| **Coordinamento della ricerca** | Decide di quali team metodologici ha bisogno la domanda e imposta i parametri del team statistica. (Orchestratore) | Analista della domanda |
| **Pianificatore dello studio** | Ricava il piano di studio dall'analisi e dai risultati dei team metodologici. | Analista della domanda, Coordinamento della ricerca |

**Team che l'orchestratore può impiegare:**

| Team | Compito | Capacità |
|---|---|---|
| **Team ipotesi** | Trasforma una domanda di ricerca analizzata in ipotesi verificabili con ipotesi nulle e previsioni misurabili; le rivede dopo una critica metodologica. | hypotheses, operationalisation |
| **Team statistica** | Confronta le ipotesi quantitative con i dati, analizza i dati preliminari con la calcolatrice e stima la dimensione del campione per un disegno, un livello di significatività e una potenza dati. (Parametri: Disegno dello studio, Livello di significatività α, Potenza desiderata) | statistics, power analysis, quantitative methods |
| **Team metodi qualitativi** | Pianifica interviste, osservazioni o focus group per domande su esperienze, motivazioni e comportamenti: campione, traccia e analisi. | qualitative methods, interviews, observation |
| **Team etica e protezione dei dati** | Verifica studi con persone o dati personali: consenso, minimizzazione dei dati, anonimizzazione, coinvolgimento delle rappresentanze dei lavoratori e parere etico. | research ethics, data protection, informed consent |

**Input:** Una domanda di ricerca con il suo obiettivo, i dati esistenti delle prove preliminari e i vincoli come materiale, tempo e attrezzature. Puoi allegare dati di misura e documenti come file; il file di esempio contiene le valutazioni della prova preliminare per pannello.

**File di esempio:** `Prova_preliminare_PL-7.csv`

**Casi di test:** Domanda e prova preliminare nel testo; Dati della prova preliminare in CSV; Studio con interviste senza misure

**Risultato:** Un piano di studio con ipotesi, disegno, dimensione del campione, metodo di misura o di intervista, analisi, criteri di arresto e rischi aperti, anche come file Word. La vista di orchestrazione dell'esecuzione mostra quali team metodologici hanno partecipato, con quali parametri, e quali sono stati esclusi e perché. Il pianificatore propone il piano per la conoscenza; decidi tu se salvarlo.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il coordinamento decide quali team metodologici lavorano e compila il modulo del team statistica (disegno, livello di significatività, potenza); ogni decisione viene registrata con la sua motivazione. Limiti: al massimo 7 decisioni, ogni team al massimo due volte, un budget di 4 USD per esecuzione. Nessun passaggio attende una persona; il piano è una bozza per la persona responsabile della ricerca.

**Perché questa architettura:** Una catena fissa eseguirebbe sempre una critica statistica, anche per uno studio con interviste in cui non c'è nulla da calcolare, e coinvolgerebbe l'etica solo se qualcuno se ne ricordasse. Il coordinamento sceglie in base alla domanda e passa al team statistica parametri strutturati invece di testo libero, così l'analisi della potenza calcola con un disegno definito. Analisi e piano finale restano passaggi fissi: ogni studio ne ha bisogno.

**Come adattarlo:** Sostituisci domanda e prova preliminare con le tue e allega direttamente i dati di misura. Aggiungi le tue linee guida statistiche all'agente del team statistica. Se il tuo settore ha bisogno di un altro team metodologico, ad esempio un team di laboratorio, salvalo come workflow con una descrizione chiara e aggiungilo ai team del coordinamento.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: un controllo qualità svolto da un secondo modello confronta la risposta di Correzione e test con tre criteri (ogni rilievo trattato, un test per ogni rilievo corretto, codice completo senza segnaposto); se un criterio non è soddisfatto, l'agente rivede la risposta una volta, e l'esito del controllo viene registrato con l'esecuzione. Il controllo giudica il testo, non esegue il codice. Nessun passo attende una persona, non c'è un budget proprio (vale il budget predefinito del tuo workspace) e gli archivi caricati vengono solo letti, mai eseguiti. Codice corretto e test sono una proposta: rivedili ed esegui i test in locale prima di adottare qualcosa.

**Perché questa architettura:** Bug e problemi di sicurezza sono due sguardi indipendenti sullo stesso codice, perciò l'analista dei bug e il revisore della sicurezza lavorano in parallelo e nessuno aspetta l'altro; l'agente di correzione riceve anche il codice originale, per unire i rilievi ed eliminare i doppioni. Il controllo qualità con una revisione c'è perché, unendo due revisioni, l'errore tipico è dimenticare un rilievo o un test. Un coordinatore non è stato usato di proposito, perché ogni revisione ha bisogno di entrambi gli sguardi; anche l'esecuzione di codice o test nel workflow è esclusa, così codice sconosciuto non gira mai sulla piattaforma.

**Come adattarlo:** Allega il tuo progetto come ZIP o incolla il codice indicando linguaggio e framework. Per altri linguaggi adatta il framework di test nell'agente di correzione, per esempio Jest o JUnit. Le vostre linee guida di codifica puoi salvarle come conoscenza. Tramite l'API del workflow la revisione può essere avviata anche da una pipeline CI.

## 12 · Strutturare un contratto e individuare i punti da verificare {#contract-review}
<!-- keywords: diritto e amministrazione, strutturatore del contratto, esplicatore delle clausole, analista dei punti da verificare, sintesi del contratto, clausole critiche -->

**Ambito:** Diritto e amministrazione · **Agenti:** 5 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, modulo di input, file di risultato, file come input, proposte di conoscenza, file di conoscenza

I contratti sono lunghi e le clausole importanti si nascondono nei dettagli. Se una clausola è accettabile dipende inoltre dagli standard dell'azienda. Il workflow struttura un contratto, lo spiega in linguaggio semplice e lo confronta con il manuale di negoziazione contrattuale (playbook) del cliente, così una persona qualificata vede subito dove si discosta. Non sostituisce una consulenza legale.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Lo strutturatore rileva parti, durata, prestazioni e scadenze. Su questa base lavorano in parallelo l'esplicatore delle clausole (linguaggio semplice) e l'analista dei punti da verificare; entrambi leggono il contratto da sé, come testo o come file caricato. L'analista cerca ogni clausola nel playbook dell'azienda, cita la sezione del playbook e classifica la clausola come standard, posizione di ripiego, scostamento o linea rossa. Se trova una linea rossa o un'altra clausola critica, un nodo decisionale aggiunge un esame approfondito di quelle clausole. L'agente del rapporto riunisce tutto in una sintesi strutturata con domande per la consulenza legale.

| Agente | Compito | Riceve |
|---|---|---|
| **Strutturatore del contratto** | Rileva parti, oggetto, durata, corrispettivi e scadenze. | Testo del contratto |
| **Esplicatore delle clausole** | Spiega ogni clausola in linguaggio semplice. | Strutturatore del contratto, Testo del contratto |
| **Analista dei punti da verificare** | Confronta ogni clausola con il playbook del cliente e individua disposizioni insolite, squilibrate o mancanti. (output strutturato) | Strutturatore del contratto, Testo del contratto |
| **Sintesi del contratto** | Unisce spiegazioni e punti da verificare in una panoramica strutturata. (output strutturato) | Esplicatore delle clausole, Analista dei punti da verificare, Clausole critiche |
| **Clausole critiche** | Esamina a fondo le clausole critiche e prepara domande per la negoziazione. | Clausole critiche? |

**Input:** Il contratto come file (PDF, Word, Markdown o testo) nel campo "Contratto come file" oppure come testo, possibilmente con la numerazione degli articoli. Il file lo carichi direttamente all'avvio; il contratto non va nella raccolta di conoscenza. Il playbook proviene dalla raccolta di conoscenza; è incluso il playbook fittizio di Commercio Campione S.a.s. Il file di esempio contiene il contratto fittizio dell'attività di prova.

**File di esempio:** `Contratto_servizio_software_esempio.docx`

**Casi di test:** Contratto nel testo, con clausole critiche; Contratto come file Word, senza testo; Contratto di manutenzione equilibrato

**Risultato:** Una sintesi strutturata con riepilogo, dati principali, clausole spiegate, punti da verificare e domande per un'avvocata o un avvocato, anche in PDF e come file Word modificabile. Ogni punto da verificare indica la sezione del playbook con cui è stato confrontato, e i temi su cui il playbook tace sono segnalati come tali. Lo strutturatore propone i dati principali del contratto per la conoscenza, per esempio per un registro dei contratti; viene salvato solo ciò che confermi. Il risultato è un supporto di lavoro e non una consulenza legale.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: l'analista dei punti da verificare classifica ogni clausola in base al playbook e conta quelle critiche; ogni linea rossa conta come critica. Se il numero è maggiore di zero, il nodo decisionale aggiunge l'esame approfondito delle clausole critiche, altrimenti viene saltato. Nessun passo attende una persona e il workflow non invia nulla. La sintesi e le sue domande sono la base per l'esame da parte di un'avvocata o un avvocato; cosa negoziare lo decidono le persone coinvolte.

**Perché questa architettura:** Spiegare e verificare non dipendono l'uno dall'altro e quindi girano in parallelo sulla struttura. Il playbook è conoscenza consultabile anziché testo nel prompt: l'ufficio legale lo aggiorna in un solo posto, la ricerca porta solo la sezione pertinente e la citazione rende tracciabile ogni classificazione. L'esame approfondito è una diramazione perché vale il suo costo solo quando si supera una linea rossa. Non è stato usato un orchestratore, perché ogni contratto richiede gli stessi passi.

**File di conoscenza (sintetici, creati durante la copia):** Playbook_contratti_Commercio_Campione: Manuale di negoziazione contrattuale fittizio di Commercio Campione S.a.s. per contratti software e cloud: posizione standard, ripiego e linea rossa per tema.

**Come adattarlo:** Carica il tuo contratto come file all'avvio o incollalo. Sostituisci il playbook fittizio nella raccolta di conoscenza con il tuo, possibilmente con la stessa struttura per tema: posizione standard, posizione di ripiego accettabile e linea rossa. I temi che ti interessano, come assicurazioni o diritti di audit, basta aggiungerli al playbook; l'analista li trova con la ricerca.

## 13 · Creare un piano di studio personale {#learning-plan}
<!-- keywords: istruzione e formazione, valutazione iniziale, pianificatore dello studio, tutor, autore del quiz -->

**Ambito:** Istruzione e formazione · **Agenti:** 4 · **Schema:** parallelo · **Livello:** Principiante · **Elementi:** modulo di input, file di risultato, file come input, memoria

Si impara meglio con un piano che parte da dove sei. Il workflow crea un piano di studio personale, spiega i primi argomenti e verifica la comprensione con un quiz.

**Come collaborano gli agenti:** La valutazione iniziale determina punto di partenza e lacune, il pianificatore dello studio ne ricava un piano settimanale. Su questa base lavorano in parallelo il tutor (contenuti della settimana scelta, basati se vuoi sul tuo materiale del corso) e l'autore del quiz (verifica delle conoscenze con soluzioni). Il risultato contiene tutte e tre le parti. La valutazione iniziale e il pianificatore condividono una memoria: prima leggono i progressi delle settimane precedenti e alla fine li aggiornano, così ogni settimana si basa sulla precedente.

| Agente | Compito | Riceve |
|---|---|---|
| **Valutazione iniziale** | Determina il punto di partenza, l'obiettivo di apprendimento e le lacune. | Obiettivo di apprendimento |
| **Pianificatore dello studio** | Crea un piano settimanale con obiettivi ed esercizi. | Valutazione iniziale |
| **Tutor** | Spiega i contenuti della prima settimana con esempi ed esercizi. | Pianificatore dello studio, Obiettivo di apprendimento |
| **Autore del quiz** | Crea una verifica delle conoscenze con soluzioni per la prima settimana. | Pianificatore dello studio |

**Input:** Chi impara, l'obiettivo, il tempo disponibile, le conoscenze pregresse e lo stile di apprendimento preferito. Nel modulo scegli la settimana da elaborare e puoi allegare materiale tuo; il file di esempio è una breve guida alle tabelle pivot. Dalla seconda settimana aggiungi una breve nota su com'è andata la settimana precedente (risultato del quiz, cosa è stato difficile); livello, obiettivi, argomenti completati e difficoltà delle settimane precedenti vengono ricordati.

**File di esempio:** `Guida_rapida_tabelle_pivot.docx`

**Casi di test:** Settimana 1 senza materiale; Settimana 2 con materiale del corso

**Risultato:** Un piano di studio di quattro settimane con obiettivi per settimana, spiegazioni chiare con esercizi per la settimana scelta e un quiz con soluzioni e spiegazioni, anche in PDF da stampare.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: all'inizio di ogni esecuzione la valutazione iniziale e il pianificatore dello studio leggono la memoria "learning-progress" e la aggiornano alla fine. Contiene livello, obiettivi, argomenti completati, difficoltà e il piano in forma breve, ma nessun dato personale sensibile. La memoria appartiene alla tua copia e si conserva tra un'esecuzione e l'altra; nell'editor del workflow ne vedi ed elimini le voci nella memoria di uno dei due agenti, per esempio per correggere una voce sbagliata o ricominciare con un'altra persona. Nella prima settimana la memoria è vuota e il workflow lavora solo con la tua descrizione. Nessun passaggio attende una persona: piano, spiegazioni e quiz sono proposte che adatti al tuo ritmo.

**Perché questa architettura:** L'apprendimento dura settimane, ma ogni esecuzione riparte da zero. Senza memoria dovresti descrivere i tuoi progressi ogni settimana, e il piano verrebbe rifatto da capo invece di basarsi sulla settimana precedente. La memoria conserva proprio questo stato che cambia; il materiale del corso che resta uguale va invece nella conoscenza. Ricordano solo la valutazione e il pianificatore, perché decidono cosa viene dopo; il tutor e l'autore del quiz lavorano in parallelo sulla settimana scelta del piano e non hanno bisogno di una storia propria.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: l'analista del bilancio e il consulente del risparmio calcolano ogni totale con la calcolatrice, e il controllo di realtà restituisce campi fissi (avanzo mensile, potenziale di risparmio, misure, primi passi, avvertenze) che confluiscono nel file Excel. L'esempio è contrassegnato come sensibile: ogni agente ha l'istruzione di indicare i punti che una persona qualificata dovrebbe verificare e di non sembrare più sicuro di quanto i dati consentano. Non ci sono passi di approvazione né revisioni automatiche; non c'è un budget proprio (vale il budget predefinito del tuo workspace). Nulla viene bonificato, disdetto o prenotato: il risultato è un aiuto per le tue decisioni, non una consulenza finanziaria o sul sovraindebitamento.

**Perché questa architettura:** Ogni passo si basa sul precedente: il risparmio si può stimare solo quando il bilancio è noto, e verificare solo quando esistono entrambi, quindi basta una catena fissa. La calcolatrice fa sì che le cifre siano calcolate e non indovinate, e i campi strutturati rendono avanzo e potenziale confrontabili tra un'esecuzione e l'altra. Al posto di un ciclo c'è un controllo di realtà separato e leggero, perché il suo compito è scartare le idee irrealistiche, non rifinire il testo. Non sono stati usati di proposito un collegamento bancario e una memoria, così i dati personali del conto vengono passati solo come file per questa esecuzione e non sono conservati tra un'esecuzione e l'altra.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il nodo decisionale legge il campo del modulo "Viaggio all'estero" e fa lavorare l'agente Documenti di viaggio solo se è selezionato; il pianificatore del budget conta le notti con lo strumento delle date e somma i costi con la calcolatrice. Un controllo qualità svolto da un secondo modello confronta il piano del pianificatore dell'organizzazione con tre criteri (entro il budget, tutti i vincoli rispettati, dati non verificati segnalati); se uno non è soddisfatto, il piano viene rivisto una volta e l'esito del controllo viene registrato con l'esecuzione. Nessun passo attende una persona e non c'è un budget proprio (vale il budget predefinito del tuo workspace). Non si prenota nulla: prezzi, orari e regole d'ingresso sono stime da verificare prima di prenotare.

**Perché questa architettura:** Itinerario, budget e organizzazione si basano l'uno sull'altro e formano quindi una catena; solo la lista dei documenti dipende da una domanda sì/no, che un nodo decisionale risolve dal modulo, così un weekend nel proprio paese non paga una lista di passaporti. Notti e totali vengono da strumenti, perché gli errori di date e di calcolo sono il punto debole tipico dei modelli linguistici. Una ricerca web in tempo reale non è stata integrata di proposito: i risultati cambiano da un giorno all'altro, le esecuzioni non sarebbero riproducibili, l'esempio dipenderebbe da uno strumento server a pagamento e non si potrebbe condividere così com'è; al suo posto ogni prezzo è segnato come stima, e puoi aggiungere tu la ricerca web.

**Come adattarlo:** Inserisci i tuoi desideri di viaggio. Se vuoi prezzi e orari aggiornati, puoi aggiungere lo strumento server "ricerca web" al pianificatore dell'itinerario; ha un costo aggiuntivo per ogni ricerca.

## 16 · Valutare un'idea imprenditoriale {#business-idea}
<!-- keywords: lavoratori autonomi e fondatori, coach per startup, giuria di investitori -->

**Ambito:** Lavoratori autonomi e fondatori · **Agenti:** 2 · **Schema:** adattivo (orchestrazione) · **Livello:** Avanzato · **Elementi:** orchestratore con team, file di risultato, budget e limiti

Prima di avviare un'impresa conviene guardare con lucidità mercato, numeri e rischi. Ma non ogni idea ha bisogno degli stessi esperti: un servizio di riparazione biciclette non ha bisogno di un'esperta di autorizzazioni, una startup di bevande sì. Il workflow lascia che una coach per startup metta insieme i team di esperti adatti e che una giuria di investitori arrivi a un giudizio motivato.

**Come collaborano gli agenti:** La coach per startup è un orchestratore: legge l'idea e decide quali dei cinque team di esperti coinvolgere. Mercato, redditività e rischi lavorano in parallelo per ogni idea; regolamentazione e operazioni si aggiungono solo se l'idea lo richiede. Se i risultati si contraddicono, la coach pone a un team una domanda di approfondimento mirata. Poi la giuria di investitori soppesa tutti i rapporti e dà un giudizio strutturato con un punteggio.

| Agente | Compito | Riceve |
|---|---|---|
| **Coach per startup** | Decide di quali team di esperti ha bisogno l'idea, li fa lavorare in parallelo e pone domande di approfondimento. (Orchestratore) | Idea imprenditoriale |
| **Giuria di investitori** | Soppesa mercato, numeri e rischi ed emette un giudizio. (output strutturato) | Idea imprenditoriale, Coach per startup |

**Team che l'orchestratore può impiegare:**

| Team | Compito | Capacità |
|---|---|---|
| **Team mercato** | Stima target, domanda, disponibilità a pagare e concorrenza di un'idea imprenditoriale. | market analysis, target groups, competition |
| **Team redditività** | Calcola margine di contribuzione, punto di pareggio, rientro e scenari di un'idea imprenditoriale con la calcolatrice. | profitability, break-even, financial planning |
| **Team rischi** | Cerca i punti deboli di un'idea imprenditoriale e modi economici per verificarli prima dell'avvio. | risk analysis, validation experiments |
| **Team regolamentazione** | Individua autorizzazioni, registrazioni, etichettatura, igiene, assicurazioni e obblighi di protezione dei dati che riguardano un'idea imprenditoriale. | regulation, permits, licences, data protection |
| **Team operazioni** | Verifica se un'idea imprenditoriale si può realizzare come descritto: processi, capacità, attrezzature, fornitori e logistica. | operations, technology, logistics, suppliers |

**Input:** Una descrizione dell'idea con offerta, target, prezzi, costi, capacità e concorrenti noti.

**Casi di test:** Servizio mobile di riparazione biciclette; Birrificio di kombucha (alimento regolamentato)

**Risultato:** Un giudizio strutturato (proseguire, adattare o abbandonare) con punteggio, punti di forza, rischi, ipotesi da verificare e passi successivi concreti, anche come report PDF. Nell'esecuzione, la vista di orchestrazione mostra quali team ha scelto la coach, perché, con quale incarico e cosa ha consegnato ogni team.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: la coach decide quali team lavorano, in quale ordine e con quale incarico; ogni decisione viene registrata con la sua motivazione. Dei limiti la tengono sotto controllo: al massimo 6 decisioni, ogni team al massimo due volte, al massimo 3 team contemporaneamente e un budget di 3 USD per esecuzione. Nessun passaggio attende una persona; il giudizio è la base della tua decisione.

**Perché questa architettura:** Un workflow fisso farebbe lavorare ogni volta tutti e cinque i team e pagherebbe un'analisi delle autorizzazioni di cui un servizio di biciclette non ha bisogno, oppure li escluderebbe quando contano. La coach fa proprio questa scelta, in modo tracciabile ed entro dei limiti. La giuria resta un passaggio fisso, perché un giudizio strutturato e confrontabile non deve dipendere da come la coach ha ripartito il lavoro.

**Come adattarlo:** Descrivi la tua idea con i tuoi numeri. Per aggiungere un esperto, ad esempio per le questioni fiscali, salva un workflow con una descrizione chiara e capacità e aggiungilo ai team della coach; sarà lei a decidere quando serve. I tuoi dati di mercato puoi caricarli come conoscenza e assegnarli all'analista di mercato del team mercato.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: lo sviluppatore di idee legge la memoria "creator-ideas" prima di iniziare e, alla fine di ogni esecuzione, vi salva da solo i titoli provvisori delle nuove idee, senza passo di conferma; puoi vedere o svuotare la memoria in Memoria. Un controllo qualità svolto da un secondo modello confronta il calendario del pianificatore dei contenuti con tre criteri (frequenza adatta al tempo disponibile, pilastri bilanciati, obiettivi sostenuti); se uno non è soddisfatto, il calendario viene rivisto una volta e l'esito del controllo viene registrato con l'esecuzione. Nessun passo attende una persona e non c'è un budget proprio (vale il budget predefinito del tuo workspace). Non viene pubblicato nulla: il piano è una bozza che adatti e pubblichi tu.

**Perché questa architettura:** Strategia, idee e calendario si basano strettamente l'uno sull'altro, perciò basta una catena di tre agenti; il pianificatore dei contenuti riceve anche la strategia direttamente, per misurare il mix sui pilastri. Solo lo sviluppatore di idee ha una memoria, perché le idee ripetute sono il vero problema delle esecuzioni mensili, mentre la strategia deve nascere ogni volta dai numeri attuali. Non sono stati usati di proposito una ricerca web in tempo reale sulle tendenze e un collegamento alle piattaforme: i risultati sulle tendenze cambiano ogni giorno e renderebbero le esecuzioni né riproducibili né trasferibili, e una bozza di piano non deve essere pubblicata automaticamente; la strategia si basa invece sulle tue statistiche.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: le due analisi girano in parallelo a ogni esecuzione, e il calcolatore del rendimento calcola ogni indicatore con la calcolatrice, così ogni calcolo è tracciabile nell'esecuzione. Nessun passaggio attende una persona e nessun controllo qualità rielabora il risultato; puoi allegare al massimo 8 file. Poiché le decisioni immobiliari sono delicate, tutti gli agenti hanno l'istruzione di indicare i punti che una persona qualificata deve verificare e di non trasmettere più certezza di quanta ne consentano i dati. Non è impostato un budget proprio, quindi vale il budget predefinito del tuo spazio di lavoro; il confronto è un supporto per la tua decisione, non una raccomandazione d'acquisto.

**Perché questa architettura:** Rendimento e posizione sono domande indipendenti, perciò vengono analizzate in parallelo e solo la valutazione le mette a confronto; la struttura fissa (confronto, offerta preferita, rischi, verifiche) rende le offerte confrontabili da un'esecuzione all'altra. Un orchestratore non aggiungerebbe nulla, perché ogni confronto ha bisogno di entrambe le analisi. Volutamente non c'è una ricerca web dal vivo su prezzi richiesti o livelli degli affitti: i risultati cambierebbero a ogni esecuzione e non sarebbero tracciabili, mentre i tuoi annunci, verbali e un indice degli affitti salvato mantengono la base fissa e verificabile.

**Come adattarlo:** Inserisci le tue offerte e i dati di finanziamento e allega direttamente annunci, verbali dell'assemblea condominiale o planimetrie. Un osservatorio degli affitti che ti serve spesso puoi salvarlo come conoscenza e assegnarlo all'analista di immobile e posizione.

## 19 · Analizzare i ritardi di cantiere {#construction-delay}
<!-- keywords: edilizia, analista del cronoprogramma, coordinamento di cantiere, rapporto al committente -->

**Ambito:** Edilizia · **Agenti:** 3 · **Schema:** adattivo (orchestrazione) · **Livello:** Avanzato · **Elementi:** orchestratore con team, approvazione, modulo di input, file di risultato, file come input, contratto di output, budget e limiti

I ritardi in cantiere hanno cause diverse, e ogni causa richiede competenze diverse: il gelo va documentato, un fornitore in ritardo richiede una comunicazione di impedimento alla parte giusta, una variante ordinata dal committente può giustificare una proroga dei termini e la carenza di personale richiede un piano di accelerazione. Il workflow calcola gli scostamenti e lascia che un coordinamento di cantiere coinvolga esattamente i team specialistici di cui la situazione ha bisogno.

**Come collaborano gli agenti:** L'analista del cronoprogramma calcola con lo strumento delle date il ritardo di ogni traguardo ed elenca le cause presunte. Il coordinamento di cantiere, un orchestratore, compone prima una squadra di al massimo tre dei quattro team specialistici e poi assegna gli incarichi: il team di cantiere per meteo, terreno e varianti, il team forniture per fornitori e subappaltatori, il team riserve per comunicazioni di impedimento e proroghe dei termini, il team recupero per misure di accelerazione con i relativi costi. I team indipendenti lavorano in parallelo. Il team riserve si ferma per una persona: la sua bozza di comunicazione viene usata solo dopo il visto della direzione di cantiere responsabile. L'agente del rapporto scrive il rapporto di avanzamento e, prima che arrivi al committente, una persona lo approva.

| Agente | Compito | Riceve |
|---|---|---|
| **Analista del cronoprogramma** | Calcola ritardi e percorso critico con gli strumenti delle date e di calcolo. (output strutturato; Strumenti: `days_between`, `calculator`) | Stato del progetto |
| **Coordinamento di cantiere** | Compone i team specialistici di cui il ritardo ha bisogno e assegna i loro incarichi. (Orchestratore) | Analista del cronoprogramma |
| **Rapporto al committente** | Riassume in modo oggettivo per il committente tempi, cause, riserve e misure. | Analista del cronoprogramma, Coordinamento di cantiere |

**Team che l'orchestratore può impiegare:**

| Team | Compito | Capacità |
|---|---|---|
| **Team di cantiere e progettazione** | Esamina le cause tecniche dei ritardi di cantiere: meteo, terreno, varianti e sequenza delle lavorazioni; attribuisce giorni di ritardo con prove. | technical causes, design changes, ground conditions, weather |
| **Team forniture** | Esamina i ritardi causati da fornitori, consegne di materiale e organico dei subappaltatori; attribuisce giorni di ritardo con prove. | supply chain, subcontractors, material delivery |
| **Team riserve** | Redige comunicazioni di impedimento e valuta richieste di proroga dei termini per ritardi fuori dalla sfera dell'impresa; una direzione di cantiere vista la bozza. (si ferma per un'approvazione) | contract, claims, notice of obstruction |
| **Team recupero** | Sviluppa misure di accelerazione per un cantiere in ritardo con giorni recuperati, costi aggiuntivi e una nuova previsione di ultimazione. | recovery planning, acceleration, cost estimate |

**Input:** Una panoramica del cronoprogramma con traguardi pianificati ed effettivi, note sulle cause, data del rapporto e condizioni contrattuali, come testo o come file: cronoprogramma in Excel, giornale dei lavori in PDF, foto come immagini. I file di esempio contengono un cronoprogramma e un estratto del giornale dei lavori.

**File di esempio:** `Cronoprogramma_asilo_Raggio_di_Sole.xlsx`, `Giornale_lavori_estratto_aprile_maggio.pdf`

**Casi di test:** Cronoprogramma nel testo; Cronoprogramma e giornale dei lavori come file

**Risultato:** Un rapporto di avanzamento oggettivo con situazione dei tempi, cause e sfere di responsabilità, comunicazioni e richieste di proroga, misure di recupero con costi, decisioni necessarie e rischi; dopo l'approvazione in PDF e in un file Word modificabile. La vista di orchestrazione mostra quali team il coordinamento ha composto, che cosa ciascuno ha consegnato come dati strutturati e perché. Le questioni su penali contrattuali e proroghe dei termini restano soggette a verifica tecnica e legale.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il coordinamento sceglie al massimo tre team, ne fa lavorare al massimo due contemporaneamente e dà a ogni team al massimo due incarichi; ogni decisione di composizione e di incarico viene registrata con la motivazione. Una persona decide due volte: la direzione di cantiere vista la bozza di comunicazione di impedimento all'interno del team riserve (un rifiuto termina l'esecuzione), e una persona approva il rapporto di avanzamento prima che vengano creati i file. Limiti: al massimo 8 decisioni del coordinamento, 50 passi, 40 minuti e 4 USD per esecuzione.

**Perché questa architettura:** Una catena fissa trattava ogni ritardo allo stesso modo: un analista delle cause, un pianificatore delle misure, che il problema fosse il gelo o una comunicazione mancante. Con il coordinamento, un ritardo puramente meteorologico non costa un esame delle riserve, mentre una variante ordinata dal committente coinvolge il team riserve con il suo visto. I team restituiscono risultati strutturati (giorni, responsabilità, prove), così il rapporto può sommarli invece di riformulare testo. Il calcolo dei tempi, il rapporto e l'approvazione finale restano passi fissi perché ogni rapporto ne ha bisogno.

**Come adattarlo:** Esporta il tuo cronoprogramma dal software di progetto in Excel e allega giornale dei lavori e foto. Adatta il team riserve al tuo tipo di contratto (ad esempio FIDIC o condizioni proprie) e inserisci nel team recupero le tariffe di costo della tua impresa. Se ti serve un'altra specialità, come gli impianti, salvala come workflow con una descrizione chiara e aggiungila ai team del coordinamento.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: i tre passaggi girano sempre nello stesso ordine; il calcolo dei costi lavora con lo strumento di calcolo e riceve i tuoi prezzi d'acquisto direttamente dall'input, al massimo un file CSV o Excel fino a 5 MB. Un controllo qualità valuta il menù secondo tre criteri (target, prezzi coerenti con il calcolo, avvertenza sugli allergeni); se uno non è soddisfatto, il redattore del menù lo rielabora una volta, e l'esito del controllo viene registrato nell'esecuzione con la motivazione (se non è ancora superato, il workflow prosegue e il controllo risulta non superato). Nessun passaggio attende una persona e non è impostato un budget proprio, quindi vale il budget predefinito del tuo spazio di lavoro. Menù e calcolo sono bozze: prezzi, porzioni e indicazione degli allergeni li verifichi tu prima della stampa.

**Perché questa architettura:** Ogni passaggio si basa sul precedente: niente calcolo senza piatti, niente menù senza prezzi, per questo è adatta una catena fissa; il calcolo dei costi riceve inoltre direttamente il listino, così non dipende dallo sviluppatore del concept che ripete le cifre. Il controllo qualità è sul menù perché è lì che i prezzi possono discostarsi dal calcolo. Volutamente non si usano un orchestratore, perché i passaggi sono sempre gli stessi, né una ricerca web dal vivo dei prezzi all'ingrosso, che cambierebbero a ogni esecuzione e non corrisponderebbero al tuo fornitore; il tuo listino rende il calcolo riproducibile.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: i tre passaggi girano sempre nello stesso ordine; il calcolo dei margini lordi calcola ogni appezzamento e il totale con la calcolatrice, così le cifre sono tracciabili nell'esecuzione. Non c'è alcuna rielaborazione automatica: il controllo di plausibilità non modifica il piano, ma elenca verifiche delle regole, rischi e domande aperte in un esito strutturato con il margine lordo totale come numero. Nessun passaggio attende una persona; puoi allegare fino a 3 file da 10 MB ciascuno, e non è impostato un budget proprio, quindi vale il budget predefinito del tuo spazio di lavoro. Il piano è una bozza che verifichi in base alle norme locali vigenti prima di ordinare le sementi o chiedere contributi.

**Perché questa architettura:** Prima viene la scelta delle colture, i margini lordi ne dipendono e il controllo ha bisogno di entrambi, per questo è adatta una catena fissa; il controllo di plausibilità riceve inoltre direttamente la rotazione per confrontarla con le tue regole. Volutamente c'è un passaggio di controllo separato che indica apertamente le violazioni, invece di un ciclo di qualità che riscriverebbe il piano senza dirlo, perché le deviazioni nella rotazione sono compromessi che decidi tu. Niente ricerca web dal vivo su prezzi o requisiti e niente orchestratore: prezzi e regole trovati online cambiano ogni giorno e variano per regione, le tue ipotesi mantengono il calcolo riproducibile e i passaggi sono gli stessi per ogni azienda.

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

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: calendario e budget nascono in parallelo; il pianificatore del calendario fa il conto alla rovescia dalla data della festa con lo strumento delle date e il pianificatore del budget calcola con la calcolatrice. Un controllo qualità valuta il documento per il direttivo per completezza, responsabilità e coerenza con il budget; se un criterio non è soddisfatto, il documento viene rielaborato una volta, e l'esito del controllo viene registrato nell'esecuzione con la motivazione (se non è ancora superato, il workflow prosegue e il controllo risulta non superato). Nessun passaggio attende una persona e non viene inviato nulla; non è impostato un budget proprio, quindi vale il budget predefinito del tuo spazio di lavoro. Il documento è una bozza, e sulle proposte di delibera decide il direttivo.

**Perché questa architettura:** Calendario e budget non dipendono l'uno dall'altro e girano in parallelo, mentre il pianificatore della comunicazione ha bisogno del calendario e quindi viene dopo; il documento per il direttivo unisce tutto. Volutamente non c'è un passaggio di approvazione nel workflow, perché la vera approvazione è la riunione del direttivo stessa, né un collegamento a e-mail o calendario, perché i volontari mandano gli inviti da soli dopo la decisione del direttivo. Un orchestratore non aggiungerebbe nulla, dato che ogni festa ha bisogno delle stesse quattro parti.

**Come adattarlo:** Inserisci i dati principali della tua festa. Permessi e prescrizioni variano da comune a comune; aggiungi i requisiti noti nell'input. Loghi e modelli di locandina possono essere salvati come conoscenza.

## 23 · Sviluppare una campagna di raccolta fondi {#nonprofit-campaign}
<!-- keywords: organizzazioni non profit, sviluppatore della campagna, analista dell'impatto, revisore della credibilità -->

**Ambito:** Organizzazioni non profit · **Agenti:** 3 · **Schema:** con diramazioni · **Livello:** Avanzato · **Elementi:** decisione, ciclo di revisione, file di risultato, proposte di conoscenza

Le campagne di raccolta fondi hanno bisogno di una storia che coinvolga, ma anche di affermazioni oneste sull'impatto. Il workflow sviluppa una campagna, valuta il possibile impatto e verifica se le promesse sono credibili ed eticamente corrette.

**Come collaborano gli agenti:** Lo sviluppatore della campagna e l'analista dell'impatto lavorano in parallelo: uno progetta messaggio, target e azioni, l'altro costruisce un modello di impatto con indicatori e calcola il costo per bambino con la calcolatrice. Il revisore della credibilità controlla entrambi. Se ritiene la campagna non credibile, una condizione la rimanda allo sviluppatore della campagna insieme alle osservazioni della revisione; la campagna rivista viene controllata di nuovo, al massimo due volte. Il risultato contiene tutte e tre le parti.

| Agente | Compito | Riceve |
|---|---|---|
| **Sviluppatore della campagna** | Progetta messaggio, target, canali e calendario della campagna. | Descrizione del progetto |
| **Analista dell'impatto** | Costruisce un modello di impatto con indicatori e il costo per bambino. (Strumenti: `calculator`) | Descrizione del progetto |
| **Revisore della credibilità** | Verifica le affermazioni per esagerazioni, etica ed evidenze. (output strutturato) | Sviluppatore della campagna, Analista dell'impatto |

**Input:** Organizzazione, progetto, risultati finora, obiettivo, fabbisogno, periodo della campagna e canali esistenti.

**Casi di test:** Padrini di lettura nelle scuole primarie

**Risultato:** Un concept di campagna con calendario e bozze di testi, un modello d'impatto con indicatori e una verifica strutturata di affermazioni esagerate, avvertenze etiche e un piano di misurazione dell'impatto, anche come file Word. L'analista dell'impatto propone il suo modello d'impatto per la conoscenza, per esempio per future richieste di finanziamento; viene salvato solo ciò che confermi.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: il giudizio sì/no del revisore della credibilità sulla credibilità decide se la campagna torna in revisione; l'esecuzione mostra quale ramo è stato preso. Lo sviluppatore della campagna rivede al massimo due volte, ogni volta con le osservazioni della revisione e la sua bozza precedente. Se poi la campagna non è ancora ritenuta credibile, l'esecuzione prosegue comunque fino al risultato, e le osservazioni della revisione mostrano cosa resta aperto. Nessun passaggio attende una persona: testi e cifre sono bozze che la tua organizzazione controlla prima della pubblicazione, soprattutto le affermazioni sull'impatto e le foto di bambini. I modelli d'impatto proposti vengono salvati come conoscenza solo se li confermi.

**Perché questa architettura:** I problemi di credibilità li corregge meglio chi ha scritto il testo; per questo la revisione riporta allo sviluppatore della campagna invece di limitarsi a elencare i problemi. Il ciclo è limitato a due giri: una campagna che dopo esagera ancora ha bisogno di prove migliori dall'organizzazione, non di altre riformulazioni. Il modello d'impatto resta fuori dal ciclo perché si basa sui dati del progetto, non sui testi della campagna. Non c'è un passaggio di approvazione, perché la campagna resta una bozza e viene comunque pubblicata fuori dal workflow.

**Come adattarlo:** Descrivi il tuo progetto e i tuoi risultati nel modo più onesto possibile. Carica bilanci sociali o valutazioni come conoscenza e assegnali all'analista dell'impatto.

## 24 · Rispondere a una richiesta di un cittadino {#citizen-inquiry}
<!-- keywords: enti pubblici, analisi delle questioni, preparazione delle informazioni, bozza di risposta -->

**Ambito:** Enti pubblici · **Agenti:** 3 · **Schema:** sequenziale · **Livello:** Principiante · **Elementi:** approvazione, ciclo di revisione, modulo di input, file di risultato, file come input, proposte di conoscenza, file di conoscenza

Le richieste dei cittadini contengono spesso più questioni e vanno risposte in modo corretto, chiaro e senza impegni affrettati. Il workflow scompone la richiesta, trova le regole pertinenti del comune, prepara una risposta e lascia la decisione sull'invio all'addetto alla pratica.

> Richiede verifica esperta: i risultati sono strumenti di lavoro e devono essere verificati da una persona qualificata.

**Come collaborano gli agenti:** Una catena di tre agenti e un'approvazione: l'analisi delle questioni separa le questioni e assegna le competenze. La preparazione delle informazioni cerca nelle regole salvate del comune e nei documenti della richiesta, cita i passaggi usati e segnala quando nessuna regola copre una questione. La bozza di risposta scrive una risposta comprensibile per il cittadino; un controllo qualità verifica che si citino solo regole documentate e che non si assumano impegni vincolanti. Poi l'addetto alla pratica controlla la risposta; un rifiuto con commento la rimanda alla bozza di risposta per la revisione.

| Agente | Compito | Riceve |
|---|---|---|
| **Analisi delle questioni** | Separa le questioni e assegna competenze e urgenza. | Richiesta del cittadino |
| **Preparazione delle informazioni** | Cerca nelle regole del comune e cita i passaggi pertinenti per ogni questione. | Analisi delle questioni, Richiesta del cittadino |
| **Bozza di risposta** | Scrive una risposta oggettiva e comprensibile da approvare. (con controllo qualità) | Analisi delle questioni, Preparazione delle informazioni |

**Input:** La richiesta della cittadina o del cittadino, eventualmente con informazioni interne sulla pratica, come testo o come file. Puoi allegare anche foto della richiesta. Le regole del comune provengono dalla raccolta di conoscenza; è incluso un insieme fittizio di regole di Città Esempio. Il file di esempio è una scheda informativa fittizia del comune.

**File di esempio:** `Scheda_fabbricati_accessori_e_illuminazione.pdf`

**Casi di test:** Casetta da giardino e lampione; Regole come file della scheda informativa

**Risultato:** Una bozza di risposta in linguaggio semplice con competenze, prossimi passi e indicazioni per chi gestisce la pratica; dopo l'approvazione anche come file Word per la vostra carta intestata. Il file Word è ripulito: i dati personali, come nomi, indirizzi, numeri di telefono e indirizzi e-mail, e le credenziali sono sostituiti da segnaposto, quindi i dati del destinatario li inserisci tu dalla pratica. La preparazione delle informazioni propone le regole trovate, con il riferimento, per la conoscenza; viene salvato solo ciò che confermi.

**Che cosa viene deciso automaticamente e quando interviene una persona:** Automatico: l'analisi delle questioni, la ricerca delle regole con citazioni e il controllo qualità della bozza (solo regole documentate, linguaggio semplice, nessun impegno vincolante). Una persona decide: l'addetto alla pratica controlla ogni risposta prima dell'invio. Un rifiuto richiede un commento e rimanda la bozza con questo riscontro alla bozza di risposta; dopo al massimo 2 revisioni, un ulteriore rifiuto fa fallire l'esecuzione senza file. Il workflow non invia nulla da sé; anche la risposta approvata è una bozza che l'addetto invia tramite i canali abituali.

**Perché questa architettura:** Ogni richiesta richiede gli stessi passi, quindi basta una catena fissa e un orchestratore aggiungerebbe solo costi. Le regole sono conoscenza consultabile anziché testo incollato in ogni richiesta: la preparazione delle informazioni trova i passaggi pertinenti, li cita e si accorge quando nulla corrisponde. L'approvazione con ciclo di revisione c'è perché una risposta ai cittadini ha effetti fuori dall'amministrazione e chi gestisce la pratica la conosce meglio. Un collegamento al sistema di posta è stato escluso di proposito, così l'invio resta una decisione umana.

**File di conoscenza (sintetici, creati durante la copia):** Regole_comune_Citta_Esempio: Regole fittizie del Comune di Città Esempio su fabbricati accessori, piano urbanistico n. 17, illuminazione pubblica, rifiuti ingombranti, alberi e gestione delle richieste.

**Come adattarlo:** Sostituisci le regole fittizie nella raccolta di conoscenza con i vostri regolamenti, schede informative ed elenchi di competenze; titoli e numeri chiari rendono precise le citazioni. Carta intestata e formula di saluto si aggiungono nel prompt di sistema della bozza di risposta. Per molte richieste insieme usa l'elaborazione in batch.

<!-- examples:end -->

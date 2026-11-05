# Introduzione

Nodestro è uno studio visuale per workflow multi-agente. Colleghi agenti IA su un'area di lavoro per formare una pipeline, la avvii e segui ogni passaggio. Questo capitolo spiega i concetti di base e ti guida nel tuo primo workflow.

## Che cos'è Nodestro? {#ueberblick}
<!-- keywords: panoramica, idea, n8n, orkexa, libreria, provider, anthropic, claude, openai, gemini -->

Nodestro (da *Node* e *Maestro*) rende utilizzabile la libreria Python **Orkexa** tramite un’interfaccia grafica. Ogni **nodo** dell’area di lavoro è un agente: un modello di IA di Anthropic, OpenAI, Google Gemini o di un tuo server, con un ruolo, strumenti e conoscenze propri. Tramite le **connessioni** gli agenti si passano i risultati.

Usi tipici:

- **Ricerca e report:** un agente raccoglie i fatti, un secondo verifica i calcoli, un terzo scrive il report.
- **Prospettive parallele:** più agenti lavorano contemporaneamente sullo stesso input (per esempio pubblico e struttura) e un ultimo agente unisce tutto.
- **Valutazione strutturata:** un agente restituisce un oggetto JSON validato con campi fissi che altri programmi possono elaborare.
- **Testi con controllo qualità:** un giudice verifica il risultato in base a criteri e fa migliorare l'agente.

Nodestro funziona in locale sul tuo computer. Workflow, esecuzioni, conoscenze e memoria sono salvati in un database SQLite. I dati lasciano il computer solo per le richieste ai provider di IA che hai configurato.

## Concetti di base {#begriffe}
<!-- keywords: glossario, concetti, nodo, esecuzione, trace, token -->

| Concetto | Significato |
|---|---|
| **Workflow** | Un processo salvato fatto di nodi e collegamenti. |
| **Nodo** | Un blocco sull'area di lavoro: *Avvio*, *Agente*, *Risultato*, *Decisione*, *Approvazione*, *Sotto-workflow* o *Orchestratore*. Un collegamento da una decisione o da un’approvazione a un passaggio precedente crea un ciclo. |
| **Agente** | Un modello di IA con prompt di sistema, compito e, facoltativamente, strumenti, conoscenze, memoria e formato di output. |
| **Collegamento** | Passa il risultato di un nodo al nodo successivo. |
| **Esecuzione** | Una singola esecuzione di un workflow con un input specifico. |
| **Traccia (trace)** | La registrazione completa di un'esecuzione: input, risultati, chiamate agli strumenti, errori, tempi, token e costi. |
| **Strumento** | Una funzione che un agente può chiamare da solo, come una calcolatrice o la ricerca web. |
| **Conoscenza** | File caricati (PDF, immagini, testi) che gli agenti usano come materiale di riferimento. |
| **Memoria** | Note che un agente scrive da solo e rilegge in attività successive. |
| **Token** | L'unità di fatturazione dei modelli: circa un frammento di parola. 1.000 token corrispondono a circa 600 parole in italiano. |
| **Budget** | Un limite di costo per esecuzione. Se non basta per un’esecuzione che hai avviato tu, l’esecuzione si mette in pausa e attende una decisione sul budget; le esecuzioni non presidiate (pianificazioni, esecuzioni in batch, serie di test) invece falliscono. |

## Primi passi {#erste-schritte}
<!-- keywords: guida, tutorial, avvio rapido, primo workflow, quickstart -->

Crea il tuo primo workflow in pochi minuti:

1. **Configura un provider di IA.** Apri *Impostazioni → Provider di IA* e inserisci la chiave API di un provider, per esempio Anthropic (o imposta prima dell’avvio una variabile d’ambiente come `ANTHROPIC_API_KEY`). Se usi un altro provider, cambia lì anche il modello predefinito. Senza un provider configurato puoi modificare tutto, ma non eseguire nulla; la pagina *Workflow* lo segnala in alto e porta alle impostazioni. Copiare un esempio funziona anche senza provider.
2. **Crea un workflow.** In *Workflow*, fai clic su **Nuovo workflow**, inserisci un nome e conferma con **Crea e apri**. L'editor si apre con tre nodi già collegati: *Avvio*, *Nuovo agente* e *Risultato*.
3. **Configura l'agente.** Fai clic sull'agente. A destra compare l'ispettore. Dai un nome all'agente e scrivi un prompt di sistema, per esempio: «Sei un correttore esperto. Migliora ortografia e stile senza cambiare il contenuto.»
4. **Avvia.** Fai clic su **Avvia workflow**, inserisci un testo e conferma con **Avvia**. Nodestro salva il workflow automaticamente. Se il pulsante è bloccato, il motivo compare subito accanto, con un collegamento alla soluzione.
5. **Osserva.** Nella *Panoramica dell'esecuzione* sotto l'area di lavoro vedi in diretta cosa scrive l'agente, quali strumenti chiama, quanti token consuma e quanto costa.
6. **Ricostruisci.** Con **Dettagli** arrivi all'esecuzione completa con la sua cronologia.

> **Suggerimento:** Sotto i tuoi workflow trovi la galleria con 24 [workflow di esempio](/docs/beispiele) per attività tipiche, per esempio **Analisi finanziaria** e **Articolo per il blog**. L’anteprima è gratuita; gli esempi copiati sono copie tue che puoi modificare liberamente.

## L'interfaccia {#oberflaeche}
<!-- keywords: navigazione, barra laterale, menu, tema, scuro, chiaro, layout -->

La **barra laterale** a sinistra segue il tuo modo di lavorare: creare, eseguire e verificare, poi automatizzare.

- **Crea:** *Workflow* (i tuoi processi), *Libreria di agenti* (modelli riutilizzabili), *Strumenti*, *Conoscenza* e *Memoria*.
- **Esegui e verifica:** *Esecuzioni* (tutte le esecuzioni in dettaglio), *Approvazioni* (decisioni che le esecuzioni attendono) e *Utilizzo* (token e costi nel tempo).
- **Automatizza e testa:** *Serie di test*, *Esecuzioni in serie* e *Pianificazioni*.
- **Aiuto:** questa *Documentazione* e la pagina *Benvenuto*.

In basso trovi le *Impostazioni* e, sotto, dove gira Nodestro: se avvii Nodestro sul tuo computer con il comando `nodestro`, c’è scritto **Locale e privato**; su un server, **Il server della tua organizzazione** (vedi [Nodestro su un server](/docs/einstellungen#server)). In alto a destra scegli lo schema di colori: *Sistema* (segue il sistema operativo, predefinito), *Scuro* o *Chiaro*; la scelta viene salvata nel browser. Se il provider del modello predefinito non è configurato, lì compare un avviso (*Configura provider di IA* oppure, se è già configurato un altro provider, *Il modello predefinito richiede …*) che porta direttamente alle impostazioni. Su un server, in alto a destra vedi anche il tuo account.

**Aiuto proprio dove serve:** accanto a molti controlli c'è un piccolo simbolo **?**. Passaci sopra con il mouse, selezionalo con il tasto Tab o toccalo sui dispositivi touch: compare una breve spiegazione, spesso con un link alla sezione corrispondente di questa documentazione. Il simbolo del libro accanto ai titoli di pagina apre il capitolo corrispondente. Con **Esc** chiudi la spiegazione.

Gli stati sono sempre mostrati come testo e simbolo, mai solo con il colore. Tutti i controlli sono raggiungibili anche da tastiera.

## Ricerca {#suche}
<!-- keywords: ricerca, cercare, trovare, ctrl+k, cmd+k, ricerca rapida -->

Il campo di ricerca in alto nella barra del titolo (o **Ctrl+K**, su Mac **⌘K**) cerca in pagine e sezioni delle impostazioni, workflow, esecuzioni, agenti nei workflow, libreria di agenti, workflow di esempio, strumenti, conoscenza e in questa documentazione. I risultati sono raggruppati per tipo; i preferiti compaiono con una stella. Le esecuzioni vengono trovate tra le più recenti per nome del workflow, input, stato o ID. Con il campo vuoto, ti propone le tue ultime esecuzioni e i workflow modificati di recente.

Con le frecce scegli un risultato; **Invio** lo apre dove si trova: un agente nell’editor del suo workflow, un modello nella libreria di agenti, uno strumento nella libreria degli strumenti, un file di conoscenza nell’elenco e una sezione nella documentazione. Maiuscole, minuscole e accenti non contano.

## Dove sono i miei dati? {#daten}
<!-- keywords: privacy, posizione, database, sqlite, backup, nodestro_data_dir, ~/.nodestro -->

Tutti i dati sono salvati in un database SQLite nella directory dei dati, per impostazione predefinita `~/.nodestro` (modificabile con `--data-dir` o con la variabile d'ambiente `NODESTRO_DATA_DIR`). Contiene:

- `nodestro.db` con workflow, modelli di agenti, esecuzioni, impostazioni, file di conoscenza, indice di ricerca e spazi di memoria,
- la cartella `tools` con gli strumenti tuoi e quelli creati dall'IA.

Per fare un **backup**, copia la directory dei dati mentre Nodestro è chiuso. Al provider di un agente va solo il contenuto che l’agente serve per la sua richiesta: prompt di sistema, compito, conoscenze assegnate, contenuti di memoria che legge e risultati degli strumenti. Le chiavi API non vengono mai mostrate nell’interfaccia. Se lavori con Nodestro su un server, i dati sono salvati su quel server (vedi [Nodestro su un server](/docs/einstellungen#server)).

## L’app desktop {#desktop}
<!-- keywords: desktop, app, app desktop, download, installazione, finestra -->

In questa versione non esiste un’app desktop di Nodestro, e non se ne può scaricare nessuna. Per usare Nodestro sul tuo computer, avvialo con il comando `nodestro`: gira in locale e si apre nel browser (vedi [Installazione e avvio](/docs/einstellungen#installation)).

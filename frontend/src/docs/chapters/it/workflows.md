# Workflow

Un workflow collega agenti in una pipeline. Questo capitolo spiega come creare workflow, collegare nodi, come i dati passano tra gli agenti e come avviare un'esecuzione.

## Creare e gestire workflow {#anlegen}
<!-- keywords: nuovo workflow, creare, eliminare, duplicare, copia, panoramica, riprendi, esecuzioni recenti, team, badge team, senza modello di ia, galleria, inizia qui, livello -->

La pagina **Workflow** mostra tutti i workflow come schede con il numero di agenti, l'ultima modifica e lo stato dell'ultima esecuzione.

La pagina offre tre modi equivalenti per iniziare: **Crea con l’IA** apre la finestra di un nuovo workflow con l’[architetto IA](/docs/ki-architekt#neu-erstellen), **Parti da un esempio** apre la [galleria di esempi](/docs/beispiele) e **Costruiscilo da te** apre la stessa finestra per un workflow vuoto. Finché non c’è nessun workflow compaiono come grandi riquadri, poi come una riga sottile **Inizia da capo** sopra l’elenco.

**Senza modello di IA:** se per il modello predefinito non è ancora configurato un provider di IA, un avviso sopra i grandi riquadri spiega che i workflow girano solo con un modello di IA collegato (una chiave API o un server di modelli locale come Ollama), con il collegamento **Configura nelle impostazioni**. L’esempio passa allora al primo posto, perché una copia non ha bisogno di un modello, e *Crea con l’IA* riporta *Richiede una connessione a un modello di IA*. Anche la finestra lo segnala se lì scegli *Crea con l’IA*: l’architetto IA lavora con il tuo modello predefinito.

- **Nuovo workflow:** inserisci un nome e una descrizione facoltativa. Il nuovo workflow contiene già *Avvio → Agente → Risultato*.
- **Crea con l’IA:** nella stessa finestra descrivi cosa vuoi e l’[architetto di workflow](/docs/ki-architekt#neu-erstellen) progetta il workflow da verificare.
- **Aprire:** fai clic sulla scheda.
- **Duplicare:** simbolo di copia sulla scheda. La copia si chiama «… (copia)»; le esecuzioni non vengono copiate.
- **Eliminare:** simbolo del cestino. Le esecuzioni precedenti restano disponibili in *Esecuzioni*.

**Riprendi:** appena esistono workflow ed esecuzioni, sopra l’elenco compare l’area **Riprendi**: quante approvazioni ti aspettano (un clic apre la pagina *Approvazioni*), le **Esecuzioni recenti** con il loro stato e, con più di sei workflow, i **Modificati di recente**. Le parti senza contenuto vengono omesse; se non c’è nulla, manca l’intera area.

**Team:** i workflow con capacità o con un contratto di output portano il badge **Team**: un [orchestratore](/docs/verzweigungen#orchestrator) può delegare loro del lavoro. Si trovano sotto i tuoi workflow, nell’area apribile **Team**. Le copie di esempi orchestrati portano con sé i loro team.

**Galleria di esempi:** sotto l’elenco trovi gli esempi consigliati, il più semplice per primo e contrassegnato con **Inizia qui** finché non hai nessun workflow. Dopo, la galleria è un’area chiusa che ricorda se l’hai aperta. Nella galleria completa cerchi per nome, ambito, blocco o livello e filtri per categoria e per **Livello**; ricerca, filtri e un’anteprima aperta fanno parte dell’indirizzo, così *Indietro* riporta alla stessa selezione. Sotto **Cosa ti serve**, l’anteprima indica quale provider di IA e quali modelli usa la copia (e se è configurato), se un’esecuzione si ferma per un’approvazione, quali file di conoscenza e di esempio sono inclusi e se serve una connessione a un altro servizio. Maggiori dettagli in [Workflow di esempio](/docs/beispiele).

## Preferiti e tag {#favoriten-tags}
<!-- keywords: preferito, preferiti, stella, tag, etichetta, filtrare, ordinare -->

Workflow, modelli di agenti e strumenti si possono segnare come preferiti con la **stella**. I preferiti stanno sempre in cima agli elenchi. Con l’**icona dell’etichetta** aggiungi tag come “Cliente A” o “Bozza”; i tag esistenti vengono suggeriti.

Sopra gli elenchi filtri per **Solo preferiti** e per tag. Preferiti e tag sono salvati separatamente dagli oggetti: non modificano né workflow né agenti né strumenti, e compaiono anche nella [ricerca](/docs/start#suche). Le cartelle non esistono, di proposito.

## L'editor {#editor}
<!-- keywords: area di lavoro, canvas, palette, blocchi, ispettore, panoramica dell'esecuzione, zoom, minimappa, barra del titolo, altre azioni, team nella palette -->

L'editor ha quattro aree:

1. **Barra del titolo:** nome, *Architetto IA*, *API ed esportazione*, il menu **Altre azioni** (*Versioni* ed *Esporta come file*), *Salva* e *Avvia workflow*. Con modifiche non salvate si aggiunge *Scarta*. Nelle finestre strette le azioni secondarie compaiono solo come icone.
2. **Area di lavoro:** i nodi e i collegamenti. In alto a sinistra vedi se ci sono modifiche non salvate e quanti agenti e collegamenti ha il workflow. In basso a sinistra trovi lo zoom, *Mostra tutto*, *Disponi automaticamente* e anche *Annulla* e *Ripeti* (bloccati quando non c’è nulla da annullare o ripetere). In alto a destra una mappa d'insieme mostra l'intero workflow. Un workflow grande si apre a una dimensione leggibile sul suo nodo di avvio invece di essere rimpicciolito per entrare nello schermo.
3. **Blocchi (palette):** *Agente* (vuoto), *Descrivi un agente* (l'IA progetta la configurazione), *Avvio*, *Risultato*, fino a otto modelli dalla libreria degli agenti e, sotto, i **Team**, che puoi cercare e chiudere; ogni team mostra le sue capacità. Trascina un blocco sull'area di lavoro o fai clic su di esso. Un nuovo nodo compare nella parte visibile dell’area di lavoro e viene subito selezionato.
4. **Ispettore (a destra):** senza selezione mostra la verifica e le impostazioni del workflow, altrimenti la configurazione del nodo selezionato e, con più nodi selezionati, le azioni comuni (vedi [Comandi e scorciatoie da tastiera](/docs/workflows#bedienung)).

Sotto l'area di lavoro c'è la **Panoramica dell’esecuzione** con l'ultima esecuzione di questo workflow.

I blocchi, l'ispettore (con il titolo *Proprietà*) e la panoramica dell'esecuzione sono pannelli. Il pulsante nell'intestazione di un pannello lo nasconde o lo mostra; un pannello nascosto lascia una barra stretta, e i blocchi restano disponibili come icone. Il divisore tra un pannello e l'area di lavoro ne cambia la dimensione: trascinalo, oppure selezionalo con *Tab* e usa i tasti freccia (con *Maiusc* a passi più grandi). Un doppio clic sul divisore ripristina la dimensione predefinita. Quando l'ispettore è nascosto, la sua barra indica il nodo selezionato; un doppio clic su un nodo ne mostra le proprietà. Nodestro ricorda la disposizione in questo browser per tutti i workflow. Non fa parte del workflow: modificarla non crea mai modifiche non salvate né un passaggio di annullamento, e un workflow in esecuzione continua a girare.

## Tipi di nodi {#knoten}
<!-- keywords: avvio, risultato, output, agente, nodo, ingresso, uscita -->

| Nodo | Funzione | Ingressi | Uscite |
|---|---|---|---|
| **Avvio** | Fornisce l'input che inserisci all'avvio. Facoltativamente con un *Input proposto* o un [modulo di input](/docs/verzweigungen#eingabeformular). | nessuno | quanti vuoi |
| **Agente** | Chiama il suo modello di IA con la sua configurazione e restituisce un risultato (testo o JSON). | quanti vuoi | quanti vuoi |
| **Decisione** | Sceglie uno o più rami secondo regole fisse, senza richiesta all'IA. | uno o più | un'uscita per ramo |
| **Approvazione** | Ferma l'esecuzione finché una persona approva o rifiuta. | quanti vuoi | *Approvato*, *Rifiutato* |
| **Sotto-workflow** | Esegue un altro workflow salvato come un unico passaggio. | quanti vuoi | quanti vuoi |
| **Risultato** | Raccoglie i risultati degli agenti collegati come output del workflow, su richiesta anche come file. | quanti vuoi | nessuna |

I nodi di avvio e di risultato sono facoltativi: gli agenti senza predecessore ricevono automaticamente l'input dell'esecuzione e, senza nodo di risultato, l'output degli ultimi agenti vale come risultato (vedi [Il risultato di un'esecuzione](/docs/ausfuehrungen#ergebnis)). Decisione, approvazione e sotto-workflow si trovano nella tavolozza sotto *Controllare il flusso*; vedi [Ramificazioni e approvazioni](/docs/verzweigungen).

Ogni nodo ha un nome univoco. Se crei un secondo agente con lo stesso nome, Nodestro aggiunge un numero («Agente 2»). Il nome di un agente è anche il suo segnaposto nei compiti.

## Collegare agenti {#verbinden}
<!-- keywords: collegamento, arco, edge, porta, trascinare, cerchio, ciclo, eliminare -->

Trascina dal **punto destro** (uscita) di un nodo al **punto sinistro** (ingresso) di un altro. Un collegamento significa: il nodo di destinazione attende che il nodo di origine finisca e ne riceve il risultato.

Nodestro impedisce i collegamenti non validi e ne spiega il motivo:

- Un nodo non può essere collegato a se stesso.
- Il nodo di avvio non ha ingresso, il nodo di risultato non ha uscita.
- Lo stesso collegamento può esistere una sola volta.
- **Cicli solo come ciclo con limite:** i dati scorrono in una direzione. Un collegamento che torna a un predecessore è possibile solo da un ramo di una decisione o di un’approvazione e diventa allora un [ciclo](/docs/verzweigungen#schleifen) con limite; ogni altro viene rifiutato.

Per eliminare un collegamento, selezionalo e premi **Canc** o **Backspace**. Durante un'esecuzione si illuminano i collegamenti in cui stanno passando dati.

## Flusso dei dati tra agenti {#datenfluss}
<!-- keywords: flusso dei dati, input, trasmissione, predecessore, successore, json, più ingressi -->

Ecco come un agente riceve il suo compito:

1. Nodestro prende il **compito** dell'agente (campo *Compito* nell'ispettore, predefinito: `{{input}}`).
2. I segnaposto vengono sostituiti dai risultati dei **predecessori diretti** e dall'input dell'esecuzione.
3. I risultati dei predecessori che non compaiono nel compito vengono aggiunti sotto l'intestazione **`# Eingaben`** («input»), ciascuno con il nome del predecessore come sottotitolo. Così nulla va perso in silenzio.
4. Se dopo questo il compito è vuoto, l'agente riceve l'input dell'esecuzione.

**Cosa viene trasmesso:**

- Un risultato testuale viene trasmesso come testo.
- Un risultato strutturato viene trasmesso come JSON formattato.
- Il nodo di avvio trasmette l'input dell'esecuzione.
- Gli agenti senza predecessore ricevono l'input dell'esecuzione.

Un agente vede solo i risultati dei suoi predecessori **diretti**, non quelli dei nodi più indietro. Se gli serve l'input originale, usa `{{run.input}}`.

## Segnaposto nei compiti {#platzhalter}
<!-- keywords: segnaposto, placeholders, modello, {{input}}, {{run.input}}, variabile, compito -->

| Segnaposto | Viene sostituito da |
|---|---|
| `{{input}}` | il risultato dell'unico predecessore; con più predecessori tutti i risultati, ciascuno come sezione `## Nome`; senza predecessore l'input dell'esecuzione. Subito dopo un nodo di avvio con modulo compilato sono solo i valori del modulo; usa `{{run.input}}` per i valori del modulo e il testo aggiuntivo |
| `{{run.input}}` (o `{{workflow.input}}`) | l'input all'avvio del workflow, in qualsiasi punto del workflow |
| `{{Nome del predecessore}}` | il risultato esattamente di quel predecessore diretto |

Maiuscole e minuscole non contano nei segnaposto. Nell'ispettore, sotto il campo del compito, compaiono pulsanti per tutti i predecessori diretti; un clic inserisce il segnaposto corrispondente.

**Esempio:** un agente autore ha i predecessori *Pubblico* e *Scaletta*:

```
Scrivi l'articolo sul tema «{{run.input}}».

Pubblico:
{{Pubblico}}

Scaletta:
{{Scaletta}}
```

> **Errore frequente:** se rinomini un predecessore, i vecchi segnaposto non corrispondono più. Un segnaposto sconosciuto resta nel testo così com'è e il risultato del predecessore viene aggiunto sotto `# Eingaben`. Dopo aver rinominato, controlla i compiti dei successori.

## Anteprima dell’input {#eingabe-vorschau}
<!-- keywords: anteprima, input, contesto, vedere il prompt, verificare segnaposto, cosa riceve l’agente -->

La sezione **Anteprima dell’input** nell’ispettore di un agente mostra cosa riceverebbe l’agente alla prossima esecuzione, senza chiamare l’API:

- il **prompt di sistema** e il **compito** con i segnaposto compilati. Ogni parte inserita è evidenziata; passandoci sopra con il mouse vedi da dove proviene.
- quali **input** sono disponibili. I risultati dei predecessori provengono dall’ultima esecuzione di questo workflow. Se un predecessore non ha ancora un risultato, al suo posto compare un avviso in giallo invece di un valore inventato.
- i segnaposto che non corrispondono a nessun predecessore collegato.
- le altre parti del contesto: messaggi di esempio, strumenti, conoscenza, memoria, formato di output e controllo qualità.

Le credenziali nelle opzioni della richiesta non vengono mai mostrate. Per un’esecuzione conclusa, la scheda **Contesto** nei [dettagli](/docs/ausfuehrungen#details) mostra cosa ha ricevuto l’agente in quel momento.

## Esecuzione in parallelo {#parallel}
<!-- keywords: parallelo, contemporaneo, ramificazione, unire, ordine -->

Ogni nodo parte non appena **tutti** i suoi predecessori hanno finito. I nodi che non dipendono l'uno dall'altro vengono eseguiti contemporaneamente. Nell'esempio *Articolo per il blog*, *Pubblico* e *Scaletta* lavorano in parallelo; l'*Autore* parte solo quando entrambi hanno finito.

I rami paralleli riducono la durata, ma costano tanti token quanti agenti eseguiti uno dopo l'altro.

**Errori in un ramo:** se un agente fallisce, tutti i nodi che dipendono da esso vengono **saltati**. I rami indipendenti continuano. L'esecuzione termina allora con lo stato *Errore*.

## Impostazioni del workflow {#einstellungen}
<!-- keywords: nome, descrizione, ispettore, impostazioni del workflow -->

Fai clic su un punto vuoto dell'area di lavoro per vedere nell'ispettore le impostazioni del workflow: **Nome**, **Descrizione**, **Budget per esecuzione** e i **limiti** per i passaggi contemporanei e per la durata. Sotto compaiono i problemi che impediscono l'avvio e una breve panoramica dei comandi.

## Budget per esecuzione {#budget}
<!-- keywords: budget, limite di costo, limite, usd, dollaro, interruzione, budgetexceedederror, prenotazione, nessun massimo rigido -->

Il budget limita i **costi stimati** di un'esecuzione in dollari statunitensi, per tutti gli agenti e i controlli qualità.

- Se il workflow non ha un budget proprio, vale il **budget predefinito** delle impostazioni (inizialmente 2 USD).
- Se anche lì non c'è nulla, l'esecuzione è illimitata.
- **Prima** di ogni richiesta viene prenotato il suo costo massimo possibile (dimensione dell'input e output massimo che può produrre, alla tariffa più cara). Dopo la risposta, la prenotazione viene sostituita dal costo reale. Gli agenti in esecuzione contemporanea non possono quindi superare insieme il budget: se il resto non basta, una richiesta attende che un'altra sia terminata.
- Se il budget non basta nemmeno senza altre richieste, la richiesta non viene inviata e l'agente si interrompe (errore `BudgetExceededError`).
- Se una singola richiesta è più grande dell'intero budget, viene eseguita da sola nella modalità prezzi standard; nella modalità rigorosa viene rifiutata.

I costi sconosciuti **non** contano come 0. Se il costo massimo di una richiesta non può essere determinato in anticipo (nessun prezzo noto, immagini, file o strumenti del provider come la ricerca web), nella modalità standard viene eseguita senza limite superiore. L'esecuzione mostra allora accanto ai costi l'avviso **Nessun massimo rigido** con il numero di tali richieste. Nella modalità prezzi rigorosa le richieste senza prezzo noto non vengono inviate affatto.

## Limiti per esecuzione {#limits}
<!-- keywords: limiti, contemporanei, parallelo, limite di tempo, durata, timeout, run.time_limit, passaggi, run.step_limit -->

Tre limiti facoltativi valgono per ogni esecuzione del workflow. Vuoto significa nessun limite.

- **Numero massimo di passaggi contemporanei** (da 1 a 32): se sono pronti più passaggi, gli altri attendono un posto libero. Con 1 tutti i passaggi vengono eseguiti uno dopo l'altro.
- **Limite di tempo per esecuzione** (in minuti, al massimo 7 giorni): conta solo il tempo di esecuzione attivo. L'attesa di un'approvazione non conta. Allo scadere del tempo non parte nessun altro passaggio, agli agenti in corso viene chiesto di fermarsi e l'esecuzione fallisce con un errore che indica il limite di tempo.
- **Numero massimo di passaggi per esecuzione** (da 1 a 10.000): ogni nodo eseguito conta una volta, anche inizio e risultato, e ogni giro di un ciclo conta di nuovo. Se il passaggio successivo fosse di troppo, non parte e l'esecuzione fallisce con un errore che indica il limite. Questo protegge dai cicli che fanno più giri del previsto. Un'esecuzione ripresa conta anche i passaggi che riprende.

Una richiesta al modello o una chiamata a uno strumento già in corso viene comunque completata. L'esecuzione può quindi superare il limite di tempo per la durata di quella chiamata.

## Verifica prima dell'avvio {#pruefung}
<!-- keywords: verifica, validazione, problemi, avvio bloccato, errore, avviso -->

Nodestro verifica il workflow a ogni modifica (dopo una pausa di mezzo secondo), senza chiamare l’API e senza costi:

- **Struttura:** C’è almeno un agente? Il nodo iniziale non ha ingressi e il nodo del risultato non ha uscite? Non ci sono cicli, connessioni doppie o connessioni che non portano da nessuna parte? Il nodo del risultato ha un ingresso?
- **Agenti:** ogni configurazione viene verificata con le regole della libreria. I nodi con errori mostrano “1 problema” sull’area di lavoro, anche Avvio e Risultato; gli avvisi compaiono come “1 avviso” con un colore e un’icona propri.
- **Connessioni e segnaposto:** segnaposto che non corrispondono a nessun predecessore collegato, agenti senza ingresso, risultati che non arrivano da nessuna parte e nomi di agenti doppi.
- **Impostazioni:** provider non configurati, file di conoscenza o di avvio eliminati, modelli senza prezzo noto e un budget pari a 0.

I risultati compaiono in cima all’ispettore del workflow (clic su un punto vuoto dell’area di lavoro), divisi in **errori** e **avvisi**. Un clic su un messaggio seleziona l’agente interessato o evidenzia la connessione interessata; le connessioni con errori appaiono rosse e tratteggiate. Se selezioni un nodo, i suoi messaggi compaiono sopra le sue impostazioni. Finché un provider non è configurato, i nodi non mostrano «Pronto».

Finché ci sono **errori**, **Avvia workflow** è bloccato. Il motivo compare subito accanto al pulsante; se i problemi sono più d’uno, il primo («3 problemi impediscono l’avvio. Per primo: …»). **Mostra** seleziona il nodo o la connessione interessati e apre l’ispettore; se manca un provider di IA, **Apri impostazioni** porta direttamente lì. Il pulsante bloccato resta raggiungibile da tastiera, e i lettori di schermo leggono il motivo. Gli **avvisi** non bloccano l’avvio; la finestra di avvio li mostra di nuovo.

## Avviare un'esecuzione {#starten}
<!-- keywords: avviare, eseguire, run, finestra di avvio, input, allegare file, compito precompilato, altri file -->

**Avvia workflow** apre la finestra di avvio:

- **Input:** il testo che tutti gli agenti ricevono all'inizio. È già compilato con l'*Input proposto* del nodo di avvio. Se il workflow ha un [modulo di input](/docs/verzweigungen#eingabeformular), il campo si trova sotto i campi del modulo; se è precompilato si chiama **Compito (esempio precompilato)**: sostituisci l’esempio con la tua richiesta.
- **Allega file (facoltativo):** file di conoscenza inseriti direttamente nel contesto dei primi agenti, solo per questa esecuzione (vedi [Allegare file all'avvio](/docs/wissen#start-dateien)). Se il modulo ha campi file propri, quest’area è chiusa sotto **Allega altri file (facoltativo)**.
- **Budget:** la finestra mostra quale budget vale.

Con **Avvia**, Nodestro salva il workflow e inizia l’esecuzione. L’esecuzione usa lo stato del workflow al momento dell’avvio; le modifiche successive valgono solo dall’esecuzione seguente. Se il provider di un modello non è configurato, la finestra lo segnala. Se l’esecuzione non può ancora partire, il motivo compare sotto **Avvia**: ci sono caricamenti di file in corso, oppure prima vanno corretti degli errori (*Prima risolvi i problemi qui sopra.*).

## Comandi e scorciatoie da tastiera {#bedienung}
<!-- keywords: scorciatoie da tastiera, shortcuts, ctrl+s, ctrl+z, annulla, ripeti, canc, duplicare, disponi automaticamente -->

<!-- widget: shortcuts -->

Altri suggerimenti:

- **Disponi automaticamente** dispone i nodi in colonne secondo la loro posizione nel flusso dei dati.
- **Mostra tutto** regola lo zoom in modo che sia visibile l'intero workflow.
- **Selezionare più nodi:** Maiusc-clic o Ctrl-clic aggiunge nodi alla selezione; Maiusc e trascinamento sull’area di lavoro seleziona con un riquadro. Trascinare sposta tutti i nodi selezionati, **Canc** li elimina tutti, **Ctrl+D** li duplica tutti. L’ispettore offre allora *Duplica tutti*, *Elimina nodi* e *Annulla selezione*.
- **Annullare un’eliminazione:** dopo aver eliminato dei nodi compare un messaggio con **Annulla**.
- **Tracciare collegamenti:** mentre trascini, l’area di lavoro mostra già dove un collegamento non è consentito; se lo rilasci lì, un messaggio ne spiega il motivo.
- Se lasci l'editor con modifiche non salvate, Nodestro chiede se salvarle, scartarle o **Continua a modificare**.
- Annulla ricorda fino a 80 passaggi. Spostare un nodo è un passaggio, così come scrivere in un campo finché non passi a un altro campo o nodo. Nome, descrizione e budget del workflow sono inclusi. Se annulli tutto fino allo stato salvato, non restano modifiche non salvate.

- **Eliminare connessioni:** fai clic su una connessione. Viene evidenziata, e **Canc** o **Backspace** la elimina. Mentre scrivi in un campo di input, questi tasti cancellano solo testo. Anche l’eliminazione di una connessione si può annullare.
- Nelle finestre strette (meno di 1100 pixel di larghezza) la barra **Blocchi** è inizialmente chiusa; poi vale la disposizione che hai scelto per ultima.

## Salvare e scartare {#speichern}
<!-- keywords: salvare, scartare, non salvato, scartare le modifiche, ripristinare -->

**Salva** (o **Ctrl+S**) conserva lo stato attuale e crea una nuova [versione](/docs/workflows#versionen). Finché ci sono modifiche non salvate, la barra del titolo mostra **Scarta**.

**Scarta** butta via tutte le modifiche non salvate, inclusa la cronologia di annulla/ripeti, e ricarica l’ultimo stato salvato. Lo stesso vale se esci dall’editor e scegli **Scarta** nella finestra di dialogo: alla prossima apertura compare esattamente il workflow salvato.

**Modificato altrove:** prima di salvare, Nodestro controlla se nel frattempo il workflow è stato salvato altrove, in un’altra scheda o da un’altra persona. In quel caso la finestra **Modificato altrove** ti chiede cosa fare, invece di sostituire in silenzio l’altra modifica:

- **Carica versione salvata:** l’editor mostra lo stato salvato; le tue modifiche non salvate qui vanno perse.
- **Tieni la mia come copia:** il tuo stato diventa un nuovo workflow «… (mia copia)», lo stato salvato resta com’è.
- **Salva comunque la mia:** il tuo stato sostituisce l’altra modifica.
- **Continua a modificare:** non viene salvato nulla.

Niente va perso per sempre: ogni salvataggio resta nelle [Versioni](/docs/workflows#versionen).

## Versioni {#versionen}
<!-- keywords: versione, versioni, cronologia, storico, ripristinare, tornare indietro, stato precedente -->

Ogni salvataggio che modifica qualcosa viene conservato come **versione** numerata con data e ora. **Versioni**, nel menu **Altre azioni** della barra del titolo, apre la cronologia:

- **Salva come versione** salva le modifiche attuali con una descrizione facoltativa (“prima di rifare la ricerca”).
- L’icona della matita aggiunge o modifica la descrizione di una versione.
- **Differenze** mostra cosa cambierebbe rispetto allo stato nell’editor: agenti, connessioni, nome e impostazioni.
- **Ripristina** riporta il workflow a quella versione e salva il risultato come **nuova versione**. Nessuna versione viene sovrascritta o eliminata. Se ci sono modifiche non salvate, scegli **Prima salva, poi ripristina** (le modifiche diventano prima una versione a sé) oppure **Ripristina senza salvare**.

Le versioni sono indipendenti da annulla/ripeti, che vale solo all’interno di una sessione nell’editor. Le esecuzioni usano sempre lo stato al momento dell’avvio. Se un workflow viene eliminato, vengono eliminate anche le sue versioni. In cima alla cronologia compare il **risultato dei test** della versione salvata per ogni serie di test del workflow (come durante la [pubblicazione](/docs/api-und-export#veroeffentlichen)).

## Importare ed esportare {#import-export}
<!-- keywords: esportare, importare, json, file, condividere, backup, .nodestro.json, non è un workflow, file non valido -->

- **Esporta come file** (nell'editor, sotto **Altre azioni**) salva il workflow come `<Nome>.nodestro.json`: tutti i nodi, collegamenti, posizioni e impostazioni degli agenti, oltre al budget.
- **Importa** (nella pagina *Workflow*) carica un file di questo tipo come **nuova copia** con un nuovo ID. I workflow esistenti non vengono mai sovrascritti. Se il file non ha un nome, il workflow prende il nome del file.

Nodestro controlla il file prima di creare qualcosa. Se non è l’esportazione di un workflow (per esempio un altro file JSON, un file senza passi o con collegamenti rotti), non viene importato nulla e il messaggio ne spiega il motivo, per esempio *Questo file non è un workflow Nodestro: non ha passi ("nodes").*

**Non sono inclusi** file di conoscenza, spazi di memoria e strumenti propri; il file fa solo riferimento ai loro ID e nomi. Su un altro computer devono esistere lì, altrimenti la verifica segnala per esempio «Strumenti sconosciuti».

Esportare un workflow ed esportare una traccia sono cose diverse: un workflow descrive il processo, una traccia un'esecuzione concreta con i risultati (vedi [Importare tracce](/docs/ausfuehrungen#trace-import)).

## Esempi {#beispiele}
<!-- keywords: esempio, modello, schema, pipeline, ricetta, caso d'uso -->

**Lineare: ricerca → analisi → revisione (esempio «Analisi finanziaria»)**

1. *Research Agent* (Sonnet, impegno basso) estrae tutti i numeri con periodo e unità.
2. *Analysis Agent* riceve lo strumento `calculator` e calcola con precisione crescita e margini. Compito: `Calcola gli indicatori principali da questi risultati della ricerca: {{Research Agent}}`.
3. *Review Agent* verifica l'analisi e restituisce un **risultato strutturato** con `summary`, `key_figures`, `issues` e `approved`.

**Ramificare e unire (esempio «Articolo per il blog»)**

1. Avvio con il tema.
2. *Pubblico* e *Scaletta* vengono eseguiti in parallelo.
3. *Autore* unisce entrambi (`{{Pubblico}}`, `{{Scaletta}}`) e ha un **controllo qualità** con i criteri «segue la scaletta» e «risponde alle domande del pubblico».

**Classificare e rispondere**

1. *Classificazione* (Haiku, output strutturato con `category`, `urgency` come numero intero e `reason`).
2. *Risposta* (Sonnet) riceve la classificazione come JSON e la richiesta originale tramite `{{run.input}}`.

## Limitazioni {#grenzen}
<!-- keywords: limiti, limitazioni, cicli, condizioni, if, loop, ramificazione -->

- **Cicli solo con limite:** un workflow è un grafo orientato; i passi si ripetono solo tramite [cicli](/docs/verzweigungen#schleifen) di al massimo 20 giri. Fuori dai cicli, ogni nodo viene eseguito al massimo una volta per esecuzione. Le condizioni si costruiscono con le [decisioni](/docs/verzweigungen#entscheidung); i nodi sui rami non scelti vengono saltati.
- **Continuare invece di ripetere:** un'esecuzione non riuscita o annullata può essere [continuata](/docs/verzweigungen#fortsetzen); si crea così una nuova esecuzione collegata.
- **Un'esecuzione alla volta per workflow nell'editor:** finché un'esecuzione è attiva, *Avvia workflow* è bloccato. Per avviare molte esecuzioni insieme usa un'[esecuzione in serie](/docs/automatisierung#stapel).
- **Stato al momento dell'avvio:** le modifiche durante un'esecuzione valgono solo dall'esecuzione successiva.

# Esecuzioni

Ogni esecuzione di un workflow viene registrata per intero: input, risultati, compiti, chiamate agli strumenti, ragionamento, memoria, errori, tempi, token e costi. Questo capitolo spiega le viste, gli stati, l'esportazione e l'importazione delle tracce e come interpretare gli errori.

## Panoramica {#ueberblick}
<!-- keywords: esecuzioni, runs, cronologia, registro, traccia, trace -->

Le esecuzioni si vedono in due punti:

- **Nell'editor**, nella *Panoramica dell'esecuzione* sotto l'area di lavoro: l'ultima esecuzione di questo workflow, in diretta mentre è in corso.
- Nella pagina **Esecuzioni**: tutte le esecuzioni di tutti i workflow, con vista di dettaglio.

Le esecuzioni restano anche se modifichi o elimini il workflow; ogni esecuzione salva il workflow com'era all'avvio.

## Seguire in diretta {#live}
<!-- keywords: diretta, streaming, seguire, panoramica dell'esecuzione, avanzamento, tempo reale -->

Durante un'esecuzione, la **Panoramica dell'esecuzione** mostra:

- in alto il numero di agenti, richieste API, token e i costi stimati, aggiornati di continuo,
- a sinistra tutti gli agenti con il loro stato; un clic ne mostra i dettagli a destra, *Risultato complessivo* mostra il risultato del workflow,
- a destra il testo che l'agente selezionato sta scrivendo, le sue chiamate agli strumenti e (se attivo) il suo ragionamento.

Sull'area di lavoro ogni agente mostra il suo stato e, dopo l'esecuzione, anche token e costi. I collegamenti attraverso cui sono passati i dati sono evidenziati.

## L'elenco delle esecuzioni {#liste}
<!-- keywords: elenco, filtro, filtro stato, filtro workflow, eliminare, origine -->

La pagina **Esecuzioni** elenca le esecuzioni, dalla più recente, con workflow, stato, ora di avvio, durata, richieste, token e costi. Sotto il nome del workflow compare l'input o il messaggio di errore.

- **Filtri:** per workflow, per stato e per origine (*Esecuzioni proprie* o *Tracce importate*).
- **Eliminare:** simbolo del cestino; le esecuzioni in corso non si possono eliminare.
- **Importa traccia:** vedi [Importare tracce](/docs/ausfuehrungen#trace-import).

L'elenco si aggiorna ogni cinque secondi.

## La vista di dettaglio {#details}
<!-- keywords: dettagli, vista di dettaglio, andamento, cascata, timeline, schede, risultato, compito, ragionamento -->

Un clic su un'esecuzione apre la vista di dettaglio:

1. **Dati principali:** stato con durata totale, richieste API, token (suddivisi in input, output, cache e ragionamento) e costi stimati.
2. **Riepilogo dell'esecuzione:** quanti passi sono riusciti e quanti sono stati saltati, quale percorso hanno preso le decisioni, come sono state decise le approvazioni, quali strumenti sono stati chiamati e quante volte (con gli errori) e a quale passo l'esecuzione non è riuscita, con *Vai al passo*. Si basa solo sui dati salvati dell'esecuzione, senza chiamare un modello; ciò che l'esecuzione non ha registrato compare come *non registrato*.
3. **Input e risultato** del workflow affiancati.
4. **Andamento:** una barra temporale per ogni agente, nell'ordine di avvio. Ogni barra mostra quando l'agente è stato eseguito; le barre sovrapposte sono state eseguite in parallelo. Accanto ci sono durata, token e numero di chiamate agli strumenti.
5. **Dettagli dell'agente selezionato:** durata, ora di inizio e fine, token, richieste e costi, un eventuale errore, l'esito del controllo qualità e le schede:

| Scheda | Contenuto |
|---|---|
| **Risultato** | L'output dell'agente, come Markdown o JSON formattato. |
| **Compito** | Il compito così come è arrivato all'agente dopo la sostituzione dei segnaposto. Ideale per trovare problemi nel flusso dei dati. |
| **Strumenti** | Ogni chiamata a uno strumento con input, risultato, momento, durata ed esito. |
| **Ragionamento** | Le riflessioni del modello (solo se *Mostra il ragionamento* era attivo). |
| **Memoria** | Le note di un agente con memoria *Per esecuzione*. |

**Apri nell'editor** porta al workflow; **Annulla** interrompe un'esecuzione in corso.

La scheda **Contesto** mostra cosa ha ricevuto l’agente in questa esecuzione: prompt di sistema, compito con gli input evidenziati, messaggi di esempio, strumenti, conoscenza, memoria, formato di output e controllo qualità, sempre con la configurazione al momento dell’avvio. Le credenziali non vengono mai mostrate.

## Stato {#status}
<!-- keywords: stato, completato, errore, saltato, annullato, in attesa, in corso, in coda -->

| Stato | Significato |
|---|---|
| **In attesa** | Il nodo attende che tutti i predecessori abbiano finito. |
| **In coda** | L'esecuzione è stata creata e sta per partire. |
| **In corso** | In esecuzione in questo momento. |
| **Completato** | Completato con successo. |
| **Errore** | Non riuscito; il messaggio è nei dettagli. Un'esecuzione è in *Errore* non appena un nodo fallisce. |
| **Saltato** | Il nodo non è stato eseguito perché il suo ramo non è stato scelto. Non è un errore. |
| **Bloccato** | Il nodo non è stato eseguito perché un predecessore non è riuscito o è stato annullato. |
| **In attesa di approvazione** | Un'[approvazione](/docs/verzweigungen#freigabe) attende la decisione di una persona. |
| **In pausa** | L'esecuzione attende un'approvazione e prosegue dopo la decisione. |
| **Annullato** | Fermato con *Annulla*, rifiutato, oppure una traccia esportata prima di essere completa. |

Un'esecuzione non riuscita o annullata può essere [continuata](/docs/verzweigungen#fortsetzen). Le esecuzioni da pianificazioni, serie, serie di test e sotto-workflow mostrano la loro origine nell'elenco e nei dettagli.

## Il risultato di un'esecuzione {#ergebnis}
<!-- keywords: risultato, output, risultato complessivo, output del workflow, destinazione -->

- Se ci sono **nodi di risultato**, il loro contenuto è il risultato. Un nodo di risultato con un predecessore ne adotta l'output; con più predecessori, un oggetto con una voce per predecessore.
- Se **non** c'è un nodo di risultato, gli agenti senza successori valgono come risultato.
- Con più nodi di risultato (o ultimi agenti), il risultato è un oggetto con una voce per nodo, chiamata come il nodo.

## Annullare esecuzioni {#abbrechen}
<!-- keywords: annullare, fermare, cancel, terminare -->

**Annulla** (nella panoramica dell'esecuzione o nella vista di dettaglio) ferma l'esecuzione. Gli agenti in corso si fermano al passo successivo (prossimo blocco di testo, prossima richiesta o prossima chiamata a uno strumento); gli agenti non ancora avviati non vengono più eseguiti. I token consumati fino a quel momento vengono addebitati e mostrati.

## Esportare una traccia {#trace-export}
<!-- keywords: esportare traccia, esporta, json, run json, condividere, archiviare, ripulire, anonimizzare, privacy, dati personali -->

**Esporta traccia** nella vista di dettaglio salva un’esecuzione come file JSON: il workflow al momento dell’avvio, input, stato, risultato e, per ogni agente, compito, risultato, testo, ragionamento, chiamate agli strumenti con input e output, errori, controllo qualità, memoria, timestamp, token e costo. La finestra offre due tipi:

- **Completa:** tutto così come è stato salvato. Condividi il file solo se non contiene nulla di riservato.
- **Ripulita per la condivisione:** chiavi API, token, password e chiavi private vengono sempre sostituiti. A scelta Nodestro sostituisce anche i **dati personali** (indirizzi e-mail, numeri di telefono, IBAN, numeri di carta, indirizzi IP) e rimuove interi **contenuti** (input, prompt, output, dati degli strumenti, memoria); restano allora flusso, stati, modelli, tempi e token.

Le parti sostituite ricevono segnaposto come `[EMAIL_1]`; valori uguali ricevono lo stesso segnaposto. Viene ripulita solo la copia scaricata; l’esecuzione salvata resta invariata. Il riconoscimento funziona con schemi e **non garantisce di trovare tutto**, per esempio nomi o indirizzi. Guarda il file prima di condividerlo.

I risultati degli strumenti sono accorciati a 20.000 caratteri per chiamata.

## Importare tracce {#trace-import}
<!-- keywords: importa traccia, importare, json, aprire, vedere, duplicato, ripristinare, trace -->

**Importa traccia** nella pagina *Esecuzioni* riapre file di traccia esportati, anche più di uno alla volta e anche su un altro computer.

Come funziona l'importazione:

- La traccia compare come esecuzione a sé con l'indicazione **Importata** e si apre nella solita vista di dettaglio: risultati, agenti, chiamate agli strumenti, input e output, errori, orari, controlli qualità, token e costi, nella misura in cui la traccia li contiene.
- **Non viene eseguito nulla.** Non c’è alcuna richiesta a un provider di IA e nessun costo.
- Le tracce importate vengono **salvate in modo permanente** e, come ogni esecuzione, si possono riaprire, filtrare, esportare ed eliminare.
- **Le esecuzioni esistenti non vengono mai sovrascritte:** ogni importazione riceve un nuovo ID; l'ID originale è indicato nella vista di dettaglio.
- **Duplicati:** se la stessa esecuzione esiste già (l'originale o un'importazione precedente dello stesso file), Nodestro non crea una copia, ma apre l'esecuzione esistente e lo segnala.
- **Tracce incomplete:** se un'esecuzione è stata esportata mentre era ancora in corso, compare come *Annullato* con un avviso.
- **Utilizzo:** le esecuzioni importate non contano nelle statistiche di utilizzo, perché i loro costi non sono nati in questa installazione.
- **Apri nell'editor** manca nelle tracce importate, perché il workflow corrispondente di solito qui non esiste. Il workflow stesso si trasferisce con l'[esportazione del workflow](/docs/workflows#import-export).

I **file non validi** vengono rifiutati con un messaggio chiaro, senza salvare nulla: non è JSON, è un'esportazione di workflow invece di una traccia, mancano campi obbligatori o ci sono valori danneggiati. Una traccia può pesare al massimo 50 MB.

## Confrontare esecuzioni {#vergleich}
<!-- keywords: confrontare, confronto, differenza, diff, affiancare, due esecuzioni -->

Spunta due esecuzioni nell’elenco delle esecuzioni con la casella all’inizio della riga e fai clic su **Confronta**. La vista di confronto le affianca:

- **Indicatori:** stato, durata, richieste, token di input e di output, costo, chiamate agli strumenti e agenti non riusciti. Le righe diverse sono evidenziate, con la differenza da A a B.
- **Risultato finale:** come confronto riga per riga (solo in A, solo in B) oppure affiancato.
- **Agenti:** per ogni agente modello, stato, durata, token, costo, strumenti, errori e valutazione. I badge indicano cosa è diverso; output e commenti della valutazione si possono confrontare direttamente.

Vengono confrontati solo dati salvati; nulla viene rieseguito. Se le esecuzioni appartengono allo stesso workflow, gli agenti vengono abbinati per nodo, altrimenti per nome. Se il workflow è cambiato tra le esecuzioni, la vista lo segnala. Si possono confrontare anche le tracce importate.

## Interpretare gli errori {#fehler}
<!-- keywords: errori, messaggio di errore, errore, interpretare, causa, soluzione, refusalerror, budgetexceedederror -->

Gli errori compaiono nell'esecuzione a livello dell'esecuzione (riepilogo «Non riusciti: …») e dell'agente interessato (messaggio rosso). Il messaggio compare nella lingua dell'interfaccia e di solito indica il tipo di errore. In **Dettagli tecnici** trovi il testo originale del server o dell'API, per esempio da inoltrare in una segnalazione di errore.

| Messaggio | Significato | Soluzione |
|---|---|---|
| `BudgetExceededError` | Il budget dell'esecuzione è esaurito. | Aumenta il budget nel workflow o nelle impostazioni, oppure scegli modelli più economici. |
| `RefusalError` | Il modello ha rifiutato la richiesta. | Riformula il compito, imposta modelli di riserva o scegli *Accetta comunque il testo della risposta*. |
| `MaxToolRoundsError` | Più turni di strumenti di quelli consentiti. | Aumenta *Turni di strumenti max.* o precisa il compito. |
| `IncompleteResponseError` | La risposta ha raggiunto *Token max.* o la finestra di contesto. | Aumenta *Token max.*, riduci la conoscenza. |
| `ToolExecutionError` | Uno strumento è fallito in modo imprevisto e *Restituisci al modello gli errori degli strumenti* era disattivato. | Prova lo strumento in *Prova*, attiva l'opzione. |
| *Il provider di IA ha segnalato un errore …* | Il provider ha segnalato un errore (per esempio chiave non valida, sovraccarico, id di modello sconosciuto, opzioni di richiesta non valide). | Controlla la chiave e l’id del modello, riprova più tardi, controlla le opzioni di richiesta. |
| *Saltato perché un nodo precedente non è riuscito.* | Conseguenza di un errore precedente. | Correggi il primo agente non riuscito. |
| *L’esecuzione è stata annullata.* | Qualcuno ha scelto *Annulla*. | – |

Altri messaggi e soluzioni in [Errori frequenti](/docs/faq#haeufige-fehler).

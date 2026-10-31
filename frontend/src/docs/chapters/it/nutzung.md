# Utilizzo e costi

Nodestro conta i token di ogni richiesta a un provider di IA e stima i costi. Questo capitolo spiega i tipi di token, come si calcolano i costi, come risparmia la cache e cosa mostra la pagina *Utilizzo*.

## Panoramica {#ueberblick}
<!-- keywords: utilizzo, costi, token, statistiche, consumo, fatturazione -->

Token e costi si vedono in quattro punti:

- su ogni nodo agente dopo un'esecuzione,
- nella *Panoramica dell'esecuzione* dell'editor (in diretta),
- nella vista di dettaglio di ogni esecuzione, in totale e per agente,
- nella pagina **Utilizzo**, riassunti per giorno, workflow e modello.

Tutti i costi sono **stime a prezzo di listino**; fa fede la fatturazione di ciascun provider. Quali prezzi valgono lo vedi in [Prezzi dei modelli](/docs/nutzung#preise). Se per un modello non è noto alcun prezzo, i costi restano **sconosciuti** (mostrati come «–»): non contano mai come 0, e un budget limita solo i costi con prezzo noto. Gli importi sono sempre in dollari statunitensi, con fino a sei decimali e nel formato numerico della lingua scelta (per esempio «0,0042 USD» in italiano, «$0.0042» in inglese).

## Tipi di token {#tokens}
<!-- keywords: token, input, output, cache read, cache write, token di ragionamento, richieste, requests -->

| Tipo | Significato |
|---|---|
| **Input** | Tutto ciò che va al modello e non proviene dalla cache: prompt di sistema, compito, conversazione, risultati degli strumenti, conoscenza. |
| **Output** | Tutto ciò che il modello scrive, **ragionamento compreso**, e le chiamate agli strumenti. |
| **Dalla cache** | Input letto dalla cache del prompt; molto più economico. |
| **Nella cache** | Input scritto nella cache; un po' più costoso dell'input normale. |
| **Ragionamento** | La parte dell'output dedicata al ragionamento (se l'API la riporta). |

**Richieste API** conta le singole chiamate all'API. Un agente ha bisogno di almeno una richiesta, più una per ogni turno di strumenti, e il controllo qualità ne richiede altre per ogni verifica e revisione. Passa il mouse sul numero di token di un agente per vedere il dettaglio.

## Come si calcolano i costi {#kosten}
<!-- keywords: calcolare i costi, prezzo, listino, stima, mtok, costi della ricerca web, prezzo sconosciuto -->

Per ogni richiesta Nodestro moltiplica i tipi di token per i prezzi del modello (in dollari statunitensi per milione di token) e aggiunge le tariffe delle ricerche web (10 $ ogni 1.000 ricerche). La somma di tutte le richieste dà i costi dell’agente e dell’esecuzione; se una parte è sconosciuta, lo è anche la somma. Il calcolo lo esegue la libreria Orkexa, con il listino che Nodestro mantiene aggiornato. I prezzi dei modelli del catalogo:

<!-- widget: models -->

Se un'esecuzione mostra **«–»** invece di un importo, almeno una richiesta non è stata prezzata (per esempio un modello sconosciuto). Nodestro preferisce allora non mostrare alcun importo piuttosto che uno troppo basso. Se è sconosciuta solo una parte, la pagina *Utilizzo* mostra «almeno …»: la somma dei costi noti è allora un limite inferiore. Per il budget conta solo la parte nota; in modalità prezzi rigorosa queste richieste non vengono nemmeno inviate.

## Cache {#caching}
<!-- keywords: cache, caching, prompt caching, risparmiare, ttl, 5 minuti, 1 ora, cache write -->

Con la **cache del prompt** (per agente in *Avanzate*, attiva per impostazione predefinita) l'API memorizza l'inizio invariato di una richiesta. Le richieste successive con lo stesso inizio lo leggono dalla cache:

- **Leggere** dalla cache costa, a seconda del modello, solo circa dal 2,5 al 10% del normale prezzo di input.
- **Scrivere** nella cache da 5 minuti costa 1,25 volte il prezzo di input, nella cache da 1 ora 2 volte.

La cache conviene soprattutto quando un agente fa **più richieste** (turni di strumenti, controllo qualità, memoria) o quando lo stesso workflow viene eseguito **più volte di seguito**. La conoscenza in modalità *Nel contesto* si trova all'inizio del prompt e quindi ne trae il massimo vantaggio.

**Durata della cache:** la cache da 5 minuti si prolunga a ogni utilizzo. Scegli *1 ora* solo se tra le richieste passano spesso più di cinque minuti.

Quanto proveniva dalla cache si vede nel dettaglio dei token («dalla cache», «nella cache»).

## La pagina Utilizzo {#statistik}
<!-- keywords: pagina utilizzo, statistiche, grafico, al giorno, per workflow, per modello, periodo, test agente, assistente, origine -->

Scegli il periodo in alto (7, 30 o 90 giorni). La pagina mostra:

- **Indicatori:** esecuzioni, altre operazioni di IA, richieste API, token (input e output) e costo stimato.
- **Costo al giorno** come grafico a barre; passa sopra una barra per vedere costo e numero di esecuzioni.
- **Per workflow** e **Per modello** come tabelle con numero, token, costo e quota sul costo totale.
- **Per origine:** esecuzioni dei workflow, test degli agenti, progettazione di agenti con l’IA, assistente memoria e creazione di strumenti con l’IA.
- **Ultime operazioni di IA fuori dai workflow** con momento, modello, token e costo.

Le esecuzioni vengono attribuite in base al **momento dell’avvio**. In *Per modello* ogni agente conta per il modello della sua configurazione; il costo del suo controllo qualità è incluso. Le altre operazioni di IA contano per il modello che hanno usato. Ogni richiesta viene contata esattamente una volta: le esecuzioni dei workflow dalle esecuzioni salvate, tutto il resto da un registro a parte. Le **tracce importate** non sono incluse.

## Prezzi dei modelli {#preise}
<!-- keywords: prezzi dei modelli, listino, aggiornare prezzi, sincronizzazione, litellm, vecchio, prezzo individuale, prezzo contrattuale, revisione, modifica di prezzo -->

**Impostazioni → Prezzi dei modelli** elenca ogni prezzo con stato, qualità, fonte e data dell’ultima verifica. I prezzi provengono da tre fonti, in quest’ordine:

1. i prezzi verificati della libreria Orkexa,
2. un file di prezzi revisionato indicato dal gestore (`NODESTRO_PRICE_SNAPSHOT_FILE`),
3. il listino pubblico del progetto LiteLLM (disattivabile con `NODESTRO_PRICE_LITELLM=off`).

Nodestro verifica i prezzi ogni 24 ore e quando premi *Verifica i prezzi ora*. Se un prezzo cambia più del 20 % senza conferma da una fonte ufficiale, il nuovo listino non viene applicato ma attende la tua **revisione**: *Applica* o *Rifiuta*. I prezzi non validi (negativi, implausibilmente alti, valuta errata) non vengono mai applicati.

| Stato | Significato |
|---|---|
| **Attuale** | Verificato di recente. |
| **Non verificati da un po’** / **Non aggiornati** | Non verificati da più di 48 ore o 7 giorni; i costi vengono ancora calcolati, ma segnalati. |
| **In attesa di revisione** | Una modifica importante attende la tua decisione; fino ad allora vale il prezzo precedente. |
| **Individuale** | Un prezzo che hai impostato tu. |
| **Sconosciuto** | Nessun prezzo noto; i costi restano sconosciuti. |

I **prezzi individuali**, ad esempio prezzi contrattuali o correzioni, si impostano con la matita nella tabella. Hanno la precedenza sul prezzo di riferimento; con *Torna al prezzo di riferimento* vale di nuovo il listino. Ogni modifica è nella **cronologia delle modifiche**, e ogni utilizzo salvato ricorda con quale versione e fonte di prezzo è stato calcolato (in fondo alla pagina *Utilizzo*).

**Senza internet** restano in uso gli ultimi prezzi validi; passano soltanto agli stati *Non verificati da un po’* e *Non aggiornati*. Con `NODESTRO_PRICE_SYNC=off` un prezzo cambia solo quando avvii tu la verifica.

**Su un server** il gestore cura i prezzi di riferimento: un worker li verifica, e il gestore decide le revisioni con `nodestro-server pricing approve` o `reject`. Gli spazi di lavoro vedono i prezzi di riferimento in sola lettura e possono impostare propri prezzi individuali.

## Modalità prezzi {#preismodus}
<!-- keywords: modalità prezzi, rigorosa, standard, rifiutare prezzo sconosciuto, prezzo vecchio -->

La **modalità prezzi** in *Impostazioni → Prezzi dei modelli* decide cosa succede con prezzi mancanti o vecchi:

- **Standard:** le richieste vengono eseguite; i loro costi appaiono come sconosciuti o come limite inferiore, e i prezzi vecchi vengono segnalati.
- **Rigorosa:** una richiesta a un modello senza prezzo noto, o con un prezzo non verificato da più di 7 giorni, viene rifiutata prima che costi qualcosa. Così un budget regge anche quando manca un prezzo.

## Confronto con le fatture dei fornitori {#abgleich}
<!-- keywords: riconciliazione, fattura, fatturazione, openai costs, anthropic cost report, chiave di amministrazione, scostamento -->

Facoltativamente, Nodestro confronta le sue stime con quanto **OpenAI** e **Anthropic** hanno effettivamente fatturato, per giorno e modello (*Impostazioni → Confronta con le fatture dei fornitori*). Serve una **chiave di amministrazione** dell’API di fatturazione del fornitore, separata dalle normali chiavi API. Il confronto legge soltanto.

- **Desktop:** le chiavi di amministrazione non vengono salvate. Imposta `NODESTRO_OPENAI_ADMIN_KEY` o `NODESTRO_ANTHROPIC_ADMIN_KEY`, oppure inserisci una chiave solo per un confronto.
- **Server:** la chiave viene salvata cifrata e non viene più mostrata.

Una riga **si discosta** quando la differenza supera il 5 % **e** 1 dollaro USA (entrambe le soglie sono regolabili). Gli ultimi giorni risultano *non ancora definitivi*, perché i fornitori completano le fatture in seguito. I giorni in cui Nodestro stesso non conosce alcuni costi appaiono come *Stima incompleta*.

## Risparmiare {#sparen}
<!-- keywords: risparmiare, più economico, ridurre i costi, ottimizzare, consigli -->

- **Il modello adatto più piccolo:** Haiku per i passaggi semplici, Sonnet per la maggior parte, Opus solo dove serve.
- **Ridurre l'impegno:** *Basso* o *Medio* basta per molti compiti e fa risparmiare token di ragionamento.
- **Lasciare attiva la cache.**
- **Usare la conoscenza in modo mirato:** *Ricerca* o *Su richiesta* invece di file grandi *Nel contesto*.
- **Limitare token e turni di strumenti**, perché un agente non si perda.
- **Impostare un budget**, perché un'esecuzione non costi mai più del previsto.
- **Usare il controllo qualità in modo mirato:** ogni verifica e revisione costa in più.

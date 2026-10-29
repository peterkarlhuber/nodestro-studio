# Utilizzo e costi

Nodestro conta i token di ogni richiesta a un provider di IA e stima i costi. Questo capitolo spiega i tipi di token, come si calcolano i costi, come risparmia la cache e cosa mostra la pagina *Utilizzo*.

## Panoramica {#ueberblick}
<!-- keywords: utilizzo, costi, token, statistiche, consumo, fatturazione -->

Token e costi si vedono in quattro punti:

- su ogni nodo agente dopo un'esecuzione,
- nella *Panoramica dell'esecuzione* dell'editor (in diretta),
- nella vista di dettaglio di ogni esecuzione, in totale e per agente,
- nella pagina **Utilizzo**, riassunti per giorno, workflow e modello.

Tutti i costi sono **stime a prezzo di listino**; fa fede la fatturazione di ciascun provider. Nodestro conosce i prezzi solo dei modelli di Anthropic. Per gli altri modelli i costi restano **sconosciuti** (mostrati come «–»): non contano mai come 0, e un budget limita solo i costi con prezzo noto. Gli importi sono sempre in dollari statunitensi, con fino a sei decimali e nel formato numerico della lingua scelta (per esempio «0,0042 USD» in italiano, «$0.0042» in inglese).

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

Per ogni richiesta Nodestro moltiplica i tipi di token per i prezzi del modello (in dollari statunitensi per milione di token) e aggiunge le tariffe delle ricerche web (10 $ ogni 1.000 ricerche). La somma di tutte le richieste dà i costi dell’agente e dell’esecuzione; se una parte è sconosciuta, lo è anche la somma. Il listino proviene dalla libreria Orkexa (modelli di Anthropic):

<!-- widget: models -->

Se un'esecuzione mostra **«–»** invece di un importo, almeno una richiesta non è stata prezzata (per esempio un modello sconosciuto). Nodestro preferisce allora non mostrare alcun importo piuttosto che uno troppo basso. Per il budget, queste richieste contano 0.

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

## Risparmiare {#sparen}
<!-- keywords: risparmiare, più economico, ridurre i costi, ottimizzare, consigli -->

- **Il modello adatto più piccolo:** Haiku per i passaggi semplici, Sonnet per la maggior parte, Opus solo dove serve.
- **Ridurre l'impegno:** *Basso* o *Medio* basta per molti compiti e fa risparmiare token di ragionamento.
- **Lasciare attiva la cache.**
- **Usare la conoscenza in modo mirato:** *Ricerca* o *Su richiesta* invece di file grandi *Nel contesto*.
- **Limitare token e turni di strumenti**, perché un agente non si perda.
- **Impostare un budget**, perché un'esecuzione non costi mai più del previsto.
- **Usare il controllo qualità in modo mirato:** ogni verifica e revisione costa in più.

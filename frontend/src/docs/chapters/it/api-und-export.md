# API ed esportazione

Un workflow finito può essere usato come API web: direttamente da Nodestro su questo computer, oppure come progetto FastAPI autonomo che puoi eseguire ovunque. Entrambi usano la stessa logica di workflow di Nodestro. Niente viene rigenerato e nessuna IA riscrive il flusso.

## Panoramica {#ueberblick}
<!-- keywords: api, rest, http, endpoint, pubblicare, distribuire, deployment, fastapi, esportare, interfaccia, integrazione -->

Apri un workflow nell’editor e fai clic su **API & Export**. La finestra di dialogo ha sei aree:

| Area | A cosa serve |
|---|---|
| **Panoramica** | Stato, indirizzi, pubblicazione, versioni e ultime esecuzioni dell’API |
| **Chiavi e accesso** | Chiavi API e accesso facoltativo dalla rete |
| **Prova** | Verificare una richiesta o avviare una vera esecuzione di prova |
| **Documentazione** | Endpoint, esempi curl e Python, descrizione OpenAPI |
| **Limiti** | Nome nell’URL, descrizione e limiti |
| **Esportazione** | Il progetto FastAPI autonomo come ZIP |

Ci sono due strade:

1. **Servire direttamente:** Nodestro risponde alle richieste sotto `/api/published/<nome>/…`. Per impostazione predefinita, solo da questo computer.
2. **Esportare:** Nodestro genera un progetto con runtime, versione del workflow, test, esempi e README. Lo esegui senza Nodestro, per esempio su un server o in Docker.

Entrambe procedono passo per passo come in Nodestro: stessi agenti, strumenti, rami, approvazioni e moduli.

## Pubblicare {#veroeffentlichen}
<!-- keywords: pubblicare, pubblicazione, versione, congelare, verifica, salvare, nota -->

**Pubblica** congela l’ultima versione salvata del workflow, insieme a:

- gli agenti con modello, istruzioni e impostazioni,
- il codice degli strumenti nella versione approvata (vedi [Approvazione degli strumenti](/docs/tools#freigabe)),
- i sotto-workflow nella versione attuale (vedi [Sotto-workflow](/docs/verzweigungen#unterworkflow)),
- il modulo di input, da cui Nodestro genera lo schema della richiesta.

Prima Nodestro verifica il workflow. Gli errori impediscono la pubblicazione; la finestra mostra gli avvisi (per esempio un limite di costo mancante o passaggi di approvazione). Le modifiche non salvate non vengono pubblicate: salva prima. Sotto compare il **risultato dei test** della versione per ogni [serie di test](/docs/automatisierung#testreihen) del workflow: *non testata*, *n su m superati* o *non aggiornato* se per ultima è stata testata un’altra versione o la serie è cambiata da allora. Senza [controllo di pubblicazione](#freigabe-gate) il risultato è solo informativo; non impedisce la pubblicazione.

Ogni pubblicazione riceve un numero progressivo e una nota facoltativa. Le modifiche successive nell’editor non cambiano mai una versione pubblicata. Arrivano nell’API solo alla pubblicazione successiva.

## Controllo di pubblicazione {#freigabe-gate}
<!-- keywords: controllo di pubblicazione, gate, qualità, serie di test, obbligatorio, motivazione, override, pubblicare, valutazione dell'ia -->

Con il **controllo di pubblicazione** pubblichi una nuova versione solo dopo che le sue [serie di test](/docs/automatisierung#testreihen) l'hanno provata. Il controllo è facoltativo e vale per singola API. Lo attivi dopo la prima pubblicazione in **Limiti → Controllo di pubblicazione**: scegli le serie di test, la quota minima di casi superati e, se vuoi, una valutazione minima dell'IA. Le versioni già pubblicate non cambiano.

Prima della pubblicazione la finestra mostra il risultato in tre parti separate:

- **Verifiche obbligatorie:** l'ultima esecuzione di ogni serie ha provato esattamente questa versione con i modelli salvati, e la serie non è cambiata da allora. Altrimenti il controllo blocca. Le verifiche obbligatorie non si possono saltare, né nella finestra né tramite l'API: prova la versione.
- **Risultati delle verifiche:** la quota di casi la cui esecuzione è riuscita e ha superato tutte le verifiche.
- **Valutazioni dell'IA:** la media della [valutazione dell'IA](/docs/automatisierung#testreihen). È segnata come *giudizio dell'IA, non garantito* e non viene mai mescolata con le verifiche fisse.

Se i risultati o le valutazioni dell'IA non soddisfano il controllo, puoi pubblicare comunque indicando una **motivazione** (almeno 10 caratteri). La motivazione, chi l'ha data e quali punti mancavano vengono salvati con la versione e nella cronologia dell'API. L'elenco **Versioni** mostra *controllo soddisfatto* o *pubblicata con motivazione*. Su un server solo i ruoli owner e admin possono pubblicare e quindi dare una motivazione.

## Versioni e ripristino {#versionen}
<!-- keywords: versione, versioni, rollback, ripristino, tornare indietro, attiva, versione attiva, immutabile, release -->

L’elenco delle **versioni** mostra ogni versione pubblicata con data, nota ed esito della verifica. Una di esse è **attiva**: le richieste a `/runs` la usano.

- **Rendi attiva** cambia subito la versione attiva, senza ripubblicare. Così torni a una versione precedente.
- Le esecuzioni mantengono la loro versione fino alla fine, anche quando riprendono dopo un errore.
- I client possono chiamare una versione precisa: `POST /api/published/<nome>/versions/<numero>/runs`.

Le versioni pubblicate non si possono modificare. Così i risultati restano tracciabili: ogni esecuzione dell’API indica con quale versione è stata eseguita.

## Disattivare ed eliminare {#abschalten}
<!-- keywords: disattivare, spegnere, sospendere, 503, eliminare, rimuovere -->

**Disattiva** rifiuta le nuove esecuzioni con lo stato `503` e il codice `publication.disabled`. Le esecuzioni in corso continuano; disattivando puoi anche annullarle. Stato e risultati delle esecuzioni esistenti restano consultabili. **Attiva** rende di nuovo disponibile l’API.

**Elimina API** rimuove tutte le versioni, e le chiavi perdono l’accesso a esse. È possibile solo quando nessuna esecuzione di questa API è ancora in corso. Le esecuzioni restano in Esecuzioni. Se il workflow viene eliminato, sparisce anche la sua API.

## Endpoint {#endpunkte}
<!-- keywords: endpoint, url, indirizzo, runs, stato, risultato, eventi, annullare, approve, resume, versioni, openapi -->

Il nome nell’URL (per es. `verifica-fatture`) lo scegli quando pubblichi e lo cambi in **Limiti**. Tutti i percorsi iniziano con `/api/published/<nome>`:

| Metodo e percorso | Effetto | Permesso |
|---|---|---|
| `GET /` | Cosa si aspetta e restituisce l’API, e quali versioni esistono | `read` |
| `POST /runs` | Avvia un’esecuzione con la versione attiva | `run` |
| `POST /versions/<numero>/runs` | Avvia un’esecuzione con una versione precisa | `run` |
| `GET /runs` | Le ultime esecuzioni di questa API | `read` |
| `GET /runs/<id>` | Stato, passaggi, costo e approvazioni di un’esecuzione | `read` |
| `GET /runs/<id>/result` | Il risultato di un’esecuzione terminata | `read` |
| `GET /runs/<id>/events` | L’avanzamento come Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Annulla un’esecuzione | `run` |
| `GET /runs/<id>/approvals` | Approvazioni in attesa con ciò che va esaminato | `read` |
| `POST /runs/<id>/approve` | Decide un’approvazione | `approve` |
| `POST /runs/<id>/resume` | Riprende un’esecuzione fallita | `run` |
| `GET /runs/<id>/files` | File di risultato di un’esecuzione | `read` |
| `GET /usage` | Esecuzioni, token e costo di questa API | `read` |
| `GET /openapi.json` | Descrizione OpenAPI solo di questa API | – |

Gli schemi completi sono in **Documentazione**, dove **Scarica la descrizione OpenAPI** ti dà anche il file OpenAPI.

## Richieste e risposte {#aufrufen}
<!-- keywords: richiesta, request, corpo, body, json, input, values, modulo, schema, file, base64, risposta, 202, run_id, idempotency -->

Il corpo della richiesta è JSON. Se il workflow ha un modulo di input, i campi stanno in `values`, con tipi, campi obbligatori e scelte come nel modulo. Altrimenti c’è un campo di testo `input`. I file arrivano come elenco `files` con `name`, `media_type` e `content_base64`. In alternativa l’API accetta file come `multipart/form-data`, vedi [File tramite l’API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/verifica-fatture/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"importo": 120, "fornitore": "ACME"}}'
```

Nodestro risponde subito con `202` e un `run_id` con i link a stato, risultato ed eventi. L’esecuzione lavora in background. Interroga lo stato finché è `succeeded`, `failed` o `cancelled`, poi recupera il risultato. Altri stati: `queued`, `running` e `awaiting_approval`.

Se una richiesta non corrisponde allo schema, l’API risponde `422` e indica ogni campo non valido. Con l’intestazione `Idempotency-Key`, una richiesta ripetuta (per esempio dopo un errore di rete) non avvia una seconda esecuzione ma restituisce la prima.

## Attesa sincrona ed eventi {#synchron}
<!-- keywords: sincrono, sync, attendere, wait, bloccante, sse, server-sent events, stream, in diretta, riconnessione, last-event-id -->

Per impostazione predefinita ogni API è asincrona. In **Limiti** puoi attivare **Consenti di attendere il risultato**. Allora `POST /runs?wait=30` attende il risultato fino al tempo impostato. Se l’esecuzione non è finita entro quel tempo, arriva il solito `202`. Non è possibile per i workflow con passaggi di approvazione, perché una persona deve decidere.

`GET /runs/<id>/events` fornisce l’avanzamento come Server-Sent Events: i passaggi iniziano e finiscono, viene prodotto testo, le approvazioni attendono, l’esecuzione termina. Prompt e dati degli strumenti restano in Nodestro. Se la connessione cade, il client si riconnette con l’intestazione `Last-Event-ID` e riceve solo gli eventi persi.

## Approvazioni tramite l’API {#freigaben}
<!-- keywords: approvazione, approvare, rifiutare, approve, reject, attesa, awaiting_approval, persona, human in the loop -->

Quando un’esecuzione raggiunge un passaggio di approvazione, passa a `awaiting_approval`. Puoi decidere in due punti, e conta la prima decisione:

- in Nodestro nella pagina Approvazioni (vedi [La pagina Approvazioni](/docs/verzweigungen#freigaben-seite)), con l’indicazione “dall’API pubblicata”,
- con `POST /runs/<id>/approve` e `{"decision": "approved"}` oppure `"rejected"` e un commento facoltativo. Serve una chiave con il permesso `approve`.

Le approvazioni in attesa sopravvivono a un riavvio di Nodestro. Un’esecuzione fallita può riprendere con `POST /runs/<id>/resume`. I passaggi riusciti vengono riutilizzati. I passaggi che hanno chiamato strumenti vengono ripetuti solo con `confirm_side_effects: true`.

## Chiavi API {#schluessel}
<!-- keywords: chiave, chiave api, api key, token, bearer, authorization, x-api-key, permessi, scopes, run, read, approve, revocare, ruotare, hash -->

Ogni richiesta ha bisogno di una chiave, come `Authorization: Bearer <chiave>` oppure nell’intestazione `X-API-Key`. Le chiavi si creano in **Chiavi e accesso**:

- **Nome:** chi usa la chiave, per es. il nome dell’applicazione.
- **Permessi:** `run` avvia, annulla e riprende, `read` legge stato, risultati ed eventi, `approve` decide le approvazioni.
- **Valida per:** le API che la chiave può chiamare. Non raggiunge mai altri workflow né l’interfaccia di Nodestro.

La chiave viene mostrata **una sola volta**. Nodestro conserva solo un hash e in seguito riconosce la chiave dal suo inizio (`ndk_…`). **Revoca ora** blocca una chiave. **Sostituisci con una nuova chiave** crea una chiave nuova con le stesse impostazioni e revoca la vecchia. Le chiavi non compaiono mai in log, trace, backup o esportazioni. Dopo molte chiavi errate in poco tempo, l’API risponde `429` per un po’.

## Accesso dalla rete {#netzwerk}
<!-- keywords: rete, lan, porta, 8100, 0.0.0.0, altri dispositivi, tls, https, certificato, firewall, condividere -->

Per impostazione predefinita le API pubblicate rispondono solo a questo computer. Gli altri dispositivi ricevono `403` con il codice `lan.not_enabled`. Per ammettere i dispositivi della tua rete:

1. Apri **Chiavi e accesso → Impostazioni di rete** e attiva l’accesso di rete. Nodestro apre una **porta separata** (predefinita `8100`).
2. Attiva **Raggiungibile in rete** per ogni API. Solo queste API sono raggiungibili tramite la porta.

Questa porta serve solo le API pubblicate, mai l’interfaccia di Nodestro, le sue impostazioni o altri workflow. Se la porta è occupata, la finestra lo segnala e Nodestro continua a funzionare normalmente. Dopo il ripristino di un backup l’accesso di rete è di nuovo disattivato.

## Sicurezza {#sicherheit}
<!-- keywords: sicurezza, tls, https, cifratura, internet, reverse proxy, certificato, backup, segreti -->

- Senza TLS, richieste, chiavi e risultati viaggiano nella rete **in chiaro**. Usa l’accesso di rete solo in reti di cui ti fidi, oppure indica un certificato e la sua chiave (percorsi di file su questo computer).
- Non esporre Nodestro direttamente su Internet. A questo serve l’esportazione, dietro un reverse proxy con TLS.
- Ogni esecuzione costa denaro presso il fornitore del modello. Distribuisci chiavi con il permesso `run` solo se ti fidi dei limiti dell’API.
- I backup non contengono chiavi API (vedi [Backup e ripristino](/docs/einstellungen#backup)). Al ripristino, le chiavi di questo computer vengono mantenute.

## Limiti {#grenzen}
<!-- keywords: limiti, limits, rate limit, 429, simultanee, budget, budget giornaliero, costo, upload, dimensione file -->

In **Limiti** decidi quanto può essere usata un’API:

| Limite | Predefinito |
|---|---|
| Esecuzioni simultanee | 2 |
| Esecuzioni in attesa di approvazione | 20 |
| Nuove esecuzioni al minuto per chiave | 10 |
| Richieste al minuto per chiave | 120 |
| Budget giornaliero (costo delle ultime 24 ore) | 5 USD |
| Limite di costo per esecuzione | Il budget del workflow |
| Dimensione di un file caricato | 10 MB |

Quando un limite viene superato, l’API risponde `429` con un codice come `limit.concurrent` o `limit.daily_budget` e, per i limiti di frequenza, con l’intestazione `Retry-After`. Il limite di costo per esecuzione completa il [budget del workflow](/docs/workflows#budget).

## Messaggi di errore {#fehler}
<!-- keywords: errore, errori, error, codice, stato, 401, 403, 404, 409, 422, 429, 503, leggibile da macchina -->

Ogni errore ha la stessa forma, così i programmi possono interpretarlo:

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Stato | Significato |
|---|---|
| `401` | Chiave mancante o non valida (`auth.missing`, `auth.invalid`) |
| `403` | Permesso mancante (`auth.scope`) o accesso di rete disattivato |
| `404` | L’API, la versione, l’esecuzione o il file non esiste |
| `409` | Non compatibile con lo stato, per es. risultato di un’esecuzione in corso (`run.not_finished`) |
| `422` | La richiesta non corrisponde allo schema (`request.invalid`) |
| `429` | È stato raggiunto un limite (`limit.*`) |
| `503` | API disattivata (`publication.disabled`) oppure il provider di un modello non è configurato (`model.unavailable`) |

## Provare in Nodestro {#testen}
<!-- keywords: provare, prova, test, verificare, validare, dry run, esecuzione di prova, esempio -->

In **Prova** trovi una richiesta di esempio che puoi adattare:

- **Verifica richiesta** valida il corpo esattamente come l’API, mostra l’input che il workflow riceverebbe e non avvia nulla. Non costa nulla.
- **Avvia esecuzione di prova** avvia una vera esecuzione della versione pubblicata attraverso lo stesso percorso dell’API. Viene addebitata come ogni esecuzione e compare in Esecuzioni come esecuzione di prova da Nodestro.

Per i test di regressione di una nuova versione usa le [serie di test](/docs/automatisierung#testreihen): girano con la versione salvata prima che tu pubblichi.

## Monitoraggio {#ueberwachung}
<!-- keywords: monitoraggio, monitoring, esecuzioni, origine, utilizzo, costo, statistiche, esecuzioni api -->

Le esecuzioni dell’API compaiono in Esecuzioni con l’attivatore **API**. La vista di dettaglio indica la versione e la chiave che ha avviato l’esecuzione. Nella pagina Utilizzo, le esecuzioni delle API pubblicate hanno una riga propria (vedi [La pagina Utilizzo](/docs/nutzung#statistik)). La panoramica della finestra mostra le ultime esecuzioni di questa API, e `GET /usage` fornisce gli stessi numeri ai programmi.

## Esportazione come progetto FastAPI {#export}
<!-- keywords: esportazione, esportare, zip, fastapi, progetto, autonomo, docker, uvicorn, readme, test, pyproject, lock, deployment, server -->

In **Esportazione**, **Genera ZIP** crea un progetto autonomo da una versione pubblicata. Contiene:

| Parte | Contenuto |
|---|---|
| `app/` | Applicazione FastAPI con gli stessi endpoint, configurazione e gestione delle chiavi |
| `nodestro_runtime/`, `nodestro_api/` | Il runtime di Nodestro (nodestro-runtime e il livello HTTP di nodestro-api), copiato senza modifiche; versioni e checksum in `RUNTIME.json` |
| `workflow/` | La versione congelata con agenti, strumenti e sotto-workflow |
| `pyproject.toml`, `requirements.lock` | Dipendenze con versioni esatte |
| `tests/`, `examples/` | Test senza chiamate al modello, una richiesta di esempio e un client Python |
| `README.md`, `Dockerfile`, `.env.example` | Installazione, configurazione ed esercizio |

Se gli strumenti richiedono librerie Python, l’esportazione riprende esattamente le versioni approvate (vedi [Approvazione delle librerie](/docs/python-bibliotheken#freigabe)). Prima della generazione la finestra mostra ogni file e ogni avviso. L’esportazione non contiene mai chiavi API, impostazioni o altri workflow. La stessa versione con le stesse opzioni produce lo stesso file ZIP, byte per byte.

Nel progetto esportato, `python -m app.keys new` crea chiavi per i tuoi client. Gli accessi ai provider di IA si impostano come variabili d’ambiente, per esempio `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` o `GEMINI_API_KEY`; il README e `.env.example` nominano esattamente le variabili di cui ha bisogno la versione del workflow. Anche gli URL di base dei tuoi server vengono esportati, a meno che contengano credenziali; in quel caso li imposti tu (per esempio `OLLAMA_BASE_URL`).

## La libreria Orkexa {#orkexa}
<!-- keywords: orkexa, libreria, repository, licenza, mit, vendor, includere, git, accesso -->

Nodestro esegue gli agenti con la libreria **Orkexa**, che dialoga con tutti i provider supportati. Non è su PyPI e si trova in un repository attualmente privato. L’esportazione offre quindi due strade:

- **Riferimento Git** (predefinito): `pyproject.toml` punta al commit esatto. Chi installa il progetto ha bisogno dell’accesso in lettura al repository.
- **Includere il codice sorgente:** il codice va in `vendor/orkexa/` e il progetto si installa senza accesso al repository. La libreria è sotto licenza MIT. Conferma di poterla cedere prima di dare questo progetto ad altri.

Senza una delle due il progetto non si può installare. Il README indica la strada scelta.

## Conoscenza e memoria nell’esportazione {#daten}
<!-- keywords: conoscenza, knowledge, memoria, memory, dati, privacy, riservato, includere, escludere -->

I file di conoscenza e la memoria persistente possono contenere informazioni riservate. Per questo entrano **nel progetto solo se li selezioni uno per uno**:

- **Conoscenza** (vedi [Conoscenza](/docs/wissen#ueberblick)): i file selezionati vengono copiati con il loro contenuto. Quelli non selezionati mancano, e gli agenti lì non trovano nulla.
- **Memoria** (vedi [Memoria persistente](/docs/memory#dauerhaft)): il contenuto attuale di uno spazio di memoria selezionato diventa il contenuto iniziale del progetto. Poi i due evolvono separatamente.

La verifica prima dell’esportazione elenca quali agenti usano dati lasciati fuori. Nel servizio diretto, le esecuzioni dell’API usano la conoscenza e la memoria di Nodestro come qualsiasi altra esecuzione.

## Guida all’integrazione con IA {#ki-anleitung}
<!-- keywords: ia, guida, documentazione, descrizione, costo, facoltativo, rivedere, accettare, scartare -->

Per impostazione predefinita l’esportazione viene creata senza IA e senza costi: README ed esempi provengono da modelli predefiniti. Facoltativamente, il modello assistente scrive dalla documentazione generata una guida in prosa per gli utenti della tua API (`docs/AI_GUIDE.md`). Al modello va solo la documentazione dell’API, senza chiavi né dati. È una chiamata a pagamento al modello e compare nella pagina Utilizzo come “Guida IA per un’API”.

La guida entra nell’esportazione solo dopo la tua revisione: leggila e fai clic su **Accetta** o **Scarta**. Non cambia nulla nel codice né negli endpoint.

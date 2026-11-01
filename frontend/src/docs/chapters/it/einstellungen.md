# Impostazioni e funzionamento

Questo capitolo descrive tutte le impostazioni, l'installazione e l'avvio di Nodestro e le scorciatoie da tastiera.

## Provider di IA {#anbieter}
<!-- keywords: chiave api, provider, anthropic, openai, gemini, ollama, vllm, compatibile con openai, url di base, variabile d’ambiente, .env, capacità -->

Nodestro esegue gli agenti con la libreria Orkexa e lavora con più **provider di IA** contemporaneamente: **Anthropic**, **OpenAI**, **Google Gemini** e i tuoi server tramite un **endpoint compatibile con OpenAI**, **Ollama** o **vLLM**. Ogni agente usa il provider del suo modello. Se quel provider non è configurato, l’esecuzione non parte; Nodestro non passa mai in silenzio a un altro provider. Se manca il provider del modello predefinito, in alto a destra compare «Configura provider di IA», oppure «Il modello predefinito richiede …» se è già configurato un altro provider.

In *Impostazioni → Provider di IA* ogni provider ha una sezione propria:

- **Anthropic, OpenAI, Google Gemini:** inserisci la chiave API e premi **Salva**. La chiave resta nel database locale, non viene più mostrata e viene inviata solo a questo provider. **Rimuovi** la cancella.
- **Endpoint compatibile con OpenAI, Ollama, vLLM:** inserisci l’**URL di base** del server (per esempio `http://localhost:11434/v1` per Ollama) e premi **Salva endpoint**; la chiave API è facoltativa. Il provider risulta configurato solo quando è salvato un URL di base.
- **Cosa sanno fare i modelli:** per i tuoi server indichi se i loro modelli supportano strumenti, output strutturato, immagini, documenti PDF, sforzo di ragionamento e altre capacità. Nodestro non presume nulla: un’opzione che un modello non sa fare, o il cui supporto è sconosciuto, viene segnalata come errore dal controllo invece di essere omessa.
- **Verifica connessione** chiede al provider solo l’elenco dei modelli; non costa nulla.
- **Primo provider:** se salvi una chiave mentre il provider del modello predefinito non è ancora configurato, i nuovi agenti usano da quel momento un modello di questo provider; un messaggio indica quale. Cambiano solo le impostazioni: i workflow esistenti mantengono i loro modelli.

Puoi impostare le chiavi anche come **variabili d’ambiente**, prima dell’avvio o in un file **`.env`** nella cartella da cui avvii `nodestro`. Le variabili d’ambiente hanno la **precedenza** sulle chiavi salvate:

| Provider | Variabile d’ambiente |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` o `GOOGLE_API_KEY` |
| Compatibile con OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (facoltativa) |

Una chiave delle versioni precedenti (allora solo per Anthropic) diventa automaticamente la chiave di Anthropic in queste impostazioni al primo avvio.

## Modello degli assistenti e modello predefinito {#modelle}
<!-- keywords: modello predefinito, modello degli assistenti, default model, nuovi agenti -->

- **Modello predefinito per i nuovi agenti:** i nuovi agenti vuoti partono con questo provider e modello (dalla tavolozza, nei nuovi workflow e come modello vuoto). Nelle bozze con l’IA fa da sostituto se l’architetto propone un modello non consentito. Gli agenti esistenti restano invariati.
- **Modello degli assistenti:** questo modello progetta agenti dalla tua descrizione, scrive strumenti come agente di codice, propone strutture di memoria e risponde alle tue domande come [Nodestro Assistant](/docs/assistent). Un modello potente (predefinito: Claude Opus 5.5 di Anthropic) dà proposte migliori. Le bozze con l’IA propongono solo modelli di provider configurati.

Entrambi i campi sono composti da **provider** e **modello**. Scegli il modello dall’elenco o digita un qualsiasi id di modello del provider, per esempio `gpt-5.5` su OpenAI o `llama3.1:8b` su Ollama. Viene salvato come `provider:modello` (per esempio `openai:gpt-5.5`); i valori più vecchi senza provider, come `claude-sonnet-5-5`, valgono come modelli di Anthropic.

Se il modello predefinito appartiene a un provider non configurato mentre un altro lo è, un avviso sopra la scelta del modello spiega che i nuovi agenti e le copie degli esempi non possono essere eseguiti con esso e propone il modello corrispondente del provider configurato (*Usa …*). I workflow esistenti mantengono comunque i loro modelli.

Salva le modifiche con **Salva** nella sezione *Modelli e budget*.

## Budget predefinito {#budget}
<!-- keywords: budget predefinito, budget, limite -->

Il **budget predefinito per esecuzione** (inizialmente 2 USD) vale per tutti i workflow senza un budget proprio. Vuoto significa nessun limite. Come funziona il budget è spiegato in [Budget per esecuzione](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: scegliere la sandbox, docker, processo python, docker disponibile -->

Qui scegli dove vengono eseguiti gli strumenti scritti da te: **Processo Python** o **Docker**. La modifica ha effetto subito. Le indicazioni mostrano se Docker è stato trovato e se la **sandbox Linux integrata** è attiva; se non lo è, viene indicato il motivo (ad esempio una distribuzione Linux non testata o una funzione del kernel mancante). Se Docker è selezionato ma non raggiungibile, i test e le chiamate degli strumenti falliscono. I dettagli sono in [La sandbox](/docs/tools#sandbox).

Gli strumenti creati dall’IA e quelli di origine sconosciuta vengono eseguiti solo isolati: automaticamente nella sandbox Linux integrata, altrimenti solo con Docker; vedi [Fiducia e isolamento](/docs/tools#vertrauen).

## Lingua {#sprache}
<!-- keywords: lingua, language, italiano, inglese, tedesco, spagnolo, francese, portoghese, lingua del browser, traduzione, localizzazione -->

Nodestro è disponibile in **tedesco, inglese, spagnolo, francese, portoghese (Brasile) e italiano**. In **Lingua dell'interfaccia** scegli una di queste oppure **Automatica (lingua del browser)**.

- **Primo avvio:** Nodestro usa la lingua del tuo browser. Se non è supportata, compare l'inglese.
- **Scelta personale:** una lingua scelta ha sempre la precedenza e resta salvata, anche dopo un riavvio. Nodestro la memorizza nel browser e nelle impostazioni; un altro browser la adotta finché non ha una scelta propria.
- **Effetto immediato:** il cambio non richiede riavvii e non avvia né workflow né chiamate all'IA.

La lingua riguarda solo l'**interfaccia**: menu, avvisi, messaggi di errore, questa documentazione e formati di numeri e date. I costi sono sempre mostrati in dollari statunitensi, nel formato della lingua scelta. Per i messaggi di errore del server puoi vedere il testo originale in **Dettagli tecnici**.

**I tuoi contenuti restano invariati.** Agenti, prompt, workflow, strumenti, conoscenza, memoria e risultati non vengono mai tradotti automaticamente. Un agente esistente continua a rispondere nella lingua del suo prompt, qualunque lingua dell'interfaccia tu scelga.

**Assistenti IA:** le nuove proposte (agenti, strutture di memoria) vengono scritte nella lingua dell'interfaccia, a meno che la tua descrizione non chieda un'altra lingua. Codice, identificatori e chiavi JSON restano sempre in inglese.

## Aspetto {#darstellung}
<!-- keywords: tema, scuro, chiaro, modalità scura, modalità chiara, schema di colori, design, midnight citron -->

In alto a destra passi da **Scuro** a **Chiaro**. La scelta viene salvata nel browser. Entrambe le varianti seguono il design system *Midnight Citron*. Sugli schermi stretti la barra laterale è nascosta: il pulsante del menu in alto a sinistra (**Mostra tutte le pagine**) la apre come pannello ed **Esc** la richiude.

## Backup e ripristino {#backup}
<!-- keywords: backup, copia di sicurezza, ripristinare, esportare, zip, trasloco, salvataggio dati -->

**Scarica backup** salva tutti i dati in un file ZIP: workflow con versioni, modelli di agenti, strumenti personali, file di conoscenza, memoria, esecuzioni, dati di utilizzo, preferiti, tag e impostazioni. Il database viene salvato come istantanea coerente, anche mentre un’esecuzione è in corso.

Le **chiavi API** dei provider di IA non finiscono mai nel backup, e nemmeno gli URL di base che contengono credenziali. Il ripristino mantiene le chiavi di questo computer.

**Ripristina da file** verifica prima completamente il file: formato, checksum di ogni file, database e ogni workflow ed esecuzione salvati. Solo allora Nodestro mostra cosa contiene il backup, confrontato con lo stato attuale. I dati vengono sostituiti solo dopo una conferma esplicita e solo se non c’è alcuna esecuzione attiva. Prima Nodestro salva automaticamente un backup dello stato attuale (`before-restore-….zip` nella cartella `backups` della cartella dei dati); compare tra i backup di questo computer e si può ripristinare allo stesso modo. Se qualcosa non riesce, i dati precedenti restano invariati.

## Diagnosi del sistema {#diagnose}
<!-- keywords: diagnosi, verificare, trovare errori, connessione, docker, sandbox, versione, problema -->

**Avvia diagnosi** verifica se Nodestro funziona completamente su questo computer e mostra per ogni punto **OK**, **Avviso** o **Errore**, con una spiegazione e una proposta di soluzione:

- versioni di Nodestro, Orkexa, Python, SQLite e del sistema operativo
- database (leggibile, scrivibile, integro, ricerca full-text)
- cartelle di dati, strumenti e backup scrivibili, spazio libero su disco
- provider di IA: quali sono configurati e se tra essi ci sono quelli del modello predefinito e del modello dell’assistente (senza mostrare chiavi)
- Docker e la sandbox degli strumenti con un piccolo strumento di prova
- supporto PDF e interfaccia compilata

La diagnosi è gratuita e non invia nulla a internet. **Verifica connessione** chiede inoltre l’elenco dei modelli al provider del modello predefinito; nella sezione di ogni provider in [Provider di IA](/docs/einstellungen#anbieter) lo verifichi singolarmente. Non usa token e non costa nulla. Le chiavi API e le altre credenziali non vengono mai mostrate.

## Installazione e avvio {#installation}
<!-- keywords: installazione, avvio, riga di comando, cli, porta, host, data-dir, no-browser, reload, python, node -->

Requisiti: Python 3.10 o successivo e Node.js 20 o successivo (solo per compilare l'interfaccia); Docker facoltativo.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro si avvia su `http://localhost:8000` e apre il browser. Opzioni del comando `nodestro`:

| Opzione | Variabile d'ambiente | Significato |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Indirizzo (predefinito `127.0.0.1`). Sono accettati solo indirizzi di questo computer (`127.0.0.1`, `::1`, `localhost`), perché Nodestro non ha ancora un accesso con login |
| `--port` | `NODESTRO_PORT` | Porta (predefinita `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Directory dei dati (predefinita `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Profilo operativo (predefinito `desktop`). `server` non può ancora essere avviato |
| – | `NODESTRO_ALLOWED_HOSTS` | Altri nomi di questo computer a cui Nodestro risponde (separati da virgole, ad es. `studio.localhost`). Gli altri nomi host, le modifiche da pagine web estranee e le richieste inoltrate da un proxy vengono rifiutati, così nessuna pagina del browser può comandare Nodestro |
| `--no-browser` | – | Non aprire automaticamente il browser |
| `--reload` | – | Riavviare a ogni modifica del codice (sviluppo) |

Si chiude con **Ctrl+C**. Le esecuzioni in corso vengono annullate.

> **Sicurezza:** Nodestro non ha ancora una gestione degli utenti, quindi risponde solo a questo computer. `--host 0.0.0.0`, altri indirizzi di rete o nomi di rete in `NODESTRO_ALLOWED_HOSTS` interrompono l’avvio, e Nodestro non può essere messo dietro un reverse proxy. Per far usare un workflow ad altri dispositivi, pubblicalo come API: le API pubblicate usano chiavi API e hanno un proprio accesso di rete (vedi *API ed esportazione*).

## Nodestro su un server {#server}
<!-- keywords: server, accedere, accesso, login, uscire, ruolo, ruoli, permesso, permessi, area di lavoro, tenant, sola lettura, membri, nodestro-server, set-role, remove-member, revoke-sessions, sessione scaduta -->

Nodestro Studio può girare anche su un **server Nodestro** della tua organizzazione. In quel caso accedi tramite il servizio di accesso della tua organizzazione, e i tuoi dati sono salvati su quel server invece che sul tuo computer. L’app desktop e il comando `nodestro` non hanno né accesso né ruoli; nulla di questa sezione vale per loro.

**Accedere e uscire.** Quando apri Nodestro, il server ti porta all’accesso e poi di nuovo indietro. In alto a destra compaiono il tuo nome e il tuo ruolo. Un clic apre il tuo account: nome, ruolo, **area di lavoro**, i tuoi permessi ed **Esci**. Quando la tua sessione scade, l’azione successiva ti riporta all’accesso e poi alla stessa pagina. Se un accesso non riesce (per esempio perché ha richiesto troppo tempo), un avviso in cima alla pagina spiega cosa è successo, con **Accedi di nuovo**.

**Aree di lavoro.** Workflow, esecuzioni, conoscenza e impostazioni appartengono a un’area di lavoro. Se sei membro di più aree, cambi nel tuo account con **Cambia area di lavoro**; Nodestro carica allora la pagina iniziale dell’altra area. Le impostazioni valgono per la tua area di lavoro attuale su quel server.

**Ruoli e permessi.** Ogni ruolo ha permessi fissi:

| Ruolo | Permessi |
|---|---|
| **Proprietario** | Leggere, Modificare, Eseguire, Amministrare |
| **Amministratore** | Leggere, Modificare, Eseguire, Amministrare |
| **Editor** | Leggere, Modificare, Eseguire |
| **Operatore** | Leggere, Eseguire |
| **Osservatore** | Leggere |

- **Leggere:** vedere tutto, comprese le esecuzioni e la documentazione.
- **Modificare:** creare e modificare workflow, modelli di agenti, conoscenza e memoria.
- **Eseguire:** avviare workflow, annullare e continuare esecuzioni, decidere le approvazioni.
- **Amministrare:** impostazioni, provider di IA, servizi collegati, regole per le chiamate di strumenti, pubblicazione di API e chiavi API.
- **Gestire l’installazione** non appartiene a nessun ruolo: backup, diagnosi del sistema e accesso di rete delle API pubblicate non compaiono su un server; se ne occupa il gestore.

**Nodestro mostra in anticipo ciò che il tuo ruolo non consente.** Questi comandi sono nascosti o bloccati, con il motivo accanto, per esempio *Il tuo ruolo (Osservatore) non può farlo: serve il permesso «Modificare». Chiedi a un amministratore del tuo server Nodestro.* Come **Osservatore** o **Operatore**, un avviso in cima a ogni pagina dice che puoi vedere tutto ma non modificare nulla (e, come osservatore, nemmeno eseguire). Il server controlla comunque ogni richiesta da sé.

**Membri e ruoli** li gestisce il gestore del server con i comandi della riga di comando `nodestro-server`; Nodestro Studio non ha una pagina per questo:

- `nodestro-server members TENANT` elenca i membri di un’area di lavoro con i loro ruoli.
- `nodestro-server set-role TENANT USER ROLE` aggiunge una persona o ne cambia il ruolo (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` toglie una persona dall’area di lavoro e chiude lì le sue sessioni.
- `nodestro-server revoke-sessions USER` chiude tutte le sessioni di una persona (le appartenenze restano).

`USER` è un ID utente (`u_…`), un indirizzo e-mail verificato o l’identificativo presso il servizio di accesso. Il server conosce una persona solo dopo che ha effettuato l’accesso una volta; un’area di lavoro mantiene sempre almeno un proprietario. I dettagli sono nel runbook del repository nodestro-server (`docs/RUNBOOK.md`, sezione *Members*). Se l’accesso indica che il tuo account non ha ancora accesso, chiedi a un amministratore di aggiungerti.

**Dati.** In fondo alla barra laterale, al posto di *Locale e privato* compare **Il server della tua organizzazione**: i tuoi dati restano su quel server e vanno solo ai provider di IA consentiti dal tuo gestore. Backup e installazione sono a carico del gestore. Frasi come «gira solo sul tuo computer» valgono solo per l’app desktop e per il comando `nodestro`.

## Scorciatoie da tastiera {#tastenkuerzel}
<!-- keywords: scorciatoie da tastiera, shortcuts, tastiera, keyboard, accessibilità -->

<!-- widget: shortcuts -->

Inoltre, ovunque: **Tab** passa al controllo successivo e ne mostra la spiegazione, **Esc** chiude finestre di dialogo e spiegazioni, **Invio** o **Spazio** attivano i pulsanti.

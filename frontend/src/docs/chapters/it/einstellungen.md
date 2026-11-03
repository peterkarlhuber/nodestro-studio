# Impostazioni e funzionamento

Questo capitolo descrive tutte le impostazioni, l'installazione e l'avvio di Nodestro e le scorciatoie da tastiera.

## Modelli locali {#lokale-modelle}
<!-- keywords: modello locale, ollama, offline, senza chiave api, qwen, download, consiglio, hardware, gpu, memoria, server dei modelli, mistral, europeo, sforzo di ragionamento -->

Nodestro può far funzionare agenti, assistenti e ricerca nella conoscenza con **modelli locali** tramite Ollama, senza chiave API: prompt e documenti restano su questo computer. Una nuova installazione usa per impostazione predefinita modelli locali (agenti `ollama:qwen3.5:4b`, assistente `ollama:qwen3.5:9b`); un’installazione aggiornata mantiene i modelli che aveva.

*Impostazioni → Modelli locali* mostra:

- **Stato:** se il server dei modelli è attivo e chi lo fornisce. Sul desktop Nodestro avvia un proprio server (un processo separato su questo computer, con una propria cartella dei modelli); in Nodestro Local Docker è un container separato; su un server lo fornisce il gestore. Un Ollama che usi già viene adoperato solo se salvi il suo indirizzo per il provider Ollama.
- **Ambiente:** se manca, **Scarica e installa** recupera una volta la versione fissata e ne verifica lo SHA-256. Senza internet, installalo dal suo archivio di rilascio (vedi [Importazione offline](/docs/einstellungen#offline-import)).
- **Consigliati per questo computer:** un modello per compito (smistare, scrivere, agenti con strumenti, analisi, assistente, ricerca semantica) in base alle esigenze del compito, alla memoria di questo computer e ai modelli installati. Un modello installato sufficiente viene prima; *Limitato* significa che un modello più grande lo farebbe meglio. I suggerimenti non cambiano mai un agente: il suo modello lo scegli nell’editor.
- **Modelli:** i modelli proposti con dimensione del download, memoria necessaria e licenza; **Verificato** significa che la versione installata è quella verificata da Nodestro.

**Preferisci modelli europei:** Qwen resta lo standard. Con l’interruttore attivo, a parità di idoneità le raccomandazioni propongono modelli dell’editore europeo Mistral AI (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b` e, per la programmazione, `devstral-small-2:24b`), anche se vanno ancora scaricati; un modello installato resta la prima alternativa. Non viene mai proposto un modello più debole e l’interruttore non usa mai un servizio cloud: tutti questi modelli girano su questo computer. Un modello che assegni tu stesso a un agente ha sempre la precedenza, e la modalità offline rigorosa continua a rifiutare i download. Per la ricerca semantica l’interruttore propone il modello europeo `mdenseon:307m` (LightOn) finché non è installato alcun modello di embedding. Non proviene dalla libreria di Ollama: **Scarica** recupera i file originali fissati (1,2 GB), ne verifica lo SHA-256, costruisce il modello e lo conserva solo se riproduce esattamente i vettori di riferimento. Un indice esistente resta con il suo modello; cambiarlo significa ricostruire l’indice.

**Sforzo di ragionamento:** i modelli locali in grado di «pensare» lo fanno senza limite a partire dallo sforzo *Medio*, e il ragionamento conta nella lunghezza massima dell’output. Su un computer senza scheda grafica un modello piccolo può impiegarci molti minuti. Per i passaggi rapidi (ordinare, estrarre, brevi risposte strutturate) scegli *Basso*: il modello risponde allora senza pensare. Il server di modelli avviato da Nodestro dà a ogni modello 32.768 token di contesto per prompt, ragionamento e risposta insieme. Avvia un Ollama gestito da te con `OLLAMA_CONTEXT_LENGTH=32768`; il suo valore predefinito di 4.096 token è troppo piccolo per gli agenti.

Costi: i modelli locali **non hanno fatturazione API esterna**. Nodestro non registra i costi di esercizio locali (hardware, energia), quindi le esecuzioni mostrano «locale, nessuna fatturazione API» invece di un totale di 0, e le esecuzioni miste aggiungono al costo il numero di richieste locali.

## Importazione offline e cartella dei modelli {#offline-import}
<!-- keywords: offline, air gap, usb, gguf, pacchetto offline, sha-256, ssd esterno, cartella dei modelli, copiare -->

Per i computer senza internet, *Impostazioni → Modelli locali → Importazione offline* importa da un percorso sul computer su cui funziona Nodestro (in Local Docker: nella sua cartella di importazione):

- **Pacchetto offline:** una cartella creata su un computer con internet (`orkexa-local export`). Ogni file viene verificato con il suo SHA-256 prima dell’uso.
- **File GGUF:** un file di modello; dagli il nome usato dagli agenti (per esempio `mio-modello:q4`) e, per i modelli che leggono immagini, il proiettore visivo (`mmproj`).

**Cartella dei modelli:** i modelli sono grandi. Scegli un’altra cartella, per esempio su un SSD esterno: **Copiali lì e verificali** copia ogni modello, lo verifica e solo dopo cambia (la vecchia cartella resta); **Usa la cartella così com’è** passa a una cartella che contiene già modelli Ollama.

## Modalità offline rigorosa {#offline}
<!-- keywords: offline rigoroso, air gap, niente cloud, verifica preliminare, download rifiutati -->

Con la **Modalità offline rigorosa** attiva, la verifica prima di ogni esecuzione rifiuta i modelli cloud (anche come modello di riserva, di valutazione o orchestratore), un server dei modelli che non è su questo computer, gli strumenti server come la ricerca web e i servizi MCP remoti; anche i download vengono rifiutati. Modelli locali, strumenti locali e server MCP locali continuano a funzionare. La modalità non cambia nessun workflow: rifiuta solo ciò che lascerebbe il computer.

## Provider di IA {#anbieter}
<!-- keywords: chiave api, provider, anthropic, openai, gemini, ollama, vllm, compatibile con openai, url di base, variabile d’ambiente, .env, capacità -->

Nodestro esegue gli agenti con la libreria Orkexa e lavora con più **provider di IA** contemporaneamente: **Anthropic**, **OpenAI**, **Google Gemini** e i tuoi server tramite un **endpoint compatibile con OpenAI**, **Ollama** o **vLLM**. Ogni agente usa il provider del suo modello. Se quel provider non è configurato, l’esecuzione non parte; Nodestro non passa mai in silenzio a un altro provider. Se manca il provider del modello predefinito, in alto a destra compare «Configura provider di IA», oppure «Il modello predefinito richiede …» se è già configurato un altro provider.

In *Impostazioni → Provider di IA* ogni provider ha una sezione propria:

- **Anthropic, OpenAI, Google Gemini:** inserisci la chiave API e premi **Salva**. La chiave resta nel database locale, non viene più mostrata e viene inviata solo a questo provider. **Rimuovi** la cancella.
- **Endpoint compatibile con OpenAI, Ollama, vLLM:** inserisci l’**URL di base** del server (per esempio `http://localhost:11434/v1` per Ollama) e premi **Salva endpoint**; la chiave API è facoltativa. Il provider risulta configurato solo quando è salvato un URL di base.
- **Amazon Bedrock (AWS):** nessuna chiave API; scegli una regione AWS e come Nodestro accede ad AWS, vedi [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
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

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, regione, iam, ruolo, profilo, sso, profilo di inferenza, arn, ue, residenza dei dati, solo ue, converse, aws_region, sts -->

**Amazon Bedrock** esegue Claude, Amazon Nova e altri modelli tramite il tuo **account AWS**, nella **regione AWS** che scegli; i costi compaiono sulla tua fattura AWS. Bedrock **non ha un campo per la chiave API**: Nodestro accede con credenziali AWS e non salva mai chiavi di accesso AWS. Un ruolo IAM o un profilo AWS non è una chiave: dice solo ad AWS chi sta chiedendo.

**Accesso sul desktop.** In *Impostazioni → Provider di IA → Amazon Bedrock (AWS)* scegli:

- **Credenziali AWS predefinite (ambiente, SSO, ruolo di istanza):** ciò che gli strumenti AWS trovano su questo computer, per esempio dopo `aws sso login`, nelle variabili d’ambiente `AWS_*` o da un ruolo di istanza.
- **Profilo AWS:** un profilo con nome di `~/.aws/config`; inserisci solo il suo **nome**, le credenziali restano nella tua configurazione AWS.

In Nodestro Local (un container) sono disponibili solo le credenziali predefinite.

**Accesso su un server.** Le credenziali AWS proprie del server non vengono mai usate per un’area di lavoro. Bedrock resta disattivato finché il gestore non assegna all’area di lavoro un **ruolo AWS** proprio; la scheda mostra allora *Ruolo assegnato dal gestore*, e non puoi né vedere né modificare il ruolo. Senza ruolo indica *non disponibile su questo server*: chiedi al tuo gestore. Il gestore può anche limitare le regioni e imporre la residenza dei dati solo UE per tutte le aree di lavoro (vedi [Nodestro su un server](/docs/einstellungen#server)).

**Regione.** Inserisci la regione a cui vanno le richieste e che AWS fattura, per esempio `eu-central-1` (Francoforte). Il campo suggerisce le regioni più comuni e rifiuta i nomi che non sono regioni AWS. Il modello deve essere abilitato per il tuo account in quella regione.

**Modello.** Nell’agente scegli il provider *Amazon Bedrock (AWS)*. L’elenco mostra modelli **suggeriti** (profili di inferenza UE di Claude e Amazon Nova); un suggerimento non significa che il modello sia abilitato per il tuo account. Puoi scrivere qualsiasi **ID di modello** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **ID di profilo di inferenza** (`eu.anthropic.claude-sonnet-5-5`) o **ARN** (per esempio di un profilo di inferenza di applicazione); viene salvato come `bedrock:<id>` e passato esattamente come lo scrivi, due punti compresi (vedi [Modello](/docs/agenten#modell)).

**Residenza dei dati solo UE.** Con l’interruttore attivo, prima della prima richiesta Nodestro verifica che la regione e ogni regione verso cui il modello o il profilo di inferenza può instradare siano regioni UE (Francoforte, Stoccolma, Milano, Spagna, Irlanda, Parigi); altrimenti non invia nulla. I profili di inferenza globali (`global.…`) vengono sempre rifiutati; Londra e Zurigo sono in Europa, ma non nell’UE. La verifica riguarda la configurazione con cui Nodestro invia le richieste. **Non garantisce** che AWS elabori tutto nell’UE: la registrazione delle invocazioni dei modelli, il rilevamento degli abusi con la relativa conservazione e le altre impostazioni del tuo account AWS sono fuori da Nodestro. Per imporlo su tutto l’account usa IAM e le policy di controllo dei servizi. Se il tuo gestore impone «solo UE», l’interruttore resta attivo.

**Verifica connessione.** Il pulsante accede ad AWS (`sts:GetCallerIdentity`) e fa una lettura gratuita su Bedrock (un elenco di modelli). **Nessun modello viene chiamato, quindi non costa nulla.** Poi il badge mostra *Connessione verificata* o *Verifica non riuscita* con il motivo; prima *Non configurato* o *Configurato*.

**Permessi IAM minimi** del ruolo o dell’utente:

- `bedrock:InvokeModel` e `bedrock:InvokeModelWithResponseStream` sul modello o sul profilo di inferenza (li usa l’API Converse); con un profilo di inferenza anche sul modello di base in ogni regione di destinazione;
- `bedrock:GetInferenceProfile` sul profilo (verifica «solo UE») e `bedrock:GetGuardrail` se usi un guardrail;
- `sts:GetCallerIdentity` e `bedrock:ListFoundationModels` per *Verifica connessione*.

**Prezzi.** Bedrock è fatturato **per regione**, mai con i prezzi di Anthropic, nemmeno per Claude. Un prezzo vale solo per le regioni che elenca; una regione non elencata ha un costo **sconosciuto**, mai 0, e la modalità prezzi rigorosa rifiuta allora la richiesta. Inserisci i tuoi prezzi con le relative regioni in [Prezzi dei modelli](/docs/nutzung#preise). La tua fattura AWS può contenere più di quanto conta Nodestro (per esempio la registrazione delle invocazioni, i guardrail o altri servizi AWS).

**Cosa offre Bedrock.** Tool, streaming, immagini e documenti PDF, output strutturato e sforzo di ragionamento dipendono dal modello; le opzioni che un modello non supporta, o il cui supporto è sconosciuto (un ARN scritto a mano, un profilo di inferenza di applicazione), Nodestro le mostra disattivate con il motivo. **Non disponibile su Bedrock**, nemmeno per Claude: tool del server come la ricerca web, modalità di ragionamento, le impostazioni di cache dei prompt di Anthropic, modelli di riserva, batch e citazioni.

**Tool e credenziali AWS.** Sul desktop Nodestro tiene le credenziali AWS lontane dai tool (variabili d’ambiente e ricerche dell’SDK AWS). Il codice dei tool nella sandbox semplice a sottoprocesso gira però con il tuo utente e potrebbe leggere direttamente i file in `~/.aws`. Se sul computer ci sono credenziali AWS reali, esegui i tuoi tool e quelli generati dall’IA nella sandbox integrata o in container (vedi [Sandbox](/docs/einstellungen#sandbox)).

**Risoluzione dei problemi per messaggio:**

| Messaggio | Cosa fare |
|---|---|
| Non sono state trovate credenziali AWS | Accedi (`aws sso login`), controlla il profilo o l’ambiente, poi *Verifica connessione*. |
| AWS non ha accettato le credenziali | Sono errate o scadute: accedi di nuovo. |
| AWS ha negato l’accesso | Concedi i permessi indicati sopra e abilita il modello nella console AWS. |
| Il profilo AWS … non esiste | Confronta il nome del profilo con `~/.aws/config`. |
| Non è un nome di regione AWS / non valida | Usa un nome come `eu-central-1`. |
| Non noto in questa regione | Usa un ID di modello o un profilo di inferenza offerto in questa regione. |
| Non raggiungibile | Controlla rete, proxy e regione. |
| Potrebbe violare la residenza dei dati solo UE | Usa una regione UE e un profilo `eu.` o un modello di quella regione. |
| Non disponibile su questo server | Chiedi al tuo gestore di assegnare un ruolo AWS all’area di lavoro. |

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

Gli amministratori impostano anche il **Budget massimo per esecuzione** (vuoto: nessun tetto): nessuna esecuzione può partire con un limite più alto né essere aumentata oltre. La **Scadenza delle decisioni sul budget** (da 1 a 720 ore, inizialmente 24) indica quanto un’esecuzione in pausa attende una [decisione sul budget](/docs/workflows#budget-freigabe) prima di fallire. Chi può decidere è spiegato in [Chi può decidere](/docs/workflows#budget-rechte).

## Sandbox {#sandbox}
<!-- keywords: scegliere la sandbox, automatica, docker, processo python, docker disponibile, sandbox integrata, sandbox linux, macos, windows, bloccato, sperimentale -->

Qui scegli dove vengono eseguiti gli strumenti. La modifica ha effetto subito.

| Modalità | I tuoi strumenti | Strumenti creati dall’IA e di origine sconosciuta |
|---|---|---|
| **Automatica** (predefinita, consigliata) | Processo Python | solo Docker, dopo che ha superato le verifiche di Nodestro; altrimenti **bloccati** |
| **Sandbox Linux** (facoltativa, solo Linux) | Processo Python | solo la sandbox Linux integrata, altrimenti **bloccati**; senza pacchetti Python di terze parti, quindi gli strumenti che ne hanno bisogno sono **bloccati**; Docker non viene usato |
| **Processo Python** (solo per uso fidato) | Processo Python | sempre **bloccati**; non vengono usati né Docker né la sandbox Linux integrata |
| **Docker** | Docker | Docker; se Docker non è in esecuzione, nessuno strumento viene eseguito |

Per il codice creato dall’IA Nodestro non ripiega mai su un processo non protetto, e *Automatica* non ripiega mai nemmeno sulla sandbox Linux integrata: viene usata solo se scegli **Sandbox Linux**. Se non hai mai scelto una modalità, Nodestro usa *Automatica*; una modalità scelta in una versione precedente resta invariata. Se in una versione precedente avevi scelto **Processo Python**, gli strumenti creati dall’IA ora sono bloccati: quella modalità non li esegue più in una sandbox integrata. Scegli **Automatica** e avvia Docker oppure, su Linux, **Sandbox Linux**.

Sotto la scelta Nodestro mostra:

- il **computer che esegue Nodestro** con il suo sistema operativo. È il computer del runtime di Nodestro, non il dispositivo del tuo browser: se apri Nodestro su un server da un Mac, conta il sistema del server;
- dove vengono eseguiti **adesso** gli strumenti creati dall’IA e i tuoi strumenti, oppure che sono **bloccati** e perché;
- ogni **sandbox su questo computer** con il suo stato: *Approvata* (può eseguire codice creato dall’IA), *Sperimentale, non usata*, *Non disponibile*, *Senza isolamento* (il processo Python) o *Non usata qui*.

La sandbox Linux integrata è approvata su Ubuntu 24.04 e Debian 13 (Intel o AMD a 64 bit) una volta superato il suo autotest; su ARM64 non è disponibile. Su macOS e Windows Nodestro non ha una sandbox nativa: la precedente sandbox sperimentale di macOS è stata rimossa, e la sua riga lo indica. Su entrambi i sistemi gli strumenti creati dall’IA richiedono quindi Docker o un motore compatibile. I dettagli sono in [La sandbox](/docs/tools#sandbox) e [Fiducia e isolamento](/docs/tools#vertrauen).

Su un server e in Nodestro Local Docker ogni strumento viene eseguito in un container; lì l’impostazione non si può cambiare.

## Installare Docker {#sandbox-docker}
<!-- keywords: installare docker, docker desktop, docker engine, macos, windows, linux, wsl, avviare docker, docker non in esecuzione, colima, orbstack, podman, rootless, gruppo docker, verifica del motore -->

Con *Automatica* gli strumenti creati dall’IA richiedono Docker o un motore dei container compatibile su ogni sistema; su Linux la modalità **Sandbox Linux** è l’unica alternativa, senza pacchetti di terze parti. Nodestro si avvia anche senza Docker; solo gli strumenti creati dall’IA restano bloccati finché non è in esecuzione un motore adatto. Nodestro trova da solo un motore in esecuzione e crea l’immagine del container al primo utilizzo.

- **macOS:** installa [Docker Desktop per Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon o Intel), aprilo una volta e attendi che indichi di essere in esecuzione. Anche [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) e [Podman](https://podman.io/) sono accettati, se superano le verifiche di Nodestro.
- **Windows:** installa [Docker Desktop per Windows](https://docs.docker.com/desktop/setup/install/windows-install/) con il backend WSL 2, riavvia se richiesto e avvia Docker Desktop. Deve eseguire container Linux. Anche Podman è accettato, se supera le verifiche di Nodestro.
- **Linux:** installa [Docker Engine](https://docs.docker.com/engine/install/) per la tua distribuzione. Consigliamo [Docker senza privilegi di root (rootless)](https://docs.docker.com/engine/security/rootless/) con la delega di cgroup v2, così i limiti vengono rispettati. Aggiungere il tuo utente al gruppo `docker` funziona, ma i membri del gruppo docker hanno di fatto i privilegi di root su questo computer. Anche Podman è accettato.

**Nodestro verifica il motore da solo.** Prima che un motore esegua codice creato dall’IA, Nodestro verifica i suoi limiti e il suo filtro delle chiamate di sistema (seccomp) e avvia un piccolo container di prova. Al suo interno il codice deve essere eseguito come utente senza privilegi né permessi speciali, senza rete, su un file system di sola lettura, con limiti applicati per memoria, processi, CPU e file aperti, e senza segreti nell’ambiente. Nodestro rifiuta un motore che non supera una verifica, qualunque sia il suo nome, e *Impostazioni → Sandbox* mostra quale verifica non è riuscita. Le verifiche non vengono mai allentate. Nodestro verifica in background, quindi la pagina non aspetta mai Docker; mentre la verifica è in corso, la riga di Docker indica *Verifica in corso* e si aggiorna da sola. Dopo aver avviato o modificato il motore, fai clic su **Verifica di nuovo**. Gli amministratori possono anche fare clic su **Esegui autotest** per avviare subito il container di prova (**Prepara la sandbox** finché manca l’immagine della sandbox). Solo gli amministratori avviano una nuova verifica, e al massimo ogni 10 secondi: altrimenti la pagina indica che non è stato verificato nulla di nuovo (e quando riprovare) e continua a mostrare l’ultimo risultato. Gli altri utenti vedono lo stato e ogni verifica senza dettagli tecnici.

Le verifiche del motore usate da Nodestro vengono eseguite nella CI su Docker Engine su Linux (con root su x86-64 e ARM64, senza root con la delega di cgroup v2 su x86-64), su Podman con root su Linux e, senza obbligo di superarle, su Colima su un Mac Intel; i test Docker di Nodestro vengono eseguiti su Docker Engine con root su Linux x86-64. Podman 4.9 senza root viene rifiutato nella CI, perché non applica i limiti di file e di file aperti della sandbox. **Docker Desktop non è mai stato eseguito nella CI**, né su macOS (Apple silicon o Intel) né su Windows (x64 o ARM64), e nemmeno OrbStack, Colima su Apple silicon e Podman machine; su di essi Nodestro si affida alle proprie verifiche sul tuo computer.

Poi apri *Impostazioni → Sandbox*: con **Automatica** Nodestro usa Docker appena è in esecuzione; compare *Docker disponibile* e gli strumenti creati dall’IA non sono più bloccati. Se Docker si arresta, tornano bloccati finché non è di nuovo in esecuzione; Nodestro non passa al processo Python.

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

Requisiti: Python 3.11 o successivo e Node.js 20 o successivo (solo per compilare l'interfaccia); Docker facoltativo.

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

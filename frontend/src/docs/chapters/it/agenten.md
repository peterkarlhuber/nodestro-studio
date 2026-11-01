# Agenti

Un agente è un modello di IA con un ruolo, un compito e strumenti facoltativi. Il modello può venire da Anthropic, OpenAI, Google Gemini o da un tuo server. Questo capitolo spiega ogni impostazione dell’ispettore, il suo effetto e i valori tipici.

## Nozioni di base {#grundlagen}
<!-- keywords: nome, descrizione, simbolo, icona, ispettore, struttura -->

Seleziona un agente sull'area di lavoro; l'ispettore ne mostra la configurazione. Le impostazioni più usate sono in alto, quelle meno frequenti in sezioni espandibili (*Strumenti*, *Conoscenza*, *Memoria*, *Formato di output*, *Ragionamento e impegno*, *Controllo qualità*, *Avanzate*). Accanto al titolo di ogni sezione c'è un riepilogo, per esempio «2 assegnati». Il riepilogo nomina ogni impostazione diversa da quella di un nuovo agente, per esempio «1 modello di riserva · nessuna cache» in *Avanzate*. I problemi restano visibili anche a sezione chiusa: il titolo mostra «1 errore» o «2 avvisi», e i link sotto *Problemi in*, in alto, aprono la sezione e la raggiungono. Una sezione resta aperta o chiusa come l'hai lasciata, anche sull'agente successivo e dopo un ricaricamento. Lo ricorda solo questo browser; il workflow e le sue esportazioni non cambiano.

- **Icona:** fai clic sull'icona in alto a sinistra per sceglierne un'altra. Serve solo per orientarsi.
- **Nome:** compare sull'area di lavoro ed è anche il segnaposto `{{Nome}}` per i successori.
- **Descrizione:** una frase sul ruolo dell'agente. Compare sul nodo ed è il punto di partenza per la progettazione con l'IA.

Con i simboli in alto a destra salvi l'agente come **modello** nella libreria, lo **duplichi** (Ctrl+D) o lo **elimini**.

## Modello {#modell}
<!-- keywords: modello, model, opus, sonnet, haiku, fable, prezzo, scelta, quale modello -->

Il modello determina capacità, velocità e prezzo. Scegli prima il **provider** e poi il **modello**: dall’elenco dei modelli noti o come qualsiasi id di modello del provider che digiti (per esempio un nuovo modello OpenAI o `llama3.1:8b` su Ollama). I provider non ancora configurati riportano la dicitura «non configurato». La tabella mostra i modelli noti con i prezzi per milione di token; «–» significa che il prezzo è sconosciuto. Per questi modelli i costi restano **sconosciuti** e non contano mai come 0.

<!-- widget: models -->

**Regole pratiche:**

- **Haiku 5.5** per classificare, estrarre e compiti brevi e ben definiti.
- **Sonnet 5.5** per la maggior parte dei compiti da agente; il predefinito per i nuovi agenti.
- **Opus 5.5** per ragionamenti impegnativi, pianificazione, codice e compiti lunghi con molti strumenti.
- **Fable 5.1** per i compiti più difficili, quando la qualità conta più del costo.

Il modello predefinito per i nuovi agenti si imposta nelle [impostazioni](/docs/einstellungen#modelle), gli accessi ai provider in [Provider di IA](/docs/einstellungen#anbieter). Alcune opzioni esistono solo per i modelli di Anthropic: thinking e visualizzazione dei ragionamenti, cache dei prompt, modelli di riserva e strumenti server. Con altri provider l’ispettore le nasconde; se una di esse è ancora impostata, il controllo segnala un errore invece di ometterla in silenzio.

**Amazon Bedrock:** gli ID di modello vengono passati esattamente come li scrivi, con due punti e barre: `bedrock:anthropic.claude-sonnet-4-5-20250929-v1:0`, `bedrock:eu.anthropic.claude-sonnet-5-5` o un ARN come `bedrock:arn:aws:bedrock:eu-central-1:111122223333:application-inference-profile/abc`. Solo i primi due punti separano il provider. I modelli dell’elenco sono suggerimenti, non modelli abilitati per il tuo account. Claude su Bedrock è un provider a sé: le opzioni solo Anthropic qui sopra restano disattivate anche per lui, e opzioni come l’output strutturato o lo sforzo di ragionamento seguono ciò che il modello supporta su Bedrock (sconosciuto per un ARN scritto a mano). Vedi [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).

## Prompt di sistema {#system-prompt}
<!-- keywords: prompt di sistema, system prompt, ruolo, istruzione, persona, prompt engineering -->

Il prompt di sistema descrive in modo permanente **chi** è l'agente e **come** lavora. Vale per ogni compito dell'agente e, con la cache attiva, viene riutilizzato a basso costo.

Un buon prompt di sistema contiene:

1. **Ruolo:** «Sei un analista finanziario specializzato in aziende industriali.»
2. **Metodo:** «Verifica periodo e unità di ogni numero. Calcola con lo strumento calcolatrice.»
3. **Livello di qualità:** «Indica esplicitamente le incertezze.»
4. **Output:** lingua, lunghezza, formato («Rispondi in italiano in massimo 200 parole, sotto forma di elenco.»).

Evita istruzioni legate all'input concreto; quelle vanno nel **compito**.

## Compito {#aufgabe}
<!-- keywords: compito, task, modello, segnaposto -->

Il compito è il messaggio che l'agente riceve a ogni esecuzione. Può contenere segnaposto: `{{input}}`, `{{run.input}}` e `{{Nome di un predecessore}}`. Le regole sono in [Segnaposto nei compiti](/docs/workflows#platzhalter).

Se il compito non contiene segnaposto, l'ispettore lo segnala: i risultati dei predecessori vengono allora aggiunti sotto `# Eingaben`.

## Assegnare strumenti {#tools}
<!-- keywords: assegnare strumenti, tools, strumenti server, ricerca web, recupero web, esecuzione di codice -->

Nella sezione **Strumenti** scegli dalla libreria degli strumenti quali funzioni può chiamare l'agente. L'elenco è raggruppato in *Integrati*, *Personali* e *Generati dall'IA*; passandoci sopra con il mouse compare la descrizione.

Sotto attivi gli **strumenti server di Anthropic**: *Ricerca web*, *Recupero web* ed *Esecuzione di codice*. Vengono eseguiti sui server di Anthropic (vedi [Strumenti server](/docs/tools#server-tools)). Gli strumenti server sono disponibili solo per i modelli di Anthropic.

L'agente decide da solo se e quando chiamare uno strumento, in base al nome e alla descrizione. Quante volte può farlo lo regolano [Turni di strumenti max. e Strumenti in parallelo](/docs/agenten#limits); se è obbligato, lo regola il [Tool choice](/docs/agenten#tool-choice).

## Assegnare conoscenza {#wissen}
<!-- keywords: assegnare conoscenza, file, pdf, contesto, su richiesta, ricerca, citazioni -->

Nella sezione **Conoscenza** assegni i file caricati e scegli **come** l'agente li riceve:

- **Nel contesto:** i file sono interamente nel prompt fin dall'inizio.
- **Su richiesta:** l'agente vede un catalogo e carica i file da solo (strumento `files`).
- **Ricerca:** l'agente cerca i passaggi pertinenti (strumento `search`).

**Attiva le citazioni** fa sì che le risposte rimandino ai passaggi esatti. Dettagli e consigli nel capitolo [Conoscenza](/docs/wissen#modi).

**Carica file**, nella stessa sezione, carica uno o più file direttamente in [Conoscenza](/docs/wissen#hochladen) e li assegna a questo agente. Il file viene salvato subito in modo permanente in Conoscenza e può essere usato anche da altri agenti; l’assegnazione è una normale modifica dell’agente e viene salvata con il workflow. *Annulla* o *Scarta* rimuovono solo l’assegnazione, non il file. I file che passi all’avvio di un’esecuzione non sono file di conoscenza: appartengono solo a quell’esecuzione.

## Memoria {#memory}
<!-- keywords: memoria, memory, note, per esecuzione, permanente, spazio -->

Nella sezione **Memoria** scegli *Disattivata*, *Per esecuzione* o *Permanente* e, per la memoria permanente, uno **spazio di memoria**. Puoi creare nuovi spazi direttamente qui. **Configura con l'IA** propone una struttura di file adatta. Tutto il resto è nel capitolo [Memoria](/docs/memory).

## Formato di output {#ausgabeformat}
<!-- keywords: formato di output, strutturato, json, schema, campi, pydantic, nome del campo, tipo, obbligatorio, output format -->

**Testo (Markdown)** è il predefinito: l'agente risponde liberamente.

**Strutturato (JSON)** obbliga l'agente a restituire un oggetto con campi fissi. Nodestro ne ricava uno schema JSON, l'API restituisce un oggetto conforme e il risultato viene verificato rispetto allo schema. I successori lo ricevono come JSON; l'esecuzione lo mostra formattato.

Ogni campo ha:

| Impostazione | Significato |
|---|---|
| **Nome del campo** | Chiave nel JSON, per esempio `summary` o `key_metrics`. Sono ammessi lettere, cifre e `_`; il nome non può iniziare con una cifra e deve essere univoco. Gli altri caratteri vengono sostituiti da `_` durante la digitazione. |
| **Tipo** | *Testo*, *Numero* (decimale), *Numero intero*, *Sì/No*, *Elenco (testo)* o *Elenco (numeri)*. |
| **Descrizione** | Spiega al modello cosa va nel campo. Più è precisa, meglio è. |
| **Obbligatorio** | I campi obbligatori sono sempre compilati; i campi facoltativi possono essere `null`. |

**Esempio** per una valutazione:

| Nome del campo | Tipo | Descrizione |
|---|---|---|
| `summary` | Testo | Sintesi in 2–3 frasi |
| `key_metrics` | Elenco (testo) | Gli indicatori principali con unità |
| `risk_score` | Numero intero | Rischio da 1 (basso) a 5 (alto) |
| `approved` | Sì/No | L'analisi è corretta? |

Il risultato appare così:

```json
{
  "summary": "Ricavi e margine sono cresciuti nettamente …",
  "key_metrics": ["Crescita dei ricavi 27,6%", "Margine EBIT 16,8%"],
  "risk_score": 2,
  "approved": true
}
```

**Limitazioni:**

- Un formato strutturato richiede almeno un campo.
- Le citazioni non si possono combinare con un formato strutturato.
- Se il modello rifiuta una richiesta, non c'è alcun oggetto; l'agente fallisce sempre, indipendentemente dall'impostazione *In caso di rifiuto*.

## Ragionamento e impegno {#denken}
<!-- keywords: impegno, effort, ragionamento, thinking, adattivo, between_tools, mostra il ragionamento, reasoning -->

L'**impegno (effort)** determina quanto a fondo lavora il modello: *Basso*, *Medio* (predefinito), *Alto*, *Molto alto* o *Massimo*. Un impegno maggiore significa più ragionamento, più token di output e costi più alti, ma dà risultati migliori nei compiti difficili. *Predefinito del modello* lascia la scelta al modello.

Il **ragionamento (thinking)** stabilisce se il modello riflette prima di rispondere:

| Impostazione | Effetto | Limitazione |
|---|---|---|
| *Predefinito del modello* / *Adattivo* | Il modello ragiona quando serve. | – |
| *Solo tra le chiamate agli strumenti* | Ragiona solo tra le chiamate agli strumenti, non prima della prima risposta. | Solo Sonnet 5.5 e solo fino all'impegno *Alto*. |
| *Disattivato* | Nessun ragionamento. | Non possibile con Opus 5.5, Sonnet 5.5, Fable 5.1 e Fable 5; con Opus 5 e Haiku 5.5 solo fino all'impegno *Alto*. |

**Mostra il ragionamento** stabilisce se le riflessioni compaiono nell'esecuzione: *Mostra in sintesi* (una sintesi del ragionamento), *Messaggi di avanzamento* (brevi aggiornamenti) o *Ometti*. Il ragionamento mostrato compare nella scheda *Ragionamento*. Questa impostazione non si può combinare con il ragionamento *Disattivato* o *Solo tra le chiamate agli strumenti*.

Il ragionamento conta come **token di output** e viene fatturato di conseguenza.

Se non è noto se un modello supporti lo sforzo di ragionamento (server propri, id di modello sconosciuti), uno sforzo impostato porta a un errore. Scegli allora *Predefinito del modello* oppure dichiara la capacità in [Provider di IA](/docs/einstellungen#anbieter). Gli endpoint compatibili con OpenAI (come Ollama o vLLM) non accettano alcuna impostazione dello sforzo; la verifica lo spiega, e **Imposta l’impegno sul predefinito del modello** corregge l’agente con un clic.

## Controllo qualità {#qualitaet}
<!-- keywords: controllo qualità, giudice, judge, valutatore, criteri, revisione, refine, llm as a judge, valutazione -->

Con il controllo qualità, un secondo modello, il **giudice**, verifica il risultato dell'agente:

1. L'agente svolge il suo compito.
2. Il giudice valuta il risultato **per criterio** come *superato* o *non superato*, con una motivazione. Vede anche le chiamate agli strumenti e i loro risultati.
3. Se un criterio obbligatorio non è superato, l'agente riceve la motivazione e rivede la risposta.
4. Questo si ripete fino al numero di **revisioni** impostato (0–5).

Il risultato del controllo compare nell'esecuzione accanto all'agente: superato o no, numero di tentativi e motivazione del giudice. Anche un risultato non superato viene trasmesso; l'esecuzione non fallisce per questo.

**Buoni criteri** si possono verificare singolarmente: «Ogni numero proviene da un risultato di uno strumento», «Cita almeno un rischio concreto», «Al massimo 150 parole». Criteri vaghi come «scritto bene» portano a giudizi poco affidabili.

**Costi:** ogni controllo e ogni revisione è una richiesta in più. I costi del giudice contano per l'agente e per il budget dell'esecuzione. Un controllo appena attivato parte con il modello predefinito delle impostazioni come **modello giudice**; puoi cambiarlo quando vuoi, e i controlli esistenti mantengono il loro modello. Anche gli agenti progettati dall'IA (*Progetta con l’IA* e l'architetto di workflow) ricevono il modello predefinito come giudice; il controllo resta disattivato. Se quel modello non può restituire un giudizio strutturato, la bozza lo dice e non viene scelto un altro modello. Il riepilogo della sezione nomina il giudice. Se il giudice è lo stesso modello dell'agente, un avviso lo segnala: un modello tende a valutare bene le proprie risposte.

## Limiti {#limits}
<!-- keywords: token max., max_tokens, turni di strumenti, max_tool_rounds, strumenti in parallelo, max_parallel_tools, limite -->

| Impostazione | Predefinito | Effetto |
|---|---|---|
| **Token max.** | 8.000 | Numero massimo di token di output per risposta, ragionamento compreso (fino a 128.000). Se viene raggiunto, l'agente si interrompe con `IncompleteResponseError`. |
| **Turni di strumenti max.** | 8 | Quanti turni di chiamate agli strumenti l'agente può fare per compito (0–50). Dopo termina con `MaxToolRoundsError`. Con 0 non può chiamare alcuno strumento. |
| **Strumenti in parallelo** | 1 | Quante chiamate agli strumenti di una risposta vengono eseguite contemporaneamente (1–16). Utile con strumenti lenti e indipendenti come le ricerche web. |

Aumenta *Token max.* per testi lunghi o impegno alto, e *Turni di strumenti max.* quando un agente ha bisogno di molti passaggi di ricerca.

## Tool choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, imporre, any, none, auto, scelta dello strumento -->

| Impostazione | Effetto |
|---|---|
| *Automatico* | Il modello decide se usare gli strumenti (predefinito). |
| *Nessuno strumento* | Il modello risponde senza chiamate agli strumenti. |
| *Imponi uno strumento qualsiasi* | La prima risposta deve essere una chiamata a uno strumento. |
| *Strumento specifico* | La prima risposta deve chiamare lo strumento scelto. |

Opus 5.5, Sonnet 5.5 e Fable 5.1 rifiutano le chiamate imposte; la verifica lo segnala. Lì usa *Automatico* con un'istruzione nel prompt di sistema, oppure un formato di output strutturato.

## Errori degli strumenti {#tool-fehler}
<!-- keywords: errori degli strumenti, raise_tool_errors, gestione degli errori, toolexecutionerror -->

Uno strumento può fallire in due modi:

- **Errori previsti** (lo strumento segnala per esempio «fuso orario sconosciuto»): l'agente riceve sempre il messaggio come risultato e può reagire.
- **Errori imprevisti** (input non valido, crash, timeout nella sandbox): con **Restituisci al modello gli errori degli strumenti** (predefinito: attivo) l'agente vede anche questi come risultato di errore. Se l'opzione è disattivata, l'agente termina con `ToolExecutionError`.

Le chiamate agli strumenti non riuscite sono contrassegnate nell'esecuzione con un simbolo di avviso.

## Cache del prompt {#caching}
<!-- keywords: cache, caching, prompt caching, ttl, 5 minuti, 1 ora -->

Con la **cache del prompt** attiva (predefinito), l'API memorizza l'inizio invariato di una richiesta (prompt di sistema, strumenti, conoscenza nel contesto, conversazione precedente). Le richieste successive lo leggono a una frazione del prezzo. Conviene con i turni di strumenti, i controlli qualità e le esecuzioni ripetute.

La **durata della cache** è di *5 minuti* o *1 ora*. Scrivere nella cache da 1 ora costa di più. Dettagli e prezzi in [Cache e costi](/docs/nutzung#caching).

## Rifiuti e modelli di riserva {#ablehnung}
<!-- keywords: rifiuto, refusal, fallback, modello di riserva, sicurezza, refusalerror -->

I modelli possono rifiutare richieste per motivi di sicurezza; a volte si tratta di un falso allarme.

**Se il modello rifiuta:**

- *Tratta come errore* (predefinito): l'agente fallisce con `RefusalError`; i successori vengono saltati.
- *Accetta comunque il testo della risposta:* il testo (di solito vuoto) viene trasmesso come risultato.

**Modelli di riserva:** se il modello rifiuta, l'API risponde alla stessa richiesta con il modello successivo dell'elenco. I costi sono calcolati per il modello che risponde. Sonnet 5.5 non supporta un elenco proprio; non usare modelli di riserva con esso.

## Messaggi di esempio {#beispiele-nachrichten}
<!-- keywords: esempi, few shot, messaggi di esempio, messages, dialogo -->

I messaggi di esempio precedono il compito vero e proprio e mostrano al modello il formato desiderato (few-shot prompting). Alternano **Utente** e **Assistente**, iniziano con un messaggio dell'utente e finiscono con una risposta dell'assistente. I messaggi vuoti vengono ignorati.

**Esempio:** Utente: «La consegna è arrivata danneggiata.» – Assistente: «Categoria: reclamo · Urgenza: alta».

## Request options {#request-options}
<!-- keywords: request options, opzioni di richiesta, betas, mcp, inference_geo, json, avanzate -->

Per utenti esperti: un oggetto JSON i cui campi vengono inseriti senza modifiche in ogni richiesta API dell'agente, come `betas` o impostazioni che Nodestro non offre separatamente. Il JSON non valido viene segnalato subito e non applicato. Valori errati provocano un errore dell'API solo durante l'esecuzione.

## Progettare un agente con l'IA {#ki-entwurf}
<!-- keywords: progettazione con ia, descrivi un agente, architetto, agent architect, creare automaticamente, dinamico -->

Invece di impostare tutto da te, descrivi l'agente con parole tue: compito, input, risultato desiderato, livello di qualità. L'**architetto degli agenti** (il modello degli assistenti definito nelle impostazioni) propone allora:

- nome, descrizione e un prompt di sistema completo,
- il modello adatto più economico e l'impegno adatto più basso,
- strumenti esistenti e strumenti server adatti,
- limiti per token e turni di strumenti.

Vedi la proposta con il costo della progettazione e la adotti solo con **Applica**; dopo resta tutto modificabile. Nell'editor, l'agente mantiene il compito precedente quando applichi.

Se all'architetto mancano capacità, indica gli **strumenti mancanti** con una descrizione. Puoi farli creare in [Strumenti → Crea con l'IA](/docs/tools#ki-erstellen). L'architetto usa solo modelli attuali, impegno al massimo *Molto alto*, al massimo 32.000 token e 20 turni di strumenti.

La proposta viene scritta nella lingua dell'interfaccia, a meno che la tua descrizione non chieda un'altra lingua. I nomi dei campi e gli altri identificatori tecnici restano in inglese.

Disponibile con **Progetta con l'IA** nell'ispettore, **Descrivi un agente** nella palette o nella pagina *Libreria di agenti*.

## Libreria di agenti {#bibliothek}
<!-- keywords: libreria, modello, template, riutilizzare, pagina agenti -->

Nella pagina **Libreria di agenti** gestisci modelli di agenti riutilizzabili:

- **Modello vuoto** o **Descrivi un agente** crea un nuovo modello.
- Nell'editor, il simbolo di salvataggio nell'ispettore salva un agente come modello.
- I modelli si modificano a destra con lo stesso modulo dell'editor; **Salva** applica le modifiche, **Scarta** ripristina l'ultimo stato salvato.
- Gli otto modelli più recenti compaiono nella palette dell'editor sotto **Dalla libreria**.

Un agente creato da un modello è una **copia**: le modifiche successive al modello non influiscono sugli agenti già inseriti.

## Testare un agente {#agent-testen}
<!-- keywords: testare, test, provare, testa agente, prova, eseguire da solo -->

**Testa agente** nell’ispettore (nell’editor e nella libreria di agenti) esegue solo questo agente con la sua **configurazione attuale, comprese le modifiche non salvate**:

1. Inserisci un **input di test**. Viene inserito nel compito come l’input di un’esecuzione; i segnaposto dei predecessori restano vuoti. Con *Invia l’input direttamente come compito* all’agente arriva solo il tuo testo.
2. **Avvia test** mostra la risposta, tutte le chiamate agli strumenti, errori, token, costo, durata e, se attivo, il controllo qualità.

Un test **non è un’esecuzione del workflow**: non compare in *Esecuzioni* e non cambia risultati. La memoria persistente viene solo letta; il test lavora su una copia. Un test chiama il provider del modello e **può costare denaro**; la finestra indica i prezzi del modello quando sono noti, e il costo compare nella pagina [Utilizzo](/docs/nutzung#statistik).

## Validazione e messaggi {#validierung}
<!-- keywords: validazione, messaggio di errore, problema, avviso, rosso, messaggio dell'ispettore -->

L'ispettore verifica ogni modifica con le regole della libreria, senza chiamare l'API:

- I **messaggi rossi** (errori) impediscono l'avvio, per esempio uno strumento sconosciuto, un nome di campo non valido, impostazioni di ragionamento non supportate dal modello o un controllo qualità senza criteri.
- I **messaggi gialli** (avvisi) consentono l'avvio, per esempio esecuzione di codice insieme alla ricerca web.
- Le **note grigie** informano, per esempio, che vengono aggiunti input perché il compito non contiene segnaposto.

I messaggi frequenti e le loro soluzioni sono in [Errori frequenti](/docs/faq#haeufige-fehler).

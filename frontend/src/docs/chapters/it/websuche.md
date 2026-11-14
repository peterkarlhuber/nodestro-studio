# Ricerca web e lettura di pagine web

Due strumenti integrati danno a un agente accesso al web: `search_web` cerca tramite un servizio di ricerca che scegli tu, e `fetch_web_page` legge una singola pagina. Questo capitolo spiega cosa fanno, come scegliere un servizio di ricerca, quanto costa, dove sono disponibili gli strumenti e come verificare quali fonti ha usato un'esecuzione.

## I due strumenti {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, ricerca web, leggere pagina, internet, strumento integrato -->

- **`search_web`** cerca nel web o nelle notizie e restituisce risultati con titolo, indirizzo, un breve estratto e, se nota, la data. Ha bisogno di un **servizio di ricerca**, una connessione di tipo *Ricerca web* (vedi [Connessioni ai servizi](/docs/verbindungen)).
- **`fetch_web_page`** legge una pagina (HTML, testo o PDF) e ne restituisce il testo. Non ha bisogno di una connessione. Gli indirizzi di rete interni, gli indirizzi con nome utente o password e le porte diverse da quelle web abituali vengono rifiutati.

Assegni entrambi come qualsiasi altro strumento nella sezione **Strumenti** dell'agente (vedi [Assegnare strumenti](/docs/agenten#tools)). L'inspector li contrassegna con il badge **Internet**. Una buona coppia: l'agente cerca con `search_web` e legge i risultati più promettenti con `fetch_web_page` prima di fidarsi di qualcosa di più di un estratto.

## Scegliere un servizio di ricerca {#suchdienst}
<!-- keywords: servizio di ricerca, provider, ddgs, brave, tavily, mojeek, searxng, provider di prova, chiave api -->

In *Strumenti → Connessioni → Configura servizio di ricerca* configuri un servizio di ricerca. Nodestro non ne sceglie nessuno per te: ogni scheda dice onestamente di cosa ha bisogno il servizio e cosa aspettarsi.

| Servizio | Chiave | Note |
|---|---|---|
| DDGS | no | Gratuito e senza alcuna garanzia. Usa altri motori di ricerca, che possono bloccarlo o cambiare in qualsiasi momento. Non disponibile su un server Nodestro. |
| Brave Search | sì | I risultati non possono essere salvati. Circa 5 USD ogni 1000 richieste. |
| Tavily | sì | Fatturato secondo il piano: inserisci il tuo prezzo per richiesta. |
| Mojeek | sì | Gestito in Europa. Fatturato secondo il piano: inserisci il tuo prezzo per richiesta. |
| SearXNG | facoltativa | Il tuo server: inserisci il suo indirizzo. |
| Provider di prova | qualsiasi | Provider di prova offline per fare esperimenti: risultati inventati, niente internet. |

Verifica tu stesso condizioni e prezzi di un servizio prima di usarlo; Nodestro non ne raccomanda nessuno. Poi assegna la connessione a `search_web` nell'inspector dell'agente.

## Costi e limiti {#kosten}
<!-- keywords: costi, prezzo per richiesta, budget, chiamate, risultati, domini consentiti, domini bloccati, avanzate -->

Una ricerca a pagamento costa denaro per ogni richiesta. Nodestro registra ogni richiesta al prezzo del servizio nei costi dell'esecuzione e controlla il budget dell'esecuzione prima di una richiesta a pagamento. Per Brave vale il prezzo pubblicato, a meno che la connessione non ne indichi uno proprio; Tavily e Mojeek hanno bisogno del prezzo per richiesta nella connessione, altrimenti `search_web` non viene chiamato. DDGS, SearXNG e il provider di prova non costano nulla in Nodestro.

In **Avanzate**, sotto ogni strumento web nell'inspector dell'agente, limiti ciò che l'agente può fare: il numero massimo di risultati per ricerca, regione, lingua e periodo delle ricerche, i **domini consentiti** e **bloccati**, il numero massimo di caratteri per pagina e il numero massimo di chiamate per esecuzione. I campi vuoti mantengono i valori predefiniti; `search_web` consente al massimo 10 chiamate per esecuzione, `fetch_web_page` al massimo 20.

## Modalità offline e server {#offline-server}
<!-- keywords: offline, modalità offline rigorosa, server, profilo server, operatore, non disponibile -->

Entrambi gli strumenti hanno bisogno di internet. Nella modalità offline rigorosa il controllo prima di un'esecuzione li rifiuta. Su un server Nodestro non vengono offerti: il controllo li segnala e ogni chiamata viene rifiutata. L'operatore del server può attivarli con `NODESTRO_WEB_TOOLS_SERVER=1`. DDGS non viene mai offerto su un server.

## Fonti di un'esecuzione {#quellen}
<!-- keywords: fonti, fonti web, registro delle fonti, S1, fonti citate, letta, solo risultato, risultato strutturato -->

Ogni risultato di ricerca e ogni pagina che gli strumenti web vedono vengono registrati nell'esecuzione con un identificativo (`S1`, `S2` …). La vista di dettaglio dell'esecuzione li mostra in **Fonti web** con titolo, dominio, ora e stato: **Letta** se la pagina è stata letta, **Solo risultato** se è comparsa solo in una ricerca. I link si aprono in una nuova scheda. Vengono conservati solo indirizzi e titoli, mai il testo della pagina, e solo in quell'esecuzione.

Puoi richiedere che un agente citi le sue fonti: in un risultato strutturato attiva **Cita fonti web** per un campo di testo o di elenco (vedi [Formato di output](/docs/agenten#ausgabeformat)). Ogni valore deve allora indicare una fonte registrata con il suo identificativo o il suo indirizzo. Se l'agente cita una fonte che non ha trovato, riceve una correzione; se lo fa di nuovo, il passo fallisce, così non viene mai consegnata una fonte inventata.

## Il testo delle pagine è un dato {#sicherheit}
<!-- keywords: sicurezza, prompt injection, manipolazione, contenuto esterno, non attendibile -->

I risultati di ricerca e i testi delle pagine provengono da estranei. Nodestro li segnala al modello come contenuto esterno: dati, non istruzioni. Le pagine possono comunque contenere tentativi di manipolare l'agente, ad esempio testo nascosto che gli chiede di ignorare il suo compito o di inviare dati altrove. Dai agli agenti con strumenti web solo gli altri strumenti di cui hanno bisogno, usa le [approvazioni](/docs/tools#freigabe) per gli strumenti che modificano qualcosa e controlla i risultati basati su fonti web prima di agire.

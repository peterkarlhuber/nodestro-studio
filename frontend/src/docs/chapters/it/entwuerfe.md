# Bozze di e-mail e di webhook

Gli agenti possono **preparare** un’e-mail o i dati di una chiamata webhook, ma non possono inviarli. La bozza finisce nei file di risultato dell’esecuzione; tu la controlli e la invii. Questo capitolo spiega i due strumenti di bozza, dove trovi le loro bozze, come verifichi una connessione con un invio di prova e perché Nodestro, per ora, non invia nulla da solo.

## Panoramica {#ueberblick}
<!-- keywords: bozza, bozza di e-mail, bozza di webhook, draft_email, draft_webhook, non invia, comunicazione, offline -->

Nodestro include due strumenti integrati della categoria *Comunicazione*:

- **Bozza di e-mail** (`draft_email`) scrive un’e-mail come file `.eml`.
- **Bozza di webhook** (`draft_webhook`) scrive i dati JSON di una chiamata webhook come file `.json`.

Entrambi hanno il badge **Non invia** nella pagina [Strumenti](/tools) e nella scelta degli strumenti dell’agente. Non hanno bisogno di Internet né di una connessione, funzionano offline e scrivono al massimo **10 bozze per esecuzione**. Assegnali a un agente come qualsiasi altro strumento (vedi [Assegnare strumenti](/docs/agenten#tools)) e indica all’agente nel suo compito quando scrivere una bozza, per esempio «Prepara un sollecito di pagamento al cliente per ogni fattura scaduta».

## Bozze di e-mail {#e-mail}
<!-- keywords: draft_email, eml, destinatari, a, cc, oggetto, html, allegati, indirizzo del mittente, from_address, programma di posta -->

Una bozza di e-mail contiene i destinatari (*A* e *Cc*, al massimo 50 in tutto), un oggetto su una riga (al massimo 200 caratteri), il testo e, se vuoi, una versione HTML. Dalla versione HTML Nodestro rimuove script, stili, immagini, moduli e tutto il resto tranne testo, titoli, elenchi, tabelle e link.

Gli **allegati** provengono solo dall’esecuzione stessa: dai file con cui è stata avviata e dai file di risultato che ha scritto fino a quel momento. Una bozza ha al massimo 10 allegati e, con essi, pesa al massimo 10 MB.

L’**indirizzo del mittente** lo imposti nell’agente: dopo aver assegnato lo strumento, gli strumenti dell’agente mostrano un’area espandibile con il campo *Indirizzo del mittente*. Il modello non lo vede e non lo modifica. Se il campo resta vuoto, il tuo programma di posta inserisce il mittente.

## Bozze di webhook {#webhook}
<!-- keywords: draft_webhook, json, dati, payload, json schema, schema, payload_schema, verifica -->

Una bozza di webhook contiene i dati JSON destinati in seguito a un webhook: un oggetto o un elenco, al massimo 256 KB.

Nell’area espandibile dello strumento nell’agente puoi salvare uno **schema dei dati** come oggetto JSON (JSON Schema). Lo strumento scrive allora solo dati che vi corrispondono; altrimenti l’agente riceve un errore con i punti che non corrispondono. Nodestro verifica queste parole chiave: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` e `maxItems`. Uno schema con altre parole chiave viene rifiutato, così non sembra mai più severo di quanto viene verificato.

## Bozze in un’esecuzione {#im-lauf}
<!-- keywords: file di risultato, scheda della bozza, scaricare, scarica .eml, apri nel programma di posta, non inviato, anteprima -->

Le bozze compaiono nella vista di dettaglio dell’esecuzione, in **File di risultato**, come una scheda a sé contrassegnata **Non inviato** (vedi [File di risultato](/docs/dateien#ergebnisdateien)). La scheda di una bozza di e-mail mostra mittente, destinatari, Cc, oggetto, se c’è una versione HTML, gli allegati con le loro dimensioni e la dimensione dell’intero messaggio. Nodestro non mostra il testo dell’e-mail; per leggerlo, apri il file.

- **Scarica .eml** salva la bozza.
- **Apri nel programma di posta** scarica lo stesso file. Aprilo con il tuo programma di posta, per esempio con un doppio clic. Molti programmi lo aprono come nuovo messaggio che puoi controllare, modificare e inviare; altri lo mostrano come messaggio ricevuto, che puoi inoltrare o copiare.

La scheda di una bozza di webhook mostra la dimensione e se i dati sono stati verificati con uno schema; **Scarica .json** li salva.

## Invio di prova di una connessione {#testversand}
<!-- keywords: invia test, invio di prova, indirizzo di prova, test_address, server di posta, smtp, webhook, limite, cinque all’ora, conferma, verificare -->

Se una connessione a un server di posta o a un webhook funziona davvero lo verifichi in *Strumenti → Connessioni* (vedi [Connessioni ai servizi](/docs/verbindungen#pruefen)). **Verifica connessione** contatta il servizio: con un server di posta Nodestro accede in modo cifrato e si disconnette; con un webhook interroga l’indirizzo senza inviare dati.

**Invia test** va un passo oltre e invia un messaggio di prova fisso:

- **Server di posta:** una breve e-mail di prova all’**indirizzo di prova** della connessione e a nessun altro. Per questo, inserisci il tuo indirizzo come *Indirizzo di prova* nelle impostazioni della connessione.
- **Webhook:** una piccola chiamata di prova firmata all’indirizzo del webhook, con il metodo della connessione. Qualsiasi risposta con uno stato 2xx vale come successo.

Prima di inviare qualcosa, una finestra di conferma indica esattamente dove va il test. Lo invii tu stesso, e Nodestro registra ogni tentativo con il tuo nome nelle modifiche della connessione. Solo gli amministratori possono fare test. Ogni connessione consente **al massimo 5 invii di prova all’ora**, e tutte le connessioni insieme al massimo 20 all’ora. Su un server Nodestro, la verifica e il test raggiungono un server di posta solo tramite le porte 25, 465, 587 e 2525.

## Perché nulla viene inviato automaticamente {#kein-versand}
<!-- keywords: nessun invio, inviare automaticamente, approvazione per chiamata, sicurezza, versione successiva, l’agente non invia -->

Un’e-mail o una chiamata webhook non si possono annullare. Per questo, in questa versione, nessun agente e nessun workflow può inviare qualcosa da solo: gli strumenti di bozza non hanno accesso alla rete, e l’invio di prova è possibile solo dall’interfaccia, da parte di una persona, mai da un’esecuzione.

Una versione successiva aggiungerà l’invio dai workflow, con un’**approvazione per ogni singola chiamata**: una persona vede destinatari e contenuto e decide prima che qualcosa parta. Fino ad allora le bozze sono la via sicura: l’agente scrive per te, l’invio resta a te.

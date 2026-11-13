# Connessioni ai servizi

Alcuni strumenti integrati raggiungono un servizio esterno, ad esempio una ricerca web, un server di posta o un webhook. Ciò di cui hanno bisogno per farlo (l’indirizzo, le impostazioni e un segreto) è una **connessione al servizio**. Questo capitolo spiega le schede degli strumenti, come configuri una connessione e come la usa un agente.

## Schede degli strumenti {#tool-steckbrief}
<!-- keywords: scheda, tool spec, categoria, rete, offline, tipo di connessione, limite di tempo, limite di chiamate, filtro -->

Ogni strumento integrato ha una **scheda**: la sua categoria (*Calcolo*, *Dati*, *Documenti*, *Internet*, *Comunicazione*), se ha bisogno di Internet, se **funziona offline**, quale tipo di connessione richiede, il suo limite di tempo e quante volte un agente può chiamarlo in un’esecuzione. La pagina [Strumenti](/tools) mostra queste informazioni come etichette e ti permette di filtrare gli strumenti integrati in base a esse.

Una chiamata che dura più del limite di tempo termina con un errore; quando uno strumento raggiunge il suo limite di chiamate, l’agente riceve un errore per le chiamate successive e risponde con ciò che ha. Nella modalità offline rigorosa, gli strumenti che richiedono Internet vengono rifiutati prima dell’avvio. Gli strumenti integrati di Nodestro sono descritti in [Strumenti integrati](/docs/tools#eingebaut).

## Configurare una connessione {#einrichten}
<!-- keywords: connessione, servizio, ricerca web, smtp, server di posta, webhook, impostazioni, fornitore -->

Gestisci le connessioni in *Strumenti → Connessioni*. **Aggiungi connessione** chiede il tipo (ricerca web, server di posta o webhook), il fornitore quando il tipo ne offre più di uno, un nome e le impostazioni del tipo, come l’indirizzo del server e l’indirizzo del mittente di un server di posta. Gli indirizzi devono usare `https` (sul tuo computer è consentito `http` verso un server locale) e non devono contenere una password; gli indirizzi interni vengono rifiutati.

Ogni connessione mostra gli host che può raggiungere, ricavati dalle sue impostazioni, e gli agenti che la usano. Solo gli amministratori possono aggiungere, modificare, verificare o eliminare le connessioni; gli altri le vedono in sola lettura. Nodestro registra chi ha modificato quale connessione, mai i valori.

Una connessione che gli agenti usano ancora non viene eliminata subito: Nodestro elenca gli agenti e offre **Elimina comunque**. La loro verifica segnala poi la connessione mancante.

## Il segreto {#geheimnis}
<!-- keywords: segreto, chiave api, password, chiave di firma, archivio, cifrato, sessione -->

Una connessione ha al massimo un segreto: una chiave API, una password o una chiave di firma. Lo imposti nei dettagli della connessione dopo il salvataggio. Il segreto è **di sola scrittura**: Nodestro non lo mostra mai più, né nell’interfaccia, né nelle esportazioni, né nei log. Vedi solo **Segreto impostato** o **Nessun segreto** e dove è conservato.

I segreti vengono salvati cifrati, come i token di accesso dei servizi collegati: sul desktop con una chiave del portachiavi del sistema operativo, su un server con la chiave del server, separatamente per ogni tenant. Senza un archivio sicuro per le chiavi, il segreto vale **solo per questa sessione** e va reinserito dopo un riavvio. **Sostituisci segreto** lo sovrascrive, **Rimuovi segreto** lo cancella.

## Verificare una connessione {#pruefen}
<!-- keywords: verifica, stato, funziona, verifica non riuscita, codice di errore -->

**Verifica connessione** prova la connessione e mostra il risultato: *Funziona*, *Verifica non riuscita* o *Non verificata*, con l’ora della verifica e, in caso di errore, il codice di errore. Per ora, per i server di posta e i webhook vengono controllate solo le impostazioni; il servizio non viene ancora contattato. Se cambi le impostazioni, il fornitore o il segreto, lo stato torna a *Non verificata*. Una connessione non ancora verificata con successo compare come avviso nel controllo prima di un’esecuzione.

## Usare una connessione in un agente {#zuweisen}
<!-- keywords: agente, ispettore, impostazioni dello strumento, scelta della connessione -->

Quando assegni uno strumento integrato che richiede una connessione, l’ispettore dell’agente mostra sotto gli strumenti una scelta con le connessioni del tipo giusto (vedi [Assegnare strumenti](/docs/agenten#tools)). Senza una connessione scelta, il controllo dell’agente segnala un errore. Il modello non vede mai la connessione, le sue impostazioni o il suo segreto; vede solo lo strumento.

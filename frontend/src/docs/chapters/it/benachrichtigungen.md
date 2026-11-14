# Notifiche

Nodestro ti avvisa sulla **campanella** nella barra superiore quando qualcosa richiede la tua attenzione: un’esecuzione non è riuscita, un passaggio attende la tua approvazione o un agente ti ha scritto un messaggio. Le notifiche restano dentro Nodestro; non viene inviato nulla per e-mail.

## Cosa genera notifiche {#ueberblick}
<!-- keywords: notifica, campanella, evento, esecuzione non riuscita, approvazione, decisione sul budget, controllo qualità, esecuzione terminata, posta in arrivo -->

Una notifica viene creata per questi eventi di un’esecuzione:

- **Un’esecuzione non riesce**: l’esecuzione è terminata con un errore.
- **Un passaggio attende l’approvazione**: un passaggio di approvazione attende la decisione di una persona.
- **Un’esecuzione attende una decisione sul budget**: il budget dell’esecuzione è esaurito e qualcuno deve aumentarlo o terminare l’esecuzione (vedi [Decisioni sul budget durante un’esecuzione](/docs/workflows#budget-freigabe)).
- **Un controllo qualità non viene superato**: un risultato non ha superato il suo controllo, per esempio quello di un giudice (vedi [Controllo qualità](/docs/agenten#qualitaet)).
- **Un’esecuzione termina**: ogni esecuzione terminata, anche quelle riuscite.

Inoltre un agente può scriverti un breve messaggio con lo strumento **Messaggio per me** (vedi sotto).

## Regole per workflow {#regeln}
<!-- keywords: regole di notifica, impostazioni del workflow, eventi, predefinito, esecuzioni non riuscite, approvazioni, disattivare -->

Ogni workflow decide quali dei suoi eventi generano notifiche. Apri il workflow nell’editor, fai clic su un punto vuoto dell’area di lavoro in modo che nessun passaggio sia selezionato e cerca la sezione **Notifiche** nelle impostazioni del workflow (vedi [Impostazioni del workflow](/docs/workflows#einstellungen)). Spunta gli eventi che vuoi; le regole vengono salvate con il workflow, come il suo budget e i suoi limiti.

Per impostazione predefinita un workflow notifica le **esecuzioni non riuscite** e i **passaggi in attesa di approvazione**. Anche i workflow salvati prima dell’arrivo delle notifiche ricevono questa impostazione predefinita. Togli la spunta a tutti gli eventi per disattivare le notifiche di un workflow. Notificare ogni esecuzione terminata è utile per esecuzioni rare e importanti; con esecuzioni frequenti diventano presto molte.

## Chi riceve la notifica {#empfaenger}
<!-- keywords: destinatari, membri, chi ha avviato, accesso, chi riceve la notifica, persona che ha avviato -->

Nella stessa sezione scegli chi riceve le notifiche:

- **Tutti con accesso**: tutte le persone che possono vedere il workflow. Nell’app desktop sei tu.
- **Solo chi ha avviato l’esecuzione**: le altre persone con accesso non ricevono notifiche.

## La campanella {#glocke}
<!-- keywords: campanella, non letta, contatore, badge, segna come letta, segna tutte come lette, apri l’esecuzione, carica altre, tastiera, esc -->

Il numero sulla campanella conta le tue notifiche non lette. Fai clic sulla campanella (oppure dalle il focus e premi Invio) per aprire l’elenco, con le più recenti in cima. Ogni voce mostra cosa è successo, il workflow e quando. Le voci non lette sono evidenziate.

- **Apri l’esecuzione** apre la vista di dettaglio dell’esecuzione e segna la voce come letta (vedi [La vista di dettaglio](/docs/ausfuehrungen#details)).
- **Segna come letta** (il segno di spunta) segna una singola voce, **Segna tutte come lette** tutte.
- **Carica altre** mostra le notifiche più vecchie.
- Esc chiude l’elenco e torna alla campanella.

Nodestro legge il numero delle notifiche non lette circa una volta al minuto finché la finestra è visibile, e l’elenco completo ogni volta che lo apri. Gli screen reader annunciano le nuove notifiche senza interrompere.

## Messaggi degli agenti {#agenten-nachrichten}
<!-- keywords: notify_user, messaggio per me, messaggio di un agente, strumento, livello, titolo, tre messaggi, testo semplice, da un agente -->

Lo strumento integrato **Messaggio per me** (`notify_user`) permette a un agente di inviarti un breve messaggio con un titolo, il testo e un livello (info, successo, avviso o errore). Assegnalo a un agente come qualsiasi altro strumento (vedi [Assegnare strumenti](/docs/agenten#tools)) e scrivi nel compito dell’agente quando usarlo, per esempio «Mandami un messaggio se trovi un contratto con un preavviso inferiore a 30 giorni».

- Un agente può inviare **al massimo 3 messaggi per esecuzione**. I tentativi successivi vengono rifiutati e l’agente lo viene a sapere.
- Il messaggio appare come **testo semplice**: senza formattazione e senza link cliccabili. È contrassegnato chiaramente come **Da un agente**, perché l’ha scritto un modello. Trattalo come qualsiasi altro output di un modello.
- Lo strumento non invia nulla fuori da Nodestro e funziona offline.

## Conservazione e privacy {#aufbewahrung}
<!-- keywords: conservazione, 90 giorni, eliminare, e-mail, webhook, privacy, server, posta della piattaforma, dentro nodestro -->

Le notifiche vengono conservate per **90 giorni** e poi eliminate, lette o no.

Niente lascia Nodestro: nessuna e-mail, nessun webhook, nessuna notifica push. L’invio di notifiche verso altre destinazioni è previsto per una versione successiva.

Su un server Nodestro collegato alla posta in arrivo della piattaforma, la campanella mostra quella posta invece di quella di Nodestro. Le sue notifiche possono arrivare in inglese e con una formulazione propria; le regole per workflow valgono allo stesso modo.

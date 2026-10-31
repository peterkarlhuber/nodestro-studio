# Architetto di workflow IA

L’architetto di workflow progetta un workflow multi-agente completo a partire da una descrizione in linguaggio naturale, oppure rielabora un workflow esistente. Pianifica gli agenti, scrive i loro prompt, sceglie modelli, strumenti, conoscenza e memoria, collega tutto e verifica il risultato. Si limita a proporre: niente viene salvato, sovrascritto o eseguito senza la tua decisione.

## Panoramica {#ueberblick}
<!-- keywords: architetto, ia, bozza, generare, automatico, creare workflow, assistente -->

Trovi l’architetto in due punti:

- **Crea con l’IA** nella finestra per un nuovo workflow, nella pagina *Workflow*.
- **Architetto IA** nella barra dell’editor, con le modalità **Progettare un nuovo workflow** e **Rielaborare questo workflow**.

Entrambi usano la stessa logica. L’architetto lavora in otto passaggi: analizzare i requisiti, pianificare l’architettura, verificare le risorse, configurare gli agenti, scrivere gli strumenti, creare i collegamenti, validare il workflow e presentare la bozza. Per la validazione usa lo stesso [controllo prima dell’avvio](/docs/workflows#pruefung) dell’editor.

Costruisce nel modo più semplice possibile: solo gli agenti di cui il compito ha bisogno, e passaggi paralleli solo dove sono davvero indipendenti. Quando il compito lo richiede, pianifica anche [decisioni, approvazioni](/docs/verzweigungen), un modulo di input e file di risultato; non ci sono cicli. Se preferisci partire da un modello pronto, guarda gli [esempi](/docs/beispiele).

La via manuale resta invariata: puoi sempre creare e modificare qualsiasi workflow senza IA.

## Creare un nuovo workflow {#neu-erstellen}
<!-- keywords: nuovo, creare, descrizione, progetto, crea con l’ia -->

Descrivi cosa vuoi ottenere: l’obiettivo, gli input, i risultati attesi e i vincoli importanti. I dettagli mancanti l’architetto li completa con ipotesi che ti mostra dopo. **Progetta workflow** lo avvia.

Alla fine vedi la bozza da controllare. **Crea workflow** la salva come nuovo workflow con la versione 1 nella [cronologia delle versioni](/docs/workflows#versionen) e la apre nell’editor. Prima puoi cambiare il nome. Il nuovo workflow è come uno [creato a mano](/docs/workflows#anlegen) e non viene mai eseguito automaticamente.

## Rielaborare un workflow esistente {#ueberarbeiten}
<!-- keywords: rielaborare, modificare, estendere, aggiungere agente, revisione, diff, annulla -->

Nell’editor scegli **Rielaborare questo workflow** e descrivi la modifica, per esempio: «Aggiungi prima del risultato un agente che esamini in modo critico le analisi precedenti.» L’architetto tiene conto di agenti, impostazioni e collegamenti del workflow, comprese le modifiche non salvate nell’editor.

Cambia solo ciò che la descrizione chiede. Gli agenti che non menziona restano invariati, con i loro prompt, strumenti e posizioni. La proposta è una bozza separata; la vista **Modifiche** mostra gli agenti aggiunti, modificati e rimossi con i campi cambiati, oltre ai collegamenti nuovi e rimossi.

**Applica modifiche** applica la bozza nell’editor come un unico passo, che **Annulla** revoca completamente. Non viene salvato nulla finché non [salvi](/docs/workflows#speichern); la nuova versione nella [cronologia delle versioni](/docs/workflows#versionen) riceve allora automaticamente una nota sulla rielaborazione con IA.

Se hai modifiche non salvate, la verifica offre **Salvare prima lo stato attuale come versione**. Se il workflow è stato modificato nell’editor mentre l’architetto lavorava, la verifica te lo segnala prima di applicare.

## Seguire l’avanzamento {#fortschritt}
<!-- keywords: avanzamento, dal vivo, attività, registro, passaggi, anteprima, grafo, contrassegni -->

Mentre l’architetto lavora, vedi tre cose:

- **Passaggi:** quali degli otto passaggi sono conclusi e quale è in corso.
- **Attività:** un registro di ciò che è davvero successo, per esempio quali ruoli sono stati pianificati, quali strumenti esistenti sono stati trovati o quali collegamenti sono stati corretti.
- **Anteprima del workflow:** il workflow cresce dal vivo. I contrassegni mostrano quali agenti sono nuovi, modificati, invariati, rimossi o ancora in configurazione.

Tutto ciò che vedi si basa su eventi reali del server. Non ci sono percentuali stimate né stati intermedi inventati, e il ragionamento interno del modello non viene mostrato.

## Domande e ipotesi {#rueckfragen}
<!-- keywords: domanda, ipotesi, ambiguo, lingua, poco chiaro -->

L’architetto fa una domanda solo quando senza la risposta non è possibile un workflow sensato. Allora rispondi con **Rispondi e continua**, oppure lo lasci decidere con **Continua con ipotesi**. In tutti gli altri casi fa delle ipotesi e le elenca nella verifica.

Scrive prompt, nomi e descrizioni nella lingua dell’interfaccia (vedi [Lingua](/docs/einstellungen#sprache)), a meno che la tua descrizione non ne chieda espressamente un’altra. Identificatori tecnici, nomi dei campi dell’output strutturato, nomi degli strumenti e codice restano in inglese. Quando rielabora, non traduce mai i contenuti esistenti.

## Verificare la bozza {#pruefen}
<!-- keywords: verifica, revisione, validazione, bozza, accettare, scartare, garanzia -->

La verifica mostra:

- **Panoramica:** i requisiti analizzati, le ipotesi, il costo e il risultato della validazione con tutti gli avvisi.
- **Modifiche** (solo nella rielaborazione): cosa cambia rispetto al workflow nell’editor.
- **Agenti:** ruolo, modello, prompt di sistema, compito, strumenti, conoscenza, memoria e output strutturato di ogni agente.
- **Flusso di dati:** quali risultati riceve ogni agente; i compiti vi fanno riferimento con i [segnaposto](/docs/workflows#platzhalter).
- **Strumenti:** nuove bozze di strumenti con codice e test.

I problemi risolvibili senza IA, come collegamenti mancanti o segnaposto errati, l’architetto li corregge da solo. Ciò che dopo blocca ancora lo fa correggere all’IA, ma solo un numero limitato di volte. I problemi rimanenti compaiono nella verifica.

Un [controllo](/docs/workflows#pruefung) superato significa che il workflow può essere eseguito tecnicamente. Non garantisce risultati corretti: leggi i prompt e prova il workflow con input reali. **Scarta bozza** elimina la bozza insieme alle sue bozze di strumenti; **Modifica descrizione** avvia una nuova bozza.

## Approvare nuovi strumenti {#tools-freigeben}
<!-- keywords: strumento, bozza, approvazione, codice, sandbox, provare, registrare, sicurezza -->

L’architetto preferisce gli strumenti esistenti. Solo se nessuno è adatto e **Scrivere come bozza gli strumenti mancanti** è attivo, scrive un nuovo strumento Python con test. Il codice viene solo controllato staticamente e non viene mai eseguito, nemmeno nella [sandbox](/docs/tools#sandbox).

Una bozza di strumento non è registrata. Vedi codice e test nella verifica e in *Strumenti*, tra le bozze di strumenti. **Prova nella sandbox** esegue i test; **Approva e registra** li riesegue e aggiunge lo strumento alla libreria solo se i test passano, come nella normale [approvazione](/docs/tools#freigabe). **Rifiuta** elimina la bozza.

Finché uno strumento non è approvato, il controllo segnala il workflow come bloccato e non si può avviare. Le regole di sicurezza esistenti per il codice personalizzato restano invariate. Anche le assegnazioni di conoscenza e memoria sono solo proposte, che modifichi nell’editor.

Le bozze di strumenti sono generate dall’IA: testarle e approvarle richiede la sandbox Docker (vedi [Fiducia e isolamento](/docs/tools#vertrauen)).

## Costi e limiti {#kosten}
<!-- keywords: costo, limite, budget, correzioni, utilizzo, prezzo, usd -->

Ogni bozza chiama l’IA più volte: per l’analisi, il piano, ogni agente, le bozze di strumenti e le correzioni. Il costo finora lo vedi dal vivo nell’avanzamento e nella verifica. Ogni chiamata compare esattamente una volta nella [panoramica dell’utilizzo](/docs/nutzung#statistik) sotto *Architetto di workflow*, suddivisa per passaggio.

In *Impostazioni*, insieme ai [modelli](/docs/einstellungen#modelle), fissi il **limite di costo** per bozza (vuoto significa nessun limite) e quante **correzioni con IA** sono permesse (da 0 a 5). Raggiunto il limite, l’architetto si ferma. Non avvia mai un’esecuzione di workflow e non chiama servizi esterni a pagamento.

## Annullare {#abbrechen}
<!-- keywords: annullare, fermare, chiudere, scartare, sicuro -->

**Annulla generazione** ferma l’architetto in qualsiasi momento. Non viene salvato nulla e nessun workflow viene modificato; il costo maturato fino a quel momento resta nella panoramica dell’utilizzo. Se chiudi la finestra durante la verifica, Nodestro chiede conferma prima di scartare la bozza.

## Limiti {#grenzen}
<!-- keywords: limiti, restrizioni, massimo, agenti, cicli -->

- Una bozza ha al massimo dieci agenti; i cicli nel flusso vengono rimossi.
- Valgono le stesse [restrizioni](/docs/workflows#grenzen) di ogni workflow: niente cicli. L'architetto non pianifica sotto-workflow; aggiungili tu se servono.
- L’architetto conosce solo ciò che è nella tua descrizione, nel workflow e nella libreria. La correttezza dei contenuti devi verificarla tu.

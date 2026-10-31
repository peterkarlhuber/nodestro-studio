# Termini

I termini più importanti di Nodestro, ciascuno spiegato brevemente con il capitolo che ne parla in dettaglio. I termini simili vengono qui distinti espressamente.

## Workflow {#workflow}
<!-- keywords: workflow, flusso, nodo, collegamento, avvio, risultato -->

Un **workflow** è una sequenza di nodi: un avvio, agenti, decisioni, approvazioni e un risultato. I collegamenti decidono quale passo riceve i risultati di quale altro. Maggiori dettagli in [Nodi](/docs/workflows#knoten).

## Agente {#agent}
<!-- keywords: agente, ia, modello, prompt di sistema, compito, libreria -->

Un **agente** è un passo in cui un modello di IA svolge un compito: con prompt di sistema, compito e, facoltativamente, strumenti, conoscenza e memoria. Gli agenti della **libreria agenti** sono modelli; ogni workflow lavora con una propria copia. Maggiori dettagli in [Agenti](/docs/agenten#grundlagen).

## Strumento {#tool}
<!-- keywords: strumento, tool, funzione, sandbox -->

Uno **strumento** è una funzione che un agente può chiamare mentre lavora, come una calcolatrice o il tuo codice Python. Il modello decide quando usarlo; i tuoi strumenti vengono eseguiti in una sandbox. Maggiori dettagli in [Strumenti](/docs/tools#ueberblick).

## Conoscenza {#wissen}
<!-- keywords: conoscenza, knowledge, documenti, permanente, ricerca -->

La **conoscenza** è un insieme di documenti che restano salvati e vengono assegnati agli agenti, per esempio un manuale o un listino prezzi. Sono disponibili in ogni esecuzione di quegli agenti finché non li elimini. Maggiori dettagli in [Conoscenza](/docs/wissen#ueberblick).

## File di input {#eingabedatei}
<!-- keywords: file di input, file, caricamento, esecuzione, singolo, differenza conoscenza -->

Un **file di input** viene caricato all’avvio di un’esecuzione, per esempio il contratto da esaminare. Appartiene solo a quell’esecuzione e non entra nella conoscenza. Ciò che serve a più esecuzioni va nella conoscenza. Maggiori dettagli in [Input o conoscenza?](/docs/datei-eingaben#eingabe-oder-wissen).

## Memoria {#memory}
<!-- keywords: memoria, memory, note, spazio di memoria -->

La **memoria** è fatta di note che un agente scrive e rilegge da sé. *Per esecuzione* dura un’esecuzione; *permanente* si trova in uno spazio di memoria e resta tra un’esecuzione e l’altra. A differenza della conoscenza, la memoria la scrive l’agente stesso. Maggiori dettagli in [Tipi di memoria](/docs/memory#arten).

## Esecuzione {#ausfuehrung}
<!-- keywords: esecuzione, run, stato, risultato -->

Un’**esecuzione** è un singolo passaggio di un workflow con un input specifico. Ha uno stato, dei costi, un risultato e una vista di dettaglio per ogni passo. Maggiori dettagli in [Stato](/docs/ausfuehrungen#status).

## Versione {#version}
<!-- keywords: versione, salvare, cronologia, ripristinare -->

Ogni salvataggio che modifica qualcosa crea una **versione** numerata del workflow. Puoi visualizzare, confrontare e ripristinare le versioni precedenti. Maggiori dettagli in [Versioni](/docs/workflows#versionen).

## Pubblicazione (versione API) {#veroeffentlichung}
<!-- keywords: pubblicazione, release, versione api, pubblicare, api -->

**Pubblicare** congela una versione salvata come API. Ogni pubblicazione riceve un proprio numero; le modifiche successive nell’editor non la cambiano. Gli strumenti vengono congelati con essa; l’API legge la conoscenza e la memoria permanente in tempo reale. Maggiori dettagli in [Pubblicare](/docs/api-und-export#veroeffentlichen).

## Serie di test {#testreihe}
<!-- keywords: serie di test, test, caso di test, regola di controllo, qualità -->

Una **serie di test** contiene casi di test fissi con input e regole di controllo per un workflow. Un test li esegue su una versione specifica e mostra quanti casi sono stati superati. Maggiori dettagli in [Serie di test](/docs/automatisierung#testreihen).

## Approvazione {#freigabe}
<!-- keywords: approvazione, persona, approvare, rifiutare -->

Un’**approvazione** è un passo in cui l’esecuzione si ferma finché una persona non approva o rifiuta il risultato ottenuto fin lì. Maggiori dettagli in [Approvazione](/docs/verzweigungen#freigabe).

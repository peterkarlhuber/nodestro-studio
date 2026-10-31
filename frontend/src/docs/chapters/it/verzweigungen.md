# Ramificazioni e approvazioni

Un workflow può essere più di una catena fissa di agenti: una **decisione** sceglie un percorso secondo regole fisse, un'**approvazione** ferma l'esecuzione finché una persona approva o rifiuta, e un **sotto-workflow** esegue un altro workflow come un unico passaggio. In più ci sono i **moduli di input** per input strutturati e la possibilità di **continuare** le esecuzioni non riuscite. Tutto gira sullo stesso motore di qualsiasi altro workflow.

## Decisioni {#entscheidung}
<!-- keywords: decisione, ramo, condizione, if, router, scambio, regola, instradamento -->

Una **decisione** (tavolozza, gruppo *Controllare il flusso*) controlla un risultato con regole fisse e apre i rami corrispondenti. **Non fa alcuna richiesta all'IA** e non costa nulla; l'esito è sempre ricostruibile.

- Ogni regola è un **ramo** con una propria uscita a destra del nodo. C'è sempre anche il ramo **Altrimenti**, scelto quando nessuna regola è valida.
- Trascina i collegamenti dal punto di ciascun ramo all'agente successivo. Un collegamento dal nodo stesso non è possibile; in quel caso l'editor ti chiede di scegliere un ramo.
- **Risultato controllato:** vuoto significa il risultato che arriva dal collegamento in entrata. Se ne arrivano più di uno, scegline uno. Si possono controllare anche i valori di un [modulo di input](/docs/verzweigungen#eingabeformular).
- Gli agenti sui rami non scelti vengono **saltati**. Non è un errore; l'esecuzione può comunque risultare *Completato*.

Nell'esecuzione, la decisione mostra quali regole erano valide, quale valore è stato controllato e, se è il caso, perché è stato scelto *Altrimenti*.

## Regole {#regeln}
<!-- keywords: regola, operatore, confronto, uguale, contiene, maggiore, minore, vuoto, campo, json, modalità -->

Una regola confronta un **campo** del risultato con un **valore**. Il campo è un percorso in un output strutturato, per esempio `category` o `customer.tier`; vuoto significa l'intero risultato. Un testo che contiene JSON (anche in un blocco di codice) viene letto come dati.

| Confronto | Significato |
|---|---|
| è uguale a, è diverso da | testo, numero o sì/no; maiuscole e minuscole solo su richiesta |
| contiene, non contiene, inizia con, finisce con | testo |
| maggiore di, maggiore o uguale a, minore di, minore o uguale a | numeri o date (AAAA-MM-GG) |
| è vero, è falso | sì/no (anche «sì», «yes», «true», «1») |
| è uno tra, non è nessuno tra | un elenco, valori separati da virgole |
| è vuoto, non è vuoto | valori mancanti o vuoti, o elenchi vuoti |

- **Modalità:** *Prima regola valida* apre esattamente un ramo (l'ordine conta). *Tutte le regole valide* apre ogni ramo valido; questi girano poi in parallelo.
- **Dati non validi:** se il campo manca o il tipo non va bene (per esempio «maggiore di» su un testo), la decisione prende il ramo *Altrimenti* o fallisce, a seconda dell'impostazione.

Perché le regole funzionino in modo affidabile, dai all'agente precedente un [output strutturato](/docs/agenten#ausgabeformat) con campi fissi.

## Unire i rami {#zusammenfuehren}
<!-- keywords: unire, merge, combinare rami, saltato, bloccato -->

Un nodo attende che tutti i suoi predecessori abbiano finito. **Viene eseguito** appena almeno un collegamento in entrata fornisce dati, viene **saltato** se nessuno ne fornisce ed è **bloccato** se un predecessore non è riuscito.

Unire i rami quindi non richiede impostazioni: un agente dietro entrambi i rami di una decisione viene eseguito con ciò che arriva. Il segnaposto di un ramo che non è stato eseguito vale «-». Il [controllo prima dell'avvio](/docs/workflows#pruefung) segnala questi punti.

Decisioni e approvazioni lasciano passare i dati: un agente dietro di esse riceve i risultati arrivati lì, con il nome degli agenti che li hanno prodotti.

## Cicli {#schleifen}
<!-- keywords: ciclo, loop, ripetere, giro, iterazione, ciclo di qualità, rivedere, feedback, limite -->

Un **ciclo** riesegue dei passi finché un risultato va bene, per esempio *Bozza → Revisione → Decisione*: se la revisione non è superata, l’esecuzione torna alla bozza.

- **Crearlo:** trascina un collegamento da un **ramo** di una decisione o di un’approvazione verso un passo precedente. Nodestro lo crea come ciclo (tratteggiato, con «↻ max. 3×») e lo apre nell’ispettore. Non si può tornare indietro da un agente: ogni giro termina con una decisione o un’approvazione.
- **Limite:** *Giri al massimo* (da 2 a 20) include la prima esecuzione. Ogni giro consuma di nuovo token; il [budget](/docs/workflows#budget) vale per l’intera esecuzione.
- **Quando il limite è raggiunto:** l’esecuzione termina come non riuscita («Il ciclo … è stato eseguito … volte senza raggiungere il suo obiettivo») oppure segue gli altri rami della decisione. Se nessuno viene seguito, i passi successivi vengono saltati.
- **Segnaposto:** nel compito di un passo del ciclo, `{{iteration}}` è il giro (da 1), `{{previous}}` il suo risultato del giro precedente e `{{feedback}}` ciò che è tornato attraverso il ciclo (per esempio la motivazione della revisione o il commento di un’approvazione rifiutata). Al primo giro entrambi valgono «-».
- **Approvazioni nei cicli:** un’approvazione rifiutata può tornare a una revisione tramite il ramo *Rifiutato*; il giro successivo attende di nuovo una decisione.

Durante un’esecuzione ogni passo mostra il suo **giro**; nei dettagli scegli tra i risultati di tutti i giri. I cicli possono essere annidati ma non sovrapporsi. Quando un’esecuzione non riuscita viene [ripresa](#fortsetzen), un ciclo viene sempre rieseguito per intero.

## Approvazioni {#freigabe}
<!-- keywords: approvazione, via libera, human in the loop, verificare, rifiutare, commento, pausa -->

Un'**approvazione** ferma l'esecuzione finché una persona **approva** o **rifiuta** i risultati. Niente viene mai approvato automaticamente, nemmeno in pianificazioni, esecuzioni in serie o serie di test.

- **Nota per chi verifica:** a cosa fare attenzione.
- **Risultati mostrati:** quali risultati vede chi verifica; senza selezione, tutto ciò che arriva.
- **Commento:** facoltativo oppure obbligatorio in caso di rifiuto. Gli agenti successivi lo leggono con il nome dell'approvazione; nodi di risultato, file di risultato e decisioni non lo ricevono. Resta salvato con l'approvazione nell'esecuzione.
- **In caso di rifiuto:** seguire il ramo **Rifiutato** o terminare l'esecuzione. Se a *Rifiutato* non è collegato nulla, quel percorso semplicemente termina.

Mentre attende, l'esecuzione ha lo stato **In pausa** e l'approvazione **In attesa di approvazione**. Puoi decidere nella panoramica dell'esecuzione dell'editor, nella vista di dettaglio dell'esecuzione o nella pagina **Approvazioni**. Poi l'esecuzione riprende dove si era fermata. Le approvazioni aperte sopravvivono a un riavvio di Nodestro.

## La pagina Approvazioni {#freigaben-seite}
<!-- keywords: approvazioni, approvazioni aperte, coda, decidere, navigazione, contatore -->

La pagina **Approvazioni** (navigazione, gruppo *Automazione*) elenca tutte le approvazioni aperte, dalla più vecchia, con workflow, origine (manuale, pianificazione, serie, serie di test) e tempo di attesa. Il numero accanto alla voce di menu indica quante sono in attesa.

Ogni scheda mostra la nota, i risultati da verificare, un campo per il commento e i pulsanti *Approva* e *Rifiuta*. Anche le approvazioni dentro i sotto-workflow compaiono qui, con il percorso fino all'esecuzione principale.

## Approvare le chiamate di strumenti {#tool-freigabe}
<!-- keywords: approvazione strumento, chiamata di strumento, per chiamata, argomenti, scadenza, approvazione anticipata, non presidiata, eccezione preesistente -->

Oltre ai nodi di approvazione, Nodestro può chiedere prima di **singole chiamate di strumenti** di un agente. È pensato per strumenti che modificano dati o agiscono verso l’esterno, ad esempio inviare un’e-mail o scrivere in un sistema di ticket. L’amministrazione lo attiva dopo la verifica di sicurezza; fino ad allora non cambia nulla.

Quando un agente vuole fare una chiamata del genere, l’esecuzione continua ma attende su quella chiamata. La scheda compare nell’esecuzione, nel passo e nella pagina **Approvazioni**. Mostra lo strumento, cosa può fare (*solo lettura*, *modifica dati*, *cancella o distrugge*; *resta in Nodestro* o *agisce verso l’esterno*), gli **argomenti esattamente come verranno inviati** e il tempo rimasto.

- **Consenti questa chiamata** lascia passare esattamente questa chiamata. Una decisione vale solo per gli argomenti e la versione dello strumento che hai visto: se uno dei due è cambiato, Nodestro rifiuta la decisione e mostra la chiamata attuale.
- **Rifiuta** impedisce la chiamata; l’agente sa che è stata rifiutata e può continuare senza.
- **Senza decisione** entro il termine (15 minuti di default) la chiamata conta come rifiutata, anche dopo un riavvio. Una decisione rifiutata o scaduta non viene mai riutilizzata.
- Uno strumento **non classificato** conta come modificante ed esterno.
- Per gli strumenti dei **servizi collegati** che modificano dati si chiede a ogni chiamata.

Le esecuzioni che nessuno segue (pianificazioni, serie, serie di test) non possono chiedere. Lì una chiamata del genere viene negata, a meno che l’amministrazione abbia **approvato in anticipo** quella versione dello strumento proprio per quella pianificazione o serie. Gli strumenti che cancellano o distruggono e quelli dei servizi collegati non si possono mai approvare in anticipo.

I workflow che esistevano già all’attivazione continuano a funzionare: le loro assegnazioni di strumenti sono marcate come **eccezioni preesistenti**, legate alla versione dello strumento con cui giravano. Una nuova versione dello strumento o una nuova assegnazione viene chiesta come al solito. Un’approvazione non toglie mai i limiti della sandbox.

In **Approvazioni → Regole per le chiamate di strumenti** vedi se le approvazioni sono attive e quali eccezioni preesistenti ci sono. L’amministrazione vi esegue anche il passo di attivazione, concede e revoca approvazioni anticipate e legge il registro: chi ha deciso, concesso o revocato cosa, e ogni decisione rifiutata. Gli argomenti di una chiamata non compaiono mai nel registro.

Nei dettagli dell’esecuzione, ogni chiamata di strumento mostra cosa hanno fatto le regole: consentita, approvata o rifiutata (da chi e quando), nessuna decisione in tempo o negata senza domanda, con il motivo.

## Sotto-workflow {#unterworkflow}
<!-- keywords: sotto-workflow, subworkflow, annidare, riutilizzare, blocco, versione, esecuzione figlia -->

Un **sotto-workflow** esegue un altro workflow salvato come un unico passaggio. Il suo risultato arriva come quello di un agente.

- **Versione:** *Ultima versione* usa lo stato attuale; una versione fissa non cambia se l'altro workflow viene modificato in seguito. Il controllo segnala quando esiste una versione più recente.
- **Input:** cosa riceve il sotto-workflow come input; `{{input}}` è ciò che arriva qui.
- **Valori per il suo modulo di input:** testo o segnaposto come `{{form.cliente}}` o `{{Analisi}}`. Il controllo segnala i campi obbligatori senza valore.
- Il sotto-workflow gira come **esecuzione propria e collegata**; un link nei dettagli porta lì. Costi e token contano una sola volta, nel budget dell'esecuzione principale.
- Un workflow non può chiamare sé stesso, nemmeno indirettamente; non sono ammessi più di cinque livelli.
- Se il sotto-workflow attende un'approvazione, anche l'esecuzione principale attende.

## Moduli di input {#eingabeformular}
<!-- keywords: modulo, modulo di input, campi, tipo, obbligatorio, valore predefinito, scelta, data, numero, form -->

Invece di una casella di testo libero, il nodo **Avvio** può avere un **modulo di input**. La finestra di avvio chiede allora esattamente questi campi e li controlla prima che l'esecuzione inizi.

| Tipo | Inserimento |
|---|---|
| Testo, Testo lungo | testo libero |
| Numero | un numero, anche con la virgola decimale |
| Data | AAAA-MM-GG |
| Sì/No | scelta tra sì e no |
| Scelta | uno dei valori definiti |
| File | uno o più file dalla [Conoscenza](/docs/wissen#start-dateien) |

Ogni campo ha un'**etichetta**, un **nome tecnico** (solo lettere, cifre e _) e, facoltativamente, un valore predefinito, una spiegazione e *Obbligatorio*. Gli agenti leggono i singoli valori con `{{form.nome}}`; `{{run.input}}` contiene tutti i valori come righe «Etichetta: valore», seguite dall'input aggiuntivo facoltativo. Le decisioni confrontano i valori con il loro tipo corretto.

Anche le [pianificazioni](/docs/automatisierung#zeitplaene), le [esecuzioni in serie](/docs/automatisierung#stapel) e le [serie di test](/docs/automatisierung#testreihen) usano i moduli. I workflow senza modulo si comportano come prima.

## Continuare le esecuzioni non riuscite {#fortsetzen}
<!-- keywords: continuare, riprendere, resume, riprovare, riavviare, non riuscita, annullata -->

Un'esecuzione non riuscita o annullata può essere **continuata** (pulsante *Continua* nella vista di dettaglio). Si crea così una **nuova esecuzione collegata**; quella vecchia resta invariata.

- Prima Nodestro mostra per ogni passaggio se il risultato viene **ripreso** o **rieseguito**, e perché.
- Un risultato viene ripreso solo se il passaggio è riuscito, né lui né i suoi strumenti, collegamenti, input o file sono cambiati e anche tutti i suoi predecessori vengono ripresi. I passaggi modificati e tutto ciò che segue vengono rieseguiti.
- I risultati ripresi non costano nulla nella nuova esecuzione; il loro costo resta nella vecchia e non viene contato due volte in [Utilizzo](/docs/nutzung).
- Le decisioni di approvazione dei passaggi ripresi restano valide e sono segnate come riprese; a nessuno viene chiesto due volte.
- Se i passaggi rieseguiti avevano già chiamato **strumenti propri** che possono agire fuori da Nodestro (per esempio inviare un messaggio), devi confermarlo esplicitamente.

Se nulla può essere ripreso in sicurezza, Nodestro propone un nuovo avvio completo. Le tracce importate e le singole esecuzioni di sotto-workflow non possono essere continuate; continua invece l'esecuzione principale.

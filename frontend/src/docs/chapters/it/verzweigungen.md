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

**Avviso prima dell’avvio.** Finché le approvazioni sono attive, la finestra della pianificazione, l’avvio di lotti e serie di test e il controllo prima di pubblicare un’API elencano ogni chiamata a strumenti che un’esecuzione simile rifiuterebbe: quale agente e quale strumento, perché (nessuna approvazione anticipata o una superata, un lotto che non esiste ancora, un’API pubblicata, uno strumento che cancella o distrugge, uno strumento di un servizio collegato) e come rimediare. È solo un avviso: nulla viene approvato automaticamente e la chiamata viene comunque rifiutata durante l’esecuzione. Un’approvazione anticipata indica una pianificazione salvata o un lotto o una serie di test già avviati, quindi le chiamate precedenti vengono rifiutate; avvia un lotto a mano se ogni chiamata conta. Le API pubblicate non hanno ancora un proprio passaggio di approvazione, quindi le loro chiamate che modificano vengono sempre rifiutate. L’avviso non vede gli strumenti che un orchestratore limita o sceglie durante l’esecuzione, né le approvazioni date o revocate dopo il controllo.

**Attivazione, in questo ordine:**

1. In *Approvazioni → Regole per le chiamate di strumenti* l’amministrazione esegue **Marca le assegnazioni esistenti**. Ogni assegnazione di strumento che esiste ora in workflow, loro versioni e API pubblicate diventa un’**eccezione preesistente**, legata alla versione dello strumento con cui gira. Le API pubblicate ricevono una sola volta una nuova impronta (digest); la loro cronologia conserva la vecchia e la nuova. Il passo viene eseguito **una sola volta**: assegnazioni, workflow e versioni creati dopo sono nuovi e vengono chiesti.
2. **Controlla l’elenco.** Un’eccezione indesiderata termina quando togli lo strumento dall’agente e salvi; se lo assegni di nuovo, viene chiesto come uno nuovo.
3. Solo dopo l’amministrazione attiva le approvazioni (`NODESTRO_TOOL_APPROVALS=1`, poi riavviare Nodestro).

Se si attiva senza il primo passo, nulla è esente: ogni assegnazione viene chiesta e le esecuzioni non presidiate negano tali chiamate. Una nuova versione dello strumento termina sempre un’eccezione. Un’approvazione non toglie mai i limiti della sandbox.

**Non coperto:** gli strumenti server del fornitore (ricerca web, recupero web ed esecuzione di codice presso Anthropic) girano presso il fornitore e non si possono fermare per chiamata; disattivali nell’agente dove non devono essere usati. Nemmeno gli strumenti di esecuzione propri di Nodestro (memoria, file dell’esecuzione) vengono chiesti. Le API pubblicate non chiedono a nessuno: avranno più avanti una propria fase di approvazione.

In **Approvazioni → Regole per le chiamate di strumenti** vedi se le approvazioni sono attive e quali eccezioni preesistenti ci sono. L’amministrazione vi esegue anche il passo di attivazione, concede e revoca approvazioni anticipate e legge il registro: chi ha deciso, concesso o revocato cosa, e ogni decisione rifiutata. Gli argomenti di una chiamata non compaiono mai nel registro.

Nei dettagli dell’esecuzione, ogni chiamata di strumento mostra cosa hanno fatto le regole: consentita, approvata o rifiutata (da chi e quando), nessuna decisione in tempo o negata senza domanda, con il motivo.

## Sotto-workflow {#unterworkflow}
<!-- keywords: sotto-workflow, subworkflow, annidare, riutilizzare, blocco, versione, esecuzione figlia -->

Un **sotto-workflow** esegue un altro workflow salvato come un unico passaggio. Il suo risultato arriva come quello di un agente.

- **Versione:** *Ultima versione* usa lo stato attuale; una versione fissa non cambia se l'altro workflow viene modificato in seguito. Il controllo segnala quando esiste una versione più recente.
- **Input:** cosa riceve il sotto-workflow come input; `{{input}}` è ciò che arriva qui.
- **Valori per il suo modulo di input:** testo o segnaposto come `{{form.cliente}}` o `{{Analisi}}`. Il controllo segnala i campi obbligatori senza valore.
- Il sotto-workflow gira come **esecuzione propria e collegata**; un link nei dettagli porta lì. Costi e token contano una sola volta, nel budget dell'esecuzione principale. Se il sotto-workflow ha un budget proprio, vale anche questo limite più stretto.
- Un workflow non può chiamare sé stesso, nemmeno indirettamente; non sono ammessi più di cinque livelli.
- Se il sotto-workflow attende un'approvazione, anche l'esecuzione principale attende.

## Team {#teams}
<!-- keywords: team, contratto di output, contratto, capacità, risultato strutturato, run.output_contract -->

Un **team** è un workflow che, eseguito come sotto-workflow, promette un risultato fisso. Due impostazioni rendono un workflow un team:

- **Contratto di output** sul nodo del risultato: i campi (nome, tipo, obbligatorio) che il workflow consegna, come nel risultato strutturato di un agente. Alla fine di un'esecuzione il risultato viene verificato. Deve essere un oggetto (o testo JSON di un oggetto) con ogni campo obbligatorio nel tipo giusto. Gli altri campi vengono omessi. Se il risultato non corrisponde, il nodo del risultato fallisce e con esso l'esecuzione; un workflow superiore non riceve mai un risultato non verificato.
- **Capacità come team** nelle impostazioni del workflow: brevi parole chiave su cosa sa fare il workflow (al massimo 20). Viaggiano con il workflow (versioni, esportazione) e in seguito aiutano a trovare un team adatto. Non concedono permessi.

In un workflow superiore, un workflow con contratto di output consegna un oggetto con esattamente questi campi. Una decisione successiva può quindi verificare direttamente un campo, ad esempio `score` maggiore o uguale a 5.

La verifica prima dell'avvio avvisa quando un agente prima del risultato risponde in testo (allora serve solo una risposta JSON) o quando nessun agente fornisce un campo obbligatorio. Nomi di campo non validi o ripetuti impediscono l'avvio.

I workflow con contratto di output o capacità compaiono nella palette sotto **Team** e si possono inserire direttamente come sotto-workflow. L'ispettore di un sotto-workflow mostra cosa consegna il team. Un **doppio clic** sul nodo apre il team nell'editor; il percorso di navigazione in alto riporta al workflow superiore.

Un team si può verificare da solo: crea una [serie di test](/docs/automatisierung#testreihen) per il workflow. I suoi controlli possono usare i campi del contratto di output, ad esempio `score` maggiore o uguale a 5.

## Orchestratore {#orchestrator}
<!-- keywords: orchestratore, orchestrazione, delegare, gruppo, team, decisioni, run.orchestration_limit -->

Un **orchestratore** lascia decidere a un modello di IA quale team riceve quale parte del compito. Prende una decisione dopo l’altra: **delegare** un compito a un team oppure **concludere** con una risposta. La risposta è il risultato del nodo.

- **Team:** i workflow salvati tra cui il modello può scegliere (al massimo 20). Di ogni team il modello vede solo nome, descrizione, capacità e contratto di output.
- **Team per capacità:** invece di scegliere ogni team, indichi delle capacità (al massimo 10). All’avvio di un’esecuzione i team salvati con una capacità corrispondente entrano nel gruppo (fino a *Al massimo tanti team*): prima quelli con più tag corrispondenti, poi per nome. I team con errori restano fuori; i team con passaggi di approvazione sono inclusi. La selezione resta fissa per quell’esecuzione (e per una versione pubblicata); i dettagli mostrano quali tag ha trovato ogni team. Non si assegnano punteggi né stime.
- **Compito** e **Istruzioni:** cosa va fatto e, facoltativamente, come pianificarlo.
- **Numero massimo di decisioni** (da 1 a 50, predefinito 8) e **Massimo per team:** senza risposta dopo l’ultima decisione, il passaggio fallisce.

L’orchestratore sceglie soltanto. Non ha strumenti, non crea agenti, strumenti o team e non ha autorizzazioni proprie. Ogni team scelto viene eseguito come **esecuzione collegata a sé**, con la sua quota di budget, i suoi limiti e le sue approvazioni degli strumenti. Le decisioni non consentite (un team sconosciuto, lo stesso compito di nuovo, un team esaurito) vengono rifiutate e mostrate al modello; contano comunque come decisione.

I dettagli dell’esecuzione elencano ogni decisione con motivo, compito, risultato e un link all’esecuzione del team. Quando un team si ferma per un’**approvazione** (anche in un sotto-workflow o sotto un altro orchestratore), l’orchestratore attende con lui: l’esecuzione è *in pausa* e compare in **Approvazioni**. Dopo la decisione continua la stessa esecuzione del team, anche dopo un riavvio, e il modello non viene interpellato di nuovo per quella delega. Se un rifiuto termina l’esecuzione del team (*In caso di rifiuto: termina l’esecuzione*), termina anche questa esecuzione; nessun altro team può aggirare il rifiuto. Annullare un’esecuzione in attesa annulla anche i suoi team in attesa. Un team non può richiamare il workflow dell’orchestratore.

## Team dinamici {#dynamische-teams}
<!-- keywords: team dinamico, comporre il team, parallelo, contemporaneamente, parametri, modulo di avvio, modello, composizione del team, staffing -->

Nell’area **Team dinamici** di un orchestratore il modello ha più margine, sempre all’interno del pool e dei limiti. All’inizio tutto è disattivato.

- **Team contemporaneamente** (da 1 a 5): una decisione può affidare lavoro a più team diversi insieme, per parti che non dipendono l’una dall’altra. Ogni team ottiene il proprio risultato.
- **Comporre il team da sé:** l’orchestratore prende team dal pool nel suo team e li congeda di nuovo quando i risultati intermedi lo suggeriscono. Ricevono lavoro solo i team nel team; *Al massimo nel team* ne limita la dimensione. Lo stesso team può lavorare più volte (fino a *Al massimo per team*).
- **Compilare il modulo di avvio dei team:** l’orchestratore può impostare i campi del modulo di input di un team (mai file). I valori vengono verificati come in un avvio manuale; un campo sconosciuto o un valore non valido viene rifiutato e mostrato al modello.

Il pool è fissato all’avvio dell’esecuzione, nelle versioni di quel momento. Non nascono mai nuovi team, agenti o strumenti, e approvazioni, budget e limiti di ogni team valgono invariati.

**Cosa mostrano i dettagli dell’esecuzione:** quale orchestratore lavora con quale modello, quante decisioni sono state usate, il costo delle decisioni e quello totale (i costi sconosciuti appaiono come *non del tutto noto*, mai come 0), il pool con le versioni, il **team nel tempo**, i team in attesa e ogni decisione con motivo, compito, valori e l’esito di ogni team: *Riuscito*, *In attesa di approvazione*, *Non riuscito*, *Rifiutato*, *Annullato* o *Scaduto*. Vengono mostrate solo le decisioni registrate, nessun ragionamento del modello.

**Salva la composizione del team come modello:** un team esiste solo durante l’esecuzione. Al termine, questo pulsante salva un **nuovo workflow** con lo stesso orchestratore, il suo modulo di avvio, i suoi limiti ed esattamente i team che hanno lavorato, nelle versioni dell’esecuzione. Senza questo clic non viene salvato nulla.

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

# Automazione

Sotto *Automazione* nella navigazione, i workflow girano senza fare clic su *Avvia*: le **esecuzioni in serie** elaborano molti input in una volta, le **serie di test** misurano la qualità di un workflow e le **pianificazioni** avviano workflow regolarmente. Ogni singola esecuzione è un'esecuzione normale con traccia, budget e utilizzo; le approvazioni attendono una persona come sempre.

## Esecuzioni in serie {#stapel}
<!-- keywords: serie, batch, molti input, csv, excel, xlsx, json, tabella, colonne, assegnazione, esportare -->

Un'**esecuzione in serie** esegue un workflow per ogni riga di una tabella, per esempio per 200 richieste di clienti.

1. Nella pagina **Esecuzioni in serie** scegli *Nuova esecuzione in serie* e seleziona il workflow.
2. Carica una tabella: CSV (virgola o punto e virgola), Excel (XLSX) o JSON (un elenco di oggetti), al massimo 1.000 righe e 10 MB.
3. Assegna ogni colonna a un campo del [modulo di input](/docs/verzweigungen#eingabeformular) o all'input libero, oppure ignorala. Nodestro propone assegnazioni adatte.
4. L'anteprima conta le righe valide e non valide e mostra i costi stimati. Le righe non valide non vengono eseguite.
5. Avvia. La pagina di dettaglio mostra avanzamento, costi e ogni riga con il suo stato e un link alla sua esecuzione.

Una serie può essere **messa in pausa** (le esecuzioni in corso terminano, non ne partono di nuove), **continuata** e **annullata**. Un errore in una riga non ferma le altre. Se Nodestro si è fermato durante una serie, questa risulta *interrotta* e può essere continuata. I risultati si scaricano come CSV o JSON.

## Limiti, costi e strumenti propri {#grenzen}
<!-- keywords: limiti, limite di costo, limite di errori, contemporaneamente, parallelo, stima, costi, rate limit, strumenti propri -->

- **Contemporaneamente:** quante esecuzioni girano in parallelo (da 1 a 8). Di più è più veloce, ma può raggiungere i limiti di frequenza dell'API.
- **Limite di costo (USD):** la serie si ferma appena il totale è raggiunto. Inoltre il [budget per esecuzione](/docs/workflows#budget) vale per ogni singola esecuzione.
- **Errori al massimo:** la serie si ferma dopo questo numero di esecuzioni non riuscite.
- **Costi stimati:** dalle ultime esecuzioni riuscite del workflow, moltiplicate per il numero di esecuzioni. Se non c'è ancora un'esecuzione riuscita, Nodestro indica solo il massimo: budget per numero di esecuzioni.
- Gli **strumenti propri** che possono agire fuori da Nodestro (per esempio inviare messaggi) verrebbero chiamati a ogni esecuzione. Devi confermarlo esplicitamente prima dell'avvio.
- Le esecuzioni in attesa di un'**approvazione** non occupano posti; proseguono appena qualcuno decide.

I costi di tutte le esecuzioni compaiono come sempre in [Utilizzo](/docs/nutzung), ciascuno contato una sola volta.

## Serie di test {#testreihen}
<!-- keywords: serie di test, benchmark, caso di test, regola di controllo, qualità, regressione, risultato atteso, superato -->

Una **serie di test** appartiene a un workflow e contiene **casi di test** fissi: un input (valori del modulo, testo libero, file), **regole di controllo** per il risultato e, facoltativamente, criteri per una [valutazione IA](/docs/automatisierung#ki-bewertung).

- Le regole di controllo usano gli stessi confronti delle [decisioni](/docs/verzweigungen#regeln), per esempio `category è uguale a complaint` o `total maggiore di 100`. Sono esatte e non costano nulla.
- *Esegui serie di test* sceglie la versione del workflow (stato attuale o una precedente), i limiti come per le serie e se l'IA deve valutare.
- Un caso è **superato** se la sua esecuzione è riuscita, tutte le regole di controllo sono valide e, se valutato, l'IA lo ha promosso.
- La valutazione mostra la percentuale di superamento, la valutazione IA, token, costi e durata, oltre ai dettagli di ogni caso.

Una serie di test ha al massimo 200 casi. I casi non validi (per esempio un campo obbligatorio senza valore) vengono segnalati prima dell'avvio e saltati.

## Caso di test da un'esecuzione fallita {#testfall-aus-lauf}
<!-- keywords: caso di test da esecuzione, errore come test, regressione, fallita, aggiungere, oscurato -->

Se un'esecuzione è fallita, fai clic su **Aggiungi come caso di test** nei suoi dettagli. Nodestro propone un caso di test con lo stesso input: valori del modulo, testo libero e file.

- Chiavi API, token e password vengono sempre sostituiti da segnaposto come `[API_KEY_1]`, e anche i dati personali (indirizzi e-mail, numeri di telefono, IBAN …) finché l'interruttore è attivo. Il riconoscimento si basa su schemi e non trova tutto; controlla l'anteprima.
- I file vengono usati come sono salvati, senza copiarli né oscurarli. I file eliminati vengono omessi e indicati, così come i valori che non corrispondono più al modulo attuale.
- Non viene salvato nulla finché non scegli una serie di test (o ne crei una nuova) e fai clic su **Aggiungi alla serie di test**. L'esecuzione resta invariata.
- Il caso conserva la sua **origine** (esecuzione, errore, cosa è stato sostituito) e la mostra nella serie di test. Lì aggiungi regole di controllo e criteri.

Se un nuovo caso modifica una serie di test usata da un [controllo di pubblicazione](/docs/api-und-export#freigabe-gate), la serie deve essere eseguita di nuovo prima del prossimo rilascio.

## Valutazione IA {#ki-bewertung}
<!-- keywords: valutazione ia, giudice, llm as judge, criteri, valutazione, voto, punteggio -->

Per i casi con criteri (uno per riga), un modello di IA separato valuta il risultato, a scelta rispetto a un **risultato atteso**. Il predefinito è il modello degli assistenti di IA; nella serie di test puoi scegliere un modello proprio di qualsiasi provider configurato.

Il giudizio è sempre segnato come **valutazione IA** e non sostituisce una regola di controllo. Ha un costo aggiuntivo, che compare nella valutazione e in [Utilizzo](/docs/nutzung) come *Valutazione IA delle serie di test*.

## Confrontare esecuzioni di test {#testreihen-vergleichen}
<!-- keywords: confrontare, confrontare versioni, migliore, peggiore, regressione, prima dopo -->

Scegli due esecuzioni nell'elenco delle esecuzioni di test e fai clic su *Confronta*. La tabella mostra la percentuale di superamento di entrambe e, per ogni caso, se è stato superato, segnato come **migliore**, **peggiore**, **uguale** o **cambiato**.

Così verifichi dopo ogni modifica ad agenti, prompt o strumenti se il workflow è migliorato, e puoi provare una [versione](/docs/workflows#versionen) precedente rispetto allo stato attuale.

## Confrontare modelli {#modelle-vergleichen}
<!-- keywords: confrontare modelli, altro modello, più economico, più veloce, scelta del modello, variante -->

Se un modello più economico o più potente basta per un agente, lo verifichi con la stessa serie di test. Nella finestra di avvio attiva **Prova altri modelli** e scegli un altro modello per alcuni agenti. I casi di test e la valutazione IA restano uguali, e il workflow salvato non cambia.

Un'esecuzione così richiede un **limite di costo** in [Limiti](/docs/automatisierung#grenzen), perché le esecuzioni precedenti usavano altri modelli e non dicono nulla sul costo. Nell'elenco porta l'etichetta **Confronto modelli** e indica i modelli sostituiti. Poi confrontala con un'esecuzione della versione salvata. Non conta come risultato di test di quella versione, perché ha provato una variante. Se un modello va bene, impostalo nell'agente stesso.

## Pianificazioni {#zeitplaene}
<!-- keywords: pianificazione, schedule, cron, regolare, giornaliero, settimanale, mensile, orario, fuso orario, mancato -->

Una **pianificazione** avvia un workflow una volta o regolarmente, con input fissi (valori del modulo, testo, file).

- **Ritmo:** una volta, ogni poche ore, ogni giorno, nei giorni della settimana scelti oppure ogni mese in un giorno (nei mesi più corti l'ultimo giorno).
- **Fuso orario:** gli orari valgono nel fuso scelto, anche con il cambio dell'ora. Un orario che non esiste quando si spostano avanti le lancette viene eseguito un'ora dopo; uno che esiste due volte quando si spostano indietro viene eseguito una volta.
- **Prossimi avvii:** la finestra mostra le prossime date prima del salvataggio.
- **Spenta finché non la attivi:** una nuova pianificazione è spenta. All'attivazione Nodestro controlla tutto ciò di cui un'esecuzione ha bisogno: il workflow, gli input, un [budget per esecuzione](/docs/einstellungen#budget) e la conferma degli strumenti propri. Se non supera il controllo, resta spenta e viene mostrato il motivo.

Le pianificazioni girano solo mentre Nodestro è in funzione. Gli orari passati mentre Nodestro era spento contano come **mancati**: *Salta* li ignora, *Recupera una volta* avvia una sola esecuzione al prossimo avvio, indipendentemente da quanti ne sono stati mancati. Le esecuzioni delle pianificazioni riportano l'origine *Pianificazione* in [Esecuzioni](/docs/ausfuehrungen#liste).

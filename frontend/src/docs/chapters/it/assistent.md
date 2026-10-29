# Nodestro Assistant

Nodestro Assistant è una chat che ti aiuta ovunque in Nodestro. Risponde alle domande sull'uso in base a questa documentazione, esamina i workflow, gli agenti, gli strumenti, la memoria, la conoscenza e le esecuzioni che gli mostri esplicitamente e, se lo chiedi, prepara un passaggio all'architetto di workflow, alla progettazione agenti o alla creazione strumenti. Non modifica mai nulla da solo.

## Panoramica {#ueberblick}
<!-- keywords: assistant, assistente, chat, aprire, pannello, barra laterale, scorciatoia, ctrl j, largo, aiuto -->

Apri l'assistente con **Assistant** in alto a destra nell'intestazione o con **Ctrl+J** (macOS: **⌘J**). Compare come pannello a destra; lo stesso pulsante o **Chiudi** lo nasconde di nuovo. **Più largo** dà più spazio alla chat; sugli schermi piccoli si sovrappone alla pagina.

La chat resta com'è mentre passi da una pagina all'altra, e anche dopo aver ricaricato. Le risposte compaiono in diretta; il Markdown con elenchi, tabelle e blocchi di codice viene formattato. Mentre una risposta viene scritta, vedi che cosa fa davvero l'assistente: cercare nella documentazione, leggere sezioni, elaborare gli allegati, scrivere la risposta o preparare un passaggio.

L’assistente usa il **modello degli assistenti** delle [impostazioni](/docs/einstellungen#modelle) e l’accesso al suo provider. Se quel provider non è configurato, puoi aprire la chat ma non inviare domande.

## Domande sulla documentazione {#fragen}
<!-- keywords: domanda, documentazione, fonti, citazione, link, inventato, non documentato, come -->

L'assistente risponde a domande come «Come provo il mio agente?» o «Qual è la differenza tra conoscenza e memoria?» in base a questa documentazione integrata. Cerca le sezioni pertinenti, le legge e le cita con dei link nella risposta. Sotto la risposta, le sezioni lette sono elencate come **Fonti**; un clic le apre.

La documentazione è la sua unica fonte di conoscenza su Nodestro. Se non vi trova qualcosa, lo dice esplicitamente invece di inventare una funzione. La conoscenza generale, per esempio su come scrivere i prompt, viene indicata come tale.

## Allegare oggetti {#anhaenge}
<!-- keywords: allegare, allegato, contesto, graffetta, parlane, workflow, agente, strumento, memoria, conoscenza, esecuzione, trace -->

Perché l'assistente possa esaminare un oggetto preciso, lo alleghi. Ci sono due modi:

- **Parlane con l'assistente** nella vista stessa: nell'editor dei workflow, nell'ispettore dell'agente, nella libreria degli agenti, su uno strumento, su un'esecuzione, in uno spazio di memoria e su un file di conoscenza.
- La **graffetta** nel campo di inserimento apre una selezione di tutti i workflow, modelli di agente, strumenti, spazi di memoria, file di conoscenza ed esecuzioni.

Ciò che l'assistente riceve dipende dal tipo:

| Tipo | Contenuto |
| --- | --- |
| Workflow | agenti, collegamenti, ordine di esecuzione, impostazioni e il risultato del [controllo prima dell'avvio](/docs/workflows#pruefung) |
| Agente | la configurazione completa con strumenti, conoscenza e note di configurazione |
| Strumento | codice, test, schema di input, librerie Python con le relative approvazioni e dove viene usato |
| Memoria | l'elenco dei file; il contenuto solo dei file che selezioni esplicitamente |
| Conoscenza | nome, descrizione e tipo; il testo solo se attivi **Invia contenuto** |
| Esecuzione | stato, input, risultati, errori, chiamate agli strumenti, token e costo di ogni agente |

Puoi allegare più oggetti insieme e rimuoverli uno per uno con **×**. Un allegato resta attivo finché non lo rimuovi e accompagna ogni messaggio successivo. Gli allegati sono sempre visibili sopra il campo di inserimento.

## Suggerimenti di contesto {#vorschlaege}
<!-- keywords: suggerimento, suggerito, workflow attuale, automatico, confermare, ignorare -->

Con l'assistente aperto, l'oggetto della vista attuale viene suggerito come contesto, per esempio il workflow nell'editor o l'esecuzione aperta. I suggerimenti hanno un bordo tratteggiato e la dicitura **Suggerimento**; gli oggetti allegati hanno un bordo continuo.

Un suggerimento non viene inviato. Solo **Aggiungi** lo trasforma in allegato; **Ignora** lo nasconde per questa chat. I suggerimenti nascono dalla vista che hai aperta, senza alcuna chiamata all'IA.

## Versioni e modifiche non salvate {#versionen}
<!-- keywords: versione, bozza, non salvato, salvato, modificato, aggiorna contesto, obsoleto, eliminato -->

Quando alleghi un oggetto, Nodestro ne registra lo stato. Ogni messaggio ricorda esattamente gli stati con cui è stato inviato; li vedi sotto il tuo messaggio come **Inviato con**. Un clic mostra ciò che l'assistente ha ricevuto davvero.

Se un oggetto allegato cambia in seguito, l'allegato viene segnato come **modificato**. **Aggiorna contesto** usa il nuovo stato per i messaggi successivi. I messaggi e le risposte precedenti restano invariati e mantengono lo stato di allora. Se un oggetto viene eliminato, l'allegato indica **non esiste più**; la chat continua a funzionare.

Se il workflow nell'editor ha modifiche non salvate, decidi tu: **Versione salvata** invia l'ultimo stato salvato, **Bozza non salvata** lo stato attuale dell'editor. Una bozza è indicata nella chat come **Bozza**. Se continui a modificare dopo, anche questa viene segnata come modificata.

## Analisi {#analyse}
<!-- keywords: analisi, migliorare, controllare, trovare errori, ottimizzare, ridurre i costi, eseguito, testato -->

Con oggetti allegati, l'assistente può per esempio cercare i punti deboli di un workflow, migliorare un prompt di sistema, spiegare perché un'esecuzione è fallita o segnalare test mancanti in uno strumento.

Lavora solo con i dati che hai allegato. Non esegue né prova nulla, e non lo afferma. Se un miglioramento funziona lo verifichi tu, per esempio con il [test dell'agente](/docs/agenten#agent-testen) o una nuova esecuzione.

## Passaggio ad altre funzioni {#uebergabe}
<!-- keywords: passaggio, applicare, architetto, realizzare, creare agente, creare strumento, applicare proposta -->

Se chiedi esplicitamente di realizzare un miglioramento, l'assistente prepara un passaggio. Compare come scheda nella risposta. Il pulsante sulla scheda apre la funzione esistente adatta, già compilata con la descrizione:

- **[Architetto di workflow](/docs/ki-architekt)**: rielaborare un workflow allegato o progettarne uno nuovo.
- **[Progettazione agenti](/docs/agenten#ki-entwurf)**: descrivere un nuovo agente per un workflow allegato.
- **Creazione strumenti** in *Strumenti → Crea con l'IA*: far scrivere un nuovo strumento all'agente programmatore.

Lì non parte nulla finché non lo avvii tu, e controlli il risultato come al solito prima che cambi qualcosa. L'assistente stesso non modifica workflow, non esegue strumenti e non applica nulla senza la tua conferma.

## Gestire le chat {#verlauf}
<!-- keywords: cronologia, chat, conversazione, nuova chat, rinominare, eliminare, titolo, continuare -->

**Nuova chat** avvia una nuova conversazione, **Cronologia** mostra tutte quelle precedenti. Lì apri una chat per continuarla, la rinomini o la elimini. Nodestro crea il titolo dalla tua prima domanda, senza chiamata all'IA.

Le chat sono salvate localmente nel database di Nodestro e fanno parte di [backup e ripristino](/docs/einstellungen#backup). Non vengono mai tradotte; una chat resta nella lingua in cui è stata scritta.

## Privacy e sicurezza {#datenschutz}
<!-- keywords: privacy, sicurezza, chiave api, segreto, password, mascherato, inviato, prompt injection, istruzioni -->

Al modello arriva solo ciò che scrivi, ciò che hai allegato e le sezioni della documentazione che l'assistente legge. L'oggetto che hai aperto non viene mai inviato automaticamente.

Chiavi API, password, token e valori simili vengono sostituiti con segnaposto prima dell'invio, compresa la chiave API che hai salvato. Una nota sull'allegato indica quando qualcosa è stato sostituito. Per vedere esattamente cosa è stato inviato, fai clic su un allegato o su **Inviato con**.

Gli oggetti molto grandi vengono accorciati; l'allegato è allora segnato come **parziale**, e l'assistente sa di averne visto solo una parte. Le istruzioni contenute negli allegati, per esempio in un file di conoscenza o nell'output di uno strumento, vengono trattate dall'assistente come dati, non come istruzioni rivolte a lui.

## Costi {#kosten}
<!-- keywords: costo, token, utilizzo, prezzo, costo della chat, addebitato -->

Ogni risposta è una o più richieste al modello. Sotto ogni risposta vedi i suoi token e il costo stimato, e l'intestazione della chat mostra il totale della chat. Nella [pagina di utilizzo](/docs/nutzung) tutte le richieste compaiono sotto l'origine **Nodestro Assistant**, ognuna esattamente una volta.

Per una risposta annullata una parte del costo è già maturata; viene stimata e segnata come **stimato**.

## Annullare ed errori {#fehler}
<!-- keywords: annullare, interrompere, errore, riprova, ripetere, chiave non valida, modello non disponibile, connessione -->

**Interrompi** annulla una risposta in corso; ciò che è stato scritto fino a quel momento resta. Se una risposta fallisce, l'assistente ne indica il motivo, per esempio una chiave API mancante o non valida, un modello non disponibile, una connessione interrotta o troppo contesto. **Riprova** ripete l'ultima risposta.

La chat non va mai persa. Se Nodestro viene chiuso mentre si scrive una risposta, dopo il riavvio questa risulta interrotta.

## Lingua {#sprache}
<!-- keywords: lingua, italiano, inglese, lingua della risposta, tradurre -->

L'assistente risponde nella lingua dell'interfaccia (vedi [Lingua](/docs/einstellungen#sprache)), a meno che tu non ne chieda esplicitamente un'altra. Legge la documentazione nella stessa lingua. Gli identificatori tecnici, come nomi di strumenti, nomi di campi e codice, restano in inglese.

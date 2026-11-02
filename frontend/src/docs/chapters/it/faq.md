# Risoluzione dei problemi e FAQ

Qui trovi le soluzioni ai messaggi più comuni e le risposte alle domande tipiche.

## Errori frequenti {#haeufige-fehler}
<!-- keywords: errori, problema, soluzione, messaggio, troubleshooting, non funziona -->

| Messaggio o sintomo | Causa | Soluzione |
|---|---|---|
| «Nessuna chiave API per …» | Il provider del modello non è configurato. | Inserisci la chiave in *Impostazioni → Provider di IA* o imposta la variabile d’ambiente del provider, per esempio `ANTHROPIC_API_KEY`. |
| «Avvia workflow» è bloccato | Ci sono problemi nel workflow, un'esecuzione è attiva oppure, su un server, il tuo ruolo non ha il permesso. | Il motivo compare subito accanto al pulsante; **Mostra** porta al problema. Tutti i problemi sono elencati nell'ispettore quando non è selezionato nulla. |
| «Il workflow contiene un ciclo …» | Un collegamento torna indietro. | Elimina il collegamento che torna indietro. |
| «Strumenti sconosciuti: …» | Uno strumento assegnato è stato eliminato o manca dopo un'importazione. | Rimuovi lo strumento nell'ispettore o ricrealo nella libreria degli strumenti. |
| «… non consente di imporre uno strumento …» | Il modello non ammette strumenti imposti. | Imposta tool choice su *Automatico*. |
| «Con … il ragionamento non si può disattivare» | Il modello non ammette il ragionamento *Disattivato*. | Imposta il ragionamento su *Predefinito del modello* e riduci l'impegno. |
| «'Solo tra le chiamate agli strumenti' è supportato solo da …» | Solo Sonnet 5.5 fino all'impegno *Alto* lo supporta. | Adatta il modello o l'impegno. |
| «Questo modo di mostrare il ragionamento non è compatibile con l'impostazione del ragionamento» | *Mostra il ragionamento* non è compatibile con il ragionamento *Disattivato* o *Solo tra le chiamate agli strumenti*. | Modifica una delle due impostazioni. |
| «Nome di campo non valido …» | Un nome di campo del formato di output contiene caratteri speciali o inizia con una cifra. | Usa solo lettere, cifre e `_`. |
| «Le citazioni non si possono combinare con un formato di output strutturato» | Entrambe le opzioni sono attive. | Disattivane una. |
| «I messaggi di esempio devono …» | Gli esempi non si alternano correttamente. | Inizia con l'utente, alterna e termina con l'assistente. |
| «La memoria permanente richiede uno spazio di memoria» | Memoria *Permanente* senza spazio. | Scegli o crea uno spazio. |
| Errori di Docker con gli strumenti | Docker è selezionato ma non è in esecuzione. | Avvia Docker o scegli la sandbox *Automatica*. |
| Gli strumenti creati dall’IA sono bloccati su macOS o Windows | Su questi sistemi non esiste una sandbox approvata senza Docker. | [Installa Docker](/docs/einstellungen#sandbox-docker) e avvialo; *Automatica* lo userà poi. |
| Un agente è stato *saltato* | Un predecessore non è riuscito. | Guarda il primo agente rosso nell'andamento e correggilo. |
| Il risultato contiene «{{Nome}}» alla lettera | Il segnaposto non corrisponde ad alcun predecessore diretto (per esempio dopo una ridenominazione). | Reinserisci il segnaposto con i pulsanti sotto il compito. |
| Importazione traccia: «Questo è un workflow esportato …» | Il file è un'esportazione di workflow. | Aprilo in *Workflow → Importa*. |

I messaggi compaiono nella lingua dell'interfaccia; **Dettagli tecnici** mostra il testo originale del server. Gli errori che compaiono solo durante un'esecuzione sono spiegati in [Interpretare gli errori](/docs/ausfuehrungen#fehler).

## Domande frequenti {#fragen}
<!-- keywords: faq, domande, risposte, come posso, perché -->

**Modificare i workflow costa qualcosa?**
No. I costi nascono solo con le esecuzioni e con gli assistenti IA (progettare agenti, creare strumenti, proporre memoria). La verifica nell'editor, la ricerca nella conoscenza e *Prova* per gli strumenti sono gratuite.

**Perché la stima dei costi è diversa dalla mia fattura?**
Nodestro calcola con i prezzi di listino. Sconti, tasse, altre piattaforme o condizioni particolari non sono considerati.

**Un agente può vedere il risultato di un agente che non lo precede direttamente?**
No, solo quello dei predecessori diretti. Collegalo anche all'agente desiderato; l'input originale è sempre raggiungibile con `{{run.input}}`.

**Posso ramificare un workflow in base al risultato?**
Sì, con una [decisione](/docs/verzweigungen#entscheidung): controlla il risultato con regole fisse e apre il ramo corrispondente. Non ci sono cicli.

**Come trasferisco un workflow su un altro computer?**
Con *Esporta* e *Importa*. File di conoscenza, spazi di memoria e strumenti personali vanno ricreati lì separatamente.

**Come mostro un'esecuzione a qualcuno?**
Con *Esporta traccia*. L'altra persona apre il file in *Esecuzioni → Importa traccia*, senza rieseguire il workflow.

**La mia chiave API viene salvata nell'esportazione del workflow o nella traccia?**
No. Le chiavi si trovano solo in variabili d’ambiente o nel database locale e non finiscono né nelle esportazioni né nei backup.

**Perché un agente non vede un file di conoscenza?**
Controlla che gli sia assegnato nell'ispettore e quale modalità è scelta. Immagini e PDF scansionati non si trovano in modalità *Ricerca*.

**Cosa succede alle esecuzioni in corso se chiudo Nodestro?**
Vengono annullate. Ciò che è stato salvato fino a quel momento resta come esecuzione.

**Cambiare lingua modifica i miei agenti?**
No. La lingua cambia solo l'interfaccia. Agenti, prompt e risultati restano come sono, e gli agenti continuano a rispondere nella lingua del loro prompt. Vedi [Lingua](/docs/einstellungen#sprache).

**Posso usare Claude tramite Amazon Bedrock invece di una chiave Anthropic?**
Sì, con il provider *Amazon Bedrock (AWS)*: al posto di una chiave usa il tuo account AWS, la regione e i permessi IAM, e AWS fattura per regione. Le opzioni solo Anthropic (ragionamento, impostazioni di cache dei prompt, modelli di riserva, tool del server) lì non sono disponibili. Vedi [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).

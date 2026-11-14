# Skill

Le skill sono istruzioni nel formato aperto Agent Skills che un agente carica quando il suo compito ne ha bisogno. Questo capitolo spiega che cosa contiene una skill, come importare e modificare le skill e che cosa fa Nodestro per renderle sicure.

## Che cos’è una skill {#ueberblick}
<!-- keywords: skill, agent skills, SKILL.md, istruzioni, intestazione, front matter, riferimenti -->

Una skill è una cartella con un file `SKILL.md` e, facoltativamente, altri file in `scripts/`, `references/` e `assets/`. `SKILL.md` inizia con un’intestazione (nome, descrizione e campi facoltativi come licenza o compatibilità), seguita dalle istruzioni in Markdown. La descrizione dice al modello quando la skill è utile.

Tutte le skill dello spazio di lavoro si trovano nella pagina [Skill](/skills). Ogni scheda mostra lo stato, la versione, l’origine (propria, importata o inclusa) e se la skill contiene script. Assegni una skill a un agente in una versione fissa, come descritto nella [libreria di agenti](/docs/agenten#bibliothek); una versione più recente non viene mai usata automaticamente.

## Importare una skill {#import}
<!-- keywords: importare, zip, SKILL.md, rapporto di validazione, prova, nuova versione -->

Scegli **Importa skill** e poi un file ZIP con una cartella di skill o un singolo file `SKILL.md`. Nodestro controlla prima il file e non salva ancora nulla. Il rapporto di validazione elenca gli **errori**, che impediscono l’importazione, e gli **avvisi**, che informano soltanto, per esempio su un nome che non segue la specifica o sugli script. Sotto vedi il nome, la descrizione, le istruzioni e i file che l’importazione salverebbe.

Se esiste già una skill con lo stesso nome, l’importazione salva il file come versione successiva di quella skill invece di crearne una seconda.

## Versioni, modifica e stato {#versionen}
<!-- keywords: versione, modificare, copiare, rinominare, esportare, attivare, disattivare, archiviare, eliminare -->

Ogni modifica viene salvata come nuova versione; un salvataggio senza modifiche mantiene la versione. Nei dettagli di una skill puoi modificare il testo di `SKILL.md` (gli altri file restano invariati), guardare le versioni precedenti, vedere quali agenti usano la skill e scaricare qualsiasi versione come file ZIP.

Il nome di una skill non si può cambiare modificandola: copia invece la skill con un nuovo nome. Una skill **disattivata** resta assegnata, ma gli agenti che la usano non vengono eseguiti finché non la riattivi. Una skill che gli agenti usano ancora non può essere eliminata; **archiviala** invece. Archiviare ed eliminare spetta agli amministratori.

## Sicurezza {#sicherheit}
<!-- keywords: sicurezza, non attendibile, script, allowed-tools, credenziali, prompt injection -->

Una skill importata proviene da una fonte sconosciuta. Nodestro passa le sue istruzioni al modello come contenuto non attendibile, e gli script di una skill non vengono **mai eseguiti**. Una skill non concede mai strumenti: il campo `allowed-tools` viene mostrato ma ignorato, e gli strumenti vengono solo dalle impostazioni dell’agente. Controlla il contenuto di una skill importata prima di usarla con strumenti che scrivono o modificano dati. Se un file sembra contenere credenziali, il rapporto di validazione ti avvisa; rimuovile prima di condividere o esportare la skill.

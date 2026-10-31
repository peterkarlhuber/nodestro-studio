# Strumenti

Gli strumenti sono funzioni che un agente può chiamare da solo per calcolare, consultare o eseguire qualcosa con precisione. Questo capitolo spiega i tipi di strumenti, come scriverne di tuoi o farli creare dall'IA e come Nodestro li esegue in sicurezza.

## Come funzionano gli strumenti {#ueberblick}
<!-- keywords: strumento, tool, funzione, function calling, tool use, tipi, integrati, personali, generati dall'ia -->

Uno strumento ha un **nome**, una **descrizione** e uno **schema di input** (i parametri). Il modello vede queste informazioni e decide se una chiamata è utile. Se chiama uno strumento, Nodestro esegue la funzione e restituisce il risultato al modello. Questo passaggio si chiama **turno di strumenti**; un agente può farne diversi di seguito.

La pagina **Strumenti** ha tre sezioni: *Libreria*, *Scrivi tu* e *Crea con l'IA*. Esistono quattro tipi di strumenti:

| Tipo | Origine | Esecuzione |
|---|---|---|
| **Integrato** | Fornito con Nodestro, scritto e verificato a mano | nel processo di Nodestro |
| **Strumento personale** | Creato da te in *Scrivi tu* | nella sandbox |
| **Creato dall'IA** | Scritto dall'agente programmatore, approvato da te | nella sandbox |
| **Strumenti server** | Di Anthropic (ricerca web, recupero web, esecuzione di codice) | sui server di Anthropic |

Gli strumenti della libreria si assegnano nell'ispettore di un agente, dove si attivano anche gli strumenti server (vedi [Assegnare strumenti](/docs/agenten#tools)).

## Strumenti integrati {#eingebaut}
<!-- keywords: calculator, calcolatrice, current_datetime, data, ora, days_between, giorni, text_statistics -->

| Strumento | Scopo | Input di esempio |
|---|---|---|
| `calculator` | Calcola un'espressione con precisione: `+ - * / // % **`, parentesi, `pi`, `e` e `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Data, ora e giorno della settimana attuali in un fuso orario (predefinito *Europe/Vienna*). | `{"timezone": "Europe/Rome"}` |
| `days_between` | Giorni di calendario tra due date (negativo se la fine è precedente). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Conta caratteri, parole, frasi e paragrafi di un testo. | `{"text": "…"}` |

I modelli linguistici sbagliano facilmente i calcoli a mente. Dai la `calculator` agli agenti che lavorano con i numeri e chiedi nel prompt di sistema di usarla.

La libreria mostra le descrizioni degli strumenti integrati nella lingua dell'interfaccia. Il modello riceve sempre la descrizione originale in inglese, così gli agenti esistenti si comportano allo stesso modo in ogni lingua.

## Strumenti server di Anthropic {#server-tools}
<!-- keywords: ricerca web, web search, recupero web, web fetch, esecuzione di codice, code execution, strumenti server, fonti -->

| Strumento server | Effetto | Note |
|---|---|---|
| **Ricerca web** | Cerca sul web e cita le fonti. | Costa 10 $ in più ogni 1.000 ricerche; al massimo 5 ricerche per richiesta. |
| **Recupero web** | Carica il contenuto di una pagina web o di un PDF da un URL. | Al massimo 5 recuperi per richiesta. |
| **Esecuzione di codice** | Esegue Python in una sandbox di Anthropic. | Non usarlo insieme a ricerca web o recupero web (la verifica avvisa). |

Gli strumenti server vengono eseguiti da Anthropic, non sul tuo computer. Anche le loro chiamate compaiono nell'esecuzione.

## La libreria degli strumenti {#bibliothek}
<!-- keywords: libreria, provare, testare, schema di input, vedi codice -->

A sinistra ci sono tutti gli strumenti con tipo e descrizione, a destra i dettagli dello strumento selezionato:

- **Schema di input:** i parametri come schema JSON, come li vede il modello.
- **Vedi codice e test** (per strumenti personali e creati dall'IA).
- **Prova:** inserisci un input JSON (Nodestro precompila uno schema di base) e fai clic su **Esegui**. Lo strumento viene eseguito esattamente come lo chiamerebbe un agente, quindi gli strumenti personali nella sandbox. Non costa nulla, perché non è coinvolto alcun modello. Gli errori sono mostrati in rosso.

## Scrivere strumenti propri {#selbst-schreiben}
<!-- keywords: strumento personale, python, scrivere funzione, docstring, tipi, test, scrivi tu -->

In **Scrivi tu** crei uno strumento come funzione Python. Nodestro precompila un esempio (da Celsius a Fahrenheit).

1. **Nome della funzione:** esattamente il nome della funzione nel codice. Diventa il nome dello strumento.
2. **Codice:** una funzione con **annotazioni di tipo** per tutti i parametri e il valore restituito, e una **docstring** in stile Google. La prima riga diventa la descrizione; la sezione `Args:` descrive i parametri.
3. **Test:** funzioni `test_*` che importano lo strumento con `from tool import <name>` e lo verificano con `assert`.
4. **Controlla e testa** esegue il controllo statico e i test senza salvare.
5. **Salva** controlla di nuovo e salva solo se tutto è superato.

**Esempio:**

```python
def net_price(gross: float, vat_percent: float = 22.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 22 for 22 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_standard_vat():
    assert net_price(122) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

Una buona descrizione è decisiva: il modello sceglie gli strumenti solo in base a nome, descrizione e descrizioni dei parametri. Scrivile in inglese, come il codice.

## Regole per il codice proprio {#regeln}
<!-- keywords: regole, controllo statico, import, moduli consentiti, vietato, open, eval, riservato, sicurezza -->

Il codice proprio e quello creato dall'IA viene **controllato staticamente** prima di ogni esecuzione. È consentito il calcolo puro, senza input e output:

- **Import consentiti:** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- Le **librerie di terze parti** come `numpy` o `pandas` sono consentite dopo la tua approvazione. Girano in un ambiente dedicato (vedi [Librerie Python](/docs/python-bibliotheken#erkennung)). Queste librerie possono accedere alla rete e ai file: approva solo ciò che conosci.
- **Sono vietati**, tra gli altri, `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, l'accesso ad attributi con doppio trattino basso, `global`, `async`/`await` e le istruzioni fuori dalle funzioni (tranne import, classi e assegnazioni).
- **Nessun accesso a rete o file dalla libreria standard:** moduli come `os`, `socket` o `urllib` non sono consentiti.
- **Nomi riservati:** i nomi degli strumenti integrati e `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` e `load_tool` sono già occupati.
- **I test sono obbligatori:** senza almeno un test superato non viene salvato nulla.

L'**esito del controllo** mostra gli errori del controllo statico, ogni test come superato o con il messaggio di errore, e l'output della sandbox.

## Far creare strumenti dall'IA {#ki-erstellen}
<!-- keywords: strumento ia, agente programmatore, coding agent, generare, far creare uno strumento, dinamico, requisito -->

In **Crea con l'IA** descrivi cosa deve saper fare lo strumento (almeno 10 caratteri), per esempio: «Calcola la rata di un prestito a partire da importo, tasso annuo in percentuale e durata in mesi.»

Poi, in background:

1. L'**agente programmatore** (il modello degli assistenti definito nelle impostazioni) scrive la funzione e i test.
2. Codice e test vengono **controllati staticamente**, i test vengono eseguiti nella **sandbox**.
3. Se qualcosa fallisce, l'agente programmatore riceve il messaggio di errore e corregge la proposta; **al massimo tre tentativi** in totale.
4. Quando tutti i test sono superati, la richiesta attende la tua **approvazione**.

Ogni richiesta mostra stato, numero di tentativi e costi. In *Vedi tentativi* trovi il codice di ogni tentativo.

Puoi scrivere il requisito in qualsiasi lingua. Lo strumento in sé viene sempre scritto in inglese (codice, nomi, docstring e test), perché la docstring diventa la descrizione che leggono gli agenti.

**Molto adatti** sono i calcoli puri: formule, conversioni, calcoli con le date, analisi di testi, validazioni. **Non è possibile** creare strumenti che richiedono internet, file o servizi esterni (vedi [Regole](/docs/tools#regeln)).

## Approvazione {#freigabe}
<!-- keywords: approvazione, approvare, rifiutare, approval, verificare, autorizzare -->

Prima che uno strumento creato dall'IA venga aggiunto, vedi codice, test e risultati dei test. Verifica:

- La funzione fa esattamente ciò che hai descritto?
- I test coprono i casi importanti, compresi i casi limite?
- La descrizione è chiara, così che gli agenti usino lo strumento correttamente?

**Approva** aggiunge lo strumento alla libreria; da quel momento tutti gli agenti possono usarlo. **Rifiuta** lo scarta. Senza decisione, una richiesta viene rifiutata automaticamente dopo **un'ora**.

> **Nota:** le richieste sono tenute solo in memoria. Se chiudi Nodestro, l'elenco delle richieste scompare; gli strumenti approvati restano.

## La sandbox {#sandbox}
<!-- keywords: sandbox, docker, subprocess, processo python, isolamento, sicurezza, timeout -->

Gli strumenti personali e creati dall'IA **non vengono mai eseguiti nel processo di Nodestro**. I test e ogni chiamata successiva vengono eseguiti in isolamento:

| Sandbox | Isolamento | Limiti |
|---|---|---|
| **Processo Python** (predefinito) | processo separato con ambiente vuoto in una directory temporanea | 15 secondi, 1 GB di memoria |
| **Docker** | container usa e getta senza rete, con file system in sola lettura, senza privilegi | 20 secondi, 512 MB di memoria, 1 CPU |

La sandbox si sceglie nelle [impostazioni](/docs/einstellungen#sandbox). Docker isola di più, ma deve essere installato e avviato; altrimenti test e chiamate falliscono. Se una chiamata supera il limite di tempo, conta come errore.


## Fiducia e isolamento {#vertrauen}
<!-- keywords: fiducia, non attendibile, origine, generato dall’ia, docker necessario, isolamento necessario, bloccato, limitato, richiede isolamento -->

Nodestro decide in base all’**origine del codice** dove può essere eseguito:

| Origine | Mostrato come | Sandbox *Processo Python* | Sandbox *Docker* |
|---|---|---|---|
| Strumenti integrati e integrazioni | *Integrato* | nel processo di Nodestro | nel processo di Nodestro |
| Scritto da te in *Scrivi tu* | *Scritto da te* | viene eseguito, senza isolamento su questo computer | viene eseguito isolato |
| Creato dall’IA (anche dopo la tua approvazione), bozze di strumenti dell’architetto IA, strumenti di origine sconosciuta | *Richiede isolamento* | **bloccato** | viene eseguito isolato |

Il processo Python non è una barriera di sicurezza: il codice al suo interno ha i tuoi permessi. Per questo Nodestro non vi esegue mai codice generato dall’IA, e né la tua approvazione né un’impostazione lo cambiano. Senza Docker:

- **Crea con l’IA** non parte, e le bozze di strumenti non si possono né testare né approvare;
- gli agenti con uno strumento che richiede isolamento non possono essere eseguiti; il controllo del workflow lo segnala prima dell’avvio;
- gli strumenti che richiedono isolamento non possono ancora usare librerie di terze parti, nemmeno con Docker.

Gli strumenti salvati prima di questa versione, e tutti gli strumenti dopo il ripristino di un backup, sono considerati di origine sconosciuta, anche quelli scritti da te, perché la loro origine non è stata registrata. Con Docker continuano a funzionare. Una nuova versione di uno strumento così, o una copia del suo codice in un nuovo strumento, mantiene questo stato. Per usare queste funzioni, installa e avvia Docker e sceglilo nelle [impostazioni](/docs/einstellungen#sandbox).

## Versioni ed eliminazione {#versionen}
<!-- keywords: versione, eliminare, ritirare, revoke, aggiornare, sovrascrivere -->

Se salvi uno strumento personale con un nome già esistente, viene creata una **nuova versione** e la precedente viene ritirata. Gli agenti usano sempre la versione attuale. La libreria mostra il numero di versione.

**Elimina** ritira uno strumento. Gli agenti a cui è assegnato segnalano poi «Strumenti sconosciuti» e non possono partire finché non rimuovi lì lo strumento o non lo ricrei. Gli strumenti integrati non si possono eliminare.

## Capire gli errori degli strumenti {#fehler}
<!-- keywords: errori degli strumenti, non riuscito, timeout, errore della sandbox, input non valido -->

Nell'esecuzione ogni chiamata a uno strumento si può espandere: input, risultato, momento e durata. Le chiamate non riuscite sono contrassegnate. Cause tipiche:

- **Input non valido:** il modello ha compilato male i parametri. Migliora le descrizioni dei parametri nella docstring.
- **Errore previsto dello strumento** (per esempio divisione per zero): l'agente vede il messaggio e può riprovare.
- **Timeout o crash nella sandbox:** prova lo strumento in *Prova* con lo stesso input.
- **Docker non raggiungibile:** avvia Docker o passa alla sandbox *Processo Python*.

L'impostazione [Errori degli strumenti](/docs/agenten#tool-fehler) stabilisce se gli errori imprevisti terminano l'agente.

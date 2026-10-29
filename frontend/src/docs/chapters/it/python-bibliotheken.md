# Librerie Python

Gli strumenti propri e quelli creati con l'IA possono usare librerie di terze parti come `numpy`, `pandas`, `scipy` o `requests`. Questo capitolo spiega come Nodestro le riconosce, perché approvi ogni libreria in modo esplicito e come funzionano gli ambienti Python separati.

## Panoramica {#ueberblick}
<!-- keywords: librerie, pacchetti, pypi, numpy, pandas, terze parti, dipendenze, uv -->

La libreria standard di Python basta per molti strumenti. Se serve di più:

1. **Riconoscere:** Nodestro legge le importazioni nel codice dello strumento e ne ricava i pacchetti necessari. Non viene scaricato nulla.
2. **Approvare:** Prima di installare qualcosa vedi ogni pacchetto con la sua versione e lo approvi. Senza approvazione non viene installato nulla.
3. **Installare:** Nodestro installa esattamente le versioni approvate con lo strumento di pacchetti **uv** in un ambiente dedicato nella cartella dei dati.
4. **Eseguire:** Lo strumento viene eseguito nella sandbox con il Python di quell'ambiente.

Il Python con cui gira Nodestro stesso non cambia mai. I workflow i cui strumenti usano solo la libreria standard non hanno bisogno di nulla di tutto ciò e funzionano come prima.

> **Importante:** Approvare una libreria non approva il codice di uno strumento. Codice e test li verifichi e approvi come al solito (vedi [Approvazione](/docs/tools#freigabe)).

## Come vengono riconosciute le librerie {#erkennung}
<!-- keywords: import, from import, riconoscimento, nome del modulo, nome del pacchetto, pil, pillow, script, pep 723, dependencies, ambiguo -->

Nodestro analizza `import x` e `from x import y`:

- La **libreria standard** (`math`, `json`, `datetime` …) e il modulo `tool` nei test non richiedono nulla.
- I **moduli noti** vengono associati al pacchetto giusto anche quando i nomi sono diversi: `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- I **moduli sconosciuti** non vengono mai indovinati. Nodestro li segnala e chiede una dichiarazione esplicita.
- Le **importazioni dinamiche** come `importlib.import_module(name)` non si possono risolvere e vengono segnalate.
- Le importazioni dentro un `try: … except ImportError:` sono considerate facoltative.

Pacchetti e intervalli di versioni si dichiarano esplicitamente in un'intestazione all'inizio del codice (formato “inline script metadata”):

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

Sono ammessi solo il nome del pacchetto e la specifica di versione, nessun link né percorso locale.

## Approvazione {#freigabe}
<!-- keywords: approvazione, approvare, autorizzare, versione, indiretto, transitivo, panoramica, installare -->

Con **Verifica e approva** Nodestro risolve le versioni (scaricando solo le informazioni sui pacchetti) e mostra una panoramica:

| Colonna | Significato |
|---|---|
| **Pacchetto** e **Versione** | La versione esatta che verrebbe installata |
| **Tipo** | *diretto* (uno strumento lo importa), *indiretto* (serve a un altro pacchetto) o *runtime* (Nodestro lo include sempre) |
| **Richiesto da** | Gli strumenti o i pacchetti che ne hanno bisogno |
| **Stato** | *Nuovo*, *Approvato*, *Modifica vecchia → nuova* o *Rimosso* |

Controlla l'elenco e fai clic su **Approva e installa**. Le librerie di terze parti possono accedere ai file e alla rete: approva solo pacchetti che conosci.

Nodestro salva ogni approvazione con pacchetto, versione e data. Finché nulla cambia, Nodestro non chiede di nuovo. Serve una nuova approvazione quando:

- uno strumento richiede un **nuovo pacchetto**,
- cambia un **requisito** (ad es. un nuovo intervallo di versioni) e serve quindi un'altra versione,
- è cambiata la **versione di Python**,
- le approvazioni provengono da **un altro computer** o da un'**importazione**.

Nodestro non aggiorna mai in silenzio: nella nuova risoluzione si preferiscono le versioni già approvate e ogni altra versione compare come *Modifica*.

## Librerie nel workflow {#workflow}
<!-- keywords: workflow, ambiente, ispettore, stato, avviare, esecuzione, ambiente dedicato, installare -->

Ogni workflow con librerie riceve un **ambiente dedicato** con approvazioni proprie. Nell'ispettore del workflow (senza nodo selezionato) la sezione **Librerie Python** mostra:

- lo **stato**: *Approvazione necessaria*, *Installazione in sospeso*, *Installazione in corso*, *Approvate e installate* o *Installazione non riuscita*,
- ogni pacchetto necessario con la versione installata e gli strumenti che lo usano,
- le azioni **Verifica e approva**, **Installa** e **Vedi versioni**,
- la **cronologia modifiche** con approvazioni, installazioni e importazioni.

La [verifica](/docs/workflows#pruefung) segnala le approvazioni mancanti come errori. Un workflow si avvia solo quando tutte le librerie sono approvate. Se un ambiente approvato non è ancora installato (ad es. dopo averlo eliminato), Nodestro lo installa all'avvio a partire dalle versioni approvate.

L'ambiente viene creato solo quando serve. I pacchetti scaricati restano in una cache condivisa e vengono riutilizzati da tutti gli ambienti, così un secondo ambiente con gli stessi pacchetti si installa rapidamente.

## Librerie negli strumenti {#tools}
<!-- keywords: strumento, strumento proprio, strumento ia, coding agent, ambiente di test, test, provare, senza librerie -->

Per i **test** di uno strumento con librerie, Nodestro crea un **ambiente di test** dedicato:

- **Scrivi tu:** *Verifica e testa* indica quali librerie servono allo strumento. I test partono solo dopo che le hai approvate nella sezione **Librerie Python dello strumento**. Poi verifichi di nuovo e salvi.
- **Crea con IA:** Se il Coding Agent propone librerie, l'incarico attende con lo stato *In attesa delle librerie*. Vedi la panoramica e scegli **Approva librerie** (installa, poi testa) o **Riscrivi senza librerie**. Il codice lo approvi poi separatamente, come al solito.
- **Prova** nella libreria usa anch'esso l'ambiente di test dello strumento.

L'approvazione per i test non vale automaticamente per i workflow. Se un workflow usa lo strumento, approvi lì le librerie; la panoramica mostra dove sono già approvate.

Gli strumenti con librerie girano con limiti più ampi (60 secondi, 2 GB di memoria), perché caricare pacchetti come `pandas` richiede tempo.

## Architetto di workflow IA {#architekt}
<!-- keywords: architetto, bozza, bozza di strumento, librerie, non installato -->

L'[Architetto di workflow IA](/docs/ki-architekt#tools-freigeben) può proporre bozze di strumenti con librerie. Raccoglie i pacchetti necessari e li mostra nella revisione della bozza, **ma non installa nulla**. Testando una bozza di strumento approvi le librerie per l'ambiente di test; dopo aver applicato la bozza le approvi nel workflow.

## Versioni e riproducibilità {#versionen}
<!-- keywords: versione, lock, riproducibile, fissata, aggiornare, upgrade, conflitto -->

Dopo l'approvazione Nodestro salva una **definizione completa** di tutti i pacchetti con la versione esatta, compresi quelli indiretti. Da essa un ambiente si può sempre ripristinare in modo identico. L'installazione avviene in una cartella separata e sostituisce l'ambiente precedente solo quando tutto è installato e tutte le importazioni funzionano. Se non riesce, l'ambiente precedente resta invariato.

Se due strumenti di un workflow richiedono versioni incompatibili, Nodestro segnala un **conflitto** e indica nei dettagli tecnici i pacchetti coinvolti. Adatta allora le specifiche di versione nell'intestazione `# /// script`.

## Esportazione, importazione e backup {#export}
<!-- keywords: esportare, importare, backup, altro computer, portabile, definizione -->

- L'**esportazione** di un workflow contiene la definizione delle librerie (pacchetti e versioni), ma nessun file installato.
- L'**importazione** riprende la definizione. I pacchetti vanno **approvati di nuovo** su questo computer; la panoramica mostra le versioni importate.
- **Duplicare** riprende anche le versioni, ma richiede un'approvazione propria.
- Un **backup** contiene definizioni e approvazioni. Sullo stesso computer le approvazioni restano valide dopo il ripristino; su un altro vanno concesse di nuovo. Gli ambienti vengono reinstallati quando serve.

## Manutenzione e pulizia {#wartung}
<!-- keywords: manutenzione, pulire, riordinare, spazio, cache, orfano, eliminare, impostazioni -->

Nelle [impostazioni](/docs/einstellungen) la sezione **Ambienti Python** mostra le versioni di uv e Python, la dimensione della cache e ogni ambiente con proprietario, numero di pacchetti, dimensione e data di installazione.

- **Elimina ambiente** rimuove i file installati. Le approvazioni restano; l'ambiente viene reinstallato la prossima volta che serve.
- Gli ambienti **orfani** appartengono a un workflow o a uno strumento eliminato.
- **Pulisci orfani** elimina tutti gli ambienti orfani con la loro definizione e ripulisce la cache.

Nodestro non elimina mai un ambiente senza una tua azione.

## Risolvere i problemi {#probleme}
<!-- keywords: errore, conflitto, non trovato, rete, uv mancante, docker, installazione non riuscita, registro -->

| Messaggio | Soluzione |
|---|---|
| **Nessun pacchetto noto per il modulo** | Dichiara il pacchetto nell'intestazione `# /// script`. |
| **Un'importazione per nome non si può risolvere** | Importa il modulo direttamente con `import`. |
| **Il pacchetto non esiste** | Controlla come è scritto il nome del pacchetto. |
| **Nessuna versione compatibile** / **Conflitto** | Allarga la specifica di versione o allineala tra gli strumenti. |
| **Indice dei pacchetti non raggiungibile** | Controlla la connessione a internet; gli ambienti installati funzionano anche offline. |
| **uv non trovato** | Reinstalla Nodestro; uv viene installato con esso. |
| **Solo nella sandbox di processo** | Gli strumenti con librerie non girano nella sandbox Docker. Imposta la [sandbox](/docs/einstellungen#sandbox) su *Processo Python*. |

Se un'installazione non riesce, il **registro dell'installazione** mostra l'output di uv. **Installa di nuovo** avvia un nuovo tentativo.

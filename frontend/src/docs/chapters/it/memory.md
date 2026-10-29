# Memoria

Con la memoria un agente ricorda informazioni oltre il singolo compito: preferenze, decisioni, stati di avanzamento o regole apprese. Questo capitolo spiega i tipi di memoria, gli spazi di memoria e il browser della memoria.

## Come funziona la memoria {#ueberblick}
<!-- keywords: memoria, memory, strumento memoria, /memories, note, ricordare -->

Nodestro usa lo **strumento di memoria** di Orkexa: con i modelli di Anthropic lo strumento di memoria proprio di Anthropic, con gli altri provider uno strumento normale con gli stessi comandi (il modello deve supportare gli strumenti). Un agente con memoria riceve un piccolo file system in `/memories`, in cui crea, legge, modifica, rinomina ed elimina da solo file di testo. Il modello decide da solo cosa ricordare: di solito consulta la memoria all’inizio di un compito e annota poi le novità.

La memoria è **testo semplice** (per lo più Markdown). Per i documenti originali come i PDF usa la [Conoscenza](/docs/wissen).

## Tipi di memoria {#arten}
<!-- keywords: disattivata, per esecuzione, permanente, persistent, ephemeral, modalità -->

| Tipo | Durata | Condivisione | Uso |
|---|---|---|---|
| **Disattivata** | – | – | L'agente non ricorda nulla oltre il compito (predefinito). |
| **Per esecuzione** | un'esecuzione | no, ogni agente ha la propria | Blocco note per compiti lunghi con molti turni di strumenti; le note compaiono poi nell'esecuzione. |
| **Permanente** | finché non la elimini | sì, tramite lo spazio di memoria | Conoscenza che cresce nel corso di molte esecuzioni: preferenze dei clienti, stato dei progetti, decisioni. |

## Memoria per esecuzione {#pro-lauf}
<!-- keywords: per esecuzione, ephemeral, blocco note, scratchpad, scheda memoria -->

Con *Per esecuzione* l'agente inizia ogni esecuzione con la memoria vuota. Quello che annota compare nell'esecuzione, accanto all'agente, nella scheda **Memoria**. Gli altri agenti della stessa esecuzione non vedono queste note; le informazioni tra agenti passano attraverso i [collegamenti](/docs/workflows#datenfluss).

## Memoria permanente e spazi di memoria {#dauerhaft}
<!-- keywords: permanente, spazio di memoria, space, condividere, comune, persistent, namespace -->

Con *Permanente* scegli uno **spazio di memoria**. Uno spazio è un file system `/memories` separato nel database di Nodestro. Resta disponibile tra esecuzioni e riavvii.

- **Creare un nuovo spazio:** nell'ispettore inserisci un nome in *Nuovo spazio di memoria* e fai clic su **Crea**, oppure usa **Nuova memoria** nella pagina *Memoria*. Sono ammessi lettere, cifre, spazi, `_`, `.` e `-` (al massimo 64 caratteri).
- **Condividere:** più agenti con lo stesso spazio leggono e scrivono gli stessi file, anche in workflow diversi. Così, per esempio, un agente può annotare i desideri dei clienti e un altro tenerne conto.
- Uno spazio creato nell'ispettore compare nella pagina *Memoria* non appena l'agente ha scritto il primo file.

Se due agenti con lo stesso spazio vengono eseguiti in parallelo, vi accedono a turno; ogni singola modifica è completa, ma possono sovrascriversi a vicenda il contenuto. Assegna agli agenti paralleli file o spazi diversi.

## Il browser della memoria {#browser}
<!-- keywords: pagina memoria, browser, modificare, creare file, svuotare, vedere contenuto -->

La pagina **Memoria** mostra tutti gli spazi con numero e dimensione dei file. Scegli uno spazio per vederne i file:

- **Vedere e modificare un file:** scegli il file, modifica il testo, **Salva**.
- **Creare un file:** inserisci un percorso (per esempio `clienti/preferenze.md`); viene creato in `/memories`.
- **Eliminare un file:** simbolo del cestino accanto al percorso.
- **Svuotare uno spazio:** elimina definitivamente tutti i file dello spazio dopo conferma.

Così puoi verificare, correggere o precompilare la memoria in qualsiasi momento. Nell'ispettore, **Vedi contenuto** porta direttamente allo spazio dell'agente.

## Configurare la memoria con l'IA {#assistent}
<!-- keywords: assistente memoria, configura con l'ia, proposta, struttura, file iniziali -->

**Configura con l'IA** (nell'ispettore, con *Permanente*) propone una struttura iniziale:

1. Descrivi cosa deve ricordare l'agente, per esempio «le preferenze dei singoli clienti, le decisioni prese e i punti aperti per progetto».
2. L'assistente della memoria (il modello degli assistenti definito nelle impostazioni) propone da due a cinque file con contenuto, tra cui un `README.md` che spiega la struttura all'agente. Non inventa fatti, ma lascia segnaposto.
3. Verifica e modifica le proposte, scegli lo spazio e fai clic su **Salva nello spazio**. L'agente viene impostato su questo spazio.

Non viene salvato nulla finché non confermi. La proposta costa una richiesta al modello degli assistenti.

I file proposti vengono scritti nella lingua dell'interfaccia, a meno che la tua descrizione non ne chieda un'altra. I nomi dei file restano in inglese.

## Casi d'uso {#anwendungsfaelle}
<!-- keywords: casi d'uso, esempi, clienti, progetto, imparare, preferenze -->

- **Assistenza clienti:** un agente ricorda preferenze e richieste precedenti di ogni cliente in `customers/<nome>.md`.
- **Progetti in corso:** un agente di progetto tiene `decisions.md` e `open-items.md` e riparte da lì all'esecuzione successiva.
- **Revisione che impara:** un agente revisore raccoglie gli errori ricorrenti in `error-catalogue.md` e in futuro li verifica in modo mirato.
- **Ricerche lunghe:** con *Per esecuzione* un agente annota i risultati intermedi invece di perderli nella conversazione.

## Note e limiti {#hinweise}
<!-- keywords: limiti, sicurezza, segreti, password, costi, nome dello strumento memory -->

- **Niente segreti:** ciò che un agente legge dalla memoria diventa parte della richiesta al provider di IA. Non salvare password o chiavi.
- **Costi:** gli accessi alla memoria sono turni di strumenti. I file grandi costano token a ogni lettura; mantieni i file piccoli e ben strutturati.
- **Percorsi:** tutti i percorsi sono in `/memories`. I percorsi al di fuori vengono rifiutati.
- **Nome riservato:** il nome di strumento `memory` è occupato dallo strumento memoria; uno strumento personale con questo nome non può essere usato insieme alla memoria.
- **Turni di strumenti max.:** ogni azione sulla memoria conta come chiamata a uno strumento. Aumenta il limite se un agente legge e scrive molto.

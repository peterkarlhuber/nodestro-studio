# Fichiers en entrée

Les workflows peuvent recevoir des fichiers directement en entrée : contrats, factures, tableurs, images ou archives ZIP entières. Vous les envoyez au démarrage, sans les reprendre d’abord dans les connaissances. Nodestro les vérifie et les lit localement et donne aux agents exactement ce dont ils ont besoin.

## Aperçu {#ueberblick}
<!-- keywords: fichier, fichiers, envoi, téléverser, entrée, document, pièce jointe, démarrage -->

- Dans le formulaire de saisie du nœud **Départ**, vous ajoutez des champs de type **Fichier**. Au démarrage, vous y déposez des fichiers ou vous les choisissez.
- Même sans formulaire, vous pouvez envoyer des fichiers ou les choisir dans les connaissances sous *Fichiers* dans la boîte de démarrage.
- Les fichiers envoyés appartiennent à l’**exécution**, pas aux connaissances. Ils figurent dans la vue détaillée de l’exécution sous *Fichiers reçus*.
- Ce qui doit rester disponible pour tous les agents, vous le reprenez explicitement [dans les connaissances](/docs/wissen#sammlungen).

## Champs de fichier {#datei-felder}
<!-- keywords: champ de fichier, formulaire, glisser-déposer, dossier, choisir -->

Un champ de fichier accepte des fichiers par glisser-déposer ou via **Choisir des fichiers**. Chaque fichier est envoyé et vérifié immédiatement. La liste affiche nom, format, taille, état et, en cas de refus, la raison. Avant le démarrage, vous pouvez retirer des fichiers et voir avec l’icône en forme d’œil ce que Nodestro a lu.

L’exécution ne démarre que lorsque tous les fichiers sont envoyés. Les fichiers refusés ne font jamais partie de l’exécution.

Dans la tâche d’un agent, `{{form.<nom>}}` représente les noms des fichiers du champ. L’agent reçoit en plus les contenus, comme décrit sous [Transmission aux agents](/docs/datei-eingaben#uebergabe). Plus sur les formulaires : [Formulaires de saisie](/docs/verzweigungen#eingabeformular).

## Réglages du champ {#feld-einstellungen}
<!-- keywords: réglages, types acceptés, plusieurs fichiers, maximum, taille, mo, limite -->

Dans l’inspecteur du nœud Départ, chaque champ de fichier a une section *Options de fichier*. Fermée, elle résume le choix actuel en une ligne, par exemple « tous les formats · jusqu’à 20 Mo · plusieurs fichiers · Automatique ». Ouverte, elle montre ces réglages :

| Réglage | Signification |
|---|---|
| Types de fichiers acceptés | groupes (texte, données, documents, images, archives ZIP) ou formats individuels ; sans sélection, tout est accepté |
| Plusieurs fichiers | désactivé : exactement un fichier ; activé : plusieurs fichiers |
| Nombre maximal de fichiers | limite facultative avec plusieurs fichiers |
| Mo maximum par fichier | 20 Mo par défaut, au plus 50 Mo |
| Transmission aux agents | *Automatique*, *Toujours le contenu* ou *Aperçu, contenu sur demande* |

## Champs obligatoires et facultatifs {#optionale-felder}
<!-- keywords: obligatoire, facultatif, vide, manquant, non indiqué, est vide -->

Chaque champ, pas seulement les champs de fichier, est **obligatoire** ou **facultatif**. Un champ obligatoire doit être rempli avant le démarrage. Un champ facultatif vide reste vide :

- Dans la tâche d’un agent, il apparaît comme « (not provided) », afin que l’agent sache que rien n’a été indiqué.
- Les nœuds de décision voient une valeur vide et peuvent la tester avec *est vide*.
- Les champs de fichier vides ne créent aucune référence de fichier. Cela vaut aussi pour les sous-workflows, les API publiées et les projets exportés.

## Formats pris en charge {#formate}
<!-- keywords: formats, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, image, zip -->

| Groupe | Formats | Ce que Nodestro lit |
|---|---|---|
| Texte | TXT, Markdown, code source | le texte |
| Données | CSV, JSON, Excel (XLSX) | des tableaux avec colonnes ; Excel avec toutes les feuilles |
| Documents | PDF, Word (DOCX) | le texte avec titres et tableaux ; les pages pour les PDF |
| Images | PNG, JPG, WebP | l’image ; le texte reconnu si l’OCR est activé |
| Archives | ZIP | l’arborescence et chaque fichier contenu séparément |

Nodestro vérifie le **contenu réel**, pas seulement l’extension : un fichier renommé, un fichier endommagé ou un JSON invalide est refusé avec une raison compréhensible. Les PDF scannés sans couche texte sont lus par OCR si la reconnaissance de texte est activée. Les formules Excel ne sont jamais calculées ; la valeur enregistrée est lue.

## Plusieurs fichiers et dossiers {#mehrere-dateien}
<!-- keywords: plusieurs fichiers, dossier, répertoire, collection, chemins relatifs -->

Avec **Choisir un dossier**, ou en déposant un dossier, vous envoyez tous ses fichiers. Les chemins relatifs restent dans le nom du fichier (p. ex. `Justificatifs/2024/Facture.pdf`). Les fichiers système cachés sont ignorés. Pour un très grand nombre de fichiers, une archive ZIP convient mieux.

## Archives ZIP {#zip-archive}
<!-- keywords: zip, archive, décompresser, arborescence, structure, dossier, fichiers individuels -->

Une archive ZIP est une collection structurée. Nodestro affiche son contenu sous forme d’arborescence avec les tailles et indique ce qui peut être lu. Cliquez sur un fichier de l’arborescence pour voir ce que Nodestro en lit.

Les agents reçoivent d’abord un **aperçu** de l’archive, puis lisent des fichiers précis avec l’outil `input_files` (commandes `list`, `read` et `search`). Ainsi, une grande archive reste dans les limites du contexte. Les archives contenues dans l’archive sont listées, mais pas ouvertes.

## Transmission aux agents {#uebergabe}
<!-- keywords: transmission, contexte, gros fichiers, tokens, limite de contexte, multimodal, image, ocr, aperçu -->

Les agents qui reçoivent des entrées du nœud Départ obtiennent les fichiers de l’exécution. Nodestro choisit la forme de manière à garder la structure et à ne pas déborder du contexte :

- **Textes et tableaux** arrivent en texte tant qu’ils tiennent (environ 60 000 caractères par fichier, 150 000 pour tous les fichiers ensemble).
- **Les PDF** avec couche texte arrivent comme document (texte et mise en page), jusqu’à 100 pages.
- **Les images**, l’agent les voit lui-même si le modèle comprend les images. Sinon, c’est signalé. Avec l’OCR, vous voyez si l’agent a reçu le texte reconnu ou l’image.
- **Les gros fichiers et les archives** arrivent sous forme d’aperçu. L’agent lit les parties utiles avec `input_files`, p. ex. certaines pages, une feuille ou des plages de lignes.

Le réglage *Transmission aux agents* impose le contenu ou l’aperçu. Pour les agents, le contenu envoyé est toujours une **donnée, pas une instruction** : Nodestro le signale en conséquence.

## Traçabilité {#nachvollziehen}
<!-- keywords: traçabilité, trace, contexte, quels fichiers, aperçu, envoyé au modèle, transparence -->

- L’**aperçu de l’entrée** d’un agent montre avant le démarrage quels fichiers il reçoit et sous quelle forme.
- Dans la vue détaillée d’une exécution, l’onglet *Contexte* de chaque étape montre quels fichiers sont allés au modèle et comment (en texte, en document PDF, en image, en texte reconnu ou en aperçu).
- Les appels à `input_files` figurent avec entrée et sortie sous *Outils*.
- *Fichiers reçus* liste tout ce que l’exécution a reçu et si cela a depuis été repris dans les connaissances.

## Entrée ou connaissances ? {#eingabe-oder-wissen}
<!-- keywords: différence, entrée, connaissances, knowledge, mémoire, durable, ponctuel -->

| | Fichier en entrée | Connaissances | Mémoire |
|---|---|---|---|
| Usage | matériau de cette exécution | documents pour de nombreuses exécutions et agents | notes écrites par l’agent lui-même |
| Stockage | avec l’exécution | sur la page *Connaissances* | dans l’espace mémoire |
| Recherche | seulement dans l’exécution | oui, pour les agents attribués | via l’outil de mémoire |

Les fichiers d’entrée n’arrivent jamais automatiquement dans les connaissances.

## Reprendre dans les connaissances {#knowledge-uebernahme}
<!-- keywords: reprendre, connaissances, collection, confirmer, provenance, doublon, résultat -->

Avec **Vers les connaissances**, vous reprenez explicitement :

- les fichiers envoyés d’une exécution ; pour les archives ZIP, des fichiers précis de l’arborescence,
- les fichiers de résultat (voir [Fichiers de résultat](/docs/dateien#ergebnisdateien)),
- le résultat d’une étape et les propositions d’agents.

Avant l’enregistrement, la boîte de dialogue montre ce qui serait enregistré, si le fichier est consultable par recherche, si le même contenu existe déjà (il n’est pas enregistré deux fois) et les contenus semblables. Les textes générés peuvent être modifiés avant l’enregistrement et marqués comme *extrait des sources*, *généré par un agent* ou *hypothèse*. Vous choisissez une collection ou en créez une nouvelle.

Rien n’est enregistré avant votre confirmation, et uniquement le contenu vérifié : si vous changez quelque chose ensuite, vous vérifiez à nouveau. Chaque fichier garde sa provenance (workflow, étape, agent, exécution, moment, fichiers sources). Les workflows en cours ne changent pas.

## Propositions des agents {#vorschlaege}
<!-- keywords: proposition, propositions, l’agent propose, propose_knowledge, proposer des connaissances -->

Dans la section *Connaissances* d’un agent, activez **Peut proposer du contenu pour les connaissances**. L’agent reçoit alors l’outil `propose_knowledge` et son résultat est proposé après l’exécution. Les propositions apparaissent à l’étape de l’exécution et ne sont enregistrées qu’après votre vérification et confirmation.

## Sous-workflows, tests et planifications {#sub-workflows}
<!-- keywords: sous-workflow, série de tests, lot, planification, validation, reprise, redémarrage -->

- **Sous-workflows :** un champ de fichier du sous-workflow reçoit avec `{{form.<champ>}}` les fichiers d’un champ ou avec `{{files}}` tous les fichiers de l’exécution. Les mêmes fichiers enregistrés sont transmis, sans copie.
- **Validations et reprise :** les fichiers restent enregistrés tant qu’une exécution attend, tourne ou est en pause, y compris après un redémarrage de Nodestro.
- **Cas de test et planifications :** les fichiers que vous y envoyez restent enregistrés pour le cas de test ou la [planification](/docs/automatisierung#zeitplaene) et servent à chaque exécution. Les fichiers d’exécutions antérieures ne sont jamais réutilisés en silence.

## Fichiers via l’API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, envoi, curl, export, fastapi -->

Les workflows publiés acceptent les fichiers de deux façons :

- en JSON avec `name`, `media_type` et `content_base64` dans la valeur du champ de fichier,
- en `multipart/form-data` : une partie par fichier portant le nom du champ de fichier, les autres champs en JSON dans la partie `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/verifier-contrats/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"client": "ACME"}' \
  -F "contrat=@contrat.pdf"
```

Les mêmes vérifications et limites que dans Nodestro s’appliquent. Un [projet FastAPI exporté](/docs/api-und-export#export) traite les fichiers avec le même moteur. Les fichiers envoyés ne font jamais partie de l’export.

## Stockage et nettoyage {#speicherung}
<!-- keywords: stockage, nettoyage, supprimer, espace disque, sauvegarde, restauration -->

Les fichiers envoyés sont conservés dans le dossier de données sous `inputs`, ni dans la base de données ni dans le workflow. Un contenu identique n’est enregistré qu’une fois.

- Les fichiers des exécutions en attente, en cours ou en pause ne sont jamais supprimés.
- Au démarrage, Nodestro nettoie les fichiers que plus rien n’utilise depuis plus d’un jour. Sous *Paramètres*, vous voyez l’espace occupé et supprimez les fichiers inutilisés ou ceux des exécutions terminées au-delà d’un certain âge.
- La suppression d’une exécution libère ses fichiers si rien d’autre ne les utilise.
- Les sauvegardes contiennent les fichiers d’entrée et les restaurent.

## Sécurité {#sicherheit}
<!-- keywords: sécurité, bombe zip, chemin, lien symbolique, exécuter, macro, confiance -->

- Les archives ne sont jamais exécutées ni décompressées sur le disque. Nodestro lit des entrées précises en mémoire.
- Les chemins dangereux (comme `../`), les liens, les entrées chiffrées et les fichiers programmes sont ignorés et signalés dans l’arborescence.
- Des limites protègent contre les bombes ZIP : les archives de plus de 5 000 entrées, de plus de 512 Mo décompressées ou à compression suspecte sont refusées ; les entrées de plus de 25 Mo sont ignorées.
- Le contenu des fichiers envoyés n’est pas fiable. Les agents ne suivent pas ses instructions comme des instructions système.

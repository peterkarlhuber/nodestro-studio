# Connaissances

Dans *Connaissances*, vous déposez des fichiers que les agents utilisent comme documentation de référence : manuels, rapports, contrats, tableaux ou images. Ce chapitre explique les formats, les trois modes d’utilisation et le fonctionnement de la recherche.

## Aperçu {#ueberblick}
<!-- keywords: connaissances, base de connaissances, fichiers, connaissances de fond, rag, documents -->

Les connaissances fonctionnent en trois étapes :

1. **Importer** sur la page *Connaissances*. Les textes et PDF sont automatiquement indexés pour la recherche plein texte.
2. **Attribuer** dans l’inspecteur d’un agent (section *Connaissances*). Un agent ne voit que les fichiers qui lui sont attribués.
3. **Choisir le mode :** *Dans le contexte*, *À la demande* ou *Recherche*.

Un fichier peut être attribué à autant d’agents que vous le souhaitez.

## Importer des fichiers {#hochladen}
<!-- keywords: importer, upload, glisser-déposer, glisser, description -->

Cliquez sur **Importer des fichiers** ou faites glisser des fichiers dans la zone de dépôt ; plusieurs à la fois sont possibles. Chaque fichier affiche sa taille, son type, le nombre d’extraits indexés et son ancienneté. Le nom du fichier ouvre l’original dans un nouvel onglet.

Si vous importez à nouveau **exactement le même fichier**, aucun doublon n’est créé : l’identifiant dépend du contenu, et le nom et la description sont mis à jour.

Vous pouvez aussi importer des fichiers directement dans la section *Connaissances* d’un agent ; ils arrivent ici, sans collection, et sont aussitôt attribués à cet agent ([Agents](/docs/agenten#wissen)).

## Formats et limites {#formate}
<!-- keywords: formats, pdf, image, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, taille, limite, mo -->

| Type | Formats | Taille | Recherche possible |
|---|---|---|---|
| Documents | PDF | jusqu’à 20 Mo | oui, page par page (PDF avec couche texte ou après OCR) |
| Office | Word (DOCX), Excel (XLSX), convertis en Markdown | jusqu’à 20 Mo | oui |
| Textes | TXT, Markdown, CSV, JSON, YAML, HTML, XML | jusqu’à 20 Mo | oui |
| Images | PNG, JPEG, GIF, WebP | jusqu’à 5 Mo | non |

Les textes doivent être encodés en UTF-8. Word et Excel sont convertis au téléversement ; les formules sont affichées, jamais calculées (voir [Word et Excel](/docs/dateien#dokumentformate)). Les **PDF scannés** sans couche texte sont enregistrés et peuvent être lus dans le contexte ou à la demande, mais ne deviennent consultables par recherche qu’après une [reconnaissance de texte (OCR)](/docs/dateien#ocr).

## Indexation {#indexierung}
<!-- keywords: index, indexation, extraits, chunks, fts5, plein texte -->

À l’import, Nodestro découpe le texte en **extraits** d’environ 1 500 caractères avec 200 caractères de chevauchement, aux limites de paragraphe. Les PDF sont indexés page par page ; les résultats portent alors des titres comme « Rapport, p. 3 ». Le nombre d’extraits est indiqué pour chaque fichier.

L’index est une recherche plein texte SQLite (FTS5 avec classement BM25) directement dans la base de données de Nodestro. Aucun service externe ni modèle d’embeddings n’est nécessaire, et l’indexation ne coûte rien.

## Les trois modes {#modi}
<!-- keywords: dans le contexte, à la demande, recherche, on demand, context, search, outil files, outil search, mode -->

| Mode | Ce que reçoit l’agent | Adapté pour | Coûts |
|---|---|---|---|
| **Dans le contexte** | Tous les fichiers attribués, en entier, au début du prompt. | Quelques documents courts toujours nécessaires (charte rédactionnelle, liste de prix). Images aussi. | Chaque requête contient tous les fichiers ; le cache rend les répétitions bon marché. |
| **À la demande** | Un catalogue (nom, type, taille, description) et l’outil `files`, avec lequel il charge des fichiers entiers. | Collections moyennes dont seuls quelques fichiers servent à chaque tâche. Images et PDF numérisés aussi. | Seuls les fichiers chargés coûtent des tokens. |
| **Recherche** | L’outil `search`, qui renvoie les extraits les plus pertinents avec leur source (RAG). | Grands documents et collections dont on a besoin de faits précis. | Seuls les extraits trouvés coûtent des tokens. |

**Recommandations :**

- En mode *À la demande*, l’agent choisit le fichier à charger d’après sa **description**. Soignez les descriptions.
- En mode *Recherche*, l’agent peut chercher plusieurs fois avec des termes différents. Demandez-lui dans le prompt système d’étayer ses affirmations par des sources.
- Les images et les PDF sans texte sont invisibles en mode *Recherche*.

## Citations {#zitate}
<!-- keywords: citations, sources, passages, étayer -->

**Activer les citations** s’applique au mode *Dans le contexte* : la réponse renvoie alors aux passages exacts des documents. En mode *Recherche*, les résultats contiennent toujours leurs sources.

Les citations **ne peuvent pas être combinées avec un format de sortie structuré** ; la vérification le signale comme une erreur.

## Joindre des fichiers au lancement {#start-dateien}
<!-- keywords: joindre des fichiers, boîte de dialogue de lancement, ponctuel, par exécution, pièce jointe -->

Dans la boîte de dialogue de lancement, vous pouvez choisir sous **Joindre des fichiers** des fichiers de connaissances pour **cette seule exécution**. Ils sont placés directement dans le contexte des premiers agents, c’est-à-dire ceux reliés au départ ou sans prédécesseur. Les agents suivants ne les reçoivent pas, seulement les résultats de leurs prédécesseurs.

Vous pouvez ainsi lancer un workflow avec un contrat différent à chaque fois, sans reconfigurer les agents. Le fichier doit d’abord être importé dans *Connaissances*.

## Tester la recherche {#suche}
<!-- keywords: tester la recherche, terme recherché, score, résultats, bm25, accents -->

À droite de la page *Connaissances*, vous testez la recherche sur **tous** les fichiers indexés, exactement comme un agent l’utilise en mode *Recherche* (l’agent ne cherche que dans ses fichiers attribués). Chaque résultat affiche son titre, un extrait et le **score** (pertinence ; plus il est élevé, mieux c’est).

Caractéristiques de la recherche :

- Les accents sont normalisés : « eleve » trouve « élève ».
- Les mots correspondent aussi en début de mot : « garantie » trouve « garanties ».
- C’est une recherche par mots-clés, pas par le sens : les synonymes ne sont pas trouvés. Formulez les termes tels qu’ils figurent dans le document.

Le champ de filtre à gauche ne cherche que dans les noms de fichiers et les descriptions.

## Collections et provenance {#sammlungen}
<!-- keywords: collection, collections, classer, provenance, repris, recherche -->

Les collections regroupent les fichiers de connaissances, p. ex. « Contrats » ou « Données produit ». À l’envoi, choisissez une collection sous *Envoyer dans la collection* ; vous pouvez la changer ensuite pour chaque fichier. Les puces au-dessus de la liste filtrent par collection. Les agents reçoivent toujours exactement les fichiers qui leur sont attribués.

Le contenu des exécutions (fichiers envoyés, fichiers de résultat, résultats et propositions d’agents) n’arrive dans les connaissances qu’après votre confirmation, voir [Reprendre dans les connaissances](/docs/datei-eingaben#knowledge-uebernahme). Ces fichiers indiquent sous *Provenance* de quel workflow, étape et exécution ils viennent et si le contenu est extrait, généré ou une hypothèse.

## Gérer les fichiers {#verwalten}
<!-- keywords: modifier la description, supprimer, gérer, retirer -->

- **Description :** saisissez-la directement à côté du fichier ; elle est enregistrée quand vous quittez le champ. Une bonne description indique le contenu, la période et l’objectif, par exemple « Rapport annuel 2025 avec bilan et rapport sur les risques ».
- **Supprimer :** symbole de corbeille. Le fichier et son index sont supprimés. Les agents auxquels il était attribué continuent de fonctionner et ne le reçoivent simplement plus. **Utilisé dans**, sous le nom du fichier, cite les workflows, agents de la bibliothèque et API publiées qui utilisent le fichier. S’il est utilisé, la boîte de dialogue de suppression énumère ces endroits avant la suppression.

## Conseils et erreurs fréquentes {#tipps}
<!-- keywords: conseils, erreurs, l’agent ne trouve rien, trop cher, contexte trop grand -->

- **L’agent ne trouve rien :** vérifiez dans *Tester la recherche* si le fichier est indexé et si le terme est trouvé. Si le fichier est un PDF numérisé, utilisez *À la demande*.
- **Les exécutions coûtent cher :** de nombreux gros fichiers *Dans le contexte* remplissent chaque requête. Passez à *À la demande* ou *Recherche*.
- **Fenêtre de contexte dépassée :** trop de fichiers, ou des fichiers trop volumineux, dans le contexte provoquent une erreur de l’API. Répartissez les connaissances ou utilisez la recherche.
- **Réponse sans sources :** demandez explicitement dans le prompt système d’étayer les affirmations par des sources.

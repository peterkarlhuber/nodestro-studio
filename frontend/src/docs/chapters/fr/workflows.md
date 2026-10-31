# Workflows

Un workflow relie des agents pour former une chaîne. Ce chapitre explique comment créer des workflows, relier des nœuds, comment les données circulent entre les agents et comment lancer une exécution.

## Créer et gérer des workflows {#anlegen}
<!-- keywords: nouveau workflow, créer, supprimer, dupliquer, copie, aperçu -->

La page **Workflows** affiche tous les workflows sous forme de cartes avec le nombre d’agents, la dernière modification et le statut de la dernière exécution.

La page propose trois façons équivalentes de commencer : **Créer avec l’IA** ouvre la boîte de dialogue d’un nouveau workflow avec l’[architecte IA](/docs/ki-architekt#neu-erstellen), **Partir d’un exemple** ouvre la [galerie d’exemples](/docs/beispiele) et **Le construire vous-même** ouvre la même boîte de dialogue pour un workflow vide. Tant qu’il n’y a aucun workflow, elles apparaissent sous forme de grandes tuiles, ensuite comme une ligne étroite au-dessus de la liste.

- **Nouveau workflow :** saisissez un nom et une description facultative. Le nouveau workflow contient déjà *Départ → Agent → Résultat*.
- **Créer avec l’IA :** dans la même boîte de dialogue, décrivez votre projet et l’[architecte de workflows](/docs/ki-architekt#neu-erstellen) conçoit le workflow pour que vous le vérifiiez.
- **Ouvrir :** cliquez sur la carte.
- **Dupliquer :** symbole de copie sur la carte. La copie s’appelle « … (copie) » ; les exécutions ne sont pas copiées.
- **Supprimer :** symbole de corbeille. Les exécutions précédentes restent disponibles dans *Exécutions*.

## Favoris et étiquettes {#favoriten-tags}
<!-- keywords: favori, favoris, étoile, étiquette, étiquettes, tag, filtrer, ranger -->

Les workflows, modèles d’agents et outils peuvent être marqués comme favoris avec l’**étoile**. Les favoris figurent toujours en tête des listes. L’**icône d’étiquette** ajoute des étiquettes comme « Client A » ou « Brouillon » ; les étiquettes existantes sont proposées.

Au-dessus des listes, vous filtrez par **Favoris uniquement** et par étiquette. Les favoris et les étiquettes sont enregistrés à part des objets : ils ne modifient ni les workflows, ni les agents, ni les outils, et apparaissent aussi dans la [recherche](/docs/start#suche). Il n’y a volontairement pas de dossiers.

## L’éditeur {#editor}
<!-- keywords: canevas, canvas, palette, blocs, inspecteur, vue d’ensemble de l’exécution, zoom, minimap -->

L’éditeur comporte quatre zones :

1. **Barre de titre :** nom, *Exporter*, *Enregistrer*, *Ajouter un agent* et *Lancer le workflow*.
2. **Canevas :** les nœuds et les connexions. En haut à gauche, vous voyez s’il y a des modifications non enregistrées et combien d’agents et de connexions compte le workflow. En bas à gauche se trouvent le zoom, *Tout afficher*, *Organiser automatiquement* ainsi que *Annuler* et *Rétablir*. En haut à droite, une carte d’ensemble montre tout le workflow.
3. **Blocs (palette) :** *Agent* (vide), *Décrire un agent* (l’IA conçoit la configuration), *Départ*, *Résultat* et jusqu’à huit modèles de la bibliothèque d’agents. Faites glisser un bloc sur le canevas ou cliquez dessus.
4. **Inspecteur (à droite) :** sans sélection, il affiche les réglages du workflow ; sinon, la configuration du nœud sélectionné.

Sous le canevas se trouve la **Vue d’ensemble de l’exécution** avec la dernière exécution de ce workflow.

Les blocs, l’inspecteur (intitulé *Propriétés*) et la vue d’ensemble de l’exécution sont des panneaux. Le bouton dans l’en-tête d’un panneau le masque ou l’affiche ; un panneau masqué laisse une barre étroite, et les blocs restent alors accessibles sous forme d’icônes. Le séparateur entre un panneau et le canevas modifie sa taille : faites-le glisser, ou sélectionnez-le avec *Tab* et utilisez les flèches (avec *Maj* par pas plus grands). Un double-clic sur le séparateur rétablit la taille par défaut. Lorsque l’inspecteur est masqué, sa barre indique le nœud sélectionné ; un double-clic sur un nœud affiche ses propriétés. Nodestro mémorise la disposition dans ce navigateur pour tous les workflows. Elle ne fait pas partie du workflow : la modifier ne crée jamais de modifications non enregistrées ni d’étape d’annulation, et un workflow en cours continue de s’exécuter.

## Types de nœuds {#knoten}
<!-- keywords: départ, résultat, sortie, agent, nœud, entrée -->

| Nœud | Rôle | Entrées | Sorties |
|---|---|---|---|
| **Départ** | Fournit l’entrée que vous saisissez au lancement. En option avec une *Proposition d’entrée* ou un [formulaire d’entrée](/docs/verzweigungen#eingabeformular). | aucune | autant que voulu |
| **Agent** | Appelle son modèle d’IA avec sa configuration et renvoie un résultat (texte ou JSON). | autant que voulu | autant que voulu |
| **Décision** | Choisit une ou plusieurs branches selon des règles fixes, sans requête à l’IA. | une ou plusieurs | une sortie par branche |
| **Validation** | Arrête l’exécution jusqu’à ce qu’une personne valide ou refuse. | autant que voulu | *Validé*, *Refusé* |
| **Sous-workflow** | Exécute un autre workflow enregistré comme une seule étape. | autant que voulu | autant que voulu |
| **Résultat** | Rassemble les résultats des agents reliés comme sortie du workflow, en option aussi sous forme de fichiers. | autant que voulu | aucune |

Les nœuds Départ et Résultat sont facultatifs : les agents sans prédécesseur reçoivent automatiquement l’entrée de l’exécution et, sans nœud Résultat, la sortie des derniers agents tient lieu de résultat (voir [Le résultat d’une exécution](/docs/ausfuehrungen#ergebnis)). Décision, validation et sous-workflow se trouvent dans la palette sous *Piloter le déroulement* ; voir [Branches et validations](/docs/verzweigungen).

Chaque nœud a un nom unique. Si vous créez un second agent du même nom, Nodestro ajoute un numéro (« Agent 2 »). Le nom d’un agent est aussi son espace réservé dans les tâches.

## Relier des agents {#verbinden}
<!-- keywords: connexion, arête, edge, port, glisser, cercle, cycle, supprimer -->

Faites glisser du **point droit** (sortie) d’un nœud vers le **point gauche** (entrée) d’un autre. Une connexion signifie : le nœud cible attend que le nœud source ait terminé et reçoit son résultat.

Nodestro empêche les connexions non valides et en donne la raison :

- Un nœud ne peut pas être relié à lui-même.
- Le nœud de départ n’a pas d’entrée, le nœud de résultat pas de sortie.
- Une même connexion ne peut exister qu’une fois.
- **Pas de cycles :** les données circulent toujours dans un seul sens. Une connexion qui revient vers un prédécesseur est refusée.

Pour supprimer une connexion, sélectionnez-la et appuyez sur **Suppr** ou **Retour arrière**. Pendant une exécution, les connexions par lesquelles circulent des données s’illuminent.

## Flux de données entre agents {#datenfluss}
<!-- keywords: flux de données, entrée, input, transmission, prédécesseur, successeur, json, plusieurs entrées -->

Voici comment un agent reçoit sa tâche :

1. Nodestro prend la **tâche** de l’agent (champ *Tâche* de l’inspecteur, par défaut : `{{input}}`).
2. Les espaces réservés sont remplacés par les résultats des **prédécesseurs directs** et l’entrée de l’exécution.
3. Les résultats des prédécesseurs qui n’apparaissent pas dans la tâche sont ajoutés sous le titre **`# Eingaben`** (« entrées »), chacun avec le nom du prédécesseur en sous-titre. Ainsi, rien ne se perd sans prévenir.
4. Si la tâche est encore vide ensuite, l’agent reçoit l’entrée de l’exécution.

**Ce qui est transmis :**

- Un résultat texte est transmis sous forme de texte.
- Un résultat structuré est transmis sous forme de JSON formaté.
- Le nœud de départ transmet l’entrée de l’exécution.
- Les agents sans prédécesseur reçoivent l’entrée de l’exécution.

Un agent ne voit que les résultats de ses prédécesseurs **directs**, pas ceux des nœuds plus en amont. S’il a besoin de l’entrée d’origine, utilisez `{{run.input}}`.

## Espaces réservés dans les tâches {#platzhalter}
<!-- keywords: espaces réservés, placeholders, modèle, {{input}}, {{run.input}}, variable, tâche -->

| Espace réservé | Est remplacé par |
|---|---|
| `{{input}}` | le résultat de l’unique prédécesseur ; avec plusieurs prédécesseurs, tous les résultats, chacun en section `## Nom` ; sans prédécesseur, l’entrée de l’exécution. Juste après un nœud de départ avec un formulaire rempli, ce ne sont que les valeurs du formulaire ; utilisez `{{run.input}}` pour les valeurs du formulaire et le texte supplémentaire |
| `{{run.input}}` (ou `{{workflow.input}}`) | l’entrée au lancement du workflow, à n’importe quel endroit du workflow |
| `{{Nom du prédécesseur}}` | le résultat de ce prédécesseur direct précis |

La casse n’a pas d’importance dans les espaces réservés. Dans l’inspecteur, des boutons pour tous les prédécesseurs directs apparaissent sous le champ de tâche ; un clic insère l’espace réservé correspondant.

**Exemple :** un agent rédacteur a les prédécesseurs *Public* et *Plan* :

```
Rédige l’article sur le sujet « {{run.input}} ».

Public :
{{Public}}

Plan :
{{Plan}}
```

> **Erreur fréquente :** si vous renommez un prédécesseur, les anciens espaces réservés ne correspondent plus. Un espace réservé inconnu reste tel quel dans le texte et le résultat du prédécesseur est ajouté sous `# Eingaben`. Vérifiez les tâches des successeurs après un renommage.

## Aperçu de l’entrée {#eingabe-vorschau}
<!-- keywords: aperçu, entrée, contexte, voir le prompt, vérifier les espaces réservés, que reçoit l’agent -->

La section **Aperçu de l’entrée** dans l’inspecteur d’un agent montre ce que l’agent recevrait à la prochaine exécution, sans appeler l’API :

- le **prompt système** et la **tâche** avec les espaces réservés remplis. Chaque passage inséré est mis en évidence ; au survol, vous voyez sa provenance.
- quelles **entrées** sont disponibles. Les résultats des prédécesseurs proviennent de la dernière exécution de ce workflow. Si un prédécesseur n’a pas encore de résultat, une remarque en jaune s’affiche à sa place au lieu d’une valeur devinée.
- les espaces réservés qui ne correspondent à aucun prédécesseur relié.
- les autres parties du contexte : messages d’exemple, outils, connaissances, mémoire, format de sortie et contrôle qualité.

Les identifiants dans les options de requête ne sont jamais affichés. Pour une exécution terminée, l’onglet **Contexte** des [détails](/docs/ausfuehrungen#details) montre ce que l’agent a reçu à ce moment-là.

## Exécution en parallèle {#parallel}
<!-- keywords: parallèle, simultané, branchement, fusionner, ordre -->

Chaque nœud démarre dès que **tous** ses prédécesseurs ont terminé. Les nœuds qui ne dépendent pas les uns des autres s’exécutent en même temps. Dans l’exemple *Article de blog*, *Public* et *Plan* travaillent en parallèle ; le *Rédacteur* ne démarre que lorsque les deux ont terminé.

Les branches parallèles raccourcissent la durée, mais coûtent autant de tokens que des agents exécutés l’un après l’autre.

**Erreur dans une branche :** si un agent échoue, tous les nœuds qui en dépendent sont **ignorés**. Les branches indépendantes continuent. L’exécution se termine alors avec le statut *Erreur*.

## Réglages du workflow {#einstellungen}
<!-- keywords: nom, description, inspecteur, réglages du workflow -->

Cliquez sur un endroit vide du canevas pour voir les réglages du workflow dans l’inspecteur : **Nom**, **Description** et **Budget par exécution**. En dessous figurent les problèmes qui empêchent le lancement et un bref aperçu des commandes.

## Budget par exécution {#budget}
<!-- keywords: budget, limite de coût, limite, usd, dollar, arrêt, budgetexceedederror -->

Le budget limite les **coûts estimés** d’une exécution en dollars américains, pour l’ensemble des agents et des contrôles qualité.

- Si le workflow n’a pas de budget propre, le **budget par défaut** des réglages s’applique (au départ 2 USD).
- S’il n’y en a pas non plus, l’exécution est illimitée.
- Après chaque réponse de l’API, les coûts sont additionnés. Si le budget est dépassé, l’agent en cours s’arrête (erreur `BudgetExceededError`) et aucune autre requête n’est envoyée.

Comme les coûts ne sont comptés qu’après une réponse, une seule requête peut légèrement dépasser le budget. Les requêtes sans prix connu comptent pour 0.

## Vérification avant le lancement {#pruefung}
<!-- keywords: vérification, validation, problèmes, lancement bloqué, erreur, avertissement, remarque -->

Nodestro vérifie le workflow à chaque modification (après une pause d’une demi-seconde), sans appeler l’API et sans frais :

- **Structure :** Y a-t-il au moins un agent ? Le nœud de départ n’a-t-il aucune entrée et le nœud de résultat aucune sortie ? N’y a-t-il ni cycle, ni connexion en double, ni connexion qui ne mène nulle part ? Le nœud de résultat a-t-il une entrée ?
- **Agents :** chaque configuration est vérifiée avec les règles de la bibliothèque. Les agents en erreur affichent « 1 problème » sur le canevas.
- **Connexions et espaces réservés :** espaces réservés qui ne correspondent à aucun prédécesseur relié, agents sans entrée, résultats qui ne mènent nulle part et noms d’agents en double.
- **Réglages :** fournisseurs non configurés, fichiers de connaissances ou de départ supprimés, modèles sans prix connu et budget de 0.

Les résultats figurent dans l’inspecteur du workflow (clic sur un endroit vide du canevas), triés en **erreurs** et **remarques**. Un clic sur un message sélectionne l’agent concerné ou met en évidence la connexion concernée ; les connexions fautives apparaissent en rouge pointillé.

Tant qu’il y a des **erreurs**, **Lancer le workflow** est bloqué ; survolez le bouton pour voir les raisons. Les **remarques** ne bloquent pas le lancement ; la boîte de dialogue de lancement les affiche à nouveau.

## Lancer une exécution {#starten}
<!-- keywords: lancer, exécuter, run, boîte de dialogue de lancement, entrée, joindre des fichiers -->

**Lancer le workflow** ouvre la boîte de dialogue de lancement :

- **Entrée :** le texte que tous les agents reçoivent au départ. Il est prérempli avec l’*Entrée proposée* du nœud de départ.
- **Joindre des fichiers (facultatif) :** des fichiers de connaissances placés directement dans le contexte des premiers agents, pour cette exécution seulement (voir [Joindre des fichiers au lancement](/docs/wissen#start-dateien)).
- **Budget :** la boîte de dialogue indique le budget applicable.

Avec **Démarrer**, Nodestro enregistre le workflow et lance l’exécution. L’exécution utilise l’état du workflow au moment du démarrage ; les modifications ultérieures ne prennent effet qu’à la prochaine exécution. Si le fournisseur d’un modèle n’est pas configuré, la boîte de dialogue le signale.

## Commandes et raccourcis clavier {#bedienung}
<!-- keywords: raccourcis clavier, shortcuts, ctrl+s, ctrl+z, annuler, rétablir, suppr, dupliquer, organiser automatiquement -->

<!-- widget: shortcuts -->

Autres conseils :

- **Organiser automatiquement** range les nœuds en colonnes selon leur position dans le flux de données.
- **Tout afficher** ajuste le zoom pour que tout le workflow soit visible.
- Si vous quittez l’éditeur avec des modifications non enregistrées, Nodestro demande s’il faut les enregistrer ou les abandonner.
- Annuler mémorise jusqu’à 80 étapes. Déplacer un nœud compte pour une étape, tout comme la saisie dans un champ jusqu’à ce que vous passiez à un autre champ ou nœud. Le nom, la description et le budget du workflow en font partie.

- **Supprimer des connexions :** cliquez sur une connexion. Elle est mise en évidence, et **Suppr** ou **Retour arrière** la supprime. Tant que vous écrivez dans un champ de saisie, ces touches n’effacent que du texte. La suppression d’une connexion peut elle aussi être annulée.
- La barre **Blocs** est toujours repliée à l’ouverture de l’éditeur ; une fois dépliée, elle le reste jusqu’à ce que vous quittiez l’éditeur.

## Enregistrer et abandonner {#speichern}
<!-- keywords: enregistrer, abandonner, non enregistré, abandonner les modifications, réinitialiser -->

**Enregistrer** (ou **Ctrl+S**) conserve l’état actuel et crée une nouvelle [version](/docs/workflows#versionen). Tant qu’il y a des modifications non enregistrées, la barre de titre affiche **Abandonner**.

**Abandonner** supprime toutes les modifications non enregistrées, y compris l’historique annuler/rétablir, et recharge le dernier état enregistré. Il en va de même si vous quittez l’éditeur et choisissez **Abandonner** dans la boîte de dialogue : à la prochaine ouverture, c’est exactement le workflow enregistré qui apparaît.

## Versions {#versionen}
<!-- keywords: version, versions, historique, restaurer, revenir, ancien état -->

Chaque enregistrement qui modifie quelque chose est conservé comme **version** numérotée avec date et heure. **Versions** dans la barre de titre de l’éditeur ouvre l’historique :

- **Enregistrer comme version** enregistre les modifications actuelles avec une description facultative (« avant de refaire la recherche »).
- L’icône du crayon ajoute ou modifie la description d’une version.
- **Différences** montre ce qui changerait par rapport à l’état dans l’éditeur : agents, connexions, nom et réglages.
- **Restaurer** ramène le workflow à cette version et enregistre le résultat comme **nouvelle version**. Aucune version n’est écrasée ni supprimée.

Les versions sont indépendantes d’annuler/rétablir, qui ne vaut que pendant une session dans l’éditeur. Les exécutions utilisent toujours l’état au moment du lancement. Si un workflow est supprimé, ses versions le sont aussi.

## Importer et exporter {#import-export}
<!-- keywords: exporter, importer, json, fichier, partager, sauvegarde, .nodestro.json -->

- **Exporter** (dans l’éditeur) enregistre le workflow sous `<Nom>.nodestro.json` : tous les nœuds, connexions, positions et réglages des agents ainsi que le budget.
- **Importer** (sur la page *Workflows*) charge un tel fichier comme **nouvelle copie** avec un nouvel ID. Les workflows existants ne sont jamais écrasés.

**Ne sont pas inclus** les fichiers de connaissances, les espaces mémoire et vos propres outils ; le fichier ne fait que référencer leurs ID et leurs noms. Sur un autre ordinateur, ils doivent y exister, sinon la vérification signale par exemple « Outils inconnus ».

Exporter un workflow et exporter une trace sont deux choses différentes : un workflow décrit le processus, une trace une exécution précise avec ses résultats (voir [Importer des traces](/docs/ausfuehrungen#trace-import)).

## Exemples {#beispiele}
<!-- keywords: exemple, modèle, schéma, pipeline, recette, cas d’usage -->

**Linéaire : recherche → analyse → relecture (exemple « Analyse financière »)**

1. *Research Agent* (Sonnet, effort faible) extrait tous les chiffres avec période et unité.
2. *Analysis Agent* reçoit l’outil `calculator` et calcule exactement la croissance et les marges. Tâche : `Calcule les indicateurs clés à partir de ces résultats de recherche : {{Research Agent}}`.
3. *Review Agent* vérifie l’analyse et renvoie un **résultat structuré** avec `summary`, `key_figures`, `issues` et `approved`.

**Brancher et fusionner (exemple « Article de blog »)**

1. Départ avec le sujet.
2. *Public* et *Plan* s’exécutent en parallèle.
3. *Rédacteur* réunit les deux (`{{Public}}`, `{{Plan}}`) et a un **contrôle qualité** avec les critères « suit le plan » et « répond aux questions du public ».

**Classer et répondre**

1. *Classement* (Haiku, sortie structurée avec `category`, `urgency` en nombre entier et `reason`).
2. *Réponse* (Sonnet) reçoit le classement en JSON et la demande d’origine via `{{run.input}}`.

## Limites {#grenzen}
<!-- keywords: limites, restrictions, boucles, conditions, if, loop, branchement -->

- **Pas de boucles :** un workflow est un graphe orienté sans cycles. Chaque nœud s’exécute au plus une fois par exécution. Les conditions se construisent avec des [décisions](/docs/verzweigungen#entscheidung) ; les nœuds des branches non choisies sont ignorés.
- **Reprendre plutôt que répéter :** une exécution échouée ou annulée peut être [reprise](/docs/verzweigungen#fortsetzen) ; une nouvelle exécution liée est alors créée.
- **Une exécution à la fois par workflow dans l’éditeur :** tant qu’une exécution est active, *Lancer le workflow* est désactivé. Pour lancer de nombreuses exécutions à la fois, utilisez une [exécution par lots](/docs/automatisierung#stapel).
- **État au moment du lancement :** les modifications pendant une exécution ne prennent effet qu’à l’exécution suivante.

# Workflows

Un workflow relie des agents pour former une chaîne. Ce chapitre explique comment créer des workflows, relier des nœuds, comment les données circulent entre les agents et comment lancer une exécution.

## Créer et gérer des workflows {#anlegen}
<!-- keywords: nouveau workflow, créer, supprimer, dupliquer, copie, aperçu, reprendre, exécutions récentes, équipes, badge équipe, sans modèle d’ia, galerie, commencez ici, niveau -->

La page **Workflows** affiche tous les workflows sous forme de cartes avec le nombre d’agents, la dernière modification et le statut de la dernière exécution.

La page propose trois façons équivalentes de commencer : **Créer avec l’IA** ouvre la boîte de dialogue d’un nouveau workflow avec l’[architecte IA](/docs/ki-architekt#neu-erstellen), **Partir d’un exemple** ouvre la [galerie d’exemples](/docs/beispiele) et **Le construire vous-même** ouvre la même boîte de dialogue pour un workflow vide. Tant qu’il n’y a aucun workflow, elles apparaissent sous forme de grandes tuiles, ensuite comme une ligne étroite **Nouveau départ** au-dessus de la liste.

**Sans modèle d’IA :** si aucun fournisseur d’IA n’est encore configuré pour le modèle par défaut, un avis au-dessus des grandes tuiles indique que les workflows ne s’exécutent qu’avec un modèle d’IA connecté (une clé API ou un serveur de modèles local comme Ollama), avec le lien **Configurer dans les paramètres**. L’exemple passe alors en premier, car une copie n’a besoin d’aucun modèle, et *Créer avec l’IA* porte la mention *Nécessite une connexion à un modèle d’IA*. La boîte de dialogue le signale aussi si vous y choisissez *Créer avec l’IA* : l’architecte IA travaille avec votre modèle par défaut.

- **Nouveau workflow :** saisissez un nom et une description facultative. Le nouveau workflow contient déjà *Départ → Agent → Résultat*.
- **Créer avec l’IA :** dans la même boîte de dialogue, décrivez votre projet et l’[architecte de workflows](/docs/ki-architekt#neu-erstellen) conçoit le workflow pour que vous le vérifiiez.
- **Ouvrir :** cliquez sur la carte.
- **Dupliquer :** symbole de copie sur la carte. La copie s’appelle « … (copie) » ; les exécutions ne sont pas copiées.
- **Supprimer :** symbole de corbeille. Les exécutions précédentes restent disponibles dans *Exécutions*.

**Reprendre :** dès qu’il existe des workflows et des exécutions, la zone **Reprendre** apparaît au-dessus de la liste : combien de validations vous attendent (un clic ouvre la page *Validations*), les **Exécutions récentes** avec leur statut et, au-delà de six workflows, ceux **Modifiés récemment**. Les parties sans contenu sont omises ; s’il n’y a rien, toute la zone est omise.

**Équipes :** les workflows dotés de capacités ou d’un contrat de sortie portent le badge **Équipe** : un [orchestrateur](/docs/verzweigungen#orchestrator) peut leur déléguer du travail. Ils figurent sous vos propres workflows, dans la zone dépliable **Équipes**. Les copies d’exemples orchestrés apportent leurs équipes.

**Galerie d’exemples :** sous la liste se trouvent les exemples recommandés, le plus simple en premier et marqué **Commencez ici** tant que vous n’avez aucun workflow. Ensuite, la galerie est une zone repliée qui se souvient si vous l’avez ouverte. Dans la galerie complète, vous recherchez par nom, domaine, bloc ou niveau et filtrez par catégorie et par **Niveau** ; la recherche, les filtres et un aperçu ouvert font partie de l’adresse, si bien que *Retour* ramène à la même sélection. Sous **Ce dont vous avez besoin**, l’aperçu indique le fournisseur d’IA et les modèles qu’utilise la copie (et s’il est configuré), si une exécution s’arrête pour une validation, quels fichiers de connaissances et d’exemple sont fournis et si une connexion à un autre service est nécessaire. Plus d’informations dans [Workflows d’exemple](/docs/beispiele).

## Favoris et étiquettes {#favoriten-tags}
<!-- keywords: favori, favoris, étoile, étiquette, étiquettes, tag, filtrer, ranger -->

Les workflows, modèles d’agents et outils peuvent être marqués comme favoris avec l’**étoile**. Les favoris figurent toujours en tête des listes. L’**icône d’étiquette** ajoute des étiquettes comme « Client A » ou « Brouillon » ; les étiquettes existantes sont proposées.

Au-dessus des listes, vous filtrez par **Favoris uniquement** et par étiquette. Les favoris et les étiquettes sont enregistrés à part des objets : ils ne modifient ni les workflows, ni les agents, ni les outils, et apparaissent aussi dans la [recherche](/docs/start#suche). Il n’y a volontairement pas de dossiers.

## L’éditeur {#editor}
<!-- keywords: canevas, canvas, palette, blocs, inspecteur, vue d’ensemble de l’exécution, zoom, minimap, barre de titre, plus d’actions, équipes dans la palette -->

L’éditeur comporte quatre zones :

1. **Barre de titre :** nom, *Architecte IA*, *API & Export*, le menu **Plus d’actions** (*Versions* et *Exporter dans un fichier*), *Enregistrer* et *Lancer le workflow*. En cas de modifications non enregistrées, *Abandonner* s’y ajoute. Dans les fenêtres étroites, les actions secondaires ne s’affichent que sous forme d’icônes.
2. **Canevas :** les nœuds et les connexions. En haut à gauche, vous voyez s’il y a des modifications non enregistrées et combien d’agents et de connexions compte le workflow. En bas à gauche se trouvent le zoom, *Tout afficher*, *Organiser automatiquement* ainsi que *Annuler* et *Rétablir* (bloqués quand il n’y a rien à annuler ou à rétablir). En haut à droite, une carte d’ensemble montre tout le workflow. Un grand workflow s’ouvre à une taille lisible sur son nœud de départ au lieu d’être réduit pour tenir à l’écran.
3. **Blocs (palette) :** *Agent* (vide), *Décrire un agent* (l’IA conçoit la configuration), *Départ*, *Résultat*, jusqu’à huit modèles de la bibliothèque d’agents et, en dessous, les **Équipes**, que vous pouvez rechercher et replier ; chaque équipe indique ses capacités. Faites glisser un bloc sur le canevas ou cliquez dessus. Un nouveau nœud apparaît dans la partie visible du canevas et est aussitôt sélectionné.
4. **Inspecteur (à droite) :** sans sélection, il affiche la vérification et les réglages du workflow ; sinon, la configuration du nœud sélectionné et, si plusieurs nœuds sont sélectionnés, les actions communes (voir [Commandes et raccourcis clavier](/docs/workflows#bedienung)).

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
- **Cycles uniquement en boucle :** les données circulent dans un seul sens. Une connexion qui revient vers un prédécesseur n’est possible que depuis une branche d’une décision ou d’une validation ; elle devient alors une [boucle](/docs/verzweigungen#schleifen) avec une limite. Toute autre est refusée.

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

Cliquez sur un endroit vide du canevas pour voir les réglages du workflow dans l’inspecteur : **Nom**, **Description**, **Budget par exécution** et les **limites** d’étapes simultanées et de durée. En dessous figurent les problèmes qui empêchent le lancement et un bref aperçu des commandes.

## Budget par exécution {#budget}
<!-- keywords: budget, limite de coût, limite, usd, dollar, arrêt, budgetexceedederror, réservation, pas de maximum strict -->

Le budget limite les **coûts estimés** d’une exécution en dollars américains, pour l’ensemble des agents et des contrôles qualité.

- Si le workflow n’a pas de budget propre, le **budget par défaut** des réglages s’applique (au départ 2 USD).
- S’il n’y en a pas non plus, l’exécution est illimitée.
- **Avant** chaque requête, son coût maximal possible est réservé (taille de l’entrée et sortie maximale qu’elle peut produire, au tarif le plus élevé). Après la réponse, la réservation est remplacée par le coût réel. Des agents qui tournent en même temps ne peuvent donc pas dépasser le budget ensemble : si le reste ne suffit pas, une requête attend qu’une autre soit terminée.
- Si le budget ne suffit pas même sans autres requêtes, la requête n’est pas envoyée et l’agent s’arrête (erreur `BudgetExceededError`).
- Si une seule requête dépasse le budget entier, elle s’exécute seule en mode de prix standard ; en mode strict, elle est refusée.

Les coûts inconnus ne comptent **pas** pour 0. Si le coût maximal d’une requête ne peut pas être déterminé à l’avance (aucun prix connu, images, fichiers ou outils du fournisseur comme la recherche web), elle s’exécute sans plafond en mode standard. L’exécution affiche alors à côté des coûts la mention **Pas de maximum strict** avec le nombre de ces requêtes. En mode de prix strict, les requêtes sans prix connu ne sont pas envoyées du tout.

## Limites par exécution {#limits}
<!-- keywords: limites, simultané, parallèle, limite de temps, durée, timeout, run.time_limit, étapes, run.step_limit -->

Trois limites facultatives s’appliquent à chaque exécution du workflow. Vide signifie : aucune limite.

- **Nombre maximal d’étapes simultanées** (de 1 à 32) : si davantage d’étapes sont prêtes, les autres attendent une place libre. Avec 1, toutes les étapes s’exécutent l’une après l’autre.
- **Limite de temps par exécution** (en minutes, 7 jours au plus) : seul le temps d’exécution actif compte. L’attente d’une approbation ne compte pas. Lorsque le temps est écoulé, aucune autre étape ne démarre, les agents en cours sont invités à s’arrêter et l’exécution échoue avec une erreur qui indique la limite de temps.
- **Nombre maximal d’étapes par exécution** (de 1 à 10 000) : chaque nœud exécuté compte une fois, début et résultat compris, et chaque tour de boucle compte à nouveau. Si l’étape suivante était de trop, elle ne démarre pas et l’exécution échoue avec une erreur qui indique la limite. Cela protège contre les boucles qui font plus de tours que prévu. Une exécution poursuivie compte aussi les étapes qu’elle reprend.

Une requête au modèle ou un appel d’outil déjà en cours est mené à son terme. L’exécution peut donc dépasser la limite de temps de la durée de cet appel.

## Vérification avant le lancement {#pruefung}
<!-- keywords: vérification, validation, problèmes, lancement bloqué, erreur, avertissement, remarque -->

Nodestro vérifie le workflow à chaque modification (après une pause d’une demi-seconde), sans appeler l’API et sans frais :

- **Structure :** Y a-t-il au moins un agent ? Le nœud de départ n’a-t-il aucune entrée et le nœud de résultat aucune sortie ? N’y a-t-il ni cycle, ni connexion en double, ni connexion qui ne mène nulle part ? Le nœud de résultat a-t-il une entrée ?
- **Agents :** chaque configuration est vérifiée avec les règles de la bibliothèque. Les nœuds en erreur affichent « 1 problème » sur le canevas, Départ et Résultat compris ; les avertissements apparaissent comme « 1 avertissement » dans leur propre couleur et avec une icône.
- **Connexions et espaces réservés :** espaces réservés qui ne correspondent à aucun prédécesseur relié, agents sans entrée, résultats qui ne mènent nulle part et noms d’agents en double.
- **Réglages :** fournisseurs non configurés, fichiers de connaissances ou de départ supprimés, modèles sans prix connu et budget de 0.

Les résultats figurent tout en haut de l’inspecteur du workflow (clic sur un endroit vide du canevas), triés en **erreurs** et **remarques**. Un clic sur un message sélectionne l’agent concerné ou met en évidence la connexion concernée ; les connexions fautives apparaissent en rouge pointillé. Lorsque vous sélectionnez un nœud, ses propres messages s’affichent au-dessus de ses réglages. Tant qu’un fournisseur n’est pas configuré, les nœuds n’affichent pas « Prêt ».

Tant qu’il y a des **erreurs**, **Lancer le workflow** est bloqué. La raison s’affiche juste à côté du bouton ; s’il y a plusieurs problèmes, le premier (« 3 problèmes empêchent le démarrage. D’abord : … »). **Afficher** sélectionne le nœud ou la connexion concernés et ouvre l’inspecteur ; s’il manque un fournisseur d’IA, **Ouvrir les réglages** y mène directement. Le bouton bloqué reste accessible au clavier, et les lecteurs d’écran lisent la raison. Les **remarques** ne bloquent pas le lancement ; la boîte de dialogue de lancement les affiche à nouveau.

## Lancer une exécution {#starten}
<!-- keywords: lancer, exécuter, run, boîte de dialogue de lancement, entrée, joindre des fichiers, tâche préremplie, autres fichiers -->

**Lancer le workflow** ouvre la boîte de dialogue de lancement :

- **Entrée :** le texte que tous les agents reçoivent au départ. Il est prérempli avec l’*Entrée proposée* du nœud de départ. Si le workflow a un [formulaire de saisie](/docs/verzweigungen#eingabeformular), le champ se trouve sous les champs du formulaire ; s’il est prérempli, il s’appelle **Tâche (exemple prérempli)** : remplacez l’exemple par votre propre demande.
- **Joindre des fichiers (facultatif) :** des fichiers de connaissances placés directement dans le contexte des premiers agents, pour cette exécution seulement (voir [Joindre des fichiers au lancement](/docs/wissen#start-dateien)). Si le formulaire a ses propres champs de fichier, cette zone est repliée sous **Joindre d’autres fichiers (facultatif)**.
- **Budget :** la boîte de dialogue indique le budget applicable.

Avec **Lancer**, Nodestro enregistre le workflow et démarre l’exécution. L’exécution utilise l’état du workflow au moment du démarrage ; les modifications ultérieures ne prennent effet qu’à la prochaine exécution. Si le fournisseur d’un modèle n’est pas configuré, la boîte de dialogue le signale. Si l’exécution ne peut pas encore démarrer, la raison s’affiche sous **Lancer** : des envois de fichiers sont en cours, ou des erreurs doivent d’abord être corrigées (*Corrigez d’abord les problèmes ci-dessus.*).

## Commandes et raccourcis clavier {#bedienung}
<!-- keywords: raccourcis clavier, shortcuts, ctrl+s, ctrl+z, annuler, rétablir, suppr, dupliquer, organiser automatiquement -->

<!-- widget: shortcuts -->

Autres conseils :

- **Organiser automatiquement** range les nœuds en colonnes selon leur position dans le flux de données.
- **Tout afficher** ajuste le zoom pour que tout le workflow soit visible.
- **Sélectionner plusieurs nœuds :** Maj-clic ou Ctrl-clic ajoute des nœuds à la sélection ; Maj et glisser sur le canevas sélectionne avec un cadre. Glisser déplace tous les nœuds sélectionnés, **Suppr** les supprime tous, **Ctrl+D** les duplique tous. L’inspecteur propose alors *Tout dupliquer*, *Supprimer les nœuds* et *Annuler la sélection*.
- **Annuler une suppression :** après la suppression de nœuds, un message avec **Annuler** apparaît.
- **Tracer des connexions :** pendant le glissement, le canevas montre déjà où une connexion n’est pas permise ; si vous la relâchez à cet endroit, un message en donne la raison.
- Si vous quittez l’éditeur avec des modifications non enregistrées, Nodestro demande s’il faut les enregistrer, les abandonner ou **Continuer la modification**.
- Annuler mémorise jusqu’à 80 étapes. Déplacer un nœud compte pour une étape, tout comme la saisie dans un champ jusqu’à ce que vous passiez à un autre champ ou nœud. Le nom, la description et le budget du workflow en font partie. Si vous annulez tout jusqu’à l’état enregistré, il ne reste plus de modifications non enregistrées.

- **Supprimer des connexions :** cliquez sur une connexion. Elle est mise en évidence, et **Suppr** ou **Retour arrière** la supprime. Tant que vous écrivez dans un champ de saisie, ces touches n’effacent que du texte. La suppression d’une connexion peut elle aussi être annulée.
- Dans les fenêtres étroites (moins de 1100 pixels de large), la barre **Blocs** est d’abord repliée ; ensuite, la disposition que vous avez choisie en dernier s’applique.

## Enregistrer et abandonner {#speichern}
<!-- keywords: enregistrer, abandonner, non enregistré, abandonner les modifications, réinitialiser -->

**Enregistrer** (ou **Ctrl+S**) conserve l’état actuel et crée une nouvelle [version](/docs/workflows#versionen). Tant qu’il y a des modifications non enregistrées, la barre de titre affiche **Abandonner**.

**Abandonner** supprime toutes les modifications non enregistrées, y compris l’historique annuler/rétablir, et recharge le dernier état enregistré. Il en va de même si vous quittez l’éditeur et choisissez **Abandonner** dans la boîte de dialogue : à la prochaine ouverture, c’est exactement le workflow enregistré qui apparaît.

**Modifié ailleurs :** avant d’enregistrer, Nodestro vérifie si le workflow a été enregistré ailleurs entre-temps, dans un autre onglet ou par quelqu’un d’autre. Dans ce cas, la boîte de dialogue **Modifié ailleurs** vous demande quoi faire au lieu de remplacer l’autre modification sans rien dire :

- **Charger la version enregistrée :** l’éditeur affiche l’état enregistré ; vos modifications non enregistrées ici sont perdues.
- **Garder la mienne comme copie :** votre état devient un nouveau workflow « … (ma copie) », l’état enregistré reste tel quel.
- **Enregistrer la mienne quand même :** votre état remplace l’autre modification.
- **Continuer à modifier :** rien n’est enregistré.

Rien n’est perdu définitivement : chaque enregistrement est conservé dans [Versions](/docs/workflows#versionen).

## Versions {#versionen}
<!-- keywords: version, versions, historique, restaurer, revenir, ancien état -->

Chaque enregistrement qui modifie quelque chose est conservé comme **version** numérotée avec date et heure. **Versions**, dans le menu **Plus d’actions** de la barre de titre, ouvre l’historique :

- **Enregistrer comme version** enregistre les modifications actuelles avec une description facultative (« avant de refaire la recherche »).
- L’icône du crayon ajoute ou modifie la description d’une version.
- **Différences** montre ce qui changerait par rapport à l’état dans l’éditeur : agents, connexions, nom et réglages.
- **Restaurer** ramène le workflow à cette version et enregistre le résultat comme **nouvelle version**. Aucune version n’est écrasée ni supprimée. S’il y a des modifications non enregistrées, choisissez **Enregistrer d’abord, puis restaurer** (les modifications deviennent d’abord une version à part) ou **Restaurer sans enregistrer**.

Les versions sont indépendantes d’annuler/rétablir, qui ne vaut que pendant une session dans l’éditeur. Les exécutions utilisent toujours l’état au moment du lancement. Si un workflow est supprimé, ses versions le sont aussi. En haut de l’historique figure le **résultat des tests** de la version enregistrée pour chaque série de tests du workflow (comme lors de la [publication](/docs/api-und-export#veroeffentlichen)).

## Importer et exporter {#import-export}
<!-- keywords: exporter, importer, json, fichier, partager, sauvegarde, .nodestro.json, pas un workflow, fichier invalide -->

- **Exporter dans un fichier** (dans l’éditeur, sous **Plus d’actions**) enregistre le workflow sous `<Nom>.nodestro.json` : tous les nœuds, connexions, positions et réglages des agents ainsi que le budget.
- **Importer** (sur la page *Workflows*) charge un tel fichier comme **nouvelle copie** avec un nouvel ID. Les workflows existants ne sont jamais écrasés. Si le fichier n’a pas de nom, le workflow prend le nom du fichier.

Nodestro vérifie le fichier avant de créer quoi que ce soit. S’il ne s’agit pas d’un export de workflow (par exemple un autre fichier JSON, un fichier sans étapes ou avec des connexions cassées), rien n’est importé et le message en donne la raison, par exemple *Ce fichier n’est pas un workflow Nodestro : il n’a aucune étape ("nodes").*

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

- **Boucles uniquement avec limite :** un workflow est un graphe orienté ; des étapes ne se répètent qu’au moyen de [boucles](/docs/verzweigungen#schleifen) de 20 tours au plus. Hors des boucles, chaque nœud s’exécute au plus une fois par exécution. Les conditions se construisent avec des [décisions](/docs/verzweigungen#entscheidung) ; les nœuds des branches non choisies sont ignorés.
- **Reprendre plutôt que répéter :** une exécution échouée ou annulée peut être [reprise](/docs/verzweigungen#fortsetzen) ; une nouvelle exécution liée est alors créée.
- **Une exécution à la fois par workflow dans l’éditeur :** tant qu’une exécution est active, *Lancer le workflow* est désactivé. Pour lancer de nombreuses exécutions à la fois, utilisez une [exécution par lots](/docs/automatisierung#stapel).
- **État au moment du lancement :** les modifications pendant une exécution ne prennent effet qu’à l’exécution suivante.

# Branches et validations

Un workflow peut être plus qu’une chaîne fixe d’agents : une **décision** choisit un chemin selon des règles fixes, une **validation** arrête l’exécution jusqu’à ce qu’une personne valide ou refuse, et un **sous-workflow** exécute un autre workflow comme une seule étape. S’y ajoutent les **formulaires d’entrée** pour des entrées structurées et la **reprise** des exécutions échouées. Tout tourne sur le même moteur que n’importe quel autre workflow.

## Décisions {#entscheidung}
<!-- keywords: décision, branche, condition, if, routeur, aiguillage, règle, routage -->

Une **décision** (palette, groupe *Piloter le déroulement*) vérifie un résultat avec des règles fixes et ouvre les branches correspondantes. Elle n’envoie **aucune requête à l’IA** et ne coûte rien ; le résultat est toujours traçable.

- Chaque règle est une **branche** avec sa propre sortie à droite du nœud. Il y a toujours en plus la branche **Sinon**, prise lorsqu’aucune règle n’est vérifiée.
- Tirez les connexions depuis le point de chaque branche vers l’agent suivant. Une connexion depuis le nœud lui-même n’est pas possible ; l’éditeur vous demande alors de choisir une branche.
- **Résultat vérifié :** vide signifie le résultat qui arrive par la connexion entrante. S’il en arrive plusieurs, choisissez-en un. Les valeurs d’un [formulaire d’entrée](/docs/verzweigungen#eingabeformular) peuvent aussi être vérifiées.
- Les agents des branches non choisies sont **ignorés**. Ce n’est pas une erreur ; l’exécution peut tout de même être *Terminé*.

Dans l’exécution, la décision montre quelles règles étaient vérifiées, quelle valeur a été contrôlée et, le cas échéant, pourquoi *Sinon* a été pris.

## Règles {#regeln}
<!-- keywords: règle, opérateur, comparaison, égal, contient, supérieur, inférieur, vide, champ, json, mode -->

Une règle compare un **champ** du résultat à une **valeur**. Le champ est un chemin dans une sortie structurée, par exemple `category` ou `customer.tier` ; vide signifie le résultat entier. Un texte qui contient du JSON (même dans un bloc de code) est lu comme des données.

| Comparaison | Signification |
|---|---|
| est égal à, est différent de | texte, nombre ou oui/non ; majuscules et minuscules seulement sur demande |
| contient, ne contient pas, commence par, se termine par | texte |
| supérieur à, supérieur ou égal à, inférieur à, inférieur ou égal à | nombres ou dates (AAAA-MM-JJ) |
| est vrai, est faux | oui/non (aussi « oui », « yes », « true », « 1 ») |
| est l’un de, n’est aucun de | une liste, valeurs séparées par des virgules |
| est vide, n’est pas vide | valeurs absentes ou vides, ou listes vides |

- **Mode :** *Première règle vérifiée* ouvre exactement une branche (l’ordre compte). *Toutes les règles vérifiées* ouvre chaque branche vérifiée ; elles s’exécutent alors en parallèle.
- **Données invalides :** si le champ manque ou si le type ne convient pas (par exemple « supérieur à » sur un texte), la décision prend la branche *Sinon* ou échoue, selon le réglage.

Pour que les règles fonctionnent de façon fiable, donnez à l’agent qui précède une [sortie structurée](/docs/agenten#ausgabeformat) avec des champs fixes.

## Réunir des branches {#zusammenfuehren}
<!-- keywords: réunir, fusionner, merge, combiner des branches, ignoré, bloqué -->

Un nœud attend que tous ses prédécesseurs soient terminés. Il **s’exécute** dès qu’au moins une connexion entrante apporte des données, il est **ignoré** si aucune n’en apporte, et il est **bloqué** si un prédécesseur a échoué.

Réunir des branches ne demande donc aucun réglage : un agent placé derrière les deux branches d’une décision s’exécute avec ce qui arrive. L’espace réservé d’une branche qui ne s’est pas exécutée vaut « - ». La [vérification avant le lancement](/docs/workflows#pruefung) signale ces endroits.

Les décisions et les validations laissent passer les données : un agent placé derrière elles reçoit les résultats qui y sont arrivés, sous le nom des agents qui les ont produits.

## Boucles {#schleifen}
<!-- keywords: boucle, loop, répéter, tour, itération, boucle qualité, réviser, retour, limite -->

Une **boucle** réexécute des étapes jusqu’à ce qu’un résultat convienne, par exemple *Brouillon → Relecture → Décision* : si la relecture échoue, l’exécution revient au brouillon.

- **Créer une boucle :** tirez une connexion depuis une **branche** d’une décision ou d’une validation vers une étape antérieure. Nodestro la crée comme boucle (en pointillés, avec « ↻ max. 3× ») et l’ouvre dans l’inspecteur. Revenir depuis un agent n’est pas possible : chaque tour se termine par une décision ou une validation.
- **Limite :** *Nombre maximal de tours* (de 2 à 20) inclut la première exécution. Chaque tour consomme à nouveau des tokens ; le [budget](/docs/workflows#budget) vaut pour toute l’exécution.
- **Quand la limite est atteinte :** l’exécution se termine en échec (« La boucle … a tourné … fois sans atteindre son objectif ») ou suit les autres branches de la décision. Si aucune n’est suivie, les étapes suivantes sont ignorées.
- **Espaces réservés :** dans la tâche d’une étape de la boucle, `{{iteration}}` est le tour (à partir de 1), `{{previous}}` son propre résultat du tour précédent et `{{feedback}}` ce qui est revenu par la boucle (par exemple la justification de la relecture ou le commentaire d’une validation refusée). Au premier tour, les deux valent « - ».
- **Validations dans une boucle :** une validation refusée peut revenir vers une révision par sa branche *Refusé* ; le tour suivant attend alors de nouveau une décision.

Pendant une exécution, chaque étape affiche son **tour** ; dans les détails, vous choisissez parmi les résultats de tous les tours. Les boucles peuvent être imbriquées, mais pas se chevaucher. Lorsqu’une exécution en échec est [reprise](#fortsetzen), une boucle est toujours entièrement réexécutée.

## Validations {#freigabe}
<!-- keywords: validation, approbation, human in the loop, vérifier, refuser, commentaire, pause -->

Une **validation** arrête l’exécution jusqu’à ce qu’une personne **valide** ou **refuse** les résultats. Rien n’est jamais validé automatiquement, pas même dans les planifications, les exécutions par lots ou les séries de tests.

- **Consigne pour la personne qui vérifie :** ce à quoi elle doit faire attention.
- **Résultats affichés :** quels résultats elle voit ; sans sélection, tout ce qui arrive.
- **Commentaire :** facultatif, ou obligatoire en cas de refus. Les agents suivants le lisent sous le nom de la validation ; les nœuds de résultat, les fichiers de résultat et les décisions ne le reçoivent pas. Il reste enregistré avec la validation dans l’exécution.
- **En cas de refus :** suivre la branche **Refusé** ou terminer l’exécution. Si rien n’est relié à *Refusé*, ce chemin s’arrête simplement.

Pendant l’attente, l’exécution a le statut **En pause** et la validation **En attente de validation**. Vous pouvez décider dans la vue d’ensemble de l’exécution de l’éditeur, dans la vue détaillée de l’exécution ou sur la page **Validations**. L’exécution reprend ensuite là où elle s’était arrêtée. Les validations ouvertes survivent à un redémarrage de Nodestro.

## La page Validations {#freigaben-seite}
<!-- keywords: validations, validations ouvertes, file d’attente, décider, navigation, compteur -->

La page **Validations** (navigation, groupe *Automatisation*) liste toutes les validations ouvertes, la plus ancienne d’abord, avec le workflow, l’origine (manuelle, planification, lot, série de tests) et le temps d’attente. Le nombre à côté de l’entrée du menu indique combien attendent.

Chaque carte montre la consigne, les résultats à vérifier, un champ de commentaire et les boutons *Valider* et *Refuser*. Les validations à l’intérieur de sous-workflows apparaissent aussi ici, avec le chemin vers l’exécution parente.

## Sous-workflows {#unterworkflow}
<!-- keywords: sous-workflow, subworkflow, imbriquer, réutiliser, brique, version, exécution enfant -->

Un **sous-workflow** exécute un autre workflow enregistré comme une seule étape. Son résultat arrive comme celui d’un agent.

- **Version :** *Dernière version* utilise l’état actuel ; une version fixe ne change pas si l’autre workflow est modifié plus tard. La vérification signale quand une version plus récente existe.
- **Entrée :** ce que le sous-workflow reçoit comme entrée ; `{{input}}` est ce qui arrive ici.
- **Valeurs pour son formulaire d’entrée :** du texte ou des espaces réservés comme `{{form.client}}` ou `{{Analyse}}`. La vérification signale les champs obligatoires sans valeur.
- Le sous-workflow s’exécute comme une **exécution propre et liée** ; un lien dans les détails y mène. Coûts et tokens comptent une seule fois, dans le budget de l’exécution parente. Si le sous-workflow a son propre budget, cette limite plus stricte s’applique aussi.
- Un workflow ne doit pas s’appeler lui-même, même indirectement ; plus de cinq niveaux ne sont pas autorisés.
- Si le sous-workflow attend une validation, l’exécution parente attend avec lui.

## Équipes {#teams}
<!-- keywords: équipe, contrat de sortie, contrat, capacités, résultat structuré, run.output_contract -->

Une **équipe** est un workflow qui promet un résultat fixe lorsqu’il s’exécute comme sous-workflow. Deux réglages font d’un workflow une équipe :

- **Contrat de sortie** sur le nœud de résultat : les champs (nom, type, obligatoire) que livre le workflow, comme pour le résultat structuré d’un agent. À la fin d’une exécution, le résultat est vérifié. Il doit être un objet (ou le texte JSON d’un objet) contenant chaque champ obligatoire dans le bon type. Les autres champs sont omis. Si le résultat ne convient pas, le nœud de résultat échoue et l’exécution avec lui ; un workflow parent ne reçoit jamais de résultat non vérifié.
- **Capacités en tant qu’équipe** dans les réglages du workflow : des mots-clés courts sur ce que sait faire le workflow (20 au plus). Ils suivent le workflow (versions, export) et aident plus tard à trouver une équipe adaptée. Ils n’accordent aucun droit.

Dans un workflow parent, un workflow doté d’un contrat de sortie livre un objet avec exactement ces champs. Une décision qui suit peut donc tester un champ directement, par exemple `score` supérieur ou égal à 5.

La vérification avant le lancement avertit lorsqu’un agent avant le résultat répond en texte (seule une réponse JSON aide alors) ou lorsqu’aucun agent ne fournit un champ obligatoire. Des noms de champ invalides ou répétés empêchent le lancement.

Les workflows dotés d’un contrat de sortie ou de capacités apparaissent dans la palette sous **Équipes** et s’ajoutent directement comme sous-workflow. L’inspecteur d’un sous-workflow indique ce que livre l’équipe. Un **double-clic** sur le nœud ouvre l’équipe dans l’éditeur ; le fil d’Ariane en haut ramène au workflow parent.

Une équipe peut être testée seule : créez une [série de tests](/docs/automatisierung#testreihen) pour le workflow. Ses contrôles peuvent utiliser les champs du contrat de sortie, par exemple `score` supérieur ou égal à 5.

## Formulaires d’entrée {#eingabeformular}
<!-- keywords: formulaire, formulaire d’entrée, champs, type, obligatoire, valeur par défaut, choix, date, nombre -->

Au lieu d’une zone de texte libre, le nœud **Départ** peut avoir un **formulaire d’entrée**. La boîte de dialogue de lancement demande alors exactement ces champs et les vérifie avant le début de l’exécution.

| Type | Saisie |
|---|---|
| Texte, Texte long | texte libre |
| Nombre | un nombre, aussi avec une virgule décimale |
| Date | AAAA-MM-JJ |
| Oui/Non | choix entre oui et non |
| Choix | une des valeurs définies |
| Fichier | un ou plusieurs fichiers des [Connaissances](/docs/wissen#start-dateien) |

Chaque champ a un **libellé**, un **nom technique** (lettres, chiffres et _ uniquement) et, en option, une valeur par défaut, une explication et *Obligatoire*. Les agents lisent une valeur avec `{{form.nom}}` ; `{{run.input}}` contient toutes les valeurs sous forme de lignes « Libellé : valeur », suivies de l’entrée supplémentaire facultative. Les décisions comparent les valeurs avec leur type correct.

Les [planifications](/docs/automatisierung#zeitplaene), les [exécutions par lots](/docs/automatisierung#stapel) et les [séries de tests](/docs/automatisierung#testreihen) utilisent aussi les formulaires. Les workflows sans formulaire se comportent comme avant.

## Reprendre des exécutions échouées {#fortsetzen}
<!-- keywords: reprendre, continuer, resume, réessayer, redémarrer, échoué, annulé -->

Une exécution échouée ou annulée peut être **reprise** (bouton *Reprendre* dans la vue détaillée). Une **nouvelle exécution liée** est alors créée ; l’ancienne reste inchangée.

- Avant, Nodestro indique pour chaque étape si son résultat est **repris** ou **réexécuté**, et pourquoi.
- Un résultat n’est repris que si l’étape a réussi, que ni elle ni ses outils, connexions, entrée ou fichiers n’ont changé et que tous ses prédécesseurs sont aussi repris. Les étapes modifiées et tout ce qui suit sont réexécutés.
- Les résultats repris ne coûtent rien dans la nouvelle exécution ; leur coût reste dans l’ancienne et n’est pas compté deux fois dans [Utilisation](/docs/nutzung).
- Les décisions de validation des étapes reprises restent valables et sont marquées comme reprises ; personne n’est sollicité deux fois.
- Si des étapes réexécutées avaient déjà appelé des **outils propres** pouvant agir hors de Nodestro (comme envoyer un message), vous devez le confirmer explicitement.

Si rien ne peut être repris en toute sécurité, Nodestro propose un redémarrage complet. Les traces importées et les exécutions isolées de sous-workflows ne peuvent pas être reprises ; reprenez plutôt l’exécution parente.

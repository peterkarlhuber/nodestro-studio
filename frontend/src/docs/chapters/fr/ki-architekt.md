# Architecte de workflows IA

L’architecte de workflows conçoit un workflow multi-agents complet à partir d’une description en langage naturel, ou retravaille un workflow existant. Il planifie les agents, rédige leurs prompts, choisit modèles, outils, connaissances et mémoire, relie le tout et vérifie le résultat. Il ne fait que proposer : rien n’est enregistré, écrasé ni exécuté sans votre décision.

## Vue d’ensemble {#ueberblick}
<!-- keywords: architecte, ia, brouillon, générer, automatique, créer un workflow, assistant -->

Vous trouvez l’architecte à deux endroits :

- **Créer avec l’IA** dans la boîte de dialogue d’un nouveau workflow, sur la page *Workflows*.
- **Architecte IA** dans la barre d’outils de l’éditeur, avec les modes **Concevoir un nouveau workflow** et **Retravailler ce workflow**.

Les deux utilisent la même logique. L’architecte travaille en huit étapes : analyser les besoins, planifier l’architecture, vérifier les ressources, configurer les agents, rédiger les outils, créer les connexions, valider le workflow et présenter le brouillon. Pour la validation, il utilise la même [vérification avant le démarrage](/docs/workflows#pruefung) que l’éditeur.

Il construit aussi simplement que possible : seulement les agents dont la tâche a besoin, et des étapes parallèles uniquement là où elles sont vraiment indépendantes. Quand la tâche l’exige, il planifie aussi des [décisions, des validations](/docs/verzweigungen), un formulaire d’entrée et des fichiers de résultat ; il n’y a pas de boucles. Pour partir d’un modèle prêt à l’emploi, consultez les [exemples](/docs/beispiele).

La voie manuelle ne change pas : vous pouvez toujours créer et modifier n’importe quel workflow sans IA.

## Créer un nouveau workflow {#neu-erstellen}
<!-- keywords: nouveau, créer, description, projet, créer avec l’ia -->

Décrivez ce que vous voulez : l’objectif, les entrées, les résultats attendus et les contraintes importantes. L’architecte complète les détails manquants par des hypothèses qu’il vous montre ensuite. **Concevoir le workflow** le lance.

À la fin, vous voyez le brouillon à vérifier. **Créer le workflow** l’enregistre comme nouveau workflow avec la version 1 dans l’[historique des versions](/docs/workflows#versionen) et l’ouvre dans l’éditeur. Vous pouvez d’abord changer le nom. Le nouveau workflow est comme un workflow [créé à la main](/docs/workflows#anlegen) et n’est jamais exécuté automatiquement.

## Retravailler un workflow existant {#ueberarbeiten}
<!-- keywords: retravailler, modifier, étendre, ajouter un agent, révision, diff, annuler -->

Dans l’éditeur, choisissez **Retravailler ce workflow** et décrivez le changement, par exemple : « Ajoute avant le résultat un agent qui examine de façon critique les analyses précédentes. » L’architecte tient compte des agents, réglages et connexions du workflow, y compris des modifications non enregistrées dans l’éditeur.

Il ne change que ce que demande la description. Les agents qu’il ne mentionne pas restent inchangés, avec leurs prompts, outils et positions. La proposition est un brouillon séparé ; la vue **Changements** montre les agents ajoutés, modifiés et supprimés avec les champs modifiés, ainsi que les connexions nouvelles et supprimées.

**Appliquer les changements** applique le brouillon dans l’éditeur en une seule étape, que **Annuler** défait entièrement. Rien n’est enregistré tant que vous n’[enregistrez](/docs/workflows#speichern) pas ; la nouvelle version de l’[historique des versions](/docs/workflows#versionen) reçoit alors automatiquement une note sur la révision par IA.

Si vous avez des modifications non enregistrées, la vérification propose **Enregistrer d’abord l’état actuel comme version**. Si le workflow a été modifié dans l’éditeur pendant que l’architecte travaillait, la vérification vous le signale avant l’application.

## Suivre la progression {#fortschritt}
<!-- keywords: progression, direct, activité, journal, étapes, aperçu, graphe, marques -->

Pendant que l’architecte travaille, vous voyez trois choses :

- **Étapes :** lesquelles des huit étapes sont terminées et laquelle est en cours.
- **Activité :** un journal de ce qui s’est réellement passé, par exemple quels rôles ont été planifiés, quels outils existants ont été trouvés ou quelles connexions ont été corrigées.
- **Aperçu du workflow :** le workflow grandit en direct. Des marques indiquent quels agents sont nouveaux, modifiés, inchangés, supprimés ou encore en configuration.

Tout ce qui s’affiche repose sur des événements réels du serveur. Il n’y a ni pourcentages estimés ni états intermédiaires inventés, et le raisonnement interne du modèle n’est pas affiché.

## Questions et hypothèses {#rueckfragen}
<!-- keywords: question, hypothèse, ambigu, langue, peu clair -->

L’architecte ne pose une question que si aucun workflow sensé n’est possible sans la réponse. Vous répondez alors avec **Répondre et continuer**, ou vous le laissez décider avec **Continuer avec des hypothèses**. Dans tous les autres cas, il fait des hypothèses et les liste dans la vérification.

Il rédige prompts, noms et descriptions dans la langue de l’interface (voir [Langue](/docs/einstellungen#sprache)), sauf si votre description en demande expressément une autre. Les identifiants techniques, les noms de champs de la sortie structurée, les noms d’outils et le code restent en anglais. Lors d’une révision, il ne traduit jamais le contenu existant.

## Vérifier le brouillon {#pruefen}
<!-- keywords: vérification, revue, validation, brouillon, accepter, abandonner, garantie -->

La vérification montre :

- **Vue d’ensemble :** les besoins analysés, les hypothèses, le coût et le résultat de la validation avec tous les avertissements.
- **Changements** (révisions uniquement) : ce qui change par rapport au workflow de l’éditeur.
- **Agents :** rôle, modèle, prompt système, tâche, outils, connaissances, mémoire et sortie structurée de chaque agent.
- **Flux de données :** quels résultats chaque agent reçoit ; les tâches y renvoient avec des [espaces réservés](/docs/workflows#platzhalter).
- **Outils :** les nouveaux brouillons d’outils avec code et tests.

Les problèmes réparables sans IA, comme des connexions manquantes ou des espaces réservés erronés, l’architecte les corrige lui-même. Ce qui bloque encore ensuite, il le fait corriger par l’IA, mais seulement un nombre limité de fois. Les problèmes restants s’affichent dans la vérification.

Une [vérification](/docs/workflows#pruefung) réussie signifie que le workflow peut s’exécuter techniquement. Elle ne garantit pas des résultats justes : lisez les prompts et testez le workflow avec de vraies entrées. **Abandonner le brouillon** supprime le brouillon et ses brouillons d’outils ; **Modifier la description** lance un nouveau brouillon.

## Approuver les nouveaux outils {#tools-freigeben}
<!-- keywords: outil, brouillon, approbation, code, bac à sable, tester, enregistrer, sécurité -->

L’architecte privilégie les outils existants. Ce n’est que si aucun ne convient et que **Écrire les outils manquants comme brouillons** est activé qu’il écrit un nouvel outil Python avec des tests. Le code est seulement vérifié de façon statique et ne s’exécute jamais, pas même dans le [bac à sable](/docs/tools#sandbox).

Un brouillon d’outil n’est pas enregistré. Vous voyez le code et les tests dans la vérification et sous *Outils*, dans les brouillons d’outils. **Tester dans le bac à sable** exécute les tests ; **Approuver et enregistrer** teste à nouveau et n’ajoute l’outil à la bibliothèque que si les tests réussissent, comme pour l’[approbation](/docs/tools#freigabe) habituelle. **Refuser** supprime le brouillon.

Tant qu’un outil n’est pas approuvé, la vérification signale le workflow comme bloqué et il ne peut pas démarrer. Les règles de sécurité existantes pour le code personnalisé s’appliquent sans changement. Les affectations de connaissances et de mémoire ne sont elles aussi que des propositions, que vous modifiez dans l’éditeur.

Les brouillons d’outils sont générés par l’IA : les tester et les approuver nécessite le bac à sable Docker (voir [Confiance et isolation](/docs/tools#vertrauen)).

## Coûts et limites {#kosten}
<!-- keywords: coût, plafond, budget, corrections, utilisation, prix, usd -->

Chaque brouillon appelle l’IA plusieurs fois : pour l’analyse, le plan, chaque agent, les brouillons d’outils et les corrections. Vous voyez le coût jusqu’ici en direct dans la progression et dans la vérification. Chaque appel figure exactement une fois dans l’[aperçu de l’utilisation](/docs/nutzung#statistik) sous *Architecte de workflows*, détaillé par étape.

Sous *Réglages*, avec les [modèles](/docs/einstellungen#modelle), vous fixez le **plafond de coût** par brouillon (vide signifie sans plafond) et le nombre de **corrections par IA** autorisées (0 à 5). Une fois le plafond atteint, l’architecte s’arrête. Il ne lance jamais d’exécution de workflow et n’appelle aucun service externe payant.

## Annuler {#abbrechen}
<!-- keywords: annuler, arrêter, fermer, abandonner, sûr -->

**Annuler la génération** arrête l’architecte à tout moment. Rien n’est enregistré et aucun workflow n’est modifié ; le coût engagé jusque-là reste dans l’aperçu de l’utilisation. Si vous fermez la boîte de dialogue pendant la vérification, Nodestro demande confirmation avant d’abandonner le brouillon.

## Limites {#grenzen}
<!-- keywords: limites, restrictions, maximum, agents, boucles -->

- Un brouillon compte au plus dix agents ; les cycles dans le flux sont supprimés.
- Les mêmes [restrictions](/docs/workflows#grenzen) que pour tout workflow s’appliquent : pas de boucles. L’architecte ne planifie pas de sous-workflows ; ajoutez-les vous-même si besoin.
- L’architecte ne connaît que ce qui figure dans votre description, le workflow et la bibliothèque. L’exactitude du contenu reste à vérifier par vous.

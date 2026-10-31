# Termes

Les termes les plus importants de Nodestro, chacun expliqué brièvement avec le chapitre qui en dit plus. Les termes proches y sont expressément distingués.

## Workflow {#workflow}
<!-- keywords: workflow, flux, nœud, connexion, départ, résultat -->

Un **workflow** est un enchaînement de nœuds : un départ, des agents, des décisions, des validations et un résultat. Les connexions déterminent quelle étape reçoit les résultats de quelle autre. Plus d’informations sous [Nœuds](/docs/workflows#knoten).

## Agent {#agent}
<!-- keywords: agent, ia, modèle, prompt système, tâche, bibliothèque -->

Un **agent** est une étape dans laquelle un modèle d’IA accomplit une tâche : avec un prompt système, une tâche et, en option, des outils, des connaissances et une mémoire. Les agents de la **bibliothèque d’agents** sont des modèles ; chaque workflow travaille avec sa propre copie. Plus d’informations sous [Agents](/docs/agenten#grundlagen).

## Outil {#tool}
<!-- keywords: outil, tool, fonction, sandbox -->

Un **outil** est une fonction qu’un agent peut appeler pendant son travail, comme une calculatrice ou votre propre code Python. Le modèle décide quand l’utiliser ; vos propres outils s’exécutent dans une sandbox. Plus d’informations sous [Outils](/docs/tools#ueberblick).

## Connaissances {#wissen}
<!-- keywords: connaissances, knowledge, documents, permanent, recherche -->

Les **connaissances** sont des documents qui restent enregistrés et sont attribués à des agents, par exemple un manuel ou une liste de prix. Elles sont disponibles pour chaque exécution de ces agents jusqu’à ce que vous les supprimiez. Plus d’informations sous [Connaissances](/docs/wissen#ueberblick).

## Fichier d’entrée {#eingabedatei}
<!-- keywords: fichier d’entrée, fichier, téléversement, exécution, ponctuel, différence connaissances -->

Un **fichier d’entrée** est téléversé au démarrage d’une exécution, par exemple le contrat à examiner. Il n’appartient qu’à cette exécution et n’entre pas dans les connaissances. Ce dont plusieurs exécutions ont besoin va dans les connaissances. Plus d’informations sous [Entrée ou connaissances ?](/docs/datei-eingaben#eingabe-oder-wissen).

## Mémoire {#memory}
<!-- keywords: mémoire, memory, notes, espace mémoire -->

La **mémoire** est faite de notes qu’un agent écrit et relit lui-même. *Par exécution*, elle dure une exécution ; *permanente*, elle se trouve dans un espace mémoire et se conserve d’une exécution à l’autre. Contrairement aux connaissances, c’est l’agent qui écrit la mémoire. Plus d’informations sous [Types de mémoire](/docs/memory#arten).

## Exécution {#ausfuehrung}
<!-- keywords: exécution, run, statut, résultat -->

Une **exécution** est un passage d’un workflow avec une entrée donnée. Elle a un statut, des coûts, un résultat et une vue détaillée pour chaque étape. Plus d’informations sous [Statut](/docs/ausfuehrungen#status).

## Version {#version}
<!-- keywords: version, enregistrer, historique, restaurer -->

Chaque enregistrement qui modifie quelque chose crée une **version** numérotée du workflow. Vous pouvez consulter, comparer et restaurer les anciennes versions. Plus d’informations sous [Versions](/docs/workflows#versionen).

## Publication (version d’API) {#veroeffentlichung}
<!-- keywords: publication, release, version d’api, publier, api -->

**Publier** fige une version enregistrée sous forme d’API. Chaque publication reçoit son propre numéro ; les modifications ultérieures dans l’éditeur ne la changent pas. Les outils sont figés avec elle ; l’API lit les connaissances et la mémoire permanente en direct. Plus d’informations sous [Publier](/docs/api-und-export#veroeffentlichen).

## Série de tests {#testreihe}
<!-- keywords: série de tests, test, cas de test, règle de vérification, qualité -->

Une **série de tests** contient des cas de test fixes avec des entrées et des règles de vérification pour un workflow. Un test les exécute sur une version donnée et montre combien de cas ont réussi. Plus d’informations sous [Séries de tests](/docs/automatisierung#testreihen).

## Validation {#freigabe}
<!-- keywords: validation, approbation, humain, approuver, refuser -->

Une **validation** est une étape où l’exécution s’arrête jusqu’à ce qu’une personne approuve ou refuse le résultat obtenu jusque-là. Plus d’informations sous [Validation](/docs/verzweigungen#freigabe).

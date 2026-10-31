# Utilisation et coûts

Nodestro compte les tokens de chaque requête à un fournisseur d’IA et estime les coûts. Ce chapitre explique les types de tokens, le calcul des coûts, les économies du cache et ce que montre la page *Utilisation*.

## Aperçu {#ueberblick}
<!-- keywords: utilisation, coûts, tokens, statistiques, consommation, facturation -->

Vous voyez les tokens et les coûts à quatre endroits :

- sur chaque nœud d’agent après une exécution,
- dans la *Vue d’ensemble de l’exécution* de l’éditeur (en direct),
- dans la vue détaillée de chaque exécution, au total et par agent,
- sur la page **Utilisation**, résumés par jour, par workflow et par modèle.

Tous les coûts sont des **estimations au prix catalogue** ; seule fait foi la facturation de chaque fournisseur. Les prix appliqués sont visibles sous [Prix des modèles](/docs/nutzung#preise). Si aucun prix n’est connu pour un modèle, les coûts restent **inconnus** (affichés « – ») : ils ne comptent jamais comme 0, et un budget ne limite que les coûts dont le prix est connu. Les montants sont toujours en dollars américains, avec jusqu’à six décimales et au format numérique de la langue choisie (par exemple « 0,0042 $US » en français, « $0.0042 » en anglais).

## Types de tokens {#tokens}
<!-- keywords: token, entrée, sortie, input, output, cache read, cache write, tokens de réflexion, requêtes, requests -->

| Type | Signification |
|---|---|
| **Entrée** | Tout ce qui est envoyé au modèle sans venir du cache : prompt système, tâche, échanges, résultats d’outils, connaissances. |
| **Sortie** | Tout ce que le modèle écrit, **réflexion comprise**, ainsi que les appels d’outils. |
| **Depuis le cache** | Entrée lue dans le cache de prompt ; nettement moins chère. |
| **Vers le cache** | Entrée écrite dans le cache ; un peu plus chère qu’une entrée normale. |
| **Réflexion** | La part de la sortie consacrée à la réflexion (si l’API l’indique). |

**Requêtes API** compte les appels individuels à l’API. Un agent a besoin d’au moins une requête, plus une par tour d’outils, et le contrôle qualité en demande d’autres pour chaque vérification et révision. Survolez le nombre de tokens d’un agent pour voir le détail.

## Calcul des coûts {#kosten}
<!-- keywords: calculer les coûts, prix, liste de prix, estimation, mtok, coût de la recherche web, prix inconnu -->

Pour chaque requête, Nodestro multiplie les types de tokens par les prix du modèle (en dollars américains par million de tokens) et ajoute les frais de recherche web (10 $ pour 1 000 recherches). La somme de toutes les requêtes donne les coûts de l’agent et de l’exécution ; si une partie est inconnue, la somme l’est aussi. Le calcul est fait par la bibliothèque Orkexa, avec la grille tarifaire que Nodestro tient à jour. Les prix des modèles du catalogue :

<!-- widget: models -->

Si une exécution affiche **« – »** au lieu d’un montant, au moins une requête n’a pas pu être chiffrée (par exemple un modèle inconnu). Nodestro préfère alors n’afficher aucun montant plutôt qu’un montant trop bas. Si une partie seulement est inconnue, la page *Utilisation* affiche « au moins … » : la somme des coûts connus est alors une borne inférieure. Seule la partie connue compte pour le budget ; en mode de prix strict, ces requêtes ne sont même pas envoyées.

## Cache {#caching}
<!-- keywords: cache, mise en cache, prompt caching, économiser, ttl, 5 minutes, 1 heure, cache write -->

Avec le **cache de prompt** (par agent dans *Avancé*, activé par défaut), l’API retient le début invariable d’une requête. Les requêtes suivantes ayant le même début le lisent dans le cache :

- **Lire** dans le cache ne coûte, selon le modèle, qu’environ 2,5 à 10 % du prix d’entrée normal.
- **Écrire** dans le cache de 5 minutes coûte 1,25 fois le prix d’entrée, dans le cache d’1 heure 2 fois.

Le cache est particulièrement rentable quand un agent fait **plusieurs requêtes** (tours d’outils, contrôle qualité, mémoire) ou quand le même workflow tourne **plusieurs fois de suite**. Les connaissances en mode *Dans le contexte* se trouvent au début du prompt et en profitent donc particulièrement.

**Durée du cache :** le cache de 5 minutes est prolongé à chaque utilisation. Choisissez *1 heure* seulement s’il s’écoule souvent plus de cinq minutes entre les requêtes.

La part venue du cache apparaît dans le détail des tokens (« depuis le cache », « vers le cache »).

## La page Utilisation {#statistik}
<!-- keywords: page utilisation, statistiques, graphique, par jour, par workflow, par modèle, période, test d’agent, assistant, origine -->

Choisissez la période en haut (7, 30 ou 90 jours). La page affiche :

- **Indicateurs :** exécutions, autres opérations d’IA, requêtes API, tokens (entrée et sortie) et coût estimé.
- **Coût par jour** en diagramme à barres ; survolez une barre pour le coût et le nombre d’exécutions.
- **Par workflow** et **Par modèle** en tableaux avec nombre, tokens, coût et part du coût total.
- **Par origine :** exécutions de workflows, tests d’agents, conception d’agents par IA, assistant mémoire et création d’outils par IA.
- **Dernières opérations d’IA hors workflows** avec moment, modèle, tokens et coût.

Les exécutions sont rattachées à leur **heure de lancement**. Dans *Par modèle*, chaque agent compte pour le modèle de sa configuration ; le coût de son contrôle qualité est inclus. Les autres opérations d’IA comptent pour le modèle qu’elles ont utilisé. Chaque requête est comptée exactement une fois : les exécutions de workflows à partir des exécutions enregistrées, tout le reste à partir d’un journal distinct. Les **traces importées** ne sont pas incluses.

## Prix des modèles {#preise}
<!-- keywords: prix des modèles, grille tarifaire, mettre à jour les prix, synchronisation, litellm, ancien, prix individuel, prix contractuel, validation, changement de prix -->

**Paramètres → Prix des modèles** liste chaque prix avec son statut, sa qualité, sa source et la date de la dernière vérification. Les prix viennent de trois sources, dans cet ordre :

1. les prix vérifiés de la bibliothèque Orkexa,
2. un fichier de prix validé fourni par l’exploitant (`NODESTRO_PRICE_SNAPSHOT_FILE`),
3. la grille publique du projet LiteLLM (désactivable avec `NODESTRO_PRICE_LITELLM=off`).

Nodestro vérifie les prix toutes les 24 heures et quand vous cliquez sur *Vérifier les prix maintenant*. Si un prix change de plus de 20 % sans confirmation d’une source officielle, la nouvelle grille n’est pas appliquée mais attend votre **validation** : *Appliquer* ou *Refuser*. Les prix invalides (négatifs, invraisemblablement élevés, mauvaise devise) ne sont jamais appliqués.

| Statut | Signification |
|---|---|
| **Actuel** | Vérifié récemment. |
| **Pas vérifié depuis un moment** / **Obsolète** | Pas vérifié depuis plus de 48 heures ou de 7 jours ; les coûts sont toujours calculés, mais signalés. |
| **En attente de validation** | Un changement important attend votre décision ; d’ici là, l’ancien prix s’applique. |
| **Individuel** | Un prix que vous avez défini. |
| **Inconnu** | Aucun prix connu ; les coûts restent inconnus. |

Vous définissez des **prix individuels**, par exemple des prix contractuels ou des corrections, avec le crayon dans le tableau. Ils priment sur le prix de référence ; *Revenir au prix de référence* rétablit la grille. Chaque changement figure dans l’**historique des changements**, et chaque utilisation enregistrée retient la version et la source de prix utilisées pour son calcul (en bas de la page *Utilisation*).

**Sans internet**, les derniers prix valides restent utilisés ; ils passent seulement aux statuts *Pas vérifié depuis un moment* puis *Obsolète*. Avec `NODESTRO_PRICE_SYNC=off`, un prix ne change que si vous lancez vous-même la vérification.

**Sur un serveur**, l’exploitant gère les prix de référence : un worker les vérifie, et il décide des validations avec `nodestro-server pricing approve` ou `reject`. Les espaces de travail voient les prix de référence en lecture seule et peuvent définir leurs propres prix individuels.

## Mode de prix {#preismodus}
<!-- keywords: mode de prix, strict, standard, refuser prix inconnu, prix ancien -->

Le **mode de prix** sous *Paramètres → Prix des modèles* détermine ce qui se passe avec des prix manquants ou anciens :

- **Standard :** les requêtes s’exécutent ; leurs coûts apparaissent comme inconnus ou comme borne inférieure, et les prix anciens sont signalés.
- **Strict :** une requête vers un modèle sans prix connu, ou avec un prix non vérifié depuis plus de 7 jours, est refusée avant de coûter quoi que ce soit. Ainsi, un budget tient même quand un prix manque.

## Comparaison avec les factures des fournisseurs {#abgleich}
<!-- keywords: rapprochement, facture, facturation, openai costs, anthropic cost report, clé d’administration, écart -->

En option, Nodestro compare ses estimations avec ce qu’**OpenAI** et **Anthropic** ont réellement facturé, par jour et par modèle (*Paramètres → Comparer avec les factures des fournisseurs*). Il faut pour cela une **clé d’administration** de l’API de facturation du fournisseur, distincte des clés API habituelles. La comparaison ne fait que lire.

- **Bureau :** les clés d’administration ne sont pas enregistrées. Définissez `NODESTRO_OPENAI_ADMIN_KEY` ou `NODESTRO_ANTHROPIC_ADMIN_KEY`, ou saisissez une clé pour une seule comparaison.
- **Serveur :** la clé est enregistrée chiffrée et n’est plus jamais affichée.

Une ligne **s’écarte** quand la différence dépasse 5 % **et** 1 dollar US (les deux seuils sont réglables). Les derniers jours sont *pas encore définitifs*, car les fournisseurs complètent leurs factures après coup. Les jours où Nodestro ne connaît pas lui-même certains coûts apparaissent comme *Estimation incomplète*.

## Réduire les coûts {#sparen}
<!-- keywords: économiser, moins cher, réduire les coûts, optimiser, conseils -->

- **Le plus petit modèle adapté :** Haiku pour les étapes simples, Sonnet pour la plupart, Opus seulement si nécessaire.
- **Baisser l’effort :** *Faible* ou *Moyen* suffit pour de nombreuses tâches et économise des tokens de réflexion.
- **Laisser le cache activé.**
- **Utiliser les connaissances de façon ciblée :** *Recherche* ou *À la demande* plutôt que de gros fichiers *Dans le contexte*.
- **Limiter les tokens max. et les tours d’outils** pour qu’un agent ne s’égare pas.
- **Définir un budget** pour qu’une exécution ne coûte jamais plus que prévu.
- **Utiliser le contrôle qualité de façon ciblée :** chaque vérification et révision coûte en plus.

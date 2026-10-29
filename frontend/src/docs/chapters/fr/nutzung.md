# Utilisation et coûts

Nodestro compte les tokens de chaque requête à un fournisseur d’IA et estime les coûts. Ce chapitre explique les types de tokens, le calcul des coûts, les économies du cache et ce que montre la page *Utilisation*.

## Aperçu {#ueberblick}
<!-- keywords: utilisation, coûts, tokens, statistiques, consommation, facturation -->

Vous voyez les tokens et les coûts à quatre endroits :

- sur chaque nœud d’agent après une exécution,
- dans la *Vue d’ensemble de l’exécution* de l’éditeur (en direct),
- dans la vue détaillée de chaque exécution, au total et par agent,
- sur la page **Utilisation**, résumés par jour, par workflow et par modèle.

Tous les coûts sont des **estimations au prix catalogue** ; seule fait foi la facturation de chaque fournisseur. Nodestro ne connaît les prix que des modèles d’Anthropic. Pour les autres modèles, les coûts restent **inconnus** (affichés « – ») : ils ne comptent jamais comme 0, et un budget ne limite que les coûts dont le prix est connu. Les montants sont toujours en dollars américains, avec jusqu’à six décimales et au format numérique de la langue choisie (par exemple « 0,0042 $US » en français, « $0.0042 » en anglais).

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

Pour chaque requête, Nodestro multiplie les types de tokens par les prix du modèle (en dollars américains par million de tokens) et ajoute les frais de recherche web (10 $ pour 1 000 recherches). La somme de toutes les requêtes donne les coûts de l’agent et de l’exécution ; si une partie est inconnue, la somme l’est aussi. La grille tarifaire provient de la bibliothèque Orkexa (modèles d’Anthropic) :

<!-- widget: models -->

Si une exécution affiche **« – »** au lieu d’un montant, au moins une requête n’a pas pu être chiffrée (par exemple un modèle inconnu). Nodestro préfère alors n’afficher aucun montant plutôt qu’un montant trop bas. Pour le budget, ces requêtes comptent pour 0.

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

## Réduire les coûts {#sparen}
<!-- keywords: économiser, moins cher, réduire les coûts, optimiser, conseils -->

- **Le plus petit modèle adapté :** Haiku pour les étapes simples, Sonnet pour la plupart, Opus seulement si nécessaire.
- **Baisser l’effort :** *Faible* ou *Moyen* suffit pour de nombreuses tâches et économise des tokens de réflexion.
- **Laisser le cache activé.**
- **Utiliser les connaissances de façon ciblée :** *Recherche* ou *À la demande* plutôt que de gros fichiers *Dans le contexte*.
- **Limiter les tokens max. et les tours d’outils** pour qu’un agent ne s’égare pas.
- **Définir un budget** pour qu’une exécution ne coûte jamais plus que prévu.
- **Utiliser le contrôle qualité de façon ciblée :** chaque vérification et révision coûte en plus.

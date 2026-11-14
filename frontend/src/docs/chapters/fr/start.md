# Introduction

Nodestro est un studio visuel pour les workflows multi-agents. Vous reliez des agents IA sur un canevas pour former une chaîne, vous la lancez et suivez chaque étape. Ce chapitre explique les notions de base et vous guide dans votre premier workflow.

## Qu’est-ce que Nodestro ? {#ueberblick}
<!-- keywords: aperçu, idée, n8n, orkexa, bibliothèque, fournisseur, anthropic, claude, openai, gemini -->

Nodestro (de *Node* et *Maestro*) rend la bibliothèque Python **Orkexa** utilisable via une interface graphique. Chaque **nœud** du canevas est un agent : un modèle d’IA d’Anthropic, d’OpenAI, de Google Gemini ou d’un serveur à vous, avec son propre rôle, ses propres outils et ses propres connaissances. Par les **connexions**, les agents se transmettent leurs résultats.

Usages typiques :

- **Recherche et rapport :** un agent rassemble les faits, un deuxième vérifie les calculs, un troisième rédige le rapport.
- **Perspectives parallèles :** plusieurs agents traitent la même entrée en même temps (par exemple public cible et plan), un dernier agent réunit le tout.
- **Évaluation structurée :** un agent renvoie un objet JSON validé avec des champs fixes que d’autres programmes peuvent traiter.
- **Textes contrôlés :** un juge vérifie le résultat selon des critères et fait améliorer l’agent.

Nodestro fonctionne localement sur votre ordinateur. Workflows, exécutions, connaissances et mémoire sont stockés dans une base de données SQLite. Les données ne quittent votre ordinateur que pour les requêtes aux fournisseurs d’IA que vous avez configurés.

## Notions de base {#begriffe}
<!-- keywords: glossaire, notions, nœud, exécution, trace, token -->

| Notion | Signification |
|---|---|
| **Workflow** | Un processus enregistré composé de nœuds et de connexions. |
| **Nœud** | Un bloc du canevas : *Départ*, *Agent*, *Résultat*, *Décision*, *Validation*, *Sous-workflow* ou *Orchestrateur*. Une connexion d’une décision ou d’une validation vers une étape antérieure crée une boucle. |
| **Agent** | Un modèle d’IA avec un prompt système, une tâche et, en option, des outils, des connaissances, une mémoire et un format de sortie. |
| **Connexion** | Transmet le résultat d’un nœud au nœud suivant. |
| **Exécution** | Une exécution unique d’un workflow avec une entrée donnée. |
| **Trace** | L’enregistrement complet d’une exécution : entrées, résultats, appels d’outils, erreurs, durées, tokens et coûts. |
| **Outil** | Une fonction qu’un agent peut appeler lui-même, comme une calculatrice ou la recherche web. |
| **Connaissances** | Fichiers importés (PDF, images, textes) que les agents utilisent comme documentation de référence. |
| **Mémoire** | Des notes qu’un agent rédige lui-même et relit lors de tâches ultérieures. |
| **Token** | L’unité de facturation des modèles : environ un fragment de mot. 1 000 tokens correspondent à environ 600 mots en français. |
| **Budget** | Une limite de coût par exécution. Si elle ne suffit pas pour une exécution que vous avez lancée, l’exécution se met en pause et attend une décision de budget ; les exécutions sans surveillance (planifications, traitements par lots, séries de tests) échouent à la place. |

## Premiers pas {#erste-schritte}
<!-- keywords: guide, tutoriel, démarrage rapide, premier workflow, quickstart -->

Créez votre premier workflow en quelques minutes :

1. **Configurer un fournisseur d’IA.** Ouvrez *Réglages → Fournisseurs d’IA* et saisissez la clé API d’un fournisseur, par exemple Anthropic (ou définissez avant le démarrage une variable d’environnement comme `ANTHROPIC_API_KEY`). Si vous utilisez un autre fournisseur, changez-y aussi le modèle par défaut. Sans fournisseur configuré, vous pouvez tout modifier mais rien exécuter ; la page *Workflows* le signale tout en haut et mène aux réglages. Copier un exemple fonctionne aussi sans fournisseur.
2. **Créez un workflow.** Dans *Workflows*, cliquez sur **Nouveau workflow**, saisissez un nom et confirmez avec **Créer et ouvrir**. L’éditeur s’ouvre avec trois nœuds déjà reliés : *Départ*, *Nouvel agent* et *Résultat*.
3. **Configurez l’agent.** Cliquez sur l’agent. L’inspecteur apparaît à droite. Donnez un nom à l’agent et écrivez un prompt système, par exemple « Tu es un correcteur expérimenté. Améliore l’orthographe et le style sans modifier le contenu. »
4. **Lancez.** Cliquez sur **Lancer le workflow**, saisissez un texte et confirmez avec **Lancer**. Nodestro enregistre le workflow automatiquement. Si le bouton est bloqué, la raison s’affiche juste à côté, avec un lien vers la solution.
5. **Observez.** La *Vue d’ensemble de l’exécution* sous le canevas montre en direct ce que l’agent écrit, quels outils il appelle, combien de tokens il consomme et ce que cela coûte.
6. **Analysez.** **Détails** vous mène à l’exécution complète avec sa chronologie.

> **Astuce :** Sous vos workflows se trouve la galerie de [workflows d’exemple](/docs/beispiele) pour des tâches courantes, par exemple **Analyse financière** et **Article de blog**. L’aperçu est gratuit ; les exemples copiés sont vos propres copies, librement modifiables.

## L’interface {#oberflaeche}
<!-- keywords: navigation, barre latérale, menu, thème, sombre, clair, mise en page -->

La **barre latérale** à gauche suit votre façon de travailler : créer, exécuter et vérifier, puis automatiser.

- **Créer :** *Workflows* (vos processus), *Bibliothèque d’agents* (modèles réutilisables), *Outils*, *Connaissances* et *Mémoire*.
- **Exécuter et vérifier :** *Exécutions* (toutes les exécutions en détail), *Validations* (décisions qu’attendent les exécutions) et *Utilisation* (tokens et coûts dans le temps).
- **Automatiser et tester :** *Séries de tests*, *Exécutions par lots* et *Planifications*.
- **Aide :** cette *Documentation* et la page *Bienvenue*.

La roue dentée en haut à droite ouvre les *Réglages* depuis n’importe quelle page (aussi *Ctrl+,*) ; les réglages proposent ensuite de revenir là où vous étiez. En bas est indiqué l’endroit où Nodestro s’exécute : si vous lancez Nodestro sur votre ordinateur avec la commande `nodestro`, il est indiqué **Local et privé** ; sur un serveur, **Le serveur de votre organisation** (voir [Nodestro sur un serveur](/docs/einstellungen#server)). En haut à droite, vous choisissez le thème : *Système* (suit votre système d’exploitation, par défaut), *Sombre* ou *Clair* ; le choix est enregistré dans le navigateur. Si le fournisseur du modèle par défaut n’est pas configuré, un avis y apparaît (*Configurer un fournisseur d’IA* ou, si un autre fournisseur est déjà configuré, *Le modèle par défaut requiert …*) et mène directement aux réglages. Sur un serveur, votre compte s’affiche aussi en haut à droite.

**De l’aide là où vous en avez besoin :** de nombreux contrôles ont un petit symbole **?**. Survolez-le, donnez-lui le focus avec la touche Tab ou touchez-le sur un écran tactile : une courte explication apparaît, souvent avec un lien vers la section correspondante de cette documentation. Le symbole du livre à côté des titres de page ouvre le chapitre correspondant. **Échap** referme l’explication.

Les statuts sont toujours affichés sous forme de texte et de symbole, jamais par la couleur seule. Tous les contrôles sont aussi accessibles au clavier.

## Recherche {#suche}
<!-- keywords: recherche, rechercher, trouver, ctrl+k, cmd+k, recherche rapide -->

Le champ de recherche en haut de la barre de titre (ou **Ctrl+K**, sur Mac **⌘K**) cherche dans les pages et les sections des réglages, les workflows, les exécutions, les agents des workflows, la bibliothèque d’agents, les workflows d’exemple, les outils, les connaissances et cette documentation. Les résultats sont regroupés par type ; les favoris apparaissent avec une étoile. Les exécutions sont trouvées parmi les plus récentes par nom du workflow, entrée, statut ou ID. Avec un champ vide, la recherche vous propose vos dernières exécutions et les workflows modifiés récemment.

Les flèches sélectionnent un résultat ; **Entrée** l’ouvre là où il se trouve : un agent dans l’éditeur de son workflow, un modèle dans la bibliothèque d’agents, un outil dans la bibliothèque d’outils, un fichier de connaissances dans la liste et une section dans la documentation. Majuscules, minuscules et accents n’ont pas d’importance.

## Où sont mes données ? {#daten}
<!-- keywords: confidentialité, emplacement, base de données, sqlite, sauvegarde, nodestro_data_dir, ~/.nodestro -->

Toutes les données sont stockées dans une base SQLite dans le répertoire de données, `~/.nodestro` par défaut (modifiable avec `--data-dir` ou la variable d’environnement `NODESTRO_DATA_DIR`). On y trouve :

- `nodestro.db` avec workflows, modèles d’agents, exécutions, réglages, fichiers de connaissances, index de recherche et espaces mémoire,
- le dossier `tools` avec vos outils et ceux créés par l’IA.

Pour **sauvegarder**, copiez le répertoire de données pendant que Nodestro est arrêté. Seul le contenu dont un agent a besoin pour sa requête est envoyé à son fournisseur : prompt système, tâche, connaissances attribuées, contenu de mémoire qu’il lit et résultats d’outils. Les clés API ne sont jamais affichées dans l’interface. Si vous travaillez avec Nodestro sur un serveur, les données sont stockées sur ce serveur (voir [Nodestro sur un serveur](/docs/einstellungen#server)).

## L’application de bureau {#desktop}
<!-- keywords: bureau, application, application de bureau, téléchargement, installation, fenêtre -->

Cette version de Nodestro n’existe pas en application de bureau, et aucune ne peut être téléchargée. Pour utiliser Nodestro sur votre ordinateur, lancez-le avec la commande `nodestro` : il s’exécute localement et s’ouvre dans votre navigateur (voir [Installation et démarrage](/docs/einstellungen#installation)).

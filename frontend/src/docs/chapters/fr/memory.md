# Mémoire

Grâce à la mémoire, un agent retient des choses au-delà d’une seule tâche : préférences, décisions, avancement ou règles apprises. Ce chapitre explique les types de mémoire, les espaces mémoire et le navigateur de mémoire.

## Fonctionnement de la mémoire {#ueberblick}
<!-- keywords: mémoire, memory, outil mémoire, /memories, notes, se souvenir -->

Nodestro utilise l’**outil de mémoire** d’Orkexa : l’outil de mémoire propre à Anthropic pour les modèles d’Anthropic, et un outil ordinaire avec les mêmes commandes pour les autres fournisseurs (le modèle doit alors gérer les outils). Un agent avec mémoire reçoit un petit système de fichiers sous `/memories` dans lequel il crée, lit, modifie, renomme et supprime lui-même des fichiers texte. Le modèle décide seul de ce qu’il retient : en général, il consulte sa mémoire au début d’une tâche et note ensuite les nouveautés.

La mémoire est du **texte brut** (le plus souvent du Markdown). Pour les documents originaux comme les PDF, utilisez les [Connaissances](/docs/wissen).

## Types de mémoire {#arten}
<!-- keywords: désactivée, par exécution, persistante, persistent, ephemeral, mode -->

| Type | Durée de vie | Partage | Usage |
|---|---|---|---|
| **Désactivée** | – | – | L’agent ne retient rien au-delà de la tâche (par défaut). |
| **Par exécution** | une exécution | non, chaque agent a la sienne | Bloc-notes pour les longues tâches avec beaucoup de tours d’outils ; les notes apparaissent ensuite dans l’exécution. |
| **Persistante** | jusqu’à ce que vous la supprimiez | oui, via l’espace mémoire | Connaissances qui s’enrichissent au fil des exécutions : préférences clients, état des projets, décisions. |

## Mémoire par exécution {#pro-lauf}
<!-- keywords: par exécution, ephemeral, bloc-notes, scratchpad, onglet mémoire -->

Avec *Par exécution*, l’agent commence chaque exécution avec une mémoire vide. Ce qu’il note apparaît dans l’exécution, à côté de l’agent, dans l’onglet **Mémoire**. Les autres agents de la même exécution ne voient pas ces notes ; les informations circulent entre agents par les [connexions](/docs/workflows#datenfluss).

## Mémoire persistante et espaces mémoire {#dauerhaft}
<!-- keywords: persistante, espace mémoire, space, partager, commun, persistent, namespace -->

Avec *Persistante*, vous choisissez un **espace mémoire**. Un espace est un système de fichiers `/memories` distinct dans la base de données de Nodestro. Il est conservé d’une exécution et d’un redémarrage à l’autre.

- **Créer un espace :** dans l’inspecteur, saisissez un nom sous *Nouvel espace mémoire* et cliquez sur **Créer**, ou utilisez **Nouvelle mémoire** sur la page *Mémoire*. Lettres, chiffres, espaces, `_`, `.` et `-` sont autorisés (64 caractères au maximum).
- **Partager :** plusieurs agents utilisant le même espace lisent et écrivent les mêmes fichiers, même dans des workflows différents. Un agent peut ainsi noter les souhaits des clients et un autre en tenir compte.
- Un espace créé dans l’inspecteur apparaît sur la page *Mémoire* dès que l’agent a écrit son premier fichier.

Si deux agents utilisant le même espace s’exécutent en parallèle, ils y accèdent à tour de rôle ; chaque modification est complète, mais ils peuvent écraser le contenu l’un de l’autre. Donnez des fichiers ou des espaces différents aux agents en parallèle.

## Le navigateur de mémoire {#browser}
<!-- keywords: page mémoire, navigateur, modifier, créer un fichier, vider, voir le contenu -->

La page **Mémoire** affiche tous les espaces avec le nombre et la taille de leurs fichiers. Choisissez un espace pour voir ses fichiers :

- **Voir et modifier un fichier :** choisissez le fichier, modifiez le texte, **Enregistrer**.
- **Créer un fichier :** saisissez un chemin (par exemple `clients/preferences.md`) ; il est créé sous `/memories`.
- **Supprimer un fichier :** symbole de corbeille à côté du chemin.
- **Vider un espace :** supprime définitivement tous les fichiers de l’espace après confirmation. Au-dessus des fichiers, **Utilisé dans** indique quels agents et API publiées utilisent l’espace ; la confirmation les cite aussi.

Vous pouvez ainsi vérifier, corriger ou préremplir la mémoire à tout moment. Dans l’inspecteur, **Voir le contenu** mène directement à l’espace de l’agent.

## Configurer la mémoire avec l’IA {#assistent}
<!-- keywords: assistant mémoire, configurer avec l’ia, proposition, structure, fichiers de départ -->

**Configurer avec l’IA** (dans l’inspecteur, avec *Persistante*) propose une structure de départ :

1. Décrivez ce que l’agent doit retenir, par exemple « les préférences de chaque client, les décisions prises et les points ouverts par projet ».
2. L’assistant mémoire (le modèle des assistants défini dans les réglages) propose deux à cinq fichiers avec leur contenu, dont un `README.md` qui explique la structure à l’agent. Il n’invente pas de faits, mais laisse des espaces réservés.
3. Vérifiez et modifiez les propositions, choisissez l’espace et cliquez sur **Enregistrer dans l’espace**. L’agent est alors réglé sur cet espace.

Rien n’est enregistré avant votre confirmation. La proposition coûte une requête au modèle des assistants.

Les fichiers proposés sont rédigés dans la langue de l’interface, sauf si votre description en demande une autre. Les noms de fichiers restent en anglais.

## Cas d’usage {#anwendungsfaelle}
<!-- keywords: cas d’usage, exemples, clients, projet, apprendre, préférences -->

- **Service client :** un agent retient les préférences et les demandes précédentes de chaque client dans `customers/<nom>.md`.
- **Projets en cours :** un agent de projet tient `decisions.md` et `open-items.md` et reprend à partir de là lors de l’exécution suivante.
- **Relecture qui apprend :** un agent de relecture recense les erreurs récurrentes dans `error-catalogue.md` et les vérifie ensuite de façon ciblée.
- **Longues recherches :** avec *Par exécution*, un agent note ses résultats intermédiaires au lieu de les perdre dans l’échange.

## Remarques et limites {#hinweise}
<!-- keywords: limites, sécurité, secrets, mots de passe, coûts, nom de l’outil memory -->

- **Pas de secrets :** ce qu’un agent lit dans la mémoire fait partie de la requête au fournisseur d’IA. N’y stockez ni mots de passe ni clés.
- **Coûts :** les accès à la mémoire sont des tours d’outils. Les gros fichiers coûtent des tokens à chaque lecture ; gardez des fichiers petits et bien structurés.
- **Chemins :** tous les chemins se trouvent sous `/memories`. Les chemins en dehors sont refusés.
- **Nom réservé :** le nom d’outil `memory` est pris par l’outil mémoire ; un outil personnel portant ce nom ne peut pas être utilisé avec la mémoire.
- **Tours d’outils max. :** chaque action de mémoire compte comme un appel d’outil. Augmentez la limite si un agent lit et écrit beaucoup.

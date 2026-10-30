# Bibliothèques Python

Vos propres outils et ceux créés par l’IA peuvent utiliser des bibliothèques tierces comme `numpy`, `pandas`, `scipy` ou `requests`. Ce chapitre explique comment Nodestro les détecte, pourquoi vous approuvez chaque bibliothèque explicitement et comment fonctionnent les environnements Python séparés.

## Vue d’ensemble {#ueberblick}
<!-- keywords: bibliothèques, paquets, pypi, numpy, pandas, tiers, dépendances, uv -->

La bibliothèque standard de Python suffit pour beaucoup d’outils. Si vous avez besoin de plus :

1. **Détecter :** Nodestro lit les imports du code de l’outil et en déduit les paquets nécessaires. Rien n’est téléchargé.
2. **Approuver :** Avant toute installation, vous voyez chaque paquet avec sa version et l’approuvez. Sans approbation, rien n’est installé.
3. **Installer :** Nodestro installe exactement les versions approuvées avec l’outil de paquets **uv** dans un environnement dédié du dossier de données.
4. **Exécuter :** L’outil s’exécute dans le sandbox avec le Python de cet environnement.

Le Python qui exécute Nodestro lui-même ne change jamais. Les workflows dont les outils n’utilisent que la bibliothèque standard n’ont besoin de rien de tout cela et fonctionnent comme avant.

> **Important :** Approuver une bibliothèque n’approuve pas le code d’un outil. Vous vérifiez et approuvez le code et les tests comme d’habitude (voir [Approbation](/docs/tools#freigabe)).

## Comment les bibliothèques sont détectées {#erkennung}
<!-- keywords: import, from import, détection, nom de module, nom de paquet, pil, pillow, script, pep 723, dependencies, ambigu -->

Nodestro analyse `import x` et `from x import y` :

- La **bibliothèque standard** (`math`, `json`, `datetime` …) et le module `tool` dans les tests ne demandent rien.
- Les **modules connus** sont associés au bon paquet même si les noms diffèrent : `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- Les **modules inconnus** ne sont jamais devinés. Nodestro les signale et demande une déclaration explicite.
- Les **imports dynamiques** comme `importlib.import_module(name)` ne peuvent pas être résolus et sont signalés.
- Les imports dans un `try: … except ImportError:` sont considérés comme optionnels.

Vous déclarez les paquets et les plages de versions explicitement dans un en-tête au début du code (format « inline script metadata ») :

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

Seuls le nom du paquet et la spécification de version sont autorisés, pas de liens ni de chemins locaux.

## Approbation {#freigabe}
<!-- keywords: approbation, approuver, autoriser, version, indirect, transitif, vue d’ensemble, installer -->

Avec **Vérifier et approuver**, Nodestro résout les versions (en téléchargeant les informations des paquets ; un paquet sans wheel précompilé est construit à partir du code source, ce qui exécute son script de construction) et affiche une vue d’ensemble :

| Colonne | Signification |
|---|---|
| **Paquet** et **Version** | La version exacte qui serait installée |
| **Type** | *direct* (un outil l’importe), *indirect* (un autre paquet en a besoin) ou *exécution* (Nodestro le fournit toujours) |
| **Requis par** | Les outils ou paquets qui en ont besoin |
| **Statut** | *Nouveau*, *Approuvé*, *Changement ancienne → nouvelle* ou *Supprimé* |

Vérifiez la liste et cliquez sur **Approuver et installer**. Les bibliothèques tierces peuvent accéder aux fichiers et au réseau : n’approuvez que des paquets que vous connaissez.

Nodestro enregistre chaque approbation avec le paquet, la version et la date. Tant que rien ne change, Nodestro ne redemande pas. Une nouvelle approbation est nécessaire lorsque :

- un outil a besoin d’un **nouveau paquet**,
- une **exigence** change (p. ex. une nouvelle plage de versions) et qu’une autre version devient nécessaire,
- la **version de Python** a changé,
- les approbations proviennent d’un **autre ordinateur** ou d’un **import**.

Nodestro ne met jamais à jour en silence : les versions déjà approuvées sont privilégiées lors d’une nouvelle résolution, et toute autre version apparaît comme *Changement*.

## Bibliothèques dans un workflow {#workflow}
<!-- keywords: workflow, environnement, inspecteur, statut, lancer, exécution, environnement dédié, installer -->

Chaque workflow avec des bibliothèques reçoit son **propre environnement** avec ses propres approbations. Dans l’inspecteur du workflow (sans nœud sélectionné), la section **Bibliothèques Python** affiche :

- le **statut** : *Approbation nécessaire*, *Installation en attente*, *Installation en cours*, *Approuvées et installées* ou *L’installation a échoué*,
- chaque paquet nécessaire avec la version installée et les outils qui l’utilisent,
- les actions **Vérifier et approuver**, **Installer** et **Voir les versions**,
- l’**historique des modifications** avec approbations, installations et imports.

La [vérification](/docs/workflows#pruefung) signale les approbations manquantes comme des erreurs. Un workflow ne démarre que lorsque toutes les bibliothèques sont approuvées. Si un environnement approuvé n’est pas encore installé (p. ex. après sa suppression), Nodestro l’installe au démarrage à partir des versions approuvées.

L’environnement n’est créé que lorsqu’il est nécessaire. Les paquets téléchargés se trouvent dans un cache partagé et sont réutilisés par tous les environnements ; un deuxième environnement avec les mêmes paquets s’installe donc rapidement.

## Bibliothèques dans les outils {#tools}
<!-- keywords: outil, outil personnel, outil ia, coding agent, environnement de test, tests, essayer, sans bibliothèques -->

Pour les **tests** d’un outil avec bibliothèques, Nodestro crée un **environnement de test** dédié :

- **Écrire soi-même :** *Vérifier et tester* indique les bibliothèques nécessaires. Les tests ne s’exécutent qu’une fois celles-ci approuvées dans la section **Bibliothèques Python de l’outil**. Vérifiez ensuite à nouveau et enregistrez.
- **Créer avec l’IA :** Si le Coding Agent propose des bibliothèques, la tâche attend avec le statut *En attente des bibliothèques*. Vous voyez la vue d’ensemble et choisissez **Approuver les bibliothèques** (installer puis tester) ou **Réécrire sans bibliothèques**. Vous approuvez ensuite le code séparément, comme d’habitude.
- **Essayer** dans la bibliothèque utilise aussi l’environnement de test de l’outil.

L’approbation pour les tests ne s’applique pas automatiquement aux workflows. Si un workflow utilise l’outil, vous y approuvez les bibliothèques ; la vue d’ensemble montre où elles sont déjà approuvées.

Les outils avec bibliothèques s’exécutent avec des limites plus larges (60 secondes, 2 Go de mémoire), car le chargement de paquets comme `pandas` prend du temps.

## Architecte de workflows IA {#architekt}
<!-- keywords: architecte, brouillon, brouillon d’outil, bibliothèques, non installé -->

L’[Architecte de workflows IA](/docs/ki-architekt#tools-freigeben) peut proposer des brouillons d’outils avec bibliothèques. Il rassemble les paquets nécessaires et les affiche dans la revue du brouillon, **mais n’installe rien**. En testant un brouillon d’outil, vous approuvez les bibliothèques pour l’environnement de test ; après avoir appliqué le brouillon, vous les approuvez dans le workflow.

## Versions et reproductibilité {#versionen}
<!-- keywords: version, lock, reproductible, épinglé, mettre à jour, upgrade, conflit -->

Après l’approbation, Nodestro enregistre une **définition complète** de tous les paquets avec leur version exacte, y compris les indirects. Un environnement peut toujours être restauré à l’identique à partir de celle-ci. L’installation se fait dans un dossier séparé et ne remplace l’environnement précédent qu’une fois tout installé et tous les imports fonctionnels. En cas d’échec, l’environnement précédent reste inchangé.

Si deux outils d’un workflow ont besoin de versions incompatibles, Nodestro signale un **conflit** et nomme les paquets concernés dans les détails techniques. Ajustez alors les spécifications de version dans l’en-tête `# /// script`.

## Export, import et sauvegarde {#export}
<!-- keywords: export, import, sauvegarde, backup, autre ordinateur, portable, définition -->

- L’**export** d’un workflow contient la définition des bibliothèques (paquets et versions), mais aucun fichier installé.
- L’**import** reprend la définition. Les paquets doivent être **approuvés à nouveau** sur cet ordinateur ; la vue d’ensemble affiche les versions importées.
- La **duplication** reprend aussi les versions, mais exige sa propre approbation.
- Une **sauvegarde** contient définitions et approbations. Sur le même ordinateur, les approbations restent valables après la restauration ; sur un autre, elles doivent être accordées à nouveau. Les environnements sont réinstallés si nécessaire.

## Maintenance et nettoyage {#wartung}
<!-- keywords: maintenance, nettoyer, ranger, stockage, cache, orphelin, supprimer, réglages -->

Dans les [réglages](/docs/einstellungen), la section **Environnements Python** affiche les versions de uv et de Python, la taille du cache et chaque environnement avec propriétaire, nombre de paquets, taille et date d’installation.

- **Supprimer l’environnement** efface les fichiers installés. Les approbations restent ; l’environnement est réinstallé la prochaine fois qu’il est nécessaire.
- Les environnements **orphelins** appartiennent à un workflow ou un outil supprimé.
- **Nettoyer les orphelins** supprime tous les environnements orphelins avec leur définition et nettoie le cache.

Nodestro ne supprime jamais un environnement sans action de votre part.

## Résoudre les problèmes {#probleme}
<!-- keywords: erreur, conflit, introuvable, réseau, uv manquant, docker, installation échouée, journal -->

| Message | Solution |
|---|---|
| **Aucun paquet n’est connu pour le module** | Déclarez le paquet dans l’en-tête `# /// script`. |
| **Un import par nom ne peut pas être résolu** | Importez le module directement avec `import`. |
| **Le paquet n’existe pas** | Vérifiez l’orthographe du nom du paquet. |
| **Aucune version ne correspond** / **Conflit** | Assouplissez la spécification de version ou harmonisez-la entre les outils. |
| **Index des paquets injoignable** | Vérifiez la connexion Internet ; les environnements installés fonctionnent aussi hors ligne. |
| **uv est introuvable** | Réinstallez Nodestro ; uv est installé avec lui. |
| **Sandbox de processus uniquement** | Les outils avec bibliothèques ne fonctionnent pas dans le sandbox Docker. Passez le [sandbox](/docs/einstellungen#sandbox) sur *Processus Python*. |

En cas d’échec d’une installation, le **journal d’installation** affiche la sortie de uv. **Réinstaller** lance une nouvelle tentative.

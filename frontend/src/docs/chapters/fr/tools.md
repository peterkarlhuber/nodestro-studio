# Outils

Les outils sont des fonctions qu’un agent peut appeler lui-même pour calculer, rechercher ou exécuter quelque chose de façon exacte. Ce chapitre explique les types d’outils, comment écrire les vôtres ou les faire créer par l’IA, et comment Nodestro les exécute en toute sécurité.

## Fonctionnement des outils {#ueberblick}
<!-- keywords: outil, tool, fonction, function calling, tool use, types, intégrés, personnels, générés par l’ia -->

Un outil a un **nom**, une **description** et un **schéma d’entrée** (les paramètres). Le modèle voit ces informations et décide si un appel est utile. S’il appelle un outil, Nodestro exécute la fonction et renvoie le résultat au modèle. Un tel aller-retour s’appelle un **tour d’outils** ; un agent peut en faire plusieurs à la suite.

La page **Outils** comporte trois rubriques : *Bibliothèque*, *Écrire soi-même* et *Créer avec l’IA*. Il existe quatre types d’outils :

| Type | Origine | Exécution |
|---|---|---|
| **Intégré** | Fourni avec Nodestro, écrit et vérifié à la main | dans le processus Nodestro |
| **Outil personnel** | Créé par vous dans *Écrire soi-même* | dans le bac à sable |
| **Créé par l’IA** | Écrit par l’agent développeur, validé par vous | dans le bac à sable |
| **Outils serveur** | D’Anthropic (recherche web, récupération web, exécution de code) | sur les serveurs d’Anthropic |

Les outils de la bibliothèque s’attribuent dans l’inspecteur d’un agent, où l’on active aussi les outils serveur (voir [Attribuer des outils](/docs/agenten#tools)).

## Outils intégrés {#eingebaut}
<!-- keywords: calculator, calculatrice, current_datetime, date, heure, days_between, jours, text_statistics -->

| Outil | Rôle | Exemple d’entrée |
|---|---|---|
| `calculator` | Calcule une expression exactement : `+ - * / // % **`, parenthèses, `pi`, `e` et `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Date, heure et jour de la semaine actuels dans un fuseau horaire (par défaut *Europe/Vienna*). | `{"timezone": "Europe/Paris"}` |
| `days_between` | Jours calendaires entre deux dates (négatif si la fin est antérieure). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Compte les caractères, mots, phrases et paragraphes d’un texte. | `{"text": "…"}` |

Les modèles de langage se trompent facilement en calcul mental. Donnez la `calculator` aux agents qui manipulent des chiffres et demandez-leur dans le prompt système de l’utiliser.

La bibliothèque affiche les descriptions des outils intégrés dans la langue de l’interface. Le modèle reçoit toujours la description originale en anglais, pour que les agents existants se comportent de la même façon dans toutes les langues.

## Outils serveur d’Anthropic {#server-tools}
<!-- keywords: recherche web, web search, récupération web, web fetch, exécution de code, code execution, outils serveur, sources -->

| Outil serveur | Effet | Remarques |
|---|---|---|
| **Recherche web** | Cherche sur le web et cite les sources. | Coûte 10 $ de plus pour 1 000 recherches ; 5 recherches max. par requête. |
| **Récupération web** | Charge le contenu d’une page web ou d’un PDF à partir d’une URL. | 5 récupérations max. par requête. |
| **Exécution de code** | Exécute du Python dans un bac à sable chez Anthropic. | À ne pas combiner avec la recherche ou la récupération web (la vérification avertit). |

Les outils serveur s’exécutent chez Anthropic, pas sur votre ordinateur. Leurs appels apparaissent aussi dans l’exécution.

## La bibliothèque d’outils {#bibliothek}
<!-- keywords: bibliothèque, essayer, tester, schéma d’entrée, voir le code -->

À gauche figurent tous les outils avec leur type et leur description, à droite les détails de l’outil sélectionné :

- **Schéma d’entrée :** les paramètres sous forme de schéma JSON, tels que le modèle les voit.
- **Voir le code et les tests** (pour les outils personnels et créés par l’IA).
- **Essayer :** saisissez une entrée JSON (Nodestro préremplit un squelette) et cliquez sur **Exécuter**. L’outil s’exécute exactement comme si un agent l’appelait ; les outils personnels tournent donc dans le bac à sable. Cela ne coûte rien, car aucun modèle n’intervient. Les erreurs s’affichent en rouge.

## Écrire ses propres outils {#selbst-schreiben}
<!-- keywords: outil personnel, python, écrire une fonction, docstring, types, tests, écrire soi-même -->

Dans **Écrire soi-même**, vous créez un outil sous forme de fonction Python. Nodestro préremplit un exemple (Celsius en Fahrenheit).

1. **Nom de la fonction :** exactement le nom de la fonction dans le code. Il devient le nom de l’outil.
2. **Code :** une fonction avec des **annotations de type** pour tous les paramètres et la valeur de retour, et une **docstring** au style Google. La première ligne devient la description ; la section `Args:` décrit les paramètres.
3. **Tests :** des fonctions `test_*` qui importent l’outil avec `from tool import <name>` et le vérifient avec `assert`.
4. **Vérifier et tester** lance la vérification statique et les tests sans enregistrer.
5. **Enregistrer** vérifie à nouveau et n’enregistre que si tout a réussi.

**Exemple :**

```python
def net_price(gross: float, vat_percent: float = 20.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 20 for 20 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_standard_vat():
    assert net_price(120) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

Une bonne description est décisive : le modèle choisit les outils uniquement d’après le nom, la description et les descriptions des paramètres. Rédigez-les en anglais, comme le code.

## Règles pour votre code {#regeln}
<!-- keywords: règles, vérification statique, imports, modules autorisés, interdit, open, eval, réservé, sécurité -->

Le code personnel et celui créé par l’IA est **vérifié statiquement** avant chaque exécution. Le calcul pur, sans entrée ni sortie, est autorisé :

- **Imports autorisés :** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- Les **bibliothèques tierces** comme `numpy` ou `pandas` sont autorisées une fois approuvées. Elles s’exécutent dans un environnement dédié (voir [Bibliothèques Python](/docs/python-bibliotheken#erkennung)). Ces bibliothèques peuvent accéder au réseau et aux fichiers : n’approuvez que ce que vous connaissez.
- **Sont interdits**, entre autres, `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, l’accès aux attributs à double tiret bas, `global`, `async`/`await` et les instructions hors des fonctions (sauf imports, classes et affectations).
- **Pas d’accès réseau ni fichier via la bibliothèque standard :** les modules comme `os`, `socket` ou `urllib` ne sont pas autorisés.
- **Noms réservés :** les noms des outils intégrés ainsi que `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` et `load_tool` sont déjà pris.
- **Les tests sont obligatoires :** rien n’est enregistré sans au moins un test réussi.

Le **résultat de la vérification** montre les erreurs de la vérification statique, chaque test réussi ou avec son message d’erreur, et la sortie du bac à sable.

## Faire créer des outils par l’IA {#ki-erstellen}
<!-- keywords: outil ia, agent développeur, coding agent, générer, faire créer un outil, dynamique, exigence -->

Dans **Créer avec l’IA**, vous décrivez ce que l’outil doit savoir faire (au moins 10 caractères), par exemple : « Calcule la mensualité d’un prêt à partir du montant, du taux annuel en pourcentage et de la durée en mois. »

Ensuite, en arrière-plan :

1. L’**agent développeur** (le modèle des assistants défini dans les réglages) écrit la fonction et les tests.
2. Le code et les tests sont **vérifiés statiquement**, les tests s’exécutent dans le **bac à sable**.
3. En cas d’échec, l’agent développeur reçoit le message d’erreur et corrige sa proposition ; **trois tentatives au maximum** au total.
4. Quand tous les tests réussissent, la demande attend votre **validation**.

Chaque demande affiche son statut, le nombre de tentatives et les coûts. *Voir les tentatives* montre le code de chaque tentative.

Vous pouvez rédiger l’exigence dans n’importe quelle langue. L’outil lui-même est toujours écrit en anglais (code, noms, docstring et tests), car la docstring devient la description que lisent les agents.

**Bien adaptés :** les calculs purs, comme les formules, conversions, calculs de dates, analyses de texte et validations. **Impossible :** les outils qui ont besoin d’Internet, de fichiers ou de services externes (voir [Règles](/docs/tools#regeln)).

## Validation {#freigabe}
<!-- keywords: validation, valider, refuser, approval, vérifier, autoriser -->

Avant qu’un outil créé par l’IA soit ajouté, vous voyez son code, ses tests et les résultats des tests. Vérifiez :

- La fonction fait-elle exactement ce que vous avez décrit ?
- Les tests couvrent-ils les cas importants, y compris les cas limites ?
- La description est-elle claire, pour que les agents utilisent l’outil correctement ?

**Valider** ajoute l’outil à la bibliothèque ; tous les agents peuvent alors l’utiliser. **Refuser** l’abandonne. Sans décision, une demande est automatiquement refusée au bout d’**une heure**.

> **Remarque :** les demandes ne sont conservées qu’en mémoire. Si vous arrêtez Nodestro, la liste des demandes disparaît ; les outils validés sont conservés.

## Le bac à sable {#sandbox}
<!-- keywords: bac à sable, sandbox, docker, subprocess, processus python, isolation, sécurité, délai -->

Les outils personnels et ceux créés par l’IA ne s’exécutent **jamais dans le processus Nodestro**. Les tests et chaque appel ultérieur s’exécutent dans un bac à sable :

| Bac à sable | Isolation | Limites |
|---|---|---|
| **Processus Python** (par défaut pour vos outils) | processus séparé avec un environnement vide dans un dossier temporaire ; **pas** une barrière de sécurité | 15 secondes, 1 Go de mémoire |
| **Bac à sable Linux intégré** (automatique pour les outils créés par l’IA sous Ubuntu 24.04 et Debian 13) | sans réseau, sans accès à vos fichiers, vos clés, les données de Nodestro ou d’autres programmes ; aucun nouveau processus ; seul son propre dossier temporaire est accessible en écriture | 15 secondes (60 avec bibliothèques), 1 Go de mémoire, 64 Mo de fichiers temporaires |
| **Docker** | conteneur jetable sans réseau, avec un système de fichiers en lecture seule, sans privilèges | 20 secondes, 512 Mo de mémoire, 1 CPU |

Le bac à sable Linux intégré ne nécessite aucune installation : il utilise des fonctions du noyau Linux (Landlock et seccomp). Nodestro vérifie une fois au démarrage qu’elles sont présentes et efficaces ; *Réglages → Bac à sable* affiche le résultat et, s’il n’est pas disponible, la raison. Il ne protège pas contre les erreurs du noyau Linux lui-même et ne cache pas l’existence d’un fichier ailleurs ; Docker reste disponible comme alternative.

Vous choisissez le bac à sable dans les [réglages](/docs/einstellungen#sandbox). Docker doit être installé et en cours d’exécution ; sinon, les tests et les appels échouent. Si un appel dépasse la limite de temps, il compte comme une erreur et le processus est arrêté.

## Confiance et isolation {#vertrauen}
<!-- keywords: confiance, non fiable, origine, généré par l’ia, docker requis, isolation requise, bloqué, restreint, nécessite une isolation -->

Nodestro décide selon l’**origine du code** où il peut s’exécuter :

| Origine | Affiché comme | Sans isolation (uniquement *Processus Python*) | Bac à sable Linux intégré ou Docker |
|---|---|---|---|
| Outils intégrés et intégrations | *Intégré* | dans le processus Nodestro | dans le processus Nodestro |
| Écrit par vous dans *Écrire soi-même* | *Écrit par vous* | s’exécute, sans isolation sur cet ordinateur | s’exécute (dans le *Processus Python* ou isolé dans Docker) |
| Créé par l’IA (même après votre validation), brouillons d’outils de l’architecte IA, outils d’origine inconnue | *Nécessite une isolation* | **bloqué** | s’exécute isolé |

Le processus Python n’est pas une barrière de sécurité : le code qu’il exécute a vos droits. Nodestro n’y exécute donc jamais de code généré par l’IA, et ni votre validation ni un réglage n’y changent rien ; aucun interrupteur ne le permet malgré tout. Là où le bac à sable Linux intégré est disponible, Nodestro l’utilise automatiquement pour ce code. Sans lui et sans Docker :

- **Créer avec l’IA** ne démarre pas, et les brouillons d’outils ne peuvent être ni testés ni approuvés ;
- les agents dotés d’un outil qui nécessite une isolation ne peuvent pas s’exécuter ; la vérification du workflow le signale avant le démarrage ;
- les outils qui nécessitent une isolation ne peuvent pas utiliser de bibliothèques tierces.

Les outils enregistrés avant cette version, et tous les outils après la restauration d’une sauvegarde, sont considérés d’origine inconnue, y compris ceux que vous avez écrits, car leur origine n’a pas été enregistrée. Avec une isolation, ils continuent de fonctionner. Une nouvelle version d’un tel outil, ou une copie de son code dans un nouvel outil, conserve ce statut.

## Services connectés {#verbundene-dienste}
<!-- keywords: mcp, model context protocol, service externe, services connectés, serveur, jeton, validation, modifié -->

Avec le **Model Context Protocol (MCP)**, vous connectez des services externes, par exemple une recherche de documents ou un système de tickets. Leurs outils sont disponibles pour les agents comme n'importe quel autre outil, mais seulement après votre examen. Vous les trouvez sous *Outils → Services connectés*.

1. **Connecter un service :** nom et adresse du point de terminaison MCP (`https` uniquement), un jeton d'accès si nécessaire. Sur le bureau, vous pouvez autoriser `http://127.0.0.1` pour un serveur que vous développez sur cet ordinateur.
2. **Tester la connexion :** Nodestro négocie la version du protocole et récupère les outils du service. Chaque outil commence comme **Nouveau**.
3. **Examiner et classer :** vous voyez la description, les paramètres et les indications du service. C'est un **texte étranger** : Nodestro l'affiche, mais ne le traite jamais comme une instruction. Classez l'outil : **Lecture seule**, **Modifie des données** ou **Supprime ou détruit**. L'indication du service n'est qu'un indice ; en cas de doute, « Modifie des données » s'applique.
4. **Approuver :** ce n'est qu'alors que les agents voient l'outil, sous le nom `mcp__<service>__<outil>`. Vous l'attribuez à un agent comme n'importe quel autre outil.

Pour l'instant, seuls les outils que vous classez **lecture seule** sont utilisables ; ceux qui modifient des données restent bloqués jusqu'à ce que l'approbation par appel existe. Un outil de lecture reçoit tout de même tout ce que l'agent lui envoie : ne connectez que des services auxquels vous confiez ces données.

**Modifications :** Nodestro conserve une empreinte de chaque définition approuvée et la vérifie avant chaque appel. Si le service modifie un outil, celui-ci est **bloqué** ; les exécutions qui l'utilisent échouent avec un message clair. Vous voyez la modification côte à côte (approuvé jusqu'ici, proposé maintenant) et vous l'approuvez ou la refusez.

**Les jetons d'accès** sont enregistrés chiffrés : sur le bureau avec une clé du trousseau du système d'exploitation, sur le serveur avec la clé du serveur, séparément pour chaque locataire. Sans coffre de clés sécurisé, un jeton ne vaut que jusqu'à la fermeture de l'application. Les jetons n'apparaissent jamais dans les workflows, les exports ou les journaux.

**Limites :** Nodestro ne se connecte jamais à des adresses internes, locales ou de métadonnées, vérifie chaque adresse résolue au moment de la connexion et ignore les réglages de proxy de l'environnement. Sur un serveur, l'opérateur autorise les adresses avec `NODESTRO_MCP_ENDPOINTS`. Les planifications, les lots et les API publiées n'utilisent les outils des services que si l'opérateur l'active expressément. Nodestro ne connaît pas le coût des services externes ; il apparaît comme **inconnu**, jamais comme zéro.

**Fonctionnement :** sous *Fonctionnement*, les administrateurs voient combien d'appels de service sont en cours, les limites de l'exploitant et, par service, les appels, les échecs et la durée du dernier appel. Un service qui échoue plusieurs fois de suite est brièvement mis en pause.

## Se connecter à un service {#mcp-anmeldung}
<!-- keywords: mcp, oauth, connexion, login, autorisation, accès, renouveler -->

Certains services n'utilisent pas de jeton fixe mais une **connexion (OAuth)**. Choisissez *OAuth* comme connexion lorsque vous ajoutez le service, puis enregistrez. Cliquez ensuite sur **Se connecter** : Nodestro ouvre la page de connexion du service, vous y confirmez l'accès et revenez à *Outils → Services connectés*. Testez la connexion pour charger les outils.

- Nodestro conserve l'accès chiffré comme un jeton et le renouvelle lui-même. Vous voyez où vous êtes connecté, avec quelles autorisations et quand l'accès se renouvelle ; l'accès lui-même n'est jamais affiché.
- **Se déconnecter** supprime l'accès enregistré. Lorsque le service demande une nouvelle connexion, les exécutions qui l'utilisent échouent avec un message clair jusqu'à ce que vous vous reconnectiez.
- Sur un serveur, l'exploitant configure l'adresse publique de Nodestro ; le retour de la connexion ne va que là.

## Documents d'un service {#mcp-dokumente}
<!-- keywords: mcp, resources, ressources, documents, contexte, lire -->

Si un service propose des **documents** (ressources MCP), le test de la connexion affiche un outil supplémentaire, `resources/read`, avec la mention *Documents du service*. Vous l'examinez comme tout autre outil : sa description liste les documents qu'un agent peut lire.

- Seuls les documents listés peuvent être lus ; les modèles d'adresse et les autres adresses sont exclus.
- Si le service modifie sa liste, l'outil est bloqué jusqu'à ce que vous examiniez la nouvelle liste.
- Les contenus sont des données externes, comme tout résultat d'un service. Nodestro ne transmet pas au modèle les contenus binaires comme les images.
- Nodestro ne permet pas à un service de vous poser des questions, de faire ses propres appels de modèle ni d'accéder à vos dossiers.

## Serveurs locaux {#lokale-dienste}
<!-- keywords: mcp, stdio, serveur local, pypi, conteneur, docker, paquets -->

En plus des services distants, vous pouvez exécuter un **serveur MCP local** de PyPI, par exemple un service d'heure ou de calcul. Choisissez *Serveur local* comme type, indiquez les paquets (un par ligne) et le module démarré avec `python -m`.

1. **Vérifier les paquets :** Nodestro résout les versions exactes avec leurs empreintes. Vous les voyez et les approuvez, comme pour les bibliothèques d'un outil. Rien n'est installé avant.
2. **Installation :** les paquets vont dans une image de conteneur distincte.
3. **Tester la connexion :** le serveur démarre dans un conteneur isolé et liste ses outils. À partir de là, la vérification et l'approbation sont les mêmes que pour les services distants.

Le conteneur n'a **pas de réseau**, aucun accès à vos fichiers, clés ou autres processus, ainsi qu'une mémoire et des processus limités. C'est pourquoi les serveurs locaux ne sont disponibles que si le bac à sable Docker est utilisé ; les serveurs qui ont besoin d'Internet ou de Node.js ne peuvent pas être exécutés ainsi. Un serveur local ne reçoit ni jeton ni connexion.

## Versions et suppression {#versionen}
<!-- keywords: version, supprimer, retirer, revoke, mettre à jour, écraser -->

Si vous enregistrez un outil personnel sous un nom qui existe déjà, une **nouvelle version** est créée ; la précédente est retirée. Les agents utilisent toujours la version actuelle. La bibliothèque affiche le numéro de version.

**Supprimer** retire un outil. Les agents auxquels il est attribué signalent alors « Outils inconnus » et ne peuvent pas démarrer tant que vous ne l’avez pas retiré de leur configuration ou recréé. Les outils intégrés ne peuvent pas être supprimés. Sous la description, **Utilisé dans** indique quels workflows et agents de la bibliothèque utilisent l’outil ; la boîte de dialogue de suppression les cite avant la suppression. Les API publiées n’y figurent pas, volontairement : elles contiennent leur propre copie de l’outil.

## Comprendre les erreurs d’outils {#fehler}
<!-- keywords: erreurs d’outils, échec, délai dépassé, erreur du bac à sable, entrée non valide -->

Dans l’exécution, chaque appel d’outil se déplie : entrée, résultat, moment et durée. Les appels échoués sont marqués. Causes typiques :

- **Entrée non valide :** le modèle a mal rempli les paramètres. Améliorez les descriptions des paramètres dans la docstring.
- **Erreur prévue de l’outil** (par exemple division par zéro) : l’agent voit le message et peut réessayer.
- **Délai dépassé ou plantage dans le bac à sable :** testez l’outil dans *Essayer* avec la même entrée.
- **Docker inaccessible :** démarrez Docker ou passez au bac à sable *Processus Python*.

Le réglage [Erreurs d’outils](/docs/agenten#tool-fehler) détermine si les erreurs imprévues mettent fin à l’agent.

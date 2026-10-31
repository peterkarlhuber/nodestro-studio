# Agents

Un agent est un modèle d’IA avec un rôle, une tâche et des outils facultatifs. Le modèle peut venir d’Anthropic, d’OpenAI, de Google Gemini ou d’un serveur à vous. Ce chapitre explique chaque réglage de l’inspecteur, son effet et des valeurs typiques.

## Notions de base {#grundlagen}
<!-- keywords: nom, description, symbole, icône, inspecteur, structure -->

Sélectionnez un agent sur le canevas ; l’inspecteur affiche sa configuration. Les réglages fréquents sont en haut, les plus rares dans des sections dépliables (*Outils*, *Connaissances*, *Mémoire*, *Format de sortie*, *Réflexion et effort*, *Contrôle qualité*, *Avancé*). À côté de chaque titre de section figure un résumé, par exemple « 2 attribués ». Le résumé nomme chaque réglage qui diffère d’un nouvel agent, par exemple « 1 modèle de secours · sans cache » sous *Avancé*. Les problèmes restent visibles même lorsqu’une section est repliée : son titre affiche « 1 erreur » ou « 2 avertissements », et les liens sous *Problèmes dans*, en haut, ouvrent la section et y mènent. Une section reste ouverte ou fermée comme vous l’avez laissée.

- **Icône :** cliquez sur l’icône en haut à gauche pour en choisir une autre. Elle sert uniquement de repère.
- **Nom :** apparaît sur le canevas et sert aussi d’espace réservé `{{Nom}}` pour les successeurs.
- **Description :** une phrase sur le rôle de l’agent. Elle apparaît sur le nœud et sert de point de départ à la conception par IA.

Les symboles en haut à droite permettent d’enregistrer l’agent comme **modèle** dans la bibliothèque, de le **dupliquer** (Ctrl+D) ou de le **supprimer**.

## Modèle {#modell}
<!-- keywords: modèle, model, opus, sonnet, haiku, fable, prix, choix, quel modèle -->

Le modèle détermine les capacités, la vitesse et le prix. Choisissez d’abord le **fournisseur**, puis le **modèle** : dans la liste des modèles connus ou sous forme de n’importe quel identifiant de modèle du fournisseur que vous saisissez (par exemple un nouveau modèle OpenAI ou `llama3.1:8b` chez Ollama). Les fournisseurs pas encore configurés portent la mention « non configuré ». Le tableau montre les modèles connus avec leurs prix par million de tokens ; « – » signifie que le prix est inconnu. Pour ces modèles, les coûts restent **inconnus** et ne comptent jamais comme 0.

<!-- widget: models -->

**Règles générales :**

- **Haiku 5.5** pour classer, extraire et les tâches courtes et bien délimitées.
- **Sonnet 5.5** pour la plupart des tâches d’agent ; le modèle par défaut des nouveaux agents.
- **Opus 5.5** pour le raisonnement exigeant, la planification, le code et les longues tâches avec beaucoup d’outils.
- **Fable 5.1** pour les tâches les plus difficiles, quand la qualité compte plus que le coût.

Le modèle par défaut des nouveaux agents se définit dans les [réglages](/docs/einstellungen#modelle), l’accès aux fournisseurs sous [Fournisseurs d’IA](/docs/einstellungen#anbieter). Certaines options n’existent que pour les modèles d’Anthropic : la réflexion et son affichage, le cache des prompts, les modèles de repli et les outils serveur. Pour les autres fournisseurs, l’inspecteur les masque ; si l’une d’elles est encore définie, la vérification signale une erreur au lieu de l’omettre en silence.

## Prompt système {#system-prompt}
<!-- keywords: prompt système, system prompt, rôle, instruction, persona, ingénierie de prompt -->

Le prompt système décrit durablement **qui** est l’agent et **comment** il travaille. Il s’applique à toutes les tâches de l’agent et, avec le cache activé, est réutilisé à moindre coût.

Un bon prompt système contient :

1. **Rôle :** « Tu es un analyste financier spécialisé dans les entreprises industrielles. »
2. **Méthode :** « Vérifie la période et l’unité de chaque chiffre. Calcule avec l’outil calculatrice. »
3. **Exigence de qualité :** « Signale explicitement les incertitudes. »
4. **Sortie :** langue, longueur, format (« Réponds en français en 200 mots maximum, sous forme de liste. »).

Évitez les instructions qui relèvent de l’entrée concrète ; elles vont dans la **tâche**.

## Tâche {#aufgabe}
<!-- keywords: tâche, task, modèle, espace réservé -->

La tâche est le message que l’agent reçoit à chaque exécution. Elle peut contenir des espaces réservés : `{{input}}`, `{{run.input}}` et `{{Nom d’un prédécesseur}}`. Les règles se trouvent dans [Espaces réservés dans les tâches](/docs/workflows#platzhalter).

Si la tâche ne contient aucun espace réservé, l’inspecteur le signale : les résultats des prédécesseurs sont alors ajoutés sous `# Eingaben`.

## Attribuer des outils {#tools}
<!-- keywords: attribuer des outils, outils, outils serveur, recherche web, récupération web, exécution de code -->

Dans la section **Outils**, vous choisissez dans la bibliothèque d’outils les fonctions que l’agent peut appeler. La liste est groupée en *Intégrés*, *Personnels* et *Générés par l’IA* ; la description apparaît au survol.

En dessous, vous activez les **outils serveur d’Anthropic** : *Recherche web*, *Récupération web* et *Exécution de code*. Ils s’exécutent sur les serveurs d’Anthropic (voir [Outils serveur](/docs/tools#server-tools)). Les outils serveur ne sont disponibles que pour les modèles d’Anthropic.

L’agent décide lui-même s’il appelle un outil et quand, d’après son nom et sa description. Le nombre d’appels permis dépend de [Tours d’outils max. et Outils en parallèle](/docs/agenten#limits) ; l’obligation d’appeler dépend du [Tool choice](/docs/agenten#tool-choice).

## Attribuer des connaissances {#wissen}
<!-- keywords: attribuer des connaissances, fichiers, pdf, contexte, à la demande, recherche, citations -->

Dans la section **Connaissances**, vous attribuez des fichiers importés et choisissez **comment** l’agent les reçoit :

- **Dans le contexte :** les fichiers figurent intégralement dans le prompt dès le départ.
- **À la demande :** l’agent voit un catalogue et charge lui-même les fichiers (outil `files`).
- **Recherche :** l’agent cherche les passages pertinents (outil `search`).

**Activer les citations** fait renvoyer les réponses aux passages exacts. Détails et recommandations dans le chapitre [Connaissances](/docs/wissen#modi).

## Mémoire {#memory}
<!-- keywords: mémoire, memory, notes, par exécution, persistante, espace -->

Dans la section **Mémoire**, vous choisissez *Désactivée*, *Par exécution* ou *Persistante* et, pour la mémoire persistante, un **espace mémoire**. Vous pouvez créer de nouveaux espaces directement ici. **Configurer avec l’IA** propose une structure de fichiers adaptée. Tout le reste se trouve dans le chapitre [Mémoire](/docs/memory).

## Format de sortie {#ausgabeformat}
<!-- keywords: format de sortie, structuré, json, schéma, champs, pydantic, nom du champ, type, obligatoire, output format -->

**Texte (Markdown)** est le format par défaut : l’agent répond librement.

**Structuré (JSON)** oblige l’agent à renvoyer un objet avec des champs fixes. Nodestro en construit un schéma JSON, l’API renvoie un objet conforme et le résultat est vérifié par rapport au schéma. Les successeurs le reçoivent en JSON ; l’exécution l’affiche formaté.

Chaque champ possède :

| Réglage | Signification |
|---|---|
| **Nom du champ** | Clé dans le JSON, par exemple `summary` ou `key_metrics`. Lettres, chiffres et `_` sont autorisés ; le nom ne doit pas commencer par un chiffre et doit être unique. Les autres caractères sont remplacés par `_` pendant la saisie. |
| **Type** | *Texte*, *Nombre* (décimal), *Nombre entier*, *Oui/Non*, *Liste (texte)* ou *Liste (nombres)*. |
| **Description** | Explique au modèle ce que doit contenir le champ. Plus elle est précise, mieux c’est. |
| **Obligatoire** | Les champs obligatoires sont toujours remplis ; les champs facultatifs peuvent valoir `null`. |

**Exemple** pour une évaluation :

| Nom du champ | Type | Description |
|---|---|---|
| `summary` | Texte | Résumé en 2 ou 3 phrases |
| `key_metrics` | Liste (texte) | Les indicateurs clés avec leur unité |
| `risk_score` | Nombre entier | Risque de 1 (faible) à 5 (élevé) |
| `approved` | Oui/Non | L’analyse est-elle correcte ? |

Le résultat ressemble alors à ceci :

```json
{
  "summary": "Le chiffre d’affaires et la marge ont nettement progressé …",
  "key_metrics": ["Croissance du CA 27,6 %", "Marge EBIT 16,8 %"],
  "risk_score": 2,
  "approved": true
}
```

**Limites :**

- Un format structuré nécessite au moins un champ.
- Les citations ne peuvent pas être combinées avec un format structuré.
- Si le modèle refuse une requête, il n’y a pas d’objet ; l’agent échoue alors toujours, quel que soit le réglage *En cas de refus*.

## Réflexion et effort {#denken}
<!-- keywords: effort, réflexion, thinking, adaptatif, between_tools, afficher la réflexion, reasoning -->

L’**effort** détermine le degré de minutie du modèle : *Faible*, *Moyen* (par défaut), *Élevé*, *Très élevé* ou *Maximal*. Un effort plus élevé signifie plus de réflexion, plus de tokens de sortie et des coûts plus élevés, mais de meilleurs résultats pour les tâches difficiles. *Valeur du modèle* laisse le choix au modèle.

La **réflexion (thinking)** détermine si le modèle réfléchit avant de répondre :

| Réglage | Effet | Restriction |
|---|---|---|
| *Valeur du modèle* / *Adaptatif* | Le modèle réfléchit quand c’est utile. | – |
| *Seulement entre les appels d’outils* | Réfléchit uniquement entre les appels d’outils, pas avant la première réponse. | Sonnet 5.5 uniquement et seulement jusqu’à l’effort *Élevé*. |
| *Désactivé* | Pas de réflexion. | Impossible avec Opus 5.5, Sonnet 5.5, Fable 5.1 et Fable 5 ; avec Opus 5 et Haiku 5.5, seulement jusqu’à l’effort *Élevé*. |

**Afficher la réflexion** contrôle si les réflexions apparaissent dans l’exécution : *Afficher en résumé* (un résumé de la réflexion), *Messages de progression* (brefs points d’étape) ou *Omettre*. La réflexion affichée apparaît dans l’onglet *Réflexion*. Ce réglage ne peut pas être combiné avec une réflexion *Désactivée* ou *Seulement entre les appels d’outils*.

La réflexion compte comme **tokens de sortie** et est facturée comme tels.

Si l’on ne sait pas si un modèle prend en charge l’effort de raisonnement (vos propres serveurs, identifiants de modèle inconnus), un effort défini provoque une erreur. Choisissez alors *Valeur par défaut du modèle* ou déclarez la capacité sous [Fournisseurs d’IA](/docs/einstellungen#anbieter).

## Contrôle qualité {#qualitaet}
<!-- keywords: contrôle qualité, juge, judge, évaluateur, critères, révision, refine, llm as a judge, évaluation -->

Avec le contrôle qualité, un second modèle, le **juge**, vérifie le résultat de l’agent :

1. L’agent accomplit sa tâche.
2. Le juge évalue le résultat **par critère** comme *réussi* ou *échoué*, avec une justification. Il voit aussi les appels d’outils et leurs résultats.
3. Si un critère obligatoire a échoué, l’agent reçoit la justification et révise sa réponse.
4. Cela se répète jusqu’au nombre de **révisions** défini (0 à 5).

Le résultat du contrôle figure dans l’exécution à côté de l’agent : réussi ou non, nombre de tentatives et justification du juge. Un résultat échoué est quand même transmis ; l’exécution n’échoue pas pour autant.

**De bons critères** se vérifient un par un : « Chaque chiffre provient d’un résultat d’outil », « Cite au moins un risque concret », « 150 mots maximum ». Des critères vagues comme « bien écrit » donnent des jugements peu fiables.

**Coûts :** chaque contrôle et chaque révision est une requête supplémentaire. Les coûts du juge comptent pour l’agent et pour le budget de l’exécution. Un contrôle nouvellement activé commence avec le modèle par défaut des réglages comme **modèle juge** ; vous pouvez le changer à tout moment, et les contrôles existants gardent leur modèle. Le résumé de la section nomme le juge. Si le juge est le même modèle que l’agent, une remarque le signale : un modèle a tendance à bien noter ses propres réponses.

## Limites {#limits}
<!-- keywords: tokens max., max_tokens, tours d’outils, max_tool_rounds, outils en parallèle, max_parallel_tools, limite -->

| Réglage | Par défaut | Effet |
|---|---|---|
| **Tokens max.** | 8 000 | Nombre maximal de tokens de sortie par réponse, réflexion comprise (jusqu’à 128 000). S’il est atteint, l’agent s’arrête avec `IncompleteResponseError`. |
| **Tours d’outils max.** | 8 | Nombre de tours d’appels d’outils que l’agent peut faire par tâche (0 à 50). Ensuite, il se termine avec `MaxToolRoundsError`. À 0, il ne peut appeler aucun outil. |
| **Outils en parallèle** | 1 | Nombre d’appels d’outils d’une réponse exécutés simultanément (1 à 16). Utile pour les outils lents et indépendants comme les recherches web. |

Augmentez *Tokens max.* pour les textes longs ou un effort élevé, et *Tours d’outils max.* quand un agent a besoin de nombreuses étapes de recherche.

## Tool choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, imposer, any, none, auto, choix d’outil -->

| Réglage | Effet |
|---|---|
| *Automatique* | Le modèle décide s’il utilise des outils (par défaut). |
| *Aucun outil* | Le modèle répond sans appel d’outil. |
| *Imposer un outil quelconque* | La première réponse doit être un appel d’outil. |
| *Outil précis* | La première réponse doit appeler l’outil choisi. |

Opus 5.5, Sonnet 5.5 et Fable 5.1 refusent les appels d’outils imposés ; la vérification le signale. Utilisez alors *Automatique* avec une consigne dans le prompt système, ou un format de sortie structuré.

## Erreurs d’outils {#tool-fehler}
<!-- keywords: erreurs d’outils, raise_tool_errors, gestion des erreurs, toolexecutionerror -->

Un outil peut échouer de deux façons :

- **Erreurs prévues** (l’outil signale par exemple « fuseau horaire inconnu ») : l’agent reçoit toujours le message comme résultat et peut réagir.
- **Erreurs imprévues** (entrée non valide, plantage, délai dépassé dans le bac à sable) : avec **Renvoyer les erreurs d’outils au modèle** (par défaut : activé), l’agent les voit aussi comme résultat d’erreur. Si l’option est désactivée, l’agent se termine avec `ToolExecutionError`.

Les appels d’outils échoués sont marqués d’un symbole d’avertissement dans l’exécution.

## Cache de prompt {#caching}
<!-- keywords: cache, mise en cache, prompt caching, ttl, 5 minutes, 1 heure -->

Quand le **cache de prompt** est activé (par défaut), l’API conserve le début invariable d’une requête (prompt système, outils, connaissances dans le contexte, échanges précédents). Les requêtes suivantes le lisent pour une fraction du prix. C’est rentable avec les tours d’outils, les contrôles qualité et les exécutions répétées.

La **durée du cache** est de *5 minutes* ou *1 heure*. L’écriture dans le cache d’1 heure coûte plus cher. Détails et prix dans [Cache et coûts](/docs/nutzung#caching).

## Refus et modèles de repli {#ablehnung}
<!-- keywords: refus, refusal, fallback, modèle de repli, sécurité, refusalerror -->

Les modèles peuvent refuser des requêtes pour des raisons de sécurité ; il s’agit parfois d’une fausse alerte.

**En cas de refus du modèle :**

- *Traiter comme une erreur* (par défaut) : l’agent échoue avec `RefusalError` ; les successeurs sont ignorés.
- *Reprendre quand même le texte de la réponse :* le texte (généralement vide) est transmis comme résultat.

**Modèles de repli :** si le modèle refuse, l’API répond à la même requête avec le modèle suivant de la liste. Les coûts sont calculés selon le modèle qui répond. Sonnet 5.5 ne prend pas en charge de liste propre ; n’y utilisez pas de modèles de repli.

## Messages d’exemple {#beispiele-nachrichten}
<!-- keywords: exemples, few shot, messages d’exemple, messages, dialogue -->

Les messages d’exemple précèdent la tâche proprement dite et montrent au modèle le format souhaité (few-shot prompting). Ils alternent entre **Utilisateur** et **Assistant**, commencent par un message de l’utilisateur et se terminent par une réponse de l’assistant. Les messages vides sont ignorés.

**Exemple :** Utilisateur : « La livraison est arrivée endommagée. » – Assistant : « Catégorie : réclamation · Urgence : élevée ».

## Request options {#request-options}
<!-- keywords: request options, options de requête, betas, mcp, inference_geo, json, avancé -->

Pour les utilisateurs avancés : un objet JSON dont les champs sont repris tels quels dans chaque requête API de l’agent, par exemple `betas` ou des réglages que Nodestro ne propose pas séparément. Un JSON non valide est signalé immédiatement et n’est pas repris. Des valeurs erronées ne provoquent une erreur de l’API qu’à l’exécution.

## Concevoir un agent avec l’IA {#ki-entwurf}
<!-- keywords: conception par ia, décrire un agent, architecte, agent architect, créer automatiquement, dynamique -->

Au lieu de tout régler vous-même, vous décrivez l’agent avec vos propres mots : tâche, entrées, résultat souhaité, exigence de qualité. L’**architecte d’agents** (le modèle des assistants défini dans les réglages) propose alors :

- un nom, une description et un prompt système complet,
- le modèle adapté le moins cher et l’effort adapté le plus faible,
- des outils existants et des outils serveur adaptés,
- des limites de tokens et de tours d’outils.

Vous voyez la proposition avec le coût de la conception et ne la reprenez qu’avec **Appliquer** ; tout reste ensuite modifiable. Dans l’éditeur, l’agent conserve sa tâche précédente lorsque vous appliquez.

S’il manque des capacités à l’architecte, il indique les **outils manquants** avec une description. Vous pouvez les faire créer dans [Outils → Créer avec l’IA](/docs/tools#ki-erstellen). L’architecte n’utilise que des modèles actuels, un effort au plus *Très élevé*, au plus 32 000 tokens et 20 tours d’outils.

La proposition est rédigée dans la langue de l’interface, sauf si votre description demande une autre langue. Les noms de champs et autres identifiants techniques restent en anglais.

Accessible via **Concevoir avec l’IA** dans l’inspecteur, **Décrire un agent** dans la palette ou sur la page *Agents*.

## Bibliothèque d’agents {#bibliothek}
<!-- keywords: bibliothèque, modèle, template, réutiliser, page agents -->

Sur la page **Agents**, vous gérez des modèles d’agents réutilisables :

- **Modèle vide** ou **Décrire un agent** crée un nouveau modèle.
- Dans l’éditeur, le symbole d’enregistrement de l’inspecteur enregistre un agent comme modèle.
- Vous modifiez les modèles à droite avec le même formulaire que dans l’éditeur ; **Enregistrer** applique les modifications, **Abandonner** rétablit le dernier état enregistré.
- Les huit modèles les plus récents apparaissent dans la palette de l’éditeur sous **Depuis la bibliothèque**.

Un agent issu d’un modèle est une **copie** : les modifications ultérieures du modèle n’affectent pas les agents déjà insérés.

## Tester un agent {#agent-testen}
<!-- keywords: tester, test, essayer, tester l’agent, essai, exécuter seul -->

**Tester l’agent** dans l’inspecteur (dans l’éditeur et dans la bibliothèque d’agents) exécute uniquement cet agent avec sa **configuration actuelle, modifications non enregistrées comprises** :

1. Saisissez une **entrée de test**. Elle est insérée dans la tâche comme l’entrée d’une exécution ; les espaces réservés des prédécesseurs restent vides. Avec *Envoyer l’entrée directement comme tâche*, seul votre texte est envoyé à l’agent.
2. **Lancer le test** affiche la réponse, tous les appels d’outils, les erreurs, les tokens, le coût, la durée et, le cas échéant, le contrôle qualité.

Un test **n’est pas une exécution de workflow** : il n’apparaît pas sous *Exécutions* et ne modifie aucun résultat. La mémoire persistante est seulement lue ; le test travaille sur une copie. Un test appelle le fournisseur du modèle et **peut coûter de l’argent** ; la boîte de dialogue indique les prix du modèle lorsqu’ils sont connus, et le coût apparaît sur la page [Utilisation](/docs/nutzung#statistik).

## Validation et messages {#validierung}
<!-- keywords: validation, message d’erreur, problème, avertissement, rouge, message de l’inspecteur -->

L’inspecteur vérifie chaque modification selon les règles de la bibliothèque, sans appeler l’API :

- Les **messages rouges** (erreurs) empêchent le lancement, par exemple un outil inconnu, un nom de champ non valide, des réglages de réflexion non pris en charge par le modèle ou un contrôle qualité sans critère.
- Les **messages jaunes** (avertissements) permettent le lancement, par exemple l’exécution de code avec la recherche web.
- Les **notes grises** informent, par exemple que des entrées sont ajoutées parce que la tâche ne contient aucun espace réservé.

Les messages fréquents et leurs solutions se trouvent dans [Erreurs fréquentes](/docs/faq#haeufige-fehler).

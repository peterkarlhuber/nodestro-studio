# API et export

Un workflow terminé peut servir d’API web : directement depuis Nodestro sur cet ordinateur, ou sous forme de projet FastAPI autonome que vous pouvez exécuter partout. Les deux utilisent la même logique de workflow que Nodestro. Rien n’est régénéré, et aucune IA ne réécrit le déroulement.

## Aperçu {#ueberblick}
<!-- keywords: api, rest, http, point de terminaison, endpoint, publier, déployer, déploiement, fastapi, export, interface, intégration -->

Ouvrez un workflow dans l’éditeur et cliquez sur **API & Export**. La boîte de dialogue comporte six zones :

| Zone | Usage |
|---|---|
| **Aperçu** | État, adresses, publication, versions et dernières exécutions de l’API |
| **Clés et accès** | Clés d’API et accès facultatif depuis le réseau |
| **Tester** | Vérifier une requête ou lancer une véritable exécution de test |
| **Documentation** | Points de terminaison, exemples curl et Python, description OpenAPI |
| **Limites** | Nom dans l’URL, description et limites |
| **Export** | Le projet FastAPI autonome au format ZIP |

Il existe deux voies :

1. **Servir directement :** Nodestro répond aux requêtes sous `/api/published/<nom>/…`. Par défaut, uniquement depuis cet ordinateur.
2. **Exporter :** Nodestro génère un projet avec le runtime, la version du workflow, des tests, des exemples et un README. Vous l’exécutez sans Nodestro, par exemple sur un serveur ou dans Docker.

Les deux s’exécutent étape par étape comme dans Nodestro : mêmes agents, outils, branches, validations et formulaires.

## Publier {#veroeffentlichen}
<!-- keywords: publier, publication, version, figer, vérification, enregistrer, note -->

**Publier** fige la dernière version enregistrée du workflow, avec :

- les agents avec leur modèle, leurs instructions et leurs réglages,
- le code des outils dans leur version approuvée (voir [Approbation des outils](/docs/tools#freigabe)),
- les sous-workflows dans leur version actuelle (voir [Sous-workflows](/docs/verzweigungen#unterworkflow)),
- le formulaire de saisie, à partir duquel Nodestro génère le schéma de la requête.

Nodestro vérifie d’abord le workflow. Les erreurs empêchent la publication ; la boîte de dialogue affiche les avertissements (par exemple une limite de coût absente ou des étapes de validation). Les modifications non enregistrées ne sont pas publiées : enregistrez d’abord. En dessous figure le **résultat des tests** de la version pour chaque [série de tests](/docs/automatisierung#testreihen) du workflow : *non testée*, *n sur m réussis* ou *périmé* si une autre version a été testée en dernier ou si la série a changé depuis. Sans [contrôle de publication](#freigabe-gate), le résultat est informatif ; il n’empêche pas la publication.

Chaque publication reçoit un numéro séquentiel et une note facultative. Les modifications ultérieures dans l’éditeur ne changent jamais une version publiée. Elles n’arrivent dans l’API qu’à la publication suivante.

## Contrôle de publication {#freigabe-gate}
<!-- keywords: contrôle de publication, gate, qualité, série de tests, obligatoire, justification, override, publier, note de l'ia -->

Avec le **contrôle de publication**, tu ne publies une nouvelle version qu’après que ses [séries de tests](/docs/automatisierung#testreihen) l’ont testée. Le contrôle est facultatif et se règle par API. Tu l’actives après la première publication dans **Limites → Contrôle de publication** : choisis les séries de tests, la part minimale de cas réussis et, en option, une note minimale de l’IA. Les versions déjà publiées ne changent pas.

Avant la publication, la boîte de dialogue montre le résultat en trois parties séparées :

- **Vérifications obligatoires :** la dernière exécution de chaque série a testé exactement cette version avec les modèles enregistrés, et la série n’a pas changé depuis. Sinon, le contrôle bloque. Les vérifications obligatoires ne peuvent pas être ignorées, ni dans la boîte de dialogue ni par l’API : teste la version.
- **Résultats des vérifications :** la part des cas dont l’exécution a réussi et dont toutes les vérifications sont passées.
- **Notes de l’IA :** la moyenne de la [note de l’IA](/docs/automatisierung#testreihen). Elle est marquée *avis de l’IA, non garanti* et n’est jamais mélangée aux vérifications fixes.

Si les résultats ou les notes de l’IA n’atteignent pas le contrôle, tu peux publier quand même en indiquant une **justification** (au moins 10 caractères). La justification, son auteur et les points manquants sont enregistrés avec la version et dans l’historique de l’API. La liste **Versions** affiche *contrôle satisfait* ou *publiée avec justification*. Sur un serveur, seuls les rôles owner et admin peuvent publier et donc donner une justification.

## Versions et retour arrière {#versionen}
<!-- keywords: version, versions, rollback, retour arrière, revenir, active, version active, immuable, release -->

La liste des **versions** affiche chaque version publiée avec sa date, sa note et le résultat de la vérification. L’une d’elles est **active** : les requêtes vers `/runs` l’utilisent.

- **Activer** change immédiatement la version active, sans republier. C’est ainsi que vous revenez à une version antérieure.
- Les exécutions conservent leur version jusqu’à la fin, y compris lors d’une reprise après une erreur.
- Les clients peuvent appeler une version précise : `POST /api/published/<nom>/versions/<numéro>/runs`.

Les versions publiées ne peuvent pas être modifiées. Les résultats restent ainsi traçables : chaque exécution d’API indique avec quelle version elle a tourné.

## Désactiver et supprimer {#abschalten}
<!-- keywords: désactiver, couper, mettre en pause, 503, supprimer, retirer -->

**Désactiver** refuse les nouvelles exécutions avec le statut `503` et le code `publication.disabled`. Les exécutions en cours continuent ; en désactivant, vous pouvez aussi les annuler. L’état et les résultats des exécutions existantes restent consultables. **Activer** rend l’API de nouveau disponible.

**Supprimer l’API** retire toutes les versions, et les clés perdent l’accès à celles-ci. Ce n’est possible que si aucune exécution de cette API n’est encore en cours. Les exécutions elles-mêmes restent sous Exécutions. Si le workflow est supprimé, son API disparaît aussi.

## Points de terminaison {#endpunkte}
<!-- keywords: points de terminaison, endpoints, url, adresse, runs, état, résultat, événements, annuler, approve, resume, versions, openapi -->

Vous définissez le nom dans l’URL (par ex. `verifier-factures`) lors de la publication et le modifiez sous **Limites**. Tous les chemins commencent par `/api/published/<nom>` :

| Méthode et chemin | Effet | Permission |
|---|---|---|
| `GET /` | Ce que l’API attend et renvoie, et les versions existantes | `read` |
| `POST /runs` | Lance une exécution avec la version active | `run` |
| `POST /versions/<numéro>/runs` | Lance une exécution avec une version précise | `run` |
| `GET /runs` | Les dernières exécutions de cette API | `read` |
| `GET /runs/<id>` | État, étapes, coût et validations d’une exécution | `read` |
| `GET /runs/<id>/result` | Le résultat d’une exécution terminée | `read` |
| `GET /runs/<id>/events` | La progression en Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Annule une exécution | `run` |
| `GET /runs/<id>/approvals` | Validations en attente, avec ce qu’il faut examiner | `read` |
| `POST /runs/<id>/approve` | Décide d’une validation | `approve` |
| `POST /runs/<id>/resume` | Reprend une exécution échouée | `run` |
| `GET /runs/<id>/files` | Fichiers de résultat d’une exécution | `read` |
| `GET /usage` | Exécutions, tokens et coût de cette API | `read` |
| `GET /openapi.json` | Description OpenAPI de cette API uniquement | – |

Les schémas complets se trouvent sous **Documentation**, où **Télécharger la description OpenAPI** vous donne aussi le fichier OpenAPI.

## Requêtes et réponses {#aufrufen}
<!-- keywords: requête, request, corps, body, json, input, values, formulaire, schéma, fichiers, base64, réponse, 202, run_id, idempotency -->

Le corps de la requête est en JSON. Si le workflow a un formulaire de saisie, les champs se trouvent sous `values`, avec les types, champs obligatoires et choix du formulaire. Sinon, il y a un champ texte `input`. Les fichiers arrivent sous forme de liste `files` avec `name`, `media_type` et `content_base64`. L’API accepte aussi les fichiers en `multipart/form-data`, voir [Fichiers via l’API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/verifier-factures/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"montant": 120, "fournisseur": "ACME"}}'
```

Nodestro répond immédiatement par `202` avec un `run_id` et des liens vers l’état, le résultat et les événements. L’exécution travaille en arrière-plan. Interrogez l’état jusqu’à ce qu’il soit `succeeded`, `failed` ou `cancelled`, puis récupérez le résultat. Autres états : `queued`, `running` et `awaiting_approval`.

Si une requête ne correspond pas au schéma, l’API répond `422` et nomme chaque champ invalide. Avec l’en-tête `Idempotency-Key`, une requête répétée (par exemple après une erreur réseau) ne lance pas une deuxième exécution mais renvoie la première.

## Attente synchrone et événements {#synchron}
<!-- keywords: synchrone, sync, attendre, wait, bloquant, sse, server-sent events, flux, direct, reconnexion, last-event-id -->

Par défaut, chaque API est asynchrone. Sous **Limites**, vous pouvez activer **Autoriser l’attente du résultat**. `POST /runs?wait=30` attend alors le résultat jusqu’au délai configuré. Si l’exécution n’est pas terminée d’ici là, la réponse habituelle `202` revient. Ce n’est pas possible pour les workflows avec des étapes de validation, car une personne doit décider.

`GET /runs/<id>/events` fournit la progression en Server-Sent Events : les étapes commencent et se terminent, du texte est produit, des validations attendent, l’exécution se termine. Les prompts et les données des outils restent dans Nodestro. Si la connexion tombe, le client se reconnecte avec l’en-tête `Last-Event-ID` et ne reçoit que les événements manqués.

## Validations via l’API {#freigaben}
<!-- keywords: validation, approbation, approuver, refuser, approve, reject, attente, awaiting_approval, humain, human in the loop -->

Quand une exécution atteint une étape de validation, elle passe à `awaiting_approval`. Vous pouvez décider à deux endroits, et la première décision compte :

- dans Nodestro sur la page Validations (voir [La page Validations](/docs/verzweigungen#freigaben-seite)), avec la mention « depuis l’API publiée »,
- via `POST /runs/<id>/approve` avec `{"decision": "approved"}` ou `"rejected"` et un commentaire facultatif. Il faut une clé avec la permission `approve`.

Les validations en attente survivent à un redémarrage de Nodestro. Une exécution échouée peut être reprise avec `POST /runs/<id>/resume`. Les étapes réussies sont réutilisées. Les étapes qui ont appelé des outils ne sont relancées qu’avec `confirm_side_effects: true`.

## Clés d’API {#schluessel}
<!-- keywords: clé, clé d’api, api key, token, bearer, authorization, x-api-key, permissions, scopes, run, read, approve, révoquer, rotation, hash -->

Chaque requête a besoin d’une clé, soit en `Authorization: Bearer <clé>`, soit dans l’en-tête `X-API-Key`. Vous créez les clés sous **Clés et accès** :

- **Nom :** qui utilise la clé, par ex. le nom de l’application.
- **Permissions :** `run` lance, annule et reprend, `read` lit l’état, les résultats et les événements, `approve` décide des validations.
- **Valable pour :** les API que la clé peut appeler. Elle n’atteint jamais d’autres workflows ni l’interface de Nodestro.

La clé est affichée **une seule fois**. Nodestro n’en conserve qu’un hash et la reconnaît ensuite à son début (`ndk_…`). **Révoquer maintenant** bloque une clé. **Remplacer par une nouvelle clé** crée une nouvelle clé avec les mêmes réglages et révoque l’ancienne. Les clés n’apparaissent jamais dans les journaux, traces, sauvegardes ou exports. Après de nombreuses clés erronées en peu de temps, l’API répond `429` pendant un moment.

## Accès depuis le réseau {#netzwerk}
<!-- keywords: réseau, lan, port, 8100, 0.0.0.0, autres appareils, tls, https, certificat, pare-feu, partager -->

Par défaut, les API publiées ne répondent qu’à cet ordinateur. Les autres appareils reçoivent `403` avec le code `lan.not_enabled`. Pour autoriser les appareils de votre réseau :

1. Ouvrez **Clés et accès → Paramètres réseau** et activez l’accès réseau. Nodestro ouvre un **port distinct** (par défaut `8100`).
2. Activez **Accessible sur le réseau** pour chaque API. Seules ces API sont accessibles via ce port.

Ce port ne sert que les API publiées, jamais l’interface de Nodestro, ses réglages ou d’autres workflows. Si le port est occupé, la boîte de dialogue l’indique et Nodestro continue de fonctionner normalement. Après la restauration d’une sauvegarde, l’accès réseau est de nouveau désactivé.

## En tant qu'outil MCP {#mcp-server}
<!-- keywords: serveur mcp, outil mcp, assistant ia, claude, client, outil -->

Une API publiée peut aussi être proposée comme **outil pour les clients MCP** de cet ordinateur, par exemple un assistant IA. C'est désactivé par défaut et nécessite deux interrupteurs : l'exploitant démarre Nodestro avec `NODESTRO_MCP_SERVER=1`, et vous activez **Proposer comme outil MCP** sous *Accès*.

- Le client se connecte à `/api/published/_mcp` sur cet ordinateur et envoie une clé d'API comme jeton Bearer. Il voit les API proposées de cette clé comme des outils, nommés d'après l'API ; la clé doit être autorisée à lancer des exécutions.
- Chaque appel d'outil est une **exécution normale** de l'API publiée : même version, mêmes limites, budgets, approbations et historique. Si l'attente synchrone est activée, la réponse contient le résultat ; sinon, ou si une exécution s'arrête à une approbation, elle indique l'exécution pour que vous puissiez la suivre dans Nodestro ou via l'API.
- Les clients d'autres ordinateurs ne peuvent pas l'utiliser, pas même via l'accès réseau.

## Sécurité {#sicherheit}
<!-- keywords: sécurité, tls, https, chiffrement, internet, proxy inverse, reverse proxy, certificat, sauvegarde, secrets -->

- Sans TLS, les requêtes, les clés et les résultats circulent **en clair** sur le réseau. N’utilisez l’accès réseau que sur des réseaux de confiance, ou indiquez un certificat et sa clé (chemins de fichiers sur cet ordinateur).
- N’exposez pas Nodestro directement sur Internet. C’est le rôle de l’export, derrière un proxy inverse avec TLS.
- Chaque exécution coûte de l’argent chez le fournisseur du modèle. Ne distribuez des clés avec la permission `run` que si vous faites confiance aux limites de l’API.
- Les sauvegardes ne contiennent aucune clé d’API (voir [Sauvegarde et restauration](/docs/einstellungen#backup)). Lors d’une restauration, les clés de cet ordinateur sont conservées.

## Limites {#grenzen}
<!-- keywords: limites, limits, rate limit, 429, simultanées, budget, budget journalier, coût, upload, taille de fichier -->

Sous **Limites**, vous décidez de l’usage autorisé d’une API :

| Limite | Par défaut |
|---|---|
| Exécutions simultanées | 2 |
| Exécutions en attente de validation | 20 |
| Nouvelles exécutions par minute et par clé | 10 |
| Requêtes par minute et par clé | 120 |
| Budget journalier (coût des dernières 24 heures) | 5 USD |
| Limite de coût par exécution | Le budget du workflow |
| Taille d’un fichier envoyé | 10 Mo |

Quand une limite est dépassée, l’API répond `429` avec un code comme `limit.concurrent` ou `limit.daily_budget`, et pour les limites de débit avec l’en-tête `Retry-After`. La limite de coût par exécution complète le [budget du workflow](/docs/workflows#budget).

## Messages d’erreur {#fehler}
<!-- keywords: erreur, erreurs, error, code, statut, 401, 403, 404, 409, 422, 429, 503, lisible par machine -->

Chaque erreur a la même forme pour que les programmes puissent l’exploiter :

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Statut | Signification |
|---|---|
| `401` | Clé absente ou invalide (`auth.missing`, `auth.invalid`) |
| `403` | Permission manquante (`auth.scope`) ou accès réseau désactivé |
| `404` | L’API, la version, l’exécution ou le fichier n’existe pas |
| `409` | Incompatible avec l’état, par ex. résultat d’une exécution en cours (`run.not_finished`) |
| `422` | La requête ne correspond pas au schéma (`request.invalid`) |
| `429` | Une limite est atteinte (`limit.*`) |
| `503` | API désactivée (`publication.disabled`) ou le fournisseur d’un modèle n’est pas configuré (`model.unavailable`) |

## Tester dans Nodestro {#testen}
<!-- keywords: tester, essayer, vérifier, valider, dry run, exécution de test, exemple -->

**Tester** contient une requête d’exemple que vous pouvez adapter :

- **Vérifier la requête** valide le corps exactement comme l’API, affiche l’entrée que recevrait le workflow et ne lance rien. Cela ne coûte rien.
- **Lancer une exécution de test** lance une véritable exécution de la version publiée par le même chemin que l’API. Elle est facturée comme toute exécution et apparaît sous Exécutions comme exécution de test depuis Nodestro.

Pour les tests de régression d’une nouvelle version, utilisez les [séries de tests](/docs/automatisierung#testreihen) : elles tournent avec la version enregistrée avant que vous ne publiiez.

## Surveillance {#ueberwachung}
<!-- keywords: surveillance, monitoring, exécutions, origine, utilisation, coût, statistiques, exécutions d’api -->

Les exécutions d’API apparaissent sous Exécutions avec le déclencheur **API**. La vue détaillée indique la version et la clé qui a lancé l’exécution. Sur la page Utilisation, les exécutions des API publiées ont leur propre ligne (voir [La page Utilisation](/docs/nutzung#statistik)). L’aperçu de la boîte de dialogue montre les dernières exécutions de cette API, et `GET /usage` fournit les mêmes chiffres aux programmes.

## Export en projet FastAPI {#export}
<!-- keywords: export, exporter, zip, fastapi, projet, autonome, docker, uvicorn, readme, tests, pyproject, lock, déploiement, serveur -->

Sous **Export**, **Générer le ZIP** crée un projet autonome à partir d’une version publiée. Il contient :

| Partie | Contenu |
|---|---|
| `app/` | Application FastAPI avec les mêmes points de terminaison, configuration, gestion des clés |
| `nodestro_runtime/`, `nodestro_api/` | Le runtime de Nodestro (nodestro-runtime et la couche HTTP de nodestro-api), copié sans modification ; versions et sommes de contrôle dans `RUNTIME.json` |
| `workflow/` | La version figée avec agents, outils et sous-workflows |
| `pyproject.toml`, `requirements.lock` | Dépendances avec versions exactes |
| `tests/`, `examples/` | Tests sans appel au modèle, une requête d’exemple et un client Python |
| `README.md`, `Dockerfile`, `.env.example` | Installation, configuration et exploitation |

Si des outils ont besoin de bibliothèques Python, l’export reprend exactement les versions approuvées (voir [Approbation des bibliothèques](/docs/python-bibliotheken#freigabe)). Avant la génération, la boîte de dialogue montre chaque fichier et chaque remarque. L’export ne contient jamais de clés d’API, de réglages ni d’autres workflows. La même version avec les mêmes options donne le même fichier ZIP, octet pour octet.

Dans le projet exporté, `python -m app.keys new` crée des clés pour vos clients. Les accès aux fournisseurs d’IA se définissent comme variables d’environnement, par exemple `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` ou `GEMINI_API_KEY` ; le README et `.env.example` nomment exactement les variables dont la version du workflow a besoin. Les URL de base de vos propres serveurs sont exportées aussi, sauf si elles contiennent des identifiants ; vous les définissez alors vous-même (par exemple `OLLAMA_BASE_URL`).

## La bibliothèque Orkexa {#orkexa}
<!-- keywords: orkexa, bibliothèque, dépôt, licence, mit, vendor, inclure, git, accès -->

Nodestro exécute les agents avec la bibliothèque **Orkexa**, qui dialogue avec tous les fournisseurs pris en charge. Elle n’est pas sur PyPI et se trouve dans un dépôt actuellement privé. L’export propose donc deux voies :

- **Référence Git** (par défaut) : `pyproject.toml` pointe vers le commit exact. Qui installe le projet a besoin d’un accès en lecture au dépôt.
- **Inclure le code source :** le code va dans `vendor/orkexa/` et le projet s’installe sans accès au dépôt. La bibliothèque est sous licence MIT. Confirmez que vous pouvez la transmettre avant de donner ce projet à d’autres.

Sans l’une des deux, le projet ne peut pas être installé. Le README indique la voie choisie.

## Connaissances et mémoire dans l’export {#daten}
<!-- keywords: connaissances, knowledge, mémoire, memory, données, confidentialité, confidentiel, inclure, exclure -->

Les fichiers de connaissances et la mémoire persistante peuvent contenir des informations confidentielles. Ils n’entrent donc **dans le projet que si vous les sélectionnez un par un** :

- **Connaissances** (voir [Connaissances](/docs/wissen#ueberblick)) : les fichiers sélectionnés sont copiés avec leur contenu. Les autres sont absents, et les agents n’y trouvent rien.
- **Mémoire** (voir [Mémoire persistante](/docs/memory#dauerhaft)) : le contenu actuel d’un espace mémoire sélectionné devient le contenu de départ du projet. Ensuite, les deux évoluent séparément.

La vérification avant l’export liste les agents qui utilisent des données laissées de côté. En service direct, les exécutions d’API utilisent les connaissances et la mémoire de Nodestro comme toute autre exécution.

## Guide d’intégration avec l’IA {#ki-anleitung}
<!-- keywords: ia, guide, documentation, description, coût, facultatif, relire, accepter, rejeter -->

Par défaut, l’export est créé sans IA et sans coût : le README et les exemples proviennent de modèles. En option, le modèle assistant rédige à partir de la documentation générée un guide en prose pour les utilisateurs de votre API (`docs/AI_GUIDE.md`). Seule la documentation de l’API est envoyée au modèle, sans clés ni données. C’est un appel payant au modèle, qui apparaît sur la page Utilisation sous « Guide IA pour une API ».

Le guide n’entre dans l’export qu’après votre relecture : lisez-le et cliquez sur **Accepter** ou **Rejeter**. Il ne change rien au code ni aux points de terminaison.

# Réglages et fonctionnement

Ce chapitre décrit tous les réglages, l’installation et le démarrage de Nodestro ainsi que les raccourcis clavier.

## Fournisseurs d’IA {#anbieter}
<!-- keywords: clé api, fournisseur, anthropic, openai, gemini, ollama, vllm, compatible openai, url de base, variable d’environnement, .env, capacités -->

Nodestro exécute les agents avec la bibliothèque Orkexa et travaille avec plusieurs **fournisseurs d’IA** à la fois : **Anthropic**, **OpenAI**, **Google Gemini** et vos propres serveurs via un **point d’accès compatible OpenAI**, **Ollama** ou **vLLM**. Chaque agent utilise le fournisseur de son modèle. Si ce fournisseur n’est pas configuré, l’exécution ne démarre pas ; Nodestro ne bascule jamais en silence vers un autre fournisseur. S’il manque le fournisseur du modèle par défaut, « Configurer un fournisseur d’IA » apparaît en haut à droite, ou « Le modèle par défaut requiert … » si un autre fournisseur est déjà configuré.

Sous *Réglages → Fournisseurs d’IA*, chaque fournisseur a sa propre section :

- **Anthropic, OpenAI, Google Gemini :** saisissez la clé API et cliquez sur **Enregistrer**. La clé est stockée dans la base de données locale, n’est plus jamais affichée et n’est envoyée qu’à ce fournisseur. **Supprimer** l’efface.
- **Point d’accès compatible OpenAI, Ollama, vLLM :** saisissez l’**URL de base** du serveur (par exemple `http://localhost:11434/v1` pour Ollama) puis **Enregistrer le point d’accès** ; une clé API est facultative. Le fournisseur n’est considéré comme configuré qu’une fois une URL de base enregistrée.
- **Amazon Bedrock (AWS) :** pas de clé API ; vous choisissez une région AWS et la façon dont Nodestro se connecte à AWS, voir [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
- **Ce que savent faire les modèles :** pour vos propres serveurs, vous indiquez si leurs modèles gèrent les outils, la sortie structurée, les images, les documents PDF, l’effort de raisonnement et d’autres capacités. Nodestro ne suppose rien : une option qu’un modèle ne sait pas faire, ou dont la prise en charge est inconnue, est signalée comme erreur par la vérification au lieu d’être omise.
- **Tester la connexion** demande seulement au fournisseur sa liste de modèles ; cela ne coûte rien.
- **Premier fournisseur :** si vous enregistrez une clé alors que le fournisseur du modèle par défaut n’est pas encore configuré, les nouveaux agents utilisent désormais un modèle de ce fournisseur ; un message indique lequel. Seuls les réglages changent : les workflows existants gardent leurs modèles.

Vous pouvez aussi définir les clés comme **variables d’environnement**, avant le démarrage ou dans un fichier **`.env`** du dossier depuis lequel vous lancez `nodestro`. Les variables d’environnement sont **prioritaires** sur les clés enregistrées :

| Fournisseur | Variable d’environnement |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |
| Compatible OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (facultative) |

Une clé des versions précédentes (alors uniquement pour Anthropic) devient automatiquement la clé d’Anthropic dans ces réglages au premier démarrage.

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, région, iam, rôle, profil, sso, profil d’inférence, arn, ue, résidence des données, ue uniquement, converse, aws_region, sts -->

**Amazon Bedrock** exécute Claude, Amazon Nova et d’autres modèles via votre propre **compte AWS**, dans la **région AWS** que vous choisissez ; les coûts figurent sur votre facture AWS. Bedrock n’a **pas de champ de clé API** : Nodestro se connecte avec des identifiants AWS et n’enregistre jamais de clés d’accès AWS. Un rôle IAM ou un profil AWS n’est pas une clé ; il indique seulement à AWS qui fait la demande.

**Connexion sur le poste de travail.** Sous *Réglages → Fournisseurs d’IA → Amazon Bedrock (AWS)*, choisissez :

- **Identifiants AWS par défaut (environnement, SSO, rôle d’instance) :** ce que les outils AWS trouvent sur cet ordinateur, par exemple après `aws sso login`, dans les variables d’environnement `AWS_*` ou via un rôle d’instance.
- **Profil AWS :** un profil nommé de `~/.aws/config` ; saisissez uniquement son **nom**, les identifiants restent dans votre configuration AWS.

Dans Nodestro Local (un conteneur), seuls les identifiants par défaut sont proposés.

**Connexion sur un serveur.** Les identifiants AWS propres au serveur ne sont jamais utilisés pour un espace de travail. Bedrock reste désactivé tant que l’exploitant n’a pas attribué à l’espace de travail son propre **rôle AWS** ; la carte indique alors *Rôle attribué par l’exploitant*, et vous ne pouvez ni voir ni modifier ce rôle. Sans rôle, elle indique *non disponible sur ce serveur* : adressez-vous à votre exploitant. L’exploitant peut aussi limiter les régions et imposer la résidence des données dans l’UE pour tous les espaces de travail (voir [Nodestro sur un serveur](/docs/einstellungen#server)).

**Région.** Saisissez la région à laquelle les requêtes sont envoyées et qu’AWS facture, par exemple `eu-central-1` (Francfort). Le champ propose des régions courantes et refuse les noms qui ne sont pas des régions AWS. Le modèle doit être activé pour votre compte dans cette région.

**Modèle.** Dans l’agent, choisissez le fournisseur *Amazon Bedrock (AWS)*. La liste affiche des modèles **suggérés** (profils d’inférence UE de Claude et d’Amazon Nova) ; une suggestion ne signifie pas que le modèle est activé pour votre compte. Vous pouvez saisir tout **identifiant de modèle** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **identifiant de profil d’inférence** (`eu.anthropic.claude-sonnet-5-5`) ou **ARN** (par exemple d’un profil d’inférence d’application) ; il est enregistré sous la forme `bedrock:<id>` et transmis tel que vous le saisissez, deux-points compris (voir [Modèle](/docs/agenten#modell)).

**Résidence des données dans l’UE uniquement.** Lorsque l’interrupteur est activé, Nodestro vérifie avant la première requête que la région et toutes les régions vers lesquelles le modèle ou le profil d’inférence peut acheminer sont des régions de l’UE (Francfort, Stockholm, Milan, Espagne, Irlande, Paris) ; sinon, rien n’est envoyé. Les profils d’inférence globaux (`global.…`) sont toujours refusés ; Londres et Zurich sont en Europe, mais pas dans l’UE. La vérification porte sur la configuration avec laquelle Nodestro envoie les requêtes. Elle **ne garantit pas** qu’AWS traite tout dans l’UE : la journalisation des appels de modèles, la détection des abus et sa conservation ainsi que les autres réglages de votre compte AWS échappent à Nodestro. Pour l’imposer à l’échelle du compte, utilisez IAM et les politiques de contrôle des services. Si votre exploitant impose « UE uniquement », l’interrupteur reste activé.

**Vérifier la connexion.** Le bouton se connecte à AWS (`sts:GetCallerIdentity`) et effectue une lecture gratuite sur Bedrock (une liste de modèles). **Aucun modèle n’est appelé, cela ne coûte donc rien.** Le badge indique ensuite *Connexion vérifiée* ou *Échec de la vérification* avec la cause ; auparavant *Non configuré* ou *Configuré*.

**Autorisations IAM minimales** du rôle ou de l’utilisateur :

- `bedrock:InvokeModel` et `bedrock:InvokeModelWithResponseStream` sur le modèle ou le profil d’inférence (l’API Converse les utilise) ; avec un profil d’inférence, aussi sur le modèle de base dans chaque région de destination ;
- `bedrock:GetInferenceProfile` sur le profil (vérification « UE uniquement ») et `bedrock:GetGuardrail` si vous utilisez un garde-fou (guardrail) ;
- `sts:GetCallerIdentity` et `bedrock:ListFoundationModels` pour *Vérifier la connexion*.

**Prix.** Bedrock est facturé **par région**, jamais aux prix d’Anthropic, y compris pour Claude. Un prix ne s’applique qu’aux régions qu’il indique ; une région non indiquée a un coût **inconnu**, jamais 0, et le mode de prix strict refuse alors la requête. Saisissez vos propres prix avec leurs régions sous [Prix des modèles](/docs/nutzung#preise). Votre facture AWS peut comporter plus que ce que Nodestro compte (par exemple la journalisation des appels, les garde-fous ou d’autres services AWS).

**Ce que propose Bedrock.** Outils, streaming, images et documents PDF, sortie structurée et effort de raisonnement dépendent du modèle ; les options qu’un modèle ne prend pas en charge, ou dont la prise en charge est inconnue (un ARN saisi, un profil d’inférence d’application), Nodestro les affiche désactivées avec la raison. **Non disponible sur Bedrock**, y compris pour Claude : les outils serveur comme la recherche web, les modes de réflexion, les réglages de cache des prompts d’Anthropic, les modèles de repli, les lots et les citations.

**Outils et identifiants AWS.** Sur le poste de travail, Nodestro tient les identifiants AWS à l’écart des outils (variables d’environnement et recherches du SDK AWS). Le code d’outil dans le bac à sable simple par sous-processus s’exécute toutefois sous votre utilisateur et pourrait lire directement les fichiers de `~/.aws`. Si de vrais identifiants AWS se trouvent sur la machine, exécutez vos propres outils et ceux générés par l’IA dans le bac à sable intégré ou dans des conteneurs (voir [Bac à sable](/docs/einstellungen#sandbox)).

**Dépannage selon le message :**

| Message | Que faire |
|---|---|
| Aucun identifiant AWS n’a été trouvé | Connectez-vous (`aws sso login`), vérifiez le profil ou l’environnement, puis *Vérifier la connexion*. |
| AWS n’a pas accepté les identifiants | Ils sont erronés ou ont expiré : reconnectez-vous. |
| AWS a refusé l’accès | Accordez les autorisations ci-dessus et activez le modèle dans la console AWS. |
| Le profil AWS … n’existe pas | Comparez le nom du profil avec `~/.aws/config`. |
| Pas un nom de région AWS / non valide | Utilisez un nom comme `eu-central-1`. |
| Inconnu dans cette région | Utilisez un identifiant de modèle ou un profil d’inférence proposé dans cette région. |
| N’a pas pu être joint | Vérifiez le réseau, le proxy et la région. |
| Pourrait enfreindre la résidence des données dans l’UE | Utilisez une région de l’UE et un profil `eu.` ou un modèle de cette région. |
| Non disponible sur ce serveur | Demandez à votre exploitant d’attribuer un rôle AWS à l’espace de travail. |

## Modèle des assistants et modèle par défaut {#modelle}
<!-- keywords: modèle par défaut, modèle des assistants, default model, nouveaux agents -->

- **Modèle par défaut des nouveaux agents :** les nouveaux agents vides démarrent avec ce fournisseur et ce modèle (depuis la palette, dans les nouveaux workflows et comme modèle vide). Dans les brouillons par IA, il sert de remplacement si l’architecte propose un modèle non autorisé. Les agents existants ne changent pas.
- **Modèle des assistants :** ce modèle conçoit des agents à partir de votre description, écrit des outils en tant qu’agent de code, propose des structures de mémoire et répond à vos questions en tant que [Nodestro Assistant](/docs/assistent). Un modèle puissant (par défaut : Claude Opus 5.5 d’Anthropic) donne de meilleures propositions. Les brouillons par IA ne proposent que des modèles de fournisseurs configurés.

Les deux champs se composent d’un **fournisseur** et d’un **modèle**. Choisissez le modèle dans la liste ou saisissez n’importe quel identifiant de modèle du fournisseur, par exemple `gpt-5.5` chez OpenAI ou `llama3.1:8b` chez Ollama. Il est enregistré sous la forme `fournisseur:modèle` (par exemple `openai:gpt-5.5`) ; les anciennes valeurs sans fournisseur comme `claude-sonnet-5-5` comptent comme modèles d’Anthropic.

Si le modèle par défaut appartient à un fournisseur non configuré alors qu’un autre l’est, un avis au-dessus du choix du modèle indique que les nouveaux agents et les copies d’exemples ne peuvent pas s’exécuter avec lui et propose le modèle correspondant du fournisseur configuré (*Utiliser …*). Les workflows existants gardent leurs modèles dans tous les cas.

Enregistrez les modifications avec **Enregistrer** dans la section *Modèles et budget*.

## Budget par défaut {#budget}
<!-- keywords: budget par défaut, budget, limite -->

Le **budget par défaut par exécution** (au départ 2 USD) s’applique à tous les workflows sans budget propre. Vide signifie : pas de limite. Le fonctionnement du budget est expliqué dans [Budget par exécution](/docs/workflows#budget).

## Bac à sable {#sandbox}
<!-- keywords: choisir le bac à sable, sandbox, docker, processus python, docker disponible -->

Ici, vous choisissez où s’exécutent les outils que vous écrivez vous-même : **Processus Python** ou **Docker**. Le changement s’applique immédiatement. Des indications montrent si Docker a été trouvé et si le **bac à sable Linux intégré** est actif ; s’il ne l’est pas, la raison est indiquée (par exemple une distribution Linux non testée ou une fonction du noyau manquante). Si Docker est sélectionné mais injoignable, les tests et appels d’outils échouent. Les détails se trouvent sous [Le bac à sable](/docs/tools#sandbox).

Les outils créés par l’IA et ceux d’origine inconnue ne s’exécutent qu’isolés : automatiquement dans le bac à sable Linux intégré, sinon uniquement avec Docker ; voir [Confiance et isolation](/docs/tools#vertrauen).

## Langue {#sprache}
<!-- keywords: langue, language, français, anglais, allemand, espagnol, portugais, italien, langue du navigateur, traduction, localisation -->

Nodestro est disponible en **allemand, anglais, espagnol, français, portugais (Brésil) et italien**. Dans **Langue de l’interface**, vous choisissez l’une d’elles ou **Automatique (langue du navigateur)**.

- **Premier démarrage :** Nodestro reprend la langue de votre navigateur. Si elle n’est pas prise en charge, l’anglais s’affiche.
- **Votre choix :** une langue choisie a toujours la priorité et reste enregistrée, même après un redémarrage. Nodestro la mémorise dans le navigateur et dans les réglages ; un autre navigateur la reprend tant qu’il n’a pas son propre choix.
- **Effet immédiat :** le changement ne nécessite aucun redémarrage et ne lance ni workflow ni appel à l’IA.

La langue ne concerne que l’**interface** : menus, remarques, messages d’erreur, cette documentation et formats des nombres et des dates. Les coûts sont toujours affichés en dollars américains, au format de la langue choisie. Pour les messages d’erreur du serveur, le texte d’origine est visible sous **Détails techniques**.

**Votre contenu reste inchangé.** Agents, prompts, workflows, outils, connaissances, mémoire et résultats ne sont jamais traduits automatiquement. Un agent existant continue de répondre dans la langue de son prompt, quelle que soit la langue de l’interface.

**Assistants IA :** les nouvelles propositions (agents, structures de mémoire) sont rédigées dans la langue de l’interface, sauf si votre description demande une autre langue. Le code, les identifiants et les clés JSON restent toujours en anglais.

## Apparence {#darstellung}
<!-- keywords: thème, sombre, clair, mode sombre, mode clair, couleurs, design, midnight citron -->

En haut à droite, vous passez de **Sombre** à **Clair**. Le choix est enregistré dans le navigateur. Les deux variantes suivent le système de design *Midnight Citron*. Sur les écrans étroits, la barre latérale est masquée : le bouton de menu en haut à gauche (**Afficher toutes les pages**) l’ouvre en panneau, et **Échap** la referme.

## Sauvegarde et restauration {#backup}
<!-- keywords: sauvegarde, backup, restaurer, export, zip, déménagement, copie de sécurité -->

**Télécharger la sauvegarde** enregistre toutes les données dans un fichier ZIP : workflows avec versions, modèles d’agents, outils personnalisés, fichiers de connaissances, mémoire, exécutions, données d’utilisation, favoris, étiquettes et réglages. La base de données est sauvegardée comme instantané cohérent, même pendant qu’une exécution travaille.

Les **clés API** des fournisseurs d’IA ne sont jamais écrites dans la sauvegarde, pas plus que les URL de base contenant des identifiants. La restauration conserve les clés de cet ordinateur.

**Restaurer depuis un fichier** vérifie d’abord entièrement le fichier : format, somme de contrôle de chaque fichier, base de données et chaque workflow et exécution enregistrés. Ce n’est qu’ensuite que Nodestro montre ce que contient la sauvegarde, comparé à l’état actuel. Les données ne sont remplacées qu’après confirmation explicite et seulement si aucune exécution n’est active. Avant cela, Nodestro enregistre automatiquement une sauvegarde de l’état actuel (`before-restore-….zip` dans le dossier `backups` du répertoire de données) ; elle apparaît parmi les sauvegardes de cet ordinateur et se restaure de la même façon. Si quelque chose échoue, les données précédentes restent inchangées.

## Diagnostic du système {#diagnose}
<!-- keywords: diagnostic, vérifier, dépannage, connexion, docker, sandbox, version, problème -->

**Lancer le diagnostic** vérifie si Nodestro fonctionne entièrement sur cet ordinateur et affiche pour chaque point **OK**, **Avertissement** ou **Erreur**, avec une explication et une proposition de solution :

- versions de Nodestro, d’Orkexa, de Python, de SQLite et du système d’exploitation
- base de données (lisible, modifiable, intacte, recherche plein texte)
- répertoires de données, d’outils et de sauvegardes modifiables, espace disque libre
- fournisseurs d’IA : lesquels sont configurés et si ceux du modèle par défaut et du modèle de l’assistant en font partie (sans afficher de clé)
- Docker et la sandbox des outils avec un petit outil de test
- prise en charge des PDF et interface compilée

Le diagnostic est gratuit et n’envoie rien sur Internet. **Tester la connexion** demande en plus la liste des modèles au fournisseur du modèle par défaut ; dans la section de chaque fournisseur sous [Fournisseurs d’IA](/docs/einstellungen#anbieter), vous le testez individuellement. Cela n’utilise aucun token et ne coûte rien. Les clés API et autres identifiants ne sont jamais affichés.

## Installation et démarrage {#installation}
<!-- keywords: installation, démarrage, ligne de commande, cli, port, host, data-dir, no-browser, reload, python, node -->

Prérequis : Python 3.10 ou plus récent et Node.js 20 ou plus récent (uniquement pour compiler l’interface), Docker en option.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro démarre sur `http://localhost:8000` et ouvre le navigateur. Options de la commande `nodestro` :

| Option | Variable d’environnement | Signification |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Adresse (par défaut `127.0.0.1`). Seules les adresses de cet ordinateur (`127.0.0.1`, `::1`, `localhost`) sont acceptées, car Nodestro n’a pas encore de connexion |
| `--port` | `NODESTRO_PORT` | Port (par défaut `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Répertoire de données (par défaut `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Profil de fonctionnement (par défaut `desktop`). `server` ne peut pas encore être démarré |
| – | `NODESTRO_ALLOWED_HOSTS` | Autres noms de cet ordinateur auxquels Nodestro répond (séparés par des virgules, p. ex. `studio.localhost`). Les autres noms d’hôte, les modifications venant de pages web étrangères et les requêtes transmises par un proxy sont refusés, afin qu’aucune page du navigateur ne puisse piloter Nodestro |
| `--no-browser` | – | Ne pas ouvrir le navigateur automatiquement |
| `--reload` | – | Redémarrer à chaque modification du code (développement) |

Arrêt avec **Ctrl+C**. Les exécutions en cours sont annulées.

> **Sécurité :** Nodestro n’a pas encore de gestion des utilisateurs, il ne répond donc qu’à cet ordinateur. `--host 0.0.0.0`, d’autres adresses réseau ou des noms réseau dans `NODESTRO_ALLOWED_HOSTS` arrêtent le démarrage, et Nodestro ne peut pas être placé derrière un proxy inverse. Pour que d’autres appareils utilisent un workflow, publiez-le comme API : les API publiées utilisent des clés API et ont leur propre accès réseau (voir *API et export*).

## Nodestro sur un serveur {#server}
<!-- keywords: serveur, se connecter, connexion, se déconnecter, rôle, rôles, autorisation, autorisations, espace de travail, tenant, lecture seule, membres, nodestro-server, set-role, remove-member, revoke-sessions, session expirée -->

Nodestro Studio peut aussi fonctionner sur un **serveur Nodestro** de votre organisation. Vous vous connectez alors via le service de connexion de votre organisation, et vos données sont stockées sur ce serveur plutôt que sur votre ordinateur. L’application de bureau et la commande `nodestro` n’ont ni connexion ni rôles ; rien dans cette section ne s’y applique.

**Se connecter et se déconnecter.** Lorsque vous ouvrez Nodestro, le serveur vous mène à la connexion, puis vous ramène. Votre nom et votre rôle s’affichent en haut à droite. Un clic ouvre votre compte : nom, rôle, **espace de travail**, vos autorisations et **Se déconnecter**. Lorsque votre session prend fin, l’action suivante vous ramène à la connexion, puis à la même page. Si une connexion échoue (par exemple parce qu’elle a pris trop de temps), un avis en haut de la page explique ce qui s’est passé, avec **Se reconnecter**.

**Espaces de travail.** Les workflows, les exécutions, les connaissances et les réglages appartiennent à un espace de travail. Si vous êtes membre de plusieurs espaces, changez dans votre compte avec **Changer d’espace de travail** ; Nodestro charge alors la page d’accueil de l’autre espace. Les réglages s’appliquent à votre espace de travail actuel sur ce serveur.

**Rôles et autorisations.** Chaque rôle comporte des autorisations fixes :

| Rôle | Autorisations |
|---|---|
| **Propriétaire** | Lire, Modifier, Exécuter, Administrer |
| **Administrateur** | Lire, Modifier, Exécuter, Administrer |
| **Éditeur** | Lire, Modifier, Exécuter |
| **Opérateur** | Lire, Exécuter |
| **Lecteur** | Lire |

- **Lire :** tout consulter, y compris les exécutions et la documentation.
- **Modifier :** créer et modifier des workflows, des modèles d’agents, des connaissances et la mémoire.
- **Exécuter :** lancer des workflows, annuler et reprendre des exécutions, décider des validations.
- **Administrer :** réglages, fournisseurs d’IA, services connectés, règles des appels d’outils, publication d’API et clés API.
- **Gérer l’installation** n’appartient à aucun rôle : la sauvegarde, le diagnostic système et l’accès réseau des API publiées n’apparaissent pas sur un serveur ; c’est l’exploitant qui s’en charge.

**Nodestro montre à l’avance ce que votre rôle ne permet pas.** Ces commandes sont masquées ou bloquées, avec la raison à côté, par exemple *Votre rôle (Lecteur) ne permet pas cette action : il faut l’autorisation « Modifier ». Adressez-vous à un administrateur de votre serveur Nodestro.* En tant que **Lecteur** ou **Opérateur**, un avis en haut de chaque page indique que vous pouvez tout consulter, mais rien modifier (et, en tant que lecteur, rien exécuter). Le serveur vérifie quand même chaque requête lui-même.

**Les membres et les rôles** sont gérés par l’exploitant du serveur avec des commandes de la ligne de commande `nodestro-server` ; Nodestro Studio n’a pas de page pour cela :

- `nodestro-server members TENANT` liste les membres d’un espace de travail avec leurs rôles.
- `nodestro-server set-role TENANT USER ROLE` ajoute une personne ou modifie son rôle (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` retire une personne de l’espace de travail et y met fin à ses sessions.
- `nodestro-server revoke-sessions USER` met fin à toutes les sessions d’une personne (les adhésions restent).

`USER` est un ID d’utilisateur (`u_…`), une adresse e-mail vérifiée ou l’identifiant auprès du service de connexion. Le serveur ne connaît une personne qu’après sa première connexion ; un espace de travail garde toujours au moins un propriétaire. Les détails figurent dans le runbook du dépôt nodestro-server (`docs/RUNBOOK.md`, section *Members*). Si la connexion indique que votre compte n’a pas encore d’accès, demandez à un administrateur de vous ajouter.

**Données.** En bas de la barre latérale, **Le serveur de votre organisation** remplace *Local et privé* : vos données restent sur ce serveur et ne vont qu’aux fournisseurs d’IA autorisés par votre exploitant. Les sauvegardes et l’installation sont prises en charge par l’exploitant. Des phrases comme « s’exécute uniquement sur votre ordinateur » ne valent que pour l’application de bureau et la commande `nodestro`.

## Raccourcis clavier {#tastenkuerzel}
<!-- keywords: raccourcis clavier, shortcuts, clavier, keyboard, accessibilité -->

<!-- widget: shortcuts -->

En outre, partout : **Tab** passe au contrôle suivant et affiche son explication, **Échap** ferme les boîtes de dialogue et les explications, **Entrée** ou **Espace** active les boutons.

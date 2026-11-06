# Réglages et fonctionnement

Ce chapitre décrit tous les réglages, l’installation et le démarrage de Nodestro ainsi que les raccourcis clavier.

## S’orienter dans les réglages {#ueberblick}
<!-- keywords: réglages, roue dentée, ouvrir les réglages, rechercher un réglage, trouver un réglage, largeur, plus large, redimensionner, navigation, avancé, ctrl+virgule -->

- **Ouvrir :** la roue dentée en haut à droite de chaque page, ou *Ctrl+,* (*⌘,* sur Mac). Les réglages retiennent d’où vous venez : **Retour** au-dessus de la navigation (ou à nouveau *Ctrl+,*) vous y ramène. Une page avec des modifications non enregistrées, comme l’éditeur de workflows, vous demande d’abord.
- **Recherche :** *Trouver un réglage …* au-dessus de la navigation cherche dans les noms, les explications et les textes d’aide des réglages, dans la langue de l’interface. Les touches fléchées choisissent un résultat, **Entrée** y mène : les parties fermées s’ouvrent, le réglage est mis en évidence et son champ reçoit le focus.
- **Navigation :** la liste à droite montre les sections par thème et signale celle que vous lisez. Dans une fenêtre étroite, elle devient une barre au-dessus du contenu avec la recherche et *Aller à la section*.
- **Largeur :** faites glisser le bord entre le contenu et la navigation pour élargir ou rétrécir les réglages. Au clavier, placez le focus sur le bord (Tab) et utilisez les touches fléchées (avec Maj par pas plus grands), Début et Fin. Un double-clic sur le bord ou **Largeur standard** dans la navigation rétablit la valeur par défaut. La largeur est enregistrée dans ce navigateur.
- **Base et avancé :** les réglages liés sont regroupés sous un titre. Les parties marquées *Avancé* (par exemple ce que savent faire les modèles d’un point de terminaison compatible OpenAI) restent fermées jusqu’à ce que vous en ayez besoin ; leur badge indique combien de valeurs diffèrent du standard.
- **Enregistrer :** la plupart des réglages s’appliquent aussitôt. *Modèles et budget* a son propre bouton **Enregistrer** ; si vous quittez la page avec des modifications non enregistrées à cet endroit, Nodestro vous demande d’abord.

## Modèles locaux {#lokale-modelle}
<!-- keywords: modèle local, ollama, hors ligne, sans clé d’api, qwen, téléchargement, recommandation, matériel, gpu, mémoire, serveur de modèles, mistral, européen, effort de raisonnement -->

→ [Ouvrir dans Nodestro](/settings#settings-local-models)

Nodestro peut faire fonctionner les agents, les assistants et la recherche dans les connaissances avec des **modèles locaux** via Ollama, sans clé d’API : les instructions et les documents restent sur cet ordinateur. Une nouvelle installation utilise par défaut des modèles locaux (agents `ollama:qwen3.5:4b`, assistant `ollama:qwen3.5:9b`) ; une installation mise à jour conserve ses modèles.

*Réglages → Modèles locaux* affiche :

- **État :** si le serveur de modèles fonctionne et qui le fournit. Sur le poste de travail, Nodestro démarre son propre serveur (un processus distinct sur cet ordinateur, avec son propre dossier de modèles) ; dans Nodestro Local Docker, c’est un conteneur distinct ; sur un serveur, l’exploitant le fournit. Un Ollama que vous utilisez déjà n’est employé que si vous enregistrez son adresse pour le fournisseur Ollama.
- **Environnement :** s’il manque, **Télécharger et installer** récupère une fois la version fixée et vérifie son SHA-256. Sans internet, installez-le depuis son archive de version (voir [Import hors ligne](/docs/einstellungen#offline-import)).
- **Recommandé pour cet ordinateur :** un modèle par tâche (trier, rédiger, agents avec outils, analyse, assistant, recherche sémantique) d’après les besoins de la tâche, la mémoire de cet ordinateur et les modèles installés. Un modèle installé suffisant passe en premier ; *Adapté* et *Limité* signifient qu’un modèle plus grand ferait mieux ; la raison s’affiche sous le modèle. Les suggestions ne modifient jamais un agent : vous choisissez son modèle dans l’éditeur.
- **Modèles :** les modèles proposés avec la taille du téléchargement, la mémoire requise et la licence ; **Vérifié** signifie que la version installée est celle que Nodestro a vérifiée.

**Préférer les modèles européens :** Qwen reste le standard. Lorsque l’interrupteur est activé, les recommandations proposent, à adéquation égale, des modèles de l’éditeur européen Mistral AI (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b`, et `devstral-small-2:24b` pour la programmation), même s’ils doivent encore être téléchargés ; un modèle installé reste la première alternative. Un modèle moins performant n’est jamais proposé, et l’interrupteur n’utilise jamais de service cloud : tous ces modèles s’exécutent sur cet ordinateur. Un modèle que vous attribuez vous-même à un agent a toujours la priorité, et le mode hors ligne strict continue de refuser les téléchargements. Pour la recherche sémantique, l’interrupteur propose le modèle européen `mdenseon:307m` (LightOn) tant qu’aucun modèle d’embedding n’est installé. Il ne provient pas de la bibliothèque Ollama : **Télécharger** récupère les fichiers d’origine épinglés (1,2 Go), vérifie leur SHA-256, construit le modèle et ne le conserve que s’il reproduit exactement les vecteurs de référence. Un index existant garde son modèle ; en changer implique de reconstruire l’index.

**Effort de raisonnement :** les modèles locaux capables de « réfléchir » le font sans limite à partir de l’effort *Moyen*, et cette réflexion compte dans la longueur de sortie maximale. Sur un ordinateur sans carte graphique, un petit modèle peut y passer de nombreuses minutes. Pour les étapes rapides (tri, extraction, réponses structurées courtes), choisissez *Faible* : le modèle répond alors sans réfléchir. Le serveur de modèles démarré par Nodestro donne à chaque modèle 32 768 tokens de contexte pour le prompt, la réflexion et la réponse réunis. Démarrez un Ollama que vous exploitez vous-même avec `OLLAMA_CONTEXT_LENGTH=32768` ; sa valeur par défaut de 4 096 tokens est trop faible pour des agents.

Coûts : les modèles locaux n’ont **pas de facturation d’API externe**. Nodestro n’enregistre pas les coûts d’exploitation locaux (matériel, énergie) : les exécutions affichent donc « local, pas de facturation d’API » au lieu d’un total de 0, et les exécutions mixtes ajoutent au coût le nombre de requêtes locales.

## Cet ordinateur, fenêtre de contexte et vitesse {#lokale-hardware}
<!-- keywords: matériel, gpu, cpu seul, mémoire, fenêtre de contexte, ollama_context_length, vitesse, tokens par seconde, mesurer, mode économie cpu, réflexion réduite -->

*Réglages → Modèles locaux → Cet ordinateur* affiche ce que Nodestro a détecté : système, cœurs CPU, mémoire, la carte graphique et sa mémoire, si le serveur de modèles fonctionne (et sur le GPU ou le CPU) et sa **fenêtre de contexte** : fixée par Nodestro pour le serveur qu’il démarre, indiquée par un serveur en marche, ou pas encore connue pour votre propre Ollama. La colonne **Sur cet ordinateur** de la liste des modèles indique si un modèle s’exécute sur le GPU, sur le CPU (plus lent), s’il est trop lent sans GPU ou trop grand pour cette mémoire.

Des remarques apparaissent au-dessus de la liste lorsqu’elles s’appliquent : une fenêtre de contexte trop petite (pour votre propre Ollama : définissez `OLLAMA_CONTEXT_LENGTH=32768` sur son ordinateur et redémarrez-le), pas de carte graphique (attendez-vous à des réponses lentes ; les petits modèles et l’effort *Faible* pour les étapes simples conviennent le mieux), trop peu de mémoire, un modèle qui ne tient pas, ou un modèle mesuré comme lent. La vérification du workflow avertit aussi lorsque la fenêtre de contexte est inférieure à 16 384 tokens ou que la limite de réponse d’un agent n’y tient pas.

**Vitesse :** Nodestro n’estime aucune vitesse. **Mesurer la vitesse** sur un modèle de langage installé lance une courte génération sur cet ordinateur et affiche les tokens par seconde mesurés, la date de la mesure et si le modèle a tourné sur le GPU ou le CPU.

**Mode économie CPU pour les modèles qui réfléchissent** (activé par défaut) : sur un ordinateur sans carte graphique, les agents avec l’effort *Moyen* sur des modèles locaux qui réfléchissent répondent sans la longue phase de réflexion. L’effort *Élevé* et une option de raisonnement définie explicitement ne sont jamais réduits. Chaque étape ainsi traitée porte le badge « Réflexion réduite : mode économie CPU » dans l’exécution et dans le test de l’agent. Désactivez le mode pour que les agents réfléchissent toujours comme configuré.

## Import hors ligne et dossier des modèles {#offline-import}
<!-- keywords: hors ligne, air gap, usb, gguf, paquet hors ligne, sha-256, ssd externe, dossier des modèles, copier -->

Pour les ordinateurs sans internet, *Réglages → Modèles locaux → Import hors ligne* importe depuis un chemin sur l’ordinateur où fonctionne Nodestro (dans Local Docker : dans son dossier d’import) :

- **Paquet hors ligne :** un dossier créé sur un ordinateur relié à internet (`orkexa-local export`). Chaque fichier est vérifié par son SHA-256 avant d’être utilisé.
- **Fichier GGUF :** un fichier de modèle ; donnez-lui le nom qu’utilisent les agents (par exemple `mon-modele:q4`) et, pour les modèles qui lisent des images, le projecteur de vision (`mmproj`).

**Dossier des modèles :** les modèles sont volumineux. Choisissez un autre dossier, par exemple sur un SSD externe : **Les y copier et les vérifier** copie chaque modèle, le vérifie et ne change qu’ensuite (l’ancien dossier est conservé) ; **Utiliser le dossier tel quel** passe à un dossier qui contient déjà des modèles Ollama.

## Construire un modèle à partir de fichiers locaux {#modell-bauen}
<!-- keywords: construire, mdenseon, safetensors, gabarit, gguf, air gap, somme de contrôle, vecteurs de référence, embedding, reconstruire l’index -->

Certains modèles ne figurent pas dans la bibliothèque Ollama et sont construits à partir de leurs fichiers d’origine : actuellement le modèle d’embeddings européen `mdenseon:307m` (LightOn, Apache-2.0). Avec internet, **Télécharger** dans la liste des modèles récupère les fichiers et construit le modèle. Sans internet (ou en mode hors ligne strict), utilisez *Réglages → Modèles locaux → Construire à partir de fichiers locaux* : copiez les deux fichiers depuis un ordinateur connecté, indiquez leurs chemins sur l’ordinateur où fonctionne Nodestro (dans Local Docker : dans son dossier d’import) et choisissez **Construire et vérifier**. Rien n’est téléchargé.

- **Fichier de poids :** `model.safetensors` de `lightonai/mDenseOn`, révision `a5fdb000f7a21da96c3bddde3a782ef777316df3`, 1,227,771,776 octets, SHA-256 `a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c`.
- **Fichier gabarit :** `mmBERT-Base-307M-F16.gguf` de `mykor/mmBERT-base-GGUF`, révision `66e31bd2787f6b5fe9b762a664f4899af38b0605`; SHA-256 de ses premiers 6,036,928 octets `a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901`. Le fichier complet ou seulement ces premiers octets (son en-tête) suffisent.

Nodestro vérifie les deux fichiers par rapport à ces sommes, écrit le fichier du modèle, crée le modèle dans le serveur de modèles et calcule des textes de référence : le modèle n’est gardé que si chaque vecteur correspond à la référence. La liste affiche l’étape en cours ; **Annuler** arrête la construction. En cas d’échec, le message en donne la raison : un fichier qui ne correspond pas à la somme (mauvais fichier, mauvaise révision ou copie incomplète), un fichier manquant, un fichier qui ne convient pas au modèle, ou des vecteurs de référence différents (le modèle est alors supprimé). **Réessayer** la relance avec les mêmes chemins.

Après la construction, le modèle apparaît comme modèle d’embeddings. Un index sémantique existant garde son modèle : choisissez le nouveau modèle dans [Recherche dans les connaissances](/docs/wissen#suchverfahren) et reconstruisez l’index ; la recherche utilise l’ancien index jusqu’à ce que le nouveau soit complet.

## Mode hors ligne strict {#offline}
<!-- keywords: hors ligne strict, air gap, sans cloud, vérification préalable, téléchargements refusés -->

Avec le **Mode hors ligne strict** activé, la vérification avant chaque exécution refuse les modèles cloud (y compris comme modèle de secours, d’évaluation ou d’orchestration), un serveur de modèles qui n’est pas sur cet ordinateur, les outils serveur comme la recherche web et les services MCP distants ; les téléchargements sont aussi refusés. Les modèles locaux, les outils locaux et les serveurs MCP locaux continuent de fonctionner. Le mode ne modifie aucun workflow : il refuse seulement ce qui quitterait l’ordinateur.

## Fournisseurs d’IA {#anbieter}
<!-- keywords: clé api, fournisseur, anthropic, openai, gemini, ollama, vllm, compatible openai, url de base, variable d’environnement, .env, capacités -->

→ [Ouvrir dans Nodestro](/settings#settings-providers)

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

Les administrateurs fixent aussi le **Budget maximal par exécution** (vide : pas de limite) : aucune exécution ne peut démarrer avec un plafond plus élevé ni être relevée au-delà. Le **Délai des décisions de budget** (1 à 720 heures, 24 au départ) indique combien de temps une exécution en pause attend une [décision de budget](/docs/workflows#budget-freigabe) avant d’échouer. Qui peut décider est expliqué sous [Qui peut décider](/docs/workflows#budget-rechte).

## Bac à sable {#sandbox}
<!-- keywords: choisir le bac à sable, sandbox, automatique, docker, processus python, docker disponible, bac à sable intégré, bac à sable linux, macos, windows, bloqué, expérimental -->

→ [Ouvrir dans Nodestro](/settings#settings-sandbox)

Ici, vous choisissez où s’exécutent les outils. Le changement s’applique immédiatement.

| Mode | Vos outils | Outils créés par l’IA et outils d’origine inconnue |
|---|---|---|
| **Automatique** (par défaut, recommandé) | Processus Python | uniquement Docker, une fois qu’il a réussi les vérifications de Nodestro ; sinon **bloqués** |
| **Bac à sable Linux** (facultatif, Linux uniquement) | Processus Python | uniquement le bac à sable Linux intégré, sinon **bloqués** ; sans paquets Python tiers, les outils qui en ont besoin sont donc **bloqués** ; Docker n’est pas utilisé |
| **Processus Python** (usage de confiance uniquement) | Processus Python | toujours **bloqués** ; ni Docker ni le bac à sable Linux intégré ne sont utilisés |
| **Docker** | Docker | Docker ; si Docker ne tourne pas, aucun outil ne s’exécute |

Nodestro ne se replie jamais sur un processus non protégé pour du code créé par l’IA, et *Automatique* ne se replie jamais non plus sur le bac à sable Linux intégré : il n’est utilisé que si vous choisissez **Bac à sable Linux**. Si vous n’avez jamais choisi de mode, Nodestro utilise *Automatique* ; un mode choisi dans une version antérieure est conservé. Si vous aviez choisi **Processus Python** dans une version antérieure, les outils créés par l’IA sont désormais bloqués : ce mode ne les exécute plus dans un bac à sable intégré. Choisissez **Automatique** et démarrez Docker, ou, sous Linux, **Bac à sable Linux**.

Sous le choix, Nodestro affiche :

- l’**ordinateur qui exécute Nodestro** avec son système d’exploitation. Il s’agit de l’ordinateur de l’environnement d’exécution de Nodestro, et non de l’appareil de votre navigateur : si vous ouvrez Nodestro sur un serveur depuis un Mac, c’est le système du serveur qui compte ;
- où s’exécutent **maintenant** les outils créés par l’IA et vos outils, ou bien qu’ils sont **bloqués** et pourquoi ;
- chaque **bac à sable sur cet ordinateur** avec son état : *Validé* (peut exécuter du code créé par l’IA), *Expérimental, non utilisé*, *Indisponible*, *Sans isolation* (le processus Python) ou *Non utilisé ici*.

Le bac à sable Linux intégré est validé sous Ubuntu 24.04 et Debian 13 (Intel ou AMD 64 bits) dès que son autotest a réussi ; sur ARM64, il n’est pas disponible. Nodestro n’a pas de bac à sable natif sous macOS et Windows : l’ancien bac à sable expérimental de macOS a été supprimé, et sa ligne l’indique. Sur ces deux systèmes, les outils créés par l’IA nécessitent donc Docker ou un moteur compatible. Les détails se trouvent sous [Le bac à sable](/docs/tools#sandbox) et [Confiance et isolation](/docs/tools#vertrauen).

Sur un serveur et dans Nodestro Local Docker, chaque outil s’exécute dans un conteneur ; le réglage n’y est pas modifiable.

## Installer Docker {#sandbox-docker}
<!-- keywords: installer docker, docker desktop, docker engine, macos, windows, linux, wsl, démarrer docker, docker ne tourne pas, colima, orbstack, podman, rootless, groupe docker, vérifier le moteur -->

En mode *Automatique*, les outils créés par l’IA nécessitent Docker ou un moteur de conteneurs compatible sur tous les systèmes ; sous Linux, le mode **Bac à sable Linux** est la seule autre possibilité, sans paquets tiers. Nodestro démarre sans Docker ; seuls les outils créés par l’IA restent bloqués jusqu’à ce qu’un moteur adapté tourne. Nodestro trouve lui-même un moteur en cours d’exécution et construit l’image du conteneur à la première utilisation.

- **macOS :** installez [Docker Desktop pour Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon ou Intel), ouvrez-le une fois et attendez qu’il indique qu’il est en cours d’exécution. [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) et [Podman](https://podman.io/) sont aussi acceptés s’ils réussissent les vérifications de Nodestro.
- **Windows :** installez [Docker Desktop pour Windows](https://docs.docker.com/desktop/setup/install/windows-install/) avec le backend WSL 2, redémarrez si on vous le demande, puis démarrez Docker Desktop. Il doit exécuter des conteneurs Linux. Podman est aussi accepté s’il réussit les vérifications de Nodestro.
- **Linux :** installez [Docker Engine](https://docs.docker.com/engine/install/) pour votre distribution. Nous recommandons [Docker sans droits root (rootless)](https://docs.docker.com/engine/security/rootless/) avec la délégation de cgroup v2, pour que les limites s’appliquent. Ajouter votre utilisateur au groupe `docker` fonctionne aussi, mais les membres du groupe docker ont de fait les droits root sur cet ordinateur. Podman est également accepté.

**Nodestro vérifie lui-même le moteur.** Avant qu’un moteur exécute du code créé par l’IA, Nodestro vérifie ses limites et son filtre d’appels système (seccomp) et démarre un petit conteneur de test. À l’intérieur, le code doit s’exécuter sous un utilisateur sans droits ni privilèges particuliers, sans réseau, sur un système de fichiers en lecture seule, avec des limites appliquées pour la mémoire, les processus, le CPU et les fichiers ouverts, et sans secrets dans l’environnement. Nodestro refuse un moteur qui échoue à une vérification, quel que soit son nom, et *Réglages → Bac à sable* indique quelle vérification a échoué. Les vérifications ne sont jamais assouplies. Nodestro vérifie en arrière-plan : la page n’attend donc jamais Docker ; pendant la vérification, la ligne Docker indique *Vérification en cours* et se met à jour d’elle-même. Après avoir démarré ou modifié le moteur, cliquez sur **Vérifier à nouveau**. Les administrateurs peuvent aussi cliquer sur **Lancer l’autotest** pour démarrer tout de suite le conteneur de test (**Préparer le bac à sable** tant que l’image du bac à sable manque). Seuls les administrateurs lancent une nouvelle vérification, et au plus toutes les 10 secondes : sinon, la page indique que rien de nouveau n’a été vérifié (et quand réessayer) et continue d’afficher le dernier résultat. Les autres utilisateurs voient l’état et chaque vérification sans détails techniques.

**Quel moteur ?** Sous Linux, Docker Engine est le choix le plus direct, idéalement sans droits root avec la délégation de cgroup v2 ; Podman avec droits root fonctionne aussi. Podman sans droits root peut échouer aux vérifications, car il n’applique pas forcément toutes les limites de fichiers du bac à sable. Sous macOS et Windows, utilisez Docker Desktop ou l’une des alternatives ci-dessus. Quel que soit le moteur choisi, son nom ne décide pas : Nodestro s’appuie sur ses propres vérifications sur votre ordinateur.

Ouvrez ensuite *Réglages → Bac à sable* : en mode **Automatique**, Nodestro utilise Docker dès qu’il tourne ; *Docker disponible* s’affiche et les outils créés par l’IA ne sont plus bloqués. Si Docker s’arrête, ils sont de nouveau bloqués jusqu’à ce qu’il tourne ; Nodestro ne bascule pas sur le processus Python.

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

→ [Ouvrir dans Nodestro](/settings#settings-backup)

**Télécharger la sauvegarde** enregistre toutes les données dans un fichier ZIP : workflows avec versions, modèles d’agents, outils personnalisés, fichiers de connaissances, mémoire, exécutions, données d’utilisation, favoris, étiquettes et réglages. La base de données est sauvegardée comme instantané cohérent, même pendant qu’une exécution travaille.

Les **clés API** des fournisseurs d’IA ne sont jamais écrites dans la sauvegarde, pas plus que les URL de base contenant des identifiants. La restauration conserve les clés de cet ordinateur.

**Restaurer depuis un fichier** vérifie d’abord entièrement le fichier : format, somme de contrôle de chaque fichier, base de données et chaque workflow et exécution enregistrés. Ce n’est qu’ensuite que Nodestro montre ce que contient la sauvegarde, comparé à l’état actuel. Les données ne sont remplacées qu’après confirmation explicite et seulement si aucune exécution n’est active. Avant cela, Nodestro enregistre automatiquement une sauvegarde de l’état actuel (`before-restore-….zip` dans le dossier `backups` du répertoire de données) ; elle apparaît parmi les sauvegardes de cet ordinateur et se restaure de la même façon. Si quelque chose échoue, les données précédentes restent inchangées.

## Diagnostic du système {#diagnose}
<!-- keywords: diagnostic, vérifier, dépannage, connexion, docker, sandbox, version, problème -->

→ [Ouvrir dans Nodestro](/settings#settings-diagnostics)

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

Prérequis : Python 3.11 ou plus récent et Node.js 20 ou plus récent (uniquement pour compiler l’interface), Docker en option.

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
| `--profile` | `NODESTRO_PROFILE` | Profil de fonctionnement (par défaut `desktop`). Un serveur Nodestro ne se démarre pas avec cette commande : il fonctionne avec la distribution serveur distincte de Nodestro, que l’exploitant de votre organisation installe |
| – | `NODESTRO_ALLOWED_HOSTS` | Autres noms de cet ordinateur auxquels Nodestro répond (séparés par des virgules, p. ex. `studio.localhost`). Les autres noms d’hôte, les modifications venant de pages web étrangères et les requêtes transmises par un proxy sont refusés, afin qu’aucune page du navigateur ne puisse piloter Nodestro |
| `--no-browser` | – | Ne pas ouvrir le navigateur automatiquement |
| `--reload` | – | Redémarrer à chaque modification du code (développement) |

Arrêt avec **Ctrl+C**. Les exécutions en cours sont annulées.

> **Sécurité :** Nodestro n’a pas encore de gestion des utilisateurs, il ne répond donc qu’à cet ordinateur. `--host 0.0.0.0`, d’autres adresses réseau ou des noms réseau dans `NODESTRO_ALLOWED_HOSTS` arrêtent le démarrage, et Nodestro ne peut pas être placé derrière un proxy inverse. Pour que d’autres appareils utilisent un workflow, publiez-le comme API : les API publiées utilisent des clés API et ont leur propre accès réseau (voir *API et export*).

## Nodestro sur un serveur {#server}
<!-- keywords: serveur, se connecter, connexion, se déconnecter, rôle, rôles, autorisation, autorisations, espace de travail, tenant, lecture seule, membres, nodestro-server, set-role, remove-member, revoke-sessions, session expirée -->

Nodestro Studio peut aussi fonctionner sur un **serveur Nodestro** de votre organisation. Vous vous connectez alors via le service de connexion de votre organisation, et vos données sont stockées sur ce serveur plutôt que sur votre ordinateur. Nodestro lancé avec la commande `nodestro` n’a ni connexion ni rôles ; rien dans cette section ne s’y applique.

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

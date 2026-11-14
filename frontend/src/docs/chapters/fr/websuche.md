# Recherche web et lecture de pages web

Deux outils intégrés donnent accès au web à un agent : `search_web` cherche via un service de recherche que vous choisissez, et `fetch_web_page` lit une seule page. Ce chapitre explique ce qu’ils font, comment choisir un service de recherche, ce qu’il coûte, où les outils sont disponibles et comment vérifier quelles sources une exécution a utilisées.

## Les deux outils {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, recherche web, lire une page, internet, outil intégré -->

- **`search_web`** cherche sur le web ou dans les actualités et renvoie des résultats avec titre, adresse, un court extrait et, si elle est connue, la date. Il a besoin d’un **service de recherche**, une connexion de type *Recherche web* (voir [Connexions de service](/docs/verbindungen)).
- **`fetch_web_page`** lit une page (HTML, texte ou PDF) et renvoie son texte. Il n’a besoin d’aucune connexion. Les adresses de réseau internes, les adresses avec nom d’utilisateur ou mot de passe et les ports autres que les ports web habituels sont refusés.

Vous attribuez les deux comme n’importe quel autre outil dans la section **Outils** de l’agent (voir [Attribuer des outils](/docs/agenten#tools)). L’inspecteur les signale par le badge **Internet**. Un bon duo : l’agent cherche avec `search_web` et lit les résultats les plus prometteurs avec `fetch_web_page` avant de se fier à plus qu’un extrait.

## Choisir un service de recherche {#suchdienst}
<!-- keywords: service de recherche, fournisseur, ddgs, brave, tavily, mojeek, searxng, fournisseur de test, clé d’api -->

Dans *Outils → Connexions → Configurer un service de recherche*, vous configurez un service de recherche. Nodestro n’en choisit aucun pour vous : chaque carte dit honnêtement ce dont le service a besoin et à quoi vous attendre.

| Service | Clé | Remarques |
|---|---|---|
| DDGS | non | Gratuit et sans aucune garantie. Il utilise d’autres moteurs de recherche, qui peuvent le bloquer ou changer à tout moment. Indisponible sur un serveur Nodestro. |
| Brave Search | oui | Les résultats ne doivent pas être enregistrés. Environ 5 USD pour 1000 requêtes. |
| Tavily | oui | Facturé selon l’offre : indiquez votre prix par requête. |
| Mojeek | oui | Exploité en Europe. Facturé selon l’offre : indiquez votre prix par requête. |
| SearXNG | facultative | Votre propre serveur : indiquez son adresse. |
| Fournisseur de test | quelconque | Fournisseur de test hors ligne pour essayer : résultats inventés, pas d’internet. |

Vérifiez vous-même les conditions et les prix d’un service avant de l’utiliser ; Nodestro n’en recommande aucun. Attribuez ensuite la connexion à `search_web` dans l’inspecteur de l’agent.

## Coûts et limites {#kosten}
<!-- keywords: coûts, prix par requête, budget, appels, résultats, domaines autorisés, domaines bloqués, avancé -->

Une recherche payante coûte de l’argent à chaque requête. Nodestro inscrit chaque requête au prix du service dans les coûts de l’exécution et vérifie le budget de l’exécution avant une requête payante. Pour Brave, le prix publié s’applique, sauf si la connexion en indique un autre ; Tavily et Mojeek ont besoin du prix par requête dans la connexion, sinon `search_web` n’est pas appelé. DDGS, SearXNG et le fournisseur de test ne coûtent rien dans Nodestro.

Sous **Avancé**, en dessous de chaque outil web dans l’inspecteur de l’agent, vous limitez ce que l’agent peut faire : le nombre maximal de résultats par recherche, la région, la langue et la période des recherches, les **domaines autorisés** et **bloqués**, le nombre maximal de caractères par page et le nombre maximal d’appels par exécution. Les champs vides gardent les valeurs par défaut ; `search_web` autorise au plus 10 appels par exécution, `fetch_web_page` au plus 20.

## Mode hors ligne et serveurs {#offline-server}
<!-- keywords: hors ligne, mode hors ligne strict, serveur, profil serveur, opérateur, indisponible -->

Les deux outils ont besoin d’internet. En mode hors ligne strict, la vérification avant une exécution les refuse. Sur un serveur Nodestro, ils ne sont pas proposés : la vérification les signale et chaque appel est refusé. L’opérateur du serveur peut les activer avec `NODESTRO_WEB_TOOLS_SERVER=1`. DDGS n’est jamais proposé sur un serveur.

## Sources d’une exécution {#quellen}
<!-- keywords: sources, sources web, registre des sources, S1, sources citées, lue, résultat seul, résultat structuré -->

Chaque résultat de recherche et chaque page que voient les outils web sont consignés dans l’exécution avec un identifiant (`S1`, `S2` …). La vue détaillée de l’exécution les affiche sous **Sources web** avec titre, domaine, heure et statut : **Lue** si la page a été lue, **Résultat seul** si elle est seulement apparue dans une recherche. Les liens s’ouvrent dans un nouvel onglet. Seuls les adresses et les titres sont conservés, jamais le texte de la page, et uniquement dans cette exécution.

Vous pouvez exiger qu’un agent cite ses sources : dans un résultat structuré, activez **Cite des sources web** pour un champ texte ou liste (voir [Format de sortie](/docs/agenten#ausgabeformat)). Chaque valeur doit alors désigner une source consignée par son identifiant ou son adresse. Si l’agent cite une source qu’il n’a pas trouvée, il reçoit une correction ; s’il recommence, l’étape échoue, afin qu’aucune source inventée ne soit jamais livrée.

## L’exemple Recherche web {#beispiel}
<!-- keywords: recherche web, exemple, agent de recherche, réponse sourcée, liste des sources, consultation, approfondie -->

L’exemple **Recherche web avec sources** parmi les [workflows d’exemple](/docs/beispiele) répond à une question avec des sources. Lorsque vous le copiez, choisissez l’un de vos services de recherche sous **Services pour les outils**, ou configurez-en un avec **Configurer le service de recherche** ; rien n’est présélectionné. Sans choix, la copie est quand même créée, et la vérification avant l’exécution vous rappelle de choisir une connexion dans l’agent.

Le résultat contient la réponse, les constats et les contradictions avec des identifiants de source comme `[S1]`, les lacunes, la **liste des sources** et la **période de consultation**. La liste des sources et la période de consultation sont écrites par Nodestro après l’étape à partir des sources enregistrées, et non par le modèle. Dans l’agent, vous le réglez pour chaque champ texte sous **Sources web** : **Cite des sources web**, **Source pour chaque affirmation [S1]**, **Liste des sources (automatique)** ou **Période de consultation (automatique)**. Avec **Recherche approfondie** dans le formulaire de départ, l’agent cherche et lit davantage (8 recherches et 12 pages au lieu de 3 et 4).

## Le texte des pages est une donnée {#sicherheit}
<!-- keywords: sécurité, injection de prompt, manipulation, contenu externe, non fiable -->

Les résultats de recherche et les textes des pages viennent d’inconnus. Nodestro les signale au modèle comme contenu externe : des données, pas des instructions. Les pages peuvent pourtant contenir des tentatives de manipuler l’agent, par exemple un texte caché qui lui demande d’ignorer sa tâche ou d’envoyer des données ailleurs. Ne donnez aux agents dotés d’outils web que les autres outils dont ils ont besoin, utilisez les [approbations](/docs/tools#freigabe) pour les outils qui modifient quelque chose et vérifiez les résultats fondés sur des sources web avant d’agir.

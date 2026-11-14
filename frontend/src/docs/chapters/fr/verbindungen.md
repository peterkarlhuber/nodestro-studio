# Connexions de service

Certains outils intégrés joignent un service externe, par exemple une recherche web, un serveur de messagerie ou un webhook. Ce dont ils ont besoin pour cela (l’adresse, des paramètres et un secret) est une **connexion de service**. Ce chapitre explique les fiches des outils, comment configurer une connexion et comment un agent l’utilise.

## Fiches des outils {#tool-steckbrief}
<!-- keywords: fiche, tool spec, catégorie, réseau, hors ligne, type de connexion, délai, limite d’appels, filtre -->

Chaque outil intégré a une **fiche** : sa catégorie (*Calcul*, *Données*, *Fichiers*, *Internet*, *Communications*), s’il a besoin d’Internet, s’il **fonctionne hors ligne**, quel type de connexion il exige, son délai maximal et combien de fois un agent peut l’appeler dans une exécution. La page [Outils](/tools) affiche ces informations sous forme de badges et vous permet de filtrer les outils intégrés selon elles.

Un appel qui dure plus longtemps que le délai maximal s’arrête avec une erreur ; quand un outil atteint sa limite d’appels, l’agent reçoit une erreur pour les appels suivants et répond avec ce qu’il a. En mode hors ligne strict, les outils qui ont besoin d’Internet sont refusés avant le démarrage. Les outils intégrés de Nodestro sont décrits dans [Outils intégrés](/docs/tools#eingebaut).

## Configurer une connexion {#einrichten}
<!-- keywords: connexion, service, recherche web, smtp, serveur de messagerie, webhook, paramètres, fournisseur -->

Vous gérez les connexions sous *Outils → Connexions*. **Ajouter une connexion** demande le type (recherche web, serveur de messagerie ou webhook), le fournisseur quand le type en propose plusieurs, un nom et les paramètres du type, comme l’adresse du serveur et l’adresse de l’expéditeur d’un serveur de messagerie. Les adresses doivent utiliser `https` (sur votre propre ordinateur, `http` vers un serveur local est autorisé) et ne doivent contenir aucun mot de passe ; les adresses internes sont refusées.

Chaque connexion indique les hôtes qu’elle peut joindre, déduits de ses paramètres, et les agents qui l’utilisent. Seuls les administrateurs peuvent ajouter, modifier, vérifier ou supprimer des connexions ; les autres les voient en lecture seule. Nodestro enregistre qui a modifié quelle connexion, jamais les valeurs.

Pour une recherche web, **Configurer un service de recherche** propose les services de recherche avec des remarques honnêtes sur la clé, les coûts et les limites ; voir [Recherche web et lecture de pages web](/docs/websuche).

Une connexion que des agents utilisent encore n’est pas supprimée tout de suite : Nodestro nomme les agents et propose **Supprimer quand même**. Leur vérification signale ensuite la connexion manquante.

## Le secret {#geheimnis}
<!-- keywords: secret, clé d’api, mot de passe, clé de signature, coffre, chiffré, session -->

Une connexion a au plus un secret : une clé d’API, un mot de passe ou une clé de signature. Vous le définissez dans les détails de la connexion après l’enregistrement. Le secret est **en écriture seule** : Nodestro ne l’affiche plus jamais, ni dans l’interface, ni dans les exports, ni dans les journaux. Vous voyez seulement **Secret défini** ou **Aucun secret** et l’endroit où il est conservé.

Les secrets sont enregistrés chiffrés, comme les jetons d’accès des services connectés : sur le poste de travail avec une clé du trousseau du système d’exploitation, sur un serveur avec la clé du serveur, séparément pour chaque locataire. Sans stockage sécurisé de clés, le secret est conservé **pour cette session uniquement** et doit être saisi de nouveau après un redémarrage. **Remplacer le secret** l’écrase, **Retirer le secret** le supprime.

## Vérifier une connexion {#pruefen}
<!-- keywords: vérifier, statut, fonctionne, échec de la vérification, code d’erreur -->

**Vérifier la connexion** teste la connexion et affiche le résultat : *Fonctionne*, *Échec de la vérification* ou *Non vérifiée*, avec l’heure de la vérification et, en cas d’échec, le code d’erreur. Pour l’instant, la vérification des serveurs de messagerie et des webhooks contrôle seulement les paramètres et ne contacte pas encore le service. Une modification des paramètres, du fournisseur ou du secret remet le statut à *Non vérifiée*. Une connexion qui n’a pas encore été vérifiée avec succès apparaît comme avertissement dans la vérification avant une exécution.

## Utiliser une connexion dans un agent {#zuweisen}
<!-- keywords: agent, inspecteur, paramètres de l’outil, choix de la connexion -->

Quand vous attribuez un outil intégré qui exige une connexion, l’inspecteur de l’agent affiche sous les outils un choix avec les connexions du bon type (voir [Attribuer des outils](/docs/agenten#tools)). Sans connexion choisie, la vérification de l’agent signale une erreur. Le modèle ne voit jamais la connexion, ses paramètres ni son secret ; il voit seulement l’outil.

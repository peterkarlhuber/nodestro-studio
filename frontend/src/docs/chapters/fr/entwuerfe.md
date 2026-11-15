# Brouillons d’e-mail et de webhook

Les agents peuvent **préparer** un e-mail ou les données d’un appel de webhook, mais ils ne peuvent pas les envoyer. Le brouillon arrive dans les fichiers de résultat de l’exécution ; vous le vérifiez et l’envoyez vous-même. Ce chapitre explique les deux outils de brouillon, où vous trouvez leurs brouillons, comment vérifier une connexion par un envoi de test et pourquoi Nodestro n’envoie rien de lui-même pour l’instant.

## Vue d’ensemble {#ueberblick}
<!-- keywords: brouillon, brouillon d’e-mail, brouillon de webhook, draft_email, draft_webhook, n’envoie rien, communication, hors ligne -->

Nodestro fournit deux outils intégrés de la catégorie *Communications* :

- **Brouillon d’e-mail** (`draft_email`) écrit un e-mail sous forme de fichier `.eml`.
- **Brouillon de webhook** (`draft_webhook`) écrit les données JSON d’un appel de webhook sous forme de fichier `.json`.

Tous deux portent le badge **N’envoie rien** sur la page [Outils](/tools) et dans le sélecteur d’outils de l’agent. Ils n’ont besoin ni d’Internet ni d’une connexion, fonctionnent hors ligne et écrivent au maximum **10 brouillons par exécution**. Attribuez-les à un agent comme tout autre outil (voir [Attribuer des outils](/docs/agenten#tools)) et indiquez à l’agent, dans sa tâche, quand écrire un brouillon, par exemple « Préparez un rappel de paiement au client pour chaque facture en retard ».

## Brouillons d’e-mail {#e-mail}
<!-- keywords: draft_email, eml, destinataires, à, cc, objet, html, pièces jointes, adresse de l’expéditeur, from_address, messagerie -->

Un brouillon d’e-mail contient les destinataires (*À* et *Cc*, 50 au maximum au total), un objet sur une ligne (200 caractères au maximum), le texte et, si vous le souhaitez, une version HTML. Dans la version HTML, Nodestro supprime les scripts, les styles, les images, les formulaires et tout le reste, sauf le texte, les titres, les listes, les tableaux et les liens.

Les **pièces jointes** proviennent uniquement de l’exécution elle-même : des fichiers avec lesquels elle a démarré et des fichiers de résultat qu’elle a écrits jusque-là. Un brouillon a au maximum 10 pièces jointes et pèse au maximum 10 Mo avec elles.

Vous définissez l’**adresse de l’expéditeur** dans l’agent : une fois l’outil attribué, les outils de l’agent affichent une zone dépliable avec le champ *Adresse de l’expéditeur*. Le modèle ne la voit pas et ne la modifie pas. Si le champ reste vide, votre messagerie indique l’expéditeur.

## Brouillons de webhook {#webhook}
<!-- keywords: draft_webhook, json, données, payload, json schema, schéma, payload_schema, vérification -->

Un brouillon de webhook contient les données JSON destinées à un webhook plus tard : un objet ou une liste, 256 Ko au maximum.

Dans la zone dépliable de l’outil dans l’agent, vous pouvez enregistrer un **schéma des données** sous forme d’objet JSON (JSON Schema). L’outil n’écrit alors que des données qui y correspondent ; sinon, l’agent reçoit une erreur indiquant les endroits qui ne correspondent pas. Nodestro vérifie ces mots-clés : `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` et `maxItems`. Un schéma avec d’autres mots-clés est refusé, afin qu’il ne paraisse jamais plus strict qu’il n’est vérifié.

## Brouillons dans une exécution {#im-lauf}
<!-- keywords: fichiers de résultat, carte de brouillon, télécharger, télécharger le .eml, ouvrir dans la messagerie, non envoyé, aperçu -->

Les brouillons apparaissent dans la vue détaillée de l’exécution, sous **Fichiers de résultat**, comme une carte à part marquée **Non envoyé** (voir [Fichiers de résultat](/docs/dateien#ergebnisdateien)). La carte d’un brouillon d’e-mail affiche l’expéditeur, les destinataires, Cc, l’objet, la présence d’une version HTML, les pièces jointes avec leur taille et la taille du message entier. Nodestro n’affiche pas le texte de l’e-mail ; ouvrez le fichier pour le lire.

- **Télécharger le .eml** enregistre le brouillon.
- **Ouvrir dans la messagerie** télécharge le même fichier. Ouvrez-le avec votre logiciel de messagerie, par exemple par un double-clic. Beaucoup de logiciels l’ouvrent comme un nouveau message que vous pouvez vérifier, modifier et envoyer ; d’autres l’affichent comme un message reçu, que vous pouvez transférer ou copier.

La carte d’un brouillon de webhook affiche la taille et indique si les données ont été vérifiées selon un schéma ; **Télécharger le .json** les enregistre.

## Envoi de test d’une connexion {#testversand}
<!-- keywords: envoyer un test, envoi de test, adresse de test, test_address, serveur de messagerie, smtp, webhook, limite, cinq par heure, confirmation, vérifier -->

Vous vérifiez si une connexion à un serveur de messagerie ou à un webhook fonctionne vraiment sous *Outils → Connexions* (voir [Connexions de service](/docs/verbindungen#pruefen)). **Vérifier la connexion** contacte le service : avec un serveur de messagerie, Nodestro se connecte de manière chiffrée puis se déconnecte ; avec un webhook, il interroge l’adresse sans envoyer de données.

**Envoyer un test** va plus loin et envoie un message de test fixe :

- **Serveur de messagerie :** un court e-mail de test à l’**adresse de test** de la connexion et à aucune autre. Pour cela, saisissez votre propre adresse comme *Adresse de test* dans les paramètres de la connexion.
- **Webhook :** un petit appel de test signé à l’adresse du webhook, avec la méthode de la connexion. Toute réponse avec un statut 2xx compte comme un succès.

Avant tout envoi, une boîte de dialogue de confirmation indique exactement où va le test. Vous l’envoyez vous-même, et Nodestro enregistre chaque tentative à votre nom dans les modifications de la connexion. Seuls les administrateurs peuvent tester. Chaque connexion permet **au maximum 5 envois de test par heure**, et l’ensemble des connexions au maximum 20 par heure. Sur un serveur Nodestro, la vérification et le test n’atteignent un serveur de messagerie que par les ports 25, 465, 587 et 2525.

## Pourquoi rien n’est envoyé automatiquement {#kein-versand}
<!-- keywords: pas d’envoi, envoyer automatiquement, validation par appel, sécurité, version ultérieure, l’agent n’envoie pas -->

Un e-mail ou un appel de webhook ne peut pas être repris. C’est pourquoi, dans cette version, aucun agent ni aucun workflow ne peut envoyer quoi que ce soit de lui-même : les outils de brouillon n’ont aucun accès au réseau, et l’envoi de test n’est possible que depuis l’interface, par une personne, jamais depuis une exécution.

Une version ultérieure ajoutera l’envoi depuis les workflows, avec une **validation pour chaque appel** : une personne voit les destinataires et le contenu et décide avant que quoi que ce soit ne parte. D’ici là, les brouillons sont la voie sûre : l’agent rédige pour vous, l’envoi reste entre vos mains.

# Notifications

Nodestro vous prévient sur la **cloche** de la barre supérieure quand quelque chose demande votre attention : une exécution a échoué, une étape attend votre validation ou un agent vous a écrit un message. Les notifications restent dans Nodestro ; rien n’est envoyé par e-mail.

## Ce qui notifie {#ueberblick}
<!-- keywords: notification, cloche, événement, exécution en échec, validation, décision de budget, contrôle qualité, exécution terminée, boîte de réception -->

Une notification est créée pour ces événements d’une exécution :

- **Une exécution échoue** : l’exécution s’est terminée par une erreur.
- **Une étape attend une validation** : une étape de validation attend la décision d’une personne.
- **Une exécution attend une décision de budget** : le budget de l’exécution est épuisé et quelqu’un doit l’augmenter ou terminer l’exécution (voir [Décisions de budget pendant une exécution](/docs/workflows#budget-freigabe)).
- **Un contrôle qualité échoue** : un résultat n’a pas réussi son contrôle, par exemple celui d’un juge (voir [Contrôle qualité](/docs/agenten#qualitaet)).
- **Une exécution se termine** : chaque exécution terminée, y compris celles réussies.

En outre, un agent peut vous écrire un court message avec l’outil **Message pour moi** (voir plus bas).

## Règles par workflow {#regeln}
<!-- keywords: règles de notification, réglages du workflow, événements, par défaut, exécutions en échec, validations, désactiver -->

Chaque workflow décide lesquels de ses événements notifient. Ouvrez le workflow dans l’éditeur, cliquez sur un endroit vide du canevas pour qu’aucune étape ne soit sélectionnée, puis trouvez la section **Notifications** dans les réglages du workflow (voir [Réglages du workflow](/docs/workflows#einstellungen)). Cochez les événements voulus ; les règles sont enregistrées avec le workflow, comme son budget et ses limites.

Par défaut, un workflow notifie les **exécutions en échec** et les **étapes en attente de validation**. Les workflows enregistrés avant l’arrivée des notifications reçoivent aussi ce réglage par défaut. Décochez tous les événements pour désactiver les notifications d’un workflow. Notifier chaque exécution terminée est utile pour des exécutions rares et importantes ; pour des exécutions fréquentes, cela en fait vite beaucoup.

## Qui est notifié {#empfaenger}
<!-- keywords: destinataires, membres, initiateur, accès, qui est notifié, personne qui a lancé -->

Dans la même section, vous choisissez qui reçoit les notifications :

- **Toutes les personnes ayant accès** : toutes les personnes autorisées à voir le workflow. Dans l’application de bureau, c’est vous.
- **Seulement la personne qui a lancé l’exécution** : les autres personnes ayant accès ne sont pas notifiées.

## La cloche {#glocke}
<!-- keywords: cloche, non lu, compteur, pastille, marquer comme lue, tout marquer comme lu, ouvrir l’exécution, charger plus, clavier, échap -->

Le nombre sur la cloche compte vos notifications non lues. Cliquez sur la cloche (ou placez-y le focus et appuyez sur Entrée) pour ouvrir la liste, les plus récentes en premier. Chaque entrée indique ce qui s’est passé, le workflow et quand. Les entrées non lues sont mises en évidence.

- **Ouvrir l’exécution** ouvre la vue détaillée de l’exécution et marque l’entrée comme lue (voir [La vue détaillée](/docs/ausfuehrungen#details)).
- **Marquer comme lue** (la coche) marque une seule entrée, **Tout marquer comme lu** toutes.
- **Charger plus** affiche des notifications plus anciennes.
- Échap ferme la liste et revient à la cloche.

Nodestro lit le nombre de notifications non lues environ une fois par minute tant que la fenêtre est visible, et la liste complète chaque fois que vous l’ouvrez. Les lecteurs d’écran annoncent les nouvelles notifications sans interrompre.

## Messages des agents {#agenten-nachrichten}
<!-- keywords: notify_user, message pour moi, message d’agent, outil, niveau, titre, trois messages, texte brut, d’un agent -->

L’outil intégré **Message pour moi** (`notify_user`) permet à un agent de vous envoyer un court message avec un titre, le texte et un niveau (info, succès, avertissement ou erreur). Attribuez-le à un agent comme tout autre outil (voir [Attribuer des outils](/docs/agenten#tools)) et indiquez à l’agent dans sa tâche quand l’utiliser, par exemple « Envoyez-moi un message si vous trouvez un contrat avec un préavis de moins de 30 jours ».

- Un agent peut envoyer **au plus 3 messages par exécution**. Les tentatives suivantes sont refusées, et l’agent en est informé.
- Le message s’affiche en **texte brut** : sans mise en forme, sans liens cliquables. Il est clairement marqué **D’un agent**, car un modèle l’a écrit. Traitez-le comme toute autre sortie d’un modèle.
- L’outil n’envoie rien hors de Nodestro et fonctionne hors ligne.

## Conservation et confidentialité {#aufbewahrung}
<!-- keywords: conservation, 90 jours, suppression, e-mail, webhook, confidentialité, serveur, boîte de la plateforme, dans nodestro -->

Les notifications sont conservées **90 jours**, puis supprimées, lues ou non.

Rien ne quitte Nodestro : pas d’e-mail, pas de webhook, pas de notification push. L’envoi de notifications vers d’autres destinations est prévu pour une version ultérieure.

Sur un serveur Nodestro relié à la boîte de réception de la plateforme, la cloche affiche cette boîte au lieu de celle de Nodestro. Ses notifications peuvent arriver en anglais et avec leur propre formulation ; les règles par workflow s’appliquent de la même façon.

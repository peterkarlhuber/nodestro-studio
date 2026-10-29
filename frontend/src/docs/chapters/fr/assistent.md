# Nodestro Assistant

Nodestro Assistant est un chat qui vous aide partout dans Nodestro. Il répond aux questions d’utilisation à partir de cette documentation, examine les workflows, agents, outils, mémoires, connaissances et exécutions que vous lui montrez explicitement et, sur demande, prépare un transfert vers l’architecte de workflows, la conception d’agents ou la création d’outils. Il ne modifie jamais rien lui-même.

## Vue d’ensemble {#ueberblick}
<!-- keywords: assistant, chat, ouvrir, panneau, barre latérale, raccourci, ctrl j, large, aide -->

Ouvrez l’assistant avec **Assistant** en haut à droite de l’en-tête ou avec **Ctrl+J** (macOS : **⌘J**). Il apparaît comme un panneau à droite ; le même bouton ou **Fermer** le masque à nouveau. **Plus large** donne plus de place au chat ; sur les petits écrans, il se place au-dessus de la page.

Le chat reste en place quand vous changez de page, et même après un rechargement. Les réponses s’affichent en direct ; le Markdown avec listes, tableaux et blocs de code est mis en forme. Pendant la rédaction d’une réponse, vous voyez ce que fait réellement l’assistant : rechercher dans la documentation, lire des sections, traiter les pièces jointes, rédiger la réponse ou préparer un transfert.

L’assistant utilise le **modèle des assistants** défini dans les [réglages](/docs/einstellungen#modelle) et l’accès à son fournisseur. Si ce fournisseur n’est pas configuré, vous pouvez ouvrir le chat mais pas envoyer de question.

## Questions sur la documentation {#fragen}
<!-- keywords: question, documentation, sources, citation, lien, inventé, non documenté, comment -->

L’assistant répond à des questions comme « Comment tester mon agent ? » ou « Quelle est la différence entre connaissances et mémoire ? » à partir de cette documentation intégrée. Il recherche les sections pertinentes, les lit et les cite par des liens dans sa réponse. Sous la réponse, les sections lues sont listées comme **Sources** ; un clic les ouvre.

La documentation est sa seule source de connaissances sur Nodestro. S’il n’y trouve pas quelque chose, il le dit explicitement au lieu d’inventer une fonction. Les connaissances générales, par exemple sur la rédaction de prompts, sont signalées comme telles.

## Joindre des objets {#anhaenge}
<!-- keywords: joindre, pièce jointe, contexte, trombone, en parler, workflow, agent, outil, mémoire, connaissances, exécution, trace -->

Pour que l’assistant puisse examiner un objet précis, vous le joignez. Il y a deux façons :

- **En parler à l’assistant** dans la vue elle-même : dans l’éditeur de workflows, dans l’inspecteur d’agent, dans la bibliothèque d’agents, sur un outil, sur une exécution, dans un espace mémoire et sur un fichier de connaissances.
- Le **trombone** du champ de saisie ouvre une sélection de tous les workflows, modèles d’agents, outils, espaces mémoire, fichiers de connaissances et exécutions.

Ce que reçoit l’assistant dépend du type :

| Type | Contenu |
| --- | --- |
| Workflow | agents, connexions, ordre d’exécution, paramètres et résultat du [contrôle avant le lancement](/docs/workflows#pruefung) |
| Agent | la configuration complète avec outils, connaissances et remarques de configuration |
| Outil | code, tests, schéma d’entrée, bibliothèques Python avec leurs autorisations, et où il est utilisé |
| Mémoire | la liste des fichiers ; le contenu uniquement des fichiers que vous sélectionnez explicitement |
| Connaissances | nom, description et type ; le texte seulement si vous activez **Envoyer le contenu** |
| Exécution | statut, entrée, résultats, erreurs, appels d’outils, tokens et coût de chaque agent |

Vous pouvez joindre plusieurs objets à la fois et retirer chacun avec **×**. Une pièce jointe reste active jusqu’à ce que vous la retiriez et accompagne chaque message suivant. Les pièces jointes sont toujours visibles au-dessus du champ de saisie.

## Suggestions de contexte {#vorschlaege}
<!-- keywords: suggestion, suggéré, workflow actuel, automatique, confirmer, ignorer -->

Quand l’assistant est ouvert, l’objet de la vue actuelle est suggéré comme contexte, par exemple le workflow de l’éditeur ou l’exécution ouverte. Les suggestions ont une bordure en pointillés et la mention **Suggestion** ; les objets joints ont une bordure continue.

Une suggestion n’est pas envoyée. Seul **Ajouter** en fait une pièce jointe ; **Ignorer** la masque pour ce chat. Les suggestions viennent de la vue ouverte, sans aucun appel à l’IA.

## Versions et modifications non enregistrées {#versionen}
<!-- keywords: version, brouillon, non enregistré, enregistré, modifié, actualiser le contexte, obsolète, supprimé -->

Quand vous joignez un objet, Nodestro enregistre son état. Chaque message retient exactement les états avec lesquels il a été envoyé ; vous les voyez sous votre message comme **Envoyé avec**. Un clic montre ce que l’assistant a réellement reçu.

Si un objet joint change ensuite, la pièce jointe est marquée **modifié**. **Actualiser le contexte** utilise le nouvel état pour les messages suivants. Les messages et réponses précédents restent inchangés et gardent leur état d’alors. Si un objet est supprimé, la pièce jointe indique **n’existe plus** ; le chat continue de fonctionner.

Si le workflow de l’éditeur contient des modifications non enregistrées, c’est vous qui décidez : **Version enregistrée** envoie le dernier état enregistré, **Brouillon non enregistré** l’état actuel de l’éditeur. Un brouillon est signalé dans le chat par **Brouillon**. Si vous continuez à modifier ensuite, il est lui aussi marqué comme modifié.

## Analyses {#analyse}
<!-- keywords: analyse, améliorer, vérifier, trouver des erreurs, optimiser, réduire les coûts, exécuté, testé -->

Avec des objets joints, l’assistant peut par exemple chercher les points faibles d’un workflow, améliorer un prompt système, expliquer pourquoi une exécution a échoué ou signaler des tests manquants pour un outil.

Il travaille uniquement avec les données que vous avez jointes. Il n’exécute et ne teste rien, et il ne le prétend pas. C’est à vous de vérifier si une amélioration fonctionne, par exemple avec le [test d’agent](/docs/agenten#agent-testen) ou une nouvelle exécution.

## Transfert vers d’autres fonctions {#uebergabe}
<!-- keywords: transfert, appliquer, architecte, mettre en œuvre, créer un agent, créer un outil, appliquer la proposition -->

Si vous demandez explicitement la mise en œuvre d’une amélioration, l’assistant prépare un transfert. Il apparaît sous forme de carte dans la réponse. Le bouton de la carte ouvre la fonction existante correspondante, déjà remplie avec la description :

- **[Architecte de workflows](/docs/ki-architekt)** : retravailler un workflow joint ou en concevoir un nouveau.
- **[Conception d’agents](/docs/agenten#ki-entwurf)** : décrire un nouvel agent pour un workflow joint.
- **Création d’outils** sous *Outils → Créer avec l’IA* : faire écrire un nouvel outil par l’agent développeur.

Rien n’y démarre tant que vous ne le lancez pas, et vous vérifiez le résultat comme d’habitude avant que quoi que ce soit change. L’assistant lui-même ne modifie pas de workflows, n’exécute pas d’outils et n’applique rien sans votre confirmation.

## Gérer les chats {#verlauf}
<!-- keywords: historique, chats, conversation, nouveau chat, renommer, supprimer, titre, reprendre -->

**Nouveau chat** commence une nouvelle conversation, **Historique** affiche toutes les précédentes. Vous y ouvrez un chat pour le reprendre, le renommez ou le supprimez. Nodestro crée le titre à partir de votre première question, sans appel à l’IA.

Les chats sont stockés localement dans la base de données Nodestro et font partie de la [sauvegarde et restauration](/docs/einstellungen#backup). Ils ne sont jamais traduits ; un chat reste dans la langue dans laquelle il a été mené.

## Confidentialité et sécurité {#datenschutz}
<!-- keywords: confidentialité, sécurité, clé api, secret, mot de passe, masqué, envoyé, prompt injection, instructions -->

Seuls ce que vous écrivez, ce que vous avez joint et les sections de documentation lues par l’assistant sont envoyés au modèle. L’objet ouvert n’est jamais envoyé automatiquement.

Les clés API, mots de passe, tokens et valeurs similaires sont remplacés par des espaces réservés avant l’envoi, y compris votre clé API enregistrée. Une remarque sur la pièce jointe indique quand quelque chose a été remplacé. Pour voir exactement ce qui a été envoyé, cliquez sur une pièce jointe ou sur **Envoyé avec**.

Les objets très volumineux sont raccourcis ; la pièce jointe est alors marquée **partiel**, et l’assistant sait qu’il n’en a vu qu’une partie. Les instructions contenues dans un contenu joint, par exemple dans un fichier de connaissances ou une sortie d’outil, sont traitées par l’assistant comme des données, et non comme des instructions qui lui sont adressées.

## Coûts {#kosten}
<!-- keywords: coût, tokens, utilisation, prix, coût du chat, facturé -->

Chaque réponse correspond à une ou plusieurs requêtes au modèle. Sous chaque réponse, vous voyez ses tokens et son coût estimé, et l’en-tête du chat affiche le total du chat. Sur la [page d’utilisation](/docs/nutzung), toutes les requêtes apparaissent sous l’origine **Nodestro Assistant**, chacune exactement une fois.

Pour une réponse annulée, une partie du coût a déjà été engagée ; elle est estimée et marquée **estimé**.

## Annulation et erreurs {#fehler}
<!-- keywords: annuler, arrêter, erreur, réessayer, répéter, clé invalide, modèle indisponible, connexion -->

**Arrêter** annule une réponse en cours ; ce qui a déjà été écrit reste affiché. Si une réponse échoue, l’assistant en indique la raison, par exemple une clé API manquante ou invalide, un modèle indisponible, une connexion interrompue ou trop de contexte. **Réessayer** relance la dernière réponse.

Le chat n’est jamais perdu. Si Nodestro est arrêté pendant la rédaction d’une réponse, celle-ci est marquée comme interrompue après le redémarrage.

## Langue {#sprache}
<!-- keywords: langue, français, anglais, langue de réponse, traduire -->

L’assistant répond dans la langue de l’interface (voir [Langue](/docs/einstellungen#sprache)), sauf si vous en demandez explicitement une autre. Il lit la documentation dans cette même langue. Les identifiants techniques, comme les noms d’outils, les noms de champs et le code, restent en anglais.

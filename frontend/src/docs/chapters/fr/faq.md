# Dépannage et FAQ

Vous trouverez ici des solutions aux messages courants et des réponses aux questions fréquentes.

## Erreurs fréquentes {#haeufige-fehler}
<!-- keywords: erreurs, problème, solution, message, dépannage, ne fonctionne pas -->

| Message ou symptôme | Cause | Solution |
|---|---|---|
| « Aucune clé API pour … » | Le fournisseur du modèle n’est pas configuré. | Saisissez la clé sous *Réglages → Fournisseurs d’IA* ou définissez la variable d’environnement du fournisseur, par exemple `ANTHROPIC_API_KEY`. |
| « Lancer le workflow » est grisé | Le workflow présente des problèmes ou une exécution est en cours. | Survolez le bouton ; les problèmes figurent dans l’inspecteur quand rien n’est sélectionné. |
| « Le workflow contient une boucle … » | Une connexion revient en arrière. | Supprimez la connexion qui revient en arrière. |
| « Outils inconnus : … » | Un outil attribué a été supprimé ou manque après un import. | Retirez l’outil dans l’inspecteur ou recréez-le dans la bibliothèque d’outils. |
| « … n’accepte pas d’outil imposé … » | Le modèle n’autorise pas d’outil imposé. | Réglez tool choice sur *Automatique*. |
| « La réflexion ne peut pas être désactivée pour … » | Le modèle n’autorise pas la réflexion *Désactivé*. | Réglez la réflexion sur *Valeur du modèle* et baissez l’effort. |
| « 'Seulement entre les appels d’outils' n’est pris en charge que par … » | Seul Sonnet 5.5 jusqu’à l’effort *Élevé* le permet. | Adaptez le modèle ou l’effort. |
| « Ce mode d’affichage de la réflexion ne correspond pas au réglage de réflexion » | *Afficher la réflexion* ne va pas avec une réflexion *Désactivé* ou *Seulement entre les appels d’outils*. | Modifiez l’un des deux réglages. |
| « Nom de champ non valide … » | Un nom de champ du format de sortie contient des caractères spéciaux ou commence par un chiffre. | N’utilisez que des lettres, des chiffres et `_`. |
| « Les citations ne peuvent pas être combinées avec un format de sortie structuré » | Les deux options sont activées. | Désactivez l’une d’elles. |
| « Les messages d’exemple doivent … » | Les exemples n’alternent pas correctement. | Commencez par l’utilisateur, alternez, terminez par l’assistant. |
| « Une mémoire persistante nécessite un espace mémoire » | Mémoire *Persistante* sans espace. | Choisissez ou créez un espace. |
| Erreurs Docker avec les outils | Docker est choisi mais ne tourne pas. | Démarrez Docker ou choisissez le bac à sable *Processus Python*. |
| Un agent a été *ignoré* | Un prédécesseur a échoué. | Examinez le premier agent en rouge dans le déroulement et corrigez-le. |
| Le résultat contient « {{Nom}} » tel quel | L’espace réservé ne correspond à aucun prédécesseur direct (par exemple après un renommage). | Réinsérez l’espace réservé avec les boutons sous la tâche. |
| Import de trace : « Il s’agit d’un workflow exporté … » | Le fichier est un export de workflow. | Ouvrez-le dans *Workflows → Importer*. |

Les messages s’affichent dans la langue de l’interface ; **Détails techniques** montre le texte d’origine du serveur. Les erreurs qui ne surviennent que pendant une exécution sont expliquées dans [Interpréter les erreurs](/docs/ausfuehrungen#fehler).

## Questions fréquentes {#fragen}
<!-- keywords: faq, questions, réponses, comment, pourquoi -->

**Modifier des workflows coûte-t-il quelque chose ?**
Non. Les coûts ne surviennent qu’avec les exécutions et les assistants IA (concevoir des agents, créer des outils, proposer une mémoire). La vérification dans l’éditeur, la recherche dans les connaissances et *Essayer* un outil sont gratuits.

**Pourquoi l’estimation des coûts diffère-t-elle de ma facture ?**
Nodestro calcule avec les prix catalogue. Remises, taxes, autres plateformes ou conditions particulières ne sont pas prises en compte.

**Un agent peut-il voir le résultat d’un agent qui ne le précède pas directement ?**
Non, seulement celui de ses prédécesseurs directs. Reliez-le aussi à l’agent souhaité ; l’entrée d’origine est toujours accessible avec `{{run.input}}`.

**Puis-je créer des branches selon le résultat ?**
Oui, avec une [décision](/docs/verzweigungen#entscheidung) : elle vérifie le résultat avec des règles fixes et ouvre la branche correspondante. Il n’y a pas de boucles.

**Comment transférer un workflow sur un autre ordinateur ?**
Avec *Exporter* et *Importer*. Vous devez y recréer séparément les fichiers de connaissances, les espaces mémoire et vos propres outils.

**Comment montrer une exécution à quelqu’un ?**
Avec *Exporter la trace*. L’autre personne ouvre le fichier dans *Exécutions → Importer une trace*, sans relancer le workflow.

**Ma clé d’API est-elle enregistrée dans l’export de workflow ou dans la trace ?**
Non. Les clés se trouvent uniquement dans des variables d’environnement ou dans la base de données locale et ne vont ni dans les exports ni dans les sauvegardes.

**Pourquoi un agent ne voit-il pas un fichier de connaissances ?**
Vérifiez qu’il lui est attribué dans l’inspecteur et quel mode est choisi. Les images et les PDF numérisés sont introuvables en mode *Recherche*.

**Qu’advient-il des exécutions en cours si j’arrête Nodestro ?**
Elles sont annulées. Ce qui a été enregistré jusque-là est conservé comme exécution.

**Changer de langue modifie-t-il mes agents ?**
Non. La langue ne change que l’interface. Les agents, les prompts et les résultats restent tels quels, et les agents continuent de répondre dans la langue de leur prompt. Voir [Langue](/docs/einstellungen#sprache).

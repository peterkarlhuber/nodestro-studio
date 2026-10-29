# Exécutions

Chaque exécution d’un workflow est enregistrée intégralement : entrée, résultats, tâches, appels d’outils, réflexion, mémoire, erreurs, durées, tokens et coûts. Ce chapitre explique les vues, les statuts, l’export et l’import de traces et comment interpréter les erreurs.

## Aperçu {#ueberblick}
<!-- keywords: exécutions, runs, historique, journal, trace -->

Vous voyez les exécutions à deux endroits :

- **Dans l’éditeur**, dans la *Vue d’ensemble de l’exécution* sous le canevas : la dernière exécution de ce workflow, en direct pendant qu’elle tourne.
- Sur la page **Exécutions** : toutes les exécutions de tous les workflows, avec une vue détaillée.

Les exécutions sont conservées même si vous modifiez ou supprimez le workflow ; chaque exécution enregistre le workflow tel qu’il était au lancement.

## Suivre en direct {#live}
<!-- keywords: direct, streaming, suivre, vue d’ensemble de l’exécution, progression, temps réel -->

Pendant une exécution, la **Vue d’ensemble de l’exécution** affiche :

- en haut, le nombre d’agents, de requêtes API, de tokens et les coûts estimés, mis à jour en continu,
- à gauche, tous les agents avec leur statut ; un clic affiche leurs détails à droite, *Résultat global* affiche le résultat du workflow,
- à droite, le texte que l’agent sélectionné est en train d’écrire, ses appels d’outils et (si activée) sa réflexion.

Sur le canevas, chaque agent affiche son statut, puis après l’exécution ses tokens et ses coûts. Les connexions par lesquelles des données ont circulé sont mises en évidence.

## La liste des exécutions {#liste}
<!-- keywords: liste, filtre, filtre de statut, filtre de workflow, supprimer, origine -->

La page **Exécutions** liste les exécutions, les plus récentes d’abord, avec workflow, statut, heure de lancement, durée, requêtes, tokens et coûts. Sous le nom du workflow figure l’entrée ou le message d’erreur.

- **Filtres :** par workflow, par statut et par origine (*Exécutions propres* ou *Traces importées*).
- **Supprimer :** symbole de corbeille ; les exécutions en cours ne peuvent pas être supprimées.
- **Importer une trace :** voir [Importer des traces](/docs/ausfuehrungen#trace-import).

La liste se met à jour toutes les cinq secondes.

## La vue détaillée {#details}
<!-- keywords: détails, vue détaillée, déroulement, cascade, chronologie, onglets, résultat, tâche, réflexion -->

Un clic sur une exécution ouvre la vue détaillée :

1. **Chiffres clés :** statut avec durée totale, requêtes API, tokens (répartis entre entrée, sortie, cache et réflexion) et coûts estimés.
2. **Entrée et résultat** du workflow côte à côte.
3. **Déroulement :** une barre de temps par agent, dans l’ordre de leur démarrage. Chaque barre montre quand l’agent a tourné ; des barres superposées ont tourné en parallèle. À côté figurent la durée, les tokens et le nombre d’appels d’outils.
4. **Détails de l’agent sélectionné :** durée, heures de début et de fin, tokens, requêtes et coûts, une éventuelle erreur, le résultat du contrôle qualité et les onglets :

| Onglet | Contenu |
|---|---|
| **Résultat** | La sortie de l’agent, en Markdown ou en JSON formaté. |
| **Tâche** | La tâche telle qu’elle a été envoyée à l’agent après remplacement des espaces réservés. Idéal pour trouver les problèmes de flux de données. |
| **Outils** | Chaque appel d’outil avec entrée, résultat, moment, durée et réussite. |
| **Réflexion** | Les réflexions du modèle (seulement si *Afficher la réflexion* était activé). |
| **Mémoire** | Les notes d’un agent avec mémoire *Par exécution*. |

**Ouvrir dans l’éditeur** mène au workflow ; **Annuler** arrête une exécution en cours.

L’onglet **Contexte** montre ce que l’agent a reçu dans cette exécution : prompt système, tâche avec les entrées mises en évidence, messages d’exemple, outils, connaissances, mémoire, format de sortie et contrôle qualité, toujours avec la configuration du moment du lancement. Les identifiants ne sont jamais affichés.

## Statut {#status}
<!-- keywords: statut, terminé, erreur, ignoré, annulé, en attente, en cours, file d’attente -->

| Statut | Signification |
|---|---|
| **En attente** | Le nœud attend que tous ses prédécesseurs soient terminés. |
| **En file d’attente** | L’exécution est créée et va démarrer. |
| **En cours** | En cours d’exécution. |
| **Terminé** | Terminé avec succès. |
| **Erreur** | Échec ; le message figure dans les détails. Une exécution passe en *Erreur* dès qu’un nœud échoue. |
| **Ignoré** | Le nœud ne s’est pas exécuté parce que sa branche n’a pas été choisie. Ce n’est pas une erreur. |
| **Bloqué** | Le nœud ne s’est pas exécuté parce qu’un prédécesseur a échoué ou a été annulé. |
| **En attente de validation** | Une [validation](/docs/verzweigungen#freigabe) attend la décision d’une personne. |
| **En pause** | L’exécution attend une validation et reprend après la décision. |
| **Annulé** | Arrêté avec *Annuler*, refusé, ou une trace exportée avant d’être complète. |

Une exécution échouée ou annulée peut être [reprise](/docs/verzweigungen#fortsetzen). Les exécutions issues de planifications, de lots, de séries de tests et de sous-workflows indiquent leur origine dans la liste et dans les détails.

## Le résultat d’une exécution {#ergebnis}
<!-- keywords: résultat, output, résultat global, sortie du workflow, puits -->

- S’il y a des **nœuds de résultat**, leur contenu constitue le résultat. Un nœud de résultat avec un prédécesseur reprend sa sortie ; avec plusieurs prédécesseurs, un objet avec une entrée par prédécesseur.
- S’il n’y a **aucun** nœud de résultat, les agents sans successeur constituent le résultat.
- Avec plusieurs nœuds de résultat (ou derniers agents), le résultat est un objet avec une entrée par nœud, nommée d’après le nœud.

## Annuler des exécutions {#abbrechen}
<!-- keywords: annuler, arrêter, cancel, terminer -->

**Annuler** (dans la vue d’ensemble de l’exécution ou la vue détaillée) arrête l’exécution. Les agents en cours s’arrêtent à l’étape suivante (prochain morceau de texte, prochaine requête ou prochain appel d’outil) ; les agents pas encore démarrés ne sont plus exécutés. Les tokens consommés jusque-là sont facturés et affichés.

## Exporter une trace {#trace-export}
<!-- keywords: exporter une trace, export, json, run json, partager, archiver, nettoyer, anonymiser, confidentialité, données personnelles -->

**Exporter la trace** dans la vue détaillée enregistre une exécution dans un fichier JSON : le workflow au moment du lancement, l’entrée, le statut, le résultat et, pour chaque agent, la tâche, le résultat, le texte, la réflexion, les appels d’outils avec entrées et sorties, les erreurs, le contrôle qualité, la mémoire, les horodatages, les tokens et le coût. La boîte de dialogue propose deux types :

- **Complète :** tout, tel qu’enregistré. Ne partagez le fichier que s’il ne contient rien de confidentiel.
- **Nettoyée pour le partage :** les clés API, tokens, mots de passe et clés privées sont toujours remplacés. En option, Nodestro remplace aussi les **données personnelles** (adresses e-mail, numéros de téléphone, IBAN, numéros de carte, adresses IP) et supprime des **contenus** entiers (entrées, prompts, sorties, données d’outils, mémoire) ; il reste alors le déroulement, les statuts, les modèles, les durées et les tokens.

Les passages remplacés reçoivent des marqueurs comme `[EMAIL_1]` ; les valeurs identiques reçoivent le même marqueur. Seule la copie téléchargée est nettoyée ; l’exécution enregistrée reste inchangée. La détection fonctionne par motifs et **ne garantit pas de tout trouver**, par exemple ni les noms ni les adresses. Regardez le fichier avant de le partager.

Les résultats d’outils sont limités à 20 000 caractères par appel.

## Importer des traces {#trace-import}
<!-- keywords: importer une trace, import, json, ouvrir, voir, doublon, restaurer -->

**Importer une trace** sur la page *Exécutions* rouvre des fichiers de trace exportés, plusieurs à la fois et aussi sur un autre ordinateur.

Fonctionnement de l’import :

- La trace apparaît comme une exécution à part entière, marquée **Importée**, et s’ouvre dans la vue détaillée habituelle : résultats, agents, appels d’outils, entrées et sorties, erreurs, horodatages, contrôles qualité, tokens et coûts, dans la mesure où la trace les contient.
- **Rien n’est exécuté.** Il n’y a aucune requête à un fournisseur d’IA ni aucun coût.
- Les traces importées sont **enregistrées durablement** et, comme toute exécution, peuvent être rouvertes, filtrées, exportées et supprimées.
- **Les exécutions existantes ne sont jamais écrasées :** chaque import reçoit un nouvel ID ; l’ID d’origine figure dans la vue détaillée.
- **Doublons :** si la même exécution existe déjà (l’original ou un import antérieur du même fichier), Nodestro ne crée pas de copie, mais ouvre l’exécution existante et vous le signale.
- **Traces incomplètes :** si une exécution a été exportée alors qu’elle tournait encore, elle apparaît comme *Annulé* avec une remarque.
- **Utilisation :** les exécutions importées ne comptent pas dans les statistiques d’utilisation, car leurs coûts n’ont pas été engagés dans cette installation.
- **Ouvrir dans l’éditeur** n’est pas disponible pour les traces importées, car le workflow correspondant n’existe généralement pas ici. Vous transférez le workflow lui-même avec l’[export de workflow](/docs/workflows#import-export).

Les **fichiers non valides** sont refusés avec un message clair, sans rien enregistrer : pas du JSON, un export de workflow au lieu d’une trace, des champs obligatoires manquants ou des valeurs endommagées. Une trace ne doit pas dépasser 50 Mo.

## Comparer des exécutions {#vergleich}
<!-- keywords: comparer, comparaison, différence, diff, côte à côte, deux exécutions -->

Cochez deux exécutions dans la liste des exécutions avec la case en début de ligne, puis cliquez sur **Comparer**. La vue de comparaison les place côte à côte :

- **Indicateurs :** statut, durée, requêtes, tokens d’entrée et de sortie, coût, appels d’outils et agents en échec. Les lignes qui diffèrent sont mises en évidence, avec l’écart de A à B.
- **Résultat final :** en comparaison ligne par ligne (uniquement dans A, uniquement dans B) ou côte à côte.
- **Agents :** pour chaque agent, modèle, statut, durée, tokens, coût, outils, erreurs et évaluation. Des badges indiquent ce qui diffère ; les sorties et les retours d’évaluation se comparent directement.

Seules les données enregistrées sont comparées ; rien n’est réexécuté. Si les exécutions appartiennent au même workflow, les agents sont appariés par leur nœud, sinon par leur nom. Si le workflow a changé entre les exécutions, la vue le signale. Les traces importées peuvent aussi être comparées.

## Interpréter les erreurs {#fehler}
<!-- keywords: erreurs, message d’erreur, erreur, interpréter, cause, solution, refusalerror, budgetexceedederror -->

Les erreurs figurent dans l’exécution au niveau de l’exécution (résumé « Échec : … ») et au niveau de l’agent concerné (message rouge). Le message apparaît dans la langue de l’interface et indique généralement le type d’erreur. Sous **Détails techniques**, vous trouvez le texte d’origine du serveur ou de l’API, par exemple pour le transmettre dans un rapport de bug.

| Message | Signification | Solution |
|---|---|---|
| `BudgetExceededError` | Le budget de l’exécution est épuisé. | Augmentez le budget dans le workflow ou les réglages, ou choisissez des modèles moins chers. |
| `RefusalError` | Le modèle a refusé la requête. | Reformulez la tâche, définissez des modèles de repli ou choisissez *Reprendre quand même le texte de la réponse*. |
| `MaxToolRoundsError` | Plus de tours d’outils qu’autorisé. | Augmentez *Tours d’outils max.* ou précisez la tâche. |
| `IncompleteResponseError` | La réponse a atteint *Tokens max.* ou la fenêtre de contexte. | Augmentez *Tokens max.*, réduisez les connaissances. |
| `ToolExecutionError` | Un outil a échoué de façon imprévue et *Renvoyer les erreurs d’outils au modèle* était désactivé. | Testez l’outil dans *Essayer*, activez l’option. |
| *Le fournisseur d’IA a signalé une erreur …* | Le fournisseur a signalé une erreur (par exemple clé invalide, surcharge, identifiant de modèle inconnu, options de requête invalides). | Vérifiez la clé et l’identifiant du modèle, réessayez plus tard, vérifiez les options de requête. |
| *Ignoré parce qu’un nœud précédent n’a pas réussi.* | Conséquence d’une erreur en amont. | Corrigez le premier agent en échec. |
| *L’exécution a été annulée.* | Quelqu’un a choisi *Annuler*. | – |

D’autres messages et solutions se trouvent dans [Erreurs fréquentes](/docs/faq#haeufige-fehler).

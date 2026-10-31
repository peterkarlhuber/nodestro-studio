# Automatisation

Sous *Automatisation* dans la navigation, les workflows s’exécutent sans clic sur *Lancer* : les **exécutions par lots** traitent de nombreuses entrées à la fois, les **séries de tests** mesurent la qualité d’un workflow et les **planifications** lancent des workflows régulièrement. Chaque exécution reste une exécution ordinaire avec trace, budget et utilisation ; les validations attendent une personne comme toujours.

## Exécutions par lots {#stapel}
<!-- keywords: lot, batch, nombreuses entrées, csv, excel, xlsx, json, tableau, colonnes, correspondance, export -->

Une **exécution par lots** exécute un workflow pour chaque ligne d’un tableau, par exemple pour 200 demandes de clients.

1. Sur la page **Exécutions par lots**, choisissez *Nouvelle exécution par lots* et sélectionnez le workflow.
2. Téléversez un tableau : CSV (virgule ou point-virgule), Excel (XLSX) ou JSON (une liste d’objets), au plus 1 000 lignes et 10 Mo.
3. Associez chaque colonne à un champ du [formulaire d’entrée](/docs/verzweigungen#eingabeformular) ou à l’entrée libre, ou ignorez-la. Nodestro propose des correspondances adaptées.
4. L’aperçu compte les lignes valides et invalides et affiche le coût estimé. Les lignes invalides ne sont pas exécutées.
5. Lancez. La page de détail montre la progression, les coûts et chaque ligne avec son statut et un lien vers son exécution.

Un lot peut être **mis en pause** (les exécutions en cours se terminent, aucune nouvelle ne démarre), **repris** et **annulé**. Une erreur sur une ligne n’arrête pas les autres. Si Nodestro s’est arrêté pendant un lot, celui-ci est *interrompu* et peut être repris. Vous téléchargez les résultats en CSV ou en JSON.

## Limites, coûts et outils propres {#grenzen}
<!-- keywords: limites, limite de coût, limite d’échecs, en parallèle, estimation, coût, rate limit, outils propres -->

- **En parallèle :** combien d’exécutions tournent en même temps (de 1 à 8). Plus, c’est plus rapide, mais cela peut atteindre les limites de débit de l’API.
- **Limite de coût (USD) :** le lot s’arrête dès que le total est atteint. Le [budget par exécution](/docs/workflows#budget) s’applique en plus à chaque exécution.
- **Échecs au maximum :** le lot s’arrête après ce nombre d’exécutions échouées.
- **Coût estimé :** à partir des dernières exécutions réussies du workflow, multiplié par le nombre d’exécutions. S’il n’y a encore aucune exécution réussie, Nodestro indique seulement le maximum : budget multiplié par le nombre.
- Les **outils propres** pouvant agir hors de Nodestro (comme envoyer des messages) seraient appelés à chaque exécution. Vous devez le confirmer explicitement avant le lancement.
- Les exécutions qui attendent une **validation** n’occupent pas de place ; elles reprennent dès que quelqu’un décide.

Les coûts de toutes les exécutions apparaissent comme toujours dans [Utilisation](/docs/nutzung), chacun compté une seule fois.

## Séries de tests {#testreihen}
<!-- keywords: série de tests, benchmark, cas de test, règle de contrôle, qualité, régression, résultat attendu, réussi -->

Une **série de tests** appartient à un workflow et contient des **cas de test** fixes : une entrée (valeurs de formulaire, texte libre, fichiers), des **règles de contrôle** pour le résultat et, en option, des critères pour une [évaluation IA](/docs/automatisierung#ki-bewertung).

- Les règles de contrôle utilisent les mêmes comparaisons que les [décisions](/docs/verzweigungen#regeln), par exemple `category est égal à complaint` ou `total supérieur à 100`. Elles sont exactes et ne coûtent rien.
- *Lancer la série de tests* choisit la version du workflow (état actuel ou une version antérieure), les limites comme pour les lots et si l’IA doit évaluer.
- Un cas est **réussi** si son exécution a réussi, que toutes les règles de contrôle sont vérifiées et, s’il est évalué, que l’IA l’a validé.
- L’évaluation montre le taux de réussite, l’évaluation IA, les tokens, les coûts et la durée, ainsi que les détails de chaque cas.

Une série de tests compte au plus 200 cas. Les cas invalides (par exemple un champ obligatoire sans valeur) sont signalés avant le lancement et ignorés.

## Cas de test à partir d'une exécution échouée {#testfall-aus-lauf}
<!-- keywords: cas de test depuis exécution, erreur comme test, régression, échouée, ajouter, anonymisé -->

Quand une exécution a échoué, clique sur **Ajouter comme cas de test** dans ses détails. Nodestro propose un cas de test avec la même entrée : valeurs du formulaire, texte libre et fichiers.

- Les clés d'API, jetons et mots de passe sont toujours remplacés par des marqueurs comme `[API_KEY_1]`, et les données personnelles (adresses e-mail, numéros de téléphone, IBAN …) aussi tant que l'interrupteur est activé. La détection repose sur des motifs et ne trouve pas tout ; vérifie l'aperçu.
- Les fichiers sont utilisés tels qu'ils sont enregistrés, ni copiés ni anonymisés. Les fichiers supprimés sont omis et signalés, comme les valeurs qui ne correspondent plus au formulaire actuel.
- Rien n'est enregistré tant que tu n'as pas choisi une série de tests (ou créé une nouvelle) et cliqué sur **Ajouter à la série de tests**. L'exécution reste inchangée.
- Le cas garde son **origine** (exécution, erreur, ce qui a été remplacé) et l'affiche dans la série de tests. Tu y ajoutes les règles de contrôle et les critères.

Si un nouveau cas modifie une série de tests utilisée par une [contrôle de publication](/docs/api-und-export#freigabe-gate), la série doit être relancée avant la prochaine publication.

## Évaluation IA {#ki-bewertung}
<!-- keywords: évaluation ia, juge, llm as judge, critères, évaluation, note, score -->

Pour les cas avec critères (un par ligne), un modèle d’IA distinct évalue le résultat, éventuellement par rapport à un **résultat attendu**. Par défaut, c’est le modèle des assistants d’IA ; dans la série de tests, vous pouvez choisir un modèle personnalisé de n’importe quel fournisseur configuré.

Le verdict est partout marqué comme **évaluation IA** et ne remplace pas une règle de contrôle. Il coûte en plus ; ce coût figure dans l’évaluation et dans [Utilisation](/docs/nutzung) sous *Évaluation IA des séries de tests*.

## Comparer des exécutions de test {#testreihen-vergleichen}
<!-- keywords: comparer, comparer des versions, meilleur, moins bon, régression, avant après -->

Choisissez deux exécutions dans la liste des exécutions de test et cliquez sur *Comparer*. Le tableau montre le taux de réussite des deux et, pour chaque cas, s’il a réussi, marqué comme **meilleur**, **moins bon**, **identique** ou **modifié**.

Vous vérifiez ainsi après chaque modification d’agents, de prompts ou d’outils si le workflow s’est amélioré, et vous pouvez tester une [version](/docs/workflows#versionen) antérieure par rapport à l’état actuel.

## Comparer des modèles {#modelle-vergleichen}
<!-- keywords: comparer des modèles, autre modèle, moins cher, plus rapide, choix du modèle, variante -->

Pour savoir si un modèle moins cher ou plus puissant suffit pour un agent, utilisez la même série de tests. Dans la boîte de dialogue de démarrage, activez **Tester d’autres modèles** et choisissez un autre modèle pour certains agents. Les cas de test et l’évaluation par IA restent les mêmes, et le workflow enregistré ne change pas.

Une telle exécution exige une **limite de coût** sous [Limites](/docs/automatisierung#grenzen), car les exécutions précédentes utilisaient d’autres modèles et ne disent rien du coût. Dans la liste, elle porte la mention **Comparaison de modèles** et nomme les modèles remplacés. Comparez-la ensuite avec une exécution de la version enregistrée. Elle ne compte pas comme résultat de test de cette version, car elle a testé une variante. Si un modèle convient, définissez-le dans l’agent lui-même.

## Planifications {#zeitplaene}
<!-- keywords: planification, schedule, cron, régulier, quotidien, hebdomadaire, mensuel, toutes les heures, fuseau horaire, manqué -->

Une **planification** lance un workflow une fois ou régulièrement, avec des entrées fixes (valeurs de formulaire, texte, fichiers).

- **Rythme :** une fois, toutes les quelques heures, chaque jour, certains jours de la semaine ou chaque mois un jour donné (dans les mois plus courts, le dernier jour).
- **Fuseau horaire :** les heures s’appliquent dans le fuseau choisi, y compris lors des changements d’heure. Une heure qui n’existe pas lors du passage à l’heure d’été s’exécute une heure plus tard ; une heure qui existe deux fois lors du retour à l’heure d’hiver s’exécute une fois.
- **Prochains lancements :** la boîte de dialogue affiche les prochaines dates avant l’enregistrement.
- **Désactivée jusqu’à activation :** une nouvelle planification est désactivée. À l’activation, Nodestro vérifie tout ce dont une exécution a besoin : le workflow, les entrées, un [budget par exécution](/docs/einstellungen#budget) et la confirmation des outils propres. Si la vérification échoue, elle reste désactivée et la raison s’affiche.

Les planifications ne tournent que pendant que Nodestro fonctionne. Les horaires passés pendant que Nodestro était arrêté sont **manqués** : *Ignorer* les laisse de côté, *Rattraper une fois* lance une seule exécution au prochain démarrage, quel que soit le nombre d’horaires manqués. Les exécutions issues de planifications portent l’origine *Planification* dans les [Exécutions](/docs/ausfuehrungen#liste).

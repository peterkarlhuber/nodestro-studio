# Workflows d'exemple

Nodestro fournit 24 workflows multi-agents prêts à l'emploi, un pour chaque domaine d'application typique. Chaque exemple contient des agents avec leurs prompts système, les connexions, une tâche de test préparée avec des données inventées et un résultat clairement décrit. Ce chapitre explique la galerie, la copie et l'adaptation, et décrit chaque exemple séparément.

## La galerie {#galerie}
<!-- keywords: exemples, modèles, galerie, bibliothèque, recommandés, catégories, page d'accueil, commencez ici, niveau, plus simple -->

La galerie se trouve sur la page **Workflows**, sous vos propres workflows et clairement séparée d'eux. Elle présente quelques exemples recommandés, le plus simple en premier, et les six catégories. Tant que vous n’avez aucun workflow, l’exemple le plus simple porte la mention **Commencez ici** ; ensuite, la galerie est une zone repliée qui se souvient si vous l’avez ouverte. **Voir les 24 exemples** ouvre la galerie complète, elle aussi dans l'espace des workflows.

Dans la galerie complète, vous recherchez par nom, domaine, description, bloc ou niveau et filtrez par catégorie et par **Niveau**. Les exemples sont classés par niveau, les plus simples en premier ; le plus simple porte **Commencez ici**. La recherche, les filtres et un aperçu ouvert font partie de l’adresse, si bien que *Retour* ramène à la même sélection. Chaque carte indique le domaine, le nom, la description, le nombre d'agents, le niveau et le schéma. Les exemples des domaines sensibles portent le badge **Vérification experte**. La [recherche](/docs/start#suche) trouve aussi les exemples.

## Aperçu et copie {#uebernehmen}
<!-- keywords: aperçu, copier, copie, modèle, inchangé, gratuit -->

Un clic sur une carte ouvre l'**aperçu** : le déroulement sous forme de schéma, chaque agent avec son rôle, son modèle, ses outils et les résultats qu'il reçoit, le guide et la tâche de test. L'aperçu n'enregistre rien et n'appelle aucun modèle.

Tout en haut de l’aperçu, **Ce dont vous avez besoin** indique le fournisseur d’IA et les modèles qu’utilise la copie et si ce fournisseur est configuré (sinon avec un lien vers les réglages), si une exécution s’arrête pour une validation, quels fichiers de connaissances et d’exemple sont fournis et si une connexion à un autre service est nécessaire.

**Copier dans mes workflows** crée votre propre workflow et l'ouvre dans l'éditeur. La copie est indépendante : vous pouvez tout modifier, et le modèle reste toujours inchangé. Si vous copiez un exemple deux fois, vous obtenez deux workflows distincts. La copie commence avec la version 1 dans l'[historique des versions](/docs/workflows#versionen).

Si **Ajouter les cas de test comme série de tests** est coché (par défaut), la copie reçoit aussi une [série de tests](/docs/automatisierung#testreihen) avec les cas de test préparés ; les fichiers d'exemple nécessaires sont enregistrés comme fichiers d'entrée de la copie. La copie ne lance jamais d'exécution, ne crée jamais de [planification](/docs/automatisierung#zeitplaene) et ne publie jamais d'[API](/docs/api-und-export#veroeffentlichen) ; c'est vous qui en décidez ensuite.

Les exemples ne sont jamais créés automatiquement ; seul ce que vous copiez apparaît parmi vos workflows. Les coûts n’apparaissent que lorsque vous exécutez une copie. Les modèles d’une copie dépendent de votre modèle par défaut : s’il s’agit d’un modèle d’Anthropic, la copie utilise les modèles de l’exemple (Haiku, Sonnet ou Opus, selon la tâche de l’agent). S’il appartient à un autre [fournisseur](/docs/einstellungen#anbieter), tous les agents de la copie utilisent votre modèle par défaut, et les plus exigeants votre modèle des assistants s’il appartient au même fournisseur ; les outils serveur, qui ne fonctionnent qu’avec Anthropic, sont alors omis. Vous pouvez modifier les modèles d’une copie à tout moment. Aucun exemple ne nécessite de comptes ou de sources de données payantes. Certains exemples ont une **Connexion facultative** à un autre service via MCP : lors de la copie, vous choisissez un [service connecté](/docs/tools#verbundene-dienste) configuré ou le **Mode hors ligne (données d'exemple)**, présélectionné.

## Langues {#sprachen}
<!-- keywords: langue, traduction, allemand, anglais, copie, prompts -->

La galerie et l'aperçu s'affichent dans la langue de l'interface. Les noms, descriptions, prompts système, tâches et la tâche de test de la copie sont créés dans la langue que vous choisissez dans l'aperçu sous **Langue de la copie** ; par défaut, c'est la langue de l'interface.

Une copie enregistrée reste dans sa langue, même si vous changez l'interface plus tard. Les identifiants techniques, comme les noms de champs de la sortie structurée et les noms des outils, sont en anglais dans toutes les langues.

## Schémas et rôles {#muster}
<!-- keywords: séquentiel, parallèle, revue, juge, contrôle qualité, rôles, structure -->

Les exemples n’utilisent que le nombre d’agents dont la tâche a besoin, généralement trois ou quatre.

- **Séquentiel :** les agents travaillent l’un après l’autre ; chacun s’appuie sur le résultat du précédent.
- **Parallèle :** plusieurs agents travaillent en même temps sur la même entrée, et un autre réunit les résultats.
- **Avec branches :** une décision ou une validation choisit le chemin ; tous les agents ne s’exécutent pas à chaque fois (voir [Branches et validations](/docs/verzweigungen)).
- **Revue :** un agent de contrôle vérifie le travail des autres et fournit souvent une sortie structurée avec des champs fixes.
- **Contrôle qualité :** pour certains agents, un [contrôle qualité](/docs/agenten#qualitaet) intégré évalue le résultat selon des critères fixes et le fait réviser si nécessaire.

Les cartes de la galerie indiquent aussi les briques qu’un exemple utilise : décision, validation, formulaire d’entrée, sous-workflow, fichiers de résultat, fichiers en entrée, propositions de connaissances ou mémoire.

Les rôles de l’aperçu décrivent ce que fait un agent : recherche, analyse, planification, contrôle ou rédaction. Les calculs utilisent les outils intégrés comme la calculatrice et le calcul de dates ; ils ne coûtent rien de plus.

## Données de test {#testdaten}
<!-- keywords: tâche de test, données de test, synthétiques, inventées, données d'exemple -->

Chaque tâche de test commence par la mention **DONNÉES D'EXEMPLE SYNTHÉTIQUES**. Les entreprises, personnes, chiffres et règles sont inventés et servent uniquement à essayer. Après la copie, la tâche de test est l'entrée proposée du nœud de départ ; remplacez-la par vos propres données.

## Fichiers d'exemple et cas de test {#beispieldateien}
<!-- keywords: fichiers d'exemple, cas de test, série de tests, fichier, téléversement, pdf, excel, word, zip -->

De nombreux exemples ont un [champ de fichier](/docs/datei-eingaben#datei-felder) facultatif, par exemple pour un journal des arrêts en Excel, des offres en PDF et Word ou un contrat en fichier Word. L'aperçu propose de petits **fichiers d'exemple** fictifs à télécharger, assortis à la tâche de test. Vous pouvez les déposer dans le champ de fichier au lancement de la copie pour voir comment l'exemple travaille avec des fichiers. Sans fichier, les agents travaillent comme avant avec le texte.

Chaque exemple a aussi des **cas de test**, par exemple un cas avec texte, un avec fichier d'exemple et, pour les exemples avec décision, un cas pour chaque chemin. Chaque cas de test contient des vérifications sur des champs du résultat. Les cas de test copiés apparaissent comme série de tests de la copie ; ils ne s'exécutent que lorsque vous lancez la série et coûtent alors autant que des exécutions normales.

L'exécution enregistre les fichiers de résultat comme PDF, Word ou Excel dans [Fichiers](/docs/dateien). Si un agent propose des enseignements pour la connaissance, seul ce que vous adoptez explicitement est enregistré.

## Domaines sensibles {#sensible-bereiche}
<!-- keywords: finance, droit, rh, administration, vérification, responsabilité, conseil, prudence -->

Six exemples concernent la finance, le droit, les ressources humaines ou l'administration : analyse financière, recrutement, revue de contrat, budget familial, comparaison immobilière et demande d'un administré. Leurs agents reçoivent dans le prompt système la consigne supplémentaire de nommer les incertitudes et de lister les points qu'une personne qualifiée doit vérifier.

Les résultats sont des aides au travail, ni des conseils ni une décision. Vérifiez-les avec un regard professionnel avant de les utiliser, de les envoyer ou de les publier.

## Adapter les exemples {#anpassen}
<!-- keywords: adapter, modifier, propres données, connaissance, modèle, prompt -->

- **Vos données :** remplacez la tâche de test dans le nœud de départ ou saisissez votre propre entrée au lancement.
- **Vos fichiers :** déposez les documents pour une seule exécution directement dans le champ de fichier au lancement ; aucune collection de connaissances n'est nécessaire pour cela.
- **Connaissance :** chargez les documents dont vous avez durablement besoin comme [connaissance](/docs/wissen#modi) et attribuez-les à l'agent approprié.
- **Prompts et tâches :** les tâches renvoient à leurs prédécesseurs par des [espaces réservés](/docs/workflows#platzhalter). Si vous renommez un agent, adaptez les espaces réservés.
- **Données actuelles :** pour des informations en temps réel, vous pouvez ajouter l'[outil serveur](/docs/tools#server-tools) de recherche web (uniquement avec des modèles d’Anthropic) ; il coûte un supplément par recherche.

Les sections ci-dessous indiquent des adaptations concrètes pour chaque exemple.

<!-- examples:start -->

## Les 24 exemples en un coup d'œil {#uebersicht}

Chaque exemple se trouve dans la galerie et a sa propre section ci-dessous.

| N° | Exemple | Domaine | Agents | Schéma |
|---|---|---|---|---|
| 1 | Analyser les arrêts machine | Production et industrie | 3 | avec branches |
| 2 | Traiter une réclamation avec la 8D | Gestion de la qualité | 5 | avec branches |
| 3 | Comparer des offres fournisseurs | Logistique et achats | 3 | parallèle |
| 4 | Stratégie SWOT pour une PME | Entreprises et PME | 4 | parallèle |
| 5 | Analyse financière | Finance et investissement | 3 | séquentiel |
| 6 | Article de blog | Marketing et contenu | 3 | séquentiel |
| 7 | Préparer une offre personnalisée | Vente | 3 | séquentiel |
| 8 | Répondre aux demandes clients | Service client | 4 | avec branches |
| 9 | Publier une offre d'emploi et préparer les entretiens | Ressources humaines | 5 | avec branches |
| 10 | Transformer une question de recherche en hypothèses | Recherche et développement | 3 | adaptatif (orchestration) |
| 11 | Revue de code avec tests | Développement logiciel | 3 | parallèle |
| 12 | Structurer un contrat et repérer les points à vérifier | Droit et administration | 5 | avec branches |
| 13 | Créer un plan d'apprentissage personnel | Éducation et formation | 4 | parallèle |
| 14 | Vérifier un budget familial et économiser | Particuliers – finances | 3 | séquentiel |
| 15 | Planifier un voyage personnel | Particuliers – voyages | 4 | avec branches |
| 16 | Évaluer une idée d'entreprise | Indépendants et créateurs d'entreprise | 2 | adaptatif (orchestration) |
| 17 | Développer une stratégie réseaux sociaux | Influenceurs et créateurs de contenu | 3 | séquentiel |
| 18 | Comparer des offres immobilières | Immobilier | 3 | parallèle |
| 19 | Analyser les retards de chantier | Bâtiment et travaux publics | 3 | adaptatif (orchestration) |
| 20 | Développer et calculer une carte | Restauration | 3 | séquentiel |
| 21 | Planifier l'assolement d'une exploitation | Agriculture | 3 | séquentiel |
| 22 | Organiser la fête d'une association | Associations | 4 | parallèle |
| 23 | Développer une campagne de dons | Organisations à but non lucratif | 3 | avec branches |
| 24 | Répondre à une demande d'un administré | Institutions publiques | 3 | séquentiel |

## 1 · Analyser les arrêts machine {#production-downtime}
<!-- keywords: production et industrie, analyste des arrêts, analyste des causes, planificateur d'actions -->

**Domaine:** Production et industrie · **Agents:** 3 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, formulaire de saisie, sous-workflow, fichiers de résultat, fichiers en entrée

Les arrêts coûtent du temps de production, mais dans les longs journaux les schémas passent facilement inaperçus. Le workflow transforme un journal des arrêts en une liste de mesures justifiée et priorisée.

**Comment les agents collaborent:** Deux agents travaillent en parallèle : l'analyste des arrêts calcule totaux, parts et un classement de Pareto avec la calculatrice, l'analyste des causes développe des hypothèses selon les 5M. Le planificateur d'actions réunit les deux, et une vérification qualité intégrée contrôle que chaque mesure est justifiée. Si la part des arrêts dépasse l'objectif de 3 %, un nœud de décision lance un sous-workflow qualité qui évalue les risques des mesures et planifie leur sécurisation.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste des arrêts** | Exploite le journal de manière quantitative et calcule avec la calculatrice. (sortie structurée; Outils: `calculator`) | Journal des arrêts |
| **Analyste des causes** | Développe des hypothèses de causes selon les 5M et propose des vérifications. | Journal des arrêts |
| **Planificateur d'actions** | Réunit analyse et hypothèses en mesures priorisées. (avec contrôle qualité) | Analyste des arrêts, Analyste des causes |

**Entrée:** Un journal des arrêts (date, équipe, machine, durée, code défaut, note) et le temps de production planifié. Vous pouvez coller le journal dans le texte sous forme de tableau ou le déposer dans le champ de fichier facultatif en CSV ou Excel ; le fichier d'exemple « Journal_arrets_L2_semaines14-15.xlsx » contient les mêmes douze entrées fictives que la tâche de test.

**Fichiers d'exemple:** `Journal_arrets_L2_semaines14-15.xlsx`

**Cas de test:** Journal dans le texte, objectif manqué (4,6 %); Quinzaine calme, objectif tenu; Journal en fichier Excel

**Résultat:** Un tableau priorisé d'actions immédiates, de vérifications et d'actions durables, chacune avec effet attendu, effort, rôle responsable et indicateur, ainsi que l'analyse des données avec la part d'arrêts et les trois prochaines étapes les plus importantes. L'exécution enregistre aussi le tout en Markdown et dans un fichier Excel avec les tableaux.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'analyste des arrêts vérifie chaque chiffre avec la calculatrice. Une vérification qualité évalue le plan d'actions selon trois critères (lien avec les constats, priorisation, responsables et indicateurs) et fait réviser le planificateur d'actions une fois s'il ne les remplit pas. Une condition compare la part des arrêts à l'objectif de 3 % : au-delà, le sous-workflow d'assurance qualité s'exécute (évaluation des risques avec une AMDEC simplifiée et plan de vérification) ; sinon, il est sauté. L'exécution montre quelle branche a été prise. Aucune étape n'attend une personne : les causes sont des hypothèses à vérifier sur le terrain, et les mesures sont des propositions pour la direction de production responsable.

**Pourquoi cette architecture:** L'évaluation chiffrée et la recherche des causes examinent le même journal sous des angles différents et ne dépendent pas l'une de l'autre ; elles s'exécutent donc en parallèle, et seul le planificateur d'actions les réunit. L'assurance qualité ne s'exécute que si l'objectif est manqué, car c'est alors seulement que des mesures plus lourdes, dont les risques doivent être maîtrisés, sont à prévoir ; dans l'objectif, elle ne coûterait que du temps et de l'argent. C'est un sous-workflow afin que le même module puisse être réutilisé et testé séparément. Un orchestrateur n'est pas nécessaire, car chaque journal d'arrêts demande les mêmes étapes.

**L'adapter:** Déposez un export de votre MES ou de votre tableur dans le champ de fichier ; les longs journaux fonctionnent aussi, car les agents lisent les gros fichiers de façon ciblée. Pour une analyse hebdomadaire, vous pouvez planifier la copie. Dans le prompt système du planificateur d'actions, vous pouvez ajouter votre méthode, par exemple les piliers TPM ou une grille d'évaluation fixe.

## 2 · Traiter une réclamation avec la 8D {#quality-8d}
<!-- keywords: gestion de la qualité, description du problème d1–d3, analyse des causes d4, planification des actions d5–d7, rapport 8d, confinement d'urgence -->

**Domaine:** Gestion de la qualité · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, validation, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances, fichiers de connaissances

Les réclamations exigent un confinement rapide et une analyse des causes rigoureuse. La méthode 8D fixe les étapes ; le workflow les parcourt de façon structurée et les documente de manière homogène. Il vérifie aussi si le défaut s'est déjà produit : une cause qui revient signifie qu'une action corrective antérieure n'a pas fonctionné, et cela doit figurer dans le rapport.

**Comment les agents collaborent:** Une chaîne séquentielle : le premier agent décrit le problème et les actions de confinement (D1 à D3). Le deuxième cherche des cas comparables dans les rapports 8D antérieurs de l'entreprise et recherche les causes d'apparition et de non-détection (D4) ; il indique si une cause est récurrente ou nouvelle. Le troisième planifie les actions correctives et préventives (D5 à D7). L'agent de rapport réunit le tout dans un rapport 8D structuré. Un nœud de décision vérifie la gravité : dans les cas critiques, un agent supplémentaire planifie le confinement d'urgence des 24 prochaines heures. Avant que le rapport parte chez le client, une personne le valide.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Description du problème D1–D3** | Décrit l'équipe, le problème (est / n'est pas) et les actions de confinement. (sortie structurée) | Réclamation |
| **Analyse des causes D4** | Consulte les rapports 8D antérieurs et recherche avec les 5 pourquoi les causes d'apparition et de non-détection. | Description du problème D1–D3, Réclamation |
| **Planification des actions D5–D7** | Planifie les actions correctives, leur vérification et la prévention. | Analyse des causes D4 |
| **Rapport 8D** | Réunit toutes les étapes dans un rapport 8D structuré. (sortie structurée) | Description du problème D1–D3, Analyse des causes D4, Planification des actions D5–D7, Confinement d'urgence |
| **Confinement d'urgence** | Planifie le confinement des 24 prochaines heures dans les cas critiques. | Gravité |

**Entrée:** La réclamation du client avec pièce, lot, défaut et taux de défaut, ainsi que les informations internes connues sur la fabrication, la matière et le contrôle. Vous pouvez aussi joindre la lettre de réclamation, des données de mesure et des photos du défaut en fichiers ; les fichiers d'exemple contiennent une lettre de réclamation fictive (PDF) et des mesures (Excel). Les rapports 8D antérieurs proviennent de la collection de connaissances ; une archive fictive de quatre rapports clôturés est fournie.

**Fichiers d'exemple:** `Reclamation_G-220_lot_24-117.pdf`, `Mesures_crochets.xlsx`

**Cas de test:** Réclamation dans le texte; Lettre de réclamation et mesures en fichiers

**Résultat:** Un rapport 8D structuré avec un champ pour chaque discipline D1 à D8 et une liste des points ouverts que l'équipe doit encore clarifier ; l'analyse des causes cite les rapports antérieurs sur lesquels elle s'appuie. Après validation, l'exécution enregistre le rapport en PDF et en fichier Word modifiable. La boucle d'apprentissage se referme ainsi : l'agent de rapport propose le rapport 8D terminé pour la connaissance, une personne décide s'il est enregistré, et les rapports enregistrés rejoignent la même collection que les rapports antérieurs, de sorte que l'analyse des causes les retrouve lors des prochains cas.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : le nœud de décision n'ajoute le confinement d'urgence que si la description du problème qualifie le cas de critique ; l'analyse des causes décide quels rapports antérieurs sont pertinents et les cite, de sorte que chaque référence est vérifiable. Il n'y a pas de boucle ; chaque étape s'exécute une fois. Une personne décide deux fois : avant la création des fichiers, quelqu'un valide le rapport 8D (un refus arrête l'exécution sans fichiers), et une personne décide si le rapport terminé est enregistré comme connaissance. Jusqu'à la validation, le rapport reste un projet.

**Pourquoi cette architecture:** La 8D impose un ordre fixe où chaque discipline s'appuie sur la précédente ; une chaîne séquentielle convient donc mieux qu'un orchestrateur, et seul le confinement d'urgence dépend du cas et constitue une branche. Les rapports antérieurs sont une connaissance interrogeable plutôt que du texte dans le prompt : l'archive grandit avec chaque cas enregistré, la recherche n'apporte que les passages pertinents et les citations montrent d'où vient une cause récurrente. Une boucle de relecture a été volontairement écartée, car la validation par une personne à la fin vérifie de toute façon l'ensemble du rapport.

**Fichiers de connaissances (synthétiques, créés lors de la copie):** Rapports_8D_anterieurs_Plastiform: Archive fictive de quatre rapports 8D clôturés du fournisseur de boîtiers plastique Plastiform SAS ; l'un d'eux est un cas comparable.

**L'adapter:** Remplacez les données de test par votre réclamation et joignez directement procès-verbaux de contrôle, plans ou photos. Remplacez les rapports antérieurs fictifs de la collection de connaissances par vos propres rapports 8D clôturés (Markdown, PDF ou Word) ; des titres clairs avec pièce, défaut et cause pour chaque rapport rendent la recherche plus précise. Si vous utilisez votre propre formulaire, adaptez les champs de l'agent de rapport sous « Format de sortie ».

## 3 · Comparer des offres fournisseurs {#supplier-comparison}
<!-- keywords: logistique et achats, analyste des coûts, analyste des risques, recommandation d'achat -->

**Domaine:** Logistique et achats · **Agents:** 3 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, connexion MCP facultative

Le prix unitaire le plus bas est rarement l'offre la moins chère, et les promesses d'un fournisseur ne sont pas son historique. Le workflow compare les offres selon le coût total et le risque d'approvisionnement, vérifie l'historique des fournisseurs lorsqu'il est disponible et justifie une recommandation pour les achats.

**Comment les agents collaborent:** L'analyste des coûts et l'analyste des risques travaillent en parallèle. L'un calcule avec la calculatrice le coût total de possession de chaque offre, l'autre évalue délai, dépendances, capacité et qualité. Si votre copie est connectée à l'ERP, l'analyste des risques lit l'évaluation de chaque fournisseur, en lecture seule, avec list_suppliers et supplier_scorecard ; sans connexion, il utilise un export ERP joint ou seulement les offres et indique quel historique manque. La recommandation d'achat pèse les deux et fournit un résultat structuré.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste des coûts** | Calcule le coût total de chaque offre avec la calculatrice. (Outils: `calculator`) | Offres |
| **Analyste des risques** | Évalue délais, dépendances, capacité et risques qualité. | Offres |
| **Recommandation d'achat** | Pèse coûts et risques et recommande un fournisseur. (sortie structurée) | Analyste des coûts, Analyste des risques |

**Entrée:** Plusieurs offres avec prix, fret, délai, quantité minimale, conditions de paiement et données qualité, ainsi que vos coûts internes. Vous pouvez écrire les offres dans le texte ou les joindre en fichiers, même mélangées en PDF, Word et Excel ; les trois fichiers d'exemple montrent exactement cela. Vous pouvez aussi joindre un export ERP des évaluations fournisseurs (Excel ou CSV) ; dans l'export d'exemple, le fournisseur de l'offre B manque volontairement, car il est nouveau et n'a pas encore d'historique.

**Fichiers d'exemple:** `Offre_A_Exemple_Precision.pdf`, `Offre_B_Example_Components.docx`, `Offre_C_Modele_Pieces_Metalliques.xlsx`, `ERP_evaluation_fournisseurs.xlsx`

**Cas de test:** Trois offres dans le texte; Trois offres en PDF, Word et Excel; Trois offres en fichiers et export ERP

**Résultat:** Une recommandation structurée avec classement, justifications, risques, points de négociation et hypothèses retenues. L'évaluation des risques indique pour chaque fournisseur d'où vient son historique : de l'ERP, de l'export joint ou seulement de l'offre. L'exécution enregistre aussi la recommandation en rapport PDF et en fichier Excel avec une feuille par liste.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : les deux analyses et la pondération s'enchaînent sans arrêt ; la calculatrice fait les calculs et l'exécution consigne chaque étape et chaque appel d'outil. La connexion ERP est facultative et ne fait que lire : la copie ne reçoit les outils list_suppliers et supplier_scorecard que si vous la connectez à un serveur MCP dont un administrateur a approuvé les outils en lecture seule ; sinon, elle fonctionne dans un mode hors ligne clairement signalé et ne prétend jamais disposer de données ERP. Les exécutions sans personne présente (planifications, séries de tests, traitement par lots) ne peuvent pas utiliser d'outils MCP, sauf si un administrateur autorise expressément le MCP sans surveillance ; utilisez donc une copie connectée de manière interactive. Aucune étape n'attend de validation : la recommandation est un projet, la décision d'attribution vous appartient.

**Pourquoi cette architecture:** Coût et risque sont des questions indépendantes : deux spécialistes travaillent donc en parallèle et un troisième pèse leurs résultats, ce qui est plus rapide et plus facile à vérifier qu'un seul agent pour tout. L'historique des fournisseurs passe par une intégration, car il se trouve dans l'ERP et change en permanence ; un fichier de connaissance serait vite périmé, et le mode hors ligne avec un export garde l'exemple utilisable sans connexion. Il n'y a ni boucle ni étape de validation, car le résultat est une recommandation, pas une action.

**Connexion facultative: ERP (évaluation fournisseurs)** (Outils: `list_suppliers`, `supplier_scorecard`). Accès en lecture seule via MCP aux données fournisseurs de votre ERP : list_suppliers liste les fournisseurs, supplier_scorecard renvoie l'évaluation d'un fournisseur sur les 12 derniers mois (respect des délais, qualité en ppm, réclamations, rapports 8D ouverts, dernier audit). L'analyste des risques s'en sert pour confronter les offres à l'historique enregistré.

**Mise en place:** Un administrateur ajoute le serveur MCP de l'ERP de votre entreprise sous Outils → Services connectés et approuve les deux outils list_suppliers et supplier_scorecard en lecture seule. En copiant l'exemple, vous choisissez ce serveur comme connexion ; sans connexion, la copie fonctionne en mode hors ligne. Pour essayer sans ERP, lancez `python -m nodestro_examples.demo_mcp --language fr` sur l'ordinateur où tourne l'application de bureau Nodestro, ajoutez http://127.0.0.1:8765/mcp sous Outils → Services connectés avec le consentement pour un serveur de développement local, approuvez ses outils en lecture seule et choisissez-le en copiant. Le serveur de démonstration ne fait que lire et sert les données synthétiques de l'export d'exemple, jamais de vraies données d'entreprise. Les exécutions sans personne présente (planifications, séries de tests, traitement par lots) ne peuvent pas utiliser d'outils MCP, sauf si un administrateur autorise expressément le MCP sans surveillance.

**Sans connexion:** Mode hors ligne : aucun ERP n'est connecté. L'analyste des risques utilise uniquement un export ERP joint ou les offres et signale l'historique fournisseur manquant ; il ne consulte rien.

**L'adapter:** Joignez vos offres en fichiers et indiquez le besoin et les coûts dans le texte. Pour utiliser l'historique réel des fournisseurs, faites configurer l'intégration ERP et choisissez le serveur en copiant l'exemple ; sinon, joignez un export des évaluations fournisseurs. Si vous avez des pondérations fixes (par exemple 50 % coût, 30 % risque, 20 % qualité), ajoutez-les dans le prompt système de la recommandation d'achat. Les contrats-cadres peuvent être enregistrés comme connaissance et attribués à l'analyste des risques.

## 4 · Stratégie SWOT pour une PME {#sme-swot}
<!-- keywords: entreprises et pme, analyse interne, analyse de l'environnement, développeur de stratégie, relecteur critique -->

**Domaine:** Entreprises et PME · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** fichiers de résultat

Beaucoup de petites entreprises connaissent leurs problèmes, mais pas le meilleur ordre pour les traiter. Le workflow établit une analyse SWOT, en déduit des stratégies et les soumet à un relecteur critique.

**Comment les agents collaborent:** L'analyse interne (forces, faiblesses) et l'analyse de l'environnement (opportunités, menaces) tournent en parallèle. Le développeur de stratégie combine les deux en stratégies selon la matrice TOWS et un plan à 90 jours. Le relecteur critique cherche les points faibles et les informations manquantes ; le résultat contient la stratégie et la revue. À la fin, le résultat est enregistré avec l'exécution sous forme de fichiers Markdown et PDF.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyse interne** | Dégage les forces et faiblesses à partir des données de l'entreprise. | Profil de l'entreprise |
| **Analyse de l'environnement** | Déduit opportunités et menaces du marché et de l'environnement. | Profil de l'entreprise |
| **Développeur de stratégie** | Développe des stratégies selon la matrice TOWS et un plan à 90 jours. | Analyse interne, Analyse de l'environnement |
| **Relecteur critique** | Remet en question la stratégie et met au jour les points faibles. (sortie structurée) | Développeur de stratégie, Profil de l'entreprise |

**Entrée:** Un court profil d'entreprise avec chiffres clés, offre, forces, problèmes, environnement de marché et objectifs.

**Cas de test:** Menuiserie à la succession non réglée

**Résultat:** Une matrice SWOT avec des stratégies déduites et un plan à 90 jours, ainsi qu'une revue critique structurée avec avis, points faibles, informations manquantes et prochaines étapes.

**Ce qui est décidé automatiquement et quand une personne intervient:** Tout s'exécute automatiquement et aucune étape n'attend une personne. Le relecteur critique reçoit la stratégie et le profil d'origine de l'entreprise et rend un avis structuré avec points solides, points faibles, informations manquantes et prochaines étapes ; il ne renvoie pas la stratégie, si bien que sa critique reste visible dans le résultat. L'analyse de l'environnement ne fait pas de recherche sur le web : elle s'appuie sur le profil et sur des connaissances générales du secteur et signale ce qui doit être vérifié localement. La stratégie et le plan à 90 jours sont un projet pour votre propre décision.

**Pourquoi cette architecture:** Les forces et les faiblesses viennent de l'entreprise, les opportunités et les menaces du marché ; les deux analyses ne dépendent pas l'une de l'autre et s'exécutent donc en parallèle. La stratégie a besoin des deux et suit donc comme étape fixe. Le relecteur est un agent distinct qui voit aussi le profil d'origine : il confronte ainsi la stratégie aux faits et pas seulement à son propre raisonnement. Une boucle de révision a été volontairement écartée : une stratégie ne doit pas être lissée jusqu'à ce que le relecteur soit d'accord, car les contradictions ouvertes sont une information précieuse pour la personne qui décide.

**L'adapter:** Décrivez votre entreprise dans le même style. Plus les chiffres et les objectifs sont précis, plus la stratégie est concrète. Vous pouvez charger des études sectorielles ou des enquêtes clients comme connaissance et les attribuer à l'analyse de l'environnement.

## 5 · Analyse financière {#financial-analysis}
<!-- keywords: finance et investissement, agent de recherche, agent d'analyse, agent de revue -->

**Domaine:** Finance et investissement · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances

Les chiffres des rapports annuels sont vite cités, mais rarement recalculés et mis en perspective. Le workflow extrait les chiffres, calcule exactement marges et croissance et fait examiner le résultat de façon critique.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Une chaîne séquentielle de trois agents : l'agent de recherche organise les chiffres avec période et unité, l'agent d'analyse calcule les indicateurs avec la calculatrice, et l'agent de revue contrôle calculs et logique et résumez le résultat de façon structurée.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Agent de recherche** | Rassemble les chiffres et le contexte des données financières. | Tâche |
| **Agent d'analyse** | Calcule marges, croissance et ratios de solidité avec la calculatrice. (Outils: `calculator`) | Agent de recherche |
| **Agent de revue** | Vérifie l'analyse et la résume de façon structurée. (sortie structurée) | Agent d'analyse, Agent de recherche |

**Entrée:** Les chiffres financiers d'une entreprise sur au moins deux ans, par exemple tirés d'un rapport annuel ou trimestriel, ainsi que les effets exceptionnels connus. Vous pouvez coller les chiffres ou les joindre en fichier Excel, CSV ou PDF ; le fichier d'exemple contient les indicateurs de la tâche de test.

**Fichiers d'exemple:** `Indicateurs_Exemple_Industries.xlsx`

**Cas de test:** Indicateurs dans le texte; Indicateurs en fichier Excel

**Résultat:** Un examen structuré avec synthèse, principaux indicateurs, erreurs ou risques relevés, limites de l'analyse et indication de la validité de l'analyse, aussi en PDF et en fichier Excel. L'agent de recherche propose les chiffres extraits pour la connaissance ; seul ce que vous confirmez est adopté. Le résultat n'est pas un conseil en investissement.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'agent de recherche extrait les chiffres, l'agent d'analyse calcule chaque indicateur avec la calculatrice et l'agent de revue contrôle les calculs et la logique par rapport aux chiffres extraits. Son avis oui/non indique si l'analyse est jugée correcte ; cet avis n'arrête pas l'exécution et ne déclenche pas de nouveau calcul, si bien que les erreurs trouvées restent visibles dans le résultat. Une personne décide de la connaissance : les chiffres extraits ne sont repris que si vous les confirmez. Le résultat n'est pas un conseil en investissement ; avant toute décision, une personne responsable des chiffres devrait le vérifier.

**Pourquoi cette architecture:** Chaque étape a besoin du résultat de la précédente : sans chiffres propres, pas d'indicateurs corrects, et sans indicateurs, rien à contrôler. C'est pourquoi une chaîne stricte convient mieux qu'un travail en parallèle ou un orchestrateur. Calculer avec la calculatrice plutôt qu'avec le modèle de langage et faire contrôler le résultat par un agent distinct évitent des indicateurs plausibles mais faux. La revue reçoit aussi les chiffres extraits et peut ainsi remonter chaque indicateur jusqu'à sa source.

**L'adapter:** Joignez directement le rapport annuel ou votre tableau d'indicateurs. D'autres indicateurs, comme le taux d'endettement ou le free cash-flow, s'ajoutent dans le prompt système de l'agent d'analyse. Pour de nombreuses entreprises à la suite, utilisez le traitement par lots avec une ligne par entreprise.

## 6 · Article de blog {#blog-article}
<!-- keywords: marketing et contenu, brief, rédacteur, relecture -->

**Domaine:** Marketing et contenu · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** fichiers de résultat

Les bons articles naissent d'un brief clair : qui les lit, sous quel angle et avec quels messages clés. Le workflow travaille comme une petite rédaction et vérifie le résultat avant publication.

**Comment les agents collaborent:** Un modèle rapide établit un brief structuré avec public, angle, plan et messages clés. Le rédacteur en tire l'article ; une vérification qualité intégrée contrôle qu'il suit le plan et répond aux questions des lecteurs, et le renvoie sinon une fois en révision. Une relecture rapide vérifie longueur et lisibilité avec l'outil de statistiques de texte et signale les affirmations non vérifiées.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Brief** | Définit public, angle, plan et messages clés dans un brief structuré. (sortie structurée) | Sujet |
| **Rédacteur** | Rédige l'article à partir du brief. (avec contrôle qualité) | Brief |
| **Relecture** | Vérifie longueur et lisibilité et livre la version finale. (Outils: `text_statistics`) | Rédacteur |

**Entrée:** Un sujet en une phrase. Vous pouvez ajouter le public, le ton ou la longueur souhaitée directement dans l'entrée.

**Cas de test:** Sujet en une phrase

**Résultat:** Un article terminé en Markdown avec intertitres, une méta-description et de courtes notes de relecture avec le nombre de mots et les affirmations à étayer avant publication. L'exécution enregistre aussi le résultat en fichier Markdown et HTML que vous pouvez reprendre dans votre CMS.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : brief, article et relecture s'enchaînent ; aucune étape n'attend une personne. Une vérification qualité distincte évalue l'article selon deux critères (suit le plan, répond aux questions des lecteurs) et, si l'un n'est pas rempli, le fait réviser une fois par le rédacteur. La relecture ne modifie pas le contenu ; elle signale les affirmations qui demandent une source. L'article est un projet : c'est vous qui décidez s'il est publié et où.

**Pourquoi cette architecture:** Un seul brief structuré remplace deux planificateurs parallèles dont le rédacteur devait concilier les résultats : le plan était auparavant établi sans connaître le public. Désormais, public, angle, plan et messages clés partent d'une même idée et parviennent au rédacteur sous forme de champs bien séparés. Le rédacteur dispose d'une vérification qualité avec révision automatique, car c'est là que naissent la plupart des faiblesses. En tant qu'exemple pour débutants, le workflow reste volontairement une courte chaîne sans embranchements, boucles ni validations, pour que chaque étape puisse être suivie dans l'exécution.

**L'adapter:** Changez le sujet dans l'entrée. Vous pouvez charger votre guide de style comme connaissance et l'attribuer au rédacteur et à la relecture. La longueur souhaitée se règle dans le prompt système du rédacteur, le nombre de parties ou de messages clés dans le prompt système du brief.

## 7 · Préparer une offre personnalisée {#sales-offer}
<!-- keywords: vente, analyste des besoins, conseiller solution, rédacteur d'offre -->

**Domaine:** Vente · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Avancé · **Éléments:** validation, boucle de révision, formulaire de saisie, fichiers de résultat, fichiers en entrée

Une bonne offre répond au besoin réel du client, pas seulement à ses mots-clés. Le workflow clarifie le besoin, chiffre une solution adaptée et rédige une offre complète qu'une personne valide.

**Comment les agents collaborent:** L'analyste des besoins distingue les exigences explicites et implicites et rassemble les questions ouvertes. Le conseiller solution compose des positions de la liste de prix et calcule avec la calculatrice, y compris une variante dans le budget. Le rédacteur d'offre rédige l'offre ; une vérification qualité intégrée contrôle l'exhaustivité et les prix. Un formulaire de saisie reprend les données clés (client, échéance, budget, montage le week-end). Une personne valide ensuite le projet ; un refus avec commentaire le renvoie par une boucle au rédacteur d'offre, qui le révise et le soumet de nouveau.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste des besoins** | Dégage les exigences explicites et implicites. | Demande du client |
| **Conseiller solution** | Compose les positions adaptées et calcule avec la calculatrice. (Outils: `calculator`) | Analyste des besoins, Demande du client |
| **Rédacteur d'offre** | Rédige le projet d'offre pour le client. (avec contrôle qualité; Outils: `calculator`) | Analyste des besoins, Conseiller solution |

**Entrée:** La demande du client et votre liste de prix avec remises et conditions. Le formulaire reprend les données clés ; vous pouvez écrire la liste de prix dans le texte ou la joindre en fichier Excel, CSV ou PDF, comme le montre le fichier d'exemple.

**Fichiers d'exemple:** `Liste_prix_mobilier_bureau.xlsx`

**Cas de test:** Demande et liste de prix dans le texte; Liste de prix en fichier Excel

**Résultat:** Un projet d'offre avec lettre d'accompagnement, tableau des positions, totaux, variantes, hypothèses et questions ouvertes. Ce n'est qu'après votre validation que l'exécution enregistre l'offre en PDF et en fichier Word modifiable ; l'envoi au client reste votre étape.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : analyse des besoins, chiffrage et projet s'enchaînent sans attente ; une vérification qualité distincte évalue l'offre selon trois critères (toutes les exigences traitées, prix conformes au chiffrage, points ouverts indiqués) et la fait réviser une fois si nécessaire. Une personne décide ensuite : la validation crée les fichiers, le refus exige un commentaire et renvoie l'offre au rédacteur d'offre avec le projet précédent. La boucle permet au plus trois tours de révision ; ensuite, l'exécution se termine en échec. L'analyse des besoins et le chiffrage du conseiller solution ne sont pas répétés ; si le commentaire modifie des quantités, des remises ou des prestations de livraison, le rédacteur d'offre recalcule les totaux concernés avec la calculatrice. Le workflow n'envoie jamais rien au client.

**Pourquoi cette architecture:** Chaque demande nécessite les mêmes étapes dans le même ordre ; une chaîne fixe convient donc mieux qu'un orchestrateur. Les prix sont calculés avec la calculatrice dans une étape à part, si bien que le rédacteur y reprend les prix catalogue au lieu de les inventer. La boucle à la validation existe parce que les refus portent le plus souvent sur de petites corrections, comme une formulation, une mention de remise ou une question ouverte manquante ; réviser avec le commentaire est plus rapide que tout recommencer. Elle ne ramène volontairement qu'au rédacteur d'offre, qui recalcule avec la calculatrice les quantités ou remises modifiées mais n'ajoute aucun nouveau prix catalogue ; la base vérifiée de la solution reste ainsi intacte.

**L'adapter:** Joignez votre liste de prix actuelle en fichier ; la demande du client suffit alors comme texte. Ajoutez les conditions de paiement et les formulations types dans le prompt système du rédacteur d'offre.

## 8 · Répondre aux demandes clients {#customer-service}
<!-- keywords: service client, classificateur, vérificateur des règles, rédacteur des réponses, désescalade -->

**Domaine:** Service client · **Agents:** 4 · **Schéma:** avec branches · **Niveau:** Débutant · **Éléments:** décision, validation, boucle de révision, formulaire de saisie, fichiers en entrée, connexion MCP facultative

Au service client, de nombreuses demandes arrivent en même temps, et chacune exige la bonne règle, les bonnes données de commande et le bon ton. Le workflow trie les demandes, vérifie règles et délais d'après les données de commande et prépare des réponses à valider.

**Comment les agents collaborent:** Un classificateur rapide classe chaque demande par thème, urgence et humeur. Le vérificateur des règles applique la politique de service et recalcule les délais avec l'outil de dates ; si votre copie est connectée à la boutique, il consulte chaque commande en lecture seule avec get_order, sinon il utilise les données de commande des demandes ou un export de commandes joint. Le rédacteur des réponses rédige les projets ; une vérification qualité contrôle que rien n'est promis au-delà de la politique. Un nœud de décision envoie d'abord les escalades à un agent de désescalade. Chaque brouillon attend une validation ; un refus avec commentaire renvoie les brouillons par une boucle au rédacteur des réponses, qui les révise et les soumet de nouveau à validation (trois tours au plus).

| Agent | Tâche | Reçoit |
|---|---|---|
| **Classificateur** | Classe chaque demande par thème, urgence et humeur. (sortie structurée) | Demandes |
| **Vérificateur des règles** | Applique la politique de service et vérifie les délais avec l'outil de dates. (Outils: `days_between`) | Classificateur, Demandes |
| **Rédacteur des réponses** | Rédige des projets de réponse aimables à valider. (avec contrôle qualité) | Classificateur, Vérificateur des règles, Désescalade |
| **Désescalade** | Prépare la réponse aux clients mécontents et ce qui nécessite une validation. | Escalade ? |

**Entrée:** Plusieurs demandes de clients avec numéros de commande, la date du jour et votre politique de service, en extrait dans le texte ou en fichier (PDF, Word, Markdown) ; le fichier d'exemple contient une politique plus détaillée. Les dates de commande et de livraison viennent des demandes, d'un export de commandes de votre boutique joint (JSON, CSV ou Excel) ou, avec une connexion, directement de la boutique ; l'export d'exemple contient les trois commandes des demandes d'exemple.

**Fichiers d'exemple:** `Politique_service_Cuisine_Modele.pdf`, `Commandes_boutique_Cuisine_Modele.json`

**Cas de test:** Quatre demandes, dont une mécontente; Une question aimable sur un produit; Politique en fichier PDF; Numéros de commande seuls, export de commandes joint

**Résultat:** Pour chaque demande, un classement, la règle applicable avec contrôle du délai et un projet de réponse qu'une personne valide avant l'envoi. La vérification des règles indique d'où viennent les données de commande (boutique, export ou demande) et lesquelles manquent.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : le classement, la décision d'escalade (vers la désescalade lorsqu'au moins un client est mécontent ou demande plus que ce que permet la politique), la vérification des règles et les brouillons ; l'outil de dates calcule les délais, une vérification qualité teste les brouillons selon trois critères (conformité à la politique, ton, aucune promesse) et chaque étape est consignée. Une personne valide chaque brouillon avant tout envoi : un refus exige un commentaire et renvoie les brouillons au rédacteur des réponses ; s'ils sont encore refusés après trois tours au plus, l'exécution se termine en échec. Les réponses restent des brouillons ; rien n'est envoyé automatiquement. La connexion à la boutique est facultative et ne fait que lire : la copie ne reçoit get_order que si vous la connectez à un serveur MCP dont un administrateur a approuvé l'outil en lecture seule ; sinon, elle fonctionne dans un mode hors ligne clairement signalé. Les exécutions sans personne présente (planifications, séries de tests, traitement par lots) ne peuvent pas utiliser d'outils MCP, sauf si un administrateur autorise expressément le MCP sans surveillance.

**Pourquoi cette architecture:** Les étapes s'appuient les unes sur les autres (classer, vérifier, rédiger) : une chaîne fixe avec une branche pour les escalades suffit ; un orchestrateur ajouterait des coûts sans bénéfice, et un modèle rapide suffit pour le classement. Les données de commande passent par une intégration, car elles se trouvent dans la boutique et changent d'heure en heure ; le mode hors ligne avec un export garde l'exemple utilisable sans connexion. La validation avec boucle de révision reste, car les réponses partent vers des clients : le dernier mot revient à une personne.

**Connexion facultative: Boutique en ligne (commandes)** (Outils: `get_order`). Consultation des commandes en lecture seule dans votre boutique via MCP : get_order renvoie les dates de commande et de livraison, le statut, les articles et la dernière note du transporteur d'une commande. Le vérificateur des règles s'en sert pour contrôler les délais d'après de vraies données de commande plutôt que d'après les déclarations des clients.

**Mise en place:** Un administrateur ajoute le serveur MCP de votre boutique sous Outils → Services connectés et approuve son outil get_order en lecture seule. En copiant l'exemple, vous choisissez ce serveur comme connexion ; sans connexion, la copie fonctionne en mode hors ligne. Pour essayer sans boutique, lancez `python -m nodestro_examples.demo_mcp --language fr` sur l'ordinateur où tourne l'application de bureau Nodestro, ajoutez http://127.0.0.1:8765/mcp sous Outils → Services connectés avec le consentement pour un serveur de développement local, approuvez ses outils en lecture seule et choisissez-le en copiant. Le serveur de démonstration ne fait que lire et sert les commandes synthétiques de l'export d'exemple, jamais de vraies données clients. Les exécutions sans personne présente (planifications, séries de tests, traitement par lots) ne peuvent pas utiliser d'outils MCP, sauf si un administrateur autorise expressément le MCP sans surveillance.

**Sans connexion:** Mode hors ligne : aucune boutique n'est connectée. Le vérificateur des règles utilise uniquement les données de commande des demandes ou d'un export de commandes joint et signale celles qui manquent ; il ne consulte rien.

**L'adapter:** Joignez votre politique complète et votre FAQ en fichier, ou chargez-les comme connaissance et attribuez-les au vérificateur des règles si elles s'appliquent durablement. Pour vérifier les commandes en direct, faites configurer l'intégration boutique et choisissez le serveur en copiant l'exemple. Le ton de votre marque (tutoiement ou vouvoiement, formule de politesse) se définit dans le prompt système du rédacteur des réponses. Le traitement par lots traite de nombreuses demandes à la fois, mais les exécutions sans personne présente ne peuvent pas utiliser la connexion à la boutique ; joignez donc un export de commandes aux lots.

## 9 · Publier une offre d'emploi et préparer les entretiens {#hr-recruiting}
<!-- keywords: ressources humaines, profil de poste, offre d'emploi, guide d'entretien, contrôleur d'équité, révision -->

**Domaine:** Ressources humaines · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, validation, fichiers de résultat

Un bon recrutement commence par un profil clair et des entretiens équitables et comparables. Le workflow transforme des notes éparses en profil de poste, offre d'emploi et guide d'entretien, vérifie l'équité de l'ensemble et laisse la validation à une personne.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** L'agent de profil organise les missions et les exigences. À partir de là, l'offre d'emploi et le guide d'entretien sont créés en parallèle. Le contrôleur d'équité vérifie les deux à la recherche de formulations discriminatoires ou non admises, par exemple sur l'âge ou la langue maternelle, et indique ce qu'une personne doit vérifier. S'il émet des objections, un nœud de décision transmet les documents à une révision qui applique ses propositions ; sinon, les premières versions sont conservées. Enfin, le manager qui recrute ou les RH examinent l'offre, le guide, le contrôle d'équité et l'éventuelle révision, puis valident les documents.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Profil de poste** | Organise les missions, les exigences indispensables et souhaitées et les compétences. | Besoin de recrutement |
| **Offre d'emploi** | Rédige une offre d'emploi attrayante et inclusive. | Profil de poste |
| **Guide d'entretien** | Prépare des questions d'entretien structurées avec grilles d'évaluation. | Profil de poste |
| **Contrôleur d'équité** | Vérifie l'offre et le guide à la recherche de discriminations et de questions non admises. (sortie structurée) | Offre d'emploi, Guide d'entretien |
| **Révision** | Applique à l'offre et au guide les modifications proposées par le contrôle d'équité. | Révision nécessaire ? |

**Entrée:** Des notes sur le poste : missions, qualifications souhaitées, équipe, conditions et rémunération.

**Cas de test:** Notes avec des souhaits problématiques

**Résultat:** Profil de poste, offre d'emploi et guide d'entretien avec repères d'évaluation, un contrôle d'équité structuré et, en cas d'objections, une version révisée avec la liste des modifications. L'exécution ne crée le fichier Word qu'après la validation.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : le contrôleur d'équité rend un avis structuré ; si les documents ne sont pas utilisables sans modification, un nœud de décision les envoie en révision, sinon ils passent directement à la validation. La branche suivie est visible dans l'exécution. La décision finale reste à une personne : le manager qui recrute ou les RH vérifient tous les documents lors de la validation ; un refus exige un commentaire et met fin à l'exécution, et seule une validation crée le fichier Word. Le workflow ne produit que des documents : il ne voit, n'évalue ni ne classe jamais de vrais candidats.

**Pourquoi cette architecture:** L'offre et le guide ne dépendent que du profil ; ils sont donc créés en parallèle et contrôlés ensemble, ce qui garde exigences et formulations cohérentes. Le contrôle d'équité agit comme un filtre automatique : la révision ne coûte une étape de plus qu'en cas d'objections. Il n'y a volontairement pas de boucle de contrôle et de révision, car les questions d'équité et de droit ne doivent pas être réglées par le simple accord entre modèles ; la personne qui valide voit côte à côte le contrôle, la révision et les points ouverts. Le tri des candidatures est volontairement exclu, car ce serait une IA à haut risque selon le règlement européen sur l'IA.

**L'adapter:** Remplacez les notes par votre besoin de recrutement. Vous pouvez enregistrer votre marque employeur et vos avantages comme connaissance et les attribuer à l'agent de l'offre. Ajoutez les exigences légales de votre pays au prompt système du contrôleur d'équité. N'étendez pas le workflow au tri, à l'évaluation ou au classement de candidatures sans examen juridique : selon le règlement européen sur l'IA, de tels systèmes sont des IA à haut risque.

## 10 · Transformer une question de recherche en hypothèses {#research-hypotheses}
<!-- keywords: recherche et développement, analyste de la question, coordination de recherche, planificateur d'étude -->

**Domaine:** Recherche et développement · **Agents:** 3 · **Schéma:** adaptatif (orchestration) · **Niveau:** Avancé · **Éléments:** orchestrateur avec équipes, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances, budget et limites

Une bonne recherche commence par une question précise et testable et par les bonnes méthodes. Un essai de matériaux demande une analyse de puissance, une étude par entretiens un plan d'échantillonnage et un formulaire de consentement, et beaucoup de questions demandent les deux. Le workflow analyse la question et laisse une coordination de recherche faire appel exactement aux équipes méthodologiques dont la question a besoin.

**Comment les agents collaborent:** L'analyste de la question la structure et résume les données jointes, car les équipes travaillent sans les fichiers. La coordination de recherche, un orchestrateur, commence toujours par l'équipe hypothèses puis décide : les critères mesurables vont à l'équipe statistique, dont elle fixe le plan d'étude et le seuil de signification comme paramètres ; les expériences et les motifs vont à l'équipe méthodes qualitatives ; les personnes ou les données personnelles font intervenir l'équipe éthique et protection des données. Si une équipe juge une hypothèse non testable, la coordination la renvoie une fois à l'équipe hypothèses. Le planificateur d'étude en fait un plan.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste de la question** | Clarifie l'objectif, les variables, les contraintes et les lacunes de connaissance. | Question de recherche |
| **Coordination de recherche** | Décide de quelles équipes méthodologiques la question a besoin et fixe les paramètres de l'équipe statistique. (Orchestrateur) | Analyste de la question |
| **Planificateur d'étude** | Déduit le plan d'étude de l'analyse et des résultats des équipes méthodologiques. | Analyste de la question, Coordination de recherche |

**Équipes que l'orchestrateur peut mobiliser:**

| Équipe | Tâche | Capacités |
|---|---|---|
| **Équipe hypothèses** | Transforme une question de recherche analysée en hypothèses testables avec hypothèses nulles et prédictions mesurables ; les révise après une critique méthodologique. | hypotheses, operationalisation |
| **Équipe statistique** | Confronte les hypothèses quantitatives aux données, exploite les données préliminaires avec la calculatrice et estime la taille d'échantillon pour un plan, un seuil de signification et une puissance donnés. (Paramètres: Plan d'étude, Seuil de signification α, Puissance visée) | statistics, power analysis, quantitative methods |
| **Équipe méthodes qualitatives** | Planifie entretiens, observations ou groupes de discussion pour des questions sur des expériences, des motifs et des comportements : échantillon, guide et analyse. | qualitative methods, interviews, observation |
| **Équipe éthique et protection des données** | Vérifie les études impliquant des personnes ou des données personnelles : consentement, minimisation des données, anonymisation, implication des représentants du personnel et avis éthique. | research ethics, data protection, informed consent |

**Entrée:** Une question de recherche avec son objectif, les données existantes d'essais préliminaires et les contraintes comme le matériel, le temps et l'équipement. Vous pouvez joindre des données de mesure et des documents ; le fichier d'exemple contient les notes de l'essai préliminaire par plaque.

**Fichiers d'exemple:** `Essai_preliminaire_PL-7.csv`

**Cas de test:** Question et essai préliminaire dans le texte; Données de l'essai préliminaire en CSV; Étude par entretiens sans mesures

**Résultat:** Un plan d'étude avec hypothèses, plan, taille d'échantillon, méthode de mesure ou d'entretien, analyse, critères d'arrêt et risques ouverts, également en fichier Word. La vue d'orchestration de l'exécution montre quelles équipes méthodologiques ont participé, avec quels paramètres, et lesquelles ont été écartées et pourquoi. Le planificateur propose le plan pour les connaissances ; vous décidez s'il est enregistré.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : la coordination décide quelles équipes méthodologiques travaillent et remplit le formulaire de l'équipe statistique (plan, seuil de signification, puissance) ; chaque décision est consignée avec sa raison. Limites : au plus 7 décisions, chaque équipe au plus deux fois, un budget de 4 USD par exécution. Aucune étape n'attend une personne ; le plan est un projet pour la personne responsable de la recherche.

**Pourquoi cette architecture:** Une chaîne fixe exécuterait toujours une critique statistique, même pour une étude par entretiens où il n'y a rien à calculer, et n'impliquerait l'éthique que si quelqu'un y pensait. La coordination choisit selon la question et transmet à l'équipe statistique des paramètres structurés plutôt que du texte libre, de sorte que l'analyse de puissance calcule avec un plan défini. L'analyse et le plan final restent des étapes fixes : toute étude en a besoin.

**L'adapter:** Remplacez la question et l'essai préliminaire par les vôtres et joignez directement les données de mesure. Ajoutez vos lignes directrices statistiques à l'agent de l'équipe statistique. Si votre domaine a besoin d'une autre équipe méthodologique, par exemple une équipe laboratoire, enregistrez-la comme workflow avec une description claire et ajoutez-la aux équipes de la coordination.

## 11 · Revue de code avec tests {#code-review}
<!-- keywords: développement logiciel, analyste de bugs, contrôleur de sécurité, correction et tests -->

**Domaine:** Développement logiciel · **Agents:** 3 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

Un second regard trouve les bugs avant qu'ils n'arrivent en production. Le workflow vérifie en même temps le code à la recherche d'erreurs de logique et de problèmes de sécurité, et livre une version améliorée avec tests.

**Comment les agents collaborent:** L'analyste de bugs et le contrôleur de sécurité travaillent en parallèle sur le même code. L'agent d'amélioration réunit les constats et écrit du code corrigé et des tests pytest ; une vérification qualité intégrée s'assure que chaque constat est traité et couvert par des tests.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste de bugs** | Cherche les erreurs de logique, les cas limites et les écarts par rapport à la description. | Code source |
| **Contrôleur de sécurité** | Vérifie le code à la recherche de vulnérabilités et de pratiques dangereuses. | Code source |
| **Correction et tests** | Écrit du code corrigé et des tests pytest pour tous les constats. (avec contrôle qualité) | Analyste de bugs, Contrôleur de sécurité, Code source |

**Entrée:** Un extrait de code avec un court contexte : langage, finalité et environnement, ou un projet entier en archive ZIP ou en fichiers isolés dans le champ de fichier. Les archives sont seulement lues, jamais exécutées. Le code reste inchangé dans son langage ; les explications apparaissent dans la langue de l'interface. Le fichier d'exemple est un petit projet Python avec des erreurs intégrées.

**Fichiers d'exemple:** `calculateur-remises.zip`

**Cas de test:** Extrait de code dans le texte; Projet en archive ZIP

**Résultat:** Une liste de constats triée par gravité, le code corrigé et des tests pytest couvrant chaque constat, aussi en fichier Markdown. Les tests ne sont pas exécutés automatiquement ; lancez-les en local.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : une vérification qualité par un second modèle confronte la réponse de Correction et tests à trois critères (chaque constat traité, un test par constat corrigé, code complet sans espace réservé) ; si un critère échoue, l'agent révise sa réponse une fois, et le résultat de la vérification est consigné avec l'exécution. La vérification juge le texte, elle n'exécute pas le code. Aucune étape n'attend une personne, aucun budget propre n'est défini (le budget par défaut de votre espace de travail s'applique) et les archives envoyées sont seulement lues, jamais exécutées. Le code corrigé et les tests sont une proposition : relisez-les et lancez les tests en local avant d'adopter quoi que ce soit.

**Pourquoi cette architecture:** Les bugs et les problèmes de sécurité sont deux regards indépendants sur le même code : l'analyste de bugs et le contrôleur de sécurité travaillent donc en parallèle, sans s'attendre ; l'agent de correction reçoit en plus le code d'origine pour réunir leurs constats et supprimer les doublons. La vérification qualité avec une révision existe parce qu'en fusionnant deux revues, on oublie typiquement un constat ou un test. Une coordination n'a volontairement pas été utilisée, car chaque revue a besoin des deux regards ; l'exécution du code ou des tests dans le workflow a aussi été écartée, pour que du code inconnu ne tourne jamais sur la plateforme.

**L'adapter:** Joignez votre projet en ZIP ou collez du code en précisant le langage et le framework. Pour d'autres langages, adaptez le framework de test dans l'agent de correction, par exemple Jest ou JUnit. Vos règles de codage peuvent être enregistrées comme connaissance. Via l'API du workflow, la revue peut aussi être déclenchée depuis un pipeline CI.

## 12 · Structurer un contrat et repérer les points à vérifier {#contract-review}
<!-- keywords: droit et administration, structureur de contrat, explicateur de clauses, analyste des points à vérifier, synthèse du contrat, clauses critiques -->

**Domaine:** Droit et administration · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances, fichiers de connaissances

Les contrats sont longs et les clauses importantes se cachent dans les détails. Qu'une clause soit acceptable dépend en outre des règles propres à l'entreprise. Le workflow structure un contrat, l'explique en langage simple et le confronte au guide de négociation contractuelle (playbook) du client, afin qu'une personne qualifiée voie tout de suite où il s'en écarte. Il ne remplace pas un conseil juridique.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Le structureur relève parties, durée, prestations et délais. Sur cette base, l'explicateur de clauses (langage simple) et l'analyste des points à vérifier travaillent en parallèle ; tous deux lisent eux-mêmes le contrat, en texte ou en fichier chargé. L'analyste recherche chaque clause dans le playbook de l'entreprise, cite la section du playbook et classe la clause en standard, position de repli, écart ou ligne rouge. S'il trouve une ligne rouge ou une autre clause critique, un nœud de décision ajoute un examen approfondi de ces clauses. L'agent de rapport rassemble le tout dans une synthèse structurée avec des questions pour un conseil juridique.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Structureur de contrat** | Relève les parties, l'objet, la durée, les prix et les délais. | Texte du contrat |
| **Explicateur de clauses** | Explique chaque clause en langage simple. | Structureur de contrat, Texte du contrat |
| **Analyste des points à vérifier** | Confronte chaque clause au playbook du client et repère les dispositions inhabituelles, déséquilibrées ou manquantes. (sortie structurée) | Structureur de contrat, Texte du contrat |
| **Synthèse du contrat** | Réunit explications et points à vérifier en un aperçu structuré. (sortie structurée) | Explicateur de clauses, Analyste des points à vérifier, Clauses critiques |
| **Clauses critiques** | Examine en profondeur les clauses critiques et prépare des questions de négociation. | Clauses critiques ? |

**Entrée:** Le contrat en fichier (PDF, Word, Markdown ou texte) dans le champ « Contrat en fichier » ou en texte, idéalement avec les numéros d'articles. Vous chargez le fichier directement au démarrage ; le contrat n'a pas sa place dans la collection de connaissances. Le playbook provient de la collection de connaissances ; le playbook fictif de Commerce Exemple SARL est fourni. Le fichier d'exemple contient le contrat fictif de la tâche de test.

**Fichiers d'exemple:** `Contrat_service_logiciel_exemple.docx`

**Cas de test:** Contrat dans le texte, avec clauses critiques; Contrat en fichier Word, sans texte; Contrat de maintenance équilibré

**Résultat:** Une synthèse structurée avec résumé, données clés, clauses expliquées, points à vérifier et questions pour un avocat ou une avocate, aussi en PDF et en fichier Word modifiable. Chaque point à vérifier indique la section du playbook à laquelle il a été comparé, et les sujets sur lesquels le playbook est muet sont signalés comme tels. Le structureur propose les données clés du contrat pour la connaissance, par exemple pour un registre des contrats ; seul ce que vous confirmez est enregistré. Le résultat est une aide de travail et non un conseil juridique.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'analyste des points à vérifier classe chaque clause d'après le playbook et compte les clauses critiques ; toute ligne rouge compte comme critique. Si ce nombre est supérieur à zéro, le nœud de décision ajoute l'examen approfondi des clauses critiques, sinon il est omis. Aucune étape n'attend une personne et le workflow n'envoie rien. La synthèse et ses questions servent de base à l'examen par un avocat ou une avocate ; ce qui est négocié, ce sont les personnes concernées qui le décident.

**Pourquoi cette architecture:** Expliquer et vérifier sont indépendants l'un de l'autre et s'exécutent donc en parallèle sur la structure. Le playbook est une connaissance interrogeable plutôt que du texte dans le prompt : le service juridique le tient à jour en un seul endroit, la recherche n'apporte que la section pertinente et la citation rend chaque classement traçable. L'examen approfondi est une branche, car il ne vaut son coût que lorsqu'une ligne rouge est franchie. Aucun orchestrateur n'a été utilisé, car chaque contrat demande les mêmes étapes.

**Fichiers de connaissances (synthétiques, créés lors de la copie):** Playbook_contrats_Commerce_Exemple: Guide de négociation contractuelle fictif de Commerce Exemple SARL pour les contrats logiciels et cloud : position standard, repli et ligne rouge par sujet.

**L'adapter:** Chargez votre contrat en fichier au démarrage ou collez-le. Remplacez le playbook fictif de la collection de connaissances par le vôtre, de préférence avec la même structure par sujet : position standard, position de repli acceptable et ligne rouge. Les sujets qui comptent pour vous, comme l'assurance ou les droits d'audit, il suffit de les ajouter au playbook ; l'analyste les trouve par la recherche.

## 13 · Créer un plan d'apprentissage personnel {#learning-plan}
<!-- keywords: éducation et formation, bilan d'apprentissage, planificateur d'apprentissage, tuteur, auteur du quiz -->

**Domaine:** Éducation et formation · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, mémoire

On apprend mieux avec un plan qui part de là où l'on en est. Le workflow crée un plan d'apprentissage personnel, explique les premiers thèmes et vérifie la compréhension avec un quiz.

**Comment les agents collaborent:** Le bilan d'apprentissage détermine le point de départ et les lacunes, le planificateur en tire un plan hebdomadaire. Sur cette base, le tuteur (contenus de la semaine choisie, appuyés si vous le souhaitez sur vos supports de cours) et l'auteur du quiz (contrôle des connaissances avec corrigé) travaillent en parallèle. Le résultat contient les trois parties. Le bilan d'apprentissage et le planificateur partagent une mémoire : ils lisent d'abord la progression des semaines précédentes et la mettent à jour à la fin, si bien que chaque semaine s'appuie sur la précédente.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Bilan d'apprentissage** | Détermine le point de départ, l'objectif d'apprentissage et les lacunes. | Objectif d'apprentissage |
| **Planificateur d'apprentissage** | Crée un plan hebdomadaire avec objectifs et exercices. | Bilan d'apprentissage |
| **Tuteur** | Explique les contenus de la première semaine avec exemples et exercices. | Planificateur d'apprentissage, Objectif d'apprentissage |
| **Auteur du quiz** | Crée un contrôle des connaissances avec réponses pour la première semaine. | Planificateur d'apprentissage |

**Entrée:** Qui apprend, l'objectif, le temps disponible, les connaissances préalables et le style d'apprentissage préféré. Dans le formulaire, vous choisissez la semaine à élaborer et pouvez joindre vos propres supports ; le fichier d'exemple est un court guide sur les tableaux croisés dynamiques. À partir de la deuxième semaine, ajoutez une courte note sur le déroulement de la semaine passée (résultat du quiz, ce qui a été difficile) ; le niveau, les objectifs, les thèmes terminés et les difficultés des semaines précédentes sont mémorisés.

**Fichiers d'exemple:** `Guide_rapide_tableaux_croises.docx`

**Cas de test:** Semaine 1 sans support; Semaine 2 avec support de cours

**Résultat:** Un plan d'apprentissage sur quatre semaines avec des objectifs par semaine, des explications claires avec exercices pour la semaine choisie et un quiz avec corrigé et explications, aussi en PDF à imprimer.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : au début de chaque exécution, le bilan d'apprentissage et le planificateur lisent la mémoire « learning-progress » et la mettent à jour à la fin. Elle contient le niveau, les objectifs, les thèmes terminés, les difficultés et le plan sous forme résumée, mais aucune donnée personnelle sensible. La mémoire appartient à votre copie et se conserve d'une exécution à l'autre ; dans l'éditeur du workflow, vous voyez et supprimez ses entrées dans la mémoire de l'un ou l'autre des deux agents, par exemple pour corriger une entrée erronée ou recommencer avec un autre apprenant. La première semaine, la mémoire est vide et le workflow travaille uniquement à partir de votre description. Aucune étape n'attend une personne : le plan, les explications et le quiz sont des propositions que vous adaptez à votre rythme.

**Pourquoi cette architecture:** L'apprentissage s'étend sur plusieurs semaines, mais chaque exécution repart de zéro. Sans mémoire, vous devriez décrire votre progression chaque semaine, et le plan serait refait entièrement au lieu de s'appuyer sur la semaine précédente. La mémoire porte exactement cet état qui évolue ; les supports de cours qui ne changent pas relèvent en revanche de la connaissance. Seuls le bilan et le planificateur mémorisent, car ils décident de la suite ; le tuteur et l'auteur du quiz travaillent en parallèle sur la semaine choisie du plan et n'ont pas besoin d'historique propre.

**L'adapter:** Décrivez votre propre objectif ; cela fonctionne pour presque tous les sujets. Pour les semaines suivantes, relancez le workflow et changez la semaine dans le formulaire. Les supports que vous utilisez durablement peuvent être chargés comme connaissance et attribués au tuteur.

## 14 · Vérifier un budget familial et économiser {#household-budget}
<!-- keywords: particuliers – finances, analyste budgétaire, conseiller en économies, contrôle de réalisme -->

**Domaine:** Particuliers – finances · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

En fin de mois, il reste souvent moins que prévu. Le workflow recalcule un budget familial, trouve des potentiels d'économies et vérifie si les propositions sont réalistes au quotidien.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** L'analyste budgétaire calcule totaux, excédent et parts par catégorie avec la calculatrice. Le conseiller en économies estime des économies concrètes, également recalculées. Le contrôle de réalisme reçoit les deux résultats, vérifie la faisabilité et livre un résultat structuré.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste budgétaire** | Calcule revenus, dépenses, excédent et parts avec la calculatrice. (Outils: `calculator`) | Budget du foyer |
| **Conseiller en économies** | Trouve des pistes d'économies concrètes et estime leur effet. (Outils: `calculator`) | Analyste budgétaire, Budget du foyer |
| **Contrôle de réalisme** | Vérifie la faisabilité des propositions et les résume. (sortie structurée) | Analyste budgétaire, Conseiller en économies |

**Entrée:** Les revenus, les dépenses fixes et variables d'un foyer et un objectif d'épargne. Au lieu de tout saisir, vous pouvez joindre des relevés bancaires ou un cahier de comptes en fichier CSV ou Excel ; le fichier d'exemple contient un mois fictif.

**Fichiers d'exemple:** `Releve_bancaire_mars_2026.csv`

**Cas de test:** Budget dans le texte; Relevé bancaire en CSV

**Résultat:** Un bilan budgétaire structuré avec l'excédent mensuel actuel, le potentiel d'économies, des mesures, des premières étapes rapides et des remarques, aussi en fichier Excel. Il ne remplace pas un conseil financier ni un accompagnement en cas de surendettement.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'analyste budgétaire et le conseiller en économies calculent chaque total avec la calculatrice, et le contrôle de réalisme renvoie des champs fixes (excédent mensuel, potentiel d'économies, mesures, premières étapes, remarques) repris dans le fichier Excel. L'exemple est marqué comme sensible : chaque agent a pour consigne de nommer les points qu'une personne qualifiée doit vérifier et de ne pas paraître plus sûr que les données ne le permettent. Il n'y a ni étape de validation ni révision automatique ; aucun budget propre n'est défini (le budget par défaut de votre espace de travail s'applique). Rien n'est viré, résilié ni réservé : le résultat est une aide pour vos propres décisions, pas un conseil financier ni un accompagnement en cas de surendettement.

**Pourquoi cette architecture:** Chaque étape s'appuie sur la précédente : les économies ne peuvent être estimées qu'une fois le budget connu, et vérifiées qu'une fois les deux disponibles, une chaîne fixe suffit donc. La calculatrice garantit des chiffres calculés plutôt que devinés, et les champs structurés rendent l'excédent et le potentiel comparables d'une exécution à l'autre. Plutôt qu'une boucle, un contrôle de réalisme distinct et léger a été choisi, car son rôle est d'écarter les idées irréalistes, pas de peaufiner le texte. Volontairement non utilisés : une connexion bancaire et une mémoire, afin que les données de compte personnelles ne soient transmises que sous forme de fichier pour cette seule exécution et ne soient pas conservées d'une exécution à l'autre.

**L'adapter:** Joignez vos propres relevés bancaires ou saisissez vos chiffres ; ajoutez vos priorités personnelles, comme « on garde la voiture », dans le texte. Les relevés bancaires contiennent des données personnelles : ils restent chez vous et ne sont transmis au modèle que pour cette exécution.

## 15 · Planifier un voyage personnel {#travel-plan}
<!-- keywords: particuliers – voyages, planificateur d'itinéraire, planificateur budgétaire, planificateur d'organisation, documents de voyage -->

**Domaine:** Particuliers – voyages · **Agents:** 4 · **Schéma:** avec branches · **Niveau:** Débutant · **Éléments:** décision, formulaire de saisie, fichiers de résultat

Un bon voyage correspond aux intérêts, au budget et aux contraintes de tous les voyageurs. Le workflow planifie un itinéraire, recalcule le budget et crée une checklist pour l'organisation.

**Comment les agents collaborent:** Le planificateur d'itinéraire conçoit un programme jour par jour selon les intérêts et les contraintes. Le planificateur budgétaire calcule les nuits et les coûts avec la calculatrice et l'outil de dates. Le planificateur d'organisation réunit tout en un plan de voyage avec checklist ; une vérification qualité contrôle le budget et les contraintes. Un formulaire de saisie reprend destination, dates, voyageurs et budget. Pour les voyages à l'étranger, un nœud de décision ajoute une liste des documents et des règles d'entrée.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Planificateur d'itinéraire** | Conçoit un programme quotidien selon les intérêts et les contraintes. | Souhaits de voyage |
| **Planificateur budgétaire** | Calcule les nuits et les coûts avec la calculatrice et l'outil de dates. (Outils: `calculator`, `days_between`) | Planificateur d'itinéraire |
| **Planificateur d'organisation** | Réunit itinéraire et budget en un plan de voyage avec checklist. (avec contrôle qualité) | Planificateur d'itinéraire, Planificateur budgétaire, Documents de voyage |
| **Documents de voyage** | Liste documents, assurance et règles d'entrée pour les voyages à l'étranger. | Étranger ? |

**Entrée:** Qui voyage, destination et dates, budget, centres d'intérêt et contraintes.

**Cas de test:** Voyage en famille à Lisbonne (étranger); Week-end dans son propre pays

**Résultat:** Un plan de voyage avec programme journalier, tableau budgétaire et check-list, aussi en PDF à emporter. Les prix et horaires sont des estimations issues de connaissances générales et doivent être vérifiés avant de réserver, car le workflow n'utilise pas de données en temps réel.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : le nœud de décision lit le champ « Voyage à l'étranger » du formulaire et ne fait travailler l'agent Documents de voyage que s'il est coché ; le planificateur budgétaire compte les nuits avec l'outil de dates et additionne les coûts avec la calculatrice. Une vérification qualité par un second modèle confronte le plan du planificateur d'organisation à trois critères (dans le budget, toutes les contraintes respectées, informations non vérifiées signalées) ; si l'un échoue, le plan est révisé une fois et le résultat de la vérification est consigné avec l'exécution. Aucune étape n'attend une personne et aucun budget propre n'est défini (le budget par défaut de votre espace de travail s'applique). Rien n'est réservé : prix, horaires et règles d'entrée sont des estimations à vérifier avant de réserver.

**Pourquoi cette architecture:** Itinéraire, budget et organisation s'appuient les uns sur les autres et forment donc une chaîne ; seule la liste des documents dépend d'une question oui/non, tranchée par un nœud de décision à partir du formulaire, si bien qu'un week-end dans le pays ne paie pas une liste de passeports. Les nuits et les totaux viennent d'outils, car les erreurs de dates et de calcul sont la faiblesse typique des modèles de langage. Une recherche web en direct n'a volontairement pas été intégrée : ses résultats changent d'un jour à l'autre, les exécutions ne seraient pas reproductibles, l'exemple dépendrait d'un outil serveur payant et ne pourrait pas être transmis tel quel ; à la place, chaque prix est signalé comme estimation, et vous pouvez ajouter vous-même la recherche web.

**L'adapter:** Saisissez vos souhaits de voyage. Si vous voulez des prix et horaires actuels, vous pouvez ajouter l'outil serveur « recherche web » au planificateur d'itinéraire ; il coûte un supplément par recherche.

## 16 · Évaluer une idée d'entreprise {#business-idea}
<!-- keywords: indépendants et créateurs d'entreprise, coach en création, jury d'investisseurs -->

**Domaine:** Indépendants et créateurs d'entreprise · **Agents:** 2 · **Schéma:** adaptatif (orchestration) · **Niveau:** Avancé · **Éléments:** orchestrateur avec équipes, fichiers de résultat, budget et limites

Avant de créer une entreprise, un regard lucide sur le marché, les chiffres et les risques est payant. Mais toutes les idées n'ont pas besoin des mêmes experts : un service de réparation de vélos n'a pas besoin d'une spécialiste des autorisations, une start-up de boissons si. Le workflow laisse une coach en création d'entreprise réunir les bonnes équipes d'experts et un jury d'investisseurs rendre un verdict argumenté.

**Comment les agents collaborent:** La coach en création est un orchestrateur : elle lit l'idée et décide lesquelles des cinq équipes d'experts elle implique. Marché, rentabilité et risques travaillent en parallèle pour chaque idée ; réglementation et exploitation ne s'ajoutent que si l'idée le demande. Si des résultats se contredisent, la coach pose à une équipe une question complémentaire ciblée. Le jury d'investisseurs pèse ensuite tous les rapports et rend un verdict structuré avec une note.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Coach en création** | Décide de quelles équipes d'experts l'idée a besoin, les fait travailler en parallèle et pose des questions complémentaires. (Orchestrateur) | Idée d'entreprise |
| **Jury d'investisseurs** | Pèse le marché, les chiffres et les risques et rend un verdict. (sortie structurée) | Idée d'entreprise, Coach en création |

**Équipes que l'orchestrateur peut mobiliser:**

| Équipe | Tâche | Capacités |
|---|---|---|
| **Équipe marché** | Estime les cibles, la demande, la disposition à payer et la concurrence d'une idée d'entreprise. | market analysis, target groups, competition |
| **Équipe rentabilité** | Calcule la marge sur coûts variables, le point mort, le retour sur investissement et des scénarios d'une idée d'entreprise avec la calculatrice. | profitability, break-even, financial planning |
| **Équipe risques** | Cherche les points faibles d'une idée d'entreprise et des moyens peu coûteux de les tester avant la création. | risk analysis, validation experiments |
| **Équipe réglementation** | Identifie les autorisations, déclarations, règles d'étiquetage et d'hygiène, assurances et obligations de protection des données qui concernent une idée d'entreprise. | regulation, permits, licences, data protection |
| **Équipe exploitation** | Vérifie si une idée d'entreprise peut être réalisée comme décrit : processus, capacité, équipement, fournisseurs et logistique. | operations, technology, logistics, suppliers |

**Entrée:** Une description de l'idée avec l'offre, les cibles, les prix, les coûts, la capacité et les concurrents connus.

**Cas de test:** Service mobile de réparation de vélos; Brasserie de kombucha (aliment réglementé)

**Résultat:** Un verdict structuré (poursuivre, adapter ou abandonner) avec une note, les forces, les risques, les hypothèses à tester et des prochaines étapes concrètes, également sous forme de rapport PDF. Dans l'exécution, la vue d'orchestration montre quelles équipes la coach a choisies, pourquoi, avec quelle mission et ce que chaque équipe a livré.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : la coach décide quelles équipes travaillent, dans quel ordre et avec quelle mission ; chaque décision est consignée avec sa raison. Des limites encadrent cela : au plus 6 décisions, chaque équipe au plus deux fois, au plus 3 équipes en même temps et un budget de 3 USD par exécution. Aucune étape n'attend une personne ; le verdict est la base de votre propre décision.

**Pourquoi cette architecture:** Un workflow fixe ferait soit travailler les cinq équipes à chaque fois et paierait une analyse des autorisations dont un service de vélos n'a pas besoin, soit les omettrait quand elles comptent. La coach fait exactement ce choix, de façon traçable et dans des limites. Le jury reste une étape fixe, car un verdict structuré et comparable ne doit pas dépendre de la façon dont la coach a réparti le travail.

**L'adapter:** Décrivez votre idée avec vos propres chiffres. Pour ajouter un expert, par exemple pour les questions fiscales, enregistrez un workflow avec une description claire et des capacités et ajoutez-le aux équipes de la coach ; elle décide alors seule quand il est utile. Vos propres données de marché peuvent être importées comme connaissances et attribuées à l'analyste de marché de l'équipe marché.

## 17 · Développer une stratégie réseaux sociaux {#creator-strategy}
<!-- keywords: influenceurs et créateurs de contenu, agent de stratégie, développeur d'idées, planificateur de contenu -->

**Domaine:** Influenceurs et créateurs de contenu · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, mémoire

Publier régulièrement demande une direction claire et un plan adapté à son propre budget temps. Le workflow déduit une stratégie des statistiques, rassemble des idées adaptées et planifie la publication.

**Comment les agents collaborent:** Une chaîne de trois agents : l'agent de stratégie définit le positionnement, les piliers de contenu et les objectifs et analyse pour cela les statistiques jointes, le développeur d'idées formule des idées de publication concrètes avec une accroche, et le planificateur de contenu les répartit sur quatre semaines. Le développeur d'idées garde ses propositions en mémoire pour que les exécutions suivantes ne répètent pas les idées. Un contrôle qualité vérifie que la fréquence et le mix sont réalistes.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Agent de stratégie** | Définit le positionnement, les piliers de contenu et des objectifs mesurables. | Profil du créateur |
| **Développeur d'idées** | Développe des idées de publications concrètes avec accroche et format. | Agent de stratégie |
| **Planificateur de contenu** | Répartit les idées dans un plan réaliste sur quatre semaines. (avec contrôle qualité) | Agent de stratégie, Développeur d'idées |

**Entrée:** Profil avec plateformes, chiffres, publications à succès, audience, objectifs, temps disponible et date de début. Vous pouvez aussi joindre des statistiques en captures d'écran ou en export CSV/Excel ; le fichier d'exemple est un tel export.

**Fichiers d'exemple:** `Statistiques_publications_mars.csv`

**Cas de test:** Profil dans le texte; Profil avec export de statistiques

**Résultat:** Un calendrier éditorial sur quatre semaines avec date, plateforme, format, idée, accroche et appel à l'action, précédé d'un court résumé de la stratégie, aussi en fichier Excel pour continuer la planification.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : le développeur d'idées lit la mémoire « creator-ideas » avant de commencer et, à la fin de chaque exécution, y enregistre lui-même les titres provisoires de ses nouvelles idées, sans étape de confirmation ; vous pouvez consulter ou vider la mémoire sous Mémoire. Une vérification qualité par un second modèle confronte le calendrier du planificateur de contenu à trois critères (fréquence adaptée au temps disponible, piliers équilibrés, objectifs soutenus) ; si l'un échoue, le calendrier est révisé une fois et le résultat de la vérification est consigné avec l'exécution. Aucune étape n'attend une personne et aucun budget propre n'est défini (le budget par défaut de votre espace de travail s'applique). Rien n'est publié : le plan est un projet que vous ajustez et publiez vous-même.

**Pourquoi cette architecture:** Stratégie, idées et calendrier s'appuient strictement les uns sur les autres : une chaîne de trois agents suffit donc ; le planificateur de contenu reçoit en plus la stratégie directement pour mesurer le mix à l'aune des piliers. Seul le développeur d'idées a une mémoire, car les idées répétées sont le vrai problème des exécutions mensuelles, alors que la stratégie doit être tirée à chaque fois des chiffres actuels. Volontairement non utilisées : une recherche web de tendances en direct et une connexion aux plateformes, car les résultats de tendances changent chaque jour et rendraient les exécutions ni reproductibles ni transposables, et un projet de plan ne doit pas être publié automatiquement ; la stratégie repose plutôt sur vos propres statistiques.

**L'adapter:** Saisissez votre profil et vos chiffres ou joignez des captures de vos statistiques. Ajoutez votre style de marque et vos sujets tabous dans le prompt système du développeur d'idées. La mémoire « creator-ideas » se trouve sous Mémoire ; videz-la si vous voulez repartir de zéro. Pour un plan mensuel, vous pouvez planifier la copie.

## 18 · Comparer des offres immobilières {#real-estate}
<!-- keywords: immobilier, calculateur de rendement, analyste du bien et de l'emplacement, évaluation opportunités et risques -->

**Domaine:** Immobilier · **Agents:** 3 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

Dans l'immobilier, les chiffres et l'emplacement décident ensemble. Le workflow recalcule rendement et cash-flow, analyse le bien et son emplacement et met en regard opportunités et risques.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Le calculateur de rendement détermine le rendement locatif brut et net et le cash-flow mensuel avec la calculatrice, pendant que l'analyste du bien et de l'emplacement évalue en parallèle l'état, les réserves et l'environnement. L'évaluation réunit les deux dans une comparaison structurée.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Calculateur de rendement** | Calcule rendement, financement et cash-flow avec la calculatrice. (Outils: `calculator`) | Offres |
| **Analyste du bien et de l'emplacement** | Évalue l'état, les réserves, la facilité de location et l'emplacement. | Offres |
| **Évaluation opportunités et risques** | Met en regard les chiffres et l'évaluation du bien et compare de façon structurée. (sortie structurée) | Calculateur de rendement, Analyste du bien et de l'emplacement |

**Entrée:** Au moins deux offres avec prix d'achat, surface, loyer, charges, fonds de travaux et emplacement, ainsi que vos hypothèses de financement. Joignez annonces, procès-verbaux et plans en PDF, Word ou image ; les fichiers d'exemple contiennent une annonce avec extrait de procès-verbal et un plan pour l'offre 2.

**Fichiers d'exemple:** `Annonce_offre_2_immeuble_ancien.pdf`, `Plan_offre_2.png`

**Cas de test:** Deux offres dans le texte; Avec annonce et plan

**Résultat:** Une comparaison structurée avec indicateurs, offre préférée, opportunités, risques et points à vérifier avant une décision, aussi en PDF. Elle ne remplace ni un conseil financier, fiscal ou juridique, ni une visite.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : les deux analyses s'exécutent en parallèle à chaque exécution, et le calculateur de rendement établit chaque indicateur avec la calculatrice, de sorte que chaque calcul reste traçable dans l'exécution. Aucune étape n'attend une personne et aucun contrôle qualité ne retravaille le résultat ; vous pouvez joindre au plus 8 fichiers. Comme les décisions immobilières sont sensibles, tous les agents ont pour consigne de nommer les points qu'une personne qualifiée doit vérifier et de ne pas transmettre plus de certitude que les données n'en permettent. Aucun budget propre n'est défini, c'est le budget par défaut de votre espace de travail qui s'applique ; la comparaison est une aide pour votre propre décision, pas une recommandation d'achat.

**Pourquoi cette architecture:** Rendement et emplacement sont des questions indépendantes : elles sont donc traitées en parallèle, et seule l'évaluation les met en balance ; la structure fixe (comparaison, offre préférée, risques, points à vérifier) rend les offres comparables d'une exécution à l'autre. Un orchestrateur n'apporterait rien, car chaque comparaison a besoin des deux analyses. Il n'y a délibérément pas de recherche web en direct sur les prix affichés ou les niveaux de loyer : les résultats changeraient d'une exécution à l'autre et ne seraient pas traçables, alors que vos annonces, procès-verbaux et un indice des loyers enregistré gardent une base fixe et vérifiable.

**L'adapter:** Saisissez vos offres et vos données de financement et joignez directement annonces, procès-verbaux d'assemblée générale ou plans. Un observatoire des loyers dont vous avez souvent besoin peut être enregistré comme connaissance et attribué à l'analyste du bien et de l'emplacement.

## 19 · Analyser les retards de chantier {#construction-delay}
<!-- keywords: bâtiment et travaux publics, analyste du planning, coordination de chantier, rapport au maître d'ouvrage -->

**Domaine:** Bâtiment et travaux publics · **Agents:** 3 · **Schéma:** adaptatif (orchestration) · **Niveau:** Avancé · **Éléments:** orchestrateur avec équipes, validation, formulaire de saisie, fichiers de résultat, fichiers en entrée, contrat de sortie, budget et limites

Les retards de chantier ont des causes différentes, et chaque cause demande une autre expertise : le gel doit être documenté, un fournisseur en retard appelle une notification d'empêchement à la bonne partie, une modification de projet ordonnée par le maître d'ouvrage peut justifier une prolongation de délai, et un manque de personnel demande un plan d'accélération. Le workflow calcule les écarts et laisse une coordination de chantier faire appel exactement aux équipes spécialisées dont la situation a besoin.

**Comment les agents collaborent:** L'analyste planning calcule avec l'outil de dates le retard de chaque jalon et liste les causes supposées. La coordination de chantier, un orchestrateur, compose d'abord une équipe d'au plus trois parmi les quatre équipes spécialisées puis distribue les missions : l'équipe chantier pour la météo, le sol et les modifications de projet, l'équipe approvisionnement pour les fournisseurs et les sous-traitants, l'équipe réclamations pour les notifications d'empêchement et les prolongations de délai, l'équipe rattrapage pour les mesures d'accélération avec leur coût. Les équipes indépendantes travaillent en parallèle. L'équipe réclamations s'arrête pour une personne : son projet de notification n'est utilisé qu'après visa de la direction de chantier responsable. L'agent de rapport rédige le rapport d'avancement et, avant qu'il n'arrive au maître d'ouvrage, une personne le valide.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste du planning** | Calcule les retards et le chemin critique avec les outils de dates et de calcul. (sortie structurée; Outils: `days_between`, `calculator`) | État du projet |
| **Coordination de chantier** | Compose les équipes spécialisées dont le retard a besoin et distribue leurs missions. (Orchestrateur) | Analyste du planning |
| **Rapport au maître d'ouvrage** | Résume de façon factuelle pour le maître d'ouvrage le planning, les causes, les réclamations et les mesures. | Analyste du planning, Coordination de chantier |

**Équipes que l'orchestrateur peut mobiliser:**

| Équipe | Tâche | Capacités |
|---|---|---|
| **Équipe chantier et conception** | Examine les causes techniques des retards de chantier : météo, sol, modifications de projet et enchaînement des travaux ; attribue des jours de retard avec preuves. | technical causes, design changes, ground conditions, weather |
| **Équipe approvisionnement** | Examine les retards dus aux fournisseurs, aux livraisons de matériaux et à l'effectif des sous-traitants ; attribue des jours de retard avec preuves. | supply chain, subcontractors, material delivery |
| **Équipe réclamations** | Rédige des notifications d'empêchement et évalue les demandes de prolongation de délai pour les retards hors de la sphère de l'entreprise ; une direction de chantier vise le projet. (s'arrête pour une validation) | contract, claims, notice of obstruction |
| **Équipe rattrapage** | Développe des mesures d'accélération pour un chantier en retard avec jours rattrapés, surcoût et nouvelle prévision d'achèvement. | recovery planning, acceleration, cost estimate |

**Entrée:** Un aperçu du planning avec les jalons prévus et réels, des remarques sur les causes, la date du rapport et les conditions contractuelles, sous forme de texte ou de fichiers : planning en Excel, journal de chantier en PDF, photos en images. Les fichiers d'exemple contiennent un planning et un extrait du journal de chantier.

**Fichiers d'exemple:** `Planning_creche_Beau_Soleil.xlsx`, `Journal_chantier_extrait_avril_mai.pdf`

**Cas de test:** Planning dans le texte; Planning et journal de chantier en fichiers

**Résultat:** Un rapport d'avancement factuel avec situation du planning, causes et sphères de responsabilité, notifications et demandes de prolongation, mesures de rattrapage chiffrées, décisions nécessaires et risques ; après validation, en PDF et en fichier Word modifiable. La vue d'orchestration montre quelles équipes la coordination a composées, ce que chacune a livré sous forme de données structurées et pourquoi. Les questions de pénalités contractuelles et de prolongation de délai restent soumises à un examen technique et juridique.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : la coordination choisit au plus trois équipes, en fait travailler au plus deux à la fois et confie à chaque équipe au plus deux missions ; chaque décision de composition et de mission est consignée avec sa raison. Une personne décide deux fois : la direction de chantier vise le projet de notification d'empêchement dans l'équipe réclamations (un refus arrête l'exécution), et une personne valide le rapport d'avancement avant la création des fichiers. Limites : au plus 8 décisions de la coordination, 50 étapes, 40 minutes et 4 USD par exécution.

**Pourquoi cette architecture:** Une chaîne fixe traitait tous les retards de la même façon : un analyste des causes, un planificateur de mesures, que le problème soit le gel ou une notification manquante. Avec la coordination, un retard purement météorologique ne coûte pas d'examen des réclamations, tandis qu'une modification de projet ordonnée par le maître d'ouvrage fait intervenir l'équipe réclamations avec son visa. Les équipes renvoient des résultats structurés (jours, responsabilité, preuves), si bien que le rapport peut les additionner au lieu de reformuler de la prose. Le calcul du planning, le rapport et la validation finale restent des étapes fixes car tout rapport en a besoin.

**L'adapter:** Exportez votre planning depuis votre logiciel de projet en Excel et joignez le journal de chantier et les photos. Adaptez l'équipe réclamations à votre type de contrat (par exemple CCAG Travaux, FIDIC ou vos propres conditions) et saisissez les taux de coût de votre entreprise dans l'équipe rattrapage. Si vous avez besoin d'une autre spécialité, comme les lots techniques, enregistrez-la comme workflow avec une description claire et ajoutez-la aux équipes de la coordination.

## 20 · Développer et calculer une carte {#restaurant-menu}
<!-- keywords: restauration, concepteur de plats, calcul des coûts, rédacteur de la carte -->

**Domaine:** Restauration · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

Une carte doit plaire aux clients et être rentable. Le workflow développe des plats pour une clientèle, calcule le coût matière et les prix et rédige des textes de carte appétissants.

**Comment les agents collaborent:** Une chaîne de trois agents : le concepteur de plats compose des plats avec leurs recettes, le calcul des coûts détermine le coût matière et les prix de vente avec l'outil de calcul, le rédacteur de la carte écrit la carte. Un contrôle qualité vérifie la clientèle, les prix et la mention des allergènes. Le résultat contient le calcul et la carte.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Concepteur de plats** | Assemble des plats adaptés avec recettes et quantités. | Concept |
| **Calcul des coûts** | Calcule coût matière et prix de vente avec la calculatrice. (Outils: `calculator`) | Concepteur de plats, Concept |
| **Rédacteur de la carte** | Rédige la carte du midi avec des descriptions appétissantes. (avec contrôle qualité) | Calcul des coûts, Concepteur de plats |

**Entrée:** Type d'établissement, clientèle, nombre et type de plats, coût matière cible, fourchette de prix et prix d'achat. Vous pouvez coller les prix d'achat ou les joindre en fichier CSV ou Excel, comme le montre le fichier d'exemple.

**Fichiers d'exemple:** `Prix_achat_Moulin_Exemple.csv`

**Cas de test:** Carte du midi avec prix dans le texte; Prix d'achat en CSV

**Résultat:** Un tableau de calcul avec coût matière et prix par plat et une carte du midi finalisée avec de courtes descriptions, aussi en fichier Word pour la mise en page et en fichier Excel avec les tableaux de calcul. Les allergènes et additifs doivent être vérifiés et signalés d'après les recettes réelles.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : les trois étapes s'exécutent toujours dans le même ordre ; le calcul des coûts compte avec l'outil de calcul et reçoit vos prix d'achat directement depuis l'entrée, au plus un fichier CSV ou Excel de 5 Mo maximum. Un contrôle qualité mesure la carte à trois critères (clientèle, prix conformes au calcul, mention des allergènes) ; si l'un échoue, le rédacteur de la carte la retravaille une fois, et le résultat du contrôle est consigné dans l'exécution avec sa justification (s'il échoue encore, le workflow continue et le contrôle est noté comme non réussi). Aucune étape n'attend une personne et aucun budget propre n'est défini, c'est le budget par défaut de votre espace de travail qui s'applique. Carte et calcul sont des brouillons : vous vérifiez les prix, les portions et l'indication des allergènes avant l'impression.

**Pourquoi cette architecture:** Chaque étape s'appuie sur la précédente : pas de calcul sans plats, pas de carte sans prix, d'où une chaîne fixe ; le calcul des coûts reçoit en plus directement la liste de prix, pour ne pas dépendre du concepteur de plats qui répéterait des chiffres. Le contrôle qualité porte sur la carte, car c'est là que les prix peuvent s'écarter du calcul. Délibérément absents : un orchestrateur, car les étapes sont toujours les mêmes, et une recherche web en direct des prix de gros, qui varieraient d'une exécution à l'autre et ne correspondraient pas à votre fournisseur ; votre propre liste de prix rend le calcul reproductible.

**L'adapter:** Joignez votre liste de prix d'achat actuelle et décrivez votre clientèle. Vos fiches techniques peuvent être chargées comme connaissance et attribuées au calcul des coûts ; les règles maison comme les tailles de portions s'ajoutent dans le concepteur de plats. Pour le changement toutes les deux semaines, vous pouvez planifier la copie.

## 21 · Planifier l'assolement d'une exploitation {#farm-planning}
<!-- keywords: agriculture, planificateur de rotation, calcul des marges brutes, contrôle de plausibilité -->

**Domaine:** Agriculture · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

L'assolement doit tenir compte à la fois de la rotation, des sols, des contrats et de la rentabilité. Le workflow propose une rotation, calcule les marges brutes et vérifie le plan au regard de vos propres règles.

**Comment les agents collaborent:** Une chaîne de trois agents : le planificateur de rotation attribue une culture à chaque parcelle, le calcul des marges brutes chiffre chaque parcelle et le total avec la calculatrice, et le contrôle de plausibilité vérifie règles et risques et livre un résultat structuré.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Planificateur de rotation** | Attribue une culture à chaque parcelle selon les règles et le sol. | Données de l'exploitation |
| **Calcul des marges brutes** | Calcule les marges brutes par parcelle et au total avec la calculatrice. (Outils: `calculator`) | Planificateur de rotation, Données de l'exploitation |
| **Contrôle de plausibilité** | Vérifie le plan au regard des règles et des risques et le résume. (sortie structurée) | Planificateur de rotation, Calcul des marges brutes |

**Entrée:** Les parcelles avec surface, sol et précédent, vos règles de planification et vos hypothèses de produits et de charges par hectare. Vous pouvez joindre parcelles et hypothèses en fichier Excel ou CSV ; le fichier d'exemple contient les deux tableaux de la tâche de test.

**Fichiers d'exemple:** `Parcellaire_Ferme_Exemple.xlsx`

**Cas de test:** Exploitation dans le texte; Parcellaire en fichier Excel

**Résultat:** Un plan d'assolement par parcelle avec marge brute, un contrôle des règles, des risques et des questions ouvertes, aussi en fichier Excel. Les exigences réglementaires, par exemple sur la fertilisation ou les conditions d'aides, doivent être vérifiées selon les règles locales en vigueur.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : les trois étapes s'exécutent toujours dans le même ordre ; le calcul des marges brutes chiffre chaque parcelle et le total avec la calculatrice, de sorte que les chiffres restent traçables dans l'exécution. Il n'y a pas de révision automatique : le contrôle de plausibilité ne modifie pas le plan, il liste le contrôle des règles, les risques et les questions ouvertes dans un résultat structuré avec la marge brute totale sous forme de nombre. Aucune étape n'attend une personne ; vous pouvez joindre jusqu'à 3 fichiers de 10 Mo chacun, et aucun budget propre n'est défini, c'est le budget par défaut de votre espace de travail qui s'applique. Le plan est un brouillon que vous vérifiez selon les règles locales en vigueur avant de commander les semences ou de demander des aides.

**Pourquoi cette architecture:** Le choix des cultures vient d'abord, les marges brutes en dépendent et le contrôle a besoin des deux, d'où une chaîne fixe ; le contrôle de plausibilité reçoit en plus directement la rotation pour la confronter à vos règles. Une étape de contrôle distincte qui nomme ouvertement les écarts a été préférée délibérément à une boucle qualité qui réécrirait le plan sans le dire, car les écarts dans une rotation sont des arbitrages qui vous reviennent. Ni recherche web en direct sur les prix ou les exigences, ni orchestrateur : les prix et règles trouvés en ligne changent chaque jour et diffèrent selon la région, vos propres hypothèses gardent le calcul reproductible, et les étapes sont les mêmes pour chaque exploitation.

**L'adapter:** Joignez votre parcellaire et vos données de calcul en Excel et saisissez vos règles de planification. Les analyses de sol dont vous avez besoin chaque année peuvent être chargées comme connaissance et attribuées au planificateur de rotation.

## 22 · Organiser la fête d'une association {#club-event}
<!-- keywords: associations, planificateur du calendrier, planificateur budgétaire, planificateur de la communication, note pour le bureau -->

**Domaine:** Associations · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Débutant · **Éléments:** fichiers de résultat

Les fêtes associatives sont organisées par des bénévoles sur leur temps libre. Le workflow crée le calendrier, les tâches, le budget et la communication, et résumez le tout dans une note pour la réunion du bureau.

**Comment les agents collaborent:** Le planificateur du calendrier et le planificateur budgétaire travaillent en parallèle ; l'un compte à rebours depuis la fête avec l'outil de dates, l'autre calcule le budget avec la calculatrice. Le planificateur de la communication prépare invitations et publications en phase avec le calendrier. La note pour le bureau réunit le tout ; une vérification qualité contrôle l'exhaustivité et les responsabilités.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Planificateur du calendrier** | Planifie à rebours depuis le jour de la fête le calendrier, les tâches et les créneaux. (Outils: `days_between`) | Informations clés |
| **Planificateur budgétaire** | Calcule recettes, dépenses et réserve avec la calculatrice. (Outils: `calculator`) | Informations clés |
| **Planificateur de la communication** | Prépare invitations, publications et communiqué de presse. | Planificateur du calendrier |
| **Note pour le bureau** | Résume planification, budget et communication pour le bureau. (avec contrôle qualité) | Planificateur du calendrier, Planificateur budgétaire, Planificateur de la communication |

**Entrée:** Occasion, date, lieu, nombre d'invités, souhaits de programme, bénévoles, budget et coûts connus.

**Cas de test:** Fête d'été pour l'anniversaire de l'association

**Résultat:** Une note pour le bureau avec calendrier jusqu'à la fête, tâches et responsables, planning des créneaux, budget avec excédent ou déficit, plan de communication et propositions de décision, aussi en fichier Word à envoyer au bureau.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : calendrier et budget sont établis en parallèle ; le planificateur du calendrier compte à rebours depuis la date de la fête avec l'outil de dates et le planificateur budgétaire calcule avec la calculatrice. Une vérification qualité mesure la note pour le bureau à l'exhaustivité, aux responsabilités et à la cohérence avec le budget ; si un critère échoue, la note est retravaillée une fois, et le résultat de la vérification est consigné dans l'exécution avec sa justification (si elle échoue encore, le workflow continue et la vérification est notée comme non réussie). Aucune étape n'attend une personne et rien n'est envoyé ; aucun budget propre n'est défini, c'est le budget par défaut de votre espace de travail qui s'applique. La note est un brouillon dont le bureau adopte ou non les propositions de décision.

**Pourquoi cette architecture:** Calendrier et budget ne dépendent pas l'un de l'autre et sont traités en parallèle, tandis que le planificateur de la communication a besoin du calendrier et vient donc après ; la note pour le bureau réunit le tout. Il n'y a délibérément pas d'étape de validation dans le workflow, car la vraie validation est la réunion du bureau elle-même, ni de connexion à la messagerie ou à un agenda, car les bénévoles envoient eux-mêmes les invitations une fois que le bureau a décidé. Un orchestrateur n'apporterait rien, puisque chaque fête a besoin des mêmes quatre volets.

**L'adapter:** Saisissez les informations clés de votre fête. Les autorisations et conditions varient selon la commune ; ajoutez les exigences connues dans l'entrée. Les logos et modèles d'affiches peuvent être enregistrés comme connaissance.

## 23 · Développer une campagne de dons {#nonprofit-campaign}
<!-- keywords: organisations à but non lucratif, développeur de campagne, analyste d'impact, contrôleur de crédibilité -->

**Domaine:** Organisations à but non lucratif · **Agents:** 3 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, boucle de révision, fichiers de résultat, propositions de connaissances

Les campagnes de dons ont besoin d'une histoire touchante, mais aussi d'affirmations honnêtes sur l'impact. Le workflow développe une campagne, évalue l'impact possible et vérifie si les promesses sont crédibles et éthiquement acceptables.

**Comment les agents collaborent:** Le développeur de campagne et l'analyste d'impact travaillent en parallèle : l'un conçoit le message, les cibles et les actions, l'autre construit un modèle d'impact avec indicateurs et calcule le coût par enfant avec la calculatrice. Le contrôleur de crédibilité vérifie les deux. S'il juge la campagne non crédible, une condition la renvoie au développeur de campagne avec les remarques du contrôle ; la campagne révisée est contrôlée à nouveau, au plus deux fois. Le résultat contient les trois parties.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Développeur de campagne** | Conçoit le message, les cibles, les canaux et le calendrier de la campagne. | Description du projet |
| **Analyste d'impact** | Construit un modèle d'impact avec indicateurs et le coût par enfant. (Outils: `calculator`) | Description du projet |
| **Contrôleur de crédibilité** | Vérifie les affirmations sous l'angle de l'exagération, de l'éthique et des preuves. (sortie structurée) | Développeur de campagne, Analyste d'impact |

**Entrée:** Organisation, projet, résultats obtenus, objectif, besoin de financement, période de campagne et canaux existants.

**Cas de test:** Parrains de lecture à l'école primaire

**Résultat:** Un concept de campagne avec calendrier et projets de textes, un modèle d'impact avec indicateurs et un examen structuré des affirmations exagérées, des remarques éthiques et un plan de mesure de l'impact, aussi en fichier Word. L'analyste d'impact propose son modèle d'impact pour la connaissance, par exemple pour de futures demandes de financement ; seul ce que vous confirmez est enregistré.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'avis oui/non du contrôleur de crédibilité sur la crédibilité décide si la campagne repart en révision ; l'exécution montre quelle branche a été prise. Le développeur de campagne révise au plus deux fois, chaque fois avec les remarques du contrôle et son projet précédent. Si la campagne n'est toujours pas jugée crédible ensuite, l'exécution continue malgré tout jusqu'au résultat, et les remarques du contrôle montrent ce qui reste ouvert. Aucune étape n'attend une personne : les textes et les chiffres sont des projets que votre organisation vérifie avant publication, en particulier les affirmations sur l'impact et les photos d'enfants. Les modèles d'impact proposés ne sont enregistrés comme connaissance que si vous les confirmez.

**Pourquoi cette architecture:** Les problèmes de crédibilité sont mieux corrigés par l'auteur du texte ; c'est pourquoi le contrôle renvoie au développeur de campagne au lieu de seulement lister les problèmes. La boucle est limitée à deux tours : une campagne qui exagère encore après cela a besoin de meilleures preuves de l'organisation, pas de nouvelles reformulations. Le modèle d'impact reste hors de la boucle, car il repose sur les données du projet et non sur les textes de la campagne. Aucune validation n'est prévue, car la campagne reste un projet et est de toute façon publiée en dehors du workflow.

**L'adapter:** Décrivez votre projet et vos résultats aussi honnêtement que possible. Chargez des rapports annuels ou des évaluations comme connaissance et attribuez-les à l'analyste d'impact.

## 24 · Répondre à une demande d'un administré {#citizen-inquiry}
<!-- keywords: institutions publiques, analyse des demandes, préparation des informations, projet de réponse -->

**Domaine:** Institutions publiques · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** validation, boucle de révision, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances, fichiers de connaissances

Les demandes des administrés contiennent souvent plusieurs sujets et doivent recevoir une réponse exacte, claire et sans engagement hâtif. Le workflow décompose la demande, trouve les règles pertinentes de la commune, prépare une réponse et laisse à l'agent instructeur la décision de l'envoyer.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Une chaîne de trois agents et une validation : l'analyse des demandes sépare les sujets et attribue les compétences. La préparation des informations interroge les règles enregistrées de la commune et les documents de la demande, cite les passages utilisés et signale lorsqu'aucune règle ne couvre un sujet. Le projet de réponse rédige une réponse accessible ; une vérification qualité s'assure que seules des règles documentées sont citées et qu'aucun engagement contraignant n'est pris. L'agent instructeur vérifie ensuite la réponse ; un refus avec commentaire la renvoie au projet de réponse pour révision.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyse des demandes** | Sépare les sujets et attribue compétences et urgence. | Demande de l'administré |
| **Préparation des informations** | Interroge les règles de la commune et cite les passages pertinents pour chaque sujet. | Analyse des demandes, Demande de l'administré |
| **Projet de réponse** | Rédige une réponse factuelle et accessible pour validation. (avec contrôle qualité) | Analyse des demandes, Préparation des informations |

**Entrée:** La demande de l'administré, éventuellement avec des informations internes sur le dossier, en texte ou en fichiers. Vous pouvez aussi joindre des photos de la demande. Les règles de la commune proviennent de la collection de connaissances ; un ensemble fictif de règles de Villexemple est fourni. Le fichier d'exemple est une fiche pratique fictive de la commune.

**Fichiers d'exemple:** `Fiche_annexes_et_eclairage.pdf`

**Cas de test:** Abri de jardin et lampadaire; Règles en fichier de fiche pratique

**Résultat:** Un projet de réponse en langage simple avec compétences, prochaines étapes et remarques pour l'agent instructeur ; après validation, aussi en fichier Word pour votre en-tête. Le fichier Word est nettoyé : les données personnelles, comme les noms, adresses, numéros de téléphone et adresses e-mail, ainsi que les identifiants d'accès sont remplacés par des espaces réservés ; vous insérez vous-même les coordonnées du destinataire depuis le dossier. La préparation des informations propose les règles trouvées, avec leur référence, pour la connaissance ; seul ce que vous confirmez est enregistré.

**Ce qui est décidé automatiquement et quand une personne intervient:** Automatique : l'analyse des demandes, la recherche des règles avec citations et la vérification qualité du projet (uniquement des règles documentées, langage simple, aucun engagement contraignant). Une personne décide : l'agent instructeur vérifie chaque réponse avant l'envoi. Un refus exige un commentaire et renvoie le projet avec ce retour au projet de réponse ; après 2 révisions au plus, un nouveau refus fait échouer l'exécution sans fichier. Le workflow n'envoie rien lui-même ; même validée, la réponse reste un projet que l'agent instructeur envoie par les canaux habituels.

**Pourquoi cette architecture:** Chaque demande demande les mêmes étapes ; une chaîne fixe suffit donc, et un orchestrateur n'ajouterait que des coûts. Les règles sont une connaissance interrogeable plutôt que du texte collé dans chaque demande : la préparation des informations trouve les passages pertinents, les cite et remarque quand rien ne correspond. La validation avec boucle de révision existe parce qu'une réponse à un administré a un effet hors de l'administration et que l'agent instructeur connaît le mieux le dossier. Une connexion à la messagerie a été volontairement écartée, afin que l'envoi reste une décision humaine.

**Fichiers de connaissances (synthétiques, créés lors de la copie):** Regles_commune_Villexemple: Règles fictives de la commune de Villexemple sur les annexes, le plan local d'urbanisme n° 17, l'éclairage public, les encombrants, les arbres et le traitement des demandes.

**L'adapter:** Remplacez les règles fictives de la collection de connaissances par vos règlements, fiches pratiques et listes de compétences ; des titres et des numéros clairs rendent les citations précises. Ajoutez en-tête et formule de politesse dans le prompt système du projet de réponse. Pour traiter de nombreuses demandes à la fois, utilisez le traitement par lots.

<!-- examples:end -->

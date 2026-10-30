# Workflows d'exemple

Nodestro fournit 24 workflows multi-agents prêts à l'emploi, un pour chaque domaine d'application typique. Chaque exemple contient des agents avec leurs prompts système, les connexions, une tâche de test préparée avec des données inventées et un résultat clairement décrit. Ce chapitre explique la galerie, la copie et l'adaptation, et décrit chaque exemple séparément.

## La galerie {#galerie}
<!-- keywords: exemples, modèles, galerie, bibliothèque, recommandés, catégories, page d'accueil -->

La galerie se trouve sur la page **Workflows**, sous vos propres workflows et clairement séparée d'eux. Elle présente quelques exemples recommandés et les six catégories. **Voir les 24 exemples** ouvre la galerie complète, elle aussi dans l'espace des workflows.

Dans la galerie complète, vous recherchez par nom, domaine et description et filtrez par catégorie. Chaque carte indique le domaine, le nom, la description, le nombre d'agents, le niveau et le schéma. Les exemples des domaines sensibles portent le badge **Vérification experte**. La [recherche](/docs/start#suche) trouve aussi les exemples.

## Aperçu et copie {#uebernehmen}
<!-- keywords: aperçu, copier, copie, modèle, inchangé, gratuit -->

Un clic sur une carte ouvre l'**aperçu** : le déroulement sous forme de schéma, chaque agent avec son rôle, son modèle, ses outils et les résultats qu'il reçoit, le guide et la tâche de test. L'aperçu n'enregistre rien et n'appelle aucun modèle.

**Copier dans mes workflows** crée votre propre workflow et l'ouvre dans l'éditeur. La copie est indépendante : vous pouvez tout modifier, et le modèle reste toujours inchangé. Si vous copiez un exemple deux fois, vous obtenez deux workflows distincts. La copie commence avec la version 1 dans l'[historique des versions](/docs/workflows#versionen).

Si **Ajouter les cas de test comme série de tests** est coché (par défaut), la copie reçoit aussi une [série de tests](/docs/automatisierung#testreihen) avec les cas de test préparés ; les fichiers d'exemple nécessaires sont enregistrés comme fichiers d'entrée de la copie. La copie ne lance jamais d'exécution, ne crée jamais de [planification](/docs/automatisierung#zeitplaene) et ne publie jamais d'[API](/docs/api-und-export#veroeffentlichen) ; c'est vous qui en décidez ensuite.

Les exemples ne sont jamais créés automatiquement ; seul ce que vous copiez apparaît parmi vos workflows. Les coûts n’apparaissent que lorsque vous exécutez une copie. Les exemples utilisent des modèles d’Anthropic ; ce [fournisseur configuré](/docs/einstellungen#anbieter) suffit, et vous pouvez à tout moment basculer les modèles d’une copie vers un autre fournisseur. Aucun exemple ne nécessite d’autres services, comptes ou sources de données payantes.

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
- **Données actuelles :** pour des informations en temps réel, vous pouvez ajouter l'[outil serveur](/docs/tools#server-tools) de recherche web ; il coûte un supplément par recherche.

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
| 6 | Article de blog | Marketing et contenu | 4 | parallèle |
| 7 | Préparer une offre personnalisée | Vente | 3 | séquentiel |
| 8 | Répondre aux demandes clients | Service client | 5 | avec branches |
| 9 | Publier une offre d'emploi et préparer les entretiens | Ressources humaines | 5 | avec branches |
| 10 | Transformer une question de recherche en hypothèses | Recherche et développement | 4 | séquentiel |
| 11 | Revue de code avec tests | Développement logiciel | 3 | parallèle |
| 12 | Structurer un contrat et repérer les points à vérifier | Droit et administration | 5 | avec branches |
| 13 | Créer un plan d'apprentissage personnel | Éducation et formation | 4 | parallèle |
| 14 | Vérifier un budget familial et économiser | Particuliers – finances | 3 | séquentiel |
| 15 | Planifier un voyage personnel | Particuliers – voyages | 4 | avec branches |
| 16 | Évaluer une idée d'entreprise | Indépendants et créateurs d'entreprise | 4 | parallèle |
| 17 | Développer une stratégie réseaux sociaux | Influenceurs et créateurs de contenu | 3 | séquentiel |
| 18 | Comparer des offres immobilières | Immobilier | 3 | parallèle |
| 19 | Analyser les retards de chantier | Bâtiment et travaux publics | 4 | parallèle |
| 20 | Développer et calculer une carte | Restauration | 3 | séquentiel |
| 21 | Planifier l'assolement d'une exploitation | Agriculture | 3 | séquentiel |
| 22 | Organiser la fête d'une association | Associations | 4 | parallèle |
| 23 | Développer une campagne de dons | Organisations à but non lucratif | 3 | parallèle |
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

**L'adapter:** Déposez un export de votre MES ou de votre tableur dans le champ de fichier ; les longs journaux fonctionnent aussi, car les agents lisent les gros fichiers de façon ciblée. Pour une analyse hebdomadaire, vous pouvez planifier la copie. Dans le prompt système du planificateur d'actions, vous pouvez ajouter votre méthode, par exemple les piliers TPM ou une grille d'évaluation fixe.

## 2 · Traiter une réclamation avec la 8D {#quality-8d}
<!-- keywords: gestion de la qualité, description du problème d1–d3, analyse des causes d4, planification des actions d5–d7, rapport 8d, confinement d'urgence -->

**Domaine:** Gestion de la qualité · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, validation, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances

Les réclamations exigent un confinement rapide et une analyse des causes rigoureuse. La méthode 8D fixe les étapes ; le workflow les parcourt de façon structurée et les documente de manière homogène.

**Comment les agents collaborent:** Une chaîne séquentielle : le premier agent décrit le problème et les actions de confinement (D1 à D3), le deuxième recherche les causes d'apparition et de non-détection (D4), le troisième planifie les actions correctives et préventives (D5 à D7). L'agent de rapport réunit le tout dans un rapport 8D structuré. Un nœud de décision vérifie la gravité : dans les cas critiques, un agent supplémentaire planifie le confinement d'urgence des 24 prochaines heures. Avant que le rapport parte chez le client, une personne le valide.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Description du problème D1–D3** | Décrit l'équipe, le problème (est / n'est pas) et les actions de confinement. (sortie structurée) | Réclamation |
| **Analyse des causes D4** | Recherche les causes d'apparition et de non-détection avec les 5 pourquoi. | Description du problème D1–D3, Réclamation |
| **Planification des actions D5–D7** | Planifie les actions correctives, leur vérification et la prévention. | Analyse des causes D4 |
| **Rapport 8D** | Réunit toutes les étapes dans un rapport 8D structuré. (sortie structurée) | Description du problème D1–D3, Analyse des causes D4, Planification des actions D5–D7, Confinement d'urgence |
| **Confinement d'urgence** | Planifie le confinement des 24 prochaines heures dans les cas critiques. | Gravité |

**Entrée:** La réclamation du client avec pièce, lot, défaut et taux de défaut, ainsi que les informations internes connues sur la fabrication, la matière et le contrôle. Vous pouvez aussi joindre la lettre de réclamation, des données de mesure et des photos du défaut en fichiers ; les fichiers d'exemple contiennent une lettre de réclamation fictive (PDF) et des mesures (Excel).

**Fichiers d'exemple:** `Reclamation_G-220_lot_24-117.pdf`, `Mesures_crochets.xlsx`

**Cas de test:** Réclamation dans le texte; Lettre de réclamation et mesures en fichiers

**Résultat:** Un rapport 8D structuré avec un champ pour chaque discipline D1 à D8 et une liste des points ouverts que l'équipe doit encore clarifier. Après validation, l'exécution enregistre le rapport en PDF et en fichier Word modifiable. L'agent de rapport propose en outre des enseignements pour la connaissance ; seul ce que vous adoptez explicitement est enregistré.

**L'adapter:** Remplacez les données de test par votre réclamation et joignez directement procès-verbaux de contrôle, plans ou photos. Si vous utilisez votre propre formulaire, adaptez les champs de l'agent de rapport sous « Format de sortie ». Les enseignements adoptés lors de réclamations précédentes peuvent être attribués comme connaissance à l'analyse des causes.

## 3 · Comparer des offres fournisseurs {#supplier-comparison}
<!-- keywords: logistique et achats, analyste des coûts, analyste des risques, recommandation d'achat -->

**Domaine:** Logistique et achats · **Agents:** 3 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

Le prix unitaire le plus bas est rarement l'offre la moins chère. Le workflow compare les offres selon le coût total et le risque d'approvisionnement et justifie une recommandation pour les achats.

**Comment les agents collaborent:** L'analyste des coûts et l'analyste des risques travaillent en parallèle. L'un calcule avec la calculatrice le coût total de possession de chaque offre, l'autre évalue délai, dépendances et qualité. La recommandation d'achat pèse les deux et fournit un résultat structuré.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste des coûts** | Calcule le coût total de chaque offre avec la calculatrice. (Outils: `calculator`) | Offres |
| **Analyste des risques** | Évalue délais, dépendances, capacité et risques qualité. | Offres |
| **Recommandation d'achat** | Pèse coûts et risques et recommande un fournisseur. (sortie structurée) | Analyste des coûts, Analyste des risques |

**Entrée:** Plusieurs offres avec prix, fret, délai, quantité minimale, conditions de paiement et données qualité, ainsi que vos coûts internes. Vous pouvez écrire les offres dans le texte ou les joindre en fichiers, même mélangées en PDF, Word et Excel ; les trois fichiers d'exemple montrent exactement cela.

**Fichiers d'exemple:** `Offre_A_Exemple_Precision.pdf`, `Offre_B_Example_Components.docx`, `Offre_C_Modele_Pieces_Metalliques.xlsx`

**Cas de test:** Trois offres dans le texte; Trois offres en PDF, Word et Excel

**Résultat:** Une recommandation structurée avec classement, justifications, risques, points de négociation et hypothèses retenues. L'exécution l'enregistre aussi en rapport PDF et en fichier Excel avec une feuille par liste.

**L'adapter:** Joignez vos offres en fichiers et indiquez le besoin et les coûts dans le texte. Si vous avez des pondérations fixes (par exemple 50 % coût, 30 % risque, 20 % qualité), ajoutez-les dans le prompt système de la recommandation d'achat. Les contrats-cadres ou évaluations fournisseurs peuvent être enregistrés comme connaissance et attribués à l'analyste des risques.

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

**L'adapter:** Joignez directement le rapport annuel ou votre tableau d'indicateurs. D'autres indicateurs, comme le taux d'endettement ou le free cash-flow, s'ajoutent dans le prompt système de l'agent d'analyse. Pour de nombreuses entreprises à la suite, utilisez le traitement par lots avec une ligne par entreprise.

## 6 · Article de blog {#blog-article}
<!-- keywords: marketing et contenu, public, plan, rédacteur, relecture -->

**Domaine:** Marketing et contenu · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Débutant · **Éléments:** fichiers de résultat

Les bons articles naissent d'un public clair et d'un plan réfléchi. Le workflow répartit le travail comme une rédaction et vérifie le résultat avant publication.

**Comment les agents collaborent:** Le public et le plan sont élaborés en parallèle avec un modèle rapide. Le rédacteur en tire l'article ; une vérification qualité intégrée contrôle qu'il suit le plan et répond aux questions des lecteurs. La relecture vérifie longueur et lisibilité avec l'outil de statistiques de texte et signale les affirmations non vérifiées.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Public** | Décrit les lecteurs, leurs questions et ce qu'ils savent déjà. | Sujet |
| **Plan** | Propose le titre et le plan. | Sujet |
| **Rédacteur** | Rédige l'article à partir du plan et du public. (avec contrôle qualité) | Public, Plan |
| **Relecture** | Vérifie longueur et lisibilité et livre la version finale. (Outils: `text_statistics`) | Rédacteur |

**Entrée:** Un sujet en une phrase. Vous pouvez ajouter le public, le ton ou la longueur souhaitée directement dans l'entrée.

**Cas de test:** Sujet en une phrase

**Résultat:** Un article terminé en Markdown avec intertitres, une méta-description et de courtes notes de relecture avec le nombre de mots et les affirmations à étayer avant publication. L'exécution enregistre aussi le résultat en fichier Markdown et HTML que vous pouvez reprendre dans votre CMS.

**L'adapter:** Change le sujet dans l'entrée. Vous pouvez charger votre guide de style comme connaissance et l'attribuer au rédacteur et à la relecture. La longueur souhaitée se règle dans le prompt système du rédacteur.

## 7 · Préparer une offre personnalisée {#sales-offer}
<!-- keywords: vente, analyste des besoins, conseiller solution, rédacteur d'offre -->

**Domaine:** Vente · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Avancé · **Éléments:** validation, formulaire de saisie, fichiers de résultat, fichiers en entrée

Une bonne offre répond au besoin réel du client, pas seulement à ses mots-clés. Le workflow clarifie le besoin, chiffre une solution adaptée et rédige une offre complète.

**Comment les agents collaborent:** L'analyste des besoins distingue les exigences explicites et implicites et rassemble les questions ouvertes. Le conseiller solution compose des positions de la liste de prix et calcule avec la calculatrice, y compris une variante dans le budget. Le rédacteur d'offre rédige l'offre ; une vérification qualité intégrée contrôle l'exhaustivité et les prix. Un formulaire de saisie reprend les données clés (client, échéance, budget, montage le week-end) ; avant l'envoi, une personne valide l'offre.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste des besoins** | Dégage les exigences explicites et implicites. | Demande du client |
| **Conseiller solution** | Compose les positions adaptées et calcule avec la calculatrice. (Outils: `calculator`) | Analyste des besoins, Demande du client |
| **Rédacteur d'offre** | Rédige le projet d'offre pour le client. (avec contrôle qualité) | Analyste des besoins, Conseiller solution |

**Entrée:** La demande du client et votre liste de prix avec remises et conditions. Le formulaire reprend les données clés ; vous pouvez écrire la liste de prix dans le texte ou la joindre en fichier Excel, CSV ou PDF, comme le montre le fichier d'exemple.

**Fichiers d'exemple:** `Liste_prix_mobilier_bureau.xlsx`

**Cas de test:** Demande et liste de prix dans le texte; Liste de prix en fichier Excel

**Résultat:** Un projet d'offre avec lettre d'accompagnement, tableau des positions, totaux, variantes, hypothèses et questions ouvertes. Ce n'est qu'après votre validation que l'exécution enregistre l'offre en PDF et en fichier Word modifiable.

**L'adapter:** Joignez votre liste de prix actuelle en fichier ; la demande du client suffit alors comme texte. Ajoutez les conditions de paiement et les formulations types dans le prompt système du rédacteur d'offre.

## 8 · Répondre aux demandes clients {#customer-service}
<!-- keywords: service client, classificateur, vérificateur des règles, rédacteur des réponses, désescalade, révision -->

**Domaine:** Service client · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Débutant · **Éléments:** décision, validation, formulaire de saisie, fichiers en entrée

Au service client, de nombreuses demandes arrivent en même temps, et chacune exige la bonne règle et le bon ton. Le workflow trie les demandes, vérifie règles et délais et prépare des réponses à valider.

**Comment les agents collaborent:** Un classificateur rapide classe chaque demande par thème, urgence et humeur. Le vérificateur des règles applique la politique de service et recalcule les délais avec l'outil de dates. Le rédacteur des réponses rédige les projets ; une vérification qualité contrôle que rien n'est promis au-delà de la politique. Un nœud de décision envoie d'abord les escalades à un agent de désescalade. Chaque brouillon attend une validation ; un refus avec retour mène à une version révisée.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Classificateur** | Classe chaque demande par thème, urgence et humeur. (sortie structurée) | Demandes |
| **Vérificateur des règles** | Applique la politique de service et vérifie les délais avec l'outil de dates. (Outils: `days_between`) | Classificateur, Demandes |
| **Rédacteur des réponses** | Rédige des projets de réponse aimables à valider. (avec contrôle qualité) | Classificateur, Vérificateur des règles, Désescalade |
| **Désescalade** | Prépare la réponse aux clients mécontents et ce qui nécessite une validation. | Escalade ? |
| **Révision** | Révise les brouillons selon le retour de la validation. | Valider les réponses |

**Entrée:** Plusieurs demandes de clients avec données de commande et de livraison, la date du jour et votre politique de service, en extrait dans le texte ou en fichier (PDF, Word, Markdown) ; le fichier d'exemple contient une politique plus détaillée.

**Fichiers d'exemple:** `Politique_service_Cuisine_Modele.pdf`

**Cas de test:** Quatre demandes, dont une mécontente; Une question aimable sur un produit; Politique en fichier PDF

**Résultat:** Pour chaque demande, un classement, la règle applicable avec contrôle du délai et un projet de réponse qu'une personne valide avant l'envoi.

**L'adapter:** Joignez votre politique complète et votre FAQ en fichier, ou chargez-les comme connaissance et attribuez-les au vérificateur des règles si elles s'appliquent durablement. Le ton de votre marque (tutoiement ou vouvoiement, formule de politesse) se définit dans le prompt système du rédacteur des réponses. Pour traiter de nombreuses demandes à la fois, utilisez le traitement par lots.

## 9 · Publier une offre d'emploi et préparer les entretiens {#hr-recruiting}
<!-- keywords: ressources humaines, profil de poste, offre d'emploi, guide d'entretien, contrôleur d'équité, révision -->

**Domaine:** Ressources humaines · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, fichiers de résultat

Un bon recrutement commence par un profil clair et des entretiens équitables et comparables. Le workflow transforme des notes éparses en profil de poste, offre d'emploi et guide d'entretien, et vérifie l'équité de l'ensemble.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** L'agent de profil organise les missions et les exigences. À partir de là, l'offre d'emploi et le guide d'entretien sont créés en parallèle. Le contrôleur d'équité vérifie les deux à la recherche de formulations discriminatoires ou non admises, par exemple sur l'âge ou la langue maternelle, et indique ce qu'une personne doit vérifier. S'il émet des objections, un nœud de décision transmet les documents à une révision qui applique ses propositions ; sinon, les premières versions sont conservées.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Profil de poste** | Organise les missions, les exigences indispensables et souhaitées et les compétences. | Besoin de recrutement |
| **Offre d'emploi** | Rédige une offre d'emploi attrayante et inclusive. | Profil de poste |
| **Guide d'entretien** | Prépare des questions d'entretien structurées avec grilles d'évaluation. | Profil de poste |
| **Contrôleur d'équité** | Vérifie l'offre et le guide à la recherche de discriminations et de questions non admises. (sortie structurée) | Offre d'emploi, Guide d'entretien |
| **Révision** | Applique à l'offre et au guide les modifications proposées par le contrôle d'équité. | Révision nécessaire ? |

**Entrée:** Des notes sur le poste : missions, qualifications souhaitées, équipe, conditions et rémunération.

**Cas de test:** Notes avec des souhaits problématiques

**Résultat:** Profil de poste, offre d'emploi et guide d'entretien avec repères d'évaluation, un contrôle d'équité structuré et, en cas d'objections, une version révisée avec la liste des modifications, aussi en fichier Word. Les documents doivent être validés par les RH ou une personne compétente avant publication.

**L'adapter:** Remplacez les notes par votre besoin de recrutement. Vous pouvez enregistrer votre marque employeur et vos avantages comme connaissance et les attribuer à l'agent de l'offre. Ajoutez les exigences légales de votre pays au prompt système du contrôleur d'équité. N'étendez pas le workflow au tri, à l'évaluation ou au classement de candidatures sans examen juridique : selon le règlement européen sur l'IA, de tels systèmes sont des IA à haut risque.

## 10 · Transformer une question de recherche en hypothèses {#research-hypotheses}
<!-- keywords: recherche et développement, analyste de la question, développeur d'hypothèses, critique méthodologique, planificateur d'expériences -->

**Domaine:** Recherche et développement · **Agents:** 4 · **Schéma:** séquentiel · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances

Une bonne recherche commence par une question précise et testable. Le workflow décompose une question de recherche, formule des hypothèses, les fait critiquer sur le plan méthodologique et en déduit un plan d'expériences réaliste.

**Comment les agents collaborent:** Une chaîne séquentielle avec retour en arrière : l'analyste clarifie variables et hypothèses de départ, l'agent d'hypothèses formule des hypothèses testables avec hypothèses nulles, le critique méthodologique les confronte aux données préliminaires avec la calculatrice et nomme les facteurs de confusion. Le planificateur d'expériences utilise ensemble les hypothèses et la critique.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste de la question** | Clarifie l'objectif, les variables, les contraintes et les lacunes de connaissance. | Question de recherche |
| **Développeur d'hypothèses** | Formule des hypothèses testables avec prédictions et hypothèses nulles. | Analyste de la question |
| **Critique méthodologique** | Vérifie la testabilité des hypothèses, les facteurs de confusion et les données disponibles. (Outils: `calculator`) | Développeur d'hypothèses, Question de recherche |
| **Planificateur d'expériences** | Déduit un plan d'expériences des hypothèses et de la critique. | Développeur d'hypothèses, Critique méthodologique |

**Entrée:** Une question de recherche avec son objectif, les données d'essais préliminaires et les contraintes comme la matière, le temps et les équipements. Vous pouvez joindre des données de mesure et des documents en fichiers ; le fichier d'exemple contient les notes de l'essai préliminaire par plaque.

**Fichiers d'exemple:** `Essai_preliminaire_PL-7.csv`

**Cas de test:** Question et essai préliminaire dans le texte; Données de l'essai préliminaire en CSV

**Résultat:** Un plan d'expériences avec hypothèses, facteurs et niveaux, taille d'échantillon, méthode de mesure, analyse et critères d'arrêt, ainsi que les risques ouverts, aussi en fichier Word. Le planificateur d'expériences propose le plan pour la connaissance ; c'est vous qui décidez s'il est enregistré.

**L'adapter:** Remplacez la question et l'essai préliminaire par les vôtres et joignez directement les données de mesure. La littérature dont vous avez souvent besoin peut être chargée comme connaissance en mode « Recherche » et attribuée à l'analyste de la question pour qu'il travaille avec des citations. Ajoutez vos règles statistiques au critique méthodologique.

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

**L'adapter:** Joignez votre projet en ZIP ou collez du code en précisant le langage et le framework. Pour d'autres langages, adaptez le framework de test dans l'agent de correction, par exemple Jest ou JUnit. Vos règles de codage peuvent être enregistrées comme connaissance. Via l'API du workflow, la revue peut aussi être déclenchée depuis un pipeline CI.

## 12 · Structurer un contrat et repérer les points à vérifier {#contract-review}
<!-- keywords: droit et administration, structureur de contrat, explicateur de clauses, analyste des points à vérifier, synthèse du contrat, clauses critiques -->

**Domaine:** Droit et administration · **Agents:** 5 · **Schéma:** avec branches · **Niveau:** Avancé · **Éléments:** décision, formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances

Les contrats sont longs et les clauses importantes se cachent dans les détails. Le workflow structure un contrat, l'explique en langage simple et rassemble les points qu'une personne qualifiée devrait vérifier. Il ne remplace pas un conseil juridique.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Le structureur relève parties, durée, prestations et délais. Sur cette base, l'explicateur de clauses (langage simple) et l'analyste des points à vérifier (dispositions inhabituelles ou déséquilibrées) travaillent en parallèle ; tous deux lisent eux-mêmes le contrat, en texte ou en fichier chargé. Si l'analyste trouve des clauses critiques, un nœud de décision ajoute un examen approfondi de ces clauses. L'agent de rapport rassemble le tout dans une synthèse structurée avec des questions pour un conseil juridique.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Structureur de contrat** | Relève les parties, l'objet, la durée, les prix et les délais. | Texte du contrat |
| **Explicateur de clauses** | Explique chaque clause en langage simple. | Structureur de contrat, Texte du contrat |
| **Analyste des points à vérifier** | Repère les dispositions inhabituelles, déséquilibrées ou manquantes. (sortie structurée) | Structureur de contrat, Texte du contrat |
| **Synthèse du contrat** | Réunit explications et points à vérifier en un aperçu structuré. (sortie structurée) | Explicateur de clauses, Analyste des points à vérifier, Clauses critiques |
| **Clauses critiques** | Examine en profondeur les clauses critiques et prépare des questions de négociation. | Clauses critiques ? |

**Entrée:** Le contrat en fichier (PDF, Word, Markdown ou texte) dans le champ « Contrat en fichier » ou en texte, idéalement avec les numéros d'articles. Vous chargez le fichier directement au démarrage ; aucune collection de connaissances n'est nécessaire. Le fichier d'exemple contient le contrat fictif de la tâche de test.

**Fichiers d'exemple:** `Contrat_service_logiciel_exemple.docx`

**Cas de test:** Contrat dans le texte, avec clauses critiques; Contrat en fichier Word, sans texte; Contrat de maintenance équilibré

**Résultat:** Une synthèse structurée avec résumé, données clés, clauses expliquées, points à vérifier et questions pour un avocat ou une avocate, aussi en PDF et en fichier Word modifiable. Le structureur propose les données clés du contrat pour la connaissance, par exemple pour un registre des contrats ; seul ce que vous confirmez est enregistré.

**L'adapter:** Chargez votre contrat en fichier au démarrage ou collez-le. Vos propres critères, par exemple vos exigences minimales en matière de responsabilité ou de protection des données, s'ajoutent dans le prompt système de l'analyste des points à vérifier. Des contrats types servant de comparaison peuvent être enregistrés comme connaissance et attribués à cet analyste.

## 13 · Créer un plan d'apprentissage personnel {#learning-plan}
<!-- keywords: éducation et formation, bilan d'apprentissage, planificateur d'apprentissage, tuteur, auteur du quiz -->

**Domaine:** Éducation et formation · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

On apprend mieux avec un plan qui part de là où l'on en est. Le workflow crée un plan d'apprentissage personnel, explique les premiers thèmes et vérifie la compréhension avec un quiz.

**Comment les agents collaborent:** Le bilan d'apprentissage détermine le point de départ et les lacunes, le planificateur en tire un plan hebdomadaire. Sur cette base, le tuteur (contenus de la semaine choisie, appuyés si vous le souhaitez sur vos supports de cours) et l'auteur du quiz (contrôle des connaissances avec corrigé) travaillent en parallèle. Le résultat contient les trois parties.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Bilan d'apprentissage** | Détermine le point de départ, l'objectif d'apprentissage et les lacunes. | Objectif d'apprentissage |
| **Planificateur d'apprentissage** | Crée un plan hebdomadaire avec objectifs et exercices. | Bilan d'apprentissage |
| **Tuteur** | Explique les contenus de la première semaine avec exemples et exercices. | Planificateur d'apprentissage, Objectif d'apprentissage |
| **Auteur du quiz** | Crée un contrôle des connaissances avec réponses pour la première semaine. | Planificateur d'apprentissage |

**Entrée:** Qui apprend, l'objectif, le temps disponible, les connaissances préalables et le style d'apprentissage préféré. Dans le formulaire, vous choisissez la semaine à élaborer et pouvez joindre vos propres supports ; le fichier d'exemple est un court guide sur les tableaux croisés dynamiques.

**Fichiers d'exemple:** `Guide_rapide_tableaux_croises.docx`

**Cas de test:** Semaine 1 sans support; Semaine 2 avec support de cours

**Résultat:** Un plan d'apprentissage sur quatre semaines avec des objectifs par semaine, des explications claires avec exercices pour la semaine choisie et un quiz avec corrigé et explications, aussi en PDF à imprimer.

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

**L'adapter:** Saisissez vos souhaits de voyage. Si vous voulez des prix et horaires actuels, vous pouvez ajouter l'outil serveur « recherche web » au planificateur d'itinéraire ; il coûte un supplément par recherche.

## 16 · Évaluer une idée d'entreprise {#business-idea}
<!-- keywords: indépendants et créateurs d'entreprise, analyste de marché, calculateur de rentabilité, analyste des risques, jury d'investisseurs -->

**Domaine:** Indépendants et créateurs d'entreprise · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** fichiers de résultat

Avant de créer une entreprise, il vaut la peine de regarder sobrement le marché, les chiffres et les risques. Le workflow fait examiner l'idée par trois experts en même temps et un jury rend un verdict justifié.

**Comment les agents collaborent:** Trois agents travaillent en parallèle : l'analyste de marché estime les cibles et la concurrence, le calculateur de rentabilité détermine le point mort et des scénarios avec la calculatrice, l'analyste des risques cherche les points faibles. Le jury d'investisseurs pèse le tout et livre un verdict structuré avec une note.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste de marché** | Estime les cibles, la demande et la concurrence. | Idée d'entreprise |
| **Calculateur de rentabilité** | Calcule marge sur coûts variables, point mort et scénarios avec la calculatrice. (Outils: `calculator`) | Idée d'entreprise |
| **Analyste des risques** | Cherche les points faibles et les risques de l'idée. | Idée d'entreprise |
| **Jury d'investisseurs** | Pèse le marché, les chiffres et les risques et rend un verdict. (sortie structurée) | Analyste de marché, Calculateur de rentabilité, Analyste des risques |

**Entrée:** Une description de l'idée avec l'offre, les cibles, les prix, les coûts, la capacité et les concurrents connus.

**Cas de test:** Service mobile de réparation de vélos

**Résultat:** Un verdict structuré (poursuivre, adapter ou abandonner) avec une note, des forces, des risques, des hypothèses à vérifier et des prochaines étapes concrètes pour valider l'idée, aussi en rapport PDF.

**L'adapter:** Décrivez votre idée avec vos chiffres. Plus les hypothèses sont honnêtes, plus le verdict est utile. Chargez vos propres données de marché ou résultats d'enquête comme connaissance et attribuez-les à l'analyste de marché.

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

**L'adapter:** Saisissez vos offres et vos données de financement et joignez directement annonces, procès-verbaux d'assemblée générale ou plans. Un observatoire des loyers dont vous avez souvent besoin peut être enregistré comme connaissance et attribué à l'analyste du bien et de l'emplacement.

## 19 · Analyser les retards de chantier {#construction-delay}
<!-- keywords: bâtiment et travaux publics, analyste du planning, analyste des causes, planificateur de contre-mesures, rapport au maître d'ouvrage -->

**Domaine:** Bâtiment et travaux publics · **Agents:** 4 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** validation, formulaire de saisie, fichiers de résultat, fichiers en entrée

Les retards de chantier s'accumulent et les maîtres d'ouvrage ont vite besoin d'une vision claire. Le workflow calcule les écarts, classe les causes, développe des contre-mesures et rédige un rapport d'avancement.

**Comment les agents collaborent:** L'analyste du planning et l'analyste des causes travaillent en parallèle. L'un calcule retards et marges avec les outils de dates et de calcul, l'autre classe les causes par domaine de responsabilité et besoin de documentation ; tous deux analysent aussi les plannings, journaux de chantier et photos joints. Le planificateur de contre-mesures élabore des options d'accélération et l'agent de rapport résume le tout pour le maître d'ouvrage. Avant que le rapport ne quitte l'équipe projet, une personne le valide.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyste du planning** | Calcule retards, marges et conséquences avec l'outil de dates et la calculatrice. (Outils: `days_between`, `calculator`) | État du projet |
| **Analyste des causes** | Classe les causes par domaine de responsabilité et besoin de documentation. | État du projet |
| **Planificateur de contre-mesures** | Développe des mesures d'accélération avec coût et effet. | Analyste du planning, Analyste des causes |
| **Rapport au maître d'ouvrage** | Résume de façon factuelle la situation du planning, les causes et les mesures. | Analyste du planning, Planificateur de contre-mesures, Analyste des causes |

**Entrée:** Un planning avec jalons prévus et réels, remarques sur les causes, date du rapport et conditions contractuelles, en texte ou en fichiers : planning en Excel, journal de chantier en PDF, photos en image. Les fichiers d'exemple contiennent un planning et un extrait du journal de chantier.

**Fichiers d'exemple:** `Planning_creche_Beau_Soleil.xlsx`, `Journal_chantier_extrait_avril_mai.pdf`

**Cas de test:** Planning dans le texte; Planning et journal de chantier en fichiers

**Résultat:** Un rapport d'avancement factuel avec situation du planning, causes, contre-mesures, décisions à prendre et risques. Après validation, l'exécution l'enregistre en PDF et en fichier Word modifiable. Les questions de pénalités et de prolongation de délai restent soumises à un examen technique et juridique.

**L'adapter:** Exportez votre planning depuis votre logiciel de projet en Excel et joignez le journal de chantier et les photos. Pour un rapport régulier, vous pouvez planifier la copie ; la validation vous attend alors.

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

**L'adapter:** Joignez votre liste de prix d'achat actuelle et décrivez votre clientèle. Vos fiches techniques peuvent être chargées comme connaissance et attribuées au calcul des coûts ; les règles maison comme les tailles de portions s'ajoutent dans le concepteur de plats. Pour le changement toutes les deux semaines, vous pouvez planifier la copie.

## 21 · Planifier l'assolement d'une exploitation {#farm-planning}
<!-- keywords: agriculture, planificateur de rotation, calcul des marges brutes, contrôle de plausibilité -->

**Domaine:** Agriculture · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Avancé · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée

L'assolement doit tenir compte à la fois de la rotation, des sols, des contrats et de la rentabilité. Le workflow propose une rotation, calcule les marges brutes et vérifie le plan au regard de vos propres règles.

**Comment les agents collaborent:** Une chaîne de trois agents : le planificateur de rotation attribuez une culture à chaque parcelle, le calcul des marges brutes chiffre chaque parcelle et le total avec la calculatrice, et le contrôle de plausibilité vérifie règles et risques et livre un résultat structuré.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Planificateur de rotation** | Attribue une culture à chaque parcelle selon les règles et le sol. | Données de l'exploitation |
| **Calcul des marges brutes** | Calcule les marges brutes par parcelle et au total avec la calculatrice. (Outils: `calculator`) | Planificateur de rotation, Données de l'exploitation |
| **Contrôle de plausibilité** | Vérifie le plan au regard des règles et des risques et le résume. (sortie structurée) | Planificateur de rotation, Calcul des marges brutes |

**Entrée:** Les parcelles avec surface, sol et précédent, vos règles de planification et vos hypothèses de produits et de charges par hectare. Vous pouvez joindre parcelles et hypothèses en fichier Excel ou CSV ; le fichier d'exemple contient les deux tableaux de la tâche de test.

**Fichiers d'exemple:** `Parcellaire_Ferme_Exemple.xlsx`

**Cas de test:** Exploitation dans le texte; Parcellaire en fichier Excel

**Résultat:** Un plan d'assolement par parcelle avec marge brute, un contrôle des règles, des risques et des questions ouvertes, aussi en fichier Excel. Les exigences réglementaires, par exemple sur la fertilisation ou les conditions d'aides, doivent être vérifiées selon les règles locales en vigueur.

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

**L'adapter:** Saisissez les informations clés de votre fête. Les autorisations et conditions varient selon la commune ; ajoutez les exigences connues dans l'entrée. Les logos et modèles d'affiches peuvent être enregistrés comme connaissance.

## 23 · Développer une campagne de dons {#nonprofit-campaign}
<!-- keywords: organisations à but non lucratif, développeur de campagne, analyste d'impact, contrôleur de crédibilité -->

**Domaine:** Organisations à but non lucratif · **Agents:** 3 · **Schéma:** parallèle · **Niveau:** Avancé · **Éléments:** fichiers de résultat, propositions de connaissances

Les campagnes de dons ont besoin d'une histoire touchante, mais aussi d'affirmations honnêtes sur l'impact. Le workflow développe une campagne, évalue l'impact possible et vérifie si les promesses sont crédibles et éthiquement acceptables.

**Comment les agents collaborent:** Le développeur de campagne et l'analyste d'impact travaillent en parallèle : l'un conçoit le message, les cibles et les actions, l'autre construit un modèle d'impact avec indicateurs et calcule le coût par enfant avec la calculatrice. Le contrôleur de crédibilité vérifie les deux ; le résultat contient les trois parties.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Développeur de campagne** | Conçoit le message, les cibles, les canaux et le calendrier de la campagne. | Description du projet |
| **Analyste d'impact** | Construit un modèle d'impact avec indicateurs et le coût par enfant. (Outils: `calculator`) | Description du projet |
| **Contrôleur de crédibilité** | Vérifie les affirmations sous l'angle de l'exagération, de l'éthique et des preuves. (sortie structurée) | Développeur de campagne, Analyste d'impact |

**Entrée:** Organisation, projet, résultats obtenus, objectif, besoin de financement, période de campagne et canaux existants.

**Cas de test:** Parrains de lecture à l'école primaire

**Résultat:** Un concept de campagne avec calendrier et projets de textes, un modèle d'impact avec indicateurs et un examen structuré des affirmations exagérées, des remarques éthiques et un plan de mesure de l'impact, aussi en fichier Word. L'analyste d'impact propose son modèle d'impact pour la connaissance, par exemple pour de futures demandes de financement ; seul ce que vous confirmez est enregistré.

**L'adapter:** Décrivez votre projet et vos résultats aussi honnêtement que possible. Chargez des rapports annuels ou des évaluations comme connaissance et attribuez-les à l'analyste d'impact.

## 24 · Répondre à une demande d'un administré {#citizen-inquiry}
<!-- keywords: institutions publiques, analyse des demandes, préparation des informations, projet de réponse -->

**Domaine:** Institutions publiques · **Agents:** 3 · **Schéma:** séquentiel · **Niveau:** Débutant · **Éléments:** formulaire de saisie, fichiers de résultat, fichiers en entrée, propositions de connaissances

Les demandes des administrés contiennent souvent plusieurs sujets et doivent recevoir une réponse exacte, claire et sans engagement hâtif. Le workflow décompose la demande, trouve les règles pertinentes dans les informations fournies et prépare une réponse.

> Vérification experte : les résultats sont des aides au travail et doivent être vérifiés par une personne qualifiée.

**Comment les agents collaborent:** Une chaîne de trois agents : l'analyse des demandes sépare les sujets et attribuez les compétences, la préparation des informations recherche les règles pertinentes uniquement dans l'extrait fourni, et le projet de réponse rédige une réponse accessible. Une vérification qualité s'assure que seules des règles documentées sont citées et qu'aucun engagement contraignant n'est pris.

| Agent | Tâche | Reçoit |
|---|---|---|
| **Analyse des demandes** | Sépare les sujets et attribue compétences et urgence. | Demande de l'administré |
| **Préparation des informations** | Recherche les règles pertinentes uniquement dans les informations fournies. | Analyse des demandes, Demande de l'administré |
| **Projet de réponse** | Rédige une réponse factuelle et accessible pour validation. (avec contrôle qualité) | Analyse des demandes, Préparation des informations |

**Entrée:** La demande de l'administré et les informations internes, règles et compétences pertinentes, en extrait dans le texte ou en fichiers. Vous pouvez aussi joindre des photos de la demande. Le fichier d'exemple est une fiche pratique fictive de la commune.

**Fichiers d'exemple:** `Fiche_annexes_et_eclairage.pdf`

**Cas de test:** Abri de jardin et lampadaire; Règles en fichier de fiche pratique

**Résultat:** Un projet de réponse en langage simple avec compétences, prochaines étapes et remarques pour l'agent instructeur, aussi en fichier Word pour votre en-tête. La préparation des informations propose les règles trouvées, avec leur référence, pour la connaissance afin que les demandes ultérieures puissent s'en servir ; seul ce que vous confirmez est enregistré. Le projet doit être vérifié et validé avant envoi.

**L'adapter:** Joignez vos règlements et fiches pratiques ou chargez-les durablement comme connaissance (mode « Recherche » avec citations) et attribuez-les à la préparation des informations. Ajoutez en-tête et formule de politesse dans le prompt système du projet de réponse. Pour traiter de nombreuses demandes à la fois, utilisez le traitement par lots.

<!-- examples:end -->

# Skills

Les skills sont des instructions au format ouvert Agent Skills qu’un agent charge lorsque sa tâche en a besoin. Ce chapitre explique ce que contient une skill, comment importer et modifier des skills et ce que fait Nodestro pour les sécuriser.

## Qu’est-ce qu’une skill {#ueberblick}
<!-- keywords: skill, agent skills, SKILL.md, instructions, en-tête, front matter, références -->

Une skill est un dossier contenant un fichier `SKILL.md` et, en option, d’autres fichiers dans `scripts/`, `references/` et `assets/`. `SKILL.md` commence par un en-tête (nom, description et champs facultatifs comme la licence ou la compatibilité), suivi des instructions en Markdown. La description indique au modèle quand la skill est utile.

Toutes les skills de l’espace de travail se trouvent sur la page [Skills](/skills). Chaque carte affiche le statut, la version, l’origine (personnelle, importée ou fournie) et si la skill contient des scripts. Vous attribuez une skill à un agent dans une version fixe, comme décrit dans la [bibliothèque d’agents](/docs/agenten#bibliothek) ; une version plus récente n’est jamais utilisée automatiquement.

## Importer une skill {#import}
<!-- keywords: importer, zip, SKILL.md, rapport de validation, essai, nouvelle version -->

Choisissez **Importer une skill**, puis un fichier ZIP contenant un dossier de skill ou un seul fichier `SKILL.md`. Nodestro vérifie d’abord le fichier et n’enregistre encore rien. Le rapport de validation liste les **erreurs**, qui empêchent l’importation, et les **avertissements**, qui informent seulement, par exemple sur un nom qui ne suit pas la spécification ou sur des scripts. En dessous, vous voyez le nom, la description, les instructions et les fichiers que l’importation enregistrerait.

Si une skill du même nom existe déjà, l’importation enregistre le fichier comme sa prochaine version au lieu d’en créer une seconde.

## Versions, modification et statut {#versionen}
<!-- keywords: version, modifier, copier, renommer, exporter, activer, désactiver, archiver, supprimer -->

Chaque modification est enregistrée comme une nouvelle version ; un enregistrement sans modification garde la version. Dans les détails d’une skill, vous pouvez modifier le texte de `SKILL.md` (les autres fichiers restent inchangés), consulter les versions précédentes, voir quels agents utilisent la skill et télécharger n’importe quelle version en fichier ZIP.

Le nom d’une skill ne peut pas être modifié par édition : copiez plutôt la skill sous un nouveau nom. Une skill **désactivée** reste attribuée, mais les agents qui l’utilisent ne s’exécutent plus tant que vous ne la réactivez pas. Une skill que des agents utilisent encore ne peut pas être supprimée ; **archivez-la** plutôt. L’archivage et la suppression sont réservés aux administrateurs.

## Sécurité {#sicherheit}
<!-- keywords: sécurité, non fiable, scripts, allowed-tools, identifiants, injection de prompt -->

Une skill importée provient d’une source inconnue. Nodestro transmet ses instructions au modèle comme contenu non fiable, et les scripts d’une skill ne sont **jamais exécutés**. Une skill n’accorde jamais d’outils : le champ `allowed-tools` est affiché mais ignoré, et les outils viennent uniquement des paramètres de l’agent. Vérifiez le contenu d’une skill importée avant de l’utiliser avec des outils qui écrivent ou modifient des données. Si un fichier semble contenir des identifiants, le rapport de validation vous avertit ; retirez-les avant de partager ou d’exporter la skill.

## Groupes de skills {#gruppen}
<!-- keywords: groupe, groupe de skills, ajouter un groupe, membres, service -->

Un groupe réunit des skills souvent utilisées ensemble, par exemple toutes les skills d’un service. Sur la page [Skills](/skills), passez à **Groupes** pour créer, modifier et supprimer des groupes et choisir leurs skills.

Dans les paramètres d’un agent, **Ajouter un groupe** ajoute chaque skill active du groupe que l’agent n’a pas encore : chacune dans sa version actuelle et chargée au besoin. Les skills désactivées ou archivées et celles que l’agent possède déjà sont ignorées. Le groupe n’est qu’une étiquette : chaque skill reste attribuée séparément, et une modification ultérieure du groupe ne change pas l’agent.

## Nombreuses skills : présélection {#vorauswahl}
<!-- keywords: présélection, nombreuses skills, limite, 100, plus pertinentes, score, BM25 -->

Un agent peut avoir jusqu’à 100 skills. Tant qu’au plus 20 d’entre elles sont chargées au besoin, chaque étape les propose toutes à l’agent. Au-delà de 20, chaque étape ne propose que les 8 skills les plus adaptées à la tâche, plus chaque skill réglée sur **Toujours** et chaque skill recommandée par un orchestrateur. Nodestro compare la tâche avec le nom et la description de chaque skill : une description claire aide donc.

Dans les détails d’une exécution, **Choix des skills** indique pour chaque étape quelles skills ont été proposées et s’il y a eu une présélection. Pour une présélection, il affiche aussi le score de chaque skill.

## Recommandations de l’orchestrateur {#empfehlungen}
<!-- keywords: orchestrateur, recommandation, skills recommandées, équipe, exécution d’équipe -->

Un orchestrateur peut recommander des skills lorsqu’il lance une équipe. Ces skills sont alors toujours proposées aux agents de l’équipe, s’ils les possèdent. Une recommandation n’attribue jamais de skill : une skill recommandée qu’un agent ne possède pas apparaît comme non attribuée dans le choix des skills. Les détails d’une exécution d’équipe affichent les skills recommandées en haut.

## Utilisation {#nutzung}
<!-- keywords: utilisation, statistiques, chargée, proposée, taux de réussite, contrôles, dernière utilisation -->

Sur la page [Skills](/skills), **Utilisation** indique pour les 7, 30 ou 90 derniers jours combien de fois chaque skill a été proposée et chargée, dans combien d’exécutions, combien de ces exécutions ont réussi, combien de contrôles qualité ont été réussis et quand la skill a été utilisée pour la dernière fois. Ces chiffres sont un indice, pas une preuve : une skill chargée dans une exécution réussie n’a pas forcément causé ce succès.

## Transformer des scripts en outils {#skripte}
<!-- keywords: script, outil, Coding Agent, bac à sable, Docker, approuver, vérifier, origine -->

Les scripts d’une skill ne sont jamais exécutés. Pour en utiliser un malgré tout, choisissez **Utiliser comme outil …** à côté du fichier dans `scripts/`. Le Coding Agent écrit alors un outil avec des tests à partir du script. Les tests s’exécutent uniquement dans le bac à sable Docker isolé ; sans lui, rien ne démarre. Une personne vérifie ensuite le code et les tests sur la page [Outils](/tools) et approuve l’outil. D’ici là, aucun agent ne peut l’utiliser. L’outil indique de quel script de skill il provient.

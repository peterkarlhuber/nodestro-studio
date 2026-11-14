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

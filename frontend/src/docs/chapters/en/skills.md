# Skills

Skills are instructions in the open Agent Skills format that an agent loads when its task needs them. This chapter explains what a skill contains, how you import and edit skills, and what Nodestro does to keep them safe.

## What a skill is {#ueberblick}
<!-- keywords: skill, agent skills, SKILL.md, instructions, front matter, references, assets -->

A skill is a folder with a `SKILL.md` file and optional further files in `scripts/`, `references/` and `assets/`. `SKILL.md` starts with a front matter block (name, description and optional fields such as license or compatibility), followed by the instructions in Markdown. The description tells the model when the skill is useful.

All skills of the workspace are on the [Skills](/skills) page. Each card shows the status, the version, the origin (own, imported or shipped) and whether the skill contains scripts. You assign a skill to an agent in one fixed version, as described in the [agent library](/docs/agenten#bibliothek); a newer version is never used automatically.

## Importing a skill {#import}
<!-- keywords: import, zip, SKILL.md, validation report, dry run, new version -->

Choose **Import skill** and pick a ZIP file with one skill folder or a single `SKILL.md` file. Nodestro checks the file first and stores nothing yet. The validation report lists **errors**, which block the import, and **warnings**, which only inform, for example about a name that does not follow the specification or about scripts. Below the report you see the name, the description, the instructions and the files the import would store.

If a skill with the same name already exists, the import stores the file as the next version of that skill instead of creating a second one.

## Versions, editing and status {#versionen}
<!-- keywords: version, edit, copy, rename, export, activate, disable, archive, delete, in use -->

Every change is stored as a new version; a save without changes keeps the version. In the details of a skill you can edit the text of `SKILL.md` (the other files stay as they are), look at older versions, see which agents use the skill and download any version as a ZIP file.

The name of a skill cannot be changed by editing: copy the skill under a new name instead. A **disabled** skill stays assigned, but agents that use it do not run until you activate it again. A skill that agents still use cannot be deleted; **archive** it instead. Archiving and deleting are for administrators.

## Security {#sicherheit}
<!-- keywords: security, untrusted, scripts, allowed-tools, credentials, prompt injection -->

An imported skill comes from an unknown source. Nodestro gives its instructions to the model as untrusted content, and scripts in a skill are **never run**. A skill never grants tools: the `allowed-tools` field is shown but ignored, and tools come only from the agent's settings. Check the content of an imported skill before you use it with tools that write or change data. If a file seems to contain a credential, the validation report warns you; remove it before you share or export the skill.

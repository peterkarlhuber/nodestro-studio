# Interface terminology

The canonical words for Nodestro's core concepts in each interface language. UI strings
(`frontend/src/i18n/locales/<lang>/*.json`) and the in-app docs (`frontend/src/docs/chapters/<lang>/*.md`)
use these terms. Agent prompts inside examples are content, not interface text, and are not bound by this list.

Rules that apply to every language:

- A page is named exactly as in the navigation (`nav.json`). A text that sends the user to a page quotes that
  label ("on the Approvals page"). `src/i18n/i18n.test.tsx` checks this for the Approvals page.
- Counted texts use i18next plural forms (`_one`/`_other`; `_many` is derived from `_other` for es, fr, it and
  pt-BR in `src/i18n/resources.ts`). Texts with several numbers use the form "label: number".
- Address form: de "du", en "you", es "tú", fr "vous", it "tu", pt-BR "você".
- Technical API names stay as they are in every language: Tool choice (`tool_choice`), Request options (JSON),
  Tokens, Trace, MCP, API, SDK, Base64. Brand names: Nodestro, Nodestro Studio, Nodestro Assistant.

## Navigation groups

| Group | en | de | es | fr | it | pt-BR |
|---|---|---|---|---|---|---|
| Build | Build | Erstellen | Crear | Créer | Crea | Criar |
| Run & review | Run & review | Ausführen & prüfen | Ejecutar y revisar | Exécuter et vérifier | Esegui e verifica | Executar e revisar |
| Automate & test | Automate & test | Automatisieren & testen | Automatizar y probar | Automatiser et tester | Automatizza e testa | Automatizar e testar |
| Help | Help | Hilfe | Ayuda | Aide | Aiuto | Ajuda |

## English (en)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | workflow | flow |
| One execution of a workflow; the page listing them | run; page "Runs" | execution, "Executions" |
| Human decision step and the page | approval, approval step; page "Approvals" | |
| Approving a tool call before unattended runs | advance approval | pre-grant |
| Optional test check before publishing | release gate | |
| Agent, tool, knowledge, memory | agent, tool, knowledge, memory | |
| Test series, batch run, schedule | test series, batch run, schedule | test suite |
| Interface assistant | Assistant (button), Nodestro Assistant (product) | |

## German (de)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | Workflow | Arbeitsablauf |
| One run; the page listing them | Lauf (plural Läufe); page "Ausführungen" | "Ausführung" for a single run in new texts |
| Human decision step, tool-call decision, the page | Freigabe, Freigabeschritt; page "Freigaben"; Vorab-Freigabe | Genehmigung |
| Approving packages or tool code | freigeben (Python-Pakete freigeben) | |
| Optional test check before publishing | Veröffentlichungsprüfung | Freigabe-Gate, Gate |
| Workspace (server tenant) | Arbeitsbereich | Workspace |
| Interface assistant | Assistant (button), Nodestro Assistant | Assistent as a label |

"Freigabe" means one thing in the interface: a person lets something through (a run step, a tool call, a package).
The release gate is a check, so it is a "Prüfung", not a "Freigabe".

## Spanish (es)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | flujo de trabajo (plural flujos de trabajo); sub-workflow: subflujo | workflow |
| Run; the page | ejecución; page "Ejecuciones" | run |
| Approval; the page | aprobación; page "Aprobaciones"; aprobación previa | autorización, liberación |
| Release gate | control de publicación | |
| Run timeline | Cronología | Desarrollo |
| Interface assistant | Asistente | Assistant |

## French (fr)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | workflow | flux de travail |
| Run; the page | exécution; page "Exécutions" | run |
| Human decision on a step or a tool call; the page | validation; page "Validations"; validation anticipée | approbation (for these decisions) |
| Approving packages or tool code | approuver, approbation | |
| Release gate | contrôle de publication (masculine: "un contrôle") | |
| Address form | vous, imperative "-ez" | tu, ton, ta, tes |
| Interface assistant | Assistant | |

## Italian (it)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | workflow | flusso |
| Run; the page | esecuzione; page "Esecuzioni" | run |
| Approval; the page | approvazione; page "Approvazioni"; approvazione anticipata | convalida |
| Release gate | controllo di pubblicazione | |
| Interface assistant | Assistente | Assistant |

## Portuguese, Brazil (pt-BR)

| Concept | Term | Avoid |
|---|---|---|
| Workflow | fluxo de trabalho (plural fluxos de trabalho); sub-workflow: subfluxo | workflow |
| Run; the page | execução; page "Execuções" | run |
| Approval; the page | aprovação; page "Aprovações"; aprovação antecipada | liberação, autorização |
| Release gate | controle de publicação | |
| Interface assistant | Assistente | Assistant |

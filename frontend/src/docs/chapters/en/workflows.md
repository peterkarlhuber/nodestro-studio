# Workflows

A workflow connects agents into a pipeline. This chapter explains how to create workflows, connect nodes, how data flows between agents and how to start a run.

## Creating and managing workflows {#anlegen}
<!-- keywords: new workflow, create, delete, duplicate, copy, overview, continue, recent runs, teams, team badge, no ai model, gallery, start here, level -->

The **Workflows** page shows all workflows as cards with the number of agents, the last change and the status of the last run.

Three equal ways to start are on the page: **Create with AI** opens the new-workflow dialog with the [Workflow Architect](/docs/ki-architekt#neu-erstellen), **Start from an example** opens the [example gallery](/docs/beispiele) and **Build it yourself** opens the same dialog for an empty workflow. While there is no workflow they appear as large tiles, afterwards as a narrow **Start new** row above the list.

**Without an AI model:** if no AI provider is set up for the default model yet, a notice above the large tiles says that workflows only run once an AI model is connected (an API key or a local model server such as Ollama), with the link **Set up in Settings**. The example then comes first, because a copy needs no model, and *Create with AI* is marked *Needs a connection to an AI model*. The dialog says so too when you choose *Create with AI* there: the Workflow Architect works with your default model.

- **New workflow:** enter a name and an optional description. The new workflow already contains *Start → Agent → Result*.
- **Create with AI:** in the same dialog, describe what you want and the [Workflow Architect](/docs/ki-architekt#neu-erstellen) designs the workflow for you to review.
- **Open:** click the card.
- **Duplicate:** copy symbol on the card. The copy is called "… (copy)"; runs are not copied.
- **Delete:** bin symbol. Previous runs remain available under *Runs*.

**Continue:** once there are workflows and runs, the **Continue** area appears above the list: how many approvals are waiting for you (a click opens the *Approvals* page), the **Recent runs** with their status and, with more than six workflows, the **Recently edited** ones. Parts without content are left out; if there is nothing at all, the whole area is left out.

**Teams:** workflows with capabilities or an output contract carry the **Team** badge: an [orchestrator](/docs/verzweigungen#orchestrator) can delegate work to them. They are listed below your own workflows in the collapsible **Teams** area. Copies of orchestrated examples bring their teams along.

**Example gallery:** below the list are the featured examples, the easiest first and marked **Start here** while you have no workflow yet. After that the gallery is a closed area that remembers whether you opened it. In the full gallery you search by name, field, building block or level and filter by category and **Level**; the search, the filters and an open preview are part of the address, so *Back* returns to the same selection. Under **What you need**, the preview names the AI provider and the models the copy uses (and whether it is set up), whether a run stops for an approval, which knowledge and sample files come along and whether a connection to another service is needed. More under [Example workflows](/docs/beispiele).

## Favorites and tags {#favoriten-tags}
<!-- keywords: favorite, favorites, star, tag, tags, label, filter, organize -->

Workflows, agent templates and tools can be marked as favorites with the **star**. Favorites always come first in the lists. The **tag icon** adds tags such as “Client A” or “Draft”; existing tags are suggested.

Above the lists you filter by **Favorites only** and by a tag. Favorites and tags are stored apart from the objects: they change neither workflows nor agents nor tools, and they also show up in the [search](/docs/start#suche). There are deliberately no folders.

## The editor {#editor}
<!-- keywords: panels, resize, divider, canvas, palette, building blocks, inspector, execution overview, zoom, minimap, title bar, more actions, teams in the palette, run overview -->

The editor has four areas:

1. **Title bar:** name, *AI architect*, *API & Export*, the **More actions** menu (*Versions* and *Export as a file*), *Save* and *Start workflow*. With unsaved changes, *Discard* is added. In narrow windows the secondary actions show as icons only.
2. **Canvas:** the nodes and connections. The top left shows whether there are unsaved changes and how many agents and connections the workflow has. At the bottom left you find zoom, *Show everything*, *Arrange automatically* as well as *Undo* and *Redo* (disabled when there is nothing to undo or redo). At the top right an overview map shows the whole workflow. A large workflow opens at a readable size at its start node instead of shrunk to fit.
3. **Building blocks (palette):** *Agent* (empty), *Describe an agent* (the AI drafts the configuration), *Start*, *Result*, up to eight templates from the agent library and below them the **Teams**, which you can search and collapse; each team names its capabilities. Drag a building block onto the canvas or click it. A new node appears in the visible part of the canvas and is selected right away.
4. **Inspector (right):** without a selection it shows the check and the workflow settings, otherwise the configuration of the selected node, and with several nodes selected the actions for all of them (see [Controls and keyboard shortcuts](/docs/workflows#bedienung)).

Below the canvas is the **Run overview** with the last run of this workflow.

The building blocks, the inspector (titled *Properties*) and the run overview are panels. The button in a panel's header hides or shows it; a hidden panel leaves a narrow bar, and the building blocks then remain available as icons. The divider between a panel and the canvas changes its size: drag it, or focus it with *Tab* and use the arrow keys (with *Shift* in larger steps). A double-click on a divider restores the default size. While the inspector is hidden, its bar names the selected node; a double-click on a node shows its properties. Nodestro remembers the layout in this browser for every workflow. It is not part of the workflow: changing it never creates unsaved changes or an undo step, and a running workflow keeps running.

## Node types {#knoten}
<!-- keywords: start, result, output, agent, node, input, output port -->

| Node | Purpose | Inputs | Outputs |
|---|---|---|---|
| **Start** | Provides the input you enter when starting. Optionally with a *Suggested input* or an [input form](/docs/verzweigungen#eingabeformular). | none | any number |
| **Agent** | Calls its AI model with its configuration and returns a result (text or JSON). | any number | any number |
| **Decision** | Picks one or more branches by fixed rules, without an AI request. | one or more | one output per branch |
| **Approval** | Holds the run until a person approves or rejects. | any number | *Approved*, *Rejected* |
| **Sub-workflow** | Runs another saved workflow as one step. | any number | any number |
| **Result** | Collects the results of the connected agents as the output of the workflow, optionally also as files. | any number | none |

Start and result nodes are optional: agents without a predecessor automatically receive the input of the run, and without a result node the output of the last agents counts as the result (see [The result of a run](/docs/ausfuehrungen#ergebnis)). Decision, approval and sub-workflow are in the palette under *Control the flow*; see [Branches and approvals](/docs/verzweigungen).

Every node has a unique name. If you create a second agent with the same name, Nodestro adds a number ("Agent 2"). An agent's name is also its placeholder in tasks.

## Connecting agents {#verbinden}
<!-- keywords: connection, edge, port, drag, circle, cycle, delete -->

Drag from the **right dot** (output) of one node to the **left dot** (input) of another. A connection means: the target node waits until the source node is finished and receives its result.

Nodestro prevents invalid connections and explains why:

- A node cannot be connected to itself.
- The start node has no input, the result node has no output.
- The same connection can only exist once.
- **Cycles only as loops:** data flows in one direction. A connection back to a predecessor is only possible from a branch of a decision or approval and then becomes a [loop](/docs/verzweigungen#schleifen) with a limit; any other is rejected.

To delete a connection, select it and press **Delete** or **Backspace**. During a run, connections light up while data flows through them.

## Data flow between agents {#datenfluss}
<!-- keywords: data flow, input, passing on, predecessor, successor, json, multiple inputs -->

This is how an agent gets its task:

1. Nodestro takes the agent's **task** (the *Task* field in the inspector, default: `{{input}}`).
2. Placeholders are replaced by the results of the **direct predecessors** and the input of the run.
3. Results of predecessors that do not appear in the task are appended under the heading **`# Eingaben`** ("inputs"), each with the predecessor's name as a subheading. That way nothing is ever silently lost.
4. If the task is still empty after that, the agent receives the input of the run.

**What is passed on:**

- A text result is passed on as text.
- A structured result is passed on as formatted JSON.
- The start node passes on the input of the run.
- Agents without a predecessor receive the input of the run.

An agent only sees the results of its **direct** predecessors, not those of nodes further back. If it needs the original input, use `{{run.input}}`.

## Placeholders in tasks {#platzhalter}
<!-- keywords: placeholders, template, {{input}}, {{run.input}}, variable, task -->

| Placeholder | Is replaced by |
|---|---|
| `{{input}}` | the result of the only predecessor; with several predecessors all results, each as a section `## Name`; without a predecessor the input of the run. Right after a start node with a filled-in form this is the form values only; use `{{run.input}}` for the form values and the additional text |
| `{{run.input}}` (or `{{workflow.input}}`) | the input when the workflow was started, anywhere in the workflow |
| `{{Name of the predecessor}}` | the result of exactly this direct predecessor |

Placeholders are not case-sensitive. In the inspector, buttons for all direct predecessors appear below the task field; a click inserts the matching placeholder.

**Example:** a writer agent has the predecessors *Audience* and *Outline*:

```
Write the article on "{{run.input}}".

Audience:
{{Audience}}

Outline:
{{Outline}}
```

> **Common mistake:** if you rename a predecessor, old placeholders no longer match. An unknown placeholder stays in the text as it is, and the predecessor's result is appended under `# Eingaben`. Check the tasks of the successors after renaming.

## Input preview {#eingabe-vorschau}
<!-- keywords: preview, input, context, see prompt, check placeholders, what does the agent get -->

The **Input preview** section in an agent's inspector shows what the agent would get in the next run, without calling the API:

- the **system prompt** and the **task** with filled placeholders. Every inserted part is highlighted; hover over it to see where it comes from.
- which **inputs** are available. Results of predecessors come from the latest run of this workflow. If a predecessor has no result yet, a yellow note stands in its place instead of a guessed value.
- placeholders that match no connected predecessor.
- the other parts of the context: example messages, tools, knowledge, memory, output format and quality check.

Credentials in request options are never shown. For a finished run, the **Context** tab in the [details](/docs/ausfuehrungen#details) shows what the agent got at the time.

## Parallel execution {#parallel}
<!-- keywords: parallel, simultaneous, branching, merge, order -->

Every node starts as soon as **all** of its predecessors are finished. Nodes that do not depend on each other run at the same time. In the *Blog article* example, *Audience* and *Outline* work in parallel; the *Writer* only starts when both are finished.

Parallel branches shorten the run time but cost as many tokens as agents run one after the other.

**Errors in a branch:** if an agent fails, all nodes that depend on it are **skipped**. Independent branches keep running. The run then ends with the status *Error*.

## Workflow settings {#einstellungen}
<!-- keywords: name, description, inspector, workflow settings -->

Click an empty spot on the canvas to see the workflow settings in the inspector: **Name**, **Description**, **Budget per run** and the **limits** for steps running at the same time and for the run time. Below them are the problems that prevent a start and a short overview of the controls.

## Budget per run {#budget}
<!-- keywords: budget, cost limit, limit, usd, dollar, abort, budgetexceedederror, reservation, no hard maximum -->

The budget limits the **estimated costs** of a run in US dollars, across all agents and quality checks.

- If the workflow has no budget of its own, the **default budget** from the settings applies (initially 2 USD).
- If nothing is set there either, the run is unlimited.
- **Before** every request, its highest possible cost is reserved (input size and the most output it may produce, at the most expensive rate). After the response, the reservation is replaced by the real cost. Agents running at the same time therefore cannot exceed the budget together: if the rest is not enough, a request waits until another one is finished.
- If the budget is not enough even without other requests, the request is not sent and the agent stops (error `BudgetExceededError`).
- If a single request is larger than the whole budget, it runs alone in the standard price mode; in strict price mode it is refused.

Unknown costs do **not** count as 0. If the highest cost of a request cannot be determined in advance (no known price, images, files, or provider tools such as web search), it runs without an upper bound in standard mode. The run then shows the note **No hard maximum** next to its costs, with the number of such requests. In strict price mode, requests without a known price are not sent at all.

## Limits per run {#limits}
<!-- keywords: limits, at the same time, parallel, time limit, run time, timeout, duration, run.time_limit, steps, run.step_limit -->

Three optional limits apply to every run of the workflow. Empty means no limit.

- **Most steps running at the same time** (1 to 32): if more steps are ready, the others wait for a free slot. With 1, all steps run one after another.
- **Time limit per run** (in minutes, at most 7 days): only active execution time counts. Waiting for an approval does not count. When the time is up, no further step starts, running agents are asked to stop, and the run fails with an error that names the time limit.
- **Most steps per run** (1 to 10,000): every executed node counts once, start and result included, and every round of a loop counts again. If the next step would be one too many, it does not start and the run fails with an error that names the limit. This protects against loops that run more rounds than intended. A continued run counts the steps it takes over.

A model request or tool call that is already running is still finished. The run can therefore exceed the time limit by the length of that call.

## Check before starting {#pruefung}
<!-- keywords: check, validation, problems, start blocked, error, warning, note -->

Nodestro checks the workflow on every change (after a pause of half a second), without calling the API and without cost:

- **Structure:** Is there at least one agent? Does the start node have no inputs and the result node no outputs? Are there no cycles, no duplicate connections and none pointing nowhere? Does the result node have an input?
- **Agents:** Every configuration is checked with the library's rules. Nodes with errors show “1 problem” on the canvas, Start and Result too; warnings show as “1 warning” in their own colour and with an icon.
- **Connections and placeholders:** placeholders that match no connected predecessor, agents without input, results that go nowhere, and duplicate agent names.
- **Settings:** providers that are not set up, deleted knowledge or start files, models without a known price, and a budget of 0.

The results are listed at the very top of the workflow inspector (click an empty spot of the canvas), sorted into **errors** and **notes**. Clicking a message selects the agent concerned or highlights the connection concerned; faulty connections appear red and dashed. When you select a node, its own messages are shown above its settings. While a provider is not set up, nodes show no “Ready”.

As long as **errors** exist, **Start workflow** is blocked. The reason is shown right next to the button, with several problems the first one (“3 problems block the start. First: …”). **Show** selects the node or connection concerned and opens the inspector; if an AI provider is missing, **Open settings** goes straight there. The blocked button stays reachable with the keyboard, and screen readers read out the reason. **Notes** do not block the start; the start dialog shows them once more.

## Starting a run {#starten}
<!-- keywords: start, run, execute, start dialog, input, attach files, prefilled task, more files -->

**Start workflow** opens the start dialog:

- **Input:** the text all agents receive at the start. It is prefilled with the *Suggested input* of the start node. If the workflow has an [input form](/docs/verzweigungen#eingabeformular), the field is below the form fields; when it is prefilled it is called **Task (prefilled example)**: replace the example with your own request.
- **Attach files (optional):** knowledge files that are put directly into the context of the first agents for this run only (see [Attaching files at the start](/docs/wissen#start-dateien)). If the form has file fields of its own, this area is folded under **Attach more files (optional)**.
- **Budget:** the dialog shows which budget applies.

With **Start**, Nodestro saves the workflow and begins the run. The run uses the state of the workflow at the time it was started; later changes only take effect in the next run. If the provider of a model is not set up, the dialog points this out. If the run cannot start yet, the reason is shown below **Start**: uploads are still running, or errors need fixing first (*Fix the problems above first.*).

## Controls and keyboard shortcuts {#bedienung}
<!-- keywords: keyboard shortcuts, shortcuts, ctrl+s, ctrl+z, undo, redo, delete, duplicate, arrange automatically -->

<!-- widget: shortcuts -->

More tips:

- **Arrange automatically** arranges the nodes in columns according to their position in the data flow.
- **Show everything** zooms so that the whole workflow is visible.
- **Selecting several nodes:** Shift- or Ctrl-click adds nodes to the selection; Shift and dragging on the canvas selects with a box. Dragging moves all selected nodes, **Delete** deletes them all, **Ctrl+D** duplicates them all. The inspector then offers *Duplicate all*, *Delete nodes* and *Clear selection*.
- **Undoing a delete:** after you delete nodes, a message with **Undo** appears.
- **Drawing connections:** while you drag, the canvas already shows where a connection is not allowed; if you drop it there, a message gives the reason.
- If you leave the editor with unsaved changes, Nodestro asks whether to save, discard or **Keep editing**.
- Undo remembers up to 80 steps. Moving a node is one step, and so is typing in one field until you switch to another field or node. The name, description and budget of the workflow are included. If you undo everything back to the saved state, there are no unsaved changes left.

- **Deleting connections:** Click a connection. It is highlighted, and **Delete** or **Backspace** removes it. While you type in an input field these keys only delete text. Deleting a connection can be undone too.
- In narrow windows (below 1100 pixels wide) the **Building blocks** bar starts collapsed; after that the layout you chose last applies.

## Saving and discarding {#speichern}
<!-- keywords: save, discard, unsaved, discard changes, reset -->

**Save** (or **Ctrl+S**) keeps the current state and creates a new [version](/docs/workflows#versionen). While there are unsaved changes, the title bar shows **Discard**.

**Discard** throws away all unsaved changes, including the undo/redo history, and reloads the last saved state. The same applies when you leave the editor and choose **Discard** in the dialog: the next time you open it, exactly the saved workflow appears.

**Changed somewhere else:** before saving, Nodestro checks whether the workflow has been saved somewhere else in the meantime, in another tab or by someone else. Then the **Changed somewhere else** dialog asks instead of silently replacing the other change:

- **Load saved version:** the editor shows the saved state; your unsaved changes here are dropped.
- **Keep mine as a copy:** your state becomes a new workflow "… (my copy)", the saved one stays as it is.
- **Save mine anyway:** your state replaces the other change.
- **Keep editing:** nothing is saved.

Nothing is lost for good: every save is kept under [Versions](/docs/workflows#versionen).

## Versions {#versionen}
<!-- keywords: version, versions, history, restore, go back, older state -->

Every save that changes something is kept as a numbered **version** with date and time. **Versions** in the title bar's **More actions** menu opens the history:

- **Save as version** saves the current changes with an optional description (“before reworking the research”).
- The pencil icon adds or changes the description of a version.
- **Differences** shows what would change compared with the state in the editor: agents, connections, name and settings.
- **Restore** sets the workflow back to that version and saves the result as a **new version**. No version is overwritten or deleted. If there are unsaved changes, choose **Save first, then restore** (the changes first become a version of their own) or **Restore without saving**.

Versions are independent of undo/redo, which only applies within one session in the editor. Runs always use the state at their start. When a workflow is deleted, its versions are deleted too. At the top of the history is the **test result** of the saved version from each test series of the workflow (as when [publishing](/docs/api-und-export#veroeffentlichen)).

## Import and export {#import-export}
<!-- keywords: export, import, json, file, share, backup, .nodestro.json, not a workflow, invalid file -->

- **Export as a file** (in the editor under **More actions**) saves the workflow as `<Name>.nodestro.json`: all nodes, connections, positions and agent settings as well as the budget.
- **Import** (on the *Workflows* page) loads such a file as a **new copy** with a new ID. Existing workflows are never overwritten. If the file has no name, the workflow is named after the file.

Nodestro checks the file before anything is created. If it is not a workflow export (for example another JSON file, a file without steps or with broken connections), nothing is imported and the message gives the reason, for example *This file is not a Nodestro workflow: it has no steps ("nodes").*

**Not included** are knowledge files, memory spaces and your own tools; the file only refers to their IDs and names. On another computer they must exist there, otherwise the check reports, for example, "Unknown tools".

Workflow export and trace export are different things: a workflow describes the process, a trace a specific run with results (see [Importing traces](/docs/ausfuehrungen#trace-import)).

## Examples {#beispiele}
<!-- keywords: example, template, pattern, pipeline, recipe, use case -->

**Linear: research → analysis → review (example "Financial analysis")**

1. *Research Agent* (Sonnet, low effort) extracts all figures with period and unit.
2. *Analysis Agent* gets the `calculator` tool and calculates growth and margins exactly. Task: `Calculate the key figures from these research results: {{Research Agent}}`.
3. *Review Agent* checks the analysis and returns a **structured result** with `summary`, `key_figures`, `issues` and `approved`.

**Branch and merge (example "Blog article")**

1. Start with the topic.
2. *Audience* and *Outline* run in parallel.
3. *Writer* merges both (`{{Audience}}`, `{{Outline}}`) and has a **quality check** with the criteria "follows the outline" and "answers the audience's questions".

**Classify and answer**

1. *Classification* (Haiku, structured output with `category`, `urgency` as an integer and `reason`).
2. *Answer* (Sonnet) gets the classification as JSON and the original request via `{{run.input}}`.

## Limitations {#grenzen}
<!-- keywords: limits, limitations, loops, conditions, if, loop, branching -->

- **Loops only with a limit:** a workflow is a directed graph; steps repeat only through [loops](/docs/verzweigungen#schleifen) of at most 20 rounds. Outside loops, every node runs at most once per run. Conditions are built with [decisions](/docs/verzweigungen#entscheidung); nodes on branches that were not chosen are skipped.
- **Continue instead of repeat:** a failed or cancelled run can be [continued](/docs/verzweigungen#fortsetzen); this creates a new, linked run.
- **One run at a time per workflow in the editor:** while a run is active, *Start workflow* is disabled. To start many runs at once, use a [batch run](/docs/automatisierung#stapel).
- **State at start time:** changes during a run only take effect in the next run.

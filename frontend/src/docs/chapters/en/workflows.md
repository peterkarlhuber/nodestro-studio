# Workflows

A workflow connects agents into a pipeline. This chapter explains how to create workflows, connect nodes, how data flows between agents and how to start a run.

## Creating and managing workflows {#anlegen}
<!-- keywords: new workflow, create, delete, duplicate, copy, overview -->

The **Workflows** page shows all workflows as cards with the number of agents, the last change and the status of the last run.

- **New workflow:** enter a name and an optional description. The new workflow already contains *Start → Agent → Result*.
- **Create with AI:** in the same dialog, describe what you want and the [Workflow Architect](/docs/ki-architekt#neu-erstellen) designs the workflow for you to review.
- **Open:** click the card.
- **Duplicate:** copy symbol on the card. The copy is called "… (copy)"; executions are not copied.
- **Delete:** bin symbol. Previous executions remain available under *Executions*.

## Favorites and tags {#favoriten-tags}
<!-- keywords: favorite, favorites, star, tag, tags, label, filter, organize -->

Workflows, agent templates and tools can be marked as favorites with the **star**. Favorites always come first in the lists. The **tag icon** adds tags such as “Client A” or “Draft”; existing tags are suggested.

Above the lists you filter by **Favorites only** and by a tag. Favorites and tags are stored apart from the objects: they change neither workflows nor agents nor tools, and they also show up in the [search](/docs/start#suche). There are deliberately no folders.

## The editor {#editor}
<!-- keywords: panels, resize, divider, canvas, palette, building blocks, inspector, execution overview, zoom, minimap -->

The editor has four areas:

1. **Title bar:** name, *Export*, *Save*, *Add agent* and *Start workflow*.
2. **Canvas:** the nodes and connections. The top left shows whether there are unsaved changes and how many agents and connections the workflow has. At the bottom left you find zoom, *Show everything*, *Arrange automatically* as well as *Undo* and *Redo*. At the top right an overview map shows the whole workflow.
3. **Building blocks (palette):** *Agent* (empty), *Describe an agent* (the AI drafts the configuration), *Start*, *Result* and up to eight templates from the agent library. Drag a building block onto the canvas or click it.
4. **Inspector (right):** without a selection it shows the workflow settings, otherwise the configuration of the selected node.

Below the canvas is the **Execution overview** with the last run of this workflow.

The building blocks, the inspector (titled *Properties*) and the execution overview are panels. The button in a panel's header hides or shows it; a hidden panel leaves a narrow bar, and the building blocks then remain available as icons. The divider between a panel and the canvas changes its size: drag it, or focus it with *Tab* and use the arrow keys (with *Shift* in larger steps). A double-click on a divider restores the default size. While the inspector is hidden, its bar names the selected node; a double-click on a node shows its properties. Nodestro remembers the layout in this browser for every workflow. It is not part of the workflow: changing it never creates unsaved changes or an undo step, and a running workflow keeps running.

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
- **No cycles:** data always flows in one direction. A connection that leads back to a predecessor is rejected.

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

Click an empty spot on the canvas to see the workflow settings in the inspector: **Name**, **Description** and **Budget per run**. Below them are the problems that prevent a start and a short overview of the controls.

## Budget per run {#budget}
<!-- keywords: budget, cost limit, limit, usd, dollar, abort, budgetexceedederror -->

The budget limits the **estimated costs** of a run in US dollars, across all agents and quality checks.

- If the workflow has no budget of its own, the **default budget** from the settings applies (initially 2 USD).
- If nothing is set there either, the run is unlimited.
- After every API response, the costs are added up. If the budget is exceeded, the running agent stops (error `BudgetExceededError`) and no further requests are made.

Because costs are only counted after a response, a single request can exceed the budget slightly. Requests without a known price count as 0.

## Check before starting {#pruefung}
<!-- keywords: check, validation, problems, start blocked, error, warning, note -->

Nodestro checks the workflow on every change (after a pause of half a second), without calling the API and without cost:

- **Structure:** Is there at least one agent? Does the start node have no inputs and the result node no outputs? Are there no cycles, no duplicate connections and none pointing nowhere? Does the result node have an input?
- **Agents:** Every configuration is checked with the library's rules. Agents with errors show “1 problem” on the canvas.
- **Connections and placeholders:** placeholders that match no connected predecessor, agents without input, results that go nowhere, and duplicate agent names.
- **Settings:** providers that are not set up, deleted knowledge or start files, models without a known price, and a budget of 0.

The results are listed in the workflow inspector (click an empty spot of the canvas), sorted into **errors** and **notes**. Clicking a message selects the agent concerned or highlights the connection concerned; faulty connections appear red and dashed.

As long as **errors** exist, **Start workflow** is disabled; hover over the button to see the reasons. **Notes** do not block the start; the start dialog shows them once more.

## Starting a run {#starten}
<!-- keywords: start, run, execute, start dialog, input, attach files -->

**Start workflow** opens the start dialog:

- **Input:** the text all agents receive at the start. It is prefilled with the *Suggested input* of the start node.
- **Attach files (optional):** knowledge files that are put directly into the context of the first agents for this run only (see [Attaching files at the start](/docs/wissen#start-dateien)).
- **Budget:** the dialog shows which budget applies.

With **Start**, Nodestro saves the workflow and begins the run. The run uses the state of the workflow at the time it was started; later changes only take effect in the next run. If the provider of a model is not set up, the dialog points this out.

## Controls and keyboard shortcuts {#bedienung}
<!-- keywords: keyboard shortcuts, shortcuts, ctrl+s, ctrl+z, undo, redo, delete, duplicate, arrange automatically -->

<!-- widget: shortcuts -->

More tips:

- **Arrange automatically** arranges the nodes in columns according to their position in the data flow.
- **Show everything** zooms so that the whole workflow is visible.
- If you leave the editor with unsaved changes, Nodestro asks whether to save or discard them.
- Undo remembers up to 80 steps. Moving a node is one step, and so is typing in one field until you switch to another field or node. The name, description and budget of the workflow are included.

- **Deleting connections:** Click a connection. It is highlighted, and **Delete** or **Backspace** removes it. While you type in an input field these keys only delete text. Deleting a connection can be undone too.
- The **Building blocks** bar is always collapsed when the editor opens; once expanded it stays open until you leave the editor.

## Saving and discarding {#speichern}
<!-- keywords: save, discard, unsaved, discard changes, reset -->

**Save** (or **Ctrl+S**) keeps the current state and creates a new [version](/docs/workflows#versionen). While there are unsaved changes, the title bar shows **Discard**.

**Discard** throws away all unsaved changes, including the undo/redo history, and reloads the last saved state. The same applies when you leave the editor and choose **Discard** in the dialog: the next time you open it, exactly the saved workflow appears.

## Versions {#versionen}
<!-- keywords: version, versions, history, restore, go back, older state -->

Every save that changes something is kept as a numbered **version** with date and time. **Versions** in the editor's title bar opens the history:

- **Save as version** saves the current changes with an optional description (“before reworking the research”).
- The pencil icon adds or changes the description of a version.
- **Differences** shows what would change compared with the state in the editor: agents, connections, name and settings.
- **Restore** sets the workflow back to that version and saves the result as a **new version**. No version is overwritten or deleted.

Versions are independent of undo/redo, which only applies within one session in the editor. Runs always use the state at their start. When a workflow is deleted, its versions are deleted too.

## Import and export {#import-export}
<!-- keywords: export, import, json, file, share, backup, .nodestro.json -->

- **Export** (in the editor) saves the workflow as `<Name>.nodestro.json`: all nodes, connections, positions and agent settings as well as the budget.
- **Import** (on the *Workflows* page) loads such a file as a **new copy** with a new ID. Existing workflows are never overwritten.

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

- **No loops:** a workflow is a directed graph without cycles. Every node runs at most once per run. Conditions are built with [decisions](/docs/verzweigungen#entscheidung); nodes on branches that were not chosen are skipped.
- **Continue instead of repeat:** a failed or cancelled run can be [continued](/docs/verzweigungen#fortsetzen); this creates a new, linked run.
- **One run at a time per workflow in the editor:** while a run is active, *Start workflow* is disabled. To start many runs at once, use a [batch run](/docs/automatisierung#stapel).
- **State at start time:** changes during a run only take effect in the next run.

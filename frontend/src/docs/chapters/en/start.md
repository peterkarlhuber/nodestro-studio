# Introduction

Nodestro is a visual studio for multi-agent workflows. You connect AI agents on a canvas into a pipeline, start it and follow every step. This chapter explains the basic concepts and walks you through your first workflow.

## What is Nodestro? {#ueberblick}
<!-- keywords: overview, idea, n8n, orkexa, library, provider, anthropic, claude, openai, gemini -->

Nodestro (from *Node* and *Maestro*) makes the Python library **Orkexa** usable through a graphical interface. Every **node** on the canvas is an agent: an AI model from Anthropic, OpenAI, Google Gemini or a server of your own, with its own role, its own tools and its own knowledge. Agents pass their results on through **connections**.

Typical uses:

- **Research and report:** one agent gathers facts, a second checks the numbers, a third writes the report.
- **Parallel perspectives:** several agents work on the same input at the same time (for example audience and outline), and a final agent merges everything.
- **Structured evaluation:** an agent returns a validated JSON object with fixed fields that other programs can process.
- **Quality-assured texts:** a judge checks the result against criteria and has the agent improve it.

Nodestro runs locally on your computer. Workflows, runs, knowledge and memory are stored in a SQLite database. Data leaves your computer only for requests to the AI providers you set up.

## Basic concepts {#begriffe}
<!-- keywords: glossary, concepts, node, run, execution, trace, token -->

| Term | Meaning |
|---|---|
| **Workflow** | A saved process made of nodes and connections. |
| **Node** | A building block on the canvas: *Start*, *Agent*, *Result*, *Decision*, *Approval*, *Sub-workflow* or *Orchestrator*. A connection from a decision or approval back to an earlier step creates a loop. |
| **Agent** | An AI model with a system prompt, a task and optionally tools, knowledge, memory and an output format. |
| **Connection** | Passes the result of one node on to a following node. |
| **Run (execution)** | A single execution of a workflow with a specific input. |
| **Trace** | The complete record of a run: inputs, results, tool calls, errors, times, tokens and costs. |
| **Tool** | A function an agent can call by itself, such as a calculator or web search. |
| **Knowledge** | Uploaded files (PDFs, images, texts) that agents use as background material. |
| **Memory** | Notes an agent writes itself and reads again in later tasks. |
| **Token** | The billing unit of the models: roughly a piece of a word. 1,000 tokens are roughly 750 English words. |
| **Budget** | A cost limit per run. If a run you started does not fit it, the run pauses and waits for a budget decision; unattended runs (schedules, batch runs, test series) fail instead. |

## Getting started {#erste-schritte}
<!-- keywords: guide, tutorial, quickstart, first workflow, getting started -->

Create your first workflow in a few minutes:

1. **Set up an AI provider.** Open *Settings → AI providers* and enter the API key of a provider, for example Anthropic (or set an environment variable such as `ANTHROPIC_API_KEY` before starting). If you use another provider, switch the default model there too. Without a provider set up you can edit everything but run nothing; the *Workflows* page says so at the top and leads to the settings. Copying an example works without one.
2. **Create a workflow.** Under *Workflows*, click **New workflow**, enter a name and confirm with **Create and open**. The editor opens with three nodes, already connected: *Start*, *New agent* and *Result*.
3. **Configure the agent.** Click the agent. The inspector appears on the right. Give the agent a name and write a system prompt, for example "You are an experienced editor. Improve spelling and style without changing the content."
4. **Start.** Click **Start workflow**, enter a text and confirm with **Start**. Nodestro saves the workflow automatically. If the button is blocked, the reason is shown right next to it, with a link to the fix.
5. **Watch.** The *Run overview* below the canvas shows live what the agent writes, which tools it calls, how many tokens it uses and what it costs.
6. **Trace it.** **Details** takes you to the complete run with its timeline.

> **Tip:** Below your workflows you find the gallery with 24 [example workflows](/docs/beispiele) for typical tasks, for example **Financial analysis** and **Blog article**. A preview is free; copied examples are your own copies that you can change freely.

## The interface {#oberflaeche}
<!-- keywords: navigation, sidebar, menu, theme, dark, light, layout -->

The **sidebar** on the left follows the way you work: build, run and review, then automate.

- **Build:** *Workflows* (your processes), *Agent library* (reusable templates), *Tools*, *Knowledge* and *Memory*.
- **Run & review:** *Runs* (all runs in detail), *Approvals* (decisions runs wait for) and *Usage* (tokens and costs over time).
- **Automate & test:** *Test series*, *Batch runs* and *Schedules*.
- **Help:** this *Documentation* and the *Welcome* page.

The gear at the top right opens the *Settings* from every page (also *Ctrl+,*); the settings then offer the way back to where you were. At the bottom it says where Nodestro runs: when you run Nodestro on your computer with the `nodestro` command, it says **Local & private**, on a server **Your organization's server** (see [Nodestro on a server](/docs/einstellungen#server)). At the top right you choose the color scheme: *System* (follows your operating system, the default), *Dark* or *Light*; your choice is saved in the browser. If the provider of the default model is not set up, a notice appears there (*Set up AI provider* or, once another provider is set up, *Default model needs …*) that leads straight to the settings. On a server, your account is shown at the top right as well.

**Help right where you need it:** many controls have a small **?** symbol next to them. Hover over it, focus it with the Tab key or tap it on touch devices: a short explanation appears, often with a link to the matching section of this documentation. The book symbol next to page titles opens the matching chapter. **Esc** closes an explanation again.

Statuses are always shown as text and symbol, never by color alone. All controls can also be reached with the keyboard.

## Search {#suche}
<!-- keywords: search, find, ctrl+k, cmd+k, quick search -->

The search field at the top of the title bar (or **Ctrl+K**, on a Mac **⌘K**) searches pages and settings sections, workflows, runs, agents in workflows, the agent library, example workflows, tools, knowledge and this documentation. Hits are grouped by kind; favorites appear with a star. Runs are found among the newest runs by workflow name, input, status or ID. With an empty search field, it offers your latest runs and recently changed workflows.

Use the arrow keys to pick a hit; **Enter** opens it where it belongs: an agent in the editor of its workflow, a template in the agent library, a tool in the tool library, a knowledge file in the list and a section in the documentation. Upper and lower case and accents do not matter.

## Where is my data? {#daten}
<!-- keywords: privacy, storage location, database, sqlite, backup, nodestro_data_dir, ~/.nodestro -->

All data is stored in a SQLite database in the data directory, `~/.nodestro` by default (changeable with `--data-dir` or the environment variable `NODESTRO_DATA_DIR`). It contains:

- `nodestro.db` with workflows, agent templates, runs, settings, knowledge files, search index and memory spaces,
- the `tools` folder with your own and AI-created tools.

To **back up**, copy the data directory while Nodestro is stopped. Only the content an agent needs for its request is sent to its provider: system prompt, task, assigned knowledge, memory content it reads, and tool results. The API keys are never shown in the interface. If you work with Nodestro on a server, the data is stored there instead (see [Nodestro on a server](/docs/einstellungen#server)).

## The desktop app {#desktop}
<!-- keywords: desktop, app, desktop app, download, install, window -->

There is no Nodestro desktop app in this version, and none can be downloaded. To use Nodestro on your computer, start it with the `nodestro` command: it runs locally and opens in your browser (see [Installation and start](/docs/einstellungen#installation)).

# Memory

With memory, an agent remembers things beyond a single task: preferences, decisions, progress or rules it has learned. This chapter explains the memory types, memory spaces and the memory browser.

## How memory works {#ueberblick}
<!-- keywords: memory, memory tool, /memories, notes, remember -->

Nodestro uses Orkexa's **memory tool**: Anthropic's own memory tool for Anthropic models, and a regular tool with the same commands for other providers (the model must handle tools for that). An agent with memory gets a small file system under `/memories` in which it creates, reads, changes, renames and deletes text files itself. The model decides by itself what to remember: typically it looks into its memory at the start of a task and records new things afterwards.

Memory is **plain text** (mostly Markdown). For original documents such as PDFs, use [Knowledge](/docs/wissen).

## Memory types {#arten}
<!-- keywords: off, per run, persistent, ephemeral, mode -->

| Type | Lifetime | Sharing | Use |
|---|---|---|---|
| **Off** | – | – | The agent remembers nothing beyond the task (default). |
| **Per run** | one run | no, every agent has its own | A notepad for long tasks with many tool rounds; the notes appear in the execution afterwards. |
| **Persistent** | until you delete it | yes, via the memory space | Knowledge that grows over many runs: customer preferences, project status, decisions. |

## Memory per run {#pro-lauf}
<!-- keywords: per run, ephemeral, notepad, scratchpad, memory tab -->

With *Per run*, the agent starts every run with an empty memory. What it notes down appears in the execution, next to the agent, in the **Memory** tab. Other agents of the same run do not see these notes; information between agents flows through the [connections](/docs/workflows#datenfluss).

## Persistent memory and memory spaces {#dauerhaft}
<!-- keywords: persistent, memory space, space, share, shared, namespace -->

With *Persistent* you choose a **memory space**. A space is a separate `/memories` file system in the Nodestro database. It survives runs and restarts.

- **Create a new space:** in the inspector, enter a name under *New memory space* and click **Create**, or use **New memory** on the *Memory* page. Letters, digits, spaces, `_`, `.` and `-` are allowed (at most 64 characters).
- **Sharing:** several agents with the same space read and write the same files, even in different workflows. For example, one agent can record customer wishes and another can take them into account.
- A space created in the inspector appears on the *Memory* page as soon as the agent has written its first file.

If two agents with the same space run in parallel, they take turns; every single change is complete, but they can overwrite each other's content. Give parallel agents different files or spaces.

## The memory browser {#browser}
<!-- keywords: memory page, browser, edit, create file, clear, view content -->

The **Memory** page shows all spaces with the number and size of their files. Choose a space to see its files:

- **View and edit a file:** choose the file, change the text, **Save**.
- **Create a file:** enter a path (for example `customers/preferences.md`); it is created under `/memories`.
- **Delete a file:** bin symbol next to the path.
- **Clear a space:** permanently deletes all files of the space after confirmation. Above the files, **Used in** shows which agents and published APIs use the space; the confirmation names them too.

This way you can check, correct or prefill memory at any time. In the inspector, **View content** leads straight to the agent's space.

## Setting up memory with AI {#assistent}
<!-- keywords: memory assistant, set up with ai, suggestion, structure, starter files -->

**Set up with AI** (in the inspector, with *Persistent*) suggests a starting structure:

1. Describe what the agent should remember, for example "preferences of individual customers, decisions made and open items per project".
2. The memory assistant (the assistant model from the settings) suggests two to five files with content, including a `README.md` that explains the structure to the agent. It does not invent facts but leaves placeholders.
3. Check and edit the suggestions, choose the space and click **Save to space**. The agent is set to this space at the same time.

Nothing is saved until you confirm. The suggestion costs one request to the model of the assistants.

The suggested files are written in the interface language unless your description asks for another one. File names stay English.

## Use cases {#anwendungsfaelle}
<!-- keywords: use cases, examples, customers, project, learning, preferences -->

- **Customer care:** an agent remembers preferences and earlier requests for each customer in `customers/<name>.md`.
- **Ongoing projects:** a project agent keeps `decisions.md` and `open-items.md` and picks up from there in the next run.
- **Learning review:** a review agent collects recurring mistakes in `error-catalogue.md` and checks for them specifically in future.
- **Long research:** with *Per run*, an agent records interim results instead of losing them in the conversation.

## Notes and limits {#hinweise}
<!-- keywords: limits, security, secrets, passwords, costs, memory tool name -->

- **No secrets:** whatever an agent reads from memory becomes part of the request to the AI provider. Do not store passwords or keys.
- **Costs:** memory access is a tool round. Large files cost tokens every time they are read; keep files small and well structured.
- **Paths:** all paths are under `/memories`. Paths outside it are rejected.
- **Reserved name:** the tool name `memory` is taken by the memory tool; a tool of your own with this name cannot be used together with memory.
- **Max. tool rounds:** every memory action counts as a tool call. Raise the limit if an agent reads and writes a lot.

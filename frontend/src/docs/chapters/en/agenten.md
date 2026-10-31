# Agents

An agent is an AI model with a role, a task and optional tools. The model can come from Anthropic, OpenAI, Google Gemini or a server of your own. This chapter explains every setting in the inspector, what it does and typical values.

## Basics {#grundlagen}
<!-- keywords: name, description, symbol, icon, inspector, structure -->

Select an agent on the canvas; the inspector shows its configuration. Common settings are at the top, less frequent ones in collapsible sections (*Tools*, *Knowledge*, *Memory*, *Output format*, *Thinking and effort*, *Quality check*, *Advanced*). Each section title has a short summary next to it, for example "2 assigned". The summary names every setting that differs from a new agent, for example "1 fallback model · no caching" under *Advanced*. Problems stay visible while a section is closed: its title shows "1 error" or "2 warnings", and the links under *Problems in* at the top open the section and jump to it. A section stays open or closed as you left it, also on the next agent and after a reload. Only this browser remembers it; the workflow and its exports do not change.

- **Icon:** click the icon at the top left to choose another one. It is only there for orientation.
- **Name:** appears on the canvas and is also the placeholder `{{Name}}` for successors.
- **Description:** one sentence about the agent's role. It appears on the node and is the starting point for the AI draft.

The symbols at the top right save the agent as a **template** in the library, **duplicate** it (Ctrl+D) or **delete** it.

## Model {#modell}
<!-- keywords: model, opus, sonnet, haiku, fable, price, choice, which model -->

The model determines abilities, speed and price. First choose the **provider**, then the **model**: from the list of known models or as any model id of the provider that you type (for example a new OpenAI model or `llama3.1:8b` for Ollama). Providers that are not set up yet carry the note “not set up”. The table shows the known models with their prices per million tokens; “–” means the price is unknown. For such models the costs stay **unknown** and are never counted as 0.

<!-- widget: models -->

**Rules of thumb:**

- **Haiku 5.5** for classifying, extracting and short, clearly defined tasks.
- **Sonnet 5.5** for most agent tasks; the default for new agents.
- **Opus 5.5** for demanding reasoning, planning, code and long tasks with many tools.
- **Fable 5.1** for the hardest tasks, when quality matters more than cost.

You set the default model for new agents in the [settings](/docs/einstellungen#modelle) and the providers' access under [AI providers](/docs/einstellungen#anbieter). Some options exist only for Anthropic models: thinking and showing thoughts, prompt caching, fallback models and server tools. For other providers the inspector hides them; if one of them is still set, the check reports an error instead of silently leaving it out.

## System prompt {#system-prompt}
<!-- keywords: system prompt, role, instruction, persona, prompt engineering -->

The system prompt describes permanently **who** the agent is and **how** it works. It applies to every task of the agent and is reused cheaply when caching is enabled.

A good system prompt contains:

1. **Role:** "You are a financial analyst specialising in industrial companies."
2. **Approach:** "Check every figure for period and unit. Calculate with the calculator tool."
3. **Quality standard:** "State uncertainties explicitly."
4. **Output:** language, length, format ("Answer in English in at most 200 words as a list.").

Avoid instructions that belong to the specific input; those go into the **task**.

## Task {#aufgabe}
<!-- keywords: task, template, placeholder -->

The task is the message the agent receives in each run. It can contain placeholders: `{{input}}`, `{{run.input}}` and `{{Name of a predecessor}}`. The rules are under [Placeholders in tasks](/docs/workflows#platzhalter).

If the task contains no placeholder, the inspector points this out: the results of the predecessors are then appended under `# Eingaben`.

## Assigning tools {#tools}
<!-- keywords: assign tools, tools, server tools, web search, web fetch, code execution -->

In the **Tools** section you choose from the tool library which functions the agent may call. The list is grouped into *Built-in*, *Your own* and *AI-generated*; hovering shows the description.

Below it you switch on the **Server tools from Anthropic**: *Web search*, *Web fetch* and *Code execution*. They run on Anthropic's servers (see [Server tools](/docs/tools#server-tools)). Server tools are available only for Anthropic models.

The agent decides by itself whether and when to call a tool, based on its name and description. How often it may do so is controlled by [Max. tool rounds and Parallel tools](/docs/agenten#limits); whether it must is controlled by [Tool choice](/docs/agenten#tool-choice).

## Assigning knowledge {#wissen}
<!-- keywords: assign knowledge, files, pdf, context, on demand, search, citations -->

In the **Knowledge** section you assign uploaded files and choose **how** the agent gets them:

- **In context:** the files are fully in the prompt from the start.
- **On demand:** the agent sees a catalogue and loads files itself (tool `files`).
- **Search:** the agent looks for matching passages (tool `search`).

**Enable citations** makes answers refer to the exact passages. Details and recommendations are in the [Knowledge](/docs/wissen#modi) chapter.

**Upload file** in the same section uploads one or more files straight into [Knowledge](/docs/wissen#hochladen) and assigns them to this agent. The file is stored permanently in Knowledge at once and can be used by other agents too; the assignment is an ordinary change of the agent and is saved with the workflow. *Undo* or *Discard* remove only the assignment, not the file. Files you give a run in the start dialog are not knowledge files: they belong to that run only.

## Memory {#memory}
<!-- keywords: memory, notes, per run, persistent, space -->

In the **Memory** section you choose *Off*, *Per run* or *Persistent* and, for persistent memory, a **memory space**. You can create new spaces right here. **Set up with AI** suggests a suitable file structure. Everything else is in the [Memory](/docs/memory) chapter.

## Output format {#ausgabeformat}
<!-- keywords: output format, structured, json, schema, fields, pydantic, field name, type, required -->

**Text (Markdown)** is the default: the agent answers freely.

**Structured (JSON)** forces the agent to return an object with fixed fields. Nodestro builds a JSON schema from them, the API returns a matching object and the result is checked against the schema. Successors receive it as JSON; the execution shows it formatted.

Every field has:

| Setting | Meaning |
|---|---|
| **Field name** | Key in the JSON, for example `summary` or `key_metrics`. Letters, digits and `_` are allowed; the name must not start with a digit and must be unique. Other characters are replaced by `_` while you type. |
| **Type** | *Text*, *Number* (decimal), *Integer*, *Yes/No*, *List (text)* or *List (numbers)*. |
| **Description** | Explains to the model what belongs in the field. The more precise, the better. |
| **Required** | Required fields are always filled; optional fields may be `null`. |

**Example** for an assessment:

| Field name | Type | Description |
|---|---|---|
| `summary` | Text | Summary in 2–3 sentences |
| `key_metrics` | List (text) | The most important figures with unit |
| `risk_score` | Integer | Risk from 1 (low) to 5 (high) |
| `approved` | Yes/No | Is the analysis correct? |

The result then looks like this:

```json
{
  "summary": "Revenue and margin have risen significantly …",
  "key_metrics": ["Revenue growth 27.6%", "EBIT margin 16.8%"],
  "risk_score": 2,
  "approved": true
}
```

**Limitations:**

- A structured format needs at least one field.
- Citations cannot be combined with a structured format.
- If the model refuses a request, there is no object; the agent then always fails, regardless of the *On refusal* setting.

## Thinking and effort {#denken}
<!-- keywords: effort, thinking, adaptive, between_tools, show thoughts, reasoning -->

**Effort** determines how thoroughly the model works: *Low*, *Medium* (default), *High*, *Very high* or *Maximum*. Higher effort means more thinking, more output tokens and higher costs, but gives better results on difficult tasks. *Model default* leaves the choice to the model.

**Thinking** determines whether the model thinks before answering:

| Setting | Effect | Restriction |
|---|---|---|
| *Model default* / *Adaptive* | The model thinks when it helps. | – |
| *Only between tool calls* | Thinks only between tool calls, not before the first answer. | Sonnet 5.5 only and only up to effort *High*. |
| *Off* | No thinking. | Not possible with Opus 5.5, Sonnet 5.5, Fable 5.1 and Fable 5; with Opus 5 and Haiku 5.5 only up to effort *High*. |

**Show thoughts** controls whether the reasoning appears in the execution: *Show summarized* (a summary of the thoughts), *Progress updates* (short interim updates) or *Omit*. Displayed thoughts appear in the *Thoughts* tab. This setting cannot be combined with thinking *Off* or *Only between tool calls*.

Thoughts count as **output tokens** and are billed accordingly.

If it is unknown whether a model supports reasoning effort (your own servers, unknown model ids), a set effort leads to an error. Choose *Model default* then, or declare the capability under [AI providers](/docs/einstellungen#anbieter).

## Quality check {#qualitaet}
<!-- keywords: quality check, judge, evaluator, criteria, revision, refine, llm as a judge, assessment -->

With the quality check, a second model, the **judge**, checks the agent's result:

1. The agent completes its task.
2. The judge rates the result **per criterion** as *passed* or *failed* with a reason. It also sees the tool calls and their results.
3. If a required criterion failed, the agent receives the reason and revises its answer.
4. This repeats up to the set number of **revisions** (0–5).

The result of the check is shown in the execution next to the agent: passed or not, number of attempts and the judge's reasoning. A failed result is passed on too; the run does not fail because of it.

**Good criteria** can be checked individually: "Every figure comes from a tool result", "Names at least one concrete risk", "At most 150 words". Vague criteria such as "well written" lead to unreliable verdicts.

**Costs:** every check and every revision is an additional request. The judge's costs count towards the agent and the run's budget. A newly enabled check starts with the default model from the settings as the **judge model**; you can change it at any time, and existing checks keep their model. Agents designed by AI (*Design with AI* and the Workflow Architect) also get the default model as their judge; the check stays off. If that model cannot return a structured verdict, the draft says so, and no other model is chosen. The section summary names the judge. When the judge is the same model as the agent, a note says so: a model tends to rate its own answers favorably.

## Limits {#limits}
<!-- keywords: max tokens, max_tokens, tool rounds, max_tool_rounds, parallel tools, max_parallel_tools, limit -->

| Setting | Default | Effect |
|---|---|---|
| **Max. tokens** | 8,000 | Maximum number of output tokens per answer, including thinking (up to 128,000). When it is reached, the agent stops with `IncompleteResponseError`. |
| **Max. tool rounds** | 8 | How many rounds of tool calls the agent may make per task (0–50). After that it ends with `MaxToolRoundsError`. At 0 it may not call any tools. |
| **Parallel tools** | 1 | How many tool calls of one answer run at the same time (1–16). Useful for slow, independent tools such as web searches. |

Increase *Max. tokens* for long texts or high effort, and *Max. tool rounds* when an agent needs many research steps.

## Tool choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, force, any, none, auto -->

| Setting | Effect |
|---|---|
| *Automatic* | The model decides whether to use tools (default). |
| *No tools* | The model answers without tool calls. |
| *Force any tool* | The first answer must be a tool call. |
| *Specific tool* | The first answer must call the chosen tool. |

Opus 5.5, Sonnet 5.5 and Fable 5.1 reject forced tool calls; the check reports this. Use *Automatic* there with an instruction in the system prompt, or a structured output format.

## Tool errors {#tool-fehler}
<!-- keywords: tool errors, raise_tool_errors, error handling, toolexecutionerror -->

A tool can fail in two ways:

- **Expected errors** (the tool reports, for example, "unknown time zone"): the agent always receives the message as a result and can react.
- **Unexpected errors** (invalid input, crash, timeout in the sandbox): with **Return tool errors to the model** (default: on) the agent sees these as an error result too. If the option is off, the agent ends with `ToolExecutionError`.

Failed tool calls are marked with a warning symbol in the execution.

## Prompt caching {#caching}
<!-- keywords: caching, cache, prompt caching, ttl, 5 minutes, 1 hour -->

When **Prompt caching** is on (default), the API stores the unchanging beginning of a request (system prompt, tools, knowledge in context, previous conversation). Follow-up requests read it at a fraction of the price. This pays off with tool rounds, quality checks and repeated runs.

The **Cache duration** is *5 minutes* or *1 hour*. Writing to the 1-hour cache costs more. Details and prices are under [Caching and costs](/docs/nutzung#caching).

## Refusals and fallback models {#ablehnung}
<!-- keywords: refusal, fallback, fallback model, safety, refusalerror -->

Models can refuse requests for safety reasons; sometimes this is a false alarm.

**When the model refuses:**

- *Treat as an error* (default): the agent fails with `RefusalError`; successors are skipped.
- *Keep the answer text anyway:* the (usually empty) text is passed on as the result.

**Fallback models:** if the model refuses, the API answers the same request with the next model in the list. Costs are calculated per answering model. Sonnet 5.5 does not support a list of its own; do not use fallback models there.

## Example messages {#beispiele-nachrichten}
<!-- keywords: examples, few shot, example messages, messages, dialogue -->

Example messages come before the actual task and show the model the desired format (few-shot prompting). They alternate between **User** and **Assistant**, start with a user message and end with an assistant answer. Empty messages are ignored.

**Example:** User: "The delivery arrived damaged." – Assistant: "Category: complaint · Urgency: high".

## Request options {#request-options}
<!-- keywords: request options, betas, mcp, inference_geo, json, advanced -->

For advanced users: a JSON object whose fields are passed unchanged into every API request of the agent, such as `betas` or settings that Nodestro does not offer separately. Invalid JSON is marked immediately and not applied. Wrong values only lead to an API error during the run.

## Designing an agent with AI {#ki-entwurf}
<!-- keywords: ai draft, describe agent, architect, agent architect, create automatically, dynamic -->

Instead of setting everything yourself, you describe the agent in your own words: task, inputs, desired result, quality standard. The **agent architect** (the assistant model from the settings) then suggests:

- name, description and a complete system prompt,
- the cheapest suitable model and the lowest suitable effort,
- suitable existing tools and server tools,
- limits for tokens and tool rounds.

You see the suggestion with the cost of the draft and only take it over with **Apply**; everything stays editable afterwards. In the editor, the agent keeps its previous task when you apply.

If the architect is missing abilities, it names **missing tools** with a description. You can have them created under [Tools → Create with AI](/docs/tools#ki-erstellen). The architect only uses current models, effort at most *Very high*, at most 32,000 tokens and 20 tool rounds.

The draft is written in the interface language unless your description asks for another language. Field names and other technical identifiers stay English.

Available via **Design with AI** in the inspector, **Describe an agent** in the palette or on the *Agents* page.

## Agent library {#bibliothek}
<!-- keywords: library, template, reuse, agents page -->

On the **Agents** page you manage reusable agent templates:

- **Empty template** or **Describe an agent** creates a new template.
- In the editor, the save symbol in the inspector saves an agent as a template.
- You edit templates on the right with the same form as in the editor; **Save** applies the changes, **Discard** restores the last saved state.
- The newest eight templates appear in the editor's palette under **From the library**.

An agent from a template is a **copy**: later changes to the template do not affect agents already inserted.

## Testing an agent {#agent-testen}
<!-- keywords: test, try, test agent, trial run, run alone -->

**Test agent** in the inspector (in the editor and in the agent library) runs just this one agent with its **current configuration, unsaved changes included**:

1. Enter a **test input**. It is inserted into the task like the input of a run; placeholders for predecessors stay empty. With *Send the input directly as the task* only your text goes to the agent.
2. **Start test** shows the answer, all tool calls, errors, tokens, cost, duration and, if enabled, the quality check.

A test is **not a workflow run**: it does not appear under *Executions* and changes no results. Persistent memory is only read; the test works on a copy. A test calls the model's provider and **can cost money**; the dialog names the model's prices when they are known, and the cost appears on the [Usage](/docs/nutzung#statistik) page.

## Validation and messages {#validierung}
<!-- keywords: validation, error message, problem, warning, red, inspector message -->

The inspector checks every change against the library's rules without calling the API:

- **Red messages** (errors) prevent the start, for example an unknown tool, an invalid field name, thinking settings the model does not support, or a quality check without a criterion.
- **Yellow messages** (warnings) allow the start, for example code execution together with web search.
- **Grey notes** inform you, for example that inputs are appended because the task contains no placeholder.

Common messages and their solutions are under [Common errors](/docs/faq#haeufige-fehler).

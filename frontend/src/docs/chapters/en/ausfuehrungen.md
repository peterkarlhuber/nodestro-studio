# Runs

Every run of a workflow is recorded in full: input, results, tasks, tool calls, thoughts, memory, errors, times, tokens and costs. This chapter explains the views, the statuses, exporting and importing traces and how to interpret errors.

## Overview {#ueberblick}
<!-- keywords: runs, executions, history, log, trace -->

You see runs in two places:

- **In the editor**, in the *Run overview* below the canvas: the latest run of this workflow, live while it is running.
- On the **Runs** page: all runs of all workflows, with a detail view.

Runs are kept even if you change or delete the workflow; every run stores the workflow as it was at the start.

## Watching live {#live}
<!-- keywords: live, streaming, watch, execution overview, progress, real time, waiting for you, cancel run -->

During a run, the **Run overview** shows:

- in its header the status of the run and **Cancel run** (see [Cancelling runs](/docs/ausfuehrungen#abbrechen)), after the end a link to the **Details**,
- at the top the number of agents, API requests, tokens and the estimated costs, updated continuously,
- on the left all agents with their status; a click shows their details on the right, *Overall result* shows the result of the workflow,
- on the right the text the selected agent is writing, its tool calls and (if enabled) its thoughts.

If a [tool call](/docs/verzweigungen#tool-freigabe) is waiting for your decision, the run, the step and its node show **Waiting for you**: the run only goes on once you have decided. If the run stops for an approval, the overview shows the approval so you can decide; a decision made elsewhere (the *Approvals* page, another tab, the API) shows up here too without reloading.

After the run, the overview shows the same as the detail view: why it failed, tool calls without a result and steps that did not finish (see [The detail view](/docs/ausfuehrungen#details)).

On the canvas, every agent shows its status, and after the run also tokens and costs. Connections through which data has flowed are highlighted.

## The list of runs {#liste}
<!-- keywords: list, filter, status filter, workflow filter, delete, origin, load older runs, refresh, finished with problems -->

The **Runs** page lists the runs, newest first, with workflow, status, start time, duration, requests, tokens and costs. The input or the error message is shown below the workflow name. If a finished run had tool calls without a result, **Finished with problems** appears next to *Done*, provided the server sends this information.

- **Filters:** by workflow, by status and by origin (*Own runs* or *Imported traces*).
- **Delete:** bin symbol; running runs cannot be deleted.
- **Import trace:** see [Importing traces](/docs/ausfuehrungen#trace-import).
- **Load older runs:** the list first shows the newest 100 runs and says so below it. The status and origin filters only search the loaded runs. If the server does not support paging, the list stops at 500 runs; older ones stay stored and can be reached with the workflow filter.

The list refreshes every five seconds while a run is queued or running, otherwise every 30 seconds. In a background tab it does not ask; when you come back it is up to date at once.

## The detail view {#details}
<!-- keywords: details, detail view, timeline, waterfall, tabs, result, task, thoughts, failed at, finished with problems, tool calls without a result, not finished, interrupted, show as json, structured result -->

Clicking a run opens the detail view:

1. **Key figures:** status with total duration, API requests, tokens (broken down into input, output, cache and thinking) and estimated costs.
2. **Run summary:** how many steps succeeded and how many were skipped, which path the decisions took, how approvals were decided, which tools were called how often (with errors) and at which step the run failed, with *Go to step*. It is built only from the run's stored data, without a model call; what the run did not record shows as *not recorded*.
3. **Notes on the outcome** (only when needed, see below).
4. **Input and result** of the workflow side by side.
5. **Timeline:** a time bar for every agent in the order they started; steps that never started come last. Each bar shows when the agent ran; bars on top of each other ran in parallel. Duration, tokens and number of tool calls are shown next to it. The failed step is opened first, otherwise one that waits for a person.
6. **Details of the selected agent:** duration, start and end time, tokens, requests and costs, any error, the result of the quality check, and the tabs:

| Tab | Content |
|---|---|
| **Result** | The agent's output: text as Markdown, a structured result as labelled fields (short field descriptions serve as labels). The JSON is one click away with **Show as JSON**. |
| **Task** | The task as it went to the agent after the placeholders were filled in. Ideal for finding data-flow problems. |
| **Tools** | Every tool call with input, result, time, duration and success. |
| **Thoughts** | The model's reasoning (only if *Show thoughts* was on). |
| **Memory** | The notes of an agent with memory *Per run*. |

**Open in editor** takes you to the workflow; **Cancel run** stops a run in progress.

The **Context** tab shows what the agent got in this run: system prompt, task with highlighted inputs, example messages, tools, knowledge, memory, output format and quality check, each with the configuration at the start of the run. Credentials are never shown.

**Notes on the outcome.** What did not go smoothly is shown below the key figures:

- **Failed at *step*:** if a step failed, the message names it with its own problem in words and what to do, for example an answer cut off at its token limit or a rejected API key. For provider failures the model is shown too. Where the fix is a setting, a link leads there: **Open Settings** or **Open "Advanced" of *agent***. If more steps failed, their number is shown below. The original text is under *Technical details*.
- **Finished with problems:** a run can be *Done* although tool calls had no result: rejected by a person, expired without a decision, not allowed by the approval rules, cancelled, failed, or with an error of the tool. Then the amber badge **Finished with problems** appears next to *Done*, and a notice lists each of these calls with step, tool and reason, each with *Go to step*. Check whether the result relies on them.
- **Not finished:** if a run ended while steps were still running or waiting (for example because Nodestro was stopped), those steps read **Not finished** instead of *Waiting* or *Running*. The notice names the steps that never got a result, or says that Nodestro stopped while the run was going. **Continue** right in the notice completes them; finished steps are taken over (see [Continuing failed runs](/docs/verzweigungen#fortsetzen)).

## Status {#status}
<!-- keywords: status, done, error, skipped, cancelled, waiting, running, queued -->

| Status | Meaning |
|---|---|
| **Waiting** | The node is waiting until all predecessors are finished. |
| **Queued** | The run has been created and is about to start. |
| **Running** | Being run right now. |
| **Done** | Completed successfully. |
| **Error** | Failed; the message is in the details. A run has the status *Error* as soon as one node fails. |
| **Skipped** | The node did not run because its branch was not chosen. This is not an error. |
| **Blocked** | The node did not run because a predecessor failed or was cancelled. |
| **Awaiting approval** | An [approval](/docs/verzweigungen#freigabe) waits for a person's decision. |
| **Paused** | The run waits for an approval and continues after the decision. |
| **Cancelled** | Stopped with *Cancel run*, rejected, or a trace that was exported before it was complete. |
| **Waiting for you** | A tool call waits for your approval; the run goes on as soon as you have decided. |
| **Not finished** | A step of a finished run that never completed (for example because Nodestro was stopped). |
| **Finished with problems** | Not a status of its own but a badge next to *Done*: tool calls of the run had no result. |

A failed or cancelled run can be [continued](/docs/verzweigungen#fortsetzen). Runs from schedules, batch runs, test series and sub-workflows show their origin in the list and in the details.

## The result of a run {#ergebnis}
<!-- keywords: result, output, overall result, workflow output, sink -->

- If there are **result nodes**, their content is the result. A result node with one predecessor takes over its output; with several predecessors, an object with one entry per predecessor.
- If there is **no** result node, the agents without a successor count as the result.
- With several result nodes (or last agents), the result is an object with one entry per node, named after the node.

## Cancelling runs {#abbrechen}
<!-- keywords: cancel, stop, abort, end, really cancel, confirm -->

**Cancel run** (in the run overview or the detail view) asks once more to be safe: a second click on **Really cancel?** within five seconds stops the run; **Esc** or a click elsewhere lets it keep running. This also applies to a paused run. Running agents stop at the next step (next piece of text, next request or next tool call); agents that have not started yet are no longer run. Tokens used up to that point are charged and shown.

## Talking to the team leader {#teamleitung}
<!-- keywords: team leader, orchestrator, live chat, ask a question, give an instruction, steer, live steering, live_steering, chat budget, run_chat -->

When a run has an **orchestrator** (also in a nested team run), the detail view shows a **Team leader** tab next to **Overview**. Approvals and the run's status stay visible above it. With several team leaders you choose one; each shows its workflow, its level and its status. Below it you see what it is doing: decisions (used of the maximum), its teams with their status and the specialists working right now.

You choose explicitly what you write:

- **Ask a question:** an AI model answers it from the current state of the run. A question never changes the run. The answer is marked *Chat answer, not a decision* and names the state it is based on.
- **Give an instruction:** the team leader takes it into account at its **next decision**. A decision already being made and teams already working are not interrupted or changed; running specialists notice nothing until the next decision is made.

Each instruction shows where it stands: *Waiting for the next decision* (with how many teams are working now), *With the team leader for decision N*, *Included in decision N* with what was decided, or *No longer considered* with the reason. "Included" means the team leader had the instruction when it made this decision; whether and how it follows it, it decides itself within its limits. Enter sends, Shift+Enter starts a new line.

**Costs:** answers to questions have their own **chat budget** per run, separate from the run's budget. Their costs appear on the [Usage](/docs/nutzung#statistik) page under **Live run chat**, not in the run's costs. In the strict [price mode](/docs/nutzung#preismodus) questions to models without a known price are refused. Instructions cost nothing extra; they become part of the next decision.

**Permissions and limits:** reading needs the *Read* permission, sending needs *Run*. A message has at most 2000 characters; per run and team leader there is a maximum number of messages, instructions and questions, and a limit of questions per minute. The line below the input shows the chat budget and the questions left.

**Pause, restart, continue:** while a team waits for an approval, instructions stay open and apply to the next decision once the run goes on. If a decision is lost to a server restart, the instruction is given again to the next decision. When the run or the team leader ends, open instructions are marked *No longer considered* and are not carried over when you continue the run. After the end, the conversation can only be read.

**Unattended runs:** in the orchestrator's inspector, **Live steering** sets who may give instructions: *Runs a person started* (default), *Always* (also schedule, API, batch run and test series) or *Off*. Questions are not affected. More about the orchestrator is under [Orchestrator](/docs/verzweigungen#orchestrator).

## Exporting a trace {#trace-export}
<!-- keywords: export trace, export, json, run json, share, archive, sanitize, anonymize, privacy, personal data -->

**Export trace** in the detail view saves a run as a JSON file: the workflow at its start, input, status, result, and for each agent the task, result, text, thinking, tool calls with inputs and outputs, errors, quality check, memory, timestamps, tokens and cost. The dialog offers two kinds:

- **Complete:** everything as stored. Only pass the file on if it contains nothing confidential.
- **Sanitized for sharing:** API keys, tokens, passwords and private keys are always replaced. Optionally Nodestro also replaces **personal data** (e-mail addresses, phone numbers, IBANs, card numbers, IP addresses) and removes whole **contents** (inputs, prompts, outputs, tool data, memory); what remains is flow, status, models, times and tokens.

Replaced parts get placeholders like `[EMAIL_1]`; equal values get the same placeholder. Only the downloaded copy is sanitized; the stored run stays unchanged. Detection works with patterns and is **not guaranteed to find everything**, for example no names or addresses. Look at the file before you pass it on.

Tool results are shortened to 20,000 characters per call.

## Importing traces {#trace-import}
<!-- keywords: import trace, import, json, open, view, duplicate, restore -->

**Import trace** on the *Runs* page opens exported trace files again, several at once and also on another computer.

This is how the import works:

- The trace appears as an execution of its own marked **Imported** and opens in the usual detail view: results, agents, tool calls, inputs and outputs, errors, timestamps, quality checks, tokens and costs, as far as the trace contains them.
- **Nothing is run.** There is no request to an AI provider and no cost.
- Imported traces are **stored permanently** and, like any execution, can be opened again, filtered, exported and deleted.
- **Existing runs are never overwritten:** every import gets a new ID; the original ID is shown in the detail view.
- **Duplicates:** if the same run already exists (the original or an earlier import of the same file), Nodestro does not create a copy but opens the existing execution and tells you so.
- **Incomplete traces:** if a run was exported while it was still running, it appears as *Cancelled* with a note.
- **Usage:** imported runs do not count towards the usage statistics, because their costs did not arise in this installation.
- **Open in editor** is missing for imported traces, because the matching workflow usually does not exist here. You transfer the workflow itself with the [workflow export](/docs/workflows#import-export).

**Invalid files** are rejected with a clear message and nothing is stored: not JSON, a workflow export instead of a trace, missing required fields or damaged values. A trace may be at most 50 MB.

## Comparing runs {#vergleich}
<!-- keywords: compare, comparison, difference, diff, side by side, two runs -->

Tick two runs in the list of runs with the box at the start of the row and click **Compare**. The comparison view puts both side by side:

- **Key figures:** status, duration, requests, input and output tokens, cost, tool calls and failed agents. Rows that differ are highlighted, with the difference from A to B.
- **Final result:** as a line comparison (only in A, only in B) or side by side.
- **Agents:** for each agent model, status, duration, tokens, cost, tools, errors and evaluation. Badges name what differs; outputs and evaluation feedback can be compared directly.

Only stored data is compared; nothing is executed again. If the runs belong to the same workflow, agents are matched by their node, otherwise by their name. If the workflow changed between the runs, the view points this out. Imported traces can be compared too.

## Interpreting errors {#fehler}
<!-- keywords: errors, error message, error, interpret, cause, solution, refusalerror, budgetexceedederror -->

Errors are shown in the run details with the run ("Failed at *step*" with that step's problem) and with the agent concerned (red message). The message appears in the interface language, says in words what happened and what you can do, for example raise *Max. tokens* under "Advanced" or check the key under *Settings → AI providers*. Provider failures tell a rejected key, too many requests (rate limit), an overloaded and an unreachable provider apart. Under **Technical details** you find the original text from the server or the API with the error type, for example to pass it on in a bug report.

| Message | Meaning | Solution |
|---|---|---|
| `BudgetExceededError` | The run's budget is used up. | Increase the budget in the workflow or in the settings, or choose cheaper models. |
| `RefusalError` | The model refused the request. | Rephrase the task, set fallback models or choose *Keep the answer text anyway*. |
| `MaxToolRoundsError` | More tool rounds than allowed. | Increase *Max. tool rounds* or make the task more precise. |
| `IncompleteResponseError` | The answer reached *Max. tokens* or the context window. | Increase *Max. tokens*, reduce knowledge. |
| `ToolExecutionError` | A tool failed unexpectedly and *Return tool errors to the model* was off. | Test the tool under *Try it*, switch the option on. |
| *The AI provider reported an error …* | The provider reported an error (for example invalid key, overload, unknown model id, invalid request options). | Check the key and the model id, try again later, check the request options. |
| *Skipped because a previous node did not succeed.* | A consequence of an error further back. | Fix the first failed agent. |
| *The run was cancelled.* | Someone chose *Cancel*. | – |

More messages and solutions are under [Common errors](/docs/faq#haeufige-fehler).

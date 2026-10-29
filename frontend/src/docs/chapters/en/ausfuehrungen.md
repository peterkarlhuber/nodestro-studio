# Executions

Every run of a workflow is recorded in full: input, results, tasks, tool calls, thoughts, memory, errors, times, tokens and costs. This chapter explains the views, the statuses, exporting and importing traces and how to interpret errors.

## Overview {#ueberblick}
<!-- keywords: executions, runs, history, log, trace -->

You see runs in two places:

- **In the editor**, in the *Execution overview* below the canvas: the latest run of this workflow, live while it is running.
- On the **Executions** page: all runs of all workflows, with a detail view.

Executions are kept even if you change or delete the workflow; every run stores the workflow as it was at the start.

## Watching live {#live}
<!-- keywords: live, streaming, watch, execution overview, progress, real time -->

During a run, the **Execution overview** shows:

- at the top the number of agents, API requests, tokens and the estimated costs, updated continuously,
- on the left all agents with their status; a click shows their details on the right, *Overall result* shows the result of the workflow,
- on the right the text the selected agent is writing, its tool calls and (if enabled) its thoughts.

On the canvas, every agent shows its status, and after the run also tokens and costs. Connections through which data has flowed are highlighted.

## The list of executions {#liste}
<!-- keywords: list, filter, status filter, workflow filter, delete, origin -->

The **Executions** page lists the runs, newest first, with workflow, status, start time, duration, requests, tokens and costs. The input or the error message is shown below the workflow name.

- **Filters:** by workflow, by status and by origin (*Own runs* or *Imported traces*).
- **Delete:** bin symbol; running executions cannot be deleted.
- **Import trace:** see [Importing traces](/docs/ausfuehrungen#trace-import).

The list refreshes every five seconds.

## The detail view {#details}
<!-- keywords: details, detail view, timeline, waterfall, tabs, result, task, thoughts -->

Clicking a run opens the detail view:

1. **Key figures:** status with total duration, API requests, tokens (broken down into input, output, cache and thinking) and estimated costs.
2. **Input and result** of the workflow side by side.
3. **Timeline:** a time bar for every agent in the order they started. Each bar shows when the agent ran; bars on top of each other ran in parallel. Duration, tokens and number of tool calls are shown next to it.
4. **Details of the selected agent:** duration, start and end time, tokens, requests and costs, any error, the result of the quality check, and the tabs:

| Tab | Content |
|---|---|
| **Result** | The agent's output, as Markdown or formatted JSON. |
| **Task** | The task as it went to the agent after the placeholders were filled in. Ideal for finding data-flow problems. |
| **Tools** | Every tool call with input, result, time, duration and success. |
| **Thoughts** | The model's reasoning (only if *Show thoughts* was on). |
| **Memory** | The notes of an agent with memory *Per run*. |

**Open in editor** takes you to the workflow; **Cancel** stops a run in progress.

The **Context** tab shows what the agent got in this run: system prompt, task with highlighted inputs, example messages, tools, knowledge, memory, output format and quality check, each with the configuration at the start of the run. Credentials are never shown.

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
| **Cancelled** | Stopped with *Cancel*, rejected, or a trace that was exported before it was complete. |

A failed or cancelled run can be [continued](/docs/verzweigungen#fortsetzen). Runs from schedules, batch runs, test series and sub-workflows show their origin in the list and in the details.

## The result of a run {#ergebnis}
<!-- keywords: result, output, overall result, workflow output, sink -->

- If there are **result nodes**, their content is the result. A result node with one predecessor takes over its output; with several predecessors, an object with one entry per predecessor.
- If there is **no** result node, the agents without a successor count as the result.
- With several result nodes (or last agents), the result is an object with one entry per node, named after the node.

## Cancelling runs {#abbrechen}
<!-- keywords: cancel, stop, abort, end -->

**Cancel** (in the execution overview or the detail view) stops the run. Running agents stop at the next step (next piece of text, next request or next tool call); agents that have not started yet are no longer run. Tokens used up to that point are charged and shown.

## Exporting a trace {#trace-export}
<!-- keywords: export trace, export, json, run json, share, archive, sanitize, anonymize, privacy, personal data -->

**Export trace** in the detail view saves a run as a JSON file: the workflow at its start, input, status, result, and for each agent the task, result, text, thinking, tool calls with inputs and outputs, errors, quality check, memory, timestamps, tokens and cost. The dialog offers two kinds:

- **Complete:** everything as stored. Only pass the file on if it contains nothing confidential.
- **Sanitized for sharing:** API keys, tokens, passwords and private keys are always replaced. Optionally Nodestro also replaces **personal data** (e-mail addresses, phone numbers, IBANs, card numbers, IP addresses) and removes whole **contents** (inputs, prompts, outputs, tool data, memory); what remains is flow, status, models, times and tokens.

Replaced parts get placeholders like `[EMAIL_1]`; equal values get the same placeholder. Only the downloaded copy is sanitized; the stored run stays unchanged. Detection works with patterns and is **not guaranteed to find everything**, for example no names or addresses. Look at the file before you pass it on.

Tool results are shortened to 20,000 characters per call.

## Importing traces {#trace-import}
<!-- keywords: import trace, import, json, open, view, duplicate, restore -->

**Import trace** on the *Executions* page opens exported trace files again, several at once and also on another computer.

This is how the import works:

- The trace appears as an execution of its own marked **Imported** and opens in the usual detail view: results, agents, tool calls, inputs and outputs, errors, timestamps, quality checks, tokens and costs, as far as the trace contains them.
- **Nothing is run.** There is no request to an AI provider and no cost.
- Imported traces are **stored permanently** and, like any execution, can be opened again, filtered, exported and deleted.
- **Existing executions are never overwritten:** every import gets a new ID; the original ID is shown in the detail view.
- **Duplicates:** if the same run already exists (the original or an earlier import of the same file), Nodestro does not create a copy but opens the existing execution and tells you so.
- **Incomplete traces:** if a run was exported while it was still running, it appears as *Cancelled* with a note.
- **Usage:** imported runs do not count towards the usage statistics, because their costs did not arise in this installation.
- **Open in editor** is missing for imported traces, because the matching workflow usually does not exist here. You transfer the workflow itself with the [workflow export](/docs/workflows#import-export).

**Invalid files** are rejected with a clear message and nothing is stored: not JSON, a workflow export instead of a trace, missing required fields or damaged values. A trace may be at most 50 MB.

## Comparing runs {#vergleich}
<!-- keywords: compare, comparison, difference, diff, side by side, two runs -->

Tick two runs in the list of executions with the box at the start of the row and click **Compare**. The comparison view puts both side by side:

- **Key figures:** status, duration, requests, input and output tokens, cost, tool calls and failed agents. Rows that differ are highlighted, with the difference from A to B.
- **Final result:** as a line comparison (only in A, only in B) or side by side.
- **Agents:** for each agent model, status, duration, tokens, cost, tools, errors and evaluation. Badges name what differs; outputs and evaluation feedback can be compared directly.

Only stored data is compared; nothing is executed again. If the runs belong to the same workflow, agents are matched by their node, otherwise by their name. If the workflow changed between the runs, the view points this out. Imported traces can be compared too.

## Interpreting errors {#fehler}
<!-- keywords: errors, error message, error, interpret, cause, solution, refusalerror, budgetexceedederror -->

Errors are shown in the execution with the run (summary "Failed: …") and with the agent concerned (red message). The message appears in the interface language and usually names the error type. Under **Technical details** you find the original text from the server or the API, for example to pass it on in a bug report.

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

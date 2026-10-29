# Workflow Architect

The Workflow Architect designs a complete multi-agent workflow from a description in natural language, or revises an existing one. It plans the agents, writes their prompts, chooses models, tools, knowledge and memory, connects everything and checks the result. It only proposes: nothing is saved, overwritten or run without your decision.

## Overview {#ueberblick}
<!-- keywords: architect, ai, draft, generate, automatic, create workflow, assistant -->

You reach the architect in two places:

- **Create with AI** in the dialog for a new workflow on the *Workflows* page.
- **AI architect** in the editor toolbar, with the modes **Design a new workflow** and **Revise this workflow**.

Both use the same logic. The architect works in eight steps: analyze requirements, plan the architecture, check resources, configure agents, design tools, create connections, validate the workflow and present the draft. For validation it uses the same [check before starting](/docs/workflows#pruefung) as the editor.

It builds as simply as possible: only as many agents as the task needs, and parallel steps only where they are truly independent. Where the task calls for it, it also plans [decisions, approvals](/docs/verzweigungen), an input form and result files; there are no loops. If you prefer to start from a ready-made template, see the [examples](/docs/beispiele).

The manual way is unchanged: you can still create and edit any workflow without AI.

## Create a new workflow {#neu-erstellen}
<!-- keywords: new, create, description, plan, create with ai -->

Describe what you want: the goal, the inputs, the results you expect and important constraints. The architect fills in missing details with assumptions and shows them to you afterwards. **Design workflow** starts it.

At the end you see the draft for review. **Create workflow** saves it as a new workflow with version 1 in the [version history](/docs/workflows#versionen) and opens it in the editor. You can change the name first. The new workflow is just like a [manually created one](/docs/workflows#anlegen) and is never run automatically.

## Revise an existing workflow {#ueberarbeiten}
<!-- keywords: revise, change, extend, add agent, revision, diff, undo -->

In the editor, choose **Revise this workflow** and describe the change, for example: "Add an agent before the result that critically reviews the previous analyses." The architect takes the agents, settings and connections of the workflow into account, including unsaved changes in the editor.

It changes only what the description asks for. Agents it does not mention stay as they are, with their prompts, tools and positions. The proposal is a separate draft; the **Changes** view shows added, changed and removed agents with the changed fields, as well as new and removed connections.

**Apply changes** applies the draft in the editor as a single step that **Undo** takes back completely. Nothing is saved until you [save](/docs/workflows#speichern); the new version in the [version history](/docs/workflows#versionen) then automatically gets a note about the AI revision.

If you have unsaved changes, the review offers **Save the current state as a version first**. If the workflow was changed in the editor while the architect was working, the review tells you before you apply.

## Follow the progress {#fortschritt}
<!-- keywords: progress, live, activities, log, steps, preview, graph, marks -->

While the architect works, you see three things:

- **Steps:** which of the eight steps are done and which one is running.
- **Activities:** a log of what actually happened, such as which roles were planned, which existing tools were found or which connections were corrected.
- **Workflow preview:** the workflow grows live. Marks show which agents are new, changed, unchanged, removed or still being configured.

Everything shown is based on real events from the server. There are no estimated percentages and no invented intermediate states, and the model's internal reasoning is not shown.

## Questions and assumptions {#rueckfragen}
<!-- keywords: question, assumption, unclear, language, ambiguous -->

The architect only asks when no sensible workflow is possible without the answer. You then answer with **Answer and continue**, or let it decide with **Continue with assumptions**. In all other cases it makes assumptions and lists them in the review.

It writes prompts, names and descriptions in the interface language (see [Language](/docs/einstellungen#sprache)) unless your description explicitly asks for another one. Technical identifiers, field names of structured output, tool names and code stay in English. When revising, it never translates existing content.

## Review the draft {#pruefen}
<!-- keywords: review, check, validation, draft, accept, discard, guarantee -->

The review shows:

- **Overview:** the analyzed requirements, assumptions, cost and the validation result with all warnings.
- **Changes** (revisions only): what changes compared with the workflow in the editor.
- **Agents:** role, model, system prompt, task, tools, knowledge, memory and structured output of each agent.
- **Data flow:** which results each agent receives; the tasks refer to them with [placeholders](/docs/workflows#platzhalter).
- **Tools:** new tool drafts with code and tests.

Problems that can be fixed without AI, such as missing connections or wrong placeholders, the architect corrects itself. Whatever still blocks after that it has the AI correct, but only a limited number of times. Remaining problems are shown in the review.

A passed [check](/docs/workflows#pruefung) means the workflow can run technically. It does not guarantee correct results: read the prompts and test the workflow with real inputs. **Discard draft** deletes the draft together with its tool drafts; **Change description** starts a new draft.

## Approve new tools {#tools-freigeben}
<!-- keywords: tool, draft, approval, code, sandbox, test, register, security -->

The architect prefers existing tools. Only if none fits and **Write missing tools as drafts** is switched on does it write a new Python tool with tests. The code is only checked statically and never runs, not even in the [sandbox](/docs/tools#sandbox).

A tool draft is not registered. You see code and tests in the review and under *Tools* in the tool drafts. **Test in sandbox** runs the tests; **Approve and register** tests again and adds the tool to the library only if the tests pass, just like the regular [approval](/docs/tools#freigabe). **Reject** deletes the draft.

As long as a tool is not approved, the check reports the workflow as blocked, and it cannot be started. The existing security rules for custom code apply unchanged. Knowledge and memory assignments are also only proposals that you change in the editor.

## Cost and limits {#kosten}
<!-- keywords: cost, limit, budget, corrections, usage, price, usd -->

Each draft calls the AI several times: for the analysis, the plan, each agent, tool drafts and corrections. You see the cost so far live in the progress view and in the review. Every call appears exactly once in the [usage overview](/docs/nutzung#statistik) under *Workflow Architect*, broken down by step.

Under *Settings*, with the [models](/docs/einstellungen#modelle), you set the **cost limit** per draft (empty means no limit) and how many **AI correction attempts** are allowed (0 to 5). When the limit is reached, the architect stops. It never starts a workflow run and never calls paid external services.

## Cancel {#abbrechen}
<!-- keywords: cancel, stop, close, discard, safe -->

**Cancel generation** stops the architect at any time. Nothing is saved and no workflow is changed; the cost incurred so far stays in the usage overview. If you close the dialog during the review, Nodestro asks before the draft is discarded.

## Limitations {#grenzen}
<!-- keywords: limits, limitations, maximum, agents, loops -->

- A draft has at most ten agents; cycles in the flow are removed.
- The same [limitations](/docs/workflows#grenzen) apply as for every workflow: no loops. The architect does not plan sub-workflows; add them yourself if needed.
- The architect only knows what is in your description, the workflow and the library. You have to check that the content is correct yourself.

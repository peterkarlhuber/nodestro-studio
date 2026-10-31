# Branches and approvals

Workflows can be more than a fixed chain of agents: a **decision** picks a path by fixed rules, an **approval** holds the run until a person approves or rejects, and a **sub-workflow** runs another workflow as one step. On top of that there are **input forms** for structured input and **continuing** failed runs. Everything runs on the same engine as every other workflow.

## Decisions {#entscheidung}
<!-- keywords: decision, branch, condition, if, router, switch, rule, routing -->

A **decision** (palette, group *Control the flow*) checks a result with fixed rules and opens the matching branches. It makes **no AI request** and costs nothing; the outcome can always be traced.

- Every rule is a **branch** with its own output on the right of the node. There is always the **Otherwise** branch as well, taken when no rule holds.
- Drag connections from the dot of a branch to the next agent. A connection from the node itself is not possible; the editor then asks you to pick a branch.
- **Checked result:** empty means the result that arrives through the incoming connection. If several arrive, pick one. The values of an [input form](/docs/verzweigungen#eingabeformular) can be checked too.
- Agents on branches that were not chosen are **skipped**. That is not an error; the run can still be *Done*.

In the run, the decision shows which rules held, which value was checked and, if so, why *Otherwise* was taken.

## Rules {#regeln}
<!-- keywords: rule, operator, comparison, equals, contains, greater, less, empty, field, json, mode -->

A rule compares a **field** of the result with a **value**. The field is a path in a structured output, for example `category` or `customer.tier`; empty means the whole result. A text that contains JSON (also in a code block) is read as data.

| Comparison | Meaning |
|---|---|
| equals, does not equal | text, number or yes/no; upper and lower case only on request |
| contains, does not contain, starts with, ends with | text |
| greater than, greater than or equal, less than, less than or equal | numbers or dates (YYYY-MM-DD) |
| is true, is false | yes/no (also "yes", "true", "1") |
| is one of, is none of | a list, values separated by commas |
| is empty, is not empty | missing or empty values, or empty lists |

- **Mode:** *First matching rule* opens exactly one branch (the order matters). *All matching rules* opens every branch that holds; they then run in parallel.
- **Invalid data:** if the field is missing or the type does not fit (say "greater than" on a text), the decision takes the *Otherwise* branch or fails, depending on the setting.

For rules to work reliably, give the agent before it a [structured output](/docs/agenten#ausgabeformat) with fixed fields.

## Joining branches {#zusammenfuehren}
<!-- keywords: join, merge, combine branches, skipped, blocked -->

A node waits until all its predecessors are settled. It **runs** as soon as at least one incoming connection delivers data, it is **skipped** when none does, and it is **blocked** when a predecessor failed.

Joining therefore needs no setting: an agent behind both branches of a decision runs with whatever arrives. The placeholder of a branch that did not run reads "-". The [check before starting](/docs/workflows#pruefung) points out such places.

Decisions and approvals pass data through: an agent behind them receives the results that arrived there, under the names of the agents that produced them.

## Loops {#schleifen}
<!-- keywords: loop, repeat, round, iteration, quality loop, revise, feedback, limit -->

A **loop** runs steps again until a result fits, for example *Draft → Review → Decision*: if the review fails, the run goes back to the draft.

- **Creating one:** drag a connection from a **branch** of a decision or approval back to an earlier step. Nodestro creates it as a loop (dashed, with "↻ max. 3×") and opens it in the inspector. A connection back from an agent is not possible: every round ends with a decision or approval.
- **Limit:** *Maximum rounds* (2 to 20) includes the first run. Every round costs tokens again; the [budget](/docs/workflows#budget) applies to the whole run.
- **When the limit is reached:** the run ends as failed ("The loop … ran … times without reaching its goal"), or it follows the decision's other branches. If none is followed, the steps behind it are skipped.
- **Placeholders:** in the task of a step in the loop, `{{iteration}}` is the round (from 1), `{{previous}}` its own result of the round before and `{{feedback}}` what came back over the loop (for example the reviewer's reasoning or the comment of a rejected approval). In the first round both read "-".
- **Approvals in loops:** a rejected approval can lead back to a revision over its *Rejected* branch; the next round then waits for a decision again.

During a run every step shows its **round**; in the details you pick between the results of all rounds. Loops may be nested but must not overlap. When a failed run is [continued](#fortsetzen), a loop always runs again completely.

## Approvals {#freigabe}
<!-- keywords: approval, sign-off, human in the loop, review, reject, comment, pause -->

An **approval** holds the run until a person **approves** or **rejects** the results. Nothing is ever approved automatically, not even in schedules, batch runs or test series.

- **Note for the reviewer:** what to pay attention to.
- **Results shown:** which results the reviewer sees; with nothing selected, everything that arrives.
- **Comment:** optional, or required on rejection. Later agents read it under the name of the approval; result nodes, result files and decisions do not receive it. It stays stored with the approval in the run.
- **When rejected:** follow the **Rejected** branch or end the run. If nothing is connected to *Rejected*, that path simply ends.

While the run waits, it has the status **Paused**, the approval **Awaiting approval**. You can decide in the editor's run overview, in the run's detail view or on the **Approvals** page. The run then continues where it stopped. Open approvals survive a restart of Nodestro.

## The Approvals page {#freigaben-seite}
<!-- keywords: approvals, open approvals, queue, decide, navigation, counter -->

The **Approvals** page (navigation, group *Automation*) lists every open approval, oldest first, with workflow, origin (manual, schedule, batch, test series) and waiting time. The number next to the menu entry shows how many are waiting.

Each card shows the note, the results to review, a comment box and the buttons *Approve* and *Reject*. Approvals inside sub-workflows appear here too, with the path to the parent run.

## Approving tool calls {#tool-freigabe}
<!-- keywords: tool approval, tool call, per call, arguments, deadline, pre-grant, unattended, legacy exemption -->

Besides approval nodes, Nodestro can ask before **single tool calls** of an agent. This is meant for tools that change data or reach outside, for example sending an e-mail or writing to a ticket system. The administrator switches it on after the security review; until then nothing changes.

When an agent wants to make such a call, the run keeps running but waits at this call. The card appears in the run, at the step, and on the **Approvals** page. It shows the tool, what it may do (*reads only*, *changes data*, *deletes or destroys*; *stays in Nodestro* or *reaches outside*), the **arguments exactly as they will be sent**, and the time left.

- **Allow this call** lets exactly this call through. A decision applies only to the arguments and the tool version you saw: if either changed, Nodestro refuses the decision and shows the current call.
- **Reject** prevents the call; the agent learns that it was refused and can continue without it.
- **Without a decision** within the time limit (15 minutes by default) the call counts as rejected, also after a restart. A rejected or expired decision is never used again.
- A tool that is **not classified** counts as changing data and reaching outside.
- Tools of **connected services** that change data are asked about at every call.

Runs nobody watches (schedules, batches, test series) cannot ask. There such a call is refused unless an administrator approved this tool version **in advance** for exactly that schedule or batch. Tools that delete or destroy and tools of connected services can never be approved in advance.

Workflows that already existed when approvals were switched on keep working: their tool assignments are marked as **exceptions from before**, bound to the tool version they ran with. A new tool version or a new assignment is asked about as usual. An approval never lifts the sandbox's limits.

In the run's details, each tool call shows what the rules did: allowed, approved or rejected (by whom and when), no decision in time, or refused without a question, with the reason.

## Sub-workflows {#unterworkflow}
<!-- keywords: sub-workflow, subworkflow, nesting, reuse, building block, version, child run -->

A **sub-workflow** runs another saved workflow as one step. Its result arrives like an agent's.

- **Version:** *Latest version* uses the current state; a fixed version does not change when the other workflow is edited later. The check reports when a newer version exists.
- **Input:** what the sub-workflow receives as input; `{{input}}` is what arrives here.
- **Values for its input form:** text or placeholders such as `{{form.customer}}` or `{{Analysis}}`. The check reports required fields without a value.
- The sub-workflow runs as its **own, linked run**; a link in the details leads there. Cost and tokens count once, in the budget of the parent run. If the sub-workflow has a budget of its own, that tighter limit applies as well.
- A workflow must not call itself, not even indirectly; more than five levels are not allowed.
- If the sub-workflow waits for an approval, the parent run waits with it.

## Teams {#teams}
<!-- keywords: team, output contract, contract, capabilities, structured result, run.output_contract -->

A **team** is a workflow that promises a fixed result when it runs as a sub-workflow. Two settings make a workflow a team:

- **Output contract** on the result node: the fields (name, type, required) the workflow delivers, as in an agent's structured result. At the end of a run, the result is checked. It must be an object (or JSON text of one) with every required field in the right type. Other fields are left out. If the result does not fit, the result node fails and the run with it; a parent workflow never receives an unchecked result.
- **Capabilities as a team** in the workflow settings: short tags for what the workflow can do (at most 20). They travel with the workflow (versions, export) and later help to find a fitting team. They grant no permissions.

In a parent workflow, a workflow with an output contract delivers an object with exactly these fields. A decision after it can therefore check a field directly, for example `score` greater than or equal to 5.

The check before starting warns when an agent before the result answers in plain text (then only a JSON answer helps) or when no agent delivers a required field. Invalid or repeated field names prevent a start.

Workflows with an output contract or capabilities appear in the palette under **Teams** and can be added directly as a sub-workflow. The inspector of a sub-workflow shows what the team delivers. A **double-click** on the node opens the team in the editor; the breadcrumbs at the top lead back to the parent workflow.

A team can be tested on its own: create a [test series](/docs/automatisierung#testreihen) for the workflow. Its checks can use the fields of the output contract, for example `score` greater than or equal to 5.

## Orchestrator {#orchestrator}
<!-- keywords: orchestrator, orchestration, delegate, pool, teams, decisions, run.orchestration_limit -->

An **orchestrator** lets an AI model decide which team gets which part of the task. It makes one decision after another: **delegate** a task to a team, or **finish** with an answer. The answer is the node's result.

- **Teams:** the saved workflows the model may choose from (at most 20). Of each team, the model only sees its name, description, capabilities and output contract.
- **Teams by capability:** instead of picking every team, name capabilities (at most 10). When a run starts, saved teams with a matching capability join the pool (up to *At most this many teams*): those with the most matching tags first, then by name. Teams with errors or approval steps are left out. The selection is fixed for that run (and for a published version); the run details show which tags each team matched. Nothing is scored or estimated.
- **Task** and **Instructions:** what should get done and, optionally, how to plan it.
- **Maximum decisions** (1 to 50, default 8) and **Maximum per team:** without an answer after the last decision, the step fails.

The orchestrator only chooses. It has no tools, creates no agents, tools or teams, and has no permissions of its own. Every chosen team runs as its **own linked run** with its share of the budget, its limits and its tool approvals. Decisions that are not allowed (an unknown team, the same task again, a team that was used up) are refused and shown to the model; they still count as a decision.

The run details list every decision with its reason, task, result and a link to the team's run. Teams that stop for an approval are not supported inside an orchestrator yet: they are cancelled at that point, and the check before the start warns about it. A team may not call the orchestrator's workflow again.

## Input forms {#eingabeformular}
<!-- keywords: form, input form, fields, type, required, default, choice, date, number -->

Instead of a free text box, the **Start** node can have an **input form**. The start dialog then asks for exactly these fields and checks them before the run begins.

| Type | Input |
|---|---|
| Text, Long text | free text |
| Number | a number, also with a decimal comma |
| Date | YYYY-MM-DD |
| Yes/No | a choice of yes or no |
| Choice | one of the defined values |
| File | one or more files from [Knowledge](/docs/wissen#start-dateien) |

Every field has a **label**, a **technical name** (letters, digits and _ only), and optionally a default, an explanation and *Required*. Agents read single values with `{{form.name}}`; `{{run.input}}` contains all values as "Label: value" lines, followed by the optional additional input. Decisions compare the values with their proper type.

[Schedules](/docs/automatisierung#zeitplaene), [batch runs](/docs/automatisierung#stapel) and [test series](/docs/automatisierung#testreihen) use forms as well. Workflows without a form behave as before.

## Continuing failed runs {#fortsetzen}
<!-- keywords: continue, resume, retry, restart, failed, cancelled -->

A failed or cancelled run can be **continued** (button *Continue* in the detail view). This creates a **new, linked run**; the old one stays unchanged.

- First Nodestro shows for every step whether its result is **taken over** or **run again**, and why.
- A result is taken over only if the step succeeded, neither it nor its tools, connections, input or files changed, and all its predecessors are taken over too. Changed steps and everything after them run again.
- Results taken over cost nothing in the new run; their cost stays with the old run and is not counted twice under [Usage](/docs/nutzung).
- Approval decisions of steps taken over remain valid and are marked as taken over; nobody is asked twice.
- If steps that run again had already called **own tools** that may act outside Nodestro (such as sending a message), you have to confirm this explicitly.

If nothing can be taken over safely, Nodestro offers a complete new start. Imported traces and single sub-workflow runs cannot be continued; continue the parent run instead.

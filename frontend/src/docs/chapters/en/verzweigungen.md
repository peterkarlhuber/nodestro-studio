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

The **Approvals** page (navigation, group *Run & review*) lists every open approval, oldest first, with workflow, origin (manual, schedule, batch, test series) and waiting time. The number next to the menu entry shows how many are waiting.

Each card shows the note, the results to review (structured results as labeled fields, the JSON one click away), a comment box and the buttons *Approve* and *Reject*; the buttons stay in view even with long results. Approvals inside sub-workflows appear here too, with the path to the parent run. Cards for [tool calls](/docs/verzweigungen#tool-freigabe) name the workflow and the step ("*workflow* · step *name*").

Runs that wait for a [budget decision](/docs/workflows#budget-freigabe) appear in their own section **Budget decisions** at the top, with a link to the run.

## Approving tool calls {#tool-freigabe}
<!-- keywords: tool approval, tool call, per call, approve tool calls, not enabled, rules for tool calls -->

Approvals for **single tool calls** are not enabled in this version. Tools an agent may use run without asking before each call. On the **Approvals** page, *Rules for tool calls* shows this state.

To have a person check results before the run goes on, use an [approval](/docs/verzweigungen#freigabe). To limit what an agent can do, assign it only the tools it needs (see [Assigning tools](/docs/agenten#tools)).

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

The inspector of an orchestrator starts with a sentence that sums up how it works ("How this orchestrator works: …") and groups the settings into four collapsible areas; each shows a summary and any problems in its header:

- **Team pool:** the **Chosen workflows** are the saved workflows the model may choose from (at most 20). Of each team, the model only sees its name, description, capabilities and output contract.
- **Teams by capability** (also in the team pool): instead of picking every team, name capabilities (at most 10). When a run starts, saved teams with a matching capability join the pool (up to *At most this many teams*): those with the most matching tags first, then by name. Teams with errors are left out; teams with approval steps are included. The selection is fixed for that run (and for a published version); the run details show which tags each team matched. Nothing is scored or estimated.
- **Assignment:** **Task** and **Instructions** (what should get done and, optionally, how to plan it) as well as the orchestrator's **Model**.
- **Limits:** **Maximum decisions** (1 to 50, default 8), **Maximum uses per team** and **Teams at the same time**. Without an answer after the last decision, the step fails.
- **Active line-up:** the options under [Dynamic teams](/docs/verzweigungen#dynamische-teams).

The orchestrator only chooses. It has no tools, creates no agents, tools or teams, and has no permissions of its own. Every chosen team runs as its **own linked run** with its share of the budget, its limits and its tool approvals. Decisions that are not allowed (an unknown team, the same task again, a team that was used up) are not carried out and are shown to the model; the run details call them *Invalid, not carried out*. They still count as a decision.

The run details list every decision with its reason, task, result and a link to the team's run. When a team stops for an **approval** (also in a sub-workflow or below another orchestrator), the orchestrator waits with it: the run is *paused* and shows up under **Approvals**. After the decision the same team run continues, also after a restart, and the model is not asked again about that delegation. When a rejection ends the team's run (*On rejection: end the run*), this run ends too; no other team can get around the rejection. Canceling a waiting run also cancels its waiting teams. A team may not call the orchestrator's workflow again.

**During the run** you can ask the team leader questions and give it instructions for its next decision, in the **Team leader** tab of the detail view; see [Talking to the team leader](/docs/ausfuehrungen#teamleitung). **Live steering** in the *Limits* area sets who may give instructions.

## Dynamic teams {#dynamische-teams}
<!-- keywords: dynamic team, assemble team, parallel, at the same time, parameters, start form, template, team composition, staffing -->

In the **Active line-up** area of an orchestrator (field *Dynamic teams*) the model gets more room, always inside the pool and the limits. Everything starts switched off.

- **Teams at the same time** (1 to 5, in the *Limits* area): one decision may give work to several different teams at once, for parts that do not depend on each other. Each team gets its own result.
- **Assemble the active line-up itself:** the orchestrator takes teams from the pool into its line-up and lets them go again when intermediate results call for it. Only teams in the active line-up get work; *At most in the active line-up* limits its size. The same team may work several times (up to *Maximum uses per team*). Without this option the orchestrator chooses from the whole pool.
- **Fill in the teams' start forms:** the orchestrator may set the fields of a team's input form (never files). The values are checked like a manual start; an unknown field or an invalid value is refused and shown to the model.

The pool is fixed when the run starts, in the versions of that moment. New teams, agents or tools never appear, and each team's approvals, budget and limits apply unchanged.

**What the run details show:** which orchestrator works with which model, how many decisions are used, the cost of the decisions and in total (unknown costs are shown as *not fully known*, never as 0), the pool with versions, the **Active line-up over time**, waiting teams and every decision with its reason, task, values and each team's outcome: *Succeeded*, *Waiting for approval*, *Failed*, *Rejected*, *Canceled* or *Expired*. Only the recorded decisions are shown, no reasoning of the model.

**Save team composition as a template:** an active line-up exists only during the run. After the end, this button saves a **new workflow** with the same orchestrator, its start form, its limits and exactly the teams that worked, in the versions of the run. Nothing is saved without this click.

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

A failed or canceled run can be **continued** (button *Continue* in the detail view). This creates a **new, linked run**; the old one stays unchanged.

- First Nodestro shows for every step whether its result is **taken over** or **run again**, and why.
- A result is taken over only if the step succeeded, neither it nor its tools, connections, input or files changed, and all its predecessors are taken over too. Changed steps and everything after them run again.
- Results taken over cost nothing in the new run; their cost stays with the old run and is not counted twice under [Usage](/docs/nutzung).
- Approval decisions of steps taken over remain valid and are marked as taken over; nobody is asked twice.
- If steps that run again had already called **own tools** that may act outside Nodestro (such as sending a message), you have to confirm this explicitly.

If a run was interrupted because Nodestro stopped while it ran, its detail view names the steps that did not finish and offers **Continue** right in the notice; those steps run again with the reason *Was interrupted*.

If nothing can be taken over safely, Nodestro offers a complete new start. Imported traces and single sub-workflow runs cannot be continued; continue the parent run instead.

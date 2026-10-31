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

## Sub-workflows {#unterworkflow}
<!-- keywords: sub-workflow, subworkflow, nesting, reuse, building block, version, child run -->

A **sub-workflow** runs another saved workflow as one step. Its result arrives like an agent's.

- **Version:** *Latest version* uses the current state; a fixed version does not change when the other workflow is edited later. The check reports when a newer version exists.
- **Input:** what the sub-workflow receives as input; `{{input}}` is what arrives here.
- **Values for its input form:** text or placeholders such as `{{form.customer}}` or `{{Analysis}}`. The check reports required fields without a value.
- The sub-workflow runs as its **own, linked run**; a link in the details leads there. Cost and tokens count once, in the budget of the parent run.
- A workflow must not call itself, not even indirectly; more than five levels are not allowed.
- If the sub-workflow waits for an approval, the parent run waits with it.

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

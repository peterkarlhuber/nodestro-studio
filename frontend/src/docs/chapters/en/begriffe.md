# Terms

The most important terms in Nodestro, each explained briefly with the chapter that says more. Similar terms are explicitly told apart here.

## Workflow {#workflow}
<!-- keywords: workflow, flow, node, connection, start, result -->

A **workflow** is a flow of nodes: a start, agents, decisions, approvals and a result. The connections decide which step receives the results of which other step. More under [Nodes](/docs/workflows#knoten).

## Agent {#agent}
<!-- keywords: agent, ai, model, system prompt, task, library -->

An **agent** is a step in which an AI model does a task: with a system prompt, a task and optionally tools, knowledge and memory. Agents in the **agent library** are templates; each workflow works with its own copy. More under [Agents](/docs/agenten#grundlagen).

## Tool {#tool}
<!-- keywords: tool, function, sandbox -->

A **tool** is a function an agent can call while it works, such as a calculator or your own Python code. The model decides when to use a tool; your own tools run in a sandbox. More under [Tools](/docs/tools#ueberblick).

## Knowledge {#wissen}
<!-- keywords: knowledge, documents, permanent, search -->

**Knowledge** is documents that stay stored and are assigned to agents, for example a handbook or a price list. They are available to every run of those agents until you delete them. More under [Knowledge](/docs/wissen#ueberblick).

## Input file {#eingabedatei}
<!-- keywords: input file, file, upload, run, one-off, difference knowledge -->

An **input file** is uploaded when a run starts, such as the contract to be reviewed. It belongs to that run only and does not end up in Knowledge. What several runs need belongs in Knowledge. More under [Input or knowledge?](/docs/datei-eingaben#eingabe-oder-wissen).

## Memory {#memory}
<!-- keywords: memory, notes, memory space -->

**Memory** is notes an agent writes and reads itself. *Per run* memory lasts for one run; *persistent* memory lives in a memory space and stays across runs. Unlike knowledge, the agent writes memory itself. More under [Memory types](/docs/memory#arten).

## Execution (run) {#ausfuehrung}
<!-- keywords: execution, run, status, result -->

An **execution** or **run** is a single pass of a workflow with a particular input. It has a status, costs, a result and a detail view for each step. More under [Status](/docs/ausfuehrungen#status).

## Version {#version}
<!-- keywords: version, save, history, restore -->

Every save that changes something creates a numbered **version** of the workflow. You can view, compare and restore older versions. More under [Versions](/docs/workflows#versionen).

## Publication (API version) {#veroeffentlichung}
<!-- keywords: publication, release, api version, publish, api -->

**Publishing** freezes a saved version as an API. Every publication gets its own number; later changes in the editor do not change it. Tools are frozen with it; the API reads knowledge and persistent memory live. More under [Publishing](/docs/api-und-export#veroeffentlichen).

## Test series {#testreihe}
<!-- keywords: test series, test, test case, check rule, quality -->

A **test series** holds fixed test cases with inputs and check rules for one workflow. A test run runs them against a particular version and shows how many cases passed. More under [Test series](/docs/automatisierung#testreihen).

## Approval {#freigabe}
<!-- keywords: approval, human, approve, reject -->

An **approval** is a step where the run stops until a person approves or rejects the result so far. More under [Approval](/docs/verzweigungen#freigabe).

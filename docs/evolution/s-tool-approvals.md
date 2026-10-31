# S-1/S-2: tool capabilities and per-call approval

- Status: **Accepted with conditions** (D10, project owner, 2026-10-31). The MCP thread (WP-5) and the adaptive
  orchestration thread (AO-11) reviewed it first. §8 checks the decision against the code; S-1 may start, and the
  open points of §8 go back to the project owner before S-2a is built.
- One mechanism only: there are no parallel permission or approval systems for MCP, orchestration or own tools.
- Scope: one mechanism for every tool kind: built-in, own Python tools, generated tools, MCP tools and the tools
  of orchestrated agents. This document describes the shared model (AO-11: "Evolution coordinates the tool metadata
  model") and the runtime interface that MCP WP-5 and the orchestration grants plug into.
- Related: [ADR-0006](../adr/0006-sandbox-policy.md) (who wrote the code, where it runs),
  [ADR-0007](../adr/0007-mcp-client.md) (MCP client, D-2: read-only MVP), the MCP threat model
  (`docs/mcp/threat-model.md`), evolution plan §3 (S row) and §4 (P3).

## 1. Facts today

| What | Where | Behavior |
| --- | --- | --- |
| Tool kinds | `tool_library.ToolKind` | `builtin`, `custom` (tool editor), `generated` (Coding Agent); MCP adds `mcp` (ADR-0007) |
| Who wrote the code | `ToolInfo.trust` (ADR-0006) | `trusted`, `user-authored`, `untrusted`; decides the sandbox, not what a tool does |
| Effect of a tool | nowhere | not recorded: Nodestro cannot tell a reading tool from one that sends mail |
| Automatic starts | `launcher.external_tools()` | schedules, batches and test series name all own tools and need one confirmation for the whole start |
| Approval | approval node (`ApprovalConfig`) | pauses the run **between** nodes; the run is stored as `paused` and continues in place after the decision, also after a restart |
| Hook per call | orkexa `before_tool(call)` | synchronous; `None`/`True` runs the call, a string/`False` denies it and the reason goes back to the model |
| Runtime hook | `engine.py` `before_tool` | only records the call (`ToolCallRecord`) and emits `tool_started` |
| Provider tools | `agent.server_tools` (web search, code execution, ...) | run at the provider; no `before_tool` call, so they cannot be held per call |

Consequences: an "ask before calling" cannot reuse the approval node directly, because a node that is paused in the
middle of an agent's tool loop cannot be continued: the model's next request would differ after a restart. And a
statement about the effect of a tool has to be new data; trust and sandbox say nothing about it.

## 2. S-1: capability statement per tool

A `ToolCapability` is stored with every tool version and shown wherever the tool is chosen:

| Field | Values | Meaning |
| --- | --- | --- |
| `access` | `read`, `write`, `destructive` | `read`: changes nothing anywhere; `write`: creates or changes data; `destructive`: deletes, pays, sends, or cannot be undone |
| `reach` | `internal`, `external` | `external`: talks to systems outside Nodestro (network, mail, other services) |
| `source` | `nodestro`, `author`, `admin`, `derived`, `default` | who made the statement; shown next to it |

Rules:

- A missing or unknown statement means `write` + `external` (the same rule as ADR-0007 D-2 for missing MCP
  annotations). Only a person or Nodestro itself can make a tool look harmless, never the tool's own code or a model.
- The statement is security information, **not proof** of harmless behavior (D10a). A `read` + `external` tool can
  still send data out through its arguments (MCP threat model, data exfiltration through tool arguments): the
  interface says so wherever such a tool is chosen, and the trace keeps its arguments.
- Built-in tools get their statement from Nodestro (`calculator`, `current_datetime`, ... `read` + `internal`;
  memory writes `write` + `internal`).
- Own and generated tools: the author states it in the tool editor; the Coding Agent may **suggest** a statement,
  which stays a suggestion until a person saves it. `reach` is derived as `internal` when the tool runs in an
  isolating sandbox without network (ADR-0006); the derivation is shown, not stored as the author's word.
- MCP tools: the administrator's classification when the tool is approved (ADR-0007 D-2); annotations are hints.
- Provider tools: fixed by Nodestro (web search and web fetch `read` + `external`, code execution `write` +
  `internal`). They run at the provider and cannot be held per call, so they are handled separately and visibly
  (§3.5): never silently treated as approved.

Changing a statement creates a new tool version, so releases and test results keep the statement they were made with.

## 3. S-2: "ask before calling"

### 3.1 Policy

Each tool binding of an agent gets `ask: "auto" | "always" | "never"`:

- `auto` (default for every new binding): ask when `access` is not `read`.
- `always`: ask for every call.
- `never`: never ask. For a new binding of a `write` tool only with a recorded reason (10 to 500 characters, like
  D6a, stored with the binding and shown); for a `destructive` tool never allowed (D10b: strict for destructive
  actions). `read` tools need no reason.
- **Legacy exemptions** (D10b): bindings that exist when S-2 ships keep working without asking. They are stored as
  `ask: "never"` with `legacy: true` and the tool version they were bound to, and shown as *exception from before
  S-2* in the agent inspector, the start dialogs and an overview in the settings. An exemption is never copied: a
  new binding (also copying an agent or a workflow), or a **new version of the tool** (new code, new capability),
  ends it and the binding becomes `auto`. The tool editor names the workflows, schedules and batches that will then
  ask (from "used in", UX-7) before the new version is saved, so nothing changes silently.

### 3.2 Runtime semantics

One function decides for every call, in the runtime's `before_tool`, before the call is recorded as started:

```text
decide(capability, binding, run context, grants) -> allow | deny(code, reason) | ask
```

- **allow**: as today.
- **deny**: the reason goes back to the model as the tool's error result (orkexa behavior), with a stable code
  (`tool.denied_by_policy`, `tool.not_granted`, `tool.approval_rejected`, `tool.approval_timeout`,
  `tool.approval_unattended`). The run continues; the trace shows the denial.
- **ask**: the node gets a pending `ToolApprovalRequest` (call id, tool, capability, `definition_hash` (MCP; `None`
  for other tools), the arguments that will be sent, requested at, deadline). The card shows the exact arguments:
  only credential-like values are redacted, each redaction is marked, and nothing is truncated silently (for MCP
  the arguments are the exfiltration channel, threat model T2/T6). An approval binds to these arguments and to the
  definition hash; if the definition changed before execution, the call is refused (`mcp.tool_changed`), never
  re-used. The run shows as *waiting for approval*, and the agent's thread
  **waits in `before_tool`** for the decision. Approve runs the call; reject denies it with the person's comment.
  The decision is recorded on the `ToolCallRecord` (who, when, comment) and in the run history.
- **Deadline**: 15 minutes by default (D10d). Longer waits up to 24 hours are a later capability; see §8 for why the
  first version caps lower. When it passes, the call is denied (`tool.approval_timeout`). The waiting time counts as
  run time, not as cost.
- **Restart while waiting**: the run keeps the status `running` while it waits (not `paused`), so a restart
  (`recover`) or a dead worker (`reap`) marks it *interrupted* as today, and the interruption marks every pending
  request `expired`. *Continue* runs the node again; no earlier decision is reused, because the model may ask for a
  different call.
- **No reuse**: a decision applies to one call id, its exact arguments and the tool version or definition hash. A
  rejected, expired or outdated decision is never applied to another call; a decision that arrives after the
  deadline is refused (`tool.approval_expired`).
- **Sandbox**: an approval only lets the call run as it would without the question, in its sandbox (ADR-0006). It
  never lifts an isolation requirement or a refused sandbox.
- **Unattended runs** (schedule, batch, test series): `ask` cannot be answered, so the call is denied at once
  (`tool.approval_unattended`) unless a matching **pre-grant** exists (D10c). A pre-grant is a stored record, enforced
  on the server: tool name, tool version or definition hash, scope (one schedule, one batch or one test-series run),
  who granted it and when, an optional expiry, and a revocation. It is checked at every call, so revoking it takes
  effect at the next call. A new tool version voids it. Pre-grants are not possible for `destructive` tools.
  This replaces today's blanket `confirm_external` for tools that would ask; tools that would not ask stay covered by
  the existing confirmation.
- **MCP in unattended runs**: denied, read tools included, until the MCP security acceptance; after it, ADR-0007
  D-7 applies (approved read-only MCP tools may run in schedules) through `CallContext.mcp_unattended`. Pre-grants
  never cover MCP tools that would ask.
- **Timeouts**: a tool's own call timeout (for example MCP's) starts after the approval, not when it was asked.
- **Published APIs** keep their own later approval phase (D10c; ADR-0007 WP-9 for MCP). Until then a call that
  would ask is denied in a published API run (`tool.approval_unattended`), and the publish check lists such tools.
- **Approval API**: deciding needs the run's permission (`run`; on a server the role and tenant of the run,
  ADR-0003), is written to the run history with the deciding principal, and returns the arguments only to principals
  who may read the run. Arguments are not written to logs.

Why waiting in `before_tool` and not pausing the run: a pause between tool calls cannot be continued after a restart
without a checkpoint of the agent's conversation. Waiting keeps orkexa unchanged. Its cost on a server is in §8.

### 3.3 Grants (AO-11)

The orchestration plan gives sub-agents and orchestrated steps a set of granted tools. The rules:

- A grant can only **narrow**: the effective set is the intersection of the parent's grant and the agent's own tool
  bindings, keyed by tool name. A tool outside the set is denied (`tool.not_granted`).
- A grant never turns `ask` into `allow`. Only a person can do that, per call or as a start grant.
- AO-3's default autonomy ("side-effect or critical actions need approval, read-only allowed within limits") is
  exactly `auto` on every binding of an orchestrated agent.
- Grants are a plain set of tool names (MCP tools by their name `mcp__<slug>__<tool>`). Count and cost limits are not
  part of grants; they belong to the budget and limit model (AO-12 reservations, `orkexa.flow` limits).
- Grants are derived again from the stored orchestration scope at every call, also after delegation and resume, and
  never cached in the agent. A `tool.not_granted` denial records the scope that refused it (node id or orchestrator
  invocation id), so the trace shows who narrowed the set.
- When the orchestrator selects or parametrizes an agent (AO-5), bindings may only get stricter (`never` → `auto` →
  `always`); a value that loosens is refused. Created agents (the admin-locked stage) start with `auto` everywhere.
- Unattended orchestrated runs deny `ask` calls at once like any other unattended run; there is no orchestrator
  exception. Waiting counts toward a flow's `max_duration_s`.

### 3.4 MCP (WP-5)

MCP tools supply their `ToolCapability` from the administrator's classification (`access` read, write or
destructive; `reach` always `external`; `source` `admin`; unclassified = `write` + `external`) and pass through the
same `decide`. Before `decide`, the MCP adapter keeps its own preconditions: the server is enabled, the tool is
approved, and the approved definition hash equals the one the server lists right before the call. These are refusals
with `mcp.*` codes, not approvals.
The MVP's "read-only tools only" rule (ADR-0007 D-2) becomes the policy "MCP tools with `access` ≠ `read` are denied
until WP-5". After WP-5 they can be used with `ask`. No MCP-specific approval path exists.

### 3.5 Provider tools

Web search, web fetch and code execution run at the provider; Nodestro sees them only in the response. They are:

- shown with their fixed capability wherever an agent uses them, with the note that they run without a per-call
  question;
- for a **new** binding of an external provider tool, enabled only with an explicit acknowledgement on the agent
  (stored, shown), like a `never` with a reason; existing ones are legacy exemptions;
- listed in the start confirmation of unattended runs and in the publish check;
- recorded in the trace as they come back from the provider.

## 4. Runtime interface

A new module `nodestro_runtime/tool_policy.py` (pure functions plus one waiter):

```python
class ToolCapability(BaseModel): access, reach, source
class ToolBinding(...):  ask, reason: str | None, legacy: bool = False, bound_version: int | None
class CallContext(BaseModel): run_id, node_id, trigger, attended, grants: set[str] | None,
                              pre_grants: list[ToolPreGrant], mcp_unattended: bool = False
class GateDecision(BaseModel): action: "allow" | "deny" | "ask", code: str | None, reason: str | None

def capability_of(tool: ToolInfo | ServerTool, *, isolation) -> ToolCapability
def decide(capability, binding, context) -> GateDecision      # no I/O, fully unit-tested
class ToolApprovals:                                           # waits for a decision with a deadline
    def request(run_id, node_id, call, capability, definition_hash, deadline) -> ToolApprovalRecord
    def decide(run_id, call_id, decision, comment, by) -> None      # stored; the waiter reads the store
```

- `engine.py` `before_tool` calls `decide` and, for `ask`, `ToolApprovals.request`. Orkexa stays unchanged.
- MCP's `ToolLibrary.tool()` adapter provides the capability; the orchestration driver provides `grants`.
- `ToolInfo` gains `capability: ToolCapability | None` (additive); `AgentConfig.tools` stays a list of names, and the
  bindings live in a new optional map `AgentConfig.tool_policies` (name → `ToolBinding`), so stored workflows load
  unchanged.

## 5. Pull request plan

1. **S-1a** runtime: `ToolCapability`, `capability_of`, defaults for built-in and provider tools, `ToolInfo.capability`
   (shown only, no behavior change). api/sdk/studio: show the statement in the tool list and the agent inspector.
2. **S-1b** studio + api: edit the statement in the tool editor (new tool version), Coding Agent suggestion.
3. **S-2a** runtime: `decide`, `ToolApprovals`, engine `before_tool`, records, codes; unattended denial and pre-grants;
   the worker capacity of §8 point 1 (after the project owner's answer).
4. **S-2b** api/sdk: decision route (`POST /runs/{id}/tool-approvals/{call_id}`), events, permissions (`run`; `approve`
   scope for published APIs).
5. **S-2c** studio: approval card for tool calls in the run view and the approvals page, docs ×6.
6. MCP WP-5 and the AO grants plug in on top of S-2a, in their own threads.

Pins move bottom-up once per step, coordinated with the other threads as usual.

## 6. Decision D10 (project owner, 2026-10-31)

GO for one shared mechanism for own, generated and MCP tools and orchestrated agents, with these conditions:

- **D10a** accepted: `read` / `write` / `destructive` and `internal` / `external`; unknown = `write` + `external`.
  The class is security information, not proof; read-only external tools can still send data out (§2).
- **D10b** accepted with a restriction: existing bindings keep working, but their exemptions are visible and never
  carried over to new bindings or materially changed tool versions; new bindings get `auto`; an explicit `never` must
  not be an unjustified bypass, strict for destructive actions (§3.1).
- **D10c** accepted with an addition: unattended runs deny calls that would ask unless an explicitly authorized,
  traceable, narrow and revocable pre-grant exists, enforced on the server. MCP: the stricter rule first; after the
  MCP security acceptance ADR-0007 D-7 (unattended read-only MCP calls) stays possible. Published APIs keep their own
  later approval phase (§3.2).
- **D10d** adjusted: 15 minutes by default. Up to 24 hours is a wanted long-term capability, but only after checking
  that it cannot block server workers and other resources; otherwise a safe shorter limit first. Timeouts must deny
  reliably, also after crashes and restarts (§3.2, §8).
- **D10e** accepted: the MCP threat model and ADR-0006 are the basis, extended for own, generated and provider tools.
  The technical security acceptance stays a separate step.
- Also: approvals bind to the call, its arguments and the tool version or definition; rejected, expired or outdated
  approvals are never reused; permissions, tenant isolation, audit and protection of sensitive data apply to the
  approval API; an approval never bypasses the sandbox; provider tools are handled separately and visibly; new rules
  never change existing schedules, batches or published APIs silently; small, tested PRs coordinated with the MCP
  and orchestration threads.

## 7. Questions for the review

- MCP thread: answered 2026-10-31 (agrees with the model and D10a–e; points 1–7 are folded into §3.1, §3.2, §3.4 and
  §4). Until S-2a lands, MCP codes against a `ToolCapability`-shaped `McpService.capability(tool)` and keeps non-read
  MCP tools refused.
- Orchestration thread: answered 2026-10-31 (agrees with §3–§5 and D10a–e). Grants stay a name set, with limits in
  AO-12; additions folded into §3.3. A kernel checkpoint replaces waiting in `before_tool` only after M4 (it needs a
  stored agent conversation).

## 8. Review against the code (D10 checks, 2026-10-31)

Checked in nodestro-runtime `78d2899`, nodestro-api `5ca1c75` and orkexa `456b92f`.

1. **Server workers execute one run at a time.** `RunWorker.serve` (`jobs.py`) claims a job and awaits the run to its
   end before claiming the next. A run waiting in `before_tool` therefore blocks a whole worker for as long as it
   waits: with 15 minutes and two waiting runs, a two-worker server executes nothing else. On the desktop runs execute
   in the API process without this limit. **Consequence (D10d):** the 24-hour wait is not safe without a checkpoint.
   Proposal for S-2a: on a server, a waiting run is limited to the default 15 minutes, and a worker may hold at most
   a configured number of waiting runs (`WorkerSettings.waiting_slots`, default 1) while it claims other jobs; a
   call that would exceed it is denied (`tool.approval_capacity`). Longer waits come with the kernel checkpoint
   (AO M4+), which can store the waiting run and free the worker. *This changes the worker from one job at a time to
   a small number of concurrent jobs, which is a server architecture change: it goes to the project owner before
   S-2a.* The alternative without that change is a lower server limit (for example 5 minutes) and blocking.
2. **Paused runs survive restarts.** `recover()` and `reap` leave `paused` runs as they are. A waiting run must
   therefore stay `running` (§3.2); then both mark it interrupted, and `_interrupt` gets one more step that marks
   pending requests `expired`. Without this, a request could outlive its deadline after a restart.
3. **The decision reaches the waiter through the store.** On a server the decision arrives in an API process and the
   run waits in a worker process. The waiter reads the stored request (as approval nodes store their decision) at a
   short interval and wakes on cancellation (`context.check()`); no in-memory signal is assumed.
4. **Cancellation while waiting** must end the wait at once and deny the call; the run then ends as cancelled.
5. **Copying** an agent or workflow, importing an export and creating from an example produce new bindings: they get
   `auto` (or keep `always`), never a copied legacy exemption or reason.
6. **Batches and test series run in the API process** (worker module docstring), schedules through the queue; both
   are unattended for this purpose, so only pre-grants matter there, not waiting.
7. **Provider tools** never reach `before_tool` (orkexa server tools); §3.5 covers them.

S-1 (capabilities, shown only) has no behavior change and can start. S-2a waits for the answer on point 1.

## 9. Threat model additions (D10e)

The MCP threat model (`docs/mcp/threat-model.md`) and ADR-0006 are the basis. For the other tool kinds:

| Threat | Tool kinds | Mitigation |
| --- | --- | --- |
| Generated code does more than its description (malicious or mistaken) | generated | ADR-0006: `untrusted`, isolating sandbox without network; capability `default` until a person states it; `auto` asks for anything not `read` |
| A user-authored tool runs on the host with network (desktop) | custom | `reach` is not derived as `internal` without isolation; unknown = `write` + `external` |
| Prompt injection in a tool result or document makes the model call a writing tool | all | `auto` asks for every non-read call and shows the exact arguments; unattended runs deny without a pre-grant |
| Data leaves through the arguments of a reading external tool (search query, URL) | provider web tools, MCP read tools, custom tools with network | shown as `read` + `external` with the note that reading is not harmless; arguments kept in the trace; an explicit acknowledgement for new external provider tools |
| An approval is replayed for another call | all | decisions bind to call id, arguments and tool version or definition hash; no reuse |
| A long wait exhausts server workers | all, server | §8 point 1: a short limit and a capacity cap before longer waits |

The technical security acceptance of the implementation stays a separate step (D10e).

# S-1/S-2: tool capabilities and per-call approval

- Status: **Proposal** (2026-10-31), for review by the MCP thread (WP-5) and the adaptive orchestration thread (AO-11),
  then decision D10 by the project owner. No code yet.
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
- Built-in tools get their statement from Nodestro (`calculator`, `current_datetime`, ... `read` + `internal`;
  memory writes `write` + `internal`).
- Own and generated tools: the author states it in the tool editor; the Coding Agent may **suggest** a statement,
  which stays a suggestion until a person saves it. `reach` is derived as `internal` when the tool runs in an
  isolating sandbox without network (ADR-0006); the derivation is shown, not stored as the author's word.
- MCP tools: the administrator's classification when the tool is approved (ADR-0007 D-2); annotations are hints.
- Provider tools: fixed by Nodestro (web search `read` + `external`, code execution `write` + `internal`); they
  cannot be held per call, so a policy that would ask for them is reported as a configuration problem instead.

Changing a statement creates a new tool version, so releases and test results keep the statement they were made with.

## 3. S-2: "ask before calling"

### 3.1 Policy

Each tool binding of an agent gets `ask: "auto" | "always" | "never"`:

- `auto` (default for new bindings): ask when `access` is not `read`.
- `always`: ask for every call.
- `never`: never ask. Allowed for `write` + `external` only with a recorded reason (like D6a), and not allowed at
  all for `destructive` + `external`.

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
- **Deadline**: default 15 minutes, configurable per workflow up to 24 hours. When it passes, the call is denied
  (`tool.approval_timeout`). The waiting time counts as run time, not as cost.
- **Restart while waiting**: the run becomes *interrupted*, as today. *Continue* runs the node again; an earlier
  decision is not reused, because the model may ask for a different call.
- **Unattended runs** (schedule, batch, test series, published API without a person): `ask` cannot be answered, so
  the call is denied at once (`tool.approval_unattended`) unless the start confirmation granted the tool for this
  start. That extends today's `confirm_external` from "all own tools" to a per-tool grant. Start grants never cover
  MCP tools, and until the MCP security acceptance (ADR-0007 D-7) MCP tools are denied in unattended runs, read
  tools included (`CallContext.mcp_unattended`, default `false`).
- **Timeouts**: a tool's own call timeout (for example MCP's) starts after the approval, not when it was asked.
- **Published APIs**: a key with the `approve` scope can decide, like approval nodes today.

Why waiting in `before_tool` and not pausing the run: a pause between tool calls cannot be continued after a restart
without a checkpoint of the agent's conversation. Waiting keeps orkexa unchanged and works on desktop and server. On a
server it holds a worker slot while it waits; that is acceptable for the first version, and the orchestration kernel
(`orkexa.flow`, AO-1) can later replace it with a real checkpoint that frees the worker.

### 3.3 Grants (AO-11)

The orchestration plan gives sub-agents and orchestrated steps a set of granted tools. The rules:

- A grant can only **narrow**: the effective set is the intersection of the parent's grant and the agent's own tool
  bindings, keyed by tool name. A tool outside the set is denied (`tool.not_granted`).
- A grant never turns `ask` into `allow`. Only a person can do that, per call or as a start grant.
- AO-3's default autonomy ("side-effect or critical actions need approval, read-only allowed within limits") is
  exactly `auto` on every binding of an orchestrated agent.

### 3.4 MCP (WP-5)

MCP tools supply their `ToolCapability` from the administrator's classification (`access` read, write or
destructive; `reach` always `external`; `source` `admin`; unclassified = `write` + `external`) and pass through the
same `decide`. Before `decide`, the MCP adapter keeps its own preconditions: the server is enabled, the tool is
approved, and the approved definition hash equals the one the server lists right before the call. These are refusals
with `mcp.*` codes, not approvals.
The MVP's "read-only tools only" rule (ADR-0007 D-2) becomes the policy "MCP tools with `access` ≠ `read` are denied
until WP-5". After WP-5 they can be used with `ask`. No MCP-specific approval path exists.

## 4. Runtime interface

A new module `nodestro_runtime/tool_policy.py` (pure functions plus one waiter):

```python
class ToolCapability(BaseModel): access, reach, source
class ToolBinding(BaseModel): name, ask = "auto"            # per agent tool
class CallContext(BaseModel): run_id, node_id, trigger, attended, grants: set[str] | None, start_grants: set[str],
                              mcp_unattended: bool = False
class GateDecision(BaseModel): action: "allow" | "deny" | "ask", code: str | None, reason: str | None

def capability_of(tool: ToolInfo | ServerTool, *, isolation) -> ToolCapability
def decide(capability, binding, context) -> GateDecision      # no I/O, fully unit-tested
class ToolApprovals:                                           # waits for a decision with a deadline
    def request(run_id, node_id, call, capability, deadline) -> ToolApprovalRecord
    def decide(run_id, call_id, decision, comment, by) -> None
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
3. **S-2a** runtime: `decide`, `ToolApprovals`, engine `before_tool`, records, codes; unattended denial and start grants.
4. **S-2b** api/sdk: decision route (`POST /runs/{id}/tool-approvals/{call_id}`), events, permissions (`run`; `approve`
   scope for published APIs).
5. **S-2c** studio: approval card for tool calls in the run view and the approvals page, docs ×6.
6. MCP WP-5 and the AO grants plug in on top of S-2a, in their own threads.

Pins move bottom-up once per step, coordinated with the other threads as usual.

## 6. Decisions for the project owner (D10)

- **D10a** Capability classes `read` / `write` / `destructive` and `internal` / `external`, unknown = `write` +
  `external`. *Recommended.*
- **D10b** Existing tool bindings: (1) stay as they are (`never`), new bindings get `auto`, and the agent
  inspector shows "asks: never" for write tools; or (2) all bindings become `auto` at once. (2) is safer but stalls
  existing schedules and batches whose tools write, which would then be denied unattended. *Recommended: (1).*
- **D10c** Unattended runs deny `ask` calls unless the start granted the tool. *Recommended.*
- **D10d** Waiting deadline 15 minutes by default, up to 24 hours per workflow. *Recommended.*
- **D10e** S-0: the MCP threat model plus ADR-0006 count as the threat model that S-1/S-2 needs, extended by one
  section for own tools and provider tools. *Recommended.*

## 7. Questions for the review

- MCP thread: answered 2026-10-31 (agrees with the model and D10a–e; points 1–7 are folded into §3.1, §3.2, §3.4 and
  §4). Until S-2a lands, MCP codes against a `ToolCapability`-shaped `McpService.capability(tool)` and keeps non-read
  MCP tools refused.
- Orchestration thread: is `grants` per call context enough for M2 governance, or do grants need to carry limits
  (count, cost) per tool? Should the waiting in `before_tool` move into the flow kernel later as a checkpoint?

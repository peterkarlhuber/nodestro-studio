# ADR-0008: Live run chat and steering of orchestrators

- Status: Proposed (2026-11-01, LRC-1). Accepting the pull requests accepts this record.
- Repositories: nodestro-runtime (`nodestro_runtime.run_chat`, the decision boundary in `engine.py`), nodestro-api
  (`nodestro_api.api_run_chat`: REST and SSE), nodestro-sdk (client methods), nodestro-studio (run page tab "Team
  leader"), nodestro-server (end-to-end test with a worker). orkexa: unchanged.
- Related: [ADR-0003](0003-identity-and-tenants.md) (roles, tenants), [ADR-0004](0004-jobs-workers-scheduler.md)
  (leases and fencing). The design and API contract of LRC-1 are in the project files
  (`live-run-chat/design.md`).

## Context

During a multi-agent run, an orchestrator (team leader) decides step by step which teams work next; teams of one
decision can run in parallel. People want to (A) ask what is going on without changing anything and (B) give the
team leader an instruction it takes into account, without interrupting or restarting specialists that already work.
Runs execute in the API process (desktop, local container) or in a worker process (server); several API processes
can serve one run.

Orkexa's `arun_orchestration` calls the `decide(prompt)` callback that Nodestro supplies, once per decision and only
between decisions: while teams of a decision run, no `decide` call is in progress. That callback is the one safe
decision boundary, and it is Nodestro's code.

## Decision

1. **No change to orkexa and no second engine.** Instructions join the prompt of the next `decide` call inside
   `RunManager._orchestrate`. A model call that has started, a running team and the orchestration record are never
   changed by a message.
2. **Messages are stored state.** Collection `run_messages` of the tenant's `DocumentStore`, key
   `<root run id>:<seq>`; the sequence number is assigned under a store transaction and a lock on the root run
   (PostgreSQL: advisory transaction lock), so several processes produce one order. Status changes are
   compare-and-set on `status`. Instructions: `queued` → `delivered` (part of a decision prompt) → `considered`
   (that decision was recorded), or `rejected` / `expired` with a code. Questions: `pending` → `answered` or
   `failed`.
3. **Delivery is fenced.** A delivery is recorded in `NodeRun.guidance` and saved with the run's fence (C-06); a
   worker that lost its lease cannot save and therefore neither delivers nor confirms. An instruction delivered to
   a decision that was never recorded is delivered again to the next one.
4. **Instructions are untrusted text.** They are quoted in a marked block with an introduction that says they are
   wishes of a person, not system rules; marker look-alikes in the text are neutralized. They cannot approve,
   skip checkpoints, grant rights, change policies, sandboxes, MCP controls, budgets, credentials or tenants:
   none of these is reachable from a prompt.
5. **Questions are answered by a separate, tool-less model call** (the workspace's assistant model) from a snapshot
   of the stored run state. The answer is stored in the conversation; it is not part of the run's result or usage.
   Its cost is recorded in the usage log under the source `run_chat`, limited by a separate chat budget (default
   0.50 USD per run), counts and a rate limit. Unknown cost is shown as unknown, never as 0.
6. **Steering needs a person.** `OrchestratorConfig.live_steering`: `attended` (default; runs started by a person
   in the studio), `always`, `off`. Runs from the API, schedules, batches and test series get no steering unless
   the workflow says `always`. The setting is excluded from fingerprints, so resuming keeps cached results.
7. **Permissions.** Reading the conversation needs `read`; questions (they cost money) and instructions need
   `run`. The sender is the request's principal. The event stream re-checks access.

## Options weighed

- **Interrupting the running model call or team** (cancel and restart with the instruction): rejected; it wastes
  paid work, can repeat side effects of tools and breaks the rule that a run never repeats itself.
- **A hook inside orkexa between steps:** rejected; the `decide` callback is already that boundary.
- **Delivery over the run event bus only:** rejected; events are not durable across restarts and would not give a
  total order or fenced proof of delivery.

## Consequences

- Existing workflows and runs without messages behave exactly as before (no guidance block, no stored messages).
- An instruction given during the last decision cannot be taken into account; it expires with the run.
- Questions report what is stored; specialists' work that is not saved yet is not visible in an answer.
- Run export and trace import carry the conversation; deleting a run deletes it; backups include it.

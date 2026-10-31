# S-2: waiting tool approvals on server workers (technical concept)

- Status: **Concept for review** (2026-10-31). The project owner chose option A ("waiting slots per worker") with
  conditions 1–8 below; this concept checks whether A is safe and manageable. S-2a starts only after this review. If
  A turns out not to be, the fallback is option C (no per-call questions on a server until an agent checkpoint
  exists), not a blocking short limit.
- Context: [s-tool-approvals.md](s-tool-approvals.md) §3.2 and §8; ADR-0004 (jobs, workers, scheduler).
- Checked in nodestro-runtime `78d2899` (`jobs.py`, `engine.py`, `storage_postgres.py`) and nodestro-api `5ca1c75`
  (`worker.py`).

## 1. Today

- `RunWorker.serve` claims one run job and awaits the run until it ends or pauses, then claims the next. While it
  awaits, it flushes the run's events and renews the job's lease (`heartbeat`, every lease/3 = 20 s); a lost lease
  cancels the run; a cancel request on the job cancels it.
- A run executes as an asyncio task of the tenant's `RunManager`; each agent node runs its tool loop in a thread
  (`asyncio.to_thread`), and orkexa calls the runtime's `before_tool` in that thread.
- Shared per process: one PostgreSQL connection (`PostgresDatabase`, guarded by an `RLock`), one event log per tenant
  (`PostgresEventLog`, guarded by a lock), one workspace and `RunManager` per tenant. The desktop already executes
  several runs of one `RunManager` at the same time; the server worker does not.
- `recover()` and `reap()` turn `queued`/`running` runs into *interrupted*; `paused` runs are left alone.
- Approval nodes store their decision in the run; the run continues from the store, also in another process.

## 2. Design

### 2.1 Two bounded counters per worker

The worker gets two explicit limits (`WorkerSettings`):

| Setting | Default | Meaning |
| --- | --- | --- |
| `max_runs` | 2 | runs this worker holds at the same time, executing or waiting; the hard upper bound of its capacity |
| `max_waiting` | 1 | of those, how many may wait for a tool approval |

The worker claims a new job only while `held < max_runs` and **no held run is executing** (every held run waits).
With the defaults it behaves as today (it claims the next run only when nothing executes) plus one parked run:

1. Idle: claim run A (held 1).
2. A asks: A waits (waiting 1). One run waits and none executes, so the worker claims run B (held 2 = `max_runs`).
3. B asks too: `waiting` would be 2 > `max_waiting`, so B's call is **denied** at once with `tool.approval_capacity`.
   The denial goes to the model and into the trace and run history, and B continues. Nothing queues.
4. A is approved while B executes: A executes again in the slot it already held (held stays 2), so for that time
   two runs execute in this worker. That is the configured bound, not an extra slot (condition 3): the worker
   claims nothing until both have ended or are waiting again.

`max_runs` bounds concurrent executions per worker absolutely (condition 1). Other workflows keep running while
approvals are pending, because a waiting run no longer stops the worker from claiming (condition 2). With N workers
at most N × `max_waiting` runs wait server-wide.

### 2.2 Waiting

- The request is stored in the run (`NodeRun.tool_approvals`, keyed by call id) with status `pending`, the deadline
  (`now + 15 min`, the server maximum, condition 4), the arguments that will be sent, and the tool version or MCP
  definition hash.
- The run keeps the status `running`; the node shows *waiting for approval*. The waiter (in the agent's thread)
  re-reads the stored request every second until it is decided, the deadline passes, or the run is cancelled
  (`context.check()`). Decisions are never delivered in memory, so they reach the worker that holds the run through
  the database (condition 6). The waiter runs in the agent thread, not in the worker's event loop, so heartbeats
  and event flushes continue.
- Each status change is a compare-and-set on the stored request (`pending` → `approved` / `rejected` / `expired` /
  `cancelled`). A decision and an expiry that race resolve to whichever is stored first; the loser is refused
  (`tool.approval_expired`) and changes nothing. The waiter acts only on the final stored status.

### 2.3 Failure cases (condition 7)

| Case | Handling |
| --- | --- |
| Deadline passes | the waiter sets `expired` (compare-and-set) and denies the call; a later decision is refused |
| Cancel (person, job cancel request) | `context.check()` raises in the waiter; the request becomes `cancelled`, the run ends cancelled |
| Lost lease | the worker cancels the run (as today); the reaper marks it interrupted; pending requests become `expired` |
| Worker crash | the lease expires; `reap` marks the run interrupted and expires pending requests (`_interrupt` gets this step) |
| API or desktop restart | `recover()` does the same for runs that were `running` |
| Continue after interruption | the node runs again; old requests stay `expired` and are never matched to a new call (new call id, and the decision binds to the arguments and the definition) |
| Decision for another tenant's run | impossible: the decision route resolves the run in the caller's tenant store only |

### 2.4 Desktop

There is no worker on the desktop. The same limits apply per process (`max_waiting` 3 by default, since runs there
execute concurrently anyway), with the same 15-minute deadline and the same failure handling through `recover()`.

## 3. Code changes

| Repository | Change |
| --- | --- |
| runtime `jobs.py` | `RunWorker.serve` keeps a set of held jobs instead of one awaited run; each held job has its own heartbeat/flush task (today's `_execute`, unchanged inside); claiming follows §2.1. `run_once` stays for tests. |
| runtime `engine.py` | `before_tool` asks `tool_policy.decide`; for `ask` it enters the waiting capacity (callback from the worker or the desktop limit) or denies with `tool.approval_capacity`; `_interrupt` expires pending requests. |
| runtime `tool_policy.py` | `ToolApprovals` (store-backed requests, compare-and-set, waiter) |
| runtime `schemas.py` | `NodeRun.tool_approvals` (additive) |
| api `worker.py` | `WorkerSettings.max_runs`, `max_waiting` (environment `NODESTRO_WORKER_MAX_RUNS`, `NODESTRO_WORKER_MAX_WAITING`) |
| api | decision route (S-2b) |

## 4. Alternatives

- **C: no per-call questions on a server** until an agent checkpoint exists (AO M4 or later): calls that would ask
  are denied on a server (`tool.approval_unavailable`). No worker change, safe, but a server can then only use
  writing tools through legacy exemptions, reasons and pre-grants. This is the fallback.
- **A without the reserved slot:** a waiting run releases its slot completely, and an approved run waits for a free
  slot. That keeps one execution per worker, but an approved call could wait behind a long run for hours: an
  unbounded wait, so it is rejected.
- **A dedicated "waiting" worker process:** more operation and IPC for the same effect; rejected.
- **Real suspension (checkpoint):** needs the agent's conversation stored mid tool loop; not before AO M4.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Two runs of one tenant execute in one worker for the first time | the same `RunManager` already does this on the desktop; tests below run two in one worker |
| Event log or database connection under concurrent flushes | both are lock-guarded today; a test flushes from two held jobs |
| A heartbeat starves while another run is busy | heartbeats run in the event loop, agent work in threads; a test blocks one agent thread and checks the other job's lease |
| More memory and CPU per worker | `max_runs` is explicit and documented; default 2 |
| A run asks while the worker is full | denied at once and visible, never queued (condition 5) |

## 6. Tests

Regression (must keep passing): `tests/test_jobs.py`, the worker and server tests in nodestro-api, and the server
e2e (`NODESTRO_TEST_POSTGRES`).

New, against a real PostgreSQL:

1. Defaults behave as today: two queued runs without questions execute one after the other.
2. A waits, B is claimed and finishes, A is approved and finishes; held never exceeds `max_runs`.
3. A waits, B asks: B is denied with `tool.approval_capacity` and continues; nothing is queued.
4. A approved while B executes: still two held, no third claim until one ends.
5. Approve and expire at the same moment (threads): exactly one wins; the loser is refused.
6. Deadline passes: denied, request `expired`, a later decision refused.
7. Cancel while waiting: run cancelled, request `cancelled`, the waiting thread ends.
8. Lost lease while waiting: run cancelled locally, interrupted by the reaper, request `expired`.
9. Worker crash (process killed): reaper marks interrupted, request `expired`; continuing creates new requests only.
10. Two tenants, one worker: a decision for tenant A's run is invisible to tenant B and cannot decide B's request.
11. Heartbeats: one held run blocks its agent thread for longer than the lease while the other job's lease stays alive.
12. Load: 3 workers, 30 runs where every third asks, decisions arriving at random; nothing exceeds the limits, every
    run ends, no request stays `pending`.

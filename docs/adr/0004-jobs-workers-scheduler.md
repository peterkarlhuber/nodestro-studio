# ADR-0004: Persistent jobs, workers and the scheduler

- Status: Proposed (M0, 2026-10-31)
- Repositories: nodestro-runtime (engine, queue), nodestro-api (worker entry point, streams), nodestro-server
  (deployment)

## Context

Runs execute as `asyncio` tasks of the process that started them (`RunManager._tasks`); live events and SSE
subscribers are in memory; `recover()` marks every `queued`/`running` run as interrupted at startup; schedules,
batches, benchmarks, architect jobs, assistant replies and tool generation run as tasks or daemon threads in the same
process. The data-directory lock (`nodestro.lock`) is what keeps a second process from duplicating schedules and
interrupting runs. See [inventory, section 2](../desktop-server/inventory.md#2-state-that-lives-only-in-the-process).

## Decision

1. **One engine.** `RunManager` and its node execution stay the only workflow engine. What changes is *where* a
   run's `_execute` is called and how its events leave the process.
2. **Desktop keeps in-process execution** (`JobExecution = "inline"`), including the data-directory lock and the
   restart behavior (`run.interrupted`, continue with resume).
3. **Server uses a persistent queue** (`JobExecution = "queue"`) in PostgreSQL: table `nodestro_jobs` (tenant, kind,
   payload reference, state, attempts, lease owner, lease expiry, idempotency key, cancel requested). Workers claim
   with `SELECT ... FOR UPDATE SKIP LOCKED`, renew the lease by heartbeat and record the outcome in the same
   transaction as the run's final state. A confirmed job (row committed) is never lost; a worker that dies loses only
   its lease.
4. **Recovery without silent replays.** An expired lease marks the run `run.interrupted`, exactly as a desktop restart
   does today. Automatic continuation uses the existing resume logic and only for runs without unconfirmed side
   effects; everything else waits for a person, as the current `confirm_side_effects` contract requires.
5. **Cancellation** sets `cancel_requested`; the worker observes it at node boundaries and through the existing
   cancellation path.
6. **Events:** each event is appended to `nodestro_run_events (tenant, run_id, seq, data)` (the per-run `seq` already
   exists and is persisted for paused runs), and `NOTIFY` wakes API replicas. SSE endpoints read from the table after
   `Last-Event-ID` and then follow notifications, so any API replica can serve any stream.
7. **Scheduler:** exactly one instance fires schedules, elected with a PostgreSQL advisory lock
   (`pg_try_advisory_lock`) held for the session; the others stand by. Firing a slot is idempotent per
   `(schedule_id, slot)`.
8. **Other background work** (batches, benchmarks, architect, assistant, tool generation, Python installs) moves to the
   same queue as separate job kinds in M5. Until then the server profile runs them in the API process and documents
   that a restart interrupts them, as it does on the desktop today.
9. **Entry points:** `nodestro-api worker` and `nodestro-api scheduler` (same package, same composition, profile
   `server`). No second application.

## Options considered

- **Celery, RQ, Redis or a message broker**: rejected for now; PostgreSQL is required anyway and handles the expected
  volume. Revisit if throughput demands it.
- **Kubernetes Jobs per run**: rejected; too coarse (approvals pause runs for days) and ties Nodestro to one platform.
- **Leader election with a separate coordination service**: unnecessary with advisory locks.

## Consequences

- Required tests (M5): kill a worker mid-run (lease expiry → interrupted, never duplicated); restart the API while a
  stream is open (client resumes from `Last-Event-ID`); two schedulers (only one fires); cancellation across processes;
  tenant isolation of the queue.
- The desktop path gets no new moving parts.

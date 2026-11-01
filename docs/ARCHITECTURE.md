# Architecture

> Since 0.2, Nodestro is split across six repositories (runtime, API, studio, SDK, integrations, examples). How they
> fit together, how versions are pinned and how the upgrade from 0.1 works is described in
> [PLATFORM.md](PLATFORM.md). Three more repositories package the same components as products: `nodestro-desktop`,
> `nodestro-local-docker` and `nodestro-server`. This document describes the running processes in each operating
> profile and the architecture inside them; module names give the package a module lives in today. The decisions
> behind the profiles are in [adr/](adr/README.md). All three products are unreleased previews.

Nodestro is one engine, one API and one studio that run in three operating profiles. In every profile a FastAPI
application provides the REST API, `orkexa` handles everything related to the AI providers, and Nodestro uses the
native, provider-independent `Agent` (`nodestro_runtime.providers` manages keys, endpoints and capabilities). The
profiles differ in where data is stored, who may send requests, where runs execute and where tool code runs:

- **desktop** (the default): a single local process on one data folder with SQLite, reachable on loopback only.
- **local-container** (Nodestro Local Docker): the same single-user studio with SQLite, in a container, used from
  the host's browser with an access key; tool code runs in sandbox containers through a sandbox gateway.
- **server** (Nodestro Server): many users and tenants, PostgreSQL, OpenID Connect logins, API processes and worker
  processes that share a persistent job queue, and a separate Docker daemon for tool code.

## Operating profiles

`nodestro_runtime.profile.RuntimeProfile` (ADR-0001) is an immutable object with the profile's `kind` (`desktop`,
`local-container` or `server`) and its data directory. It is built once at startup, from code
(`RuntimeProfile.desktop(data_dir)`) or from `NODESTRO_PROFILE` and `NODESTRO_DATA_DIR`
(`RuntimeProfile.from_env()`), and validated before any file or database is touched. An unknown value, a data
directory that contradicts the profile, or a server profile without complete `ServerSettings` is refused with
`profile.invalid`; nothing falls back to another profile. The profile also selects the sandbox policy
(`nodestro_runtime.sandbox_policy.SandboxPolicy`, ADR-0006).

```
 desktop                          local-container                       server
 ───────                          ───────────────                       ──────
 browser or desktop window        browser on the host                   browsers
   │ http://127.0.0.1:<port>        │ http://127.0.0.1:<port>             │ https
   │                                │ (port published by Docker)          ▼
   ▼                                ▼                                   TLS reverse proxy
 nodestro / nodestro-api          nodestro-local serve                    │
 (one process)                    (one process in a container)            ▼
   │                                │                                   nodestro-server api (1..n)
   │                                │                                     │ enqueue runs · read run events
   ▼                                ▼                                     ▼
 SQLite + files in                SQLite + files in a Docker            PostgreSQL 17 (all tenants)
 the data folder                  volume                                  ▲  + tenant files on a shared volume
   │                                │                                     │ claim jobs · write run events
   ▼                                ▼                                   nodestro-server worker (1..n)
 tool code: subprocess,           tool code: sandbox containers           │
 built-in Linux sandbox           through the sandbox gateway             ▼
 or Docker                        (holds the host's Docker socket)      tool code: containers of a separate
                                                                        Docker daemon (DOCKER_HOST)
```

Inside each process the components are the same; only the storage backends behind them differ:

```
Browser (React, React Flow)                                         nodestro-studio
   │  REST /api/*  ·  Server-sent events /api/runs/{id}/events
   ▼
FastAPI (nodestro_api.app or                                        nodestro-api
         nodestro_api.server_app) ──► Nodestro (nodestro_api.context)
                                 │  organization, assistants, architect, batch runs, schedules,
                                 │  publishing, keys, network, export, backup, MCP
                                 ▼
                              Workspace (nodestro_runtime.workspace)  nodestro-runtime
                              ├─ Store            DocumentStore: SQLiteStore, or PostgresStore per tenant
                              ├─ RunManager       DAG engine, live events, budget, cancellation, tool gate
                              ├─ AgentBuilder     AgentConfig → orkexa.Agent
                              ├─ ToolLibrary      ToolRegistry, sandbox policy, ToolBuilder, MCP tools
                              ├─ KnowledgeBase    SQLiteFileStore + SQLiteIndex (FTS5),
                              │                   or PostgresFileStore + PostgresIndex
                              ├─ MemorySpaces     SQLiteMemory, or PostgresMemory per memory
                              ├─ ToolDrafts       AI tool drafts until approval
                              └─ Extensions       tools and OCR from integrations   ◄── nodestro-integrations
                                       │
                                       ▼
                              orkexa → Anthropic · OpenAI · Gemini · OpenAI-compatible/Ollama/vLLM
```

### Desktop

- **Process:** `nodestro` (the studio) or `nodestro-api` runs everything in one process: API, runs, schedules and
  background work. The desktop app (`nodestro-desktop`, a Tauri 2 shell with a bundled CPython; a Linux x86_64
  preview) starts the same backend with `python3 -I -m nodestro_studio` on a free loopback port.
- **Storage:** one SQLite file in the data folder (`~/.nodestro` by default) and the files beside it. The schema has
  a version; a migration first writes a backup to `<data_dir>/backups/` (ADR-0002).
- **Network:** the studio API has no login, so it is never offered to the network
  (`nodestro_api.local_access.require_loopback_only`): it listens on a loopback address only, and `0.0.0.0` or any
  other address is refused with `access.network_needs_login`. `LocalAccessMiddleware` answers only loopback host
  names (against DNS rebinding), refuses forwarded requests and accepts changing requests only from the studio's own
  origin or from this computer. These checks protect against web pages in the browser; they are not
  authentication.
- **Launch secret:** the desktop app passes a random 256-bit secret in `NODESTRO_LAUNCH_SECRET` and opens
  `/api/launch?token=…` once; the backend exchanges it for an `HttpOnly`, `SameSite=Strict` cookie
  (`nodestro_api.launch.LaunchSecretMiddleware`). Every other request without that cookie gets 401
  `access.launch_required`, except `/api/health` and the key-protected `/api/published` routes. Without the variable
  (the `nodestro` command in a terminal) nothing changes.

### Local container

- **Product:** Nodestro Local Docker (`nodestro-local-docker`) runs the desktop's studio for one person in a
  container. Its image is built from the server's image definition (`nodestro-server` `image/Dockerfile`, target
  `local`); `nodestro-local` is its command (`serve`, `link`, `rotate-key`, `logout`, `backup`, `restore`, `status`,
  `check`, `gateway`).
- **Storage:** SQLite and files in a Docker volume, as on the desktop.
- **Access:** the process listens on the container's interfaces, and Docker publishes the port on the host's
  loopback only. Every request except the health check and the published APIs needs the installation's access key
  (`NODESTRO_ACCESS_KEY_FILE`, 256 bits): the browser exchanges it once per session through the link that
  `nodestro-local link` prints, scripts send it as `Authorization: Bearer`. Host and origin checks are strict (only
  loopback host names, changing requests only from the exact origin), and there is no network listener for published
  APIs (`nodestro_api.local_container`).
- **Sandbox gateway:** the Nodestro container never gets the host's Docker socket. A separate gateway container
  (`nodestro_runtime.sandbox_gateway`, the same image, no network) holds it and offers Nodestro a socket that
  answers only the Docker API requests the sandboxes need, in their safe form: no network, read-only root, all
  capabilities dropped, user `nobody`, limits, no mounts, only images Nodestro builds (`nodestro-env:<key>`), nothing
  pulled. The built-in Linux sandbox does not count as isolating in this profile.

### Server

- **Processes:** `nodestro-server` (`nodestro_api.server`, shipped as the `nodestro-server` image) has the commands
  `check`, `migrate`, `api`, `worker`, `backup`, `create-tenant`, `setup-link`, `members`, `set-role`,
  `remove-member`, `revoke-sessions` and `pricing`. Every command first validates the whole configuration
  (`nodestro_runtime.server_settings.ServerSettings.from_env`) and lists every problem at once (`profile.invalid`).
  Operation is described in the server's
  [runbook](https://github.com/peterkarlhuber/nodestro-server/blob/master/docs/RUNBOOK.md).
- **Storage:** PostgreSQL 17 (`nodestro_runtime.storage_postgres`, `nodestro_runtime.postgres_tables`); every row
  carries `tenant_id` and every query filters on it. Migrations are forward-only SQL files applied under an advisory
  lock. Each process keeps a pool of connections (`NODESTRO_DATABASE_POOL_SIZE`, default 8) that are checked before
  use, so a dropped connection is replaced; statements are limited by `NODESTRO_DATABASE_STATEMENT_TIMEOUT` (30 s)
  and idle transactions by `NODESTRO_DATABASE_IDLE_IN_TRANSACTION_TIMEOUT` (300 s); session advisory locks use one
  extra connection. `DocumentStore.lock` serializes read-modify-write steps across processes (workflow versions,
  saving a workflow). A tenant's files (tools, Python environments, uploaded inputs) are on a volume that the API and
  the workers share. `/api/health` answers 503 when the process cannot reach its database.
- **Identity:** OpenID Connect authorization code flow with PKCE (S256), `state` and `nonce`
  (`nodestro_api.identity`). A login is bound to the browser that started it by a short-lived
  `__Host-nodestro-login` cookie. The session is a random token in a `__Host-nodestro-session` cookie (`HttpOnly`,
  `Secure`, `SameSite=Lax`); the database holds only its hash. Changing requests must come from the studio's origin
  (`SameOriginMiddleware`). There is no default user and no password: an operator creates a tenant and a one-time
  setup link for its first owner, and manages members with `members`, `set-role`, `remove-member` and
  `revoke-sessions`. Roles: owner and admin (read, edit, run, admin), editor (read, edit, run), operator (read, run),
  viewer (read); the `install` permission (diagnostics, backups, network settings) belongs to no tenant role. Event
  streams end within about 15 seconds after the viewer's session or membership ends. Tenant provider keys are
  encrypted at rest (AES-256-GCM, a key per tenant derived from `NODESTRO_SECRET_KEY`).
- **Jobs and workers** (`nodestro_runtime.jobs`, `nodestro_api.worker`, ADR-0004): an API process stores a run and
  enqueues a job; a worker claims it with `FOR UPDATE SKIP LOCKED` and a lease (default 60 s) that it renews while
  the run executes, and writes the run's events to `nodestro_run_events`, from which every API process streams them.
  The reaper marks the run of an expired lease as `run.interrupted`, and also a run stored as queued or running
  without an active job (after twice the lease); such a run is never executed again by itself, a person continues it.
  Run writes are fenced across processes: an approval decision is a compare-and-set (`approval.not_pending`,
  `run.not_paused`), and a worker whose lease expired or whose run was interrupted meanwhile stops without
  overwriting the run (`run.fence_lost`). Only runs use the queue; batches, test series, assistant drafts and Python
  environment installations still run in the API process that started them.
- **Scheduler leader:** exactly one worker at a time holds the scheduler lock (`LeaderLock`) and fires schedules;
  every schedule slot fires at most once (`ScheduleFirings`). The leader also cleans up every
  `NODESTRO_WORKER_CLEANUP_SECONDS` (default 600): expired sessions and abandoned login starts, finished jobs after
  7 days and run events after 2 days (the runs themselves stay).
- **Network of tenants:** tenants reach only the providers' public APIs and the model endpoints in
  `NODESTRO_MODEL_ENDPOINTS`; clients for OpenAI-compatible endpoints do not follow redirects.
- **Sandbox:** tool code runs only in containers of a Docker daemon that is not the host's (`DOCKER_HOST`, for
  example a dedicated VM with mutual TLS). API and workers refuse to start without it.

### Shared by every profile

- **Sandboxes** (`nodestro_runtime.sandbox_policy`, ADR-0006): tool code has a trust class (`trusted`,
  `user-authored`, `untrusted`; all AI-generated code is untrusted). Untrusted code never runs in a host subprocess:
  without an isolating sandbox it is refused with `sandbox.isolation_required`.
  - Orkexa's `SubprocessSandbox` runs trusted and user-authored code on the desktop only (no isolation). With the
    desktop's "Docker" setting, tool code without libraries runs in Orkexa's `DockerSandbox`.
  - The built-in `LinuxSandbox` (`nodestro_runtime.builtin_sandbox`, Landlock and seccomp, no Docker needed) counts
    as isolating only in the desktop profile, and only on a tested Linux system whose self-test passed.
  - `StreamedSandbox` (`nodestro_runtime.container_images`) runs an image Nodestro built, with no bind mounts: the
    tool's files travel on stdin, so the Docker daemon may be on another host. It runs tools with third-party
    libraries in an image built per approved lock. `RuntimeImageSandbox` is a `StreamedSandbox` on the image of
    Nodestro's own runtime requirements, for tool code without third-party libraries. The server and the local
    container use only these two.
- **MCP client** (`nodestro_runtime.mcp`, ADR-0007): agents can use tools of external MCP servers as
  `mcp__<server>__<tool>`. The code exists in every profile, but its use is limited to a pilot on an isolated server
  test instance with read-only tools; MCP on the desktop is not released ([threat model](mcp/threat-model.md), M-4).
  MCP tools that change data are usable only behind the per-call approvals below.
- **Tool approvals** (S-1/S-2, [design](evolution/s-tool-approvals.md)): every tool has a capability statement
  (`nodestro_runtime.tool_policy`: `read`, `write` or `destructive`; `internal` or `external`). Asking a person
  before a call (`nodestro_runtime.tool_approvals`) is off by default and is switched on per process with
  `NODESTRO_TOOL_APPROVALS=1`; `NODESTRO_TOOL_APPROVAL_CHECKPOINTS=1` additionally pauses a waiting run and frees
  its worker. Activating either is a separate decision after the security acceptance.

## Decisions

| Topic | Decision | Reason |
| --- | --- | --- |
| Backend | Python 3.10+, FastAPI, uvicorn | The library is Python. FastAPI provides typed endpoints, OpenAPI and SSE without extra services. |
| Operating profiles | one `RuntimeProfile` (`desktop`, `local-container`, `server`), chosen once and validated; no fallback | One code base for three products; an incomplete server configuration must never start with desktop behavior (ADR-0001). |
| Persistence | desktop and local container: one SQLite file in the data folder; server: PostgreSQL 17 with a tenant column on every row, behind the same `DocumentStore` contract | Local needs no installation and stays transactional; a server needs several processes and tenant separation (ADR-0002). |
| Identity | desktop: none, loopback only (plus the launch secret in the desktop app); local container: access key; server: OpenID Connect with PKCE, `__Host-` session cookie, roles per tenant | A loopback studio has one person; a server never sees passwords and grants nothing without a role (ADR-0003). |
| Run execution | desktop and local container: in the process; server: a persistent job queue in PostgreSQL with leases, a reaper, fencing and one scheduler leader | Workers can die without losing a run, and an interrupted run is never repeated by itself, because model calls cost money and tools have side effects (ADR-0004). |
| Agent execution | synchronous Orkexa `Agent` in the run manager's own thread pool (`NODESTRO_RUN_THREADS`, default 32) | `refine()`, `ToolBuilder` and `AgentArchitect` are synchronous. Threads keep the event loop free for SSE, and independent agents run in parallel. |
| Live status | Server-sent events | Data flows in one direction only, the connection is re-established automatically, and no WebSocket logic is needed. On a server, events go through `nodestro_run_events`, so any API process can stream them. |
| Frontend | React 19, TypeScript, Vite, React Flow, TanStack Query, zustand, CodeMirror | The most common stack for node editors. React Flow brings zoom, minimap and ports; TanStack Query handles caching and polling. |
| Delivery | Vite builds into `src/nodestro_studio/static`, FastAPI serves it | One command (`nodestro`) and one port. No Node runtime in operation. |
| Tool code | trust classes; untrusted code only in an isolating sandbox (container everywhere, built-in Linux sandbox on the desktop); server and local container: containers only | Foreign code never runs in the API or worker process, and never on the host without isolation (ADR-0006). |
| Docker access | local container: a sandbox gateway holds the host's socket; server: a separate Docker daemon | Whoever controls a Docker daemon controls its host. |

## Workflow model

A workflow is a directed acyclic graph of six node types:

- **Start** provides the run's input (`{{run.input}}`), optionally files and optionally an input form with typed
  fields (`StartConfig.fields`, `{{form.<name>}}`, checked in `nodestro_runtime.forms`).
- **Agent** carries a complete `AgentConfig` (`nodestro_runtime.schemas`). It is the serializable form of all `Agent`
  arguments (model as `provider:model`) plus Nodestro additions: knowledge, memory mode, output fields, quality check.
- **Decision** picks one or more branches by fixed rules (`nodestro_runtime.conditions`), without an API call.
- **Approval** pauses the run until a person approves or rejects; branches `approved` and `rejected`.
- **Sub-workflow** runs another saved workflow, in a fixed or the latest version, as a separate linked run; its costs
  count towards the budget of the parent run.
- **Result** collects the output of the connected agents and optionally writes result files
  (`nodestro_runtime.reports`).

Connections from decisions and approvals name their branch in `Edge.source_handle`. The data flow rules (active,
skipped, blocked, merging) are in `nodestro_runtime.graph`.

An agent's task is a template. `{{input}}` inserts all predecessors, `{{run.input}}` the workflow input and `{{Name}}`
a specific predecessor. Predecessors that do not appear in the template are appended under "# Inputs" so that no
result is lost.

## A run

1. `POST /api/workflows/{id}/runs` first checks the graph and every agent configuration and then creates the run.
2. The `RunManager` starts one coroutine per node. It waits for its predecessors and runs the agent in a thread. A node
   whose predecessor failed is blocked; a node that no chosen branch leads to is skipped. Other branches keep running.
   At an approval the run pauses and continues at the same point after the decision, even after a restart.
3. The agent's hooks (`on_text`, `on_thinking`, `before_tool`, `after_tool`, `on_response`) produce events. The browser
   receives them through SSE and updates nodes, panel and costs live.
4. A `BudgetTracker` per run counts the tokens and costs of all agents and the judge and stops as soon as the budget is
   exceeded. A cancellation by the user sets an event that the next hook checks.
5. If the quality check is active, the agent runs through `refine()` with an `Evaluator` as the judge.
6. At the end, Nodestro stores the run with prompt, text, tool calls, result, memory state and usage of every agent.
7. A failed run can be resumed (`nodestro_runtime.resume`): a new linked run takes over results with an unchanged
   fingerprint at no cost and runs the rest again.

Batch runs (`nodestro_api.batches`), test series (`nodestro_api.benchmarks`) and schedules
(`nodestro_api.schedules`) start ordinary runs through `nodestro_runtime.launcher.launch` with their own `trigger`.
There is only one engine; budget, approvals and usage apply to every run in the same way, and no costs are counted
twice.

## Knowledge and memory

- Files live in the `SQLiteFileStore`; texts are additionally stored in sections in the `SQLiteIndex` (FTS5). Through
  `ScopedFileStore` and `ScopedIndex`, an agent only sees the files assigned to it.
- Knowledge has three modes:
  - **context**: the files are placed at the start of the conversation.
  - **on_demand**: the agent reads files when needed through a tool.
  - **search**: the agent searches the index through a tool.
- Memory has two modes:
  - **run**: a separate `EphemeralMemory` per agent and run. Its state is stored with the run.
  - **persistent**: a named `SQLiteMemory` namespace that outlives runs and can be edited in the memory browser.

## Tools

- **Built-in:** `calculator`, `current_datetime`, `days_between`, `text_statistics`. They run in the process.
- **Custom tools:** a Python function plus tests.
  - `check_tool_source` and `check_tool_tests` check them statically.
  - The tests run in the sandbox the profile and the tool's trust class allow (see "Sandboxes" above).
  - The tool itself is later called in the sandbox as well.
- **Created by the AI:** a `ToolBuilder` with a `CodingAgent` writes code and tests until the tests pass (at most three
  attempts). A `CallbackApprover` then waits for the user's decision in the interface.

## Python libraries

Tools may use packages from PyPI. Nodestro's own Python stays unchanged.

- **Detection** (`nodestro_runtime.python_deps`): `analyze()` reads imports via the AST and a PEP 723 header
  (`# /// script`). The standard library, `tool` and runtime modules need nothing; known modules are mapped to package
  names (`PIL` → `Pillow`). Unknown and dynamic imports are reported, never guessed.
- **Environments** (`nodestro_runtime.python_envs`): per scope (`workflow:<id>`, or `tool:<name>` for tool tests) one
  document in `python_envs` with requirements, lock (`uv pip compile --universal`), approvals and history, and a venv
  under `<data>/python/envs/`. `uv` comes along as a Python package; the cache under `<data>/python/cache` is shared.
  Installation goes into a staging directory, is checked (imports) and only then swapped in.
- **Approval:** `plan()` resolves and shows new and changed packages; `approve()` binds the approvals to the
  installation ID (`<data>/python/installation-id`, not in the backup). Existing locks serve as constraints when
  resolving, so there are no silent upgrades.
- **Execution:** without the Docker sandbox, the environment's interpreter in `SubprocessSandbox` from `orkexa`
  (replaced by the built-in `LinuxSandbox` for code that needs isolation); with it, and always on a server and in
  the local container, a container image built per approved lock with hashes (`nodestro_runtime.container_images`).
  `ToolBuilder.extra_imports` allows the approved modules in the static check.
- **Integration:** `preflight()` reports missing approvals, a run installs an approved environment on demand, tool
  jobs wait with `awaiting_dependencies`, the architect only collects. Export and import carry the definition along,
  but a new approval is required. API under `/api/python`.

## Workflow Architect

`nodestro_api.architect` designs a whole workflow from a description or revises an existing one. It is a separate
service next to the execution and never starts a run.

- **Steps per job** (one worker thread): analyze the requirements (structured output, at most one follow-up
  question), plan the architecture, check resources, configure agents (the existing `AgentArchitect` in parallel per
  new agent, templates without an AI call), draft missing tools (`CodingAgent`, only statically checked), connect,
  validate and present.
- **Validation:** the same `preflight()` check as before a run. The architect first corrects deterministically
  (connections, placeholders, names, models), then at most `architect_max_repairs` times with the AI.
- **Progress:** every step produces events (phase, log with code and parameters, graph, costs) that arrive through SSE
  under `/api/architect/jobs/{id}/events`. The interface translates the codes; there are no estimated progress values.
- **Costs:** a `BudgetTracker` per job stops at the limit. All calls are recorded once in the usage log (source
  `workflow_design`, with details per step).
- **Safety:** a draft never changes a saved workflow. The editor applies revisions as one undo step; nothing is stored
  until the user saves, with a version note. Tool drafts (`ToolDrafts`) are not registered; `preflight()` reports
  `config.tool_unapproved` until they are tested and approved.

## Nodestro Assistant

`nodestro_api.assistant` is a chat for questions about using Nodestro and about specific objects. It only uses
existing parts: the assistant model and its provider's key from the settings, the Orkexa `Agent` for streaming and
tool calls, the export's `Sanitizer`, `preflight()` and the usage log.

- **Knowledge:** `nodestro_api.docs_index` reads the built-in documentation (`frontend/src/docs/chapters`, in the
  wheel under `nodestro_studio/docs`) and searches it with keywords, without a vector database. The model only receives
  the outline and fetches sections with the tools `search_docs` and `read_docs`; sections it read are stored as sources
  with a link.
- **Attachments:** `nodestro_api.assistant_context` builds a snapshot per object from structured data (workflow,
  agent, tool, memory, knowledge, run), masks secrets, shortens large texts traceably and computes a fingerprint. Every
  message stores the snapshots it was sent with. *Update context* creates a new snapshot; older messages keep referring
  to theirs. Unsaved editor states come along as a `draft`; the interface detects changes to drafts by fingerprint.
- **Suggestions** of the current view exist only in the browser (`frontend/src/assistant/store.ts`) and are attached
  only through an explicit action.
- **Handover:** the tool `propose_handover` only creates a card. It opens the Workflow Architect, the agent designer or
  the tool creation with a prefilled description; the user starts it there.
- **Flow:** one thread per answer; events (step, text, source, handover, usage) arrive through SSE under
  `/api/assistant/conversations/{id}/messages/{mid}/events`. Cancelling closes the stream; the tokens used until then
  are estimated. After a restart, open answers are marked as interrupted.
- **Storage and costs:** chats, messages and snapshots live in the workspace's document store and in the backup.
  Every answer is exactly one entry in the usage log (source `assistant`, with chat and message).

## Published APIs and export

A workflow becomes a web API without a second engine. Everything runs through the same `engine.py` as in the studio.

- **Releases** (`nodestro_api.publishing`): *Publish* freezes the saved workflow version as a `ReleaseBundle`, with
  the approved tool sources, the sub-workflows in their version and the Python locks. Releases are immutable; a
  publication points to the active release, and a rollback only moves this pointer. Runs store their `release_id`, also
  when resumed (`nodestro_runtime.resume` resumes API runs through the serving core).
- **Serving** (`nodestro_api.serving`): `ServingCore` checks keys, scopes, limits and idempotency and starts runs
  through the normal `RunManager` (trigger `api`). `build_router()` creates the routes under
  `/api/published/{slug}` with schemas from the input form, SSE with `Last-Event-ID` and errors in the format
  `{"error": {status, code, message, params}}`. Test runs from the studio go through `ServingCore.launch()` with the
  identity `studio`, i.e. the same path.
- **Keys** (`nodestro_api.api_keys`): only the SHA-256 of the secrets, scopes and allowed publications. The
  collections `api_keys` and `api_idempotency` are local: backups leave them out, and a restore keeps them.
- **Network** (`nodestro_api.network`): locally, the routes only answer loopback addresses (`lan.not_enabled`). A
  second uvicorn server on its own port (default 8100, optionally TLS) contains only the enabled publications and
  `/health`, never the studio API. It is off by default and is switched off after a restore.
- **Export** (`nodestro_api.exporter`, `nodestro_api.standalone`): the runtime modules are determined from their
  imports and copied byte for byte into the project (checksums in `RUNTIME.json`). `standalone.create_app()` builds the
  same API from them without the studio. The ZIP is deterministic; `orkexa` comes as a Git reference or bundled (MIT,
  with confirmation). Knowledge and memory are included only when explicitly selected, keys and settings never.
- **Studio endpoints** (`nodestro_api.api_publish`): overview, check, publish, versions, keys, network, test, export.
  The optional AI guide (`nodestro_api.api_guide`) only receives the generated documentation, is recorded in the usage
  log (source `api_docs`) and only enters the export after the user accepts it.

## Languages

The interface is available in German, English, Spanish, French, Brazilian Portuguese and Italian. English is the
fallback language.

- **Texts:** i18next and react-i18next with one file per language and area under
  `frontend/src/i18n/locales/<language>/<area>.json`. All languages are built in; nothing is translated or loaded at
  runtime. A test checks that all languages have the same keys, that every key used in the code exists, and that
  components contain no hard-coded sentences.
- **Choosing the language:** on first start the browser language decides; unsupported languages fall back to English.
  A choice under *Settings* always wins. It is kept in `localStorage` (`nodestro-language`) and additionally in the
  backend settings. Switching only re-renders; it starts no run and no AI request.
- **Numbers and dates** are formatted by `Intl` in the chosen language. Costs are always USD with up to six decimal
  places.
- **Backend messages** (errors, check results, run steps) carry a stable code with parameters and the original English
  text (`nodestro_runtime.problems`). The interface shows the code in the chosen language and the original under
  *Technical details*.
- **AI assistants** (Agent Architect, memory suggestion, Nodestro Assistant) write in the interface language unless the
  user explicitly asks for another one. Code, identifiers and JSON keys stay English, as do generated tools. Existing
  agents, prompts and results are never translated; the interface language does not change the language an agent
  answers in.
- **Tools** keep their English metadata for the model. For built-in tools the interface shows a translated
  description.
- **Documentation:** `frontend/src/docs/chapters/<language>/<chapter>.md`. Chapters and sections have the same IDs in
  all languages so that links from the help texts fit everywhere. Chapter file names and section IDs come from the
  original German edition and are kept as stable link targets. The documentation loads on first use.
- **Example workflows** are declarative templates in the `nodestro_examples` package (repository `nodestro-examples`;
  structure in `templates/`, texts per language in `texts/<language>/`). Nothing is created automatically:
  `POST /api/library/{id}/copy` creates an independent copy in the chosen language, and the template itself never
  changes. The example part of the "Examples" documentation chapter is generated from the templates with
  `make example-docs`.
- **Browser check:** `frontend/e2e/i18n.mjs` checks detection, switching without reload and without further requests,
  saving, and all pages in all languages for truncated texts and horizontal scrolling.

## Editor layout

The workflow editor (`frontend/src/pages/EditorPage.tsx`) arranges three panels around the canvas: building blocks
(`editor/Palette.tsx`) on the left, the inspector (`editor/Inspector.tsx`, titled *Properties*) on the right and the
execution overview (`editor/RunPanel.tsx`) at the bottom.

- **State:** `editor/layout.ts` is a small zustand store for which panels are open and how large they are. It is a
  browser preference kept in `localStorage` (`nodestro-editor-layout`), validated on load and clamped to each panel's
  bounds. It is separate from the workflow store (`editor/store.ts`), so layout changes never mark a workflow as
  changed and never enter the undo history.
- **Resizing:** `editor/PanelSplitter.tsx` implements the WAI-ARIA window splitter pattern (`role="separator"`, arrow
  keys, Home/End, double-click to reset). While dragging, only a CSS variable on the editor changes; the store is
  updated when the pointer is released, so the canvas does not re-render on every pixel. CSS `min()` keeps the canvas
  usable when the window becomes smaller than the stored sizes allow.
- **Undo:** the workflow store records one undo step per user action: a complete node drag from its starting
  position, and typing in one field until the user switches to another field or node.

## Directories

```
src/nodestro_studio/    Studio application: the `nodestro` CLI, serving the interface and the documentation
tests/                  The studio's pytest suite (docs, CLI, upgrade from 0.1) and the servers of the browser tests
platform/versions.json  The tested commits of all components (see PLATFORM.md)
frontend/src/api/       Types and client of the REST API
frontend/src/editor/    Canvas, nodes, inspector, execution overview, panel layout, editor state
frontend/src/architect/ Workflow Architect: dialog, progress, live graph, review, diff
frontend/src/assistant/ Nodestro Assistant: panel, attachments, suggestions, handovers
frontend/src/python/    Python libraries: status, approval dialog, maintenance
frontend/src/runs/      Approvals, resuming, result files and origin of a run
frontend/src/publish/   "API & Export" dialog: publishing, keys, network, testing, docs, export
frontend/src/automation/ Dialogs for batch runs, test series and cost estimates
frontend/src/pages/     Pages of the app
frontend/src/styles/    Midnight Citron tokens and app styles
frontend/src/i18n/      Language selection and translations
frontend/src/docs/      Built-in documentation per language
frontend/e2e/           Playwright: smoke test, languages, Workflow Architect, Python libraries, assistant, flow
                        (decision, approval, resume, batch, test series, schedule), editor panels and API & Export
```

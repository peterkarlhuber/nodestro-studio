# Current-state inventory (M0)

> Part of the desktop/server plan, see [README.md](README.md). Everything here was read from the code at the commits
> pinned in [`platform/versions.json`](../../platform/versions.json) (platform 0.2.0; master of every repository is
> tree-identical to these pins as of 2026-10-31). Line numbers are given where they help a reviewer find the place; they
> drift with later commits, the names do not.

The short version: Nodestro 0.2 is a correct, well-tested **single-user, single-process** application. Five
assumptions are woven through it, and each one is a seam for the server profile:

1. **One SQLite file** (`<data_dir>/nodestro.db`) holds every document, the knowledge files and their FTS5 index and
   the memory spaces; several modules open their own `sqlite3` connections or reach into private ones.
2. **One process per data directory**, enforced by `nodestro.lock`. Live run state, event streams, schedules, batches
   and background jobs live in that process's memory.
3. **One user who owns everything**: no user, tenant or owner field exists in any document; the studio API trusts
   whoever reaches loopback.
4. **Local directories** for tools, inputs, Python environments, releases, exports and backups.
5. **Tool code runs in a host subprocess by default**, including AI-generated code during tool generation.

## 1. Database access

### 1.1 The document store (`nodestro_runtime.storage.Store`)

`nodestro-runtime/src/nodestro_runtime/storage.py`: one table
`nodestro_documents(collection, id, data JSON-as-TEXT, updated_at)`, primary key `(collection, id)`, one shared
`sqlite3` connection guarded by an `RLock`, `PRAGMA journal_mode=WAL`, `BEGIN IMMEDIATE` per write, reentrant
`transaction()`.

SQLite-specific SQL in this class:

| Method | SQLite specifics | PostgreSQL equivalent |
| --- | --- | --- |
| `__init__` | `PRAGMA journal_mode=WAL`, `strftime('%Y-%m-%dT%H:%M:%fZ','now')` default | none needed; `timestamptz DEFAULT now()` |
| `_transaction` | `BEGIN IMMEDIATE` (database-wide write lock), process-wide `RLock` | `BEGIN` per pooled connection; row locks |
| `put` / `put_raw` | `INSERT ... ON CONFLICT DO UPDATE` (portable), `strftime` | same statement, `now()` |
| `find` | `json_extract(data, '$.field') IN (...)` | `data->>'field' = ANY(%s)` on `jsonb`, expression index |
| `list_prefix` / `delete_prefix` | `LIKE ? ESCAPE '\'` | portable (`LIKE ... ESCAPE`), `text_pattern_ops` index |
| `list` | `ORDER BY updated_at DESC, id` over ISO text | `timestamptz` ordering |

The public API (`put`, `put_raw`, `get`, `get_raw`, `list`, `find`, `items`, `list_prefix`, `delete_prefix`, `delete`,
`transaction`, `close`, `closed`) is small and backend-neutral. **That API is the seam** (ADR-0002).

Collections in use (one row per document):

| Owner | Collections |
| --- | --- |
| runtime | `workflows`, `workflow_versions`, `runs`, `templates`, `settings` (one document `app`, contains provider keys), `python_envs`, `tool_drafts`, `input_files`, `usage_log`, `result_files`, `result_file_data`, `run_event_seq`, `trace_imports` |
| api | `organize`, `api_keys` (SHA-256 of the secret), `api_settings` (network listener), `publications`, `api_releases`, `api_exports`, `api_guides`, `api_idempotency`, `batches`, `schedules`, `benchmark_suites`, `benchmark_runs`, `architect_jobs`, `assistant_conversations`, `assistant_messages`, `assistant_snapshots` |

### 1.2 Code that bypasses the `Store` API

These places use SQL or private attributes directly and must move behind methods before a second backend can exist
(planned PR-3):

| File | What it does |
| --- | --- |
| `nodestro-runtime/.../input_files.py` (`InputFiles.references`) | `self.store._connection` + `self.store._lock`, raw `SELECT collection, data ... WHERE data LIKE '%in\_%'` to find file references in runs, suites, schedules and batches |
| `nodestro-runtime/.../knowledge.py` (`_chunk_counts`, file-id update, `text`) | `self.index._connection`: `SELECT ... FROM index_chunks`, `UPDATE index_chunks SET file_id` (Orkexa's private table) |
| `nodestro-runtime/.../memory_spaces.py` (`MemorySpace.clear`, `MemorySpaces.all`) | own `sqlite3.connect`, `CREATE TABLE IF NOT EXISTS memory_files`, `DELETE FROM memory_files` |
| `nodestro-api/.../backup.py` | `sqlite3.connect`, `store._connection.backup()`, `VACUUM`, `PRAGMA integrity_check`/`table_info`, `ATTACH DATABASE` + table copy on restore, `INSERT INTO index_fts(index_fts) VALUES('rebuild')`, counts in `stored_files`/`memory_files` |
| `nodestro-api/.../diagnostics.py` | `PRAGMA quick_check`, `journal_mode`, `pragma_compile_options` (FTS5), `sqlite3.sqlite_version` |

### 1.3 Orkexa storage components used by Nodestro

Orkexa (`cbf6df3`) ships abstract base classes with SQLite implementations; Nodestro uses the SQLite ones:

| Orkexa class | Abstract base | Tables | Used by |
| --- | --- | --- | --- |
| `orkexa.files.SQLiteFileStore` | `FileStore` (`_save`, `_entry`, `_data`, `_entries`, `_remove`) | `stored_files` (bytes as BLOB) | `KnowledgeBase.store` (namespace `nodestro`) |
| `orkexa.retrieval.SQLiteIndex` | `Index` (`add_chunks`, `search`, `delete`) | `index_chunks`, `index_fts` (**FTS5**, `bm25`), `index_meta`, optional `index_vec` (**sqlite-vec**) | `KnowledgeBase.index` |
| `orkexa.memory.SQLiteMemory` | `MemoryBackend` (key/value storage methods) | `memory_files` | `MemorySpaces` (namespace `nodestro:<space>`) |
| `orkexa.dynamic.ToolRegistry` | — (file based) | `<data_dir>/tools/<name>/v<n>.json` | `ToolLibrary.registry` |

Because the bases are abstract and documented as extension points, PostgreSQL implementations can live in
`nodestro-runtime` as subclasses. **No Orkexa change is needed for storage** (masterplan rule 8). The only friction is
Nodestro's direct use of `index_chunks` (1.2), which a Nodestro-side subclass makes unnecessary.

FTS5 behavior that a PostgreSQL index has to match or document: `unicode61` tokenizer (no stemming, case- and
diacritics-folding), `bm25` ranking, prefix queries built by Orkexa's query sanitizer. PostgreSQL's `simple` text
search configuration with `unaccent` is the closest match; ranking (`ts_rank_cd`) differs, so contract tests compare
result *sets* for top-k, not order (ADR-0002).

### 1.4 Files outside the database

| Path under `<data_dir>` | Owner | Content |
| --- | --- | --- |
| `nodestro.db` (+ `-wal`, `-shm`) | runtime | everything above |
| `nodestro.lock` | runtime | data-directory lock (`DataDirectoryLock`) |
| `tools/` | runtime via Orkexa `ToolRegistry` | generated and hand-written tools, one JSON per version |
| `inputs/` | runtime `InputFiles` | uploaded run input files |
| `python/` | runtime `PythonEnvironments` | per-workflow/per-tool virtual environments created with `uv` |
| `releases/<release_id>/` | api `Publications` | frozen environments of published releases |
| `exports/` | api `exporter` | exported FastAPI projects (zip) |
| `backups/` | api `backup` | local backup archives |

## 2. State that lives only in the process

| Component | State | Consequence for several processes |
| --- | --- | --- |
| `RunManager` (`engine.py`) | `_contexts`, `_events`, `_seq`, `_subscribers` (`asyncio.Queue`), `_tasks` (`asyncio.Task` per run), `_loop` | A run executes in the process that started it; SSE `/api/runs/{id}/events` only works there; `recover()` marks every `queued`/`running` run of *any* process as interrupted |
| `Workspace` / `DataDirectoryLock` | exclusive `flock`/`msvcrt.locking` on `nodestro.lock` | A second process on the same data refuses to start (`workspace.in_use`) |
| `Schedules` (`schedules.py`) | one `asyncio` loop, `asyncio.Lock`, tick every `TICK_SECONDS` | Two processes would start every schedule twice (the reason for the data-directory lock) |
| `Batches`, `Benchmarks` | `_live`, `_tasks`, `_wake`, `_done` | Interrupted on restart (status `interrupted`, can be continued) |
| `WorkflowArchitect` (`architect.py`) | daemon thread per job, `_cancel`, `_subscribers`, `_seq` | Jobs persisted in `architect_jobs`, events live only in memory |
| `Assistant` (`assistant.py`) | daemon thread per reply, `_events`, `_subscribers`, `_live`, `_cancel` | Messages persisted, interrupted replies marked `assistant.interrupted` |
| `ToolLibrary` | `jobs`, `_decisions` (tool generation jobs wait up to an hour for approval in a thread) | Job lost on restart |
| `PythonEnvironments` | `_plans`, per-scope `threading.Lock`, install threads | Two processes could install into the same directory; `recover()` repairs on start |
| `ServingCore` (`serving.py`) | `_Window._hits` rate-limit windows, `_start_lock` | Rate limits per process, not per deployment |
| `Publications` | `_environments` cache | Cache only |
| `NetworkListener` | second uvicorn server inside the process (port 8100) | Server profile replaces it with the regular ingress |
| `backup._RESTORE_LOCK`, `serving._SANITIZER_LOCK` | module-level locks | Per process |
| `MemorySpaces._open`, `DocsIndex._chapters` | caches | Cache only |

## 3. Security boundaries and endpoints

### 3.1 Studio API (`/api`, no authentication)

About **187 routes** in `nodestro-api/src/nodestro_api/api*.py` (routers `api`, `api_architect`, `api_assistant`,
`api_automation`, `api_data`, `api_inputs`, `api_publish`, `api_python`). Protection today is
`nodestro_api.local_access.LocalAccessMiddleware`: loopback bind by default, `Host` allow-list against DNS rebinding,
`Origin` check for changing requests. It explicitly **is not authentication**: with `--host 0.0.0.0` every device
on the network has full access.

Endpoints that need special care once authentication exists (each must be covered by authorization tests):

| Class | Examples |
| --- | --- |
| Streams (SSE) | `GET /api/runs/{id}/events`, `/api/architect/jobs/{id}/events`, `/api/assistant/conversations/{c}/messages/{m}/events` |
| File content served to the browser | `GET /api/knowledge/{id}/content` (inline, no CSP/`nosniff` yet: open finding), `/api/inputs/{id}/content`, `/api/runs/{id}/files/{file_id}`, `/api/exports/{id}/download`, `/api/memory/{space}/file` |
| Uploads | knowledge upload, `/api/inputs` uploads, `POST /api/backup/inspect`, run files |
| Admin / whole installation | `GET/PUT /api/settings` (provider keys, sandbox), `/api/backup*` (restore replaces all data), `/api/diagnostics*`, `/api/api-keys*`, `PUT /api/api-network`, `/api/python/*` (installs packages), `/api/python/cleanup` |
| Code execution | tool generation and drafts (`/api/tools/...`, `/api/architect/...`), agent tests, workflow runs with custom tools |

### 3.2 Published APIs (`/api/published/{slug}/...`)

`nodestro_api.serving`: `Authorization: Bearer ndk_...` or `X-API-Key`, keys stored as SHA-256, scopes and
publication lists per key, per-key rate limits, idempotency keys. Served on loopback by the main app and on the
network only by the separate `NetworkListener`. This is a **machine credential**, not a user login, and stays one.

### 3.3 Secrets

- Provider keys: environment variables win; otherwise stored **in clear text** in the `settings/app` document. They
  are excluded from responses, exports and backups (`backup._SECRET_SETTINGS`, `provider_keys`).
- Published API keys: SHA-256 only.
- uv runs with an environment allow-list (`python_envs.UV_ENV_ALLOWED`).

## 4. Code execution and sandboxing

| Path | Sandbox today |
| --- | --- |
| Built-in tools and integration tools | in process (trusted, shipped code) |
| Approved custom/generated tools during runs | `make_sandbox(settings.sandbox)` in `tool_library.py`: `SubprocessSandbox(timeout=15, acknowledge_unsafe=True)` by default, `DockerSandbox()` when the setting is `docker` |
| Tools with third-party libraries | `PythonEnvironments.sandbox()`: `SubprocessSandbox` with the scope's venv interpreter, 60 s, 2 GB, `SANDBOX_ENV`, `acknowledge_unsafe=True`. With the Docker setting: refused with `deps.docker_unsupported` (`python_envs.py`, `status()`) |
| **AI-generated tool code during generation** | Orkexa `ToolBuilder` runs the generated tests automatically in the registry's sandbox (`tool_library.py`, `_run_job` → `builder.test_sandbox`), i.e. a **host subprocess without isolation** by default, before a person has approved the code |
| Tool drafts | `ToolDrafts.test` / `approve` run in the sandbox on the user's explicit click |

Orkexa's `DockerSandbox` is already well hardened (`--network none`, `--read-only`, `--cap-drop ALL`,
`no-new-privileges`, user `65534`, pids/memory/CPU limits, `noexec` tmpfs, read-only work mount) and fails closed
without Docker. What is missing is a way to give it third-party libraries.

The automatic execution of AI-generated code in a host subprocess is the one place where today's default conflicts
with the new rule "no automatic execution of untrusted code without a secure sandbox". ADR-0006 proposes how to close
it without breaking existing tools.

## 5. CI and test baseline

See [README.md, section "Test baseline"](README.md#test-baseline).

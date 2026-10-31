# Desktop and server plan: implementation status

This file is the resume point for the plan in [README.md](README.md). It is updated after every merged step. A new
session reads it first, then continues with the first step marked "next".

Rules that apply to every step (see README, "Non-negotiable rules", and ADR-0006):

- Merge commits only (no squash, no rebase). Full-SHA pins in the order runtime → examples + integrations → api →
  sdk → studio (`pyproject.toml` and `platform/versions.json`); a final pin never points at an unmerged commit.
- Technical content in English; user-facing texts and docs in de, en, es, fr, it, pt-BR.
- The server profile stays refused (`profile.server_unavailable`) until PR-12.
- Untrusted code (all AI-generated code, unknown provenance, also after approval) never runs without isolation;
  there is no subprocess fallback.
- Test results are reported as passed, failed or not run; untested operating systems and missing signing
  certificates are reported as limitations, never as support.

## Status

Last update: 2026-10-31.

| Step | Content | State | Pull requests (merge commit) |
| --- | --- | --- | --- |
| M0 | Architecture, inventory, ADR 0001–0006 | done | studio #7 (`3c29a70`, merged with the PR-2 pins) |
| PR-1 | Operating profile (runtime) | done | runtime #5 (`8ea9a5c`) |
| PR-2 | Profile in the API, route permissions, studio API loopback-only | done | api #7 (`b794ebe`); pins: examples #5 (`f90d3a1`), integrations #5 (`81d88ce`), sdk #7 (`f450f2c`), studio #7 (`3c29a70`) |
| PR-3 | Storage seams: `DocumentStore`, `sqlite_tables`, schema version with pre-migration backup, contract tests | done | runtime #6 (`e90c205`); api #8 (`d8ed049`, backup/restore via public storage methods, `backup.schema_too_new`); pins: examples #6 (`649ef70`), integrations #6 (`e96d91f`), sdk #8 (`7aee149`), studio #8 (`d9ee2d6`) |
| PR-4 | Sandbox policy and trust classes (ADR-0006) | done | runtime #7 (`d6e75b7`); api #9 (`cd4b198`); pins: examples #7 (`31b5714`), integrations #7 (`99cdd2c`), sdk #9 (`b001667`), studio #9 (`54d25a8`: pins, origin display, texts and docs in six languages) |
| PR-5 | Desktop packaging spike and decision | done | nodestro-desktop #1 (`b759e67`: spike, measurements, first CI); ADR-0005 accepted: Tauri 2 |
| PR-6 | Desktop MVP for Linux x86_64 | done | api #10 + #11 (`0f439ea`: launch secret); sdk #10 (`1c24f55`); studio #10 (`9257c64`); nodestro-desktop #2 (`80932c3`: app, packaging, clean-container smoke test) |
| PR-7 | PostgreSQL document store and migrations | done | runtime #8 (`d4e4b27`: `storage_postgres`, migration `0001`, contract tests on both backends, PostgreSQL service in CI) |
| PR-8 | PostgreSQL knowledge, FTS, memory; desktop-to-server import | done | runtime #9 (`36600f3`: `postgres_tables`, migration `0002`, `postgres_import`) |
| PR-9 | Identity and tenants (OIDC) | done | runtime #10 (`8eea1ea`: tenant workspaces, `identity_store`, migration `0003`); api #12 (`c0e61bd`: OIDC login, sessions, roles, `install` permission); pins: examples #8 (`9b018da`), integrations #8 (`abc4dbc`), sdk #11 (`7203183`), studio (this PR: pins, login redirect, texts) |
| PR-10 | Persistent jobs and workers | in progress (next) | runtime #11 (job queue, workers, reaper, run events, scheduler lock); API entry points follow |
| PR-11 | Container sandbox with libraries | open | — |
| PR-12 | Server integration and deployment (lifts `profile.server_unavailable`) | open | — |
| PR-13 | Built-in sandbox prototype | open | — |
| M6 | Release pipelines, manifests, signing, OS support matrix | open | — |

## Notes per step

### PR-3

- `SCHEMA_VERSION` is `0` and `MIGRATIONS` is empty: existing data directories are not changed. The first real
  migration takes a backup to `<data_dir>/backups/pre-migration-<from>-to-<to>-<time>.db` before it writes; a failed
  backup or migration leaves the database unchanged and releases the lock.
- A database with a newer schema than the runtime supports is refused at startup (`storage.schema_too_new`) and in
  a backup restore (`backup.schema_too_new`, translated in six languages).
- Only `storage.py` and `sqlite_tables.py` touch SQLite connections (checked by
  `tests/test_storage_contract.py` in the runtime); the API reads no private storage attribute (checked by
  `tests/test_hardening.py` in the API).

### PR-4

- `sandbox_policy` (trust classes `trusted` / `user-authored` / `untrusted`) and `tool_provenance` (collection
  `tool_provenance`; a missing record means untrusted; the class is sticky per tool name; cleared on restore).
  Enforced in `ToolLibrary.tool/run/check/save_custom/start_job`, the agent and workflow checks, and the library
  refusal (`sandbox.libraries_need_isolation`). No process sandbox in the server profile.
- Decision under the autonomy grant (ADR-0006 left it open): existing tools, also hand-written ones, stay
  `untrusted`; copying their code into a new tool keeps them untrusted. With Docker they keep running. See the
  ADR's implementation notes.
- API: `ToolInfo.trust`, release `tool_trust` with the studio's provenance deciding, `TOOL_SANDBOX` for exports.
  Tests use `testing.ContainerDouble` where a flow needs Docker, and assert the refusal without it.
- Open for later steps: a preflight `sandbox.unavailable` when Docker is selected but not running; libraries for
  untrusted code in containers (PR-11).

### PR-6

- The desktop shell (Tauri 2, `nodestro-desktop/app`) starts `backend/python/bin/python3 -I -m nodestro_studio` on a
  free loopback port with a 256-bit secret in `NODESTRO_LAUNCH_SECRET` and opens `/api/launch?token=…` once. The
  backend answers with an `HttpOnly`, `SameSite=Strict` cookie and a page that continues to `/` (a redirect started
  from the shell's own page would not carry the strict cookie in WebKit); the token is redacted in the access log.
- The generated `nodestro` script of a bundled wheel names the build-time interpreter path, so the shell calls the
  interpreter with `-m`, never the script.
- Residual risk (documented): a process of the same OS user can read the backend's initial environment; the secret is
  useless after the window used it.

### PR-7 and PR-8

- `PostgresDatabase` holds one connection per process; migrations are forward-only SQL files under
  `nodestro_runtime/migrations/postgres`, applied under an advisory lock that is taken before `CREATE SCHEMA`
  (concurrent starts raced otherwise). A database with data needs a backup hook first (`storage.backup_required`).
- PostgreSQL `jsonb` and `text` cannot hold U+0000: documents with it keep their exact JSON in a `raw` column;
  indexed text keeps U+FFFD; memory files with U+0000 are refused.
- Search on PostgreSQL: `tsvector('simple')` over lower-case words without diacritics, prefix matching, ranked
  with `ts_rank` (BM25 on SQLite). A shared parity corpus checks that both backends find the same files.
- The desktop import drops tool provenance: imported tools are untrusted on the server.

### PR-9

- `Workspace(data_dir, storage=WorkspaceStorage(...))` is a tenant's workspace; it always uses the server sandbox
  policy (containers only), whatever a stored or imported setting says.
- OIDC with PKCE (S256), a hashed one-time state and a nonce; only asymmetric ID token algorithms; session cookie
  `__Host-nodestro-session` (HttpOnly, Secure, SameSite=Lax); cross-site writes are refused
  (`access.cross_site`); return paths are local only. Session tokens, login states and bootstrap tokens are stored
  as SHA-256 hashes. No default user, no passwords; a one-time bootstrap token binds a tenant's first owner.
- Roles: owner/admin (read, edit, run, admin), editor (read, edit, run), operator (read, run), viewer (read). The
  new `install` permission (diagnostics, backup, API network settings) belongs to no tenant role: those routes stay
  with the operator of the server.
- `create_tenant_app` is test-only until PR-12; the server profile is still refused at startup.

### PR-10 (in progress)

- Runtime: migration `0004` (`nodestro_jobs`, `nodestro_run_events`, `nodestro_schedule_firings`), `jobs.py`.
  Claims use `FOR UPDATE SKIP LOCKED` with a lease; a run whose worker died is marked `run.interrupted` by the reaper
  and never executed again by itself. Only runs use the queue so far; batches, test series, assistant drafts and
  environment installations still run in the process that started them (documented follow-up).
- Next: API worker and scheduler entry points, event streams read from `nodestro_run_events`.

## Limitations known so far

- Tested on Linux (CI and local) only. macOS and Windows are not tested.
- No code-signing or notarization certificates are available; no signed build exists.

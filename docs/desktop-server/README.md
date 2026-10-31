# Nodestro Desktop and Nodestro Server: architecture and plan

> Status: **M0 (analysis and decisions), proposed 2026-10-31.** Nothing described as "target" here is implemented
> yet. The current-state inventory is in [inventory.md](inventory.md); the decisions are in
> [`docs/adr/`](../adr/README.md).

## Goal

One Nodestro platform, two products:

| | Nodestro Desktop (`nodestro-desktop`) | Nodestro Server (`nodestro-server`) |
| --- | --- | --- |
| Users | one person on their computer | many users in tenants, through a browser |
| Install | installer or portable package; no separate Python, Node.js, PostgreSQL or Docker | operator deploys containers; end users install nothing |
| Database | SQLite in `~/.nodestro` (unchanged) | PostgreSQL |
| Login | none (implicit local owner), loopback only | OpenID Connect, sessions, roles, tenant isolation |
| Runs | in the application process (as today) | persistent queue, separate workers |
| Tool code | Docker if present, otherwise policy-controlled (ADR-0006) | isolated containers only |

Both use the same `nodestro-runtime` (engine), the same `nodestro-api` (business logic and HTTP API) and the same
studio frontend. The two new repositories contain **packaging and deployment only**: no engine, no API routes, no
copy of the frontend.

## Non-negotiable rules this plan follows

1. The `nodestro` command, Python interfaces, workflows, studio routes and data in `~/.nodestro` keep working; data
   migrations are versioned, tested and preceded by a backup.
2. SQLite stays the fully supported local default.
3. The studio API is never exposed without verified authentication (not by `--host 0.0.0.0`, not by a proxy).
4. Tenant and user context are part of the data model from the first server migration.
5. Untrusted code never falls back to a host subprocess automatically; missing isolation fails closed.
6. No user data, secrets or tokens in images, installers, logs, traces, CI artifacts or source.
7. No silent download of Python, Node.js, Git, pip, PostgreSQL or Docker at first start.
8. Orkexa is not changed when Nodestro can solve the problem itself.
9. One reviewable pull request per step, with tests, docs and compatibility in the same PR; full-SHA pins, merge
   commits, bottom-up pin order (see [PLATFORM.md](../PLATFORM.md)).
10. No "works on every OS" claim without real build and start tests per OS.

## Target architecture

```
                 nodestro-desktop                                  nodestro-server
        ┌───────────────────────────────┐            ┌──────────────────────────────────────────────┐
        │ host shell (spike: Tauri 2)    │            │ ingress (TLS) ─► nodestro-api (N replicas)   │
        │  ├─ bundled CPython + wheels   │            │                   profile=server              │
        │  └─ child: nodestro-api        │            │ nodestro-api worker (M replicas) ─► sandbox   │
        │       profile=desktop          │            │ nodestro-api scheduler (1 active, lock)       │
        │       127.0.0.1:<random>       │            │ PostgreSQL · file volume · OIDC provider      │
        └───────────────┬───────────────┘            └──────────────────────┬───────────────────────┘
                        │ same wheels, pinned by platform/versions.json      │
                        ▼                                                    ▼
        nodestro-studio (frontend build, docs)   ─►  nodestro-api  ─►  nodestro-runtime  ─►  orkexa @ cbf6df3
                                                        │                    │
                          profile seams (ADR-0001):  identity · storage · job execution · sandbox policy
                          desktop:                   local     · SQLite  · inline        · Docker or blocked
                          server:                    OIDC      · Postgres· queue+workers · containers only
```

What changes inside the existing packages is limited to four seams, each with exactly two implementations:

| Seam | Interface (new or extracted) | Desktop implementation | Server implementation | ADR |
| --- | --- | --- | --- | --- |
| Profile | `nodestro_runtime.profile.RuntimeProfile` | `desktop` (default) | `server` (fail-fast validation) | [0001](../adr/0001-operating-profiles.md) |
| Storage | `DocumentStore` protocol; Orkexa `FileStore`/`Index`/`MemoryBackend` | current SQLite classes | `PostgresStore`, `PostgresFileStore`, `PostgresIndex`, `PostgresMemory` in the runtime | [0002](../adr/0002-storage-backends.md) |
| Identity | `Principal` dependency + route permission registry | implicit local owner | OIDC sessions, roles, tenants | [0003](../adr/0003-identity-and-tenants.md) |
| Jobs | `JobExecution` (`inline` / `queue`) around `RunManager` | in-process tasks | PostgreSQL queue, leases, event table, advisory-lock scheduler | [0004](../adr/0004-jobs-workers-scheduler.md) |
| Sandbox | `SandboxPolicy` | Docker optional; untrusted code blocked without isolation | containers only | [0006](../adr/0006-sandbox-policy.md) |

Packaging of the desktop is [ADR-0005](../adr/0005-desktop-packaging.md).

## Repositories and the files each plan step touches

| Repository | M0 state | Files expected to change (later milestones) |
| --- | --- | --- |
| `nodestro-runtime` | master `babf278`, pinned `ad75859` (same tree) | new `profile.py`, `sandbox_policy.py`, `storage_postgres.py`, `knowledge_postgres.py`, `memory_postgres.py`, `jobs.py`, `migrations/`; changed `storage.py`, `workspace.py`, `knowledge.py`, `memory_spaces.py`, `input_files.py`, `engine.py` (event sink, execution mode), `tool_library.py`, `python_envs.py`, `pyproject.toml` (extra `postgres`) |
| `nodestro-api` | master `74d151f`, pinned `43595a7` | new `identity.py`, `permissions.py`, `worker.py`; changed `context.py` (`AppConfig.profile`), `app.py`, `cli.py`, every `api*.py` router (permission per route), `backup.py`, `diagnostics.py`, `schedules.py`, `network.py`, `serving.py` (tenant-bound keys), `openapi/nodestro-api.json` |
| `nodestro-studio` | master `06c7859` | this documentation; later `platform/versions.json` (desktop/server entries), `scripts/check_versions.py`, `scripts/check_imports.py`, login/401 handling in `frontend/src/api/client.ts`, settings page (sandbox policy), docs chapters in six languages |
| `nodestro-sdk` | master `4cecc1f` | contract regeneration when the OpenAPI changes; session-free (keys only) |
| `nodestro-desktop` | only `LICENSE` (MIT), no CI | host shell, build scripts, CI for builds and smoke tests, release workflow |
| `nodestro-server` | only `LICENSE` (MIT), no CI | container images, compose/Helm for development, operator runbooks, backup/restore scripts |
| `orkexa` | `cbf6df3` | none planned; only if the sandbox image hook (ADR-0006, point 5) cannot be done by subclassing |
| `nodestro-examples`, `nodestro-integrations` | unchanged | none (pins bump only) |

## Implementation plan: thirteen pull requests

Each PR is one repository unless stated, merged with a merge commit, followed by a pin bump bottom-up. "Profile"
says which product's behavior can change; "desktop: none" means the desktop behaves byte-for-byte as before and the
full existing suites prove it.

Two rules shape the order of the server track (revised 2026-10-31 after review):

- **No PR relies on a server capability that does not exist yet.** Each server PR is tested through in-process tests
  with an explicit test composition (for example a PostgreSQL service container in CI), never by starting the server
  profile.
- **The server profile cannot be started until PR-12.** Until then `RuntimeProfile.validate()` refuses it with
  `profile.server_unavailable`. PR-12 lifts that refusal only together with the end-to-end acceptance tests, so a
  complete, working server deployment exists only when authentication, PostgreSQL, tenant isolation, persistent
  workers and the secure sandbox are implemented *and* integrated.

This changes the masterplan's milestone order on one point: storage on PostgreSQL (M4) comes before identity and
tenants (M3), because sessions and tenant isolation are stored in and enforced by the PostgreSQL schema; testing
cross-tenant access on SQLite would test a backend the server never uses.

| # | Milestone | Repo(s) | Pull request | Depends on | Profile impact | Acceptance tests |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | M1 | runtime | **Operating profile**: `RuntimeProfile` (desktop default, server refused with `profile.invalid` / `profile.server_unavailable` before any file or database access), `Workspace(profile=...)`, docs | — | desktop: none | all runtime tests; new: default profile equals today's behavior, `NODESTRO_PROFILE` parsing, invalid environment values, data directory conflicts, server profile refused without side effects |
| 2 | M1 | api (+ studio pins) | **Profile in the API and route permissions**: `AppConfig.profile`, `--profile`, permission declared on every `/api` route, local principal granted everything | 1 | desktop: none | all api tests, OpenAPI snapshot unchanged; new: route-enumeration test (no route without permission), `--profile server` refused at startup with `profile.server_unavailable`; studio + upgrade test green |
| 3 | M1 | runtime, api | **Storage seams**: `DocumentStore` protocol, no private `_connection` use outside storage classes, `PRAGMA user_version` with pre-migration backup hook, contract test suite (SQLite only) | 1 | desktop: none | contract suite on SQLite; 0.1 upgrade test; backup/restore tests; diagnostics unchanged |
| 4 | M1 | runtime, api, studio | **Sandbox policy** (ADR-0006): trust classes, `SandboxPolicy`, untrusted code blocked without isolation (no subprocess fallback, no dialog override), provenance for tools, preflight check, settings and documentation in six languages | 1 | desktop: **behavior change**, documented: without Docker, AI tool generation tests, AI-generated tools and draft tests are blocked | policy matrix tests; no code path runs untrusted code in a subprocess; preflight blocks before the run; e2e `python` and `architect` suites updated for both "Docker" and "no isolation"; changelog lists every affected feature |
| 5 | M2 | desktop | **Packaging spike and decision**: prototype with the candidates, measured table, ADR-0005 updated with the decision | 2 | — | spike report with measurements on Linux; no release |
| 6 | M2 | desktop, studio | **Desktop MVP for Linux x86_64**: bundled CPython + wheels from `versions.json` at a studio SHA, loopback backend with launch secret, health check, graceful shutdown, CI build and clean-machine smoke test; `versions.json` gains `nodestro-desktop`; restricted features without isolation documented | 4, 5 | desktop app new; CLI unchanged | CI: build, install in a clean container/VM without Python/Node, open UI, run a scripted workflow, quit leaves no process; isolation-dependent features show the documented restriction |
| 7 | M4 | runtime | **PostgreSQL document store and migrations**: `PostgresStore`, migration runner, `tenant_id` on every table, optional extra `postgres` | 3 | server only (not startable) | contract suite on SQLite and PostgreSQL (CI service container); migration from empty; concurrent writers; every query filtered by tenant |
| 8 | M4 | runtime, api | **PostgreSQL knowledge, FTS and memory**, file areas, backup design (`pg_dump` + volume), desktop-to-server import | 7 | server only (not startable) | knowledge/memory contract suites on both backends; search top-k parity on the example corpus; import of a 0.2 data directory; tenant filter on files |
| 9 | M3 | api, runtime, studio | **Identity and tenants**: `Principal`, OIDC login, sessions in PostgreSQL, roles, tenant-scoped services, CSP/`nosniff` for served file content, login redirect and 401 handling in the frontend | 2, 7, 8 | server only (not startable); desktop: none | in-process tests on PostgreSQL with a stub OIDC provider: 401 for anonymous; cross-tenant 404 for every resource class incl. streams, files, uploads, exports; role matrix; desktop suites unchanged |
| 10 | M5 | runtime, api | **Persistent jobs and workers**: queue, leases, heartbeat, cancellation, event table + `NOTIFY`, scheduler leader lock, every background job kind on the queue, `worker` and `scheduler` entry points | 7, 9 | server only (not startable); desktop: none | kill-worker test (interrupted, never duplicated), SSE resume across API restart, two schedulers fire once, tenant isolation of jobs, all with PostgreSQL in CI |
| 11 | M5 | runtime (orkexa only after review) | **Container sandbox with libraries**: per-lock images, `deps.docker_unsupported` resolved, sandbox health check, execution only on workers | 4, 10 | desktop with Docker gains libraries; server (not startable) | tool with a library runs in a container without network; missing runtime/image → `sandbox.unavailable`, never subprocess; Docker tests in CI |
| 12 | M5/M6 | runtime, api, server, studio | **Server integration and deployment**: lift `profile.server_unavailable` (validation now requires auth, PostgreSQL, queue, container sandbox, secrets), `nodestro-server` images and a localhost-bound development deployment, operator runbook, `versions.json` gains `nodestro-server` | 8, 9, 10, 11 | server startable for the first time | end-to-end in CI against the deployment: login via test OIDC provider, anonymous refused, cross-tenant refused, worker killed mid-run, untrusted tool runs only in a container, backup and restore with `pg_dump`; incomplete configuration refused with `profile.invalid` |
| 13 | M6 | desktop, runtime | **Built-in sandbox prototype** (ADR-0006 point 7): candidates per OS, security and compatibility test suite, report; a candidate becomes "isolating" in the policy only for the OS where every test passed | 4, 6 | desktop: none until a candidate passes; then restricted features return on that OS | the security and compatibility tests listed in ADR-0006, run on each claimed OS in CI or on a clean VM |

M6 (release integration: manifests, signed builds, license inventory, update and rollback docs, OS support matrix)
is planned once PR-6 and PR-12 have shown what the release pipelines need.

### First code pull request

**PR-1, `nodestro-runtime`: typed operating profile.** Approved by Peter on 2026-10-31.

- New `src/nodestro_runtime/profile.py`: `ProfileKind = Literal["desktop", "server"]`, frozen dataclass
  `RuntimeProfile`, `RuntimeProfile.desktop(data_dir)`, `RuntimeProfile.from_env(environ)` (reads `NODESTRO_PROFILE`,
  `NODESTRO_DATA_DIR`), `validate()` reporting every problem at once.
- `Workspace.__init__(..., profile: RuntimeProfile | None = None)`: `None` builds the desktop profile from
  `data_dir`, so every existing caller is unaffected; a server profile raises `profile.server_unavailable` before any
  file or database access, until PR-12.
- Tests, README section, CHANGELOG entry. No API, OpenAPI, studio, data or execution change.

### Progress

| PR | Repository and pull request | Merge commit |
| --- | --- | --- |
| 1 | nodestro-runtime #5 (operating profile) | `8ea9a5c` |
| 2 | nodestro-api #7 (profile, route permissions, studio API on loopback only) | `b794ebe` |
| 2 pins | nodestro-examples #5, nodestro-integrations #5 (runtime `8ea9a5c`), nodestro-sdk #7 (api `b794ebe`) | `f90d3a1`, `81d88ce`, `f450f2c` |
| 3 | nodestro-runtime #6 (storage seams), nodestro-api #8 (backup and restore through the storage methods) | `e90c205`, `d8ed049` |
| 3 pins | nodestro-examples #6, nodestro-integrations #6, nodestro-sdk #8 | `649ef70`, `e96d91f`, `7aee149` |
| 4 | nodestro-runtime #7 (sandbox policy, in progress; api and studio follow) | `d6e75b7` |

PR-2 changed one behavior on purpose (security before compatibility): the studio API refuses non-loopback
`--host` values and non-loopback `NODESTRO_ALLOWED_HOSTS`, and requests with proxy headers, because it has no login.
Published workflow APIs and their network listener are unchanged. The section "M0 state" above describes the
repositories before PR-1.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A refactoring PR changes desktop behavior unnoticed | medium | high | desktop: none rule; full suites + 0.1 upgrade test + eight browser suites per PR; contract suites |
| FTS ranking differs between FTS5 and PostgreSQL | high | medium | set-based contract tests; document differences; tune `ts_rank_cd` weights on the example corpus |
| An endpoint ships without authorization | medium | high | route-enumeration test from PR-2 on; cross-tenant tests per resource class |
| In-process state missed when moving to workers (e.g. tool-generation decisions waiting in threads) | medium | medium | inventory section 2 as checklist; M5 moves each kind with a restart test |
| Desktop bundle size and start time (CPython + dependencies) | medium | medium | measured in the spike; strip test data and caches; lazy imports |
| Code signing and notarization need certificates | high | medium | unsigned test builds labeled as such until Peter provides certificates |
| Web view differences (Safari/WebKit on macOS, WebView2 on Windows) | medium | medium | the WebKit e2e run already exists; per-OS smoke tests before any support claim |
| Docker images for tool libraries get large or stale | medium | low | cache keyed by lock hash, cleanup command, size limits |
| Desktop MVP without Docker cannot use AI-generated tools | certain until PR-13 | medium | documented restriction; Docker as an option; built-in sandbox prototype (PR-13) |
| Existing tools have no provenance and become `untrusted` in PR-4 | high | medium | decide in PR-4 how hand-written tools are recognized; re-saving in the editor restores them |
| Provider keys in clear text in desktop SQLite | existing | medium | unchanged on desktop (compatibility); server encrypts; OS keychain as a later option |
| Private repositories in CI of the new repos | certain | low | same `NODESTRO_READ` secret pattern; never echo it |

## Test baseline

Recorded 2026-10-31 on Linux x86_64, Python 3.13.18, Node 22, against master of every repository (master trees equal
the pins in `platform/versions.json`), with all components installed editable in one environment.

### Passed

| Repository | Check | Result |
| --- | --- | --- |
| nodestro-runtime | ruff, ruff format, mypy (strict) | clean |
| nodestro-runtime | pytest | 133 passed |
| nodestro-examples | ruff, ruff format, mypy | clean |
| nodestro-examples | pytest | 727 passed |
| nodestro-integrations | pytest | 57 passed, 4 skipped (see below) |
| nodestro-api | ruff, ruff format, mypy | clean |
| nodestro-api | pytest | 436 passed, 1 skipped (see below) |
| nodestro-studio | ruff, ruff format, mypy | clean |
| nodestro-studio | pytest (incl. 0.1 upgrade test) | 25 passed |
| nodestro-studio frontend | `npm ci`, lint, typecheck, vitest, build | clean |
| GitHub Actions | latest master run of CI in runtime, examples, integrations, api, sdk, orkexa; CI and Platform in studio | success |

| nodestro-studio | `scripts/check_imports.py` | 89 modules checked, 0 problems |
| nodestro-studio | `scripts/check_versions.py --local` with sibling checkouts at the pinned commits | pins agree |
| nodestro-studio | all eight browser suites (`scripts/e2e.sh`, Chromium) | 437 checks passed |
| nodestro-sdk (Python) | ruff, mypy, pytest against a real server | clean, 71 passed |
| orkexa | pytest in its own environment with `compat/orkexa-claude-compat`, as its CI does | 767 passed, 12 skipped (packaging and live-provider tests, opt-in) |

### Failed

None.

### Not run, with reason

| Check | Reason |
| --- | --- |
| Python 3.10 matrix leg | only 3.13 in this environment; CI runs 3.10 on every push and is green |
| `NODESTRO_NETWORK_TESTS=1` (real PyPI install) | opt-in network test, skipped by design |
| integrations real OCR (4 tests) | Tesseract language data and Poppler not installed here; CI installs them |
| `scripts/check_versions.py` against GitHub | needs `NODESTRO_READ`-style access from this container; the local variant was run instead (with checkouts at master it reports a mismatch, because master holds merge commits whose trees equal the pins; that is expected) |
| TypeScript SDK tests | not run locally; green in the SDK's master CI and the studio's platform pipeline |
| Browser suites in Firefox/WebKit | not run this time; Chromium is the CI default |
| Docker sandbox tests | Docker CLI present, no daemon in this environment |
| macOS, Windows, Safari | no such machine connected; never claimed as tested |
| `nodestro-desktop`, `nodestro-server` | contain only a license; no tests or CI exist yet |

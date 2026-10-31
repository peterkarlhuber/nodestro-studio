# ADR-0001: Desktop and server operating profiles

- Status: Proposed (M0, 2026-10-31)
- Repositories: nodestro-runtime, nodestro-api, nodestro-studio, nodestro-desktop, nodestro-server

## Context

Nodestro 0.2 has exactly one way to run: a single local process (`nodestro` or `nodestro-api`) on one data directory,
configured by scattered environment variables (`NODESTRO_DATA_DIR`, `NODESTRO_HOST`, `NODESTRO_ALLOWED_HOSTS`, ...)
and by the `settings/app` document (for example the sandbox). The platform has to serve two products from the same
engine, API and studio: an installable desktop application and a multi-user server. Without an explicit notion of
"which product am I", each service would guess from environment flags, and an incomplete server configuration could
silently fall back to desktop behavior (no authentication, subprocess sandbox, SQLite).

## Decision

1. Introduce one typed, immutable configuration object, `nodestro_runtime.profile.RuntimeProfile`, with
   `kind: Literal["desktop", "server"]` and the few settings that differ between the two (database URL, sandbox
   policy, identity mode, job execution mode, whether the data-directory lock applies). It is built once at startup
   (`RuntimeProfile.desktop(data_dir)`, `RuntimeProfile.from_env()`), validated, and passed into `Workspace` and
   `nodestro_api.context.AppConfig`. Services read the profile; they never read profile-related environment
   variables themselves.
2. **`desktop` is the default** and reproduces today's behavior exactly: SQLite in `<data_dir>/nodestro.db`, the
   data-directory lock, in-process runs, the implicit local user, the existing sandbox setting. `nodestro`,
   `nodestro-api`, `Workspace(...)` and every existing environment variable keep working unchanged.
3. **`server` fails fast.** Profile validation raises a `NodestroError` with code `profile.invalid` (one entry per
   problem) before any service starts when the server profile lacks authentication configuration, a
   non-SQLite database for production, a container sandbox, or a secret for sessions. Until authentication,
   PostgreSQL, tenant isolation, persistent workers and the container sandbox are implemented and integrated (plan
   PR-12), selecting `server` always stops with `profile.server_unavailable`, before any file or database access.
   There is no flag that turns the checks off.
4. Selection: `NODESTRO_PROFILE=desktop|server` (default `desktop`) and `--profile` on `nodestro-api`. The studio's
   `nodestro` command stays a desktop command. `nodestro-server` and `nodestro-desktop` only choose a profile and
   provide infrastructure; they contain no business logic.
5. Dependency injection is targeted: the profile decides which concrete implementation is constructed for exactly
   four seams (document store and knowledge/memory storage, identity, job execution, sandbox). No generic plugin
   framework, no abstract interface without a second implementation planned in this roadmap.

## Options considered

- **Environment flags per feature** (status quo extended): rejected; combinations are untestable and an omitted flag
  degrades to the unsafe default.
- **Separate server application** reusing the runtime: rejected; duplicates API business logic (masterplan rule).
- **Profile as data in the database**: rejected; the profile must be known before the database is opened.

## Consequences

- One new module in the runtime and one field in `AppConfig`; regression tests prove the desktop profile changes
  nothing (existing suites plus the 0.1 upgrade test).
- Every later PR states which profile it affects; server-only code paths are unreachable from the desktop profile.
- `scripts/check_imports.py` keeps its rules: the profile lives in the runtime, which imports nothing above it.

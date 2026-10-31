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
| PR-3 | Storage seams: `DocumentStore`, `sqlite_tables`, schema version with pre-migration backup, contract tests | done | runtime #6 (`e90c205`); api #8 (`d8ed049`, backup/restore via public storage methods, `backup.schema_too_new`); pins: examples #6 (`649ef70`), integrations #6 (`e96d91f`), sdk #8 (`7aee149`), studio (this pin PR) |
| PR-4 | Sandbox policy and trust classes (ADR-0006) | in progress | runtime #7 (`d6e75b7`); pins: examples #7, integrations #7 open; api and studio follow |
| PR-5 | Desktop packaging spike and decision | open | — |
| PR-6 | Desktop MVP for Linux x86_64 | open | — |
| PR-7 | PostgreSQL document store and migrations | open | — |
| PR-8 | PostgreSQL knowledge, FTS, memory; desktop-to-server import | open | — |
| PR-9 | Identity and tenants (OIDC) | open | — |
| PR-10 | Persistent jobs and workers | open | — |
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

### PR-4 (in progress)

- Runtime done: `sandbox_policy` (trust classes `trusted` / `user-authored` / `untrusted`), `tool_provenance`
  (collection `tool_provenance`; absent record = untrusted; sticky per tool name; cleared on restore), enforcement
  in `ToolLibrary.tool/run/check/save_custom/start_job`, agent and workflow checks, library refusal
  (`sandbox.libraries_need_isolation`), no process sandbox in the server profile.
- Decision taken under the autonomy grant (ADR-0006 left it open): existing tools, also hand-written ones, have no
  recorded provenance and stay `untrusted`; copying their code into a new tool keeps it `untrusted`. With Docker
  they keep running.
- Next: api (provisional changes ready: release `tool_trust`, linked provenance, `TOOL_SANDBOX` for exports, tests
  with `ContainerDouble`, OpenAPI `ToolInfo.trust`), then studio texts in six languages, settings and docs.

## Limitations known so far

- Tested on Linux (CI and local) only. macOS and Windows are not tested.
- No code-signing or notarization certificates are available; no signed build exists.

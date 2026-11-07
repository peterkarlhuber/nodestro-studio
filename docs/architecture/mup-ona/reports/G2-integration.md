# G2 integration report (MP-B6, before the B6 merge)

State 2026-11-07 14:10Z. Gate G2 (plan 7.1) decides whether runtime #140 (MP-B6) may be merged. B6 removes Nodestro's
own generic PostgreSQL code: `pg_generic/` and `sqlcheck_rules.py` are deleted, and the knowledge base, file store and
memory run on Orkexa's `orkexa.backends.postgres` (MP-B5).

**Result: technically ready, but the automatic continuation of plan 7.3 does not apply.** Several 7.3 criteria can be
shown only after the merge, and one needs judgment (section 5). G2 therefore goes to the client.

**Decision: approved by the client on 2026-11-07 14:02Z** (STATUS.md, Approvals). runtime #140 was merged as
81b0f55; the cascade and the post-merge evidence of section 4 follow.

## 1. What is merged before G2

| Package | PRs | Merge SHAs |
|---|---|---|
| MP-B4 (rule engine, statement catalog, partition guard) | runtime #137, #138, #139 | 2ef5b3b, 76f9cb2, df4aeb3 |
| MP-B4 cascade | examples #85/#87, integrations #73/#75, api #107/#108, sdk #99/#101, studio #153, server #70, desktop #57; local-docker #47 open (section 6) | examples c9ef422, integrations fe2fa12, api e5b5281, sdk d372eee, studio 5318cea, server ff0abb7, desktop d4e1d1c |
| MP-B5 PR 1 (`orkexa.testing.sqlcheck`) | orkexa #65 | 49bcc6d |
| MP-B5 PR 2 (`orkexa.backends.postgres`, schema v1, `verify_schema`) | orkexa #66 | 792a041 |
| B6 preparation (api CI installs orkexa for the runtime-master tenant SQL check) | api #111 | d61ad61 |

## 2. B6 under review

| PR | Head | Content |
|---|---|---|
| runtime #140 | da9e909 | subclasses of Orkexa's `PostgresIndex`, `PostgresFileStore` and `PostgresMemory` with `PostgresLayout("nodestro_")`; `pg_generic/` and `sqlcheck_rules.py` deleted; `tenant_sql_check` on `orkexa.testing.sqlcheck`; start check `require_knowledge_schema` (Orkexa's read-only `verify_schema`); T-UPG-1..8, T-SCH-1, T-CAT-4/5, T-PKG-3, T-PAR-3 |
| api #109 (draft) | 48b467c | `_require_knowledge_schema` at api/worker start and in `check`; T-UPG-7 and T-NOD-HTTP. It can only resolve after the cascade (section 4) |

Grep evidence (acceptance criterion): on da9e909 there is no `class PostgresIndex(Index)` or other generic backend
class outside Orkexa; `pg_generic/` no longer exists.

## 3. Evidence

### 3.1 CI of runtime #140 on da9e909: 20 of 20 green

Jobs: test (3.11, 3.13, 3.14), pg-a and pg-b (3.11, 3.13, 3.14, each as superuser and as the restricted runtime role),
tenant-sql-api, docker, builtin-sandbox, builtin-sandbox-arm64, package, security-vectors-sync, and start on
ubuntu-latest, macos-latest, macos-15-intel, windows-latest and windows-11-arm.
Runs: [42375562474](https://github.com/peterkarlhuber/nodestro-runtime/actions/runs/42375562474),
[42375562694](https://github.com/peterkarlhuber/nodestro-runtime/actions/runs/42375562694). No re-run.

### 3.2 Checker change (A11 rule 3)

The api tenant-sql job ran with the B6 checker in the temporary probe api #110, which was closed unmerged:
[job 128416794841](https://github.com/peterkarlhuber/nodestro-api/actions/jobs/128416794841).
The step installed runtime da9e909 and orkexa 792a041, the orkexa commit that this runtime pins. Output:
`scanned 80 files under src/nodestro_api: 13 tenant tables, 0 statements checked, 0 allowed, 0 findings; planted leak reported`.
The probe's first run found a real gap: since B6, the checker imports `orkexa`, which the `--no-deps` install lacked.
The fix is api #111, merged before #140.

### 3.3 Local test runs (B6 branches)

| Suite | Result |
|---|---|
| runtime full suite, Python 3.13 and 3.11 | 3706 passed, 81 skipped, 0 failed |
| runtime pg-a (postgres:17), both roles, 3.13 and 3.11 | 1269 passed, 31 skipped |
| runtime pg-b (pgvector), both roles, 3.13 and 3.11 | 1285 passed, 15 skipped |
| runtime with psycopg and axentra blocked (desktop profile) | 3064 passed, 442 skipped, 0 failed |
| api suite on the B6 branch (local override for the runtime pin) | 1420 passed, 3 skipped, 8 failed; all 8 come from the host: 7 need pg_dump 17 (the host has 16), 1 expects a git-installed runtime |

### 3.4 Upgrade tests U1–U8 (T-UPG-1..8, runtime `tests/test_upgrade_legacy.py`)

All pass in CI (pg-a/pg-b) and locally. U3 runs the vendored previous state (runtime 76f9cb2) in a subprocess against
the data the new state wrote. U6 (SQLite) is covered by Orkexa's T-SQL-10. On the runtime side, T-UPG-6 shows that the
desktop knowledge base never loads the PostgreSQL backends. U7 is also covered at the API level (api #109, T-UPG-7).

### 3.5 Parity and coverage

- T-PAR-3: every statement of the B4 baseline (`sql_parity_before.json`, 46 statements) is contained in the source code
  findings plus the rendered Orkexa catalog.
- T-CAT-5: the catalog Nodestro runs is Orkexa's catalog with the prefix `nodestro_`.
- Orkexa's catalog parity test against Nodestro's catalog is exact (orkexa #66). The two B5 fixes, the reindex retry
  and the refusal of tenant ids with NUL, change no statement.

### 3.6 Image smoke (T-SMOKE-1), desktop and studio E2E (local, `/home/user/mup/b6/G2-EVIDENCE.md` on the agent host)

| Item | Result | Note |
|---|---|---|
| Server image (studio 5318cea plus override wheels runtime da9e909, api 48b467c, orkexa 792a041), FX-PG-0, compose stack with Dex, sandbox and model stub | **38/38 pass** | both tenants find their legacy data; upload, worker reindex, then fts, vector and hybrid search; every vector score equals the stub's cosine; equal file ids stay separate; tenant B's rows are byte-identical after tenant A's upload, reindex and delete; the runtime role ran no DDL |
| Same with FX-PG-0v (pgvector 0.8.7) | **38/38 pass** | |
| Schema deviation (index `nodestro_chunks_search` dropped) | **refused** | `nodestro-server check` and the api start exit 1 with `storage.schema_mismatch … missing_index … Nothing was changed`; schema unchanged; the baseline image (studio master) does not refuse, so the refusal comes from B6 |
| Local Docker image (`local` target, same overrides) | builds; no psycopg, pglast or axentra in it | the repository's e2e suite could not run: the Ollama image pull ran out of disk space on the agent host. Substitute run (compose with models off, gateway and studio): **10/10 pass** |
| Desktop | substitute **pass** | a fresh venv with the studio wheel and no extras, plus runtime da9e909: no psycopg, pglast or axentra; `import nodestro_runtime` and `postgres_tables` work; knowledge smoke 10/10; desktop repo checks 5/5. The Tauri shell was not built (no WebKitGTK on the host) |
| Studio E2E `scripts/e2e.sh smoke api` | **pass** | smoke 70 ok, api 53 ok |
| `scripts/check_versions.py` on a B6 studio state | 3 mismatches, expected | examples, integrations and sdk still pin the pre-B6 runtime/api; they agree after the cascade |

The faithful (non-override) image and desktop builds cannot be made before the merge. examples and integrations pin
runtime df4aeb3, so pip and uv refuse a studio state that pins da9e909 ("conflicting URLs for nodestro-runtime"). The
server Dockerfile can only fetch a pushed studio commit. These builds follow the cascade (section 4).

## 4. Merge plan after approval

1. Merge runtime #140 (merge commit).
2. Re-pin runtime in examples and integrations; api #109 moves its runtime and examples pins to those merge commits
   and is marked ready; sdk follows.
3. studio: pins, and remove the `partition.missing` texts. B6 moves the code to Orkexa, so it is no longer in the
   runtime catalog. Then server (pins plus a RUNBOOK row for `storage.schema_mismatch` at start), desktop and
   local-docker.
4. After the merge, CI on the merge commits gives the evidence that was not possible before: the real image builds
   with the image scan, the local-docker e2e, and the desktop builds on Linux and macOS.
   - If one of them fails because of B6, fix forward within MP-B6, or roll back per 9.8: first the consumer pins, then
     a revert of #140. No migration is involved: B6 runs no DDL, and the schema is the one migrations 0002/0010
     already create.

## 5. Plan 7.3 check

| Criterion | State |
|---|---|
| 1. Mandatory jobs green on the merge commit without unexplained re-runs | **not provable before the merge.** #140's PR CI is green with no re-run, but the cascade jobs can only run on merge commits. In the B4 cascade, studio #153 needed one WebKit re-run with a known, explained cause (studio #153 comment) |
| 2. Skipped tests match the expectations | green in #140's CI (new skip lines for the affected jobs are checked in) |
| 3. K1–K12, U1–U8 | U1–U8 green (3.4) |
| 4. Ranking criteria (10.6, Overlap@10) | **not re-measured for B6.** B6 changes no statement (T-PAR-3, catalog parity), and the vector scores in the smoke equal the cosine. Equal ranking is an inference here, not a measurement, and that needs judgment |
| 5. No open P1/P2 security finding in scope | none open. The zlib CVEs in the server base image (server #71) are outside B6 and are being fixed |
| 6. Report complete and linked in STATUS.md | yes |

Criteria 1 and 4 need judgment or come after the merge, so per 7.3 the agent stops at G2.

## 6. Other findings in this round

- orkexa #66 fixed a race that existed before this round: `SQLiteIndex.retrieve` could fail with a `TypeError` when
  another instance deleted a ranked chunk. It now uses one read transaction, with a regression test.
- api #111: the runtime-master tenant SQL check now installs orkexa at the runtime's pin. Without it, api CI would have
  turned red as soon as #140 merged.
- local-docker #47 is red because of two HIGH zlib1g CVEs (CVE-2026-76844, CVE-2026-85091) in the pinned
  `python:3.13-slim` base, which upstream has not rebuilt yet. server #71 adds `apt-get upgrade` to the image's base
  stage; #47 follows with the new server pin.
- studio WebKit E2E: `settings-ui.mjs` counts the console message "Connection terminated unexpectedly" (an aborted
  request) as an error. It failed once and passed on re-run. Follow-up: filter aborted requests in the e2e error check.
- `platform/versions.json` lists orkexa as `0.1.0`, while orkexa's pyproject says `0.2.0.dev0`. `check_versions.py`
  does not compare orkexa's version.
- The schema report of `verify_schema` says "version not recorded" for Nodestro databases, because Nodestro keeps its
  own migration runner. This is informational and does not block a start.

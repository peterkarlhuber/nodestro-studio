# A9 RLS evaluation for Nodestro (MP-A9, gate G3)

State 2026-11-07. Execution state: A9 "paper created, decision G3 open". This package is an evaluation only: no
row-level security (RLS) is introduced, no migration is written, and nothing is merged into any master (E-10). The
prototype lives on the nodestro-runtime branch `mup/a9-rls-prototype` at `ef5fab1` (not merged, no PR) and ran only on new test
databases (`a9_rls`, `a9_rls_bench`) on two local test servers.

**Recommendation: option (a), stay with M10.** Details in section 6; the implementation plans for (b) and (c) are in
the annex in case G3 decides otherwise.

## 1. Basis

| Item | Value |
|---|---|
| Precondition | B6 merged (runtime #140 as `81b0f55`). The prototype branch starts at runtime `master` `f1e7bc7`, which differs from `81b0f55` only in CI files (no change under `src/`). |
| Orkexa | `792a041` (the runtime's pin), `orkexa.backends.postgres` |
| Axentra | `60d83b3` (the runtime's pin), migrations applied in the same test database |
| Servers | `pga`: PostgreSQL 17.11 without pgvector; `pgb`: PostgreSQL 17.11 with pgvector (both Docker containers on one 4-CPU machine, reached over TCP on 127.0.0.1) |
| Fixtures | FX-PG-0 (on `pga`) and FX-PG-0v (on `pgb`), restored into a new database with the runtime's own `restore_dump` |
| Roles | `a9_owner` (owns the database and every table, no superuser, no `BYPASSRLS`); `a9_runtime` (granted by the runtime's `grant_runtime_role`, which reports it as `restricted`) |
| Target paths | This report goes to studio `docs/architecture/mup-ona/reports/A9-rls-evaluation.md`, the ADR draft to `docs/adr/0010-nodestro-rls.md` (0010 is the next free number on studio `master` and its branches) |
| Client | Python 3.13.18, psycopg 3, own venv with runtime `f1e7bc7` installed editable |

## 2. Evidence from B4 to B6

Tenant separation in PostgreSQL today rests on three layers that do not involve the database:

1. **Static tenant SQL check** (decision M10, review condition SR-01). `nodestro_runtime/tenant_sql_check.py`
   (source side: `tenant_tables` line 153, `check_sql` line 1338, `scan_package` line 1380) rebuilds every string
   expression of `nodestro_runtime` and `nodestro_api` and judges each statement on a tenant table with Orkexa's rule
   engine `orkexa.testing.sqlcheck` (since B6). Runtime `tests/test_tenant_filters.py` (40 test functions, every bypass
   of review rounds 1 to 4 as a regression test); rules and CI anchoring in runtime `docs/AXENTRA.md` lines 132-240 (M10 itself: 132-150).
   The runtime allowlist `tenant_sql_allowlist.py` holds 46 cross-tenant statements, each with its reason; the API
   allowlist is empty because the API has no SQL of its own (nodestro-api `src/nodestro_api/tenant_sql_allowlist.py`).
2. **Statement catalog** (B4, moved into Orkexa in B5). Every SQL text of the knowledge index, file store and memory
   is one of 43 named entries of `orkexa/backends/postgres/_sql.py` (`CATALOG`, line 480); 42 are partitioned by
   tenant, the 43rd (`vectors_pgvector`) reads only `to_regtype('vector')`. Runtime `tests/test_sql_catalog.py`
   renders them with Nodestro's prefix and proves each bound to one tenant (T-CAT-1/5, line 117), and that every
   mutation of a tenant predicate is a leak (T-CAT-2, line 172); T-CAT-3 (line 216) fails on a new entry.
3. **Partition guard** (B4). `Executor.execute` (`_sql.py` lines 619-637) refuses a partitioned statement whose
   `tenant_id` parameter is not the store's own tenant before any database access (runtime
   `tests/test_partition_guard.py`, T-GUARD-1 line 83, T-GUARD-2 line 216).

Behavioral evidence:

- **T-PART-1..9** (runtime `tests/test_pg_partitions.py` lines 44-59, run through Orkexa's conformance cases in
  `tests/test_orkexa_conformance.py`): reads, writes, updates, deletes, reindex, failed writes, concurrency (3 x 8
  threads over one pool, line 104), hostile values and vector joins, as superuser and as the restricted runtime role
  (CI jobs `pg-a`, `pg-b`).
- **T-NOD-HTTP** (nodestro-api `tests/test_identity.py` line 580): two tenants with the same document id, source,
  namespace, memory space and path over HTTP; each sees and changes only its own rows.
- **The hook for RLS exists and is off.** Orkexa's `ConnectionSource.transaction(mode, tenant_id=...)`
  (`connection.py` lines 85-91) passes the tenant to every transaction; `PsycopgSource(tenant_setting=...)`
  (lines 114-247) and Nodestro's `DatabaseSource(tenant_setting=...)` (runtime `storage_postgres.py` lines 765-805)
  then run `set_config(<name>, <tenant>, true)` at the start of each transaction. Nodestro builds `DatabaseSource`
  without it (`postgres_tables.py` lines 73, 107, 164); runtime `tests/test_partition_guard.py` line 292 checks that it
  is off by default and transaction-local. The API never sets it.

Run for this report (runtime `f1e7bc7`, orkexa `792a041`, nodestro-api `8fbf220`, new database `a9_evidence` on
`pgb`, dropped afterwards): `test_sql_catalog.py`, `test_partition_guard.py`, `test_pg_partitions.py`,
`test_orkexa_conformance.py`, `test_tenant_filters.py` and `test_legacy_fixtures.py` as superuser with
`NODESTRO_REQUIRE_POSTGRES=1` and `NODESTRO_REQUIRE_PGVECTOR=1`: 912 passed, 2 skipped (the two API scans, which then
passed separately with `NODESTRO_API_SRC` and `NODESTRO_REQUIRE_API_SCAN=1`); the partition, guard and conformance
files again as the runtime role (`NODESTRO_TEST_RUNTIME_ROLE=1`): 627 passed; T-NOD-HTTP in nodestro-api for the three
identity backends: 3 passed.

What these layers do not cover is the gap MUP-ONA names: a correctly formed statement with a wrong tenant value, and
SQL that is not in the checked source (an ad hoc query, a future module outside the scan).

## 3. Prototype and T-RLS-P1

Branch `mup/a9-rls-prototype`, directory `tests/rls_prototype/` (collected by pytest only when `A9_RLS_ADMIN` is set,
so the CI skip lists are unchanged):

- `policies.sql` / `drop_policies.sql`: for `nodestro_documents`, `nodestro_files`, `nodestro_chunks`,
  `nodestro_memory_files`, `nodestro_vector_spaces` and `nodestro_chunk_vectors`: `ENABLE` and `FORCE ROW LEVEL
  SECURITY` and one policy `USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (same)`.
- `rls_support.py`: creates the database, restores the fixture, hands the tables to `a9_owner`, applies Axentra's
  migrations, grants `a9_runtime`.
- `test_rls_p1.py`: T-RLS-P1 and the compatibility checks below. Result: **20 passed on `pgb` with FX-PG-0v and 20
  passed on `pga` with FX-PG-0** (JUnit files in `results/`).

| Check | Result |
|---|---|
| Unfiltered `SELECT` on each of the six tables, tenant set | only the own tenant's rows, count equal to the superuser's count for that tenant; 0 rows when filtering for the other tenant |
| Unfiltered full-text query and a vector/chunk join | only own rows |
| Unfiltered `UPDATE` / `DELETE` | affect exactly the own tenant's rows |
| `INSERT` with a foreign `tenant_id`, `UPDATE ... SET tenant_id = <foreign>` | refused (`new row violates row-level security policy`) |
| Setting never defined in the session (`NULL`) | 0 rows on every table, inserts refused (fail closed) |
| Setting defined in an earlier transaction of the same session (pooled connection, value `''`) | 0 rows (fail closed) |
| Restricted runtime role | `inspect_role` reports `restricted`; a `BYPASSRLS` role is refused by `grant_runtime_role` (`storage.role_unsafe`) |
| Owner role with FORCE | without the setting 0 rows; with it only own rows. A superuser sees everything (policies never apply). |
| Axentra's 34 forced tables in the same database | RLS flags and policy counts unchanged; Axentra's `axentra.scope` works as before with or without `app.tenant_id`; Axentra's platform scope does not open Nodestro's tables, and `app.tenant_id` does not open Axentra's |
| Orkexa's classes through `DatabaseSource(tenant_setting="app.tenant_id")` | full-text, vector and hybrid search, vector status, file list, memory view and chunk inserts work for each tenant and see only their own rows |
| Orkexa's `PsycopgSource` with the hook, 2 connections, 8 threads, 200 mixed-tenant operations | every unfiltered read saw only its own tenant; an idle pooled connection carries `''` |

Findings (asserted as current behavior, not as desired behavior):

- **F1. Master does not work under the policies.** Nodestro builds `DatabaseSource` without the hook, and its own SQL
  beside Orkexa's catalog (`PostgresIndex.counts`, `attach_file`, `text`, `memory_totals` in `postgres_tables.py`,
  and the whole document store `PostgresStore`) runs through `PostgresDatabase._query` / `_write` without a tenant
  setting. Under the policies all of it sees no rows. RLS therefore needs code changes before any migration.
- **F2. The hook of `DatabaseSource` serializes reads.** With `tenant_setting`, `read` and `write` go through
  `PostgresDatabase._transaction()`, which holds the database's process lock (`storage_postgres.py` lines 360-383).
  Reads that run in parallel today would wait for each other (measured in section 4). Orkexa's `PsycopgSource` does not
  have this limitation.
- **F3. Joined transactions.** Inside one outer transaction, `DatabaseSource` sets the tenant again for every store
  call, so each Orkexa statement runs under its own tenant, and the last call's tenant stays for the rest of the
  transaction (a raw statement after it runs under that tenant). `PsycopgSource` sets the tenant only when the outer
  transaction opens, so a store of another tenant inside it reads nothing. Neither leaks a row of a tenant that no call
  in the transaction named.
- **F4. Data migrations and maintenance under FORCE.** The owner without the setting changes no row
  (`UPDATE nodestro_chunks SET title = title` affects 0 rows), silently. A later data migration on these tables must
  run with a bypass (a role with `BYPASSRLS`, or a policy exception) and must check its row counts.
- **F5. Backups need no new privilege.** `pg_dump` reads with `row_security = off` and fails on a table whose policies
  would filter. As the owner without `BYPASSRLS` this already fails today on Axentra's forced tables (checked for
  `axentra_products` and, with the policies, `nodestro_chunks`); nodestro-api's backup already requires an owner with
  `BYPASSRLS` or a superuser (nodestro-api `server.py` lines 1300-1301 and 1339-1343).
- **F6. Foreign keys bypass RLS.** `nodestro_chunk_vectors.chunk_id` references `nodestro_chunks.id` only, and
  PostgreSQL's referential checks ignore policies; a vector row could reference another tenant's chunk id. This is not
  new (it holds without RLS too) and is prevented today by the catalog statements that write vectors.

### Code paths and the tenant setting

Every Orkexa statement runs inside a `ConnectionSource.transaction(..., tenant_id=<store tenant>)`; with the hook,
each can carry the tenant. The paths that are cross-tenant by design, and how they would be affected:

| Path | Tables | Under (b) | Under (c) |
|---|---|---|---|
| Knowledge index, file store, memory (Orkexa catalog, 42 partitioned statements) | knowledge and memory tables | hook sets the tenant | same |
| Nodestro's own knowledge SQL (`counts`, `attach_file`, `text`, `memory_totals`) | chunks, memory files | must move behind the hook (F1) | same |
| Reindex (`PostgresIndex.reindex`, job worker) | chunks, vectors, spaces | per tenant through the catalog; hook sets it | same; the job claim itself is cross-tenant |
| Desktop import (`postgres_import.py`) | documents, files, chunks, memory files | one tenant in one transaction; set the tenant at its start | same |
| Start check `verify_schema`, `require_knowledge_schema` | catalog views only | not affected | not affected |
| Migrations (owner) | all | schema changes unaffected; data changes need a bypass (F4) | same |
| Backups (`pg_dump`, owner with `BYPASSRLS` or superuser) | all | unchanged (F5) | unchanged |
| 46 allowlisted statements: worker claim, heartbeat and finish by job id, reaper, housekeeping, schedule leader, session lookup by token hash, logout, login state and bootstrap token consumption, metrics aggregates, secrets re-encryption and start checks, Axentra reconcile and backfill, `find()` | jobs, run events, documents, sessions, memberships, login states, bootstrap tokens | **none touches a knowledge or memory table** | each needs a bypass scope or a security-definer function |

## 4. T-RLS-P2 measurements

Raw data: `tests/rls_prototype/results/` on the prototype branch (`t-rls-p2-*.json` with every sample,
`t-rls-p2-summary.csv`, `m10-bench-*.json`, `plans-*.json`, `large-tenant-fts-*.json`). Scripts: `bench_rls_p2.py`,
`explain_plans.py`, `large_tenant_fts.py`, and the unchanged M10 script `tests/bench_nodestro_rls.py`.

**Set-up.** Database `a9_rls_bench`: FX-PG-0(v) plus 20 synthetic tenants with 1,000 chunks each (64-dimensional
vectors of a deterministic fake model, Zipf-distributed words), 1,000 documents and 100 memory files each (20,012
chunks, 20,016 vectors, 20,000 documents in total). Every operation runs through Orkexa's classes or the M10
statements as the restricted runtime role for tenant `t03`. Five runs; in each run the four variants run in turn
(policies applied before the third, dropped after the fourth), 200 rounds per operation (100 for vector, hybrid and
insert) after 10 warm-up rounds. Rows written by a variant are removed and the tables vacuumed before the next variant
(a first attempt without this let the tenant grow during the run and was discarded). Medians and p95 over all 1,000
(500) samples per cell.

Variants: `today` = master (`DatabaseSource` without hook, autocommit reads and writes, no policies); `hook` = the hook
on, no policies (the cost of the transaction alone); `rls` = hook and policies (what option (b) would run);
`policy only` = policies inside one open transaction with the setting already set (the policy alone, no commits).

### 4.1 Latency, PostgreSQL 17 with pgvector (`pgb`), median / p95 in ms, factor of the `today` median

| Operation | today | hook | rls | policy only |
|---|---|---|---|---|
| full-text search | 3.54 / 6.35 | 4.44 / 7.45 (1.25x) | 2.07 / 3.47 (0.58x) | 1.38 / 1.97 (0.39x) |
| vector search (pgvector) | 5.80 / 7.81 | 7.67 / 10.69 (1.32x) | 6.33 / 9.98 (1.09x) | 4.97 / 7.40 (0.86x) |
| hybrid search | 16.06 / 24.00 | 19.75 / 30.16 (1.23x) | 18.10 / 23.55 (1.13x) | 11.05 / 16.47 (0.69x) |
| chunk insert with vector | 3.10 / 4.91 | 2.93 / 4.56 (0.94x) | 3.39 / 5.21 (1.09x) | 1.52 / 3.02 (0.49x) |
| memory view | 0.79 / 1.74 | 0.96 / 1.95 (1.22x) | 1.05 / 2.54 (1.33x) | 0.74 / 1.37 (0.94x) |
| memory write | 2.00 / 3.30 | 2.03 / 3.76 (1.01x) | 1.98 / 3.89 (0.99x) | 1.08 / 1.97 (0.54x) |
| document get (M10 statement) | 0.23 / 0.45 | 0.57 / 0.89 (2.55x) | 0.63 / 0.99 (2.78x) | 0.17 / 0.39 (0.75x) |
| document upsert (M10 statement) | 0.75 / 1.16 | 1.32 / 2.47 (1.77x) | 1.04 / 2.41 (1.39x) | 0.17 / 0.37 (0.23x) |

### 4.2 Latency, PostgreSQL 17 without pgvector (`pga`), median / p95 in ms

| Operation | today | hook | rls | policy only |
|---|---|---|---|---|
| full-text search | 3.46 / 5.52 | 4.21 / 7.07 (1.22x) | 2.15 / 3.35 (0.62x) | 1.40 / 2.01 (0.40x) |
| vector search (ranked by the runtime) | 26.42 / 34.25 | 30.99 / 43.64 (1.17x) | 30.08 / 38.80 (1.14x) | 27.35 / 34.95 (1.04x) |
| hybrid search | 38.03 / 51.05 | 45.97 / 66.72 (1.21x) | 43.12 / 54.28 (1.13x) | 35.32 / 45.76 (0.93x) |
| chunk insert with vector | 3.14 / 4.82 | 3.15 / 5.21 (1.00x) | 2.44 / 4.39 (0.78x) | 1.88 / 2.83 (0.60x) |
| memory view | 0.80 / 1.83 | 0.93 / 1.61 (1.17x) | 0.88 / 2.11 (1.10x) | 0.47 / 1.13 (0.59x) |
| memory write | 1.65 / 3.19 | 1.79 / 3.27 (1.09x) | 1.68 / 2.97 (1.02x) | 0.79 / 1.69 (0.48x) |
| document get | 0.18 / 0.37 | 0.56 / 0.88 (3.12x) | 0.54 / 0.89 (3.05x) | 0.15 / 0.33 (0.86x) |
| document upsert | 0.69 / 1.12 | 1.11 / 2.06 (1.61x) | 0.94 / 1.51 (1.37x) | 0.18 / 0.35 (0.26x) |

Per-run medians vary by up to about 30 % between runs (e.g. full-text `today` on `pga`: 2.97 to 4.21 ms), so
differences below about 15 % are within the noise of this machine. The `policy only` writes are fast because they
never commit; that column isolates the policy, not a usable mode.

### 4.3 Throughput, 8 threads of full-text search for 5 s (operations per second)

| Variant | `pgb` | `pga` |
|---|---|---|
| today (`DatabaseSource`, no hook) | 1,117 | 1,144 |
| hook, no policies (`DatabaseSource`) | 197 | 206 |
| hook and policies (`DatabaseSource`) | 383 | 391 |
| hook and policies (Orkexa's `PsycopgSource`, 8 connections) | 640 | 664 |

The hook of `DatabaseSource` serializes reads behind the process lock (F2): throughput falls by 66 % to 82 %. Orkexa's
`PsycopgSource` keeps reads parallel and loses 42 % (the extra round trips and commits).

### 4.4 The M10 benchmark again (unchanged `tests/bench_nodestro_rls.py`, three runs, median of the run medians, µs)

| Statement | server | today | `BEGIN`+`set_config`+stmt+`COMMIT` | same, pipeline | policy only |
|---|---|---|---|---|---|
| point read | `pgb` | 159 | 542 | 239 | 147 |
| 1,000-row listing | `pgb` | 2,069 | 2,643 | 1,478 | 1,792 |
| upsert | `pgb` | 577 | 1,142 | 949 | 157 |
| point read | `pga` | 151 | 548 | 290 | 146 |
| 1,000-row listing | `pga` | 1,926 | 2,547 | 1,610 | 1,581 |
| upsert | `pga` | 568 | 1,045 | 612 | 170 |

This reproduces M10's finding (point read 85 to 236 µs there on a local socket, here 151-159 to 542-548 µs over TCP
to a container): the policy itself is cheap; the cost is the transaction around each statement.

### 4.5 Plans: the policy changes how full-text search uses its index

PostgreSQL folds the policy into a one-time filter (`current_setting('app.tenant_id', true) = 't03'`), because the
statement already binds `tenant_id`. But `@@` (`ts_match_vq`) and pgvector's `<=>` are not leakproof, so under RLS the
planner does not use them before the policy's qual, and the GIN index `nodestro_chunks_search` is no longer usable
(`plans-*.json`). With 1,000 chunks per tenant that is faster (a scan of the tenant's rows by the btree index instead
of a `BitmapAnd` with the GIN index over all tenants), which explains the 0.4x to 0.6x of full-text search in 4.1 and
4.2. With a large tenant it is much slower (`large_tenant_fts.py`, one tenant of 200,000 chunks, runtime role):

| Query | server | without policies (median / p95 ms) | with policies | plan with policies |
|---|---|---|---|---|
| rare word (1 in 1,000 chunks) | `pgb` | 5.3 / 7.4 | 57.4 / 64.8 (10.7x) | parallel sequential scan instead of the GIN index |
| rare word | `pga` | 5.0 / 6.6 | 53.0 / 73.4 (10.5x) | same |
| word in every chunk | `pgb` | 133.4 / 167.0 | 146.5 / 196.3 (1.1x) | same |
| word in every chunk | `pga` | 138.2 / 159.8 | 141.0 / 188.9 (1.0x) | same |

Marking `ts_match_vq` `LEAKPROOF` would restore the index, but needs a superuser, applies to the whole cluster and is
a security judgment about a function PostgreSQL deliberately does not mark leakproof; it is not proposed.

**Summary of T-RLS-P2.** The policy alone costs nothing measurable at this size. The transaction that carries the
setting costs 1.2x to 1.3x on searches, about 1.4x to 1.8x on single writes and 2.5x to 3.1x on point reads, and with
`DatabaseSource`'s current hook a loss of 66 % to 82 % of parallel read throughput. Full-text search of a large tenant
loses its GIN index under RLS (10x on rare words at 200,000 chunks).

## 5. Options

| | (a) stay with M10 | (b) RLS for knowledge and memory tables | (c) RLS for all `nodestro_*` tenant tables |
|---|---|---|---|
| Tables | none | `nodestro_files`, `nodestro_chunks`, `nodestro_memory_files`, `nodestro_vector_spaces`, `nodestro_chunk_vectors` | the five plus `nodestro_documents`, `nodestro_jobs`, `nodestro_run_events`, `nodestro_schedule_firings`, `nodestro_sessions`, `nodestro_memberships`, `nodestro_login_states`, `nodestro_bootstrap_tokens` |
| What it adds | nothing | a second check against a missing tenant predicate in any SQL on these tables, including SQL outside the checked source | the same for every tenant table |
| What it does not add | | protection against a wrong tenant value (the setting comes from the same store object); protection against SQL injection (any role may call `set_config`) | same |
| Code changes before the migration | none | route `counts`, `attach_file`, `text`, `memory_totals` and `postgres_import` through the hook; turn the hook on in `knowledge_tables` / `tenant_storage`; make `DatabaseSource`'s hooked reads not take the process lock (F2); a test that every knowledge statement runs with the setting | all of (b), plus the document store (`PostgresStore`: every `get`, `items`, `find`, `put` in a transaction), jobs, identity, schedules, metrics and Axentra mirror modules; a bypass design for the 46 allowlisted statements (a separate role with `BYPASSRLS` on a second pool, or `SECURITY DEFINER` functions owned by a role without FORCE) |
| Effort (estimate) | none | about 3 to 5 days in runtime, 1 to 2 in orkexa (lock-free hooked reads are optional there), 1 in server/api docs and checks | about 3 to 4 weeks across runtime, api, server; touches every module with SQL |
| Performance | unchanged | searches 1.1x to 1.3x, memory and chunk writes about 1.0x to 1.3x; parallel reads depend on F2 (with the lock: -66 % to -82 %; without it, as `PsycopgSource`: about -42 %); full-text search of large tenants loses the GIN index (10x on rare words at 200,000 chunks) unless the queries are reshaped | all of (b), plus point reads of documents 2.5x to 3.1x and upserts 1.4x to 1.8x on every request path; the worker and leader paths need the second pool |
| Risk | the known gap stays (wrong tenant value; SQL outside the checked source) | fail-closed regressions (a missed path reads nothing, F1); silent no-op data migrations (F4); the full-text index regression; mixed-tenant transactions (F3) | all of (b) at a larger scale; a bypass role is a new high-value credential; regressions in jobs and identity paths that today have no RLS-aware tests |
| Migration consequence | none | `0011_knowledge_rls.sql` (see annex) | `0011` as in (b) and `0012` for the other tables, or one `0011` after all code paths are ready |
| Rollback | n/a | a forward migration `0012` that drops the policies and disables RLS on the five tables; the code with the hook keeps working without policies | same, for every table |

## 6. Recommendation

**Option (a): stay with M10, do not introduce RLS now.** The ADR draft `0010-nodestro-rls.md` proposes this.

1. RLS does not close the gap MUP-ONA names. A correctly formed statement with a wrong tenant value passes RLS too,
   because the setting would be taken from the same store object that binds `tenant_id`. RLS only adds a second check
   against a missing predicate, and for all SQL in the checked source the static check, the catalog's mutation probe
   and the partition guard already prove it (section 2); none of the 46 cross-tenant statements touches a knowledge or
   memory table.
2. The cost is real on the current connection model. The transaction for the setting costs 1.2x to 3x per
   operation, and the existing hook of `DatabaseSource` would cut parallel read throughput by two thirds or more until
   it is reworked. Full-text search of a large tenant loses its GIN index under RLS.
3. It needs code changes first (F1), in modules that other packages change, and a new discipline for data
   migrations (F4).

If G3 nevertheless wants a database-enforced second line, **(b) is the only reasonable scope**: these five tables have
no cross-tenant path, every statement on them already carries its tenant to the `ConnectionSource`, and Axentra's
tables and the backup role are unaffected (T-RLS-P1). (c) is not recommended: it touches every request path and needs
a bypass credential for the worker, leader and operator paths, for little gain over (b).

Triggers that should reopen G3 (as stated in the ADR draft): SQL on these tables outside the checked source
(plugins, user-defined queries, another service), a contractual or audit requirement for database-enforced isolation,
or a move to per-request transactions that removes most of the measured cost.

What could not be verified: the measurements come from one 4-CPU machine with both servers in local Docker
containers over TCP; production network latency would make the extra round trips of the transaction more expensive
(M10 noted milliseconds over a network), and a pipelined `BEGIN`/`set_config` would recover part of it (4.4). Tenants
larger than 1,000 chunks were measured only for full-text search (4.5). The API's T-NOD-HTTP and the T-PART suites
were run without policies (section 2), not under the prototype policies, because master does not set the tenant (F1).

## Annex: implementation plans for options (b) and (c), to be approved separately

These plans are drafts for a later, separate approval. Nothing here is approved by G3 accepting option (a).

### A.1 Option (b): RLS for the knowledge and memory tables

Preconditions: G3 decides (b); a work package with its own gate; the orkexa pin is current.

1. **Runtime, no policies yet (one PR).** `knowledge_tables`, `tenant_storage` and the classes of
   `postgres_tables.py` build `DatabaseSource(database, tenant_setting="app.tenant_id")`. `counts`, `attach_file`,
   `text` and `memory_totals` run through `source.transaction(..., tenant_id=...)` instead of `_query` / `_write`;
   `import_desktop_database` sets the tenant at the start of its transaction. `DatabaseSource` runs hooked `read`
   transactions on a pooled connection without the process lock (only writes keep it), so F2 disappears. Tests:
   a probe that fails if any knowledge statement runs without `app.tenant_id` (an event trigger is not available for
   DML, so the test enables the prototype policies in its own schema and runs the T-PART and conformance suites under
   them as the runtime role).
2. **Orkexa (optional, one PR).** Document in `connection.py` that a joined transaction keeps the first tenant (F3);
   optionally refuse a store call for another tenant inside a joined hooked transaction.
3. **Full-text index (decision inside the package).** Under RLS `@@` cannot use the GIN index (4.5), and no index
   shape changes that, because the operator itself is not leakproof. The package measures the largest real tenant
   and decides between accepting the slower rare-word search, keeping `nodestro_chunks` out of the policies (and with
   it the vectors' join partner), or a reviewed `LEAKPROOF` exception by the database operator. This decision is part
   of the package's gate.
4. **Migration `0011_knowledge_rls.sql`** (forward-only, additive, applied by the owner in the runner's single
   transaction, checksum recorded): for each of the five tables `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL
   SECURITY` and `CREATE POLICY nodestro_tenant ... USING (tenant_id = current_setting('app.tenant_id', true)) WITH
   CHECK (...)`, exactly as `tests/rls_prototype/policies.sql`. It changes no data and takes an `ACCESS EXCLUSIVE`
   lock on each table for the DDL only. `verify_schema` (Orkexa) and `require_knowledge_schema` learn to expect the
   policies (a schema-v2 entry in orkexa, or a Nodestro-side check), so a database without them is refused at start.
5. **Runtime role and backups.** `grant_runtime_role` and `inspect_role` already refuse superusers, `BYPASSRLS` and
   table owners. The backup keeps requiring an owner with `BYPASSRLS` or a superuser (already the case for Axentra).
   Data migrations on these tables from `0012` on must run as a role with `BYPASSRLS` or set the tenant per tenant,
   and must assert their row counts (F4); the migration guide says so.
6. **Tests and gates.** T-RLS-P1 becomes a regular PostgreSQL test (runtime role, both CI jobs `pg-a`, `pg-b`);
   T-RLS-P2 runs again on the release candidate; the static tenant SQL check stays unchanged and mandatory.
7. **Rollback.** A forward migration `0012` drops the five policies and disables RLS; the hooked code from step 1
   works with and without policies, so code and schema can be rolled back independently.

Estimate: 3 to 5 days runtime, 1 to 2 days orkexa, 1 day api/server documentation and start checks, plus the
measurement of step 3.

### A.2 Option (c): RLS for all `nodestro_*` tenant tables

All of A.1, then:

1. **Document store.** `PostgresStore` gets the hook: every read and write in a transaction with the tenant (or a
   pipeline of `BEGIN`, `set_config`, statement, `COMMIT`). Measure point reads against the 2.5x to 3.1x of 4.1/4.2.
2. **Bypass design for the 46 allowlisted statements.** Either a second pool on a maintenance role with `BYPASSRLS`
   used only by the worker claim, heartbeat and finish, the reaper, housekeeping, the schedule leader, metrics and
   operator commands, or `SECURITY DEFINER` functions owned by a role on which the tables are not forced. Session
   lookup by token hash, logout, login state and bootstrap token consumption run before a tenant is known and need the
   same. Each bypass is reviewed like an allowlist entry today.
3. **Migration `0012_all_tenant_rls.sql`**: policies for `nodestro_documents`, `nodestro_jobs`,
   `nodestro_run_events`, `nodestro_schedule_firings`, `nodestro_sessions`, `nodestro_memberships`,
   `nodestro_login_states` (its `tenant_id` may be NULL: the policy must allow NULL rows only to the bypass role) and
   `nodestro_bootstrap_tokens`.
4. **Deployment.** The server's compose files and `nodestro-server` gain the maintenance role and its secret; the
   runbook explains which processes use it.
5. **Rollback.** A forward migration that drops the policies; the bypass role can stay unused.

Estimate: 3 to 4 weeks across runtime, api and server, with a security review of the bypass design.

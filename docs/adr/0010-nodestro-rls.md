# ADR-0010: Row-level security for Nodestro's PostgreSQL tables

- Status: Proposed (2026-11-07, MUP-ONA MP-A9, gate G3). Accepting the pull request that adds this record decides G3.
  RLS is not introduced by this record; option (b) or (c) would each need their own approved implementation plan.
- Repositories: nodestro-runtime (prototype branch `mup/a9-rls-prototype` at `ef5fab1`, not merged), orkexa (the `ConnectionSource`
  hook, unchanged), nodestro-api and nodestro-server (backup role, unchanged), nodestro-studio (this record and the A9
  report).
- Related: [ADR-0002](0002-storage-backends.md) (storage backends), [ADR-0003](0003-identity-and-tenants.md) (identity
  and tenant isolation); runtime `docs/AXENTRA.md` decision M10 (no RLS, static check) and review condition SR-01;
  MUP-ONA E-10, MP-A9; report `docs/architecture/mup-ona/reports/A9-rls-evaluation.md`.

## Context

Nodestro separates tenants in PostgreSQL by a `tenant_id` predicate in every statement. Since MUP-ONA B4 to B6 this
is enforced by three layers that do not depend on the database: the static tenant SQL check (orkexa's rule engine
`orkexa.testing.sqlcheck` over the runtime's and the API's source), Orkexa's statement catalog with its mutation probe
(every SQL text of the knowledge index, file store and memory is a named, checked entry), and the partition guard that
refuses a catalog statement whose tenant parameter is not the store's own tenant. Decision M10 (runtime
`docs/AXENTRA.md`) measured FORCE RLS on `nodestro_documents` and did not enable it. The remaining gap named by MUP-ONA
is a correctly formed statement with a wrong tenant value. Axentra, which shares the database, uses FORCE RLS keyed on
transaction-local settings.

A9 built the policies for the knowledge and memory tables (and `nodestro_documents`) on test databases restored from
the legacy fixtures FX-PG-0 and FX-PG-0v, proved that an unfiltered statement returns no foreign row (T-RLS-P1, 20
checks on PostgreSQL 17 with and without pgvector), and measured the cost (T-RLS-P2). Results and figures are in the
A9 report.

## Options considered

- **(a) Stay with M10.** No policies; the static check, the catalog and the partition guard remain the controls.
- **(b) RLS for the knowledge and memory tables** (`nodestro_files`, `nodestro_chunks`, `nodestro_memory_files`,
  `nodestro_vector_spaces`, `nodestro_chunk_vectors`). No runtime or API statement on these tables is cross-tenant by
  design, and every Orkexa statement already passes the tenant to the `ConnectionSource`.
- **(c) RLS for every `nodestro_*` table with a `tenant_id`.** Needs a bypass for 46 allowlisted cross-tenant
  statements (worker claim, reaper, housekeeping, session lookup by token hash, metrics, operator commands, start
  checks) and turns every document store read into a transaction.

## Decision (proposed)

Option (a): stay with M10 and do not introduce RLS now. Keep the `tenant_setting` hook of `DatabaseSource` and
`PsycopgSource` (off) and the prototype branch as the documented path to option (b).

Reasons:

1. The gap MUP-ONA names (a well-formed statement with a wrong tenant value) is not closed by RLS: the setting would be
   taken from the same store object that binds the statement's `tenant_id`, so a wrong store yields a wrong setting.
   What RLS adds is a second check against a missing predicate, which the three existing layers already prove for all
   SQL in the checked source.
2. It is not free on the current connection model. The hook turns every autocommit read and write into
   `BEGIN`/`set_config`/statement/`COMMIT`: searches 1.1x to 1.3x, single writes up to 1.8x, document point reads 2.5x
   to 3.1x (medians, T-RLS-P2). Nodestro's `DatabaseSource` hook also serializes reads behind the process lock (8
   threads of full-text search: 1,117 to 383 operations per second). Under RLS full-text search cannot use its GIN
   index, because `@@` is not leakproof; for a rare word in a tenant of 200,000 chunks that is 5 ms to 57 ms.
3. It cannot be switched on without code changes first: on master, Nodestro's own statements beside Orkexa's catalog
   and the document store run without the hook and see no rows under the policies (T-RLS-P1 finding).

## Revisit when

Option (b) becomes the recommendation if any of these happen: SQL on the knowledge or memory tables appears outside
the checked source (plugins, user-defined queries, a second service with its own SQL); an external audit or customer
contract requires database-enforced tenant isolation; or the runtime moves to per-request transactions anyway, which
removes most of the measured cost. The implementation plan for (b) and (c) is the annex of the A9 report.

## Consequences

- No migration, no change of behavior. The prototype branch is not merged and is deleted or archived after G3.
- The backup role already needs `BYPASSRLS` or superuser because of Axentra's forced tables; nothing changes there.
- If (b) is chosen instead, migration `0011` adds the policies (forward-only, additive), and the runtime first routes
  all knowledge and memory SQL through the hook; see the annex for the steps and the rollback.

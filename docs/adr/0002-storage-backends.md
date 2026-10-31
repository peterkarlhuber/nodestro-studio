# ADR-0002: Storage, full-text search and file storage backends

- Status: Proposed (M0, 2026-10-31)
- Repositories: nodestro-runtime (implementations), nodestro-api (backup, diagnostics), nodestro-server (operations)

## Context

See [inventory, section 1](../desktop-server/inventory.md#1-database-access). All persistent state is in one SQLite
file, accessed through the runtime's `Store` (JSON documents), Orkexa's `SQLiteFileStore`, `SQLiteIndex` (FTS5,
optional sqlite-vec) and `SQLiteMemory`, plus five places that use SQL or private connections directly. Files live in
six directories under the data directory. The desktop must keep using `~/.nodestro` and its database without a
forced migration; the server needs PostgreSQL, several processes and tenant separation.

## Decision

### Documents

1. The existing `Store` method set is the contract. It becomes a `typing.Protocol`, `DocumentStore`, in
   `nodestro_runtime/storage.py`; the current class stays as `SQLiteStore` (with `Store` kept as an alias so imports
   do not break).
2. A `PostgresStore` (new module `nodestro_runtime/storage_postgres.py`, optional extra
   `nodestro-runtime[postgres]` with `psycopg[binary,pool]>=3.2`) implements the same protocol on a table
   `nodestro_documents(tenant_id text, collection text, id text, data jsonb, updated_at timestamptz,
   PRIMARY KEY (tenant_id, collection, id))` with an expression index for each field passed to `find`.
   `transaction()` keeps its semantics (reentrant, all-or-nothing) using a connection bound to the current context.
3. Code that bypasses the store (input-file references, knowledge chunk queries, memory listing, backup,
   diagnostics) moves behind named methods first (PR-3), with the SQLite implementation unchanged. Only after that is
   a second backend added.
4. No ORM. The access patterns are key/value plus a handful of field lookups; SQLAlchemy would add a large dependency
   to the desktop bundle for no gain.

### Knowledge, full-text search and memory

5. PostgreSQL implementations subclass Orkexa's abstract bases inside `nodestro-runtime`:
   `PostgresFileStore(FileStore)` (bytes as `bytea`; Orkexa already caps documents at 20 MB),
   `PostgresIndex(Index)` (`tsvector` with the `simple` configuration plus `unaccent`, GIN index, `websearch_to_tsquery`
   or prefix `to_tsquery`), `PostgresMemory(MemoryBackend)`. Vector search uses `pgvector` only when an embedder is
   configured, mirroring sqlite-vec. **Orkexa is not changed.**
6. `KnowledgeBase` gains the three operations it currently does with raw SQL on Orkexa's tables (chunk counts per
   source, set the file id of a source, full text of a source) as methods of a small Nodestro-side index wrapper,
   implemented for both backends.
7. Behavioral contract: a shared test suite runs the same cases against SQLite and PostgreSQL. For search it asserts
   that the expected documents are in the top k and that tenant and namespace filters hold, not the exact order
   (`bm25` and `ts_rank_cd` differ). Differences that remain are documented in the user documentation.

### Tenancy in the schema

8. Every PostgreSQL table carries `tenant_id` from its first migration and every query filters on it (ADR-0003).
   SQLite stays single-tenant: the desktop uses the fixed tenant `local`, and **no column is added to the existing
   SQLite file**. Moving a desktop data directory into a server is an explicit import (planned with M4), not a shared
   file format.

### Files

9. The six data-directory folders go through a small `FileArea` abstraction only where the server needs it: inputs,
   result data, releases and exports. Desktop: the existing directories. Server: a tenant-prefixed path on a shared
   volume first (`/var/lib/nodestro/<tenant>/...`); an S3-compatible store is added only if an operator needs it.
   Python environments and generated images are worker-local caches, rebuilt from their lock files.

### Migrations and backups

10. SQLite: a schema version (`PRAGMA user_version`, today 0) is introduced. Any future SQLite migration first writes
    a backup with the existing backup code to `<data_dir>/backups/pre-migration-<version>.zip`, runs inside one
    transaction, and is covered by a fixture test with a 0.2 data directory (alongside the existing 0.1 upgrade test).
    Older Nodestro versions refuse a newer schema version with a clear error instead of misreading data.
11. PostgreSQL: numbered SQL files in `nodestro_runtime/migrations/postgres/`, applied by a small runner under a
    PostgreSQL advisory lock, recorded in `nodestro_schema_migrations`. Forward-only; rollback is restore from backup.
12. Backups: desktop keeps the in-app zip backup and restore. Server: `pg_dump` plus a snapshot of the file volume,
    documented in `nodestro-server`; the in-app backup and restore endpoints are disabled in the server profile.

## Options considered

- **PostgreSQL for the desktop too** (embedded): rejected by requirement; SQLite stays the local default.
- **One generic `Store` adapter for everything**: rejected; knowledge needs FTS and blobs, which do not fit a JSON
  document API.
- **Alembic/SQLAlchemy**: rejected for size and because the schema is a few tables.
- **Changing Orkexa to add PostgreSQL classes**: not needed; the abstract bases are the intended extension point.

## Consequences

- PR-3 (seams) is pure refactoring and must leave every existing test green; PR-9 and PR-10 add PostgreSQL.
- CI gains a PostgreSQL service container for the contract tests (runtime CI and the studio platform pipeline).
- The desktop bundle does not contain `psycopg` (the extra is server-only).

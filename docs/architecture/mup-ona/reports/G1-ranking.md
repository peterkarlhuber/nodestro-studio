# G1 ranking and compatibility report (MUP-ONA MP-B3)

Status: **final for gate G1**. Decision on G1 is open (section 5: the plan's 7.3 Overlap limits are not met, so G1 is not automatic).
Basis: nodestro-runtime #131 (merged as `099f4d4`, on #130 B1 `59a2629`), measured before the merge on its branch
`mup/b3-pg-drift` with orkexa at the B1 suite commit `5aa6346` (merged as `b3d6fae`, orkexa #63; the only other source change in between is the local-model server lifeline of orkexa #60, unrelated to storage), measured locally on `postgres:17` (pg-a) and `pgvector/pgvector:pg17` (pg-b), both pinned
by digest (O8). Data: FX-RANK-0 (200 chunks, 30 queries, identities `norm` = normalized vectors, `raw` = not
normalized, 16 dimensions, k = 10). "Before" = `FX-RANK-0.json` (code before MP-B1/B3), "after" =
`tests/fixtures/ranking/PG-CURRENT.json` (pg-a, pg-b) and a local run of `orkexa.SQLiteIndex` at `5aa6346` (SQLite).
Machine-readable metrics: CI artifact `reports/ranking/t-rank-2-metrics.json` (test `tests/test_ranking_compat.py`).

## 1. Before/after per backend on FX-RANK-0

`default` = no mode passed. Overlap@10 = share of common hits in the two top-10 lists (two empty lists = 1); Kendall
tau = tau-a of the common hits (mean over the queries with at least two common hits); rank-1 = queries whose best hit
changed.

| Backend / identity / mode | Median Overlap@10 | Min | Queries < 0.4 | Mean Kendall tau | Changed rank-1 hits |
|---|---|---|---|---|---|
| `pg-a/norm/default` | 0.45 | 0.00 | q12, q13, q14, q16, q17, q18, q19, q20, q22, q23, q26, q27 | 0.255 | 19 |
| `pg-a/norm/fts` | 1.00 | 0.43 | - | 1.0 | 0 |
| `pg-a/norm/vector` | 1.00 | 0.00 | q11 | 1.0 | 1 |
| `pg-a/norm/hybrid` | 1.00 | 0.50 | - | 0.994 | 0 |
| `pg-a/raw/default` | 0.45 | 0.00 | q12, q13, q14, q16, q17, q18, q19, q20, q22, q23, q26, q27 | 0.255 | 19 |
| `pg-a/raw/fts` | 1.00 | 0.43 | - | 1.0 | 0 |
| `pg-a/raw/vector` | 0.50 | 0.00 | q06, q11, q19, q20 | 0.285 | 23 |
| `pg-a/raw/hybrid` | 0.65 | 0.40 | - | 0.424 | 15 |
| `pg-b/norm/default` | 0.45 | 0.00 | q12, q13, q14, q16, q17, q18, q19, q20, q22, q23, q26, q27 | 0.255 | 19 |
| `pg-b/norm/fts` | 1.00 | 0.43 | - | 1.0 | 0 |
| `pg-b/norm/vector` | 1.00 | 0.00 | q11 | 1.0 | 1 |
| `pg-b/norm/hybrid` | 1.00 | 0.30 | q11 | 0.947 | 1 |
| `pg-b/raw/default` | 0.45 | 0.00 | q12, q13, q14, q16, q17, q18, q19, q20, q22, q23, q26, q27 | 0.255 | 19 |
| `pg-b/raw/fts` | 1.00 | 0.43 | - | 1.0 | 0 |
| `pg-b/raw/vector` | 1.00 | 0.00 | q11 | 1.0 | 1 |
| `pg-b/raw/hybrid` | 1.00 | 0.30 | q11 | 0.947 | 1 |
| `sqlite/norm/default` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/norm/fts` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/norm/vector` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/norm/hybrid` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/raw/default` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/raw/fts` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/raw/vector` | 1.00 | 1.00 | - | 1.0 | 0 |
| `sqlite/raw/hybrid` | 1.00 | 1.00 | - | 1.0 | 0 |

Reading the table:

- **SQLite is unchanged** (Overlap 1.0, tau 1.0, no rank-1 change in every mode): MP-B1/B3 change no SQLite ranking.
- **pg-a and pg-b, `fts`:** only q13 ("order_id", drift 8) changes: three hits instead of seven (the hits that
  held only "order" or an "id..." prefix drop out; Overlap 0.43). Order and best hits are otherwise identical.
- **`vector` with `norm` vectors:** identical except q11 (zero query vector, drift 3: before ten arbitrary hits,
  now none, Overlap 0).
- **`vector` with `raw` vectors in pg-a:** the large change. Before, the runtime ranked by the dot product, so
  longer vectors won regardless of direction; now it ranks by the cosine like pgvector (drift 4). pg-b already ranked
  by cosine and only changes on q11. Median Overlap 0.50, tau 0.29, 23 changed best hits.
- **`hybrid`:** pg-a `raw` follows the vector change (median 0.65); `norm` is nearly unchanged (tau 0.99). pg-b changes
  only on q11 (the vector half is empty now, the full-text half stays: Overlap 0.3).
- **`default`:** before `fts`, now `hybrid` with an embedding model (drift 6); the same for every backend and
  identity (median 0.45). The knowledge base always passes its mode, so agents and the API search are not affected
  by this row; only callers of `PostgresIndex.search()` without a mode are.

Per query, for the combinations that change (Overlap@10 / tau / best hit changed; "-" = fewer than two common hits;
every query of FX-RANK-0 carries the drift points it was built to show):

| Query | Text | Drift | `pg-a/raw/vector` ov / tau / r1 | `pg-a/raw/hybrid` ov / tau / r1 | `pg-a/norm/default` ov / tau / r1 | `pg-b/norm/hybrid` ov / tau / r1 | `pg-b/raw/vector` ov / tau / r1 |
|---|---|---|---|---|---|---|---|
| q01 | refund for an invoice | 4,5,6 | 0.70 / 0.33 / yes | 0.70 / 0.43 / no | 0.50 / 0.00 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q02 | parcel delivery tracking | 4,5,6 | 0.50 / 0.40 / yes | 0.70 / 0.24 / no | 0.80 / 0.29 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q03 | vacation and overtime of employees | 4,5 | 0.40 / 0.33 / yes | 0.40 / 0.00 / no | 0.40 / -1.00 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q04 | catalogue variant colour | 4,5 | 0.60 / -0.33 / yes | 0.70 / -0.52 / yes | 0.80 / 0.36 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q05 | password rotation audit | 4,5 | 0.70 / 0.62 / yes | 1.00 / 0.38 / yes | 0.80 / 0.36 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q06 | inventory reorder supplier | 4,5 | 0.30 / 0.33 / yes | 0.70 / -0.43 / yes | 0.80 / 0.07 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q07 | ticket escalation priority | 4,5 | 0.50 / 0.20 / yes | 0.60 / 0.73 / no | 0.60 / 0.73 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q08 | hotel booking itinerary | 4,5 | 0.50 / 0.60 / yes | 0.80 / 0.29 / yes | 0.70 / 0.33 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q09 | ledger tie marker | 4,5 | 0.50 / 0.20 / yes | 0.50 / 1.00 / no | 0.50 / 1.00 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q10 | courier dispatch scale probe | 4 | 0.40 / 0.33 / yes | 0.70 / 0.43 / yes | 0.50 / 0.80 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q11 | invoice refund placeholder | 3 | 0.00 / - / yes | 0.50 / 1.00 / no | 0.50 / 0.20 / yes | 0.30 / -0.33 / yes | 0.00 / - / yes |
| q12 | zero vector placeholder invoice | 3 | 0.60 / 0.20 / no | 0.60 / 0.07 / yes | 0.30 / 0.33 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q13 | order_id | 8 | 0.40 / 0.67 / no | 0.50 / 1.00 / no | 0.30 / 0.33 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q14 | customer_number lookup | 8 | 0.70 / -0.14 / yes | 0.70 / -0.14 / yes | 0.00 / - / yes | 1.00 / 0.87 / no | 1.00 / 1.00 / no |
| q15 | Größe Straße | 8 | 0.50 / 0.00 / yes | 0.80 / 0.64 / no | 0.50 / 0.80 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q16 | groesse strasse | 8 | 0.40 / 1.00 / yes | 0.40 / 1.00 / no | 0.10 / - / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q17 | cafe facade zurich | 8 | 0.50 / 0.60 / no | 0.60 / 0.87 / no | 0.20 / 1.00 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q18 | CAFÉ Résumé naïve | 8 | 0.50 / -0.20 / yes | 0.60 / 0.20 / no | 0.30 / 1.00 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q19 | REFUND POLICY | 8 | 0.20 / -1.00 / yes | 0.40 / 0.33 / yes | 0.30 / 1.00 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q20 | inv | 8 | 0.30 / 1.00 / no | 0.60 / 0.33 / no | 0.00 / - / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q21 | pay | 8 | 0.60 / -0.47 / yes | 0.70 / 0.52 / yes | 0.50 / -0.80 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q22 | SKU-4711 v2 | 8 | 0.40 / 1.00 / no | 0.50 / 1.00 / no | 0.30 / 0.33 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q23 | Quartalsbericht | 5 | 0.40 / 0.33 / yes | 0.50 / 0.60 / no | 0.20 / -1.00 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q24 | refund for invoice 4711 approved by the ledger team | 5 | 0.70 / 0.24 / yes | 0.80 / 0.64 / yes | 0.40 / 1.00 / no | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q25 | Übergabe Mitarbeiter München | 8 | 0.40 / 0.67 / no | 0.70 / 0.33 / yes | 0.40 / -0.67 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q26 | zzqx wvvk | 5,6 | 0.50 / -0.20 / yes | 0.50 / -0.20 / yes | 0.00 / - / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q27 | ?! | 5,6 | 0.60 / 0.33 / yes | 0.60 / 0.33 / yes | 0.00 / - / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q28 | refund invoice ledger | 5 | 0.50 / 0.60 / yes | 0.90 / 0.39 / yes | 0.50 / -0.40 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q29 | parcel warehouse delivery | 7 | 1.00 / 0.51 / no | 1.00 / 0.60 / no | 1.00 / 0.16 / yes | 1.00 / 1.00 / no | 1.00 / 1.00 / no |
| q30 | refund invoice | 7 | 0.90 / 0.11 / yes | 1.00 / 0.64 / yes | 0.80 / 0.14 / yes | 1.00 / 0.87 / no | 0.90 / 1.00 / no |

The top-10 lists themselves (before and after, every backend, identity, mode and query) are in `FX-RANK-0.json`
and `PG-CURRENT.json` (one line per hit, so a diff shows each change), and as `before`/`after` per query in the
metrics artifact.

## 2. A against B after B3 (plan 10.6)

- **pg-a against pg-b:** all 30 queries x 4 modes x 2 identities meet 10.6 (same top-k in the same order where
  adjacent scores differ by more than 1e-6 relative, scores within 1e-5, ties by chunk id ascending in both paths):
  0 violations, on the recorded results (`test_postgres_with_and_without_pgvector_rank_alike`) and live on a pgvector
  server (`test_both_paths_rank_alike_on_the_test_server`, both paths measured in fresh schemas). Before B3 the two
  paths differed for `raw` vectors (dot product against cosine), for zero vectors and in rounding.
- **SQLite against PG, vector only (10.6 row 2):** 0 violations for pg-a and pg-b, both identities (analysis run for
  this report; not a CI test in the runtime).
- **SQLite against PG, full text/hybrid (row 3):** value ranges only by the plan; both meet the contract scores
  (full text `1 / (60 + rank)`, hybrid in [0, 1]); orkexa's conformance suite checks the expected documents per case.

## 3. Impact on user data

- **U1-U5, U8** (`tests/test_upgrade_scenarios.py`, run locally on both servers, as superuser and with the restricted
  runtime role, Python 3.13 and 3.11): all green (Python 3.13 and 3.11, superuser and restricted role; U2 and U4 run only on pg-b).
  - U1: FX-PG-0 restored; start (`require_current_schema`) and all work in tenant-a (searches in every mode, write,
    delete, resuming the fixture's cancelled reindex to `fx-embed-b`) without a single DDL command (event trigger);
    all legacy files found in both tenants; tenant-b byte-identical (md5 per table). An operator's `migrate()` finds
    nothing to apply; its only DDL event is the runner's own `CREATE TABLE IF NOT EXISTS` (a no-op).
  - U2: FX-PG-0v: the same with pgvector; tenant-b's legacy space ranks alike in both paths (order equal, scores
    within 1e-5).
  - U3: the runtime's PostgreSQL tables before MP-B1/B3 (vendored unchanged, on the current storage layer) search,
    write and delete on the data the new state wrote, and the new state reads what the old one wrote. Limitation:
    this is the old `postgres_tables.py`, not a whole old installation (no other source file differs in B3).
  - U4: pgvector created by the operator under a running index: `pgvector_status` says `active`, the index keeps
    ranking in the runtime until `refresh()`, then uses pgvector with the same order and scores. `verify_schema`
    named in the plan comes with MP-B5; `pgvector_status` is the check that exists today.
  - U5: the zero vector of each tenant and a NaN vector added by SQL are left out of every vector and hybrid search,
    counted (`excluded` 2 in tenant-a, 1 in tenant-b; `legacy` true), and stay stored unchanged.
  - U8: a reindex killed with SIGKILL after its first batch: after a new start the old space is `active`, the new
    one `building` with its 2 vectors, searches work, tenant-b byte-identical.
- **Excluded vectors:** FX-PG-0 and FX-PG-0v hold one zero vector per tenant (2 per dump), FX-RANK-0 one per identity;
  no NaN or infinity in any fixture (a NaN was added by SQL for U5). Real installations: unknown; every PostgreSQL
  installation can read the count from `vector_status().excluded` after the update.
- **Score thresholds:** checked before the change in nodestro-runtime (`757ab00`), nodestro-api (`7e1477e`),
  nodestro-studio (`ee3f378`) and nodestro-examples (`23fcb85`), origin/master each: no stored knowledge-search
  score threshold in workflows, agents or settings. Scores are only shown (Studio knowledge page, 2 decimals) and
  passed through (API `SearchHit`). `judge_min_score` and reconciliation thresholds are unrelated scores. One API
  test asserts `ranks == {"fts": 1}` for a plain index, which still holds. Displayed full-text scores change from
  `ts_rank` values to `1 / (60 + rank)` (about 0.016 for the best hit).

## 4. Regression evidence

- Local (worker b3): full suite 3.13 on postgres:17: 2905 passed, 74 skipped; PostgreSQL test files on pg-a and pg-b, Python 3.13 and 3.11, superuser and restricted role: green (one T-PART-CC test flaw found and fixed, see the hand-back); skip lists as expected except 9 local-only Docker skips.
- nodestro-api suite against this runtime (throwaway clone of `origin/master` `3aa51fa`, runtime installed editable
  over it): 1367 passed, 2 failed (the API error catalog needs `agent.VectorError`; a pin check that expects the runtime from git), 3 skipped. One real incompatibility found and fixed in the runtime: models without `refresh_identity`.
- CI on the merge commits: orkexa `b3d6fae` (orkexa #63) [CI](https://github.com/peterkarlhuber/orkexa/actions/runs/42336522593) and [Platforms](https://github.com/peterkarlhuber/orkexa/actions/runs/42336522626); nodestro-runtime `099f4d4` (runtime #131, after #130 `59a2629` and #132 `fad507c`) [CI](https://github.com/peterkarlhuber/nodestro-runtime/actions/runs/42346278039) with `test`, `pg-a` and `pg-b` on Python 3.11/3.13/3.14 (each with the restricted-role step, the plan's `pg-a-restricted` and `pg-b-restricted`), `tenant-sql-api`, `docker`, `builtin-sandbox`, all green, and [Platforms](https://github.com/peterkarlhuber/nodestro-runtime/actions/runs/42346278015). The `t-rank-2-metrics.json` artifacts of that run (`pg-a-reports-3.13`, `pg-b-reports-3.13`) match section 1 for all 16 PostgreSQL rows (checked by script).
- Pin cascade of these changes: nodestro-examples #83 `b8998b2`, nodestro-integrations #71 `31b4f8a`, nodestro-api #104 `2685925` (new codes `agent.VectorError`, `run.agent.VectorError`), nodestro-sdk #96 `2d866d2` (no contract change), nodestro-studio #148 (pins and texts for `run.agent.VectorError`).
- Follow-up after the merge: T-PART-CC failed twice on runtime #133 under CI load (the switch embedded at most one batch). Fixed in nodestro-runtime #134 (the switch embeds up to 256 chunks while writes wait), with a test that fails on the old code; see section 5.

## 5. Open risks

| Risk | Class | Note |
|---|---|---|
| Ranking change for `raw` (not normalized) vectors without pgvector | medium, intended | Any installation without pgvector whose model returns vectors that are not normalized gets a different (now pgvector-equal) order. `CallableEmbeddings` defaults to `normalized=False`; whether a model's vectors are normalized is not checked here. |
| 7.3 Overlap limits are not met | gate | Median >= 0.7 fails for `default` (all), pg-a `raw` vector (0.50) and hybrid (0.65); q11 is below 0.4 in vector and pg-b hybrid. Every case traces to drifts 3, 4, 6; listed in `KNOWN_BELOW_LIMITS`. An automatic G1 per 7.3 is therefore not possible: a person decides. |
| Full-text score values change | low | Shown scores fall to about 0.016; no thresholds stored (section 3). |
| `query.too_long` and `VectorError` reach the API | low | Queries over 1000 characters or 64 distinct words get 422 `agent.RetrievalError`; the API's global search allows 200 characters, so only many short words can hit the word limit. Studio needs a translation for `run.agent.VectorError`. |
| Writes racing a reindex switch | low (fixed in B3) | CI found reindex starvation (T-PART-CC: steady writers made every switch attempt fail `vector_incomplete`, and the knowledge job then reported `done`). Fix in nodestro-runtime #131: at most five unlocked rounds bounded by a high-water mark, then a switch transaction that locks the namespace's space rows, embeds what the last round left while writes wait (one batch in #131, up to 256 chunks since #134) and switches; `add_chunks` takes the same rows `FOR SHARE`. A knowledge job now fails after the third `vector_incomplete`. New test `test_a_reindex_finishes_while_writers_keep_adding`; T-PART-CC green 6/6 locally and in CI. If writers outpace the model by more than 256 chunks per round, the reindex still fails with `vector_incomplete` (bounded, retried by the caller). |
| pgvector detected once per process | low | `refresh()` exists; the API does not call it yet, so a process restart is needed after `CREATE EXTENSION vector`. `nodestro-server check` warns with `pgvector_status` (api #102) and the server RUNBOOK names the commands; RT-048 closed. |
| Temporary orkexa pin | resolved | Replaced by the merged orkexa commit `b3d6fae` (orkexa #63) before merge. |

## 6. Readiness for B4-B6

- A11 is merged on runtime master (#123, tenant SQL checker in CI); this branch keeps the checker green with no new
  allowlist entry.
- Parity test prepared: not part of B3 (T-PAR-2 is B4).
- No open P1/P2 finding known in `postgres_tables.py`, `tests/postgres_support.py` or the CI workflow from this work.

## 7. Recommendation

Continue, with a person's decision on the 7.3 Overlap limits: every deviation is a documented, intended drift fix,
A and B are equivalent on all 30 queries, SQLite and PostgreSQL rank vectors alike, and the legacy data upgrade and
roll back cleanly.

## Permitted deviations

- Drift 8: the query side uses orkexa's `query_words` (`\w` runs, lower case) but keeps folding diacritics, because
  the stored search column (migration 0002, unchanged) has them folded; without folding "Café" would no longer find
  "cafe" (plan MP-B3 item 8 allows this).
- Drift 10: `VectorStatus` (orkexa) has no field for a count, so Nodestro returns the subclass
  `PostgresVectorStatus` with `excluded`; `legacy` means "this space holds vectors searches leave out", not
  SQLite's "`embedder=` vectors". Suggested orkexa change: an `excluded: int = 0` field on `VectorStatus`.
- U4 uses `pgvector_status` instead of `verify_schema` (MP-B5).
- T-RANK-2 does not hard-assert the 7.3 limits (they fail by design, section 5); it asserts that the places below
  them are exactly the listed ones, each with its drift.

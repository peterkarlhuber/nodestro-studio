# ADR-0011: Full-text search semantics (addendum to ADR-0002)

- Status: Accepted (2026-11-07). Records MUP-ONA decision O10 (confirmed at gate G0 on 2026-11-06 22:04Z) and the
  full-text behavior that MUP-ONA B3 and B6 put in place. [ADR-0002](0002-storage-backends.md) itself is not changed;
  this record amends its point 5 for the query side and the ranking of full-text search.
- Repositories: orkexa (`orkexa.retrieval.tokenize`, `fold`, `query_words`; `orkexa.backends.postgres` since orkexa
  792a041), nodestro-runtime (MP-B3 at 099f4d4, MP-B6 at 81b0f55), nodestro-studio (this record).
- Related: orkexa ADR-0014 (storage contracts and conformance, MUP-ONA O1); MUP-ONA MP-B3, MP-B6, O7, O10;
  report [G1-ranking.md](../architecture/mup-ona/reports/G1-ranking.md).

## Context

ADR-0002 point 5 describes PostgreSQL full-text search as a `tsvector` with the `simple` configuration plus
`unaccent`, queried with `websearch_to_tsquery` or a prefix `to_tsquery`. Before MUP-ONA, SQLite and PostgreSQL
tokenized queries differently (`\w+` in Orkexa, `[^\W_]+` with diacritic folding in Nodestro), so the same query could
find different chunks on the two backends (MUP-ONA documentation drift D6). MUP-ONA O1 moved the query rules into
Orkexa's shared contract, and B3 aligned Nodestro's PostgreSQL search with it.

## Decision

1. **Query words.** A query is split by Orkexa's `query_words`: runs of word characters (`\w`, any script, including
   the underscore) in lower case, each word once. FTS syntax in the query (quotes, `NEAR(…)`, `column:`) never reaches
   the engine as an operator; `websearch_to_tsquery` is not used. A query has at most 1000 characters and 64 distinct
   words; more is refused with `query.too_long`.
2. **Matching.** Each query word is a prefix (`refund` finds `refunds`), and a chunk matches when any query word
   matches. A word with an underscore matches its parts in sequence (`omega_psi` finds `omega psi`, not `omega` or
   `psi` alone). A word without letters or digits matches nothing.
3. **Diacritics.** Search is diacritic-insensitive on both backends: SQLite's `unicode61 remove_diacritics 2`
   tokenizer folds documents and queries, and PostgreSQL's search column holds the folded words, so the query side
   folds them too (`Café` finds `cafe`; G1 report, permitted drift 8).
4. **Ranking.** PostgreSQL orders full-text hits by `ts_rank(search, query, 1)`, ties by chunk id; scores follow
   Orkexa's contract (orkexa ADR-0014). The ranking change from B3 was measured on FX-RANK-0 and accepted at gate G1
   (O7, 2026-11-07 09:06Z).
5. **Contract test.** As in ADR-0002 point 7, the shared tests assert top-k membership and the tenant and namespace
   filters, not the exact order across backends.

## Consequences

- SQLite and PostgreSQL find the same chunks for the same query; their order may still differ (`bm25` and `ts_rank`).
- ADR-0002's `websearch_to_tsquery` alternative is no longer used; the rest of ADR-0002 point 5 stands.
- A change to tokenization, folding or ranking is a change to Orkexa's contract and needs a new record.

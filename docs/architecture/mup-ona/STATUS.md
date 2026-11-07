# MUP-ONA execution state

This file is the single central status of the MUP-ONA plan (packages, gates, approvals, evidence; plan 8.2). Open work
per repository lives in each repository's `docs/TODO.md` (plan 8.4). A package is `accepted` only with all four pieces
of evidence of plan 8.3 on the current default branch.

## Header

| Field | Value |
|---|---|
| Plan version | MUP-ONA 1.1; binding version is the English [MUP-ONA.md](MUP-ONA.md) (approved 2026-11-06 22:23Z, plan 8.7); the German file is a historical reference |
| Last start procedure (S1–S10) | 2026-11-06 22:10Z |
| Active gate | none. G3 decided 2026-11-07 18:36Z: option (a), stay with M10, no RLS ([ADR-0010](../../adr/0010-nodestro-rls.md)). Optional B7/B8 only after a separate G4 |
| Lead agent / pin owner | MUP-ONA lead agent (project thread "Implement MUP-ONA architecture plan"); the TODO-abatement thread finished its pin work on 2026-11-07, so the slot is the lead agent's |

### Default-branch SHAs at the start procedure (S2)

| Repository | Planning SHA | `origin/master` 2026-11-06 22:10Z | Note |
|---|---|---|---|
| orkexa | `80b95e5` | `80b95e5` | unchanged |
| nodestro-runtime | `802fa8f` | `802fa8f` | unchanged |
| nodestro-api | `984c61d` | `984c61d` | unchanged |
| nodestro-studio | `39fb164` | `5c0fbd8` | TODO abatement round 2 (studio #140) |
| nodestro-server | `ddd095f` | `ddd095f` | unchanged |
| nodestro-local-docker | `8420a02` | `8420a02` | unchanged |
| nodestro-desktop | `5d1e8e9` | `429d8ba` | pin PRs of the TODO abatement |
| nodestro-sdk | `9327e2c` | `9327e2c` | unchanged |
| nodestro-integrations | `306319f` | `306319f` | unchanged |
| nodestro-examples | `2f05f4c` | `acac023` | TODO abatement (examples #78) |
| nodestro-cloud | `c1b6dd2` | `c1b6dd2` | not changed by this plan |
| axentra | `067529b` | `067529b` | unchanged |
| axentra-studio | `7a6d1ce` | `7a6d1ce` | unchanged |

### Approvals (plan 8.2: valid only with the client's own message, quoted verbatim)

| Approval | Date | Source (verbatim, German original) |
|---|---|---|
| G0 start approval, decision matrix as recommended | 2026-11-06 22:04Z | Peter, project thread "Implement MUP-ONA architecture plan": „**Gate G0 (Startfreigabe):** Ich bestätige die Entscheidungsmatrix in Kapitel 6 wie empfohlen." |
| Merge right (plan 9.5) | 2026-11-06 22:04Z | same message: „**Merge-Recht:** Ja, du darfst PRs nach bestandenen Prüfungen gemäß Kapitel 9.5 selbst mit Merge-Commit zusammenführen." |
| Automatic continuation after B3 (plan 7.3) | 2026-11-06 22:04Z | same message: „**Automatische Fortsetzung nach B3 (Kapitel 7.3):** Erteilt unter den Bedingungen von Kapitel 7.3. Arbeite bei Erfüllung aller objektiven Abnahmekriterien ohne weitere Rückfrage vollständig bis zum technischen Gesamtabschluss weiter, einschließlich der automatischen Freigabe von G1 und G2 gemäß Masterplan." |
| Overall order | 2026-11-06 22:04Z | same message: „Setze den Master-Umsetzungsplan `architektur-umsetzungsplan-orkexa-nodestro-axentra.md` (MUP-ONA, Version 1.1) vollständig um. […] Keine produktiven Releases, Deployments, Paketveröffentlichungen oder Aktivierungen produktiver Schalter ohne gesonderte Freigabe." |
| G1 approval, O7 accepted (plan 7.2–7.4) | 2026-11-07 09:06Z | Peter, decision card in the same project thread, question „G1 freigeben und Ranking-Änderung durch B3 (O7) annehmen?", chosen option „Freigeben, O7 annehmen" (reference: [reports/G1-ranking.md](reports/G1-ranking.md)) |
| G2 approval (plan 7.1, 7.3) | 2026-11-07 14:02Z | Peter, decision card in the same project thread, question „G2 freigeben: runtime #140 (B6) mergen und Kaskade ausführen?", chosen option „Freigeben" (merge runtime #140, run the cascade, prove the real image, desktop and local-docker builds on merge commits; on failure fix forward or roll back per 9.8; reference: [reports/G2-integration.md](reports/G2-integration.md)) |
| G3 decision (plan 7.1, MP-A9) | 2026-11-07 18:36Z | Peter, decision card in the same project thread, question „G3 entscheiden: Soll Nodestro RLS für seine PostgreSQL-Tabellen einführen?", chosen option „(a) Bei M10 bleiben, kein RLS" (reference: [reports/A9-rls-evaluation.md](reports/A9-rls-evaluation.md), [ADR-0010](../../adr/0010-nodestro-rls.md)) |
| English version binding (plan 8.7 step 4) | 2026-11-06 22:23Z | Peter, decision card in the same project thread, question „Englische Planfassung MUP-ONA.md als maßgeblich freigeben (Kapitel 8.7)?", chosen option „Freigeben" (reference: [reports/translation-check.md](reports/translation-check.md), nodestro-studio #141) |

Decision matrix as confirmed at G0 (recommended choices): O1, O2, O3 (tags prepared locally only), O4, O5, O6 (30 s,
2000 pages, 5,000,000 characters, 512 MiB on Linux), O8 (`pgvector/pgvector:pg17@sha256:7d0a41464797aeb9862dfdc0bbf1526b82cfd324cdd8036df19e3545f4a9ccb8`),
O10, O11 (reject symlink paths with `storage.symlink`), O12, O13. O7 accepted at G1 (2026-11-07 09:06Z: the B3 ranking
change stands); O9 after B6 (G3).

## Packages

State 2026-11-07 17:00Z. "merged" means merged on the default branch with green PR CI; a package becomes
`accepted` only with all four pieces of evidence of plan 8.3 (including the pin cascade where the plan requires it).

| ID | Status | Branches / PRs | Merge SHAs | CI run of merge commit | Test evidence | Open risks | Next step |
|---|---|---|---|---|---|---|---|
| MP-A0 | merged | studio #141, orkexa #57, api #95, axentra #51, runtime #122 | studio 422ec43, orkexa 2da5c6c, api 87de853, axentra 683c695, runtime 1e9f7b2 | – | skip expectations per CI job (T-SKIP-1), FX-SQ-0, FX-PG-0/0v, FX-RANK-0 (T-FX-1, T-RANK-0) | – | record merge-commit CI runs |
| MP-A10 | merged, cascaded | orkexa #58 | a840c39 | – | T-SQL-1 (strict xfail removed), robustness tests | – | – |
| MP-A1 | merged, cascaded | orkexa #59; runtime #127; api #103 (includes #102); cascade examples #82, integrations #70, sdk #95, studio #147; server/desktop/local-docker re-pinned by the TODO thread (server #66, desktop #53, local-docker #44) | orkexa f89102c, runtime de56875, api 63af1df, examples cda07c4, integrations cb90fe5, sdk 4596be3, studio 27f8bd4, server 5b0bdab, desktop 5d1f35a, local-docker 8969012 | – | T-PDF-1..7, T-PDF-11..14 on Linux, macOS, Windows (orkexa platforms.yml); T-PDF-8/9 runtime; T-PDF-10 api; studio texts `document.too_complex`, `document.limits_invalid` in six languages; server RUNBOOK rows (server #68, a5f3af3) | Windows on Arm adds `PROCESSOR_ARCHITECTURE` to every child process (T-PDF-11 accepts it) | – |
| MP-A11 | merged | runtime #123, api #97 | runtime 757ab00, api bec28d2 | – | rule 3: api tenant-sql green with runtime pinned to the checker commit 7d49fbe ([job](https://github.com/peterkarlhuber/nodestro-api/actions/runs/42315728491/job/128227719182)); temporary pins reverted before merge | proposal: make tenant-sql a required check (needs approval) | – |
| MP-A2 | merged, cascaded | api #98 | 20bebca | – | T-API-ERR-1..5; SDK `make contract` clean, SDK pytest 122 + vitest 89, studio e2e api suite 41 ok against api 77ef8fb | – | – |
| MP-A3 | merged, cascaded | api #98, server #63 | api 20bebca, server 035170d | – | T-API-PROXY-1..3, server `test_runbook_proxy.py` | – | – |
| MP-A4 | merged | axentra #52 | 6f73952 | – | T-AX-NET-2 (run 42311515300, Python 3.11/3.12/3.13) | – | – |
| MP-A5 | merged, cascaded | api #98 | 20bebca | – | T-API-ROUTE-1/2 | – | – |
| MP-A6 | merged | axentra #52, server #63 | axentra 6f73952, server 035170d | – | axentra role tests | – | – |
| MP-A7 | merged | runtime #124, axentra #53, axentra-studio #37 | runtime dfc0d0f, axentra 659f7b5, axentra-studio 4f4b762 | – | VB-1..VB-6 tests | axentra-studio CI has no docker build job: the full image build is unverified | – |
| MP-A8 | merged, cascaded | api #101, runtime #129, axentra #57; Axentra pin runtime #135 | api 1f99df7, runtime 685fb4b, axentra 60d83b3, runtime e789c8a (#135) | – | shared security vectors (VB-7) in runtime and Axentra, `security-vectors-sync` job; launcher-key test fixed to parse tokens (`parse_token`) | – (runtime #135 pins Axentra 60d83b3 with full CI; cascaded through studio #149) | – |
| MP-A9 | paper delivered; G3 decided: (a) no RLS | prototype branch runtime `mup/a9-rls-prototype` (`ef5fab1`, not merged, no PR); studio #159 (report, ADR-0010 draft) | – | – | [A9 report](reports/A9-rls-evaluation.md): T-RLS-P1 20/20 on FX-PG-0 and FX-PG-0v, T-RLS-P2 benchmark with raw data in the prototype branch; [ADR-0010](../../adr/0010-nodestro-rls.md) (Accepted, option (a)) | recommendation (a) stay with M10; under RLS the GIN full-text index is not used (`@@` is not leakproof) | – (the prototype branch stays unmerged as the documented path to option (b)) |
| MP-B0 | merged, cascaded | orkexa #61, axentra #54, runtime #127, api #103 | orkexa 59ea671, axentra 273e675, runtime de56875, api 63af1df | – | T-API-1 snapshot, T-PKG-0 import-linter; release.yml reviewed (publishes only on `release: published` with a protected environment); no tags | – | – |
| MP-B1 | merged, cascaded | orkexa #62 (contracts), #63 (suite); runtime #130 | orkexa 59f69b1, b3d6fae; runtime 59a2629 | – | T-CONF-1..8, T-SQL-10; runtime conformance jobs green | – | – |
| MP-B2 | merged, cascaded | orkexa #64; runtime pin #136; cascade examples #84, integrations #72, api #105, sdk #97, studio #149, server #68, desktop #55, local-docker #45 | orkexa 028faa1, runtime d9c3d6e | – | T-API-1/2, T-PKG-0 (third import contract), T-SQL-11 (private attributes), conformance against the new leaf modules; offline suite on Linux, macOS, Windows incl. windows-11-arm | the SQLite classes' private attributes are an implicit API for Nodestro (runtime RT-069, P4) | – |
| MP-B3 | merged, cascaded; G1 approved | runtime #131 (+ #132 gateway fix found by its CI, + #134 reindex switch fix after the merge) | runtime 099f4d4 (#131), fad507c (#132), 1cbb9cc (#134) | [CI](https://github.com/peterkarlhuber/nodestro-runtime/actions/runs/42346278039) (test, pg-a, pg-b on 3.11/3.13/3.14 with restricted role, tenant-sql-api, docker, builtin-sandbox) | [G1 report](reports/G1-ranking.md); T-RANK-1/2, T-PART-CC, U1-U5, U8; cascade examples #83, integrations #71, api #104, sdk #96, studio #148 | 7.3 Overlap limits not met by design (drifts 3, 4, 6); accepted by Peter with O7 | – |
| MP-B4 | merged, cascaded | runtime #137, #138, #139 (api probe #106, never merged); cascade examples #85/#87, integrations #73/#75, api #107/#108, sdk #99/#101, studio #153, server #70, desktop #57, local-docker #47 | runtime 2ef5b3b, 76f9cb2, df4aeb3; local-docker 8e2f7f4 (#47, with server c488f1d from server #71) | – | T-SQL-RULES, T-CAT-1..4, T-GUARD-1..3, T-PAR-1/2 (`sql_parity_before.json`, 46 statements); api tenant-sql against the engine branch (#106) | – | – |
| MP-B5 | merged, cascaded (with B6) | orkexa #65 (`orkexa.testing.sqlcheck`), #66 (`orkexa.backends.postgres`, schema v1, `verify_schema`) | orkexa 49bcc6d, 792a041 | – | T-SQLCHECK; T-CONF (PG), T-PART, T-DDL, T-SCH, T-PG in pg-a/pg-b (3.11/3.14, superuser and restricted role); core-no-extras (T-PKG-1/2) | – | – |
| MP-B6 | merged, cascaded; G2 approved | runtime #140; api #109; preparation api #111; tenant-sql probe api #110 (closed unmerged); cascade examples #89, integrations #77, sdk #104, studio #157, server #74 (pin + RUNBOOK `storage.schema_mismatch`), desktop #60, local-docker #50 | runtime 81b0f55, api 05e0232, examples e063e89, integrations e1e0cd4, sdk ee38fb0, studio c41e3c2, server 89fa4af, desktop f9e788a, local-docker 7b4c8b6 | PR CI on the cascade heads, all green without re-runs: server [e2e, e2e-arm64 with image scan](https://github.com/peterkarlhuber/nodestro-server/actions/runs/42390826330) and [upgrade](https://github.com/peterkarlhuber/nodestro-server/actions/runs/42390826347); desktop [app, Linux systems, macOS test builds](https://github.com/peterkarlhuber/nodestro-desktop/actions/runs/42390830890); local-docker [image amd64/arm64 with e2e and scan, rootless, Windows launcher](https://github.com/peterkarlhuber/nodestro-local-docker/actions/runs/42392191493); studio #157 all 25 jobs incl. WebKit | [G2 report](reports/G2-integration.md): U1–U8, T-PAR-3, T-CAT-5, T-PKG-3, T-SMOKE-1 (override build 38/38 FX-PG-0 and FX-PG-0v), studio E2E; after the merge the faithful builds above (G2 report section 4) | – | – |
| MP-B7 | not started (G4) | – | – | – | – | – | needs separate approval |
| MP-B8 | not started (G4) | – | – | – | – | – | needs separate approval |

## Pin state

| Consumer | Pins | State | Reachability check (plan 9.3) |
|---|---|---|---|
| nodestro-runtime | orkexa `792a041`, axentra `60d83b3` | master `81b0f55` (#140; later CI-only commits by CI-FAST) | merge commits on `master` |
| nodestro-examples, nodestro-integrations | runtime `81b0f55` | examples `e063e89`, integrations `e1e0cd4` | merge commits on `master` |
| nodestro-api | runtime `81b0f55`, orkexa `792a041`, examples `e063e89` | master `05e0232` (#109) | merge commits on `master` |
| nodestro-sdk | api `05e0232` | master `ee38fb0` | merge commit on `master` |
| nodestro-studio | api, runtime, examples, integrations, sdk as above; `platform/versions.json` also checks orkexa's version (0.2.0.dev0) | master `c41e3c2` (studio #157) | `scripts/check_versions.py`: pins agree |
| nodestro-server, nodestro-desktop | studio `c41e3c2` | server `89fa4af` (#74), desktop `f9e788a` (#60) | merge commits on `master` |
| nodestro-local-docker | studio `c41e3c2`, server `89fa4af` | master `7b4c8b6` (#50) | merge commit on `master` |

Who bumps pins now: the MUP-ONA lead agent (the TODO-abatement thread finished its pin work on 2026-11-07).

## Rollback needs

None.

## Deviations from the plan

| # | Deviation | Reason |
|---|---|---|
| 1 | Skip expectations live in `tests/ci/skipped-<job>.txt` (MP-A0 field 5) rather than `tests/skip-expectations/<job>.txt` (10.8) | the plan names both; MP-A0 is the more specific instruction; one name in every repository |
| 2 | The German plan source is not versioned in this repository | repository content is English-only (plan 9.1); `reports/translation-check.md` identifies the German source by SHA-256 and the check script is `scripts/mup_translation_check.py` |
| 3 | FX-PG-0 contains a zero vector and, where the runtime accepts it, a vector with NaN (5.2 says "NaN-free") | U5 and the G1 report (7.2) count excluded NaN and zero vectors; see `reports/translation-check.md` |
| 4 | Runtime CI: 19 `tests.test_builtin_sandbox` entries in `tests/ci/skipped-test.txt` | the `ubuntu-latest` runner is Ubuntu 26.04, where the built-in sandbox reports `untested-system`; the dedicated builtin-sandbox jobs run on ubuntu-24.04 and cover these tests (runtime #122) |
| 5 | Runtime #125 (not a plan package): strict-mode budget tests freeze the pricing clock | runtime master turned red on 2026-11-07 00:00Z because the built-in prices (checked 2026-10-31) became older than `critical_after` (7 days); fixed before A11/A7 could merge |
| 6 | A11 rule 3 needed a temporary nodestro-examples branch (`mup/tmp-a11-integration`) in addition to the temporary runtime pin | the api installs examples, which pin their own runtime; both temporary pins were reverted before api #97 merged, the examples branch is never merged |
| 7 | B1 ADR lives in `docs/architecture/decisions/0014-…` in orkexa instead of `docs/adr/` | the repository's existing ADR location (0001–0013) |
| 8 | B1 item (h): `_pdf_pages` stays an alias without `DeprecationWarning` for now | release rules O3/B0: the warning arrives with the next minor version |
| 9 | B1 split into two orkexa PRs (contracts, suite) | about 4,270 changed lines, above the plan's 2,500-line threshold (PR split rule of MP-B1) |
| 10 | Runtime #132 (not a plan package): sandbox gateway keeps each connection task alive | B1/B3 CI's `docker` job failed with installed modules reported missing; asyncio holds tasks weakly, so a garbage collection could drop an attached stream's output; fixed before #130/#131 merged |
| 11 | B3 reindex switch changed twice after review: bounded unlocked rounds plus a locked switch (#131), then up to 256 chunks at the switch (#134) | T-PART-CC exposed reindex starvation under steady writes (every switch failed `vector_incomplete`, and the knowledge job reported `done`); the first fix still failed under CI load on runtime #133 |
| 12 | B3 drift 10 returns `PostgresVectorStatus` (subclass) with `excluded` | orkexa's `VectorStatus` has no count field; suggested orkexa follow-up: `excluded: int = 0` on `VectorStatus` |
| 13 | B3 U4 uses `pgvector_status` instead of `verify_schema` | `verify_schema` comes with MP-B5 |
| 14 | B2 commit 1 (move) was not green on its own; only the PR head is | the move and the import-contract update depend on each other; the PR was reviewed and merged as one unit with a merge commit |
| 15 | B2 import-linter contract ignores the three lazy re-export edges (`orkexa.retrieval -> orkexa.backends.sqlite.*`) | grimp also counts imports inside `__getattr__` and under `TYPE_CHECKING`; an AST test (T-API-2) checks that they appear only there |
| 16 | The test ID T-SQL-11 has two meanings in the plan (10.2 "transaction errors", MP-B2 "private attributes") | B2 follows MP-B2; a later plan revision should rename one of them |
| 17 | runtime #139 (not a plan package): the B4 SQL rendering tests `importorskip("psycopg")` | the studio desktop-profile `components` job runs the runtime suite without psycopg; studio #153 was red until then |
| 18 | api #109 cannot be green before the B6 merge; the B6 checker ran through the temporary probe api #110 | api installs examples, which pin the previous runtime; the resolver refuses two runtime URLs (same cause as deviation 6) |
| 19 | T-SMOKE-1 before G2 used the server image's override wheels instead of a pushed studio pin; the local-docker e2e suite ran as a reduced substitute | the faithful builds need the cascade, which needs the merge; the agent host had too little disk for the Ollama image (G2 report 3.6) |

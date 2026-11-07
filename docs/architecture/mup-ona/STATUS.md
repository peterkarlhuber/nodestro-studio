# MUP-ONA execution state

This file is the single central status of the MUP-ONA plan (packages, gates, approvals, evidence; plan 8.2). Open work
per repository lives in each repository's `docs/TODO.md` (plan 8.4). A package is `accepted` only with all four pieces
of evidence of plan 8.3 on the current default branch.

## Header

| Field | Value |
|---|---|
| Plan version | MUP-ONA 1.1; binding version is the English [MUP-ONA.md](MUP-ONA.md) (approved 2026-11-06 22:23Z, plan 8.7); the German file is a historical reference |
| Last start procedure (S1–S10) | 2026-11-06 22:10Z |
| Active gate | none (G0 granted; next hold point G1 after B3, auto-continuation granted under plan 7.3) |
| Lead agent / pin owner | MUP-ONA lead agent (project thread "Implement MUP-ONA architecture plan"); pin slot alternates with the TODO-abatement thread (see Pin state) |

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
| English version binding (plan 8.7 step 4) | 2026-11-06 22:23Z | Peter, decision card in the same project thread, question „Englische Planfassung MUP-ONA.md als maßgeblich freigeben (Kapitel 8.7)?", chosen option „Freigeben" (reference: [reports/translation-check.md](reports/translation-check.md), nodestro-studio #141) |

Decision matrix as confirmed at G0 (recommended choices): O1, O2, O3 (tags prepared locally only), O4, O5, O6 (30 s,
2000 pages, 5,000,000 characters, 512 MiB on Linux), O8 (`pgvector/pgvector:pg17@sha256:7d0a41464797aeb9862dfdc0bbf1526b82cfd324cdd8036df19e3545f4a9ccb8`),
O10, O11 (reject symlink paths with `storage.symlink`), O12, O13. O7 is decided at G1; O9 after B6 (G3).

## Packages

State 2026-11-07 02:00Z. "merged" means merged on the default branch with green PR CI; a package becomes
`accepted` only with all four pieces of evidence of plan 8.3 (including the pin cascade where the plan requires it).

| ID | Status | Branches / PRs | Merge SHAs | CI run of merge commit | Test evidence | Open risks | Next step |
|---|---|---|---|---|---|---|---|
| MP-A0 | merged | studio #141, orkexa #57, api #95, axentra #51, runtime #122 | studio 422ec43, orkexa 2da5c6c, api 87de853, axentra 683c695, runtime 1e9f7b2 | – | skip expectations per CI job (T-SKIP-1), FX-SQ-0, FX-PG-0/0v, FX-RANK-0 (T-FX-1, T-RANK-0) | – | record merge-commit CI runs |
| MP-A10 | merged | orkexa #58 | a840c39 | – | T-SQL-1 (strict xfail removed), robustness tests | – | consumed by the runtime pin (runtime #127) |
| MP-A1 | in progress | orkexa #59 (merged); runtime #127 (incl. orkexa pin f89102c); api `mup/a1-pdf` (local, waits for the runtime pin); server `mup/a1-runbook` (local) | orkexa f89102c | – | T-PDF-1..7, T-PDF-11..14 on Linux, macOS, Windows (orkexa platforms.yml); T-PDF-8/9 runtime, T-PDF-10 api (local) | Windows on Arm adds `PROCESSOR_ARCHITECTURE` to every child process (T-PDF-11 accepts it) | runtime #127 after the pin slot returns, then api and server |
| MP-A11 | merged | runtime #123, api #97 | runtime 757ab00, api bec28d2 | – | rule 3: api tenant-sql green with runtime pinned to the checker commit 7d49fbe ([job](https://github.com/peterkarlhuber/nodestro-api/actions/runs/42315728491/job/128227719182)); temporary pins reverted before merge | proposal: make tenant-sql a required check (needs approval) | – |
| MP-A2 | merged | api #98 | 20bebca | – | T-API-ERR-1..5; SDK `make contract` clean, SDK pytest 122 + vitest 89, studio e2e api suite 41 ok against api 77ef8fb | – | studio pin (cascade) |
| MP-A3 | merged | api #98, server #63 | api 20bebca, server 035170d | – | T-API-PROXY-1..3, server `test_runbook_proxy.py` | – | studio pin (cascade) |
| MP-A4 | merged | axentra #52 | 6f73952 | – | T-AX-NET-2 (run 42311515300, Python 3.11/3.12/3.13) | – | runtime Axentra pin (runtime #127) |
| MP-A5 | merged | api #98 | 20bebca | – | T-API-ROUTE-1/2 | – | studio pin (cascade) |
| MP-A6 | merged | axentra #52, server #63 | axentra 6f73952, server 035170d | – | axentra role tests | – | runtime Axentra pin (runtime #127) |
| MP-A7 | merged | runtime #124, axentra #53, axentra-studio #37 | runtime dfc0d0f, axentra 659f7b5, axentra-studio 4f4b762 | – | VB-1..VB-6 tests | axentra-studio CI has no docker build job: the full image build is unverified | – |
| MP-A8 | in progress | `mup/a8-security-vectors` (runtime, axentra, api; local) | – | – | – | – | PRs |
| MP-A9 | open | – | – | – | – | – | after B6 |
| MP-B0 | in progress | orkexa #61, axentra #54 (merged); runtime #127; api `mup/a1-pdf` (local) | orkexa 59ea671, axentra 273e675 | – | T-API-1 snapshot, T-PKG-0 import-linter; release.yml reviewed (publishes only on `release: published` with a protected environment); no tags | – | runtime #127, api PR |
| MP-B1 | in progress | orkexa #62 (contracts), `mup/b1-suite` (suite, after #62); runtime `mup/b1-conformance` (local) | – | – | T-CONF-1..8, T-SQL-10 (local: 2198 passed) | – | merge #62, open the suite PR |
| MP-B2 | open | – | – | – | – | – | after B1 |
| MP-B3 | in progress | runtime `mup/b3-pg-drift` (local) | – | – | – | – | after B1 |
| MP-B4 | open | – | – | – | – | – | after G1 |
| MP-B5 | open | – | – | – | – | – | after B4 |
| MP-B6 | open | – | – | – | – | – | after B5, G2 |
| MP-B7 | not started (G4) | – | – | – | – | – | needs separate approval |
| MP-B8 | not started (G4) | – | – | – | – | – | needs separate approval |

## Pin state

| Consumer | Pins | State | Reachability check (plan 9.3) |
|---|---|---|---|
| nodestro-runtime | orkexa `1b61fda`, axentra `0a1d1cc` | master; runtime #127 moves them to orkexa `f89102c` and one Axentra commit `273e675` | – |

Who bumps pins now: the TODO-abatement thread (round 4 cascade, runtime 5f8c0f0 onwards); the slot returns to the
MUP-ONA lead agent afterwards (agreed between the threads, 2026-11-07 00:58Z).

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

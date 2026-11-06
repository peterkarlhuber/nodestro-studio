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
| Lead agent / pin owner | MUP-ONA lead agent (project thread "Implement MUP-ONA architecture plan"); pin slot held by the TODO-abatement thread until its round 3 cascade is merged |

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

| ID | Status | Branches / PRs | Merge SHAs | CI run of merge commit | Test evidence | Open risks | Next step |
|---|---|---|---|---|---|---|---|
| MP-A0 | in progress | `mup/a0-baseline` (studio, runtime, orkexa, api, axentra) | – | – | – | – | PRs |
| MP-A10 | in progress | `mup/a10-sqlite-robustness` (orkexa) | – | – | – | – | after A0 |
| MP-A1 | in progress | `mup/a1-pdf` (orkexa; runtime, api, server later) | – | – | – | – | after A10 |
| MP-A11 | in progress | `mup/a11-checker-ci` (runtime, api) | – | – | – | – | after A0 |
| MP-A2 | in progress | `mup/a2-a3-a5-api-hardening` (api) | – | – | – | – | after the TODO-abatement api round 3 merge |
| MP-A3 | in progress | `mup/a2-a3-a5-api-hardening` (api), `mup/a3-proxy` (server) | – | – | – | – | as A2 |
| MP-A4 | in progress | `mup/a4-a6-axentra` (axentra) | – | – | – | – | after A0 |
| MP-A5 | in progress | `mup/a2-a3-a5-api-hardening` (api) | – | – | – | – | as A2 |
| MP-A6 | in progress | `mup/a4-a6-axentra` (axentra), server RUNBOOK | – | – | – | – | after A0 |
| MP-A7 | in progress | `mup/a7-improvements` (runtime, axentra, axentra-studio) | – | – | – | – | after A0 |
| MP-A8 | open | – | – | – | – | – | after A4, A7, A11 |
| MP-A9 | open | – | – | – | – | – | after B6 |
| MP-B0 | in progress | `mup/b0-versioning` (orkexa, axentra), `mup/b0-deps` (runtime, api) | – | – | – | – | after A1 |
| MP-B1 | open | – | – | – | – | – | after A1, A10 |
| MP-B2 | open | – | – | – | – | – | after B1 |
| MP-B3 | open | – | – | – | – | – | after B1 |
| MP-B4 | open | – | – | – | – | – | after G1 |
| MP-B5 | open | – | – | – | – | – | after B4 |
| MP-B6 | open | – | – | – | – | – | after B5, G2 |
| MP-B7 | not started (G4) | – | – | – | – | – | needs separate approval |
| MP-B8 | not started (G4) | – | – | – | – | – | needs separate approval |

## Pin state

| Consumer | Pins | State | Reachability check (plan 9.3) |
|---|---|---|---|
| nodestro-runtime | orkexa `1b61fda`, axentra `0a1d1cc` | final (before MUP-ONA) | – |

Who bumps pins now: the TODO-abatement thread (round 3 cascade); handed over to the MUP-ONA lead agent afterwards.

## Rollback needs

None.

## Deviations from the plan

| # | Deviation | Reason |
|---|---|---|
| 1 | Skip expectations live in `tests/ci/skipped-<job>.txt` (MP-A0 field 5) rather than `tests/skip-expectations/<job>.txt` (10.8) | the plan names both; MP-A0 is the more specific instruction; one name in every repository |
| 2 | The German plan source is not versioned in this repository | repository content is English-only (plan 9.1); `reports/translation-check.md` identifies the German source by SHA-256 and the check script is `scripts/mup_translation_check.py` |
| 3 | FX-PG-0 contains a zero vector and, where the runtime accepts it, a vector with NaN (5.2 says "NaN-free") | U5 and the G1 report (7.2) count excluded NaN and zero vectors; see `reports/translation-check.md` |

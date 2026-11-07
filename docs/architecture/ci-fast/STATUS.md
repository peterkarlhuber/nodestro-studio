# CI-FAST status

The single source of truth for the CI-FAST program (faster CI and integration without lowering security or quality).
The plan is "CI-FAST Fassung 2" (German report, project folder `ci-fast/`), approved by the owner on 2026-11-07 at
10:48Z for all three phases.

Approval conditions that bind every step:

- The scope is the 12 repositories of Nodestro, Orkexa and Axentra only.
- Releases, external publication, registries, extra costs and new secrets are not allowed.
- `NODESTRO_READ` stays.
- No PR check is reduced before W0 is accepted.
- `ci-ok` becomes a required check only after it is proven correct and an independent review accepts it.
- The integration lock comes only after a successful spike over all install paths and a positive independent
  review. Otherwise the fallback L2 applies.
- Before any git tag, every tag trigger and release workflow is inspected.
- The eight human stop points of Fassung 2, chapter 11.3, are in force.

## Waves

| Wave | Content | State | Evidence |
|---|---|---|---|
| W0 | AP0 baseline, manifest, test-ID inventory; AP15 nightly S4, release lock, product nightly against studio master, failure issues; AP8 bump tool | in progress: merged in 10 of 12 repos (runtime and api wait for MUP-ONA B6/G2); nightly cycles start 2026-11-08 | see log |
| W1 | Per repo: AP1, AP2 (only proven duplicates, after W0), AP4, AP9, `ci-ok` report-only | in progress: AP1/AP4/ci-ok v1 merged in 8 of 10 repos; ci-ok v1 rejected for enforcement by independent review (REVIEW-ci-ok.md), v2 (workflow_run) merging; AP2/AP9 wait for W0 acceptance | see log |
| W2 | AP6, AP8 in production, AP10 | not started | |
| W3 | AP3, AP5, AP11, then branch protection with `ci-ok` | not started | |
| P2 | Lock spike (AP12/14), then L1a/L1b or L2; AP13; optional AP16 | not started | |
| P3 | AP17 tags (internal only), AP18, AP19, AP20 dry run | not started | |

## W0 acceptance criteria

- At least three complete, green nightly cycles in every repo.
- A deliberately red run (canary) opens an issue, and the next green run closes it.
- The release lock blocks when the nightly is red or missing.
- The manifest lists every check that runs on PRs today.
- The test-ID inventory exists per Python repo.
- The baseline is measured with the versioned tool.

## Log

| Time (UTC) | Event |
|---|---|
| 2026-11-07 10:48 | Program approved. W0 started. Coordination with MUP-ONA: they keep the pin slot; orkexa, runtime and api workflows wait for their B5/B6 merges. |
| 2026-11-07 11:14 | sdk #98 merged (d108c5a). Canary dispatch on master opened issue sdk #100 "Nightly failed" (failure visibility proven; closing is proven by the next green night). |
| 2026-11-07 11:17-11:45 | Merged: local-docker #46 (1b1fc57), integrations #74 (fc9c59c), examples #86 (cc220f4), desktop #56 (29fc035), axentra-studio #40 (e7f7674), server #69 (26baf70), axentra #58 (781c254). |
| 2026-11-07 13:38 | orkexa #67 merged (941e154), incl. release lock in release.yml. |
| 2026-11-07 13:43 | studio #152 merged (9d9753a): nightly, components-at-master, manifest, measurement tool + BASELINE.md, bump_pins.py. |
| 2026-11-07 14:27 | W1 examples #88 merged (2720258); 14:30 integrations #76 merged (c5df6a0); 14:37 sdk #102 merged (37658cb); 14:50 local-docker #48 merged (d26a627) after the server pin with the zlib fix (MUP #47); 14:51 axentra #59 merged (f6b6dc4); 14:52 sdk #103 merged (3f3c7c5): first ci-ok v2 live; 14:53 desktop #58 merged (5452fc9); 14:54 examples #90 merged (1753a44, v2 live); 14:55 integrations #78 merged (96f71b9, v2 live); 14:56 studio #155 merged (67e6b11). ci-ok v2 PRs: examples #90, integrations #78, sdk #103, local-docker #49, axentra #60, desktop #59. ci-ok v1 independent review: NOT accepted for enforcement (REVIEW-ci-ok.md); waiting v1 jobs held runner slots and were cancelled; v2 (workflow_run) in progress. |

## Deviations from the plan

- api ci.yml: test/package condition widened to `github.event_name != 'schedule' || github.workflow == 'Nightly'` so the scheduled nightly runs them (only adds runs; prepared locally, pushed after the MUP-ONA cascade).

- Concurrency groups of called workflows in axentra, axentra-studio, server and local-docker now include `github.workflow`, so a nightly and a master push cannot cancel each other (same grouping for PR/push runs).
- components-at-master runs as its own workflow with its own issue, so an early-warning red does not turn the S4 nightly red.
- The studio PR also carried the AP0/AP8 tooling (one PR per repo and wave).

## Residual risks

- Studio critical-path baseline: the tool gives 16.1/32.6 min (11-01..07) and 25.9/41.4 (11-05..07); Fassung's 25.8/48.3 is not reproducible in p90. The tool's definition is the baseline (BASELINE.md).
- Flaky tests seen: axentra `test_rate_limit_database_store_is_shared_by_processes` (per-minute window boundary, passed on rerun); studio `browser-engines (firefox)` (experimental, passed on rerun).

- The account limit of 20 concurrent jobs (5 on macOS) is unchanged. Nightly crons are staggered from 00:30 to 03:45 UTC.

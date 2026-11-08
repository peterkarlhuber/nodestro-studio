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
| W0 | AP0 baseline, manifest, test-ID inventory; AP15 nightly S4, release lock, product nightly against studio master, failure issues; AP8 bump tool | in progress: merged in all 12 repos (runtime #141 f1e7bc7, api #112 8fbf220 last); nightly cycles start 2026-11-08 | see log |
| W1 | Per repo: AP1, AP2 (only proven duplicates, after W0), AP4, AP9, `ci-ok` report-only | in progress: AP1/AP4/ci-ok merged in all 12 repos; ci-ok v1 rejected for enforcement by independent review (REVIEW-ci-ok.md), v2 (workflow_run) live in all 12 repos; AP2/AP9 wait for W0 acceptance | see log |
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
| 2026-11-07 14:27 | W1 examples #88 merged (2720258); 14:30 integrations #76 merged (c5df6a0); 14:37 sdk #102 merged (37658cb); 14:50 local-docker #48 merged (d26a627) after the server pin with the zlib fix (MUP #47); 14:51 axentra #59 merged (f6b6dc4); 14:52 sdk #103 merged (3f3c7c5): first ci-ok v2 live; 14:53 desktop #58 merged (5452fc9); 14:54 examples #90 merged (1753a44, v2 live); 14:55 integrations #78 merged (96f71b9, v2 live); 14:56 studio #155 merged (67e6b11); 14:57 axentra-studio #41 merged (af7b7a0); 14:58 orkexa #68 merged (561401e); 15:05 server #72 merged (b6de07b): W1 (AP1/AP4/ci-ok) merged in all 10 repos. Open v2 PRs: studio #156, server #73, local-docker #49, axentra #60, desktop #59, axentra-studio #42, orkexa #69. 15:06 runtime #141 and api #112 (W0+W1 incl. ci-ok v2) opened after MUP-ONA freed them. ci-ok v2 PRs: examples #90, integrations #78, sdk #103, local-docker #49, axentra #60, desktop #59. ci-ok v1 independent review: NOT accepted for enforcement (REVIEW-ci-ok.md); waiting v1 jobs held runner slots and were cancelled; v2 (workflow_run) in progress. 15:10 local-docker #49 merged (b1262ea, v2 live); 15:36 desktop #59 merged (7e54aed, v2 live); 15:38 server #73 merged (bc99e04, v2 live); 15:47 axentra-studio #42 merged (caa52b5, v2 live); 15:55 axentra #60 merged (40c0f2c, v2 live); 15:56 runtime #141 merged (f1e7bc7: W0+W1+ci-ok v2); 16:01 api #112 merged (8fbf220: W0+W1+ci-ok v2). W0 and W1 now merged in all 12 repos; 16:05 orkexa #69 merged (051d206, v2 live). 16:08 studio #156 merged (e485982: ci-ok v2 + docs/architecture/ci-fast snapshot of STATUS and REVIEW-ci-ok). ci-ok v2 is now live in all 12 repos; no CI-FAST PR open. The repo copy of STATUS is a snapshot; this file (mirror in project files) is authoritative and is synced into the repo with the next wave PR. |
| 2026-11-08 05:31 | First nightly evaluation: NO scheduled run fired in any of the 12 repos last night (nightly.yml, studio components-at-master.yml), and the api CI daily cron (04:17) did not fire either; githubstatus.com lists no incident. Workflows are `active`, crons are on master. GitHub schedules are best effort and can be delayed for hours (api's 04:17 cron fired at 11:04 on 11-07). Re-check at 10:00Z; the cycle of 11-07/08 does not count toward the 3 green cycles. |
| 2026-11-08 10:15 | Nightly cycle 1 (night 11-07/08): schedules fired ~6 h late in every repo (orkexa 00:30->06:22, runtime 01:00->06:51, api 01:40->07:55, sdk 02:00->08:14, studio 02:30->09:14, components-at-master 02:50->09:31); api's daily CI cron 04:17 did not fire by 10:00. Green: orkexa (27 jobs, 11.6 min), axentra (14, 9.7), runtime (23, 14.1), examples (6, 5.6), integrations (9, 2.2), api (13, 14.2), sdk (10, 4.5; issue #100 closed by the report job as designed), axentra-studio (7, 11.9), studio components-at-master (19.4 min). Red: studio nightly 42466363948: docker/docker + docker/one command (macos-15-intel) could not start colima (HTTP 504 downloading the colima-core image from github.com releases, external); browser-engines (firefox) timed out on a tooltip but is continue-on-error and correctly not counted; the report job opened studio issue #163 naming only `docker`. Failed jobs re-run once (10:01) to confirm the external cause. server (03:15), desktop (03:30), local-docker (03:45) not fired yet. Inventory: test-ids artifacts present everywhere except sdk, whose inventory goes to the run summary by design (no upload-artifact in that repo). Cycle 1 does not count toward the 3 green cycles (studio red, 3 repos missing). ci-ok v2 verified on real PRs: studio #137/#160/#161/#162 evaluated after each workflow_run; final verdict per head OK 23/23; superseded heads correctly NOT OK (PR-only cancel); one pending ci-ok run replaced by a newer one in the same head-SHA group (expected GitHub concurrency behavior, newest run evaluates the full state). |
| 2026-11-08 11:15 | Cycle 1 complete: server (10:27) and local-docker (10:47) green; desktop (10:36) red: macOS test build (macos-15-intel) could not start colima, same external HTTP 504 on the colima-core image download from github.com releases. Studio re-run (attempt 2): docker passed, `one command (macos-15-intel)` failed again with the same 504; issue #163 stays open. The URL answers 200 at 11:12, so the cause is transient on GitHub's side, not the code. Result: 10/12 green, 2 red on one external cause. Not counted. Follow-up (W2 candidate): retry the colima image download and/or cache it. Schedules ran ~6 h late; if this repeats, move the crons earlier so the nightlies finish before the working day. |
| 2026-11-08 13:10 | Colima hardening (robustness, no check reduction): studio docker.yml (docker + one command) and desktop ci.yml (macOS test build) now cache the Colima/Lima VM image (actions/cache v6.1.0, key colima-image-<os>-<arch>-<colima version>) and try `colima start` up to 3 times (vz, then QEMU, 90/180 s pauses). orkexa platforms.yml's colima job is experimental and stays unchanged. Repo copy of this STATUS synced in the studio PR. |

## Deviations from the plan

- api ci.yml: test/package condition widened to `github.event_name != 'schedule' || github.workflow == 'Nightly'` so the scheduled nightly runs them (only adds runs; prepared locally, pushed after the MUP-ONA cascade).

- Concurrency groups of called workflows in axentra, axentra-studio, server and local-docker now include `github.workflow`, so a nightly and a master push cannot cancel each other (same grouping for PR/push runs).
- components-at-master runs as its own workflow with its own issue, so an early-warning red does not turn the S4 nightly red.
- The studio PR also carried the AP0/AP8 tooling (one PR per repo and wave).

## Residual risks

- Studio critical-path baseline: the tool gives 16.1/32.6 min (11-01..07) and 25.9/41.4 (11-05..07); Fassung's 25.8/48.3 is not reproducible in p90. The tool's definition is the baseline (BASELINE.md).
- Flaky tests seen: axentra `test_rate_limit_database_store_is_shared_by_processes` (per-minute window boundary, passed on rerun); studio `browser-engines (firefox)` (experimental, passed on rerun).

- The account limit of 20 concurrent jobs (5 on macOS) is unchanged. Nightly crons are staggered from 00:30 to 03:45 UTC.

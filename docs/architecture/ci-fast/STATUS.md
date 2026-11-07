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
| W0 | AP0 baseline, manifest, test-ID inventory; AP15 nightly S4, release lock, product nightly against studio master, failure issues; AP8 bump tool | in progress | |
| W1 | Per repo: AP1, AP2 (only proven duplicates, after W0), AP4, AP9, `ci-ok` report-only | not started | |
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

## Deviations from the plan

None yet.

## Residual risks

- The account limit of 20 concurrent jobs (5 on macOS) is unchanged. Nightly crons are staggered from 00:30 to 03:45 UTC.

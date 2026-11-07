# CI-FAST baseline (W0, AP0)

This is the measured starting point of CI-FAST, for the window **2026-11-01 to 2026-11-07** (UTC). It was measured
with the versioned tool [`tools/cifast.py`](tools/README.md). The README defines the KPIs.

## How it was measured

- **Jobs and runs (M3, queue, minutes, superseded, re-runs, red rate):** the W0 raw data
  (`ci-fast/daten/rohdaten-actions-runs-jobs.tar.gz`, collected on 2026-11-07 up to about 09:25Z). The tool read
  it offline instead of fetching the roughly 13,500 jobs again.
  - **11-07 is a partial day.** It covers only 00:00 to about 09:25Z.
  - **Cross-check, done on 2026-11-07:**
    - A live `cifast.py collect --runs-only` for the same window returned every run of the tarball and none was
      missing. The 22 extra runs were all created after the snapshot.
    - A live `collect` with jobs for nodestro-sdk on 11-05 gave the same KPIs as the tarball (14 runs, 47 jobs).
  - **Commands:**
    - `cifast.py kpis --since 2026-11-01 --until 2026-11-07 --data <tarball dir> --out <dir>`
    - the same with `--repos` and all 13 directories of the tarball, for the reproduction check below
- **Cascades (M1, M2, M4):** live from `gh api repos/peterkarlhuber/<repo>/pulls/<n>` on 2026-11-07, after the W0 analysis.
  - Command: `cifast.py cascades tools/cascades-2026-11.json --runs-data <live runs dir>`.
  - With the PR snapshot of the W0 analysis (`--prs-json ci-fast/daten/prs.json`), the tool reproduces the numbers
    of that analysis exactly.

## Summary

| KPI | Baseline |
|---|---|
| M1 KI, median of C1 to C8 | **81.2 min** (p90 225.8) |
| M2 VI, median of C1 to C8 | **137.3 min** (p90 267.3) |
| M3 critical path per PR commit, nodestro-studio | median **16.1** / p90 **32.6** min (159 PR commits); 11-05..07 only: 25.9 / 41.4 |
| M3 critical path per PR commit, all 12 repos | median 9.2 / p75 15.9 / p90 25.7 min (983 PR commits) |
| Job queue, all jobs | median 0.1 / p90 **6.1** / p99 18.9 min (13,434 jobs; 1,681 waited more than 5 min) |
| Runner minutes, 11-01..07 | **48,757** job-minutes in the 12 repos (48,813 with levuvo-nextcloud-mcp) |
| Superseded runs | 267 (44 of them cancelled by concurrency); 51 cancelled runs in total |
| Re-runs | 20 runs with attempt > 1, 145 re-run jobs, 607 runner minutes |
| Master red rate | 31 of 958 master push runs red (3.2 %); 28 of 640 master commits had a red run (4.4 %) |
| M4 agent effort | 6 to 11 PRs, 12 to 109 commits and 8 to 25 CI iterations per cascade (table below) |
| M5 RC time | not measurable yet: no S4 nightly exists before W0. The method is below. |

## Comparison with Fassung 2

| Figure | Fassung 2 | This baseline | Verdict |
|---|---|---|---|
| Job queue p90 | 6.1 min | 6.1 min | matches |
| Job-minutes 11-01..07 | 48,813 | 48,813 with 13 repos; 48,757 with the 12 in scope | matches; levuvo-nextcloud-mcp (56 min) is out of the CI-FAST scope and therefore left out of the default |
| M1 KI median | ~81 | 81.2 | matches |
| M2 VI median | ~137 | 137.3 | matches (see the C1 note) |
| Studio critical path median / p90 | 25.8 / 48.3 min | 16.1 / 32.6 min (11-01..07); 25.9 / 41.4 min (11-05..07) | **deviates** |

**The studio critical path deviates.** With the definition in the README, the full week gives a median of 16.1
and a p90 of 32.6 minutes. That is 9.7 and 15.7 minutes below Fassung 2.

- **Window.** Restricted to 11-05..07, the median is 25.9 and matches Fassung 2's 25.8, but the p90 is 41.4, not
  48.3. Fassung 2 most likely took the studio figure from the partial job files of 11-05..07. Section 5 of the W0
  analysis states that this was its data basis.
- **Variants tried.** None of them gives 25.8 / 48.3 for the full week:
  - without the 3 h first-pass cut;
  - run-level instead of job-level timing;
  - the longest workflow only.
- **Fifth workflow.** Restricting to commits on which all five studio workflows ran gives 21.7 / 56.7 (n = 25).
- **Not reproducible.** The tool cannot reproduce the p90 of 48.3. The tool's definition stays as documented. The
  baseline for W1+ comparisons is the per-window value of this tool: report 16.1 / 32.6 for 11-01..07, and compare
  a later window only with a window of the same length.
- **Variance.** The window choice moves the studio median by about 10 minutes. The reason is how many
  workflows ran per commit:
  - 11-01..07: 49 of the 159 studio PR commits ran only 2 workflows.
  - 11-05..07: every commit ran at least 3 workflows, and 17 of 39 ran all 5.

**C1 changed after the W0 analysis.** In the analysis, C1 (MUP-ONA B2) was incomplete: desktop#55 and
local-docker#45 were still open. Live, both are merged now, so C1's VI is 109.1 instead of the lower bound 94.9.
The VI median stays 137.3, because C1 is below the median in both cases.

## M3 critical path per PR commit, 11-01..07 (minutes, includes queue)

| repo | PR commits | median | p75 | p90 |
|---|---|---|---|---|
| axentra | 64 | 6.2 | 12.4 | 19.2 |
| axentra-studio | 45 | 11.1 | 14.8 | 20.1 |
| nodestro-api | 110 | 8.9 | 13.6 | 18.0 |
| nodestro-desktop | 67 | 19.9 | 24.9 | 34.8 |
| nodestro-examples | 74 | 4.2 | 5.1 | 9.8 |
| nodestro-integrations | 61 | 1.8 | 6.3 | 10.3 |
| nodestro-local-docker | 46 | 6.5 | 9.3 | 11.9 |
| nodestro-runtime | 124 | 7.1 | 14.1 | 25.3 |
| nodestro-sdk | 83 | 1.6 | 3.6 | 9.2 |
| nodestro-server | 74 | 10.2 | 11.5 | 13.8 |
| nodestro-studio | 159 | 16.1 | 22.8 | 32.6 |
| orkexa | 76 | 16.4 | 29.0 | 46.4 |
| **all** | 983 | 9.2 | 15.9 | 25.7 |

## Job queue (minutes, job created → started)

| scope | jobs | median | p90 | p99 |
|---|---|---|---|---|
| all | 13,434 | 0.1 | 6.1 | 18.9 |
| linux | 10,854 | 0.1 | 6.0 | 17.7 |
| mac | 1,468 | 0.7 | 11.2 | 30.5 |
| win | 1,112 | 0.1 | 1.8 | 4.5 |

## Runner minutes per day (by job created day)

| day | total | linux | mac | win |
|---|---|---|---|---|
| 2026-11-01 | 6,140 | 6,132 | 2 | 6 |
| 2026-11-02 | 9,572 | 7,229 | 1,593 | 750 |
| 2026-11-03 | 7,750 | 5,475 | 1,818 | 457 |
| 2026-11-04 | 6,724 | 4,951 | 1,371 | 401 |
| 2026-11-05 | 3,983 | 2,860 | 905 | 218 |
| 2026-11-06 | 5,734 | 3,909 | 1,368 | 457 |
| 2026-11-07 (to ~09:25Z) | 8,853 | 6,767 | 1,537 | 549 |
| **total** | **48,757** | | | |

## Superseded runs, re-runs, master red rate

| repo | superseded | of them cancelled | cancelled (all) | runs attempt>1 | re-run jobs | re-run min | master push runs | red | red rate | master commits | red commits |
|---|---|---|---|---|---|---|---|---|---|---|---|
| axentra | 8 | 8 | 10 | 0 | 0 | 0 | 49 | 5 | 0.102 | 49 | 5 |
| axentra-studio | 3 | 3 | 3 | 0 | 0 | 0 | 24 | 0 | 0.0 | 24 | 0 |
| nodestro-api | 26 | 6 | 6 | 0 | 0 | 0 | 64 | 0 | 0.0 | 64 | 0 |
| nodestro-desktop | 12 | 0 | 0 | 2 | 21 | 187 | 44 | 1 | 0.023 | 44 | 1 |
| nodestro-examples | 4 | 0 | 0 | 0 | 0 | 0 | 59 | 0 | 0.0 | 59 | 0 |
| nodestro-integrations | 1 | 0 | 0 | 1 | 6 | 9 | 50 | 0 | 0.0 | 50 | 0 |
| nodestro-local-docker | 4 | 4 | 5 | 2 | 11 | 34 | 53 | 0 | 0.0 | 37 | 0 |
| nodestro-runtime | 27 | 1 | 2 | 4 | 29 | 78 | 133 | 5 | 0.038 | 74 | 5 |
| nodestro-sdk | 2 | 0 | 0 | 0 | 0 | 0 | 60 | 0 | 0.0 | 60 | 0 |
| nodestro-server | 6 | 6 | 7 | 0 | 0 | 0 | 68 | 0 | 0.0 | 53 | 0 |
| nodestro-studio | 129 | 0 | 0 | 8 | 45 | 178 | 276 | 14 | 0.051 | 83 | 11 |
| orkexa | 45 | 16 | 18 | 3 | 33 | 121 | 78 | 6 | 0.077 | 43 | 6 |

nodestro-studio has 129 superseded PR runs. Concurrency cancelled none of them, so every obsolete run went to the
end and used runners. This is an input for AP-level decisions in W1. This document changes nothing.

## M1 KI, M2 VI and M4 per cascade (live, 2026-11-07)

| cascade | T0 | KI (min) | VI (min) | PRs | commits | CI iterations |
|---|---|---|---|---|---|---|
| C1 MUP-ONA B2 | 2026-11-07 07:49 | 79.6 | 109.1 | 10 | 12 | 11 |
| C2 MUP-ONA B1/B3 | 2026-11-07 04:00 | 196.1 | 243.1 | 9 | 41 | 14 |
| C3 MUP-ONA A1+B0 | 2026-11-07 00:50 | 295.0 | 323.9 | 11 | 35 | 15 |
| C4 TODO abatement round 4 | 2026-11-07 01:35 | 82.9 | 148.7 | 10 | 35 | 16 |
| C5 TODO abatement round 3 | 2026-11-06 23:18 | 36.0 | 72.7 | 9 | 27 | 14 |
| C6 TODO abatement round 2 | 2026-11-06 20:04 | 113.6 | 166.6 | 6 | 26 | 8 |
| C7 Settings/attachments round | 2026-11-06 13:00 | 74.7 | 126.0 | 10 | 109 | 25 |
| C8 Manual-review findings | 2026-11-05 11:04 | 54.4 | 76.4 | 9 | 24 | 10 |
| **median** | | **81.2** | **137.3** | | | |

- **C2.** It has no server PR. Its VI ends with desktop#54.
- **Commits.** The commit count is the PR's `commits` field. C7 includes six feature PRs with long histories.
- **Time logs.** The agent time logs of M4 are not in the API. They are to be added by hand per cascade from the
  thread logs.

## M5 RC time: method

M5 cannot be measured before W0's nightly S4 runs exist. It is defined as follows and measured from the first
release candidate after W0.

1. **Freeze decision (start).** The time stamp of the owner's or the lead's written freeze decision: the message or
   the issue comment that names the release candidate. If there is none, the start is the creation time of the
   candidate's studio pin PR. The source is recorded with the value.
2. **Consistent SHA set.** The set of master SHAs that the candidate consists of: the studio SHA, plus every
   component SHA that its `platform/versions.json` pins, plus the studio SHA in each product's `studio.json` and
   `components.json`. The set is consistent when every product pins exactly that studio SHA and the studio pins
   exactly those component SHAs. `scripts/check_versions.py` passes and `bump_pins.py set --check` reports
   nothing to change.
3. **All S4 suites green (end).** For every repository, consider the `nightly.yml` runs, or the S4 workflow runs
   dispatched for the candidate, whose `head_sha` is the SHA of that repository in the set. Take the earliest time
   at which each such run has a conclusion of `success`. The end is the latest of these times, read from
   `gh api repos/<o>/<r>/actions/runs?head_sha=<sha>`. A run that failed and was re-run counts with the completion
   of the successful attempt. The red attempts are reported next to it.
4. **M5** = end − start. It is reported with the number of S4 runs, the red attempts, and the commits added to the
   set after the freeze (a re-spin restarts step 2, but not step 1).

The tool can compute step 3 from a `collect` of the release window once the nightly workflows exist. The
`cascades` subcommand is the template for an `rc` subcommand that takes the SHA set as input.

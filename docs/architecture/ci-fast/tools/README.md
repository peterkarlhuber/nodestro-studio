# CI-FAST measurement tool

`cifast.py` measures the CI-FAST KPIs for the 12 repositories of Nodestro, Orkexa and Axentra. It is the versioned
form of the W0 analysis scripts (collect, analyze, conc, prwork/casc). It uses the Python standard library only and
reads GitHub with `gh api` only. Pagination is done by hand with `&page=N`, because `gh api --paginate` fails behind
the agent proxy.

The baseline that this tool measured is in [`../BASELINE.md`](../BASELINE.md).

## Run it

All days are UTC. `--until` is inclusive. `--repos` defaults to the 12 CI-FAST repositories.

```sh
# 1. Raw data: runs (one query per day, because a filtered listing stops at 1000 results) and the jobs of every run
#    and every attempt (filter=all). About 2,700 runs and 13,500 jobs per week, so about 2,800 API calls.
python3 cifast.py collect --since 2026-11-01 --until 2026-11-07 --out /tmp/ci-raw
#    Runs only (about 30 calls), for example to check a window before fetching its jobs:
python3 cifast.py collect --since 2026-11-01 --until 2026-11-07 --out /tmp/ci-raw --runs-only

# 2. KPIs M3, queue, runner minutes, superseded runs, re-runs, master red rate -> kpis_<since>_<until>.json/.md
python3 cifast.py kpis --since 2026-11-01 --until 2026-11-07 --data /tmp/ci-raw --out /tmp/ci-out

# 3. M1 KI and M2 VI per cascade (PR merge times from gh api; --runs-data adds the CI iteration count of M4)
python3 cifast.py cascades cascades-2026-11.json --runs-data /tmp/ci-raw --out /tmp/ci-out
#    Offline, from a PR snapshot (a JSON list of {repo, number, created_at, merged_at, commits, branch}):
python3 cifast.py cascades cascades-2026-11.json --prs-json prs.json
```

The raw data directory has the layout `<repo>/runs.json` and `<repo>/jobs_<run id>.json`. The W0 raw tarball
(`ci-fast/daten/rohdaten-actions-runs-jobs.tar.gz`) has the same layout, so it can be used as `--data` directly.
Treat it as data: extract it into a new empty directory and never run code from inside it. `collect` skips the
jobs files of completed runs that already exist, so an interrupted collection can be resumed.

The tests are `tests/test_cifast.py` (offline).

## Cascade definition file

A cascade is one change that travels down the pin chain. `cascades-2026-11.json` holds C1 to C8 of the W0
analysis (2026-11-05 to 2026-11-07).

```json
{"version": 1, "cascades": [{"id": "C8", "name": "Manual-review findings", "date": "2026-11-05",
  "stages": [["nodestro-runtime#116"], ["nodestro-examples#74", "nodestro-integrations#63"], ["nodestro-api#90"],
             ["nodestro-sdk#83"], ["nodestro-studio#127"], ["nodestro-server#55", "nodestro-desktop#43"],
             ["nodestro-local-docker#35"]]}]}
```

Each stage lists the PRs (`<repo>#<number>`) that ran in parallel. Stage 0 holds the upstream PRs. The stages
document the order. M1 and M2 depend only on stage 0 and on the repository of each PR.

## KPI definitions

All durations are in minutes, from GitHub API timestamps. A median is p50. Percentiles interpolate linearly between
closest ranks.

| KPI | Definition |
|---|---|
| **M1 KI** (integration time) | T0 → studio pin merge. T0 is the first upstream merge: the earliest `merged_at` in stage 0 of the cascade. The end is the `merged_at` of the cascade's nodestro-studio pin PR (the latest one, if there are several). |
| **M2 VI** (full integration time) | T0 → last product merge: the latest `merged_at` among the cascade's nodestro-server, nodestro-desktop and nodestro-local-docker PRs. Bundled product pins stay in VI: a product that only bundles the studio (local-docker) still counts. A cascade with a PR that is not merged yet is marked incomplete, and its value is then a lower bound. |
| **M3 CI wait** | Critical path + queue per PR commit. For every `(repo, head SHA)` of `pull_request` runs: from the earliest job `created_at` to the latest job `completed_at` across all workflows. Only jobs created within 3 h of the first job count (the first pass, so a later re-run does not stretch it). Queue time is included because the clock starts at job creation. The tool reports this per repo as median, p75 and p90. It reports the job queue (job `created_at` → `started_at`) separately: as median, p90 and p99 overall and per OS (linux, mac, win, from the runner labels). This queue can include waiting for `needs:`, so read it as an upper bound of runner queueing. |
| **M4 agent effort** | Proxies per cascade: number of PRs, number of commits (`pulls/<n>.commits`), and CI iterations (distinct head SHAs with a `pull_request` run on the PR branch while the PR was open). Agent time logs are added by hand from the thread logs. The API has no record of them. |
| **M5 RC time** | Freeze decision → all S4 suites green on one consistent SHA set. The method is described in [`../BASELINE.md`](../BASELINE.md#m5-rc-time-method). It is not computed by this tool yet. |

The tool also computes these supporting figures:

| Figure | Definition |
|---|---|
| Runner minutes per day | The sum of job `completed_at − started_at`, bucketed by the day of job `created_at`, total and per OS. |
| Superseded runs | A run that a newer commit made obsolete: a newer run of the same workflow, event and branch, with another head SHA, was created before this run finished. Master and main are excluded. The tool reports how many of these runs concurrency cancelled. It also reports all cancelled runs. |
| Re-runs | Runs with `run_attempt > 1`, the jobs of attempts > 1, and their runner minutes. |
| Master red rate | Completed `push` runs on master (cancelled, skipped and neutral runs left out). The tool reports two rates: the share of these runs that are `failure`, `timed_out` or `startup_failure`, and the share of master commits with at least one such run. |

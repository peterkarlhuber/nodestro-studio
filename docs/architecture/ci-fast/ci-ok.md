# ci-ok: one manifest-based PR check (CI-FAST W1, report-only)

## What it checks

`ci-ok` answers one question for a pull request: did every mandatory check listed in `.github/ci-manifest.json` run
on the PR head SHA and succeed?

- Workflow `.github/workflows/ci-ok.yml`, trigger `pull_request` (opened, synchronize, reopened), job and check name
  `ci-ok`. Script `.github/scripts/ci_ok.py` (standard library only, Python 3.10+), tests
  `.github/scripts/test_ci_ok.py`, lint settings `.github/scripts/ruff.toml`. All four files are byte-identical in
  the ten repositories in scope (nodestro-studio, -server, -desktop, -local-docker, -sdk, -examples, -integrations,
  axentra, axentra-studio, orkexa); this repository holds the canonical copy.
- **The manifest comes from the PR's base commit** (contents API at `pull_request.base.sha`), so a pull request cannot
  weaken its own gate. A PR that changes the manifest gets a notice; the change takes effect after the merge. The script
  itself also runs from the base commit's checkout; only the PR that introduces ci-ok (whose base has no script) runs
  the PR's copy, with a notice.
- **Expected jobs**: every name in `pull_request.<workflow file>` and `pull_request_path_filtered.<workflow file>`.
  A job is matched by workflow file (`run.path == .github/workflows/<file>`) and by its exact name (the check-run name,
  for example `test (3.11)` or `systems / system (ubuntu-24.04)`). Only runs with `event == pull_request` on the PR
  head SHA count. Several runs of one workflow on one SHA: the newest run wins. A re-run: the jobs endpoint is read with
  `filter=latest`, so the latest attempt decides (verified on axentra #58, whose attempt 1 failed and attempt 2 passed).
- **Path-filtered workflows** (studio `docker.yml`, `macos.yml`; server and local-docker `upgrade.yml`): the manifest key
  `path_filters` holds a verbatim copy of each workflow's `on.pull_request.paths` (or `paths_ignore`). The script reads
  the PR's changed files (`pulls/{n}/files`, falling back to the compare API, which needs only `contents: read`) and
  evaluates the filters with GitHub's glob semantics (`*` does not cross `/`, `**` does, `?`/`+` quantify the preceding
  character, `[...]` classes, a leading `!` negates and the last matching pattern wins). A workflow that should not have
  run is reported as `not triggered (paths)` and counts as ok; one that should have run but has no run is `missing`.
  If a path-filtered workflow runs anyway, its jobs are judged normally.
- **Drift check**: `ci_ok.py --self-check --root <tree>` compares the manifest with the workflow files (a minimal YAML
  reader for the `on:` block, no PyYAML): every workflow with a `pull_request` trigger must be listed, every listed
  workflow must exist and run on `pull_request`, `path_filters` must equal the workflow's filter, `advisory` entries
  must name listed jobs in a workflow that has `continue-on-error`. The ci-ok job runs it on the PR's tree, so a PR that
  adds a workflow or changes a paths filter without updating the manifest gets a warning.
- **Verdicts per expected job**: `success` is ok. `failure`, `cancelled`, `timed_out`, `action_required`, `skipped`,
  `neutral`, `stale`, `missing` (also `missing (run <conclusion>)` when the run ended without the job) and
  `timed out (ci-ok)` are NOT ok. `skipped` is NOT ok on purpose: a mandatory check that did not run did not pass.
- **Advisory jobs**: manifest key `advisory: ["<workflow>/<job name>", ...]` for jobs with `continue-on-error`. They
  are shown but never decide the verdict. Populated after checking `continue-on-error` in the workflow files:
  studio `ci.yml/browser-engines (firefox|webkit)` (job-level `continue-on-error: true`), sdk
  `ci.yml/runtimes (macos-latest|windows-latest)` (`continue-on-error: ${{ matrix.os != 'ubuntu-latest' }}`), orkexa
  `platforms.yml/DockerSandbox (podman rootless is refused|colima macOS x86-64)` (`continue-on-error:
  ${{ matrix.experimental }}`, the two `experimental: true` entries). Step-level `continue-on-error` (pin-distance
  warnings in server, desktop, local-docker; the GNOME attempt in desktop `systems.yml`) does not make a job advisory.
- **Unlisted jobs**: any job of a `pull_request` run on the head SHA that is not in the manifest (ci-ok's own workflow
  excluded) is reported as `unlisted`, a warning, never a failure. This is how manifest drift becomes visible.
- **Output**: a markdown table in `$GITHUB_STEP_SUMMARY`, a one-line verdict
  (`ci-ok: OK (...)` / `ci-ok: NOT OK (...)`), `::warning::` annotations for NOT OK and for unlisted jobs.
- **Waiting**: polls every 60 s (`CI_OK_POLL_SECONDS`) for at most 90 min (`CI_OK_TIMEOUT_MINUTES`; the job's
  `timeout-minutes` is 100 so the script reports the timeout itself). A workflow without any run is `pending` for the
  first 10 min (`CI_OK_GRACE_MINUTES`), then `missing`. Fail-fast: once a counted job has failed the verdict is final
  and the job ends early (`CI_OK_FAIL_FAST=0` waits for everything). Jobs of completed runs are cached between polls.
- **Concurrency**: group `ci-ok-<PR number>`, `cancel-in-progress: true`: a new push supersedes the old wait.
- **Permissions**: top-level `contents: read`; the job has `contents: read` and `actions: read`. No `checks`,
  `statuses` or `pull-requests` permission, no secrets, no new actions (only `actions/checkout` at the SHA every
  repository already uses).

## Why report-only

A required check that is wrong blocks every merge in the repository. Before `ci-ok` can be required it must be shown
to agree with reality: the manifests were written by hand in W0, path filters and re-runs are subtle, and the cost
below is new. In report-only mode the job exits 0 even when the verdict is NOT OK; the verdict is visible in the job
summary and as a warning annotation. It is not a required check.

## How to enforce later (after independent review)

1. Collect evidence: compare ci-ok's verdict with the actual merge decision on real PRs for a while (every NOT OK
   on a PR that was merged green is either a manifest error or a ci-ok bug).
2. Set `CI_OK_ENFORCE: "1"` in `ci-ok.yml` (the verdict becomes the exit code; the self-check then also fails on drift).
3. Make `ci-ok` a required status check in the branch protection / ruleset (a repository setting, done by the owner),
   and only then consider removing the individual required checks it replaces.

## Dry runs (first evidence, 2026-11-07, `--once` against finished PRs, local manifest with the W1 additions)

| PR | Head | Verdict | Notes |
|---|---|---|---|
| studio #152 | 7daafdb | OK, 23/23 | docker.yml and macos.yml ran (their paths matched); 2 advisory passed |
| studio #149 | (merged) | OK, 23/23 | macos.yml `not triggered (paths)`; GitHub indeed did not run it |
| studio #150, #151 | (merged) | OK, 23/23 | docker.yml `not triggered (paths)`; GitHub indeed did not run it |
| studio #147 (older head 3b40fbe) | 3b40fbe | NOT OK, 19/23 | backend (3.11/3.13) and components (3.11/3.13) failed |
| sdk #98 | 5196d22 | OK, 5/5 | runtimes macOS/Windows advisory |
| orkexa #67 | 79ae809 | OK, 22/22 | two DockerSandbox entries advisory |
| orkexa #66 (older head 950c81e) | 950c81e | NOT OK, 21/22 | `test (Python 3.13)` failed |
| axentra #58 | 661f072 | OK, 11/11 | re-run: attempt 1 had `Tests (Python 3.12, PostgreSQL 16)` = failure, attempt 2 passed |
| server #47 (older head 4744f9b) | 4744f9b | NOT OK, 1/4 | e2e cancelled, upgrade failed, e2e-arm64 `missing (run cancelled)` |

No `unlisted` jobs appeared in any of them; the manifests match what runs today.

## Cost: one runner slot per PR head while CI runs

The job does nothing but wait, yet it holds an `ubuntu-latest` runner the whole time. All ten repositories are
public, so there is no minute billing; the cost is **concurrency**: the account's 20 concurrent jobs are shared by every
repository, and a waiting ci-ok job takes one of them.

Measured (CI span = first run created to last job completed on the PR head, from the dry runs above) and the number
of `pull_request` runs of `ci.yml` in the 14 days before 2026-11-07:

| Repository | CI span (min) | PR pushes in 14 days | ci-ok runner minutes in 14 days (upper bound) |
|---|---|---|---|
| nodestro-studio | 20-33 (about 22) | 237 | about 5,200 |
| axentra | 46 | 65 | about 3,000 |
| nodestro-desktop | 31 | 89 | about 2,750 |
| orkexa | 19-27 (about 23) | 101 | about 2,300 |
| nodestro-server | 26 | 86 | about 2,250 |
| nodestro-sdk | 15 | 114 | about 1,700 |
| axentra-studio | 24 | 47 | about 1,150 |
| nodestro-local-docker | 17 | 60 | about 1,000 |
| nodestro-examples | 8.5 | 101 | about 850 |
| nodestro-integrations | 4 | 87 | about 350 |
| **total** | | **987** | **about 20,600 (about 1,470 per day)** |

That is about one extra slot on average over 24 h, or about 2.5 of the 20 slots during a 10-hour working day. It is an
upper bound: `cancel-in-progress` ends the wait of a superseded push, and fail-fast ends it at the first failure. The
real risk is peaks: a wave of PRs across all repositories (for example a pin bump in twelve repositories) adds one
waiting slot per PR exactly when the queue is already full, and the waiting slots can delay the very jobs they wait for.

API budget: each poll costs one runs call plus one jobs call per run that is not yet completed (studio: at most six per
minute, about 180 for a 30-minute wait). `GITHUB_TOKEN` allows 1,000 requests per hour per repository, so three or more
studio PRs waiting at the same time could reach it; the script then pauses until the reset instead of failing.

### Mitigations

- **Starting with a delay does not help** inside the job: a `sleep` holds the runner as well. A delay that does not
  hold a runner needs an environment with a wait timer (`environment:` on the job), which is a repository setting and
  creates deployment records on every PR; not done here.
- **Raise the poll interval** (`CI_OK_POLL_SECONDS`) to reduce API calls; it does not reduce slot time.
- **`workflow_run` variant (recommended for enforcement)**: trigger on `workflow_run: types: [completed]` of the listed
  workflows. Each completion starts a short job (seconds, not minutes) that evaluates the same script with `--once`
  for `workflow_run.head_sha` and the PR found via `workflow_run.pull_requests` (empty for fork PRs; then look the PR up
  by head SHA). Research result: **this variant cannot report on the PR without a write permission.** A
  `workflow_run` workflow runs in the context of the default branch; its own check run is attached to the default
  branch's commit, not to the PR head, so it never shows up as a check on the PR. To appear on the PR it must create a
  commit status (`statuses: write`, `POST /repos/{repo}/statuses/{head_sha}` with context `ci-ok`) or a check run
  (`checks: write`). Both are outside what CI-FAST allows in W1. With `statuses: write` it would remove the waiting
  slot entirely (and works for fork PRs, because `workflow_run` gets a write token while never checking out PR code).
  Extra care then: a workflow that was skipped by its paths filter never completes, so the evaluation must run on every
  completion and the last one decides; ci.yml runs on every PR in every repository, so there is always at least one
  completion. Decision for a later wave.

## Known limits

- Changed files: `pulls/{n}/files` returns at most 3,000 files; the compare fallback (used when the token has no
  `pull-requests` permission, i.e. in the ci-ok job) returns at most 300. GitHub's own path filtering looks at the first
  300 changed files too, but the two lists may differ in order for very large PRs.
- The minimal YAML reader handles the `on:` shapes these repositories use (block or flow lists, quoted or plain
  scalars, comments). Anchors, multi-line scalars or `on:` written as a flow mapping are reported as unreadable by
  `--self-check` instead of being guessed.
- A job whose name is computed at runtime differently from the manifest is `missing` plus `unlisted`, by design.
- Advisory status is taken from the manifest, not detected: when a job loses `continue-on-error`, remove it from
  `advisory` (the self-check only verifies that the workflow still has `continue-on-error` somewhere).
- A job re-run after ci-ok finished does not re-trigger ci-ok; re-run the ci-ok job (or push) to refresh the verdict.
- Unit tests: run with `python3 -m unittest discover -s .github/scripts -p test_ci_ok.py` (or
  `python3 .github/scripts/test_ci_ok.py`). `python3 -m unittest .github/scripts/test_ci_ok.py` does not work, because
  unittest turns the path into the module name `.github.scripts.test_ci_ok`. The ci-ok job runs the tests before it
  evaluates; they are not added to studio's backend `pytest` run (pytest skips dot directories).

## Local dry run

```
GH_TOKEN=$(gh auth token) python3 .github/scripts/ci_ok.py --repo peterkarlhuber/<repo> --pr <n> --once \
  [--head-sha <sha>] [--manifest-file .github/ci-manifest.json] [--json out.json]
```

`--once` (alias `--no-wait`) evaluates one snapshot; anything unfinished is `not finished (--once)`.

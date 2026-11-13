# ci-ok: one manifest-based PR check (CI-FAST W1, report-only, v3)

## v3 changes (review REVIEW-ci-ok-v2.md: B1, H1 partly, H2, M1, L1)

- **Where the verdict lives (C1).** Every evaluation posts a check run named exactly `ci-ok` on the PR head SHA
  (`workflow_run.head_sha`, `POST /repos/{repo}/check-runs` with the job's `GITHUB_TOKEN`): `completed`/`success` for
  OK, `completed`/`failure` for NOT OK, `in_progress` for PENDING. Its output title and summary hold the verdict table
  (truncated to the API limits). Each evaluation posts a new check run; GitHub shows (and a required check would use)
  the newest one of that name from the app, and evaluations of one head SHA never overlap. A `requested` event of a
  listed workflow (also a re-run) posts `in_progress` without evaluating, so a stale verdict is not shown while it
  runs (L1). If the check run cannot be posted, the job fails (exit 1) whatever the mode. New permissions on the job:
  `checks: write` and `statuses: read` (no secrets). Local dry runs (`--pr`, `--head-sha`) never post.
- **Where GitHub files the posted check run.** A check run posted with `GITHUB_TOKEN` lands in one of the GitHub
  Actions check suites on the head SHA, so it is listed among the jobs of an unrelated `pull_request` run there (seen
  on studio #174: the verdicts appeared as jobs named `ci-ok` of the Platform run, which still concluded `success`).
  The evaluator reads each job named `ci-ok` as a check run and skips it when it is its own (app `github-actions`,
  `external_id` `ci-ok-evaluator`); any other job named `ci-ok`, or one whose check run cannot be read, stays an
  impostor. Earlier in-progress check runs stay in progress; the newest one is the verdict.
- **Evaluator job renamed** to `ci-ok evaluate`; its own check run sits on the default branch's commit and never has
  the name `ci-ok`. `--self-check` fails when `ci-ok.yml` has a job or step named `ci-ok`, lacks a job named
  `ci-ok evaluate`, lacks `checks: write`, or its `workflow_run.types` lack `completed`.
- **Impostor rule (H1, partly).** Before posting, the evaluator lists every check run named `ci-ok` on the head SHA,
  from any app (`GET /commits/{sha}/check-runs?check_name=ci-ok&filter=all`), and every commit status. A `ci-ok`
  check run that is not its own (own = app `github-actions` and `external_id` `ci-ok-evaluator`), and any commit
  status with the context `ci-ok`, is a counted `impostor` row: NOT OK. This is a scan, not a proof: anything holding
  a `GITHUB_TOKEN` with `checks: write` in the repository could still imitate an own run, or post after the
  evaluation. Making the check unforgeable (a dedicated GitHub App, or a written acceptance of the residual risk) is
  review condition C2 and still open.
- **Self-check of the post-merge view (C3, H2).** Besides the default branch's checkout, the evaluator self-checks
  the view after merge: for each file the self-check reads (`.github/ci-manifest.json`, `.github/workflows/*.yml`), the
  PR head's version if the PR changed it (from the PR's changed-files list; a removed or renamed-away file is gone),
  otherwise the default branch's. PR versions are read through the contents API at the head SHA, as data (nothing is
  checked out or executed). A PR that changes none of these files is not checked at all (no API reads), so a PR based
  on an older default branch is not blamed for the old files in its tree. Problems are compared by text: introduced
  by the PR = NOT OK (`self-check (PR)` row); present on the default branch and in the view = NOT OK; present on the
  default branch but fixed by the PR = an ok `fixed in this PR` row with a note, so a fix such as server #83 is no
  longer blocked by the drift it repairs. If the changed files are unknown or may be cut by the API caps (3,000 via
  the PR API, 300 via compare), the raw PR tree is checked instead and the rows say so. Tests replay server #81
  (NOT OK), #82 (NOT OK) and #83 (OK).
- **Several PRs on one head SHA (C5, M1).** A check run belongs to the SHA, not to a PR. The evaluator evaluates every
  PR in the event plus every other open PR that a pull_request run on the SHA lists with that head SHA, and posts the
  WORST verdict (NOT OK > PENDING > OK), saying so in the summary. Without a PR number (fork PRs) the summary says
  that attribution is by head SHA alone.
- **Preconditions for enforcement.** No merge queue: there is no `merge_group` handling, so a merge queue must not be
  enabled while `ci-ok` is required (M3). CODEOWNERS for `/.github/**` (C4) and about two weeks of report-only
  operation (C6) are still open. **ci-ok stays report-only** (`CI_OK_ENFORCE` unset, not a required check) until it
  is re-reviewed.

The rest of this note describes v2; where it says the verdict is only in the job summary, or that the job is named
`ci-ok`, or that it has no `checks` permission, v3 above replaces it.

## What it checks

`ci-ok` answers one question for a pull request: did every mandatory check listed in `.github/ci-manifest.json` run
on the PR head SHA and succeed?

- Workflow `.github/workflows/ci-ok.yml`, script `.github/scripts/ci_ok.py` (standard library only, Python 3.10+),
  tests `.github/scripts/test_ci_ok.py`, lint settings `.github/scripts/ruff.toml`. Script, tests and lint settings
  are byte-identical in the ten repositories in scope (nodestro-studio, -server, -desktop, -local-docker, -sdk,
  -examples, -integrations, axentra, axentra-studio, orkexa); this repository holds the canonical copy. The workflow
  differs only in its `workflows:` list.
- **Trigger (v2)**: `on: workflow_run: { workflows: [<names>], types: [completed] }`, where `<names>` is the `name:` of
  every workflow file in the manifest's `pull_request` (and `pull_request_path_filtered`) section. The job runs only
  when `github.event.workflow_run.event == 'pull_request'`; completions of push, schedule or dispatch runs skip it,
  and a skipped job takes no runner.
- **Nothing comes from the pull request.** GitHub always runs a `workflow_run` workflow from the default branch. The
  job checks out the default branch's `.github` (the event's `github.sha`, sparse, `persist-credentials: false`) and
  runs the script and the manifest from there. A PR that changes `ci-ok.yml`, `ci_ok.py` or the manifest gets a notice
  in the report; the change takes effect after merge.
- **What is evaluated**: the triggering run's `head_sha` and the PR number(s) in `workflow_run.pull_requests` (one
  report per PR). That list is empty for fork PRs; ci-ok then evaluates the head SHA alone, says so in the report,
  counts pull_request runs of any PR on that SHA, and approximates the changed files by comparing the default branch
  with the head SHA (if that comparison fails, path-filtered workflows without a run count as missing).
- **One evaluation, no waiting.** Each completion of a listed workflow starts one job of a few seconds that reads the
  current state once. Verdicts: `OK`, `NOT OK` (any counted row failed, also when others are still running), or
  `PENDING` (nothing failed, but listed jobs have not finished). Because every listed workflow's completion triggers a
  new evaluation, the evaluation started by the last completion sees the final state. **The latest completed ci-ok run
  for a head SHA is the verdict.** Its run name is `ci-ok for <head SHA> after <workflow>`.
- **Expected jobs**: every name in `pull_request.<workflow file>` and `pull_request_path_filtered.<workflow file>`.
  A job is matched by workflow file (`run.path == .github/workflows/<file>`) and by its exact name (the check-run name,
  for example `test (3.11)` or `systems / system (ubuntu-24.04)`). Only runs with `event == pull_request` on the head
  SHA count. A re-run: the jobs endpoint is read with `filter=latest`, so the latest attempt decides (verified on
  axentra #58, whose attempt 1 failed and attempt 2 passed), and the re-run's completion re-evaluates. After "re-run
  failed jobs" GitHub copies the jobs that were not re-run into the new attempt (same timestamps, new ids), so
  `filter=latest` still lists every job (checked on 19 re-run PR runs in all 12 repositories, 2026-11-13).
- **Attribution to the PR (review F5)**: when the PR number is known, a run counts only if its `pull_requests` contains
  that number. Runs that list only other PRs are ignored (and counted in a notice). A run that lists no PR at all is
  used only when the workflow has no run attributed to this PR, with a note on the row. Among equal candidates the
  newest run wins (close/reopen).
  Caveat, observed on studio #152: GitHub fills a run's `pull_requests` from the head branch's currently **open**
  PRs, not from the PR that triggered the run. Live, the evaluated PR is open, so this works; but two open PRs from
  the same head branch (for example against `master` and a release branch) both appear on every run of that branch,
  and the filter cannot separate them. A dry run (`--pr`) of a closed PR therefore attributes by head SHA alone, with
  a notice.
  Same head branch (observed on nodestro-server #81, 2026-11-13): #81 was merged, #82 was opened from the same branch,
  and the queued ci-ok evaluation of #81 then found both runs listing #82, ignored them and reported every check as
  missing. A run therefore also counts as the PR's when the run's head branch and head repository id equal the
  triggering run's (`workflow_run.head_branch`, `head_repository.id`) and every PR it lists has that same head. This
  covers a closed or merged PR (its runs list no PR, or a follow-up PR from the same branch) without an extra API
  call. A run that lists a PR from another branch, or from a fork's branch of the same name, is still ignored; without
  the head branch in the event the rule is off (fail closed).
- **Duplicate names (F6)**: when several jobs of the newest attempt share a listed name (a reusable workflow called
  twice, a collapsed matrix name), all of them must succeed; one pending makes the row pending.
- **Path-filtered workflows** (studio `docker.yml`, `macos.yml`; server and local-docker `upgrade.yml`): the manifest key
  `path_filters` holds a verbatim copy of each workflow's `on.pull_request.paths` (or `paths_ignore`). The script reads
  the PR's changed files (`pulls/{n}/files`, falling back to the compare API, which needs only `contents: read`) and
  evaluates the filters with GitHub's glob semantics (`*` does not cross `/`, `**` does, `?`/`+` quantify the preceding
  character, `[...]` classes, a leading `!` negates and the last matching pattern wins). A workflow that should not have
  run is reported as `not triggered (paths)` and counts as ok; one that should have run but has no run is `missing`.
  If a path-filtered workflow runs anyway, its jobs are judged normally. A path-filtered workflow without a
  `path_filters` entry is now NOT ok (F8; it used to count as ok).
- **Verdicts per expected job**: `success` is ok. `failure`, `cancelled`, `timed_out`, `action_required`, `skipped`,
  `neutral`, `stale`, `missing` (also `missing (run <conclusion>)` when the run ended without the job) are NOT ok.
  `skipped` is NOT ok on purpose: a mandatory check that did not run did not pass.
- **Advisory jobs**: manifest key `advisory: ["<workflow>/<job name>", ...]` for jobs with `continue-on-error`. They
  are shown but never decide the verdict: studio `ci.yml/browser-engines (firefox|webkit)`, sdk
  `ci.yml/runtimes (macos-latest|windows-latest)`, orkexa
  `platforms.yml/DockerSandbox (podman rootless is refused|colima macOS x86-64)`. Step-level `continue-on-error` does
  not make a job advisory.
- **Unlisted jobs**: any job of a `pull_request` run on the head SHA that is not in the manifest is listed as
  `unlisted` (a table row and a count in the verdict line), never a failure. In v2 this includes jobs in `ci-ok.yml`
  itself (F13: the gate's file is no longer a blind spot, because the real gate never runs on `pull_request`).
- **Impostors (F1, fix 3)**: any `pull_request` job named `ci-ok`, in any workflow file including `ci-ok.yml`, is a
  counted `impostor` row and makes the verdict NOT OK.
- **Fail closed (F2, F7, F8)**: no bootstrap fallback any more (no default-branch manifest means `no manifest`, NOT
  OK). The script runs `--self-check` on the default-branch checkout on every evaluation; each problem is a counted
  `inconsistent` row. A manifest with no counted job is `no mandatory jobs`, NOT OK. API errors are retried (5xx,
  network, rate limits; `Retry-After` first, then `x-ratelimit-reset`) within one 180 s deadline
  (`CI_OK_API_DEADLINE_SECONDS`), then reported as `api error`, NOT OK. Any other exception is reported the same way.
- **Output**: a markdown table per PR in `$GITHUB_STEP_SUMMARY`, and exactly one annotation per PR: `::notice` for
  OK and PENDING, `::warning` for NOT OK.
- **Exit code**: report-only always exits 0, whatever the verdict and also on errors. `CI_OK_ENFORCE=1` makes a
  verdict other than OK exit 1.
- **Concurrency**: job-level `group: ci-ok-<head SHA>`, `cancel-in-progress: false`. A running evaluation is never
  cancelled; GitHub keeps at most one pending job per group and replaces an older pending one with the newer, so only
  the newest queued evaluation runs next and it starts after every completion that queued it. The group sits on the
  job, behind the `if:`, so that the skipped evaluation of a push run on the same SHA (a fast-forward or rebase merge)
  cannot replace a pending PR evaluation. Replaced pending runs show up as cancelled ci-ok runs; that is expected.
- **Permissions**: top-level `contents: read`; the job has `contents: read` and `actions: read`. No `checks`,
  `statuses` or `pull-requests` permission, no secrets, no new actions (only `actions/checkout` at the SHA every
  repository already uses). `timeout-minutes: 10`.

### Which workflows trigger it

| Repository | `workflows:` | Not listed |
|---|---|---|
| nodestro-studio | `CI`, `Docker`, `macOS frontend`, `Platform`, `Platforms` | `Nightly`, `Components at master` (no `pull_request`) |
| nodestro-server, nodestro-local-docker | `ci`, `upgrade` | `Nightly` and the other non-PR workflows |
| nodestro-desktop, -sdk, -examples, -integrations, axentra, axentra-studio | `CI` | `Nightly` and the other non-PR workflows |
| orkexa | `CI`, `Platforms` | `Nightly` and the other non-PR workflows |

- **Path-filtered workflows are listed.** When they run, their completion must re-evaluate, or a slow path-filtered
  workflow finishing last would leave a stale PENDING. When their filter excludes a PR they never run, and the other
  listed workflows' completions decide (`ci.yml` runs on every PR in every repository).
- **Nightly is not listed.** It never runs on `pull_request`, and the job's `if:` would skip it anyway. Workflows that
  the nightly calls (`workflow_call`) do not fire `workflow_run` on their own; only the caller does.

### Self-check (F8)

`python3 -I .github/scripts/ci_ok.py --self-check --root .` is a lint with no network access. It exits 1 on any of:

- a workflow with a `pull_request` trigger that is not in the manifest, or a listed workflow that is missing or has
  no `pull_request` trigger;
- `path_filters` that differ from the workflow's `on.pull_request` filter, or a path-filtered workflow without a
  `path_filters` entry;
- a manifest without any mandatory job;
- an `advisory` entry that is not a listed job, or whose workflow has no `continue-on-error`;
- `ci-ok.yml` missing, running on `pull_request` or `pull_request_target`, or with a `workflow_run.workflows` list that
  differs from the `name:` of the listed workflows (a workflow without `name:` is matched by its path, as GitHub does);
  several workflow files that share a listed name;
- any other workflow that defines a job or step named `ci-ok` (impostor).

It is not added to an existing PR job in this wave. A new failing step in an existing mandatory job changes what that
job enforces, which the W1 rules leave to the lead. Run it locally (or in a later wave's lint job) whenever the
manifest or a workflow's `name:`, `on:` or job names change. The evaluator runs the same check on the default branch
on every evaluation, so drift that reaches the default branch shows up as NOT OK.

## Review findings (REVIEW-ci-ok.md) and v2

| Finding | Status in v2 |
|---|---|
| F1 PR controls its own gate | Fixed for the evaluation: `workflow_run` runs the default branch's definition, script and manifest, and pull_request jobs named `ci-ok` are flagged as impostors. Not yet a PR check (see below). The mandatory jobs themselves still run from the PR's workflow files (CODEOWNERS, below). |
| F2 base re-targeting, bootstrap fallback | Fixed: no fallback; the manifest and script always come from the default branch, so re-targeting the base cannot select another gate (see "Re-targeting the base" below). |
| F3 waiting jobs hold runner slots | Fixed: one short job per completion, no waiting. |
| F4 stale verdict after re-runs | Fixed: every completion, including re-runs, re-evaluates; the latest ci-ok run is the verdict. |
| F5 another PR's run on the same SHA | Partly fixed: runs that list only other PRs are ignored when the PR number is known, except PRs from the triggering run's own head branch and repository (closed PR, same-branch follow-up PR). Two open PRs from the same head branch still cannot be separated (GitHub lists both on each run), and fork PRs (no number) fall back to the head SHA, reported. |
| F6 duplicate names | Fixed: all must succeed. |
| F7 API errors crash | Fixed: retried within a deadline, `Retry-After` honored, reported as `api error` NOT OK, exit 0 in report-only. |
| F8 fail-open manifest states | Fixed: NOT OK in the evaluator, exit 1 in `--self-check`, self-check of the default branch on every evaluation. |
| F9 two-step manifest changes | Open (unchanged, procedure below). The manifest is now the default branch's current one, not a fixed base SHA. |
| F10 merge queue, other apps' checks | Open (enforcement precondition). |
| F11 changed-file caps | Open (unchanged). |
| F12 glob escapes | Open (unchanged; no filter uses them). |
| F13 gate's own file is a blind spot | Fixed: `ci-ok.yml`'s pull_request jobs are reported like any other. |

### Re-targeting the base (`edited`)

The v1 gate ran on `pull_request` without `edited`, so a PR first opened against a branch without ci-ok (or with a
weak manifest) could pick its own script and manifest through the bootstrap fallback, and keep that green check after
its base was changed to `master`. With `workflow_run` the gate no longer depends on the PR's base at all: the script
and manifest are always the default branch's, and there is no fallback. Changing the base does not re-run the
listed workflows (they do not trigger on `edited` either), so the verdict stays the one computed for the head SHA,
which is the same per-SHA behavior as any native check. Resolved by `workflow_run`.

## Why report-only

A required check that is wrong blocks every merge in the repository. Before `ci-ok` can be required it must be shown
to agree with reality: the manifests were written by hand in W0, path filters and re-runs are subtle. In report-only
mode the job exits 0 whatever the verdict; the verdict is the job summary of the latest ci-ok run for the head SHA.

**Where the verdict lives**: in v3, the check run `ci-ok` on the PR head SHA, in the PR's checks list (see "v3
changes"). The job summary of the newest run named `ci-ok for <head SHA> ...` (job `ci-ok evaluate`) still has the
same table.

## What remains before enforcement

1. **Post the verdict to the head SHA.** Done in v3 (merged in studio as the pilot; the live proof, pending, then NOT OK, then OK on a test PR, is recorded in STATUS.md).
   The `workflow_run` job creates a check run named `ci-ok` on
   `workflow_run.head_sha` (`POST /repos/{repo}/check-runs`, `checks: write`), updated by each evaluation. `checks:
   write` is a new permission and needs Peter's approval. (A commit status with `statuses: write` would also work, but
   any workflow with `statuses: write` could forge it, so a check run is preferred.) The job must still never check out
   or execute PR code.
2. **Pin the required check to its app.** In branch protection or the ruleset, require `ci-ok` from the GitHub Actions
   app only, so that a commit status with the context `ci-ok` or a check from another app cannot satisfy it.
3. **CODEOWNERS for `.github/**`** with "Require review from Code Owners". This is the only control against a PR
   that weakens the mandatory jobs themselves (they still run from the PR's workflow files). Also "Require approval for
   all outside collaborators" for fork runs.
4. **Merge queue decision (F10).** Either no merge queue (record it as a precondition), or add `merge_group` handling.
   Inventory the currently required checks per repository, including checks from other apps, before removing any.
5. **Evidence.** Compare ci-ok's verdict with the actual merge decision on real PRs for a meaningful period (for example
   two weeks across all ten repositories). Every NOT OK on a PR that was merged green is a manifest error or a bug.
6. Then set `CI_OK_ENFORCE: "1"`, make `ci-ok` required, and only then consider removing the individual required checks.

Until step 1, under enforcement a PR whose listed workflows never complete (for example a PR that renames a listed
workflow's `name:`, so that its completions no longer trigger ci-ok) would simply have no verdict. With a required
check that is "missing", not "green", so this fails closed once step 1 exists.

### Changing the manifest (F9)

Renaming or removing a mandatory job: first merge a PR that changes the manifest (and, if a workflow's `name:` changes,
the `workflows:` list in `ci-ok.yml`; the self-check enforces both), then the change. A PR that does both at once is
judged by the default branch's manifest and reports the renamed job as `missing`.

## Dry runs (v1 evidence, 2026-11-07, `--once` against finished PRs, local manifest with the W1 additions)

These ran the v1 script; the verdict logic for these cases is unchanged in v2.

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

## Cost

v1 held one `ubuntu-latest` runner per PR head for the whole CI span (about 20,600 runner minutes in 14 days across
the ten repositories, about one of the account's 20 concurrent slots on average, more in peaks). v2 runs one job of
seconds per completed listed workflow (studio: five per PR push, the other repositories one or two). Runner time per
push drops from the CI span (4 to 46 minutes) to well under a minute in total, and no job waits.

API budget per evaluation: one or two runs calls, one jobs call per run on the head SHA, one or more changed-files
calls (studio: about ten requests). `GITHUB_TOKEN` allows 1,000 requests per hour per repository.

## Known limits

- Changed files: `pulls/{n}/files` returns at most 3,000 files; the compare fallback returns at most 300 (F11).
- The minimal YAML reader handles the `on:` shapes these repositories use (block or flow lists, quoted or plain
  scalars, comments). Anchors, multi-line scalars or `on:` written as a flow mapping are reported as unreadable by
  `--self-check` instead of being guessed.
- A job whose name is computed at runtime differently from the manifest is `missing` plus `unlisted`, by design.
- Advisory status is taken from the manifest, not detected.
- `workflow_run` starts only once `ci-ok.yml` (v2) is on the default branch; until then nothing runs. A change to it
  can only be observed after merge.
- The script's own tests no longer run in CI (v1 ran them in the ci-ok job, from the PR's copy during bootstrap). Run
  them locally on every change to the script; a later wave can add them to a lint job.
- The verdict reflects the API at evaluation time. A completion event that arrives before the API shows the run's
  final job conclusions would give a stale PENDING; the next completion (or a re-run of ci-ok) refreshes it.
- Unit tests: `python3 -I -m unittest discover -s .github/scripts -p test_ci_ok.py` (or
  `python3 .github/scripts/test_ci_ok.py`). `python3 -m unittest .github/scripts/test_ci_ok.py` does not work, because
  unittest turns the path into the module name `.github.scripts.test_ci_ok`.

## Local dry run

```
GH_TOKEN=$(gh auth token) python3 .github/scripts/ci_ok.py --repo peterkarlhuber/<repo> --pr <n> \
  [--head-sha <sha>] [--root .] [--manifest-file .github/ci-manifest.json] [--json out.json]
```

It evaluates once, like the workflow. `--head-sha` alone evaluates a SHA without a PR number. `--once` is accepted for
compatibility with v1 and does nothing.

# Independent review: `ci-ok` gate (CI-FAST W1) before enforcement

Reviewed on 2026-11-07, read-only. Material: `nodestro-studio` branch `claude/project-thread-0mzbop`:
`.github/workflows/ci-ok.yml`, `.github/scripts/ci_ok.py`, `.github/scripts/test_ci_ok.py`, `.github/ci-manifest.json`,
`docs/architecture/ci-fast/ci-ok.md`. Script, test and workflow are byte-identical in all ten repositories (checked by
md5). Manifests of all ten were read; all path filters include their own workflow file (good, see F-OK-2).

Unit tests: `python3 -I -m unittest discover -s .github/scripts -p test_ci_ok.py` -> **43 tests, OK**.
Extra throwaway probes (scratchpad `review_probe.py`, 8 tests, all confirm the behaviour described below):
duplicate job name masks a failure; another PR's run on the same SHA decides; an API 4xx/5xx crashes `main()` with a
traceback (non-zero exit even in report-only); path-filtered workflow without `path_filters` counts as OK; an empty
manifest gives OK; `\[`-escaped glob patterns do not match.

## Verdict

**NOT ACCEPTED for enforcement** (fine to keep running report-only).

The verdict logic itself (conclusions, `filter=latest`, newest run wins, path filters, advisory, base manifest) is
careful and well tested. But the two properties that make a single required check safe are not there yet:

1. **It is not tamper-proof.** Under `pull_request`, GitHub runs the workflow file *from the PR*. Taking the script and
   the manifest from the base commit therefore protects nothing: the PR can change the step that runs them, the
   `CI_OK_ENFORCE` value, or simply replace the job with `exit 0` under the same name.
2. **It is not robust against the platform.** Waiting jobs hold runner slots out of a shared 20-slot pool, and with
   enough PRs open at once they can starve the very jobs they wait for. Transient API errors also crash the job, and a
   verdict goes stale after a re-run.

Enforcing it as the only required check would make merges *less* protected than today's individual required checks
(F1, F4, F5) and would add a repository-wide way to block merges (F3).

## Findings

Severity: **Critical** = bypass or wrong OK under enforcement; **High** = wrong verdict or merge blockage likely in
normal operation; **Medium** = wrong verdict in plausible edge cases or significant operability problem; **Low** = minor.

### F1 (Critical): a PR controls its own gate, because `pull_request` runs the PR's copy of `ci-ok.yml`

- Where: `.github/workflows/ci-ok.yml:9-11` (trigger), `:32-56` (base vs PR checkout and script choice), `:72`
  (`CI_OK_ENFORCE: ""`), `:23` (job name); `ci_ok.py:725`.
- Scenario: for `pull_request` events, GitHub uses the workflow definition from the PR's merge commit, for same-repo
  branches and for forks alike. A PR can:
  - replace the last step with `run: true`, or set `CI_OK_ENFORCE: ""`, or add `--manifest-file pr/.github/ci-manifest.json`,
    or point `SCRIPTS` at `pr/.github/scripts`. The check `ci-ok` stays green.
  - keep `ci-ok.yml` untouched and add a new workflow with a job `name: ci-ok` that passes immediately. The required
    check matches by name, so two check runs named `ci-ok` exist on the head SHA. Which one branch protection uses is
    order-dependent (the most recent one of that name).
  - from a same-repo branch, add a workflow with `permissions: statuses: write` that posts a commit status with the
    context `ci-ok` and state `success`. A required check whose source is "any" accepts it.
- The comment "so that a PR cannot weaken its own gate" (`ci-ok.yml:32`, design note "What it checks") is therefore
  wrong as written. `load_base_manifest` only prints a notice when `ci-ok.yml` changes (`ci_ok.py:374-376`), and it
  prints that notice from the script the PR may have swapped.
- Related, and inherent to any `pull_request` CI: the mandatory jobs themselves run from the PR's workflow files. A PR
  can add step-level `continue-on-error: true` to a test step, or replace a job's steps with `run: true` under the same
  name. ci-ok checks names and conclusions, not content. The base manifest protects the *list*, not the *checks*.
- Fix (all of them are needed, because no single one closes every path):
  1. Move the verdict out of PR-controlled YAML. Use the `workflow_run` variant from the design note (the workflow file
     comes from the default branch) and have it post the result to the head SHA. It needs `checks: write`
     (preferred: a check run whose source app is fixed) or `statuses: write`. Or use `pull_request_target`, which also
     takes the workflow from the base branch. Before relying on it, verify on a test PR that its check run attaches to
     the PR head SHA and can be selected as a required check. Neither variant may check out or execute PR code.
     Repository rulesets "Require workflows to pass" would also solve this, but they appear to need an organization,
     and these repositories are under a user account.
  2. In branch protection or the ruleset, pin the required check's source to the expected app (GitHub Actions). That
     rules out commit statuses with the context `ci-ok`.
  3. Fail closed on impostors. In the evaluator, any job named `ci-ok` in a workflow other than the gate's own is
     NOT OK. In `--self-check`, any workflow other than the gate's that defines a job or check named `ci-ok` is a
     problem.
  4. Add `CODEOWNERS` for `/.github/**` and turn on "Require review from Code Owners". This is the only control that
     covers weakening the mandatory jobs themselves.
  5. Turn on "Require approval for all outside collaborators" for fork workflow runs.

### F2 (High): re-targeting the base branch keeps a green verdict, and the bootstrap fallback lets a PR supply its own manifest and script

- Where: `ci-ok.yml:11` (types without `edited`), `:48-56` (falls back to the PR's script when the base has none);
  `ci_ok.py:361-368` (falls back to the head's manifest on a 404 at the base).
- Scenario: open the PR against a branch whose commit has no `ci_ok.py` or `ci-manifest.json`, such as any branch cut
  before W1 or a scratch branch. ci-ok then runs the PR's own script with the PR's own manifest, for example
  `{"pull_request": {}}`. An empty manifest gives `OK` (probe). Then edit the PR and change its base to `master`. The
  `edited` event does not re-trigger ci-ok, and the check run on the head SHA stays `success`, so it satisfies the
  required check on `master`. Native checks are also per-SHA, but they at least ran the real tests. Here the gate
  itself was chosen by the PR.
- Fix: add `edited` to `types` (and re-evaluate when `changes.base` is set). Under enforcement, remove both bootstrap
  fallbacks: no base manifest or base script means NOT OK. Re-read the PR at the end (`GET /pulls/{n}`) and fail when
  `base.ref` or `head.sha` no longer match what was evaluated. Treat "no counting rows" as NOT OK.

### F3 (High): waiting jobs can deadlock the shared runner pool and turn every ci-ok red

- Where: `ci-ok.yml:24-26` (`ubuntu-latest`, 100 min), `ci_ok.py:772-793` (polling loop); design note "Cost".
- Scenario: the account has 20 concurrent job slots shared by ten repositories, and each waiting ci-ok holds one. A
  wave of PRs (pin bumps across all repositories, agent threads pushing in parallel) puts many waiting ci-ok jobs in
  front of the real CI jobs, which then queue. With about 20 PRs open, no slot is left at all. Each ci-ok then reaches
  90 min, reports `timed out (ci-ok)` and goes NOT OK. Under enforcement, every PR in every repository is blocked until
  someone re-runs them by hand, and the re-runs hold slots again. The design note describes the peak cost but not this
  feedback loop.
- Fix: no waiting job. The `workflow_run` variant (short `--once` evaluation on every completion; the latest
  completion decides) fixes this and F1 together. Until then, at least use a self-hosted or lightweight runner that is
  outside the shared pool, or cap the number of waiting ci-ok jobs.

### F4 (High): the verdict goes stale after re-runs (the race the brief asks about)

- Where: `ci-ok.yml:9-11` (only `pull_request`), `ci_ok.py:566-568` (fail-fast is final).
- Scenario A (wrong OK): ci-ok finishes OK. Someone then re-runs a mandatory job or the whole workflow, for example to
  investigate a flaky test, and it fails. The PR's head now has a failed mandatory job, but `ci-ok` stays `success`.
  If the individual required checks have been removed (step 3 of "How to enforce later"), the PR can merge.
- Scenario B (wrong NOT OK, operational): fail-fast ends ci-ok at the first failure. "Re-run failed jobs" then makes
  the CI green, but ci-ok stays red until someone also re-runs ci-ok by hand. Under enforcement this happens on every
  flaky failure.
- Scenario C: ci-ok ends OK while a path-filtered workflow that GitHub runs "anyway" (filter broadened in the PR) has
  not created its run yet. The run is never judged. This is by design, since the base filter says it was not needed,
  but it is worth knowing.
- Fix: re-evaluate on completion events (`workflow_run: completed`, or `check_suite`/`check_run`) and post the latest
  verdict, the same design as F1/F3. Until then, keep the individual required checks alongside ci-ok.

### F5 (Medium): another PR's run on the same head SHA can decide this PR

- Where: `ci_ok.py:411-430` (selects runs by `head_sha` and `event` only; the newest wins).
- Scenario: the same commit is the head of two PRs, for example a branch opened against `master` and against a
  release branch, a stacked PR, or a fork PR plus a same-repo PR. A `pull_request` run tests the merge commit with that
  PR's base, so the results can legitimately differ. ci-ok for PR A takes the newest run of `ci.yml` with that SHA,
  which may belong to PR B: an OK for a failed PR, or the reverse. Confirmed by probe.
- Fix: keep only runs that belong to this PR: `run.pull_requests[].number == pr_number` when the list is non-empty, and
  for forks, where it is empty, `head_repository.full_name` and `head_branch` must equal the PR's `head.repo` and
  `head.ref`. Report runs that cannot be attributed instead of counting them.

### F6 (Medium): duplicate job names inside one workflow mask failures

- Where: `ci_ok.py:441-442` (`snap.jobs[(workflow, name)] = job`, the highest job id wins).
- Scenario: two jobs in one workflow end up with the same check name. That can happen through a reusable workflow
  called twice, a matrix whose `name:` template collapses (`name: test` with a matrix), or a copy-paste
  `name:`. Only the job with the higher id is judged. A failed `lint` plus a successful `lint` gives OK (probe).
- Fix: keep a list per (workflow, name). Use all-must-succeed (the safe choice) or report the duplicate as NOT OK
  under enforcement.

### F7 (Medium): API errors crash the job instead of failing closed in a controlled way, and report-only can go red

- Where: `ci_ok.py:314-330` (4xx other than rate limit -> `ApiError`; 5xx and network errors -> `RuntimeError` after
  4 tries over about 50 s), `:346-353`, `:380-388`, `:410-443`, `:772-793` (no handling in the loop), `:821`.
- Scenario: one 502 or a short network blip in the middle of a 60-minute wait gives a traceback and exit 1. In
  report-only mode that makes the job red, which contradicts "the job stays green". Under enforcement it is a spurious
  red that needs a manual re-run. A 404 on a jobs URL, for example a run deleted while ci-ok polls, also crashes.
- Rate limit: up to 4 sleeps of at most 600 s each (`:320-326`), then a crash. `Retry-After`, used for secondary
  limits, is ignored, and the sleeps can push the job past `timeout-minutes: 100`, which ends as `cancelled`. The
  polling also draws from the same 1,000 requests per hour per repository that other jobs' `GITHUB_TOKEN` calls use.
- Fix: catch errors per poll, log them, and keep polling until the deadline. Fail closed only at the deadline, with a
  clear `api error` state. Honor `Retry-After`. Count rate-limit waits against the script's own deadline. Without
  `CI_OK_ENFORCE`, always exit 0.

### F8 (Medium): manifest-driven fail-open states

- Where: `ci_ok.py:494-507` (path-filtered without `path_filters` gives `ok=True`), `:563-573` (zero counting rows
  gives `OK`), `:44` plus the advisory handling (an advisory entry is never counted).
- Scenario: a base-manifest error (a workflow under `pull_request_path_filtered` without a filter entry, an empty list,
  or an over-broad `advisory`) silently turns a gate off. The self-check catches some of these, but only as warnings,
  and only on the PR tree, not on the base manifest that actually decides.
- Fix: under enforcement, treat these as NOT OK, not as OK: a missing filter, no counting rows, or a base manifest that
  fails the self-check. Run the self-check against `base/` as well, and fail when the base is inconsistent.

### F9 (Medium): manifest changes need a two-step merge, and the base manifest is fixed by the event payload

- Where: `ci_ok.py:356-377`, `:751`.
- Scenario: a PR that legitimately renames or removes a mandatory job, or a matrix entry, can never pass. The base
  manifest still lists the old name, so it is `missing`. The procedure is: first merge a manifest-only PR (which drops
  the requirement for everyone in the meantime), then the change. Conversely, `base.sha` comes from the event payload.
  A ci-ok re-run after the manifest on `master` gained a new requirement still uses the old manifest. Not unsafe, but
  under enforcement it creates admin-bypass pressure.
- Fix: document the two-step procedure. Optionally allow a removal only when the base manifest itself lists a
  `deprecated` entry. On a re-run, re-read the current base SHA from the API.

### F10 (Medium): no `merge_group` trigger, and no checks from other apps

- Where: `ci-ok.yml:9-11`; `ci_ok.py:421-423` (only `.github/workflows/*` Actions runs; `dynamic/...` runs such as
  CodeQL default setup or Dependabot are ignored, and not even reported as unlisted).
- Scenario: if a merge queue is enabled with ci-ok required, queue entries wait forever. If branch protection today
  requires a check from another app (CodeQL, external CI, statuses) and step 3 removes it in favour of ci-ok, that
  check silently stops being enforced.
- Fix: before enforcement, inventory the current required checks per repository and either add them to the manifest
  (with a check-runs/statuses evaluator) or keep them required. Add `merge_group` support, or record "no merge queue"
  as a precondition.

### F11 (Low): changed files are capped and approximated

- Where: `ci_ok.py:380-394` (`pulls/{n}/files` up to 3,000; the compare fallback is not paginated, so at most 300).
- Scenario: a PR with more than 300 changed files, where the only matching file is beyond the first 300 and the
  path-filtered run is missing for another reason. The verdict is `not triggered (paths)`, OK. That is rare, and
  GitHub's own filter also looks at only 300 files.
- Fix: when more than 300 files changed, treat path-filtered workflows as required, which fails closed.

### F12 (Low): glob escapes are not handled

- Where: `ci_ok.py:80-88`. `\[` and similar escapes are not supported (probe: `docs/\[x\].md` does not match
  `docs/[x].md`). No current filter uses them; the self-check would not notice.
- Fix: handle `\x` as a literal, or reject backslashes in `path_filters` in the self-check.

### F13 (Low): the gate's own workflow is a blind spot

- Where: `ci_ok.py:41`, `:558`, `:642`. Any job added to `ci-ok.yml` is neither expected nor unlisted, and the
  self-check skips the file. Combined with F1, `ci-ok.yml` is the natural place to hide things.
- Fix: exclude only the gate job itself (by run id `GITHUB_RUN_ID`), not the whole file.

### Things that are right (keep them)

- F-OK-1: `skipped`, `neutral`, `cancelled`, `action_required`, `stale` are NOT OK, and a run that finished without
  the job is `missing (run …)`. Reading jobs with `filter=latest` plus "newest run per workflow" handles re-runs and
  close/reopen correctly (tests at `test_ci_ok.py:303`, `:313`). The cache key includes `run_attempt` and
  `updated_at`.
- F-OK-2: every `path_filters` entry in all ten manifests includes its own workflow file. A PR that edits or deletes a
  path filter (or the workflow) therefore counts as "should have run": `missing`, NOT OK. Path-filter weakening is
  caught.
- F-OK-3: only `event == pull_request` runs count, so `push` and `workflow_dispatch` runs on the same SHA cannot
  satisfy the gate (`ci_ok.py:419`, test `:264`). Matching is by workflow *file* plus exact name, so the same job name
  in another workflow cannot stand in (test `:255`).
- F-OK-4: token scope is minimal (`contents: read`, `actions: read`, `persist-credentials: false`). PR content is only
  parsed (JSON plus a text-based YAML subset), never executed, except in the bootstrap path (F2), and even there with
  a read-only token.
- F-OK-5: concurrency `ci-ok-<PR>` with cancel-in-progress is correct: a superseded wait is cancelled, and a reopen on
  the same SHA replaces the earlier ci-ok check run.

## What must be true before enforcement

1. **The verdict is computed by a workflow definition the PR cannot change** (F1): `workflow_run` or verified
   `pull_request_target`, with no PR code executed. It posts a check run (`checks: write`) or a status
   (`statuses: write`) to the head SHA. The required check is pinned to its source app in branch protection.
2. **Impostor detection**: any other `ci-ok` job or check on the head SHA makes the verdict NOT OK. `CODEOWNERS`
   covers `/.github/**`, and "Require review from Code Owners" is on. "Require approval for all outside collaborators"
   is on for fork runs.
3. **No waiting runner slot** (F3), or ci-ok runs outside the shared 20-slot pool.
4. **The verdict is refreshed on every CI completion and re-run** (F4), and it is computed only from runs attributed
   to this PR (F5).
5. **Fail closed everywhere under enforcement**: no bootstrap fallbacks, no OK on an empty or inconsistent base
   manifest, duplicate names judged all-must-pass, API errors retried until the deadline (F2, F6, F7, F8). Report-only
   mode always exits 0.
6. **Base re-targeting re-triggers the gate** (`edited`), and the final check confirms that base and head are still
   the evaluated ones (F2).
7. **An inventory of the currently required checks** (including other apps), and a decision on the merge queue
   (F10). Keep the individual required checks until (1) to (6) are done and the evidence from step 1 of "How to
   enforce later" shows zero unexplained disagreements over a meaningful period, for example two weeks across all ten
   repositories.
8. **Unit tests for every item above**, including the probes in this review: duplicate names, a foreign PR on the
   same SHA, API error mid-wait, empty manifest, impostor `ci-ok` job.

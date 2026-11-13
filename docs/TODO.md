# TODO: nodestro-studio

> Open work for this repository: release blockers, known bugs, security follow-ups, technical debt and planned improvements.
> GitHub issues are the source of truth for details; this file is the entry point and summary.
>
> **Last full review:** 2026-11-07 against master at f69020a (TODO abatement round)

## Summary

| Priority | Count |
|---|---|
| P0 Critical | 0 |
| P1 High | 0 |
| P2 Medium | 3 |
| P3 Low | 10 |
| P4 Optional | 4 |

**Release blockers:** None for this repository; every entry below is not a release blocker. The next desktop
preview is gated by nodestro-desktop DSK-001 (new candidate and Go/No-Go), not by an item here.

The studio is in a good state after the UX initiative (studio #61 to #80) and UX round 3 (#123, #125): the independent
final review accepted it with conditions that #79 addressed, and master CI is green. What remains is a backlog of
usability and accessibility follow-ups, the editor's main-thread cost, a similarity hint that waits for the runtime
(RT-041) and the platforms nobody has tested yet. The portable export dialog (#121)
is covered by the independent review tracked in nodestro-api API-054.

## Priorities and statuses

- **P0 Critical**: data loss, security exposure, or broken core function; blocks any release.
- **P1 High**: blocks a planned release or a promised capability, or a significant risk.
- **P2 Medium**: real defect or gap with a workaround; schedule soon.
- **P3 Low**: minor defect, polish, or small debt.
- **P4 Optional**: improvement idea; not a defect.

Statuses: `Open`, `In progress` (PR linked), `Blocked` (names the blocker), `Needs decision` (owner decision pending),
`Needs external review`, `Accepted risk` (deliberately not fixed; reason stated).

## Release blockers and critical items

None known.

## Security

Two items need an independent security review; their full entries live in the owning repositories:
nodestro-runtime RT-001 (tool approvals, `NODESTRO_TOOL_APPROVALS` stays off; includes the studio approval surfaces)
and nodestro-api API-054 (portable export, api #85 with the #87 hardening, including this repository's export dialog
from #121). Both have status `Needs external review`.

## Bugs and reliability

## Architecture and modularity

## Performance

### ST-004 · Editor main-thread cost under CPU throttling (F3)

- **Priority:** P3 Low · **Status:** Open (needs a quiet machine to measure) · **Refs:** #84, final UX review F3,
  `frontend/e2e/perf-editor.mjs` (`npm run perf:editor`)
- **What:** Opening a 9-node workflow under CPU 4x: mount 1884 → 1335 ms and total blocking time 1557 → 956 ms after
  UX round 2; still above the 50 ms long-task budget. The TODO rounds of 2026-11-06 mounted the editor's dialogs only
  on their first opening, preloaded the editor chunk when the pointer or focus reaches a workflow, and moved the
  number formatters (the first `Intl.NumberFormat`, 53–60 ms) to idle time. A profile (`--profile`, unminified
  build) puts 574 of 665 ms of long tasks into script (React's first render of the editor and the evaluation of its
  chunk), 83 ms into layout and about 72 ms into React Flow's node measuring. Every A/B comparison so far (three
  rounds, median of 7, CPU 4x) moved by less than the run-to-run noise of the shared development VM (mount 716–881
  ms, TBT 391–534 ms), so a change cannot be shown to help there.
- **Why open:** the remaining candidate, rendering the inspector, the side panels and the run views after the canvas
  is painted (`startTransition` or lazy panels), trades blocking time for a visible layout shift of the panels; it
  is worth it only if a measurement on a quiet machine shows a clear gain.
- **Next step:** On a quiet machine (no other jobs, fixed CPU frequency): `npm run perf:editor -- --runs 15` on
  master for a baseline, then with the panels deferred; keep the change only if TBT drops clearly beyond the spread
  of the baseline runs and the panels do not shift the canvas.

## Features and enhancements

### ST-035 · Similarity hint for pasted code in the tool editor (R-4)

- **Priority:** P4 Optional · **Status:** Open (deferred by decision R-4) · **Refs:** ADR-0006 (R-4 amendment),
  nodestro-runtime RT-041
- **What:** Pasted code counts as written by the person; the editor only warns after a paste. Code that resembles
  stored AI-generated code is not pointed out.
- **Next step:** Once the runtime offers a similarity check (RT-041), show it as a hint next to the paste warning.
  It never changes the trust class.

## Tests and quality assurance

### ST-061 · Dependency policy K-33: library copies, vendored checker and CI step (TABRION QA-17, AC-2)

- **Priority:** P2 Medium · **Status:** In progress (part 1: studio #168) · **Refs:** `platform/dependency-policy.json`,
  `scripts/check_dependency_policy.py`, `tests/test_dependency_policy.py`, Tabrion plan 05 section 4.2, 07 section 7,
  13 section 2.2
- **What:** Part 1 (this repository) holds the policy, the checker and the eight negative cases of AC-2. Open: (a)
  each library (tabrion with an empty list, axentra, orkexa, tabrion-studio) and each Nodestro repository carries a
  copy of its outgoing edges and the vendored checker, with a checksum check against this repository; (b) the CI
  `lint` step (`python scripts/check_dependency_policy.py --pinned`) here and in each repository, which needs the
  separate workflow review.
- **Plan note (for the plan owner):** the edge nodestro-api -> `tabrion[testing,postgres]` (`dev` only, same SHA as
  the runtime, RC-2) is in the policy as doc 13 section 2.2 and doc 06 RC-2 require; the edge list in doc 05 section
  4.2 omits it and should list it.
- **Next step:** Part 2 pull requests per repository after QA-16 is merged.

### ST-062 · One tabrion per installation: the checker turns strict with PIN-W1 (TABRION VER-1, QA-15, AC-6)

- **Priority:** P2 Medium · **Status:** In progress (checker and drift report: branch
  `claude/project-thread-bjlq25-chk`) · **Refs:** `scripts/check_versions.py`, `platform/versions.json` (component
  `tabrion`), `tests/test_check_versions_tabrion.py`, `.github/workflows/nightly.yml` (`tabrion-drift`), Tabrion plan
  06 section 6.4 (RC-1, RC-2, RC-7, RC-8), 07 AC-6, 09 VER-1/QA-15
- **What:** `check_versions.py` holds tabrion 0.1.0 final (`d5821fa`) as the one tabrion of every installation:
  libraries by a final range that contains it (RC-1, RC-8), runtime extras and api `dev` on exactly its canonical pin
  (RC-2), one `requirements/tabrion.txt` pin per library on a final commit (an older final of the same minor is a
  warning, RC-7), the K-33 policy for every pinned manifest and no cycle (AC-6). Until the runtime and api carry the
  pin, `pinned_by` in versions.json is empty: a pin that is present is checked, a missing one is not yet an error.
- **Next step:** PIN-W1 (studio step) sets `"pinned_by": ["nodestro-runtime", "nodestro-api"]` in the same PR that
  moves the runtime and api pins to commits with the tabrion pin (MIG-NOD-1), and adds `tabrion` to the runtime and api
  rows of `scripts/bump_pins.py`. Close this entry then.

### ST-053 · ESLint 10 waits for the React Compiler rules of eslint-plugin-react-hooks 7

- **Priority:** P3 Low · **Status:** Open · **Refs:** Dependabot #130 and #131 (closed, dependency round 2026-11-05),
  `frontend/package.json`, `frontend/eslint.config.js`, `.github/dependabot.yml`
- **What:** ESLint 10 (with `@eslint/js` 10) needs eslint-plugin-react-hooks 7: 5.2.0 declares peer `eslint` up to
  `^9`, so `@eslint/js` 10 alone fails `npm ci` (#131). eslint-plugin-react-hooks 7 adds the React Compiler rules to
  `recommended`, and the frontend then reports 46 errors (#130), most of them `react-hooks/set-state-in-effect`
  (for example `welcome/RunIllustration.tsx`, `welcome/motion.ts`). Each one is a behavior question (derive the
  value during render, move it into an event handler, or keep the effect with a reason), not a mechanical fix.
  Dependabot ignores the majors of `eslint`, `@eslint/js` and `eslint-plugin-react-hooks` until then.
- **Next step:** One pull request: eslint-plugin-react-hooks 7, fix or justify each finding with tests, then ESLint
  10 and `@eslint/js` 10 together; remove the three `ignore` rules.

## Platform coverage

### ST-019 · Other browsers and operating systems

- **Priority:** P3 Low · **Status:** Open · **Refs:** final UX review §8, `docs/desktop-server/IMPLEMENTATION_STATUS.md`
- **What:** All checks ran in Chromium on Linux. Firefox, Safari/WebKit, Windows, macOS and real mobile devices are
  untested; `scripts/e2e.sh` supports `E2E_BROWSER=firefox|webkit`, but CI runs Chromium only. Since 2026-11-01 the
  frontend build and unit tests also run on `macos-latest` (`.github/workflows/macos.yml`), and every PR fails on
  file names that differ only in case (`scripts/check_case_collisions.py`). Since 2026-11-02 the `Platforms`
  workflow starts the studio (API, settings, interface) on macOS arm64 and x86-64, Windows x64 and ARM64 and Linux;
  the interface itself has not been used in a browser on macOS or Windows. The `Docker` workflow runs AI-generated
  code in a real engine on Linux and macOS Intel (ST-033).
  Since the TODO round of 2026-11-06 the CI job `browser-engines` (non-blocking) runs `welcome`, `a11y` and
  `settings-ui` in Firefox and WebKit. Firefox passes them. WebKit's renderer crashed in `welcome` in about half of the
  runs: the welcome logo's intro animated a blur filter on a 3D-transformed layer, which WebKitGTK without a GPU (the
  CI runner, and the Linux desktop app on such machines) crashed on in about 1 of 12 page loads under load; without
  the animated blur 0 of 180 loads crashed and the suite passed 3 of 3 times on one CPU core. WebKit confirmed that
  the desktop-style launch (a meta refresh to `/`) opens the welcome page (former ST-034).
- **Next step:** Make `browser-engines` blocking once it is green on a few PRs in a row; run the remaining suites once
  in Firefox and WebKit.

### ST-020 · Assistive technology, zoom, motion and contrast checks

- **Priority:** P3 Low · **Status:** Open · **Refs:** final UX review §4 and §8
- **What:** Accessibility was checked with axe and DOM inspection only: no screen reader (NVDA, JAWS, VoiceOver,
  TalkBack), no 200/400 % zoom, no forced-colors pass, and 105 contrast nodes axe could not decide.
- **Next step:** One manual pass with a screen reader and browser zoom on the main journeys; review the undecided nodes.

### ST-021 · Server profile in the browser and real providers

- **Priority:** P3 Low · **Status:** Open · **Refs:** final UX review §8
- **What:** Sign-in, roles, workspaces and the read-only notice were checked in code and by API probes, never in a
  browser against a server; provider failure texts and "Test connection" were never exercised with a real provider.
- **Next step:** A browser pass against the nodestro-server development stack; a provider smoke test once a key with a
  spend limit is approved.
- **Depends on:** nodestro-server (development stack).

### ST-022 · Moderated user tests

- **Priority:** P4 Optional · **Status:** Open · **Refs:** evolution plan D7, `docs/evolution/journeys.md`
- **What:** Journeys are scripted and measure interface cost only; no moderated test with 3 to 5 people has been run,
  so no usability claim is made.
- **Next step:** Arrange moderated tests when participants are available.

## Documentation

## Technical debt

### ST-027 · `products` in `platform/versions.json` is stale

- **Priority:** P3 Low · **Status:** Open · **Refs:** `platform/versions.json`, backend audit round 3 OPS3-06 (product
  pins moved in this round; the block itself was not touched or checked)
- **What:** It still lists desktop `67122b7` / server `5bc7b82` built from studio `78710ce` as candidate
  v0.2.0-preview.1, a candidate that is frozen, NO-GO and not published (nodestro-desktop DSK-001); there is no
  nodestro-local-docker entry.
  Its comment says the block is "updated when a product's studio.json moves", which no longer happens (the products
  were re-pinned to newer studio commits without touching it), and `scripts/check_versions.py` does not check the block.
- **Why it cannot track the products:** each product pins a studio commit (`studio.json`; local-docker's
  `components.json` also pins nodestro-server), so a studio commit can never name the product commits that pin it;
  on 2026-11-07 desktop, server and local-docker master all pin studio `f69020a`. Nothing reads the block
  (`scripts/check_versions.py`, `src/` and `tests/` do not), so it can only record release candidates.
- **Next step:** With the next candidate (or now), reword the comment to "the last built and checked release
  candidate of each product and the studio commit it was built from; not a pin, not updated when a product's
  studio.json moves", mark the v0.2.0-preview.1 entries as NO-GO (DSK-001) and add local-docker with its first
  candidate, or drop the block (owner's choice). The edit belongs to the thread that holds the pin slot, not to a
  TODO worker (`platform/versions.json` is lead-only). (Backend audit 2, integration run.)

### ST-028 · Third-party Python dependencies are not locked

- **Priority:** P3 Low · **Status:** Open · **Refs:** backend audit D-05, `pyproject.toml`
- **What:** Components are pinned by commit, but their third-party dependencies are resolved at install time, so studio
  installs (and the server and desktop builds made from them) are not reproducible.
- **Next step:** Decide on a constraints or lock file for the platform install, together with the other Python repos.
- **Depends on:** the same decision in nodestro-runtime RT-023 and nodestro-server SRV-014 (desktop builds from the studio pins).

### ST-052 · Dependency updates: weekly Dependabot pull requests, merged by hand; branch protection

- **Priority:** P3 Low · **Status:** Decided (owner, 2026-11-05), not implemented · **Refs:** `.github/dependabot.yml` in every Nodestro
  repository; dependency round 2026-11-05 (thread "Clean up Dependabot PRs and update strategy")
- **What:** Owner entry for the Nodestro repositories (the others point here). Every repository gets weekly, grouped
  Dependabot pull requests with a small limit: one group for GitHub Actions (pinned by commit SHA), one group per
  ecosystem for minor and patch updates, each major alone. A cooldown of 3 days (7 for npm, pip and Cargo majors; Dependabot allows only `default-days` for
  GitHub Actions and Docker) holds back brand-new
  releases; security updates are not delayed. Majors that are known not to work are ignored with a reason next to
  the rule and an entry in that repository's TODO (studio: TypeScript, ESLint 10 and
  eslint-plugin-react-hooks 7 ST-053; sdk: TypeScript,
  `@types/node`, Vitest, SDK-009/SDK-010). Python dependencies are not watched: the Nodestro components are pinned by
  commit and move only with the pin cascade (`scripts/check_versions.py`), and CI's blocking `pip-audit` covers the
  third-party ranges (see ST-028). Dependabot never changes a component pin, `platform/versions.json` or a product
  pin.
  **Owner decision 2026-11-05:** protect `master` in every repository (Nodestro, Orkexa, Axentra) with required CI
  status checks, and block force pushes and branch deletion. The existing coding-agent and pull request flow must
  keep working. Auto-merge stays off for now; merging stays manual after CI (and, for majors, runtime, sandbox,
  security or Docker changes, a review with local tests).
- **Next step:** Separate work order, one repository at a time:
  1. Per repository, pick the required checks: only jobs that run on every pull request to `master` and always
     report. A path-filtered, scheduled-only or matrix job that can be skipped never reports and would block the
     pull request forever; leave such jobs optional or give them an always-reporting summary job.
  2. Ruleset (or classic protection) on `master`: require a pull request and the chosen checks; block force pushes
     and deletion. No required approvals (one maintainer; the standing authorization lets Claude merge after green
     CI), and leave "branches must be up to date" off, so parallel agent PRs and pin cascades do not need a rebase
     loop after every merge. Merge commits stay allowed (pins point at PR-branch commits).
  3. Check that Dependabot PRs and agent PRs (branches `claude/*`) still run and merge, then record the required
     checks in `docs/PLATFORM.md`.
  4. Auto-merge later only if the owner decides again: allow it in the settings, then a workflow that enables it
     (merge commit) only for Dependabot patch/minor updates of development tools and GitHub Actions
     (`dependabot/fetch-metadata`); never for majors, production runtime dependencies, Docker images or pins.
  When the repositories become private, also add `NODESTRO_READ` as a **Dependabot** secret: Dependabot pull
  requests do not receive Actions secrets.

### ST-054 · Node.js 24 LTS as the next common Node.js version (Q1 2027)

- **Priority:** P3 Low · **Status:** Decided (owner, 2026-11-05), planned for Q1 2027 · **Refs:** ST-052, sdk
  SDK-010, server SRV-015, axentra-studio and axentra `docs/TODO.md`; Node.js 22 is supported until 2027-04-30
- **What:** Owner entry for all repositories that use Node.js. The owner chose Node.js 24 LTS as the next common
  target. Today every repository builds and tests on Node 22: studio (CI, `frontend` engines), sdk (CI 20/22,
  engines `>=20`, see SDK-010), desktop (CI), server (`NODE_IMAGE` build stage), axentra (TypeScript SDK, engines
  `>=20`, CI 22) and axentra-studio (CI, engines `>=22.22.0`, build image). Dependabot ignores Node image and
  `@types/node` majors until the switch.
- **Next step:** Separate work order in Q1 2027, after a compatibility check per repository (dependencies' `engines`,
  native modules, Playwright, Vite and Tauri tooling, the server and axentra-studio images). Then one pull request
  per repository that moves CI (`setup-node`), `engines`, Docker build images and runtime configuration together,
  bumps `@types/node` to 24 and removes the matching `ignore` rules. Merge in the usual order; no release.

## Later optimizations

### ST-029 · Evolution backlog after Q-4

- **Priority:** P4 Optional · **Status:** Needs decision · **Refs:** `docs/evolution/README.md` §4 (P3 and later), §8
- **What:** Recorded replay of tool responses in test series, app-builder discovery and the deferred ideas (shadow
  mode, migration studio, knowledge conflict detection) wait for their re-entry criteria and an owner decision.
- **Next step:** Review at the next phase gate; nothing to build until then.

## Accepted risks

### ST-049 · Date fields follow the browser's language, not the interface language

- **Priority:** P4 Optional · **Status:** Accepted risk (native control) · **Refs:** manual review 2026-11-05
- **What:** The native `<input type="date">` and `datetime-local` fields (schedules, price reconciliation, advance
  approvals) show their format and calendar in the browser's or operating system's language; the `lang` attribute
  the studio sets is ignored by Chromium. A German interface in an English browser shows MM/DD/YYYY there.
- **Next step:** None planned: a custom date picker is a new component with its own accessibility work. Revisit only
  if users report it; the stored value is ISO in every case.

### ST-030 · MCP limited to the read-only server pilot

- **Priority:** P3 Low · **Status:** Accepted risk · **Refs:** `docs/adr/0007-mcp-client.md`, `docs/mcp/threat-model.md`
- **What:** The MCP interface is accepted only for an isolated, read-only server pilot. Desktop MCP, write tools,
  unattended calls and Nodestro's own MCP server are not released; the residual risks are listed in the threat model.
- **Next step:** Re-evaluate only with a new owner decision and a new security review.

### ST-033 · Docker-first sandbox status in the studio (ADR-0009)

- **Priority:** P2 Medium · **Status:** In progress (UI and pins done, platform run open) · **Refs:** ADR-0009 (status update
  Docker-first, 2026-11-02), orkexa #30/#31, runtime RT-019/RT-033/RT-034, api A1
- **What:** Settings → Sandbox shows the runtime's OS, every backend with its state and why AI-created tools are
  blocked; `auto` runs AI-created code only in Docker (runtime DS-3), the built-in Linux sandbox is the explicit
  `linux` mode, and `subprocess` is for trusted use only. Docker (or a compatible engine that passes Nodestro's
  checks) is the default sandbox on every system. The native macOS sandbox was removed and is
  shown as *Not available* (reason `removed`); Windows has no native sandbox and none is planned.
- **Done:** the Docker status view (engine, rootless/cgroup badges, checks with a reason per failed check, rootful
  note, Check again with polling while `checking` and the page is visible, Run self-test for admins) against
  `GET /api/sandbox/status` and `POST /api/sandbox/self-test`; diagnostics texts `docker.checking`,
  `docker.unavailable`; `platform_smoke.py` asserts the new fields when present. Older runtimes keep the earlier view.
  The `linux` mode, the DS-3 refusal sentences and the DS-13 review (one status for table and notice, throttled and
  ignored checks shown as not run, `redacted`, rootful warning from `rootless`) are done; pins moved to
  nodestro-runtime `bf9af7d` (#85), nodestro-api `dde77f5` (#65) and nodestro-sdk `99f70fe` (#59).
- **Engine checks (2026-11-02):** the engine checks (Orkexa's) ran in CI only on Docker Engine on Linux (rootful
  x86-64 and arm64, rootless x86-64), rootful Podman 4.9.3 and, non-blocking, Colima on macOS x86-64; rootless Podman
  4.9.3 is refused there (limits not applied, orkexa ORK-024); nodestro-runtime's Docker tests run on rootful Docker
  Engine on Linux x86-64 only. Docker Desktop (macOS Apple silicon and Intel, Windows x64 and ARM64), OrbStack, Colima
  on Apple silicon and Podman machine never ran in any CI; Settings → Installing Docker says so in six languages.
  Users who kept `subprocess` from an earlier version get a note in the blocked notice that the mode no longer runs
  AI-created tools and that their choice was kept, and on Linux the Linux sandbox as the other way.
- **Platform evidence (2026-11-02):** the `Docker` workflow (`.github/workflows/docker.yml`,
  `scripts/docker_smoke.py`) runs the whole chain with a real engine: the installed studio detects the engine in
  `auto` mode, `GET /api/sandbox/status` must reach `approved` (preflight and in-container self-test), an
  AI-generated tool comes in through the product's tool job (`POST /api/tools/jobs`, then the decision; the runtime
  classes it `untrusted` itself) and runs in an `orkexa-sandbox-*` container (`docker events`, `docker inspect`
  isolation flags), a call past the 15 s timeout and a canceled workflow run leave no container, and after
  `DOCKER_HOST` points nowhere and after the engine is really stopped the tool and new tool jobs are refused with
  `sandbox.isolation_required` and a `docker-*` reason. Only the AI model is a local stand-in endpoint.
  - **Covered by CI (hosted runners):** Linux x86-64 with Docker Engine (`ubuntu-latest`); macOS x86-64 with Colima
    (`macos-15-intel`, nested virtualization); Windows x64 only as the refusal (`docker unsuitable (windows-latest)`:
    no Linux containers there, untrusted code must be refused).
  - **Not possible on hosted runners, so not in CI:** macOS Apple Silicon (`macos-latest`: no nested virtualization,
    so no Linux VM, neither Colima nor Docker Desktop); Windows x64 and ARM64 with Linux containers (WSL 2 / Docker
    Desktop need nested virtualization the runners lack); Docker Desktop on any system (cannot be installed on
    hosted runners).
  - **Local run (cloud dev VM, rootful Docker 29.9.2, cgroup v1):** preflight passed, the runtime image was built,
    and the self-test correctly refused the engine (`docker-selftest`: "the container is not on cgroup v2"); tool jobs
    were refused with that reason, and the unreachable and really stopped engine (`pkill dockerd`) phases passed.
  - **First CI run (studio #104, 2026-11-02):** every check passed on `ubuntu-latest` (Docker Engine 29.4.2, cgroup v2)
    and on `macos-15-intel` (Colima, cgroup v2): `approved`, the untrusted tool in an `orkexa-sandbox-*` container
    with the isolation flags, no container left after the timeout and after the canceled run, and refusal with the
    engine unreachable and really stopped. `windows-latest` refused with `docker-os-type`.
- **One command for Docker Desktop (2026-11-02):** `scripts/mac_docker_test.sh` / `py -3.13 scripts\docker_test.py`
  (`docs/testing/docker-desktop.md`) installs the checkout's studio into its own environment, runs
  `docker_smoke.py`, prints PASS/FAIL for ten steps and writes a redacted report; the smoke test now looks only at
  its own installation's containers and also checks resource limits, the image architecture, the diagnosis and the
  interface's reason sentences. CI job `one-command` runs the wrapper on `ubuntu-latest` and `macos-15-intel`.
  Locally (cloud dev VM, rootful Docker 29.9.2, cgroup v1) the wrapper detected the engine, installed the studio
  from a clean venv, reported the self-test refusal (`docker-selftest`, steps 3 and 5 to 7 not checked, steps 1, 2,
  8, 9 and 10 passed), stopped with exit code 2 and a plain reason for a missing CLI and an unreachable engine, and
  removed only its own data folder and environment (no other container or image touched). Not yet run on Docker
  Desktop; the real stop/start path (`--stop-docker-desktop`, `--stop-command`) was not run locally.
  - **Open risk, Windows (nodestro-runtime):** the runtime gives the docker CLI only `PATH`, `HOME`, `DOCKER_*` and
    proxy variables (`container_images._cli_environment`), not `USERPROFILE`/`SYSTEMROOT`; on Windows the CLI then
    does not find `%USERPROFILE%\.docker` (contexts, credential helper) and uses the default pipe `docker_engine`.
    The wrapper reports what the CLI sees with that environment (`runtime_env_context`); confirm on Windows.
- **Next step:** run the one command on real hardware: Docker Desktop on macOS Apple Silicon, macOS Intel, Windows
  x64 and Windows ARM64 (Linux containers, WSL 2), and record each report here; then the packaged desktop app
  (nodestro-desktop) on the same systems, which no CI job starts.

## Cross-repository dependencies

| This repo item | Other repo | Other item | Relation |
|---|---|---|---|
| (pointer) | nodestro-runtime | RT-001 (independent S-2 review, includes the studio approval surfaces) | Full entry in runtime |
| (pointer) | nodestro-api | API-054 (independent review of the portable export, api #85/#87, studio #121) | Full entry in api |
| ST-021 | nodestro-server | Development stack | Used for the browser pass |
| ST-028 | nodestro-runtime, nodestro-server | RT-023, SRV-014 (dependency locking, D-05) | One shared decision |
| ST-052 | all Nodestro repositories | Dependabot policy, branch protection decision, auto-merge prerequisites | Owner entry here; the others point to it |
| ST-054 | nodestro-sdk, nodestro-desktop, nodestro-server, axentra, axentra-studio | SDK-010, SRV-015, Node.js 24 entries | Owner entry here; move together in Q1 2027 |
| ST-027 | nodestro-desktop | DSK-001 (new candidate and Go/No-Go) | Update `products` with the next candidate |
| — | nodestro-api | X-03 rest: error responses of published routes and router tags (API-016); X-01 (RT-005, API-018) and the error code list (RT-011) are done | Change lives in api; studio already adapted |

Generated example chapters (`frontend/src/docs/chapters/*/beispiele.md`, between the `examples` markers) come from
nodestro-examples; fix their content there.

## Maintaining this file

- Add an entry when work is identified but not done in the current PR. Use the next free ID; IDs are never reused.
- Link a GitHub issue for anything concrete enough to be picked up; keep details in the issue, not here.
- When an item is finished, delete its entry in the PR that completes it and mention the ID in the PR description.
  Git history is the record; do not keep ticked checklists.
- Accepted risks stay listed with their reason until the risk is removed or re-evaluated.
- Re-review the whole file before each release and update the "Last full review" line.
- Security issues that are not yet fixed are described only in general terms here. Report details privately
  (GitHub private vulnerability reporting), never in this file or in public issues.

## CI access to private repositories

Keep the repository secret `NODESTRO_READ`; do not delete it. CI currently installs the sibling repositories anonymously because they are public, and does not need the secret. When the repositories become private, CI authenticates again with this read-only secret, passed only in the environment of the install steps (never in a global Git configuration, a log or an image layer).

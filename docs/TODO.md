# TODO: nodestro-studio

> Open work for this repository: release blockers, known bugs, security follow-ups, technical debt and planned improvements.
> GitHub issues are the source of truth for details; this file is the entry point and summary.
>
> **Last full review:** 2026-11-05 against `master` at `e46911d` (quality round 3 close-out; TODO consolidated).

## Summary

| Priority | Count |
|---|---|
| P0 Critical | 0 |
| P1 High | 0 |
| P2 Medium | 1 |
| P3 Low | 22 |
| P4 Optional | 11 |

**Release blockers:** None for this repository; every entry below is not a release blocker. The next desktop
preview is gated by nodestro-desktop DSK-001 (new candidate and Go/No-Go), not by an item here.

The studio is in a good state after the UX initiative (studio #61 to #80) and UX round 3 (#123, #125): the independent
final review accepted it with conditions that #79 addressed, and master CI is green. What remains is a backlog of
usability and accessibility follow-ups, cross-repository gaps that wait for backend fields (failure cause, budgets,
example origin), stale status documents and the platforms nobody has tested yet. The portable export dialog (#121)
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

### ST-002 · Dependency audit gates production dependencies only

- **Priority:** P4 Optional · **Status:** Open · **Refs:** backend audit D-04, `.github/workflows/ci.yml`
- **What:** CI runs `npm audit --omit=dev --audit-level=high` (green on master); advisories in development and build
  dependencies are not reported anywhere.
- **Next step:** Add a non-blocking full `npm audit` report to CI, or review dev advisories with each Dependabot round.

## Bugs and reliability

### ST-003 · Runs list and run banner show only "Failed: <step>" (AD-02)

- **Priority:** P3 Low · **Status:** Blocked (needs a run-level cause from the backend) · **Refs:** #81, UX audit AD-02
- **What:** The run detail page derives the failure cause from step data, but the Runs list row and run-level banner
  only know `run.nodes_failed` with step names, so a budget stop or provider failure reads "Failed: Writer".
- **Next step:** Agree a run-level cause field with runtime/api, then render "<step>: <reason>" in the list and banner.
- **Depends on:** nodestro-runtime RT-012 (store the cause on the run), nodestro-api API-018 (expose it in run summaries).

## Architecture and modularity

None known.

## Performance

### ST-004 · Editor main-thread cost under CPU throttling (F3)

- **Priority:** P3 Low · **Status:** In progress (UX round 2 reduced it) · **Refs:** #84, final UX review F3,
  `frontend/e2e/perf-editor.mjs` (`npm run perf:editor`)
- **What:** Opening a 9-node workflow under CPU 4x (median of 5): mount 1884 → 1335 ms, total blocking time
  1557 → 956 ms, longest task 1028 → 756 ms after UX round 2 (fewer re-renders of nodes, panels and the zoom label;
  cached number formatters). Still above the 50 ms long-task budget. UX round 3 re-measured median mount 1650 ms and
  TBT about 1.2 s on a heavily loaded machine (single runs 1159 to 2424 ms, best runs at the round-2 level): no
  regression shown, no low-risk fix found. Mounting closed dialogs only when open would reset text typed into the
  run dialog, so it needs a state decision first.
- **Next step:** Mount closed editor dialogs only when open (about 100 ms at 4x; keep their state semantics), preload
  the editor chunk from the Workflows page, look at React Flow's node measuring (110–180 ms at 4x).

## Features and enhancements

### ST-050 · English labels of local catalog models in every language

- **Priority:** P3 Low · **Status:** Open · **Refs:** manual review 2026-11-05 (internal report §9.8), nodestro-runtime
  `catalog._LOCAL_LABELS`
- **What:** Local catalog models carry runtime labels such as "Qwen3.5 4B (local)" (also English `tier` and
  `description`). The model picker, example needs and preview, architect review, provider settings, docs page and
  orchestration view show them unchanged in all six languages.
- **Next step:** Together with the runtime: drop the "(local)" suffix from the runtime labels and add one studio
  helper that appends a localized marker where `price_status === "local"`; then use it in every place listed above.

### ST-044 · Task-aware model suggestions inside the model picker

- **Priority:** P4 Optional · **Status:** Open · **Refs:** local models work order (2026-11-03)
- **What:** Recommendations per task show in *Settings → Local models*; the agent's model picker shows local models
  with their "no API billing" label but not which one suits the agent's task on this computer.
- **Next step:** Ask `GET /api/local-models/recommend?task=` from the agent inspector (task from the agent's tools
  and output) and show the suggestion with its reasons next to the picker; never change the stored model.

### ST-035 · Similarity hint for pasted code in the tool editor (R-4)

- **Priority:** P4 Optional · **Status:** Open (deferred by decision R-4) · **Refs:** ADR-0006 (R-4 amendment),
  nodestro-runtime RT-041
- **What:** Pasted code counts as written by the person; the editor only warns after a paste. Code that resembles
  stored AI-generated code is not pointed out.
- **Next step:** Once the runtime offers a similarity check (RT-041), show it as a hint next to the paste warning.
  It never changes the trust class.

### ST-036 · Diff against the previous version in the adoption dialog (R-4)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** ADR-0006 (R-4 amendment), `pages/ToolAdoption.tsx`
- **What:** The adoption dialog shows the whole code and tests of the version to adopt. When an earlier version of
  the tool was the person's own (adopted or written in the editor), a diff against it would show what the AI
  changed.
- **Next step:** Needs the tool's version history in the API (`GET /api/tools/{name}` returns only the current
  version); then render a side-by-side or unified diff above the full code.

### ST-007 · "Use sample file" in the run dialog of form examples (OB-13)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit OB-13
- **What:** The prefilled label and the collapsed "more files" area are done; the sample files of an example are still
  only downloadable in the preview, not offered where the run needs them.
- **Next step:** Offer the copy's sample files as one-click inputs once the copy knows its source example.
- **Depends on:** nodestro-runtime RT-055 (origin of an example copy stored on the workflow).

### ST-011 · Field-level diff in the versions dialog (ED-18)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit ED-18
- **What:** "Save and restore" is done; the diff still names only changed steps (`lib/versionDiff.ts`), not which
  fields changed (system prompt, model, tools).
- **Next step:** List changed fields per step with a text diff (`components/TextDiff.tsx` exists).

### ST-013 · Knowledge sources cited in run results (AD-19)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit AD-19
- **What:** Run views have no "sources used" list; knowledge use is visible only indirectly in the Context and Tools tabs.
- **Next step:** Show file and section per agent result from the recorded knowledge tool calls or context.

### ST-014 · Budgets and excluded service costs on the Usage page (AD-20)

- **Priority:** P3 Low · **Status:** Blocked (needs an API field) · **Refs:** UX audit AD-20
- **What:** Usage does not show published-API daily budget use or runs stopped by their budget. (The "not included"
  note for MCP and service fees is shown since UX round 3; web-search fees are priced by Orkexa and included.)
- **Next step:** Add a Budgets card once the API reports budget use.
- **Depends on:** nodestro-api API-017 (budget usage in the usage response).

### ST-015 · New agent defaults: raw `{{input}}` and "Empty template" saving at once (ED-22)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX audit ED-22
- **What:** The default system prompt is localized now, but the task field starts as raw `{{input}}`, and "Empty
  template" on the agent library page persists a template immediately on click.
- **Next step:** Show the input placeholder as a chip with a raw-text toggle; create the template on first save.

### ST-031 · Offline (sample data) badge on example copies (AD-18)

- **Priority:** P3 Low · **Status:** Blocked · **Refs:** UX audit AD-18, nodestro-examples #39
- **What:** Copies of examples whose optional connection is missing run on sample data, but only the copy chooser
  (`frontend/src/library/ExampleSections.tsx`) says so; the editor and run headers show no badge.
- **Next step:** Show a badge in the workflow and run header once nodestro-examples EX-003 has chosen the marker.
- **Depends on:** nodestro-examples EX-003 (marker), nodestro-runtime RT-055 (origin of an example copy).

### ST-032 · Technical field names in the editor palette's team hint (ED-17)

- **Priority:** P4 Optional · **Status:** Blocked (needs an API field) · **Refs:** UX audit ED-17
- **What:** The palette team hint (`frontend/src/editor/Palette.tsx`, `teamHint()`) lists a team's output fields by
  id. Result labels are fixed since UX round 3 (labels come from the description, also inside collected results;
  every long example description starts with a short label, enforced in nodestro-examples).
- **Next step:** Show localized labels once workflow summaries carry the contract descriptions.
- **Depends on:** nodestro-api API-053 (contract descriptions in workflow summaries).

### ST-048 · Local models settings: three small wording gaps

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX round 3 (studio-new N3 findings)
- **What:** An external model server that cannot be reached shows "Stopped" instead of "Not reachable"; on machines
  without a GPU the CPU saving mode sentence appears twice; the tool-agent task has different names in Settings >
  Local models and in an example's model plan. The server-tenant view (no hardware) still words a few hints for "this
  computer", and the `export.server_too_large` sentence mixes MB and GB.
- **Next step:** One status text for unreachable external servers, one CPU sentence, one task name in both places,
  server wording in the tenant view, one size unit (all six languages).

## Tests and quality assurance

### ST-051 · axe-core held at 4.11.0 (WCAG 2.5.3 on the global search trigger)

- **Priority:** P3 Low · **Status:** Open · **Refs:** `d7344ee` (Dependabot #75), `frontend/src/layout/GlobalSearch.tsx`,
  `.github/dependabot.yml`
- **What:** axe-core 4.14 moves `label-content-name-mismatch` (WCAG 2.5.3, label in name) from experimental into
  wcag21a. The a11y e2e suite then fails on all 32 page checks, because the visible text of the global search trigger
  includes the keyboard shortcut while its accessible name does not. axe-core stays at 4.11.0, and Dependabot ignores
  axe-core 4.14 and later (dependency round 2026-11-05), so the minor/patch group is not blocked by it.
- **Next step:** Make the trigger's accessible name start with its visible label (UX decision), move axe-core to the
  newest release, and remove the `ignore` rule.

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

### ST-047 · Portable export dialog: no browser test against a real package build

- **Priority:** P3 Low · **Status:** Open · **Refs:** nodestro-api #85, studio #121, `frontend/src/publish/PortableExport.tsx`;
  security review: nodestro-api API-054
- **What:** The dialog's portable options, summary, build progress, cancel and download are covered by component
  tests with a mocked API. The backend build is tested end to end in nodestro-api (offline container, browser E2E
  of the exported web interface, CI on six platforms), but no studio browser test drives a real build from the
  dialog (a build downloads Python and wheels and takes minutes).
- **Next step:** Add a browser test that starts a portable build of a model-free workflow from the dialog against
  a cached export cache, and downloads the ZIP.

### ST-043 · End-to-end suite for the local models settings with a real model server

- **Priority:** P3 Low · **Status:** Open · **Refs:** local models work order (2026-11-03), `pages/SettingsLocalModels.tsx`
- **What:** The local models and knowledge search sections have unit tests against stubbed answers; the e2e suites keep
  the cloud defaults (`tests/e2e_defaults.py`). No browser suite installs the runtime, downloads a model, builds the
  semantic index and runs a local agent end to end. The smoke suite checks the hardware panel and the per-agent model
  plan of an example copy against the real API (no model server); the mDenseOn build from local files, the speed
  measurement and the "Reasoning reduced" badge are covered by unit tests and by the runtime and API tests only.
- **Next step:** Add an e2e server with a fake Ollama binary (as in nodestro-api `tests/test_local_models_api.py`)
  and a suite for start, download progress, import errors and index build; run it with a real Ollama where CI allows.

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
- **Next step:** Run the e2e suites once in Firefox and WebKit and record the result; decide whether CI adds one engine.

### ST-034 · Welcome page on app start not checked in WebKit

- **Priority:** P3 Low · **Status:** Open · **Refs:** studio #99, `frontend/src/welcome/startPage.ts`,
  `docs/design/LANDING.md` §4
- **What:** Every app start on `/` opens `/welcome`, decided by the Navigation Timing type (`navigate` = start;
  `reload`/`back_forward` = stay). Verified in Chromium only, including the desktop-style launch page that moves on to
  `/` with a meta refresh. Unverified: whether WebKit (desktop app on macOS and Linux, Safari) reports that meta
  refresh as `navigate`. If not, the desktop app opens the Studio directly on start (no error, no loop).
- **Next step:** Run `E2E_BROWSER=webkit scripts/e2e.sh welcome` once, or start the desktop app on macOS/Linux and
  confirm the welcome page appears; remove this entry when confirmed.

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

### ST-018 · Desktop/server and evolution status documents are stale

- **Priority:** P3 Low · **Status:** Open · **Refs:** #87
- **What:** `docs/desktop-server/IMPLEMENTATION_STATUS.md` and `RELEASES.md` predate the built-in Linux sandbox and the
  withdrawn desktop candidate; `docs/evolution/s2-worker-concept.md` and §9 of the evolution plan do not record the
  implemented S-2 state.
- **Next step:** One docs-only PR aligning the status lines with ADR-0006 and `docs/ARCHITECTURE.md`.

## Technical debt

### ST-027 · `products` in `platform/versions.json` is stale

- **Priority:** P3 Low · **Status:** Open · **Refs:** `platform/versions.json`, backend audit round 3 OPS3-06 (product
  pins moved in this round; the block itself was not touched or checked)
- **What:** It still lists desktop `67122b7` / server `5bc7b82` built from studio `78710ce` as candidate
  v0.2.0-preview.1, a candidate that is frozen, NO-GO and not published (nodestro-desktop DSK-001); there is no
  nodestro-local-docker entry.
  Its comment says the block is "updated when a product's studio.json moves", which no longer happens (the products
  were re-pinned to newer studio commits without touching it), and `scripts/check_versions.py` does not check the block.
- **Next step:** With the next candidate (or now), reword the comment to "last release candidate", mark the old
  candidate withdrawn and add local-docker, or let `check_versions` verify the block; done by the thread that holds
  the pin slot. (Backend audit 2, integration run.)

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
  the rule and an entry in that repository's TODO (studio: TypeScript, axe-core ST-051, ESLint 10 and
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

### ST-038 · Four scripts outside mypy (API2-16 rest)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** backend audit 2 API2-16, studio #110
- **What:** The studio now serves the frontend through `nodestro_api.frontend.mount_frontend` and the typed scripts
  are in mypy, but `derive_branding`, `docker_smoke`, `platform_smoke` and `social_preview` stay outside (19 errors,
  missing numpy and PIL stubs).
- **Next step:** Add the stub packages to the dev dependencies and fix the errors, or type the image helpers locally.

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
| ST-003 | nodestro-runtime, nodestro-api | RT-012, API-018 (run-level failure cause, AD-02) | Studio needs the field first |
| ST-014 | nodestro-api | API-017 (budget usage in usage data, AD-20) | Studio needs the field first |
| ST-021 | nodestro-server | Development stack | Used for the browser pass |
| ST-028 | nodestro-runtime, nodestro-server | RT-023, SRV-014 (dependency locking, D-05) | One shared decision |
| ST-052 | all Nodestro repositories | Dependabot policy, branch protection decision, auto-merge prerequisites | Owner entry here; the others point to it |
| ST-054 | nodestro-sdk, nodestro-desktop, nodestro-server, axentra, axentra-studio | SDK-010, SRV-015, Node.js 24 entries | Owner entry here; move together in Q1 2027 |
| ST-018, ST-027 | nodestro-desktop | DSK-001 (new candidate and Go/No-Go) | Update the status documents and `products` together |
| ST-007, ST-031 | nodestro-examples, nodestro-runtime | EX-003 (AD-18 marker), RT-055 (copy origin) | Examples and runtime provide the marker; studio shows it |
| ST-032 | nodestro-api | API-053 (contract descriptions in summaries) | Studio needs the field first |
| — | nodestro-runtime, nodestro-api | X-01 decision response still `paused` (RT-005, API-018); X-03 error code list (RT-011, API-016) | Change lives in runtime/api; studio already adapted |

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

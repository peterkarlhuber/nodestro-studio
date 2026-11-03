# TODO: nodestro-studio

> Open work for this repository: release blockers, known bugs, security follow-ups, technical debt and planned improvements.
> GitHub issues are the source of truth for details; this file is the entry point and summary.
>
> **Last full review:** 2026-11-03 against `master` at `3a7686b` (close of UX round 2 and backend audit 2).

## Summary

| Priority | Count |
|---|---|
| P0 Critical | 0 |
| P1 High | 0 |
| P2 Medium | 1 |
| P3 Low | 22 |
| P4 Optional | 13 |

**Release blockers:** None for this repository.

The studio is in a good state after the UX initiative (studio #61 to #80): the independent final review accepted it with
conditions that #79 addressed, and master CI is green. What remains is a backlog of usability and accessibility
follow-ups, one cross-repository failure-cause gap, pending dependency updates, stale status documents and the
platforms nobody has tested yet. The desktop release blocker (built-in Linux sandbox) lives in the runtime and desktop
repositories, not here.

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
  cached number formatters). Still above the 50 ms long-task budget.
- **Next step:** Mount closed editor dialogs only when open (about 100 ms at 4x; keep their state semantics), preload
  the editor chunk from the Workflows page, look at React Flow's node measuring (110–180 ms at 4x).

## Features and enhancements

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
- **Next step:** Offer the copy's sample files as one-click inputs; check whether the copy needs an API field for them.

### ST-008 · Runs and recent items in the global search (OB-09)

- **Priority:** P3 Low · **Status:** Open · **Refs:** #83, UX audit OB-09
- **What:** Ctrl+K now also goes to pages and settings sections (UX round 2), but it does not find runs and shows no
  recent items for an empty query.
- **Next step:** Add a "Runs" group (needs a run search in `GET /api/search` or a client-side filter of recent runs)
  and recently opened items.

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
- **What:** Usage does not show published-API daily budget use, runs stopped by their budget, or that MCP service and
  web-search fees are not included.
- **Next step:** Add a "Not included" note now; add a Budgets card once the API reports budget use.
- **Depends on:** nodestro-api API-017 (budget usage in the usage response).

### ST-015 · New agent defaults: raw `{{input}}` and "Empty template" saving at once (ED-22)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX audit ED-22
- **What:** The default system prompt is localized now, but the task field starts as raw `{{input}}`, and "Empty
  template" on the agent library page persists a template immediately on click.
- **Next step:** Show the input placeholder as a chip with a raw-text toggle; create the template on first save.

### ST-016 · Capabilities of typed model ids from `GET /api/models/capabilities`

- **Priority:** P3 Low · **Status:** Open · **Refs:** #86, Bedrock final report open item 3
- **What:** For hand-typed ids (Bedrock ids, inference profiles, ARNs) capability-dependent options stay off as
  "unknown" although the API route can answer.
- **Next step:** Query the route from the model picker for free-text ids; keep the current fallback.

### ST-031 · Offline (sample data) badge on example copies (AD-18)

- **Priority:** P3 Low · **Status:** Blocked · **Refs:** UX audit AD-18, nodestro-examples #39
- **What:** Copies of examples whose optional connection is missing run on sample data, but only the copy chooser
  (`frontend/src/library/ExampleSections.tsx`) says so; the editor and run headers show no badge.
- **Next step:** Show a badge in the workflow and run header once nodestro-examples EX-003 has chosen the marker.
- **Depends on:** nodestro-examples EX-003 (marker), possibly a workflow field in nodestro-runtime/nodestro-api.

### ST-032 · Technical field names in the team hint and result labels (ED-17)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit ED-17
- **What:** The palette team hint (`frontend/src/editor/Palette.tsx`, `teamHint()`) lists output fields by id, and
  `fieldLabel()` in `components/Markdown.tsx` falls back to the English field id when a description exceeds 60
  characters (10 to 17 example fields per language).
- **Next step:** Show localized descriptions or labels instead of ids; agree the label source with nodestro-examples EX-002.
- **Depends on:** nodestro-examples EX-002 (possible `label` on the runtime's `OutputField`).

## Tests and quality assurance

### ST-043 · End-to-end suite for the local models settings with a real model server

- **Priority:** P3 Low · **Status:** Open · **Refs:** local models work order (2026-11-03), `pages/SettingsLocalModels.tsx`
- **What:** The local models and knowledge search sections have unit tests against stubbed answers; the e2e suites keep
  the cloud defaults (`tests/e2e_defaults.py`). No browser suite installs the runtime, downloads a model, builds the
  semantic index and runs a local agent end to end.
- **Next step:** Add an e2e server with a fake Ollama binary (as in nodestro-api `tests/test_local_models_api.py`)
  and a suite for start, download progress, import errors and index build; run it with a real Ollama where CI allows.

### ST-017 · Pending dependency updates (Dependabot)

- **Priority:** P3 Low · **Status:** In progress · **Refs:** #64, #66, #67, #75
- **What:** actions/setup-node 6.5 → 7.1 (#64), globals 16 → 17 (#66, ESLint config only), jsdom 26 → 30 (#67, unit
  test environment only), npm minor/patch group (#75). The frontend job (lint, typecheck, unit tests, build, audit)
  passes for all four on Node 22; the browser suites have not run yet. #75 needs a rebase on the
  `frontend/package.json` changes from #77.
- **Next step:** CI no longer needs `NODESTRO_READ` (#110): re-run full CI on each; merge the majors one at a time;
  rebase #75 first.

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

### ST-023 · README lists nine browser suites; there are fifteen

- **Priority:** P4 Optional · **Status:** Open · **Refs:** `README.md` (Development table), `scripts/e2e.sh`
- **What:** `make e2e` runs smoke, i18n, architect, python, assistant, flow, panels, api, mcp, approvals,
  orchestration, runchat, journeys, welcome and a11y; the README names nine.
- **Next step:** Update the table row.

### ST-024 · Help links in four dialogs and links from docs into the app (TX-11)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX audit TX-11
- **What:** The versions dialog and the gate report have no help tip; docs chapters never link to app routes
  ("Open Settings → AI providers" is plain text).
- **Next step:** Add the help tips; let DocsPage render app-route links in chapter Markdown.

### ST-025 · Interface texts that name environment variables (TX-14)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX audit TX-14
- **What:** `approvals.rules.disabledText` and `tools.services.endpointListEmpty` show `NODESTRO_*` variable names in
  plain text to ordinary users.
- **Next step:** Lead with operator wording and put the variable in `<code>`, in all six languages.

### ST-026 · Locale polish: French apostrophes and the Orkexa name in de/it

- **Priority:** P4 Optional · **Status:** Needs decision · **Refs:** final UX review F10, `docs/i18n/terminology.md`
- **What:** The fr locale has 301 straight apostrophes next to about 1,900 typographic ones. Three de/it texts
  (`backup.json` `versions`, `errors.json` `library` twice) call Orkexa "Agenten-Bibliothek" / "libreria (degli)
  agenti", which is close to the new page name "Agentenbibliothek".
- **Next step:** Normalize the fr apostrophes; native speakers decide the Orkexa wording.

## Technical debt

### ST-027 · `products` in `platform/versions.json` is stale

- **Priority:** P3 Low · **Status:** Open · **Refs:** `platform/versions.json`
- **What:** It still lists desktop `67122b7` / server `5bc7b82` built from studio `78710ce` as candidate
  v0.2.0-preview.1, a candidate that was not released and was superseded; there is no nodestro-local-docker entry.
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

### ST-038 · Three scripts outside mypy (API2-16 rest)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** backend audit 2 API2-16, studio #110
- **What:** The studio now serves the frontend through `nodestro_api.frontend.mount_frontend` and the typed scripts
  are in mypy, but `derive_branding`, `platform_smoke` and `social_preview` stay outside (17 errors, missing numpy
  and PIL stubs).
- **Next step:** Add the stub packages to the dev dependencies and fix the errors, or type the image helpers locally.

### ST-039 · Name the blocked tool in sandbox problems (NJR-08)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX round 2 NJR-08
- **What:** The sentence for a tool refused by the sandbox does not name the tool, although `params.name` carries
  it; with several tools on one agent it is unclear which one is blocked.
- **Next step:** Add `{{name}}` to the sandbox problem sentences in six languages.

### ST-040 · Trust label "Origin: Needs isolation" (NJR-10)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX round 2 NJR-10, tools docs chapter
- **What:** The tool header reads "Origin: Needs isolation", and an adopted tool reads "Created by AI · Origin:
  Written by you"; origin and trust class are mixed in one label.
- **Next step:** Separate "created by" from "runs as", and change the tools docs in six languages in the same PR.

### ST-041 · Runs list and run page polish (NJR-03, NJR-17 to NJR-20)

- **Priority:** P4 Optional · **Status:** Open · **Refs:** UX round 2 NJR-03, NJR-11, NJR-17 to NJR-20
- **What:** An expired budget decision keeps the "Budget decision needed" title and "waiting" badge; the workflow
  filter cannot tell two copies with the same name apart; runs waiting for a budget decision have no filter option
  of their own; "Version 1" stands alone in a callout; a blocked agent node shows "Ready" next to "1 problem"; danger
  callouts show two icons; the runs table overflows by 15 px in French at 1280 px.
- **Next step:** Small fixes, one PR.

## Later optimizations

### ST-029 · Evolution backlog after Q-4

- **Priority:** P4 Optional · **Status:** Needs decision · **Refs:** `docs/evolution/README.md` §4 (P3 and later), §8
- **What:** Recorded replay of tool responses in test series, app-builder discovery and the deferred ideas (shadow
  mode, migration studio, knowledge conflict detection) wait for their re-entry criteria and an owner decision.
- **Next step:** Review at the next phase gate; nothing to build until then.

## Accepted risks

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
  isolation flags), a call past the 15 s timeout and a cancelled workflow run leave no container, and after
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
    with the isolation flags, no container left after the timeout and after the cancelled run, and refusal with the
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
| ST-003 | nodestro-runtime, nodestro-api | RT-012, API-018 (run-level failure cause, AD-02) | Studio needs the field first |
| ST-014 | nodestro-api | API-017 (budget usage in usage data, AD-20) | Studio needs the field first |
| ST-021 | nodestro-server | Development stack | Used for the browser pass |
| ST-028 | nodestro-runtime, nodestro-server | RT-023, SRV-014 (dependency locking, D-05) | One shared decision |
| ST-018, ST-027 | nodestro-desktop | DSK-001 (new candidate and Go/No-Go) | Update the status documents and `products` together |
| ST-026 | nodestro-examples | EX-008 (typographic apostrophes) | Same typography decision |
| ST-031, ST-032 | nodestro-examples | EX-003 (AD-18 marker), EX-001/EX-002 (ED-17) | Examples provide the marker and texts; studio shows them |
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

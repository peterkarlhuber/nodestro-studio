# TODO: nodestro-studio

> Open work for this repository: release blockers, known bugs, security follow-ups, technical debt and planned improvements.
> GitHub issues are the source of truth for details; this file is the entry point and summary.
>
> **Last full review:** 2026-11-01 against `master` at `8e18cae`.

## Summary

| Priority | Count |
|---|---|
| P0 Critical | 0 |
| P1 High | 0 |
| P2 Medium | 3 |
| P3 Low | 21 |
| P4 Optional | 8 |

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

### ST-001 · Independent security review of the per-call tool approval interface (S-2)

- **Priority:** P2 Medium · **Status:** Needs external review · **Refs:** `docs/evolution/s-tool-approvals.md`, S-2 pilot
- **What:** The studio side of per-call tool approvals (approval cards, rules, pre-grants) is built, but the switch
  `NODESTRO_TOOL_APPROVALS` stays off outside one isolated pilot instance. Broad activation needs an independent
  security review of the whole mechanism, including this interface.
- **Next step:** Include the studio approval surfaces in the independent review; activate nothing before it is accepted.
- **Depends on:** nodestro-runtime and nodestro-api (same review, server-side mechanism).

### ST-002 · Dependency audit gates production dependencies only

- **Priority:** P4 Optional · **Status:** Open · **Refs:** backend audit D-04, `.github/workflows/ci.yml`
- **What:** CI runs `npm audit --omit=dev --audit-level=high` (green on master); advisories in development and build
  dependencies are not reported anywhere.
- **Next step:** Add a non-blocking full `npm audit` report to CI, or review dev advisories with each Dependabot round.

## Bugs and reliability

### ST-003 · Runs list and run banner show only "Failed: <step>" (AD-02)

- **Priority:** P2 Medium · **Status:** Blocked (needs a run-level cause from the backend) · **Refs:** #81, UX audit AD-02
- **What:** The run detail page derives the failure cause from step data, but the Runs list row and run-level banner
  only know `run.nodes_failed` with step names, so a budget stop or provider failure reads "Failed: Writer".
- **Next step:** Agree a run-level cause field with runtime/api, then render "<step>: <reason>" in the list and banner.
- **Depends on:** nodestro-runtime (store the cause on the run), nodestro-api (expose it in run summaries).

## Architecture and modularity

None known.

## Performance

### ST-004 · Editor main-thread cost unchanged under CPU throttling (F3)

- **Priority:** P3 Low · **Status:** Open · **Refs:** #84, final UX review F3
- **What:** Bundle and network cost dropped 4 to 6 times, but the editor's mount work did not: about 1.6 s of long
  tasks under CPU 4x for a 9-node workflow. The paused-run polling part of F3 was fixed in #79.
- **Next step:** Profile the canvas mount, fix the dominant long tasks, keep a repeatable measurement.

## Features and enhancements

### ST-005 · Live run chat and steering (LRC-1)

- **Priority:** P2 Medium · **Status:** In progress · **Refs:** #77
- **What:** Team leader tab on the run page with questions and instructions to running orchestrators. The PR also
  re-pins the components (today's master pins are the Amazon Bedrock branch heads, not their merge commits).
- **Next step:** Merge only after the project owner's explicit approval; re-pin to the merge commits at merge time.
- **Depends on:** LRC-1 PRs in nodestro-api and nodestro-sdk (same approval).

### ST-006 · "Back to workflow" after saving a provider key (F8)

- **Priority:** P3 Low · **Status:** Open · **Refs:** final UX review F8
- **What:** The first-success journey still needs the browser Back button after saving a key: the blocked Start links
  to `/settings` (`editor/RunDialog.tsx`), and Settings offers no way back.
- **Next step:** Pass the origin when opening Settings from a blocked Start and show "Back to <workflow>" after saving.

### ST-007 · "Use sample file" in the run dialog of form examples (OB-13)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit OB-13
- **What:** The prefilled label and the collapsed "more files" area are done; the sample files of an example are still
  only downloadable in the preview, not offered where the run needs them.
- **Next step:** Offer the copy's sample files as one-click inputs; check whether the copy needs an API field for them.

### ST-008 · Global search for pages, settings sections and runs (OB-09)

- **Priority:** P3 Low · **Status:** Open · **Refs:** #83, UX audit OB-09
- **What:** Ctrl+K finds content kinds and docs only (`layout/GlobalSearch.tsx`), not pages, settings or runs, and
  shows nothing for an empty query.
- **Next step:** Add "Go to" and "Runs" groups and recent items.

### ST-009 · Editor inspector as a drawer below 1100 px (AX-17)

- **Priority:** P3 Low · **Status:** Open · **Refs:** #82, UX audit AX-17
- **What:** On tablets the inspector permanently takes about 40 % of the width; no inspector drawer exists.
- **Next step:** Overlay drawer that opens on selection, plus a 768 px check in the e2e suites.

### ST-010 · Editor keyboard efficiency and region navigation (AX-12)

- **Priority:** P3 Low · **Status:** Open · **Refs:** UX audit AX-12, final UX review F6
- **What:** Keyboard connection works (and #79 added the C shortcut), but reaching the palette still takes about 30
  Tabs and there is no way to jump between palette, canvas, inspector and run panel.
- **Next step:** Roving tabindex in the palette and a region shortcut (F6) or extra skip links.

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
- **Depends on:** nodestro-api (budget usage in the usage response).

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

### ST-012 · Dependabot pull requests cannot run the full CI

- **Priority:** P3 Low · **Status:** Open · **Refs:** #85
- **What:** CI exits when the `NODESTRO_READ` secret is missing, so on Dependabot runs the backend, pins, package and
  browser jobs fail before testing; only the frontend job is meaningful. All component repositories are public now.
- **Next step:** Install the git dependencies anonymously and make the token optional, as in the other repositories
  (backend audit D-08 residual); a Dependabot secret (owner action) is only the fallback.

### ST-017 · Pending dependency updates (Dependabot)

- **Priority:** P3 Low · **Status:** In progress · **Refs:** #64, #66, #67, #75
- **What:** actions/setup-node 6.5 → 7.1 (#64), globals 16 → 17 (#66, ESLint config only), jsdom 26 → 30 (#67, unit
  test environment only), npm minor/patch group (#75). The frontend job (lint, typecheck, unit tests, build, audit)
  passes for all four on Node 22; the browser suites have not run (ST-012). #75 and #77 both touch
  `frontend/package.json`.
- **Next step:** After ST-012, re-run full CI; merge the majors one at a time; rebase #75 after #77.

## Platform coverage

### ST-019 · Other browsers and operating systems

- **Priority:** P3 Low · **Status:** Open · **Refs:** final UX review §8, `docs/desktop-server/IMPLEMENTATION_STATUS.md`
- **What:** All checks ran in Chromium on Linux. Firefox, Safari/WebKit, Windows, macOS and real mobile devices are
  untested; `scripts/e2e.sh` supports `E2E_BROWSER=firefox|webkit`, but CI runs Chromium only.
- **Next step:** Run the e2e suites once in Firefox and WebKit and record the result; decide whether CI adds one engine.

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

### ST-023 · README lists nine browser suites; there are fourteen

- **Priority:** P4 Optional · **Status:** Open · **Refs:** `README.md` (Development table), `scripts/e2e.sh`
- **What:** `make e2e` runs smoke, i18n, architect, python, assistant, flow, panels, api, mcp, approvals,
  orchestration, journeys, welcome and a11y; the README names nine.
- **Next step:** Update the table row (and add `runchat` if #77 merges).

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
- **Next step:** With the next candidate (or now), mark the old candidate withdrawn and add local-docker; done by the
  thread that holds the pin slot.

### ST-028 · Third-party Python dependencies are not locked

- **Priority:** P3 Low · **Status:** Open · **Refs:** backend audit D-05, `pyproject.toml`
- **What:** Components are pinned by commit, but their third-party dependencies are resolved at install time, so studio
  installs (and the server and desktop builds made from them) are not reproducible.
- **Next step:** Decide on a constraints or lock file for the platform install, together with the other Python repos.
- **Depends on:** the same decision in nodestro-runtime, nodestro-api and the packaging repositories.

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

## Cross-repository dependencies

| This repo item | Other repo | Other item | Relation |
|---|---|---|---|
| ST-001 | nodestro-runtime, nodestro-api | S-2 tool approvals review | Same independent review |
| ST-003 | nodestro-runtime, nodestro-api | Run-level failure cause (AD-02) | Studio needs the field first |
| ST-005 | nodestro-api, nodestro-sdk | LRC-1 PRs | Merged together after approval |
| ST-014 | nodestro-api | Budget usage in usage data (AD-20) | Studio needs the field first |
| ST-021 | nodestro-server | Development stack | Used for the browser pass |
| ST-028 | nodestro-runtime, nodestro-api | Dependency locking (D-05) | One shared decision |
| ST-031, ST-032 | nodestro-examples | EX-003 (AD-18 marker), EX-001/EX-002 (ED-17) | Examples provide the marker and texts; studio shows them |
| ST-012 | all component repositories | `NODESTRO_READ` CI change (api #50, sdk #47, runtime #75, server #25, desktop #17) | Same change everywhere |
| — | nodestro-runtime, nodestro-api | X-01 decision response still `paused`; X-03 error code list | Change lives in runtime/api; studio already adapted |

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

# Product evolution plan (reviewed draft)

> Status: **P0, proposed 2026-10-31, awaiting the project owner's review.** Nothing here is approved for
> implementation. It reviews the AI-assisted draft "Nodestro Evolution" (version 0.1, German) against the code and
> replaces it where the two disagree. The verified inventory and the UX findings (F1–F11) are in
> [inventory.md](inventory.md). The desktop/server plan in [`docs/desktop-server/`](../desktop-server/README.md) and
> ADR-0001 to ADR-0006 take precedence over everything here.

## 1. Verdict on the draft

The draft's direction is right: progressive complexity instead of a beginner/expert switch, no second engine, no
weaker security, nothing claimed that was only simulated. Its main weakness is that it assumes too little exists.
About half of its packages are already implemented in part, and several "product strands" are one feature seen from
different sides. Changes made in this review:

| Draft strand | Decision | Reason |
| --- | --- | --- |
| UX (progressive complexity) | **keep, first, narrowed** | The pattern exists (`Section`, sectioned `AgentForm`, result-first run tabs). The work is fixing its defects (F1–F4), then extending it page by page, not designing it anew. |
| Q quality gate | **keep, second** | Test series with case-by-case comparison exist. Missing is the link to publishing: show test status, then an opt-in gate. |
| O model optimizer | **merge into Q** | A model comparison is a test-series run with a model override on the same cases. A separate optimizer would be a second batch runner, which the draft itself forbids. |
| C agent contracts | **merge into Q and existing schemas** | Structured output fields, quality criteria, preflight and test-case checks already cover "contracts". A separate rule system would be a second source of truth. Revisit only if a concrete gap appears. |
| E explainability | **narrow into UX (run summary)** | A deterministic "what happened" summary is a run-view feature. The assistant already discusses runs, so an AI summary (E-4) adds nothing new. |
| T time machine | **rename and narrow** | Compare (T-1) and partial re-run with reuse and side-effect confirmation (T-3) exist as run comparison and resume. Remaining: recorded tool responses for replay in test series, after Q. |
| T-5 shadow mode | **not planned** | Needs server workers, real traffic on published APIs and a consent model; no user asked for it; double model costs. Re-entry: real server users with a published API asking for it. |
| S security firewall | **keep as threat model now, enforcement later** | ADR-0006, route permissions and tenants (PR-2, PR-9) already are the enforcement seams. The only external actions are own Python tools, provider server tools and memory/knowledge writes, so a general policy engine has little to govern today. First step: threat model; then a per-tool capability statement and "ask before calling this tool" on the existing approval mechanism. |
| K knowledge intelligence | **narrow to "used in" (UX) and freshness** | "Used in" is cheap and useful for files, tools and memory alike. Conflict detection between documents is not verifiable and is dropped. |
| A app builder | **discovery only, after PR-12** | Published APIs, export and the "Try it" form exist. A hosted end-user page needs the server's auth and CSP design first. |
| M migration studio | **not planned** | No demand evidence, high maintenance (four foreign formats with their own version churn). Re-entry: repeated requests from real users. |

Positioning ("Build · Prove · Control") stays internal until competitors and demand are checked; no claims about
competitors are made in docs or UI.

## 2. Progressive complexity: options and recommendation

| Option | Description | For | Against |
| --- | --- | --- | --- |
| A. One central "Advanced" block | Core fields visible, every other setting in one collapsed block | simplest, one click to everything | mixes unrelated settings (memory next to caching); a long block when opened; loses the existing thematic structure |
| B. Thematic sections (status quo) | Tools, Knowledge, Memory, Output, Thinking, Quality, Advanced, each collapsible with a summary | already built and documented in six languages; experts find settings by topic | defects F1–F4: sections close themselves, problems and non-default values are hidden, state resets per node |
| C. **Hybrid (recommended)** | B plus: stable open state, problem badges on closed sections with jump-to-field, summaries that name non-default values, open state remembered per section as a UI preference | fixes the observed defects with the least change; nothing is moved, nothing is removed; every field stays where the docs say it is | needs careful summary texts in six languages |
| D. Beginner/expert switch | Global mode | — | excluded by the draft's non-goals and by this review: two UIs to test, users in the wrong mode miss settings |

Rules for every UX pull request: opening or closing never changes data; no workflow, agent or export changes shape;
problems, missing provider keys, sandbox blocks, costs and external actions stay visible when collapsed; keyboard and
screen-reader behavior of native `<details>`/`<summary>` is kept; both themes and narrow inspector widths are
checked; texts in de, en, es, fr, it, pt-BR.

## 3. Dependencies and conflicts with the desktop/server plan

Status of the desktop/server plan on 2026-10-31 11:05Z: PR-1 to PR-9 merged, PR-10 (jobs, workers) merged in the
runtime and in progress in the API, studio #11 open (pins, login redirect, texts). Next: PR-10 api, PR-11 container
sandbox, PR-12 server integration, PR-13 built-in sandbox prototype, M6.

| Evolution PR | Files | Desktop/server overlap | Sequencing rule |
| --- | --- | --- | --- |
| EVO-0 (this) | `docs/evolution/*`, `CHANGELOG.md` | changelog only | any time |
| UX-1 … UX-4 | `frontend/src/components/ui.tsx`, `editor/AgentInspector.tsx`, `editor/FlowInspectors.tsx`, `pages/WorkflowsPage.tsx`, locale files `common`, `agent`, `flow`, `workflows`, `app.css`, doc chapters `agenten`, `workflows`, `start` | none in code; `CHANGELOG.md`; doc chapters are shared, the desktop/server plan edits `einstellungen` and `tools` | studio-only, no pin change; rebase on studio master before merge; never merged while a desktop/server studio PR moves pins in the same hour (ask that thread first) |
| UX-5 (raw `<details>` → `Section`) | `ToolsPage.tsx`, `RunDetails.tsx`, `TestsPage.tsx`, settings pages | **PR-11** may change tool-page sandbox notes; **PR-12** may change settings | do tools and settings pages after PR-11/PR-12 are merged; run and test pages any time |
| UX-7 "used in" | new API route, `openapi/nodestro-api.json`, SDK regeneration, studio pages | **PR-9/PR-10/PR-12** touch every API router (permissions, tenant scope); the OpenAPI snapshot is shared | after PR-12 api is merged; the route declares a permission (`read`) and is tenant-scoped from the start; pins bottom-up by the thread that holds the pin lock |
| Q-1 test status in the publish dialog | studio only (existing `/api/benchmarks` routes) | none | after UX-1 |
| Q-2 model comparison, Q-3 opt-in gate | `nodestro-api/benchmarks.py`, `publishing.py`, OpenAPI, SDK, studio | API routers and OpenAPI (PR-10/PR-12); gate checks run through jobs on the server (ADR-0004) | after PR-12; gate semantics decided first (D6) |
| S-0 threat model | docs only | must align with ADR-0003/0006 | any time; reviewed by the desktop/server thread |
| S-1/S-2 capabilities, "ask before calling" | runtime (`tool_library.py`, `engine.py`, approval), api, studio | **PR-11** (`tool_library.py`, sandbox), **PR-13** | after PR-11 and PR-13; not before the threat model is accepted |
| T replay of recorded tool responses | runtime (`resume.py`, `engine.py`), api (`benchmarks.py`) | **PR-10** (`engine.py` event sink, run events in PostgreSQL) | after PR-12 and Q-2 |

`platform/versions.json` and pins are never changed by this plan's PRs without first messaging the desktop/server
thread; only one thread moves pins at a time.

## 4. Pull request plan

Each PR: one repository unless stated, merge commit, tests and docs in the same PR, PR protocol of the draft
(problem and evidence, before/after, reuse, alternative, security/cost, compatibility, tests, docs, rollback).
Phase P1 is studio-only and needs no pin change.

### P1 — progressive complexity

| PR | Content | Acceptance |
| --- | --- | --- |
| **EVO-0** | This plan and the inventory (docs only). | Reviewed by the project owner; decisions D1–D8 answered. |
| **UX-1** *(first code PR)* | `Section`: `defaultOpen` applies on mount only (fixes F1); optional controlled `open`/`onToggle`; `status` prop rendering an error/warning count with icon and text in the summary (no color-only state); `id` for later state memory. No caller changes except passing nothing new. | Vitest: no self-collapse when the default flips; manual toggle kept across re-renders; status visible while closed, read by the accessible name; existing `ui.test.tsx` green; e2e `smoke` and `panels` green; both themes screenshot-checked. Behavior change listed in the changelog: adding the first tool no longer opens the Tools section by itself (it is already open when you add one there). |
| **UX-2** | Agent inspector problems and summaries: route `ConfigIssue.field` to its section (`tools`, `server_tools` → Tools, `knowledge`, `quality`) and show the status there (F2); "jump" from the top problem list opens the section and focuses the field; summaries name non-default values for Thinking, Knowledge (citations, proposals) and Advanced (fallbacks, forced tool, caching, limits) (F3). Texts in six languages. | Unit tests per summary (default → neutral text; each non-default field named); test that every issue `field` the runtime emits maps to a section (guards against new fields); agent library page unchanged apart from the same improvements; i18n test green. |
| **UX-3** | Remember open sections per section id across node selection and reloads as a UI preference (`localStorage`, like `editor/layout.ts`; never in the workflow or exports) (F4). Depends on D2. | Switching nodes keeps the Advanced section open; clearing storage restores defaults; storage unavailable (private mode) falls back silently; workflow JSON byte-identical before and after. |
| **UX-4** | Workflows page entry: three equal entries "Create with AI" (Workflow Architect), "Start from an example" (gallery), "Build it yourself" (current dialog) in the empty state, and a compact row above the list (F6). Reuses `ArchitectDialog`, `ExampleGallery`, the create dialog; no new logic. Depends on D3. | e2e: each entry leads to a saved, runnable workflow with the scripted provider; `/`, `/workflows/examples`, import and deep links unchanged; texts and doc chapter `start` in six languages. |
| **UX-5a/b** | Replace raw `<details>` with `Section` where the semantics match: (a) runs, tests, batches, approvals, compare; (b) tools, knowledge, settings (after PR-11/PR-12) (F5). | Visual check per page in both themes; no content moved; e2e suites green. |
| **UX-6** | Start-form file field options in an "Options" section with a summary (F8); run detail gets a deterministic summary line (status, path through decisions, approvals, tools used, failing step with jump) above the tabs. | Form JSON unchanged; summary built only from stored run data (no model call); missing data shown as missing. |
| **UX-7** | "Used in" for knowledge files, tools and memory spaces (F9): one read-only API route, OpenAPI, SDK regeneration, studio lists and a delete warning. Cross-repo, after PR-12. | Tenant-scoped and permission-declared route; contract tests on SQLite and PostgreSQL; delete dialog names the users; no behavior change for deletion itself. |
| **UX-8** | Glossary chapter (agent, tool, knowledge, memory, run, release) in six languages; screenshots refreshed; journey baseline script (inventory §3). | Docs tests green; journey results reported as interface cost, not as user research. |

### P2 — quality (absorbs optimizer and contracts)

| PR | Content | Depends on |
| --- | --- | --- |
| Q-1 | Publish dialog and editor show the latest test-series result for the version being published: untested / passed n of m / outdated (suite or workflow changed since). Studio only. | UX-1 |
| Q-2 | Test-series run with a model override per agent (same cases, same judge), compared with the existing case comparison; costs capped and confirmed before start. Replaces the optimizer's O-1/O-2. | PR-12, D5 |
| Q-3 | Opt-in release gate per publication: minimum pass rate on deterministic checks, no case worse than the active release; judge verdicts shown as probabilistic and never the sole blocker unless the owner says so. Existing releases unchanged. | Q-1, D6 |
| Q-4 | Propose a test case from a failed run (redacted, with origin), added only after confirmation. | Q-1 |

### P3 and later

S-0 threat model (docs, now) → S-1 tool capability statement → S-2 "ask before calling" on the existing approval mechanism →
T replay of recorded tool responses in test series → A discovery. Each starts with its own short review and a
decision by the project owner.

## 5. Open decisions for the project owner

| # | Question | Recommendation |
| --- | --- | --- |
| D1 | Which progressive-complexity model? | Option C (hybrid on the existing sections). |
| D2 | Remember open sections? per session / across sessions / never | Across sessions in `localStorage`, per section id, like the panel layout. |
| D3 | Three entry points: empty state only, or also above the list? | Both: full cards in the empty state, a compact row above the list. |
| D4 | Judge model default for **new** quality checks: keep `claude-opus-5-5`, or use the settings' default model? Existing agents are never changed. | Use the default model from the settings (avoids a hidden provider and cost). |
| D5 | Merge optimizer and agent contracts into Q; drop shadow mode, migration studio and knowledge conflict detection (with re-entry criteria). | Yes. |
| D6 | What does a passed gate mean (deterministic only, or judge too), and who may override? | Decide before Q-3; proposal: deterministic checks block, judge regressions warn, override is an audited note on the release. |
| D7 | Moderated task tests with 3–5 people possible? | If yes, before UX-4 and after UX-2; if not, journey scripts only and all comprehension claims stay hypotheses. |
| D8 | Sequencing: P1 studio-only while the desktop/server plan runs; anything touching the API, OpenAPI or pins waits for PR-12. | Yes. |

## 6. Assumptions

- The project owner is currently the main user; no usage data exists and none is collected.
- The 45 example cases (`nodestro-examples`) and the scripted provider are representative enough for journey scripts.
- Studio-only frontend PRs need no pin change; they still run the full studio CI (unit, i18n, e2e).
- Desktop/server PR numbers and scope are as documented in `docs/desktop-server/README.md` on 2026-10-31; any change
  there is re-checked before each evolution PR.

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| A UX change hides a problem or a cost | `status` on every section that can hold a problem; tests per issue field; review checklist item |
| Merge conflicts with the desktop/server thread | studio-only PRs, small, rebased before merge; overlap table in §3; message that thread before touching shared files |
| Six-language texts drift | i18n completeness test; summaries built from short keys, no sentence concatenation |
| "Simplified" means "less reachable" for experts | no field moves out of its section; global search unchanged; journey script for expert tasks too |

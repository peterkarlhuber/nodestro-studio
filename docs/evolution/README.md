# Product evolution plan (reviewed draft)

> Status: **P0, accepted by the project owner on 2026-10-31 with the decisions in §5.** Approved for implementation:
> phase P1 step by step, starting with UX-1. Every larger architecture or product change (anything marked
> "decision" below, every API or runtime change) is reviewed by the project owner separately before it is built. It
> reviews the AI-assisted draft "Nodestro Evolution" (version 0.1, German) against the code and
> replaces it where the two disagree. The verified inventory and the UX findings (F1–F11) are in
> [inventory.md](inventory.md). The desktop/server plan in [`docs/desktop-server/`](../desktop-server/README.md) and
> ADR-0001 to ADR-0006 take precedence over everything here.

## 1. Verdict on the draft

The draft's direction is right: progressive complexity instead of a beginner/expert switch, no second engine, no
weaker security, nothing claimed that was only simulated. Its main weakness is that it assumes too little exists.
About half of its packages are already implemented in part, and several "product strands" are one feature seen from
different sides. Changes made in this review (merging is technical: each strand's product goal stays named and
tracked in §8, so no long-term idea is lost by merging or deferring it):

| Draft strand | Decision | Reason |
| --- | --- | --- |
| UX (progressive complexity) | **keep, first, narrowed** | The pattern exists (`Section`, sectioned `AgentForm`, result-first run tabs). The work is fixing its defects (F1–F4), then extending it page by page, not designing it anew. |
| Q quality gate | **keep, second** | Test series with case-by-case comparison exist. Missing is the link to publishing: show test status, then an opt-in gate. |
| O model optimizer | **merge into Q** | A model comparison is a test-series run with a model override on the same cases. A separate optimizer would be a second batch runner, which the draft itself forbids. |
| C agent contracts | **merge into Q and existing schemas** | Structured output fields, quality criteria, preflight and test-case checks already cover "contracts". A separate rule system would be a second source of truth. Revisit only if a concrete gap appears. |
| E explainability | **narrow into UX (run summary)** | A deterministic "what happened" summary is a run-view feature. The assistant already discusses runs, so an AI summary (E-4) adds nothing new. |
| T time machine | **rename and narrow** | Compare (T-1) and partial re-run with reuse and side-effect confirmation (T-3) exist as run comparison and resume. Remaining: recorded tool responses for replay in test series, after Q. |
| T-5 shadow mode | **deferred (§8)** | Needs server workers, real traffic on published APIs and a consent model; no user asked for it; double model costs. Re-entry: real server users with a published API asking for it. |
| S security firewall | **keep as threat model now, enforcement later** | ADR-0006, route permissions and tenants (PR-2, PR-9) already are the enforcement seams. The only external actions are own Python tools, provider server tools and memory/knowledge writes, so a general policy engine has little to govern today. First step: threat model; then a per-tool capability statement and "ask before calling this tool" on the existing approval mechanism. |
| K knowledge intelligence | **narrow to "used in" (UX) and freshness** | "Used in" is cheap and useful for files, tools and memory alike. Conflict detection between documents is deferred (§8): its results cannot yet be verified. |
| A app builder | **discovery only, after PR-12** | Published APIs, export and the "Try it" form exist. A hosted end-user page needs the server's auth and CSP design first. |
| M migration studio | **deferred (§8)** | No demand evidence, high maintenance (four foreign formats with their own version churn). Re-entry: repeated requests from real users. |

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
runtime and in progress in the API, studio #11 merged (pins, login redirect, texts). Next: PR-10 api, PR-11 container
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
| **UX-J** | Journey baseline (D7): six Playwright journeys for the draft's user tasks against the studio with a scripted provider, counting clicks, dialogs and visible controls until the goal; run before and after UX-2 to UX-4. Lands right after UX-1, independent of moderated tests. | Runs in CI without a provider key; results reported as interface cost, never as usability; the report names what it cannot show. |
| **UX-2** | Agent inspector problems and summaries: route `ConfigIssue.field` to its section (`tools`, `server_tools` → Tools, `knowledge`, `quality`) and show the status there (F2); "jump" from the top problem list opens the section and focuses the field; summaries name non-default values for Thinking, Knowledge (citations, proposals) and Advanced (fallbacks, forced tool, caching, limits) (F3). Texts in six languages. | Unit tests per summary (default → neutral text; each non-default field named); test that every issue `field` the runtime emits maps to a section (guards against new fields); agent library page unchanged apart from the same improvements; i18n test green. |
| **UX-2b** | Judge model transparency (D4): the Quality section summary names the judge model and its provider; a note appears when the judge is the same model as the agent (self-evaluation) and when the judge's provider has no key or no known price. A newly enabled quality check starts with the settings' default model instead of the hardcoded `claude-opus-5-5`, visible and changeable. Existing configurations are never rewritten. | Stored agents load and save byte-identical; tests for the self-evaluation and missing-key notes; a check enabled with only Ollama configured gets no Anthropic model. |
| **UX-3** | Remember open sections per section id across node selection and reloads as a UI preference (`localStorage`, like `editor/layout.ts`; never in the workflow or exports) (F4). Depends on D2. | Switching nodes keeps the Advanced section open; clearing storage restores defaults; storage unavailable (private mode) falls back silently; workflow JSON byte-identical before and after. |
| **UX-4** | Workflows page entry: three equal entries "Create with AI" (Workflow Architect), "Start from an example" (gallery), "Build it yourself" (current dialog) in the empty state, and a compact row above the list (F6). Reuses `ArchitectDialog`, `ExampleGallery`, the create dialog; no new logic. Depends on D3. | e2e: each entry leads to a saved, runnable workflow with the scripted provider; `/`, `/workflows/examples`, import and deep links unchanged; texts and doc chapter `start` in six languages. |
| **UX-5a/b** | Replace raw `<details>` with `Section` where the semantics match: (a) runs, tests, batches, approvals, compare; (b) tools, knowledge, settings (after PR-11/PR-12) (F5). | Visual check per page in both themes; no content moved; e2e suites green. |
| **UX-6** | Start-form file field options in an "Options" section with a summary (F8); run detail gets a deterministic summary line (status, path through decisions, approvals, tools used, failing step with jump) above the tabs. | Form JSON unchanged; summary built only from stored run data (no model call); missing data shown as missing. |
| **UX-7** | "Used in" for knowledge files, tools and memory spaces (F9): one read-only API route, OpenAPI, SDK regeneration, studio lists and a delete warning. Cross-repo, after PR-12. | Tenant-scoped and permission-declared route; contract tests on SQLite and PostgreSQL; delete dialog names the users; no behavior change for deletion itself. |
| **UX-K** | Upload knowledge from the agent inspector (requested 2026-10-31 after journey J3): the existing `POST /knowledge` stores the file permanently in Knowledge, and the assignment is an ordinary unsaved change of the agent. No second store and no API change. Concept, alternatives and acceptance criteria in [ux-k.md](ux-k.md). | Journey J3b next to J3; a refused upload assigns nothing; the storage note distinguishes agent knowledge from run input files; six languages. |
| **UX-8** | Glossary chapter (agent, tool, knowledge, memory, run, release) in six languages; screenshots refreshed; journey results after P1 next to the UX-J baseline; moderated task tests with 3–5 people if they can be arranged (D7). | Docs tests green; no usability claim without moderated tests. |

### P2 — quality (absorbs optimizer and contracts)

| PR | Content | Depends on |
| --- | --- | --- |
| Q-0 | Agents designed by the Agent Architect (*Design with AI*) and the Workflow Architect get the configured default model as their quality judge, set in the API creation logic; the runtime's global default stays. Existing agents, stored workflows and explicit judge models are never changed; the self-judge note stays; local providers (Ollama) get no Anthropic dependency; a model that cannot do the structured judge verdict is reported, never silently swapped (decided by the project owner 2026-10-31). | api (+ pins), coordinated with the desktop/server plan |
| Q-1 | Publish dialog and editor show the latest test-series result for the version being published: untested / passed n of m / outdated (suite or workflow changed since). Studio only. | UX-1 |
| Q-2 | Test-series run with a model override per agent (same cases, same judge), compared with the existing case comparison; costs capped and confirmed before start. Replaces the optimizer's O-1/O-2. | PR-12, D5 |
| Q-3 | Opt-in release gate per publication. Deterministic checks and AI-judge verdicts are reported separately; judge verdicts are labeled probabilistic. Mandatory (critical) deterministic checks block and cannot be bypassed from the UI or API. Whether and how anything else can be overridden is decided separately before Q-3 is built (D6a). Existing releases unchanged. | Q-1, D6, D6a |
| Q-4 | Propose a test case from a failed run (redacted, with origin), added only after confirmation. | Q-1 |

### P3 and later

S-0 threat model (docs, now) → S-1 tool capability statement → S-2 "ask before calling" on the existing approval mechanism →
T replay of recorded tool responses in test series → A discovery. Each starts with its own short review and a
decision by the project owner.

## 5. Decisions of the project owner (2026-10-31)

| # | Decision |
| --- | --- |
| D1 | Option C. The thematic sections stay and are improved; no global beginner/expert mode. |
| D2 | Open sections are remembered permanently as a local UI preference; workflow data and exports never change. |
| D3 | The three entry points appear in the empty state and in a compact form above existing workflows; the page stays uncluttered. |
| D4 | No hidden provider dependencies. The judge model is chosen visibly; provider, cost and self-evaluation by the same model are shown. Existing configurations stay unchanged (UX-2b). |
| D5 | Optimizer merged into Q and contracts built on existing schemas, without losing their product goals. Shadow mode, migration studio and knowledge conflict detection are not built while their value is unclear; they live in the deferred backlog (§8). |
| D6 | Gates separate deterministic checks from probabilistic AI verdicts. Critical mandatory checks have no uncontrolled override. |
| D7 | Moderated tests with 3–5 people are wanted where practical; automated journey tests are built regardless (UX-J). No unproven usability claims without real user tests. |
| D8 | Independent frontend work first; larger API and runtime changes are coordinated with the desktop/server thread. |

Still open, to be decided before the step that needs it:

| # | Question | Needed before |
| --- | --- | --- |
| D6a | Override concept for non-critical gate failures: none, or a recorded owner note with reason; who may give it on the server (roles from ADR-0003). | Q-3 |
| D9 | Whether the "used in" route (UX-7) ships in the API or is computed in the studio from existing lists. | UX-7 |
| D10 | Per-tool capability statement and "ask before calling" (S-1/S-2): runtime semantics, defaults for existing tools. | S-1 |

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

## 8. Long-term innovation roadmap and deferred backlog

The draft is a product vision that stays open to review. Ideas are not deleted; they move between three states:
**active** (in a phase above), **discovery** (cheap research only: notes, user questions, a spike without product
code), **deferred** (not worked on until a re-entry criterion is met). The backlog is reviewed at every phase gate
(end of P1, end of P2) and whenever a re-entry criterion may have been met; a move to active is a decision of the
project owner.

| Idea (draft) | Product goal kept | Where it lives now | State | Re-entry criterion | Cheap discovery step |
| --- | --- | --- | --- | --- | --- |
| Model optimizer (O) | cheaper or better models chosen on evidence | Q-2 (test series with model override), recommendations later on Q data | active (in Q) | — | — |
| Agent contracts (C) | checkable expectations per agent | structured output, quality criteria, preflight, test-case checks; Q-3 gate | active (in Q) | a concrete expectation that none of these can express | collect such cases while building Q |
| Explainability (E-1–E-3) | understand a run without reading the trace | UX-6 deterministic run summary | active (in UX) | — | — |
| AI run explanation (E-4) | plain-language summary of a run | the assistant's "discuss" on runs | discovery | users ask for summaries the assistant does not give | note assistant questions about runs during user tests |
| Recorded replay, simulator (T-2, T-4) | try changes without real side effects | after Q-2, on resume and test series | deferred | Q-2 shipped and a workflow with own tools needs repeatable tests | inventory which tool calls are recorded completely today |
| Shadow mode (T-5) | compare a new version on real traffic, no effect | — | deferred | server profile in production use (after PR-12) with published APIs and an owner asking for live comparison | write the consent, cost and data-retention questions down |
| Security firewall (S-1–S-5) | every action within explicit limits | S-0 threat model now; ADR-0006, route permissions, tenants | discovery → active after PR-11/PR-13 | threat model accepted; container sandbox (PR-11) merged | S-0 document |
| Knowledge freshness and impact (K-1, K-2) | know when knowledge is old and who uses it | UX-7 "used in"; validity dates later | active (UX-7) / deferred | knowledge files updated regularly in real use | — |
| Knowledge conflict detection (K-3) | contradictions between sources surfaced | — | deferred | a verifiable method (quoted passages, structured rules) and real conflicting documents | collect real contradictions from use |
| App builder (A) | results as a small app for business users | published API, export, "Try it" form | discovery after PR-12 | a user who needs an end-user form instead of an API, and the server's auth/CSP design | ask which workflows people would share and with whom |
| Migration studio (M) | move automations from other tools | — | deferred | repeated real requests naming a source tool and version | record such requests; check the source tools' export formats when they come |
| Positioning "Build · Prove · Control" | a clear product promise | internal only | discovery | competitor and demand check done | — |

## 9. Implementation status

| Step | State | Pull request |
| --- | --- | --- |
| EVO-0 plan and inventory | done | studio #12 (merge commit `d546080`) |
| UX-1 `Section` keeps its state, `status` prop | done | studio #13 (merge commit `84a8bd1`) |
| UX-2 problems and summaries in the agent inspector | done | studio #14 (merge commit `dd656c1`) |
| UX-2b judge model transparency | done | studio #15 (merge commit `b0bf671`) |
| UX-3 open sections remembered | done | studio #16 (merge commit `25a7b7f`) |
| UX-J journey baseline, see [journeys.md](journeys.md) | done | studio #17 (merge commit `a65efee`; taken after UX-3, see journeys.md) |
| UX-4 three ways to start | done | studio #18 (merge commit `e07ec52`) |
| UX-K knowledge upload in the inspector, see [ux-k.md](ux-k.md) | done | studio #20, `ea5f61c` |
| Q-0 judge of AI-designed agents | done | api #16 `a08c9c3`, sdk #14 `e508e6b`, studio #21 `40672c1`; coordinated with the desktop/server plan |
| UX-5a `Section` for test cases, run comparison and approval items | in review | studio, this step. The inline "show result/feedback" toggles in run details, tests and batches stay plain `<details>`: they reveal one value in place and are not sections. |
| UX-5b and later | open | — |


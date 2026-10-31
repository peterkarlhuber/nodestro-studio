# Product evolution: verified inventory and UX audit (P0)

> Part of the product evolution plan, see [README.md](README.md). Read from master on 2026-10-31
> (studio `9257c64`, runtime `136f0cf`, api `c0e61bd`, sdk `7203183`, examples `9b018da`, integrations `abc4dbc`).
> Line numbers drift; component and function names do not.
>
> **What this is not:** no user study took place. Every UX finding below is either **verified** (reproduced in code or
> in a test, with the steps given) or a **hypothesis** (plausible, not observed with users). The draft plan this
> document reviews was written with AI assistance; its claims were checked against the code, not taken as facts.

## 1. What already exists, per draft work package

State values: **exists**, **partial**, **missing**, **overlaps** (with the desktop/server plan or another package),
**not useful** (now).

| Draft package | State | What is there (reuse it) | What is actually missing |
| --- | --- | --- | --- |
| UX-1 disclosure component | partial | `Section` in `frontend/src/components/ui.tsx` (`<details>` with icon, help tip, `summary`, `defaultOpen`); used by the agent inspector and the provider settings | stable open state (see F1), status/problem display on closed sections (F2), 15 raw `<details>` elsewhere (F5) |
| UX-2 agent inspector | partial | `AgentForm` (`editor/AgentInspector.tsx`, also used by the agent library): core fields (name, description, model, system prompt, task) first, then Tools, Knowledge, Memory, Output, Thinking, Quality, Advanced sections, each with a summary; "Design with AI" and "Test agent" actions; live validation `useIssues` → `POST /api/agents/validate` | problems routed to closed sections (F2), summaries that show deviations from defaults (F3) |
| UX-3 workflow, form and run views | partial | run detail is already result-first with tabs (result, prompt, context, tools, thinking, memory) in `editor/RunDetails.tsx`; preflight list with jump-to-node (`editor/CheckList.tsx`); input preview; panels collapsible (`editor/layout.ts`) | start-form file options all inline (F8, hypothesis); no short "what happened" summary of a run (hypothesis) |
| UX-4 tools, knowledge, memory | partial | tools page with library / write / generate tabs, trust class and isolation notes (`ToolsPage.tsx`, from PR-4); knowledge page with collections, OCR state, source; memory page with spaces | "used in" (which agents and workflows reference a file, tool or memory space) is missing everywhere (F9) |
| UX-5 task-centered entry | partial | "New workflow" dialog with *Manually* / *Create with AI* (Workflow Architect), example gallery on the workflows page and `/workflows/examples`, assistant handover to the architect | the three ways are not equally visible: AI creation sits behind "New workflow" plus a segmented control, the empty state offers one action and points at examples "below" (F6) |
| UX-6 docs, help | exists | 19 in-app doc chapters in six languages, help tips per field (`lib/help.ts`), global search Ctrl/Cmd+K over workflows, agents, tools, examples and docs, the Nodestro Assistant | a short glossary (agent, tool, knowledge, memory) is missing; screenshots are refreshed per release by hand (`handbuch/werkzeuge`) |
| Q quality gate | partial | test series (`nodestro-api/benchmarks.py`): cases, deterministic checks (`ConditionRule`), optional AI judge, cost cap, failure cap, `confirm_external`, version under test, **case-by-case comparison** (`improved` / `worse` / `same` / `changed`) with UI on the tests page; release pre-check (`Publications.check`, `ReleaseCheckSummary`) | the publish dialog does not show test results; no opt-in gate; no "results outdated" state |
| S security firewall | partial / overlaps | ADR-0006 `SandboxPolicy` + `tool_provenance` (trust classes, fail closed); route permissions (PR-2); identity and tenants (PR-9); `launcher.external_tools` (automatic starts name own tools and need consent); resume names tools that would be called again (`resume.side_effects`) | per-tool capability statement (network, files, read-only) and a per-agent "ask before calling" rule; both change runtime semantics |
| T time machine | partial | trace export/import (`runtime/traces.py`), run comparison page (`/executions/compare`, `lib/compare.ts`), **fingerprint-based resume that reuses unchanged steps and re-runs changed ones with a side-effect confirmation** (`runtime/resume.py`, `runs/ResumeDialog.tsx`) — this is the draft's T-1 and most of T-3 | recorded tool responses for replay, simulator adapters, shadow mode |
| O model optimizer | overlaps Q | test series per version; usage and cost log (`usage_log.py`, `/usage`) | a test run with a model override; it is a Q feature, not a product |
| E explainability | partial | run tabs show prompt, context, tool calls, thinking, memory; the assistant can discuss a run (`DiscussButton`) | a deterministic one-paragraph run summary with links into the trace |
| K knowledge intelligence | partial | `KnowledgeFile` has `created_at`, `source`, `collection`, OCR state; publishing already resolves knowledge references (`Publications._knowledge_refs`) | "used in" (F9); validity dates; conflict detection is not verifiable and not proposed |
| C agent contracts | overlaps | structured output fields, quality criteria + judge, preflight, test-case checks | nothing that needs a separate product; see the plan |
| A app builder | partial | published APIs, releases, API keys, standalone FastAPI export, "Try it" form in the publish dialog (`publish/ApiTry.tsx`) | a hosted end-user form page; needs auth/CSP design after PR-9/PR-12 |
| M migration studio | missing | — | no demand evidence; not planned |

Facts that change the draft's risk picture:

- The only integration is local OCR (`nodestro-integrations/ocr.py`). There are no e-mail, payment or CRM
  connectors. Actions outside Nodestro happen through **own Python tools** (custom or AI-generated), **server tools**
  (web search, web fetch, code execution at the provider), memory writes and knowledge proposals. A policy engine for
  "payments and e-mails" would have nothing to enforce today.
- Six model providers are supported (`lib/providers.ts`: anthropic, openai, gemini, compatible, ollama, vllm), so
  hidden Anthropic defaults matter (F7).
- There is no telemetry or analytics code in the studio. That stays so; usability measurements are local and manual.

## 2. UX findings

Each finding: evidence, who is affected, and the smallest fix. **V** = verified, **H** = hypothesis.

### F1 (V) A section closes itself when its default changes

`Section` renders `<details open={defaultOpen}>`. React applies a changed `open` prop to the DOM, so whenever the
computed default flips, the section opens or closes under the user's hands. Verified with a Vitest probe on master:
rendering `defaultOpen={true}` then `defaultOpen={false}` closes the element; a manually opened section stays open
only while the prop does not change.

Reproducible in the agent inspector:

1. Open the Memory section of an agent with memory "per run" (open by default) and click **Off**: the section
   collapses immediately.
2. Remove the last tool chip in the Tools section: the section collapses.
3. Remove the last knowledge file: the Knowledge section collapses.

Fix: `defaultOpen` applies once on mount; the open state is then the user's (optionally controlled via
`open`/`onToggle`).

### F2 (V) Problems inside closed sections are invisible

`FieldErrors` renders inside the section body; the summary line shows no problem state.

1. Enable the quality check, delete its only criterion, close the Quality section: the error
   `config.quality_no_criteria` is not visible anywhere; the summary says "0 criteria".
2. Set the output format to structured and enable citations in Knowledge with no file assigned, then select another node and come back: the
   Knowledge section is closed by default, its summary says "none", the error `config.citations_structured` is hidden.

Issues without a `field` are shown at the top, so the gap is limited to the four routed fields (`tools`,
`server_tools`, `knowledge`, `quality`). Fix: a `status` prop on `Section` (error/warning count with icon and text,
per the design system's "status always with text and icon"), plus a jump that opens the section and focuses the field.

### F3 (V) Summaries hide non-default settings

- Advanced: the summary is the static text "Limits, caching, tool choice …" even when fallback models, a forced tool,
  caching or request options are set.
- Thinking: shows only the effort level; thinking mode and display are not reflected.
- Knowledge: shows the file count only; citations and knowledge proposals are not reflected.

The draft's principle "summary instead of hiding" is right here. Fix: compute short, translated summaries of what
differs from the defaults (`lib/defaults.ts` is the reference).

### F4 (V) Section state is lost on every node switch

`Inspector` mounts `<AgentInspector key={selected.id} …>`; every selection change resets all sections to their
defaults. Someone tuning the Advanced section of three agents opens it three times. Fix: remember open sections per
section id (not per node) as a UI preference, like the panel layout in `editor/layout.ts`. Never in the workflow.

### F5 (V) Fifteen hand-rolled `<details>`

`ToolsPage` (3), `RunDetails` (3), `TestsPage` (2), `SettingsMaintenance` (3), `KnowledgePage`, `BatchesPage`,
`ApprovalCard`, `RunComparePage` use raw `<details>` with differing classes and no shared chevron, summary or
status. Not a bug; a consistency debt to pay down once `Section` is fixed, page by page.

### F6 (V) The three ways to start are unequal

On `/` the header has "Import" and "New workflow". *Create with AI* is the second option of a segmented control
inside the "New workflow" dialog. The empty state has a single "Create your first workflow" button and says "copy one
of the examples below"; the gallery follows the (empty) list. Whether this hinders first-time users is **H**; that
the AI path is two clicks deep and not named on the page is **V**.

### F7 (V) A hidden provider default in the quality check

Enabling the quality check sets `judge_model: "claude-opus-5-5"` (`lib/defaults.ts`; runtime default
`DEFAULT_ASSISTANT_MODEL = "anthropic:claude-opus-5-5"`). Someone who only configured Ollama gets an Anthropic
dependency and paid judge calls they did not choose. Changing a default is a product decision (see the plan, D4).

### F8 (H) The start form's file options are dense

Every file field shows accepted formats, format chips, multiple, max files, max size and delivery inline
(`FileFieldSettings` in `editor/FlowInspectors.tsx`). Probably the first place a new user meets "delivery" modes.
Fix candidate: an "Options" section with a summary ("PDF, up to 10 MB, automatic").

### F9 (V) No "used in" anywhere

Knowledge files, tools and memory spaces do not show which agents or workflows use them. Deleting a knowledge file
used by an agent is only noticed by the next preflight. The server side already resolves references for releases
(`Publications._knowledge_refs`, `_memory_refs`).

### F10 (H) Navigation density

Thirteen entries in four groups (workspace 5, observability 2, automation 4, help 1). Plausible but unobserved that
beginners are distracted by automation and observability. No change proposed without task tests (draft UX-5 agrees).

### F11 (H) System prompt and task are hard to tell apart

Both are large text areas with help tips. The draft rightly forbids merging `description`, `system_prompt` and
`task_template`. Whether better labels or examples help is untested; no change proposed before task tests.

## 3. Baseline that can be measured without user tracking

Reproducible, local, no cloud service:

- **Journey scripts:** six Playwright journeys (the draft's user tasks 1–6) against the scripted demo server
  (same approach as the manual's screenshot server: a studio with a fake provider client, no key), counting clicks, dialogs and visible controls until
  the goal. This measures interface cost, not comprehension; it is reported as such.
- **Moderated task tests:** three to five people, fixed scenarios, think-aloud, notes only. Requires Peter to find
  participants (decision D7); without them every comprehension claim stays a hypothesis.
- **Existing quality gates:** 8 browser suites (`scripts/e2e.sh`), Vitest, `i18n.test.tsx` (six locales complete),
  WebKit/Firefox smoke where available.

# Changelog

## Unreleased

### Platform pins: runtime 40e04b4, api e8eacd4, sdk 38082cc (Adaptive Orchestration M3–M5, 2026-10-31)

- Pins `nodestro-runtime` `40e04b4` (output contracts, capabilities, orchestrator node, pool selection, stdio MCP
  servers), `nodestro-examples` `df458e8`, `nodestro-integrations` `2c01744`, `nodestro-api` `e8eacd4` and, in
  `platform/versions.json`, `nodestro-sdk` `38082cc` and `orkexa` `b91d0b7` (the orchestration protocol, ADR 0010).
  The products section (frozen release candidate) is unchanged.
- The editor work below (limits, teams, orchestrator, selection by capability) runs against these pins; checked in
  the browser with an orchestrator run that selected its team by capability.

### Orchestrator node (Adaptive Orchestration M4, 2026-10-31)

- New node *Orchestrator* in the palette (runtime M4): an AI model delegates the task step by step to teams of its
  pool and finishes with an answer. The inspector edits the teams (with their capabilities and output contract),
  the task, the instructions, the model and the limits (maximum decisions, maximum per team) and says what the
  orchestrator may not do (no tools, nothing created, no permissions of its own).
- Teams by capability (runtime M5, `select`): the inspector edits the capabilities and the maximum number of
  teams and previews which saved teams match now; the run details show the pool with the tags each team matched.
- Run details show every decision with its reason, task, verdict (refusals in the interface language), the team's
  result and a link to the team's run.
- Texts in six languages: `flow.orchestrator.*`, `errors.orchestration.*`, `workflow.orchestrator_*`,
  `check.orchestrator_*`, `run.orchestration_limit`, `run.orchestrator_member_missing`; docs section
  `verzweigungen#orchestrator` in six languages.

### Teams: output contracts and capabilities (Adaptive Orchestration M3, 2026-10-31)

- Result node: new *Output contract* (runtime #49) with the same field editor as an agent's structured output (now
  the shared `OutputFieldsEditor`). The result files editor keeps the contract when it changes files.
- Teams in the editor: the palette lists workflows with an output contract or capabilities under *Teams*
  (`WorkflowSummary.capabilities`/`contract`, api) and adds them as a preset sub-workflow node. A double-click on a
  sub-workflow node opens that workflow; the breadcrumbs keep the way back (`?trail=`). The sub-workflow inspector
  shows what the team delivers and can do.
- Workflow settings: *Capabilities as a team*, short tags (at most 20, 40 characters each) saved as
  `capabilities`; part of undo and of the unsaved-changes check.
- Error and check texts ×6 for `run.output_contract`, `workflow.contract_field_name`,
  `workflow.contract_field_duplicate`, `check.contract_text_source` and `check.contract_field_missing`; help tips
  `workflow.contract` and `workflow.capabilities`. Docs ×6: new section *Branches → Teams* (`verzweigungen#teams`);
  the sub-workflow section now says that a sub-workflow's own budget applies as well.

### Run limits and budget reservations (Adaptive Orchestration M2, 2026-10-31)

- Workflow settings: *Most steps running at the same time* (1 to 32) and *Time limit per run* (minutes, at most
  7 days) and *Most steps per run* (1 to 10,000, every loop round counts) in the inspector, saved as `limits`
  (runtime #45, #48). Empty fields mean no limit. Help tip `workflow.limits`.
- Run details: the cost figure shows the run's budget and, when requests ran without a known upper bound (unknown
  price, images, files or provider tools), the hint *no hard maximum* with their number (runtime #43,
  `Usage.uncapped_requests`, `Run.budget_hard_maximum`).
- Error texts ×6 for `run.time_limit` and `run.step_limit`. Docs ×6: *Workflows → Budget per run* now describes reservations before each
  request and that unknown costs never count as 0; new section *Limits per run* (`workflows#limits`), including the
  limitation that a request or tool call that is already running still finishes.

### Rules for tool calls: exceptions, approvals in advance, audit trail (Evolution S-2d, 2026-10-31)

- New section **Approvals > Rules for tool calls** (`runs/ToolApprovalRules.tsx`):
  - whether per-call approvals are on;
  - the exceptions from before (legacy bindings: workflow, version or published release, step, tool, bound version)
    and the activation step that marks them (two-step button, admin; it does not switch approvals on);
  - approvals in advance: list with state (active, revoked, expired, outdated by a new tool version), revoke
    (two-step), and a form that grants one changing tool version for one schedule, batch or test series with an
    optional expiry. Reading-only, destructive and MCP tools are not offered (the server refuses them as well);
  - the audit trail (decisions, refused decisions with their reason, grants, revocations, activation steps).
- Texts in the six languages and a paragraph in the help section *Branches > Approving tool calls*.
- Nothing is switched on; no pin changes.

### Per-call tool approvals in the interface (Evolution S-2c, 2026-10-31)

- A tool call that waits for a person (per-call approvals, decision D10) shows a card in the run, at its step and on
  the **Approvals** page: the tool, its capability (reads only / changes data / deletes or destroys; stays in Nodestro
  / reaches outside; *not classified* is shown and treated as changing and external), the arguments exactly as they
  will be sent, a live countdown to the deadline, an optional comment for the agent and *Allow this call* / *Reject*.
  The decision carries the arguments hash that was shown, so a decision about a changed call or tool version is
  refused (409 `tool.approval_stale`) and the list reloads; expired cards cannot be decided. The navigation badge
  counts open tool calls too.
- Run details show what the rules did with each recorded call: approved or rejected (by whom, when, comment), no
  decision in time, refused without a question (with the reason, e.g. `tool.approval_unattended`) or allowed by a
  pre-grant.
- Texts for the approval states and the new problem codes (`tool.approval_*`, `tool.not_granted`,
  `tool.pre_grant_*`), a help tip and the help section *Branches > Approving tool calls* in the six languages.
- Nothing is switched on: the cards only appear when the backend runs with `NODESTRO_TOOL_APPROVALS=1`, which stays
  off until the security acceptance. No pin changes. The legacy-exemption overview, pre-grant administration and the
  audit view follow in S-2d.

### Platform pins: runtime 0aee6a9, api ac9d706, sdk 8cc4c8f (Evolution S-2b, 2026-10-31)

- Pins `nodestro-api` `ac9d706` (before `a06ccea`), `nodestro-runtime` `0aee6a9` (before `8597544`),
  `nodestro-examples` `9597421` (before `cf151e6`), `nodestro-integrations` `2d18a20` (before `226b75f`),
  `nodestro-sdk` `8cc4c8f` (before `8fcb94d`) and orkexa `b85133d` (before `456b92f`, via the runtime). This brings
  the per-call tool approval API (S-2b, off unless `NODESTRO_TOOL_APPROVALS=1`), the MCP write gate and OAuth runtime,
  budget reservations and run, time and step limits; the studio interface for approvals follows in S-2c.
- The examples chapter (`make example-docs`, six languages) follows the customer-service approval loop (four agents).

### Connected MCP services, pins: api a06ccea, sdk 8fcb94d (ADR-0007 WP-4, 2026-10-31)

- New tab **Tools > Verbundene Dienste**: connect remote MCP servers (name, address, token write-only; a local
  development server over loopback `http` only with explicit consent, and only where the backend allows it), test the
  connection (negotiated protocol version), review each discovered tool before any agent sees it: its description is
  shown as *foreign text*, the default classification is "changes data" whatever the service claims (its annotation
  is shown as a hint), and a changed definition shows a field-by-field diff and must be approved again. Approvals
  carry the reviewed definition hash. Tools that change data stay blocked until per-call approval is active. Notes
  explain token storage (keychain or memory only), the operator's endpoint list and unattended runs; an audit list
  shows the changes.
- Approved MCP tools appear in the library with their own trust note and can be test-run. Run details show each MCP
  call's provenance (service, tool, definition hash) and "cost of the service: unknown", never zero.
- Help chapter *Tools > Verbundene Dienste* and all texts in the six languages; light and dark theme; phone width.
- Pins: `nodestro-api` `a06ccea` (before `43a61cd`, the `/api/mcp` routes of api #28) and `nodestro-sdk` `8fcb94d`
  (before `d9ff57c`, the MCP client methods of sdk #24); runtime, examples and integrations unchanged.
- New browser suite `mcp` (`npm run e2e:mcp`, part of `scripts/e2e.sh`) against a local MCP test server with an
  injected instruction in a tool description and a scripted model: connect with consent, review, approve read-only,
  the write tool stays blocked, library test call, a run with provenance and unknown cost, dark mode, phone width.

### Loops in the editor (Adaptive Orchestration M1-7, 2026-10-31)

- A connection dragged from a branch of a decision or approval back to an earlier step becomes a **loop** (runtime
  #29): dashed on the canvas with its limit ("↻ max. 3×"), selected at once, with its settings in the new connection
  inspector: *Maximum rounds* (2 to 20, default 3) and what happens at the limit (stop the run as failed, or follow the
  other branches). Any other connection back is still refused, now with a hint how to repeat steps. A loop cannot be
  turned back into a normal connection.
- Runs: a node inside a loop shows its round ("Round 2") on the canvas; its details offer the results of every round.
  Live events archive the previous round, and the run's live totals include all rounds.
- Error texts ×6 for `workflow.loop_unguarded`, `workflow.loop_target`, `workflow.loop_overlap`,
  `workflow.loop_shared`, `workflow.loop_invalid` and `run.loop_exhausted`; the continue dialog explains
  `resume.in_loop`. Docs ×6: *Branches → Loops* (`verzweigungen#schleifen`, help tip `workflow.loop`, with the
  placeholders `{{iteration}}`, `{{previous}}` and `{{feedback}}`); *Workflows* no longer says that loops are impossible.

### Pins: sandbox gateway security fixes (2026-10-31)

- A cascade for the security fixes to the sandbox gateway of Nodestro Local Docker: runtime #33 strictly parses
  request heads, which fixes request smuggling to the Docker daemon, and runtime #37 refuses sandboxes when the
  daemon cannot enforce resource limits. The new pins:
  - nodestro-runtime `8597544` (before `b6b757b`; it also carries the tool approval groundwork, off by default);
  - nodestro-examples `cf151e6` (before `8a5862e`);
  - nodestro-integrations `226b75f` (before `3afd7e4`);
  - nodestro-api `43a61cd` (before `262fb4d`; OpenAPI regenerated);
  - nodestro-sdk `d9ff57c` (before `25fff6d`).

  orkexa stays at `456b92f`. No studio change.

### Pins: flow kernel, loop connections, MCP provenance (2026-10-31)

- One cascade for Adaptive Orchestration M1 (the engine on the `orkexa.flow` kernel and loop connections with
  mandatory limits) and the MCP tool provenance (runtime #28): orkexa `456b92f` (before `76883f7`, via the runtime),
  nodestro-runtime `b6b757b` (before `78d2899`), nodestro-examples `8a5862e` (before `6c88aa7`),
  nodestro-integrations `3afd7e4` (before `f204d39`), nodestro-api `262fb4d` (before `5ca1c75`), nodestro-sdk
  `25fff6d` (before `635fcff`). No studio change yet: the editor support for loops follows separately.

### Test case from a failed run (evolution plan Q-4, 2026-10-31)

- The details of a failed run offer *Add as test case*. The dialog shows the test case the server proposes
  (`POST /api/runs/{id}/test-case`, api #24): the run's form values, free text and files, with credentials always
  and personal data by default replaced, plus what was replaced, missing files and values that no longer fit the form.
- Nothing is stored until the person picks a test series of the workflow (or a new one) and confirms. The series is
  read again just before the case is appended. The run stays unchanged.
- In the test series the case shows its origin (date, replacements, link to the run). Hand-written cases are unchanged.
- Docs ×6: *Automation → Test case from a failed run* (`automatisierung#testfall-aus-lauf`), help tip
  `automation.caseFromRun`, error texts `testcase.*`. Browser test: the flow suite fails a run and adds it as a case.

### Pins: Nodestro Local Docker, runtime 78d2899 (2026-10-31)

- One cascade for Nodestro Local Docker (the `local-container` profile, the sandbox gateway, access-key sessions with
  strict host and origin checks), which also carries the MCP runtime work (runtime #25) and the test case proposal
  API (api #24, evolution plan Q-4): nodestro-runtime `78d2899` (before `d2cb987`), nodestro-examples `6c88aa7`
  (before `1c2f1e4`), nodestro-integrations `f204d39` (before `9221d46`), nodestro-api `5ca1c75` (before
  `1c34474`), nodestro-sdk `635fcff` (before `5974075`), in `pyproject.toml` and `platform/versions.json`. orkexa
  and the `products` section are unchanged. No studio code changes: the settings page already hides the built-in
  sandbox notice where tool code runs only in containers.

### Pins: runtime d2cb987 (2026-10-31)

- One cascade, agreed with the PRICING-1 thread: nodestro-runtime `d2cb987` (before `45e7774`; strict price-mode
  refusals get their own error codes), nodestro-examples `1c2f1e4` (before `786c453`), nodestro-integrations
  `9221d46` (before `4c5edff`), nodestro-api `1c34474` (before `3c0ffa2`), nodestro-sdk `5974075` (before `82e1d77`),
  in `pyproject.toml` and `platform/versions.json`. The `products` section is unchanged. No studio code changes.

### Release gate, evolution plan Q-3 (2026-10-31)

- **API dialog → Limits → Release gate** (opt-in per published API): choose test series, the minimum share of passed
  cases and optionally a minimum AI rating. Without a gate publishing is unchanged; versions already published stay
  as they are.
- With a gate, the publish dialog shows the gate's report instead of the plain test status, in three separate
  groups: mandatory checks, check results and AI ratings (marked as a probabilistic AI verdict). Mandatory checks
  block and cannot be skipped. If only check results or AI ratings fail, the version can be published with a reason
  of at least 10 characters, which the API stores with the release and in its history. The versions list marks
  releases as *gate met* or *released with reason*.
- Texts, help tips and the docs section `api-und-export#freigabe-gate` in six languages; the error codes
  `gate.blocked`, `gate.override_required` and `gate.suite_unknown`.
- Tests: `publish/Gate.test.tsx` (groups kept apart, no override for a blocked version, a reason is required and
  sent trimmed); e2e `api` switches the gate on and checks that an untested version is blocked.
- Pins: nodestro-api `3c0ffa2` (before `3782f19`; api #22, also fixes saving an edited test series), nodestro-sdk
  `82e1d77` (before `6107d1c`; sdk #19), in `pyproject.toml` and `platform/versions.json`.

### Model prices and cost reconciliation, PRICING-1 P7 (2026-10-31)

- Uses the api pinned by Q-2 (`3782f19`: `/api/pricing`, usage `cost_state`, prices in the model list). Orkexa resolves
  prices and calculates every cost; the studio only shows and edits the price catalog.
- New **Settings → Model prices**: staleness of the price list (warning after 48 hours, *out of date* after 7 days),
  last error, *Check prices now*, the price mode (*Standard* warns, *Strict* refuses requests without a reliable
  price), every price with status (current, stale, unknown, waiting for review, individual), quality, source and
  check date, individual prices (contract prices, corrections) with a way back to the reference price, reviews of
  changes above the threshold (apply or reject) and the change history. A server's reference prices are read-only
  for workspaces.
- New **Settings → Compare with provider bills**: compares the estimates with the OpenAI and Anthropic billing APIs
  per day and model, with adjustable thresholds (default: more than 5 % and more than 1 USD). The desktop never
  stores admin keys (environment variables or a one-off key that is cleared after the request); a server stores
  them encrypted.
- **Usage**: a partly priced cost reads "at least …" and an unpriced one "–", never 0; a notice counts the unpriced
  and the stale-priced requests; the price versions, sources and lowest quality the costs were calculated with are
  listed below the tables. Days whose cost is a lower bound get a striped bar.
- The **model picker** and model selects flag unknown, stale, individual and pending prices. Error texts for the
  strict price mode's refusals (`pricing.price_unknown`, `pricing.price_unreliable`, `pricing.stale_price`; the first
  two come with runtime #24, `d2cb987`, which the pins pick up in the next cascade).
- Help chapter *Usage and costs* in six languages: new sections *Model prices*, *Price mode* and *Comparing with
  provider bills*; the outdated sentence "Nodestro knows prices only for Anthropic models" is gone.

### Built-in Linux sandbox on the desktop (2026-10-31)

- The desktop runs AI-generated tools in the built-in Linux sandbox of `nodestro-runtime` (runtime #23, `45e7774`):
  Landlock, seccomp and resource limits, applied by the tool's own process before any tool code is read. Nothing
  has to be installed. It counts as isolation only on the tested systems (Ubuntu 24.04 and Debian 13, x86_64,
  normal user); anywhere else, and on the server, untrusted code still needs a container or is blocked. There is no
  fallback to an unprotected process, and approving generated code does not change its trust class.
- Settings show whether the built-in sandbox is active and, if not, why (unsupported or untested system, missing
  kernel feature, running as root, failed self-test). The Tools page says where an AI-generated tool runs. Texts in
  six languages; the help chapters *Tools*, *Settings*, *Getting started* and *AI architect* describe it. ADR-0006
  records the built-in sandbox; the error `sandbox.isolation_required` carries a `reason`.

### Comparing models in a test series, Q-2 (2026-10-31)

- The start dialog of a test series has **Test other models**: choose another model for single agents and run the
  same cases with the same AI judge. Only models that differ from the saved ones are sent; such a run needs a cost
  limit, since earlier runs cannot estimate it. The saved workflow does not change. The runs list marks the run as
  *Model comparison* and names the replaced models; the existing comparison shows them next to the date. The test
  status of a version (Q-1) ignores these runs, since they tested a variant.
- Built on nodestro-api #20 (`BenchmarkStart.models`, `BenchmarkRun.models`). Texts, error codes and help in six
  languages; the automation chapter has a new section *Comparing models*. The flow e2e suite runs a comparison.
- Pins (one cascade, agreed with the PRICING-1 and desktop/server threads): orkexa `76883f7` (before `cbf6df3`),
  nodestro-runtime `45e7774` (before `c6bc2e5`; model prices and the built-in Linux sandbox), nodestro-examples
  `786c453` (before `86c58a1`), nodestro-integrations `4c5edff` (before `652c231`), nodestro-api `3782f19` (before
  `f55bd80`; PRICING-1 API, Q-2 and the assistant live-event fix), nodestro-sdk `6107d1c` (before `ba4ef84`), in `pyproject.toml` and
  `platform/versions.json`. The `products` section is unchanged. The studio frontend for prices and the sandbox
  follows in their own pull requests.

### Glossary, README screenshots and journeys after P1, UX-8 (2026-10-31)

- New help chapter **Terms** (`begriffe`) in six languages, right after the *Introduction*: workflow, agent, tool,
  knowledge, input file, memory, run, version, publication, test series and approval, each with a link to the
  chapter that says more. Knowledge versus input file and version versus publication are told apart explicitly.
- The README screenshots (`docs/screenshots`: editor dark and light, run, tools) are retaken in English with the
  current interface by `frontend/e2e/readme.mjs` against `tests/e2e_flow_server.py`. The assistant screenshot is
  unchanged.
- Journeys: new J6b checks a tested version in the publish dialog (Q-1), 2 actions and 1 page change. The results
  after P1 stand next to the baseline in `docs/evolution/journeys.md`; J1 to J6 are unchanged. No usability claim:
  moderated task tests (D7) have not been arranged.

### Release candidate v0.2.0-preview.1 (2026-10-31)

- Docs only, no pin change. `docs/desktop-server/release-checklist.md`: the steps of every release. `RELEASES.md`:
  candidate, publish and release as three separate steps started by a person, the results of candidate
  `v0.2.0-preview.1` (built from studio `78710ce`, not published), the tested Linux systems (glibc 2.39 or newer).
  `platform/versions.json` `products`: desktop `67122b7` and server `5bc7b82` with `candidate: v0.2.0-preview.1`.

### Test status when publishing, Q-1 (2026-10-31)

- Studio only, no pin change. The publish dialog shows, for the version about to be published, the latest result
  of each test series of the workflow: *untested*, *n of m passed*, or *outdated* when the latest finished run tested
  another version or the test series changed after it. The versions dialog shows the same for the saved version.
  A test run started on the "current state" counts for the version saved last before it started. The result only
  informs; it does not block publishing. If the test series, the versions or the runs of a series cannot be loaded, it says so with
  *Reload* instead of showing *untested* or *no test series*. Built from the existing `/api/benchmarks` routes (`automation/testStatus.ts`).
- Texts in six languages (`testStatus`); the publishing and versions sections of the help describe it. The api e2e
  suite checks the dialog without and with a test series.

### "Used in" for knowledge files, tools and memory spaces, UX-7 (2026-10-31)

- The Knowledge page (under each file), a tool's details and a memory space show **Used in**: the saved workflows
  (agent or start node), library agents and published APIs that use the object, each as a link. The data comes from
  the new read-only API route `GET /api/used-by` (nodestro-api #17; decision D9: an API route), which needs the `read` permission and covers only
  the request's tenant.
- Pins: nodestro-api `f55bd80` (before `a08c9c3`) and nodestro-sdk `ba4ef84` (before `e508e6b`), in `pyproject.toml`
  and `platform/versions.json`. The `products` section is unchanged.
- Deleting a used knowledge file or tool opens a dialog that names the users and what deleting does to them; an
  unused object keeps the two-step delete button. Clearing a memory space names its users in the confirmation.
  Deleting itself is unchanged.
- Texts in six languages; the Knowledge, Tools and Memory chapters describe it. The journeys suite checks the list,
  the dialog and the link outside the timed journeys, so their counts stay comparable.

### Run summary on the run page, UX-6b (2026-10-31)

- Studio only, no pin change. The run page shows a short summary under the key figures: how many steps succeeded and
  how many were skipped, the path the decisions took, how approvals were decided, which tools were called how often
  (with errors) and the step where the run failed, with *Go to step* to open its details. It is built only from the
  stored run (`runs/runSummary.ts`), without a model call; a decision or approval whose outcome the run did not record
  shows as "not recorded". Texts and the runs chapter in six languages.

### Start-form file options in one section, UX-6a (2026-10-31)

- Studio only, no pin change. In the Start node's inspector, each file field's accepted formats, number of files,
  size limit and delivery sit in a closed *File options* section (finding F8). Its summary names the current choice
  in one line, for example "all formats · up to 20 MB · several files · Automatic"; in the narrow inspector the
  summary gets its own line instead of being cut off. The form JSON is unchanged; the settings themselves did not
  change. Texts and the file inputs chapter in six languages.

### Tools and settings use the shared section, UX-5b (2026-10-31)

- Studio only, no pin change. A custom tool's *View code and tests*, the attempts of a generated tool, the versions
  of the diagnosis and the list of local backups are now `Section`s, with the same chevron and title as the rest of
  the studio (finding F5). Before, the code section imitated `Section` without its chevron and the others were small
  unstyled disclosures. Content and order are unchanged; all four start closed as before.
- Left as plain `<details>` on purpose: the sandbox output of a tool check, the provenance of a knowledge file and
  the details of one diagnostic check. They reveal one value in place and are not sections.

### Releases, M6 (2026-10-31)

- Docs and metadata only, no pin change. New `docs/desktop-server/RELEASES.md` covers:
  - the release steps;
  - the release manifest;
  - signing: nothing is signed, and the doc lists what each platform would need;
  - the supported-platform matrix (Linux x86_64 desktop preview, Linux amd64 server preview, everything else not
    built or not tested);
  - update and rollback.
- `platform/versions.json` `products`: desktop `3ee764a` and server `e8a4899`, both built from studio `5a1cf56`.
- `IMPLEMENTATION_STATUS.md` records M6.

### Test cases, run comparison and approval items use the shared section, UX-5a (2026-10-31)

- Studio only, no pin change. The test-case editor of a test series, the agents of the run comparison and the
  items of an approval are now `Section`s (finding F5): the same chevron, title and summary as the agent inspector,
  and an open state that belongs to the person. Before, their `open` followed the data: an approval that gained an
  item while open closed the item being read, and removing the first test case forced the next one open. Content
  and order are unchanged. `Section` takes an extra `className`.
- Left as plain `<details>` on purpose: the "show result" and "feedback" toggles in run details, test results and
  batch rows, the tool-call list and the adoptable inputs. They reveal one value in place and are not sections.

### Plan status: PR-12 and PR-13 done (2026-10-31)

- Docs and metadata only, no pin change. `docs/desktop-server/IMPLEMENTATION_STATUS.md` marks PR-12 done
  (nodestro-server #1 and desktop #3 build from studio `6b73625`; server end-to-end tests 15 of 15 in CI) and records
  PR-13.
- New `docs/desktop-server/sandbox-prototype-report.md`: the Linux bubblewrap candidate (runtime #17, `f3931e8`)
  passes every security probe of ADR-0006 but stays non-isolating until the remaining compatibility checks pass. It
  lists what is missing for macOS, Windows and aarch64.
- `platform/versions.json` gains `products`: the desktop and server commits and the studio commit each one builds from.

### Default model as judge of AI-designed agents, Q-0 (2026-10-31)

- Pins: `nodestro-api` at `a08c9c3` (before `f119cfc`), `nodestro-sdk` at `e508e6b` (before `2ed893a`). Agents designed by
  *Design with AI* and by the Workflow Architect now get the default model from the settings as their judge model,
  instead of the runtime's global default judge (`anthropic:claude-opus-5-5`). A workspace on Ollama or another
  provider therefore gains no hidden Anthropic dependency. The check stays off; the runtime's global default,
  existing agents, stored workflows and explicitly chosen judges are unchanged. The self-judge note still shows
  when agent and judge are the same model.
- When the default model cannot return the structured verdict of a check, the design dialog shows the new note
  `draft.judge_unsupported` with the model's name. No other model is chosen. Texts in six languages, and a sentence
  in the agents chapter.

### Agent inspector: upload knowledge in place, UX-K (2026-10-31)

- Studio only, no API or pin change. The agent's *Knowledge* section has an *Upload file* button. It uses the
  existing `POST /api/knowledge`, so the file is stored permanently in Knowledge, the same library as the Knowledge
  page, and is assigned to the agent as an ordinary unsaved change: *Undo* and *Discard* remove the assignment, not
  the file. A refused upload assigns nothing (the server keeps nothing either). A note in the section says where the
  file is stored; run input files keep their "only for this run" wording. The accepted formats are shared with the
  Knowledge page (`lib/knowledge.ts`). Journey J3b measures the new path: 5 actions and 1 page change instead of
  10 and 4. Concept in `docs/evolution/ux-k.md`; texts and the agents and knowledge chapters in six languages.

### Server deployment, PR-12 (2026-10-31)

- Pins: `nodestro-runtime` at `c6bc2e5` (before `8eea1ea`), `nodestro-examples` at `86c58a1` (before `9b018da`),
  `nodestro-integrations` at `652c231` (before `abc4dbc`), `nodestro-api` at `f119cfc` (before `c0e61bd`),
  `nodestro-sdk` at `2ed893a` (before `7203183`). They bring persistent jobs and workers (PR-10), tools with libraries
  in the container sandbox (PR-11) and the `nodestro-server` command with settings validation, encrypted tenant
  secrets and the model endpoint allowlist (PR-12).
- Texts in six languages for the new error codes: locks without hashes, wheels only, hash mismatch, image build
  failed, model endpoint not allowed, unreadable secrets; `deps.docker_unsupported` is gone because libraries now
  run in the container sandbox.
- `docs/desktop-server/IMPLEMENTATION_STATUS.md` records PR-10 to PR-12; ADR-0001 no longer describes the server
  profile as unavailable.
- The image, development stack, runbook and end-to-end tests live in the new `nodestro-server` repository, which
  pins this studio commit.

### Workflows page: three equal ways to start, UX-4 (2026-10-31)

- Studio only, no pin change. The empty Workflows page offers three tiles: *Create with AI* (the new-workflow
  dialog in AI mode, then the Workflow Architect), *Start from an example* (the gallery) and *Build it yourself*
  (the same dialog, manual mode). Before, the AI way was a segmented control inside the *New workflow* dialog and
  the empty state had a single button (finding F6, decision D3). With workflows present, the three ways are one
  narrow row above the list. *Import*, *New workflow*, `/workflows/examples` and deep links are unchanged; nothing
  is created without the dialog. Texts and the workflows chapter in six languages.

### Journey baseline, UX-J (2026-10-31)

- New browser suite `journeys` (`frontend/e2e/journeys.mjs`, `tests/e2e_journey_server.py`): the six user tasks
  of the evolution plan, walked through against a studio whose model answers every request (no key). It counts
  actions, dialogs, page changes and visible controls until each goal and writes a report to `$JOURNEY_REPORT`;
  CI uploads it as the `journeys` artifact. The counts are reported, not asserted. Baseline, method and limits
  in `docs/evolution/journeys.md`; it measures interface cost, not usability.

### Fix: empty links in translated hints (2026-10-31)

- Studio only. Seven translated hints marked their link as `<link>…</link>`. `<Trans>` treats `link` as a void
  HTML element, so it rendered an empty, invisible link followed by the plain word: "No files yet. Upload them under
  *Knowledge*" in the agent's Knowledge section, the missing-tools hints in the Tools section and in *Design with
  AI*, the Architect's two cost limit hints and two documentation links led nowhere. The markup is now `<a>…</a>`; a
  language-file test rejects void element names as markup. Found by the journey baseline (UX-J).

### Agent inspector: open sections remembered, UX-3 (2026-10-31)

- Studio only, no pin change. The agent form remembers which sections you opened or closed, per section and in this
  browser (`localStorage`, key `nodestro-agent-sections`, like the editor layout). Before, every node switch reset all
  sections, so tuning *Advanced* on three agents meant opening it three times. A section you never toggled keeps its
  default. The preference never enters the workflow, the undo history or an export (decision D2).

### Quality check: judge model chosen visibly, UX-2b (2026-10-31)

- Studio only, no pin change. A quality check switched on for the first time starts with the default model from the
  settings as its judge instead of the fixed `claude-opus-5-5`, so it adds no provider or cost the user did not
  choose (decision D4). New agents carry that model too. Existing checks and stored agents keep their judge.
- The section summary names the judge; the judge field says which provider is paid for each check and revision and
  whether that provider is set up; a note appears when the judge is the agent's own model (self-evaluation).
- Not changed: agents designed by the AI (Workflow Architect, *Design with AI*) still get the runtime's default judge
  (`anthropic:claude-opus-5-5`); changing that is a runtime default and is planned separately.

### Agent inspector: problems and changed settings visible while collapsed, UX-2 (2026-10-31)

- Studio only, no pin change. Problems of the agent check are shown on their section while it is closed ("1 error",
  "2 warnings"); a line *Problems in* at the top lists those sections and opens and focuses the one you pick. Before,
  for example, a quality check without criteria was reported only inside the closed *Quality check* section.
- Problems of a field no section knows are shown at the top instead of not at all.
- Summaries name what differs from a new agent: *Advanced* lists fallback models, tool choice, own limits, caching,
  tool-error and refusal handling, example messages and request options (or "defaults"); *Thinking and effort* adds
  thinking mode and display; *Knowledge* adds citations and knowledge proposals. Texts and the agents chapter in six
  languages. No configuration value or stored agent changes.

### Collapsible sections keep their state, UX-1 (2026-10-31)

- Studio only, no pin change. A collapsible section (agent inspector, provider settings) no longer opens or closes
  by itself when its content changes: choosing memory "Off" or removing the last tool or knowledge file used to
  collapse the section you were working in. The state you choose stays until you change it.
- Changed behavior: adding the first tool, knowledge file or memory no longer opens the section by itself (you are
  already in the open section when you add one there). Sections still start open for an agent that has tools,
  knowledge or memory.
- Sections can now show problems in their title line (errors and warnings with icon and text), visible while
  closed; the agent inspector uses this in the next step (UX-2). New texts in six languages.

### Product evolution plan, P0 (2026-10-31)

- Docs only: `docs/evolution/README.md` (reviewed plan accepted with the owner's decisions D1–D8,
  pull request plan, deferred innovation backlog with re-entry criteria) and
  `docs/evolution/inventory.md` (verified inventory, UX findings F1–F11). No code, no pin change.

### Server storage and logins, M3 PR-7 to PR-9 (2026-10-31)

- Pins: `nodestro-runtime` 8eea1ea, `nodestro-examples` 9b018da, `nodestro-integrations` abc4dbc, `nodestro-api`
  c0e61bd and `nodestro-sdk` 7203183 (before: d6e75b7, 31b5714, 99cdd2c, 0f439ea and 1c24f55); merge commits.
- The runtime and API can now keep a tenant's data in PostgreSQL and log people in with OpenID Connect (server
  profile, still refused until PR-12). The studio you start with `nodestro` or the desktop app is unchanged.
- When the API answers `access.login_required`, the studio sends the browser to the login page once and comes back
  to the same page afterwards.
- New error texts `access.cross_site` and `identity.login_expired`, `identity.login_failed`, `identity.provider`,
  `identity.no_tenant`, `identity.bootstrap_invalid`, `identity.not_a_member`, in six languages; the German launch
  texts now use "du" like the rest of the interface.

### Desktop launch secret, M1 PR-6 (2026-10-31)

- Pins: `nodestro-api` 0f439ea and `nodestro-sdk` 1c24f55 (before: cd4b198 and b001667); merge commits.
- With `NODESTRO_LAUNCH_SECRET` (set by the desktop app) only the app's window can use the studio API; other
  programs and web pages get `access.launch_required`. Without the variable (the `nodestro` command) nothing changes.
- New error texts `access.launch_required`, `access.launch_used`, `access.launch_invalid` and the documentation
  section "The desktop app" (introduction chapter), in six languages.

### Sandbox policy and trust classes, M1 PR-4 (2026-10-31)

- Pins: `nodestro-runtime` d6e75b7, `nodestro-examples` 31b5714, `nodestro-integrations` 99cdd2c, `nodestro-api`
  cd4b198 and `nodestro-sdk` b001667 (before: e90c205, 649ef70, e96d91f, d8ed049 and 7aee149). All are merge commits.
- **Security, changed behavior (ADR-0006):** AI-created code and tools of unknown origin run only in the Docker
  sandbox; your approval or a setting does not change that. Without Docker, *Create with AI* is disabled with an
  explanation, tool drafts cannot be tested or approved, and agents with such tools are blocked by the workflow
  check. Tools saved before this version and all tools after a restore count as of unknown origin.
- Tools show their origin (*Built-in*, *Written by you*, *Needs isolation*) and where they may run; new error texts
  `sandbox.isolation_required`, `sandbox.libraries_need_isolation`, `sandbox.unavailable`; settings, export note and
  the documentation chapter "Trust and isolation" (tools), plus notes in settings and AI architect, in six languages.
- Browser tests: the architect suite checks that a draft is refused without isolation and registered with Docker
  (a test-only container double stands in for Docker); the python suite checks the origin note and that generating
  needs Docker. ADR-0006 is marked accepted with implementation notes.

### Storage seams, M1 PR-3 (2026-10-31)

- Pins: `nodestro-runtime` e90c205, `nodestro-examples` 649ef70, `nodestro-integrations` e96d91f, `nodestro-api`
  d8ed049 and `nodestro-sdk` 7aee149 (before: 8ea9a5c, f90d3a1, 81d88ce, b794ebe and f450f2c); orkexa unchanged.
  All are merge commits on master.
- The runtime reaches SQLite only through its storage classes and records a database schema version; a future
  migration first writes a backup to `<data_dir>/backups/`. Existing data directories are not changed.
- Restoring a backup whose database comes from a newer Nodestro version is refused with a message in six languages
  (`backup.schema_too_new`).
- `docs/desktop-server/IMPLEMENTATION_STATUS.md`: the state of the desktop and server plan, updated after every step.

### Operating profile and route permissions, M1 PR-1 and PR-2 (2026-10-31)

- Pins: `nodestro-runtime` 8ea9a5c, `nodestro-examples` f90d3a1, `nodestro-integrations` 81d88ce, `nodestro-api`
  b794ebe and `nodestro-sdk` f450f2c (before: ad75859, 520fa72, c747842, 43595a7 and d733f02); orkexa unchanged at
  cbf6df3. All are merge commits on master.
- `nodestro --profile desktop|server` (`NODESTRO_PROFILE`): `desktop` is the default and today's behavior; `server`
  stops the start with a sentence that names what it still needs.
- **Security, changed behavior:** the studio has no login yet, so it only answers this computer. `--host 0.0.0.0`,
  `::` or another network address and network names or `*` in `NODESTRO_ALLOWED_HOSTS` now stop the start; requests
  forwarded by a reverse proxy are refused (`request.forwarded_not_allowed`). Published workflow APIs keep their
  separate network access. The settings chapter (six languages) says so; the error texts for
  `request.forwarded_not_allowed`, `access.login_required` and `access.forbidden` exist in all six languages.
- Every studio API route declares a permission (read, edit, run, admin); on the desktop the local owner holds all of
  them, so nothing changes in the interface. An empty `NODESTRO_DATA_DIR` now means `~/.nodestro`.

### Desktop and server plan, M0 (2026-10-31)

- Documentation only, no behavior change: `docs/desktop-server/` describes the current architecture as an inventory
  (SQLite and FTS5 access, process-only state, the data-directory lock, endpoints and trust boundaries, code
  execution) and the plan for Nodestro Desktop and Nodestro Server with thirteen pull requests, risks and the test
  baseline. `docs/adr/` records the six proposed decisions: operating profiles, storage backends, identity and
  tenants, jobs and workers, desktop packaging, sandbox policy. `docs/PLATFORM.md` links to both.

### Release check (2026-10-30)

- Pins: `nodestro-api` 43595a7 and `nodestro-sdk` d733f02 (before: 2868b7b and 18e5535); runtime ad75859, examples
  520fa72, integrations c747842 and orkexa cbf6df3 are unchanged. The API fixes an `assistant.busy` race after an
  answer finished and two backup races, and refuses damaged backup archives with `400` instead of `500`.
- Workflow editor: in Firefox, a divider drag released outside the window kept the divider captured, so the next
  mouse move still resized the panel and the next click (e.g. on Assistant) was swallowed. The drag now ends when the
  button is no longer pressed or the capture is lost.
- Browser tests: `E2E_BROWSER=firefox` or `webkit` runs `scripts/e2e.sh` in another Playwright engine (Chromium stays
  the default). The README states the tested platforms: Linux; macOS, Windows and Safari are not tested.

### Platform integration (2026-10-30)

- Pins: `nodestro-runtime` ad75859, `nodestro-examples` 520fa72, `nodestro-integrations` c747842, `nodestro-api`
  2868b7b, `nodestro-sdk` 18e5535; orkexa unchanged at cbf6df3. `make check-versions` and `make platform-local` say
  "pins agree", and the combination was installed and tested together from these commits.
- Example chapter (`beispiele.md`, six languages) regenerated with `make example-docs` from the examples of the pinned
  commit; it matches the patch of the examples round, and `python -m nodestro_examples.docs --check` passes.
- Error texts in all six languages for codes that had only a generic sentence or none: `run.no_event_loop`,
  `workflow.node_duplicate`, `deps.install_interrupted`, `deps.build_required`, `document.encrypted`,
  `check.input_form_only`, `backup.restore_running`, `backup.too_large` and `export.integration_tools`.
  `document.unreadable` explains why a file cannot be read.
- OCR: the settings, the knowledge page, the error text and the documentation name every prerequisite (Tesseract with
  language data for one of the six languages, `pdftoppm` and `pdfinfo` from Poppler); before, only Tesseract and
  `pdftoppm` were mentioned.
- Python libraries: the dialog and the documentation no longer claim that resolving downloads package information
  only; a package without a wheel is built from source, which runs its build script.
- Documentation: an approval's comment reaches later agents but not result nodes, result files or decisions;
  `{{input}}` right after a start node with a filled-in form holds the form values only (use `{{run.input}}`).

### Workflow editor

- The three panels around the canvas behave the same way: building blocks (left), properties (right, the inspector)
  and the execution overview (bottom) each have a hide/show button in their header and a divider that resizes them by
  dragging, with the arrow keys (Shift for larger steps), Home/End, or a double-click to restore the default size. The
  dividers are WAI-ARIA window splitters with labels in all six languages. Sizes and open states are remembered in the
  browser (`localStorage`, `nodestro-editor-layout`) for every workflow; stored values are validated and clamped, and
  CSS keeps the canvas usable when the window shrinks. Layout changes never mark a workflow as changed, never create
  an undo step and do not affect a running workflow.
- The building blocks are now a sidebar next to the canvas instead of a floating box that could cover nodes. Hidden,
  they leave a 44px rail with the core blocks as icons (with tooltips), so dragging and clicking keep working. On
  phones an open palette lies over the canvas.
- A hidden inspector leaves a rail that names the selected node; a double-click on a node shows its properties. The
  selection is kept while the inspector is hidden.
- The execution overview shows its figures in one compact row; before the first run it takes only their height. Steps
  and details scroll independently, and picking a node on the canvas shows its run details again.
- Undo of a node drag now restores the position before the whole drag (it previously only undid the last few pixels).
  Typing in one field is one undo step until another field, node or action follows; before, typing was not undoable
  on its own and an undo of an earlier step could silently revert text typed later. Name, description and budget of
  the workflow are part of the history.
- A building block dropped on the canvas is centered under the pointer at every zoom level (the fixed pixel offset
  was applied before the zoom conversion). Invalid drag data no longer throws; files dropped on the canvas by mistake
  no longer replace the page.
- Edits made while a save request is running stay marked as unsaved (they were marked as saved before). Ctrl+S during
  a running save sends no second request.
- With the assistant open or in narrow windows, the secondary title actions become icon buttons (with accessible
  names) instead of overflowing; the *Save* button was partly hidden behind the inspector at 1280px with the assistant
  open. The overview map hides on very narrow canvases. Double-clicking the canvas no longer zooms.
- Exported workflow file names keep non-ASCII letters (e.g. "Übersicht").

### Other areas

- Deleting a run, a schedule, a knowledge file, a memory file, an agent template, a tool, a result file or an API key
  now needs a second, confirming click on the same button ("Really delete?"); before, a single click deleted
  immediately.
- With the assistant open, the main navigation becomes an icon rail below 1440px so the page keeps its room; navigation
  items show their name as a tooltip.
- On phones, the theme switch and the provider hint in the header show as icons, so every header control stays on
  screen (the theme switch was cut off at 390px).
- Documentation overview cards no longer show raw Markdown (`**decision**`); chapter introductions render Markdown.
- Knowledge files of type HTML, SVG or XML are downloaded instead of opened inside Nodestro's own address.
- The run steps in the execution overview are a proper list of buttons for screen readers.

### Repository

- All technical documentation is now in English: README, CHANGELOG, PROVENANCE, `docs/ARCHITECTURE.md` (was
  `ARCHITEKTUR.md`), `docs/PLATFORM.md` (was `PLATTFORM.md`, a stub keeps old links working),
  `docs/PROJECT_DESCRIPTION.md` (was `PROJEKTBESCHREIBUNG.md`) and the design system guide; screenshots have English
  file names. CI error messages and the Makefile are English. The localized interface, help and examples remain in all
  six languages.

### Earlier unreleased changes

- Security: `nodestro --host 0.0.0.0` no longer answers foreign host names (DNS rebinding), but every IP address, the
  name of this computer and `NODESTRO_ALLOWED_HOSTS` (`nodestro-api` 1ca296b); the settings help says so in all six
  languages. SDK pin at 21e947b (event streams of the TypeScript SDK end with the caller).
- "API & Export" → "Try it": "Check request" and "Start test run" are disabled until the sample request has loaded.
  An early click used to check empty content and report missing fields (this was also the cause of the sporadically
  failing browser test `e2e/api.mjs`).
- The API error messages `request.host_not_allowed` and `request.origin_not_allowed` (protection against DNS
  rebinding and cross-site requests) in all six languages; the help names `NODESTRO_ALLOWED_HOSTS`.
- Platform: pins at the current states of runtime, examples, integrations, API and SDK (`platform/versions.json`).
- CI: current actions (Node 24), checkout without persisted credentials.

## 0.2.0 (2026-10-29)

- First version as a separate repository: split off from `nodestro` 0.1.0 (commit 15e2076, now `nodestro-legacy`),
  without new features and without behavior changes. The origin of every file: PROVENANCE.md.
- Dependencies pinned to exact commits (orkexa `cbf6df3d6f727b96924f1ae66e60b469eeef58e6`); the tested combination is
  in `nodestro-studio/platform/versions.json`.
- CI with the repository secret `NODESTRO_READ`.
- The distribution is still called `nodestro` with the `nodestro` command (same options) and the same data in
  `~/.nodestro`; `pip install -U` replaces 0.1. New: an upgrade test with real 0.1 data and the platform pipeline.

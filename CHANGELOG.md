# Changelog

## Unreleased

### Limits handled on a step, failure causes in words (RT-067, 2026-11-08)

- A step whose agent answered after its thinking filled the token limit shows "Answered without thinking: token
  limit" (`reasoning_reduced="output_limit"`), and one that answered at its tool-round limit shows "Answer at the
  tool-round limit" (`NodeRun.limits_handled`, live via the `limit_handled` event). Both explain in a tooltip what
  happened and what to change.
- `run.agent.IncompleteResponseError` is read by its `cause` (since nodestro-runtime RT-067): thinking that used
  the whole limit gets its own text and hint ("lower the effort or raise Max. tokens"); a full context window and a
  too long answer keep theirs. A `run.agent.MaxToolRoundsError` whose calls repeated (`looping`) now says that the
  agent asked the same thing again and that more tool rounds rarely help. Older runs read as before.
- Help (Agents → Limits) describes the new behavior in all six languages.

### Pin wave W7, TABRION JQ-4 (2026-11-08)

- Pins nodestro-runtime f5da80d (runtime #143, TABRION JQ-1..JQ-3, RT2-03: writes are never repeated after a lost
  connection; no schema change, no public signature change), axentra 9c4666f (axentra #61, MIG-AXE-0, B-06-1: values
  of database errors are redacted from logs, traces and stored errors), nodestro-examples 4d46e22 (#91),
  nodestro-integrations 2b19279 (#79), nodestro-api 221f9e1 (#113: regression test for a lost export enqueue reply)
  and nodestro-sdk f97de2f (#105). Orkexa is unchanged (792a041). `scripts/check_versions.py`: pins agree.

### MUP-ONA close-out (2026-11-07)

- docs: ADR-0011 records the full-text search semantics as an addendum to ADR-0002 (MUP-ONA O10); ADR-0002 is unchanged.
- docs: `STATUS.md` marks MP-A5 and MP-A6 accepted with their merge-commit CI and states that MUP-ONA is technically
  complete; `docs/TODO.md` drops ST-MUP-B3 (G1 report), ST-MUP-O10 (ADR-0011) and ST-MUP-A9 (A9 report, ADR-0010).
  The WebKit rest stays in ST-019.

### MUP-ONA B6 cascade (2026-11-07)

- Pins nodestro-runtime 81b0f55 (runtime #140: the knowledge base, file store and memory run on orkexa's
  `orkexa.backends.postgres`; `pg_generic` and `sqlcheck_rules` are removed; a start check refuses a deviating
  knowledge schema with `storage.schema_mismatch`; no DDL), orkexa 792a041 (orkexa #66), nodestro-examples e063e89
  (#89), nodestro-integrations e1e0cd4 (#77), nodestro-api 05e0232 (#109: the start check in `check`, `api` and
  `worker`) and nodestro-sdk ee38fb0 (#104). Axentra is unchanged (60d83b3).
- `platform/versions.json` names orkexa's pyproject, so `scripts/check_versions.py` now also compares orkexa's
  version (0.2.0.dev0; it said 0.1.0 before).
- The six texts for `partition.missing` are removed: the code left the runtime catalog (orkexa raises its own error).

### MUP-ONA B4 cascade (2026-11-07)

- Pins nodestro-runtime 76f9cb2 (runtime #137: the tenant SQL rule engine as `sqlcheck_rules`; #138: the generic
  PostgreSQL part `pg_generic` with a statement catalog and a partition guard; behavior unchanged), nodestro-examples
  647f501 (examples #85), nodestro-integrations 0a1c440 (integrations #73), nodestro-api acf09cd (api #107) and
  nodestro-sdk 890c032 (sdk #99). Orkexa and Axentra are unchanged (028faa1, 60d83b3).
- Follow-up pins: nodestro-runtime df4aeb3 (runtime #139: the B4 SQL rendering tests skip without psycopg, so the
  desktop profile's `components` job passes), nodestro-examples c9ef422 (#87), nodestro-integrations fe2fa12 (#75),
  nodestro-api e5b5281 (#108) and nodestro-sdk d372eee (#101).
- New text in six languages for `partition.missing` (a knowledge or memory request not tied to this workspace is
  stopped before anything is read or changed).

### MUP-ONA B2 cascade (2026-11-07)

- Pins nodestro-runtime d9c3d6e (runtime #134 reindex switch embeds what the last round left, #135 Axentra 60d83b3,
  #136 orkexa 028faa1: MUP-ONA B2 SQLite backends), nodestro-examples a0edd20 (examples #84), nodestro-integrations
  7413f53 (integrations #72), nodestro-api 44212bc (api #105: `agent.VectorError` answers 422) and nodestro-sdk
  bda96c1 (sdk #97); `platform/versions.json` names orkexa 028faa1 and Axentra 60d83b3, the commits the runtime pins.

### MUP-ONA B1/B3 cascade (2026-11-07)

- Pins nodestro-runtime 099f4d4 (runtime #130 B1 orkexa conformance suite, #131 B3 PostgreSQL ranking drift fixes
  and bounded reindex switch, #132 sandbox gateway fix), nodestro-examples b8998b2 (examples #83),
  nodestro-integrations 31b4f8a (integrations #71), nodestro-api 2685925 (api #104) and nodestro-sdk 2d866d2
  (sdk #96); `platform/versions.json` names orkexa b3d6fae, the commit the runtime pins.
- New text and hint in six languages for `run.agent.VectorError` (an embedding model returned a vector that cannot
  be used: not a number, or another number of dimensions than the knowledge index).

### MUP-ONA A1 cascade (2026-11-07)

- Security (A1, PS-1): the platform pins carry the PDF limits. The runtime reads PDF text in a separate process with
  page, character, time and memory limits; an upload with a PDF over a limit is refused with `document.too_complex`
  (`name`). New texts in six languages for `document.too_complex` and `document.limits_invalid` (`variable`).
- Pins nodestro-runtime de56875 (runtime #127: A1, B0), nodestro-examples cda07c4 (examples #82),
  nodestro-integrations cb90fe5 (integrations #70), nodestro-api 63af1df (api #103: A1, B0; includes api #102) and
  nodestro-sdk 4596be3 (sdk #95); `platform/versions.json` names orkexa f89102c and Axentra 273e675, the commits the
  runtime pins.

### TODO abatement round 5 (2026-11-07)

- Missing local model: when the readiness check read from the model registry, before any download, that a model
  outside the catalog cannot do what the action needs (`ModelProblem.from_registry`, nodestro-runtime RT-062), the
  dialog says so ("its entry in the model registry says so, so it was not downloaded") instead of calling the model
  installed. The missing-model e2e server reads a stand-in registry, so the suite never reaches registry.ollama.ai.
- Agent test: key figures (`source: "tool"`) that no tool call of the test computed are listed per field with their
  value and reason (`AgentTestResult.value_warnings`, nodestro-runtime RT-054), with what a workflow run would do;
  e2e section 11 of the flow suite.
- Exports: a server's package build that waits for a worker (`ExportJob.queued`, nodestro-api API-048) says
  "Waiting for a worker" without a progress bar, and Cancel withdraws it; a failed build's text gets the job's
  `error_params` (size and limit of `export.server_too_large`). In-app docs updated in six languages.

### TODO abatement round 4 (2026-11-07)

- Welcome page: the logo's intro no longer animates a blur filter. WebKitGTK without a GPU (CI, and the Linux
  desktop app on such machines) crashed the page's renderer on it in about 1 of 12 loads (ST-019); the welcome
  suite logs a crashed renderer and CI's `browser-engines` job prints the browser's own output. ST-034 is closed:
  WebKit opens the welcome page on a desktop-style launch.

- Pins: nodestro-runtime f26dac4 (runtime #126: a busy sandbox image build stays `checking` (LD-020), Bedrock region
  in usage, registry facts before a download, `pgvector_status()`, the price-table date fix of runtime #125; runtime
  #128: the legacy fixture restore test skips without psycopg; MUP-ONA A11 runtime #123), nodestro-examples 570ef4f,
  nodestro-integrations c3623bd (integrations #68: OCR parallelism and program memory limits, INT-001/INT-004),
  nodestro-api 77f53be (api #99/#100: queued export builds, worker heartbeat) and nodestro-sdk f404cf3.
- Tests: suite `local-server` (`scripts/e2e.sh`) runs the local models end to end against a fake Ollama over HTTP
  (`tests/fake_ollama.py`, `tests/e2e_local_models_server.py`): stop and start, a measured download checked against
  the catalog, a failed download and Try again, the speed measurement, import refusals and real GGUF and offline
  package imports, the semantic index and a local agent run from the editor, in six languages, both themes, desktop
  and phone width, with axe (ST-043).
- Tests: suite `portable` (opt-in, needs the network on a cold cache; CI job `browser-portable`) builds a real
  portable package from the publish dialog, cancels one build, downloads the ZIP and checks its contents and every
  SHA256SUMS checksum, and shows the dialog in six languages (ST-047).
- Settings → Local models: a job that starts and ends between two polls of the job list (a quick speed measurement
  or import) now refreshes the overview too; before, the measured speed or the imported model appeared only after a
  reload.
- `e2e/localModels.mjs` expects 409 for a second setup (API-062).

### MUP-ONA master implementation plan (2026-11-06)

- docs: the security and database-backend master plan MUP-ONA (Orkexa, Nodestro, Axentra) is versioned in
  `docs/architecture/mup-ona/`: the English translation `MUP-ONA.md` (binding after the client's approval of the
  translation check), the central execution state `STATUS.md` and `reports/` (translation check; later the gate
  reports G1, G2 and A9). `scripts/mup_translation_check.py` compares the German reference with the translation.

### TODO abatement round 3 (2026-11-06)

- Settings → Members (server, administrators): lists the workspace's members with their roles, changes a role and
  removes a member after a confirmation; owner choices appear only for owners, and the API's answers (last owner,
  owner required) are shown in place. Texts in six languages, also for `identity.owner_required`.
- Exports: a member who can edit deletes an export and its package; `export.server_quota` explains the tenant's
  export quota with used space and limit.
- Settings → Local models: a semantic reindex whose server worker stopped explains `knowledge.reindex_interrupted`
  in six languages.
- Pins nodestro-runtime b29b738 (runtime #121: semantic reindex as a server job), nodestro-examples 4b947c4 (#79),
  nodestro-integrations bf15c68 (#67), nodestro-api 8efbfbb (api #96: member routes, `DELETE /api/exports/{id}`,
  export quota, reindex jobs, idle tenant contexts) and nodestro-sdk 1ee487c (sdk #90 and #92: stream reconnect,
  streamed downloads, batch and schedule methods).

### TODO abatement round (2026-11-06)

- Pins: orkexa 1b61fda (orkexa #55), runtime 3d69702 (#120), examples 82d894b (#77), integrations 1e73e29 (#66),
  api a3bd875 (#93), sdk 7714de0 (#87, version 0.3.0).
- Pins (round 2): api 56fa762 (#94: idempotency reservation, usage period read, assistant file retention,
  `params.display`, tool version history, library copy `memory_space`), sdk 1306cbe (#89).
- Runs list and run comparison show why a run failed as "<step>: <reason>" from the run's cause; the run banner uses
  it when the step's data is not at hand (ST-003, AD-02).
- Usage page: a "Budgets and limits" card with each published API's cost of the last 24 hours against its daily
  limit, and the runs of the period a budget stopped or holds for a decision (ST-014, AD-20).
- Local catalog models show a localized marker ("(lokal)", "(locale)" …) and their descriptions in every interface
  language; the studio handles runtime labels with and without "(local)".
- Settings → Local models: "Not reachable" for an external server that does not answer, one CPU saving sentence,
  one name for the tool-agent task, server wording for a server's tenants, decimal byte units everywhere (sizes in
  one sentence share a unit), no "Download and install" next to "Try again" after a failed setup.
- Assistant chat files show their upload percentage.
- Model parameters: declared token limits of an OpenAI-compatible endpoint can be set in its provider card; effort
  warnings appear at the field; the server tools texts are provider-neutral.
- Settings search: Ctrl+K offers it as its last group (`/settings?search=`) and knows the reasoning and output limit
  sections; it also finds the local model parts that appear only when available; leaving with unsaved provider input
  asks first.
- Versions dialog: each changed step lists its changed fields (model, tools, …) with a line diff of system prompt
  and task.
- Run results list the knowledge sources the agent's searches returned (file and page, number of passages).
- New agents: a task that is only `{{input}}` shows as a placeholder chip with a switch to the text; "Empty
  template" opens an unsaved form and creates the template on Save.
- The agent form suggests the local model for the agent's task next to the model picker (with reasons; it never
  changes the model by itself).
- Texts in six languages for `run.agent.MaxToolCallsError` (Orkexa ORK-029, with the link to the agent's advanced
  settings), `assistant.provider_rejected_messages`, `input.assistant_file`, `export.server_limit`, `lease.lost`
  and the known tasks of `local.task_unknown`.
- Editor: its dialogs mount on first opening; the editor code starts loading when the pointer or focus reaches a
  workflow.
- More translation keys are checked as closed sets (settings groups, local build steps and problems, GPU state).
- Browser tests: ports are configurable (`E2E_PORT_OFFSET`, every suite takes its URL), the missing-model suite
  (with the batch Fix case) and the recorded local models suite run in `scripts/e2e.sh`; a non-blocking CI job runs
  welcome, a11y and settings-ui in Firefox and WebKit; CI reports the full `npm audit` without failing; axe-core is
  no longer held back by Dependabot.
- mypy covers every script (branding, Docker and platform smoke, social preview).
- Docs: desktop/server status, releases and the S-2 worker concept match the current state.
- Settings: a field whose value differs from its default (`GET /api/settings/defaults`, nodestro-api API-061) shows
  "Changed" and a reset action next to its label; an API without the route shows no marks (ST-059).
- Editor palette: the team hint names a team's output fields by their localized label from the contract
  descriptions in the workflow summaries (nodestro-api API-053), and by id only without one (ST-032).
- Copies of examples: the run dialog offers the example's sample files as one-click inputs per file field (ST-007),
  and the editor and run headers show a "Sample data" badge naming the connections that run offline, both from the
  copy's stored origin (nodestro-runtime RT-055; ST-031).
- Settings, maintenance: administrators set how long assistant chat files are kept (empty: as long as their
  conversation; nodestro-api API-056), and the storage clean-up names the removed chat files.
- Error texts name the missing workflow, run or publication when the API sends its name (`params.display`), and
  `idempotency.in_progress` has a sentence of its own.
- The adoption dialog of an AI-created tool shows what the AI changed since the person's previous own version (written
  in the editor or adopted): a line diff of the code and the tests above the full code, or a note that there is
  nothing to compare (ST-036; needs nodestro-api `GET /api/tools/{name}/versions`).
- The copy dialog of an example whose agents keep persistent memory offers the copy's own memory space, prefilled
  from the copy's name and checked with the runtime's name rule; empty shares the example's space as before
  (examples EX-007; needs nodestro-api `memory_space` on the copy route).
- Editor performance: the number formatters are created in idle time, not in the editor's first render; the profile
  of the remaining long tasks is in ST-004.
- The remaining dynamic translation keys built from backend codes are typed as closed sets; the i18n browser sweep
  opens the main dialogs and hovers the settings help tooltips (ST-060).

### Settings, attachments and providers (2026-11-06)

- Pins: orkexa 566aa3c (orkexa #54), runtime 62527d1 (#119), examples 97bf788 (#76), integrations 2e975ad (#65),
  api a799912 (#92), sdk b3ae8c7 (#86); `platform/versions.json` updated, `check_versions.py` agrees.
- The assistant chat takes your own files: choose, drop or paste PDFs, documents, tables, text and images. Each
  file shows how the model reads it (natively or as text); use it again in the chat or save it to knowledge.
- Settings: the content is wider by default (1120 px instead of 760 px) and its right edge can be dragged or moved
  with the keyboard (remembered, "Standard width" resets); a search finds single settings in every language;
  "Models and budget" is grouped with "Advanced" parts, and unsaved changes there survive other saves.
- A gear at the top right opens the settings from every page (also Ctrl+, / ⌘,) and returns where you were; it
  replaces the sidebar item.
- Fixed: tooltips in dialogs (for example "Write missing tools as drafts") were hidden behind the dialog; they now
  show above it and stay in the window. Clearer help texts for budget, Workflow Architect, OCR, backup and more.
- Agent options follow the model's capabilities, with the reason when one is not available; new section
  "Model output limits" for the Workflow Architect, assistant and other built-in AI steps.
- Reasoning is shown live in the assistant, run chat, workflow runs, Workflow Architect and agent test (status,
  thinking text, summary, not transmitted, not exposed), with a global and a per-conversation display setting.
- Local model setup and downloads show each step, whether action is needed, measured progress and a remedy; a
  required local model that is missing opens one dialog to download it or pick another ready model, and the
  original action continues with your inputs; schedules and checks get "Fix".
- Fixed: Word and Excel result formats showed raw keys (`flow.files.formats.docx/xlsx`); a missing text now never
  shows as its key, and tests check every key built from a value in all six languages.
- New page "Publications" (Automate & test): every published API with its workflow, status, active version, date
  and export history; "Open API & Export" opens that workflow's dialog, also after a reload.
- Runs explain a provider's refused conversation and a too-large conversation (`run.provider_rejected_messages`,
  `run.provider_context_exceeded`) in six languages, with help in the Runs chapter.

### Product findings of the manual review (2026-11-05)

- Texts follow the current behavior in all six languages: an attended run pauses at its budget and waits for a
  decision (runs from schedules, batches, test series and the API stop), team runs below an orchestrator have no fixed
  budget share, the effort hint names only OpenAI-compatible endpoints (the Ollama connection passes the effort),
  the knowledge test search uses the configured search method, adopting AI-created code works for local use (not on a
  server or in Nodestro Local Docker), and "Create with AI" names the assistant model the Workflow Architect drafts
  with; its readiness check now also needs that model's provider.
- No internal feature switches in the interface: the tool approval, MCP server and service address texts no longer
  name environment variables or internal review steps (a quality test keeps it that way; operator settings such as
  the data folder, allowed host names and billing admin keys stay named).
- New Ollama agents start at effort medium like the runtime's default, so the CPU saving mode applies to them;
  vLLM and other OpenAI-compatible endpoints keep the model default.
- Knowledge search settings list installed embedding models first and warn before a build with a model that is not
  installed; the offline import offers packages only for a model server Nodestro manages.
- Small fixes: German "Strg+K" in the search button and the shortcut table, "Memory" as the German building block
  name, "changed just now" in the runs workflow filter and the search, the full start-blocking reason on hover in the
  editor title bar, and fit badges that wrap so the model catalog's actions stay visible at 1440 px.
- The strict offline mode text names its full scope (only Ollama; OpenAI-compatible and vLLM endpoints are refused
  also on this computer, for assistants and price checks too), the knowledge index shows "unavailable" where the
  installation cannot hold vectors, and `pricing.offline_sync` has a message; the unused
  `run.budget_waits_interrupted` message and the unused `export.private_repository` message (Orkexa is public) are
  gone.
- In-app docs and README follow the current behavior in all six languages (budget pause, global search scope, theme,
  node kinds and loops, sandbox limits, code adoption, MCP and service addresses without internal switch names, Low
  effort and the CPU saving mode, run filters); the examples chapter is regenerated for nodestro-examples f015a4d.
- Pins: nodestro-runtime 57b40d2 (runtime #116: strict offline mode outside runs, orchestrators with models without
  a reasoning effort, expired budget decisions end a run failed, index unavailable without sqlite-vec),
  nodestro-examples f015a4d (#74), nodestro-integrations 9a5c955 (#63), nodestro-api f796916 (#90: no price check in
  the strict offline mode, server batches and test series follow their runs), nodestro-sdk 8c4c9ff (#83).

### UX round 3 (2026-11-04)

- Global search (Ctrl+K) finds runs (the newest 100) and shows recent runs and workflows for an empty query; it also
  reaches the Local models, Knowledge search and About settings sections. The search button's accessible name now
  contains its visible text (WCAG 2.5.3; axe-core 4.14).
- Runs list and run page: expired budget decisions no longer show as waiting, a filter for runs waiting on a budget
  decision, same-named workflow copies are told apart, no "Ready" on a step with errors; the runs table fits at
  1280 px in all six languages.
- Sandbox refusals name the blocked tool; the tool header separates who created a tool from how it runs ("Runs:
  isolated only"); texts that named environment variables tell the user what to do.
- Typed Bedrock model ids ask `GET /api/models/capabilities`; on tablets Escape closes the inspector drawer.
- Help tips in the versions dialog and the gate report, links from the Settings chapter into the settings sections;
  French uses typographic apostrophes throughout (with a test); Orkexa is named "the agent engine", no longer
  "agent library" (the name of the Agent library page). The Usage page says MCP and service fees are not included.
- Local models settings: downloads only with a running model server (with one sentence on what to do), sizes in GB,
  distinct button names per model and task, scrollable tables on phones, no English catalog notes.
- API & Export dialog: one export check per pause in typing (it took 2.7 to 10 s per keystroke), the last answer
  stays visible, the build waits for a current check, provider names instead of ids, clearer portable package
  texts; the help chapters match the dialog in six languages.
- Examples: result fields take their label from the description, also inside collected results, so no English field
  ids appear in a run; the preview shows team deliverables, team and part names and model needs in words.
- Adapted to nodestro-api #87 (backward compatible): texts in six languages for `workflow.not_found`,
  `run.not_found`, `publication.not_found`, `export.server_unsupported`, `export.busy`, `export.server_too_large` and
  `local.invalid_package`; Settings > Local models works for server tenants without hardware details ("On the
  server"); knowledge search keeps within the API limits; export download needs and model licenses
  (`license_source`) are named in words.

### Backend audit round 3 (2026-11-04)

- `nodestro` stops on a taken port with exit code 2 and one sentence (another Nodestro or program, start with
  `--port`) after the configuration checks, and no browser opens the other program; "Nodestro is running at" and
  the browser follow once the server listens (DX handover B2, nodestro-api #87).
- Pins nodestro-api 5ee13f7 (api #87: portable export hardening, server export jobs only with the operator opt-in,
  tenants see no machine details in Local models, `*.not_found` codes, DX fixes), nodestro-runtime 40c8c06 (runtime
  #113: backend audit round 3), orkexa e9c2147 (orkexa #49: a stale managed Ollama is reclaimed), axentra 0a1d1cc
  (axentra #41: API keys answer 403 while their creator lacks the rights), nodestro-examples 64e534a (examples #71),
  nodestro-integrations 8687e09 (integrations #61) and nodestro-sdk abdf686 (sdk #79: regenerated types,
  `update_settings`). The example chapters are regenerated (`make example-docs`).

### Portable export (2026-11-04)

- The *API & Export* dialog offers two packages: the FastAPI source project (unchanged) and a ready-to-run package
  (its own Python, every library, a launcher, optionally the local models with Ollama and a web interface; nothing
  to install on the target computer). For the package you choose the target platform, the local models, offline
  operation and the result folder; the summary shows every model with its role, size, memory, license and whether it
  is included, plus the providers and network needs. The package is built in the background with progress and
  cancel; the last builds stay listed with their download. The README language starts with the studio's language.
  Texts in six languages. Needs nodestro-api with the export jobs (api #85).
- Pins nodestro-api b55793a (api #85: portable export), nodestro-runtime c6f0240 (runtime #112), orkexa 22f2910
  (orkexa #47: the Ollama runtime for another platform), nodestro-examples ed350b2 (examples #69),
  nodestro-integrations f299ecf (integrations #60) and nodestro-sdk 4ec713e (sdk #77: regenerated types).

### Key figures from a tool (2026-11-04)

- Pins nodestro-runtime 2f1de71 (runtime #108 to #110), nodestro-examples c05ae45 (examples #67), nodestro-integrations
  c349b64 (integrations #59), nodestro-api 3536268 (api #84) and nodestro-sdk 1b50d00 (sdk #76); orkexa 6e61862
  (orkexa #45, #46: local Ollama agents with a structured result call their tools).
- In the agent's output format, a number field can be marked *From a tool* (`OutputField.source = "tool"`, checkbox
  with help in six languages; the workflow's output contract has no such switch). The runtime then accepts the value
  only when a tool of the run computed it, so a condition never decides on an estimated figure. New messages for
  `run.value_unverified`, `check.value_source_type` and `check.value_source_no_tool`, the built-in tool
  `table_totals` in the tool catalog, and the manual chapters *Agents* (output format table) and *Tools* (built-in
  tools) in six languages. The example chapter is regenerated: production-downtime now computes its downtime share
  with `table_totals` (live with `qwen3.5:4b`: 4.62 % instead of an estimated 2.83 %, so the quality check runs).

### Local models: build from files, hardware and speed (2026-11-03)

- Pins nodestro-runtime 7cb9b4b (runtime #107: in the CPU saving mode the quality judge of a local thinking model also
  answers without the thinking phase, and a local model server gets 60 minutes per request instead of the SDK's 10),
  nodestro-examples 36488a6 (examples #65), nodestro-integrations 40d6053 (integrations #58), nodestro-api 5951197 (api
  #83) and nodestro-sdk e58249b (sdk #75).
- The browser smoke test checks the hardware panel of *Settings → Local models* and the per-agent model plan in an
  example's copy preview against the real API. ST-045 and ST-046 are done and leave `docs/TODO.md`.
- *Settings → Local models → Build from local files* (ST-045): builds a catalog model with source "build"
  (`mdenseon:307m`) from its weights and template files on the computer that runs Nodestro, without a download. It
  lists the expected files (from `build_inputs` when the API sends them), shows the build step, cancels, explains
  every failure (wrong checksum of the weights or template file, missing file, incompatible file, reference vectors
  not reproduced, cancelled) with a retry, and after the build points to rebuilding the semantic index. In the strict
  offline mode the catalog offers only the build for such a model. Texts, help and the manual section in all six
  languages.
- *Settings → Local models → This computer* (ST-046): the detected hardware, the model server's state, GPU use and
  context window (set by Nodestro, reported by the server, or unknown), the runtime's hints (small context window with
  the `OLLAMA_CONTEXT_LENGTH` fix for an external Ollama, CPU only, low memory, slow or too large models), whether each
  model runs here (the runtime's `fits`), measured generation and prompt speeds with "Measure speed" (never
  estimates), and the switch "CPU saving mode for thinking
  models" (`local_reasoning`). Steps and agent tests that answered without the thinking phase carry a "Reasoning
  reduced" badge. The workflow check explains `check.local_context_small`, `check.local_max_tokens` and
  `check.local_reasoning_saving`; the model picker names how a local model runs here. Six languages, help and manual.
- Copying an example in a workspace with local models (EX-011) shows each agent with its task in plain words, what it
  needs, the installed model the copy gives it and why (`GET /api/library/{id}/models`), a better model that needs a
  download with a link to the local models settings, and the judge's model. A select per agent offers the suitable
  installed models first and every installed chat model; changed choices go to the copy as `models` and always win.
  Cloud workspaces are unchanged. Six languages, help and manual.
- Pins orkexa 4ec738c (orkexa #44: robust hybrid fusion), nodestro-runtime 3006ce0 (runtime #106: CPU saving mode,
  context window and hardware advice, benchmark job), nodestro-examples be55542 (examples #64: agent task profiles),
  nodestro-integrations f5a25d6, nodestro-api c2a2ad3 (api #82: local advice, benchmark, per-agent model plan) and
  nodestro-sdk 98a697e (sdk #74: regenerated types).

### Local models, embeddings and semantic knowledge search (2026-11-03)

- *Settings → Local models*: the state of the local model server (managed on the desktop, the Local Docker container,
  an operator's server), installing the pinned runtime (download or offline release archive, SHA-256 checked),
  start/stop and start with Nodestro, recommendations per task for this computer with their reasons, the model
  catalog with download size, memory need, license and whether the installed build is the checked one, downloads,
  offline import (offline package or GGUF file), moving the model folder (copy and check, or use as is), job progress
  with cancel, and the strict offline mode.
- *Settings → Knowledge search*: full text, semantic or combined search, the embedding model and the semantic index
  (build, rebuild, cancel, remove); each searching agent can keep the setting or choose its own method.
- Costs of local requests read "local, no API billing" instead of a total of 0; mixed usage adds the number of local
  requests. Local models in the model picker say so instead of a price.
- The welcome page links to the local models setup. Texts, error messages, help and the manual chapters (local models,
  offline import, strict offline mode, search methods) in all six languages.
- The e2e servers keep the cloud defaults (`tests/e2e_defaults.py`): a new installation now defaults to local models.
- *Settings → Local models*: the switch "Prefer European models" (Mistral Ministral 3 and Devstral Small 2 as
  alternatives; Qwen stays the default, a manual choice always wins, the preference never leads to a cloud service).
  Catalog rows show the vendor, an EU badge and models that only fit one task (Devstral: coding). The manual explains
  the switch, the optional LightOn mDenseOn embedding and why thinking effort "low" switches thinking off.
- When local models are not set up yet, the reason next to the blocked start links to *Settings → Local models*.
- Pins orkexa 71f8aaf (orkexa #43: offline mDenseOn build), nodestro-runtime 90ba97b (runtime #103, #104: European
  catalog entries, no thinking at effort "low", 32k context for the managed Ollama, mDenseOn build job),
  nodestro-examples 7b79fde, nodestro-integrations 3026776, nodestro-api a24f32b (api #80, #81) and nodestro-sdk
  6c487bc (sdk #73).

### Platform pins: backend audit round 2 (2026-11-03)

- Pins nodestro-api 7c195ed (api #77: the export works on installations without test tools, such as the server and
  desktop images) and nodestro-sdk f44d156 (sdk #69).
- Pins nodestro-api 84ca99d (api #74 and #75: security headers with a strict `script-src 'self'`, request body limits,
  uniform error answers, idempotent run start, keyset run list), nodestro-runtime 140d479 (runtime #96: PostgreSQL
  migration backup lock fix, resume and pool fixes, budget request labels), nodestro-examples 8499edf,
  nodestro-integrations e2582cc (OCR page pixel cap), nodestro-sdk d68c67b, orkexa bc8c4ed (orkexa #40) and Axentra
  a872242 (axentra #31, #32, #38).
- The app serves the interface through `nodestro_api.frontend.mount_frontend`, the typed scripts are type-checked
  (API2-16), `check_versions` requires the canonical pinned reference for every component (API2-09), and CI installs
  the public sibling repositories anonymously (OPS2-05).

### Journeys and editor performance, UX round 2 (2026-11-03)

- Budget: the new-limit field of the budget card and the maximum budget in the settings use the language's decimal
  mark ("0,03" next to a hint that says "2,50"); either mark is read back. English times with seconds read
  "8:04:02 AM" like the other times, and a price checked on a day no longer shows "12:00 AM".
- Sandbox: the runtime's English details (Docker output, built-in sandbox reasons) are folded under "Technical
  details" and marked as English; the badge next to the mode says "Docker not running" or "Docker not ready" instead
  of "Docker not found" when the checks found Docker. The workflow check, the tool page and a failed run offer "Open
  Settings → Sandbox" where AI-created code is blocked.
- Tool adoption: the dialog says what changes on this computer (blocked now or isolated in which sandbox, and where
  the tool runs once adopted).
- Runs: the list's filters live in the address (`/executions?status=failed` works, and coming back from a run keeps
  them); a filter without matches says so and offers "Show all runs"; every column, also the delete action, fits at
  1440 px. In the editor's run panel a long step status wraps (es, fr, it, pt-BR), and the steps keep their room
  below a budget or approval card.
- Editor opening (ST-004): fewer renders while the editor opens (zoom label on its own, node data reused while
  equal, memoized panels and canvas, cached number formatters). `npm run perf:editor` (`e2e/perf-editor.mjs`)
  measures it: nine-node workflow, CPU 4x slower, median of five, mount 1884 → 1335 ms, total blocking time
  1557 → 956 ms.

### Navigation, settings and editor, UX round 2 (2026-11-03)

- Settings has a contents list grouped by task (setup, costs, running, maintenance) with deep links to every section
  and provider; links from a blocked Start, a failed run or an example's requirements open the right provider and offer
  "Back to the workflow" or "Back to the run".
- The navigation can be collapsed to an icon rail; in the editor it collapses automatically. The theme offers
  "System" and follows the operating system by default; the pre-paint theme script moved to `public/theme-init.js`, so
  a strict `script-src 'self'` policy works.
- Ctrl+K also goes to pages and settings sections. F6 / Shift+F6 move between the editor's title bar, palette,
  canvas, inspector and run panel. At tablet widths (761–1100 px) the inspector opens as a drawer on selection.
- Sandbox settings say what to do about Docker once; the budget card names the waiting agent by its label when the
  runtime sends one. Smaller fixes: provider select width, toasts no longer cover Save buttons, the help tip stays
  below the inspector footer, the tracked `frontend/node_modules` symlink is gone.
- Error sentences in six languages for the API's request and routing codes (`request.malformed`, `route.not_found`,
  `method.not_allowed`, `publication.slug_taken`, a size limit on `request.too_large`); `request.invalid` lists the
  fields of either answer shape.

### Languages and built-in docs, UX round 2 (2026-11-03)

- Docs in all six languages: the start chapter, the Python libraries chapter, tool errors and the FAQ described the
  sandbox before Docker-first (AI-created tools in the built-in Linux sandbox by default, packages built from source on
  this computer, "switch to the Python process"). French usage docs named the settings page "Paramètres".
- Terms: pt-BR and es use "fluxo de trabalho"/"subfluxo" and "flujo de trabajo"/"subflujo" everywhere (budget card,
  editor node, hints); it says "sotto-workflow", de "Unterworkflow". The English interface and docs follow US spelling
  ("canceled", "color", "analyze", "recognized").
- A status badge in the run's key figures wraps instead of being cut off at phone width.
- New checks: translations keep every English placeholder; de, es, it and pt-BR keep the informal address and the
  workflow terms (interface and docs); docs name interface paths with the navigation labels; `e2e/i18n.mjs` also
  checks badges and a 390 px phone width.

### Docker Desktop: the sandbox test in one command (2026-11-02)

- `scripts/mac_docker_test.sh` (macOS, Linux) and `scripts/docker_test.py` (also Windows: `py -3.13
  scripts\docker_test.py`): from a checkout, look at the computer and Docker (context, `DOCKER_HOST`, Linux or
  Windows containers, cgroup version, memory, Docker Desktop version, what the runtime's reduced docker environment
  sees), install the studio into its own virtual environment, run `scripts/docker_smoke.py`, print PASS/FAIL per step
  in plain language and write a redacted report (`.txt`, `.json`, `.zip`; no environment dump, tokens, keys, URL
  passwords or home folders). Cleans up only its own containers (by owner label), its data and environment, and with
  `--remove-images` the images it pulled or built. Docker Desktop is quit only with `--stop-docker-desktop`, after
  asking. Guide: `docs/testing/docker-desktop.md`.
- `scripts/docker_smoke.py`: counts and inspects only the containers of its own installation
  (`org.orkexa.sandbox=nodestro-<id>`), not those of another Nodestro on the same engine; checks the memory, swap,
  CPU and process limits of the running container, that the sandbox image matches the engine's architecture (arm64
  on Apple silicon), the diagnosis (`GET /api/diagnostics`) and that each reason has the sentence the interface
  shows; one PASS/FAIL per status stage (cli, daemon, preflight, image, self-test); waits for the engine to really
  stop (Docker Desktop takes a while), `--stop-engine-prompt` for quitting it by hand, `--start-engine`, JSON
  commands for Windows paths; `--results` writes the checks with their step.
- `.github/workflows/docker.yml`: job `one-command` runs the wrapper itself from a fresh checkout on `ubuntu-latest`
  (Docker Engine) and `macos-15-intel` (Colima), including the real stop and start, and checks that only the test's
  resources are gone and the report has no token.

### Platform pins: Nodestro–Axentra migration close-out (2026-11-03)

- Pins: nodestro-runtime `bcfea7f` (#93 static tenant SQL check round-3 gaps and tool-job stop on suspension, NF-1;
  #94 real-engine resolve tests; #95 security review round 4 Lows R4-3 to R4-7), orkexa `0861c1b` (orkexa #38
  self-test environment fix), Axentra `2767a2e` (axentra #28 and #29: invitation tokens kept out of URLs, GET OIDC
  start refuses invitations), nodestro-examples `9dd0c1a`, nodestro-integrations `b3c7c90`, nodestro-api `f21fd6a`
  (#71 warm Docker monitor, #72 NF-1, #73) and nodestro-sdk `d12ba72` (#64, #65). The security fixes were accepted
  by the separate agent review (rounds 4 and 5); that is not an external sign-off.

### Platform pins: Docker-first follow-up (2026-11-02)

- Pins: nodestro-runtime `958be1d` (#90 R-1 source builds only on the desktop and R-5 container shape checks, #91 MCP
  container deadline 15 minutes, #92 R-4 tool adoption), nodestro-examples `8c338d3` (#52), nodestro-integrations
  `e71bf55` (#48), nodestro-api `b8139b0` (#70: adoption route, export sandbox image note) and nodestro-sdk `3a99c25`
  (#63). orkexa stays `dec66eb` (orkexa #37 changed only CI, docs and test fixtures). Each change was accepted by
  an independent review.

### Adopting AI-created tools as one's own, desktop only (R-4, 2026-11-02)

- Tools → Library: on the desktop, an AI-created tool offers *Adopt as my own code*. The dialog shows the whole code
  and tests of the version, a warning that adopted code runs without isolation, and needs an explicit confirmation
  checkbox; it sends the shown `content_hash`, so a tool changed meanwhile is refused (`tool.adoption_stale`). Not
  offered on a server or in Nodestro Local Docker. An adopted tool's note says who adopted which version and that a
  later AI change ends the adoption.
- Tools → Write it yourself: a clearer note that code here counts as your own, and a warning once code was pasted.
- Texts in six languages: `tools.adopt.*`, `tools.write.ownCodeNote`, `tools.write.pastedWarning`,
  `errors.tool.adoption_*`, `errors.deps.source_build_disabled`, `errors.sandbox.shape_mismatch`; the text of
  `errors.deps.build_unavailable` now also covers an image that cannot be loaded and a refused build network.
- User documentation (Tools → Trust and isolation) in six languages; ADR-0006 amended (R-4).
- Needs nodestro-runtime and nodestro-api pins with R-4.

### Sandbox: hints after leaving the Python process, honest platform evidence (2026-11-02)

- Settings → Sandbox, *Python process* mode: the blocked notice says that the mode no longer runs AI-created tools
  in a built-in sandbox and that the earlier choice was kept (`settings.sandbox.blocked.subprocessChanged`); on a
  Linux runtime it names the Linux sandbox as the other way (`blocked.subprocessLinux`). The refusal
  `sandbox.isolation_required_subprocess` names it too. The diagnosis no longer suggests switching to the Python
  process when Docker is unreachable, and the Tools page says AI-created tools are blocked when they are
  (`tools.sandboxBlocked`). Six languages.
- Docs (six languages), Installing Docker: which engines ran in CI and that Docker Desktop never did; Sandbox: what a
  Python process choice from an earlier version means now.

### Docker workflow: AI-generated code in a real engine (2026-11-02)

- `scripts/docker_smoke.py` and `.github/workflows/docker.yml`: the installed studio with a real engine (Docker on
  `ubuntu-latest`, Colima on `macos-15-intel`) must reach `approved`, run an AI-generated tool from the tool job in
  an `orkexa-sandbox-*` container, leave no container after a timeout or a cancelled run, and refuse the tool once the
  engine is unreachable or stopped. `windows-latest` checks the refusal only (no Linux containers there). Apple
  Silicon and Docker Desktop cannot run on hosted runners and stay manual release checks (`docs/TODO.md`, ST-033).

### Python 3.11 minimum (2026-11-02)

- Python 3.11 is now the minimum (3.10 reached end of life in October 2026): `requires-python`, ruff `py311`, mypy 3.11,
  CI and platform matrices 3.11/3.13, the requirements in the README, `docs/PLATFORM.md`, `docs/ARCHITECTURE.md` and the
  settings chapter of the help (all six languages).
- `scripts/check_versions.py` uses the built-in `tomllib`; the `tomli` dev dependency is gone.
- Pins: orkexa `dec66eb` (#36), nodestro-runtime `51262a2` (#88; also docs: M12 contract step is RT-039),
  nodestro-examples `3f91300` (#51), nodestro-integrations `6e0c9e6` (#47), nodestro-api `ef04cb4` (#68),
  nodestro-sdk `d06d468` (#62), all with Python 3.11 as the minimum. axentra stays `024da57`.

### Platform pins: Axentra migration completion and security review fixes (2026-11-02)

- Pins: axentra `024da57` (#20 SR-02/SR-05 with migration 0011, #19 session resolution in one transaction, #21/#24
  P1/P2 fixes, #25 AX-R1 cursor validation, #26 AX-R2 `invitation_accepted`), nodestro-runtime `0369132` (#86
  security review fixes, performance fixes, M12 cleanup; #87 re-review Lows), nodestro-examples `b7a1d65` (#50) and
  nodestro-integrations `0de02d0` (#46) (runtime pin only), nodestro-api `3e0a874` (#66 security review fixes,
  `files cleanup`; #67 re-review Lows), nodestro-sdk `e5478d6` (#61; OpenAPI unchanged). orkexa stays `3364fb8`.
- All Axentra switches stay off by default; nothing changes for the desktop or the studio's own code.

### Platform pins: Docker sandbox review fixes (2026-11-02)

- Pins: orkexa `3364fb8` (#34: self-test mount table, seccomp probes, AppArmor stacks, digest-pinned sandbox image),
  nodestro-runtime `bf9af7d` (#85: Docker only for AI-created code in `auto`, the `linux` mode, no host venvs for AI
  scopes, MCP stdio servers proven and reaped, bounded capture, no gateway Env passthrough), nodestro-examples
  `9669439` (#48) and nodestro-integrations `17b8de5` (#44) (runtime pin only), nodestro-api `dde77f5` (#65:
  `SandboxStatus` with throttled checks and redacted host detail for readers, server start-up preflight), nodestro-sdk
  `99f70fe` (#59: `SandboxStatus` client types).

### Welcome page on every app start (2026-11-02)

- Every app start on the bare start page (`/`: new browser tab or window, `nodestro serve`, desktop app, server and
  local-container launch links) now opens the welcome page "Connecting Intelligence" first, not only the first
  visit. Reload, Back/Forward, in-app navigation (sidebar *Workflows*, top bar logo, *Open Studio*) and deep links
  (paths, query strings, hashes) are never redirected. `welcome/firstVisit.ts` became `welcome/startPage.ts`; the
  `nodestro-welcome-seen` storage key is gone. See `docs/design/LANDING.md` §4.
### Dynamic run budget approval, Studio (BUDGET-1, 2026-11-02)

- An attended run whose budget is not enough for its next model request pauses with the new status
  *Waiting for budget decision* (`awaiting_budget`) instead of failing. The budget decision card
  (`runs/BudgetDecisionCard.tsx`) shows the limits, known/unknown cost, reserved amount, the blocking limit (run,
  sub-workflow or team), the waiting requests and the suggested minimum; "Check and continue" raises exactly that
  limit to a new total, "End run" ends it (with a confirmation). It appears in the editor's run panel, the run
  details, the new "Budget decisions" section of the Approvals page and is counted by the navigation badge.
- Settings: administrators set the maximum run budget and the budget decision deadline next to the default budget.
- New error texts (`run.budget_ended`, `run.budget_request_expired`, `run.budget_checkpoint_lost`, `budget.*`),
  help texts and documentation sections (workflows: budget levels, decisions, team limits, permissions, limits) in
  all six languages. Needs the BUDGET-1 runtime/API; older backends show nothing new.
- Pins: nodestro-runtime `64895e6` (#84), nodestro-api `5519708` (#64), nodestro-sdk `e85f079` (#58),
  nodestro-examples `59fc96b` (#47), nodestro-integrations `991dcf9` (#43), orkexa `e220f70` (#32).

### Sandbox modes after Docker-first (DS-3) and the DS-13 review of Settings → Sandbox (2026-11-02)

- Settings → Sandbox offers the new `linux` mode (runtime DS-3) as an explicit choice on Linux computers:
  the optional built-in Linux sandbox, never chosen automatically, without third-party Python packages for
  AI-created tools. Every offered mode is explained below the choice: `auto` runs AI-created code only in Docker once
  its checks passed, `subprocess` is for trusted use only and always blocks AI-created tools. The blocked notice has
  a sentence for the `linux` mode; in `auto` it names Docker's reason, which the selection now reports instead of
  `no-isolation`.
- Refusals: `sandbox.isolation_required` with `reason` `subprocess-mode` and with a Docker reason, and
  `sandbox.libraries_need_isolation` with `mode` `linux`, get their own sentences (also on dependency status
  `unsupported`); the general sentences no longer promise the built-in Linux sandbox as an automatic fallback.
- DS-13: the backend table, the Docker details, the "AI-created tools run in" summary and the blocked notice all
  derive from one Docker status (the answer of the status routes until the settings bring a newer Docker row), so
  they no longer disagree while the settings are read again. A forced check that did not run (`throttled` with
  `retry_after`, or `refresh_ignored` for non-administrators) is shown as "not run" instead of a new result, and a
  throttled button waits until the window has passed; `redacted` answers say that technical details are visible to
  administrators. The rootful docker-group warning follows `rootless === false` instead of matching an English note.
- Types: `SandboxMode` gains `"linux"`, new `SandboxStatus` (answers of `GET /api/sandbox/status` and
  `POST /api/sandbox/self-test`: `check_started`, `throttled`, `retry_after`, `refresh_ignored`, `wait_skipped`,
  `redacted`), `IsolationReason`, `isDockerReason`. Older APIs without these fields keep working; a runtime before
  DS-3 rejects saving `linux`.
- Docs (six languages): Settings → Sandbox and Tools → The sandbox / Trust and isolation describe the four modes, and
  who may start a Docker check how often.

### New official logo (2026-11-02)

- The new official Nodestro logo replaces the previous app-icon mark everywhere: top bar (lockup; symbol alone on
  narrow phones), welcome page (header, hero hub, closing, footer), favicons, Apple touch icon and web manifest
  icons (new maskable icon). Icon links use `?v=3` to drop cached icons.
- Masters in `branding/`, every derived file reproducible with `scripts/derive_branding.py` (see
  `branding/README.md`). One component, `frontend/src/components/BrandLogo.tsx`, picks the lockup with the black or
  white wordmark from the app theme; no CSS filters or background boxes.
- The welcome hero's hub has a node-card core behind the hexagon so the routes end at the logo.
- Removed: `nodestro-logo-512.webp`, `nodestro-logo-64.png`, the CSS text wordmark (`.brand__name`, `.brand__dot`).
- GitHub social preview `branding/social-preview.png` (1280 × 640), rendered by `scripts/social_preview.py`, the
  template shared with Orkexa and Axentra; uploaded by hand in the repository settings.

### Platform pins: Docker-first sandbox (2026-11-02)

- Pins: orkexa `e220f70` (unified Docker sandbox engine, orkexa #31; macOS sandbox removed, #30; budget #32),
  nodestro-runtime `b608f90` (#83: Orkexa's run shape, background Docker status, image caps, no host builds),
  nodestro-examples `50552a0` and nodestro-integrations `3120cca` (runtime pin only), nodestro-api `16a6118` (#63:
  `GET /api/sandbox/status`, `POST /api/sandbox/self-test`), nodestro-sdk `9971a2f` (#57: their client methods).

### Platform pins: Axentra completion (2026-11-02)

- Pins: axentra `f6ae01d` (one Axentra commit across the chain; before `f114920`), nodestro-runtime `95114ae`
  (suspended tenants, deterministic access definitions, runtime database role, secrets rollback guard, Axentra
  files/metrics/notifications; all off by default), nodestro-api `961afef` (identity `axentra` mode, `/api/metrics`,
  `/api/notifications`, `files` and `suspend-tenant`/`resume-tenant` commands, owner/runtime database roles),
  nodestro-examples `9cdc1f5`, nodestro-integrations `8ecfb00`, nodestro-sdk `1b1fee0` (api pin only).

### Docker-first sandbox: texts, docs and the Docker status view (2026-11-02, ADR-0009 status update)

- Settings → Sandbox shows the Docker sandbox as the runtime's background check found it (runtimes that report
  `checks`): the engine, rootless/rootful and cgroup badges, each check (`cli`, `daemon`, `preflight`, `image`,
  `self-test`) passed or failed with a sentence for the failed one, the docker-group root note of a rootful daemon
  and when the self-test last ran. **Check again** asks `GET /api/sandbox/status?refresh=1` and follows a running
  check; while the state is `checking` the panel polls `GET /api/sandbox/status?wait=2`, only while the page is
  visible. Administrators get **Run self-test** (`POST /api/sandbox/self-test`; *Prepare sandbox* while the image is
  missing). Blocked AI-created tools name the Docker reason (`docker-missing` … `docker-image`, `docker-checking`);
  when a check settles the settings are read again. Older runtimes without these fields keep the earlier view.
- `types.ts`: `SandboxCheck`, `SandboxBackendStatus.engine/rootless/cgroup_version/checks/tested_at`, state
  `checking`, `DOCKER_REASONS`, `dockerReasonKey`; client `api.sandboxStatus`, `api.sandboxSelfTest`.
- Six languages: the reason keys are named after the runtime's reasons (`rootless-cgroup`, `os-type`); the ten
  in-container check texts gave way to the five check names the runtime reports; new texts for the self-test,
  passed/failed, rootful, the checking state and two blocked sentences; diagnostics `docker.checking` and
  `docker.unavailable` (the diagnosis appends the reason's sentence). Built-in docs: Check again and Run self-test.
- `platform_smoke.py` asserts the Docker row's new fields when present (approved only with every check passed, the
  self-test included; never available otherwise; known reasons and check names) and that `GET /api/sandbox/status`
  answers without waiting for the daemon; older runtimes pass unchanged (`tests/test_platform_smoke.py`).

- Docker (or a compatible engine that passes Nodestro's own checks) is the default sandbox for AI-created code on
  Linux, macOS and Windows. The native macOS sandbox was removed: Settings → Sandbox names the backend
  *Native macOS sandbox* and explains the runtime's new reason `removed`; the reason `not-released` of older runtimes
  keeps its text. `platform_smoke.py` accepts both (`unavailable / removed`, `experimental / not-released`).
- Six languages: texts for the coming Docker status view under `settings.sandbox.docker` (checking, ready, check
  again, prepare, engine, rootless, cgroup, the docker-group root note, ten in-container checks and nine refusal
  reasons) and errors `sandbox.docker_insecure`, `sandbox.selftest_failed`, `deps.image_too_large`,
  `deps.build_unavailable`. `deps.build_required` with `reason` `sandbox.unavailable` or `deps.build_unavailable`
  now says why the package could not be built in a container (`refineProblem`).
- Built-in docs (six languages): *Installing Docker* says that Docker or a compatible engine is required on macOS
  and Windows, that Nodestro checks the engine itself and refuses one that fails, lists Docker Desktop, Colima,
  OrbStack and Podman, which engines CI verifies, the docker-group root equivalence and rootless Docker; Settings →
  Sandbox and Tools no longer mention an experimental macOS sandbox.
- `docs/PLATFORM.md`: engine matrix and the reasons a host is refused. ADR-0009: status update *Superseded in part by
  Docker-first*. No pins changed.

### Platform pins: Axentra platform services (2026-11-02)

- Pins: nodestro-runtime `95dbdfa` (Axentra audit/usage mirrors, identity backend; all off by default),
  nodestro-api `bda8148` (`nodestro-server axentra status|reconcile|backfill-identity|reconcile-identity`,
  `secrets reencrypt`), nodestro-examples `0ae5ad4`, nodestro-integrations `12013a4`, nodestro-sdk `c30f88b` (api pin only).
- `platform/versions.json` lists `axentra` (`f114920`, pulled in by nodestro-runtime's `postgres` extra on
  Python 3.11+). `check_versions` reads a dynamic version from the new `version_file` field; `check_imports` allows
  only nodestro-runtime and nodestro-api to import `axentra`. The Studio UI and the desktop app do not use Axentra.

### Desktop secrets through a pipe (review MS-1, 2026-11-02)

- `nodestro --secrets-fd FD` (from nodestro-api, `nodestro_api.handoff`): the desktop app hands the launch secret and
  the MCP token vault key to the studio on its standard input instead of `NODESTRO_LAUNCH_SECRET` and
  `NODESTRO_VAULT_KEY`, so no same-user process can read them from the backend's initial environment and no child
  process inherits them. Pins: nodestro-api `c470b2b` (nodestro-api #60), nodestro-sdk `293a739` (#55); docs (`ARCHITECTURE.md`) describe it.

### Settings → Sandbox for every operating system (2026-11-02, ADR-0009)

- New mode **Automatic** (default when nothing was chosen): AI-created tools run in the built-in Linux sandbox
  where it is approved, otherwise in Docker while it runs, otherwise they are blocked; never in the Python process.
  A mode chosen earlier is kept.
- The panel (`SettingsSandbox.tsx`) shows the computer running Nodestro (the runtime's OS and CPU, not the
  browser's), where AI-created and own tools run now or why they are blocked, and a table of every sandbox on that
  computer with its state (approved, experimental and not used, not available, not isolated, not used here). The
  macOS sandbox of Orkexa is shown as experimental and is not used; Windows has no native sandbox yet. On a server
  the panel says that tools run only in containers. Older runtimes keep the earlier view.
- Tools page: the sandbox note and the trust notes follow the runtime's report (`untrustedBackend`); creating tools
  with AI is blocked whenever the report says so (also with Docker chosen but not running).
- Six languages; built-in docs: Settings → Sandbox rewritten, new section *Installing Docker* (macOS, Windows,
  Linux), tools, start and FAQ updated. `platform_smoke.py` checks the report on every platform (OS, never an
  unsafe backend, experimental backends never approved).
- ADR-0009 (cross-platform sandbox architecture, proposed).
- `scripts/e2e.sh` starts every test server without a reachable Docker (`DOCKER_HOST` points nowhere), so the
  suites see the blocked state on CI runners that have Docker.
- Pins: orkexa 544ef92 (#28), nodestro-runtime 7fd8761 (#78), examples f1c6403 (#43), integrations 4a834b4 (#39),
  api cb4b7fb (#59), sdk 007951e (#53).

### macOS and Windows start (2026-11-02)

- Pins: nodestro-runtime 47a665e (runtime #77) and the cascade (examples, integrations, api, sdk). The runtime could
  not be imported on macOS (`prctl` looked up at import time) or Windows (`import resource`), so `nodestro` did not
  start there at all. Off Linux the built-in sandbox now shows as not available (reason `platform`) and untrusted
  code is refused, as without Docker on any other computer.
- New workflow `platforms.yml` and `scripts/platform_smoke.py`: builds the interface, installs the studio at the
  pinned commits and starts it on macOS arm64 and x86-64, Windows x64 and ARM64 and Linux; checks `/api/health`,
  `/api/settings` (sandbox report) and the interface.

### macOS build: file name case clash (2026-11-01)

- The frontend failed to build on a case-insensitive file system (default macOS): `automation/TestStatus.tsx`
  (component) and `automation/testStatus.ts` (helpers) differ only in case, so `import "./TestStatus"` resolved to
  `testStatus.ts` (TS1149, TS2305). The component is now `automation/WorkflowTestStatus.tsx` (`WorkflowTestStatus`),
  its test `WorkflowTestStatus.test.tsx`; no behavior change.
- New check `scripts/check_case_collisions.py` (CI job `case-clashes`, every PR): fails on tracked paths or module
  names (TS/JS/Python, directories included) that differ only in case. New workflow `macos.yml` builds and tests
  the frontend on `macos-latest` when `frontend/` changes.

### UX initiative: usability, accessibility, performance and docs of the studio (2026-11-01)

Studio #61, #63, #69, #70, #72, #73 and this change; frontend, e2e and in-app docs only. No security mechanism was
removed or weakened, and no feature flag default changed (per-call tool approvals stay off; MCP stays the accepted
read-only pilot).

- Navigation in four groups (Build, Run & review, Automate & test, Help); page titles name the page; "Runs".
- First steps: start choices on the workflow page, a "model needed" notice with the way to the settings, a Continue
  area, a teams section, a gallery with levels, "Start here" and "What you need", and a welcome page.
- Editor: disabled controls say why (with the fix one click away), multi-select with undo, an orchestrator inspector
  in four areas, a "waiting for you" badge, keyboard connections in the inspector, a save conflict dialog
  (`If-Match`, 409 `workflow.conflict`) and a clear refusal of files that are not workflow exports.
- Runs: the failure is explained at the step that failed (provider failure codes `run.provider_*` first), a
  "Finished with problems" chip when tool calls did not succeed, "Not finished" steps with the way to continue,
  structured output with the JSON one click away, an orchestrator view per decision with its team runs, adaptive
  refresh and "Load older runs" (`before` paging).
- Server mode: the profile from `meta.profile`, a user menu with role, permissions, workspace switch and sign-out,
  a read-only notice, controls hidden or explained by permission; desktop-only privacy wording.
- Accessibility (WCAG 2.2 AA work, automated checks): dialog focus, labelled fields, keyboard connections,
  contrast tokens of the light theme, underlined links, a phone navigation, 24 px targets, reduced motion; axe:
  critical violations on the scanned views 18 → 0. A new browser suite `a11y` (axe-core 4.11.0) runs in
  `scripts/e2e.sh`.
- Performance: per-language chunks for the interface texts and the docs, lazy editor, CodeMirror, Markdown and
  canvases; main chunk 2.36 MB → 0.91 MB raw (726 → 259 kB gzip).
- Texts: all six languages complete and checked by a quality test (plurals, untranslated texts, terminology in
  `docs/i18n/terminology.md`); clearer error sentences; in-app docs updated in all six languages, including server
  sign-in, roles and the members commands.

### Live run chat and steering (2026-11-01)

LRC-1, studio part (the API, SDK and runtime parts are separate pull requests in their repositories).

- Run page: runs with an orchestrator (also in nested team runs) get the tabs **Overview** (the page as before)
  and **Team leader**; approvals, tool approvals, status and summary stay above the tabs. A picker lists only the
  team leaders the API reports (label, workflow path, level, status) with their decisions, teams and working
  specialists.
- Two explicit modes: **Ask a question** (a read-only AI answer, marked "chat answer, not a decision", with the time
  of its snapshot) and **Give an instruction** (taken into account at the next decision; running teams are not
  interrupted). Instructions show queued / delivered / considered (with what the decision did) / rejected /
  expired with the reason; the wording never says "done".
- Live updates over `GET /api/runs/{id}/chat/events` (`snapshot`, `message`, `targets`, `end`), polling when
  EventSource is missing; sends carry one `client_id` per composed message, so retries are idempotent. The
  composer is closed with a reason for ended runs, missing `run` permission and team leaders without steering.
- Workflow editor: the orchestrator setting **Live steering** (`live_steering`: `attended` default, `always`,
  `off`). Usage page: the source `run_chat` ("Live run chat"). Texts and error sentences for all `run_chat.*`
  codes in six languages; the manual section "Talking to the team leader" (`ausfuehrungen#teamleitung`).
- The picker shows a decision whose teams still work as made, with the note "Decision n is being carried out"
  (`ChatTarget.deciding`); messages of the desktop's own person show "You".
- Browser suite `runchat` (`scripts/e2e.sh runchat`, port 8110): parallel and nested teams against the real backend
  with a scripted model, keyboard use, light and dark, phone width.
- Pins `nodestro-runtime` `a42b672` (before: `ac96c6f`; runtime #67 and its fix #68), `nodestro-api` `fb7f438`
  (before: `4e2c8cd`), `nodestro-examples` `ebe899a` (before: `dcad0d1`), `nodestro-integrations` `204c95c` (before:
  `570d5c7`) and, in `platform/versions.json`, `nodestro-sdk` `dbbc7e5` (before: `3ca06b3`): the runtime, API and SDK
  parts of LRC-1 on top of Amazon Bedrock. Re-pinned to the merge commits when those pull requests merge.
- Technical record: [ADR-0008](docs/adr/0008-live-run-chat.md).

### Amazon Bedrock (AWS) in the studio (2026-11-01)

Frontend, in-app docs and branch pins; no AWS secret is ever entered or shown.

- Pins (branch only; the coordinated master cascade follows): `nodestro-runtime` `ac96c6f` (before: `d141b8f`; the
  `bedrock` provider), `nodestro-api` `4e2c8cd` (before: `db6a696`), `nodestro-examples` `dcad0d1` (before:
  `660e9a9`), `nodestro-integrations` `570d5c7` (before: `07dc1fd`) and, in `platform/versions.json`,
  `nodestro-sdk` `3ca06b3` (before: `4a97cef`) and `orkexa` `3467940` (before: `6e69b9c`; boto3 for Bedrock).

- Settings → AI providers: an "Amazon Bedrock (AWS)" card with the AWS region (suggestions, validated, operator
  allowlist), the sign-in method (desktop: AWS default credentials or a named profile; server: the operator's role,
  read-only, or "not available, ask your operator"), EU-only data residency (locked when the operator enforces it,
  with its limits), a status badge (not set up / set up / connection checked / check failed, with the reason) and
  "Check connection" (`POST /api/settings/providers/bedrock/verify`; no model is invoked, no costs). Saving stays
  admin-only on a server.
- Agents: Bedrock in the model picker with suggested models (labelled as suggestions) and free entry of model ids,
  inference profile ids and ARNs, stored as `bedrock:<id>` with every colon kept. Anthropic-only options stay off
  for Claude on Bedrock with the reason; reasoning effort, structured output and forced tool choice follow the
  model's capabilities (unknown: off, with the reason).
- Errors: sentences in six languages for the new `provider.*` (region, sign-in, profile, residency, AWS
  credentials/permissions/reachability, verification), `check.bedrock_*`, `pricing.region_required`,
  `pricing.invalid_region` and `pricing.reconciliation_not_supported` codes; a refused AWS sign-in is not called an
  API key problem; run failures show the full model id.
- Model prices: Bedrock overrides name the AWS regions they apply to (`aws_regions`, required in the override
  dialog); the table marks regional prices and the model hint names the priced regions. The bill comparison lists
  providers it did not compare (`not_reconciled`, e.g. Bedrock) with their estimate.
- Export check: sentences for `export.region_missing`, `export.aws_profile_not_exported`,
  `export.aws_role_not_exported` and the AWS wording of `export.provider` for Bedrock.
- Docs (six languages): a Bedrock section in the settings chapter (sign-in on desktop and server, region, models and
  inference profiles, EU residency and its limits, minimal IAM permissions, regional prices, supported features,
  AWS credentials and tool sandboxes, troubleshooting by message), model ids in the agents chapter, the export
  (AWS default chain and `AWS_REGION` on the target machine, no credentials in the ZIP) and an FAQ entry.

### Pins: PostgreSQL read performance (2026-11-01)

- Pins `nodestro-runtime` `d141b8f` (before: `6eacec1`), `nodestro-api` `db6a696` (before: `7997bb4`),
  `nodestro-examples` `660e9a9` (before: `1ead26c`), `nodestro-integrations` `07dc1fd` (before: `c221485`) and, in
  `platform/versions.json`, `nodestro-sdk` `4a97cef` (before: `74c42d6`). Backend audit C-14 follow-up: the
  PostgreSQL store checks pooled connections only after they sat idle, retries reads on a lost connection, writes
  single statements in autocommit, and migration 0006 makes its find indexes partial (a lookup by id no longer risks
  a scan of the collection). The desktop's SQLite store is unchanged.

### Example guide terminology; pins (2026-11-01)

- Pins `nodestro-examples` `1ead26c` (before: `e370567`), `nodestro-api` `7997bb4` (before: `e16202d`) and, in
  `platform/versions.json`, `nodestro-sdk` `74c42d6` (before: `76f7390`). Only texts change: the localized example
  guides use the interface's terms (de "Arbeitsbereich", it "spazio di lavoro", pt-BR "fluxo de trabalho", fr
  "vous"), and the generated example chapters of the in-app docs are regenerated (`make example-docs`).

### Backend audit (2026-11-01): pins and architecture docs

- Pins `nodestro-runtime` `6eacec1` (before: `58cec5c`), `nodestro-api` `e16202d` (before: `870ba5f`),
  `nodestro-examples` `e370567` (before: `5e2d532`), `nodestro-integrations` `c221485` (before: `cb8c2da`) and, in
  `platform/versions.json`, `nodestro-sdk` `76f7390` (before: `d71fadd`) and `orkexa` `6e69b9c` (before: `a06185d`).
  They carry the fixes of the internal backend audit (not an external pentest or certification). Among them:
  - Sandbox output is bounded in the host, and cancelling a run stops its running sandbox call.
  - Run writes are fenced across processes, approval decisions use compare-and-set, and live runs without a job
    are reconciled.
  - The PostgreSQL connection pool reconnects and has statement timeouts.
  - Server logins are bound to the browser, the access log is redacted, and `/api/health` checks the database.
  - New operator commands manage tenant members.
  - Additive API fields for the studio: `meta.profile`, run `warnings`, `If-Match` / 409 `workflow.conflict`,
    run list paging, and provider failure codes.
  See the runtime and API changelogs.
- `docs/ARCHITECTURE.md` and `docs/PLATFORM.md` describe the three operating profiles (desktop, local container,
  server) as implemented. ADRs 0001–0004 are marked accepted and implemented, and `IMPLEMENTATION_STATUS.md` is
  updated where the audit changed it.
- The accepted MCP pilot (studio `ba45ab3`) and the S-2 pilot B pin (`19a1127`) are not changed; their acceptance does
  not cover these versions.

### Example library format 2 in the gallery; pins (2026-11-01)

- Pins `nodestro-examples` `5e2d532` (0.3.0, before: `3429f5b`), `nodestro-api` `870ba5f` (before: `05e449d`) and, in
  `platform/versions.json`, `nodestro-sdk` `d71fadd` (before: `7f60f9b`).
- The gallery preview shows each example's teams (sub-workflows with capabilities and approvals), its knowledge files,
  "Who decides what" (`control`) and "Why this architecture" (`why`), and its optional integrations with setup text,
  offline behavior and a server choice for the copy. Offline mode is the default; a copy is only connected when the
  chosen MCP server offers every needed tool approved as read-only, otherwise nothing is copied and the missing or
  not read-only tools are named (`library.integration_unavailable`).
- Copying creates the example's parts as own workflows, adds its knowledge files and returns which integrations are
  connected and which run offline.
- Texts in all six languages; the "Examples" docs chapter is regenerated from the library.

### Security fixes from the independent MCP re-review R-1/R-2; pins (2026-11-01)

- Pins `nodestro-runtime` `58cec5c` (before: `f71086a`), `nodestro-api` `05e449d` (before: `476cfc0`),
  `nodestro-examples` `3429f5b` (before: `69e5e65`), `nodestro-integrations` `cb8c2da` (before: `31a7020`) and, in
  `platform/versions.json`, `nodestro-sdk` `7f60f9b` (before: `7b795f7`).
- R-1: deciding an MCP tool call requires an administrator when the stored or the current classification is
  `destructive`. A security-relevant reclassification of the tool closes pending approvals and invalidates approved
  but not yet executed ones (also for runs paused at a tool approval); the call is re-checked right before it is
  sent and refused with `tool.approval_stale`. The existing error text covers it; no UI change.
- R-2: the name `memory` is reserved for the agent's memory tool. Own or generated tools cannot be saved under it,
  a tool stored under it before is never run, and an agent that lists it is reported as invalid
  (`config.memory_name_reserved`, `tool.name_reserved`; existing texts in all six languages).
- ADR-0007 and the MCP threat model record R-1 and R-2.

### Security fixes from the independent MCP review; pins (2026-11-01)

- Pins `nodestro-runtime` `f71086a` (before: `c86781b`), `nodestro-api` `476cfc0` (before: `ae6cecd`),
  `nodestro-examples` `69e5e65`, `nodestro-integrations` `31a7020` and `nodestro-sdk` `7b795f7`.
  They carry the fixes of the independent MCP review (H-1 per-call approvals hold in agent tests and the tool panel,
  M-1 no credentials in server addresses, M-2 response size limit, M-3 destructive MCP calls decided by
  administrators, L-2 to L-8) and the offline worker fix F5.
- Error texts in all six languages for the new codes `mcp.url_secret`, `mcp.url_secret_removed`,
  `mcp.loopback_not_local`, `mcp.hash_required`, `mcp.response_too_large` and `tool.approval_not_in_test`;
  `mcp.write_not_supported` now says where changing tools run.
- ADR-0007 and the MCP threat model record the review findings, the fixes, the evaluated but not built approver role
  and four-eyes rule, the corrected proxy statement (L-1) and that MCP on the desktop is not released (M-4).

### Runs paused at a tool approval (AO M6b, behind a switch, 2026-11-01)

- With `NODESTRO_TOOL_APPROVALS=1` and the new switch `NODESTRO_TOOL_APPROVAL_CHECKPOINTS=1` (default off), a tool
  call that waits for a person pauses the run instead of holding a worker. The run details and the run panel show
  the open tool approvals of a paused run, also those of its team runs, and the decision continues the run where it
  stopped, without asking the model again. Nothing changes while the switch is off.
- New error texts in all six languages: `tool.result_lost`, `tool.checkpoint_stale`, `tool.checkpoint_expired`,
  `tool.approval_missing`; the approval audit lists the new kinds (paused, continued, run, no longer valid, result
  lost, switched off).
- Pins: `nodestro-runtime` `c86781b` (before `6ac4ae3`), `nodestro-examples` `cd8b0af` (before `1da29b7`),
  `nodestro-integrations` `99f13cf` (before `5cfdd3a`), `nodestro-api` `ae6cecd` (before `ebd99b3`); in
  `platform/versions.json` also `nodestro-sdk` `eaec31b` (before `683df5e`).

### Security fix: stale tools in server workers (S-2 pilot finding F1, 2026-11-01)

- Every process of an installation (the API and each server worker) now sees tool changes and deletions made by
  another process at its next lookup. A running step refuses a tool whose version changed or was deleted after the
  step started ("the tool was changed or deleted after this step started"), also after an approval or advance
  approval for the old version; start the run again to use the current version. No UI change.
- Pins: `nodestro-runtime` `6ac4ae3` (before `081705d`), `nodestro-examples` `1da29b7` (before `b5aa4db`),
  `nodestro-integrations` `5cfdd3a` (before `4ae9fdd`), `nodestro-api` `ebd99b3` (before `ee67eac`); in
  `platform/versions.json` also `nodestro-sdk` `683df5e` (before `db7fd37`).

### Orchestrators: dynamic teams and approvals inside teams (AO M6b)

- Run details of an orchestrator: which orchestrator works with which model, decisions used of the limit, the
  cost of the decisions and in total (unknown costs are shown as not fully known, never as 0), the pool with
  versions, the **team over time**, waiting teams (*Waiting for approval*) and every decision with reason, task,
  values and each team's outcome (succeeded, waiting, failed, rejected, cancelled, expired) with a link to the team
  run. Only recorded decision data is shown, no model reasoning. Older (version 1) records show as before.
- **Save team composition as a template:** after the run, one click saves a new workflow with the same orchestrator,
  start form, limits and exactly the teams that worked, pinned to the run's versions. Nothing is saved without it.
- Orchestrator inspector: new area *Dynamic teams* with *Teams at the same time* (1 to 5), *Assemble the team
  itself* with *At most in the team*, and *Fill in the teams' start forms*; all off by default.
- New refusal texts for the orchestration codes of protocol version 2, the changed preflight note for teams with
  approvals, help entries and the docs section *Dynamic teams* (`verzweigungen#dynamische-teams`) in six languages.
- New browser suite `orchestration` (`npm run e2e:orchestration`, part of `scripts/e2e.sh`, own instance on port
  8100): parallel teams with one waiting, approval from the parent run page, team over time, template, rejection.
- Pins: `nodestro-api` `ee67eac` (before `2948bb3`), `nodestro-runtime` `081705d` (before `1bc3924`),
  `nodestro-examples` `b5aa4db` (before `6658599`), `nodestro-integrations` `4ae9fdd` (before `86bfed0`); in
  `platform/versions.json` also orkexa `a06185d` (before `b91d0b7`) and `nodestro-sdk` `db7fd37` (before `b45c9d7`).

### Welcome page "Connecting Intelligence" and the original logo (2026-11-01)

- New welcome page at `/welcome` (lazy route outside the Studio frame): the original logo as the hub of a small
  diagram of what Nodestro connects, the official slogan *Connecting Intelligence* (untranslated in all six
  languages), an illustrated run (labelled as an illustration), links into the real Studio pages, dark and light
  mode, pause control and `prefers-reduced-motion`. Concept and integration decision: `docs/design/LANDING.md`.
- The very first visit of the bare start page `/` in a browser opens the welcome page once; deep links, returning
  visits and automated browsers go straight to the Studio. Sidebar *Help > Welcome* opens it at any time.
- The original logo replaces the old three-dot mark in the top bar and the old `favicon.svg`: new `favicon.ico`,
  PNG favicons, Apple touch icon and `manifest.webmanifest` with 192/512 icons.
- New browser suite `welcome` (`npm run e2e:welcome`, part of `scripts/e2e.sh`, own instance on port 8090).

### MCP: sign-in, local servers, operation, Nodestro as an MCP tool (ADR-0007 WP-6/7/8/11)

- *Tools → Connected services*: OAuth as a sign-in kind with **Sign in** / **Sign out** (the browser returns to
  `/tools?tab=services&oauth=connected` or `&oauth_error=<code>`), and a summary of issuer, permissions and renewal
  (never the credentials).
- Local servers (only with the Docker sandbox, `stdio_possible`): packages and module instead of an address; the
  packages are planned hash-pinned and approved in the same dialog as a tool's libraries (scope `mcp:<id>`), then
  installed into the server's own container image.
- *Operation* section: calls in flight, the operator's limits and each service's calls, failures, last duration and
  pause (`GET /api/mcp/stats`).
  The table scrolls inside its frame on narrow screens instead of being cut off.
- API page, *Access*: **Offer as an MCP tool** (`Publication.mcp_tool`); it takes effect only with the operator's
  `NODESTRO_MCP_SERVER=1`, and the page names the endpoint `/api/published/_mcp`.
- Texts for the new error codes (`mcp.oauth_*`, `mcp.stdio_*`, `mcp.environment_not_ready`, `mcp.cooling_down`,
  `mcp.rate_limited`, `mcp.overloaded`, `mcp.release_tool_changed`, `api.mcp_*`, `export.mcp_tools`,
  `mcp_server.disabled`) and help sections *Tools > Signing in to a service*, *Tools > Local servers* and
  *API and export > As an MCP tool*, in six languages.
- A service's documents (WP-10): the tool `resources/read` that reads a service's listed resources is marked
  *The service's documents* in the tool list and explained in its review; help section *Tools > A service's documents*
  in six languages. Browser suite `mcp`: sign-in at a loopback authorization server, sign-out, the operation view and
  offering a published API as an MCP tool.
- Platform pins: `nodestro-runtime` `1bc3924` (MCP resources), `nodestro-api` `2948bb3`, `nodestro-examples`
  `6658599`, `nodestro-integrations` `86bfed0` and, in `platform/versions.json`, `nodestro-sdk` `b45c9d7` (MCP sign-in,
  local server environment, statistics and publication update calls).

### Tool approvals: warnings before unattended starts (S-2, R1, 2026-11-01)

- Schedule dialog, switching a schedule on, batch and test series start, and the API publication check show the tool
  calls the per-call approval rules would refuse in those unattended runs (`ToolWarnings`, codes
  `errors.tool.unattended_*` in six languages): agent, workflow, tool, why, and how to fix it, with a link to the
  Approvals page. Nothing is approved from there, and the runtime still refuses at the call. A schedule switched on
  with such warnings now says so. Shown only while `NODESTRO_TOOL_APPROVALS` is on.
- Help *Branches > Approving tool calls* (six languages): what the warning covers and what it cannot see.
- Browser suite `approvals`: schedule dialog warning, the advance approval ending it, no automatic grants, batch plan,
  publication check.
- Platform pins: `nodestro-runtime` `2d55242`, `nodestro-api` `a233d57` (includes Adaptive Orchestration M6a and MCP
  WP-7/8/9/11), `nodestro-examples` `63be887`, `nodestro-integrations` `7bbce5f` and, in `platform/versions.json`, `nodestro-sdk` `1383418`; `orkexa` stays `b91d0b7`.

### Tool approvals: security acceptance (S-2, 2026-10-31)

- New browser suite `approvals` (`npm run e2e:approvals`, part of `scripts/e2e.sh`) against an isolated instance with
  `NODESTRO_TOOL_APPROVALS=1` (`tests/e2e_approvals_server.py`, 20-second wait, scripted model, user-authored tool
  with arguments that contain quotes, markup, umlauts and a line break). It covers the exact argument display,
  approve, reject with a comment, a decision about a changed call (stale hash, refused), a repeated decision
  (refused), the timeout and a late decision (refused), the run details' notes, the audit trail without arguments,
  the one-time activation step (a workflow made afterwards is asked about; repeating adds nothing), dark mode and a
  phone width.
- Rules section: the activation step shows when and by whom it ran and is offered only until it is complete (the
  published-API part can be finished after an interrupted first call); repeated steps show as such in the audit
  trail; the hint explains the order (mark, review, then switch on) and the one-time digest change.
- Help *Branches > Approving tool calls* (six languages): the activation order, how to end an unwanted exception,
  what happens without the first step, and what is not covered (provider server tools, Nodestro's own run tools,
  published APIs' own approval phase).

- Platform pins: `nodestro-runtime` `a13f894` (one-time legacy stamping, removed tools lose their exemption),
  `nodestro-api` `c58d5de` (publications cutoff at the first stamping), `nodestro-examples` `2488c93`,
  `nodestro-integrations` `08f5faf` and, in `platform/versions.json`, `nodestro-sdk` `452a39d`; `orkexa` stays
  `b91d0b7`.

### Model choice from measurements (Adaptive Orchestration M6a)

- A test series page shows **Model choice from measurements** below its runs: for one agent, the goal (lowest cost,
  shortest run time, highest pass rate), the minimum pass rate and "must not lose a case" make up the policy, and the
  table shows each measured model's pass rate, cost and time per case, the AI rating (shown, not used), and why a
  model is left out. Only finished test runs of the same workflow state, cases and other models count; unknown costs
  never count as 0. *Use* saves the agent with the recommended model as a new workflow version; nothing changes
  before that. Help and docs (`automatisierung#modellwahl-nach-messwerten`) in all six languages.
- Needs `nodestro-api` with `GET /api/benchmarks/{suite_id}/model-choice` (api #33), included in the pinned `a233d57`.

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

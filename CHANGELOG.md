# Changelog

## Unreleased

### Desktop and server plan, M0 (2026-10-31)

- Documentation only, no behavior change: `docs/desktop-server/` describes the current architecture as an inventory
  (SQLite and FTS5 access, process-only state, the data-directory lock, endpoints and trust boundaries, code
  execution) and the plan for Nodestro Desktop and Nodestro Server with twelve pull requests, risks and the test
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

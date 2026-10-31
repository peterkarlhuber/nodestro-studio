# Changelog

## Unreleased

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

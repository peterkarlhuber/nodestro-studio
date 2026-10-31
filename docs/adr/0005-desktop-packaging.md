# ADR-0005: Desktop packaging without separate installations

- Status: Proposed (M0, 2026-10-31); the host technology is decided by the M2 spike and recorded in an update of this ADR
- Repositories: nodestro-desktop (host, bundling, installers, releases), nodestro-studio (wheel, versions)

## Context

Today a user installs Python, Node.js and Git, clones the studio, builds the frontend and runs `pip install`. The
desktop product must start on a machine without Python, Node.js, PostgreSQL or Docker and must never install them
behind the user's back. The application is a Python backend (FastAPI, uvicorn, Orkexa, the runtime) plus a static
React build that the studio wheel already contains (`nodestro_studio/static`).

## Decision

1. **Bundle, do not install.** The desktop package contains: a relocatable CPython (python-build-standalone, the same
   minor version CI tests, 3.13), every Nodestro wheel at the commits of `platform/versions.json` and their
   third-party wheels installed at build time from a lock file with hashes, the `uv` binary (already a runtime
   dependency, used only for optional tool libraries), and the host shell. Nothing is fetched at first start. No Git
   dependency is resolved at runtime.
2. **One source of pins.** `nodestro-desktop` pins exactly one thing: a full commit SHA of `nodestro-studio`. Its
   build reads `platform/versions.json` at that commit; it never keeps its own copy of component pins. When desktop
   releases exist, `versions.json` gains a `nodestro-desktop` entry recorded by the studio (same for
   `nodestro-server`), and `scripts/check_versions.py` learns to verify the back-reference.
3. **Host shell candidates for the M2 spike:** Tauri 2 (small, system web view, Rust sidecar management, signed
   updater), Electron (bundled Chromium, larger, most uniform rendering), pywebview (Python-only, least process
   control). Criteria, measured on each target OS: bundle size, start time, clean child-process shutdown, code signing
   and notarization, auto-update and rollback, web view compatibility with the studio (React Flow, SSE),
   accessibility, CI cost. Provisional preference: Tauri 2, because the backend is a separate process anyway and the
   UI is already a web app.
4. **Process model:** the shell starts the bundled backend as a child process bound to `127.0.0.1` on a free port,
   passes a per-launch secret (environment or pipe, never the command line), waits for `/api/meta`, opens the web
   view with the secret exchanged for an HttpOnly cookie, and stops the backend gracefully (`Workspace.aclose`) on
   exit. A crashed backend is reported and restarted at most once.
5. **Data:** the data directory stays `~/.nodestro` (or `NODESTRO_DATA_DIR`) so the desktop app and the `nodestro`
   command share workflows and runs; only one of them can run at a time (data-directory lock, clear message).
   Logs go to the OS log location (`platformdirs.user_log_dir`). Nothing is written into the application bundle.
6. **Optional features stay explicit:** Python tool libraries (uv, from PyPI on request), OCR (Tesseract and Poppler,
   detected, not bundled), Docker (detected, never installed), model providers (keys entered by the user).
7. **Support claims follow tests.** An OS is listed as supported only after an installer or portable build was built
   in CI and started on a clean machine (or VM) without developer tools, with a smoke test that opens the UI and runs
   a scripted workflow. Linux x86_64 first; macOS and Windows after their own green runs.

## Options considered

- **PyInstaller/Nuitka single binary**: viable fallback inside any shell; trickier with dynamic imports (entry points
  of integrations) and native extensions; evaluated in the spike.
- **Docker image as desktop**: rejected by requirement.
- **System Python with an installer script**: rejected (separate installation).

## Consequences

- The studio CI keeps producing the wheel the desktop consumes; the desktop CI never builds Nodestro components from
  branches.
- macOS notarization and Windows signing need certificates owned by Peter; without them, builds are labeled
  unsigned test builds.

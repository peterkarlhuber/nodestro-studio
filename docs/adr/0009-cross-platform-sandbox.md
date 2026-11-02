# ADR-0009: Cross-platform sandbox architecture

- Status: Proposed (2026-11-02, sandbox architecture work order). Accepting the pull requests accepts this record.
  Releasing any new native backend for untrusted code needs a separate decision after an independent review.
- Repositories: orkexa (capability model, probes, cancellation, experimental `MacOSSandbox`; #28), nodestro-runtime
  (`sandbox_selection`, `auto` mode, macOS/Windows start fix; #77, #78), nodestro-api (OpenAPI, release libraries),
  nodestro-studio (Settings → Sandbox, built-in docs). Desktop packaging: unchanged (DSK-001 stays NO-GO).
- Related: [ADR-0006](0006-sandbox-policy.md) (trust classes and the policy, unchanged), [ADR-0005](0005-desktop-packaging.md).

## Context

ADR-0006 lets untrusted (AI-generated, unknown) code run only in a container or in the built-in Linux sandbox
(Landlock + seccomp, released for Ubuntu 24.04 and Debian 13 x86-64 after VM evidence). On macOS and Windows the
runtime did not even import: `sandbox_confine.py` looked up `prctl` at import time and imported `resource`. Users on
those systems had to know that Docker is required and pick it by hand; the studio showed only Linux-specific state.

The goal is that Nodestro starts everywhere, picks the strongest *approved* isolation by itself, explains what is
blocked and why, and never falls back to running untrusted code on the host.

## Options considered

| Option | Result |
| --- | --- |
| Microsoft Execution Containers (MXC 1.0.1, MIT) everywhere | Not adopted now. No Python SDK; no CPU/memory/process/file-size limits; fork and exec allowed on macOS and Linux; Linux backend is bubblewrap (the user-namespace restriction of Ubuntu 24.04 that the built-in sandbox avoids); macOS npm binary arm64-only; Windows needs 11 24H2+. |
| MXC on Windows only, inside an own Job Object | Best candidate for Windows later (Microsoft maintains AppContainer, file and network rules). Open: nested-job behaviour, OS coverage. Separate decision (ORK-015). |
| Own native backends (Seatbelt on macOS, AppContainer + Job Object on Windows) | macOS implemented (experimental). Windows not started in this round. |
| WASM (Pyodide / CPython-WASI) | Strong and portable, but no native extensions, threads or subprocesses; possible opt-in later. |
| Docker only off Linux | Exists and fails closed; remains the released path on macOS and Windows. |

## Decision

1. **Start everywhere.** Linux-only modules load lazily; off Linux the built-in sandbox reports reason `platform`.
   Tested on macOS arm64 and x86-64, Windows x64 and ARM64 and Linux in the `Platforms` workflows (runtime, studio).
2. **Capability model in Orkexa.** Every backend reports `SandboxCapabilities` (isolation, file system, network,
   processes, environment, limits, memory enforcement, cancellability, maturity) and a `SandboxProbe`. Reports are
   descriptive: **the Nodestro policy alone decides** what may run untrusted code (`isolation_of`), never a
   capability report, a name or a technology.
3. **Cancellation in Orkexa** (ORK-001): one cancel context for all backends; Nodestro's `sandbox_cancel` uses it.
4. **Automatic selection** (desktop setting `auto`, the default when nothing was chosen):
   untrusted code → built-in Linux sandbox if approved here → Docker while it runs → refused.
   User-authored code → host subprocess (unchanged). A stored `subprocess` stays and never uses Docker; `docker`
   stays. Server and Local Docker: containers only, setting ignored. No unsafe fallback exists in any mode.
5. **The runtime's computer decides**, never the browser: the report carries the runtime's OS and CPU.
6. **macOS sandbox: experimental, not used.** Orkexa's `MacOSSandbox` (self-applied Seatbelt, deny-default profile,
   rlimits, memory watchdog, self-test before every call) passed its attack tests on macOS 26 arm64 in CI. It is
   reported as `experimental / not-released`; `isolation_of` returns `none` for it until an independent review and
   a release decision.
7. **Windows: no native sandbox yet** (`windows-native: unavailable / not-implemented`); Docker is the path.
8. **The Linux sandbox stays in nodestro-runtime.** Moving it to Orkexa would invalidate the VM evidence it was
   released on; a move is a later, separately tested change.

## Consequences

- macOS and Windows users get a working studio and a clear reason plus install guide when AI-created tools are
  blocked; with Docker running, `auto` uses it without a settings change.
- Installations of earlier releases that never chose a mode move to `auto`; explicit choices are kept.
- A new backend becomes usable only by changing `isolation_of` after review; the UI already shows its state.
- Open: independent review of the macOS sandbox (ORK-014), a Windows backend (ORK-015), arm64 Linux for the
  built-in sandbox (its seccomp table is x86-64 only).

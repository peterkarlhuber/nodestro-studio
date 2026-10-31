# ADR-0006: Sandbox policy for untrusted code

- Status: Proposed (M0, 2026-10-31); point 4 needs Peter's decision (see "Open decision")
- Repositories: nodestro-runtime (policy, environments), nodestro-api (settings, endpoints), orkexa (only if an image
  hook is missing after review), nodestro-server (container runtime)

## Context

See [inventory, section 4](../desktop-server/inventory.md#4-code-execution-and-sandboxing). Custom and generated
tools run in `SubprocessSandbox(acknowledge_unsafe=True)` by default, i.e. as the user without isolation. Orkexa's
`DockerSandbox` is hardened and fails closed, but tools with third-party libraries are refused there
(`deps.docker_unsupported`). During tool generation, Orkexa's `ToolBuilder` runs AI-generated tests automatically in
the configured sandbox, before a person has seen the code.

## Decision

1. **Trust classes.** `trusted` (built-in tools, installed integrations), `user-approved` (custom tools and generated
   tools after a person approved the code), `untrusted` (AI-generated code before approval, draft tests, anything
   received from another user or tenant).
2. **A `SandboxPolicy` decides, not the call site.** `nodestro_runtime.sandbox_policy` maps (profile, trust class,
   needs libraries) to an allowed sandbox or a refusal with a stable error code (`sandbox.unavailable`,
   `sandbox.isolation_required`). `make_sandbox`, `PythonEnvironments.sandbox` and the tool-generation job ask the
   policy. **No automatic fallback** from a container to a subprocess ever.
3. **Server profile:** only container sandboxes for every non-trusted class. No subprocess sandbox exists in that
   profile; a missing container runtime or image fails the job with `sandbox.unavailable` and is visible in health
   checks. Containers keep Orkexa's flags (no network, read-only, no capabilities, nobody user, limits) and run on
   worker nodes, never in the API process.
4. **Desktop profile (proposed, needs decision):** Docker remains optional.
   - With Docker available and selected: as on the server.
   - Without Docker: `user-approved` code keeps running in the subprocess sandbox as today, clearly labeled "runs
     without isolation on this computer" (existing data and workflows keep working).
   - `untrusted` code is **not executed automatically** any more: the tool-generation job stops at a new step
     `job.awaiting_execution_consent` showing code and tests, and runs them only after the user confirms (once per
     job). Rejecting ends the job without executing anything.
5. **Third-party libraries in containers** (`deps.docker_unsupported`): the approved lock file of an environment is
   built into an image layer `nodestro-env:<lock-sha256>` on top of the sandbox base image, with network only during
   the build step and `uv pip install --require-hashes`; tool calls run in that image with `--network none`. Images
   are a cache keyed by the lock; deleting them only costs a rebuild. If the existing `DockerSandbox` cannot take an
   image per call, Nodestro subclasses it; Orkexa is changed only after a design review.
6. **Native OS sandboxes** (bubblewrap, macOS sandbox profiles, Windows AppContainer) are not claimed as secure until
   implemented and tested per OS; until then they are not offered.

## Open decision

Point 4 changes the desktop behavior of tool generation without Docker (one extra confirmation before generated tests
run). Recommended, because it is the only way to satisfy "no automatic execution of untrusted code without a secure
sandbox" on machines without Docker. Alternative: keep today's automatic tests for the desktop and apply the rule to
the server profile only.

## Consequences

- Required tests: policy matrix (profile × trust class × Docker available); no subprocess sandbox constructible in
  the server profile; generation job waits for consent and executes nothing on rejection; container with libraries
  has no network and cannot write outside its tmpfs.
- The settings page and documentation (six languages) explain the isolation level of each choice.

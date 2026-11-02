# ADR-0006: Sandbox policy for untrusted code

- Status: Accepted; implemented in M1 PR-4 (2026-10-31): nodestro-runtime #7, nodestro-api #9 and the studio PR
  that pins them. Revised the same day after Peter's review (see "Revision history"). Amended 2026-11-02 by
  Peter's decision R-4: confirmed adoption of AI-generated code as `user-authored`, desktop only (point 8)
- Repositories: nodestro-runtime (policy, environments), nodestro-api (settings, endpoints), orkexa (only if an image
  hook is missing after review), nodestro-desktop (bundled native sandbox, later), nodestro-server (container runtime)

## Context

See [inventory, section 4](../desktop-server/inventory.md#4-code-execution-and-sandboxing). Custom and generated
tools run in `SubprocessSandbox(acknowledge_unsafe=True)` by default, i.e. as the user without isolation. Orkexa's
`DockerSandbox` is hardened and fails closed, but tools with third-party libraries are refused there
(`deps.docker_unsupported`). During tool generation, Orkexa's `ToolBuilder` runs AI-generated tests automatically in
the configured sandbox, before a person has seen the code.

A confirmation dialog does not make untrusted code safe: a person cannot reliably judge generated code, and a click
does not isolate anything. The policy therefore rests on isolation, not on consent.

## Decision

1. **Trust classes.**
   - `trusted`: code shipped with Nodestro (built-in tools) and installed integrations.
   - `user-authored`: code a person wrote themselves in the tool editor, with recorded provenance.
   - `untrusted`: every piece of AI-generated code and its tests (before *and* after a person approved it), tool
     drafts, and code whose provenance is unknown or that came from another user, tenant, import or backup.
2. **A `SandboxPolicy` decides, not the call site.** `nodestro_runtime.sandbox_policy` maps (profile, trust class,
   needs libraries, available isolation) to an allowed sandbox or a refusal with a stable error code
   (`sandbox.unavailable`, `sandbox.isolation_required`). `make_sandbox`, `PythonEnvironments.sandbox` and the
   tool-generation job ask the policy.
3. **Missing isolation blocks.** Untrusted code runs only in a sandbox the policy classifies as isolating. If none is
   available, the execution is refused. There is **no subprocess fallback for untrusted code**, neither automatic nor
   unlocked by a confirmation dialog, a setting or an environment variable.
4. **Server profile:** only container sandboxes for every non-trusted class (also `user-authored`, because users do
   not trust each other). No subprocess sandbox can be constructed in that profile; a missing container runtime or
   image fails the job with `sandbox.unavailable` and is visible in health checks. Containers keep Orkexa's flags (no
   network, read-only, no capabilities, nobody user, limits) and run on worker nodes, never in the API process.
5. **Desktop profile:** Docker remains optional and is never installed by Nodestro.
   - On a tested Linux (point 7) the built-in sandbox isolates untrusted code automatically, without Docker.
   - With Docker available and selected: untrusted code runs in containers, as on the server.
   - Without an isolating sandbox: untrusted code is blocked. Concretely, AI tool generation cannot run its tests,
     AI-generated tools cannot run in workflows, and tool drafts cannot be tested. The UI says why and what enables
     the feature (Docker, or the built-in sandbox and the reason it is not available, point 7).
   - `user-authored` code keeps running in the subprocess sandbox, labeled "runs without isolation on this computer",
     as a person running their own script would.
   - **The desktop MVP is therefore allowed to have restricted features** where no secure isolation is available.
     This is documented in the user documentation and the release notes, not hidden.
6. **Third-party libraries in containers** (`deps.docker_unsupported`): the approved lock file of an environment is
   built into an image layer `nodestro-env:<lock-sha256>` on top of the sandbox base image, with network only during
   the build step and `uv pip install --require-hashes`; tool calls run in that image with `--network none`. Images
   are a cache keyed by the lock; deleting them only costs a rebuild. If the existing `DockerSandbox` cannot take an
   image per call, Nodestro subclasses it; Orkexa is changed only after a design review.
7. **A built-in, OS-specific sandbox without a separate installation**, shipped inside the desktop bundle. It is
   offered only on an OS where it passed the security and compatibility tests below. **Linux: implemented** (see
   "Built-in Linux sandbox" below): the policy counts it as isolating (`kernel`) only in the desktop profile, only on
   the tested distributions (Ubuntu 24.04 and Debian 13, x86-64) and only where its self-test passed on this computer.
   macOS (sandbox profiles for a helper process) and Windows (AppContainer with a job object) remain open; until a
   candidate passes there, nothing is presented as secure and the policy does not classify it as isolating.
8. **Adoption of AI-generated code (amendment R-4, 2026-11-02).** A person may explicitly take over one version of
   an `untrusted` tool as their own code. Adoption is not a sandbox decision and changes no policy: it changes the
   provenance of one tool version, after which the existing rules for `user-authored` code apply.
   - **Desktop only.** Only the desktop policy accepts it. In the server and `local-container` profiles, and for a
     server tenant's workspace on the desktop codebase, it is refused with `tool.adoption_desktop_only`; their trust
     policy does not change (there `user-authored` code needs a container anyway).
   - **Only the local owner or an administrator** (`tool.adoption_forbidden` otherwise). The API declares `admin`
     and records the role: `owner` for the desktop's local owner, the member's role otherwise.
   - **A confirmed action.** The studio shows the whole code and tests of the version, a warning that the code will
     run without isolation on this computer, and an explicit confirmation. The request carries the
     `content_hash` (code and tests, normalized like `code_digest`) of exactly what was shown; a tool changed in
     between is refused (`tool.adoption_stale`). Built-in, MCP and code-less tools cannot be adopted
     (`tool.adoption_not_applicable`), and a tool that is not `untrusted` needs no adoption
     (`tool.adoption_not_needed`).
   - **Audited.** Every adoption, every refused attempt and every revocation is written to the tool audit trail
     (`tool_approval_audit`, kinds `tool_adopted`, `tool_adoption_refused`, `tool_adoption_revoked`): who, when,
     the tool, the version and the content hash.
   - **Bound to the content.** The adoption counts only while the adopted version is stored with that content hash
     and every later version was written by a person in the tool editor. Any later AI-written version (a job, a
     draft, an agent) ends it: the tool is `untrusted` again and the record is dropped. Edits in the editor keep it.
     A restore clears adoptions with the other provenance records, and an import into a server never carries them.
   - **Defaults decided with R-4.** (1) AI code that a person edited stays `untrusted` until it is adopted.
     (2) Pasted code stays `user-authored`, as before; the editor states this clearly and warns after a paste.
     (3) Existing tools keep their class; there is no migration. (4) No similarity detection of pasted code for
     now (a later hint at most, never a trust decision; see the TODO lists). (5) Any later AI change revokes.
   - **Nothing else is weakened.** Points 3 to 5 stay as they are: `untrusted` code never runs in a host
     subprocess, the subprocess mode still refuses it, and no setting, environment variable or dialog other than
     this explicit, audited adoption of a specific content changes a tool's class. Adoption is a statement of
     responsibility by the person, not an isolation measure; the dialog says so.

### Sandbox prototype acceptance tests (PR-13)

Security, each attempted by test code from inside the sandbox and required to fail:

- read or write files outside the per-call work directory (home directory, data directory, other tools' files);
- open network connections (TCP, UDP, DNS), including to loopback and to the Nodestro API port;
- start other programs or escape the process tree; survive the call (orphaned processes);
- read the parent's environment variables, provider keys or the per-launch secret;
- exhaust CPU, memory, processes or disk beyond the configured limits (the call is stopped, the host is unaffected);
- use timing or shared-memory side channels documented for the candidate (listed in the report, not all closable).

Compatibility, required to pass on every OS the prototype claims:

- the existing tool test suite of `nodestro-runtime` and the generated tools of the 24 examples;
- standard library modules used by tools (json, csv, re, datetime, decimal, zipfile, sqlite3 in memory);
- one approved third-party library with compiled extensions (from a lock file, offline);
- start-up overhead and per-call latency measured and reported;
- behavior with non-ASCII paths and file names, and on a clean machine without developer tools.

### Built-in Linux sandbox (2026-10-31, nodestro-runtime `builtin_sandbox`, `sandbox_confine`)

**Why not bubblewrap.** On a clean Ubuntu 24.04 (kernel 6.8, AppArmor as shipped, normal user),
`kernel.apparmor_restrict_unprivileged_userns=1` denies unprivileged user namespaces: `bwrap` (system package and a
bundled copy) fails with "loopback: Failed RTM_NEWADDR: Operation not permitted" and `unshare -Ur` with "write failed
/proc/self/uid_map". Making it work needs an AppArmor profile installed by an administrator, which is a separate
installation. Debian 13 allows user namespaces, so bubblewrap would have worked there only.

**Decision.** The sandbox confines its own process with features every supported kernel has, before any tool code
is read, and needs no namespaces, no setuid helper and nothing installed:

- Landlock (ABI 4 or newer; Ubuntu 24.04 has 4, Debian 13 has 6): read access only to the interpreter, the system
  libraries (`/usr/lib`, `/lib*`), time zone data and the call's files; write access only to the call's private `tmp`
  (no device nodes or sockets); TCP bind and connect denied; with ABI 6 also abstract UNIX sockets and signals scoped
  to the sandbox. The home directory, the data directory and the temp root are never granted; the run is refused if
  the interpreter lives in one of them.
- seccomp (x86-64 filter, `no_new_privs`): no `fork`/`vfork`/`clone` without `CLONE_THREAD`, no `execve`, no
  `socket` of any family, no `ptrace`, `process_vm_*`, `kcmp`, `pidfd_*`, System V IPC, `bpf`, `perf_event_open`,
  `io_uring`, `userfaultfd`, keyrings, mounts, namespaces; `kill`, `tgkill`, `rt_*sigqueueinfo` and `prlimit64` only
  for the sandbox's own pid; `setpriority`, affinity and scheduler changes refused; x32 and 32-bit calls kill.
- Resource limits: address space, CPU seconds, file size, 256 open files, `RLIMIT_NPROC=0` (no threads or processes
  for a normal user), no core dumps. The host adds the wall-clock timeout, a total size limit for `tmp` (polled every
  50 ms), cancel (kills the process group) and cleanup.
- An empty environment (no keys, tokens or proxy settings). A root user is refused.
- The process verifies the confinement from the inside (an outside file, a socket and a fork must all fail) and
  exits with "nodestro-sandbox-error" before Orkexa's runner reads the request if anything is missing.

**Automatic use.** `LinuxSandbox.status()` checks the computer once (platform, tested distribution, Landlock ABI,
seccomp, root, a confined self-test). On the desktop, `ToolLibrary` routes code that needs isolation from a host
subprocess (default sandbox or a Python environment's interpreter) to the built-in sandbox with the same
interpreter. Without it, `sandbox.isolation_required` carries the reason; there is no fallback. `user-authored`
code keeps the configured sandbox. The settings show the status and the reason in six languages.

**Limits (stated in the user documentation).** It shares the kernel with the computer (a kernel bug can break any
Linux sandbox); metadata outside the allowed paths (`stat`, whether a guessed path exists) is not hidden; CPU timing
and cache side channels remain; the `tmp` limit is polled, so a run can exceed it for up to 50 ms of writing; it is
approved only for the tested distributions.

**Tests.** `python -m nodestro_runtime.sandbox_probes` runs the security probes and compatibility checks; a probe
passes only if its code ran in the sandbox and every attempt was refused. They run in nodestro-runtime CI (GitHub's
Ubuntu 24.04 runner, normal user, AppArmor unchanged) and in nodestro-desktop's "Sandbox systems" workflow inside
clean KVM machines of the official Ubuntu 24.04 and Debian 13 cloud images, as a user without sudo, with Python
removed from the machine (the bundle brings its own). Results: see `docs/desktop-server/sandbox-prototype-report.md`.

## Compatibility consequences (implemented in PR-4, not earlier)

- PR-1 to PR-3 do not change execution behavior. The policy and its enforcement arrive in PR-4, with tests and a
  changelog entry that names every affected feature.
- After PR-4, a desktop **without Docker** loses: automatic tests during AI tool generation, running AI-generated
  tools in workflows, and testing drafts. Workflows that use such tools fail before they start with
  `sandbox.isolation_required` (preflight), never halfway.
- Tools without recorded provenance (all tools stored before PR-4) are treated as `untrusted`. PR-4 decides, with
  Peter, whether hand-written tools can be identified reliably from existing data (for example tools never touched by
  a generation job); if not, they stay `untrusted` until the person re-saves them in the editor.
- Desktop users with Docker keep every feature.

## Implementation notes (PR-4)

- Existing tools: provenance cannot be derived reliably from existing data, so every tool stored before PR-4, also
  a hand-written one, stays `untrusted`. Decided under Peter's autonomy grant and his rule "unknown tool origin
  counts as untrusted". Re-saving does not change it: the class belongs to all versions under a tool name, and a
  new editor tool whose code equals a stored untrusted tool, a pending draft or a job attempt is `untrusted` too.
  Pasting code that came from elsewhere into a new tool cannot be detected; the documentation says that code
  written in the editor counts as the person's own.
- A restore clears the provenance records (a backup can come from anywhere).
- Releases record `tool_trust`; the studio's API decides with the studio's records, exported projects use the
  recorded classes and `TOOL_SANDBOX=subprocess|docker`.
- Untrusted code with libraries is refused (`sandbox.libraries_need_isolation`) until PR-11 brings container images
  per lock file; tool jobs ask for a standard-library version and never resolve libraries.
- Not done in PR-4: a `sandbox.unavailable` preflight when Docker is selected but not running (Orkexa's
  `DockerSandbox` still fails closed at call time; the diagnostics page reports it).

## Consequences

- Required tests (PR-4): policy matrix (profile × trust class × isolation available); no subprocess sandbox
  constructible in the server profile; no code path, setting or environment variable that runs untrusted code in a
  subprocess; generation job without isolation executes nothing and reports `sandbox.isolation_required`; preflight
  blocks workflows with untrusted tools before the run starts. PR-12: container with libraries has no network and
  cannot write outside its tmpfs.
- The settings page and documentation (six languages) explain the isolation level of each choice and which features
  need isolation.
- R-4: an adopted tool runs on the desktop like the person's own code, without isolation. The risk the policy
  otherwise removes (a person cannot reliably judge generated code) is accepted by that person for that content
  only, with a warning and an audit record; it never reaches a server or another tenant. Required tests: adoption
  refused in every non-desktop profile and for other roles, a stale hash refused, an AI change revoking, an editor
  change keeping it, audit records for success, refusal and revocation, restore clearing it, the API's problem
  codes, and the studio dialog offered only on the desktop and only after an explicit confirmation.

## Revision history

- 2026-10-31, accepted and implemented in PR-4 (see "Implementation notes").

- 2026-10-31, first draft: proposed a per-job confirmation before running untrusted code without Docker.
- 2026-10-31, revision after Peter's review: a confirmation dialog is not a security measure. Untrusted code without
  secure isolation is blocked; the desktop MVP may have restricted features; a built-in OS sandbox is the long-term
  goal and gets its own prototype with security and compatibility tests (PR-13). AI-generated code stays `untrusted`
  after approval.
- 2026-10-31, built-in Linux sandbox implemented with Landlock and seccomp instead of bubblewrap (Ubuntu 24.04's
  AppArmor userns restriction), registered as isolating only for the desktop profile on Ubuntu 24.04 and Debian 13
  after the security and compatibility tests passed there (Peter's decision of 15:23Z).
- 2026-11-02, amendment R-4 (Peter's decision): a person may adopt AI-generated code as their own on the desktop
  only, as a confirmed action with the code, a warning and an audit record, bound to a content hash and revoked by
  any later AI change (point 8). Implemented in nodestro-runtime (`ToolLibrary.adopt`, `tool_adoption`),
  nodestro-api (`POST /api/tools/{name}/adopt`) and the studio (adoption dialog, paste warning).

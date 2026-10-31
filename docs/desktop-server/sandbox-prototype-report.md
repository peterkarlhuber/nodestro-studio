# Built-in sandbox prototype: report (PR-13)

Status: prototype, **not isolating**. Recorded 2026-10-31. Decision basis: ADR-0006 point 7 and its "Sandbox
prototype acceptance tests (PR-13)".

## Result in one paragraph

The Linux x86-64 candidate (bubblewrap with a seccomp filter, `nodestro_runtime.builtin_sandbox`) passes every
security probe and the stdlib, test and non-ASCII compatibility checks that exist so far, in CI (GitHub `ubuntu-latest`,
ordinary user) and locally (container, root and `nobody`). It stays classified as not isolating, because the
compatibility part of the acceptance tests is incomplete. The open checks are the generated tools of the 24 examples,
a compiled third-party library from a lock file, and the desktop bundle on a clean machine with `bwrap` shipped
inside it. No candidate exists for macOS, Windows or aarch64. Desktop users keep the ADR-0006 behavior: Docker is the
only isolating sandbox, and without it, untrusted code is refused.

## Candidates

| Candidate | OS | State |
| --- | --- | --- |
| bubblewrap (namespaces) + seccomp filter | Linux x86-64 | prototype, tests below |
| bubblewrap + seccomp | Linux aarch64 | not started: the filter needs an aarch64 syscall table that is verified on aarch64 |
| Landlock rules in addition | Linux ≥ 5.13 | not started (would replace part of the root file system construction) |
| `sandbox-exec` profile for a helper process | macOS | not started; not run on macOS |
| AppContainer + job object | Windows | not started; not run on Windows |
| CPython on a WASI runtime | all | not started; pure-Python tools only |

## How one call runs (Linux candidate)

- `bwrap --unshare-all --die-with-parent --new-session --clearenv --cap-drop ALL --uid 65534 --gid 65534`: new user,
  PID, network, IPC, UTS and cgroup namespaces; the process tree ends with the call.
- The root file system is built from scratch. It holds only:
  - the interpreter;
  - its standard library and site-packages;
  - the shared libraries they link against (found once with `ldd`);
  - Orkexa's runner;
  - the call's files, read-only at `/work`;
  - a 16 MB tmpfs at `/tmp`.
  
  There is no `/etc`, no home or data directory, and no other programs.
- A classic-BPF seccomp filter, written by hand and checked against `asm/unistd_64.h`:
  - Refused with EPERM: new processes (`fork`, `vfork`, `clone` without `CLONE_THREAD`), `ptrace`, `process_vm_*`,
    mount APIs, `unshare` and `setns`, keyrings, `bpf`, `perf_event_open`, `userfaultfd`, `io_uring`,
    `open_by_handle_at`, module and clock calls.
  - Sockets other than `AF_UNIX` are refused with EAFNOSUPPORT.
  - `clone3` returns ENOSYS, so glibc falls back to `clone`.
  - x32 system calls and foreign architectures kill the process.
- Orkexa's runner limits stay in force: CPU time, address space, 1 MB per file, no core dumps, `RLIMIT_NPROC` 0.

## Security probes (all must fail)

| Probe | Linux x86-64 |
| --- | --- |
| read a host file / list a host directory / list the home directory | blocked (file not found) |
| write a call file, a new file in `/work`, a host file, a new host file | blocked |
| `/tmp` written in one call visible on the host or in the next call | no |
| only interpreter paths visible (`/etc`, `/bin/sh`, `/usr/bin/env`, `/etc/passwd` absent) | yes |
| TCP to a loopback listener (stand-in for the studio API port) | blocked |
| TCP to the internet, UDP, DNS resolution | blocked |
| `/bin/sh`, `fork`, a second Python, `multiprocessing` | blocked |
| host processes visible in `/proc` | no (two processes: bwrap's init and the runner) |
| runner processes left after the call | none |
| `ptrace`, `unshare`, `mount`, `bpf`, `keyctl`, `userfaultfd`, `io_uring_setup`, `setns`, `perf_event_open` | all refused |
| `NODESTRO_LAUNCH_SECRET` or a provider key from the parent environment, also via `/proc/*/environ` | not visible |
| endless loop | stopped by the timeout |
| 1 GB allocation with a 256 MB limit | `MemoryError` |
| 64 MB written to `/tmp` (8 MB tmpfs, 1 MB file limit) | refused |

Side channels that remain (not closable by this candidate): timing and cache effects of the shared CPU and
`/proc/cpuinfo`-level hardware information. Shared memory with the host is not reachable (own IPC namespace, no host
`/dev/shm`).

## Compatibility

| Check | Linux x86-64 |
| --- | --- |
| stdlib modules tools use: json, csv, re, datetime, decimal, zipfile, sqlite3 in memory | passed |
| validation of a tool with its tests, non-ASCII strings, non-ASCII temporary directory | passed |
| threads | same as the Docker sandbox: the runner's `RLIMIT_NPROC` 0 stops new threads for an ordinary user; numeric libraries need single-thread settings |
| generated tools of the 24 examples | not run |
| one approved third-party library with compiled extensions from a lock file, offline | not run (needs an environment per lock, like the container images of PR-11) |
| clean machine without developer tools, with `bwrap` inside the desktop bundle | not run (the desktop bundle does not ship `bwrap` yet) |
| Ubuntu `ubuntu-latest` CI runner, `bwrap` from apt, ordinary user | works as installed, no AppArmor change needed |

## Timings (local, Linux x86-64 container)

| Measurement | Value |
| --- | --- |
| first call (one-time `ldd` over the interpreter and site-packages) | about 5.6 s |
| further calls, bubblewrap | about 280 ms mean |
| further calls, host subprocess (for comparison only) | about 240 ms mean |

The one-time cost grows with the size of site-packages. A desktop build would compute the library list at build time.

## What is needed before the Linux candidate may become isolating

1. Ship `bwrap` in the Linux desktop bundle, or require it as a package dependency, and run the tests from the
   bundle on a clean VM. Distributions that restrict unprivileged user namespaces (Ubuntu 24.04 desktop with
   AppArmor) need an AppArmor profile for the bundled binary. That must be tested on such a desktop, not only on a
   CI runner.
2. Run the generated tools of the 24 examples and one compiled library (from a lock file, offline) inside it.
3. A reviewed change to `sandbox_policy.isolation_of` that names the OS and architecture, plus the settings and texts
   in six languages. The ADR says a candidate becomes isolating only where every test passed.

Until then, nothing in the desktop or the server uses the prototype.

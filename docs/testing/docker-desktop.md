# Testing the Docker sandbox with Docker Desktop

Nodestro runs AI-created tool code only in a container whose engine passed its own checks (ADR-0009). CI proves this
with Docker Engine on Linux and Colima on macOS Intel (`.github/workflows/docker.yml`); **Docker Desktop never ran in
CI**, because hosted runners cannot install it. This page is the manual check on real hardware: macOS Apple silicon,
macOS Intel, Windows x64 and Windows ARM64. It takes one command and writes a report you can send.

## What the test does

`scripts/docker_test.py` (started by `scripts/mac_docker_test.sh` on macOS) uses the real studio of the checkout and
the real Docker. Only the AI model is a local stand-in that answers with fixed code, so no provider and no API key
are needed and nothing costs money.

| Step | What is checked |
| ---- | --------------- |
| 0 | This computer and Docker, read only: docker command, engine answers, context and `DOCKER_HOST`, Linux or Windows containers, cgroup version, memory, CPUs, Docker Desktop version, what the docker command sees with the reduced environment the runtime gives it |
| 1 Detection | The studio (sandbox mode `auto`) finds the engine itself and chooses `docker` for untrusted code |
| 2 Preflight | The engine runs Linux containers and enforces memory, CPU and process limits and seccomp |
| 3 Image | The sandbox image is built (the first time: pulls `python:3.13-slim` and uv by their multi-platform digests) and is a Linux image for the engine's architecture (`linux/arm64` on Apple silicon and Windows ARM64) |
| 4 Self-test | A container of the sandbox's exact shape proves the restrictions hold (needs cgroup v2); `GET /api/sandbox/status` is `approved` |
| 5 AI code | A tool written by the (stand-in) Coding Agent comes in through the tool job and approval, is `untrusted`, and `add_numbers(2, 3)` returns 5 in an `orkexa-sandbox-*` container |
| 6 Isolation | `docker inspect` of a running call: no network, read-only root, all capabilities dropped, `no-new-privileges`, non-root user, no bind mounts, memory (no extra swap), CPU and process limits |
| 7 Timeout, cancel | A call past the 15 s timeout ends as an error; a cancelled workflow run removes its container at once |
| 8 Cleanup | No container of this test is left after each call, after the timeout and after the studio stopped |
| 9 No Docker | With the engine unreachable (`DOCKER_HOST=tcp://127.0.0.1:9`), and with `--stop-docker-desktop` also really quit, the status is `unavailable` with a `docker-*` reason and the tool and new tool jobs are refused with `sandbox.isolation_required`; no container starts |
| 10 Messages | The sandbox status reason has the sentence Settings → Sandbox shows, and the diagnosis (`GET /api/diagnostics`) reports Docker as `available` or `unavailable` |

Only this run's containers are looked at and removed: they carry the owner label of the test's own installation
(`org.orkexa.sandbox=nodestro-<id>`), so a Nodestro you use yourself on the same Docker is not touched.

## Prerequisites

- Docker Desktop installed and running (whale icon: *Docker Desktop is running*), with at least 2 GiB of memory
  (Settings → Resources). On Windows: the WSL 2 backend and **Linux containers** (whale menu → *Switch to Linux
  containers…* if it offers that).
- git, and read access to the private repositories `peterkarlhuber/*` for git over HTTPS (for example once
  `gh auth login` and `gh auth setup-git`). The test checks this first and says which repository it cannot read.
- Python 3.11 or newer. On macOS the wrapper finds one (python.org, Homebrew) or, if there is none, installs a pinned
  uv (`0.9.5`, from PyPI) into the work folder, which fetches Python 3.13 there. On Windows install Python 3.13 from
  python.org (on Windows ARM64 the ARM64 installer).
- About 3 GB of free disk space, an internet connection (PyPI, GitHub, Docker Hub, ghcr.io), 10 to 30 minutes for
  the first run.

## Commands

Replace `<commit>` with the commit you were asked to test.

### macOS (Apple silicon and Intel)

```bash
git clone https://github.com/peterkarlhuber/nodestro-studio.git
cd nodestro-studio
git checkout <commit>
bash scripts/mac_docker_test.sh
```

### Windows (x64 and ARM64), PowerShell

```powershell
git clone https://github.com/peterkarlhuber/nodestro-studio.git
cd nodestro-studio
git checkout <commit>
py -3.13 scripts\docker_test.py
```

### Options

| Option | Effect |
| ------ | ------ |
| `--stop-docker-desktop` | For step 9, really quit Docker Desktop and start it again (asks first; `--yes` does not ask). Uses `docker desktop stop`/`start` (Docker Desktop 4.37 and later), on macOS otherwise `osascript -e 'quit app "Docker"'` and `open -a Docker`; otherwise it asks you to quit it by hand. Running containers of yours stop as well. Without this option Docker Desktop is never quit. |
| `--context NAME` | Test this Docker context (for example `desktop-linux` when another engine is the current context) |
| `--keep` | Keep the virtual environment and the test data (a rerun of the same commit then skips the install) |
| `--remove-images` | Also remove the images this run pulled or built (sandbox image, `python`, `uv`); by default they are kept, so a rerun is faster |
| `--work DIR` | Work folder (default `~/nodestro-docker-test`, on Windows `%USERPROFILE%\nodestro-docker-test`). It must be missing, empty or made by an earlier run (marker `.nodestro-docker-test`), because the test deletes folders inside it |
| `--verbose` | Show every line of the test instead of the PASS/FAIL lines |
| `--stop-command CMD`, `--start-command CMD` | Stop and start another engine for step 9 (CI: `colima stop`, `sudo systemctl stop docker`) |

## Expected output

After the install, one line per check, then a summary:

```text
========================================================================
RESULT: PASS
========================================================================
 1. PASS    Nodestro found Docker by itself.
 2. PASS    Docker's settings are strict enough (Linux containers, memory/CPU/process limits, system call filter).
 3. PASS    Nodestro prepared its sandbox image for this computer.
 4. PASS    A test container proved that the restrictions really hold.
 5. PASS    AI-written Python code ran inside a Docker container.
 6. PASS    That container had no network, read-only files, no extra rights and memory/CPU/process limits.
 7. PASS    Code that runs too long was stopped after 15 s, and a cancelled run stopped its container at once.
 8. PASS    No test container was left behind.
 9. PASS    Without Docker, Nodestro refuses AI-written code instead of running it unprotected. Checked with Docker unreachable; ...
10. PASS    Nodestro shows the right status and explanation.

Report (no passwords or keys inside; please send the .zip file):
  ~/nodestro-docker-test/nodestro-docker-report-20261102-101500.zip
```

The exit code is 0 when every step passed, 1 when a step failed and 2 when the test could not run (no Docker, Docker
not running, Windows containers, no access to the repositories, install failed); in the last case the reason is
printed and is in the report.

An engine that does not pass the checks (for example cgroup v1) fails step 4, and steps 5 to 7 (and step 3, which
the runtime then does not report separately) are *NOT RUN*: then the test checks that the AI-created tool is refused,
which is the correct behaviour for such an engine. The result is
still FAIL, because Docker Desktop is expected to pass.

## The report

The work folder keeps `report-<time>.txt` (readable), `report-<time>.json` (everything, for analysis) and
`nodestro-docker-report-<time>.zip` with both. Send the zip. It contains the system (OS, architecture, Python),
Docker (Docker Desktop and engine version, context, Linux/Windows containers, architecture, cgroup version, memory,
CPUs, security options), every check with its step, the sandbox status, refusal codes, the cleanup, and the last
lines of the studio's log. It contains no environment dump; URL passwords (also of proxies), tokens, API keys,
`Authorization` values and home folders (`~`, other user names) are removed, and a host name is never included.
Read the `.txt` before sending if in doubt.

## Cleanup

Removed after every run: the test's containers (by their owner label; normally there are none left), the data folder
of the test studio, the virtual environment and pip cache (kept with `--keep`). Kept: the reports, the images (the
sandbox image `nodestro-env:<hash>` and the pulled `python` and `uv` base images; removed with `--remove-images`, and
only if they were not there before the run), Docker's build cache, and on macOS a Python the wrapper had to fetch
(`bootstrap/`, `python/` in the work folder). Nothing else is touched: no `docker system prune`, no other containers,
images or volumes. To remove everything, delete the work folder (and the images with `--remove-images` or
`docker image rm`).

## What this does not cover

- The packaged desktop app (nodestro-desktop): the test starts the studio from Python, as the desktop app does
  internally, but not the app itself, its launcher or its bundled Python.
- The interface in a browser: steps 1, 9 and 10 check the API responses and texts the interface shows, not the page.
- Real AI providers: the model is a local stand-in.
- Tools with third-party libraries (environment images), local MCP servers in containers, Docker Desktop's Enhanced
  Container Isolation, rootless or remote engines, Podman, OrbStack, Rancher Desktop.
- Whether every dependency installs on Windows ARM64 (a package without an ARM64 wheel makes the install fail; the
  report shows which). x64 Python under emulation is a fallback.
- Windows: the runtime gives the docker command only `PATH`, `HOME`, `DOCKER_*` and proxy variables (not
  `USERPROFILE`), so its docker command may not see Docker Desktop's context and talk to the default pipe
  `docker_engine` instead. Step 0 shows what it sees (`runtime_env_context` in the report); if the engine does not
  answer there, steps 1 to 8 fail, which is a finding for nodestro-runtime.

## Recording a result

Add the result (system, Docker Desktop version, commit, PASS/FAIL per step, report attached) to `docs/TODO.md`,
ST-033, and remove the platform from the *never ran* list when every step passed.

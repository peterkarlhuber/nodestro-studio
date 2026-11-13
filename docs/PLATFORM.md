# The Nodestro platform

Since version 0.2, Nodestro is split across six repositories. Each has a clear responsibility, its own tests and its
own CI. Together they form the same application as Nodestro 0.1: the same `nodestro` command, the same data in
`~/.nodestro`, the same user interface in six languages with the Midnight Citron design, the same APIs and the same
24 examples.

| Repository | Package (import) | Responsibility |
| --- | --- | --- |
| [nodestro-runtime](https://github.com/peterkarlhuber/nodestro-runtime) | `nodestro-runtime` (`nodestro_runtime`) | The workflow engine without server or user interface: schemas, graph, engine, building agents on Orkexa, tools, knowledge, memory, files, resuming, Python environments. The `Workspace` bundles everything for one data folder. Extension contract for integrations. |
| [nodestro-api](https://github.com/peterkarlhuber/nodestro-api) | `nodestro-api` (`nodestro_api`) | The HTTP API (FastAPI): the studio REST API under `/api`, published workflow APIs with keys, the LAN listener, export as a standalone FastAPI project, assistants, architect, batch runs, schedules, backups. Command `nodestro-api`. OpenAPI contract in `openapi/nodestro-api.json`. |
| [nodestro-studio](https://github.com/peterkarlhuber/nodestro-studio) | `nodestro` (`nodestro_studio`) | The application: React user interface, built-in documentation, the `nodestro` command, browser tests, the upgrade test and the platform pipeline. |
| [nodestro-sdk](https://github.com/peterkarlhuber/nodestro-sdk) | `nodestro-client` (`nodestro_client`), `@nodestro/client` | Clients for Python and TypeScript, generated from the OpenAPI contract. They only speak HTTP. |
| [nodestro-integrations](https://github.com/peterkarlhuber/nodestro-integrations) | `nodestro-integrations` (`nodestro_integrations`) | Extensions through the runtime's contract. Currently: local OCR with poppler and tesseract. |
| [nodestro-examples](https://github.com/peterkarlhuber/nodestro-examples) | `nodestro-examples` (`nodestro_examples`) | The 24 example workflows in six languages with sample files and test cases. |

The former `nodestro` repository is preserved unchanged as `nodestro-legacy` (state 15e2076, version 0.1).

## Dependencies

```
                     nodestro-studio  (nodestro)
                    /       |        \          \
                   ▼        ▼         ▼          ▼
          nodestro-api   nodestro-integrations   (user interface, docs)
            /      \             |
           ▼        ▼            │
 nodestro-examples   │           │
           \         │           │
            ▼        ▼           ▼
              nodestro-runtime
                     │
                     ▼
     orkexa @ cbf6df3d6f727b96924f1ae66e60b469eeef58e6  (external, unchanged)

 nodestro-sdk ──HTTP──► nodestro-api   (only the tests install the API)
```

Rules that `scripts/check_imports.py` verifies in the platform pipeline:

- A package never imports a package above it. The runtime knows neither the API nor the studio, the API does not know
  the studio, and integrations and examples only know the runtime.
- Only the runtime and the API use Orkexa (the API for the assistants, the architect and the export). There is no
  second agent runtime and there are no custom provider adapters; Orkexa is not copied.
- Nothing imports `claude_agent` or the old `nodestro` package, and no package depends on `claude-agent`.

The runtime additionally checks its side in `tests/test_architecture.py`.

## Extension contract

An integration is a package with an entry point in the group `nodestro.integrations` that returns a
`nodestro_runtime.extensions.Integration` (contract `CONTRACT = 1`): name, version, optional tools for the tool
library and optionally an OCR engine (`OcrEngine` protocol: `available()`, `recognize(data, name)`). `discover()`
loads all installed integrations. If one cannot be loaded, this is logged and it is left out; the runtime starts
anyway. The runtime rejects an integration written for a different contract with the error `extension.contract`
instead of using it halfway. The studio installs `nodestro-integrations` as well; the API also works without it (then
without OCR, like 0.1 without tesseract).

## Trust boundaries

- **Studio API (`/api`)** in the desktop profile: without user management and without its own keys, therefore never
  offered to the network. It listens on a loopback address only; `--host 0.0.0.0` and every other address are refused
  with `access.network_needs_login`, and `NODESTRO_ALLOWED_HOSTS` may only add loopback names. It answers only
  loopback host names, refuses requests forwarded by a proxy and accepts changes only from its own pages or from this
  computer (`nodestro_api.local_access`); this way no web page in the browser can operate it through DNS rebinding or
  cross-site requests. These checks are not authentication. The desktop app adds a per-launch secret
  (`nodestro_api.launch`); Nodestro Local Docker requires an access key, and the server requires a login (see
  [ARCHITECTURE.md](ARCHITECTURE.md#operating-profiles)).
- **Published APIs (`/api/published/...`)**: only with Nodestro keys (`ndk_...`, stored as SHA-256), each key limited
  to scopes and publications; on the network only through the separate listener that the user switches on
  explicitly.
- **Custom tools and AI-generated code** never run in the API process. Code a person wrote in the tool editor may run
  on the desktop in a separate Python process with a time limit and the user's permissions (no isolation).
  AI-generated code and code of unknown origin run only in an isolating sandbox: a container, or on the desktop the
  built-in Linux sandbox where it is available; otherwise they are refused (ADR-0006). On a server and in Local Docker
  all custom and AI-generated tool code runs in containers. Provider keys appear neither in responses nor in exports.

## Sandbox engines (Docker-first)

Docker is the default sandbox for untrusted code on Linux, macOS and Windows ([ADR-0009](adr/0009-cross-platform-sandbox.md),
status update 2026-11-02). The studio starts without an engine; only secure execution is blocked, with a reason in
Settings → Sandbox. Nodestro never trusts an engine by its name: it checks every engine on the host and refuses one
that fails, and the checks are the same for every engine.

| Engine | Host | CI | Notes |
| --- | --- | --- | --- |
| Docker Engine, rootless with cgroup v2 delegation | Linux | Verified | Recommended on Linux. |
| Docker Engine, rootful | Linux | Verified | Members of the `docker` group are effectively root on the host. |
| Podman | Linux | Verified | |
| Docker Desktop | macOS, Windows | Not verified | Accepted only if Nodestro's checks pass. Windows: Linux containers (WSL 2). |
| Colima | macOS | Not verified | Accepted only if Nodestro's checks pass. |
| OrbStack | macOS | Not verified | Accepted only if Nodestro's checks pass. |
| Podman (machine) | macOS, Windows | Not verified | Accepted only if Nodestro's checks pass. |

CI cannot run Linux containers on Apple silicon (no nested virtualization) or on the Windows runners, so those
combinations rely on the checks on the user's computer.

The built-in Linux sandbox stays optional (Ubuntu 24.04 and Debian 13, x86-64 only; it refuses on ARM64). macOS
has no native sandbox (the experimental one was removed; reported as `unavailable / removed`), Windows has none
(`unavailable / not-implemented`).

A host is refused for untrusted code when:

- no engine is installed or the daemon cannot be reached;
- the engine runs Windows containers instead of Linux containers;
- the engine does not enforce memory, process and CPU limits (cgroup v2), including rootless Docker without cgroup v2
  delegation of the `cpu`, `memory` and `pids` controllers;
- the engine does not apply a seccomp profile;
- the self-test container fails: it must run as uid 65534 without capabilities, with `no_new_privs` and seccomp in
  filter mode, with only the loopback interface, a read-only root file system, enforced `memory.max`, `pids.max` and
  `cpu.max`, `RLIMIT_NOFILE` and `RLIMIT_FSIZE`, a non-executable work directory and only `PATH`, `HOME` and
  `HOSTNAME` in the environment;
- the sandbox image is missing or does not match the pinned image identity.

## Versions and pins

- **All components have the same version** (0.2.0). A platform version is the set of commits in
  [`platform/versions.json`](../platform/versions.json) that were tested together.
- **One lock fixes every commit** (CI-FAST P3): `platform/internal.txt` (the studio profile) and
  `platform/internal-server.txt` (the server profile: also axentra and tabrion) hold one line per internal package,
  `nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@<sha>`, a full commit SHA, never a
  branch or a tag. Both are generated from `platform/versions.json` (`python scripts/check_versions.py --write-lock`)
  and checked by `scripts/check_versions.py`.
- **Components require each other by a version range**, such as `nodestro-runtime>=0.2.0,<0.3`, never by a URL; the
  range must contain the locked version. Every install names the lock:
  `pip install -r platform/internal.txt <target>` (the package names are not registered on a package index, so an
  install without the lock cannot find them). The studio declares ranges already; the components move from their
  URL pins to ranges one by one, and `check_versions.py` accepts a URL pin only at the locked commit until all have.
- **Moving a component is one studio pull request**: `scripts/bump_pins.py set . --set <name>=<sha>` rewrites
  `versions.json` and the lock; the products then move their studio pin as before.
- **Merge with a merge commit**, not a squash: the pinned commits come from the pull request branches and stay
  reachable on `master` this way. After a squash merge, the pins have to be moved to the new commits.

### One tabrion (TABRION VER-1, AC-6)

The foundation tabrion is the component `tabrion` of `platform/versions.json`: a commit of a **final** version
(0.1.0 = `d5821faa8742dea012abda3b663549c038d76543`; never a pre-release on master, RC-8). Under the lock model:

- **Every component** (axentra, orkexa, nodestro-runtime, nodestro-api) requires it only by the same minor range with
  final bounds, `tabrion[...]>=0.1,<0.2`: no URL (RC-1), no pre-release or dev bound (RC-8), no environment marker,
  and one minor everywhere (RC-2).
- **The lock** holds exactly one tabrion line, `tabrion @ git+https://github.com/peterkarlhuber/tabrion.git@<sha>`
  (full lowercase commit, `platform/internal-server.txt`); if both lock files carry it, they name the same commit
  (K-34). The commit is a release commit of `releases` in the versions.json entry (the master merge commit of each
  final; tabrion has no tags yet), and its version lies inside every component's range.
- **Libraries' standalone install:** `requirements/tabrion.txt`, exactly one line
  `tabrion @ git+https://github.com/peterkarlhuber/tabrion.git@<sha>` on a release commit inside the library's range
  (`pip install -r requirements/tabrion.txt -e ".[dev]"`). An older final of the same minor there is a warning, not an
  error (RC-7); the nightly job `tabrion-drift` (`check_versions.py --drift`) reports the libraries' default branches.
- Every locked manifest follows the K-33 edge list (`platform/dependency-policy.json`) and the graph has no cycle.

`python scripts/check_versions.py` then ends with "pins agree, one tabrion <version>@<sha>, graph acyclic, policy
ok". `--local DIR` (`make platform-local`) needs a checkout of every component, `DIR/tabrion` included, at its
locked commit. A tabrion bump changes the versions.json entry (`commit`, `version`, `releases`), the lock
(`--write-lock`) and the libraries' `requirements/tabrion.txt`; a new minor also moves every component's range.

### Changing a component

1. Change the component's repository, with tests, and merge.
2. Update the SHA in every repository that pins it (bottom up: runtime → examples and integrations → API → studio and
   SDK tests).
3. Update `platform/versions.json` in the studio. `python scripts/check_versions.py` must report "pins agree".
4. The studio's platform pipeline tests the new combination as a whole.

If the API contract changes, `python -m nodestro_api.openapi openapi/nodestro-api.json` writes the new file (otherwise
a test in nodestro-api fails). In the SDK, `make contract` takes it over and regenerates the types; the SDK's CI
checks that contract and types are up to date.

### Third-party packages: the upload cutoff

The components are pinned by commit; the third-party packages they need are not pinned one by one. Instead every
install path of the platform installs them as they were uploaded before one shared UTC time,
[`platform/uploaded-prior-to`](../platform/uploaded-prior-to) (one line, `YYYY-MM-DDTHH:MM:SSZ`), with pip's
`--uploaded-prior-to` option: the platform workflow (components, SDK and browser jobs), the server image
(nodestro-server `image/Dockerfile` and `image/install.py`; the Local Docker image is built from the same definition)
and the desktop backend (nodestro-desktop `scripts/build_backend.sh`). The products read the file of the studio commit
they build from, so the tested set is the shipped set and a rebuild of the same commits installs the same packages.

- `scripts/pip_cutoff.py` checks the file and the pip of the installing interpreter (pip 26.0 or newer, the first with
  the option) and prints the cutoff; every path passes it as the command-line option, never as
  `PIP_UPLOADED_PRIOR_TO`, which an older pip would ignore without a word. A path whose pip is too old fails; it then
  gets an exact newer pip (`pip==26.2.2`) deliberately, the cutoff is never skipped.
- What a build installed is kept: the platform workflow uploads `pip freeze` (artifact
  `pip-freeze-components-<python>`), the server image has `/opt/nodestro/pinned.txt`, the desktop backend
  `meta/pip-freeze.txt`.
- **Moving the cutoff:** set it to a recent full hour in UTC (`date -u +%Y-%m-%dT%H:00:00Z`), never in the future.
  It moves together with every pin bundle (the studio PR that moves `platform/versions.json`), at the latest 7 days
  after that bundle. For a security-relevant update of a third-party package (pip-audit, an image scan or an advisory)
  it moves immediately, as soon as the platform pipeline is green with the new cutoff. Then the products take it over
  with their next studio pin (`studio.json`, `components.json`).
- Users who install the studio themselves (`pip install .`) are not bound to the cutoff and need no particular pip.

## CI and access

The repositories and Orkexa are public on GitHub. The CI workflows clone and install them anonymously over https and
use no repository secret, so Dependabot pull requests (which cannot read secrets) run the full CI. `nodestro-legacy` keeps its CI with
`ORKEXA_TOKEN` unchanged.

| Repository | CI |
| --- | --- |
| runtime, examples, integrations, api | Python 3.11 and 3.13: ruff, ruff format, mypy (strict), pytest; build the wheel and install it into an empty environment |
| integrations | additionally real OCR with tesseract and poppler |
| api | additionally the OpenAPI contract and the export (the exported workflow passes its own tests) |
| sdk | Python: ruff, mypy, pytest against a real Nodestro server with simulated models, contract and generated types up to date, client installable without the API; TypeScript: typecheck, vitest against the same server, build and `npm pack` |
| studio | Backend (Python 3.11/3.13), frontend (lint, typecheck, vitest, build), all nine browser suites |
| studio, `platform.yml` | Platform pipeline, see below |

No test calls a paid provider. All model responses come from scripts (`nodestro_runtime.testing.ScriptedClient`). The
only network exception is the explicitly marked test that installs a real package from PyPI with uv
(`NODESTRO_NETWORK_TESTS=1`, free of charge).

### Merging and dependency updates

Changes reach `master` only through pull requests with merge commits (component pins point at pull request commits).
Dependabot opens weekly, grouped pull requests; they are merged by hand after green CI, auto-merge is off. The owner
decided on 2026-11-05 to protect `master` in every repository with required CI checks and to block force pushes and
branch deletion; until that is in place, see `docs/TODO.md` ST-052. The next common Node.js version is 24 LTS
(ST-054, Q1 2027); until then CI and builds use Node 22.

## Platform pipeline

`.github/workflows/platform.yml` in the studio runs on every push and pull request, weekly and on demand:

1. **Pins:** `scripts/check_versions.py` reads every component at its pinned commit and checks all references against
   `platform/versions.json`, and that the installation holds one tabrion (see "One tabrion" below).
2. **Integration:** the studio is installed with all pinned components (third-party packages up to the upload
   cutoff, see above). `scripts/check_imports.py` checks the dependency direction. Then the test suites of the runtime, examples, integrations and API run at the pinned commit
   against exactly this installation, as do the studio's tests including the upgrade test. Finally
   `scripts/lock_check.py` checks, offline, that every installed component still comes from its pinned repository
   and commit at the pinned version (`direct_url.json`) and that no package declares another commit of a component.
   The server image build (`image/finalize.sh`) and the desktop backend build (`scripts/build_backend.sh`) run the
   same script from their studio checkout and fail on a mismatch.
3. **Tabrion source (poisoned index):** the same install with every installer's index replaced by a poisoned one
   that serves `tabrion` 0.1.99 and redirects every other name to PyPI (`scripts/check_tabrion_source.py`). It fails
   when pip asks that index for `tabrion` at all, when poisoned code ran or when the installed `tabrion` is not the
   lock's commit (`lock_check.py --only tabrion`): the pins, not a PyPI placeholder, keep a foreign `tabrion` out.
   nodestro-runtime, nodestro-api and orkexa run an unchanged copy of the script against their own install.
4. **SDK:** the Python and TypeScript SDKs at the pinned commit against the installed API.
5. **Browser:** the user interface is built and all nine browser suites run against the installed platform.

## Upgrading from Nodestro 0.1

In the Python environment where Nodestro 0.1 is installed:

```bash
git clone https://github.com/peterkarlhuber/nodestro-studio.git && cd nodestro-studio
(cd frontend && npm ci && npm run build)    # the user interface belongs in the package
pip install -U -r platform/internal.txt .   # or -e . for development
nodestro
```

The distribution is still called `nodestro`, so an upgrade replaces 0.1 in place. The `nodestro` command has the same
options (`--host`, `--port`, `--data-dir`, `--no-browser`, `--reload`) and the same environment variables
(`NODESTRO_PORT`, `NODESTRO_HOST`, `NODESTRO_DATA_DIR`, `.env`). The data folder `~/.nodestro` and the SQLite database
keep being used without migration: workflows with their versions, runs, pending approvals, templates, settings and
provider keys, published APIs and their keys. The test `tests/test_upgrade.py` opens a real 0.1 data folder for this
(`tests/upgrade/legacy-0.1.zip`, created with `tests/upgrade/make_legacy_data.py` from nodestro-legacy 15e2076) and
checks exactly that.

The only new option: to run the API without the user interface, install `nodestro-api` and start `nodestro-api` with
the same options (without `--no-browser`).

## Desktop, Local Docker and server

The same runtime, API and studio ship as three products, each in its own repository that holds packaging and
deployment only. None of them is released: they are unreleased previews, and no image or installer has been
published. How the three operating profiles differ is described in
[ARCHITECTURE.md](ARCHITECTURE.md#operating-profiles), the plan and its step-by-step status in
[desktop-server/IMPLEMENTATION_STATUS.md](desktop-server/IMPLEMENTATION_STATUS.md), the decisions in
[adr/](adr/README.md). The security and database-backend master plan MUP-ONA (Orkexa, Nodestro, Axentra) and its
execution state live in [architecture/mup-ona/](architecture/mup-ona/STATUS.md).

| Product | Repository | Profile | State |
| --- | --- | --- | --- |
| Desktop app | [nodestro-desktop](https://github.com/peterkarlhuber/nodestro-desktop) | `desktop` | Linux x86_64 only, unsigned; release candidate `v0.2.0-preview.1` built and checked, not published. macOS and Windows are not built or tested. |
| Server | [nodestro-server](https://github.com/peterkarlhuber/nodestro-server) | `server` | linux/amd64 image, development stack and end-to-end acceptance tests; release candidate `v0.2.0-preview.1` built and checked, not published; images unsigned. Operation: [RUNBOOK](https://github.com/peterkarlhuber/nodestro-server/blob/master/docs/RUNBOOK.md). |
| Nodestro Local Docker | [nodestro-local-docker](https://github.com/peterkarlhuber/nodestro-local-docker) | `local-container` | Development preview: no published images, the launcher builds the image from source; tested on Linux x86_64 and arm64 only. |

Known gaps (see the status file for the full list): no code signing, no key rotation for the server's
`NODESTRO_SECRET_KEY`, and on a server only runs use the job queue (batches, test series, assistant drafts and
Python environment installations still run in the API process that started them).

The product evolution plan (progressive complexity first, then quality checks before publishing) is a reviewed
proposal in [evolution/README.md](evolution/README.md); it is sequenced around the desktop/server plan and changes
none of its decisions.

## Export

Exporting a workflow as a standalone FastAPI project works as in 0.1, with the choice between Orkexa from Git (pinned
commit) and a bundled Orkexa. The runtime now lies in the project as the packages `nodestro_runtime/` and
`nodestro_api/` (only the modules needed, copied byte for byte). `RUNTIME.json` lists versions, commits and the
SHA-256 of every file. An exported project needs none of the Nodestro repositories.

## Provenance

The code comes from `peterkarlhuber/nodestro` at commit 15e20768dea496820d4f8a286720176b47817da7 (merge of PR #14).
The split moved modules and rewrote imports but changed no behavior, with four necessary decouplings: `Workspace` as
the core of the runtime (the API extends it), resuming published runs through the `PublishedRuns` protocol, OCR as an
integration, and the API no longer serves the user interface (the studio does). The mapping of the files is in each
repository's `PROVENANCE.md`.

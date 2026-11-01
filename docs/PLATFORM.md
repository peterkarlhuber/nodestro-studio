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

## Versions and pins

- **All components have the same version** (0.2.0). A platform version is the set of commits in
  [`platform/versions.json`](../platform/versions.json) that were tested together.
- **Every reference to another repository is a full commit SHA**, never a branch or a tag:
  `nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@<sha>`. Orkexa stays at
  `cbf6df3d6f727b96924f1ae66e60b469eeef58e6` (Orkexa has no tags).
- **Every component pins only its direct dependencies**; the studio pins all of them. pip aborts when two pins of the
  same component differ; `scripts/check_versions.py` checks this beforehand and reports exactly which pin differs.
- **Merge with a merge commit**, not a squash: the pinned commits come from the pull request branches and stay
  reachable on `master` this way. After a squash merge, the pins have to be moved to the new commits.

### Changing a component

1. Change the component's repository, with tests, and merge.
2. Update the SHA in every repository that pins it (bottom up: runtime → examples and integrations → API → studio and
   SDK tests).
3. Update `platform/versions.json` in the studio. `python scripts/check_versions.py` must report "pins agree".
4. The studio's platform pipeline tests the new combination as a whole.

If the API contract changes, `python -m nodestro_api.openapi openapi/nodestro-api.json` writes the new file (otherwise
a test in nodestro-api fails). In the SDK, `make contract` takes it over and regenerates the types; the SDK's CI
checks that contract and types are up to date.

## CI and access

The repositories and Orkexa are public on GitHub. The CI workflows still set up read access with the repository
secret `NODESTRO_READ` (a token with "Contents: Read" on `orkexa` and the `nodestro-*` repositories) and stop with a
clear message if it is missing. The secret never appears in code, logs or artifacts. `nodestro-legacy` keeps its CI with
`ORKEXA_TOKEN` unchanged.

| Repository | CI |
| --- | --- |
| runtime, examples, integrations, api | Python 3.10 and 3.13: ruff, ruff format, mypy (strict), pytest; build the wheel and install it into an empty environment |
| integrations | additionally real OCR with tesseract and poppler |
| api | additionally the OpenAPI contract and the export (the exported workflow passes its own tests) |
| sdk | Python: ruff, mypy, pytest against a real Nodestro server with simulated models, contract and generated types up to date, client installable without the API; TypeScript: typecheck, vitest against the same server, build and `npm pack` |
| studio | Backend (Python 3.10/3.13), frontend (lint, typecheck, vitest, build), all nine browser suites |
| studio, `platform.yml` | Platform pipeline, see below |

No test calls a paid provider. All model responses come from scripts (`nodestro_runtime.testing.ScriptedClient`). The
only network exception is the explicitly marked test that installs a real package from PyPI with uv
(`NODESTRO_NETWORK_TESTS=1`, free of charge).

## Platform pipeline

`.github/workflows/platform.yml` in the studio runs on every push and pull request, weekly and on demand:

1. **Pins:** `scripts/check_versions.py` reads every component at its pinned commit and checks all references against
   `platform/versions.json`.
2. **Integration:** the studio is installed with all pinned components. `scripts/check_imports.py` checks the
   dependency direction. Then the test suites of the runtime, examples, integrations and API run at the pinned commit
   against exactly this installation, as do the studio's tests including the upgrade test.
3. **SDK:** the Python and TypeScript SDKs at the pinned commit against the installed API.
4. **Browser:** the user interface is built and all nine browser suites run against the installed platform.

## Upgrading from Nodestro 0.1

In the Python environment where Nodestro 0.1 is installed:

```bash
git clone https://github.com/peterkarlhuber/nodestro-studio.git && cd nodestro-studio
(cd frontend && npm ci && npm run build)    # the user interface belongs in the package
pip install -U .                            # or -e . for development
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
[adr/](adr/README.md).

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

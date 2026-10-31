# API and export

A finished workflow can be used as a web API: directly from Nodestro on this computer, or as a standalone FastAPI project that you can run anywhere. Both use the same workflow logic as Nodestro itself. Nothing is regenerated, and no AI rewrites the flow.

## Overview {#ueberblick}
<!-- keywords: api, rest, http, endpoint, publish, deploy, deployment, fastapi, export, interface, integration -->

Open a workflow in the editor and click **API & Export**. The dialog has six areas:

| Area | What for |
|---|---|
| **Overview** | Status, addresses, publishing, versions and the latest API runs |
| **Keys & access** | API keys and the optional access from the network |
| **Try it** | Check a request or start a real test run |
| **Documentation** | Endpoints, curl and Python examples, OpenAPI description |
| **Limits** | Name in the URL, description and limits |
| **Export** | The standalone FastAPI project as a ZIP |

There are two ways:

1. **Serve directly:** Nodestro answers requests under `/api/published/<name>/…`. By default only from this computer.
2. **Export:** Nodestro generates a project with runtime, workflow version, tests, examples and README. You run it without Nodestro, for example on a server or in Docker.

Both run step by step as in Nodestro: the same agents, tools, branches, approvals and forms.

## Publishing {#veroeffentlichen}
<!-- keywords: publish, publishing, version, freeze, check, save, note -->

**Publish** freezes the last saved version of the workflow, together with:

- the agents with model, instructions and settings,
- the code of the tools in their approved version (see [Tool approval](/docs/tools#freigabe)),
- the sub-workflows in their current version (see [Sub-workflows](/docs/verzweigungen#unterworkflow)),
- the input form, from which Nodestro generates the request schema.

Nodestro checks the workflow first. Errors block publishing; the dialog shows warnings (such as a missing cost limit or approval steps). Unsaved changes are not published: save first. Below it is the version's **test result** from each [test series](/docs/automatisierung#testreihen) of the workflow: *untested*, *n of m passed*, or *outdated* when another version was tested last or the test series changed since. The result is for information only; it does not block publishing.

Each publication gets a sequential number and an optional note. Later edits in the editor never change a published version. They reach the API only when you publish again.

## Versions and rollback {#versionen}
<!-- keywords: version, versions, rollback, roll back, active, active version, immutable, release -->

The **versions** list shows every published version with date, note and check result. One of them is **active**: requests to `/runs` use it.

- **Make active** switches the active version at once, without publishing again. This is how you roll back to an earlier version.
- Runs keep their version until they end, also when resumed after an error.
- Clients can call a specific version: `POST /api/published/<name>/versions/<number>/runs`.

Published versions cannot be edited. That keeps results traceable: every API run shows which version it ran with.

## Switching off and deleting {#abschalten}
<!-- keywords: switch off, disable, deactivate, pause, 503, delete, remove -->

**Switch off** refuses new runs with status `503` and the code `publication.disabled`. Running runs continue; when switching off you can cancel them too. Status and results of existing runs stay available. **Switch on** makes the API available again.

**Delete API** removes all versions, and keys lose access to them. This only works when no run of this API is still running. The runs themselves stay under Executions. When the workflow is deleted, its API goes too.

## Endpoints {#endpunkte}
<!-- keywords: endpoints, url, address, runs, status, result, events, cancel, approve, resume, versions, openapi -->

You set the name in the URL (e.g. `check-invoices`) when publishing and change it under **Limits**. All paths start with `/api/published/<name>`:

| Method and path | Effect | Permission |
|---|---|---|
| `GET /` | What the API expects and returns, and which versions exist | `read` |
| `POST /runs` | Starts a run with the active version | `run` |
| `POST /versions/<number>/runs` | Starts a run with a specific version | `run` |
| `GET /runs` | The latest runs of this API | `read` |
| `GET /runs/<id>` | Status, steps, cost and approvals of a run | `read` |
| `GET /runs/<id>/result` | The result of a finished run | `read` |
| `GET /runs/<id>/events` | Progress as Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Cancels a run | `run` |
| `GET /runs/<id>/approvals` | Waiting approvals with what to review | `read` |
| `POST /runs/<id>/approve` | Decides an approval | `approve` |
| `POST /runs/<id>/resume` | Continues a failed run | `run` |
| `GET /runs/<id>/files` | Result files of a run | `read` |
| `GET /usage` | Runs, tokens and cost of this API | `read` |
| `GET /openapi.json` | OpenAPI description of this API only | – |

The complete schemas are under **Documentation**, where **Download OpenAPI description** also gives you the OpenAPI file.

## Requests and responses {#aufrufen}
<!-- keywords: request, body, json, input, values, form, schema, files, base64, response, 202, run_id, idempotency -->

The request body is JSON. If the workflow has an input form, the fields are under `values`, with types, required fields and choices as in the form. Otherwise there is a text field `input`. Files come as a list `files` with `name`, `media_type` and `content_base64`. Alternatively the API accepts files as `multipart/form-data`, see [Files through the API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/check-invoices/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"amount": 120, "supplier": "ACME"}}'
```

Nodestro answers at once with `202` and a `run_id` plus links to status, result and events. The run works in the background. Poll the status until it is `succeeded`, `failed` or `cancelled`, then fetch the result. Other states: `queued`, `running` and `awaiting_approval`.

If a request does not fit the schema, the API answers `422` and names every invalid field. With the header `Idempotency-Key`, a repeated request (for example after a network error) does not start a second run but returns the first.

## Waiting synchronously and events {#synchron}
<!-- keywords: synchronous, sync, wait, blocking, sse, server-sent events, stream, live, reconnect, last-event-id -->

By default every API is asynchronous. Under **Limits** you can switch on **Allow waiting for the result**. Then `POST /runs?wait=30` waits up to the configured time for the result. If the run has not finished by then, the usual `202` comes back. This is not possible for workflows with approval steps, because a person has to decide.

`GET /runs/<id>/events` delivers progress as Server-Sent Events: steps start and end, text is produced, approvals wait, the run ends. Prompts and tool data stay in Nodestro. If the connection drops, the client reconnects with the header `Last-Event-ID` and only gets the events it missed.

## Approvals through the API {#freigaben}
<!-- keywords: approval, approve, reject, waiting, awaiting_approval, human, human in the loop -->

When a run reaches an approval step, it changes to `awaiting_approval`. You can decide in two places, and the first decision counts:

- in Nodestro on the Approvals page (see [The Approvals page](/docs/verzweigungen#freigaben-seite)), marked “from the published API”,
- through `POST /runs/<id>/approve` with `{"decision": "approved"}` or `"rejected"` and an optional comment. This needs a key with the `approve` permission.

Waiting approvals survive a restart of Nodestro. A failed run can be continued with `POST /runs/<id>/resume`. Successful steps are reused. Steps that called tools run again only with `confirm_side_effects: true`.

## API keys {#schluessel}
<!-- keywords: key, api key, token, bearer, authorization, x-api-key, permissions, scopes, run, read, approve, revoke, rotate, hash -->

Every request needs a key, either as `Authorization: Bearer <key>` or as the header `X-API-Key`. You create keys under **Keys & access**:

- **Name:** who uses the key, e.g. the name of the application.
- **Permissions:** `run` starts, cancels and continues, `read` reads status, results and events, `approve` decides approvals.
- **Valid for:** the APIs the key may call. It never reaches other workflows or the Nodestro interface.

The key is shown **exactly once**. Nodestro stores only a hash and later recognises the key by its beginning (`ndk_…`). **Revoke now** blocks a key. **Replace with a new key** creates a new key with the same settings and revokes the old one. Keys never appear in logs, traces, backups or exports. After many wrong keys in a short time, the API answers `429` for a while.

## Access from the network {#netzwerk}
<!-- keywords: network, lan, port, 8100, 0.0.0.0, other devices, tls, https, certificate, firewall, share -->

By default published APIs only answer this computer. Other devices get `403` with the code `lan.not_enabled`. To let devices in your network in:

1. Open **Keys & access → Network settings** and switch network access on. Nodestro opens a **separate port** (default `8100`).
2. Switch on **Reachable in the network** for each API. Only those APIs can be reached through the port.

This port only serves the published APIs, never the Nodestro interface, its settings or other workflows. If the port is taken, the dialog says so and Nodestro keeps running normally. After restoring a backup, network access is off again.

## Security {#sicherheit}
<!-- keywords: security, tls, https, encryption, internet, reverse proxy, certificate, backup, secrets -->

- Without TLS, requests, keys and results travel through the network **unencrypted**. Use network access only in networks you trust, or set a certificate and its key (file paths on this computer).
- Do not put Nodestro directly on the internet. That is what the export is for, behind a reverse proxy with TLS.
- Every run costs money at the model provider. Only hand out keys with the `run` permission if you trust the API's limits.
- Backups contain no API keys (see [Backup and restore](/docs/einstellungen#backup)). On restore, the keys of this computer are kept.

## Limits {#grenzen}
<!-- keywords: limits, rate limit, 429, concurrent, budget, daily budget, cost, upload, file size -->

Under **Limits** you decide how much an API may be used:

| Limit | Default |
|---|---|
| Concurrent runs | 2 |
| Runs waiting for approval | 20 |
| New runs per minute and key | 10 |
| Requests per minute and key | 120 |
| Daily budget (cost of the last 24 hours) | 5 USD |
| Cost limit per run | The workflow's budget |
| Size of an uploaded file | 10 MB |

When a limit is exceeded, the API answers `429` with a code such as `limit.concurrent` or `limit.daily_budget`, and for rate limits with the header `Retry-After`. The cost limit per run complements the [workflow's budget](/docs/workflows#budget).

## Error messages {#fehler}
<!-- keywords: error, errors, code, status, 401, 403, 404, 409, 422, 429, 503, machine-readable -->

Every error has the same shape so that programs can evaluate it:

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Status | Meaning |
|---|---|
| `401` | Key missing or invalid (`auth.missing`, `auth.invalid`) |
| `403` | Permission missing (`auth.scope`) or network access is off |
| `404` | API, version, run or file does not exist |
| `409` | Does not fit the state, e.g. result of a running run (`run.not_finished`) |
| `422` | The request does not fit the schema (`request.invalid`) |
| `429` | A limit is reached (`limit.*`) |
| `503` | API switched off (`publication.disabled`) or the provider of a model is not set up (`model.unavailable`) |

## Testing in Nodestro {#testen}
<!-- keywords: test, try, check, validate, dry run, test run, example -->

**Try it** holds an example request that you can adjust:

- **Check request** validates the body exactly like the API, shows the input the workflow would get, and starts nothing. It costs nothing.
- **Start test run** starts a real run of the published version through the same path as the API. It is billed like any run and appears under Executions as a test run from Nodestro.

For regression tests of a new version, use [test series](/docs/automatisierung#testreihen): they run with the saved version before you publish.

## Monitoring {#ueberwachung}
<!-- keywords: monitoring, runs, origin, usage, cost, statistics, api runs -->

API runs appear under Executions with the trigger **API**. The detail view names the version and the key that started the run. On the Usage page, runs of published APIs have their own line (see [The Usage page](/docs/nutzung#statistik)). The overview in the dialog shows this API's latest runs, and `GET /usage` gives programs the same numbers.

## Export as a FastAPI project {#export}
<!-- keywords: export, zip, fastapi, project, standalone, docker, uvicorn, readme, tests, pyproject, lock, deployment, server -->

Under **Export**, **Generate ZIP** creates a standalone project from a published version. It contains:

| Part | Content |
|---|---|
| `app/` | FastAPI application with the same endpoints, configuration, key management |
| `nodestro_runtime/`, `nodestro_api/` | The Nodestro runtime (nodestro-runtime and the HTTP layer of nodestro-api), copied unchanged; versions and checksums in `RUNTIME.json` |
| `workflow/` | The frozen version with agents, tools and sub-workflows |
| `pyproject.toml`, `requirements.lock` | Dependencies with exact versions |
| `tests/`, `examples/` | Tests without model calls, an example request and a Python client |
| `README.md`, `Dockerfile`, `.env.example` | Installation, configuration and operation |

If tools need Python libraries, the export takes exactly the approved versions (see [Library approval](/docs/python-bibliotheken#freigabe)). Before generating, the dialog shows every file and every note. The export never contains API keys, settings or other workflows. The same version with the same options gives the same ZIP file, byte for byte.

In the exported project, `python -m app.keys new` creates keys for your clients. Set the access to the AI providers as environment variables, such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `GEMINI_API_KEY`; the README and `.env.example` name exactly the variables the workflow version needs. Base URLs of your own servers are exported too, unless they contain credentials; then you set them yourself (for example `OLLAMA_BASE_URL`).

## The Orkexa library {#orkexa}
<!-- keywords: orkexa, library, repository, license, mit, vendor, include, git, access -->

Nodestro runs agents with the **Orkexa** library, which talks to all supported providers. It is not on PyPI and lives in a repository that is currently private. The export therefore offers two ways:

- **Git reference** (default): `pyproject.toml` points to the exact commit. Whoever installs the project needs read access to the repository.
- **Include source:** the source goes to `vendor/orkexa/` and the project installs without access to the repository. The library is under the MIT license. Confirm that you may pass it on before giving this project to others.

Without one of the two the project cannot be installed. The README names the chosen way.

## Knowledge and memory in the export {#daten}
<!-- keywords: knowledge, memory, data, privacy, confidential, include, exclude -->

Knowledge files and persistent memory can hold confidential content. They therefore go **into the project only when you select them one by one**:

- **Knowledge** (see [Knowledge](/docs/wissen#ueberblick)): selected files are copied with their content. Unselected ones are missing, and the agents find nothing there.
- **Memory** (see [Persistent memory](/docs/memory#dauerhaft)): the current content of a selected memory space becomes the project's starting content. After that, both develop separately.

The check before the export lists which agents use data that was left out. When serving directly, API runs use Nodestro's knowledge and memory like any other run.

## Integration guide with AI {#ki-anleitung}
<!-- keywords: ai, guide, documentation, description, cost, optional, review, accept, discard -->

By default the export is made without AI and at no cost: README and examples come from templates. Optionally, the assistant model writes a guide in prose for the users of your API (`docs/AI_GUIDE.md`) from the generated documentation. Only the API documentation goes to the model, no keys and no data. This is a paid model call and appears on the Usage page as “AI guide for an API”.

The guide goes into the export only after your review: read it and click **Accept** or **Discard**. It changes nothing in the code or the endpoints.

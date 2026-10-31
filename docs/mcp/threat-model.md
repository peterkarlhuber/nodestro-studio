# MCP threat model

Status: draft for [ADR-0007](../adr/0007-mcp-client.md) (MCP-0, WP-0, 2026-10-31). It covers the MVP (remote MCP
servers over Streamable HTTP, approved read-only tools) and names what later packages must add. Each threat has the
control that answers it, the package that builds it and the test that proves it. A control marked **MVP** is a
release condition for the MVP.

## Scope and assets

- **Assets:** tenant data agents can see (inputs, knowledge, memory, run outputs), MCP tokens and provider keys,
  the integrity of workflows and their tools, the server's internal network, budgets.
- **Actors:** an administrator who connects servers; editors who assign tools to agents; the model; a remote MCP
  server (honest, compromised or malicious); content returned by tools (may carry instructions); other tenants;
  the Workflow Architect and Assistant (generate workflow JSON).
- **Trust boundaries:** studio ↔ API (permissions, tenant); runtime ↔ remote server (network, tokens); model ↔
  tools (`before_tool`); tool output ↔ model context; local server ↔ host (later, containers only, ADR-0006).

## Principles

1. A server's tool list, descriptions, annotations and results are data, never instructions, and never a security
   guarantee.
2. Nodestro decides access: server enabled ∩ tool approved by an administrator ∩ tool assigned to the agent
   (intersection only). Nothing reaches the model by default.
3. No path to MCP outside this mechanism (F-1).
4. Fail closed: a missing check, an unreachable server or a changed definition refuses the call with a stable code.

## Threats and controls

| # | Threat | Control | Package | Proof |
| --- | --- | --- | --- | --- |
| T1 | MCP reached past Nodestro's controls through provider options (Anthropic `mcp_servers`/`mcp_toolset`, OpenAI `mcp` tool via `extra_body`) | `providers.check_request_options` in `AgentBuilder.build` and `Connection.options` | WP-0 (done: runtime #25) | `tests/test_request_options.py`, incl. loopback stub: forbidden options send no request |
| T2 | Prompt injection in tool results makes the agent act against the user | MVP: only read-only tools, so an injected instruction cannot change data through MCP; results marked as external data; output size limit. Later: per-call approval for tools that change data | WP-1, WP-2 (MVP); WP-5 | test server returns an injection text; no write tool is offered; run record shows the call |
| T3 | Tool poisoning: malicious descriptions or schemas | descriptions shown as foreign text in the studio; the administrator approves each tool after seeing description and schema; descriptions are length-limited | WP-2, WP-4 (MVP) | unapproved tool never reaches the model |
| T4 | Rug pull: a server changes an approved tool's description or schema | snapshot with hash per tool; a changed definition is blocked until an administrator accepts the diff; runs fail with `mcp.tool_changed` | WP-2 (MVP) | test server changes a definition between two runs |
| T5 | Name collision or shadowing across servers | server-scoped names `mcp__<slug>__<tool>`; never the server's self-reported name | WP-1 (MVP) | two test servers with the same tool name |
| T6 | Data exfiltration through arguments (private data + untrusted content + external channel) | arguments recorded in the run; studio explains "the service sees what the agent sends"; inspector warns when an agent combines MCP tools with knowledge or input files; MVP limits MCP to read-only tools, but a read call still sends arguments, which stays a documented residual risk | WP-2, WP-4 (MVP) | UI review; run record contains the arguments |
| T7 | SSRF: the server address or a redirect points into the internal network | `https` only (loopback `http` on the desktop only with explicit consent); address check after DNS resolution on every connection (private, loopback, link-local, metadata ranges refused); redirects only within the origin (the SDK already does this) and re-checked; server profile: operator allow-list `NODESTRO_MCP_ENDPOINTS` (empty = none) | WP-1 (MVP) | tests with a host name resolving to 127.0.0.1/169.254.169.254, a redirect to a private address, a non-listed origin on a server |
| T8 | Token theft or leakage | desktop: encrypted, key in the OS keychain; no keychain → no persistent tokens (D-3); server: `SecretBox`, tenant-bound; tokens never in workflow JSON, exports, traces, logs, API responses (`key=set` only); redaction list extended | WP-1 (MVP) | search for the token value in database dump, logs, export, trace export, API responses |
| T9 | Token sent to the wrong server | tokens bound to the configured origin; never forward Nodestro or provider keys; OAuth later: RFC 8707 `resource`, issuer-bound credentials, RFC 9207 `iss` check | WP-1 (MVP); WP-6 | test: redirect to another origin carries no token |
| T10 | Cross-tenant access | configuration, tokens, snapshots and connections per tenant; one connection hub per tenant and process; tenant-scoped routes with permissions (`admin` to manage, `edit` to assign, `run` to execute, `read` to list) | WP-1, WP-3 (MVP) | server e2e: another tenant sees no servers, tools or tokens and cannot call them |
| T11 | Denial of service and cost: slow or huge responses, endless tool loops | per-call timeout (default 60 s, not the SDK's 300 s), cancel with the run, output limit (default 20,000 characters), parallel calls per server limited, `max_tool_rounds` unchanged | WP-1 (MVP) | hanging test server, oversized response, cancel during a call |
| T12 | Unattended runs act without a person | MVP tools are read-only; schedules may use them only after the MVP security acceptance (D-7); published APIs only with WP-9 | WP-2 (MVP), WP-9 | schedule run with a non-approved or changed tool fails |
| T13 | AI-generated workflows add MCP tools or options | T1 refuses provider MCP options; generated `AgentConfig.tools` can only name approved MCP tools, and only an editor's save assigns them | WP-0, WP-2 | Architect output with forbidden options is cleaned (existing automatic fix for `config.reserved_request_options`) |
| T14 | Missing audit trail | `ToolCallRecord` gains source, server, qualified tool, definition hash, duration and policy decision (additive fields); administration events (server added, token changed, tool approved, definition changed) per tenant without secrets | WP-2 (MVP) | records present after a run; old runs still load |
| T15 | Local server executes arbitrary code (later) | only in containers (D-5), class `untrusted`, no host fallback (D-6), network limited to the allow-list, kill the process group on cancel | WP-8 | container probes; refusal `sandbox.isolation_required` without Docker |
| T16 | Malicious elicitation or URL prompts (later) | not in the MVP; later only through the approval UI, URL mode with a warning | WP-10 | – |

## Residual risks accepted for the MVP

- A connected service learns what agents send it (T6). The administrator connects it knowingly; the studio says so.
- A read-only tool can return misleading content. Agents treat it as data; people see the call in the run.
- Annotation-based suggestions can be wrong; the administrator's classification decides, and the default is
  "changes data".

## MVP security acceptance (release condition)

All MVP controls above are implemented, their proofs pass in CI, and Peter accepts this threat model. Unattended use
in schedules (D-7) is enabled only after that acceptance.

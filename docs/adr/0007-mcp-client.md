# ADR-0007: MCP client for external tools

- Status: Accepted (2026-10-31). Decisions D-1 to D-8 were approved by Peter on 2026-10-31; this record writes them
  down. Accepting it accepts the architecture; the technical security acceptance of the implementation is a separate
  later step (see the [threat model](../mcp/threat-model.md)).
- Repositories: nodestro-runtime (client, tool adapter, execution, policies), nodestro-api and nodestro-sdk
  (management interface), nodestro-studio (user interface), nodestro-desktop and nodestro-server (secure storage,
  operation, isolation). orkexa: unchanged.
- Related: [ADR-0003](0003-identity-and-tenants.md) (tenants, roles), [ADR-0006](0006-sandbox-policy.md) (sandbox
  policy), [threat model](../mcp/threat-model.md). The full plan is the German "Nodestro MCP Integration –
  Masterplan" (project document).

## Context

Nodestro agents can only use built-in tools (pure computation), tools written in the editor, AI-generated tools
(isolated, no network) and three Anthropic server tools from a fixed catalog. The Model Context Protocol (MCP) lets
an application connect agents to external tools, services and data sources. The current protocol revision is
2026-07-28 (stateless core: no `initialize` handshake, `server/discover`, per-request `_meta`, no sessions); servers
of the handshake era (2025-11-25 and earlier) remain common.

Facts from the code (runtime `d2cb987`, orkexa `76883f7`):

- Orkexa owns model communication, the tool-calling loop (`orkexa.core.runtime.AgentCore`), the `Tool` abstraction
  and pricing. A tool with a supplied JSON schema and its own execution is possible today
  (`orkexa.dynamic.SandboxedTool` does it).
- The runtime owns the tool library and trust classes (`tool_library.py`), the sandbox policy, secrets
  (`server_settings.SecretBox` on servers), tenants, runs and their records, and the `before_tool`/`after_tool`
  hooks of every agent node (`engine.py`).
- Agents name their tools in `AgentConfig.tools`; `AgentBuilder.build` resolves the names through `ToolLibrary.tool()`.
- The built-in Linux sandbox forbids `execve`, every socket and child processes, so it cannot host an MCP server.
  The desktop does not ship Node.js, which most local (stdio) MCP servers need.
- Agents' free `request_options` could switch on provider-hosted MCP connectors (finding F-1, fixed in
  nodestro-runtime #25 before any MCP feature).

## Options for the client's location

| | A: in Orkexa | B: in nodestro-runtime | C: separate component |
| --- | --- | --- | --- |
| Fits existing responsibilities | no: no persistence, tenants, secrets or network policy there | yes | partly: needs every runtime service through a new interface |
| Security boundary | weak: policy, approvals, egress and tokens would move into a library or come back through callbacks | strong: one place, ADR-0006 applies directly | strong only as its own process, which adds IPC, lifecycle and auth |
| Complexity | high (async transport and OAuth inside a sans-I/O core) | low to medium | high (new repository, pin cascade, release) |
| Duplication | second tool registry next to `ToolLibrary` | none | second store for configuration and secrets |

## Decision

1. **D-1 Location.** The MCP client is a package of nodestro-runtime (`nodestro_runtime/mcp`). Orkexa stays
   unchanged; MCP tools reach agents as ordinary `orkexa.Tool` subclasses built by `ToolLibrary.tool()`. No new
   repository. Tool names follow Orkexa's rule `[A-Za-z0-9_-]{1,128}`: `mcp__<server-slug>__<tool>` (other
   characters mapped, a hash suffix when longer), with the qualified id `mcp:<server>/<tool>` kept as metadata
   (agreed with the adaptive orchestration plan).
2. **D-2 MVP scope.** Only remote servers over Streamable HTTP; only tools an administrator approved one by one and
   classified as reading. Tool annotations (`readOnlyHint`, `destructiveHint`, ...) are hints, never a guarantee:
   a missing annotation means "changes data". Resources, prompts, sampling, roots, logging and elicitation are out
   of scope; sampling, roots, logging and the HTTP+SSE transport are deprecated by the specification and are not
   implemented.
3. **D-3 Token storage.** Tokens are stored encrypted; the encryption key lives in the operating system's keychain
   (desktop) or in the server's secret key (`SecretBox`, server). Without a secure keychain, tokens are never stored
   persistently: only token-free connections (or a token entered for the current session only) are offered. There
   is no plain-text exception, also not for static tokens.
4. **D-4 Token scope.** In the MVP a token belongs to a tenant (like provider keys). Per-user OAuth identities are a
   later extension.
5. **D-5 Local servers.** Local stdio servers are supported later and only in isolated containers (server; desktop
   with Docker). No own kernel launcher is built for now.
6. **D-6 ADR-0006 unchanged.** A local MCP server is third-party code of class `untrusted`. No weakening of the
   sandbox, no host execution when isolation is missing, no switch that marks a server as trusted.
7. **D-7 Unattended use.** Read-only, approved MCP tools may run in schedules once the MVP security acceptance has
   passed. Published APIs get MCP support only with WP-9 (frozen tool definitions in release bundles).
8. **D-8 Nodestro as an MCP server** for published workflows (WP-11) is approved for implementation, switched off by
   default; an administrator must enable it deliberately.
9. **Protocol versions.** The client uses the official Python SDK (`mcp` 2.x) and its automatic negotiation
   (`Client(mode="auto")`: `server/discover` probe at 2026-07-28, fallback to the `initialize` handshake). Own
   dual-era code is written only if the SDK version in use is shown to lack something needed (validated in WP-0:
   it negotiates 2026-07-28 with a modern server and 2025-11-25 with a handshake-era server).
10. **All MVP security is part of phase 1.** SSRF protection, the egress allow-list, tenant isolation, secret
    management, timeouts, tool pinning and the audit trail are effective and tested before the MVP is released;
    no later package holds an MVP prerequisite.

## Consequences

- The runtime gains a dependency on `mcp` (MIT); in the platform environment it adds 8 packages (`jsonschema`,
  `sse-starlette`, `mcp-types`, ...). The desktop bundle and license inventory must be updated in WP-1.
- The SDK's default HTTP client follows redirects only within the endpoint's origin, but it does not check resolved
  addresses: WP-1 passes its own HTTP client whose connection step resolves the name, checks each address and connects
  only to a checked address (no gap between resolution and connect; IPv4 and IPv6; TLS still verifies the host name;
  environment proxies ignored), with Nodestro's own timeouts (SDK default read timeout: 300 s). Details: threat model,
  T7 in detail.
- `ToolInfo.kind` gains the value `mcp` (additive API change; SDK clients with a fixed enumeration must accept it).
- Per-call approval (needed for tools that change data) is one mechanism for all tool kinds, shared with the
  Evolution plan's S-1/S-2 and the orchestration plan's grants, enforced in the runtime's `before_tool`.
- Per-call approval is enforced only where a person is asked: the process-wide switch never opens a tool that changes
  data by itself; the caller must state that it asks (`gated`), and only the run engine does (independent review
  H-1, 2026-11-01). Agent tests and the tool panel follow the same tool rules and never ask. Destructive MCP calls
  are decided by an administrator (M-3); an approval also covers the tool's classification, so a reclassification while
  a call waits makes it stale and a call asked as or now classified destructive needs an administrator (R-1). Server addresses never carry credentials (M-1), every MCP answer is size
  limited before it is read (M-2).
- Work packages WP-1 to WP-11 were approved on 2026-10-31 as one implementation assignment; release, production
  deployment and activation outside development configurations are not part of it.

## Revision history

- 2026-10-31: draft (WP-0).
- 2026-10-31: accepted; threat model T2 and T7 made precise.
- 2026-11-01: consequences of the independent security review (H-1, M-1 to M-3); the first pilot is limited to an
  isolated server test instance, MCP on the desktop is not released (M-4). See the threat model's review section.
- 2026-11-01: consequences of the independent re-review (R-1 classification bound to approvals, R-2 reserved tool
  name `memory`).

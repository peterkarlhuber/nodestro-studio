# P-Web: web search, page fetch and egress guard

Part of the [NAL review packages](README.md). Not commissioned.

## Scope

- **orkexa** (`7ee9977`):
  - `src/orkexa/net/guard.py`: `EgressPolicy`, `GuardedBackend`, `address_problem`, `host_problem`,
    `url_secret_problem`, `redact_url` (address classes, DNS pinning, redirects, IPv4 embedded in IPv6).
  - `src/orkexa/web/search.py`, `providers.py` (Brave, Mojeek, SearXNG, Tavily, optional DDGS, `test`).
  - `src/orkexa/web/fetch.py` and `_html_worker.py` (page fetch, HTML extraction in an isolated worker process).
  - Design: `docs/architecture/decisions/0017-web-and-egress.md`.
- **nodestro-runtime** (`f5f602c`):
  - `src/nodestro_runtime/web_tools.py` (`search_web`, `fetch_web_page`, call limits per run, offline lock,
    server profile switch), `src/nodestro_runtime/source_ledger.py` (sources of a run).
  - `src/nodestro_runtime/mcp/netguard.py`: the MCP network guard, moved onto `orkexa.net.guard` (parity with the
    previous guard is tested; it must not become weaker).
  - Docs: `docs/web-tools.md`.
- **nodestro-api** (`790271b`): web tools in exports and portable packages (provider choice at setup, connection
  proof).

## Review goals

1. **SSRF:** private, loopback, link-local, metadata and reserved addresses in every notation (decimal, octal,
   IPv6-mapped, NAT64, trailing dot); DNS rebinding between check and connect (pinning); redirects to such targets;
   proxies.
2. **Search providers:** result URLs are checked before a fetch; a self-hosted SearXNG cannot reach private
   addresses in the server profile; provider keys never reach logs, results or the model.
3. **Untrusted content:** pages and results are marked as untrusted for the model, cut to limits, and cannot trigger
   write tools without approval. Prompt injection through fetched pages against the run's tool approvals.
4. **Parser isolation:** the HTML worker's limits (time, memory, size, recursion) and what a hostile page can do in
   it.
5. **Limits and cost:** calls per run, time limits, cost in the run budget; offline mode and the server profile keep
   the tools off.
6. **MCP:** the guard used by MCP connections is not weaker than before (existing MCP behavior unchanged).
7. **Data leaving the computer:** the provider badge, the offline lock and the connection list tell the user what is
   sent where.

## Tests to start from

- orkexa: `tests/net/test_ssrf_catalog.py`, `tests/net/test_http_guard.py`, `tests/web/test_fetch.py`,
  `tests/web/test_search.py`, `tests/web/test_providers.py`.
- nodestro-runtime: `tests/test_web_tools.py`, `tests/test_mcp_netguard.py`.

## Internal review so far

The internal review of A2 found H1 (HTML worker not isolated), H2 (SearXNG could reach private addresses in the
server), M1 (result URLs not checked) and L1 to L5; all are fixed. No independent review yet (RT-077).

## Decision this review informs

Whether `NODESTRO_WEB_TOOLS_SERVER` may be enabled in the server profile, and which providers are acceptable there.
DDGS stays outside the server profile (decision E-3).

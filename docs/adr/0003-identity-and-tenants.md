# ADR-0003: Identity, roles and tenant isolation

- Status: Proposed (M0, 2026-10-31)
- Repositories: nodestro-api (enforcement), nodestro-runtime (tenant-scoped services), nodestro-studio (login UI),
  nodestro-server (identity provider configuration)

## Context

The studio API has about 187 routes and no authentication; `local_access` protects a loopback-bound process against
browser attacks but not against anyone who reaches the port. Published API keys (`ndk_...`) authenticate machines
for single publications. No document has an owner. The browser uses `EventSource` for three streams, which cannot
send custom headers.

## Decision

1. **A request principal everywhere.** `nodestro_api.identity.Principal(user_id, tenant_id, roles)` is resolved by
   one FastAPI dependency for every `/api` route (published routes keep their key identity). Services receive the
   principal's tenant through a tenant-scoped view of the workspace; a query without a tenant is impossible to write
   against the PostgreSQL store.
2. **Deny by default.** Each route declares a permission (`read`, `edit`, `run`, `admin`, ...). A test enumerates
   `app.routes` and fails if any `/api` route has none, so a new endpoint cannot ship unprotected. This registry is
   introduced in M1 (PR-2) while the desktop still grants everything to the local principal.
3. **Desktop:** the implicit principal `local` (tenant `local`, role `owner`), exactly today's behavior, valid only
   while `LocalAccessMiddleware` is active. The desktop shell adds a per-launch secret delivered as an HttpOnly cookie
   so other local OS users and web pages cannot use the loopback port (ADR-0005); the plain `nodestro` command keeps
   working as today.
4. **Server:** OpenID Connect (authorization code flow with PKCE) against an operator-provided identity provider is
   the primary login. Sessions are server-side (PostgreSQL), referenced by an `HttpOnly; Secure; SameSite=Lax`
   cookie, which also authenticates `EventSource` streams. Changing requests additionally keep the existing `Origin`
   check (CSRF). There is **no default administrator and no default password**; the first administrator is bound by a
   one-time bootstrap token printed by an operator command. Local password accounts are out of scope until requested.
5. **Roles per tenant:** `owner`, `admin`, `editor`, `operator` (run and decide approvals), `viewer`. Installation-wide
   actions (diagnostics, sandbox, network) belong to an operator role outside tenants, configured through the
   deployment, not the UI.
6. **Secrets:** in the server profile, provider keys are stored per tenant and encrypted at rest with a key from the
   deployment's secret source (envelope encryption); they are never returned, logged or exported. The desktop keeps
   its current storage.
7. **Published API keys** stay machine credentials, become tenant-bound, and keep their scopes and limits.
8. **Required tests** (M3 definition of done): unauthenticated studio requests get `401`; cross-tenant access to every
   resource class in [inventory 3.1](../desktop-server/inventory.md#31-studio-api-api-no-authentication) (including
   streams, file content, uploads, run files and exports) gets `404` (no existence leak); role checks per permission;
   the desktop suites unchanged.

## Options considered

- **Reverse proxy with basic auth in front of the desktop API**: rejected by requirement (no exposure without checked
  authentication; no ownership model).
- **Bearer tokens in the browser**: rejected; `EventSource` cannot send them and tokens in JavaScript widen XSS impact.
- **Built-in user database first**: deferred; OIDC avoids password storage and fits operator infrastructure.

## Consequences

- PR-2 (route permissions) is the first step and changes no behavior.
- Uploaded file content served inline must get `Content-Security-Policy: sandbox` and `X-Content-Type-Options:
  nosniff` before any multi-user exposure (open finding from the 2026-10-30 studio round).
- The studio frontend needs a login redirect and a 401 handler, nothing else: cookies flow automatically on the same
  origin.

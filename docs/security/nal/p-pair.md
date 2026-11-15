# P-Pair: pairing (C4) and the standard interface on another origin (C5)

Part of the [NAL review packages](README.md). Not commissioned. After the owner's decision on C5 (2026-11-15), one
review covers C4 and C5 together before any productive activation. `NODESTRO_PAIRING` and `NODESTRO_CROSS_ORIGIN`
stay off until then. Where possible it is bundled with API-054 (portable export, nodestro-api).

## Scope

- **Pairing (C4), nodestro-api** (`790271b`, pairing merged in #149):
  - `docs/pairing.md` (protocol, threats and measures, residual risks).
  - `src/nodestro_api/pairing.py` (codes, devices, rotation with reuse detection).
  - `src/nodestro_api/tls_selfsigned.py` (self-issued certificate, fingerprint).
  - `src/nodestro_api/webui_server.py`: `_pairing_routes`, `session_of`, `bootstrap`, `_secure`.
  - `src/nodestro_api/portable.py`: `pair_command`, `devices_command`, `_tls`, `_local`, `_control`.
  - `src/nodestro_api/portable_ops.py`: `restore`, `restrict_folder`; `src/nodestro_api/standalone.py`: `tls_info`.
- **The interface on another origin (C5), nodestro-api** (#150):
  - `docs/cross-origin.md` (protocol and threat model, written before the code).
  - `src/nodestro_api/cross_origin.py` (allowed origins, access tokens, `CorsMiddleware`).
  - `src/nodestro_api/webui_server.py`: `_token_routes`, the Content Security Policy.
  - `src/nodestro_api/serving.py`: `authenticate` (`nat_` tokens); `standalone.py`: `access_identity`.
  - `src/nodestro_api/portable.py`: `origins_command`, `pair --ui`.
- **nodestro-app-ui** (`cf264b4`, embedded in nodestro-api): the pairing part of `src/app.js`; `src/standalone.js`,
  the standalone mode in `src/app.js`, `scripts/build-standalone.mjs` (meta CSP with Trusted Types).
- **Running object:** a portable package for Linux x86_64 and one for Windows x86_64 with
  `server.tls_self_signed = true`, `NODESTRO_PAIRING=on` and `NODESTRO_CROSS_ORIGIN=on`, and the standalone interface
  on a static host with its own domain; only in the review environment.

## Review goals

1. **Escalation:** a device session reaches neither operator rights nor `/ui/api/setup/*` nor `/ui/control/*`; its
   scopes are fixed by the code.
2. **Codes:** guessing, brute force over many addresses (IPv6), races on redemption, timing of the comparison, where
   a code may end up (logs, history, referrer).
3. **Device secret:** rotation, reuse detection, concurrent renewals, immediate revocation of running sessions,
   expiry, restore.
4. **Transport:** pairing without TLS only from loopback; forged forwarding headers (`behind_proxy`); certificate
   creation and renewal; file permissions of the key and `devices.json` on POSIX and Windows (ACL).
5. **Browser:** cookie flags, CSRF (same-origin header, `Origin`), DNS rebinding (host check), XSS through device
   names and fingerprints, the fingerprint comparison in a pairing link.
6. **Man in the middle with a self-issued certificate:** whether the "restricted trust" mark and the comparison
   guide are understandable and sufficient, including a usability check with people without expert knowledge.
7. **Launcher:** the control channel (loopback only, token), HTTPS to its own instance without certificate check,
   `origins add|remove`.
8. **CORS (C5):** only explicitly allowed origins, exact comparison (case, default ports, trailing dot, IDN, `null`),
   no CORS answer on `/ui/*`, credentials only on the token paths, preflight.
9. **Token profile (C5):** access token (15 minutes, memory only, bound to device and origin), refresh cookie
   (`SameSite=None; Partitioned`, rotation with reuse detection, one name per backend), revocation through the
   interface, `devices revoke` and `origins remove`, behavior after a restart, CSRF on the token endpoints, no API
   keys and no session cookies from another origin.
10. **Standalone interface (C5):** XSS and Trusted Types, the meta CSP and the headers the static host must set,
    storage (no secrets in `localStorage`), fingerprint comparison at first pairing, browsers that block
    partitioned third-party cookies.

## Tests to start from

- nodestro-api: `tests/test_pairing.py`, `tests/test_cross_origin.py`, `tests/test_portable.py`,
  `tests/test_webui_vendored.py`.
- nodestro-app-ui: `test/unit/standalone.test.mjs`, `test/e2e/pairing.test.mjs`, `test/e2e/standalone.test.mjs`
  (a real second origin, `https://localhost` against `https://127.0.0.1`, with a partitioned cookie).

## Internal reviews so far

- C4: 0 critical, 0 high; M1 and L1 to L5 fixed.
- C5: 0 critical, 0 high. Fixed: M1 (a pairing link could add and select a foreign backend silently; the full address
  must now be confirmed), L1 (removing a backend that was not connected left its device active), L2 (`origins
  remove` left devices active when the control channel failed), L3 (first visits without a cookie counted as
  failures), L4 (limits of the fingerprint comparison now named in the threat model), L5 (`pair --ui` checked before
  a code is made).

Accepted residual risks to assess: a successful XSS in the interface can use the token and the cookie while the page
is open; the fingerprint comparison does not protect against an active man in the middle (only the browser's
certificate dialog does); the static host is trusted with the interface's code; browsers that block partitioned
third-party cookies pair again after the page is closed; on C4, two portable packages on one computer share the cookie
names in a browser, so pairing the second one replaces the first one's device cookie (nothing is revoked; the first
one asks for a new code).

## Decision this review informs

Whether `NODESTRO_PAIRING` and `NODESTRO_CROSS_ORIGIN` may be enabled for productive use, and under which conditions
(for example only with an own certificate).

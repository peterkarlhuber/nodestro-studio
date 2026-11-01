"""A loopback OAuth 2.1 authorization server and an MCP server that accepts only its tokens (browser test, WP-6).

Nothing outside this computer is contacted. The authorization server implements what the MCP authorization
specification needs: authorization server metadata (RFC 8414), dynamic client registration (RFC 7591), the
authorization code grant with PKCE S256, the ``resource`` indicator (RFC 8707) and the ``iss`` response parameter
(RFC 9207). Its ``/authorize`` page signs in at once (a browser test has nobody to type a password) and redirects
back to Nodestro's callback. Adapted from nodestro-runtime ``tests/mcp_oauth_support.py``.
"""

from __future__ import annotations

import base64
import hashlib
import json
import secrets
import threading
import time
from typing import Any
from urllib.parse import parse_qs, urlencode, urlsplit

import uvicorn


class AuthServer:
    def __init__(self, port: int) -> None:
        self.issuer = f"http://127.0.0.1:{port}"
        self.resource = ""
        self.clients: dict[str, dict[str, Any]] = {}
        self.codes: dict[str, dict[str, Any]] = {}
        self.access_tokens: set[str] = set()
        self.lock = threading.Lock()

    def metadata(self) -> dict[str, Any]:
        base = self.issuer
        return {
            "issuer": base,
            "authorization_endpoint": f"{base}/authorize",
            "token_endpoint": f"{base}/token",
            "registration_endpoint": f"{base}/register",
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code", "refresh_token"],
            "token_endpoint_auth_methods_supported": ["none"],
            "authorization_response_iss_parameter_supported": True,
            "code_challenge_methods_supported": ["S256"],
            "scopes_supported": ["docs.read"],
        }

    def authorize(self, query: dict[str, str]) -> str | None:
        """The redirect back to the client with a code, or ``None`` for a request this server does not accept."""
        client = self.clients.get(query.get("client_id", ""))
        if client is None or query.get("redirect_uri") not in client["redirect_uris"]:
            return None
        if query.get("response_type") != "code" or query.get("code_challenge_method") != "S256":
            return None
        code = secrets.token_urlsafe(16)
        with self.lock:
            self.codes[code] = {
                "client_id": query["client_id"],
                "redirect_uri": query["redirect_uri"],
                "challenge": query["code_challenge"],
                "scope": query.get("scope"),
            }
        params = urlencode({"code": code, "state": query.get("state", ""), "iss": self.issuer})
        return f"{query['redirect_uri']}?{params}"

    def token(self, form: dict[str, str]) -> tuple[int, dict[str, Any]]:
        if form.get("grant_type") != "authorization_code":
            return 400, {"error": "unsupported_grant_type"}
        with self.lock:
            entry = self.codes.pop(form.get("code", ""), None)
        if entry is None:
            return 400, {"error": "invalid_grant"}
        verifier = form.get("code_verifier", "")
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        if challenge != entry["challenge"] or form.get("redirect_uri") != entry["redirect_uri"]:
            return 400, {"error": "invalid_grant"}
        if form.get("resource") != self.resource:
            return 400, {"error": "invalid_target"}
        access = secrets.token_urlsafe(24)
        with self.lock:
            self.access_tokens.add(access)
        answer: dict[str, Any] = {"access_token": access, "token_type": "Bearer", "expires_in": 3600}
        if entry["scope"]:
            answer["scope"] = entry["scope"]
        return 200, answer


async def _json(send: Any, status: int, body: Any, headers: list[tuple[bytes, bytes]] | None = None) -> None:
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": [(b"content-type", b"application/json"), *(headers or [])],
        }
    )
    await send({"type": "http.response.body", "body": json.dumps(body).encode()})


async def _body(receive: Any) -> bytes:
    chunks = b""
    while True:
        message = await receive()
        chunks += message.get("body", b"")
        if not message.get("more_body"):
            return chunks


async def _lifespan(receive: Any, send: Any) -> None:
    while True:
        message = await receive()
        if message["type"] == "lifespan.startup":
            await send({"type": "lifespan.startup.complete"})
        elif message["type"] == "lifespan.shutdown":
            await send({"type": "lifespan.shutdown.complete"})
            return


def _run(app: Any, port: int) -> None:
    runner = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error", lifespan="on"))
    threading.Thread(target=runner.run, daemon=True).start()
    deadline = time.monotonic() + 10
    while not runner.started:
        if time.monotonic() > deadline:
            raise RuntimeError("test server did not start")
        time.sleep(0.02)


def serve(auth_port: int, mcp_port: int) -> str:
    """Start both servers; returns the MCP server's URL."""
    from mcp.server.mcpserver import MCPServer
    from mcp_types import ToolAnnotations

    auth = AuthServer(auth_port)

    async def auth_app(scope: Any, receive: Any, send: Any) -> None:
        if scope["type"] == "lifespan":
            await _lifespan(receive, send)
            return
        path, method = scope["path"], scope["method"]
        body = await _body(receive)
        if path == "/.well-known/oauth-authorization-server" and method == "GET":
            await _json(send, 200, auth.metadata())
        elif path == "/register" and method == "POST":
            data = json.loads(body or b"{}")
            client_id = f"client-{secrets.token_hex(4)}"
            record = {**data, "client_id": client_id, "client_id_issued_at": int(time.time())}
            auth.clients[client_id] = record
            await _json(send, 201, record)
        elif path == "/authorize" and method == "GET":
            query = {key: values[0] for key, values in parse_qs(scope["query_string"].decode()).items()}
            target = auth.authorize(query)
            if target is None:
                await _json(send, 400, {"error": "invalid_request"})
            else:
                await send({"type": "http.response.start", "status": 302, "headers": [(b"location", target.encode())]})
                await send({"type": "http.response.body", "body": b""})
        elif path == "/token" and method == "POST":
            form = {key: values[0] for key, values in parse_qs(body.decode()).items()}
            status, answer = auth.token(form)
            await _json(send, status, answer)
        else:
            await _json(send, 404, {"error": "not_found"})

    server = MCPServer("nodestro-e2e-wiki")

    @server.tool(annotations=ToolAnnotations(readOnlyHint=True))
    def lookup(term: str) -> str:
        """Look up a term in the team wiki."""
        return f"wiki entry for {term}"

    mcp_app = server.streamable_http_app()
    url = f"http://127.0.0.1:{mcp_port}/mcp"
    auth.resource = url
    metadata_url = f"http://127.0.0.1:{mcp_port}/.well-known/oauth-protected-resource/mcp"

    async def protected(scope: Any, receive: Any, send: Any) -> None:
        if scope["type"] == "http":
            path = scope["path"]
            headers = {key.decode().lower(): value.decode() for key, value in scope["headers"]}
            if path == "/.well-known/oauth-protected-resource/mcp":
                document = {"resource": url, "authorization_servers": [auth.issuer], "scopes_supported": ["docs.read"]}
                await _json(send, 200, document)
                return
            if path.startswith("/.well-known/"):
                await _json(send, 404, {"error": "not_found"})
                return
            presented = headers.get("authorization", "")
            if presented[7:] not in auth.access_tokens or not presented.startswith("Bearer "):
                challenge = f'Bearer resource_metadata="{metadata_url}", scope="docs.read"'
                await _json(send, 401, {"error": "invalid_token"}, [(b"www-authenticate", challenge.encode())])
                return
        await mcp_app(scope, receive, send)

    _run(auth_app, auth_port)
    _run(protected, mcp_port)
    assert urlsplit(url).hostname == "127.0.0.1"
    return url

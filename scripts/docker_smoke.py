"""Run AI-generated tool code in a real Docker-compatible engine through the installed studio, and check the result.

Used by the ``Docker`` workflow (``.github/workflows/docker.yml``) on runners with a real engine (Docker on
``ubuntu-latest``, Colima on ``macos-15-intel``): ``python scripts/docker_smoke.py``. Nothing in the execution chain is
replaced: the studio starts as a desktop user starts it (``python -m nodestro_studio --no-browser``, ``auto`` sandbox
mode), the runtime finds the engine itself, runs its preflight and the in-container self-test, and Orkexa's
``DockerSandbox`` runs the tool code. Only the AI model is a stand-in: a local OpenAI-compatible endpoint (stdlib
HTTP server) configured as the ``compatible`` provider through ``PUT /api/settings``, which answers with fixed code.
The tools it writes come in through the product's own route for AI-generated tools (``POST /api/tools/jobs``, the
Coding Agent's job, then the person's ``decision``), so the runtime classes them ``untrusted`` by itself; this script
never sets a trust class.

Checks (each prints ``PASS`` or ``FAIL``; the exit code is 1 if any failed):

1. the engine answers (``docker version``/``docker info``);
2. ``GET /api/sandbox/status`` reaches ``approved`` (bounded wait, the first image build included) with every check
   passed, the self-test among them; the settings choose ``docker`` for untrusted code;
3. a generated tool is created (its tests run in a container), is ``untrusted``, and runs in a container
   (``orkexa-sandbox-*``, seen in ``docker events``) that is gone afterwards; while a call runs, ``docker inspect``
   shows the isolation flags (no network, read-only root, all capabilities dropped, no bind mounts, non-root user);
4. a call that runs past the sandbox's timeout ends as an error and leaves no container behind;
5. a workflow run whose agent calls the tool is cancelled while the container runs: the container is removed before
   the timeout would have removed it, and the run ends ``cancelled``;
6. with the engine unreachable (a second start with ``DOCKER_HOST`` at a closed port), the status is ``unavailable``
   with a ``docker-*`` reason and the untrusted tool and new tool jobs are refused with ``sandbox.isolation_required``;
   no container starts;
7. optionally (``--stop-engine CMD``, or ``--stop-engine-prompt`` for a person who quits Docker Desktop by hand), the
   same after really stopping the engine (``sudo systemctl stop docker``, ``colima stop``, ``docker desktop stop``);
   ``--start-engine CMD`` starts it again afterwards;
8. the diagnosis (``GET /api/diagnostics``) and the sandbox status give the reason the interface shows (its English
   sentence from ``frontend/src/i18n/locales/en`` is printed when the checkout has it).

The Docker CLI the studio uses must be on ``PATH``; the script reads ``docker events`` and ``docker ps`` with the same
CLI and environment (``NODESTRO_DOCKER`` only changes the CLI this script uses). Only this run's containers are looked
at: those labelled with the installation's own owner (``org.orkexa.sandbox=nodestro-<id>``, from the data directory),
so the containers of another Nodestro on the same engine are neither counted nor touched.

Every check belongs to one of ten steps (:data:`STEPS`); ``--results FILE`` writes the checks with their step and the
facts the run saw as JSON, which ``scripts/docker_test.py`` (the one-command test for Docker Desktop) turns into a
plain-language summary and a diagnostic report.
"""

from __future__ import annotations

import argparse
from collections.abc import Callable, Iterator
import contextlib
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import platform
import shlex
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from typing import Any
import urllib.error
import urllib.request

OWNER_LABEL = "org.orkexa.sandbox"
CONTAINER_PREFIX = "orkexa-sandbox-"
MODEL = "compatible:docker-smoke"
#: The sandbox's per-call timeout for tool code without libraries (nodestro_runtime.workspace._runtime_sandbox).
CALL_TIMEOUT = 15.0
#: An address nothing listens on: the docker CLI fails at once, as with a stopped engine.
UNREACHABLE = "tcp://127.0.0.1:9"

ADD_CODE = '''\
def add_numbers(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: The first number.
        b: The second number.

    Returns:
        The sum of both numbers.
    """
    return a + b
'''
ADD_TESTS = """\
from tool import add_numbers


def test_adds():
    assert add_numbers(2, 3) == 5


def test_negative():
    assert add_numbers(-2, 2) == 0
"""
SPIN_CODE = '''\
def spin_rounds(rounds: int) -> int:
    """Count through a number of rounds; large values take a long time.

    Args:
        rounds: How many rounds to count.

    Returns:
        The number of rounds counted.
    """
    total = 0
    for _ in range(rounds):
        total += 1
    return total
'''
SPIN_TESTS = """\
from tool import spin_rounds


def test_counts():
    assert spin_rounds(10) == 10
"""
#: What the stand-in model answers per requirement marker (a ToolProposal of Orkexa's Coding Agent).
PROPOSALS = {
    "SMOKE-ADD": {
        "function_name": "add_numbers",
        "description": "Add two integers.",
        "code": ADD_CODE,
        "tests": ADD_TESTS,
    },
    "SMOKE-SPIN": {
        "function_name": "spin_rounds",
        "description": "Count through a number of rounds.",
        "code": SPIN_CODE,
        "tests": SPIN_TESTS,
    },
}
#: Rounds that take far longer than the call timeout.
ENDLESS = 10**13


# ---- results ----------------------------------------------------------------------------------------------------


#: The steps of the full flow; every check belongs to one (``Report.step``).
STEPS: dict[int, str] = {
    1: "detection",
    2: "preflight",
    3: "image",
    4: "self-test",
    5: "AI-generated code in the Docker sandbox",
    6: "isolation and resource limits",
    7: "timeout and cancel",
    8: "container cleanup",
    9: "missing or stopped Docker",
    10: "status and messages in Nodestro",
}


class Report:
    def __init__(self) -> None:
        self.failed: list[str] = []
        self.passed = 0
        #: The step the next checks belong to (:data:`STEPS`).
        self.step = 1
        self.checks: list[dict[str, Any]] = []
        #: What the run saw (engine, status rows, owner, ...), for ``--results``.
        self.facts: dict[str, Any] = {}

    def check(self, name: str, ok: bool, detail: Any = "", *, step: int | None = None) -> bool:
        text = detail if isinstance(detail, str) else json.dumps(detail, default=str)
        print(f"{'PASS' if ok else 'FAIL'}: {name}" + (f" | {text}" if text else ""), flush=True)
        self.checks.append({"step": step or self.step, "name": name, "ok": bool(ok), "detail": text[:2000]})
        if ok:
            self.passed += 1
        else:
            self.failed.append(name)
        return ok

    def write(self, path: Path | None) -> None:
        if path is None:
            return
        data = {"checks": self.checks, "facts": self.facts, "passed": self.passed, "failed": self.failed}
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def note(text: str) -> None:
    print(f"  .. {text}", flush=True)


# ---- the stand-in model -----------------------------------------------------------------------------------------


def _texts(messages: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for message in messages:
        content = message.get("content")
        if isinstance(content, str):
            parts.append(content)
        elif isinstance(content, list):
            parts.extend(str(part.get("text", "")) for part in content if isinstance(part, dict))
    return "\n".join(parts)


def model_answer(body: dict[str, Any]) -> dict[str, Any]:
    """The assistant message for one Chat Completions request: a ToolProposal for the Coding Agent, a call of the slow
    tool for a workflow agent (then a final text after the tool's result), otherwise a short text."""
    messages = body.get("messages") or []
    tools = body.get("tools") or []
    if tools:
        if messages and messages[-1].get("role") == "tool":
            return {"role": "assistant", "content": "done"}
        names = [str((tool.get("function") or {}).get("name", "")) for tool in tools]
        name = next((n for n in names if "spin_rounds" in n), names[0])
        call = {
            "id": f"call_{int(time.time() * 1000)}",
            "type": "function",
            "function": {"name": name, "arguments": json.dumps({"rounds": ENDLESS})},
        }
        return {"role": "assistant", "content": None, "tool_calls": [call]}
    text = _texts(messages)
    for marker, proposal in PROPOSALS.items():
        if marker in text:
            return {"role": "assistant", "content": json.dumps(proposal)}
    return {"role": "assistant", "content": "ok"}


class _ModelHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:  # quiet
        pass

    def do_GET(self) -> None:
        if self.path.rstrip("/").endswith("/models"):
            self._json({"object": "list", "data": [{"id": MODEL.split(":", 1)[1], "object": "model"}]})
        else:
            self._json({"error": {"message": "not found"}}, 404)

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json({"error": {"message": "invalid JSON"}}, 400)
            return
        if not self.path.rstrip("/").endswith("/chat/completions"):
            self._json({"error": {"message": f"unsupported path {self.path}"}}, 404)
            return
        message = model_answer(body)
        finish = "tool_calls" if message.get("tool_calls") else "stop"
        created = int(time.time())
        usage = {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20}
        if body.get("stream"):
            self._stream(message, finish, created, usage, str(body.get("model", "")))
            return
        self._json(
            {
                "id": f"chatcmpl-{created}",
                "object": "chat.completion",
                "created": created,
                "model": body.get("model", ""),
                "choices": [{"index": 0, "message": message, "finish_reason": finish}],
                "usage": usage,
            }
        )

    def _stream(self, message: dict[str, Any], finish: str, created: int, usage: dict[str, int], model: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        delta: dict[str, Any] = {"role": "assistant"}
        if message.get("content"):
            delta["content"] = message["content"]
        if message.get("tool_calls"):
            delta["tool_calls"] = [{"index": i, **call} for i, call in enumerate(message["tool_calls"])]
        base = {"id": f"chatcmpl-{created}", "object": "chat.completion.chunk", "created": created, "model": model}
        chunks = [
            {**base, "choices": [{"index": 0, "delta": delta, "finish_reason": None}]},
            {**base, "choices": [{"index": 0, "delta": {}, "finish_reason": finish}]},
            {**base, "choices": [], "usage": usage},
        ]
        for chunk in chunks:
            self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())
        self.wfile.write(b"data: [DONE]\n\n")

    def _json(self, value: Any, status: int = 200) -> None:
        data = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


@contextlib.contextmanager
def stand_in_model() -> Iterator[str]:
    """A local OpenAI-compatible endpoint; yields its base URL."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), _ModelHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}/v1"
    finally:
        server.shutdown()


# ---- the studio -------------------------------------------------------------------------------------------------


def free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


class Api:
    def __init__(self, base: str) -> None:
        self.base = base

    def call(self, method: str, path: str, body: Any = None, timeout: float = 60) -> tuple[int, Any]:
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(f"{self.base}{path}", data=data, method=method)
        if data is not None:
            request.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                status, raw = int(response.status), response.read()
        except urllib.error.HTTPError as error:
            status, raw = int(error.code), error.read()
        try:
            return status, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return status, raw.decode("utf-8", "replace")

    def get(self, path: str, timeout: float = 60) -> Any:
        status, value = self.call("GET", path, timeout=timeout)
        if status != 200:
            raise RuntimeError(f"GET {path}: {status} {value}")
        return value


@contextlib.contextmanager
def studio(data_dir: Path, log: Path, env: dict[str, str]) -> Iterator[Api]:
    """Start the installed studio as a desktop user does and stop it afterwards."""
    port = free_port()
    with log.open("ab") as output:
        output.write(f"\n===== start {time.strftime('%H:%M:%S')} =====\n".encode())
        output.flush()
        server = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "nodestro_studio",
                "--no-browser",
                "--host",
                "127.0.0.1",
                "--port",
                str(port),
                "--data-dir",
                str(data_dir),
            ],
            stdout=output,
            stderr=subprocess.STDOUT,
            env=env,
        )
        api = Api(f"http://127.0.0.1:{port}")
        try:
            deadline = time.monotonic() + 180
            while True:
                if server.poll() is not None:
                    raise SystemExit(
                        f"the studio exited with {server.returncode}:\n{log.read_text('utf-8', 'replace')}"
                    )
                with contextlib.suppress(OSError, RuntimeError):
                    api.get("/api/health", timeout=5)
                    break
                if time.monotonic() > deadline:
                    raise SystemExit(f"no answer on {api.base}/api/health:\n{log.read_text('utf-8', 'replace')}")
                time.sleep(1)
            yield api
        finally:
            server.terminate()
            try:
                server.wait(30)
            except subprocess.TimeoutExpired:
                server.kill()


def configure_model(api: Api, base_url: str) -> None:
    status, body = api.call(
        "PUT",
        "/api/settings",
        {
            "providers": {
                "compatible": {
                    "base_url": base_url,
                    "capabilities": {
                        "tools": "supported",
                        "structured_output": "supported",
                        "system_messages": "supported",
                        "streaming": "supported",
                        "reasoning": "unsupported",
                    },
                }
            },
            "default_model": MODEL,
            "assistant_model": MODEL,
        },
    )
    if status != 200:
        raise SystemExit(f"PUT /api/settings: {status} {body}")


def wait_status(api: Api, limit: float, *, settled: Callable[[dict[str, Any]], bool]) -> dict[str, Any]:
    """Poll ``GET /api/sandbox/status`` (``wait=5``) until ``settled`` or ``limit`` seconds passed."""
    deadline = time.monotonic() + limit
    last_state = ""
    while True:
        row = api.get("/api/sandbox/status?wait=5", timeout=30)
        if row.get("state") != last_state:
            last_state = str(row.get("state"))
            names = [f"{check['name']}={'ok' if check['ok'] else 'failed'}" for check in row.get("checks", [])]
            note(f"sandbox status: {last_state} {row.get('reason', '')} {' '.join(names)}")
        if settled(row) or time.monotonic() > deadline:
            return dict(row)
        time.sleep(2)


# ---- the engine -------------------------------------------------------------------------------------------------


def installation_owner(data_dir: Path) -> str:
    """The owner label of the studio's sandbox containers with this data directory (``nodestro-<12 hex digits>``),
    as nodestro_runtime.docker_status.installation_owner computes it from the data directory and the installation id
    (``<data>/python/installation-id``, written at the studio's start). Empty when the id is not there yet."""
    try:
        installation = (data_dir / "python" / "installation-id").read_text(encoding="utf-8").strip()
    except OSError:
        return ""
    if not installation:
        return ""
    with contextlib.suppress(ImportError):
        from nodestro_runtime.docker_status import installation_owner as runtime_owner

        return str(runtime_owner(data_dir, installation))
    resolved = str(data_dir.expanduser().resolve())
    return "nodestro-" + hashlib.sha256(f"{resolved}\0{installation}".encode()).hexdigest()[:12]


def owner_filter(owner: str) -> str:
    """The ``--filter`` of this run's sandbox containers (any owner's while the owner is not known)."""
    return f"label={OWNER_LABEL}={owner}" if owner else f"label={OWNER_LABEL}"


class Engine:
    def __init__(self, docker: str, env: dict[str, str], owner: str = "") -> None:
        self.docker = docker
        self.env = env
        #: The installation's owner label value; only containers with it are counted (see :func:`owner_filter`).
        self.owner = owner

    def run(self, *args: str, timeout: float = 60) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [self.docker, *args], capture_output=True, text=True, timeout=timeout, env=self.env, check=False
        )

    def now(self) -> float:
        return time.time()

    def events(self, since: float, until: float) -> list[dict[str, Any]]:
        """The sandbox containers' events between two times (a margin for the engine's clock in a VM)."""
        found = self.run(
            "events",
            "--since",
            f"{since - 3:.3f}",
            "--until",
            f"{until + 3:.3f}",
            "--filter",
            "type=container",
            "--filter",
            owner_filter(self.owner),
            "--format",
            "{{json .}}",
            timeout=60,
        )
        events = []
        for line in found.stdout.splitlines():
            with contextlib.suppress(json.JSONDecodeError):
                events.append(json.loads(line))
        return events

    def containers(self, *, running: bool = False) -> list[dict[str, Any]]:
        args = ["ps", "--no-trunc", "--filter", owner_filter(self.owner), "--format", "{{json .}}"]
        if not running:
            args.insert(1, "-a")
        found = self.run(*args)
        rows = []
        for line in found.stdout.splitlines():
            with contextlib.suppress(json.JSONDecodeError):
                rows.append(json.loads(line))
        return rows

    def wait_running(self, limit: float) -> dict[str, Any] | None:
        deadline = time.monotonic() + limit
        while time.monotonic() < deadline:
            for row in self.containers(running=True):
                if str(row.get("Names", "")).startswith(CONTAINER_PREFIX):
                    return row
            time.sleep(0.25)
        return None

    def wait_gone(self, limit: float) -> list[dict[str, Any]]:
        """Wait until no sandbox container exists; returns the ones left after ``limit`` seconds."""
        deadline = time.monotonic() + limit
        while True:
            left = self.containers()
            if not left or time.monotonic() > deadline:
                return left
            time.sleep(0.5)

    def inspect(self, name: str) -> dict[str, Any] | None:
        found = self.run("inspect", name)
        try:
            rows = json.loads(found.stdout)
        except json.JSONDecodeError:
            return None
        return rows[0] if rows else None


def started_and_removed(events: list[dict[str, Any]]) -> tuple[list[str], list[str]]:
    """Names of sandbox containers that started in the events, and of those among them without a ``destroy``."""

    def name(event: dict[str, Any]) -> str:
        return str(((event.get("Actor") or {}).get("Attributes") or {}).get("name", ""))

    def action(event: dict[str, Any]) -> str:
        return str(event.get("Action") or event.get("status") or "")

    started = sorted({name(e) for e in events if action(e) == "start" and name(e).startswith(CONTAINER_PREFIX)})
    destroyed = {name(e) for e in events if action(e) == "destroy"}
    return started, [n for n in started if n not in destroyed]


def isolation_flags(found: dict[str, Any]) -> dict[str, Any]:
    host = found.get("HostConfig") or {}
    config = found.get("Config") or {}
    return {
        "network": host.get("NetworkMode"),
        "read_only_root": host.get("ReadonlyRootfs"),
        "cap_drop": host.get("CapDrop"),
        "security_opt": host.get("SecurityOpt"),
        "user": config.get("User"),
        "binds": host.get("Binds"),
        "mounts": [m.get("Type") for m in found.get("Mounts") or []],
        "memory": host.get("Memory"),
        "memory_swap": host.get("MemorySwap"),
        "nano_cpus": host.get("NanoCpus"),
        "pids_limit": host.get("PidsLimit"),
    }


def isolated(flags: dict[str, Any]) -> bool:
    return (
        flags["network"] == "none"
        and flags["read_only_root"] is True
        and "ALL" in [str(c).upper() for c in flags["cap_drop"] or []]
        and any("no-new-privileges" in str(o) for o in flags["security_opt"] or [])
        and str(flags["user"] or "root") not in ("", "root", "0", "0:0")
        and not flags["binds"]
        and "bind" not in flags["mounts"]
    )


def limited(flags: dict[str, Any]) -> bool:
    """Memory (without extra swap), CPU and process limits are set on the container (that the engine enforces them is
    the self-test's part: it reads the container's cgroup v2 files)."""
    memory = flags.get("memory") or 0
    return (
        memory > 0
        and flags.get("memory_swap") == memory
        and (flags.get("nano_cpus") or 0) > 0
        and (flags.get("pids_limit") or 0) > 0
    )


#: Where the interface's English texts live in a checkout (the sentences of the reasons and the diagnosis).
LOCALES = Path(__file__).resolve().parents[1] / "frontend" / "src" / "i18n" / "locales" / "en"


def _lookup(file: str, key: str) -> str:
    try:
        value: Any = json.loads((LOCALES / file).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return ""
    for part in key.split("."):
        value = value.get(part) if isinstance(value, dict) else None
    return value if isinstance(value, str) else ""


def reason_sentence(reason: str) -> str:
    """The sentence Settings -> Sandbox shows for a ``docker-*`` reason (empty when unknown or not in this checkout)."""
    if not reason.startswith("docker-"):
        return ""
    return _lookup("settings.json", f"sandbox.docker.reason.{reason[len('docker-') :]}")


def diagnosis_sentence(code: str) -> str:
    """The sentence the diagnosis page shows for its Docker check's ``code``."""
    return _lookup("diagnostics.json", f"checks.docker.{code}")


def docker_diagnosis(api: Api) -> dict[str, Any]:
    """The Docker check of ``GET /api/diagnostics`` (empty when the endpoint or the check is missing)."""
    status, body = api.call("GET", "/api/diagnostics", timeout=180)
    if status != 200 or not isinstance(body, dict):
        return {"http_status": status}
    return next((dict(c) for c in body.get("checks") or [] if isinstance(c, dict) and c.get("id") == "docker"), {})


def arch_matches(engine_arch: str, image_arch: str) -> bool:
    """``docker info`` says ``aarch64``/``x86_64``, images say ``arm64``/``amd64``."""
    aliases = {"aarch64": "arm64", "arm64": "arm64", "x86_64": "amd64", "amd64": "amd64"}
    return bool(image_arch) and aliases.get(engine_arch.lower(), engine_arch.lower()) == image_arch.lower()


# ---- the steps --------------------------------------------------------------------------------------------------


def generate_tool(api: Api, marker: str, name: str, limit: float = 300) -> tuple[dict[str, Any], dict[str, Any]]:
    """Create a tool through the Coding Agent's job and the person's approval, as the interface does. Returns the job
    and the stored tool (``GET /api/tools/{name}``)."""
    status, job = api.call("POST", "/api/tools/jobs", {"requirement": f"{marker}: write the tool {name}"})
    if status != 201:
        raise RuntimeError(f"POST /api/tools/jobs: {status} {job}")
    deadline = time.monotonic() + limit
    while job["status"] not in ("awaiting_approval", "approved", "rejected", "failed"):
        if time.monotonic() > deadline:
            raise RuntimeError(f"the tool job did not finish: {job}")
        time.sleep(0.5)
        job = api.get(f"/api/tools/jobs/{job['id']}")
    if job["status"] != "awaiting_approval":
        raise RuntimeError(f"the tool job ended {job['status']}: {job.get('error')} {job.get('message')}")
    status, decided = api.call("POST", f"/api/tools/jobs/{job['id']}/decision", {"approved": True})
    if status != 200:
        raise RuntimeError(f"decision: {status} {decided}")
    while job["status"] not in ("approved", "rejected", "failed"):
        if time.monotonic() > deadline:
            raise RuntimeError(f"the approved job did not finish: {job}")
        time.sleep(0.5)
        job = api.get(f"/api/tools/jobs/{job['id']}")
    if job["status"] != "approved":
        raise RuntimeError(f"the tool job ended {job['status']}: {job.get('error')} {job.get('message')}")
    return job, api.get(f"/api/tools/{name}")


def run_tool(api: Api, name: str, payload: dict[str, Any], timeout: float = 120) -> tuple[int, Any]:
    return api.call("POST", f"/api/tools/{name}/run", {"input": payload}, timeout=timeout)


def workflow_with(api: Api, tool: str) -> str:
    body = {
        "name": "Docker smoke: cancel",
        "nodes": [
            {"id": "start", "type": "start"},
            {
                "id": "a",
                "type": "agent",
                "agent": {
                    "name": "Spinner",
                    "model": MODEL,
                    "system_prompt": "Call the tool.",
                    "tools": [tool],
                    "effort": None,
                },
            },
            {"id": "out", "type": "output"},
        ],
        "edges": [{"id": "e1", "source": "start", "target": "a"}, {"id": "e2", "source": "a", "target": "out"}],
    }
    status, workflow = api.call("POST", "/api/workflows", body)
    if status != 201:
        raise RuntimeError(f"POST /api/workflows: {status} {workflow}")
    return str(workflow["id"])


#: The status checks (``GET /api/sandbox/status``) and the step each one belongs to.
STATUS_STEPS = {"cli": 1, "daemon": 1, "preflight": 2, "image": 3, "self-test": 4}


def status_facts(row: dict[str, Any]) -> dict[str, Any]:
    return {k: row.get(k) for k in ("state", "reason", "detail", "engine", "rootless", "cgroup_version", "tested_at")}


def phase_engine(report: Report, api: Api, engine: Engine, model_url: str, ready_limit: float) -> bool:
    """Steps 1 to 8 with the engine running; returns whether the tools exist for the blocked phase."""
    report.step = 1
    configure_model(api, model_url)
    settings = api.get("/api/settings", timeout=60)
    report.check("sandbox mode is the default 'auto'", settings.get("sandbox") == "auto", settings.get("sandbox"))

    began = time.monotonic()
    row = wait_status(api, ready_limit, settled=lambda r: r.get("state") != "checking")
    report.facts["status_seconds"] = round(time.monotonic() - began, 1)
    report.facts["status"] = {**status_facts(row), "checks": row.get("checks", [])}
    checks = {check["name"]: check for check in row.get("checks", [])}
    for check in row.get("checks", []):
        print(f"     check {check['name']}: {'ok' if check['ok'] else 'FAILED'} {check.get('detail', '')}")
    # One PASS/FAIL per stage; a stage after the first failed one did not run (it is reported as not run).
    for name, step in STATUS_STEPS.items():
        if name in checks:
            report.check(
                f"status check '{name}' passed", bool(checks[name]["ok"]), checks[name].get("detail", ""), step=step
            )
    image_id = str((checks.get("image") or {}).get("detail", ""))
    if image_id.startswith("sha256:"):
        found = engine.run("image", "inspect", "--format", "{{.Os}}/{{.Architecture}}", image_id)
        image_platform = found.stdout.strip()
        report.facts["image_platform"] = image_platform
        engine_arch = str(report.facts.get("engine", {}).get("Architecture") or "")
        report.check(
            "the sandbox image is a Linux image for the engine's architecture",
            image_platform.startswith("linux/") and arch_matches(engine_arch, image_platform.partition("/")[2]),
            {"image": image_platform, "engine": engine_arch},
            step=3,
        )
    report.step = 4
    approved = report.check(
        "GET /api/sandbox/status: state approved",
        row.get("state") == "approved" and row.get("available") is True and row.get("reason") == "",
        status_facts(row),
    )
    report.step = 10
    sentence = reason_sentence(str(row.get("reason", "")))
    if sentence:
        note(f"Settings -> Sandbox shows: {sentence}")
    diagnosis = docker_diagnosis(api)
    report.facts["diagnosis"] = diagnosis
    expected = (
        "available" if approved else ("not_installed" if row.get("reason") == "docker-missing" else "unavailable")
    )
    report.check(
        f"the diagnosis (GET /api/diagnostics) reports Docker as '{expected}'",
        diagnosis.get("code") == expected,
        {**{k: diagnosis.get(k) for k in ("status", "code", "message")}, "text": diagnosis_sentence(expected)},
    )
    if not approved:
        # An engine that does not pass the checks is not used: generated code is refused, as without an engine.
        report.step = 9
        status, body = api.call("POST", "/api/tools/jobs", {"requirement": "SMOKE-ADD: write the tool add_numbers"})
        params = body.get("params") or {} if isinstance(body, dict) else {}
        report.facts["refusal"] = {
            "status": status,
            "code": body.get("code") if isinstance(body, dict) else body,
            "params": params,
        }
        report.check(
            "an engine that failed its checks is not used: tool jobs are refused",
            status == 400
            and isinstance(body, dict)
            and body.get("code") == "sandbox.isolation_required"
            and str(params.get("reason", "")).startswith("docker-"),
            {"status": status, "code": body.get("code") if isinstance(body, dict) else body, "params": params},
        )
        return False
    report.step = 1
    settings = api.get("/api/settings", timeout=60)
    selection = settings.get("sandbox_selection") or {}
    report.check(
        "Docker detected automatically: untrusted code goes to 'docker'",
        selection.get("untrusted") == "docker" and selection.get("blocked") is False and settings["docker_available"],
        selection,
    )
    report.step = 5

    # A generated tool: its tests run in a container during the job.
    began = engine.now()
    try:
        _job, tool = generate_tool(api, "SMOKE-ADD", "add_numbers")
    except RuntimeError as error:
        report.check("AI-generated tool created through the tool job", False, str(error))
        return False
    started, left = started_and_removed(engine.events(began, engine.now()))
    report.check("AI-generated tool created through the tool job", True, f"tool {tool['name']} v{tool['version']}")
    report.check(
        "the runtime classes the generated tool untrusted",
        tool.get("trust") == "untrusted" and bool(tool.get("requirement")),
        {"trust": tool.get("trust"), "requirement": tool.get("requirement")},
    )
    report.check("the job's tests ran in sandbox containers", bool(started), started)

    began = engine.now()
    status, result = run_tool(api, "add_numbers", {"a": 2, "b": 3})
    ended = engine.now()
    report.check(
        "untrusted tool runs: add_numbers(2, 3) == 5",
        status == 200 and not result.get("is_error") and json.loads(result.get("output", "null")) == 5,
        {"status": status, "result": result},
    )
    started, left = started_and_removed(engine.events(began, ended))
    report.check("the call ran in an orkexa-sandbox container (docker events)", len(started) >= 1, started)
    report.check(
        "that container was removed (destroy event)", bool(started) and not left, {"not_removed": left}, step=8
    )
    report.check("no sandbox container left after the call (docker ps -a)", not engine.wait_gone(10), "", step=8)

    try:
        _job, spin = generate_tool(api, "SMOKE-SPIN", "spin_rounds")
        report.check("second generated tool (spin_rounds) created", spin.get("trust") == "untrusted", spin["trust"])
    except RuntimeError as error:
        report.check("second generated tool (spin_rounds) created", False, str(error))
        return True

    # A call past the timeout.
    report.step = 7
    answer: dict[str, Any] = {}

    def call() -> None:
        began = time.monotonic()
        answer["status"], answer["result"] = run_tool(api, "spin_rounds", {"rounds": ENDLESS}, timeout=CALL_TIMEOUT * 6)
        answer["seconds"] = time.monotonic() - began

    worker = threading.Thread(target=call, daemon=True)
    worker.start()
    running = engine.wait_running(CALL_TIMEOUT)
    if report.check("the long call runs in a container", running is not None, running and running.get("Names")):
        assert running is not None
        inspected = engine.inspect(str(running["Names"]))
        flags = isolation_flags(inspected) if inspected else {}
        report.facts["container_flags"] = flags
        report.check(
            "docker inspect: isolation flags of the running sandbox container",
            bool(flags) and isolated(flags),
            flags,
            step=6,
        )
        report.check(
            "docker inspect: memory, CPU and process limits are set (the self-test proved the engine applies them)",
            bool(flags) and limited(flags),
            {k: flags.get(k) for k in ("memory", "memory_swap", "nano_cpus", "pids_limit")},
            step=6,
        )
    worker.join(CALL_TIMEOUT * 6 + 10)
    result = answer.get("result") or {}
    report.check(
        f"the call ends as an error after the {CALL_TIMEOUT:g} s timeout",
        answer.get("status") == 200
        and result.get("is_error") is True
        and CALL_TIMEOUT - 1 <= answer.get("seconds", 0) < CALL_TIMEOUT * 4,
        {"status": answer.get("status"), "seconds": round(answer.get("seconds", -1), 1), "result": result},
    )
    remaining = engine.wait_gone(10)
    report.check("no sandbox container left after the timeout", not remaining, remaining, step=8)

    # A workflow run cancelled while its tool call runs.
    try:
        workflow_id = workflow_with(api, "spin_rounds")
        status, run = api.call("POST", f"/api/workflows/{workflow_id}/runs", {"input": "go"})
        if status != 201:
            raise RuntimeError(f"start run: {status} {run}")
    except RuntimeError as error:
        report.check("workflow run with the untrusted tool starts", False, str(error))
        return True
    report.check("workflow run with the untrusted tool starts", True, run["id"])
    running = engine.wait_running(60)
    if not report.check(
        "the run's tool call runs in a container", running is not None, running and running.get("Names")
    ):
        run = api.get(f"/api/runs/{run['id']}")
        note(f"run: {run.get('status')} {run.get('error_code')} {run.get('error')}")
        api.call("POST", f"/api/runs/{run['id']}/cancel")
        return True
    assert running is not None
    seen = time.monotonic()
    time.sleep(1)
    status, cancelled = api.call("POST", f"/api/runs/{run['id']}/cancel")
    asked = time.monotonic()
    report.check("POST /api/runs/{id}/cancel accepted", status == 200, {"status": status, "body": str(cancelled)[:200]})
    remaining = engine.wait_gone(CALL_TIMEOUT)
    removed_after = time.monotonic() - seen
    report.check(
        "the cancelled call's container is removed before its timeout",
        not remaining and removed_after < CALL_TIMEOUT - 2,
        {
            "container": running.get("Names"),
            "seconds_after_start_seen": round(removed_after, 1),
            "seconds_after_cancel": round(time.monotonic() - asked, 1),
            "left": remaining,
        },
    )
    deadline = time.monotonic() + 60
    final = api.get(f"/api/runs/{run['id']}")
    while final["status"] in ("queued", "running") and time.monotonic() < deadline:
        time.sleep(0.5)
        final = api.get(f"/api/runs/{run['id']}")
    report.check("the run ends 'cancelled'", final["status"] == "cancelled", final["status"])
    calls = (final.get("nodes") or {}).get("a", {}).get("tool_calls") or []
    report.check(
        "the run's spin_rounds call was stopped, not finished",
        any(call.get("name") == "spin_rounds" and call.get("is_error") for call in calls),
        [{k: call.get(k) for k in ("name", "output", "is_error")} for call in calls],
    )
    return True


def phase_blocked(report: Report, api: Api, engine: Engine, label: str, have_tool: bool) -> None:
    """Steps 9 and 10: without a reachable engine nothing untrusted runs, no container starts, and Nodestro says why."""
    report.step = 9
    row = wait_status(api, 180, settled=lambda r: r.get("state") != "checking")
    report.facts.setdefault("blocked", {})[label] = status_facts(row)
    report.check(
        f"[{label}] sandbox status unavailable with a docker-* reason",
        row.get("state") == "unavailable"
        and row.get("available") is False
        and str(row.get("reason", "")).startswith("docker-"),
        {k: row.get(k) for k in ("state", "reason", "detail")},
    )
    settings = api.get("/api/settings", timeout=60)
    selection = settings.get("sandbox_selection") or {}
    report.check(
        f"[{label}] untrusted code is blocked (sandbox_selection)",
        selection.get("blocked") is True and selection.get("untrusted") == "",
        selection,
    )
    if have_tool:
        status, body = run_tool(api, "add_numbers", {"a": 2, "b": 3})
        params = (body or {}).get("params") or {} if isinstance(body, dict) else {}
        report.check(
            f"[{label}] the untrusted tool is refused: sandbox.isolation_required, docker-* reason",
            status == 400
            and body.get("code") == "sandbox.isolation_required"
            and str(params.get("reason", "")).startswith("docker-")
            and params.get("trust") == "untrusted",
            {"status": status, "code": body.get("code") if isinstance(body, dict) else body, "params": params},
        )
    status, body = api.call("POST", "/api/tools/jobs", {"requirement": "SMOKE-ADD: write the tool add_numbers"})
    report.check(
        f"[{label}] a new tool job is refused before any code is generated",
        status == 400 and isinstance(body, dict) and body.get("code") == "sandbox.isolation_required",
        {"status": status, "code": body.get("code") if isinstance(body, dict) else body},
    )
    report.step = 10
    reason = str(row.get("reason", ""))
    sentence = reason_sentence(reason)
    report.check(
        f"[{label}] Settings -> Sandbox has a sentence for the reason {reason or '(none)'}",
        bool(sentence) or not LOCALES.is_dir(),
        sentence or "(no frontend texts in this checkout)",
    )
    expected = "not_installed" if reason == "docker-missing" else "unavailable"
    diagnosis = docker_diagnosis(api)
    report.facts["blocked"][label]["diagnosis"] = diagnosis
    report.check(
        f"[{label}] the diagnosis (GET /api/diagnostics) reports Docker as '{expected}'",
        diagnosis.get("code") == expected,
        {**{k: diagnosis.get(k) for k in ("status", "code", "message")}, "text": diagnosis_sentence(expected)},
    )


def unsuitable(report: Report, env: dict[str, str], docker: str, results: Path | None = None) -> int:
    """``--expect-unsuitable``: whatever engine this computer has (or none), untrusted code is refused."""
    note(f"docker CLI: {docker or 'not found'}")
    if docker:
        found = subprocess.run(
            [docker, "version", "--format", "{{.Server.Os}}/{{.Server.Arch}} {{.Server.Version}}"],
            capture_output=True,
            text=True,
            timeout=60,
            env=env,
            check=False,
        )
        note(f"engine: exit {found.returncode} {found.stdout.strip()} {found.stderr.strip()[-300:]}")
    print("system:", sys.platform, platform.machine(), platform.platform(), flush=True)
    with tempfile.TemporaryDirectory(prefix="nodestro-docker-") as directory, stand_in_model() as model_url:
        log = Path(directory) / "studio.log"
        with studio(Path(directory) / "data", log, env) as api:
            configure_model(api, model_url)
            phase_blocked(report, api, Engine(docker, env), "unsuitable engine", False)
        if report.failed:
            print("\n".join(log.read_text("utf-8", "replace").splitlines()[-200:]))
    report.write(results)
    print(f"\n{report.passed} passed, {len(report.failed)} failed")
    return 1 if report.failed else 0


def split_command(command: str) -> list[str]:
    """A ``--stop-engine``/``--start-engine`` command as arguments: a JSON list as it is (a Windows path with spaces
    needs no quoting), otherwise split like a shell would (on Windows backslashes are kept)."""
    if command.lstrip().startswith("["):
        with contextlib.suppress(json.JSONDecodeError):
            value = json.loads(command)
            if isinstance(value, list) and value and all(isinstance(part, str) for part in value):
                return value
    return shlex.split(command, posix=os.name != "nt")


def start_detached(command: str) -> None:
    """Start the engine without waiting for the command: ``Docker Desktop.exe`` keeps running, ``open -a Docker`` and
    ``docker desktop start`` return; :func:`wait_engine` then waits for the engine."""
    options: dict[str, Any] = {"stdin": subprocess.DEVNULL, "stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL}
    if os.name == "nt":
        options["creationflags"] = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(
            subprocess, "CREATE_NEW_PROCESS_GROUP", 0
        )
    else:
        options["start_new_session"] = True
    try:
        subprocess.Popen(split_command(command), **options)
    except OSError as error:
        note(f"the start command failed: {error}")


def wait_engine(engine: Engine, *, up: bool, limit: float) -> bool:
    """Wait until ``docker info`` succeeds (``up``) or fails; Docker Desktop takes a while to quit and to start."""
    deadline = time.monotonic() + limit
    while True:
        try:
            answered = engine.run("info", "--format", "{{.ServerVersion}}", timeout=30).returncode == 0
        except subprocess.TimeoutExpired:
            answered = False
        if answered == up:
            return True
        if time.monotonic() > deadline:
            return False
        time.sleep(2)


def stop_engine(report: Report, engine: Engine, command: str | None, prompt: bool, limit: float) -> bool:
    """Stop the engine with ``command`` or, with ``prompt``, ask the person to quit it; True once it is gone."""
    if command:
        note(f"stopping the engine: {command}")
        try:
            stopped = subprocess.run(split_command(command), check=False, capture_output=True, text=True, timeout=300)
            note(f"exit {stopped.returncode} {stopped.stdout.strip()[-300:]} {stopped.stderr.strip()[-300:]}")
        except (OSError, subprocess.TimeoutExpired) as error:
            note(f"the stop command failed: {error}")
    if prompt:
        print(
            "\n>>> Please quit Docker Desktop now: whale icon in the menu bar (or the system tray) -> Quit."
            "\n>>> The test continues by itself once Docker has stopped.",
            flush=True,
        )
    gone = wait_engine(engine, up=False, limit=limit)
    last = engine.run("info", timeout=30) if gone else None
    report.check(
        "engine really stopped (docker info fails)",
        gone,
        (last.stderr.strip()[-300:] if last is not None else f"still answering after {limit:g} s"),
    )
    return gone


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--data-dir", type=Path, help="data directory (default: a new temporary one)")
    parser.add_argument("--ready-timeout", type=float, default=900, help="seconds to wait for 'approved'")
    parser.add_argument("--stop-engine", help="command that really stops the engine for the last phase")
    parser.add_argument(
        "--stop-engine-prompt",
        action="store_true",
        help="for the last phase, ask the person at the keyboard to quit the engine (Docker Desktop) and wait for it",
    )
    parser.add_argument("--stop-timeout", type=float, default=300, help="seconds to wait for the engine to stop")
    parser.add_argument("--start-engine", help="command that starts the engine again after the last phase")
    parser.add_argument("--results", type=Path, help="write the checks (with their step) and facts as JSON here")
    parser.add_argument(
        "--expect-unsuitable",
        action="store_true",
        help="the engine here cannot isolate Linux containers (e.g. Windows containers on a Windows runner, or no "
        "engine): check only that untrusted code is refused with a docker-* reason",
    )
    args = parser.parse_args(argv)

    report = Report()
    env = {**os.environ, "PYTHONUTF8": "1"}
    env.pop("NODESTRO_PROFILE", None)
    docker = env.get("NODESTRO_DOCKER") or shutil.which("docker") or ""
    report.facts["system"] = {"platform": sys.platform, "machine": platform.machine(), "os": platform.platform()}
    if args.expect_unsuitable:
        return unsuitable(report, env, docker, args.results)
    if not report.check("docker CLI on PATH", bool(docker), docker):
        report.write(args.results)
        return 1
    engine = Engine(docker, env)
    version = engine.run("version", "--format", "{{json .}}")
    report.check(
        "engine answers (docker version)", version.returncode == 0, version.stdout.strip()[:600] or version.stderr
    )
    info = engine.run("info", "--format", "{{json .}}")
    with contextlib.suppress(json.JSONDecodeError):
        facts = json.loads(info.stdout)
        report.facts["engine"] = {
            k: facts.get(k)
            for k in (
                "ServerVersion",
                "OperatingSystem",
                "OSType",
                "Architecture",
                "CgroupVersion",
                "CgroupDriver",
                "SecurityOptions",
                "Name",
                "MemTotal",
                "NCPU",
            )
        }
        note("engine: " + json.dumps(report.facts["engine"]))
    print("system:", sys.platform, platform.machine(), platform.platform(), flush=True)

    with contextlib.ExitStack() as stack:
        if args.data_dir is None:
            directory = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix="nodestro-docker-")))
            data_dir = directory / "data"
        else:
            data_dir = args.data_dir
            directory = data_dir.parent
        data_dir = data_dir.resolve()
        log = directory / "studio.log"
        model_url = stack.enter_context(stand_in_model())
        try:
            engine_began = engine.now()
            with studio(data_dir, log, env) as api:
                engine.owner = installation_owner(data_dir)
                report.facts["owner"] = engine.owner
                note(f"this run's containers: {owner_filter(engine.owner)}")
                have_tool = phase_engine(report, api, engine, model_url, args.ready_timeout)
            report.check("no sandbox container left after the studio stopped", not engine.wait_gone(10), "", step=8)

            blocked_env = {**env, "DOCKER_HOST": UNREACHABLE}
            blocked_env.pop("DOCKER_CONTEXT", None)
            began = engine.now()
            with studio(data_dir, log, blocked_env) as api:
                phase_blocked(report, api, engine, "engine unreachable", have_tool)
            # events() widens its window by 3 s on both sides for an engine clock in a VM, so containers of the
            # previous phase that started just before `began` (the cancelled run's call) fall into it; leave out
            # every container that had started by `began`.
            earlier, _ = started_and_removed(engine.events(engine_began, began - 3))
            started, _ = started_and_removed(engine.events(began, engine.now()))
            started = [name for name in started if name not in earlier]
            report.check("[engine unreachable] no sandbox container started", not started, started, step=9)

            if args.stop_engine or args.stop_engine_prompt:
                report.step = 9
                if stop_engine(report, engine, args.stop_engine, args.stop_engine_prompt, args.stop_timeout):
                    with studio(data_dir, log, env) as api:
                        phase_blocked(report, api, engine, "engine stopped", have_tool)
                if args.start_engine:
                    note(f"starting the engine again: {args.start_engine}")
                    start_detached(args.start_engine)
                    report.check(
                        "engine started again (docker info answers)",
                        wait_engine(engine, up=True, limit=300),
                        "",
                        step=9,
                    )
        finally:
            report.write(args.results)
            if report.failed:
                print("----- studio log (last 200 lines) -----")
                with contextlib.suppress(OSError):
                    print("\n".join(log.read_text("utf-8", "replace").splitlines()[-200:]))

    report.write(args.results)
    print(f"\n{report.passed} passed, {len(report.failed)} failed")
    for name in report.failed:
        print(f"  FAILED: {name}")
    return 1 if report.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

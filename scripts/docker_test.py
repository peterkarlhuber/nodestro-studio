"""The Docker sandbox test in one command, for a person with Docker Desktop (macOS, Windows) or another engine.

``scripts/mac_docker_test.sh`` (macOS, Linux) finds a Python 3.11+ and runs this script; on Windows it is run directly
(``py scripts\\docker_test.py``). From a checkout of nodestro-studio it

1. looks at this computer and its Docker without changing anything: the docker command, whether the engine answers,
   the Docker context and ``DOCKER_HOST``, Linux or Windows containers, cgroup version, memory and CPUs, the Docker
   Desktop version, and what the docker CLI sees with the reduced environment the runtime gives it;
2. installs the studio of this checkout (``pip install -r platform/internal.txt <checkout>``: the components at the
   commits of the checkout's lock)
   into its own virtual environment in the work folder (default ``~/nodestro-docker-test``), never into the person's
   Python; the interface is not built, the test does not need it;
3. runs ``scripts/docker_smoke.py`` with that environment (the real studio, Orkexa's ``DockerSandbox``, only the AI
   model is a local stand-in) and turns its checks into a PASS/FAIL line per step in plain language;
4. writes a diagnostic report (``report-<time>.txt`` and ``.json``, and both in one ``.zip`` to send) without
   credentials: no environment dump, tokens, keys, URL passwords and home folders are replaced;
5. cleans up only what this test made: the containers of its own installation (by their owner label), images it
   pulled or built during the run if ``--remove-images`` is given, its data folder and virtual environment (kept with
   ``--keep``). It never prunes and never touches other containers, images or volumes.

Docker Desktop is never quit unless ``--stop-docker-desktop`` is given (it asks first, unless ``--yes``); the check
without Docker otherwise points the studio at an address where no engine listens (``DOCKER_HOST``).

Exit code: 0 every step passed, 1 a step failed, 2 the test could not run (no Docker, install failed).
"""

from __future__ import annotations

import sys

MIN_PYTHON = (3, 11)
if sys.version_info < MIN_PYTHON:  # before anything newer is used: an old Python gets a plain message
    sys.stderr.write(
        "This test needs Python 3.11 or newer; this is Python {}.{}.\n"
        "On macOS run scripts/mac_docker_test.sh, which finds or fetches one. On Windows install Python 3.13 from "
        "https://www.python.org/downloads/ and run: py -3.13 scripts\\docker_test.py\n".format(*sys.version_info[:2])
    )
    raise SystemExit(2)

import argparse  # noqa: E402
from collections.abc import Iterable, Mapping  # noqa: E402
import contextlib  # noqa: E402
from datetime import UTC, datetime  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
from pathlib import Path  # noqa: E402
import platform  # noqa: E402
import re  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
from typing import Any  # noqa: E402
import zipfile  # noqa: E402

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import docker_smoke  # noqa: E402

VERSION = 1
DEFAULT_WORK = Path.home() / "nodestro-docker-test"
#: The variables the runtime passes to the docker CLI (nodestro_runtime.container_images._cli_environment); the docker
#: CLI is asked once with only these, to see the daemon the studio will see.
RUNTIME_CLI_KEEP = (
    "PATH",
    "HOME",
    "DOCKER_HOST",
    "DOCKER_CONFIG",
    "DOCKER_CONTEXT",
    "DOCKER_CERT_PATH",
    "DOCKER_TLS_VERIFY",
    "DOCKER_BUILDKIT",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "http_proxy",
    "https_proxy",
    "no_proxy",
)
#: Variables that never reach the studio of the test: it must not see a token or a provider key (the model is a
#: local stand-in; no test calls a paid provider).
SECRET_NAME = re.compile(
    r"(?i)(TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|ACCESS_?KEY|CREDENTIAL|^GIT_CONFIG_|^AWS_|^NODESTRO_READ$)"
)
#: Image repositories this test may pull or build (removed with ``--remove-images`` when new since the start).
TEST_REPOSITORIES = ("nodestro-env", "python", "docker.io/library/python", "ghcr.io/astral-sh/uv")
#: Engine names in ``docker info`` that tell nothing about the person (anything else may be the host name).
PUBLIC_ENGINE_NAMES = re.compile(r"^(docker-desktop|colima(-.*)?|orbstack|lima-.*|podman-machine.*|rancher-desktop)$")

PLAIN: dict[int, tuple[str, str]] = {
    1: ("Nodestro found Docker by itself.", "Nodestro could not find or reach Docker."),
    2: (
        "Docker's settings are strict enough (Linux containers, memory/CPU/process limits, system call filter).",
        "Docker's settings are not strict enough for Nodestro, so Nodestro does not use it.",
    ),
    3: ("Nodestro prepared its sandbox image for this computer.", "Nodestro could not prepare its sandbox image."),
    4: (
        "A test container proved that the restrictions really hold.",
        "The test container showed that a restriction does not hold, so Nodestro does not use this Docker.",
    ),
    5: ("AI-written Python code ran inside a Docker container.", "AI-written Python code did not run in Docker."),
    6: (
        "That container had no network, read-only files, no extra rights and memory/CPU/process limits.",
        "A restriction was missing on the container.",
    ),
    7: (
        "Code that runs too long was stopped after 15 s, and a cancelled run stopped its container at once.",
        "Stopping long-running or cancelled code did not work as expected.",
    ),
    8: ("No test container was left behind.", "A test container was left behind."),
    9: (
        "Without Docker, Nodestro refuses AI-written code instead of running it unprotected.",
        "Without Docker, Nodestro did not refuse AI-written code as it should.",
    ),
    10: (
        "Nodestro shows the right status and explanation.",
        "Nodestro's status or explanation was not the expected one.",
    ),
}


# ---- redaction ----------------------------------------------------------------------------------------------------

_REDACTIONS: tuple[tuple[re.Pattern[str], str], ...] = (
    # user:password@ (or a token as user name) in any URL, e.g. a proxy or a git remote
    (re.compile(r"\b([A-Za-z][A-Za-z0-9+.-]*://)[^\s/@\"']+@"), r"\1<redacted>@"),
    (re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})"), "<redacted-token>"),
    (re.compile(r"\bsk-(?:ant-)?[A-Za-z0-9_-]{16,}"), "<redacted-key>"),
    # Bare tokens of other services with a known prefix: GitLab, Google API keys, Slack, npm, Hugging Face.
    (
        re.compile(r"\b(?:glpat-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|xox[abposr]-[A-Za-z0-9-]{10,})"),
        "<redacted-token>",
    ),
    (re.compile(r"\b(?:npm_[A-Za-z0-9]{36}|hf_[A-Za-z0-9]{30,})\b"), "<redacted-token>"),
    (re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"), "<redacted-key>"),
    (re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+"), "<redacted-jwt>"),
    (re.compile(r"(?i)\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}"), r"\1 <redacted>"),
    # NAME=value / "name": "value" where the name says it is secret
    (
        re.compile(
            r"(?i)\b([A-Za-z0-9_.-]*(?:token|secret|password|passwd|api[_-]?key|access[_-]?key)[A-Za-z0-9_.-]*"
            r"[\"']?\s*[=:]\s*[\"']?)(?![\"']?\d+\b)[^\s&\"',;}]+"
        ),
        r"\1<redacted>",
    ),
    # other people's home folders (the person's own is replaced by "~" first)
    (re.compile(r"(?i)/(Users|home)/[^\s/\"':]+"), r"/\1/<user>"),
    (re.compile(r"(?i)\b([A-Z]:(?:\\\\|\\|/)Users(?:\\\\|\\|/))[^\s\\/\"':]+"), r"\1<user>"),
)


def redact(text: str, home: str | None = None) -> str:
    """``text`` without credentials and user names: URL user info, GitHub tokens, provider keys, JWTs, Authorization
    values, ``*TOKEN*=``/``*PASSWORD*=``-style values, and home folders (``home``, default the current one, becomes
    ``~``; any other ``/Users/<name>``, ``/home/<name>``, ``C:\\Users\\<name>`` loses the name)."""
    home = str(Path.home()) if home is None else home
    if home and home not in ("/", "\\"):
        variants = {home, home.replace("\\", "\\\\"), home.replace("\\", "/")}
        with contextlib.suppress(OSError):
            variants.add(str(Path(home).resolve()))
        for variant in sorted(variants, key=len, reverse=True):
            text = text.replace(variant, "~")
    for pattern, replacement in _REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


def redact_value(value: Any, home: str | None = None) -> Any:
    """:func:`redact` for every string in a JSON-like value."""
    if isinstance(value, str):
        return redact(value, home)
    if isinstance(value, Mapping):
        return {str(k): redact_value(v, home) for k, v in value.items()}
    if isinstance(value, list | tuple):
        return [redact_value(v, home) for v in value]
    return value


def child_environment(environ: Mapping[str, str]) -> dict[str, str]:
    """The environment of the test's studio: this one without tokens, keys, passwords and git URL rewrites (the
    install needs them, the studio does not). Proxies stay (image builds and pulls need them)."""
    keep = {k: v for k, v in environ.items() if not SECRET_NAME.search(k) or k.upper() in ("HTTP_PROXY", "HTTPS_PROXY")}
    keep.pop("NODESTRO_PROFILE", None)
    keep["PYTHONUTF8"] = "1"
    return keep


def runtime_cli_environment(environ: Mapping[str, str]) -> dict[str, str]:
    return {k: v for k, v in environ.items() if k in RUNTIME_CLI_KEEP}


# ---- facts about this computer ------------------------------------------------------------------------------------


def run(args: list[str], env: Mapping[str, str] | None = None, timeout: float = 60) -> tuple[int, str, str]:
    """``(exit code, stdout, stderr)``; 127 when the command cannot be started, 124 on timeout."""
    try:
        done = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=dict(env) if env is not None else None,
            check=False,
            errors="replace",
        )
    except FileNotFoundError as error:
        return 127, "", str(error)
    except OSError as error:
        return 126, "", str(error)
    except subprocess.TimeoutExpired:
        return 124, "", f"timed out after {timeout:g} s"
    return done.returncode, done.stdout.strip(), done.stderr.strip()


def _json(text: str) -> dict[str, Any]:
    try:
        value = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return {}
    return value if isinstance(value, dict) else {}


def system_facts() -> dict[str, Any]:
    facts: dict[str, Any] = {
        "platform": sys.platform,
        "machine": platform.machine(),
        "os": platform.platform(),
        "python": platform.python_version(),
        "python_arch": platform.architecture()[0],
    }
    if sys.platform == "darwin":
        facts["macos"] = platform.mac_ver()[0]
        code, out, _ = run(["sysctl", "-n", "sysctl.proc_translated"], timeout=10)
        facts["rosetta"] = code == 0 and out == "1"  # this Python is an Intel build running on Apple silicon
        code, out, _ = run(["sysctl", "-n", "hw.memsize"], timeout=10)
        if code == 0 and out.isdigit():
            facts["memory_gib"] = round(int(out) / 2**30, 1)
    elif sys.platform == "win32":
        facts["windows"] = platform.version()
        facts["processor_arch"] = os.environ.get("PROCESSOR_ARCHITECTURE", "")
    return facts


def docker_facts(docker: str, environ: Mapping[str, str]) -> dict[str, Any]:
    """What the docker CLI says about its engine and context (nothing is changed). Values are redacted later."""
    facts: dict[str, Any] = {"cli": docker, "docker_host_set": bool(environ.get("DOCKER_HOST"))}
    if environ.get("DOCKER_HOST"):
        facts["docker_host"] = environ["DOCKER_HOST"]
    if environ.get("DOCKER_CONTEXT"):
        facts["docker_context_env"] = environ["DOCKER_CONTEXT"]
    if not docker:
        return facts
    code, out, err = run([docker, "context", "show"], environ, 30)
    facts["context"] = out if code == 0 else ""
    code, out, err = run([docker, "context", "ls", "--format", "{{.Name}}"], environ, 30)
    facts["contexts"] = out.split() if code == 0 else []
    if facts["context"]:
        code, out, _ = run(
            [docker, "context", "inspect", "--format", "{{.Endpoints.docker.Host}}", facts["context"]], environ, 30
        )
        facts["context_endpoint"] = out if code == 0 else ""
    code, out, err = run([docker, "version", "--format", "{{json .}}"], environ, 90)
    version = _json(out)
    client, server = version.get("Client") or {}, version.get("Server") or {}
    facts["client_version"] = client.get("Version", "")
    facts["engine_answers"] = code == 0 and bool(server)
    if not facts["engine_answers"]:
        facts["engine_error"] = (err or out)[-600:]
    if server:
        facts["server_version"] = server.get("Version", "")
        facts["server_os"] = server.get("Os", "")
        facts["server_arch"] = server.get("Arch", "")
        facts["server_platform"] = (server.get("Platform") or {}).get("Name", "")
    code, out, _ = run([docker, "desktop", "version"], environ, 30)
    facts["docker_desktop_cli"] = out.splitlines()[:3] if code == 0 else []
    if facts["engine_answers"]:
        code, out, _ = run([docker, "info", "--format", "{{json .}}"], environ, 90)
        info = _json(out)
        name = str(info.get("Name", ""))
        facts["info"] = {
            "OperatingSystem": info.get("OperatingSystem"),
            "OSType": info.get("OSType"),
            "Architecture": info.get("Architecture"),
            "KernelVersion": info.get("KernelVersion"),
            "CgroupVersion": info.get("CgroupVersion"),
            "CgroupDriver": info.get("CgroupDriver"),
            "SecurityOptions": info.get("SecurityOptions"),
            "MemTotal": info.get("MemTotal"),
            "NCPU": info.get("NCPU"),
            "Runtimes": sorted((info.get("Runtimes") or {}).keys()),
            "DefaultRuntime": info.get("DefaultRuntime"),
            "Name": name if PUBLIC_ENGINE_NAMES.match(name) else "<host>",
            "proxy_configured": bool(info.get("HttpProxy") or info.get("HttpsProxy")),
        }
    # The daemon the studio's runtime reaches: it gives the CLI only a few variables (on Windows not USERPROFILE,
    # where the CLI looks for its contexts).
    reduced = runtime_cli_environment(environ)
    code, out, _ = run([docker, "context", "show"], reduced, 30)
    facts["runtime_env_context"] = out if code == 0 else ""
    code, out, err = run([docker, "info", "--format", "{{.ServerVersion}}"], reduced, 60)
    facts["runtime_env_engine_answers"] = code == 0 and bool(out)
    if not facts["runtime_env_engine_answers"]:
        facts["runtime_env_error"] = (err or out)[-400:]
    return facts


def engine_kind(facts: Mapping[str, Any]) -> str:
    info = facts.get("info") or {}
    platform_name = str(facts.get("server_platform") or "")
    if info.get("OperatingSystem") == "Docker Desktop" or platform_name.startswith("Docker Desktop"):
        return "Docker Desktop"
    name = str(info.get("Name") or "")
    if name.startswith("colima"):
        return "Colima"
    if info.get("OperatingSystem") == "OrbStack":
        return "OrbStack"
    if "podman" in platform_name.lower() or name.startswith("podman"):
        return "Podman"
    return "Docker Engine" if facts.get("engine_answers") else "unknown"


def hints(facts: Mapping[str, Any], system: Mapping[str, Any], docker_desktop_app: bool) -> list[dict[str, str]]:
    """What the person should know before the run: ``fatal`` stops the test (it cannot run), ``warning`` may make a
    step fail, ``info`` explains what is tested."""
    found: list[dict[str, str]] = []

    def add(level: str, text: str) -> None:
        found.append({"level": level, "text": text})

    mac, windows = sys.platform == "darwin", sys.platform == "win32"
    if not facts.get("cli"):
        if docker_desktop_app:
            add(
                "fatal",
                "Docker Desktop is installed, but the 'docker' command is not found. Start Docker Desktop once; if it "
                "still is missing, open Docker Desktop -> Settings -> Advanced and choose 'System' for the CLI tools "
                "(or add ~/.docker/bin to PATH), then open a new terminal.",
            )
        else:
            add(
                "fatal",
                "Docker is not installed (the 'docker' command is not found). Install Docker Desktop from "
                "https://www.docker.com/products/docker-desktop/ , start it once, then run this test again.",
            )
        return found
    if facts.get("docker_host_set"):
        add(
            "info",
            "DOCKER_HOST is set in this terminal; it decides which engine is used and overrides the Docker "
            "context. If that is not intended, run 'unset DOCKER_HOST' (Windows: Remove-Item Env:DOCKER_HOST).",
        )
    if not facts.get("engine_answers"):
        error = str(facts.get("engine_error") or "")
        text = (
            "Docker is installed but not running (the engine does not answer). Start Docker Desktop and wait "
            "until it says 'Docker Desktop is running', then run this test again."
        )
        if "desktop-linux" in (facts.get("contexts") or []) and facts.get("context") != "desktop-linux":
            text += (
                f" The current Docker context is '{facts.get('context') or '?'}'; Docker Desktop's is "
                "'desktop-linux': run 'docker context use desktop-linux' or add --context desktop-linux."
            )
        if "permission denied" in error.lower():
            text = "The docker command has no permission to reach the engine (permission denied). " + text
        add("fatal", text)
        return found
    info = facts.get("info") or {}
    kind = engine_kind(facts)
    if str(facts.get("server_os") or info.get("OSType") or "").lower() == "windows":
        add(
            "fatal",
            "Docker Desktop runs Windows containers. Nodestro needs Linux containers: right-click the whale "
            "icon in the system tray -> 'Switch to Linux containers...', then run this test again.",
        )
        return found
    if kind != "Docker Desktop":
        text = f"This run tests {kind}, not Docker Desktop."
        if "desktop-linux" in (facts.get("contexts") or []):
            text += " To test Docker Desktop, add --context desktop-linux."
        add("info", text)
    if str(info.get("CgroupVersion") or "") not in ("2", ""):
        text = (
            f"The engine uses cgroup v{info.get('CgroupVersion')}; Nodestro needs cgroup v2 to prove its limits, so "
            "the self-test (step 4) is expected to refuse this engine."
        )
        if windows:
            text += (
                " With Docker Desktop on WSL 2, update WSL ('wsl --update' in an administrator terminal) and "
                "restart Docker Desktop."
            )
        add("warning", text)
    memory = info.get("MemTotal")
    if isinstance(memory, int) and memory and memory < 2 * 2**30:
        add(
            "warning",
            f"Docker has only {memory / 2**30:.1f} GiB of memory. Give it at least 2 GiB: Docker Desktop "
            "-> Settings -> Resources.",
        )
    runtimes = info.get("Runtimes") or []
    if "sysbox-runc" in runtimes or str(info.get("DefaultRuntime") or "").startswith("sysbox"):
        add("info", "Docker Desktop's Enhanced Container Isolation seems to be on; this combination was never tested.")
    if not facts.get("runtime_env_engine_answers"):
        add(
            "warning",
            "With the reduced environment Nodestro gives the docker command, the engine does not answer "
            f"(context there: '{facts.get('runtime_env_context') or '?'}'). Steps 1 to 8 will likely fail; the report "
            "shows the error.",
        )
    elif facts.get("runtime_env_context") and facts.get("runtime_env_context") != facts.get("context"):
        add(
            "info",
            f"Nodestro's docker command sees the context '{facts.get('runtime_env_context')}', this terminal "
            f"'{facts.get('context')}'; both reach an engine.",
        )
    if mac and system.get("rosetta"):
        add("info", "This Python is an Intel build running under Rosetta on Apple silicon; the test still works.")
    return found


def docker_desktop_installed() -> bool:
    if sys.platform == "darwin":
        return Path("/Applications/Docker.app").exists() or (Path.home() / "Applications" / "Docker.app").exists()
    if sys.platform == "win32":
        program_files = os.environ.get("PROGRAMFILES", r"C:\Program Files")
        return (Path(program_files) / "Docker" / "Docker" / "Docker Desktop.exe").exists()
    return False


def find_docker(environ: Mapping[str, str]) -> str:
    """The docker CLI on PATH; on macOS also where Docker Desktop puts it when it is not on PATH (reported)."""
    found = environ.get("NODESTRO_DOCKER") or shutil.which("docker", path=environ.get("PATH")) or ""
    return found


# ---- git access, install ------------------------------------------------------------------------------------------


def git_dependencies(lock: str) -> list[str]:
    """The repositories of the studio's git dependencies (the lock's ``name @ git+https://...git@<commit>``)."""
    return sorted(set(re.findall(r"git\+(https://[^@\s\"]+?)(?:\.git)?@[0-9a-f]{7,40}", lock)))


def check_git_access(urls: Iterable[str], environ: Mapping[str, str]) -> list[str]:
    """The repositories ``git ls-remote`` cannot read without asking for a password."""
    env = {**environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"}
    missing = []
    for url in urls:
        code, _, _ = run(["git", "ls-remote", "--exit-code", url + ".git", "HEAD"], env, 90)
        if code != 0:
            missing.append(url)
    return missing


def repo_state() -> dict[str, Any]:
    code, commit, _ = run(["git", "-C", str(REPO), "rev-parse", "HEAD"], timeout=30)
    if code != 0:
        return {"commit": "unknown", "dirty": None}
    code, status, _ = run(["git", "-C", str(REPO), "status", "--porcelain", "--untracked-files=no"], timeout=30)
    return {"commit": commit, "dirty": bool(status) if code == 0 else None}


#: The file that marks a work folder this test made; the test deletes folders only inside such a folder.
WORK_MARKER = ".nodestro-docker-test"


def work_folder_usable(work: Path) -> bool:
    """Whether ``work`` may be the work folder: missing, empty, or marked by an earlier run (never e.g. ``~``)."""
    if not work.exists():
        return True
    if not work.is_dir():
        return False
    return (work / WORK_MARKER).exists() or not any(work.iterdir())


def venv_python(venv: Path) -> Path:
    return venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def install(work: Path, environ: Mapping[str, str], state: Mapping[str, Any], log: Path, reinstall: bool) -> Path:
    """The studio of this checkout in ``work/venv`` (reused when the same clean commit and Python made it)."""
    venv = work / "venv"
    marker = venv / "nodestro-test.json"
    wanted = {"commit": state.get("commit"), "python": platform.python_version(), "executable": sys.executable}
    if not reinstall and not state.get("dirty") and state.get("commit") != "unknown":
        with contextlib.suppress(OSError, json.JSONDecodeError):
            if json.loads(marker.read_text(encoding="utf-8")) == wanted and venv_python(venv).exists():
                say("The studio of this commit is installed already (kept from an earlier run with --keep).")
                return venv_python(venv)
    shutil.rmtree(venv, ignore_errors=True)
    say("Installing the studio and its components into a separate environment (a few minutes the first time) ...")
    env = {**environ, "PIP_DISABLE_PIP_VERSION_CHECK": "1", "PIP_CACHE_DIR": str(work / "cache" / "pip")}
    with log.open("w", encoding="utf-8", errors="replace") as output:
        for step in (
            [sys.executable, "-m", "venv", str(venv)],
            [str(venv_python(venv)), "-m", "pip", "install", "-r", str(REPO / "platform" / "internal.txt"), str(REPO)],
        ):
            output.write(f"$ {' '.join(step)}\n")
            output.flush()
            done = subprocess.run(step, stdout=output, stderr=subprocess.STDOUT, env=env, check=False)
            if done.returncode != 0:
                raise InstallFailed(f"{Path(step[0]).name} {' '.join(step[1:3])} exited with {done.returncode}")
    marker.write_text(json.dumps(wanted), encoding="utf-8")
    return venv_python(venv)


class InstallFailed(Exception):
    pass


# ---- images and cleanup -------------------------------------------------------------------------------------------


def image_rows(docker: str, environ: Mapping[str, str]) -> dict[str, list[str]]:
    """Every local image: id -> its ``repository:tag`` names."""
    code, out, _ = run(
        [docker, "image", "ls", "--no-trunc", "--format", "{{.ID}} {{.Repository}}:{{.Tag}}"], environ, 120
    )
    rows: dict[str, list[str]] = {}
    if code != 0:
        return rows
    for line in out.splitlines():
        image_id, _, ref = line.partition(" ")
        rows.setdefault(image_id, []).append(ref)
    return rows


def _repository(ref: str) -> str:
    name = ref.rsplit(":", 1)[0] if ":" in ref.rsplit("/", 1)[-1] else ref
    return name


def images_to_remove(before: Mapping[str, list[str]], after: Mapping[str, list[str]]) -> list[str]:
    """Images that appeared during the run and belong to this test's repositories (the sandbox image and the base
    images it pulls); an image that existed before, or of any other repository, is never chosen."""
    chosen = []
    for image_id, refs in after.items():
        if image_id in before:
            continue
        if refs and all(_repository(ref) in TEST_REPOSITORIES for ref in refs):
            chosen.append(image_id)
    return sorted(chosen)


def containers_to_remove(rows: Iterable[Mapping[str, Any]], owner: str) -> list[str]:
    """The ids of containers whose owner label is this run's installation (tool and MCP containers); nothing without
    an owner."""
    if not owner.startswith("nodestro-") or owner == "nodestro-":
        return []
    owners = {owner, "nodestro-mcp-" + owner[len("nodestro-") :]}
    chosen = []
    for row in rows:
        labels = row.get("Labels")
        if isinstance(labels, str):  # docker ps prints "a=b,c=d"
            labels = dict(part.split("=", 1) for part in labels.split(",") if "=" in part)
        if isinstance(labels, Mapping) and labels.get(docker_smoke.OWNER_LABEL) in owners and row.get("ID"):
            chosen.append(str(row["ID"]))
    return chosen


def cleanup(
    docker: str,
    environ: Mapping[str, str],
    owner: str,
    images_before: Mapping[str, list[str]] | None,
    *,
    remove_images: bool,
    paths: Iterable[Path],
) -> dict[str, Any]:
    result: dict[str, Any] = {"containers_removed": [], "images_removed": [], "paths_removed": [], "notes": []}
    if docker and owner:
        code, out, err = run(
            [
                docker,
                "ps",
                "-a",
                "--no-trunc",
                "--filter",
                f"label={docker_smoke.OWNER_LABEL}",
                "--format",
                "{{json .}}",
            ],
            environ,
            60,
        )
        if code != 0:
            result["notes"].append("Docker did not answer; containers were not checked: " + err[-200:])
        rows = [_json(line) for line in out.splitlines()] if code == 0 else []
        for container in containers_to_remove(rows, owner):
            if run([docker, "rm", "-f", container], environ, 60)[0] == 0:
                result["containers_removed"].append(container[:12])
    if docker and remove_images and images_before is not None:
        for image in images_to_remove(images_before, image_rows(docker, environ)):
            code, _, err = run([docker, "image", "rm", image], environ, 120)
            if code == 0:
                result["images_removed"].append(image)
            else:
                result["notes"].append(f"image {image[:19]} kept: {err[-200:]}")
    for path in paths:
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
            result["paths_removed"].append(str(path))
    return result


# ---- summary and report -------------------------------------------------------------------------------------------


def summarize(checks: Iterable[Mapping[str, Any]], *, real_stop: bool) -> list[dict[str, Any]]:
    """One row per step: PASS, FAIL or NOT RUN, its plain sentence and the names of failed checks."""
    by_step: dict[int, list[Mapping[str, Any]]] = {step: [] for step in docker_smoke.STEPS}
    for check in checks:
        by_step.setdefault(int(check.get("step") or 0), []).append(check)
    rows = []
    for step, title in docker_smoke.STEPS.items():
        found = by_step.get(step, [])
        failed = [str(c.get("name")) for c in found if not c.get("ok")]
        status = "NOT RUN" if not found else ("FAIL" if failed else "PASS")
        good, bad = PLAIN[step]
        text = {"PASS": good, "FAIL": bad, "NOT RUN": "Not checked (an earlier check failed or it was skipped)."}[
            status
        ]
        if step == 9 and status == "PASS":
            text += (
                " Checked with Docker really stopped and with Docker unreachable."
                if real_stop
                else " Checked with Docker unreachable; Docker Desktop itself was not quit (--stop-docker-desktop)."
            )
        rows.append({"step": step, "title": title, "status": status, "text": text, "failed": failed})
    return rows


def overall(steps: Iterable[Mapping[str, Any]], fatal: bool, smoke_code: int | None) -> str:
    rows = list(steps)
    if fatal or smoke_code is None:
        return "NOT RUN"
    if smoke_code == 0 and all(r["status"] == "PASS" for r in rows):
        return "PASS"
    return "FAIL"


def report_text(report: Mapping[str, Any]) -> str:
    lines = [
        "Nodestro Docker sandbox test",
        "=" * 28,
        f"Result: {report['result']}",
        f"Time (UTC): {report['time']}",
        f"Studio commit: {report['repo'].get('commit')}"
        + (" (with local changes)" if report["repo"].get("dirty") else ""),
        f"System: {report['system'].get('os')} ({report['system'].get('machine')}), "
        f"Python {report['system'].get('python')}",
    ]
    docker = report.get("docker") or {}
    info = docker.get("info") or {}
    lines.append(
        f"Docker: {report.get('engine_kind')} | engine {docker.get('server_version') or '-'} "
        f"({docker.get('server_platform') or '-'}) | context {docker.get('context') or '-'} | "
        f"{info.get('OSType') or '-'}/{info.get('Architecture') or '-'} | cgroup v{info.get('CgroupVersion') or '?'} | "
        f"{(info.get('MemTotal') or 0) / 2**30:.1f} GiB, {info.get('NCPU') or '?'} CPUs"
    )
    lines.append("")
    for hint in report.get("hints") or []:
        lines.append(f"[{hint['level']}] {hint['text']}")
    if report.get("hints"):
        lines.append("")
    lines.append("Steps:")
    for row in report.get("steps") or []:
        lines.append(f"  {row['step']:>2}. {row['status']:<7} {row['title']}: {row['text']}")
        lines.extend(f"             failed: {name}" for name in row["failed"])
    smoke = report.get("smoke") or {}
    status = (smoke.get("facts") or {}).get("status") or {}
    if status:
        lines += [
            "",
            f"Sandbox status: {status.get('state')} {status.get('reason') or ''} {status.get('detail') or ''}",
        ]
        sentence = docker_smoke.reason_sentence(str(status.get("reason") or ""))
        if sentence:
            lines.append(f"Nodestro shows: {sentence}")
    if report.get("error"):
        lines += ["", f"Error: {report['error']}"]
    lines += ["", "Cleanup:"]
    clean = report.get("cleanup") or {}
    lines.append(
        f"  containers removed: {len(clean.get('containers_removed') or [])}, images removed: "
        f"{len(clean.get('images_removed') or [])}, folders removed: {len(clean.get('paths_removed') or [])}"
    )
    lines.extend(f"  note: {note}" for note in clean.get("notes") or [])
    lines += ["", "All checks:"]
    for check in smoke.get("checks") or []:
        lines.append(f"  [{check['step']:>2}] {'PASS' if check['ok'] else 'FAIL'}: {check['name']}")
    if report.get("log_tail"):
        lines += ["", "Last lines of the studio log:"] + [f"  {line}" for line in report["log_tail"]]
    if report.get("install_log_tail"):
        lines += ["", "Last lines of the install log:"] + [f"  {line}" for line in report["install_log_tail"]]
    return "\n".join(lines) + "\n"


def tail(path: Path, count: int) -> list[str]:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return []
    return [redact(line)[:400] for line in lines[-count:]]


def write_report(work: Path, report: dict[str, Any]) -> tuple[Path, Path, Path]:
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    clean = redact_value(report)
    json_path = work / f"report-{stamp}.json"
    text_path = work / f"report-{stamp}.txt"
    json_path.write_text(json.dumps(clean, indent=2, default=str), encoding="utf-8")
    text_path.write_text(report_text(clean), encoding="utf-8")
    zip_path = work / f"nodestro-docker-report-{stamp}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.write(json_path, json_path.name)
        archive.write(text_path, text_path.name)
    return json_path, text_path, zip_path


# ---- the run ------------------------------------------------------------------------------------------------------


def say(text: str = "") -> None:
    print(text, flush=True)


def ask(question: str) -> bool:
    if not sys.stdin.isatty():
        return False
    try:
        return input(f"{question} [y/N] ").strip().lower() in ("y", "yes", "j", "ja")
    except EOFError:
        return False


def stop_commands(docker: str, environ: Mapping[str, str]) -> tuple[str | None, str | None]:
    """How to quit and start Docker Desktop here: ``docker desktop stop|start`` (Docker Desktop 4.37 and later), on
    macOS otherwise AppleScript and ``open``; ``(None, None)``: the person quits it by hand."""
    if docker and run([docker, "desktop", "version"], environ, 30)[0] == 0:
        return json.dumps([docker, "desktop", "stop"]), json.dumps([docker, "desktop", "start"])
    if sys.platform == "darwin":
        return json.dumps(["osascript", "-e", 'quit app "Docker"']), json.dumps(["open", "-a", "Docker"])
    if sys.platform == "win32":
        program_files = os.environ.get("PROGRAMFILES", r"C:\Program Files")
        exe = Path(program_files) / "Docker" / "Docker" / "Docker Desktop.exe"
        return None, json.dumps([str(exe)]) if exe.exists() else None
    return None, None


def run_smoke(python: Path, args: list[str], env: Mapping[str, str], log: Path, verbose: bool) -> int:
    """``docker_smoke.py`` with the installed studio; its output goes to ``log`` and, shortened, to the screen."""
    command = [str(python), "-u", str(REPO / "scripts" / "docker_smoke.py"), *args]
    with log.open("w", encoding="utf-8", errors="replace") as output:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env=dict(env),
            text=True,
            errors="replace",
            bufsize=1,
        )
        assert process.stdout is not None
        for line in process.stdout:
            output.write(line)
            output.flush()
            shown = line.rstrip("\n")
            if verbose or shown.startswith((">>>", "  .. sandbox status")):
                say(redact(shown))
            elif shown.startswith(("PASS: ", "FAIL: ")):
                say("  " + redact(shown.split(" | ", 1)[0]))
        return process.wait()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Nodestro's Docker sandbox test in one command (see the docstring).")
    parser.add_argument("--work", type=Path, default=DEFAULT_WORK, help=f"work folder (default {DEFAULT_WORK})")
    parser.add_argument("--keep", action="store_true", help="keep the virtual environment and the test data")
    parser.add_argument("--reinstall", action="store_true", help="install the studio again even if it is there")
    parser.add_argument(
        "--remove-images",
        action="store_true",
        help="also remove the sandbox image and base images this run pulled or built",
    )
    parser.add_argument("--context", help="Docker context to test (e.g. desktop-linux); default: the current one")
    parser.add_argument(
        "--stop-docker-desktop",
        action="store_true",
        help="really quit Docker Desktop for the last check and start it again (asks first)",
    )
    parser.add_argument("--stop-command", help="command that stops the engine (CI: colima stop)")
    parser.add_argument("--start-command", help="command that starts the engine again afterwards")
    parser.add_argument("--yes", action="store_true", help="do not ask before quitting Docker Desktop")
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="use this Python, where the studio is installed already (developers)",
    )
    parser.add_argument(
        "--ready-timeout",
        type=float,
        default=1200,
        help="seconds to wait for Docker to be approved (the first image build included)",
    )
    parser.add_argument("--verbose", action="store_true", help="show every line of the test on the screen")
    args = parser.parse_args(argv)
    with contextlib.suppress(AttributeError, ValueError):
        sys.stdout.reconfigure(errors="replace")  # type: ignore[union-attr]

    work: Path = args.work.expanduser().resolve()
    if not work_folder_usable(work):
        say(
            f"The work folder {work} is not empty and was not made by this test; choose another one with --work "
            "(the test deletes folders inside it)."
        )
        return 2
    work.mkdir(parents=True, exist_ok=True)
    (work / WORK_MARKER).touch()
    run_dir = work / "run"
    shutil.rmtree(run_dir, ignore_errors=True)
    run_dir.mkdir(parents=True)
    environ = dict(os.environ)
    if args.context:
        environ["DOCKER_CONTEXT"] = args.context
        environ.pop("DOCKER_HOST", None)
    report: dict[str, Any] = {
        "tool": "scripts/docker_test.py",
        "tool_version": VERSION,
        "time": datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S"),
        "repo": repo_state(),
        "options": {k: (str(v) if isinstance(v, Path) else v) for k, v in vars(args).items() if k != "work"},
    }
    say("Nodestro Docker sandbox test")
    say(f"  work folder: {redact(str(work))}")
    say("Step 0: looking at this computer and Docker (nothing is changed) ...")
    system = system_facts()
    docker = find_docker(environ)
    facts = docker_facts(docker, environ)
    report["system"], report["docker"], report["engine_kind"] = system, facts, engine_kind(facts)
    report["hints"] = hints(facts, system, docker_desktop_installed())
    info = facts.get("info") or {}
    say(
        f"  Docker: {report['engine_kind']} {facts.get('server_version') or ''} | context "
        f"{facts.get('context') or '-'} | {info.get('OSType') or '-'}/{info.get('Architecture') or '-'} | "
        f"cgroup v{info.get('CgroupVersion') or '?'}"
    )
    for hint in report["hints"]:
        say(f"  [{hint['level']}] {hint['text']}")
    fatal = any(h["level"] == "fatal" for h in report["hints"])

    smoke_code: int | None = None
    results_path = run_dir / "results.json"
    images_before: dict[str, list[str]] | None = None
    install_log = work / "install.log"
    try:
        if fatal:
            raise SystemExit(2)
        if args.skip_install:
            python = Path(sys.executable)
        else:
            missing = check_git_access(
                git_dependencies((REPO / "platform" / "internal.txt").read_text(encoding="utf-8")), environ
            )
            if missing:
                report["hints"].append(
                    {
                        "level": "fatal",
                        "text": (
                            "git cannot read these repositories without a password: "
                            + ", ".join(missing)
                            + ". Sign in to "
                            "GitHub for git once (for example: 'gh auth login', then 'gh auth setup-git'), "
                            "then run again."
                        ),
                    }
                )
                say("  [fatal] " + report["hints"][-1]["text"])
                fatal = True
                raise SystemExit(2)
            python = install(work, environ, report["repo"], install_log, args.reinstall)
        images_before = image_rows(docker, environ)
        smoke_args = [
            "--data-dir",
            str(run_dir / "data"),
            "--results",
            str(results_path),
            "--ready-timeout",
            f"{args.ready_timeout:g}",
        ]
        stop, start = args.stop_command, args.start_command
        if args.stop_docker_desktop and not stop:
            stop, start_default = stop_commands(docker, environ)
            start = start or start_default
            question = (
                "For the last check the test quits Docker Desktop and starts it again (about 1-2 minutes). "
                "Containers you have running in Docker Desktop stop as well. Continue?"
            )
            if args.yes or ask(question):
                if stop is None:
                    smoke_args.append("--stop-engine-prompt")
            else:
                say("  Docker Desktop is not quit; the check without Docker uses an unreachable address only.")
                stop = start = None
        if stop:
            smoke_args += ["--stop-engine", stop]
        if start and (stop or "--stop-engine-prompt" in smoke_args):
            smoke_args += ["--start-engine", start]
        report["real_stop"] = bool(stop) or "--stop-engine-prompt" in smoke_args
        say(
            "Steps 1-10: running the test with the real studio and Docker (the first run builds the sandbox image, "
            "which can take 5-15 minutes) ..."
        )
        smoke_code = run_smoke(python, smoke_args, child_environment(environ), run_dir / "smoke.log", args.verbose)
    except InstallFailed as error:
        report["error"] = f"The install failed: {error}. The report contains the end of the install log."
        report["install_log_tail"] = tail(install_log, 40)
        say(f"  [fatal] {report['error']}")
        fatal = True
    except SystemExit:
        pass
    except KeyboardInterrupt:
        report["error"] = "Stopped with Ctrl+C."
        say("  stopped with Ctrl+C; cleaning up ...")
    finally:
        smoke: dict[str, Any] = {}
        with contextlib.suppress(OSError, json.JSONDecodeError):
            smoke = json.loads(results_path.read_text(encoding="utf-8"))
        report["smoke"] = smoke
        report["smoke_exit_code"] = smoke_code
        report["log_tail"] = [line for line in tail(run_dir / "studio.log", 60) if line.strip()]
        owner = str((smoke.get("facts") or {}).get("owner") or docker_smoke.installation_owner(run_dir / "data"))
        removable = [] if args.keep else [run_dir, work / "venv", work / "cache"]
        report["cleanup"] = cleanup(
            docker, environ, owner, images_before, remove_images=args.remove_images, paths=removable
        )
        if args.keep:
            report["cleanup"]["notes"].append(f"kept (--keep): {run_dir}, {work / 'venv'}")
        report["steps"] = summarize(smoke.get("checks") or [], real_stop=bool(report.get("real_stop")))
        report["result"] = overall(report["steps"], fatal, smoke_code)
        _json_path, text_path, zip_path = write_report(work, report)

    say("")
    say("=" * 72)
    say(f"RESULT: {report['result']}")
    say("=" * 72)
    if report["result"] == "NOT RUN":
        say("The test could not run. What to do:")
    else:
        for row in report["steps"]:
            say(f"{row['step']:>2}. {row['status']:<7} {row['text']}")
    for hint in report["hints"]:
        if hint["level"] != "info":
            say(f"[{hint['level']}] {hint['text']}")
    say("")
    say("Report (no passwords or keys inside; please send the .zip file):")
    say(f"  {zip_path}")
    say(f"  {text_path}")
    if not args.remove_images and report["result"] != "NOT RUN":
        say("The sandbox image was kept, so the next run is faster (remove it with --remove-images).")
    return {"PASS": 0, "FAIL": 1}.get(report["result"], 2)


if __name__ == "__main__":
    raise SystemExit(main())

"""Helpers of the Tabrion compatibility workflow (TABRION QA-19/QA-20, .github/workflows/tabrion-compat.yml).

Usage::

    python -I scripts/tabrion_compat.py lock --commit SHA [--lock FILE] --out FILE
    python -I scripts/tabrion_compat.py installed --commit SHA
    python -I scripts/tabrion_compat.py smoke CELL
    python -I scripts/tabrion_compat.py negative [--pip SPEC] [--work DIR] [--summary FILE]

``lock`` writes a copy of the studio lock (default ``platform/internal-server.txt``) in which only the ``tabrion``
line names ``SHA`` instead of the locked commit; every other line stays byte for byte (QA-20: the consumers at their
locked commits against Tabrion master). It fails unless the lock has exactly one ``tabrion @ git+URL@<40 hex>`` line.

``installed`` checks the ``tabrion`` of the interpreter that runs it: its ``direct_url.json`` names the Tabrion
repository at ``SHA`` (an index install or another commit fails). Run it with the virtual environment's python.

``smoke`` imports the packages of one QA-19 cell (``orkexa``, ``axentra-orkexa``, ``server``, ``runtime-core``) in
the interpreter that runs it and makes one small call through Tabrion in each: no server, no network.

``negative`` (QA-19 AC-4 d) proves that pip refuses the installs the lock rules forbid, with local artifacts only.
It writes small synthetic wheels (``tabrion`` 0.2.0, 0.2.1, 0.2.2.dev0, 0.3.0a1 and a consumer ``qa19-consumer``
that requires ``tabrion>=0.2,<0.3``, the range every component declares) and runs each case as a real
``pip install --no-index`` in a fresh virtual environment whose pip is ``SPEC`` (``pip==25.0``, ``pip`` for the
latest; empty keeps the pip that ``venv`` bundles, which needs no network). A negative case passes only when pip
fails, its output names the expected reason and neither ``tabrion`` nor the consumer got installed; a control case
passes only when the install succeeds with the expected ``tabrion``. No index is ever asked for ``tabrion``:
``--no-index`` on every install, an empty pip configuration and no ``PIP_*`` variables from the caller.

Standard library only. Every line of output starts with ``tabrion_compat:``; ``negative`` ends with GREEN or RED.
"""

from __future__ import annotations

import argparse
import base64
from collections.abc import Callable, Sequence
from dataclasses import dataclass
import hashlib
import importlib
from importlib import metadata
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "platform" / "internal-server.txt"
TABRION_URL = "https://github.com/peterkarlhuber/tabrion.git"
SHA = re.compile(r"^[0-9a-f]{40}$")
TABRION_LINE = re.compile(
    r"^tabrion(?P<extras>\[[^\]]*\])?\s*@\s*git\+(?P<url>https://github\.com/peterkarlhuber/tabrion(?:\.git)?)"
    r"@(?P<sha>[0-9a-f]{40})\s*$"
)
#: The range every component declares for Tabrion (VER-1); the negative cases resolve against it.
RANGE = ">=0.2,<0.3"
CONSUMER = "qa19-consumer"
PREFIX = "tabrion_compat:"


def say(message: str) -> None:
    print(f"{PREFIX} {message}", flush=True)


class CompatError(Exception):
    """A problem that ends the command; the message is one line."""


# --------------------------------------------------------------------------------------------------------------------
# lock: the studio lock with Tabrion at another commit
# --------------------------------------------------------------------------------------------------------------------


def lock_at(text: str, commit: str) -> str:
    """``text`` (a lock) with the commit of its one ``tabrion`` line replaced by ``commit``; nothing else changes."""
    if not SHA.match(commit):
        raise CompatError(f"{commit!r} is not a full 40-hex commit SHA")
    lines = text.splitlines(keepends=True)
    named = [i for i, line in enumerate(lines) if re.match(r"^\s*tabrion\s*[\[@=<>!~;]", line)]
    hits = [i for i in named if TABRION_LINE.match(lines[i].rstrip("\r\n"))]
    if len(named) != 1 or len(hits) != 1:
        raise CompatError(
            f"the lock must have exactly one tabrion line, 'tabrion @ git+{TABRION_URL}@<40 hex>' "
            f"({len(named)} tabrion lines, {len(hits)} of that form)"
        )
    index = hits[0]
    line = lines[index]
    found = TABRION_LINE.match(line.rstrip("\r\n"))
    assert found is not None
    lines[index] = line[: found.start("sha")] + commit + line[found.end("sha") :]
    return "".join(lines)


def cmd_lock(args: argparse.Namespace) -> int:
    text = Path(args.lock).read_text(encoding="utf-8")
    new = lock_at(text, args.commit)
    Path(args.out).write_text(new, encoding="utf-8")
    old_line = next(line for line in text.splitlines() if TABRION_LINE.match(line))
    new_line = next(line for line in new.splitlines() if TABRION_LINE.match(line))
    say(f"lock {args.out}: only the tabrion line changed")
    say(f"  - {old_line}")
    say(f"  + {new_line}")
    return 0


# --------------------------------------------------------------------------------------------------------------------
# installed: the environment's tabrion is the given commit
# --------------------------------------------------------------------------------------------------------------------


def installed_problem(direct_url: str | None, commit: str) -> str | None:
    """Why a ``direct_url.json`` text is not Tabrion's repository at ``commit`` (None: it is)."""
    if direct_url is None:
        return "tabrion has no direct_url.json: it was installed from a package index"
    try:
        data = json.loads(direct_url)
    except ValueError:
        return "tabrion's direct_url.json does not parse"
    url = str(data.get("url", "")).removesuffix("/").removesuffix(".git")
    vcs = data.get("vcs_info") if isinstance(data.get("vcs_info"), dict) else {}
    if url != TABRION_URL.removesuffix(".git"):
        return f"tabrion comes from {data.get('url')!r}, not {TABRION_URL}"
    if vcs.get("commit_id") != commit:
        return f"tabrion is commit {vcs.get('commit_id')}, expected {commit}"
    return None


def cmd_installed(args: argparse.Namespace) -> int:
    dist = metadata.distribution("tabrion")
    problem = installed_problem(dist.read_text("direct_url.json"), args.commit)
    if problem:
        say(f"FAIL {problem}")
        return 1
    say(f"tabrion {dist.version} from {TABRION_URL}@{args.commit}")
    return 0


# --------------------------------------------------------------------------------------------------------------------
# smoke: imports and one small call per QA-19 cell
# --------------------------------------------------------------------------------------------------------------------


def _tabrion_calls() -> str:
    from tabrion.config import safe_url
    from tabrion.sql import split_statements

    masked = safe_url("postgresql://user:s3cret@db.invalid/app")
    if "s3cret" in masked:
        raise CompatError(f"tabrion.config.safe_url leaked the password: {masked}")
    statements = split_statements("SELECT 1; SELECT ';'")
    if len(statements) != 2:
        raise CompatError(f"tabrion.sql.split_statements gave {statements!r}")
    importlib.import_module("tabrion.postgres")  # the postgres extra (psycopg) of every cell
    return f"tabrion {metadata.version('tabrion')}: safe_url, split_statements, tabrion.postgres"


def _orkexa_calls(work: Path) -> str:
    from orkexa.backends.sqlite import SQLiteMemory

    importlib.import_module("orkexa.backends.postgres")
    with SQLiteMemory(work / "memory.db") as memory:  # opens the file through tabrion.sqlite
        capabilities = sorted(memory.capabilities)
    return f"orkexa {metadata.version('orkexa')}: SQLiteMemory {capabilities}, orkexa.backends.postgres"


def _axentra_calls() -> str:
    # By name: the studio itself never installs axentra (server profile only), so mypy cannot see it here.
    split_statements = importlib.import_module("axentra.data.migrations").split_statements  # from tabrion.sql

    importlib.import_module("axentra.core.db_errors")
    importlib.import_module("axentra.data.database")
    if len(split_statements("SELECT 1; SELECT 2")) != 2:
        raise CompatError("axentra.data.migrations.split_statements did not split two statements")
    return f"axentra {metadata.version('axentra')}: split_statements, db_errors, data.database"


def _server_calls(work: Path) -> str:
    for module in ("nodestro_runtime", "nodestro_api", "nodestro_api.server_app"):
        importlib.import_module(module)
    return (
        f"nodestro-api {metadata.version('nodestro-api')} (server_app), "
        f"nodestro-runtime {metadata.version('nodestro-runtime')}"
    )


def _runtime_core_calls() -> str:
    importlib.import_module("nodestro_runtime")
    for absent in ("psycopg", "axentra"):
        if importlib.util.find_spec(absent) is not None:
            raise CompatError(f"{absent} is installed: the runtime core install must not pull the server extras")
    from tabrion.config import safe_url

    if "s3cret" in safe_url("postgresql://user:s3cret@db.invalid/app"):
        raise CompatError("tabrion.config.safe_url leaked the password")
    return f"nodestro-runtime {metadata.version('nodestro-runtime')} without psycopg and axentra; tabrion safe_url"


CELLS: dict[str, Callable[[Path], list[str]]] = {
    "orkexa": lambda work: [_tabrion_calls(), _orkexa_calls(work)],
    "axentra-orkexa": lambda work: [_tabrion_calls(), _axentra_calls(), _orkexa_calls(work)],
    "server": lambda work: [_tabrion_calls(), _axentra_calls(), _orkexa_calls(work), _server_calls(work)],
    "runtime-core": lambda work: [_runtime_core_calls()],
}


def cmd_smoke(args: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory(prefix="tabrion-smoke-") as work:
        try:
            for line in CELLS[args.cell](Path(work)):
                say(f"ok {line}")
        except Exception as exc:
            say(f"FAIL {args.cell}: {type(exc).__name__}: {exc}")
            return 1
    say(f"smoke {args.cell} GREEN")
    return 0


# --------------------------------------------------------------------------------------------------------------------
# negative: installs pip must refuse (QA-19 AC-4 d)
# --------------------------------------------------------------------------------------------------------------------


def _record_hash(data: bytes) -> str:
    return "sha256=" + base64.urlsafe_b64encode(hashlib.sha256(data).digest()).rstrip(b"=").decode()


def build_wheel(directory: Path, name: str, version: str, *, requires: Sequence[str] = (), tag: str = "") -> Path:
    """A minimal valid pure-Python wheel ``name``-``version`` in ``directory`` (``tag`` marks one build apart)."""
    directory.mkdir(parents=True, exist_ok=True)
    module = name.replace("-", "_")
    info = f"{module}-{version}.dist-info"
    meta = ["Metadata-Version: 2.1", f"Name: {name}", f"Version: {version}"]
    meta += [f"Requires-Dist: {requirement}" for requirement in requires]
    files = {
        f"{module}/__init__.py": f'__version__ = "{version}"\nBUILD = "{tag}"\n'.encode(),
        f"{info}/METADATA": ("\n".join(meta) + "\n").encode(),
        f"{info}/WHEEL": b"Wheel-Version: 1.0\nGenerator: tabrion_compat\nRoot-Is-Purelib: true\nTag: py3-none-any\n",
    }
    record = "".join(f"{path},{_record_hash(data)},{len(data)}\n" for path, data in files.items())
    record += f"{info}/RECORD,,\n"
    path = directory / f"{module}-{version}-py3-none-any.whl"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as wheel:
        for name_in_zip, data in files.items():
            wheel.writestr(name_in_zip, data)
        wheel.writestr(f"{info}/RECORD", record)
    return path


@dataclass(frozen=True)
class Artifacts:
    root: Path

    def wheel(self, folder: str, version: str) -> Path:
        return self.root / folder / f"tabrion-{version}-py3-none-any.whl"

    def requirement(self, folder: str, version: str) -> str:
        return f"tabrion @ {self.wheel(folder, version).as_uri()}"


def build_artifacts(root: Path) -> Artifacts:
    """The local artifacts of the negative cases: pins in their own folders, and three find-links indexes."""
    for folder, version in (("pin-a", "0.2.1"), ("pin-b", "0.2.0"), ("pin-c", "0.2.1"), ("pin-dev", "0.2.2.dev0")):
        build_wheel(root / folder, "tabrion", version, tag=folder)
    build_wheel(root / "pin-alpha", "tabrion", "0.3.0a1", tag="pin-alpha")
    indexes = {"index-dev": ["0.2.2.dev0"], "index-alpha": ["0.3.0a1"], "index-final": ["0.2.1", "0.2.2.dev0"]}
    for folder, versions in indexes.items():
        for version in versions:
            build_wheel(root / folder, "tabrion", version, tag=folder)
        build_wheel(root / folder, CONSUMER, "1.0", requires=[f"tabrion{RANGE}"])
    for folder in ("pin-a", "pin-b", "pin-c"):
        version = "0.2.0" if folder == "pin-b" else "0.2.1"
        (root / f"{folder}.txt").write_text(Artifacts(root).requirement(folder, version) + "\n", encoding="utf-8")
    return Artifacts(root)


@dataclass(frozen=True)
class Case:
    name: str
    what: str
    args: Callable[[Artifacts], list[str]]
    reason: re.Pattern[str] | None
    """The output pattern that names the expected refusal; None for a control case, which must succeed."""
    version: str | None = None
    """A control case's expected tabrion version."""
    pips: tuple[tuple[int, ...], tuple[int, ...]] = ((0,), (999,))
    """The pip versions the case applies to: from the first (inclusive) to the second (exclusive)."""

    def applies(self, pip_version: str) -> bool:
        return self.pips[0] <= version_tuple(pip_version) < self.pips[1]


def version_tuple(text: str) -> tuple[int, ...]:
    """``26.0.1`` -> ``(26, 0, 1)``; stops at the first part that is not a number."""
    parts: list[int] = []
    for part in text.split("."):
        if not part.isdigit():
            break
        parts.append(int(part))
    return tuple(parts)


#: pip 26.0 changed the selection: when no final release satisfies a specifier, pip takes a pre-release that does
#: (observed on 26.0 to 26.3), and added ``--only-final <names>`` to forbid that per package.
PIP_PRERELEASE_FALLBACK = (26, 0)


def _two_pins(first: str, second: str) -> re.Pattern[str]:
    """pip's refusal of two direct-URL requirements on tabrion: "Cannot install tabrion A (from ...) and tabrion B
    (from ...) because these package versions have conflicting dependencies" (either order)."""
    a, b = re.escape(first), re.escape(second)
    pins = rf"(tabrion {a} \(from [^)]*\) and tabrion {b} \(from |tabrion {b} \(from [^)]*\) and tabrion {a} \(from )"
    return re.compile(rf"ERROR: Cannot install {pins}[^\n]*conflicting dependencies")


def _not_in_range(versions: str) -> re.Pattern[str]:
    """pip saw only ``versions`` of tabrion and none satisfies the consumer's final range: the pre-release was found
    and rejected, it was not merely missing."""
    return re.compile(
        r"ERROR: Could not find a (?:final )?version that satisfies the requirement tabrion<0\.3,>=0\.2 "
        r"\(from qa19-consumer\) "
        rf"\(from versions: {re.escape(versions)}\)[\s\S]*ERROR: No matching distribution found for tabrion<0\.3,>=0\.2"
    )


#: The consumer's range and a direct pin on 0.3.0a1 conflict; pip names both sides of the conflict (the explanation
#: goes to stdout, the ERROR line to stderr, so the two parts are matched independently of their order).
ALPHA_PIN = re.compile(
    r"\A(?=[\s\S]*ERROR: Cannot install qa19-consumer==1\.0 and tabrion 0\.3\.0a1 \(from [^)]*\)[^\n]*"
    r"conflicting dependencies)"
    r"(?=[\s\S]*qa19-consumer 1\.0 depends on tabrion(<0\.3 and >=0\.2|<0\.3,>=0\.2|>=0\.2,<0\.3))"
)

CASES: tuple[Case, ...] = (
    Case(
        "two-pins",
        "two tabrion pins (0.2.1 and 0.2.0) in one install (-r -r)",
        lambda a: ["-r", str(a.root / "pin-a.txt"), "-r", str(a.root / "pin-b.txt")],
        _two_pins("0.2.1", "0.2.0"),
    ),
    Case(
        "two-pins-same-version",
        "two tabrion pins of the same version 0.2.1 from different sources (two commits)",
        lambda a: ["-r", str(a.root / "pin-a.txt"), "-r", str(a.root / "pin-c.txt")],
        _two_pins("0.2.1", "0.2.1"),
    ),
    Case(
        "dev-from-index",
        f"only tabrion 0.2.2.dev0 in a local index, consumer requires tabrion{RANGE}",
        lambda a: ["--find-links", str(a.root / "index-dev"), CONSUMER],
        _not_in_range("0.2.2.dev0"),
        pips=((0,), PIP_PRERELEASE_FALLBACK),
    ),
    Case(
        "dev-from-index-fallback",
        "DEVIATION: the same on pip >= 26.0 installs 0.2.2.dev0 (no final release satisfies the range); asserted so "
        "that a change of pip's behavior is noticed",
        lambda a: ["--find-links", str(a.root / "index-dev"), CONSUMER],
        None,
        "0.2.2.dev0",
        pips=(PIP_PRERELEASE_FALLBACK, (999,)),
    ),
    Case(
        "dev-from-index-only-final",
        "the same with --only-final tabrion (pip >= 26.0): refused",
        lambda a: ["--only-final", "tabrion", "--find-links", str(a.root / "index-dev"), CONSUMER],
        _not_in_range("0.2.2.dev0"),
        pips=(PIP_PRERELEASE_FALLBACK, (999,)),
    ),
    Case(
        "alpha-from-index",
        f"only tabrion 0.3.0a1 in a local index, consumer requires tabrion{RANGE}",
        lambda a: ["--find-links", str(a.root / "index-alpha"), CONSUMER],
        _not_in_range("0.3.0a1"),
    ),
    Case(
        "alpha-from-index-pre",
        "the same with --pre: <0.3 excludes 0.3 pre-releases (PEP 440)",
        lambda a: ["--pre", "--find-links", str(a.root / "index-alpha"), CONSUMER],
        _not_in_range("0.3.0a1"),
    ),
    Case(
        "alpha-pin",
        f"a direct pin on tabrion 0.3.0a1 with the consumer (tabrion{RANGE})",
        lambda a: ["--find-links", str(a.root / "index-alpha"), CONSUMER, a.requirement("pin-alpha", "0.3.0a1")],
        ALPHA_PIN,
    ),
    Case(
        "control-final",
        "control: 0.2.1 and 0.2.2.dev0 in the index, the consumer gets the final 0.2.1",
        lambda a: ["--find-links", str(a.root / "index-final"), CONSUMER],
        None,
        "0.2.1",
    ),
    Case(
        "control-dev-pin",
        "control: a direct pin on 0.2.2.dev0 satisfies the range (the QA-20 path; RC-8 is the lock check's job)",
        lambda a: ["--find-links", str(a.root / "index-final"), CONSUMER, a.requirement("pin-dev", "0.2.2.dev0")],
        None,
        "0.2.2.dev0",
    ),
)


def clean_env() -> dict[str, str]:
    """The caller's environment without pip settings, with an empty pip configuration: no index can sneak in."""
    env = {key: value for key, value in os.environ.items() if not key.upper().startswith(("PIP_", "UV_"))}
    env.update(PIP_CONFIG_FILE=os.devnull, PIP_DISABLE_PIP_VERSION_CHECK="1", PIP_NO_INPUT="1")
    return env


def venv_python(venv: Path) -> Path:
    return venv / "Scripts" / "python.exe" if os.name == "nt" else venv / "bin" / "python"


def fresh_venv(path: Path, pip: str) -> tuple[Path, str]:
    """A new virtual environment with pip ``pip`` (a requirement such as ``pip==25.0``; empty: the bundled one)."""
    subprocess.run([sys.executable, "-m", "venv", str(path)], check=True, timeout=300)
    python = venv_python(path)
    if pip:
        # pip itself comes from the default index (PyPI); tabrion never does.
        subprocess.run(
            [str(python), "-m", "pip", "install", "-q", "--disable-pip-version-check", "--upgrade", pip],
            check=True,
            timeout=600,
        )
    version = subprocess.run(
        [str(python), "-I", "-c", "import importlib.metadata as m; print(m.version('pip'))"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    return python, version


def _installed(python: Path, name: str) -> str | None:
    code = f"import importlib.metadata as m\ntry: print(m.version({name!r}))\nexcept m.PackageNotFoundError: pass"
    out = subprocess.run([str(python), "-I", "-c", code], check=True, capture_output=True, text=True).stdout.strip()
    return out or None


@dataclass
class Outcome:
    case: Case
    pip: str
    passed: bool
    detail: str


def run_case(case: Case, artifacts: Artifacts, venv: Path, pip: str) -> Outcome:
    python, pip_version = fresh_venv(venv, pip)
    command = [str(python), "-m", "pip", "install", "--no-cache-dir", "--no-index", *case.args(artifacts)]
    result = subprocess.run(
        command, env=clean_env(), capture_output=True, text=True, check=False, timeout=600, cwd=artifacts.root
    )
    output = result.stdout + result.stderr
    tabrion = _installed(python, "tabrion")
    consumer = _installed(python, CONSUMER)
    if case.reason is None:
        ok = result.returncode == 0 and tabrion == case.version
        detail = f"exit {result.returncode}, installed tabrion {tabrion}" + (
            "" if ok else f" (expected {case.version})"
        )
    else:
        matched = case.reason.search(output) is not None
        ok = result.returncode != 0 and matched and tabrion is None and consumer is None
        lines = [line.strip() for line in output.splitlines() if line.strip().startswith("ERROR")]
        detail = f"exit {result.returncode}; " + (lines[0] if lines else "no ERROR line")
        detail = detail.replace(str(artifacts.root), "<artifacts>")
        if not matched:
            detail += "; the output does not name the expected reason"
        if tabrion or consumer:
            detail += f"; installed anyway (tabrion {tabrion}, {CONSUMER} {consumer})"
    if not ok:
        print(output, file=sys.stderr)
    return Outcome(case, pip_version, ok, detail)


def report(outcomes: Sequence[Outcome]) -> str:
    rows = ["| Case | What | pip | Expected | Result | Detail |", "|---|---|---|---|---|---|"]
    for item in outcomes:
        expected = "install" if item.case.reason is None else "refused"
        result = "pass" if item.passed else "**FAIL**"
        detail = item.detail.replace("|", "\\|")
        rows.append(f"| {item.case.name} | {item.case.what} | {item.pip} | {expected} | {result} | {detail} |")
    return "\n".join(rows) + "\n"


def cmd_negative(args: argparse.Namespace) -> int:
    work = Path(args.work) if args.work else Path(tempfile.mkdtemp(prefix="tabrion-negative-"))
    work.mkdir(parents=True, exist_ok=True)
    artifacts = build_artifacts(work / "artifacts")
    _, pip_version = fresh_venv(work / "venv-probe", args.pip)
    say(f"pip {pip_version} ({args.pip or 'bundled with venv'}); every case in a fresh virtual environment")
    selected = [case for case in CASES if case.applies(pip_version) and (not args.case or case.name in args.case)]
    outcomes = []
    for case in selected:
        outcome = run_case(case, artifacts, work / f"venv-{case.name}", args.pip)
        say(f"{'pass' if outcome.passed else 'FAIL'} {case.name} (pip {outcome.pip}): {outcome.detail}")
        outcomes.append(outcome)
    table = report(outcomes)
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(
                f"### QA-19 negative resolution cases (pip {outcomes[0].pip if outcomes else '-'})\n\n{table}\n"
            )
    green = bool(outcomes) and all(item.passed for item in outcomes)
    say("negative cases GREEN" if green else "negative cases RED")
    return 0 if green else 1


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    lock = sub.add_parser("lock", help="the studio lock with tabrion at another commit")
    lock.add_argument("--lock", default=str(LOCK))
    lock.add_argument("--commit", required=True)
    lock.add_argument("--out", required=True)
    installed = sub.add_parser("installed", help="the installed tabrion is this commit")
    installed.add_argument("--commit", required=True)
    smoke = sub.add_parser("smoke", help="imports and one small call of a QA-19 cell")
    smoke.add_argument("cell", choices=sorted(CELLS))
    negative = sub.add_parser("negative", help="installs pip must refuse (local artifacts only)")
    negative.add_argument("--pip", default="", help="pip requirement for each fresh venv (empty: the bundled pip)")
    negative.add_argument("--work", help="work directory (default: a new temporary one)")
    negative.add_argument("--case", action="append", choices=[case.name for case in CASES])
    negative.add_argument("--summary", help="append the Markdown table to this file")
    args = parser.parse_args(argv)
    commands: dict[str, Callable[[argparse.Namespace], int]] = {
        "lock": cmd_lock,
        "installed": cmd_installed,
        "smoke": cmd_smoke,
        "negative": cmd_negative,
    }
    try:
        return commands[args.command](args)
    except CompatError as exc:
        say(f"FAIL {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

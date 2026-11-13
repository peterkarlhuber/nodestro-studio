"""scripts/check_tabrion_source.py: the negative dependency-confusion test against a poisoned index (DC-NS-2).

Offline: the poisoned index serves only ``tabrion``, the RED cases install it from there with ``pip --target``, and
the GREEN case installs a benign ``tabrion`` from a local git repository pinned by its commit (``git+file://``) plus
one other package through the index, from a local stand-in for PyPI. The poisoned wheel forges its
``direct_url.json``, so the RED case shows that only the zero-request assertion catches it.
"""

from __future__ import annotations

import base64
from collections.abc import Iterator
import contextlib
import functools
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import sys
import tarfile
import threading
from typing import Any
import urllib.error
import urllib.request
import zipfile

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import check_tabrion_source as cts

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_tabrion_source.py"
#: SHA-256 of the canonical script. The consumers' copies (nodestro-runtime, nodestro-api, orkexa) pin the same
#: hash, so a change here means new copies there (see the script's docstring).
SCRIPT_SHA256 = "8496bd63327dbee897966bd9d99296d479e2c1c0c55baa9018ee8dba50ab177f"
SHA = "d5821faa8742dea012abda3b663549c038d76543"
URL = "https://github.com/peterkarlhuber/tabrion.git"
LOCK = f"""# a lock
axentra @ git+https://github.com/peterkarlhuber/axentra.git@{"a" * 40}
tabrion[testing] @ git+{URL}@{SHA}  # the pin
"""
needs_pip = pytest.mark.skipif(
    subprocess.run([sys.executable, "-m", "pip", "--version"], capture_output=True, check=False).returncode != 0,
    reason="this interpreter has no pip",
)


def test_the_script_is_the_canonical_copy() -> None:
    assert hashlib.sha256(SCRIPT.read_bytes()).hexdigest() == SCRIPT_SHA256


def test_the_pins_come_from_name_at_git_url_at_full_commit_lines() -> None:
    text = LOCK + "tabrion @ git+https://example.invalid/other.git@" + "f" * 40 + "\nTabrion-Studio @ git+X@" + "b" * 39
    assert cts.read_pins(text, ["tabrion", "tabrion-studio"]) == {"tabrion": cts.Pin(URL, SHA)}
    assert cts.read_pins("# tabrion @ git+X@" + "a" * 40, ["tabrion"]) == {}


@pytest.mark.parametrize(
    ("found", "problem"),
    [
        (None, "tabrion: not installed, the lock pins"),
        ({"version": "0.1.0", "direct_url": None}, "tabrion 0.1.0: not installed from a pinned commit"),
        ({"version": "0.1.0", "direct_url": {"url": "file:///src", "dir_info": {}}}, "not a git install"),
        (
            {"version": "0.1.0", "direct_url": {"url": "https://evil.invalid/tabrion.git", "vcs_info": {"vcs": "git"}}},
            "tabrion: installed from https://evil.invalid/tabrion.git",
        ),
        (
            {"version": "0.1.0", "direct_url": {"url": URL, "vcs_info": {"vcs": "git", "commit_id": "e" * 40}}},
            f"tabrion: installed commit eeeeeeeeeeee, the lock pins {SHA[:12]}",
        ),
    ],
)
def test_an_installed_tabrion_not_from_the_pin_fails(found: dict[str, Any] | None, problem: str) -> None:
    problems = cts.check_installed("tabrion", found, cts.Pin(URL, SHA))
    assert len(problems) == 1
    assert problem in problems[0]


@pytest.mark.parametrize("url", [URL, URL.removesuffix(".git"), URL + "/"])
def test_the_pinned_commit_passes_in_any_url_spelling(url: str) -> None:
    found = {"version": "0.1.0", "direct_url": {"url": url, "vcs_info": {"vcs": "git", "commit_id": SHA}}}
    assert cts.check_installed("tabrion", found, cts.Pin(URL, SHA)) == []


def test_the_poisoned_wheel_is_valid_and_runs_code_at_startup(tmp_path: Path) -> None:
    marker = tmp_path / "marker"
    wheel = cts.build_wheel("tabrion-studio", marker, tmp_path, cts.Pin(URL, SHA))
    assert wheel.name == "tabrion_studio-0.1.0-py3-none-any.whl"
    with zipfile.ZipFile(wheel) as archive:
        record = archive.read("tabrion_studio-0.1.0.dist-info/RECORD").decode().splitlines()
        for line in record:
            path, digest, _size = line.split(",")
            if digest:
                data = archive.read(path)
                expected = base64.urlsafe_b64encode(hashlib.sha256(data).digest()).rstrip(b"=").decode()
                assert digest == f"sha256={expected}", path
        metadata = archive.read("tabrion_studio-0.1.0.dist-info/METADATA").decode()
        forged = json.loads(archive.read("tabrion_studio-0.1.0.dist-info/direct_url.json"))
        pth = archive.read("tabrion_studio_poison.pth").decode()
    assert "Version: 0.1.0" in metadata
    assert forged == {"url": URL, "vcs_info": {"vcs": "git", "commit_id": SHA}}  # what pip writes for the pin
    assert "Provides-Extra: testing" in metadata
    assert pth.startswith("import ")
    exec(pth.removeprefix("import builtins; "))  # what site.py does at startup
    assert marker.read_text(encoding="utf-8") == "tabrion-studio .pth\n"
    marker.parent.joinpath("gone").mkdir()
    exec(cts._marker_code(tmp_path / "gone" / "missing" / "marker", "x"))  # never raises once the dir is gone


def test_the_poisoned_sdist_writes_the_marker_when_built(tmp_path: Path) -> None:
    marker = tmp_path / "marker"
    sdist = cts.build_sdist("tabrion", marker, tmp_path)
    with tarfile.open(sdist) as archive:
        archive.extractall(tmp_path / "src", filter="data")
    tree = tmp_path / "src" / "tabrion-0.1.0"
    assert 'build-backend = "poison_backend"' in (tree / "pyproject.toml").read_text(encoding="utf-8")
    code = "import poison_backend; poison_backend.build_wheel('.')"
    result = subprocess.run([sys.executable, "-c", code], cwd=tree, capture_output=True, text=True, check=False)
    assert result.returncode != 0
    assert "the POISONED sdist was built" in result.stderr
    assert marker.read_text(encoding="utf-8") == "tabrion sdist build\n"


def get(url: str, accept: str = "text/html") -> tuple[int, bytes, str]:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args: Any) -> None:
            return None

    opener = urllib.request.build_opener(NoRedirect, urllib.request.ProxyHandler({}))
    try:
        with opener.open(urllib.request.Request(url, headers={"Accept": accept})) as response:
            return response.status, response.read(), response.headers.get("Content-Type", "")
    except urllib.error.HTTPError as exc:
        return exc.code, b"", exc.headers.get("Location", "")


def test_the_index_serves_and_logs_the_poisoned_name_and_redirects_every_other(tmp_path: Path) -> None:
    files = {
        "tabrion": [
            cts.build_wheel("tabrion", tmp_path / "m", tmp_path),
            cts.build_sdist("tabrion", tmp_path / "m", tmp_path),
        ]
    }
    with cts.PoisonedIndex(files, "https://upstream.invalid/simple/") as index:
        status, body, _ = get(f"{index.url}/Tabrion/")
        assert status == 200
        assert b"tabrion-0.1.0-py3-none-any.whl#sha256=" in body
        assert b"tabrion-0.1.0.tar.gz#sha256=" in body
        status, body, content_type = get(f"{index.url}/tabrion/", "application/vnd.pypi.simple.v1+json")
        assert content_type == "application/vnd.pypi.simple.v1+json"
        page = json.loads(body)
        assert [file["upload-time"] for file in page["files"]] == [cts.UPLOAD_TIME] * 2
        status, body, _ = get(page["files"][0]["url"])
        assert (status, body) == (200, files["tabrion"][0].read_bytes())
        assert index.hits == [
            "GET /simple/Tabrion/",
            "GET /simple/tabrion/",
            "GET /files/tabrion-0.1.0-py3-none-any.whl",
        ]
        index.reset()
        assert get(f"{index.url}/Pytest_Asyncio/") == (302, b"", "https://upstream.invalid/simple/Pytest_Asyncio/")
        assert get(f"{index.url}/../etc/passwd")[0] == 404
        assert index.hits == []


def test_the_command_sees_the_poisoned_index_and_no_proxy_for_it() -> None:
    env = cts.child_environment("http://127.0.0.1:1/simple", {"NO_PROXY": "corp", "PIP_INDEX_URL": "x"})
    assert (
        env["PIP_INDEX_URL"] == env["UV_INDEX_URL"] == env["CHECK_TABRION_SOURCE_INDEX"] == "http://127.0.0.1:1/simple"
    )
    assert env["NO_PROXY"] == "corp,127.0.0.1,localhost"
    assert env["no_proxy"] == "127.0.0.1,localhost"


def lock_file(tmp_path: Path, text: str = LOCK) -> Path:
    lock = tmp_path / "lock.txt"
    lock.write_text(text, encoding="utf-8")
    return lock


def cli(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, "-I", str(SCRIPT), *args], capture_output=True, text=True, check=False)


def pip_target(target: Path, *args: str) -> list[str]:
    return [sys.executable, "-m", "pip", "install", "--no-deps", "--no-cache-dir", "--target", str(target), *args]


@needs_pip
def test_an_install_by_range_takes_the_forged_wheel_and_only_the_zero_request_assertion_is_red(tmp_path: Path) -> None:
    target = tmp_path / "site"
    result = cli(
        "--lock", str(lock_file(tmp_path)), "--path", str(target), "--", *pip_target(target, "tabrion>=0.1,<0.2")
    )
    assert result.returncode == 1, result.stdout
    out = result.stdout
    assert "check_tabrion_source: ok   control: pip install --dry-run tabrion chooses the poisoned 0.1.0" in out
    # pip kept the wheel's forged direct_url.json: the origin check passes, it is detection, not proof.
    assert f"check_tabrion_source: ok   tabrion 0.1.0: direct_url.json names {URL}@{SHA[:12]}" in out
    assert "check_tabrion_source: FAIL the index was asked for a poisoned name: GET /simple/tabrion/" in out
    assert out.splitlines()[-1] == "check_tabrion_source: RED (2 problem(s))"  # the page and the wheel


@needs_pip
def test_building_the_poisoned_sdist_leaves_the_marker_and_is_red(tmp_path: Path) -> None:
    target = tmp_path / "site"
    command = pip_target(target, "--no-binary", "tabrion", "tabrion")
    result = cli("--lock", str(lock_file(tmp_path)), "--path", str(target), "--no-control", "--", *command)
    assert result.returncode == 1
    assert "check_tabrion_source: FAIL the command exited with 1" in result.stdout
    assert "check_tabrion_source: FAIL the poisoned release ran code: marker ['tabrion sdist build'" in result.stdout


def benign_tabrion_repository(tmp_path: Path) -> tuple[Path, str]:
    """A git repository whose in-tree backend 'builds' a benign tabrion 0.1.0 wheel (no network, no build deps)."""
    repo = tmp_path / "tabrion-repo"
    repo.mkdir()
    wheel_dir = tmp_path / "benign"
    wheel_dir.mkdir()
    built = cts.build_wheel("tabrion", tmp_path / "unused", wheel_dir)
    benign = repo / "tabrion-0.1.0-py3-none-any.whl"
    with zipfile.ZipFile(built) as source, zipfile.ZipFile(benign, "w") as wheel:
        for item in source.namelist():
            if item.endswith(".pth") or item.endswith("RECORD"):
                continue
            data = b"POISONED = False\n" if item.endswith("__init__.py") else source.read(item)
            wheel.writestr(item, data)
        wheel.writestr("tabrion-0.1.0.dist-info/RECORD", "")
    (repo / "pyproject.toml").write_text(
        '[build-system]\nrequires = []\nbuild-backend = "backend"\nbackend-path = ["."]\n', encoding="utf-8"
    )
    (repo / "backend.py").write_text(
        "import pathlib, shutil\n"
        "def build_wheel(wheel_directory, config_settings=None, metadata_directory=None):\n"
        "    shutil.copy(pathlib.Path(__file__).with_name('tabrion-0.1.0-py3-none-any.whl'), wheel_directory)\n"
        "    return 'tabrion-0.1.0-py3-none-any.whl'\n",
        encoding="utf-8",
    )

    def git(*args: str) -> str:
        return subprocess.run(
            ["git", "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", *args],
            cwd=repo,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()

    git("init", "-q")
    git("add", ".")
    git("commit", "-qm", "benign tabrion")
    return repo, git("rev-parse", "HEAD")


@contextlib.contextmanager
def local_upstream(tmp_path: Path) -> Iterator[str]:
    """A stand-in for PyPI on 127.0.0.1 that serves one benign package, ``helper`` 1.0."""
    root = tmp_path / "upstream"
    (root / "simple" / "helper").mkdir(parents=True)
    (root / "files").mkdir()
    info = "helper-1.0.dist-info"
    with zipfile.ZipFile(root / "files" / "helper-1.0-py3-none-any.whl", "w") as wheel:
        wheel.writestr("helper.py", "")
        wheel.writestr(f"{info}/METADATA", "Metadata-Version: 2.1\nName: helper\nVersion: 1.0\n\n")
        wheel.writestr(f"{info}/WHEEL", "Wheel-Version: 1.0\nRoot-Is-Purelib: true\nTag: py3-none-any\n")
        wheel.writestr(f"{info}/RECORD", "")
    (root / "simple" / "helper" / "index.html").write_text(
        '<a href="../../files/helper-1.0-py3-none-any.whl">helper-1.0-py3-none-any.whl</a>\n', encoding="utf-8"
    )

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, format: str, *args: Any) -> None:
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}/simple"
    finally:
        server.shutdown()
        server.server_close()


@needs_pip
def test_an_install_from_the_pinned_commit_never_asks_the_index_for_it_and_is_green(tmp_path: Path) -> None:
    repo, commit = benign_tabrion_repository(tmp_path)
    lock = lock_file(tmp_path, f"tabrion @ git+{repo.as_uri()}@{commit}\n")
    target = tmp_path / "site"
    with local_upstream(tmp_path) as upstream:
        command = pip_target(target, "-r", str(lock), "helper")
        result = cli("--lock", str(lock), "--path", str(target), "--upstream", upstream, "--", *command)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "check_tabrion_source: ok   no index option or variable bypasses the poisoned index (1 file(s) read)" in (
        result.stdout
    )
    assert "check_tabrion_source: ok   no request for tabrion reached the index (1 other request(s))" in result.stdout
    assert f"ok   tabrion 0.1.0: direct_url.json names {repo.as_uri()}@{commit[:12]}" in result.stdout
    assert result.stdout.splitlines()[-1] == "check_tabrion_source: GREEN (0 problem(s))"


@needs_pip
def test_a_command_that_never_uses_the_index_proves_nothing_and_is_red(tmp_path: Path) -> None:
    repo, commit = benign_tabrion_repository(tmp_path)
    lock = lock_file(tmp_path, f"tabrion @ git+{repo.as_uri()}@{commit}\n")
    target = tmp_path / "site"
    result = cli("--lock", str(lock), "--path", str(target), "--", *pip_target(target, "-r", str(lock)))
    assert result.returncode == 1
    assert "check_tabrion_source: FAIL the command made no request to the index at all" in result.stdout


def test_index_options_and_variables_that_bypass_the_index_are_found(tmp_path: Path) -> None:
    (tmp_path / "sub").mkdir()
    (tmp_path / "req.txt").write_text("-r sub/nested.txt\nfoo==1  # --index-url in a comment\n", encoding="utf-8")
    (tmp_path / "sub" / "nested.txt").write_text("--extra-index-url https://mirror.invalid/simple\n", encoding="utf-8")
    (tmp_path / "cons.txt").write_text("--find-links=/wheels\n-ihttps://x.invalid\n", encoding="utf-8")
    command = ["bash", "-c", "pip install -r req.txt -c cons.txt --index-url=https://x.invalid/simple . && true"]
    problems, read = cts.bypass_problems(command, {"PIP_FIND_LINKS": "/w", "UV_DEFAULT_INDEX": ""}, tmp_path)
    assert read == 3
    assert problems == [
        "PIP_FIND_LINKS is set: it bypasses the poisoned index",
        "the command passes '--index-url=https://x.invalid/simple': it bypasses the poisoned index",
        f"{tmp_path / 'sub' / 'nested.txt'}:1: '--extra-index-url https://mirror.invalid/simple' bypasses the poisoned "
        "index",
        f"{tmp_path / 'cons.txt'}:1: '--find-links=/wheels' bypasses the poisoned index",
        f"{tmp_path / 'cons.txt'}:2: '-ihttps://x.invalid' bypasses the poisoned index",
    ]
    clean = ["python", "-m", "pip", "install", "--no-cache-dir", "-c", str(tmp_path / "missing.txt"), "-e", ".[dev]"]
    assert cts.bypass_problems(clean, {}, tmp_path) == ([], 0)


def test_a_lock_without_the_pin_or_a_command_is_refused(tmp_path: Path) -> None:
    result = cli("--lock", str(lock_file(tmp_path, "tabrion>=0.1\n")), "--", "true")
    assert result.returncode == 1
    assert "pins no tabrion to a commit" in result.stdout
    assert cli("--lock", str(lock_file(tmp_path))).returncode == 2

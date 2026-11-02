"""The one-command Docker test (scripts/docker_test.py): redaction, summary, cleanup selection and hints; and the
helpers it shares with scripts/docker_smoke.py. The real run needs an engine (workflow Docker, job one-command)."""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import docker_smoke
import docker_test

HOME = "/Users/peter"


@pytest.mark.parametrize(
    ("text", "secret"),
    [
        ("proxy http://peter:hunter2@proxy.example:3128", "hunter2"),
        ("url https://x-access-token:ghs_abcdefghijklmnopqrstuvwxyz123456@github.com/o/r", "ghs_abcdefghij"),
        ("token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "ghp_ABCDEFGH"),
        ("github_pat_11AAAAAAA0abcdefghijklmnop_qrstuvwxyz", "github_pat_11"),
        ("ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz", "sk-ant-api03"),
        ("OPENAI key sk-proj-abcdefghijklmnopqrstuvwx", "sk-proj-abcdef"),
        ("AWS AKIAABCDEFGHIJKLMNOP", "AKIAABCDEFGHIJKLMNOP"),
        ("Authorization: Bearer abcdefghijklmnop.qrs", "abcdefghijklmnop"),
        ('{"password": "letmein"}', "letmein"),
        ("NODESTRO_READ_TOKEN=plainvalue", "plainvalue"),
        ("https://registry/v2/?token=abc123def&x=1", "abc123def"),
        ("jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdef", "eyJzdWIi"),
    ],
)
def test_redact_removes_credentials(text: str, secret: str) -> None:
    assert secret not in docker_test.redact(text, HOME)


def test_redact_replaces_home_folders_but_keeps_useful_paths() -> None:
    text = "dial unix /Users/peter/.docker/run/docker.sock: connect: no such file; other /Users/anna/x"
    clean = docker_test.redact(text, HOME)
    assert clean == "dial unix ~/.docker/run/docker.sock: connect: no such file; other /Users/<user>/x"
    windows = docker_test.redact(r'"C:\\Users\\Peter Pan\\nodestro" and C:\Users\anna\x', r"C:\Users\Peter Pan")
    assert "Peter Pan" not in windows and "anna" not in windows
    assert docker_test.redact("prompt_tokens: 10, state approved", HOME) == "prompt_tokens: 10, state approved"


def test_redact_value_walks_json() -> None:
    value = {"a": ["http://u:p@h", {"b": "/home/someone/x"}], "n": 3}
    assert docker_test.redact_value(value, HOME) == {"a": ["http://<redacted>@h", {"b": "/home/<user>/x"}], "n": 3}


def test_the_studio_of_the_test_gets_no_tokens_or_keys() -> None:
    environ = {
        "PATH": "/bin",
        "HOME": HOME,
        "HTTPS_PROXY": "http://proxy:3128",
        "GIT_CONFIG_KEY_0": "url.https://x-access-token:abc@github.com/.insteadOf",
        "NODESTRO_READ": "x",
        "GH_TOKEN": "x",
        "ANTHROPIC_API_KEY": "x",
        "AWS_SECRET_ACCESS_KEY": "x",
        "NODESTRO_PROFILE": "server",
        "DOCKER_HOST": "unix:///x.sock",
    }
    child = docker_test.child_environment(environ)
    assert set(child) == {"PATH", "HOME", "HTTPS_PROXY", "DOCKER_HOST", "PYTHONUTF8"}
    assert child["HTTPS_PROXY"] == "http://proxy:3128"
    assert docker_test.runtime_cli_environment({"PATH": "/bin", "USERPROFILE": "C:\\x", "DOCKER_CONTEXT": "d"}) == {
        "PATH": "/bin",
        "DOCKER_CONTEXT": "d",
    }


def check(step: int, name: str, ok: bool = True) -> dict[str, Any]:
    return {"step": step, "name": name, "ok": ok, "detail": ""}


def test_summary_has_a_row_per_step_and_marks_steps_that_did_not_run() -> None:
    checks = [check(1, "cli"), check(2, "preflight"), check(3, "image"), check(4, "self-test", ok=False)]
    checks += [check(9, "refused"), check(10, "diagnosis")]
    rows = docker_test.summarize(checks, real_stop=False)
    assert [row["step"] for row in rows] == list(range(1, 11))
    status = {row["step"]: row["status"] for row in rows}
    assert status == {
        1: "PASS",
        2: "PASS",
        3: "PASS",
        4: "FAIL",
        5: "NOT RUN",
        6: "NOT RUN",
        7: "NOT RUN",
        8: "NOT RUN",
        9: "PASS",
        10: "PASS",
    }
    assert rows[3]["failed"] == ["self-test"]
    assert "was not quit" in rows[8]["text"]
    assert "really stopped" in docker_test.summarize([check(9, "x")], real_stop=True)[8]["text"]
    assert docker_test.overall(rows, fatal=False, smoke_code=1) == "FAIL"
    every = docker_test.summarize([check(step, "x") for step in range(1, 11)], real_stop=False)
    assert docker_test.overall(every, fatal=False, smoke_code=0) == "PASS"
    assert docker_test.overall(every, fatal=False, smoke_code=1) == "FAIL"
    assert docker_test.overall(every, fatal=True, smoke_code=None) == "NOT RUN"


def test_cleanup_chooses_only_this_installations_containers() -> None:
    owner = "nodestro-0123456789ab"
    rows = [
        {"ID": "a1", "Labels": f"org.orkexa.sandbox={owner},org.orkexa.deadline=1"},
        {"ID": "a2", "Labels": {"org.orkexa.sandbox": "nodestro-mcp-0123456789ab"}},
        {"ID": "b1", "Labels": "org.orkexa.sandbox=nodestro-ffffffffffff"},
        {"ID": "b2", "Labels": "org.orkexa.sandbox=nodestro"},
        {"ID": "c1", "Labels": "com.docker.compose.project=mine"},
        {"ID": "c2", "Labels": ""},
    ]
    assert docker_test.containers_to_remove(rows, owner) == ["a1", "a2"]
    assert docker_test.containers_to_remove(rows, "") == []
    assert docker_test.containers_to_remove(rows, "nodestro") == []


def test_cleanup_chooses_only_new_images_of_the_test() -> None:
    before = {"sha256:old": ["nodestro-env:aaa"], "sha256:base": ["python:3.13-slim"]}
    after = {
        **before,
        "sha256:new": ["nodestro-env:bbb"],
        "sha256:pulled": ["ghcr.io/astral-sh/uv:<none>"],
        "sha256:py": ["python:<none>"],
        "sha256:mine": ["postgres:16"],
        "sha256:mixed": ["nodestro-env:ccc", "myapp:latest"],
        "sha256:dangling": ["<none>:<none>"],
    }
    assert docker_test.images_to_remove(before, after) == ["sha256:new", "sha256:pulled", "sha256:py"]


def test_git_dependencies_are_read_from_the_pins() -> None:
    pyproject = (Path(__file__).resolve().parents[1] / "pyproject.toml").read_text(encoding="utf-8")
    urls = docker_test.git_dependencies(pyproject)
    assert "https://github.com/peterkarlhuber/nodestro-runtime" in urls
    assert all(url.startswith("https://github.com/") and not url.endswith(".git") for url in urls)


def facts(**extra: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "cli": "/usr/local/bin/docker",
        "engine_answers": True,
        "context": "desktop-linux",
        "contexts": ["default", "desktop-linux"],
        "server_os": "linux",
        "server_platform": "Docker Desktop 4.50.0 (200000)",
        "runtime_env_engine_answers": True,
        "runtime_env_context": "desktop-linux",
        "info": {"OperatingSystem": "Docker Desktop", "OSType": "linux", "CgroupVersion": "2", "MemTotal": 8 * 2**30},
    }
    base.update(extra)
    return base


def levels(found: list[dict[str, str]]) -> list[str]:
    return [hint["level"] for hint in found]


def test_hints_for_a_ready_docker_desktop_are_empty() -> None:
    assert docker_test.hints(facts(), {}, True) == []
    assert docker_test.engine_kind(facts()) == "Docker Desktop"


def test_hints_stop_the_test_when_docker_cannot_be_used() -> None:
    missing = docker_test.hints(facts(cli=""), {}, True)
    assert levels(missing) == ["fatal"] and "Settings -> Advanced" in missing[0]["text"]
    assert "Install Docker Desktop" in docker_test.hints(facts(cli=""), {}, False)[0]["text"]
    stopped = docker_test.hints(facts(engine_answers=False, context="default", info={}), {}, True)
    assert levels(stopped) == ["fatal"] and "docker context use desktop-linux" in stopped[0]["text"]
    windows = docker_test.hints(facts(server_os="windows"), {}, True)
    assert levels(windows) == ["fatal"] and "Switch to Linux containers" in windows[0]["text"]


def test_hints_warn_about_what_will_make_a_step_fail() -> None:
    v1 = facts(
        server_platform="Docker Engine - Community",
        info={"OperatingSystem": "Ubuntu", "OSType": "linux", "CgroupVersion": "1", "Name": "<host>"},
    )
    found = docker_test.hints(v1, {}, False)
    assert levels(found) == ["info", "warning"]
    assert "not Docker Desktop" in found[0]["text"] and "--context desktop-linux" in found[0]["text"]
    small = facts(info={**facts()["info"], "MemTotal": 2**30})
    assert levels(docker_test.hints(small, {}, True)) == ["warning"]
    blind = facts(runtime_env_engine_answers=False, runtime_env_context="default")
    assert "reduced environment" in docker_test.hints(blind, {}, True)[0]["text"]
    assert "DOCKER_HOST" in docker_test.hints(facts(docker_host_set=True), {}, True)[0]["text"]


def test_report_text_is_readable_and_redacted(tmp_path: Path) -> None:
    report: dict[str, Any] = {
        "result": "FAIL",
        "time": "2026-11-02 10:00:00",
        "repo": {"commit": "abc", "dirty": False},
        "system": {"os": "macOS-15.1-arm64", "machine": "arm64", "python": "3.13.1"},
        "docker": facts(),
        "engine_kind": "Docker Desktop",
        "hints": [],
        "steps": docker_test.summarize([check(4, "self-test", ok=False)], real_stop=False),
        "smoke": {
            "checks": [check(4, "self-test", ok=False)],
            "facts": {"status": {"state": "unavailable", "reason": "docker-selftest"}},
        },
        "cleanup": {"containers_removed": [], "images_removed": [], "paths_removed": [], "notes": []},
        "log_tail": [f"HOME is {Path.home()}", "key ANTHROPIC_API_KEY=sk-ant-abcdefghijklmnopqrstu"],
    }
    _json_path, text_path, zip_path = docker_test.write_report(tmp_path, report)
    text = text_path.read_text(encoding="utf-8")
    assert "Result: FAIL" in text and " 4. FAIL" in text and "sk-ant-abc" not in text
    assert str(Path.home()) not in text or str(Path.home()) in ("/", "")
    assert "The test container failed Nodestro's checks" in text  # the sentence Settings -> Sandbox shows
    assert zip_path.exists()


def test_the_smoke_tests_owner_is_the_runtimes(tmp_path: Path) -> None:
    data = tmp_path / "data"
    assert docker_smoke.installation_owner(data) == ""
    (data / "python").mkdir(parents=True)
    (data / "python" / "installation-id").write_text("0123abcd\n", encoding="utf-8")
    owner = docker_smoke.installation_owner(data)
    assert owner.startswith("nodestro-") and len(owner) == len("nodestro-") + 12
    runtime = pytest.importorskip("nodestro_runtime.docker_status")
    assert owner == runtime.installation_owner(data, "0123abcd")
    assert docker_smoke.owner_filter(owner) == f"label=org.orkexa.sandbox={owner}"
    assert docker_smoke.owner_filter("") == "label=org.orkexa.sandbox"


def test_stop_and_start_commands_keep_windows_paths() -> None:
    exe = r"C:\Program Files\Docker\Docker\Docker Desktop.exe"
    assert docker_smoke.split_command(json.dumps([exe])) == [exe]
    assert docker_smoke.split_command("osascript -e 'quit app \"Docker\"'") == ["osascript", "-e", 'quit app "Docker"']


def test_the_smoke_report_records_steps(tmp_path: Path) -> None:
    report = docker_smoke.Report()
    report.step = 3
    report.check("a", True)
    report.check("b", False, {"x": 1}, step=8)
    report.facts["owner"] = "nodestro-x"
    report.write(tmp_path / "r.json")
    data = json.loads((tmp_path / "r.json").read_text(encoding="utf-8"))
    assert [(c["step"], c["name"], c["ok"]) for c in data["checks"]] == [(3, "a", True), (8, "b", False)]
    assert data["failed"] == ["b"] and data["facts"]["owner"] == "nodestro-x"
    assert set(docker_smoke.STEPS) == set(docker_test.PLAIN) == set(range(1, 11))

"""scripts/lock_check.py: the installed platform against platform/versions.json, offline, from fake environments."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import subprocess
import sys
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import lock_check
from lock_check import Installed

ROOT = Path(__file__).resolve().parents[1]
A, B, C, D, E, F = ("a" * 40, "b" * 40, "c" * 40, "d" * 40, "e" * 40, "f" * 40)
GH = "https://github.com/peterkarlhuber"
VERSIONS: dict[str, Any] = {
    "platform": "0.2.0",
    "components": {
        "axentra": {"commit": A, "version": "0.1.0.dev0"},
        "orkexa": {"commit": B, "version": "0.2.0.dev0"},
        "nodestro-runtime": {"commit": C, "version": "0.2.0", "studio_dependency": True},
        "nodestro-api": {"commit": D, "version": "0.2.0", "studio_dependency": True},
        "nodestro-sdk": {"commit": E, "version": "0.3.0"},
    },
}


def vcs(repo: str, commit: str, **extra: Any) -> dict[str, Any]:
    return {"url": f"{GH}/{repo}.git", "vcs_info": {"vcs": "git", "commit_id": commit}, **extra}


def git_req(name: str, repo: str, commit: str, suffix: str = "") -> str:
    return f"{name} @ git+{GH}/{repo}.git@{commit}{suffix}"


def environment(profile: str = "studio") -> dict[str, Installed]:
    """An environment exactly as VERSIONS pins it (what pip installs from the studio, or with the server extras)."""
    env = {
        "orkexa": Installed("0.2.0.dev0", vcs("orkexa", B)),
        "nodestro-runtime": Installed(
            "0.2.0",
            vcs("nodestro-runtime", C),
            [git_req("orkexa[all]", "orkexa", B), git_req("axentra[oidc]", "axentra", A, '; extra == "postgres"')],
        ),
        "nodestro-api": Installed(
            "0.2.0",
            vcs("nodestro-api", D),
            [
                git_req("nodestro-runtime", "nodestro-runtime", C),
                git_req("nodestro-runtime[postgres]", "nodestro-runtime", C, '; extra == "server"'),
            ],
        ),
        "nodestro": Installed(
            "0.2.0",
            {"url": "file:///src", "dir_info": {}},
            [git_req("nodestro-api", "nodestro-api", D), "fastapi>=0.115"],
        ),
        "fastapi": Installed("0.120.0", None),
    }
    if profile == "server":
        env["axentra"] = Installed("0.1.0.dev0", vcs("axentra", A))
    return env


def run(env: dict[str, Installed], profile: str = "studio", versions: dict[str, Any] | None = None) -> list[str]:
    ok, problems = lock_check.check(versions or VERSIONS, env, profile)
    assert ok or problems
    return problems


@pytest.mark.parametrize("profile", ["studio", "server"])
def test_an_environment_as_pinned_is_green(profile: str) -> None:
    ok, problems = lock_check.check(VERSIONS, environment(profile), profile)
    assert problems == []
    assert "nodestro-api 0.2.0 @ " + D[:12] in ok
    assert "nodestro 0.2.0 (the studio)" in ok
    assert any(line.startswith("axentra ") for line in ok) == (profile == "server")


def test_another_commit_fails() -> None:
    env = environment()
    env["nodestro-runtime"] = Installed("0.2.0", vcs("nodestro-runtime", F))
    assert run(env) == [f"nodestro-runtime: installed commit {F[:12]}, versions.json pins {C[:12]}"]


def test_another_url_fails() -> None:
    env = environment()
    env["orkexa"] = Installed(
        "0.2.0.dev0", {"url": "https://github.com/someone/orkexa.git", "vcs_info": {"vcs": "git", "commit_id": B}}
    )
    [problem] = run(env)
    assert problem.startswith("orkexa: installed from https://github.com/someone/orkexa.git@")


def test_url_spelling_without_git_suffix_passes() -> None:
    env = environment()
    env["orkexa"] = Installed("0.2.0.dev0", {"url": f"{GH}/orkexa/", "vcs_info": {"vcs": "git", "commit_id": B}})
    assert run(env) == []


@pytest.mark.parametrize(
    ("direct_url", "problem"),
    [
        (None, "not installed from a pinned commit (no direct_url.json"),
        ({"url": "file:///home/x/nodestro-api", "dir_info": {"editable": True}}, "editable install from file:///"),
        ({"url": "file:///tmp/nodestro_api-0.2.0-py3-none-any.whl", "archive_info": {}}, "local or archive install"),
    ],
)
def test_a_component_not_from_its_pinned_commit_fails(direct_url: dict[str, Any] | None, problem: str) -> None:
    env = environment()
    env["nodestro-api"] = Installed("0.2.0", direct_url, env["nodestro-api"].requires)
    [found] = run(env)
    assert found.startswith("nodestro-api 0.2.0: ") and problem in found


def test_another_version_fails() -> None:
    env = environment()
    env["nodestro-api"] = Installed("0.2.1", vcs("nodestro-api", D), env["nodestro-api"].requires)
    assert run(env) == ["nodestro-api: installed version 0.2.1, versions.json says 0.2.0"]


def test_a_missing_component_fails_and_the_server_needs_axentra() -> None:
    env = environment()
    del env["orkexa"]
    assert run(env) == [f"orkexa: not installed, the studio profile needs it at {B[:12]}"]
    assert run(environment(), "server") == [f"axentra: not installed, the server profile needs it at {A[:12]}"]


def test_server_extras_in_the_studio_profile_fail() -> None:
    ok, _ = lock_check.check(VERSIONS, environment("server"), "studio")
    assert not any(line.startswith("axentra") for line in ok)
    assert run(environment("server"), "studio") == [
        "axentra 0.1.0.dev0: installed, but only the server profile contains it"
    ]


def test_an_optional_component_is_checked_when_installed() -> None:
    env = environment()
    env["nodestro-client"] = Installed("0.3.0", vcs("nodestro-sdk", E, subdirectory="python"))
    assert run(env) == []
    env["nodestro-client"] = Installed("0.3.0", vcs("nodestro-sdk", E))
    assert run(env) == ["nodestro-sdk: installed from subdirectory None, expected 'python'"]


def test_a_declared_pin_at_another_commit_fails_for_every_extra() -> None:
    env = environment()
    api = env["nodestro-api"]
    env["nodestro-api"] = Installed(
        api.version,
        api.direct_url,
        [*api.requires, git_req("nodestro-runtime[x]", "nodestro-runtime", F, '; extra == "dev"')],
    )
    assert run(env) == [
        f'nodestro-api declares nodestro-runtime@{F[:12]} (extra == "dev"), versions.json pins {C[:12]}'
    ]


def test_the_studio_must_be_installed_at_the_platform_version() -> None:
    env = environment()
    env["nodestro"] = Installed("0.1.0", None, [])
    assert run(env) == ["nodestro: installed version 0.1.0, versions.json platform 0.2.0"]
    del env["nodestro"]
    assert run(env) == ["nodestro: the studio is not installed (platform 0.2.0)"]


def test_a_versions_json_entry_without_a_full_commit_fails() -> None:
    versions = copy.deepcopy(VERSIONS)
    versions["components"]["orkexa"]["commit"] = "master"
    assert run(environment(), versions=versions) == ["versions.json: orkexa is not pinned to a full commit ('master')"]


def test_the_profiles_follow_versions_json() -> None:
    components = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))["components"]
    studio = lock_check.required(components, "studio")
    assert studio == ["nodestro-api", "nodestro-examples", "nodestro-integrations", "nodestro-runtime", "orkexa"]
    assert lock_check.required(components, "server") == sorted([*studio, "axentra"])


def write_dist(site: Path, name: str, version: str, direct_url: dict[str, Any] | None, requires: list[str]) -> None:
    info = site / f"{name.replace('-', '_')}-{version}.dist-info"
    info.mkdir(parents=True)
    lines = [
        "Metadata-Version: 2.4",
        f"Name: {name}",
        f"Version: {version}",
        *(f"Requires-Dist: {r}" for r in requires),
    ]
    (info / "METADATA").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if direct_url is not None:
        (info / "direct_url.json").write_text(json.dumps(direct_url), encoding="utf-8")


def site_from(env: dict[str, Installed], site: Path) -> Path:
    for name, found in env.items():
        write_dist(site, name, found.version, found.direct_url, found.requires)
    return site


def cli(*args: str) -> subprocess.CompletedProcess[str]:
    script = ROOT / "scripts" / "lock_check.py"
    return subprocess.run([sys.executable, "-I", str(script), *args], capture_output=True, text=True, check=False)


def test_the_command_reads_dist_info_and_exits_by_verdict(tmp_path: Path) -> None:
    versions = tmp_path / "versions.json"
    versions.write_text(json.dumps(VERSIONS), encoding="utf-8")
    env = environment("server")
    good = cli("--profile", "server", "--versions", str(versions), "--path", str(site_from(env, tmp_path / "good")))
    assert good.returncode == 0, good.stdout
    assert f"lock_check: ok   nodestro-runtime 0.2.0 @ {C[:12]}" in good.stdout
    assert good.stdout.splitlines()[-1].startswith(
        "lock_check: GREEN (server profile, platform 0.2.0, 5 ok, 0 problem(s)"
    )

    env["nodestro-runtime"] = Installed("0.2.0", vcs("nodestro-runtime", F), env["nodestro-runtime"].requires)
    bad = cli("--profile", "server", "--versions", str(versions), "--path", str(site_from(env, tmp_path / "bad")))
    assert bad.returncode == 1
    assert f"lock_check: FAIL nodestro-runtime: installed commit {F[:12]}, versions.json pins {C[:12]}" in bad.stdout
    assert bad.stdout.splitlines()[-1].startswith("lock_check: RED (server profile")


def test_the_command_fails_on_an_unreadable_versions_file(tmp_path: Path) -> None:
    result = cli("--versions", str(tmp_path / "missing.json"), "--path", str(tmp_path))
    assert result.returncode == 1
    assert result.stdout.startswith("lock_check: FAIL cannot read ")


def test_only_checks_the_named_components_and_requires_them() -> None:
    """DC-NS-1: ``--only tabrion`` for the consumers' poisoned-index jobs: no profile, no studio."""
    versions = copy.deepcopy(VERSIONS)
    versions["components"]["tabrion"] = {"commit": F, "version": "0.1.0"}
    tabrion = {"tabrion": Installed("0.1.0", vcs("tabrion", F))}
    assert lock_check.check(versions, tabrion, "studio", ["tabrion"]) == (["tabrion 0.1.0 @ ffffffffffff"], [])
    ok, problems = lock_check.check(versions, {"tabrion": Installed("0.1.99", None)}, "studio", ["tabrion"])
    assert ok == []
    assert problems[0].startswith("tabrion 0.1.99: not installed from a pinned commit (no direct_url.json")
    assert problems[1] == "tabrion: installed version 0.1.99, versions.json says 0.1.0"
    assert lock_check.check(versions, {}, "studio", ["tabrion", "nope"])[1] == [
        "nope: not a component of versions.json",
        f"tabrion: not installed, --only needs it at {F[:12]}",
    ]


def test_the_command_with_only(tmp_path: Path) -> None:
    versions = copy.deepcopy(VERSIONS)
    versions["components"]["tabrion"] = {"commit": F, "version": "0.1.0"}
    path = tmp_path / "versions.json"
    path.write_text(json.dumps(versions), encoding="utf-8")
    site = site_from({"tabrion": Installed("0.1.0", vcs("tabrion", F))}, tmp_path / "site")
    result = cli("--versions", str(path), "--path", str(site), "--only", "tabrion")
    assert result.returncode == 0, result.stdout
    assert result.stdout.splitlines()[-1].startswith("lock_check: GREEN (only tabrion, platform 0.2.0, 1 ok, 0 problem")
    assert cli("--versions", str(path), "--path", str(site), "--only", "tabrion,axentra").returncode == 1

"""scripts/bump_pins.py (CI-FAST AP8): pin rewriting, the master check, --check and the cascade plan, offline."""

from __future__ import annotations

from collections.abc import Sequence
import json
from pathlib import Path
import subprocess
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import bump_pins

OLD = "a" * 40
NEW = "b" * 40
OTHER = "c" * 40
URL = "git+https://github.com/peterkarlhuber"


class FakeRunner:
    """Answers git ls-remote, gh api compare and git remote without a network; records every command."""

    def __init__(self, status: str = "ahead", master: str = NEW, origin: str = "") -> None:
        self.status, self.master, self.origin = status, master, origin
        self.calls: list[list[str]] = []

    def __call__(self, cmd: Sequence[str]) -> str:
        cmd = list(cmd)
        self.calls.append(cmd)
        if cmd[:2] == ["git", "ls-remote"]:
            return f"{self.master}\trefs/heads/master\n"
        if cmd[:2] == ["gh", "api"]:
            if self.status == "404":
                raise subprocess.CalledProcessError(1, cmd)
            return self.status + "\n"
        if "remote" in cmd:
            if not self.origin:
                raise subprocess.CalledProcessError(2, cmd)
            return self.origin + "\n"
        raise AssertionError(f"unexpected command {cmd}")


def api_checkout(tmp_path: Path) -> Path:
    d = tmp_path / "nodestro-api"
    d.mkdir()
    (d / "pyproject.toml").write_text(
        "[project]\ndependencies = [\n"
        f'    "nodestro-runtime @ {URL}/nodestro-runtime.git@{OLD}",\n'
        "    # keep this comment\n"
        f'    "orkexa @ {URL}/orkexa.git@{OTHER}",\n'
        "]\n[project.optional-dependencies]\n"
        f'server = ["nodestro-runtime[postgres] @ {URL}/nodestro-runtime.git@{OLD}"]\n',
        encoding="utf-8",
    )
    return d


def studio_checkout(tmp_path: Path) -> Path:
    d = tmp_path / "nodestro-studio"
    (d / "platform").mkdir(parents=True)
    (d / "pyproject.toml").write_text('[project]\ndependencies = ["nodestro-api>=0.2.0,<0.3"]\n', encoding="utf-8")
    for lock in ("internal.txt", "internal-server.txt"):
        (d / "platform" / lock).write_text(f"# lock\nnodestro-api @ {URL}/nodestro-api.git@{OLD}\n", encoding="utf-8")
    versions = {
        "platform": "0.2.0",
        "legacy": {"commit": OLD},
        "components": {
            "orkexa": {"commit": OLD, "version": "0.1.0"},
            "nodestro-api": {"commit": OLD, "version": "0.2.0", "pyproject": "pyproject.toml"},
        },
        "products": {"nodestro-server": {"commit": OLD, "studio": OLD}},
    }
    (d / "platform" / "versions.json").write_text(json.dumps(versions, indent=2) + "\n", encoding="utf-8")
    return d


def test_set_rewrites_every_occurrence_and_nothing_else(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    d = api_checkout(tmp_path)
    runner = FakeRunner()
    assert bump_pins.main(["set", str(d), "--set", f"runtime={NEW}"], runner) == 0
    text = (d / "pyproject.toml").read_text(encoding="utf-8")
    assert text.count(f"nodestro-runtime.git@{NEW}") == 2
    assert OLD not in text
    assert f"orkexa.git@{OTHER}" in text and "# keep this comment" in text
    out = capsys.readouterr().out
    assert f'+    "nodestro-runtime @ {URL}/nodestro-runtime.git@{NEW}",' in out
    assert ["gh", "api", f"repos/peterkarlhuber/nodestro-runtime/compare/{NEW}...master", "--jq", ".status"] in (
        runner.calls
    )


def test_versions_json_changes_only_the_component_commit(tmp_path: Path) -> None:
    d = studio_checkout(tmp_path)
    assert bump_pins.main(["set", str(d), "--repo", "studio", "--set", f"orkexa={NEW}"], FakeRunner()) == 0
    versions = json.loads((d / "platform" / "versions.json").read_text(encoding="utf-8"))
    assert versions["components"]["orkexa"]["commit"] == NEW
    assert versions["components"]["nodestro-api"]["commit"] == OLD
    assert versions["legacy"]["commit"] == OLD and versions["products"]["nodestro-server"]["commit"] == OLD
    # the lock fixture has no orkexa line: untouched
    assert OLD in (d / "platform" / "internal.txt").read_text(encoding="utf-8")


def test_studio_api_moves_in_versions_json_and_the_lock(tmp_path: Path) -> None:
    d = studio_checkout(tmp_path)
    assert bump_pins.main(["set", str(d), "--set", f"nodestro-api={NEW}"], FakeRunner()) == 0
    for lock in ("internal.txt", "internal-server.txt"):
        assert f"nodestro-api.git@{NEW}" in (d / "platform" / lock).read_text(encoding="utf-8")
    assert "nodestro-api>=0.2.0,<0.3" in (d / "pyproject.toml").read_text(encoding="utf-8")
    versions = json.loads((d / "platform" / "versions.json").read_text(encoding="utf-8"))
    assert versions["components"]["nodestro-api"]["commit"] == NEW


def test_json_key_files(tmp_path: Path) -> None:
    d = tmp_path / "nodestro-local-docker"
    d.mkdir()
    (d / "components.json").write_text(
        json.dumps({"comment": OLD, "nodestro-studio": OLD, "nodestro-server": OLD}, indent=2), encoding="utf-8"
    )
    assert bump_pins.main(["set", str(d), "--set", f"studio={NEW}", "--no-verify"], FakeRunner()) == 0
    data = json.loads((d / "components.json").read_text(encoding="utf-8"))
    assert data == {"comment": OLD, "nodestro-studio": NEW, "nodestro-server": OLD}


def test_check_mode_writes_nothing_and_reports(tmp_path: Path) -> None:
    d = api_checkout(tmp_path)
    before = (d / "pyproject.toml").read_text(encoding="utf-8")
    assert bump_pins.main(["set", str(d), "--check", "--set", f"runtime={NEW}"], FakeRunner()) == 1
    assert (d / "pyproject.toml").read_text(encoding="utf-8") == before
    assert bump_pins.main(["set", str(d), "--check", "--set", f"runtime={OLD}"], FakeRunner()) == 0


def test_dry_run_writes_nothing(tmp_path: Path) -> None:
    d = api_checkout(tmp_path)
    before = (d / "pyproject.toml").read_text(encoding="utf-8")
    assert bump_pins.main(["set", str(d), "--dry-run", "--set", f"runtime={NEW}"], FakeRunner()) == 0
    assert (d / "pyproject.toml").read_text(encoding="utf-8") == before


def test_from_master_resolves_with_ls_remote(tmp_path: Path) -> None:
    d = api_checkout(tmp_path)
    runner = FakeRunner(master=NEW)
    assert bump_pins.main(["set", str(d), "--from-master", "orkexa"], runner) == 0
    assert f"orkexa.git@{NEW}" in (d / "pyproject.toml").read_text(encoding="utf-8")
    assert runner.calls[1][:2] == ["git", "ls-remote"]


@pytest.mark.parametrize("status", ["behind", "diverged", "404"])
def test_refuses_a_sha_that_is_not_on_master(tmp_path: Path, status: str) -> None:
    d = api_checkout(tmp_path)
    before = (d / "pyproject.toml").read_text(encoding="utf-8")
    with pytest.raises(SystemExit, match="is not on nodestro-runtime's master"):
        bump_pins.main(["set", str(d), "--set", f"runtime={NEW}"], FakeRunner(status=status))
    assert (d / "pyproject.toml").read_text(encoding="utf-8") == before


def test_identical_counts_as_on_master() -> None:
    assert bump_pins.on_master("orkexa", NEW, FakeRunner(status="identical"))


def test_git_cache_verification(tmp_path: Path) -> None:
    calls: list[list[str]] = []

    def runner(cmd: Sequence[str]) -> str:
        calls.append(list(cmd))
        if "merge-base" in cmd and NEW not in cmd:
            raise subprocess.CalledProcessError(1, cmd)
        return ""

    assert bump_pins.on_master("orkexa", NEW, runner, tmp_path)
    assert not bump_pins.on_master("orkexa", OTHER, runner, tmp_path)
    assert calls[0][:3] == ["git", "clone", "--quiet"]
    assert any(c[-3:] == ["--is-ancestor", NEW, "refs/heads/master"] for c in calls)


def test_refuses_a_name_the_repo_does_not_pin(tmp_path: Path) -> None:
    d = api_checkout(tmp_path)
    with pytest.raises(SystemExit, match="does not pin nodestro-studio"):
        bump_pins.main(["set", str(d), "--set", f"studio={NEW}"], FakeRunner())


def test_refuses_a_short_sha(tmp_path: Path) -> None:
    with pytest.raises(SystemExit, match="full 40-character"):
        bump_pins.main(["set", str(api_checkout(tmp_path)), "--set", "runtime=abc1234"], FakeRunner())


def test_missing_pin_location_is_an_error(tmp_path: Path) -> None:
    d = api_checkout(tmp_path)
    (d / "pyproject.toml").write_text("[project]\ndependencies = []\n", encoding="utf-8")
    with pytest.raises(SystemExit, match="no pin of nodestro-runtime found"):
        bump_pins.main(["set", str(d), "--set", f"runtime={NEW}"], FakeRunner())


def test_repo_from_origin_url(tmp_path: Path) -> None:
    d = tmp_path / "worktree"
    d.mkdir()
    runner = FakeRunner(origin="https://github.com/peterkarlhuber/nodestro-sdk.git")
    assert bump_pins.repo_of(d, runner) == "nodestro-sdk"
    with pytest.raises(SystemExit, match="pins nothing"):
        bump_pins.repo_of(d, FakeRunner())


def test_plan_orders_the_cascade() -> None:
    stages = bump_pins.plan("orkexa", NEW)
    names = [[repo for repo, _files in stage] for stage in stages]
    assert names == [
        ["nodestro-runtime"],
        ["nodestro-examples", "nodestro-integrations"],
        ["nodestro-api"],
        ["nodestro-sdk"],
        ["nodestro-studio"],
        ["nodestro-server", "nodestro-desktop"],
        ["nodestro-local-docker"],
    ]
    studio = dict(stages[4][0][1])
    assert set(studio) == {"platform/internal.txt", "platform/internal-server.txt", "platform/versions.json"}
    assert f"orkexa={NEW}" in studio["platform/versions.json"]


def test_plan_from_the_middle(capsys: pytest.CaptureFixture[str]) -> None:
    assert [[r for r, _ in s] for s in bump_pins.plan("nodestro-sdk", NEW)] == [
        ["nodestro-studio"],
        ["nodestro-server", "nodestro-desktop"],
        ["nodestro-local-docker"],
    ]
    assert bump_pins.main(["plan", "local-docker", NEW]) == 0
    assert "nothing pins nodestro-local-docker" in capsys.readouterr().out


def test_pin_table_matches_check_versions() -> None:
    """Every component that versions.json pins is a name the studio's versions.json entry lists."""
    root = Path(__file__).resolve().parents[1]
    components = json.loads((root / "platform" / "versions.json").read_text(encoding="utf-8"))["components"]
    studio_versions = next(p for p in bump_pins.PINS["nodestro-studio"] if p.kind == "versions")
    assert set(studio_versions.names) == set(components)

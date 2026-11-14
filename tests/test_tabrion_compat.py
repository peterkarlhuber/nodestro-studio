"""scripts/tabrion_compat.py and .github/workflows/tabrion-compat.yml (TABRION QA-19/QA-20)."""

from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import tabrion_compat as tc

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "tabrion-compat.yml"
MASTER = "3e4264a300c07f5746a0ed5ba192f932964dbafc"
needs_pip = pytest.mark.skipif(
    subprocess.run([sys.executable, "-m", "pip", "--version"], capture_output=True, check=False).returncode != 0,
    reason="this interpreter has no pip",
)


def test_the_lock_copy_changes_only_the_tabrion_line() -> None:
    text = tc.LOCK.read_text(encoding="utf-8")
    new = tc.lock_at(text, MASTER)
    old_lines, new_lines = text.splitlines(), new.splitlines()
    assert len(old_lines) == len(new_lines)
    changed = [(a, b) for a, b in zip(old_lines, new_lines, strict=True) if a != b]
    assert len(changed) == 1
    before, after = changed[0]
    assert before.startswith("tabrion @ git+https://github.com/peterkarlhuber/tabrion.git@")
    assert after == f"tabrion @ git+https://github.com/peterkarlhuber/tabrion.git@{MASTER}"


def test_the_lock_copy_keeps_extras_and_line_endings() -> None:
    pin = f"tabrion[testing] @ git+https://github.com/peterkarlhuber/tabrion@{'2' * 40}"
    text = f"a @ git+https://x/a.git@{'1' * 40}\r\n{pin}\r\n"
    assert tc.lock_at(text, MASTER) == text.replace("2" * 40, MASTER)


@pytest.mark.parametrize(
    ("text", "commit"),
    [
        ("axentra @ git+https://x/a.git@" + "1" * 40 + "\n", MASTER),  # no tabrion line
        (f"tabrion @ git+{tc.TABRION_URL}@{'1' * 40}\ntabrion @ git+{tc.TABRION_URL}@{'2' * 40}\n", MASTER),  # two
        ("tabrion>=0.2,<0.3\n", MASTER),  # a range, not a pin
        (f"tabrion @ git+https://evil.invalid/tabrion.git@{'1' * 40}\n", MASTER),  # another repository
        (f"tabrion @ git+{tc.TABRION_URL}@{'1' * 40}\n", "master"),  # not a full SHA
    ],
)
def test_a_lock_or_commit_that_does_not_fit_is_refused(text: str, commit: str) -> None:
    with pytest.raises(tc.CompatError):
        tc.lock_at(text, commit)


@pytest.mark.parametrize(
    ("direct_url", "problem"),
    [
        ({"url": tc.TABRION_URL, "vcs_info": {"vcs": "git", "commit_id": MASTER}}, None),
        ({"url": "https://github.com/peterkarlhuber/tabrion", "vcs_info": {"commit_id": MASTER}}, None),
        (None, "package index"),
        ({"url": tc.TABRION_URL, "vcs_info": {"commit_id": "0" * 40}}, "is commit"),
        ({"url": "https://evil.invalid/tabrion.git", "vcs_info": {"commit_id": MASTER}}, "comes from"),
        ({"url": "file:///tmp/tabrion"}, "comes from"),
    ],
)
def test_the_installed_commit_check(direct_url: dict[str, object] | None, problem: str | None) -> None:
    found = tc.installed_problem(None if direct_url is None else json.dumps(direct_url), MASTER)
    assert (found is None) if problem is None else (found is not None and problem in found)


def test_the_synthetic_wheel_is_a_valid_wheel(tmp_path: Path) -> None:
    path = tc.build_wheel(tmp_path, "qa19-consumer", "1.0", requires=["tabrion>=0.2,<0.3"])
    assert path.name == "qa19_consumer-1.0-py3-none-any.whl"
    with zipfile.ZipFile(path) as wheel:
        names = set(wheel.namelist())
        metadata = wheel.read("qa19_consumer-1.0.dist-info/METADATA").decode()
        record = wheel.read("qa19_consumer-1.0.dist-info/RECORD").decode()
    assert {"qa19_consumer/__init__.py", "qa19_consumer-1.0.dist-info/WHEEL"} <= names
    assert "Requires-Dist: tabrion>=0.2,<0.3" in metadata
    assert all(name in record for name in names)


def test_pip_versions_select_the_cases() -> None:
    assert tc.version_tuple("26.0.1") == (26, 0, 1) and tc.version_tuple("25.0") == (25, 0)
    by_name = {case.name: case for case in tc.CASES}
    assert by_name["dev-from-index"].applies("25.0") and not by_name["dev-from-index"].applies("26.0")
    assert by_name["dev-from-index-fallback"].applies("26.3") and not by_name["dev-from-index-fallback"].applies("25.3")
    assert all(by_name[name].applies(v) for name in ("two-pins", "alpha-pin") for v in ("25.0", "26.3"))
    # Every negative case names its reason; every control names the version it must install.
    assert all((case.reason is None) == (case.version is not None) for case in tc.CASES)


@needs_pip
def test_the_negative_cases_with_the_bundled_pip(tmp_path: Path) -> None:
    """A real `pip install --no-index` per case, with the pip that venv bundles (no network)."""
    names = [
        "two-pins",
        "dev-from-index",
        "dev-from-index-fallback",
        "alpha-from-index-pre",
        "alpha-pin",
        "control-final",
    ]
    summary = tmp_path / "summary.md"
    args = ["negative", "--work", str(tmp_path / "work"), "--summary", str(summary)]
    assert tc.main([*args, *(f"--case={name}" for name in names)]) == 0
    table = summary.read_text(encoding="utf-8")
    assert "two-pins" in table and "control-final" in table and "**FAIL**" not in table


def test_the_workflow_is_report_only_and_pinned() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    on_block = text.split("\non:\n", 1)[1].split("\npermissions:", 1)[0]
    assert "workflow_dispatch:" in on_block and "tabrion_ref:" in on_block
    assert "schedule:" not in on_block and "issues: write" not in text  # manual only, no issue automation
    assert "pull_request" not in on_block and "push:" not in on_block
    assert "\npermissions:\n  contents: read\n" in text
    for line in re.findall(r"uses:\s*(\S+)", text):
        assert re.fullmatch(r"[\w.-]+/[\w.-]+@[0-9a-f]{40}", line), line
    assert all(
        "timeout-minutes:" in job for job in re.split(r"\n  [a-z0-9-]+:\n", "\n" + text.split("\njobs:\n", 1)[1])[1:]
    )
    manifest = json.loads((ROOT / ".github" / "ci-manifest.json").read_text(encoding="utf-8"))
    assert "tabrion-compat.yml" not in json.dumps(manifest), "report only: never a mandatory check"

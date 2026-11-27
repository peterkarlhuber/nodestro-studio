"""scripts/pip_cutoff.py: the shared upload cutoff of the third-party packages and the pip it needs."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
import subprocess
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import pip_cutoff
from pip_cutoff import CutoffError

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime(2026, 11, 12, 12, 0, tzinfo=UTC)


def cutoff_file(tmp_path: Path, text: str) -> Path:
    path = tmp_path / "uploaded-prior-to"
    path.write_text(text, encoding="utf-8")
    return path


def test_the_platform_cutoff_is_one_utc_timestamp_in_the_past() -> None:
    value = pip_cutoff.read_cutoff(ROOT / "platform" / "uploaded-prior-to")
    assert pip_cutoff.CUTOFF.match(value)
    assert (ROOT / "platform" / "uploaded-prior-to").read_text(encoding="utf-8") == value + "\n"


def test_a_valid_cutoff_is_returned(tmp_path: Path) -> None:
    assert pip_cutoff.read_cutoff(cutoff_file(tmp_path, "2026-11-12T00:00:00Z\n"), NOW) == "2026-11-12T00:00:00Z"


@pytest.mark.parametrize(
    "text",
    ["", "2026-11-12", "2026-11-12T00:00:00", "2026-11-12T00:00:00+00:00", "P3D", "2026-11-12T00:00:00Z\nx\n"],
)
def test_anything_but_one_utc_timestamp_fails(tmp_path: Path, text: str) -> None:
    with pytest.raises(CutoffError, match="exactly one UTC timestamp"):
        pip_cutoff.read_cutoff(cutoff_file(tmp_path, text), NOW)


def test_an_impossible_date_fails(tmp_path: Path) -> None:
    with pytest.raises(CutoffError, match="not a valid time"):
        pip_cutoff.read_cutoff(cutoff_file(tmp_path, "2026-13-40T00:00:00Z"), NOW)


def test_a_cutoff_in_the_future_fails(tmp_path: Path) -> None:
    with pytest.raises(CutoffError, match="lies in the future"):
        pip_cutoff.read_cutoff(cutoff_file(tmp_path, "2026-11-13T00:00:00Z"), NOW)


def test_a_missing_file_fails(tmp_path: Path) -> None:
    with pytest.raises(CutoffError, match="cannot read"):
        pip_cutoff.read_cutoff(tmp_path / "missing", NOW)


@pytest.mark.parametrize("version", ["26.1", "26.1.1", "26.2.2", "27.0"])
def test_pip_26_1_or_newer_passes(version: str) -> None:
    pip_cutoff.check_pip(version)


@pytest.mark.parametrize("version", ["26.0", "26.0.1", "25.3", "25.0", "24.0", "9.0.1", "unknown"])
def test_older_pip_fails(version: str) -> None:
    expected = r"is too old: Nodestro needs pip >= 26\.1 .*python -m pip install \"pip>=26\.1\""
    with pytest.raises(CutoffError, match=expected):
        pip_cutoff.check_pip(version)


def test_no_pip_fails() -> None:
    with pytest.raises(CutoffError, match="has no pip"):
        pip_cutoff.check_pip(None)


def test_the_command_prints_only_the_cutoff_on_stdout(tmp_path: Path) -> None:
    script = str(ROOT / "scripts" / "pip_cutoff.py")
    good = subprocess.run([sys.executable, "-I", script], capture_output=True, text=True, check=False)
    assert good.returncode == 0, good.stderr
    assert good.stdout == (ROOT / "platform" / "uploaded-prior-to").read_text(encoding="utf-8")
    bad = subprocess.run(
        [sys.executable, "-I", script, "--file", str(cutoff_file(tmp_path, "soon"))],
        capture_output=True,
        text=True,
        check=False,
    )
    assert bad.returncode == 1 and bad.stdout == ""
    assert bad.stderr.startswith("pip_cutoff: FAIL ")


def test_the_command_fails_with_an_old_pip(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(pip_cutoff, "pip_version", lambda: "25.3")
    assert pip_cutoff.main([]) == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "pip 25.3 of " in captured.err and "Nodestro needs pip >= 26.1" in captured.err


def test_pip_only_checks_the_pip_and_prints_nothing(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    """The manual install paths (the components' READMEs) refuse an old pip before pip runs, without the cutoff."""
    monkeypatch.setattr(pip_cutoff, "pip_version", lambda: "26.0.1")
    assert pip_cutoff.main(["--pip-only", "--file", str(tmp_path / "missing")]) == 1
    assert capsys.readouterr().out == ""
    monkeypatch.setattr(pip_cutoff, "pip_version", lambda: "26.1")
    assert pip_cutoff.main(["--pip-only", "--file", str(tmp_path / "missing")]) == 0
    captured = capsys.readouterr()
    assert captured.out == "" and "meets Nodestro's floor 26.1" in captured.err


def test_every_studio_reinstall_in_the_component_jobs_uses_the_cutoff() -> None:
    """N-22 (review NEW-3): the integrations suite reinstalls the studio as a wheel and editable again; each reinstall
    resolves the build backend, so each one passes the shared cutoff (pip ``--uploaded-prior-to``, uv
    ``--exclude-newer``)."""
    import re

    workflows = ROOT / ".github" / "workflows"
    found = 0
    for name in ("platform.yml", "components-at-master.yml"):
        for line in (workflows / name).read_text(encoding="utf-8").splitlines():
            if re.search(r"(pip|uv pip) install .*--no-deps.* (-e )?\.$", line.strip()):
                found += 1
                assert '--uploaded-prior-to "$cutoff"' in line or '--exclude-newer "$cutoff"' in line, (name, line)
    assert found == 4

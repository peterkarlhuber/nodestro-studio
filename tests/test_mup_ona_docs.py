"""The versioned MUP-ONA plan, its execution state and the translation check stay consistent."""

# MUP-ONA T-MUP-1

from __future__ import annotations

import importlib.util
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "architecture" / "mup-ona"
PACKAGES = [f"MP-A{n}" for n in range(12)] + [f"MP-B{n}" for n in range(9)]


def _checker():
    spec = importlib.util.spec_from_file_location(
        "mup_translation_check", ROOT / "scripts" / "mup_translation_check.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_plan_has_every_work_package_with_twenty_fields() -> None:
    # MUP-ONA T-MUP-1
    rows = _checker().package_rows((DOCS / "MUP-ONA.md").read_text(encoding="utf-8"))
    assert sorted(rows) == sorted(PACKAGES)
    assert set(rows.values()) == {20}


def test_status_lists_every_package_and_the_required_sections() -> None:
    # MUP-ONA T-MUP-2
    status = (DOCS / "STATUS.md").read_text(encoding="utf-8")
    for heading in ("## Header", "### Approvals", "## Packages", "## Pin state", "## Rollback needs", "## Deviations"):
        assert heading in status, heading
    for package in PACKAGES:
        assert re.search(rf"^\| {package} \|", status, re.M), package
    # Approvals are only valid with a verbatim quote of the client's own message (plan 8.2).
    assert "Gate G0 (Startfreigabe)" in status


def test_translation_explanations_have_reasons() -> None:
    # MUP-ONA T-MUP-3
    for raw in (DOCS / "reports" / "translation-check.explain").read_text(encoding="utf-8").splitlines():
        if raw.strip() and not raw.startswith("#"):
            body, sep, reason = raw.partition("  # ")
            assert sep and reason.strip() and " " in body, raw


def test_translation_check_detects_lost_items(tmp_path: Path) -> None:
    # MUP-ONA T-MUP-4
    checker = _checker()
    german = "# 1. Titel\n\nK1 MUSS `a.py` in 30 s.\n"
    good = "# 1. Title\n\nK1 MUST `a.py` in 30 s.\n"
    bad = "# 1. Title\n\nMUST `b.py` in 3 s.\n"
    assert checker.compare(german, good, {})[1] is True
    lines, ok = checker.compare(german, bad, {})
    assert ok is False
    text = "\n".join(lines)
    assert "K1" in text and "a.py" in text and "30 s" in text

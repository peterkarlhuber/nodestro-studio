"""The platform checks of scripts/: pins (check_versions), dependency direction (check_imports) and case clashes."""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import check_case_collisions
import check_imports
import check_versions

ROOT = Path(__file__).resolve().parents[1]
A = "a" * 40
B = "b" * 40


def versions(**commits: str) -> dict[str, Any]:
    return {"platform": "0.2.0", "components": {name: {"commit": sha} for name, sha in commits.items()}}


def pyproject(*dependencies: str, version: str = "0.2.0") -> str:
    listed = ", ".join(json.dumps(item) for item in dependencies)
    return f'[project]\nname = "x"\nversion = "{version}"\ndependencies = [{listed}]\n'


def test_matching_pins_pass() -> None:
    text = pyproject("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A)
    assert check_versions.check_pyproject("x", text, versions(**{"nodestro-runtime": A}), "0.2.0") == []


@pytest.mark.parametrize(
    ("dependency", "problem"),
    [
        ("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + B, "versions.json pins"),
        ("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@master", "not pinned"),
        ("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@v0.2.0", "not pinned"),
        ("other @ git+https://github.com/peterkarlhuber/other.git@" + A, "not in platform/versions.json"),
        ("claude-agent @ git+https://github.com/peterkarlhuber/claude-agent.git@" + A, "claude-agent"),
    ],
)
def test_wrong_pins_are_reported(dependency: str, problem: str) -> None:
    found = check_versions.check_pyproject("x", pyproject(dependency), versions(**{"nodestro-runtime": A}), None)
    assert any(problem in item for item in found), found


def test_a_wrong_version_is_reported() -> None:
    found = check_versions.check_pyproject("x", pyproject(version="0.1.0"), versions(), "0.2.0")
    assert found == ["x: version 0.1.0, versions.json says 0.2.0"]


def test_the_studio_pins_agree_with_versions_json() -> None:
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    text = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    assert check_versions.check_pyproject("nodestro-studio", text, pinned, pinned["platform"]) == []
    # The orkexa commit nodestro-runtime pins (master with the Amazon Bedrock provider; includes B-01 and M6b v2).
    assert pinned["components"]["orkexa"]["commit"] == "34679404e42dd0ae8eecfe53be21180450be5923"


def test_imports_are_read_from_the_source(tmp_path: Path) -> None:
    module = tmp_path / "m.py"
    module.write_text("import os.path\nfrom nodestro_api.app import create_app\nfrom . import sibling\n")
    assert check_imports.imports(module) == {"os", "nodestro_api"}


def test_the_installed_platform_keeps_its_dependency_direction(capsys: pytest.CaptureFixture[str]) -> None:
    assert check_imports.main() == 0, capsys.readouterr().out


def test_case_collisions_find_module_names_that_differ_only_in_case() -> None:
    found = check_case_collisions.collisions(["src/a/TestStatus.tsx", "src/a/testStatus.ts", "src/b/testStatus.ts"])
    assert found == ["module names differ only in case: src/a/TestStatus.tsx, src/a/testStatus.ts"]


def test_case_collisions_find_paths_and_directories() -> None:
    assert check_case_collisions.collisions(["Docs/a.md", "docs/b.md"]) == ["paths differ only in case: Docs, docs"]
    assert check_case_collisions.collisions(["src/foo/index.ts", "src/Foo.tsx"]) == [
        "module names differ only in case: src/Foo.tsx, src/foo"
    ]


def test_case_collisions_allow_same_case_variants() -> None:
    paths = ["src/Foo.ts", "src/Foo.tsx", "src/Foo.test.tsx", "src/foo.md", "src/FOO.json", "src/x/Foo.ts"]
    # foo.md and FOO.json are not modules (an import names their extension), so only exact paths count for them.
    assert check_case_collisions.collisions(paths) == []


def test_repository_has_no_case_clashes() -> None:
    assert check_case_collisions.collisions(check_case_collisions.tracked_files(ROOT)) == []

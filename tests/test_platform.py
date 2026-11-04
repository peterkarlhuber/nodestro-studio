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


CANONICAL = "nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A


@pytest.mark.parametrize(
    ("dependency", "problem"),
    [
        # API2-09: every other spelling of a platform component is refused, not skipped.
        ("nodestro-runtime>=0.2", "not pinned to a commit"),
        ("Nodestro_Runtime", "not pinned to a commit"),
        ("nodestro.runtime[postgres]>=0.2", "not pinned to a commit"),
        ("nodestro-runtime @ git+https://github.com/PeterKarlHuber/nodestro-runtime.git@" + A, "not the canonical"),
        ("nodestro-runtime @ git+https://github.com/someone-else/nodestro-runtime.git@" + A, "not the canonical"),
        ("nodestro-runtime @ git+ssh://git@github.com/peterkarlhuber/nodestro-runtime.git@" + A, "not the canonical"),
        ("nodestro-runtime @ https://github.com/peterkarlhuber/nodestro-runtime/archive/" + A + ".zip", "canonical"),
        ("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime@" + A, "not the canonical"),
        ("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + B, "versions.json pins"),
        ("runtime-fork @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A, "under another name"),
        ("nodestro-client @ git+https://github.com/peterkarlhuber/nodestro-sdk.git@" + A, "canonical"),
        ("this is not a requirement @@", "not a valid requirement"),
    ],
)
def test_other_spellings_of_a_component_are_reported(dependency: str, problem: str) -> None:
    pins = versions(**{"nodestro-runtime": A, "nodestro-sdk": A})
    found = check_versions.check_pyproject("x", pyproject(dependency), pins, None)
    assert len(found) == 1 and problem in found[0], found


def test_canonical_references_and_unrelated_packages_pass() -> None:
    pins = versions(**{"nodestro-runtime": A, "nodestro-sdk": A})
    sdk = "nodestro-client @ git+https://github.com/peterkarlhuber/nodestro-sdk.git@" + A + "#subdirectory=python"
    extras = "nodestro-runtime[postgres] @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A
    text = pyproject(CANONICAL, extras, sdk, "fastapi>=0.115", "x[extra]")  # "x" is the package itself
    assert check_versions.check_pyproject("x", text, pins, "0.2.0") == []


def test_a_wrong_version_is_reported() -> None:
    found = check_versions.check_pyproject("x", pyproject(version="0.1.0"), versions(), "0.2.0")
    assert found == ["x: version 0.1.0, versions.json says 0.2.0"]


def test_a_dynamic_version_is_read_from_the_version_file() -> None:
    text = '[project]\nname = "axentra"\ndynamic = ["version"]\ndependencies = []\n'
    version_file = '__version__ = "0.1.0.dev0"\n'
    assert check_versions.check_pyproject("axentra", text, versions(), "0.1.0.dev0", version_file) == []
    found = check_versions.check_pyproject("axentra", text, versions(), "0.2.0", '__version__ = "0.1.0.dev0"\n')
    assert found == ["axentra: version 0.1.0.dev0, versions.json says 0.2.0"]
    missing = check_versions.check_pyproject("axentra", text, versions(), "0.1.0.dev0", None)
    assert missing and "version_file" in missing[0]


def test_axentra_is_pinned_with_its_version_file_for_the_server_profile_only() -> None:
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    axentra = pinned["components"]["axentra"]
    assert check_versions.SHA.match(axentra["commit"])
    assert axentra["version_file"] == "src/axentra/_version.py" and not axentra.get("studio_dependency")
    studio = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    assert "axentra" not in studio  # it reaches a server only through nodestro-runtime[postgres]


def test_the_studio_pins_agree_with_versions_json() -> None:
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    text = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    assert check_versions.check_pyproject("nodestro-studio", text, pinned, pinned["platform"]) == []
    # The orkexa commit nodestro-runtime pins (orkexa #49: backend audit round 3, stale managed Ollama reclaimed).
    assert pinned["components"]["orkexa"]["commit"] == "e9c2147da68db01199394f51c1b7ef90067cb4f9"


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

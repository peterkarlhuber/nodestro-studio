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
    return {
        "platform": "0.2.0",
        "components": {name: {"commit": sha, "version": "0.2.0"} for name, sha in commits.items()},
    }


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


@pytest.mark.parametrize("dependency", ["nodestro-runtime>=0.2.0,<0.3", "nodestro-runtime[postgres]>=0.2.0.dev0,<0.3"])
def test_a_range_that_holds_the_locked_version_passes(dependency: str) -> None:
    pins = versions(**{"nodestro-runtime": A})
    assert check_versions.check_pyproject("x", pyproject(dependency), pins, None, url_pins_allowed=False) == []


def test_a_url_pin_is_refused_once_ranges_are_required() -> None:
    text = pyproject("nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A)
    found = check_versions.check_pyproject("x", text, versions(**{"nodestro-runtime": A}), None, url_pins_allowed=False)
    assert len(found) == 1 and "declare a version range" in found[0], found


def test_the_lock_files_are_generated_from_versions_json(tmp_path: Path) -> None:
    pins = versions(**{"nodestro-runtime": A, "orkexa": A, "axentra": B, "tabrion": B, "nodestro-sdk": A})
    pins["components"]["nodestro-runtime"]["studio_dependency"] = True
    assert check_versions.check_locks(pins["components"], tmp_path) == [
        f"platform/{name} does not match versions.json; run scripts/check_versions.py --write-lock"
        for name in ("internal.txt", "internal-server.txt")
    ]
    assert check_versions.check_locks(pins["components"], tmp_path, write=True) == []
    studio = (tmp_path / "internal.txt").read_text(encoding="utf-8").splitlines()
    server = (tmp_path / "internal-server.txt").read_text(encoding="utf-8").splitlines()
    url = "git+https://github.com/peterkarlhuber"
    assert [line for line in studio if not line.startswith("#")] == [
        f"nodestro-runtime @ {url}/nodestro-runtime.git@{A}",
        f"orkexa @ {url}/orkexa.git@{A}",
    ]
    assert [line for line in server if not line.startswith("#")] == [
        f"axentra @ {url}/axentra.git@{B}",
        f"nodestro-runtime @ {url}/nodestro-runtime.git@{A}",
        f"orkexa @ {url}/orkexa.git@{A}",
        f"tabrion @ {url}/tabrion.git@{B}",
    ]
    (tmp_path / "internal.txt").write_text("\n".join(studio[:-1]) + "\n", encoding="utf-8")
    assert check_versions.check_locks(pins["components"], tmp_path) == [
        "platform/internal.txt does not match versions.json; run scripts/check_versions.py --write-lock"
    ]


def test_the_studio_lock_files_are_current() -> None:
    pins = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    assert check_versions.check_locks(pins["components"], ROOT / "platform") == []


CANONICAL = "nodestro-runtime @ git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + A


@pytest.mark.parametrize(
    ("dependency", "problem"),
    [
        # API2-09: every other spelling of a platform component is refused, not skipped.
        ("nodestro-runtime>=0.3", "excludes the locked version 0.2.0"),
        ("Nodestro_Runtime", "has no version range"),
        ("nodestro.runtime[postgres]<0.2", "excludes the locked version 0.2.0"),
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
    # The orkexa commit nodestro-runtime pins (orkexa #71: reasoning replay bounded on Ollama, RT-067), with its own
    # pyproject so that check_versions.py compares orkexa's version as well.
    orkexa = pinned["components"]["orkexa"]
    assert orkexa["commit"] == "840add4bd4172c527dfb9efa7cfcc49574ebba92"
    assert orkexa["pyproject"] == "pyproject.toml"


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

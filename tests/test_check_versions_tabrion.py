"""TABRION VER-1 / QA-15 (AC-6): scripts/check_versions.py holds the one tabrion of every installation.

Negative tests of plan 06 section 6.4 (RC-1, RC-2, RC-7, RC-8) and 07 AC-6: a direct URL in a library manifest, a
different tabrion commit in runtime and api, a cycle, a pre-release specifier or pin, two pins, a commit of a version
that is not final. Each one turns the check red; an older final of the same minor in a library's
requirements/tabrion.txt is a warning only.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
import sys
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import check_dependency_policy
import check_versions

ROOT = Path(__file__).resolve().parents[1]
FINAL = "d5821faa8742dea012abda3b663549c038d76543"
OLDER = "1" * 40  # tabrion 0.1.0 is the first final; tests pretend 0.1.1 is pinned and 0.1.0 is older
DEV = "2" * 40
OTHER_MINOR = "3" * 40
RUNTIME, API, AXENTRA, ORKEXA = "a" * 40, "b" * 40, "c" * 40, "e" * 40
URL = "git+https://github.com/peterkarlhuber/tabrion.git@"
VERSION_FILES = {
    FINAL: '__version__ = "0.1.0"\n',
    OLDER: '__version__ = "0.1.0"\n',
    DEV: '__version__ = "0.1.1.dev0"\n',
    OTHER_MINOR: '__version__ = "0.2.0"\n',
}
POLICY_DATA = json.loads((ROOT / "platform" / "dependency-policy.json").read_text(encoding="utf-8"))


def versions(
    version: str = "0.1.0",
    commit: str = FINAL,
    pinned_by: list[str] | None = None,
    releases: dict[str, str] | None = None,
) -> dict[str, Any]:
    tabrion: dict[str, Any] = {"commit": commit, "version": version, "version_file": "src/tabrion/_version.py"}
    tabrion["releases"] = {version: commit} if releases is None else releases
    tabrion["pinned_by"] = pinned_by or []
    return {
        "platform": "0.2.0",
        "components": {
            "tabrion": tabrion,
            "axentra": {"commit": AXENTRA, "version": "0.2.0"},
            "orkexa": {"commit": ORKEXA, "version": "0.2.0"},
            "nodestro-runtime": {"commit": RUNTIME, "version": "0.2.0"},
            "nodestro-api": {"commit": API, "version": "0.2.0"},
        },
    }


def toml(name: str, core: list[str] | None = None, *, version: str = "0.2.0", **extras: list[str]) -> str:
    lines = [f'[project]\nname = "{name}"\nversion = "{version}"\ndependencies = {json.dumps(core or [])}\n']
    lines.append("[project.optional-dependencies]\n")
    lines += [f"{extra} = {json.dumps(items)}\n" for extra, items in extras.items()]
    return "".join(lines)


def runtime_url(component: str, commit: str) -> str:
    return f"git+https://github.com/peterkarlhuber/{component}.git@{commit}"


def manifests(runtime_pin: str = FINAL, api_pin: str = FINAL, library_range: str = ">=0.1,<0.2") -> dict[str, str]:
    """The installation of V-B0: ranges in the libraries, one git pin in runtime extras and api dev."""
    return {
        "axentra": toml(
            "axentra", [f"tabrion[postgres]{library_range}"], dev=[f"tabrion[testing,postgres]{library_range}"]
        ),
        "orkexa": toml("orkexa", postgres=[f"tabrion[postgres]{library_range}"]),
        "nodestro-runtime": toml(
            "nodestro-runtime",
            [f"orkexa @ {runtime_url('orkexa', ORKEXA)}"],
            postgres=[f"tabrion[postgres] @ {URL}{runtime_pin}", f"axentra[oidc] @ {runtime_url('axentra', AXENTRA)}"],
            dev=[f"tabrion[testing,postgres] @ {URL}{runtime_pin}"],
        ),
        "nodestro-api": toml(
            "nodestro-api",
            [
                f"nodestro-runtime @ {runtime_url('nodestro-runtime', RUNTIME)}",
                f"orkexa @ {runtime_url('orkexa', ORKEXA)}",
            ],
            dev=[f"tabrion[testing,postgres] @ {URL}{api_pin}"],
        ),
    }


def requirements(axentra: str | None = None, orkexa: str | None = None) -> dict[str, str | None]:
    pin = f"# the one tabrion of the standalone install (VER-1)\ntabrion @ {URL}{FINAL}\n"
    return {"axentra": pin if axentra is None else axentra, "orkexa": pin if orkexa is None else orkexa}


def policy(data: dict[str, Any] | None = None) -> check_dependency_policy.Policy:
    return check_dependency_policy.Policy(data or POLICY_DATA)


def check(
    pins: dict[str, Any] | None = None,
    texts: dict[str, str] | None = None,
    files: dict[str, str | None] | None = None,
    rules: check_dependency_policy.Policy | None = None,
) -> tuple[list[str], list[str]]:
    """check_pyproject of every manifest plus check_tabrion, as main() runs them."""
    pins = pins or versions()
    texts = manifests() if texts is None else texts
    rules = rules or policy()
    problems: list[str] = []
    for repo, text in texts.items():
        ranges = check_versions.foundation_ranges(repo, rules, pins["components"])
        problems += check_versions.check_pyproject(repo, text, pins, None, None, ranges)
    more, warnings = check_versions.check_tabrion(
        pins, texts, rules, requirements() if files is None else files, VERSION_FILES.get
    )
    return problems + more, warnings


def test_the_v_b0_installation_passes() -> None:
    assert check() == ([], [])
    assert check(versions(pinned_by=["nodestro-runtime", "nodestro-api"])) == ([], [])


def test_master_state_today_passes_before_any_tabrion_pin() -> None:
    """Before MIG-NOD-1/PIN-W1 nobody references tabrion and the libraries have no requirements file yet."""
    texts = {
        "axentra": toml("axentra"),
        "orkexa": toml("orkexa"),
        "nodestro-runtime": toml("nodestro-runtime", [f"orkexa @ {runtime_url('orkexa', ORKEXA)}"]),
        "nodestro-api": toml("nodestro-api", [f"nodestro-runtime @ {runtime_url('nodestro-runtime', RUNTIME)}"]),
    }
    assert check(texts=texts, files={"axentra": None, "orkexa": None}) == ([], [])


def test_pinned_by_turns_the_pin_strict() -> None:
    texts = manifests()
    texts["nodestro-api"] = toml("nodestro-api", [f"nodestro-runtime @ {runtime_url('nodestro-runtime', RUNTIME)}"])
    problems, _ = check(versions(pinned_by=["nodestro-runtime", "nodestro-api"]), texts)
    assert problems == ["nodestro-api: does not pin tabrion (versions.json pinned_by, RC-2)"]
    problems, _ = check(versions(pinned_by=["nodestro-sdk"]))
    assert problems == ["versions.json: tabrion pinned_by names nodestro-sdk, which is not a pinned component"]


@pytest.mark.parametrize(
    "requirement",
    [
        f"tabrion[postgres] @ {URL}{FINAL}",
        f"tabrion @ git+https://github.com/peterkarlhuber/tabrion@{FINAL}",
        "tabrion @ https://example.org/tabrion-0.1.0-py3-none-any.whl",
    ],
)
def test_a_direct_url_in_a_library_manifest_is_refused(requirement: str) -> None:
    texts = manifests()
    texts["axentra"] = toml("axentra", [requirement])
    problems, _ = check(texts=texts)
    assert any(
        "axentra: a library requires tabrion by a version range, never by a direct URL (RC-1)" in p for p in problems
    )
    assert any(p.startswith("dependency policy: axentra (core)") and "RC-1" in p for p in problems), problems


def test_a_library_needs_a_range_that_holds_the_pinned_version() -> None:
    texts = manifests()
    texts["orkexa"] = toml("orkexa", postgres=["tabrion[postgres]>=0.2,<0.3"])
    problems, _ = check(texts=texts)
    assert problems == ["orkexa: tabrion[postgres]<0.3,>=0.2 does not contain tabrion 0.1.0 of versions.json (RC-2)"]
    texts["orkexa"] = toml("orkexa", postgres=["tabrion[postgres]"])
    problems, _ = check(texts=texts)
    assert problems == ["orkexa: tabrion[postgres] has no version range; a library requires tabrion by one (RC-1)"]


@pytest.mark.parametrize(("runtime", "api"), [(FINAL, OLDER), (OLDER, FINAL), (FINAL, "master")])
def test_a_different_tabrion_in_runtime_and_api_is_refused(runtime: str, api: str) -> None:
    problems, _ = check(texts=manifests(runtime_pin=runtime, api_pin=api))
    assert any(p.startswith("more than one tabrion in one installation (K-34, RC-2)") for p in problems), problems
    assert any("versions.json pins d5821faa8742" in p or "not pinned to a commit" in p for p in problems), problems


def test_runtime_and_api_on_one_commit_other_than_versions_json_are_refused() -> None:
    problems, _ = check(texts=manifests(runtime_pin=OLDER, api_pin=OLDER))
    assert problems and all("versions.json pins d5821faa8742" in p for p in problems), problems


def test_a_cycle_in_the_policy_is_refused() -> None:
    data = copy.deepcopy(POLICY_DATA)
    data["edges"].append(
        {"from": "nodestro-runtime", "to": "nodestro-api", "kind": "dev", "extra": "dev", "status": "active"}
    )
    problems, _ = check(rules=policy(data))
    assert any(
        p.startswith("dependency policy: cycle: ") and "-> nodestro-runtime -> nodestro-api (P5)" in p for p in problems
    ), problems


def test_a_cycle_in_the_pinned_graph_is_refused() -> None:
    texts = manifests()
    runtime_on_api = f"nodestro-api @ {runtime_url('nodestro-api', API)}"
    texts["nodestro-runtime"] = toml("nodestro-runtime", [runtime_on_api])
    problems, _ = check(texts=texts)
    cycle = "cycle in the pinned dependency graph: nodestro-api -> nodestro-runtime -> nodestro-api (P5, AC-6)"
    assert cycle in problems
    assert any("no edge nodestro-runtime -> nodestro-api in the policy (K-33)" in p for p in problems), problems


@pytest.mark.parametrize("specifier", [">=0.1.0a1,<0.2", ">=0.1.0rc1,<0.2", ">=0.1,<0.2.0a1", "==0.1.1.dev0"])
def test_a_pre_release_specifier_in_a_library_is_refused(specifier: str) -> None:
    problems, _ = check(texts=manifests(library_range=specifier))
    assert problems and all("names a pre-release; master carries only final ranges (RC-8)" in p for p in problems)


def test_a_pre_release_specifier_in_nodestro_is_refused() -> None:
    texts = manifests()
    texts["nodestro-api"] = toml("nodestro-api", dev=["tabrion[testing,postgres]>=0.1.0a1"])
    problems, _ = check(texts=texts)
    assert (
        "nodestro-api: 'tabrion[testing,postgres]>=0.1.0a1' names a pre-release; master carries none (RC-8)" in problems
    )


@pytest.mark.parametrize("version", ["0.1.1.dev0", "0.1.0a1", "0.1.0rc1", "0.1.0+local"])
def test_a_pre_release_pin_in_versions_json_is_refused(version: str) -> None:
    problems, _ = check(versions(version=version), texts=manifests(), files={"axentra": None, "orkexa": None})
    assert f"versions.json: tabrion {version} is not a final version; master pins only finals (RC-8)" in problems


def test_two_pins_in_requirements_are_refused() -> None:
    two = f"tabrion @ {URL}{FINAL}\ntabrion[postgres] @ {URL}{FINAL}\n"
    problems, _ = check(files=requirements(axentra=two))
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: 2 requirement lines, "
        "exactly one tabrion pin belongs here (RC-8)"
    ]


@pytest.mark.parametrize(
    ("text", "problem"),
    [
        ("", "0 requirement lines"),
        ("tabrion>=0.1,<0.2\n", "is not the git pin of one commit"),
        ("tabrion==0.1.0rc1\n", "names a pre-release; master carries none (RC-8)"),
        (f"tabrion @ git+https://github.com/peterkarlhuber/tabrion@{FINAL}\n", "is not the git pin of one commit"),
        (f"tabrion @ {URL}master\n", "is not the git pin of one commit"),
        (f"tabrion @ {URL}v0.1.0\n", "is not the git pin of one commit"),
        (f"orkexa @ {URL}{FINAL}\n", "does not belong here"),
        ("--index-url https://example.org/simple\n", "no option"),
    ],
)
def test_a_malformed_requirements_file_is_refused(text: str, problem: str) -> None:
    problems, _ = check(files=requirements(orkexa=text))
    assert len(problems) == 1 and problem in problems[0] and problems[0].startswith("orkexa@"), problems


def test_a_library_that_requires_tabrion_needs_the_requirements_file() -> None:
    problems, _ = check(files={"axentra": None, "orkexa": requirements()["orkexa"]})
    assert problems == [f"axentra@{AXENTRA[:12]}: requires tabrion but has no requirements/tabrion.txt (VER-1)"]


def test_a_commit_of_a_non_final_version_is_refused() -> None:
    problems, _ = check(files=requirements(axentra=f"tabrion @ {URL}{DEV}\n"))
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{DEV[:12]} is 0.1.1.dev0, not a final version (RC-8)"
    ]


def test_an_unknown_commit_is_refused() -> None:
    unknown = "9" * 40
    problems, _ = check(files=requirements(axentra=f"tabrion @ {URL}{unknown}\n"))
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{unknown[:12]} cannot be read "
        "(not a tabrion commit?)"
    ]


def test_an_older_final_of_the_same_minor_is_a_warning_only() -> None:
    """RC-7: a library may stay on an older patch of the minor; the drift is reported, not refused."""
    pins = versions(version="0.1.1", commit="4" * 40, releases={"0.1.0": OLDER, "0.1.1": "4" * 40})
    texts = manifests(runtime_pin="4" * 40, api_pin="4" * 40)
    files = {"axentra": f"tabrion @ {URL}{OLDER}\n", "orkexa": f"tabrion @ {URL}{OLDER}\n"}
    problems, warnings = check(pins, texts, files)
    assert problems == []
    assert warnings == [
        f"{repo}@{commit[:12]} requirements/tabrion.txt: tabrion 0.1.0@{OLDER[:12]} is an older final than "
        f"0.1.1@{'4' * 12} (RC-7)"
        for repo, commit in (("axentra", AXENTRA), ("orkexa", ORKEXA))
    ]


def test_a_final_outside_the_range_or_of_another_minor_is_refused() -> None:
    releases = {"0.1.0": FINAL, "0.2.0": OTHER_MINOR}
    problems, _ = check(versions(releases=releases), files=requirements(orkexa=f"tabrion @ {URL}{OTHER_MINOR}\n"))
    assert problems == [
        f"orkexa@{ORKEXA[:12]} requirements/tabrion.txt: tabrion 0.2.0@{OTHER_MINOR[:12]} is outside the library's "
        "range tabrion[postgres]<0.2,>=0.1"
    ]
    texts = manifests(library_range=">=0.1,<0.3")
    problems, _ = check(versions(releases=releases), texts, requirements(orkexa=f"tabrion @ {URL}{OTHER_MINOR}\n"))
    assert problems == [
        f"orkexa@{ORKEXA[:12]} requirements/tabrion.txt: tabrion 0.2.0@{OTHER_MINOR[:12]}, versions.json pins 0.1.0 "
        "(another minor)"
    ]


def test_the_studio_never_pins_tabrion() -> None:
    texts = {**manifests(), "nodestro-studio": toml("nodestro", [f"tabrion @ {URL}{FINAL}"])}
    problems, _ = check(texts=texts)
    assert any("no edge nodestro-studio -> tabrion in the policy (K-33)" in p for p in problems), problems


def test_versions_json_declares_the_tabrion_final() -> None:
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    tabrion = pinned["components"]["tabrion"]
    assert tabrion["commit"] == FINAL and tabrion["version"] == "0.1.0"
    assert tabrion["version_file"] == "src/tabrion/_version.py" and not tabrion.get("studio_dependency")
    assert tabrion["releases"] == {"0.1.0": FINAL}
    assert check_versions.is_final(tabrion["version"])
    assert set(tabrion["pinned_by"]) <= {"nodestro-runtime", "nodestro-api"}


# main() end to end, with the files of each repository served from memory instead of GitHub.


def serve(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, files: dict[tuple[str, str, str], str]) -> None:
    def read_remote(repo: str, commit: str, path: str, cache: Path) -> str:
        if (repo, commit, path) not in files:
            raise check_versions.subprocess.CalledProcessError(128, ["git", "show", f"{commit}:{path}"])
        return files[repo, commit, path]

    monkeypatch.setattr(check_versions, "read_remote", read_remote)
    monkeypatch.setattr(check_versions.Reader, "exists", lambda self, repo, ref, path: (repo, ref, path) in files)
    monkeypatch.setattr(check_versions, "ROOT", tmp_path)
    (tmp_path / "pyproject.toml").write_text(
        toml("nodestro", [f"nodestro-api @ {runtime_url('nodestro-api', API)}"], version="0.2.0"), encoding="utf-8"
    )


def repository(
    texts: dict[str, str], pins: dict[str, Any], **requirement_files: str
) -> dict[tuple[str, str, str], str]:
    files = {(repo, pins["components"][repo]["commit"], "pyproject.toml"): text for repo, text in texts.items()}
    files[("tabrion", FINAL, "pyproject.toml")] = toml("tabrion", version="0.1.0")
    for commit, text in VERSION_FILES.items():
        files[("tabrion", commit, "src/tabrion/_version.py")] = text
    for repo, text in requirement_files.items():
        files[(repo, pins["components"][repo]["commit"], "requirements/tabrion.txt")] = text
        files[(repo, "HEAD", "requirements/tabrion.txt")] = text
        files[(repo, "HEAD", "pyproject.toml")] = texts[repo]
    return files


def run_main(tmp_path: Path, pins: dict[str, Any], *args: str) -> int:
    for entry in pins["components"].values():
        entry["pyproject"] = "pyproject.toml"
    path = tmp_path / "versions.json"
    path.write_text(json.dumps(pins), encoding="utf-8")
    return check_versions.main(["--versions", str(path), *args])


def test_main_reports_one_tabrion(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    pins = versions(pinned_by=["nodestro-runtime", "nodestro-api"])
    pin = f"tabrion @ {URL}{FINAL}\n"
    serve(monkeypatch, tmp_path, repository(manifests(), pins, axentra=pin, orkexa=pin))
    assert run_main(tmp_path, pins) == 0
    assert (
        capsys.readouterr().out.splitlines()[-1]
        == "pins agree, one tabrion 0.1.0@d5821faa8742, graph acyclic, policy ok"
    )


def test_main_fails_on_two_tabrions(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    pins = versions()
    pin = f"tabrion @ {URL}{FINAL}\n"
    serve(monkeypatch, tmp_path, repository(manifests(api_pin=OLDER), pins, axentra=pin, orkexa=pin))
    assert run_main(tmp_path, pins) == 1
    out = capsys.readouterr().out
    assert "::error::more than one tabrion in one installation (K-34, RC-2)" in out
    assert out.splitlines()[-1] == "2 problems"


def test_drift_only_reports(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    pins = versions(version="0.1.1", commit="4" * 40, releases={"0.1.0": OLDER, "0.1.1": "4" * 40})
    pins["components"]["tabrion"]["pyproject"] = None
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    files = repository(manifests(), pins, axentra=f"tabrion @ {URL}{OLDER}\n", orkexa=f"tabrion @ {URL}{DEV}\n")
    serve(monkeypatch, tmp_path, files)
    assert run_main(tmp_path, pins, "--drift") == 0
    out = capsys.readouterr().out
    assert "::warning::axentra@HEAD requirements/tabrion.txt: tabrion 0.1.0@111111111111 is an older final" in out
    assert "::warning::orkexa@HEAD requirements/tabrion.txt: tabrion@222222222222 is 0.1.1.dev0, not a final" in out
    assert out.splitlines()[-1] == "tabrion drift: 2 findings (report only)"
    assert summary.read_text(encoding="utf-8").startswith("## tabrion drift (RC-7, report only)")


def test_drift_in_sync(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    pins = versions()
    pin = f"tabrion @ {URL}{FINAL}\n"
    serve(monkeypatch, tmp_path, repository(manifests(), pins, axentra=pin, orkexa=pin))
    assert run_main(tmp_path, pins, "--drift") == 0
    assert capsys.readouterr().out.splitlines()[-1] == "tabrion drift: in sync"


# Review follow-ups: no index fallback (M-1), release commits (M-2), markers, comments, --local, drift.


@pytest.mark.parametrize("pinned_by", [[], ["nodestro-runtime", "nodestro-api"]])
def test_a_library_range_without_a_pin_on_the_way_is_refused(pinned_by: list[str]) -> None:
    """Between MIG-*-1 and PIN-W1: axentra requires tabrion, runtime[postgres] pulls axentra without a tabrion pin."""
    texts = manifests()
    texts["nodestro-runtime"] = toml(
        "nodestro-runtime",
        [f"orkexa @ {runtime_url('orkexa', ORKEXA)}"],
        postgres=[f"axentra[oidc] @ {runtime_url('axentra', AXENTRA)}"],
        dev=[f"tabrion[testing,postgres] @ {URL}{FINAL}"],
    )
    problems, _ = check(versions(pinned_by=pinned_by), texts)
    assert problems == [
        "nodestro-runtime[postgres]: pulls tabrion by the range of axentra without a tabrion pin, so pip would take it "
        f"from a package index; pin tabrion @ {URL}{FINAL} there (RC-2, K-34)"
    ]


def test_a_pin_further_down_covers_the_range() -> None:
    """api[server] pulls runtime[postgres], whose own pin covers axentra's range; the dev-only W1 pins are fine while
    the pinned libraries require tabrion only in their dev extra."""
    texts = manifests()
    texts["nodestro-api"] = toml(
        "nodestro-api",
        [f"nodestro-runtime @ {runtime_url('nodestro-runtime', RUNTIME)}"],
        server=[f"nodestro-runtime[postgres] @ {runtime_url('nodestro-runtime', RUNTIME)}"],
        dev=[f"tabrion[testing,postgres] @ {URL}{FINAL}"],
    )
    assert check(texts=texts) == ([], [])
    w1 = {
        "axentra": toml("axentra", dev=["tabrion[testing,postgres]>=0.1,<0.2"]),
        "orkexa": toml("orkexa", dev=["tabrion[testing,postgres]>=0.1,<0.2"]),
        "nodestro-runtime": toml(
            "nodestro-runtime",
            [f"orkexa @ {runtime_url('orkexa', ORKEXA)}"],
            postgres=[f"axentra[oidc] @ {runtime_url('axentra', AXENTRA)}"],
            dev=[f"tabrion[testing,postgres] @ {URL}{FINAL}"],
        ),
        "nodestro-api": toml(
            "nodestro-api",
            [f"nodestro-runtime @ {runtime_url('nodestro-runtime', RUNTIME)}"],
            dev=[f"tabrion[testing,postgres] @ {URL}{FINAL}"],
        ),
    }
    assert check(texts=w1) == ([], [])


def test_a_commit_that_only_reads_the_final_version_is_refused() -> None:
    """tabrion 433a3056a merges master (0.1.0) into a branch and reads 0.1.0; it is not the release commit."""
    problems, warnings = check(files=requirements(axentra=f"tabrion @ {URL}{OLDER}\n"))
    assert warnings == []
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{OLDER[:12]} reads 0.1.0 but is not a release "
        "commit (versions.json releases); pin the release commit (RC-8)"
    ]


@pytest.mark.parametrize(
    ("releases", "problem"),
    [
        ({}, "versions.json: tabrion needs releases"),
        ({"0.1.0": OLDER}, "is not the release commit of 0.1.0 in releases"),
        ({"0.1.0": FINAL, "0.1.1rc1": DEV}, "releases names 0.1.1rc1, not a final version"),
        ({"0.1.0": FINAL, "0.0.9": FINAL}, "one commit for two versions"),
        ({"0.1.0": FINAL, "0.0.9": "abc"}, "is not a full commit"),
    ],
)
def test_the_releases_map_is_checked(releases: dict[str, str], problem: str) -> None:
    problems, _ = check(versions(releases=releases))
    assert any(problem in p for p in problems), problems


def test_a_release_whose_version_file_disagrees_is_refused() -> None:
    pins = versions(releases={"0.1.0": FINAL, "0.1.1": OLDER})  # OLDER reads 0.1.0
    problems, _ = check(pins, files=requirements(axentra=f"tabrion @ {URL}{OLDER}\n"))
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{OLDER[:12]} reads 0.1.0, versions.json releases "
        "says 0.1.1"
    ]


def test_environment_markers_on_tabrion_are_refused() -> None:
    marker = "; python_version < '3'"
    problems, _ = check(files=requirements(orkexa=f"tabrion @ {URL}{FINAL} {marker}\n"))
    assert len(problems) == 1 and "carries no environment marker" in problems[0], problems
    texts = manifests()
    texts["nodestro-api"] = toml("nodestro-api", dev=[f"tabrion[testing,postgres] @ {URL}{FINAL} {marker}"])
    problems, _ = check(texts=texts)
    assert any(p.startswith("nodestro-api: ") and "carries no environment marker" in p for p in problems), problems
    texts = manifests(library_range=f">=0.1,<0.2{marker}")
    problems, _ = check(texts=texts)
    assert problems and all("carries no environment marker" in p for p in problems), problems


def test_a_tab_before_an_inline_comment_is_accepted() -> None:
    assert check(files=requirements(orkexa=f"tabrion @ {URL}{FINAL}\t# v0.1.0\n")) == ([], [])


def test_local_without_a_tabrion_checkout_says_so(tmp_path: Path) -> None:
    with pytest.raises(SystemExit, match="no checkout of tabrion; --local needs every component"):
        check_versions.read_local(tmp_path, "tabrion", FINAL, "pyproject.toml", False)


def test_drift_tells_unreadable_from_missing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    pins = versions()
    serve(monkeypatch, tmp_path, repository(manifests(), pins, axentra=f"tabrion @ {URL}{FINAL}\n"))
    states = {"axentra": True, "orkexa": None}
    monkeypatch.setattr(check_versions.Reader, "exists", lambda self, repo, ref, path: states[repo])
    assert run_main(tmp_path, pins, "--drift") == 0
    out = capsys.readouterr().out
    assert "::warning::orkexa@HEAD: cannot read orkexa (network or access), drift unknown" in out
    states["orkexa"] = False
    assert run_main(tmp_path, pins, "--drift") == 0
    assert "::warning::orkexa@HEAD: no requirements/tabrion.txt on the default branch" in capsys.readouterr().out

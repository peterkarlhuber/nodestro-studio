"""TABRION VER-1 / QA-15 (AC-6): scripts/check_versions.py holds the one tabrion of every installation.

Under the lock model (CI-FAST P3) every component requires tabrion by one final minor range (``>=0.1,<0.2``) and the
studio lock (platform/internal*.txt) holds its one commit. Negative tests of plan 06 section 6.4 (RC-1, RC-2, RC-7,
RC-8) and 07 AC-6: a URL in a component, a pre-release bound, different ranges, two tabrions or a non-canonical line
in the lock, a locked version outside the range, an unknown commit, a cycle. Each one turns the check red; an older
final of the same minor in a library's requirements/tabrion.txt is a warning only.
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
FINAL_0_2_0 = "52353daee6cd6e37a7efc45b74061a48beb2b280"
CURRENT = "af0458d54467571abfc1afdd44d76e1f4d727c06"  # the locked final (TABRION 0.2.1 switch)
OLDER = "1" * 40  # tabrion 0.1.0 is the first final; tests pretend 0.1.1 is pinned and 0.1.0 is older
DEV = "2" * 40
OTHER_MINOR = "3" * 40
RUNTIME, API, AXENTRA, ORKEXA = "a" * 40, "b" * 40, "c" * 40, "e" * 40
URL = "git+https://github.com/peterkarlhuber/tabrion.git@"
RANGE = ">=0.1,<0.2"
VERSION_FILES = {
    FINAL: '__version__ = "0.1.0"\n',
    OLDER: '__version__ = "0.1.0"\n',
    DEV: '__version__ = "0.1.1.dev0"\n',
    OTHER_MINOR: '__version__ = "0.2.0"\n',
}
POLICY_DATA = json.loads((ROOT / "platform" / "dependency-policy.json").read_text(encoding="utf-8"))
SERVER_LOCK = "internal-server.txt"


def versions(version: str = "0.1.0", commit: str = FINAL, releases: dict[str, str] | None = None) -> dict[str, Any]:
    tabrion: dict[str, Any] = {"commit": commit, "version": version, "version_file": "src/tabrion/_version.py"}
    tabrion["releases"] = {version: commit} if releases is None else releases
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


def manifests(library: str = RANGE, runtime: str = RANGE, api: str = RANGE) -> dict[str, str]:
    """The installation of the lock model: every component requires tabrion by a range, the lock holds the commit."""
    return {
        "axentra": toml("axentra", [f"tabrion[postgres]{library}"], dev=[f"tabrion[testing,postgres]{library}"]),
        "orkexa": toml("orkexa", postgres=[f"tabrion[postgres]{library}"]),
        "nodestro-runtime": toml(
            "nodestro-runtime",
            ["orkexa>=0.2,<0.3"],
            postgres=[f"tabrion[postgres]{runtime}", "axentra[oidc]>=0.2,<0.3"],
            dev=[f"tabrion[testing,postgres]{runtime}"],
        ),
        "nodestro-api": toml(
            "nodestro-api",
            ["nodestro-runtime>=0.2,<0.3", "orkexa>=0.2,<0.3"],
            dev=[f"tabrion[testing,postgres]{api}"],
        ),
    }


def requirements(axentra: str | None = None, orkexa: str | None = None) -> dict[str, str | None]:
    pin = f"# the one tabrion of the standalone install (VER-1)\ntabrion @ {URL}{FINAL}\n"
    return {"axentra": pin if axentra is None else axentra, "orkexa": pin if orkexa is None else orkexa}


def locks(pins: dict[str, Any] | None = None, **lines: str) -> dict[str, str]:
    """The lock files versions.json generates; ``lines`` (file stem -> text) replaces the tabrion line of a file
    (``internal_server=...``) or adds one to a file without it (``internal=...``)."""
    components = (pins or versions())["components"]
    out = {name: check_versions.lock_text(components, profile) for profile, name in check_versions.LOCK_FILES.items()}
    generated = f"tabrion @ {URL}{components['tabrion']['commit']}\n"
    for stem, line in lines.items():
        name = stem.replace("_", "-") + ".txt"
        text = out[name]
        out[name] = text.replace(generated, line) if generated in text else text + line
    return out


def policy(data: dict[str, Any] | None = None) -> check_dependency_policy.Policy:
    return check_dependency_policy.Policy(data or POLICY_DATA)


def check(
    pins: dict[str, Any] | None = None,
    texts: dict[str, str] | None = None,
    files: dict[str, str | None] | None = None,
    rules: check_dependency_policy.Policy | None = None,
    lock: dict[str, str] | None = None,
) -> tuple[list[str], list[str]]:
    """check_pyproject of every manifest plus check_tabrion, as main() runs them."""
    pins = pins or versions()
    texts = manifests() if texts is None else texts
    rules = rules or policy()
    problems: list[str] = []
    for repo, text in texts.items():
        problems += check_versions.check_pyproject(repo, text, pins, None, None)
    more, warnings = check_versions.check_tabrion(
        pins,
        texts,
        rules,
        requirements() if files is None else files,
        VERSION_FILES.get,
        locks(pins) if lock is None else lock,
    )
    return problems + more, warnings


def test_the_lock_model_installation_passes() -> None:
    assert check() == ([], [])


def test_an_installation_without_a_tabrion_requirement_passes() -> None:
    texts = {
        "axentra": toml("axentra"),
        "orkexa": toml("orkexa"),
        "nodestro-runtime": toml("nodestro-runtime", ["orkexa>=0.2,<0.3"]),
        "nodestro-api": toml("nodestro-api", ["nodestro-runtime>=0.2,<0.3"]),
    }
    assert check(texts=texts, files={"axentra": None, "orkexa": None}) == ([], [])


# Rule 1: every component requires tabrion by one final minor range (RC-1, RC-8).


@pytest.mark.parametrize(
    "requirement",
    [
        f"tabrion[postgres] @ {URL}{FINAL}",
        f"tabrion @ git+https://github.com/peterkarlhuber/tabrion@{FINAL}",
        "tabrion @ https://example.org/tabrion-0.1.0-py3-none-any.whl",
    ],
)
@pytest.mark.parametrize("repo", ["axentra", "nodestro-runtime", "nodestro-api"])
def test_a_url_in_a_component_is_refused(repo: str, requirement: str) -> None:
    texts = manifests()
    texts[repo] = toml(repo, dev=[requirement])
    problems, _ = check(texts=texts)
    assert any(
        p.startswith(f"{repo}: ")
        and "tabrion is required by a range, never by a URL; the lock holds the commit (RC-1)" in p
        for p in problems
    ), problems
    if repo == "axentra":
        assert any(p.startswith("dependency policy: axentra") and "RC-1" in p for p in problems), problems


@pytest.mark.parametrize(
    "specifier", ["", ">=0.1", "<0.2", ">=0.1,<0.3", "==0.1.0", "~=0.1", ">=0.1,<1", ">=0.1,!=0.1.1"]
)
def test_a_range_that_is_not_one_minor_is_refused(specifier: str) -> None:
    texts = manifests()
    texts["nodestro-api"] = toml("nodestro-api", dev=[f"tabrion[testing,postgres]{specifier}"])
    problems, _ = check(texts=texts)
    assert any(
        p.startswith("nodestro-api: ") and "require tabrion by a minor range >=M.N,<M.(N+1)" in p for p in problems
    )


@pytest.mark.parametrize("specifier", [">=0.1.0a1,<0.2", ">=0.1.0rc1,<0.2", ">=0.1,<0.2.0a1", ">=0.1.dev0,<0.2"])
@pytest.mark.parametrize("repo", ["orkexa", "nodestro-runtime"])
def test_a_pre_release_bound_is_refused(repo: str, specifier: str) -> None:
    texts = manifests()
    texts[repo] = toml(repo, postgres=[f"tabrion[postgres]{specifier}"])
    problems, _ = check(texts=texts)
    assert any(
        p.startswith(f"{repo}: ") and "names a pre-release; master carries only final ranges (RC-8)" in p
        for p in problems
    ), problems


def test_a_patch_lower_bound_is_one_minor() -> None:
    assert check(texts=manifests(library=">=0.1.0,<0.2.0", api=">=0.1.0,<0.2")) == ([], [])


def test_environment_markers_on_tabrion_are_refused() -> None:
    marker = "; python_version < '3'"
    problems, _ = check(files=requirements(orkexa=f"tabrion @ {URL}{FINAL} {marker}\n"))
    assert len(problems) == 1 and "carries no environment marker" in problems[0], problems
    problems, _ = check(texts=manifests(api=f"{RANGE}{marker}"))
    assert problems == [
        'nodestro-api: tabrion[postgres,testing]<0.2,>=0.1; python_version < "3": a tabrion requirement carries no '
        "environment marker (it could install nothing)"
    ]


# RC-2: one range in every component, one tabrion in the lock.


def test_a_mismatched_range_between_components_is_refused() -> None:
    problems, _ = check(texts=manifests(api=">=0.2,<0.3"))
    assert (
        "the components require different tabrion ranges, one minor belongs everywhere (RC-2): >=0.1,<0.2 (axentra, "
        "nodestro-runtime, orkexa); >=0.2,<0.3 (nodestro-api)"
    ) in problems
    assert any(
        p.startswith("lock: tabrion 0.1.0@d5821faa8742 lies outside the range of nodestro-api: ") for p in problems
    )


def test_two_tabrion_lines_in_the_lock_are_refused() -> None:
    problems, _ = check(lock=locks(internal_server=f"tabrion @ {URL}{FINAL}\ntabrion[postgres] @ {URL}{FINAL}\n"))
    assert "platform/internal-server.txt: 2 tabrion lines, the lock holds exactly one (K-34, RC-2)" in problems


def test_two_commits_in_the_lock_files_are_refused() -> None:
    pins = versions(releases={"0.1.0": FINAL, "0.1.1": OLDER})
    problems, _ = check(pins, lock=locks(pins, internal=f"tabrion @ {URL}{OLDER}\n"))
    assert problems == [
        f"more than one tabrion commit in the lock (K-34, RC-2): {OLDER[:12]} (internal.txt); {FINAL[:12]} "
        "(internal-server.txt)"
    ]


def test_the_same_commit_in_both_lock_files_passes() -> None:
    assert check(lock=locks(internal=f"tabrion @ {URL}{FINAL}\n")) == ([], [])


def test_a_lock_without_tabrion_is_refused() -> None:
    problems, _ = check(lock=locks(internal="", internal_server=""))
    assert problems == ["the lock (internal-server.txt, internal.txt) holds no tabrion; it holds exactly one (K-34)"]


@pytest.mark.parametrize(
    "line",
    [
        f"tabrion @ {URL}{FINAL[:12]}",
        f"tabrion @ {URL}v0.1.0",
        f"tabrion @ {URL}master",
        f"tabrion @ git+ssh://git@github.com/peterkarlhuber/tabrion.git@{FINAL}",
        f"tabrion @ {URL}{FINAL.upper()}",
        f"tabrion @ git+https://github.com/peterkarlhuber/tabrion@{FINAL}",
        f"tabrion @ git+https://github.com/someone/tabrion.git@{FINAL}",
        f"tabrion[postgres] @ {URL}{FINAL}",
        "tabrion==0.1.0",
        f"Tabrion @ {URL}{FINAL}",
    ],
)
def test_a_non_canonical_lock_line_is_refused(line: str) -> None:
    problems, _ = check(lock=locks(internal_server=f"{line}\n"))
    assert problems == [
        f"platform/internal-server.txt: {line!r} is not the canonical tabrion lock line "
        f"tabrion @ {URL}<40 lowercase hex>"
    ]


def test_a_locked_version_outside_the_range_is_refused() -> None:
    pins = versions(releases={"0.1.0": FINAL, "0.2.0": OTHER_MINOR})
    problems, _ = check(
        pins,
        lock=locks(pins, internal=f"tabrion @ {URL}{OTHER_MINOR}\n", internal_server=f"tabrion @ {URL}{OTHER_MINOR}\n"),
    )
    assert problems == [
        f"lock: tabrion 0.2.0@{OTHER_MINOR[:12]} lies outside the range of "
        + "; ".join(
            f"{repo}: {item}"
            for repo, item in [
                ("axentra", "tabrion[postgres]<0.2,>=0.1"),
                ("axentra", "tabrion[postgres,testing]<0.2,>=0.1"),
                ("orkexa", "tabrion[postgres]<0.2,>=0.1"),
                ("nodestro-runtime", "tabrion[postgres]<0.2,>=0.1"),
                ("nodestro-runtime", "tabrion[postgres,testing]<0.2,>=0.1"),
                ("nodestro-api", "tabrion[postgres,testing]<0.2,>=0.1"),
            ]
        )
        + " (RC-2)"
    ]


@pytest.mark.parametrize("commit", ["9" * 40, OLDER])
def test_an_unknown_lock_commit_is_refused(commit: str) -> None:
    """An unknown commit, or one that only reads 0.1.0 (a merge of master into a branch), is no known release."""
    problems, _ = check(lock=locks(internal=f"tabrion @ {URL}{commit}\n", internal_server=f"tabrion @ {URL}{commit}\n"))
    assert problems == [f"lock: tabrion@{commit[:12]} is not a known final release (versions.json releases, RC-8)"]


# The dependency policy and the graph (K-33, P5).


def test_a_cycle_in_the_policy_is_refused() -> None:
    data = copy.deepcopy(POLICY_DATA)
    data["edges"].append(
        {"from": "nodestro-runtime", "to": "nodestro-api", "kind": "dev", "extra": "dev", "status": "active"}
    )
    problems, _ = check(rules=policy(data))
    assert any(
        p.startswith("dependency policy: cycle: ") and "-> nodestro-runtime -> nodestro-api (P5)" in p for p in problems
    ), problems


def test_a_cycle_in_the_locked_graph_is_refused() -> None:
    texts = manifests()
    texts["nodestro-runtime"] = toml("nodestro-runtime", ["nodestro-api>=0.2,<0.3"])
    problems, _ = check(texts=texts)
    cycle = "cycle in the pinned dependency graph: nodestro-api -> nodestro-runtime -> nodestro-api (P5, AC-6)"
    assert cycle in problems
    assert any("no edge nodestro-runtime -> nodestro-api in the policy (K-33)" in p for p in problems), problems


def test_the_studio_never_requires_tabrion() -> None:
    texts = {**manifests(), "nodestro-studio": toml("nodestro", [f"tabrion{RANGE}"])}
    problems, _ = check(texts=texts)
    assert any("no edge nodestro-studio -> tabrion in the policy (K-33)" in p for p in problems), problems


# versions.json: a final, its release commit.


@pytest.mark.parametrize("version", ["0.1.1.dev0", "0.1.0a1", "0.1.0rc1", "0.1.0+local"])
def test_a_pre_release_in_versions_json_is_refused(version: str) -> None:
    problems, _ = check(versions(version=version), files={"axentra": None, "orkexa": None})
    assert f"versions.json: tabrion {version} is not a final version; master pins only finals (RC-8)" in problems


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


def test_versions_json_declares_the_tabrion_final() -> None:
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    tabrion = pinned["components"]["tabrion"]
    assert tabrion["commit"] == CURRENT and tabrion["version"] == "0.2.1"
    assert tabrion["version_file"] == "src/tabrion/_version.py" and not tabrion.get("studio_dependency")
    assert tabrion["releases"] == {"0.1.0": FINAL, "0.2.0": FINAL_0_2_0, "0.2.1": CURRENT}
    assert check_versions.is_final(tabrion["version"])
    assert "pinned_by" not in tabrion


def test_the_studio_lock_holds_the_one_tabrion() -> None:
    texts = {
        name: (ROOT / "platform" / name).read_text(encoding="utf-8") for name in check_versions.LOCK_FILES.values()
    }
    pinned = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))
    assert check_versions.check_tabrion_lock(pinned["components"]["tabrion"], texts, []) == []


# The libraries' standalone install: requirements/tabrion.txt (VER-1, RC-7).


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
    files = {"axentra": f"tabrion @ {URL}{OLDER}\n", "orkexa": f"tabrion @ {URL}{OLDER}\n"}
    problems, warnings = check(pins, files=files)
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


def test_a_commit_that_only_reads_the_final_version_is_refused() -> None:
    """tabrion 433a3056a merges master (0.1.0) into a branch and reads 0.1.0; it is not the release commit."""
    problems, warnings = check(files=requirements(axentra=f"tabrion @ {URL}{OLDER}\n"))
    assert warnings == []
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{OLDER[:12]} reads 0.1.0 but is not a release "
        "commit (versions.json releases); pin the release commit (RC-8)"
    ]


def test_a_release_whose_version_file_disagrees_is_refused() -> None:
    pins = versions(releases={"0.1.0": FINAL, "0.1.1": OLDER})  # OLDER reads 0.1.0
    problems, _ = check(pins, files=requirements(axentra=f"tabrion @ {URL}{OLDER}\n"))
    assert problems == [
        f"axentra@{AXENTRA[:12]} requirements/tabrion.txt: tabrion@{OLDER[:12]} reads 0.1.0, versions.json releases "
        "says 0.1.1"
    ]


def test_a_tab_before_an_inline_comment_is_accepted() -> None:
    assert check(files=requirements(orkexa=f"tabrion @ {URL}{FINAL}\t# v0.1.0\n")) == ([], [])


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
        toml("nodestro", ["nodestro-api>=0.2.0,<0.3"], version="0.2.0"), encoding="utf-8"
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


def run_main(tmp_path: Path, pins: dict[str, Any], *args: str, lock_extra: str = "") -> int:
    """main() on ``pins``, with the lock files it generates (``lock_extra``: a line appended to the studio lock)."""
    for entry in pins["components"].values():
        entry["pyproject"] = "pyproject.toml"
    path = tmp_path / "versions.json"
    path.write_text(json.dumps(pins), encoding="utf-8")
    for profile, name in check_versions.LOCK_FILES.items():
        text = check_versions.lock_text(pins["components"], profile) + (lock_extra if profile == "studio" else "")
        (tmp_path / name).write_text(text, encoding="utf-8")
    return check_versions.main(["--versions", str(path), *args])


def test_main_reports_one_tabrion(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    pins = versions()
    pin = f"tabrion @ {URL}{FINAL}\n"
    serve(monkeypatch, tmp_path, repository(manifests(), pins, axentra=pin, orkexa=pin))
    assert run_main(tmp_path, pins) == 0
    assert (
        capsys.readouterr().out.splitlines()[-1]
        == "pins agree, one tabrion 0.1.0@d5821faa8742, graph acyclic, policy ok"
    )


def test_main_fails_on_a_url_and_a_second_lock_commit(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    pins = versions(releases={"0.1.0": FINAL, "0.1.1": OLDER})
    pin = f"tabrion @ {URL}{FINAL}\n"
    texts = manifests()
    texts["nodestro-api"] = toml("nodestro-api", dev=[f"tabrion[testing,postgres] @ {URL}{FINAL}"])
    serve(monkeypatch, tmp_path, repository(texts, pins, axentra=pin, orkexa=pin))
    assert run_main(tmp_path, pins, lock_extra=f"tabrion @ {URL}{OLDER}\n") == 1
    out = capsys.readouterr().out
    assert "never by a URL; the lock holds the commit (RC-1)" in out
    assert "::error::more than one tabrion commit in the lock (K-34, RC-2)" in out
    assert "::error::platform/internal.txt does not match versions.json" in out
    # The studio lock holds tabrion too since TABRION MIG-NOD-3 (K-32): the appended line is a second one there.
    assert "::error::platform/internal.txt: 2 tabrion lines, the lock holds exactly one (K-34, RC-2)" in out
    assert out.splitlines()[-1] == "4 problems"


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


# --local and the drift report.


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

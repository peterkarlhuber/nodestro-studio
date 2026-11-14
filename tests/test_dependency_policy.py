"""TABRION AC-2 (QA-17): scripts/check_dependency_policy.py and platform/dependency-policy.json (edge list K-33)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import sys
import tomllib
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import check_dependency_policy as cdp

ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / "platform" / "dependency-policy.json").read_text(encoding="utf-8"))
RUNTIME_URL = "git+https://github.com/peterkarlhuber/nodestro-runtime.git@" + "a" * 40
ORKEXA_URL = "git+https://github.com/peterkarlhuber/orkexa.git@" + "b" * 40
TABRION_URL = "git+https://github.com/peterkarlhuber/tabrion.git@" + "d" * 40
AXENTRA_URL = "git+https://github.com/peterkarlhuber/axentra.git@" + "c" * 40


def manifest(name: str, core: list[str] | None = None, extras: dict[str, list[str]] | None = None) -> dict[str, Any]:
    return {"project": {"name": name, "dependencies": core or [], "optional-dependencies": extras or {}}}


def with_edge(**edge: Any) -> cdp.Policy:
    data = copy.deepcopy(POLICY)
    data["edges"].append({"kind": "required", "extra": None, "status": "active", **edge})
    return cdp.Policy(data)


def test_the_policy_is_valid_and_acyclic() -> None:
    policy = cdp.Policy(POLICY)
    assert policy.errors == []
    assert not [edge for edge in policy.edges if edge.source == "tabrion"]  # P6: tabrion -> nothing


def test_the_policy_holds_the_k33_edges() -> None:
    edges = {(e.source, e.target, e.kind, e.extra, e.status) for e in cdp.Policy(POLICY).edges}
    assert {
        ("axentra", "tabrion", "required", None, "active"),
        ("orkexa", "tabrion", "optional", "postgres", "active"),
        ("orkexa", "tabrion", "required", None, "pending:E-ORK-CORE"),
        ("nodestro-runtime", "orkexa", "required", None, "active"),
        ("nodestro-runtime", "axentra", "optional", "postgres", "active"),
        ("nodestro-runtime", "tabrion", "optional", "postgres", "active"),
        ("nodestro-runtime", "tabrion", "required", None, "active"),  # K-32, TABRION MIG-NOD-3 (doc 06 N-1)
        ("tabrion-studio", "tabrion", "required", None, "active"),
        ("nodestro-api", "tabrion", "dev", "dev", "active"),  # doc 13 section 2.2, RC-2 (review Q-2)
    } <= edges


def test_this_studio_follows_the_policy() -> None:
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    assert cdp.Policy(POLICY).check_manifest("nodestro-studio", pyproject) == []


@pytest.mark.parametrize(
    ("component", "pyproject"),
    [
        ("tabrion", manifest("tabrion", ["psycopg>=3.2"], {"all": ["tabrion[postgres]"]})),
        ("axentra", manifest("axentra", ["tabrion[postgres]>=0.1,<0.2"], {"dev": ["tabrion[testing,postgres]"]})),
        ("orkexa", manifest("orkexa", [], {"postgres": ["tabrion[postgres]>=0.1,<0.2"]})),
        (
            "nodestro-runtime",
            manifest(
                "nodestro-runtime",
                [f"orkexa[all,pdf,local,convert] @ {ORKEXA_URL}"],
                {
                    "postgres": [
                        f"orkexa[postgres] @ {ORKEXA_URL}",
                        f"axentra[oidc] @ {AXENTRA_URL}",
                        f"tabrion[postgres] @ {TABRION_URL}",  # V-B0: the runtime carries the git pin (RC-2)
                    ]
                },
            ),
        ),
        ("nodestro-api", manifest("nodestro-api", [f"nodestro-runtime @ {RUNTIME_URL}"])),
        ("tabrion-studio", manifest("tabrion-studio", ["tabrion[postgres,sqlalchemy,migrations]>=0.1,<0.2"])),
    ],
)
def test_k33_manifests_pass(component: str, pyproject: dict[str, Any]) -> None:
    assert cdp.Policy(POLICY).check_manifest(component, pyproject) == []


# The eight negative cases of plan 07 section 7 (AC-2), each against a manifest and, where it is a rule of the
# policy itself, against a policy that would allow it.
NEGATIVE_MANIFESTS = [
    pytest.param(
        "tabrion", manifest("tabrion", [f"nodestro-runtime @ {RUNTIME_URL}"]), "no edge", id="1-tabrion-to-platform"
    ),
    pytest.param(
        "tabrion", manifest("tabrion", ["axentra"]), "no edge tabrion -> axentra", id="2-cycle-axentra-tabrion"
    ),
    pytest.param(
        "nodestro-runtime",
        manifest(
            "nodestro-runtime", [f"orkexa[all,pdf,local,convert] @ {ORKEXA_URL}", f"axentra[oidc] @ {AXENTRA_URL}"]
        ),
        "not allowed here",
        id="3-core-instead-of-extra",
    ),
    pytest.param(
        "orkexa", manifest("orkexa", [], {"server": ["tabrion[postgres]>=0.1"]}), "not allowed here", id="4-wrong-extra"
    ),
    pytest.param("axentra", manifest("axentra", ["levuvo-nextcloud-mcp>=1"]), "unknown Levuvo package", id="5-unknown"),
    pytest.param("tabrion", manifest("tabrion", [], {"dev": ["axentra[oidc]"]}), "no edge", id="6-reversed-direction"),
    pytest.param("orkexa", manifest("orkexa", [], {"ui": ["tabrion-studio"]}), "no edge", id="7-library-to-studio"),
    pytest.param(
        "tabrion-studio",
        manifest("tabrion-studio", ["tabrion[postgres]>=0.1", "axentra>=0.1"]),
        "no edge tabrion-studio -> axentra",
        id="8-studio-private-edge",
    ),
]


@pytest.mark.parametrize(("component", "pyproject", "message"), NEGATIVE_MANIFESTS)
def test_negative_manifests_fail(component: str, pyproject: dict[str, Any], message: str) -> None:
    errors = cdp.Policy(POLICY).check_manifest(component, pyproject)
    assert len(errors) == 1, errors
    assert message in errors[0]


@pytest.mark.parametrize(
    ("edge", "message"),
    [
        pytest.param({"from": "tabrion", "to": "nodestro-runtime"}, "depends on no Levuvo package (P6)", id="1"),
        pytest.param({"from": "tabrion", "to": "axentra"}, "cycle: axentra -> tabrion -> axentra", id="2-cycle"),
        pytest.param({"from": "orkexa", "to": "axentra"}, "a library depends only on ['tabrion']", id="library"),
        pytest.param({"from": "axentra", "to": "nodestro-api"}, "a library depends only on", id="library-platform"),
        pytest.param({"from": "orkexa", "to": "tabrion-studio"}, "a library depends only on", id="7-library"),
        pytest.param({"from": "nodestro-api", "to": "tabrion-studio"}, "no component depends on a studio", id="7"),
        pytest.param({"from": "tabrion-studio", "to": "axentra"}, "no private edge", id="8"),
        pytest.param({"from": "nodestro-runtime", "to": "nodestro-api"}, "cycle:", id="platform-cycle"),
        pytest.param({"from": "axentra", "to": "tabrion", "kind": "optional"}, "names one", id="optional-no-extra"),
        pytest.param({"from": "axentra", "to": "tabrion", "status": "later"}, "status must be", id="status"),
        pytest.param({"from": "axentra", "to": "levuvo-x"}, "unknown target", id="unknown-target"),
    ],
)
def test_policy_rules_turn_red(edge: dict[str, Any], message: str) -> None:
    errors = with_edge(**edge).errors
    assert any(message in error for error in errors), errors


def test_a_pending_edge_is_not_valid_yet() -> None:
    errors = cdp.Policy(POLICY).check_manifest("orkexa", manifest("orkexa", ["tabrion>=0.1,<0.2"]))
    assert len(errors) == 1 and "pending:E-ORK-CORE, not active yet" in errors[0], errors


@pytest.mark.parametrize(
    ("component", "pyproject"),
    [
        ("axentra", manifest("axentra", [f"tabrion[postgres] @ {TABRION_URL}"])),
        ("axentra", manifest("axentra", [], {"dev": [f"tabrion[testing,postgres] @ {TABRION_URL}"]})),
        ("orkexa", manifest("orkexa", [], {"postgres": [f"tabrion[postgres] @ {TABRION_URL}"]})),
    ],
)
def test_a_library_never_requires_tabrion_by_a_direct_url(component: str, pyproject: dict[str, Any]) -> None:
    errors = cdp.Policy(POLICY).check_manifest(component, pyproject)
    assert len(errors) == 1 and "RC-1" in errors[0], errors


@pytest.mark.parametrize(
    ("component", "pyproject"),
    [
        ("nodestro-runtime", manifest("nodestro-runtime", [], {"postgres": [f"tabrion[postgres] @ {TABRION_URL}"]})),
        ("nodestro-runtime", manifest("nodestro-runtime", [], {"dev": [f"tabrion[testing,postgres] @ {TABRION_URL}"]})),
        ("nodestro-api", manifest("nodestro-api", [], {"dev": [f"tabrion[testing,postgres] @ {TABRION_URL}"]})),
    ],
)
def test_the_platform_may_carry_the_tabrion_git_pin(component: str, pyproject: dict[str, Any]) -> None:
    """V-B0 (plan 05 section 4.3, RC-2): runtime extras and api dev pin tabrion by commit."""
    assert cdp.Policy(POLICY).check_manifest(component, pyproject) == []


def test_extras_with_spaces_are_normalized() -> None:
    pyproject = manifest("axentra", ["tabrion[ postgres ]>=0.1"], {"dev": ["tabrion[testing, postgres]"]})
    assert cdp.Policy(POLICY).check_manifest("axentra", pyproject) == []


def test_every_component_is_in_a_namespace() -> None:
    data = copy.deepcopy(POLICY)
    data["namespaces"] = ["tabrion", "axentra", "orkexa"]
    errors = cdp.Policy(data).errors
    assert any("nodestro-api is in none of the namespaces" in error for error in errors), errors


def test_extras_beyond_the_edge_fail() -> None:
    errors = cdp.Policy(POLICY).check_manifest("axentra", manifest("axentra", ["tabrion[postgres,sqlalchemy]"]))
    assert len(errors) == 1 and "extras [postgres,sqlalchemy]" in errors[0], errors


def test_an_owner_url_under_an_unknown_name_is_levuvo() -> None:
    errors = cdp.Policy(POLICY).check_manifest("axentra", manifest("axentra", [f"runtime @ {RUNTIME_URL}"]))
    assert len(errors) == 1 and "unknown Levuvo package" in errors[0], errors


def test_dependency_groups_and_self_references_count_as_expected() -> None:
    pyproject = manifest("axentra", [], {"all": ["axentra[server,oidc]"]})
    pyproject["dependency-groups"] = {"lint": ["orkexa"]}
    errors = cdp.Policy(POLICY).check_manifest("axentra", pyproject)
    assert len(errors) == 1 and "extra 'lint'" in errors[0], errors


def test_main_reports_errors(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    bad = tmp_path / "pyproject.toml"
    bad.write_text('[project]\nname = "tabrion"\ndependencies = ["axentra"]\n', encoding="utf-8")
    assert cdp.main(["--manifest", f"tabrion={bad}"]) == 1
    assert "no edge tabrion -> axentra" in capsys.readouterr().err
    assert cdp.main([]) == 0
    assert "ok (" in capsys.readouterr().out


@pytest.mark.parametrize("component", ["tabrion", "axentra", "orkexa", "tabrion-studio", "nodestro-runtime"])
def test_a_library_copy_holds_only_its_outgoing_edges(component: str) -> None:
    copy = cdp.policy_copy(POLICY, component)
    policy = cdp.Policy(copy)
    assert policy.errors == []
    assert policy.component == component
    assert {edge.source for edge in policy.edges} <= {component}
    assert len(policy.edges) == len([edge for edge in cdp.Policy(POLICY).edges if edge.source == component])
    assert copy["components"] == POLICY["components"] and copy["namespaces"] == POLICY["namespaces"]


def test_the_tabrion_copy_is_empty() -> None:
    assert cdp.policy_copy(POLICY, "tabrion")["edges"] == []


def test_a_copy_with_a_foreign_edge_fails() -> None:
    copy = cdp.policy_copy(POLICY, "axentra")
    copy["edges"].append(
        {"from": "orkexa", "to": "tabrion[postgres]", "kind": "optional", "extra": "postgres", "status": "active"}
    )
    assert any("only axentra's outgoing edges" in error for error in cdp.Policy(copy).errors)


def test_main_prints_and_checks_a_copy(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert cdp.main(["--copy", "axentra"]) == 0
    printed = capsys.readouterr().out
    assert json.loads(printed) == cdp.policy_copy(POLICY, "axentra")
    (tmp_path / "dependency-policy.json").write_text(printed, encoding="utf-8")
    good = tmp_path / "good.toml"
    good.write_text('[project]\nname = "axentra"\ndependencies = ["tabrion[postgres]>=0.1,<0.2"]\n', encoding="utf-8")
    bad = tmp_path / "bad.toml"
    bad.write_text('[project]\nname = "axentra"\ndependencies = ["orkexa"]\n', encoding="utf-8")
    policy = str(tmp_path / "dependency-policy.json")
    assert cdp.main(["--policy", policy, "--manifest", f"axentra={good}"]) == 0
    assert cdp.main(["--policy", policy, "--manifest", f"axentra={bad}"]) == 1
    assert "no edge axentra -> orkexa" in capsys.readouterr().err

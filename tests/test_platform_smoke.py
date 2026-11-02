"""The Docker assertions of scripts/platform_smoke.py: strict for runtimes that report the checks, silent for older."""

from __future__ import annotations

from pathlib import Path
import sys
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import platform_smoke


def docker(state: str, reason: str = "", checks: list[dict[str, Any]] | None = None, **fields: Any) -> dict[str, Any]:
    row: dict[str, Any] = {
        "name": "docker",
        "available": state == "approved",
        "state": state,
        "reason": reason,
        "detail": "",
        "isolation": "container",
        "maturity": "stable",
        "memory": "kernel",
        "notes": [],
        "engine": "docker",
        "rootless": None,
        "cgroup_version": "2",
        "checks": checks if checks is not None else [],
        "tested_at": None,
    }
    row.update(fields)
    return row


PASSED = [{"name": name, "ok": True, "detail": ""} for name in ("cli", "daemon", "preflight", "image", "self-test")]


def test_an_older_runtime_passes_without_the_new_fields() -> None:
    platform_smoke.check_docker_status(
        {"name": "docker", "available": False, "state": "unavailable", "reason": "unreachable", "detail": ""}
    )


@pytest.mark.parametrize(
    "row",
    [
        docker("approved", "", PASSED, rootless=True, tested_at="2026-11-02T12:00:00Z"),
        docker("checking", "docker-checking"),
        docker(
            "unavailable", "docker-seccomp", [*PASSED[:2], {"name": "preflight", "ok": False, "detail": "no seccomp"}]
        ),
        docker("unavailable", "docker-missing", [{"name": "cli", "ok": False, "detail": ""}]),
    ],
)
def test_reported_states_pass(row: dict[str, Any]) -> None:
    platform_smoke.check_docker_status(row)


@pytest.mark.parametrize(
    "row",
    [
        # Approved without the self-test, or with a failed check: never.
        docker("approved", "", PASSED[:4]),
        docker("approved", "", [*PASSED[:4], {"name": "self-test", "ok": False, "detail": ""}]),
        docker("approved", "", []),
        # Available although not approved.
        docker("unavailable", "docker-limits", available=True),
        docker("checking", "docker-checking", available=True),
        # Unknown reason, check name or state.
        docker("unavailable", "unreachable"),
        docker("unavailable", "docker-limits", [{"name": "magic", "ok": True, "detail": ""}]),
        docker("experimental", "not-released"),
        docker("unavailable", "docker-limits", rootless="yes"),
    ],
)
def test_unsafe_or_malformed_states_fail(row: dict[str, Any]) -> None:
    with pytest.raises(AssertionError):
        platform_smoke.check_docker_status(row)

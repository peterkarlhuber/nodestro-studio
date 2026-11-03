"""The helpers of scripts/docker_smoke.py that decide PASS or FAIL (the real run needs an engine: workflow Docker)."""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import docker_smoke


def event(action: str, name: str) -> dict[str, Any]:
    return {"Type": "container", "Action": action, "Actor": {"Attributes": {"name": name}}}


def test_a_started_container_without_destroy_counts_as_left_behind() -> None:
    events = [
        event("start", "orkexa-sandbox-aaa"),
        event("destroy", "orkexa-sandbox-aaa"),
        event("start", "orkexa-sandbox-bbb"),
        event("start", "something-else"),
    ]
    started, left = docker_smoke.started_and_removed(events)
    assert started == ["orkexa-sandbox-aaa", "orkexa-sandbox-bbb"]
    assert left == ["orkexa-sandbox-bbb"]


def inspected(**host: Any) -> dict[str, Any]:
    base = {
        "NetworkMode": "none",
        "ReadonlyRootfs": True,
        "CapDrop": ["ALL"],
        "SecurityOpt": ["no-new-privileges"],
        "Binds": None,
    }
    return {"HostConfig": {**base, **host}, "Config": {"User": "65532:65532"}, "Mounts": [{"Type": "tmpfs"}]}


def test_isolation_flags_need_every_restriction() -> None:
    assert docker_smoke.isolated(docker_smoke.isolation_flags(inspected()))
    assert not docker_smoke.isolated(docker_smoke.isolation_flags(inspected(NetworkMode="bridge")))
    assert not docker_smoke.isolated(docker_smoke.isolation_flags(inspected(ReadonlyRootfs=False)))
    assert not docker_smoke.isolated(docker_smoke.isolation_flags(inspected(CapDrop=[])))
    assert not docker_smoke.isolated(docker_smoke.isolation_flags(inspected(Binds=["/:/host"])))
    root = inspected()
    root["Config"]["User"] = ""
    assert not docker_smoke.isolated(docker_smoke.isolation_flags(root))


def test_the_stand_in_model_answers_the_coding_agent_and_the_workflow_agent() -> None:
    proposal = docker_smoke.model_answer({"messages": [{"role": "user", "content": "Requirement:\nSMOKE-SPIN: x"}]})
    assert json.loads(proposal["content"])["function_name"] == "spin_rounds"
    tools = [{"type": "function", "function": {"name": "spin_rounds"}}]
    call = docker_smoke.model_answer({"messages": [{"role": "user", "content": "go"}], "tools": tools})
    assert call["tool_calls"][0]["function"]["name"] == "spin_rounds"
    assert json.loads(call["tool_calls"][0]["function"]["arguments"]) == {"rounds": docker_smoke.ENDLESS}
    after = docker_smoke.model_answer({"messages": [{"role": "tool", "content": "stopped"}], "tools": tools})
    assert after == {"role": "assistant", "content": "done"}


def test_resource_limits_must_all_be_set() -> None:
    flags = docker_smoke.isolation_flags(
        inspected(Memory=512 * 2**20, MemorySwap=512 * 2**20, NanoCpus=10**9, PidsLimit=64)
    )
    assert docker_smoke.limited(flags)
    assert not docker_smoke.limited({**flags, "memory_swap": -1})
    assert not docker_smoke.limited({**flags, "nano_cpus": 0})
    assert not docker_smoke.limited({**flags, "pids_limit": None})
    assert not docker_smoke.limited({**flags, "memory": 0})


def test_image_architecture_names_differ_from_the_engines() -> None:
    assert docker_smoke.arch_matches("aarch64", "arm64")
    assert docker_smoke.arch_matches("x86_64", "amd64")
    assert not docker_smoke.arch_matches("aarch64", "amd64")
    assert not docker_smoke.arch_matches("x86_64", "")


def test_reasons_have_the_sentence_the_interface_shows() -> None:
    assert "not running" in docker_smoke.reason_sentence("docker-unreachable")
    assert "Linux containers" in docker_smoke.reason_sentence("docker-os-type")
    assert docker_smoke.reason_sentence("no-isolation") == ""
    assert docker_smoke.diagnosis_sentence("available") == "Available."

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

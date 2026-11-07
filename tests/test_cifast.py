"""The CI-FAST measurement tool (docs/architecture/ci-fast/tools/cifast.py), offline."""

from __future__ import annotations

from datetime import date
import json
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "docs" / "architecture" / "ci-fast" / "tools"))

import cifast

TOOLS = Path(cifast.__file__).parent


def run(i: int, **kw: Any) -> dict[str, Any]:
    base = {
        "id": i, "name": "CI", "path": ".github/workflows/ci.yml", "event": "pull_request", "status": "completed",
        "conclusion": "success", "head_branch": "feature", "head_sha": f"sha{i}", "created_at": "2026-11-01T10:00:00Z",
        "updated_at": "2026-11-01T10:20:00Z", "run_started_at": "2026-11-01T10:00:00Z", "run_attempt": 1,
        "pull_requests": [{"number": 1}],
    }  # fmt: skip
    return base | kw


def test_fetch_runs_paginates_per_day_by_hand() -> None:
    calls: list[str] = []

    def fetch(path: str) -> Any:
        calls.append(path)
        if "created=2026-11-01" in path and "page=1&" in path:
            return {"workflow_runs": [run(i) for i in range(100)]}
        if "created=2026-11-01" in path:
            return {"workflow_runs": [run(100), run(99)]}  # a duplicate across pages is dropped
        return {"workflow_runs": []}

    runs = cifast.fetch_runs("orkexa", date(2026, 11, 1), date(2026, 11, 2), fetch)
    assert len(runs) == 101 and runs[0]["pull_requests"] == [1]
    assert [p.split("?")[1] for p in calls] == [
        "per_page=100&page=1&created=2026-11-01",
        "per_page=100&page=2&created=2026-11-01",
        "per_page=100&page=1&created=2026-11-02",
    ]
    assert not any("paginate" in p for p in calls)


def write_raw(tmp_path: Path) -> Path:
    d = tmp_path / "raw" / "nodestro-studio"
    d.mkdir(parents=True)
    runs = [
        run(
            1,
            head_sha="A",
            created_at="2026-11-01T10:00:00Z",
            updated_at="2026-11-01T10:30:00Z",
            conclusion="cancelled",
        ),
        run(2, head_sha="B", created_at="2026-11-01T10:10:00Z", updated_at="2026-11-01T10:40:00Z"),
        run(3, event="push", head_branch="master", head_sha="M", conclusion="failure"),
        run(4, event="push", head_branch="master", head_sha="N", run_attempt=2),
        run(5, created_at="2026-11-09T00:00:00Z"),  # outside the window
    ]
    (d / "runs.json").write_text(json.dumps(runs), encoding="utf-8")

    def job(created: str, started: str, completed: str, labels: list[str], attempt: int = 1) -> dict[str, Any]:
        return {
            "id": 1, "name": "test", "status": "completed", "conclusion": "success", "created_at": created,
            "started_at": started, "completed_at": completed, "run_attempt": attempt, "labels": labels,
        }  # fmt: skip

    (d / "jobs_2.json").write_text(
        json.dumps(
            [
                job("2026-11-01T10:10:00Z", "2026-11-01T10:12:00Z", "2026-11-01T10:22:00Z", ["ubuntu-latest"]),
                job("2026-11-01T10:10:00Z", "2026-11-01T10:20:00Z", "2026-11-01T10:40:00Z", ["macos-14"]),
            ]
        ),
        encoding="utf-8",
    )
    (d / "jobs_4.json").write_text(
        json.dumps([job("2026-11-02T10:00:00Z", "2026-11-02T10:00:00Z", "2026-11-02T10:05:00Z", [], attempt=2)]),
        encoding="utf-8",
    )
    return tmp_path / "raw"


def test_kpis(tmp_path: Path) -> None:
    runs, jobs = cifast.load(write_raw(tmp_path), ["nodestro-studio"], date(2026, 11, 1), date(2026, 11, 7))
    k = cifast.compute_kpis(runs, jobs)
    assert k["runs"] == 4 and k["jobs"] == 3
    assert k["queue_min_by_os"]["mac"]["p50"] == 10.0
    assert k["critical_path_min"]["nodestro-studio"] == {"n": 1, "p50": 30.0, "p75": 30.0, "p90": 30.0}
    assert k["runner_min_per_day"]["2026-11-01"] == {"total": 30, "linux": 10, "mac": 20, "win": 0}
    assert k["runner_min_total"] == 35
    assert k["superseded_runs"]["nodestro-studio"] == {"superseded": 1, "superseded_cancelled": 1, "cancelled": 1}
    assert k["reruns"]["nodestro-studio"] == {"runs_attempt_gt1": 1, "jobs_attempt_gt1": 1, "min": 5}
    assert k["master_red"]["nodestro-studio"]["red_run_rate"] == 0.5


def test_cascade_times() -> None:
    cascade = {
        "stages": [
            ["orkexa#1", "nodestro-runtime#2"],
            ["nodestro-studio#3"],
            ["nodestro-server#4", "nodestro-desktop#5"],
        ]
    }
    prs = {
        "orkexa#1": {"merged_at": "2026-11-01T10:00:00Z"},
        "nodestro-runtime#2": {"merged_at": "2026-11-01T09:30:00Z"},
        "nodestro-studio#3": {"merged_at": "2026-11-01T11:00:00Z"},
        "nodestro-server#4": {"merged_at": "2026-11-01T12:00:00Z"},
        "nodestro-desktop#5": {"merged_at": None},
    }
    r = cifast.cascade_times(cascade, prs)
    assert r["ki_min"] == 90.0 and r["ki_complete"]
    assert r["vi_min"] == 150.0 and not r["vi_complete"] and r["open"] == ["nodestro-desktop#5"]


def test_cascade_file_is_valid() -> None:
    spec = json.loads((TOOLS / "cascades-2026-11.json").read_text(encoding="utf-8"))
    ids = [c["id"] for c in spec["cascades"]]
    assert ids == [f"C{i}" for i in range(1, 9)]
    for c in spec["cascades"]:
        refs = [ref for stage in c["stages"] for ref in stage]
        assert any(ref.startswith("nodestro-studio#") for ref in refs)
        assert all(cifast.pr_key(ref)[0] in cifast.REPOS for ref in refs)


def test_quantile_interpolates() -> None:
    assert cifast.quantile([1, 2, 3, 4], 0.5) == 2.5
    assert cifast.quantile([], 0.5) is None

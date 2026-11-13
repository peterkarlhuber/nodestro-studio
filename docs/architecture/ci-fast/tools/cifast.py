#!/usr/bin/env python3
"""CI-FAST measurement tool: collects GitHub Actions runs and jobs and computes the CI-FAST KPIs.

Subcommands:

- ``collect``: fetch workflow runs (and their jobs) for a date window into a raw data directory, with ``gh api`` only.
- ``kpis``: compute M3 (critical path per PR commit), job queue, runner minutes per day, superseded runs, re-runs
  and the master red rate from a raw data directory.
- ``cascades``: compute M1 (KI) and M2 (VI) per cascade from a cascade definition file and PR merge times.

Standard library only. Pagination is done by hand with ``&page=N`` because ``gh api --paginate`` fails behind the
agent proxy. See README.md next to this file for the KPI definitions.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from collections.abc import Callable, Iterable
import concurrent.futures as futures
from datetime import UTC, date, datetime, timedelta
import json
from pathlib import Path
import subprocess
import sys
import time
from typing import Any

OWNER = "peterkarlhuber"
#: The 12 repositories of the CI-FAST scope (levuvo-nextcloud-mcp is out of scope).
REPOS = [
    "orkexa",
    "axentra",
    "nodestro-runtime",
    "nodestro-examples",
    "nodestro-integrations",
    "nodestro-api",
    "nodestro-sdk",
    "axentra-studio",
    "nodestro-studio",
    "nodestro-server",
    "nodestro-desktop",
    "nodestro-local-docker",
]
PRODUCTS = ("nodestro-server", "nodestro-desktop", "nodestro-local-docker")
STUDIO = "nodestro-studio"
RUN_FIELDS = [
    "id", "name", "path", "event", "status", "conclusion", "head_branch", "head_sha",
    "created_at", "updated_at", "run_started_at", "run_attempt", "pull_requests",
]  # fmt: skip
JOB_FIELDS = [
    "id", "name", "status", "conclusion", "started_at", "completed_at", "created_at",
    "run_attempt", "labels", "runner_name",
]  # fmt: skip
RED = {"failure", "timed_out", "startup_failure"}
#: Jobs of one PR commit created more than this after its first job belong to a later re-run, not to the first pass.
FIRST_PASS = timedelta(hours=3)


# --------------------------------------------------------------------------------------------------------- helpers


def ts(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def minutes(a: datetime, b: datetime) -> float:
    return (b - a).total_seconds() / 60


def quantile(values: Iterable[float], p: float) -> float | None:
    """Linear interpolation between closest ranks (the same as numpy's default and the original scripts)."""
    xs = sorted(values)
    if not xs:
        return None
    k = (len(xs) - 1) * p
    f = int(k)
    c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def r1(value: float | None) -> float | None:
    return None if value is None else round(value, 1)


def stats(values: list[float], ps: tuple[float, ...] = (0.5, 0.9)) -> dict[str, Any]:
    out: dict[str, Any] = {"n": len(values)}
    for p in ps:
        out[f"p{round(p * 100)}"] = r1(quantile(values, p))
    return out


def os_class(labels: list[str] | None, name: str = "") -> str:
    text = " ".join(labels or []) + " " + name
    if "macos" in text:
        return "mac"
    if "windows" in text:
        return "win"
    return "linux"


def parse_day(text: str) -> date:
    return date.fromisoformat(text)


# --------------------------------------------------------------------------------------------------------- collect

Fetcher = Callable[[str], Any]


def gh_api(path: str, retries: int = 3) -> Any:
    """One ``gh api`` GET (never ``--paginate``), retried on transient proxy errors."""
    last = ""
    for attempt in range(retries):
        out = subprocess.run(["gh", "api", path], capture_output=True, text=True)
        if out.returncode == 0:
            return json.loads(out.stdout)
        last = out.stderr.strip()[:300]
        if "404" in last:
            break
        time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"gh api {path}: {last}")


def fetch_runs(repo: str, start: date, end: date, fetch: Fetcher = gh_api) -> list[dict[str, Any]]:
    """All workflow runs created in [start, end] (inclusive days), one query per day (the API caps a filtered
    listing at 1000 results), each paginated by hand."""
    runs: list[dict[str, Any]] = []
    day = start
    while day <= end:
        page = 1
        while True:
            path = f"repos/{OWNER}/{repo}/actions/runs?per_page=100&page={page}&created={day.isoformat()}"
            batch = fetch(path)["workflow_runs"]
            runs += batch
            if len(batch) < 100:
                break
            page += 1
        day += timedelta(days=1)
    seen: set[int] = set()
    kept = []
    for run in runs:
        if run["id"] in seen:
            continue
        seen.add(run["id"])
        row = {k: run.get(k) for k in RUN_FIELDS}
        row["pull_requests"] = [p["number"] for p in (run.get("pull_requests") or [])]
        kept.append(row)
    return kept


def fetch_jobs(repo: str, run_id: int, fetch: Fetcher = gh_api) -> list[dict[str, Any]]:
    """The jobs of every attempt of one run (``filter=all``)."""
    jobs: list[dict[str, Any]] = []
    page = 1
    while True:
        data = fetch(f"repos/{OWNER}/{repo}/actions/runs/{run_id}/jobs?per_page=100&filter=all&page={page}")
        jobs += data["jobs"]
        if len(data["jobs"]) < 100:
            break
        page += 1
    return [{k: j.get(k) for k in JOB_FIELDS} for j in jobs]


def cmd_collect(args: argparse.Namespace) -> int:
    out: Path = args.out
    for repo in args.repos:
        target = out / repo
        target.mkdir(parents=True, exist_ok=True)
        runs = fetch_runs(repo, args.since, args.until)
        (target / "runs.json").write_text(json.dumps(runs), encoding="utf-8")
        if not args.runs_only:

            def one(run: dict[str, Any], target: Path = target, repo: str = repo) -> None:
                f = target / f"jobs_{run['id']}.json"
                if f.exists() and run["status"] == "completed":
                    return
                try:
                    f.write_text(json.dumps(fetch_jobs(repo, run["id"])), encoding="utf-8")
                except RuntimeError as exc:
                    print(f"warning: {exc}", file=sys.stderr)

            with futures.ThreadPoolExecutor(args.workers) as pool:
                list(pool.map(one, runs))
        print(f"{repo}: {len(runs)} runs", flush=True)
    return 0


# ------------------------------------------------------------------------------------------------------------ kpis


def is_ci_ok_check_run(job: dict[str, Any]) -> bool:
    """ci-ok v3's verdict: a check run the jobs API also lists as a job (no runner labels, no time), not CI work."""
    return job.get("name") == "ci-ok" and not job.get("labels")


def load(data: Path, repos: list[str], start: date, end: date) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Runs created in the window and their jobs (flattened, with run fields), from a raw data directory."""
    lo = datetime.combine(start, datetime.min.time(), UTC)
    hi = datetime.combine(end + timedelta(days=1), datetime.min.time(), UTC)
    runs: list[dict[str, Any]] = []
    jobs: list[dict[str, Any]] = []
    for repo in repos:
        f = data / repo / "runs.json"
        if not f.exists():
            print(f"warning: no runs for {repo} in {data}", file=sys.stderr)
            continue
        for run in json.loads(f.read_text(encoding="utf-8")):
            created = ts(run["created_at"])
            assert created is not None
            if not lo <= created < hi:
                continue
            run = dict(run, repo=repo)
            runs.append(run)
            jf = data / repo / f"jobs_{run['id']}.json"
            if not jf.exists():
                continue
            for job in json.loads(jf.read_text(encoding="utf-8")):
                if is_ci_ok_check_run(job):
                    continue
                c, s, e = ts(job.get("created_at")), ts(job.get("started_at")), ts(job.get("completed_at"))
                if not (c and s and e) or e < s:
                    continue
                jobs.append(
                    {
                        "repo": repo,
                        "created": c,
                        "started": s,
                        "completed": e,
                        "os": os_class(job.get("labels")),
                        "event": run["event"],
                        "head_sha": run["head_sha"],
                        "workflow": run["name"],
                        "name": job["name"],
                        "conclusion": job.get("conclusion"),
                        "run_id": run["id"],
                        "attempt": job.get("run_attempt") or 1,
                    }
                )
    return runs, jobs


def critical_paths(jobs: list[dict[str, Any]]) -> dict[str, list[float]]:
    """M3 per PR commit: first job created -> last job completed over all workflows of the commit's first pass
    (``pull_request`` jobs created within FIRST_PASS of the first one). Includes queue time by construction."""
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for job in jobs:
        if job["event"] == "pull_request":
            groups[(job["repo"], job["head_sha"])].append(job)
    out: dict[str, list[float]] = defaultdict(list)
    for (repo, _sha), js in groups.items():
        c0 = min(j["created"] for j in js)
        first = [j for j in js if j["created"] - c0 < FIRST_PASS]
        out[repo].append(minutes(c0, max(j["completed"] for j in first)))
    return out


def superseded(runs: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    """Runs that a newer commit made obsolete: a newer run of the same workflow, event and branch with another
    head SHA was created before this run finished (whether or not concurrency cancelled it)."""
    by_key: dict[tuple[str, str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for run in runs:
        by_key[(run["repo"], run.get("path") or run["name"], run["event"], run["head_branch"] or "")].append(run)
    out: dict[str, dict[str, int]] = defaultdict(lambda: {"superseded": 0, "superseded_cancelled": 0, "cancelled": 0})
    for run in runs:
        if run["conclusion"] == "cancelled":
            out[run["repo"]]["cancelled"] += 1
    for (repo, _wf, _event, branch), group in by_key.items():
        if branch in ("master", "main"):
            continue
        group.sort(key=lambda r: r["created_at"])
        for i, run in enumerate(group):
            end = run["updated_at"]
            if any(o["head_sha"] != run["head_sha"] and run["created_at"] < o["created_at"] <= end for o in group[i:]):
                out[repo]["superseded"] += 1
                if run["conclusion"] == "cancelled":
                    out[repo]["superseded_cancelled"] += 1
    return out


def master_red(runs: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Push runs on master: share of completed runs that are red, and share of master commits with a red run."""
    out: dict[str, dict[str, Any]] = {}
    per: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for run in runs:
        if run["event"] == "push" and run["head_branch"] in ("master", "main") and run["status"] == "completed":
            if run["conclusion"] in ("cancelled", "skipped", "neutral"):
                continue
            per[run["repo"]].append(run)
    for repo, rs in sorted(per.items()):
        red = [r for r in rs if r["conclusion"] in RED]
        shas = {r["head_sha"] for r in rs}
        red_shas = {r["head_sha"] for r in red}
        out[repo] = {
            "runs": len(rs),
            "red_runs": len(red),
            "red_run_rate": round(len(red) / len(rs), 3),
            "commits": len(shas),
            "red_commits": len(red_shas),
            "red_commit_rate": round(len(red_shas) / len(shas), 3),
        }
    return out


def compute_kpis(runs: list[dict[str, Any]], jobs: list[dict[str, Any]]) -> dict[str, Any]:
    queue = [minutes(j["created"], j["started"]) for j in jobs]
    kpi: dict[str, Any] = {
        "runs": len(runs),
        "jobs": len(jobs),
        "queue_min": stats(queue, (0.5, 0.9, 0.99)) | {"over_5_min": sum(1 for q in queue if q > 5)},
        "queue_min_by_os": {
            o: stats([minutes(j["created"], j["started"]) for j in jobs if j["os"] == o], (0.5, 0.9, 0.99))
            for o in ("linux", "mac", "win")
        },
    }
    day: defaultdict[str, float] = defaultdict(float)
    day_os: dict[str, defaultdict[str, float]] = defaultdict(lambda: defaultdict(float))
    repo_min: defaultdict[str, float] = defaultdict(float)
    for j in jobs:
        d = j["created"].date().isoformat()
        m = minutes(j["started"], j["completed"])
        day[d] += m
        day_os[d][j["os"]] += m
        repo_min[j["repo"]] += m
    kpi["runner_min_per_day"] = {
        d: {"total": round(day[d])} | {o: round(day_os[d][o]) for o in ("linux", "mac", "win")} for d in sorted(day)
    }
    kpi["runner_min_total"] = round(sum(day.values()))
    kpi["runner_min_by_repo"] = {r: round(v) for r, v in sorted(repo_min.items())}
    crit = critical_paths(jobs)
    kpi["critical_path_min"] = {r: stats(v, (0.5, 0.75, 0.9)) for r, v in sorted(crit.items())}
    kpi["critical_path_min_all"] = stats([x for v in crit.values() for x in v], (0.5, 0.75, 0.9))
    sup = superseded(runs)
    kpi["superseded_runs"] = {r: sup[r] for r in sorted(sup)}
    reruns: dict[str, dict[str, float]] = defaultdict(
        lambda: {"runs_attempt_gt1": 0, "jobs_attempt_gt1": 0, "min": 0.0}
    )
    for run in runs:
        if (run.get("run_attempt") or 1) > 1:
            reruns[run["repo"]]["runs_attempt_gt1"] += 1
    for j in jobs:
        if j["attempt"] > 1:
            reruns[j["repo"]]["jobs_attempt_gt1"] += 1
            reruns[j["repo"]]["min"] += minutes(j["started"], j["completed"])
    kpi["reruns"] = {r: v | {"min": round(v["min"])} for r, v in sorted(reruns.items())}
    kpi["master_red"] = master_red(runs)
    return kpi


def fmt(value: Any) -> str:
    return "-" if value is None else str(value)


def kpis_markdown(k: dict[str, Any], since: date, until: date) -> str:
    lines = [f"# CI-FAST KPIs {since}..{until}", "", f"Runs {k['runs']}, jobs {k['jobs']}.", ""]
    q = k["queue_min"]
    lines += [
        "## Job queue (minutes, job created -> started)",
        "",
        "| scope | jobs | median | p90 | p99 |",
        "|---|---|---|---|---|",
        f"| all | {q['n']} | {q['p50']} | {q['p90']} | {q['p99']} |",
    ]
    for o, s in k["queue_min_by_os"].items():
        lines.append(f"| {o} | {s['n']} | {fmt(s['p50'])} | {fmt(s['p90'])} | {fmt(s['p99'])} |")
    lines += ["", f"Jobs waiting more than 5 min: {q['over_5_min']}.", ""]
    lines += ["## M3 critical path per PR commit (minutes, includes queue)", ""]
    lines += ["| repo | PR commits | median | p75 | p90 |", "|---|---|---|---|---|"]
    for r, s in k["critical_path_min"].items():
        lines.append(f"| {r} | {s['n']} | {s['p50']} | {s['p75']} | {s['p90']} |")
    a = k["critical_path_min_all"]
    lines += [f"| **all** | {a['n']} | {a['p50']} | {a['p75']} | {a['p90']} |", ""]
    lines += ["## Runner minutes per day (job started -> completed, by job created day)", ""]
    lines += ["| day | total | linux | mac | win |", "|---|---|---|---|---|"]
    for d, v in k["runner_min_per_day"].items():
        lines.append(f"| {d} | {v['total']} | {v['linux']} | {v['mac']} | {v['win']} |")
    lines += [f"| **total** | {k['runner_min_total']} | | | |", ""]
    lines += ["## Superseded runs, re-runs, master red rate", ""]
    lines += [
        "| repo | runs superseded | of them cancelled | cancelled (all) | runs attempt>1 | re-run jobs | re-run min "
        "| master push runs | red | red rate | master commits | red commits |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    repos = sorted(set(k["superseded_runs"]) | set(k["reruns"]) | set(k["master_red"]))
    for r in repos:
        s = k["superseded_runs"].get(r, {})
        rr = k["reruns"].get(r, {})
        m = k["master_red"].get(r, {})
        lines.append(
            f"| {r} | {s.get('superseded', 0)} | {s.get('superseded_cancelled', 0)} | {s.get('cancelled', 0)} "
            f"| {rr.get('runs_attempt_gt1', 0)} | {rr.get('jobs_attempt_gt1', 0)} | {rr.get('min', 0)} "
            f"| {m.get('runs', 0)} | {m.get('red_runs', 0)} | {m.get('red_run_rate', '-')} "
            f"| {m.get('commits', 0)} | {m.get('red_commits', 0)} |"
        )
    return "\n".join(lines) + "\n"


def cmd_kpis(args: argparse.Namespace) -> int:
    runs, jobs = load(args.data, args.repos, args.since, args.until)
    k = compute_kpis(runs, jobs)
    args.out.mkdir(parents=True, exist_ok=True)
    stem = f"kpis_{args.since}_{args.until}"
    (args.out / f"{stem}.json").write_text(json.dumps(k, indent=1), encoding="utf-8")
    md = kpis_markdown(k, args.since, args.until)
    (args.out / f"{stem}.md").write_text(md, encoding="utf-8")
    print(md)
    return 0


# ------------------------------------------------------------------------------------------------------- cascades


def pr_key(ref: str) -> tuple[str, int]:
    repo, number = ref.split("#")
    return repo, int(number)


def load_prs(cascades: list[dict[str, Any]], prs_json: Path | None, fetch: Fetcher = gh_api) -> dict[str, Any]:
    """PR data (created_at, merged_at, commits) for every PR of the cascades: from a ``prs.json`` snapshot (a list
    of objects with repo, number, created_at, merged_at) or live from ``gh api repos/<o>/<r>/pulls/<n>``."""
    refs = {ref for c in cascades for stage in c["stages"] for ref in stage}
    found: dict[str, Any] = {}
    if prs_json:
        for x in json.loads(prs_json.read_text(encoding="utf-8")):
            ref = f"{x['repo']}#{x['number']}"
            if ref in refs:
                found[ref] = {k: x.get(k) for k in ("created_at", "merged_at", "commits", "branch")}
    for ref in sorted(refs - set(found)):
        repo, number = pr_key(ref)
        p = fetch(f"repos/{OWNER}/{repo}/pulls/{number}")
        found[ref] = {
            "created_at": p["created_at"],
            "merged_at": p["merged_at"],
            "commits": p.get("commits"),
            "branch": p["head"]["ref"],
        }
    return found


def cascade_times(cascade: dict[str, Any], prs: dict[str, Any]) -> dict[str, Any]:
    """M1 KI and M2 VI of one cascade.

    T0 = the first merge in the cascade's first stage; KI end = the last merge of a nodestro-studio PR; VI end =
    the last merge among the product PRs (server, desktop, local-docker). A missing merge makes the value
    incomplete (it is then the lower bound up to the last merge seen)."""
    stages = cascade["stages"]
    merged = {ref: ts(prs[ref]["merged_at"]) for stage in stages for ref in stage}
    first = [m for ref in stages[0] if (m := merged[ref])]
    if not first:
        return {"complete": False, "error": "no merge in the first stage"}
    t0 = min(first)
    studio = [ref for stage in stages for ref in stage if pr_key(ref)[0] == STUDIO]
    product = [ref for stage in stages for ref in stage if pr_key(ref)[0] in PRODUCTS]
    open_refs = sorted(ref for ref, m in merged.items() if m is None)

    def span(refs: list[str]) -> float | None:
        ms = [m for ref in refs if (m := merged[ref])]
        return round(minutes(t0, max(ms)), 1) if ms else None

    ki, vi = span(studio), span(product)
    return {
        "t0": t0.isoformat(),
        "ki_min": ki,
        "ki_complete": bool(studio) and all(merged[r] for r in studio),
        "vi_min": vi,
        "vi_complete": bool(product) and all(merged[r] for r in product),
        "prs": sum(len(s) for s in stages),
        "commits": sum(prs[ref].get("commits") or 0 for stage in stages for ref in stage),
        "open": open_refs,
    }


def iterations(cascades: list[dict[str, Any]], prs: dict[str, Any], data: Path) -> dict[str, int]:
    """M4 proxy: per cascade PR, the number of distinct head SHAs that got a ``pull_request`` run on the PR's branch
    while it was open (``pull_requests`` of a run is often empty after the merge, so the branch is matched)."""
    out: dict[str, int] = {}
    runs_of: dict[str, list[dict[str, Any]]] = {}
    for c in cascades:
        for ref in (ref for stage in c["stages"] for ref in stage):
            repo, _number = pr_key(ref)
            if repo not in runs_of:
                f = data / repo / "runs.json"
                runs_of[repo] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else []
            pr = prs[ref]
            end = pr.get("merged_at") or "9999"
            out[ref] = len(
                {
                    r["head_sha"]
                    for r in runs_of[repo]
                    if r["event"] == "pull_request"
                    and r["head_branch"] == pr.get("branch")
                    and pr["created_at"] <= r["created_at"] <= end
                }
            )
    return out


def cmd_cascades(args: argparse.Namespace) -> int:
    spec = json.loads(args.file.read_text(encoding="utf-8"))
    cascades = spec["cascades"]
    prs = load_prs(cascades, args.prs_json)
    rows = {c["id"]: cascade_times(c, prs) | {"name": c["name"]} for c in cascades}
    if args.runs_data:
        its = iterations(cascades, prs, args.runs_data)
        for c in cascades:
            rows[c["id"]]["ci_iterations"] = sum(its.get(ref, 0) for stage in c["stages"] for ref in stage)
    ki = [r["ki_min"] for r in rows.values() if r.get("ki_min") is not None]
    vi = [r["vi_min"] for r in rows.values() if r.get("vi_min") is not None]
    summary = {"ki": stats(ki), "vi": stats(vi), "cascades": rows}
    lines = [
        "| cascade | T0 | KI (min) | VI (min) | PRs | commits | CI iterations | open PRs |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for cid, r in rows.items():
        ki_s = f"{r['ki_min']}" + ("" if r["ki_complete"] else " (incomplete)")
        vi_s = f"{r['vi_min']}" + ("" if r["vi_complete"] else " (incomplete)")
        open_s = ", ".join(r["open"]) or "-"
        its = r.get("ci_iterations", "-")
        lines.append(
            f"| {cid} {r['name']} | {r['t0'][:16]} | {ki_s} | {vi_s} | {r['prs']} | {r['commits']} | {its} | {open_s} |"
        )
    s = summary
    lines.append(
        f"\nKI median {s['ki']['p50']} (p90 {s['ki']['p90']}), VI median {s['vi']['p50']} (p90 {s['vi']['p90']}), "
        f"n={s['ki']['n']}."
    )
    md = "\n".join(lines) + "\n"
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
        (args.out / f"cascades_{args.file.stem}.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
        (args.out / f"cascades_{args.file.stem}.md").write_text(md, encoding="utf-8")
    print(md)
    return 0


# ------------------------------------------------------------------------------------------------------------ main


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    sub = parser.add_subparsers(dest="command", required=True)

    def window(p: argparse.ArgumentParser) -> None:
        p.add_argument("--since", type=parse_day, required=True, help="first day (UTC), YYYY-MM-DD")
        p.add_argument("--until", type=parse_day, required=True, help="last day (UTC, inclusive), YYYY-MM-DD")
        p.add_argument("--repos", nargs="+", default=REPOS, help="repositories (default: the 12 CI-FAST repos)")

    p = sub.add_parser("collect", help="fetch runs and jobs with gh api")
    window(p)
    p.add_argument("--out", type=Path, required=True, help="raw data directory (repo/runs.json, repo/jobs_<id>.json)")
    p.add_argument("--runs-only", action="store_true", help="skip the jobs (one call per run)")
    p.add_argument("--workers", type=int, default=8)
    p.set_defaults(func=cmd_collect)

    p = sub.add_parser("kpis", help="M3, queue, runner minutes, superseded, re-runs, master red rate")
    window(p)
    p.add_argument("--data", type=Path, required=True, help="raw data directory from collect (or the W0 tarball)")
    p.add_argument("--out", type=Path, required=True, help="output directory for kpis_<window>.json/.md")
    p.set_defaults(func=cmd_kpis)

    p = sub.add_parser("cascades", help="M1 KI and M2 VI per cascade")
    p.add_argument("file", type=Path, help="cascade definition (JSON), e.g. cascades-2026-11.json")
    p.add_argument("--prs-json", type=Path, help="offline PR snapshot instead of gh api")
    p.add_argument("--runs-data", type=Path, help="raw data directory (runs.json per repo) for the CI iteration count")
    p.add_argument("--out", type=Path, help="output directory")
    p.set_defaults(func=cmd_cascades)

    args = parser.parse_args(argv)
    result: int = args.func(args)
    return result


if __name__ == "__main__":
    sys.exit(main())

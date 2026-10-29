"""The pins of the platform agree: platform/versions.json, this studio and every pinned component.

Every Nodestro component and orkexa is referenced by an exact commit (no branch, no tag that could
move). The script checks that

- every commit in platform/versions.json is a full 40-character SHA,
- every ``git+https://github.com/peterkarlhuber/...`` reference in the studio and in each pinned
  component (its pyproject.toml at the pinned commit) names the commit versions.json gives,
- each component's version at that commit is the one versions.json gives,
- nothing references claude-agent.

``python scripts/check_versions.py`` reads the components from GitHub (needs read access, see the
platform workflow); ``--local DIR`` reads sibling checkouts in DIR instead (their HEAD must be the
pinned commit, or ``--worktree`` reads their working tree, for a release being prepared).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:  # Python 3.10
    import tomli as tomllib  # type: ignore[no-redef,import-not-found]

ROOT = Path(__file__).resolve().parents[1]
VERSIONS = ROOT / "platform" / "versions.json"
SHA = re.compile(r"^[0-9a-f]{40}$")
REFERENCE = re.compile(r"git\+https://github\.com/peterkarlhuber/(?P<repo>[\w.-]+?)(?:\.git)?@(?P<ref>[^\s#;\"']+)")


def references(dependencies: list[str]) -> list[tuple[str, str]]:
    return [(found["repo"], found["ref"]) for item in dependencies for found in REFERENCE.finditer(item)]


def dependencies(pyproject: dict[str, Any]) -> list[str]:
    project = pyproject.get("project", {})
    found = list(project.get("dependencies", []))
    for extra in project.get("optional-dependencies", {}).values():
        found += extra
    return found


def check_pyproject(owner: str, text: str, versions: dict[str, Any], expected_version: str | None) -> list[str]:
    problems: list[str] = []
    if "claude-agent" in text or "claude_agent" in text:
        problems.append(f"{owner}: references claude-agent")
    pyproject = tomllib.loads(text)
    version = pyproject.get("project", {}).get("version")
    if expected_version is not None and version != expected_version:
        problems.append(f"{owner}: version {version}, versions.json says {expected_version}")
    components = versions["components"]
    for repo, ref in references(dependencies(pyproject)):
        if not SHA.match(ref):
            problems.append(f"{owner}: {repo}@{ref} is not pinned to a commit")
        elif repo not in components:
            problems.append(f"{owner}: {repo} is not in platform/versions.json")
        elif components[repo]["commit"] != ref:
            problems.append(f"{owner}: {repo}@{ref[:12]}, versions.json pins {components[repo]['commit'][:12]}")
    return problems


def git(*args: str, cwd: Path | None = None) -> str:
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def read_remote(repo: str, commit: str, path: str, cache: Path) -> str:
    target = cache / repo
    if not target.exists():
        url = f"https://github.com/peterkarlhuber/{repo}.git"
        git("clone", "--quiet", "--filter=blob:none", "--no-checkout", url, str(target))
    return git("show", f"{commit}:{path}", cwd=target)


def read_local(directory: Path, repo: str, commit: str, path: str, worktree: bool) -> str:
    checkout = directory / repo
    if worktree:
        return (checkout / path).read_text(encoding="utf-8")
    head = git("rev-parse", "HEAD", cwd=checkout).strip()
    if head != commit:
        raise SystemExit(f"{checkout}: HEAD is {head[:12]}, versions.json pins {commit[:12]}")
    return git("show", f"{commit}:{path}", cwd=checkout)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--local", type=Path, help="a directory with checkouts of the components")
    parser.add_argument("--worktree", action="store_true", help="with --local: read the working trees")
    parser.add_argument("--versions", type=Path, default=VERSIONS)
    args = parser.parse_args(argv)
    versions = json.loads(args.versions.read_text(encoding="utf-8"))
    components: dict[str, Any] = versions["components"]
    problems: list[str] = []
    for repo, entry in components.items():
        if not SHA.match(entry["commit"]):
            problems.append(f"versions.json: {repo} is not pinned to a full commit ({entry['commit']})")
    studio = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    problems += check_pyproject("nodestro-studio", studio, versions, versions["platform"])
    pinned = {repo for repo, _ref in references(dependencies(tomllib.loads(studio)))}
    missing = {repo for repo, entry in components.items() if entry.get("studio_dependency")} - pinned
    problems += [f"nodestro-studio: does not depend on {repo}" for repo in sorted(missing)]
    with tempfile.TemporaryDirectory(prefix="nodestro-versions-") as cache:
        for repo, entry in components.items():
            path = entry.get("pyproject")
            if not path or not SHA.match(entry["commit"]):
                continue
            if args.local:
                text = read_local(args.local, repo, entry["commit"], path, args.worktree)
            else:
                text = read_remote(repo, entry["commit"], path, Path(cache))
            problems += check_pyproject(f"{repo}@{entry['commit'][:12]}", text, versions, entry.get("version"))
    for problem in problems:
        print(f"::error::{problem}")
    names = ", ".join(f"{repo} {entry.get('version', '')}@{entry['commit'][:12]}" for repo, entry in components.items())
    print(f"platform {versions['platform']}: {names}")
    print("pins agree" if not problems else f"{len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

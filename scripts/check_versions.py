"""The pins of the platform agree: platform/versions.json, this studio and every pinned component.

Every Nodestro component and orkexa is referenced by an exact commit (no branch, no tag that could
move). The script checks that

- every commit in platform/versions.json is a full 40-character SHA,
- every dependency on a platform component in the studio and in each pinned component (its pyproject.toml at the
  pinned commit) is exactly the canonical reference ``<name> @ git+https://github.com/peterkarlhuber/<repo>.git@<commit
  versions.json gives>`` (requirements are parsed with ``packaging``, names compared normalised): a plain name
  (``nodestro-runtime>=0.2``, which would install whatever a package index offers under that name), another owner or
  spelling, ``git+ssh``, an archive URL or a branch are refused, and so is a URL of a component under another name
  (API2-09),
- each component's version at that commit is the one versions.json gives (a component with a dynamic version,
  such as Axentra, names the file that holds it in ``version_file``: ``__version__ = "..."``),
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
import tomllib
from typing import Any

from packaging.requirements import InvalidRequirement, Requirement
from packaging.utils import canonicalize_name

ROOT = Path(__file__).resolve().parents[1]
VERSIONS = ROOT / "platform" / "versions.json"
SHA = re.compile(r"^[0-9a-f]{40}$")
VERSION_ASSIGNMENT = re.compile(r"^__version__\s*=\s*[\"']([^\"']+)[\"']", re.MULTILINE)
OWNER = "peterkarlhuber"
#: A git reference of the owner's repositories (any spelling): the repository and the commit or branch it names.
REFERENCE = re.compile(
    r"github\.com[/:]" + OWNER + r"/(?P<repo>[\w.-]+?)(?:\.git)?(?:@(?P<ref>[^\s#;\"']+))?(?:[#;\s\"']|$)",
    re.IGNORECASE,
)
#: Distributions whose name is not their repository's, and repositories whose package is in a subdirectory.
DISTRIBUTIONS = {"nodestro-client": "nodestro-sdk"}
SUBDIRECTORIES = {"nodestro-sdk": "python"}


def canonical_url(repo: str, commit: str) -> str:
    """The one accepted reference of a platform component."""
    url = f"git+https://github.com/{OWNER}/{repo}.git@{commit}"
    return url + (f"#subdirectory={SUBDIRECTORIES[repo]}" if repo in SUBDIRECTORIES else "")


def component_of(name: str, components: dict[str, Any]) -> str | None:
    """The platform component (repository) a distribution name stands for, compared normalised."""
    wanted = canonicalize_name(name)
    if wanted in DISTRIBUTIONS:
        return DISTRIBUTIONS[wanted]
    return next((repo for repo in components if canonicalize_name(repo) == wanted), None)


def references(dependencies: list[str]) -> list[tuple[str, str]]:
    """``(repository, ref)`` of every reference to one of the owner's repositories (``ref`` empty without one)."""
    return [(found["repo"].lower(), found["ref"] or "") for item in dependencies for found in REFERENCE.finditer(item)]


def check_requirement(owner: str, item: str, components: dict[str, Any], own_name: str = "") -> list[str]:
    """Problems of one dependency: a platform component must be referenced exactly by :func:`canonical_url`
    (``own_name``: the package's own name, which its extras may name, as ``axentra[server]``)."""
    try:
        requirement = Requirement(item)
    except InvalidRequirement as exc:
        return [f"{owner}: {item!r} is not a valid requirement ({exc})"]
    if own_name and canonicalize_name(requirement.name) == canonicalize_name(own_name) and not requirement.url:
        return []
    repo = component_of(requirement.name, components)
    url = requirement.url or ""
    linked = [found_repo for found_repo, _ref in references([url])]
    if repo is None:
        named = [found for found in linked if found in {name.lower() for name in components}]
        if named:
            return [f"{owner}: {requirement.name} refers to the component {named[0]} under another name"]
        if linked:
            return [f"{owner}: {linked[0]} is not in platform/versions.json"]
        return []
    commit = str(components[repo]["commit"])
    expected = canonical_url(repo, commit)
    if url == expected:
        return []
    if not url:
        return [
            f"{owner}: {requirement.name} is not pinned to a commit (a plain name installs whatever a package index "
            f"offers under it); use {expected}"
        ]
    refs = [ref for found_repo, ref in references([url]) if found_repo == repo.lower()]
    if refs and refs[0] and not SHA.match(refs[0]):
        return [f"{owner}: {repo}@{refs[0]} is not pinned to a commit"]
    if refs and SHA.match(refs[0]) and refs[0] != commit:
        return [f"{owner}: {repo}@{refs[0][:12]}, versions.json pins {commit[:12]}"]
    return [f"{owner}: {requirement.name} @ {url} is not the canonical reference {expected}"]


def dependencies(pyproject: dict[str, Any]) -> list[str]:
    project = pyproject.get("project", {})
    found = list(project.get("dependencies", []))
    for extra in project.get("optional-dependencies", {}).values():
        found += extra
    return found


def check_pyproject(
    owner: str,
    text: str,
    versions: dict[str, Any],
    expected_version: str | None,
    version_text: str | None = None,
) -> list[str]:
    """Problems of one pyproject; ``version_text`` is the content of a dynamic version's ``version_file``."""
    problems: list[str] = []
    if "claude-agent" in text or "claude_agent" in text:
        problems.append(f"{owner}: references claude-agent")
    pyproject = tomllib.loads(text)
    project = pyproject.get("project", {})
    version = project.get("version")
    if version is None and "version" in project.get("dynamic", []):
        found = VERSION_ASSIGNMENT.search(version_text or "")
        if found is None:
            problems.append(f"{owner}: the version is dynamic; versions.json needs a version_file with __version__")
            return problems
        version = found.group(1)
    if expected_version is not None and version != expected_version:
        problems.append(f"{owner}: version {version}, versions.json says {expected_version}")
    components = versions["components"]
    for item in dependencies(pyproject):
        problems += check_requirement(owner, item, components, str(project.get("name", "")))
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

            def read(file: str, repo: str = repo, commit: str = entry["commit"]) -> str:
                if args.local:
                    return read_local(args.local, repo, commit, file, args.worktree)
                return read_remote(repo, commit, file, Path(cache))

            text = read(path)
            version_file = entry.get("version_file")
            problems += check_pyproject(
                f"{repo}@{entry['commit'][:12]}",
                text,
                versions,
                entry.get("version"),
                read(version_file) if version_file else None,
            )
    for problem in problems:
        print(f"::error::{problem}")
    names = ", ".join(f"{repo} {entry.get('version', '')}@{entry['commit'][:12]}" for repo, entry in components.items())
    print(f"platform {versions['platform']}: {names}")
    print("pins agree" if not problems else f"{len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

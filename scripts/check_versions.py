"""The pins of the platform agree: platform/versions.json, its lock (platform/internal*.txt), this studio and every
pinned component.

Every platform component is locked by an exact commit (no branch, no tag that could move) in one place: versions.json
and the lock generated from it (``--write-lock``). The components require each other only by version range. The
script checks that

- every commit in platform/versions.json is a full 40-character SHA, and the lock files are exactly what versions.json
  generates (one ``<name> @ git+https://github.com/peterkarlhuber/<repo>.git@<commit>`` line per component of the
  profile),
- every dependency on a platform component in the studio and in each locked component (its pyproject.toml at the
  locked commit) is a version range that contains the locked version (requirements are parsed with ``packaging``,
  names compared normalised): a plain name without a range and any URL (a git pin, another owner or spelling,
  ``git+ssh``, an archive) are refused, and so is a URL of a component under another name (API2-09),
- each component's version at that commit is the one versions.json gives (a component with a dynamic version,
  such as Axentra, names the file that holds it in ``version_file``: ``__version__ = "..."``),
- nothing references claude-agent,
- TABRION VER-1 / QA-15 (AC-6, K-34): the foundation tabrion (``platform/versions.json`` component ``tabrion``, a
  final version) is the one tabrion of every installation (see :func:`check_tabrion`): every component requires it
  only by a minor range ``>=M.N,<M.(N+1)`` with final bounds, no URL, no marker (RC-1, RC-8), all components the same
  minor (RC-2); the lock holds exactly one tabrion line, the canonical pin of a known final release commit
  (``releases``) inside that range, and both lock files name the same commit; each library's
  ``requirements/tabrion.txt`` (its standalone install) holds exactly one pin on a commit of a final tabrion version
  inside the library's range (another final of the same minor is a warning, RC-7); the dependency policy (K-33)
  holds, every locked manifest follows it and the graph of the dependencies has no cycle.

``--drift`` (RC-7, the nightly report) compares ``requirements/tabrion.txt`` on each library's default branch with
the pinned tabrion commit; it only reports (``::warning::``) and always exits 0.

``python scripts/check_versions.py`` reads the components from GitHub (needs read access, see the
platform workflow); ``--local DIR`` reads sibling checkouts in DIR instead (their HEAD must be the
pinned commit, or ``--worktree`` reads their working tree, for a release being prepared).
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import tomllib
from typing import Any

from packaging.requirements import InvalidRequirement, Requirement
from packaging.specifiers import SpecifierSet
from packaging.utils import canonicalize_name
from packaging.version import InvalidVersion, Version

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lock_check  # the profiles of an installation (standard library only)

import check_dependency_policy  # the K-33 policy (standard library only)

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
POLICY = ROOT / "platform" / "dependency-policy.json"
#: The lock: the exact commit of every internal package, one file per installation profile. The libraries require
#: each other by version ranges only; every install names the lock: ``pip install -r platform/internal.txt ...``.
LOCK_FILES = {"studio": "internal.txt", "server": "internal-server.txt"}
LOCK = "platform/internal.txt"
LOCK_HEADER = (
    "# The lock of the platform's internal packages, {profile} profile: generated from platform/versions.json by\n"
    "# scripts/check_versions.py --write-lock (do not edit). Install with: pip install -r <this file> <target>\n"
)
#: The foundation every installation holds exactly once (K-34) and the file a library installs it from (VER-1).
TABRION = "tabrion"
TABRION_REQUIREMENTS = "requirements/tabrion.txt"
#: The one form of tabrion in the lock: the canonical pin of a full, lowercase commit.
LOCK_PIN = re.compile(r"tabrion @ git\+https://github\.com/" + OWNER + r"/tabrion\.git@(?P<commit>[0-9a-f]{40})")
#: pip's inline comment: whitespace, then "#".
INLINE_COMMENT = re.compile(r"\s+#")


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


def check_requirement(
    owner: str,
    item: str,
    components: dict[str, Any],
    own_name: str = "",
) -> list[str]:
    """Problems of one dependency: a platform component is required only by a version range that contains the
    locked version (:func:`check_locked_range`), never by a URL; the commit is in the lock, :data:`LOCK`
    (``own_name``: the package's own name, which its extras may name, as ``axentra[server]``); tabrion only by a
    final minor range (:func:`check_range`)."""
    try:
        requirement = Requirement(item)
    except InvalidRequirement as exc:
        return [f"{owner}: {item!r} is not a valid requirement ({exc})"]
    if own_name and canonicalize_name(requirement.name) == canonicalize_name(own_name) and not requirement.url:
        return []
    repo = component_of(requirement.name, components)
    if repo == TABRION:
        return check_range(owner, requirement)
    url = requirement.url or ""
    linked = [found_repo for found_repo, _ref in references([url])]
    if repo is None:
        named = [found for found in linked if found in {name.lower() for name in components}]
        if named:
            return [f"{owner}: {requirement.name} refers to the component {named[0]} under another name"]
        if linked:
            return [f"{owner}: {linked[0]} is not in platform/versions.json"]
        return []
    if url:
        return [f"{owner}: {requirement.name} @ {url}: declare a version range, the commit belongs in {LOCK}"]
    return check_locked_range(owner, requirement, repo, components[repo])


def check_locked_range(owner: str, requirement: Requirement, repo: str, entry: dict[str, Any]) -> list[str]:
    """A platform component required by name: a version range (a plain name would accept any version a package
    index offers) that contains the version versions.json locks (pip refuses the lock otherwise)."""
    if not requirement.specifier:
        return [f"{owner}: {requirement.name} has no version range (such as >=X.Y,<X.Y+1)"]
    locked = str(entry.get("version", ""))
    try:
        contained = requirement.specifier.contains(locked, prereleases=True)
    except InvalidVersion:
        contained = False
    if not contained:
        return [f"{owner}: {requirement.name}{requirement.specifier} excludes the locked version {locked}"]
    return []


def lock_components(components: dict[str, Any], profile: str) -> list[str]:
    """The components (repositories) of a profile's lock: the studio's dependencies, orkexa and the foundation tabrion
    (every profile since TABRION MIG-NOD-3); the server profile also the server-only components (axentra)."""
    return lock_check.required(components, profile)


def lock_text(components: dict[str, Any], profile: str) -> str:
    """The content of a profile's lock file (:data:`LOCK_FILES`), generated from versions.json."""
    lines = [
        f"{lock_check.distribution_name(repo)} @ {canonical_url(repo, str(components[repo]['commit']))}"
        for repo in lock_components(components, profile)
    ]
    return LOCK_HEADER.format(profile=profile) + "".join(f"{line}\n" for line in lines)


def check_locks(components: dict[str, Any], platform: Path, write: bool = False) -> list[str]:
    """Each lock file is exactly :func:`lock_text` (``write``: make it so)."""
    problems: list[str] = []
    for profile, name in LOCK_FILES.items():
        path = platform / name
        expected = lock_text(components, profile)
        if write:
            path.write_text(expected, encoding="utf-8")
        elif not path.is_file() or path.read_text(encoding="utf-8") != expected:
            problems.append(f"platform/{name} does not match versions.json; run scripts/check_versions.py --write-lock")
    return problems


def is_final(version: str) -> bool:
    """A final release (``0.1.0``): no pre-release, development release or local label (RC-8)."""
    try:
        parsed = Version(version)
    except InvalidVersion:
        return False
    return not parsed.is_prerelease and parsed.local is None


def tabrion_minor(specifier: SpecifierSet) -> tuple[int, int] | None:
    """``(M, N)`` of a minor range ``>=M.N,<M.(N+1)`` (the lower bound may name a patch, ``>=M.N.P``) with final
    bounds; None for any other specifier."""
    clauses = {spec.operator: spec.version for spec in specifier}
    if len(specifier) != 2 or set(clauses) != {">=", "<"} or not all(map(is_final, clauses.values())):
        return None
    lower, upper = Version(clauses[">="]).release, Version(clauses["<"]).release
    if len(lower) < 2 or len(upper) < 2 or any(upper[2:]) or upper[:2] != (lower[0], lower[1] + 1):
        return None
    return lower[0], lower[1]


def check_range(owner: str, requirement: Requirement) -> list[str]:
    """A component's requirement on tabrion: a minor range ``>=M.N,<M.(N+1)`` with final bounds (RC-8), never a URL
    (RC-1; the commit is in the lock) and no environment marker. That the locked tabrion lies inside the range and
    that every component names the same minor is :func:`check_tabrion`'s."""
    if requirement.url:
        return [
            f"{owner}: {requirement}: tabrion is required by a range, never by a URL; the lock holds the commit (RC-1)"
        ]
    if requirement.marker is not None:
        return [
            f"{owner}: {requirement}: a tabrion requirement carries no environment marker (it could install nothing)"
        ]
    if requirement.specifier.prereleases:
        return [f"{owner}: {requirement} names a pre-release; master carries only final ranges (RC-8)"]
    if tabrion_minor(requirement.specifier) is None:
        return [f"{owner}: {requirement}: require tabrion by a minor range >=M.N,<M.(N+1), such as >=0.1,<0.2 (RC-1)"]
    return []


def tabrion_requirements(owner: str, text: str, entry: dict[str, Any]) -> tuple[list[str], str | None]:
    """``(problems, commit)`` of a library's ``requirements/tabrion.txt``: exactly one line, the canonical git pin of
    one commit (no option, no second pin, no specifier); ``commit`` is None unless the file is right."""
    lines = [INLINE_COMMENT.split(line, maxsplit=1)[0].strip() for line in text.splitlines()]
    lines = [line for line in lines if line and not line.startswith("#")]
    where = f"{owner} {TABRION_REQUIREMENTS}"
    expected = canonical_url(TABRION, str(entry["commit"]))
    if len(lines) != 1:
        return [f"{where}: {len(lines)} requirement lines, exactly one tabrion pin belongs here (RC-8)"], None
    line = lines[0]
    if line.startswith("-"):
        return [f"{where}: {line!r}: only the one tabrion pin belongs here, no option"], None
    try:
        requirement = Requirement(line)
    except InvalidRequirement as exc:
        return [f"{where}: {line!r} is not a valid requirement ({exc})"], None
    if canonicalize_name(requirement.name) != TABRION:
        return [f"{where}: {requirement.name} does not belong here, only the tabrion pin"], None
    if requirement.specifier.prereleases:
        return [f"{where}: {line!r} names a pre-release; master carries none (RC-8)"], None
    if requirement.marker is not None:
        return [f"{where}: {line!r}: the tabrion pin carries no environment marker (it could install nothing)"], None
    refs = [ref for repo, ref in references([requirement.url or ""]) if repo == TABRION]
    commit = refs[0] if refs else ""
    if not SHA.match(commit) or requirement.url != canonical_url(TABRION, commit) or str(requirement.specifier):
        return [f"{where}: {line!r} is not the git pin of one commit; use tabrion @ {expected}"], None
    return [], commit


def release_of(entry: dict[str, Any], commit: str) -> str | None:
    """The final version whose release commit ``commit`` is, by the authoritative ``releases`` map of versions.json."""
    return next((version for version, sha in dict(entry.get("releases", {})).items() if sha == commit), None)


def check_releases(entry: dict[str, Any]) -> list[str]:
    """The ``releases`` map of the tabrion entry: final versions on full commits, one commit per version, and the
    pinned commit is the release commit of the pinned version (a commit that only reads that version is not)."""
    releases = entry.get("releases")
    if not isinstance(releases, dict) or not releases:
        return ["versions.json: tabrion needs releases {version: release commit} (RC-8, non-release commits)"]
    problems = []
    for version, commit in releases.items():
        if not is_final(str(version)):
            problems.append(f"versions.json: tabrion releases names {version}, not a final version (RC-8)")
        if not SHA.match(str(commit)):
            problems.append(f"versions.json: tabrion releases {version} is not a full commit ({commit})")
    if len(set(releases.values())) != len(releases):
        problems.append("versions.json: tabrion releases names one commit for two versions")
    version, commit = str(entry.get("version", "")), str(entry["commit"])
    if releases.get(version) != commit:
        problems.append(
            f"versions.json: tabrion {version}@{commit[:12]} is not the release commit of {version} in releases "
            f"({str(releases.get(version, '-'))[:12]})"
        )
    return problems


def check_tabrion_pin(
    owner: str, commit: str, version_text: str | None, entry: dict[str, Any], specifiers: list[Requirement]
) -> tuple[list[str], list[str]]:
    """``(problems, warnings)`` of the commit a library's requirements/tabrion.txt pins (``version_text``: tabrion's
    version file at that commit, None if the commit cannot be read). Only a release commit of the ``releases`` map
    counts as a final; another commit that reads the same version (a merge of master into a branch, a branch commit)
    is refused."""
    pinned, pinned_version = str(entry["commit"]), str(entry.get("version", ""))
    if commit == pinned:
        return [], []
    where = f"{owner} {TABRION_REQUIREMENTS}"
    found = VERSION_ASSIGNMENT.search(version_text or "")
    release = release_of(entry, commit)
    if found is None:
        return [f"{where}: tabrion@{commit[:12]} cannot be read (not a tabrion commit?)"], []
    version = found.group(1)
    if not is_final(version):
        return [f"{where}: tabrion@{commit[:12]} is {version}, not a final version (RC-8)"], []
    if release is None:
        return [
            f"{where}: tabrion@{commit[:12]} reads {version} but is not a release commit (versions.json releases); "
            "pin the release commit (RC-8)"
        ], []
    if release != version:
        return [f"{where}: tabrion@{commit[:12]} reads {version}, versions.json releases says {release}"], []
    outside = [str(item) for item in specifiers if not item.specifier.contains(version, prereleases=False)]
    if outside:
        return [f"{where}: tabrion {version}@{commit[:12]} is outside the library's range {outside[0]}"], []
    if Version(version).release[:2] != Version(pinned_version).release[:2]:
        return [f"{where}: tabrion {version}@{commit[:12]}, versions.json pins {pinned_version} (another minor)"], []
    relation = "an older" if Version(version) < Version(pinned_version) else "another"
    warning = f"{where}: tabrion {version}@{commit[:12]} is {relation} final than {pinned_version}@{pinned[:12]}"
    return [], [warning + " (RC-7)"]


def cycles(graph: dict[str, set[str]]) -> list[str]:
    """Every cycle of a dependency graph, as ``a -> b -> a``."""
    state: dict[str, int] = {}  # 1 on the stack, 2 done
    found: list[str] = []

    def visit(node: str, path: list[str]) -> None:
        state[node] = 1
        for nxt in sorted(graph.get(node, ())):
            if state.get(nxt) == 1:
                found.append(" -> ".join([*path[path.index(nxt) :], nxt]))
            elif nxt not in state:
                visit(nxt, [*path, nxt])
        state[node] = 2

    for node in sorted(graph):
        if node not in state:
            visit(node, [node])
    return found


def lock_tabrion(name: str, text: str) -> tuple[list[str], list[str]]:
    """``(problems, commits)`` of the tabrion lines of one lock file: at most one line, the canonical pin
    ``tabrion @ git+https://github.com/peterkarlhuber/tabrion.git@<40 lowercase hex>``."""
    where = f"platform/{name}"
    found = []
    for raw in text.splitlines():
        line = INLINE_COMMENT.split(raw, maxsplit=1)[0].strip()
        if not line or line.startswith("#"):
            continue
        requirement = _requirement(line)
        named = requirement is not None and canonicalize_name(requirement.name) == TABRION
        if named or any(repo == TABRION for repo, _ref in references([line])):
            found.append(line)
    problems, commits = [], []
    if len(found) > 1:
        problems.append(f"{where}: {len(found)} tabrion lines, the lock holds exactly one (K-34, RC-2)")
    for line in found:
        match = LOCK_PIN.fullmatch(line)
        if match is None:
            expected = f"tabrion @ {canonical_url(TABRION, '<40 lowercase hex>')}"
            problems.append(f"{where}: {line!r} is not the canonical tabrion lock line {expected}")
        else:
            commits.append(match["commit"])
    return problems, commits


def check_tabrion_lock(
    entry: dict[str, Any], locks: dict[str, str], ranged: list[tuple[str, Requirement]]
) -> list[str]:
    """The lock (file name -> text) holds one tabrion: one line, the same commit in every lock file that carries one,
    a known final release (``releases``) inside every component's range (``ranged``: (repo, requirement))."""
    problems: list[str] = []
    commits: dict[str, set[str]] = {}
    for name, text in sorted(locks.items()):
        found, pinned = lock_tabrion(name, text)
        problems += found
        for commit in pinned:
            commits.setdefault(commit, set()).add(name)
    if not commits and not problems:
        problems.append(f"the lock ({', '.join(sorted(locks))}) holds no tabrion; it holds exactly one (K-34)")
    if len(commits) > 1:
        listed = "; ".join(f"{commit[:12]} ({', '.join(sorted(names))})" for commit, names in sorted(commits.items()))
        problems.append(f"more than one tabrion commit in the lock (K-34, RC-2): {listed}")
    for commit in sorted(commits):
        version = release_of(entry, commit)
        if version is None:
            problems.append(f"lock: tabrion@{commit[:12]} is not a known final release (versions.json releases, RC-8)")
            continue
        outside = [f"{repo}: {item}" for repo, item in ranged if not item.specifier.contains(version)]
        if outside:
            problems.append(
                f"lock: tabrion {version}@{commit[:12]} lies outside the range of {'; '.join(outside)} (RC-2)"
            )
    return problems


def check_tabrion(
    versions: dict[str, Any],
    manifests: dict[str, str],
    policy: check_dependency_policy.Policy,
    requirements: dict[str, str | None],
    read_tabrion: Any,
    locks: dict[str, str],
) -> tuple[list[str], list[str]]:
    """``(problems, warnings)`` of the one tabrion (AC-6, K-34) across the manifests (repo -> pyproject text at the
    locked commit, the studio included), the libraries' ``requirements/tabrion.txt`` (repo -> text, None if the file
    does not exist), the dependency policy and the lock files (name -> text); ``read_tabrion(commit)`` returns
    tabrion's version file at a commit (None if it cannot be read). The form of each requirement (a final minor
    range, no URL) is check_pyproject's (:func:`check_range`)."""
    components: dict[str, Any] = versions["components"]
    problems: list[str] = [f"dependency policy: {error}" for error in policy.errors]
    warnings: list[str] = []
    for repo, text in manifests.items():
        problems += [f"dependency policy: {error}" for error in policy.check_manifest(repo, tomllib.loads(text))]
    graph = {repo: declared_components(text, components) - {repo} for repo, text in manifests.items()}
    problems += [f"cycle in the pinned dependency graph: {cycle} (P5, AC-6)" for cycle in cycles(graph)]
    entry = components.get(TABRION)
    if entry is None:
        return problems, warnings
    version = str(entry.get("version", ""))
    if not is_final(version):
        problems.append(f"versions.json: tabrion {version} is not a final version; master pins only finals (RC-8)")
    problems += check_releases(entry)
    ranged = [
        (repo, requirement)
        for repo, text in manifests.items()
        for item in dependencies(tomllib.loads(text))
        if (requirement := _requirement(item)) is not None
        and component_of(requirement.name, components) == TABRION
        and not requirement.url
    ]
    minors: dict[tuple[int, int], set[str]] = {}
    for repo, requirement in ranged:
        if (minor := tabrion_minor(requirement.specifier)) is not None:
            minors.setdefault(minor, set()).add(repo)
    if len(minors) > 1:
        listed = "; ".join(
            f">={m}.{n},<{m}.{n + 1} ({', '.join(sorted(repos))})" for (m, n), repos in sorted(minors.items())
        )
        problems.append(
            f"the components require different tabrion ranges, one minor belongs everywhere (RC-2): {listed}"
        )
    problems += check_tabrion_lock(entry, locks, ranged)
    for repo, content in requirements.items():
        own = [requirement for owner, requirement in ranged if owner == repo]
        owner = f"{repo}@{str(components[repo]['commit'])[:12]}"
        if content is None:
            if own:
                problems.append(f"{owner}: requires tabrion but has no {TABRION_REQUIREMENTS} (VER-1)")
            continue
        found, commit = tabrion_requirements(owner, content, entry)
        problems += found
        if commit is not None:
            more, warned = check_tabrion_pin(owner, commit, read_tabrion(commit), entry, own)
            problems += more
            warnings += warned
    return problems, warnings


def _requirement(item: str) -> Requirement | None:
    try:
        return Requirement(item)
    except InvalidRequirement:
        return None


def declared_components(text: str, components: dict[str, Any]) -> set[str]:
    """The platform components a pyproject requires (by range or by URL), every extra included."""
    found = (_requirement(item) for item in dependencies(tomllib.loads(text)))
    return {
        repo for requirement in found if requirement for repo in [component_of(requirement.name, components)] if repo
    }


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
    if not checkout.is_dir():
        raise SystemExit(
            f"{checkout}: no checkout of {repo}; --local needs every component of versions.json (tabrion included) "
            "at its pinned commit"
        )
    if worktree:
        return (checkout / path).read_text(encoding="utf-8")
    head = git("rev-parse", "HEAD", cwd=checkout).strip()
    if head != commit:
        raise SystemExit(f"{checkout}: HEAD is {head[:12]}, versions.json pins {commit[:12]}")
    return git("show", f"{commit}:{path}", cwd=checkout)


class Reader:
    """Files of the components: from GitHub (a partial clone per repository in ``cache``) or, with ``local``, from
    sibling checkouts (their HEAD must be the pinned commit, or ``worktree`` reads their working tree)."""

    def __init__(self, cache: Path, local: Path | None = None, worktree: bool = False) -> None:
        self.cache, self.local, self.worktree = cache, local, worktree

    def pinned(self, repo: str, commit: str, path: str) -> str:
        if self.local:
            return read_local(self.local, repo, commit, path, self.worktree)
        return read_remote(repo, commit, path, self.cache)

    def optional(self, repo: str, commit: str, path: str) -> str | None:
        """A file at the pinned commit, None if it does not exist there."""
        if self.local and self.worktree:
            file = self.local / repo / path
            return file.read_text(encoding="utf-8") if file.is_file() else None
        try:
            return self.pinned(repo, commit, path)
        except subprocess.CalledProcessError:
            return None

    def exists(self, repo: str, ref: str, path: str) -> bool | None:
        """Whether ``path`` exists at ``ref`` (trees only, no blob), None if the repository cannot be read."""
        try:
            if self.local:
                checkout = self.local / repo
            else:
                checkout = self.cache / repo
                if not checkout.exists():
                    url = f"https://github.com/{OWNER}/{repo}.git"
                    git("clone", "--quiet", "--filter=blob:none", "--no-checkout", url, str(checkout))
            return bool(git("ls-tree", "--name-only", ref, "--", path, cwd=checkout).strip())
        except (subprocess.CalledProcessError, OSError):
            return None

    def any(self, repo: str, ref: str, path: str) -> str | None:
        """A file at any commit or ref (``HEAD``: the default branch of a fresh clone), None if it cannot be read."""
        try:
            if self.local:
                return git("show", f"{ref}:{path}", cwd=self.local / repo)
            return read_remote(repo, ref, path, self.cache)
        except (subprocess.CalledProcessError, OSError):
            return None


def libraries(policy: check_dependency_policy.Policy, components: dict[str, Any]) -> list[str]:
    return [repo for repo in components if policy.components.get(repo, {}).get("kind") == "library"]


def drift(versions: dict[str, Any], policy: check_dependency_policy.Policy, reader: Reader) -> list[str]:
    """RC-7: each library's requirements/tabrion.txt on its default branch against the pinned tabrion (report)."""
    components: dict[str, Any] = versions["components"]
    entry = components.get(TABRION)
    if entry is None:
        return ["versions.json has no tabrion component"]
    version_file = str(entry.get("version_file", "src/tabrion/_version.py"))
    lines = []
    for repo in libraries(policy, components):
        owner = f"{repo}@HEAD"
        present = reader.exists(repo, "HEAD", TABRION_REQUIREMENTS)
        text = reader.any(repo, "HEAD", TABRION_REQUIREMENTS) if present else None
        if present is False:
            lines.append(f"{owner}: no {TABRION_REQUIREMENTS} on the default branch")
            continue
        if text is None:
            lines.append(f"{owner}: cannot read {repo} (network or access), drift unknown")
            continue
        problems, commit = tabrion_requirements(owner, text, entry)
        if commit is not None:
            pyproject = reader.any(repo, "HEAD", str(components[repo].get("pyproject", "pyproject.toml"))) or ""
            try:
                items = dependencies(tomllib.loads(pyproject))
            except tomllib.TOMLDecodeError as exc:
                lines.append(f"{owner}: cannot parse its pyproject.toml ({exc}), range unknown")
                items = []
            ranged = [
                requirement
                for item in items
                if (requirement := _requirement(item)) is not None
                and component_of(requirement.name, components) == TABRION
            ]
            more, warned = check_tabrion_pin(owner, commit, reader.any(TABRION, commit, version_file), entry, ranged)
            problems += more + warned
            if not problems:
                print(f"{owner}: {TABRION_REQUIREMENTS} pins tabrion {entry.get('version')}@{commit[:12]}, in sync")
        lines += problems
    return lines


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--local", type=Path, help="a directory with checkouts of the components")
    parser.add_argument("--worktree", action="store_true", help="with --local: read the working trees")
    parser.add_argument("--versions", type=Path, default=VERSIONS)
    parser.add_argument("--policy", type=Path, default=POLICY, help="default: platform/dependency-policy.json")
    parser.add_argument("--drift", action="store_true", help="RC-7 report: the libraries' default branches (exit 0)")
    parser.add_argument("--write-lock", action="store_true", help="write the lock files from versions.json, then check")
    args = parser.parse_args(argv)
    versions = json.loads(args.versions.read_text(encoding="utf-8"))
    policy = check_dependency_policy.load_policy(args.policy)
    components: dict[str, Any] = versions["components"]
    if args.drift:
        with tempfile.TemporaryDirectory(prefix="nodestro-versions-") as cache:
            report = drift(versions, policy, Reader(Path(cache), args.local))
        for line in report:
            print(f"::warning::{line}")
        summary = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary:
            with open(summary, "a", encoding="utf-8") as out:
                out.write("## tabrion drift (RC-7, report only)\n\n")
                out.write("".join(f"- {line}\n" for line in report) or "- every library is in sync\n")
        print("tabrion drift: " + (f"{len(report)} findings (report only)" if report else "in sync"))
        return 0
    problems: list[str] = []
    for repo, entry in components.items():
        if not SHA.match(entry["commit"]):
            problems.append(f"versions.json: {repo} is not pinned to a full commit ({entry['commit']})")
    studio = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    problems += check_pyproject("nodestro-studio", studio, versions, versions["platform"])
    problems += check_locks(components, args.versions.parent, args.write_lock)
    pinned = declared_components(studio, components)
    missing = {repo for repo, entry in components.items() if entry.get("studio_dependency")} - pinned
    problems += [f"nodestro-studio: does not depend on {repo}" for repo in sorted(missing)]
    manifests = {"nodestro-studio": studio}
    requirements: dict[str, str | None] = {}
    warnings: list[str] = []
    with tempfile.TemporaryDirectory(prefix="nodestro-versions-") as cache:
        reader = Reader(Path(cache), args.local, args.worktree)
        for repo, entry in components.items():
            path = entry.get("pyproject")
            if not path or not SHA.match(entry["commit"]):
                continue
            commit = entry["commit"]
            text = reader.pinned(repo, commit, path)
            manifests[repo] = text
            version_file = entry.get("version_file")
            problems += check_pyproject(
                f"{repo}@{commit[:12]}",
                text,
                versions,
                entry.get("version"),
                reader.pinned(repo, commit, version_file) if version_file else None,
            )
        for repo in libraries(policy, components):
            if SHA.match(components[repo]["commit"]):
                requirements[repo] = reader.optional(repo, components[repo]["commit"], TABRION_REQUIREMENTS)
        tabrion = components.get(TABRION, {})
        version_file = str(tabrion.get("version_file", "src/tabrion/_version.py"))
        locks = {
            name: path.read_text(encoding="utf-8") if (path := args.versions.parent / name).is_file() else ""
            for name in LOCK_FILES.values()
        }
        more, warnings = check_tabrion(
            versions, manifests, policy, requirements, lambda commit: reader.any(TABRION, commit, version_file), locks
        )
        problems += more
    for warning in warnings:
        print(f"::warning::{warning}")
    for problem in problems:
        print(f"::error::{problem}")
    names = ", ".join(f"{repo} {entry.get('version', '')}@{entry['commit'][:12]}" for repo, entry in components.items())
    print(f"platform {versions['platform']}: {names}")
    if problems:
        print(f"{len(problems)} problems")
    elif TABRION in components:
        tabrion_pin = f"{components[TABRION].get('version')}@{components[TABRION]['commit'][:12]}"
        print(f"pins agree, one tabrion {tabrion_pin}, graph acyclic, policy ok")
    else:
        print("pins agree, graph acyclic, policy ok")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

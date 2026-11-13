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
- nothing references claude-agent,
- TABRION VER-1 / QA-15 (AC-6, V-B0): the foundation tabrion (``platform/versions.json`` component ``tabrion``, a
  final version) is the one tabrion of every installation (see :func:`check_tabrion`): a library (axentra, orkexa;
  ``kind: library`` in ``platform/dependency-policy.json``) requires it only by a final version range that contains
  the pinned version, never by a direct URL (RC-1, RC-8); every other component that references it carries exactly
  the canonical pin of versions.json (nodestro-runtime extras and nodestro-api ``dev``, RC-2), so the installation
  holds one tabrion commit; the components in ``pinned_by`` must carry that pin (empty until PIN-W1); each library's
  ``requirements/tabrion.txt`` holds exactly one pin on a commit of a final tabrion version inside the library's
  range (another final of the same minor is a warning, RC-7); the dependency policy (K-33) holds, every pinned
  manifest follows it and the graph of the pins has no cycle.

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
#: The switch from commit pins to ranges: the components may still pin each other by their canonical URL (the studio
#: may not). Set to False once every component declares ranges.
COMPONENT_URL_PINS_ALLOWED = True
LOCK_HEADER = (
    "# The lock of the platform's internal packages, {profile} profile: generated from platform/versions.json by\n"
    "# scripts/check_versions.py --write-lock (do not edit). Install with: pip install -r <this file> <target>\n"
)
#: The foundation every installation holds exactly once (K-34) and the file a library installs it from (VER-1).
TABRION = "tabrion"
TABRION_REQUIREMENTS = "requirements/tabrion.txt"
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
    ranges: frozenset[str] = frozenset(),
    url_pins_allowed: bool = True,
) -> list[str]:
    """Problems of one dependency: a platform component is required by a version range that contains the locked
    version (:func:`check_locked_range`; the commit is in the lock, :data:`LOCK`) or, while ``url_pins_allowed``
    (the switch from pins to ranges), exactly by :func:`canonical_url` (``own_name``: the package's own name, which
    its extras may name, as ``axentra[server]``); a component in ``ranges`` (tabrion, for a library) only by a final
    version range (:func:`check_range`)."""
    try:
        requirement = Requirement(item)
    except InvalidRequirement as exc:
        return [f"{owner}: {item!r} is not a valid requirement ({exc})"]
    if own_name and canonicalize_name(requirement.name) == canonicalize_name(own_name) and not requirement.url:
        return []
    repo = component_of(requirement.name, components)
    if repo is not None and repo in ranges:
        return check_range(owner, requirement, repo, components[repo])
    if repo == TABRION and requirement.specifier.prereleases:
        return [f"{owner}: {item!r} names a pre-release; master carries none (RC-8)"]
    if repo == TABRION and requirement.marker is not None:
        return [f"{owner}: {item!r}: a tabrion requirement carries no environment marker (it could install nothing)"]
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
    if not url:
        return check_locked_range(owner, requirement, repo, components[repo])
    if not url_pins_allowed:
        return [f"{owner}: {requirement.name} @ {url}: declare a version range, the commit belongs in {LOCK}"]
    if url == expected:
        return []
    refs = [ref for found_repo, ref in references([url]) if found_repo == repo.lower()]
    if refs and refs[0] and not SHA.match(refs[0]):
        return [f"{owner}: {repo}@{refs[0]} is not pinned to a commit"]
    if refs and SHA.match(refs[0]) and refs[0] != commit:
        return [f"{owner}: {repo}@{refs[0][:12]}, versions.json pins {commit[:12]}"]
    return [f"{owner}: {requirement.name} @ {url} is not the canonical reference {expected}"]


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
    """The components (repositories) of a profile's lock: the studio's dependencies and orkexa; the server profile
    also the server-only components (axentra) and the foundation tabrion they build on."""
    names = lock_check.required(components, profile)
    if profile == "server" and TABRION in components:
        names.append(TABRION)
    return sorted(set(names))


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


def check_range(owner: str, requirement: Requirement, repo: str, entry: dict[str, Any]) -> list[str]:
    """A library's requirement on tabrion: a final range (RC-8) without URL (RC-1) that holds the pinned version
    (RC-2)."""
    if requirement.url:
        return [f"{owner}: a library requires {repo} by a version range, never by a direct URL (RC-1): {requirement}"]
    if requirement.marker is not None:
        return [f"{owner}: {requirement}: a {repo} requirement carries no environment marker"]
    if not str(requirement.specifier):
        return [f"{owner}: {requirement} has no version range; a library requires {repo} by one (RC-1)"]
    if requirement.specifier.prereleases:
        return [f"{owner}: {requirement} names a pre-release; master carries only final ranges (RC-8)"]
    version = str(entry.get("version", ""))
    if not requirement.specifier.contains(version, prereleases=False):
        return [f"{owner}: {requirement} does not contain {repo} {version} of versions.json (RC-2)"]
    return []


def foundation_ranges(repo: str, policy: check_dependency_policy.Policy, components: dict[str, Any]) -> frozenset[str]:
    """The components ``repo`` requires by range: for a library, every ``no_direct_url`` component (tabrion)."""
    if policy.components.get(repo, {}).get("kind") != "library":
        return frozenset()
    return frozenset(
        name for name, entry in policy.components.items() if entry.get("no_direct_url") and name in components
    )


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


def tabrion_pins(text: str, components: dict[str, Any]) -> list[tuple[str, str]]:
    """``(requirement, commit)`` of every direct reference of a manifest to tabrion (ref empty without a commit)."""
    found = []
    for item in dependencies(tomllib.loads(text)):
        try:
            requirement = Requirement(item)
        except InvalidRequirement:
            continue
        refs = [ref for repo, ref in references([requirement.url or ""]) if repo == TABRION]
        named = component_of(requirement.name, components) == TABRION
        if requirement.url and (refs or named):
            found.append((str(requirement), refs[0] if refs else ""))
    return found


def parsed_manifests(manifests: dict[str, str]) -> dict[str, tuple[str, list[str], dict[str, list[str]]]]:
    """repo -> (its distribution name, core requirements, extras)."""
    out: dict[str, tuple[str, list[str], dict[str, list[str]]]] = {}
    for repo, text in manifests.items():
        project = tomllib.loads(text).get("project", {})
        extras: dict[str, list[str]] = {
            str(canonicalize_name(name)): list(items)
            for name, items in project.get("optional-dependencies", {}).items()
        }
        out[repo] = (
            str(canonicalize_name(str(project.get("name", repo)))),
            list(project.get("dependencies", [])),
            extras,
        )
    return out


def tabrion_closure(
    root: str, extras: frozenset[str], parsed: dict[str, Any], components: dict[str, Any]
) -> tuple[set[str], bool]:
    """``(ranged, pinned)`` of installing ``root[extras]`` from the pinned manifests: the components that require
    tabrion by a range on the way, and whether a git pin of tabrion is on the way (pip then installs that commit)."""
    ranged: set[str] = set()
    pinned = False
    seen: set[tuple[str, frozenset[str]]] = set()
    todo = [(root, extras)]
    while todo:
        node = todo.pop()
        if node in seen or node[0] not in parsed:
            continue
        seen.add(node)
        repo, wanted = node
        name, core, optional = parsed[repo]
        items = core + [item for extra in sorted(wanted) for item in optional.get(extra, [])]
        for item in items:
            requirement = _requirement(item)
            if requirement is None:
                continue
            requested = frozenset(canonicalize_name(extra) for extra in requirement.extras)
            if canonicalize_name(requirement.name) == name and not requirement.url:
                todo.append((repo, wanted | requested))
                continue
            target = component_of(requirement.name, components)
            if target == TABRION:
                if requirement.url:
                    pinned = True
                else:
                    ranged.add(repo)
            elif target is not None:
                todo.append((target, requested))
    return ranged, pinned


def unpinned_ranges(
    manifests: dict[str, str], policy: check_dependency_policy.Policy, components: dict[str, Any]
) -> list[str]:
    """Every install of a non-library component (core, and core with each one extra) that would pull tabrion by a
    library's range with no tabrion git pin on the way: pip would take tabrion from a package index (a free name
    there, dependency confusion). Independent of ``pinned_by``: it holds as soon as a pinned library has the range."""
    parsed = parsed_manifests(manifests)
    library = set(libraries(policy, components))
    problems = []
    for repo in manifests:
        if repo in library or repo == TABRION:
            continue
        for extra in [None, *sorted(parsed[repo][2])]:
            ranged, pinned = tabrion_closure(repo, frozenset([extra] if extra else []), parsed, components)
            if ranged and not pinned:
                where = f"{repo}[{extra}]" if extra else repo
                problems.append(
                    f"{where}: pulls tabrion by the range of {', '.join(sorted(ranged))} without a tabrion pin, so "
                    f"pip would take it from a package index; pin tabrion @ "
                    f"{canonical_url(TABRION, str(components[TABRION]['commit']))} there (RC-2, K-34)"
                )
    return problems


def check_tabrion(
    versions: dict[str, Any],
    manifests: dict[str, str],
    policy: check_dependency_policy.Policy,
    requirements: dict[str, str | None],
    read_tabrion: Any,
) -> tuple[list[str], list[str]]:
    """``(problems, warnings)`` of the one tabrion (AC-6, K-34) across the manifests (repo -> pyproject text at the
    pinned commit, the studio included), the libraries' ``requirements/tabrion.txt`` (repo -> text, None if the file
    does not exist) and the dependency policy; ``read_tabrion(commit)`` returns tabrion's version file at a commit
    (None if it cannot be read). A per-requirement problem (another commit, a range) is check_pyproject's."""
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
    problems += unpinned_ranges(manifests, policy, components)
    held: dict[str, list[str]] = {}
    for repo, text in manifests.items():
        for pin, ref in tabrion_pins(text, components):
            held.setdefault(ref or "(no commit)", []).append(f"{repo}: {pin}")
    if len(held) > 1:
        listed = "; ".join(f"{ref[:12]} ({', '.join(owners)})" for ref, owners in sorted(held.items()))
        problems.append(f"more than one tabrion in one installation (K-34, RC-2): {listed}")
    for repo in entry.get("pinned_by", []):
        if repo not in manifests:
            problems.append(f"versions.json: tabrion pinned_by names {repo}, which is not a pinned component")
        elif not tabrion_pins(manifests[repo], components):
            problems.append(f"{repo}: does not pin tabrion (versions.json pinned_by, RC-2)")
    for repo, content in requirements.items():
        ranged = [
            requirement
            for item in dependencies(tomllib.loads(manifests.get(repo, "")))
            if (requirement := _requirement(item)) is not None and component_of(requirement.name, components) == TABRION
        ]
        owner = f"{repo}@{str(components[repo]['commit'])[:12]}"
        if content is None:
            if ranged:
                problems.append(f"{owner}: requires tabrion but has no {TABRION_REQUIREMENTS} (VER-1)")
            continue
        found, commit = tabrion_requirements(owner, content, entry)
        problems += found
        if commit is not None:
            more, warned = check_tabrion_pin(owner, commit, read_tabrion(commit), entry, ranged)
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
    ranges: frozenset[str] = frozenset(),
    url_pins_allowed: bool = True,
) -> list[str]:
    """Problems of one pyproject; ``version_text`` is the content of a dynamic version's ``version_file``,
    ``ranges`` the components it requires by a version range (:func:`foundation_ranges`)."""
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
        problems += check_requirement(owner, item, components, str(project.get("name", "")), ranges, url_pins_allowed)
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
    problems += check_pyproject("nodestro-studio", studio, versions, versions["platform"], url_pins_allowed=False)
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
                foundation_ranges(repo, policy, components),
                COMPONENT_URL_PINS_ALLOWED,
            )
        for repo in libraries(policy, components):
            if SHA.match(components[repo]["commit"]):
                requirements[repo] = reader.optional(repo, components[repo]["commit"], TABRION_REQUIREMENTS)
        tabrion = components.get(TABRION, {})
        version_file = str(tabrion.get("version_file", "src/tabrion/_version.py"))
        more, warnings = check_tabrion(
            versions, manifests, policy, requirements, lambda commit: reader.any(TABRION, commit, version_file)
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

"""The installed platform is the one platform/versions.json pins: a consistency check of an installed environment.

``python -I scripts/lock_check.py [--profile studio|server] [--versions FILE] [--path DIR ...]`` checks the
environment of the interpreter that runs it (or the distributions in ``--path``), offline, and fails (exit 1) when

- a component the profile needs is not installed (studio: nodestro-api, -runtime, -examples, -integrations and
  orkexa; server: also axentra),
- an installed component (any component of versions.json, also one the profile does not need) was not installed
  from ``https://github.com/peterkarlhuber/<repo>.git`` at the pinned commit (its ``direct_url.json``: a missing file,
  an editable or local install, another URL or another commit). This detects an accidental install from an index; it
  is no proof of origin, since a wheel can ship a forged ``direct_url.json``. The proof that a pinned install never
  consults an index for a component is ``scripts/check_tabrion_source.py`` (DC-NS-2),
- an installed component's version is not the one versions.json gives,
- the studio (distribution ``nodestro``) is not installed at the platform version,
- an installed component or the studio declares another component at a commit other than the pinned one
  (``Requires-Dist``, every extra; ``pip check`` compares versions only and cannot see this),
- the studio profile contains a server-only component (axentra: the server extras leaked into it).

``--only NAME[,NAME...]`` checks just those components (each must be installed; origin, commit, version and what it
declares) and neither a profile nor the studio: the consumers' negative dependency-confusion tests use
``--only tabrion`` (TABRION DC-NS-1).

Stdlib only: it also runs in the image build after the environment's pip is gone, and in the desktop bundle, which
has no ``packaging``. Every problem is one line ``lock_check: FAIL ...``; the last line says GREEN or RED.
Used by the platform workflow (components job), nodestro-server's image/finalize.sh and nodestro-desktop's
scripts/build_backend.sh.
"""

from __future__ import annotations

import argparse
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from importlib import metadata
import json
from pathlib import Path
import re
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VERSIONS = ROOT / "platform" / "versions.json"
OWNER = "peterkarlhuber"
STUDIO = "nodestro"
#: Distributions whose name is not their repository's, and repositories whose package is in a subdirectory
#: (as in check_versions.py).
DISTRIBUTIONS = {"nodestro-sdk": "nodestro-client"}
SUBDIRECTORIES = {"nodestro-sdk": "python"}
#: Components every profile needs besides the studio's direct dependencies (``studio_dependency`` in versions.json):
#: orkexa, and the foundation tabrion, a base dependency of nodestro-runtime since TABRION MIG-NOD-3 (K-32, doc 06 N-1).
STUDIO_PROFILE_EXTRA = ("orkexa", "tabrion")
#: Components only the server profile contains (nodestro-runtime[postgres]); the studio profile must not.
SERVER_ONLY = ("axentra",)
PROFILES = ("studio", "server")
SHA = re.compile(r"^[0-9a-f]{40}$")
#: A requirement on one of the owner's repositories at a commit: ``name[extras] @ git+https://.../<repo>.git@<sha>``.
GIT_REQUIREMENT = re.compile(
    r"^\s*(?P<name>[A-Za-z0-9][A-Za-z0-9._-]*)\s*(?:\[[^\]]*\])?\s*@\s*git\+(?P<url>\S+?)@(?P<ref>[^\s#;@/]+)"
)


@dataclass(frozen=True)
class Installed:
    """What the check needs of one installed distribution."""

    version: str
    direct_url: dict[str, Any] | None
    requires: list[str] = field(default_factory=list)


def normalize(name: str) -> str:
    """A distribution name normalised as in PEP 503 (``Nodestro_API`` -> ``nodestro-api``)."""
    return re.sub(r"[-_.]+", "-", name).lower()


def canonical_url(repo: str) -> str:
    return f"https://github.com/{OWNER}/{repo}.git"


def same_url(found: str, expected: str) -> bool:
    """URLs compared without a trailing slash or ``.git`` (pip records the URL as the requirement spelled it)."""

    def strip(url: str) -> str:
        url = url.rstrip("/")
        return url[: -len(".git")] if url.endswith(".git") else url

    return strip(found) == strip(expected)


def distribution_name(repo: str) -> str:
    return normalize(DISTRIBUTIONS.get(repo, repo))


def required(components: Mapping[str, Any], profile: str) -> list[str]:
    """The components (repository names) a profile must contain."""
    names = [repo for repo, entry in components.items() if entry.get("studio_dependency")]
    names += [repo for repo in STUDIO_PROFILE_EXTRA if repo in components]
    if profile == "server":
        names += [repo for repo in SERVER_ONLY if repo in components]
    return sorted(set(names))


def check_source(repo: str, entry: Mapping[str, Any], found: Installed) -> list[str]:
    """Problems of an installed component's origin (direct_url.json) and version."""
    commit = str(entry["commit"])
    expected_url = canonical_url(repo)
    problems: list[str] = []
    direct = found.direct_url
    if not direct:
        problems.append(
            f"{repo} {found.version}: not installed from a pinned commit (no direct_url.json, e.g. from a package "
            f"index); versions.json pins {expected_url}@{commit[:12]}"
        )
    else:
        url = str(direct.get("url", ""))
        vcs = direct.get("vcs_info") or {}
        got = str(vcs.get("commit_id", ""))
        if direct.get("dir_info") is not None or vcs.get("vcs") != "git":
            kind = "editable" if (direct.get("dir_info") or {}).get("editable") else "local or archive"
            problems.append(
                f"{repo} {found.version}: {kind} install from {url}, versions.json pins {expected_url}@{commit[:12]}"
            )
        elif not same_url(url, expected_url):
            problems.append(f"{repo}: installed from {url}@{got[:12]}, versions.json pins {expected_url}@{commit[:12]}")
        elif got != commit:
            problems.append(f"{repo}: installed commit {got[:12] or '-'}, versions.json pins {commit[:12]}")
        elif direct.get("subdirectory") != SUBDIRECTORIES.get(repo):
            problems.append(
                f"{repo}: installed from subdirectory {direct.get('subdirectory')!r}, "
                f"expected {SUBDIRECTORIES.get(repo)!r}"
            )
    expected_version = entry.get("version")
    if expected_version is not None and found.version != str(expected_version):
        problems.append(f"{repo}: installed version {found.version}, versions.json says {expected_version}")
    return problems


def check_declared(owner: str, requires: Iterable[str], components: Mapping[str, Any]) -> list[str]:
    """Problems of the components a package declares (Requires-Dist, every extra) at another commit than the pin."""
    by_distribution = {distribution_name(repo): repo for repo in components}
    problems: list[str] = []
    for requirement in requires:
        found = GIT_REQUIREMENT.match(requirement)
        if not found:
            continue
        repo = by_distribution.get(normalize(found["name"]))
        if repo is None:
            continue
        commit = str(components[repo]["commit"])
        marker = requirement.split(";", 1)[1].strip() if ";" in requirement else "default"
        if SHA.match(commit) and found["ref"] != commit:  # an invalid pin is reported once, by check()
            problems.append(f"{owner} declares {repo}@{found['ref'][:12]} ({marker}), versions.json pins {commit[:12]}")
    return problems


def check(
    versions: Mapping[str, Any],
    installed: Mapping[str, Installed],
    profile: str,
    only: Sequence[str] | None = None,
) -> tuple[list[str], list[str]]:
    """``(ok lines, problems)`` of an environment (``installed``: normalised distribution name -> what is installed).

    With ``only`` (repository names), just those components are checked, each must be installed, and neither the
    profile nor the studio is.
    """
    if profile not in PROFILES:
        raise ValueError(f"unknown profile {profile!r} (one of {', '.join(PROFILES)})")
    components: Mapping[str, Any] = versions["components"]
    ok: list[str] = []
    problems: list[str] = []
    if only is not None:
        problems += [f"{repo}: not a component of versions.json" for repo in sorted(set(only) - set(components))]
        components = {repo: entry for repo, entry in components.items() if repo in only}
        needed = sorted(components)
    else:
        needed = required(components, profile)
    for repo, entry in sorted(components.items()):
        commit = str(entry.get("commit", ""))
        if not SHA.match(commit):
            problems.append(f"versions.json: {repo} is not pinned to a full commit ({commit!r})")
            continue
        found = installed.get(distribution_name(repo))
        if found is None:
            if repo in needed:
                scope = "--only" if only is not None else f"the {profile} profile"
                problems.append(f"{repo}: not installed, {scope} needs it at {commit[:12]}")
            continue
        found_problems = check_source(repo, entry, found) + check_declared(repo, found.requires, components)
        if only is None and profile != "server" and repo in SERVER_ONLY:
            found_problems.append(f"{repo} {found.version}: installed, but only the server profile contains it")
        problems += found_problems
        if not found_problems:
            ok.append(f"{repo} {found.version} @ {commit[:12]}")
    if only is not None:
        return ok, problems
    studio = installed.get(STUDIO)
    platform = str(versions.get("platform", ""))
    if studio is None:
        problems.append(f"{STUDIO}: the studio is not installed (platform {platform})")
    else:
        studio_problems = check_declared(STUDIO, studio.requires, components)
        if studio.version != platform:
            studio_problems.append(f"{STUDIO}: installed version {studio.version}, versions.json platform {platform}")
        problems += studio_problems
        if not studio_problems:
            ok.append(f"{STUDIO} {studio.version} (the studio)")
    return ok, problems


def read_installed(paths: list[str] | None = None) -> dict[str, Installed]:
    """The distributions of this interpreter (or of ``paths``); the first one on the path wins, as for imports."""
    found: dict[str, Installed] = {}
    distributions = metadata.distributions(path=paths) if paths is not None else metadata.distributions()
    for dist in distributions:
        name = dist.metadata["Name"]
        if not name or normalize(name) in found:
            continue
        text = dist.read_text("direct_url.json")
        try:
            direct = json.loads(text) if text else None
        except json.JSONDecodeError:
            direct = {"url": "(unreadable direct_url.json)"}
        found[normalize(name)] = Installed(dist.version, direct, list(dist.requires or []))
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--profile", choices=PROFILES, default="studio")
    parser.add_argument("--versions", type=Path, default=VERSIONS, help="default: platform/versions.json")
    parser.add_argument(
        "--path", action="append", help="read the distributions in this directory (repeatable) instead of sys.path"
    )
    parser.add_argument(
        "--only",
        action="append",
        metavar="NAME[,NAME...]",
        help="check only these components (each must be installed), not the profile or the studio",
    )
    args = parser.parse_args(argv)
    only = [name.strip() for value in args.only for name in value.split(",") if name.strip()] if args.only else None
    try:
        versions = json.loads(args.versions.read_text(encoding="utf-8"))
        if not isinstance(versions, dict) or not isinstance(versions.get("components"), dict):
            raise ValueError("no components")
    except (OSError, ValueError) as exc:
        print(f"lock_check: FAIL cannot read {args.versions}: {exc!r}")
        return 1
    ok, problems = check(versions, read_installed(args.path), args.profile, only)
    for line in ok:
        print(f"lock_check: ok   {line}")
    for line in problems:
        print(f"lock_check: FAIL {line}")
    verdict = "RED" if problems else "GREEN"
    scope = f"only {', '.join(only)}" if only is not None else f"{args.profile} profile"
    print(
        f"lock_check: {verdict} ({scope}, platform {versions.get('platform')}, {len(ok)} ok, "
        f"{len(problems)} problem(s) against {args.versions})"
    )
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

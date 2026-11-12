"""Moves the SHA pins of one repository of the platform cascade, and plans a whole cascade (CI-FAST AP8).

Every platform component is pinned by a full commit SHA in the repositories downstream of it. A change in an
upstream repository travels down this cascade, one pin PR per repository:

    orkexa, axentra -> nodestro-runtime -> nodestro-examples + nodestro-integrations -> nodestro-api
    -> nodestro-sdk (its test extra) -> nodestro-studio (pyproject.toml + platform/versions.json)
    -> nodestro-server + nodestro-desktop (studio.json) -> nodestro-local-docker (components.json)

``PINS`` lists, per repository, exactly the files and the names it pins (read from each repository's
pyproject.toml, versions.json, studio.json and components.json). Two subcommands:

- ``set DIR --set NAME=SHA`` (or ``--from-master NAME``, resolved with ``git ls-remote``) rewrites the pins of NAME
  in the checkout DIR, after verifying that SHA is on (an ancestor of, or equal to) NAME's master, and prints the
  diff. ``--check`` writes nothing and fails when a pin is not at SHA; ``--dry-run`` only prints the diff.
- ``plan NAME SHA`` prints the ordered stages of the cascade that a new commit of NAME starts, with the files and
  the pins each repository's PR changes.

Only the SHA in a pin is changed, never a version, an extra or a comment; run ``scripts/check_versions.py`` on the
result (versions.json versions are not touched).

The third-party packages follow the shared upload cutoff ``platform/uploaded-prior-to`` of the studio (see
``scripts/pip_cutoff.py`` and docs/PLATFORM.md, "Third-party packages"); this tool does not move it. Move it by hand
in the studio PR of every pin bundle (at the latest 7 days after the bundle), and immediately, after a green platform
pipeline, for a security-relevant third-party update.
"""

from __future__ import annotations

import argparse
from collections.abc import Callable, Sequence
import dataclasses
import difflib
import json
from pathlib import Path
import re
import subprocess
import sys

OWNER = "peterkarlhuber"
SHA = re.compile(r"^[0-9a-f]{40}$")


@dataclasses.dataclass(frozen=True)
class PinFile:
    """One file of a repository and the components it pins.

    ``kind``: ``pyproject`` (every ``github.com/<owner>/<name>.git@<sha>`` reference in the file), ``versions``
    (``components.<name>.commit`` of platform/versions.json) or ``json-key`` (the top-level ``"<name>": "<sha>"``)."""

    path: str
    kind: str
    names: tuple[str, ...]


PINS: dict[str, tuple[PinFile, ...]] = {
    "nodestro-runtime": (PinFile("pyproject.toml", "pyproject", ("orkexa", "axentra")),),
    "nodestro-examples": (PinFile("pyproject.toml", "pyproject", ("nodestro-runtime",)),),
    "nodestro-integrations": (PinFile("pyproject.toml", "pyproject", ("nodestro-runtime",)),),
    "nodestro-api": (PinFile("pyproject.toml", "pyproject", ("nodestro-runtime", "orkexa", "nodestro-examples")),),
    "nodestro-sdk": (PinFile("python/pyproject.toml", "pyproject", ("nodestro-api",)),),
    "nodestro-studio": (
        PinFile(
            "pyproject.toml",
            "pyproject",
            ("nodestro-api", "nodestro-runtime", "nodestro-examples", "nodestro-integrations"),
        ),
        PinFile(
            "platform/versions.json",
            "versions",
            (
                "axentra",
                "orkexa",
                "nodestro-runtime",
                "nodestro-examples",
                "nodestro-integrations",
                "nodestro-api",
                "nodestro-sdk",
            ),
        ),
    ),
    "nodestro-server": (PinFile("studio.json", "json-key", ("nodestro-studio",)),),
    "nodestro-desktop": (PinFile("studio.json", "json-key", ("nodestro-studio",)),),
    "nodestro-local-docker": (PinFile("components.json", "json-key", ("nodestro-studio", "nodestro-server")),),
}
#: Repositories that are not pinned anywhere downstream as a component but start cascades, and every pinned one.
REPOS = ("orkexa", "axentra", *PINS)
#: Pins that must always equal another repository's pin of the same name (checked by plan, kept by the PRs).
SAME_AS = {("nodestro-api", "orkexa"): "the orkexa commit that the pinned nodestro-runtime pins (MUP-ONA B0)"}

Runner = Callable[[Sequence[str]], str]


def run(cmd: Sequence[str]) -> str:
    return subprocess.run(list(cmd), check=True, capture_output=True, text=True).stdout


def canonical(name: str) -> str:
    """``runtime`` -> ``nodestro-runtime``; full names pass through."""
    if name in REPOS:
        return name
    if f"nodestro-{name}" in REPOS:
        return f"nodestro-{name}"
    raise SystemExit(f"unknown repository {name!r} (known: {', '.join(REPOS)})")


# ------------------------------------------------------------------------------------------------- rewriting


def pyproject_pattern(name: str) -> re.Pattern[str]:
    return re.compile(r"(github\.com/" + OWNER + "/" + re.escape(name) + r"\.git@)([0-9a-f]{40})\b")


def versions_pattern(name: str) -> re.Pattern[str]:
    # A component's object holds no nested object, so [^{}] stays inside it.
    return re.compile(r'("' + re.escape(name) + r'"\s*:\s*\{[^{}]*?"commit"\s*:\s*")([0-9a-f]{40})(")')


def json_key_pattern(name: str) -> re.Pattern[str]:
    return re.compile(r'("' + re.escape(name) + r'"\s*:\s*")([0-9a-f]{40})(")')


PATTERNS = {"pyproject": pyproject_pattern, "versions": versions_pattern, "json-key": json_key_pattern}


def current_pins(text: str, pin: PinFile) -> dict[str, list[str]]:
    """The SHAs each name of ``pin`` currently has in ``text`` (one entry per occurrence)."""
    return {name: [m.group(2) for m in PATTERNS[pin.kind](name).finditer(text)] for name in pin.names}


def rewrite(text: str, pin: PinFile, updates: dict[str, str]) -> tuple[str, list[str]]:
    """``text`` with every pin of the names in ``updates`` set to the new SHA, and the names it found."""
    found = []
    for name, sha in updates.items():
        if name not in pin.names:
            continue

        def replace(m: re.Match[str], sha: str = sha) -> str:
            return m.group(1) + sha + (m.group(3) if m.lastindex == 3 else "")

        text, count = PATTERNS[pin.kind](name).subn(replace, text)
        if count:
            found.append(name)
    return text, found


def json_leaves(value: object, prefix: str = "") -> dict[str, object]:
    if isinstance(value, dict):
        out: dict[str, object] = {}
        for k, v in value.items():
            out |= json_leaves(v, f"{prefix}/{k}")
        return out
    if isinstance(value, list):
        out = {}
        for i, v in enumerate(value):
            out |= json_leaves(v, f"{prefix}/{i}")
        return out
    return {prefix: value}


def check_json_change(path: str, old: str, new: str, pin: PinFile, updates: dict[str, str]) -> None:
    """A JSON rewrite may only change the intended leaves (guards the regular expressions)."""
    before, after = json_leaves(json.loads(old)), json_leaves(json.loads(new))
    allowed = {f"/components/{n}/commit" for n in updates} if pin.kind == "versions" else {f"/{n}" for n in updates}
    changed = {k for k in before.keys() | after.keys() if before.get(k) != after.get(k)}
    if changed - allowed:
        raise SystemExit(f"{path}: refusing a rewrite that changes {sorted(changed - allowed)}")


# ------------------------------------------------------------------------------------------------- verifying


def master_sha(name: str, runner: Runner = run) -> str:
    out = runner(["git", "ls-remote", f"https://github.com/{OWNER}/{name}.git", "refs/heads/master"])
    sha = out.split()[0] if out.split() else ""
    if not SHA.match(sha):
        raise SystemExit(f"{name}: could not resolve master ({out.strip()!r})")
    return sha


def on_master(name: str, sha: str, runner: Runner = run, git_cache: Path | None = None) -> bool:
    """Whether ``sha`` is master of ``name`` or one of its ancestors: the GitHub compare API (``ahead`` or
    ``identical``), or with ``git_cache`` a fetched clone and ``git merge-base --is-ancestor``."""
    if git_cache is None:
        try:
            status = runner(["gh", "api", f"repos/{OWNER}/{name}/compare/{sha}...master", "--jq", ".status"]).strip()
        except subprocess.CalledProcessError:
            return False  # an unknown commit (404) is not on master either
        return status in ("ahead", "identical")
    clone = git_cache / f"{name}.git"
    if not clone.exists():
        runner(
            [
                "git",
                "clone",
                "--quiet",
                "--bare",
                "--filter=blob:none",
                f"https://github.com/{OWNER}/{name}.git",
                str(clone),
            ]
        )
    runner(["git", "-C", str(clone), "fetch", "--quiet", "origin", "+refs/heads/master:refs/heads/master"])
    try:
        runner(["git", "-C", str(clone), "merge-base", "--is-ancestor", sha, "refs/heads/master"])
    except subprocess.CalledProcessError:
        return False
    return True


def repo_of(directory: Path, runner: Runner = run) -> str:
    """The repository a checkout belongs to: its origin URL, else its directory name."""
    try:
        url = runner(["git", "-C", str(directory), "remote", "get-url", "origin"]).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        url = ""
    found = re.search(r"[/:]" + OWNER + r"/([\w.-]+?)(?:\.git)?$", url)
    name = found.group(1) if found else directory.resolve().name
    if name not in PINS:
        raise SystemExit(f"{directory}: {name!r} pins nothing (pass --repo; known: {', '.join(PINS)})")
    return name


# ------------------------------------------------------------------------------------------------------ set


def parse_set(items: list[str]) -> dict[str, str]:
    out = {}
    for item in items:
        name, _, sha = item.partition("=")
        if not SHA.match(sha):
            raise SystemExit(f"--set {item}: the SHA must be a full 40-character lowercase commit")
        out[canonical(name)] = sha
    return out


def bump(
    directory: Path,
    repo: str,
    updates: dict[str, str],
    *,
    write: bool,
) -> tuple[list[str], bool]:
    """Rewrites (when ``write``) the pins of ``updates`` in ``directory``; returns the diff lines and whether any
    pin differed from its target."""
    pinned = {n for pin in PINS[repo] for n in pin.names}
    unknown = sorted(set(updates) - pinned)
    if unknown:
        raise SystemExit(f"{repo} does not pin {', '.join(unknown)} (it pins {', '.join(sorted(pinned))})")
    diff: list[str] = []
    seen: set[str] = set()
    for pin in PINS[repo]:
        path = directory / pin.path
        old = path.read_text(encoding="utf-8")
        new, found = rewrite(old, pin, updates)
        seen |= set(found)
        if pin.kind != "pyproject":
            check_json_change(pin.path, old, new, pin, {n: s for n, s in updates.items() if n in pin.names})
        if new != old:
            diff += difflib.unified_diff(
                old.splitlines(keepends=True), new.splitlines(keepends=True), f"a/{pin.path}", f"b/{pin.path}"
            )
            if write:
                path.write_text(new, encoding="utf-8")
    missing = sorted(set(updates) - seen)
    if missing:
        raise SystemExit(f"{repo}: no pin of {', '.join(missing)} found in {', '.join(p.path for p in PINS[repo])}")
    return diff, bool(diff)


def cmd_set(args: argparse.Namespace, runner: Runner = run) -> int:
    repo = canonical(args.repo) if args.repo else repo_of(args.dir, runner)
    updates = parse_set(args.set or [])
    for name in args.from_master or []:
        name = canonical(name)
        updates[name] = master_sha(name, runner)
    if not updates:
        raise SystemExit("nothing to set: pass --set NAME=SHA or --from-master NAME")
    if not args.no_verify:
        for name, sha in updates.items():
            if not on_master(name, sha, runner, args.git_cache):
                raise SystemExit(f"{name}@{sha[:12]} is not on {name}'s master (not an ancestor of or equal to it)")
    diff, changed = bump(args.dir, repo, updates, write=not (args.check or args.dry_run))
    sys.stdout.writelines(diff)
    targets = ", ".join(f"{n}@{s[:12]}" for n, s in updates.items())
    if args.check:
        print(f"{repo}: {'pins differ from' if changed else 'pins are at'} {targets}")
        return 1 if changed else 0
    verb = "would set" if args.dry_run else "set"
    print(f"{repo}: {verb} {targets}" if changed else f"{repo}: already at {targets}")
    return 0


def cmd_pins(args: argparse.Namespace, runner: Runner = run) -> int:
    repo = canonical(args.repo) if args.repo else repo_of(args.dir, runner)
    for pin in PINS[repo]:
        text = (args.dir / pin.path).read_text(encoding="utf-8")
        for name, shas in current_pins(text, pin).items():
            print(f"{pin.path}: {name} {' '.join(sorted(set(shas))) or '(none)'}")
    return 0


# ----------------------------------------------------------------------------------------------------- plan


def dependents() -> dict[str, set[str]]:
    out: dict[str, set[str]] = {r: set() for r in REPOS}
    for repo, pins in PINS.items():
        for pin in pins:
            for name in pin.names:
                out[name].add(repo)
    return out


def plan(upstream: str, sha: str) -> list[list[tuple[str, list[tuple[str, list[str]]]]]]:
    """Stages of the cascade a new commit of ``upstream`` starts. Each stage is a list of
    ``(repo, [(file, [pins])])``; a repository is in the stage after the last of its affected upstreams."""
    deps = dependents()
    affected: set[str] = set()
    todo = [upstream]
    while todo:
        for d in deps[todo.pop()]:
            if d not in affected:
                affected.add(d)
                todo.append(d)
    level: dict[str, int] = {upstream: 0}

    def depth(repo: str) -> int:
        if repo not in level:
            ups = {n for pin in PINS[repo] for n in pin.names} & (affected | {upstream})
            level[repo] = 1 + max(depth(u) for u in ups)
        return level[repo]

    stages: dict[int, list[tuple[str, list[tuple[str, list[str]]]]]] = {}
    for repo in sorted(affected, key=lambda r: (depth(r), REPOS.index(r))):
        files = []
        for pin in PINS[repo]:
            moved = [n for n in pin.names if n in affected | {upstream}]
            if moved:
                files.append(
                    (pin.path, [f"{n}={sha if n == upstream else '<merge SHA of ' + n + ' pin PR>'}" for n in moved])
                )
        stages.setdefault(depth(repo), []).append((repo, files))
    return [stages[k] for k in sorted(stages)]


def cmd_plan(args: argparse.Namespace) -> int:
    upstream = canonical(args.upstream)
    if not SHA.match(args.sha):
        raise SystemExit("the SHA must be a full 40-character lowercase commit")
    stages = plan(upstream, args.sha)
    if not stages:
        print(f"nothing pins {upstream}")
        return 0
    print(f"Cascade for {upstream}@{args.sha[:12]} ({len(stages)} stages; the repositories of a stage run in parallel)")
    for i, stage in enumerate(stages, 1):
        print(f"\nStage {i}:")
        for repo, files in stage:
            print(f"  {repo}")
            for path, pins in files:
                print(f"    {path}: {', '.join(pins)}")
                for name in pins:
                    note = SAME_AS.get((repo, name.split("=")[0]))
                    if note:
                        print(f"      note: must stay {note}")
    return 0


# ----------------------------------------------------------------------------------------------------- main


def main(argv: list[str] | None = None, runner: Runner = run) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("set", help="rewrite the pins of one checkout")
    p.add_argument("dir", type=Path, help="a local checkout of the repository whose pins move")
    p.add_argument("--repo", help="the repository of DIR (default: its origin URL or directory name)")
    p.add_argument("--set", action="append", metavar="NAME=SHA", help="pin NAME to SHA (repeatable)")
    p.add_argument("--from-master", action="append", metavar="NAME", help="pin NAME to its current master")
    p.add_argument("--check", action="store_true", help="write nothing; fail when a pin is not at its target")
    p.add_argument("--dry-run", action="store_true", help="print the diff, write nothing")
    p.add_argument("--no-verify", action="store_true", help="skip the is-on-master check")
    p.add_argument("--git-cache", type=Path, help="verify with bare clones here instead of the compare API")
    p = sub.add_parser("pins", help="print the current pins of one checkout")
    p.add_argument("dir", type=Path)
    p.add_argument("--repo")
    p = sub.add_parser("plan", help="print the ordered cascade for a new upstream commit")
    p.add_argument("upstream")
    p.add_argument("sha")
    args = parser.parse_args(argv)
    if args.command == "set":
        return cmd_set(args, runner)
    if args.command == "pins":
        return cmd_pins(args, runner)
    return cmd_plan(args)


if __name__ == "__main__":
    sys.exit(main())

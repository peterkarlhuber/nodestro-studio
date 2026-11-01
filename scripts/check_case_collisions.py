"""File names that clash on a case-insensitive file system (default macOS and Windows), checked on ``git ls-files``.

Two kinds of clashes break a checkout or a build there:

- paths that differ only in case (``Docs/a.md`` and ``docs/a.md``): only one of them can exist on disk;
- module names that differ only in case within one directory (``TestStatus.tsx`` and ``testStatus.ts``):
  both files exist, but an import of ``./TestStatus`` resolves to ``testStatus.ts`` first, and TypeScript
  fails with TS1149 and TS2305. Directories count as modules too (``./foo`` can mean ``foo/index.ts``).

Usage: ``python scripts/check_case_collisions.py [ROOT]`` (default: the repository this script is in).
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from pathlib import Path, PurePosixPath
import subprocess
import sys

#: Extensions an import may leave out (TypeScript and JavaScript resolution, Python modules).
MODULE_SUFFIXES = (".d.ts", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".py")


def module_name(name: str) -> str:
    for suffix in MODULE_SUFFIXES:
        if name.endswith(suffix) and len(name) > len(suffix):
            return name[: -len(suffix)]
    return name


def collisions(paths: Iterable[str]) -> list[str]:
    """Describe every clash among the given repository paths (POSIX separators), sorted."""
    by_path: dict[str, set[str]] = defaultdict(set)
    by_module: dict[tuple[str, str], set[str]] = defaultdict(set)
    for path in paths:
        parts = PurePosixPath(path).parts
        for depth in range(1, len(parts) + 1):
            prefix = "/".join(parts[:depth])
            by_path[prefix.lower()].add(prefix)
            parent, name = "/".join(parts[: depth - 1]), parts[depth - 1]
            # A directory is a module under its own name; a file under its name without the extension.
            entry = name if depth < len(parts) else module_name(name)
            by_module[(parent.lower(), entry.lower())].add(prefix if depth < len(parts) else path)
    found: set[str] = set()
    for names in by_path.values():
        if len(names) > 1:
            found.add("paths differ only in case: " + ", ".join(sorted(names)))
    for names in by_module.values():
        stems = {module_name(PurePosixPath(name).name) for name in names}
        # Foo.ts next to Foo.tsx is no case clash; Docs/ next to docs/ is already reported as a path clash.
        if len(stems) > 1 and len({name.lower() for name in names}) > 1:
            found.add("module names differ only in case: " + ", ".join(sorted(names)))
    return sorted(found)


def tracked_files(root: Path) -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=root, check=True, capture_output=True).stdout
    return [name for name in out.decode("utf-8").split("\0") if name]


def main(argv: list[str]) -> int:
    root = Path(argv[1]) if len(argv) > 1 else Path(__file__).resolve().parents[1]
    found = collisions(tracked_files(root))
    for line in found:
        print(f"error: {line}", file=sys.stderr)
    if found:
        print(
            f"{len(found)} case clash(es): rename the files so they also differ on macOS and Windows.", file=sys.stderr
        )
        return 1
    print("no case clashes")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

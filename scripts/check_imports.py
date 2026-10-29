"""The platform's dependency direction, checked on the installed packages (``make check-imports``).

runtime <- examples, integrations <- api <- studio; the SDK talks HTTP only. No package may import
one that sits above it, and nothing may use claude-agent (Nodestro runs on orkexa).
"""

from __future__ import annotations

import ast
from importlib import metadata, util
from pathlib import Path
import sys

#: Which Nodestro packages each package may import (orkexa only through the runtime, see below).
ALLOWED: dict[str, set[str]] = {
    "nodestro_runtime": set(),
    "nodestro_examples": {"nodestro_runtime"},
    "nodestro_integrations": {"nodestro_runtime"},
    "nodestro_api": {"nodestro_runtime", "nodestro_examples"},
    "nodestro_studio": {"nodestro_runtime", "nodestro_api", "nodestro_examples", "nodestro_integrations"},
    "nodestro_client": set(),
}
#: The packages that build orkexa agents themselves: the runtime (workflows) and the API (assistants,
#: architect, export); both use the orkexa the runtime pins. Examples, integrations and the studio
#: never talk to orkexa directly.
ORKEXA_USERS = {"nodestro_runtime", "nodestro_api"}
FORBIDDEN = {"claude_agent", "nodestro"}  # the old library and the 0.1 package name
DISTRIBUTIONS = ["nodestro", "nodestro-api", "nodestro-runtime", "nodestro-examples", "nodestro-integrations"]


def imports(path: Path) -> set[str]:
    found: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"), str(path))):
        if isinstance(node, ast.Import):
            found.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            found.add(node.module.split(".")[0])
    return found


def main() -> int:
    problems: list[str] = []
    checked = 0
    for package, allowed in ALLOWED.items():
        spec = util.find_spec(package)
        if spec is None or not spec.submodule_search_locations:
            if package != "nodestro_client":
                problems.append(f"{package} is not installed")
            continue
        root = Path(next(iter(spec.submodule_search_locations)))
        for path in sorted(root.rglob("*.py")):
            checked += 1
            for name in imports(path):
                where = f"{package}/{path.relative_to(root)}"
                if name in ALLOWED and name != package and name not in allowed:
                    problems.append(f"{where} imports {name}")
                if name in FORBIDDEN:
                    problems.append(f"{where} imports {name}")
                if name == "orkexa" and package not in ORKEXA_USERS:
                    problems.append(f"{where} imports orkexa (only the runtime and the API may)")
    if util.find_spec("claude_agent") is not None:
        problems.append("claude_agent is installed")
    for distribution in DISTRIBUTIONS:
        try:
            requires = metadata.requires(distribution) or []
        except metadata.PackageNotFoundError:
            continue
        problems += [f"{distribution} requires {item}" for item in requires if "claude-agent" in item.lower()]
    for problem in problems:
        print(f"::error::{problem}")
    print(f"{checked} modules checked, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

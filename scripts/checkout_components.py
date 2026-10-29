"""Check out components at the commits of platform/versions.json (the platform pipeline runs their tests).

Usage: python scripts/checkout_components.py DIR [NAME ...]   (default: every Nodestro component)
"""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ["nodestro-runtime", "nodestro-examples", "nodestro-integrations", "nodestro-api", "nodestro-sdk"]


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    target = Path(argv[0])
    names = argv[1:] or DEFAULT
    components = json.loads((ROOT / "platform" / "versions.json").read_text(encoding="utf-8"))["components"]
    target.mkdir(parents=True, exist_ok=True)
    for name in names:
        commit = components[name]["commit"]
        checkout = target / name
        if not checkout.exists():
            url = f"https://github.com/peterkarlhuber/{name}.git"
            subprocess.run(["git", "clone", "--quiet", "--filter=blob:none", url, str(checkout)], check=True)
        checkout_command = ["git", "-c", "advice.detachedHead=false", "checkout", "--quiet", commit]
        subprocess.run(checkout_command, cwd=checkout, check=True)
        print(f"{name} @ {commit}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

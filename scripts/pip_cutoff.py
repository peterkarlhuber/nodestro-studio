"""The shared upload cutoff of the third-party packages: prints it for ``pip install --uploaded-prior-to``.

``platform/uploaded-prior-to`` holds one UTC timestamp (``2026-11-12T00:00:00Z``). Every install path of the
platform passes it to pip as ``--uploaded-prior-to``: the studio's platform workflow, the server image build
(nodestro-server image/Dockerfile and image/install.py) and the desktop backend build (nodestro-desktop
scripts/build_backend.sh). pip then installs, for every package without a pin, the newest release uploaded before
the cutoff, so the tested set is the shipped set and a rebuild of the same commits installs the same packages. The
components themselves are pinned by commit and not affected.

``cutoff=$(python -I scripts/pip_cutoff.py)`` runs with the interpreter whose pip installs and fails (exit 1, one
line ``pip_cutoff: FAIL ...`` on stderr, nothing on stdout) when

- the file is missing or is not exactly one timestamp ``YYYY-MM-DDTHH:MM:SSZ``,
- the cutoff lies in the future (it would not be reproducible),
- this interpreter's pip is missing or older than 26.0, the first pip with ``--uploaded-prior-to``. Older pip would
  reject the option; an environment variable instead of the option would be ignored silently, so the paths never use
  ``PIP_UPLOADED_PRIOR_TO``.

Moving the cutoff (docs/PLATFORM.md, "Third-party packages"): together with every pin bundle (at the latest 7 days
after it) and, for a security-relevant third-party update, immediately after a successful check of the new set.
Stdlib only.
"""

from __future__ import annotations

import argparse
from datetime import UTC, datetime
from importlib import metadata
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CUTOFF_FILE = ROOT / "platform" / "uploaded-prior-to"
CUTOFF = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
#: The first pip with --uploaded-prior-to (and that passes it on to the isolated build environments).
MINIMUM_PIP = (26, 0)


class CutoffError(Exception):
    """The cutoff cannot be used; the message is one line."""


def read_cutoff(path: Path, now: datetime | None = None) -> str:
    """The cutoff of ``path``, checked: one UTC timestamp, not in the future."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise CutoffError(f"cannot read {path}: {exc.strerror or exc}") from exc
    value = text.strip()
    if not CUTOFF.match(value) or text.count("\n") > 1:
        raise CutoffError(f"{path} must hold exactly one UTC timestamp YYYY-MM-DDTHH:MM:SSZ, not {text!r}")
    try:
        moment = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
    except ValueError as exc:
        raise CutoffError(f"{path}: {value} is not a valid time ({exc})") from exc
    if moment > (now or datetime.now(UTC)):
        raise CutoffError(f"{path}: the cutoff {value} lies in the future")
    return value


def pip_version() -> str | None:
    """The version of the pip that this interpreter imports, or None."""
    try:
        return metadata.version("pip")
    except metadata.PackageNotFoundError:
        return None


def check_pip(version: str | None) -> None:
    if version is None:
        raise CutoffError(f"{sys.executable} has no pip; the cutoff needs pip >= 26.0")
    found = re.match(r"^(\d+)\.(\d+)", version)
    if not found or (int(found[1]), int(found[2])) < MINIMUM_PIP:
        raise CutoffError(
            f"pip {version} of {sys.executable} has no --uploaded-prior-to; pip >= 26.0 is needed "
            "(install an exact pip, e.g. pip==26.2.2, in this path first)"
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--file", type=Path, default=CUTOFF_FILE, help="default: platform/uploaded-prior-to")
    args = parser.parse_args(argv)
    try:
        cutoff = read_cutoff(args.file)
        check_pip(pip_version())
    except CutoffError as exc:
        print(f"pip_cutoff: FAIL {exc}", file=sys.stderr)
        return 1
    print(f"pip_cutoff: third-party packages uploaded before {cutoff} (pip {pip_version()})", file=sys.stderr)
    print(cutoff)
    return 0


if __name__ == "__main__":
    sys.exit(main())

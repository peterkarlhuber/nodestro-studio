#!/bin/bash
# The Docker sandbox test in one command (macOS with Docker Desktop, both Apple silicon and Intel; Linux works too).
#
#   git clone https://github.com/peterkarlhuber/nodestro-studio.git && cd nodestro-studio
#   git checkout <commit>
#   bash scripts/mac_docker_test.sh            # options: see python3 scripts/docker_test.py --help
#
# It only finds a Python 3.11 or newer and runs scripts/docker_test.py with it, which does the rest (checks Docker,
# installs the studio of this checkout into its own environment, runs the test, writes the report, cleans up).
# If this computer has no Python 3.11+, uv (a pinned version from PyPI) is installed into the work folder and fetches
# Python 3.13 there; nothing is installed system-wide. Nothing is downloaded and run from an unpinned address.
# Written for the bash 3.2 that macOS ships.
set -euo pipefail

UV_VERSION="0.9.5"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work="${NODESTRO_TEST_WORK:-$HOME/nodestro-docker-test}"
# A --work option given to the test also decides where the bootstrap goes.
previous=""
for argument in "$@"; do
  if [ "$previous" = "--work" ]; then work="$argument"; fi
  case "$argument" in --work=*) work="${argument#--work=}" ;; esac
  previous="$argument"
done

# The test deletes folders inside its work folder (run, venv, cache), so it uses only an empty folder or one it made
# itself (the marker file), never an arbitrary folder such as the home folder.
if [ -d "$work" ] && [ ! -e "$work/.nodestro-docker-test" ] && [ -n "$(ls -A "$work" 2>/dev/null)" ]; then
  echo "The work folder $work is not empty and was not made by this test; choose another one with --work." >&2
  exit 2
fi
mkdir -p "$work"
touch "$work/.nodestro-docker-test"

good_python() {
  "$1" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' >/dev/null 2>&1
}

python=""
for candidate in python3.13 python3.12 python3.14 python3.11 python3 \
  /opt/homebrew/bin/python3 /usr/local/bin/python3 \
  /Library/Frameworks/Python.framework/Versions/3.13/bin/python3 \
  /Library/Frameworks/Python.framework/Versions/3.12/bin/python3; do
  if command -v "$candidate" >/dev/null 2>&1 && good_python "$candidate"; then
    python="$(command -v "$candidate")"
    break
  fi
done

if [ -z "$python" ] && command -v uv >/dev/null 2>&1; then
  echo "No Python 3.11+ found; asking uv for Python 3.13 ..."
  python="$(UV_PYTHON_INSTALL_DIR="$work/python" uv python find 3.13 2>/dev/null || true)"
  if [ -z "$python" ]; then
    UV_PYTHON_INSTALL_DIR="$work/python" uv python install 3.13
    python="$(UV_PYTHON_INSTALL_DIR="$work/python" uv python find 3.13)"
  fi
fi

if [ -z "$python" ]; then
  if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import venv' >/dev/null 2>&1; then
    echo "No Python found. Install Python 3.13 from https://www.python.org/downloads/ and run this command again." >&2
    exit 2
  fi
  echo "No Python 3.11+ found (python3 is $(python3 -c 'import platform; print(platform.python_version())'))."
  echo "Fetching Python 3.13 with uv $UV_VERSION into $work (only there; nothing system-wide) ..."
  mkdir -p "$work"
  python3 -m venv "$work/bootstrap"
  "$work/bootstrap/bin/python" -m pip install --quiet --disable-pip-version-check "uv==$UV_VERSION"
  UV_PYTHON_INSTALL_DIR="$work/python" "$work/bootstrap/bin/uv" python install 3.13
  python="$(UV_PYTHON_INSTALL_DIR="$work/python" "$work/bootstrap/bin/uv" python find 3.13)"
fi

echo "Using Python $("$python" -c 'import platform; print(platform.python_version())') ($python)"
exec "$python" "$here/docker_test.py" "$@"

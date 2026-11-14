"""Nodestro whose database other users may change, behind a stand-in for the desktop shell (TABRION MIG-NOD-9).

Usage: python tests/e2e_recovery_server.py --data-dir DIR [--port 9620] [--launch-secret SECRET]

The data directory gets a real desktop database whose mode is ``0664`` (group-writable): the runtime refuses it, so
the studio starts in recovery mode and offers only the confirmed repair. This script then does what the desktop shell
does with the backend's exit codes: after a repair (75) it starts the regular studio again, after the diagnosis'
restart (76) it starts it with ``NODESTRO_RECOVERY=database-permissions``. Before the regular studio starts the first
time after a repair, the database is made world-readable again (``0644``: it opens, but is not private), so that the
browser test can take the diagnosis' way into the repair as well; the shell would never do that. With
``--launch-secret`` the backend requires the desktop app's launch session (``/api/launch?token=``), as the repair does;
the secret stays the same across restarts, as the shell's handoff does, but every restart ends the sessions.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient
from nodestro_api import cli, recovery

from nodestro_studio.app import create_app, studio_config


def _database(data_dir: Path) -> Path:
    """A real desktop database, created by the studio itself (its workspace is closed again)."""
    with TestClient(create_app(studio_config(data_dir), scheduler=False)):
        pass
    return data_dir / "nodestro.db"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--port", type=int, default=9620)
    parser.add_argument("--launch-secret", default=None)
    args = parser.parse_args()
    data_dir = Path(args.data_dir).resolve()
    if args.launch_secret:  # read once per process (and kept): before the first app is built
        os.environ["NODESTRO_LAUNCH_SECRET"] = args.launch_secret
    database = _database(data_dir)
    os.chmod(database, 0o664)
    os.environ["NODESTRO_DATA_DIR"] = str(data_dir)
    # The stand-in shell restarts the backend, as the desktop app does (it hands over its secrets; this test has none).
    recovery.shell_restarts = lambda: True
    serve_args = argparse.Namespace(host="127.0.0.1", port=args.port, reload=False)
    loosened = False
    while True:
        try:
            cli.serve(
                "nodestro_studio.app:create_app",
                serve_args,
                ready=lambda: print(f"e2e recovery server on {args.port}", flush=True),
            )
            return
        except SystemExit as stopped:
            if stopped.code == recovery.RESTART_EXIT_CODE:
                os.environ.pop(recovery.RECOVERY_ENV, None)
                if not loosened:
                    os.chmod(database, 0o644)
                    loosened = True
            elif stopped.code == recovery.RECOVERY_EXIT_CODE:
                os.environ[recovery.RECOVERY_ENV] = recovery.RECOVERY_VALUE
            else:
                raise
        print(f"e2e recovery server restarts ({os.environ.get(recovery.RECOVERY_ENV, 'regular')})", file=sys.stderr)


if __name__ == "__main__":
    main()

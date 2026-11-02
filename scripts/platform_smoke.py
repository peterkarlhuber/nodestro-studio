"""Start the studio as a desktop user would and check that API, interface and sandbox report work.

Used by the ``Platforms`` workflow on macOS and Windows (and Linux): ``python scripts/platform_smoke.py``. It starts
``python -m nodestro_studio --no-browser`` on a free port with a fresh data directory, waits for ``/api/health``,
reads ``/api/settings`` and the interface's ``index.html``, and stops the server. On systems without the built-in
sandbox the settings must say so (reason ``platform``) instead of the start failing.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request


def _free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


def _get(url: str) -> tuple[int, bytes]:
    request = urllib.request.Request(url, headers={"Host": url.split("/")[2]})
    with urllib.request.urlopen(request, timeout=10) as response:
        return int(response.status), response.read()


def main() -> int:
    port = _free_port()
    base = f"http://127.0.0.1:{port}"
    with tempfile.TemporaryDirectory(prefix="nodestro-smoke-") as directory:
        env = {**os.environ, "PYTHONUTF8": "1"}
        env.pop("NODESTRO_PROFILE", None)
        log = Path(directory) / "server.log"
        with log.open("wb") as output:
            server = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "nodestro_studio",
                    "--no-browser",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(port),
                    "--data-dir",
                    str(Path(directory) / "data"),
                ],
                stdout=output,
                stderr=subprocess.STDOUT,
                env=env,
            )
            try:
                deadline = time.monotonic() + 180
                while True:
                    if server.poll() is not None:
                        raise SystemExit(
                            f"the server exited with {server.returncode}:\n{log.read_text('utf-8', 'replace')}"
                        )
                    try:
                        status, _ = _get(f"{base}/api/health")
                        if status == 200:
                            break
                    except (urllib.error.URLError, ConnectionError, TimeoutError):
                        pass
                    if time.monotonic() > deadline:
                        raise SystemExit(f"no answer on {base}/api/health:\n{log.read_text('utf-8', 'replace')}")
                    time.sleep(1)
                _, body = _get(f"{base}/api/settings")
                settings = json.loads(body)
                builtin = settings["builtin_sandbox"]
                print("sandbox setting:", settings["sandbox"], "| docker:", settings["docker_available"])
                print("built-in sandbox:", json.dumps(builtin))
                for key in ("sandbox_selection", "sandbox_backends"):
                    if key in settings:
                        print(f"{key}:", json.dumps(settings[key], indent=1))
                if not sys.platform.startswith("linux"):
                    assert builtin["available"] is False, builtin
                selection = settings.get("sandbox_selection")
                if selection is not None:
                    expected_os = {"darwin": "macos", "win32": "windows"}.get(sys.platform, "linux")
                    assert selection["os"] == expected_os, selection
                    # Never an unsafe fallback: AI-generated code runs isolated or not at all.
                    assert selection["untrusted"] in ("", "docker", "linux-builtin"), selection
                    assert selection["blocked"] == (selection["untrusted"] == ""), selection
                    if not sys.platform.startswith("linux"):
                        assert selection["untrusted"] in ("", "docker"), selection
                    for backend in settings.get("sandbox_backends") or []:
                        if backend["name"] in ("macos-seatbelt", "windows-native", "subprocess"):
                            assert backend["state"] != "approved", backend
                status, page = _get(f"{base}/")
                assert status == 200 and b"<html" in page.lower(), page[:200]
                print("interface served:", len(page), "bytes")
            finally:
                server.terminate()
                try:
                    server.wait(30)
                except subprocess.TimeoutExpired:
                    server.kill()
    print("platform smoke test passed on", sys.platform)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

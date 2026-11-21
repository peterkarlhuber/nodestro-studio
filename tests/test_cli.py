"""The ``nodestro`` command keeps the options and defaults of Nodestro 0.1."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import pytest

from nodestro_studio import cli


def test_the_options_of_0_1(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    served: list[tuple[str, argparse.Namespace]] = []
    opened: list[Any] = []
    monkeypatch.setattr(cli, "serve", lambda factory, args, ready=None: served.append((factory, args)))
    monkeypatch.setattr(cli.webbrowser, "open", opened.append)
    monkeypatch.delenv("NODESTRO_DATA_DIR", raising=False)
    monkeypatch.chdir(tmp_path)
    cli.main(["--host", "0.0.0.0", "--port", "8123", "--data-dir", str(tmp_path / "d"), "--no-browser", "--reload"])
    factory, args = served[0]
    assert factory == "nodestro_studio.app:create_app"
    assert (args.host, args.port, args.reload, args.no_browser) == ("0.0.0.0", 8123, True, True)
    assert os.environ["NODESTRO_DATA_DIR"] == str((tmp_path / "d").resolve())
    assert opened == []


def test_the_default_data_directory_is_home_nodestro(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    from nodestro_api.context import AppConfig

    monkeypatch.delenv("NODESTRO_DATA_DIR", raising=False)
    monkeypatch.setenv("HOME", str(tmp_path))
    assert AppConfig.from_env().data_dir == tmp_path / ".nodestro"


def test_help_lists_every_option(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit):
        cli.main(["--help"])
    shown = capsys.readouterr().out
    for option in ("--host", "--port", "--data-dir", "--profile", "--no-browser", "--reload"):
        assert option in shown


@pytest.mark.parametrize(
    ("argv", "reason"),
    [(["--host", "0.0.0.0"], "no login"), (["--profile", "server"], "server profile")],
    ids=["network", "server"],
)
def test_the_studio_is_not_started_on_the_network_or_as_a_server(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, argv: list[str], reason: str
) -> None:
    """Accepted as options since 0.1, refused at start since nodestro-api b794ebe (no login yet)."""
    import uvicorn

    started: list[Any] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: started.append(args))
    monkeypatch.setenv("NODESTRO_HOST", "127.0.0.1")
    monkeypatch.setenv("NODESTRO_DATA_DIR", "")
    monkeypatch.setenv("NODESTRO_PROFILE", "")
    monkeypatch.chdir(tmp_path)
    with pytest.raises(SystemExit, match=reason):
        cli.main(["--data-dir", str(tmp_path / "d"), "--no-browser", *argv])
    assert started == []


def test_a_taken_port_stops_before_running_and_the_browser(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """DX handover B2: with the port taken nothing says "running" and no browser opens the other program."""
    import socket

    import uvicorn

    served: list[Any] = []
    opened: list[Any] = []
    monkeypatch.setattr(uvicorn.Server, "run", lambda self, *args, **kwargs: served.append(args))
    monkeypatch.setattr(cli.webbrowser, "open", opened.append)
    monkeypatch.setenv("NODESTRO_DATA_DIR", str(tmp_path / "d"))
    monkeypatch.setenv("NODESTRO_PROFILE", "")
    monkeypatch.setenv("NODESTRO_HOST", "127.0.0.1")  # the command line writes it; an earlier test may leave another
    monkeypatch.chdir(tmp_path)
    with socket.socket() as taken:
        taken.bind(("127.0.0.1", 0))
        taken.listen()
        with pytest.raises(SystemExit) as stopped:
            cli.main(["--port", str(taken.getsockname()[1])])
    assert stopped.value.code == 2
    shown = capsys.readouterr()
    assert "running" not in shown.out and "already in use" in shown.err
    assert served == [] and opened == []


def test_running_and_the_browser_wait_for_the_server(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    import threading

    calls: list[Any] = []
    opened = threading.Event()
    monkeypatch.setattr(cli, "serve", lambda factory, args, ready=None: calls.append(ready))
    monkeypatch.setattr(cli.webbrowser, "open", lambda url: opened.set())
    monkeypatch.setenv("NODESTRO_DATA_DIR", str(tmp_path / "d"))
    monkeypatch.chdir(tmp_path)
    cli.main(["--port", "0"])
    assert "running" not in capsys.readouterr().out and not opened.is_set()
    calls[0]()  # the server listens now
    assert "Nodestro is running at" in capsys.readouterr().out
    assert opened.wait(5)


class _Now:
    """``threading.Thread`` that runs its target at ``start()`` (the browser is opened in a thread)."""

    def __init__(self, target: Any, args: tuple[Any, ...] = (), **_: Any) -> None:
        self.target, self.args = target, args

    def start(self) -> None:
        self.target(*self.args)


def _ready(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, *argv: str, **env: str) -> tuple[list[Any], Any]:
    from nodestro_api import launch

    opened: list[Any] = []
    readies: list[Any] = []
    monkeypatch.setattr(cli, "serve", lambda factory, args, ready=None: readies.append(ready))
    monkeypatch.setattr(cli.webbrowser, "open", opened.append)
    monkeypatch.setattr(cli.threading, "Thread", _Now)
    monkeypatch.setattr(launch, "_taken", launch._UNSET)
    for key in ("NODESTRO_PROFILE", "NODESTRO_HOST", "NODESTRO_DATA_DIR", launch.ENV_VAR, launch.TERMINAL_ENV):
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    monkeypatch.chdir(tmp_path)
    cli.main(["--data-dir", str(tmp_path / "d"), "--port", "8123", *argv])
    readies[0]()
    return opened, launch


def test_without_the_terminal_switch_the_browser_opens_the_studio(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    opened, launch = _ready(monkeypatch, tmp_path)
    assert opened == ["http://localhost:8123"]
    assert launch.launch_secret_from_env() is None
    assert "link" not in capsys.readouterr().out


def test_the_terminal_switch_opens_a_launch_file_never_the_link(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """NS-002, NODESTRO_TERMINAL_LAUNCH: the browser's command line gets a file:// path, the terminal the link."""
    opened, launch = _ready(monkeypatch, tmp_path, NODESTRO_TERMINAL_LAUNCH="1")
    try:
        secret = launch.launch_secret_from_env()
        assert secret is not None
        assert len(opened) == 1 and opened[0].startswith("file://") and secret not in opened[0]
        from urllib.parse import urlsplit
        from urllib.request import url2pathname

        launch_file = Path(url2pathname(urlsplit(opened[0]).path))
        assert launch_file.parent.resolve() == (tmp_path / "d" / "launch").resolve()
        assert f"http://localhost:8123/api/launch?token={secret}" in launch_file.read_text(encoding="utf-8")
        assert f"once with this link: http://localhost:8123/api/launch?token={secret}" in capsys.readouterr().out
    finally:
        launch.reset_terminal_secret()


def test_the_terminal_switch_without_a_browser_only_prints_the_link(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    opened, launch = _ready(monkeypatch, tmp_path, "--no-browser", NODESTRO_TERMINAL_LAUNCH="1")
    try:
        assert opened == []
        assert not (tmp_path / "d" / "launch").exists()
        assert "once with this link: http://localhost:8123/api/launch?token=" in capsys.readouterr().out
    finally:
        launch.reset_terminal_secret()

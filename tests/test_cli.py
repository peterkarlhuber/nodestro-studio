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
    monkeypatch.setattr(cli, "serve", lambda factory, args: served.append((factory, args)))
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
    for option in ("--host", "--port", "--data-dir", "--no-browser", "--reload"):
        assert option in shown

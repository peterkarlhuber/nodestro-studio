"""The frontend's copy of the API's error code list matches the installed nodestro-api (scripts/api_error_codes.py)."""

from __future__ import annotations

import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "api_error_codes.py"


def test_the_frontend_copy_of_the_api_error_codes_is_current() -> None:
    spec = importlib.util.spec_from_file_location("api_error_codes", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    expected = module.text(module.current())
    assert module.COPY.read_text(encoding="utf-8") == expected, "run: python scripts/api_error_codes.py"

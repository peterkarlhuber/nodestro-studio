"""Writes the studio's copy of the API's error code list (frontend/src/lib/apiErrorCodes.json).

The interface checks that it can explain every code the API may answer with (frontend/src/lib/helpCoverage.test.ts);
the frontend tests have no Python, so they read this copy. tests/test_api_error_codes.py fails when the copy differs
from the list of the installed nodestro-api (the pinned commit of platform/internal-server.txt).

    python scripts/api_error_codes.py          # write the copy
"""

from __future__ import annotations

import json
from pathlib import Path

COPY = Path(__file__).resolve().parent.parent / "frontend" / "src" / "lib" / "apiErrorCodes.json"


def current() -> dict[str, object]:
    from nodestro_api import error_codes

    catalog = error_codes.current()
    return {
        "about": "Copy of nodestro_api/error_codes.json (codes only); written by scripts/api_error_codes.py",
        "codes": sorted(catalog.codes),
        "patterns": list(catalog.patterns),
    }


def text(value: dict[str, object]) -> str:
    return json.dumps(value, indent=2) + "\n"


if __name__ == "__main__":
    COPY.write_text(text(current()), encoding="utf-8")
    print(f"wrote {COPY}")

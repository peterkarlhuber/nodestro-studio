"""The interface's table of result file formats (frontend/src/lib/resultFormats.ts) matches the runtime's.

The runtime writes the files (nodestro_runtime.reports.REPORT_FORMATS); the interface offers them in the result
node and the run's "Create file" dialog and names them in all six languages. A format added on one side only would
either be missing from the interface or show up there as a raw translation key.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import get_args

from nodestro_runtime.reports import REPORT_FORMATS
from nodestro_runtime.schemas import ReportFormat

FRONTEND = Path(__file__).resolve().parents[1] / "frontend" / "src"
LANGUAGES = ["de", "en", "es", "fr", "it", "pt-BR"]


def studio_formats() -> list[dict[str, object]]:
    source = (FRONTEND / "lib" / "resultFormats.ts").read_text(encoding="utf-8")
    table = source[source.index("export const RESULT_FORMATS = [") : source.index("] as const satisfies")]
    entries = re.findall(
        r'\{\s*id: "(\w+)",\s*extension: "(\w+)",\s*mediaType: "([^"]+)",\s*preview: (true|false),?\s*\}', table
    )
    return [
        {"id": key, "extension": extension, "media_type": media_type, "inline": preview == "true"}
        for key, extension, media_type, preview in entries
    ]


def test_the_interface_offers_exactly_the_runtime_formats_in_its_order() -> None:
    runtime = [
        {"id": info.id, "extension": info.extension, "media_type": info.media_type, "inline": info.inline}
        for info in REPORT_FORMATS.values()
    ]
    assert studio_formats() == runtime
    assert [entry["id"] for entry in runtime] == list(get_args(ReportFormat))


def test_the_api_types_name_the_same_formats() -> None:
    types = (FRONTEND / "api" / "types.ts").read_text(encoding="utf-8")
    union = re.search(r"export type ReportFormat = ([^;]+);", types)
    assert union is not None
    assert re.findall(r'"(\w+)"', union.group(1)) == list(get_args(ReportFormat))


def test_every_format_has_a_name_with_its_extension_in_every_language() -> None:
    for language in LANGUAGES:
        flow = json.loads((FRONTEND / "i18n" / "locales" / language / "flow.json").read_text("utf-8"))
        names = flow["files"]["formats"]
        assert sorted(names) == sorted(REPORT_FORMATS), language
        for key, info in REPORT_FORMATS.items():
            assert names[key].endswith(f"(.{info.extension})"), (language, key, names[key])

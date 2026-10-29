"""The example chapter of the documentation is generated from the installed example library."""

from __future__ import annotations

from pathlib import Path


def test_the_example_chapter_of_the_documentation_matches_the_templates() -> None:
    from nodestro_examples import docs

    root = Path(__file__).resolve().parents[1]
    for language in docs.LANGUAGES:
        text = (root / docs.CHAPTERS / language / "beispiele.md").read_text(encoding="utf-8")
        assert docs.updated(text, language) == text, f"run `make example-docs` ({language})"

"""Compare the German MUP-ONA plan with its English translation (MUP-ONA 8.7, O13).

Usage::

    python scripts/mup_translation_check.py GERMAN.md docs/architecture/mup-ona/MUP-ONA.md [--report OUT.md]

The German source is not versioned in this repository (repository content is English-only); it lives in the project
files and is identified by its SHA-256 in the report. The check compares sets and sequences that must survive a
translation unchanged:

1. headings: count, level and numbering prefix, in order;
2. IDs with the prefixes E-, K-, O-, G-, MP-, T-, U-, FX-, D-, PS-, AR-, VB- (plus M10, SR-01);
3. number of rows of every work-package table (20 field rows each);
4. numbers with units (s, ms, MiB, MB, KiB, %, LOC, ...);
5. code spans in backticks (paths, commands, identifiers).

Exit code 0 when every comparison is identical or each difference is listed in an explanation file
(``--explain FILE``: lines ``<category> <token>  # reason``), 1 otherwise.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
from pathlib import Path
import re
import sys

ID_RE = re.compile(
    r"(?<![A-Za-z0-9_-])(?:MP-[A-Z][0-9]+|E-[0-9]+|K[0-9]+|O[0-9]+|G[0-9]|T-[A-Z0-9]+(?:-[A-Z0-9]+)*(?:\.\.[0-9]+)?"
    r"|U[0-9]|FX-[A-Z0-9]+-?[0-9a-z]*|D[0-9]+|PS-[0-9]+|AR-[0-9]+|VB-[0-9]+|M10|SR-01)(?![A-Za-z0-9_])"
)
NUM_UNIT_RE = re.compile(
    r"(?<![\w.])(\d{1,3}(?:[ ,\u202f]\d{3})+(?![.,]?\d)|\d+(?:[.,]\d+)?)\s?"
    r"(ms|s|MiB|KiB|MB|GB|%|LOC|min|Tage|days|Zeichen|characters|Seiten|pages|Threads|threads)(?![\w])"
)
CODE_RE = re.compile(r"`([^`\n]+)`")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
NUMBERING_RE = re.compile(r"^((?:\d+\.)*\d+\.?|Anhang [A-Z]\.|Annex [A-Z]\.|MP-[A-Z][0-9]+)")
UNIT_MAP = {"Tage": "days", "Zeichen": "characters", "Seiten": "pages", "Threads": "threads"}


def _strip_code_blocks(text: str) -> str:
    return re.sub(r"```.*?```", "", text, flags=re.S)


def headings(text: str) -> list[tuple[int, str]]:
    out = []
    for line in _strip_code_blocks(text).splitlines():
        m = HEADING_RE.match(line)
        if m:
            title = m.group(2).strip()
            num = NUMBERING_RE.match(title)
            prefix = num.group(1) if num else ""
            prefix = prefix.replace("Anhang", "Annex")
            out.append((len(m.group(1)), prefix))
    return out


def ids(text: str) -> Counter[str]:
    return Counter(m.group(0) for m in ID_RE.finditer(text))


def numbers(text: str) -> Counter[str]:
    out: Counter[str] = Counter()
    for m in NUM_UNIT_RE.finditer(_strip_code_blocks(text)):
        value = m.group(1)
        if re.fullmatch(r"\d{1,3}(?:[ ,\u202f]\d{3})+", value):
            value = re.sub(r"[ ,\u202f]", "", value)  # thousands separators (German space, English comma)
        else:
            value = value.replace(",", ".")  # German decimal comma
        unit = UNIT_MAP.get(m.group(2), m.group(2))
        out[f"{value} {unit}"] += 1
    return out


def code_spans(text: str) -> Counter[str]:
    return Counter(CODE_RE.findall(text))


def package_rows(text: str) -> dict[str, int]:
    """Rows of the 20-field table under each ``#### MP-…`` heading."""
    rows: dict[str, int] = {}
    current = None
    in_table = False
    for line in text.splitlines():
        m = re.match(r"^####\s+(MP-[A-Z][0-9]+)", line)
        if m:
            current, in_table = m.group(1), False
            rows[current] = 0
            continue
        if line.startswith("#"):
            current = None
            continue
        if current is None:
            continue
        if line.startswith("|"):
            if re.match(r"^\|[\s|:-]+\|$", line):
                in_table = True
                continue
            if in_table:
                rows[current] += 1
        elif in_table and line.strip():
            current = None
    return rows


def _load_explanations(path: Path | None) -> dict[tuple[str, str], str]:
    if path is None:
        return {}
    out = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        if not raw.strip() or raw.startswith("#"):
            continue
        body, _, reason = raw.partition("  # ")
        category, _, token = body.partition(" ")
        out[(category, token.strip())] = reason.strip()
    return out


def compare(de: str, en: str, explain: dict[tuple[str, str], str]) -> tuple[list[str], bool]:
    lines: list[str] = []
    ok = True

    def section(name: str, diffs: list[tuple[str, str]], total: int) -> None:
        nonlocal ok
        open_diffs = [(d, t) for d, t in diffs if (name, t) not in explain]
        status = "identical" if not diffs else ("explained" if not open_diffs else "DIFFERENT")
        lines.append(f"| {name} | {total} | {len(diffs)} | {status} |")
        if open_diffs:
            ok = False
        for d, t in diffs:
            reason = explain.get((name, t))
            detail.append(f"- `{name}` {d} `{t}`" + (f" — explained: {reason}" if reason else " — OPEN"))

    detail: list[str] = []
    lines.append("| Check | Items (German) | Differences | Status |")
    lines.append("|---|---|---|---|")

    hd, he = headings(de), headings(en)
    hdiff = []
    if len(hd) != len(he):
        hdiff.append(("count", f"{len(hd)} vs {len(he)}"))
    for i, (a, b) in enumerate(zip(hd, he, strict=False)):
        if a != b:
            hdiff.append(("position", f"{i}: {a} vs {b}"))
    section("headings", hdiff, len(hd))

    for name, fn in (("ids", ids), ("numbers", numbers), ("code", code_spans)):
        cd, ce = fn(de), fn(en)
        diffs = []
        for tok in sorted(set(cd) | set(ce)):
            if cd[tok] != ce[tok]:
                diffs.append((f"{cd[tok]} vs {ce[tok]}", tok))
        section(name, diffs, sum(cd.values()))

    rd, re_ = package_rows(de), package_rows(en)
    rdiff = []
    for pkg in sorted(set(rd) | set(re_)):
        if rd.get(pkg) != re_.get(pkg):
            rdiff.append((f"{rd.get(pkg)} vs {re_.get(pkg)}", pkg))
    section("package-rows", rdiff, len(rd))
    lines.append("")
    lines.append("Work packages and field rows (German): " + ", ".join(f"{k}={v}" for k, v in sorted(rd.items())))
    lines.append("")
    if detail:
        lines.append("Differences:")
        lines.append("")
        lines.extend(detail)
    return lines, ok


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("german", type=Path)
    parser.add_argument("english", type=Path)
    parser.add_argument("--explain", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args(argv)
    de = args.german.read_text(encoding="utf-8")
    en = args.english.read_text(encoding="utf-8")
    lines, ok = compare(de, en, _load_explanations(args.explain))
    header = [
        f"German source SHA-256: `{hashlib.sha256(de.encode()).hexdigest()}`",
        f"English version SHA-256: `{hashlib.sha256(en.encode()).hexdigest()}`",
        "",
    ]
    out = "\n".join(header + lines) + "\n"
    if args.report:
        args.report.write_text(out, encoding="utf-8")
    sys.stdout.write(out)
    sys.stdout.write("RESULT: " + ("PASS" if ok else "FAIL") + "\n")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

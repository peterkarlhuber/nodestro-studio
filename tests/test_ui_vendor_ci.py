"""Every `npm ci` of the frontend sits between the two vendor checks (N-16 review).

`node scripts/check-vendor.mjs` must run right before it (pins, hashes, package.json and lockfile agree) and
`node scripts/check-vendor.mjs --installed` right after it (node_modules holds exactly the vendored tarballs), in every
workflow, in the Makefile and in the shell blocks of the documentation (README, docs/, the in-app help in all
languages). The only other `npm ci` is the one of the TypeScript SDK, which has no vendored packages.
"""

from __future__ import annotations

from pathlib import Path
import re

import pytest

ROOT = Path(__file__).resolve().parents[1]
BEFORE = "node scripts/check-vendor.mjs"
AFTER = "node scripts/check-vendor.mjs --installed"
NOT_FRONTEND = ("nodestro-sdk/typescript",)


def commands(text: str) -> list[str]:
    """The shell commands of a workflow or Makefile, in order: one per line or per `&&` part."""
    out: list[str] = []
    for line in text.splitlines():
        line = re.sub(r"^\s*(- )?(run:\s*\|?)?", "", line.strip()).strip()
        line = line.lstrip("\t@")
        out.extend(part.strip() for part in line.split("&&") if part.strip())
    return out


def problems(text: str) -> list[str]:
    """Each frontend `npm ci` without the check right before and the --installed check right after it."""
    cmds = commands(text)
    found: list[str] = []
    for i, cmd in enumerate(cmds):
        if not re.fullmatch(r"npm ci(\s.*)?", cmd):
            continue
        before = cmds[i - 1] if i else ""
        if any(mark in before for mark in NOT_FRONTEND):
            continue
        after = cmds[i + 1] if i + 1 < len(cmds) else ""
        if before != BEFORE:
            found.append(f"npm ci #{i}: {BEFORE!r} does not run right before it (got {before!r})")
        if after != AFTER:
            found.append(f"npm ci #{i}: {AFTER!r} does not run right after it (got {after!r})")
    return found


SOURCES = [*sorted((ROOT / ".github" / "workflows").glob("*.yml")), ROOT / "Makefile"]


@pytest.mark.parametrize("path", SOURCES, ids=lambda p: p.name)
def test_every_frontend_npm_ci_is_checked_before_and_after(path: Path) -> None:
    assert problems(path.read_text(encoding="utf-8")) == []


def test_the_rule_covers_every_known_install() -> None:
    checked = sum(commands(p.read_text(encoding="utf-8")).count(AFTER) for p in SOURCES)
    assert checked >= 9  # ci.yml 5, macos, nightly, platform, platforms; the Makefile


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("run: |\n  node scripts/check-vendor.mjs\n  npm ci\n  node scripts/check-vendor.mjs --installed\n", 0),
        ("\tcd frontend && node scripts/check-vendor.mjs && npm ci && node scripts/check-vendor.mjs --installed\n", 0),
        ("run: |\n  node scripts/check-vendor.mjs\n  npm ci\n  npm run build\n", 1),
        ("- run: npm ci\n- run: node scripts/check-vendor.mjs --installed\n", 1),
        ("cd frontend && npm ci && npm run build\n", 2),
        ('run: |\n  cd "$RUNNER_TEMP/components/nodestro-sdk/typescript"\n  npm ci\n  npm test\n', 0),
    ],
)
def test_the_rule_itself(text: str, expected: int) -> None:
    assert len(problems(text)) == expected


def code_blocks(markdown: str) -> str:
    """The lines inside the fenced code blocks of a Markdown text."""
    lines: list[str] = []
    inside = False
    for line in markdown.splitlines():
        if line.lstrip().startswith("```"):
            inside = not inside
            lines.append("")  # a block boundary: commands never pair across blocks
        elif inside:
            lines.append(line)
    return "\n".join(lines)


DOCS = sorted({ROOT / "README.md", *(ROOT / "docs").rglob("*.md"), *(ROOT / "frontend" / "src" / "docs").rglob("*.md")})


@pytest.mark.parametrize("path", DOCS, ids=lambda p: str(p.relative_to(ROOT)))
def test_the_documented_installs_check_before_and_after(path: Path) -> None:
    assert problems(code_blocks(path.read_text(encoding="utf-8"))) == []


def test_the_documented_installs_are_covered() -> None:
    documented = [p for p in DOCS if AFTER in code_blocks(p.read_text(encoding="utf-8"))]
    names = {str(p.relative_to(ROOT)) for p in documented}
    assert {"README.md", "docs/PLATFORM.md"} <= names
    assert len([n for n in names if n.endswith("/einstellungen.md")]) == 6


def test_code_blocks_only_reads_fenced_code() -> None:
    text = "`npm ci` in prose\n```bash\ncd frontend && npm ci && npm run build\n```\nnpm ci\n"
    assert problems(code_blocks(text)) != []
    assert problems(code_blocks("prose only: npm ci\n")) == []

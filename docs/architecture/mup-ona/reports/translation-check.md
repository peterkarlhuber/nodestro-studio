# MUP-ONA translation check (plan 8.7 step 3)

This report compares the German reference version MUP-ONA 1.1 (`architektur-umsetzungsplan-orkexa-nodestro-axentra.md`,
project files; not versioned here because repository content is English-only) with [MUP-ONA.md](../MUP-ONA.md).

Reproduce:

```sh
python scripts/mup_translation_check.py <german plan file> docs/architecture/mup-ona/MUP-ONA.md \
  --explain docs/architecture/mup-ona/reports/translation-check.explain
```

## Automated comparison

German source SHA-256: `0b517ee16e52db7ca9dacea0b8954d501ee2bb6d465c695bb85d8af27acb12da`
English version SHA-256: `c6eb7070684fd2743e83920fcc7a3760e6b98e1848c88f6f62c8cf574b5b7e62`

| Check | Items (German) | Differences | Status |
|---|---|---|---|
| headings | 97 | 0 | identical |
| ids | 945 | 2 | explained |
| numbers | 51 | 2 | explained |
| code | 1796 | 1 | explained |
| package-rows | 21 | 0 | identical |

Work packages and field rows (German): MP-A0=20, MP-A1=20, MP-A10=20, MP-A11=20, MP-A2=20, MP-A3=20, MP-A4=20, MP-A5=20, MP-A6=20, MP-A7=20, MP-A8=20, MP-A9=20, MP-B0=20, MP-B1=20, MP-B2=20, MP-B3=20, MP-B4=20, MP-B5=20, MP-B6=20, MP-B7=20, MP-B8=20

Differences:

- `ids` 47 vs 48 `G0` — explained: the English version keeps the German original wording of the activation command (1.1) below its translation, which names G0 once more
- `ids` 10 vs 12 `O13` — explained: the translation note below the header table and the new annex B row "1.1-en" name O13
- `numbers` 2 vs 3 `1 MiB` — explained: German "1-MiB-Limit" (hyphenated compound, not matched as number+unit) is "1 MiB limit" in English
- `numbers` 0 vs 1 `2 MiB` — explained: German "2-MiB-Antwort" (hyphenated compound) is "2 MiB response" in English
- `code` 1 vs 2 `architektur-umsetzungsplan-orkexa-nodestro-axentra.md` — explained: second occurrence inside the kept German original of the activation command (1.1)
RESULT: PASS

Every difference is explained in [translation-check.explain](translation-check.explain); the script result is PASS.

## Second reader (sample review)

An independent reviewer read the German and English versions side by side: the header, chapters 1, 3, 5, 6, 7, 8.2,
8.7, 9.5, 11.0 and the work packages MP-A1, MP-A11, MP-B3 and MP-B6 (all 20 rows and the PR split), 29 sections in
total. Result: no blocking issue; modal verbs (MUST, SHOULD, never, only, must not), gate conditions (1.1, 7.1–7.4,
9.5), numbers, limits, IDs, paths and commands are equivalent. Verdict "equivalent after fixes"; all findings were
fixed in this version:

| Finding | Resolution |
|---|---|
| Header status said execution had started (new statement) | restored to the literal wording "Plan, not implemented. Execution only after start approval (Gate G0)"; the execution state lives only in STATUS.md |
| "this file" / "this German version" in 8.7 and O13 pointed at the wrong document | now names the German plan file explicitly |
| "zero vector" and "null vector" both used | "zero vector" everywhere |
| "RLS evaluation/assessment", "decision paper/proposal" both used | "RLS assessment" and "decision proposal" everywhere (the report file name `A9-rls-evaluation.md` is a path and stays) |
| "runtime < 5 s", "No runtime change" ambiguous with nodestro-runtime | "duration < 5 s", "No change to runtime behavior", "No effect on runtime behavior" |
| Redundant gloss "Execution state (STATUS.md) `…/STATUS.md`" in 1.11 | gloss removed |

## Intentional additions (no content change)

- A note below the header table states that the German version stays the reference until approval (plan 8.7 step 6).
- 1.1 keeps the German original of the activation command below its translation, because Peter types that wording.
- Annex B has the row "1.1-en".
- Status values that appear as code spans (`offen`, `abgenommen`, …) keep the German token with the English term in
  parentheses, so the code-span comparison stays exact. **Canonical tokens in STATUS.md are the English terms**
  (open, in progress, PR open, merged, accepted, accepted (external), deferred, rolled back, blocked), because
  STATUS.md is English (plan 8.2, 9.1).
- The placeholder `ORKEXA_TEST_SECRET=<Zufallswert>` (T-PDF-11) is kept as in the source code span; it means a random
  value.

## Source observation (not a translation issue)

5.2 FX-PG-0 says "at least one NaN-free vector and one zero vector"; U5 and 7.2 count NaN vectors too. The legacy
fixture therefore contains a zero vector and, where the runtime accepts it, a vector with NaN (recorded in STATUS.md
deviations).

## Approval

The English version becomes binding only after the client's explicit approval with reference to this report (plan 8.7
step 4). Until then the German version is the reference. Approval: **open**.

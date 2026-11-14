# Tabrion compatibility (QA-19, QA-20)

`.github/workflows/tabrion-compat.yml` ("Tabrion compatibility") answers two questions about Tabrion, the database
foundation every internal package uses:

- **QA-20 (AC-5): does Tabrion master still work for its consumers?** Axentra, Orkexa with PostgreSQL, the Nodestro
  runtime core and the Nodestro server, each at its commit of the studio lock, run their own test suites against
  Tabrion master.
- **QA-19 (AC-4): does the locked Tabrion install the way each consumer documents it, and does pip refuse what the
  lock rules forbid?**

It runs on demand only (`workflow_dispatch`, input `tabrion_ref`: a branch, tag or full commit SHA of Tabrion, default `master`); there is
no schedule and no issue automation (owner rule of 2026-11-14 against new automatic monitors).
It is report only: it has no `pull_request` trigger, is not in `.github/ci-manifest.json` and is never a required
check.

## The gate before a Tabrion tag

**A red QA-20 result blocks a Tabrion tag of that commit.** Before tagging Tabrion, check that the latest run of this
workflow for the commit to be tagged is green (dispatch it with `tabrion_ref` set to that commit). This is a rule of the release flow, not automation: the workflow blocks, tags and publishes nothing. Tabrion
tags are locked at the moment anyway. The `report` job writes the verdict ("Tabrion tag gate (QA-20): GREEN/RED")
into the run summary.

## QA-20: consumers against Tabrion master

| Job | Consumer at its locked commit | Install (pip >= 26.1, third-party cutoff) | Suite (PostgreSQL 17 service) |
| --- | --- | --- | --- |
| `QA-20 axentra` | axentra | `-e "<checkout>[dev]"` | `pytest -ra` with `AXENTRA_TEST_DATABASE_URL` and the PostgreSQL 17 client |
| `QA-20 orkexa[postgres]` | orkexa | `-e "<checkout>[postgres,dev]"` | `pytest -m "not postgres"`, then `tests/backends/postgres` and the PostgreSQL conformance with `ORKEXA_REQUIRE_POSTGRES=1` |
| `QA-20 nodestro-runtime core` | nodestro-runtime | `-e "<checkout>[dev]"`; plus a fresh environment with the plain `nodestro-runtime` (no psycopg, no axentra) and a smoke call | `pytest -n auto --dist loadfile` with `NODESTRO_REQUIRE_POSTGRES=1` |
| `QA-20 nodestro-server` | nodestro-api | `-e "<checkout>[server,dev]" "nodestro-runtime[postgres]"` | `pytest -n auto` with `NODESTRO_REQUIRE_POSTGRES=1` |

How it installs:

1. The `resolve` job reads the commit of the Tabrion ref once (`git ls-remote`), so every job tests the same commit
   even if master moves during the run.
2. `scripts/tabrion_compat.py lock` copies `platform/internal-server.txt` with only the `tabrion` line changed to that
   commit; every other pin stays as locked. The job drops the consumer's own line (it installs the checkout of that
   very commit instead) and installs with `pip install --uploaded-prior-to <cutoff> -c <lock>`, the way the Nodestro
   components' own CI does; for Axentra and Orkexa this lock takes the place of their `requirements/tabrion.txt`.
3. `scripts/tabrion_compat.py installed` fails unless the installed `tabrion` comes from the Tabrion repository at the
   resolved commit. Tabrion is never resolved from an index.

Deselected tests: the four tests that assert the installation *is* the pin (`test_installed_tabrion_is_the_pin` in
axentra and orkexa, the runtime's `test_the_installed_tabrion_is_a_final_version_inside_the_range`, the API's
`test_the_pin_is_the_commit_of_the_installed_tabrion`). They are red by design whenever Tabrion is not the locked
final commit and say nothing about compatibility. The runtime's `test_the_installed_tabrion_is_the_locked_commit`
still runs: `NODESTRO_STUDIO_LOCK` points at the at-ref copy of the lock.

Not the same as Tabrion's nightly `downstream` job (`scripts/downstream.py` in the Tabrion repository): that one
runs the consumers' **master** branches, only their database tests, through `uv --override`. This workflow runs the
consumers at the studio's **locked** commits, their whole suites, through the studio lock with pip, as a release
would ship them.

A local trial on 2026-11-14 (PostgreSQL 16, Tabrion master `3e4264a`, 0.2.2.dev0) found no failure caused by Tabrion
master: the only differences to the locked Tabrion 0.2.1 were the four pin tests above.

## QA-19: the locked Tabrion

Each cell is a fresh virtual environment without the pip cache. It installs, runs `pip check`, checks every installed
component against `platform/versions.json` (`scripts/lock_check.py --only`), imports the packages and makes one small
call through Tabrion (`scripts/tabrion_compat.py smoke`: `safe_url`, `split_statements`, `tabrion.postgres`, an Orkexa
`SQLiteMemory` opened through `tabrion.sqlite`, Axentra's migration helpers, the server app modules).

| Cell | Install | pip |
| --- | --- | --- |
| a) `orkexa-postgres` | `-r requirements/tabrion.txt` (orkexa's, at its locked commit) `"orkexa[postgres] @ git+...@<locked>"` | 25.0, latest |
| b) `nodestro-api-server` | `--uploaded-prior-to <cutoff> -r platform/internal-server.txt "nodestro-api[server]"` | latest only (deviation) |
| c) `axentra-orkexa` | both libraries' `requirements/tabrion.txt` (they must agree) and both packages from Git, in one environment | 25.0, latest |

### d) Negative resolution cases

`scripts/tabrion_compat.py negative` writes small synthetic wheels (`tabrion` 0.2.0, 0.2.1, 0.2.2.dev0, 0.3.0a1 and a
consumer `qa19-consumer` that requires `tabrion>=0.2,<0.3`, the range every component declares) and runs each case as
a real `pip install --no-index` in a fresh environment, with pip 25.0 and with the latest pip. Only local artifacts:
no index is ever asked for `tabrion`. A negative case passes only when pip fails, its output names the expected
reason and nothing got installed; a control passes only when the expected `tabrion` is installed.

| Case | Expected |
| --- | --- |
| `two-pins`: two tabrion pins (0.2.1 and 0.2.0) in one install | refused: "Cannot install tabrion 0.2.0 (from ...) and tabrion 0.2.1 (from ...)" |
| `two-pins-same-version`: two pins of 0.2.1 from different sources (two commits) | refused, as above |
| `dev-from-index` (pip < 26.0): only 0.2.2.dev0 in the index | refused: "Could not find a version that satisfies the requirement tabrion<0.3,>=0.2 ... (from versions: 0.2.2.dev0)" |
| `dev-from-index-fallback` (pip >= 26.0): the same | **installs 0.2.2.dev0** (deviation, see below) |
| `dev-from-index-only-final` (pip >= 26.0): the same with `--only-final tabrion` | refused: "Could not find a final version ..." |
| `alpha-from-index`, `alpha-from-index-pre`: only 0.3.0a1 in the index, without and with `--pre` | refused: `<0.3` excludes the 0.3 pre-releases (PEP 440) |
| `alpha-pin`: a direct pin on 0.3.0a1 with the consumer | refused: "Cannot install qa19-consumer==1.0 and tabrion 0.3.0a1", the consumer "depends on tabrion<0.3 and >=0.2" |
| `control-final`: 0.2.1 and 0.2.2.dev0 in the index | installs the final 0.2.1 |
| `control-dev-pin`: a direct pin on 0.2.2.dev0 | installs 0.2.2.dev0: a direct URL satisfies the range even as a pre-release (this is how QA-20 installs master) |

## Deviations

- **pip floor of the Nodestro cells.** QA-19 cell b and every QA-20 job run the latest pip only. The Nodestro install
  paths need pip >= 26.1: the components' CI installs with `-c` and a URL with extras, which pip 25.0 to 26.0 reject
  or crash on, and the studio passes the third-party cutoff with `--uploaded-prior-to` (pip >= 26.0,
  `scripts/pip_cutoff.py`). Cells a and c follow the libraries' documented install (pip 25.0 or newer, no cutoff) and
  run with both pips.
- **Pre-releases on pip >= 26.0.** Since pip 26.0 (observed on 26.0 to 26.3), when no final release satisfies a
  specifier, pip installs a pre-release that does: a plain install of a consumer against an index that offers only
  `tabrion` 0.2.2.dev0 succeeds. So the AC-4 d case "a pre-release against the final range must fail" holds on pip
  25.x only. On pip >= 26.0 the workflow asserts the new behavior (`dev-from-index-fallback`, so that a change is
  noticed) and shows that `--only-final tabrion` refuses it. The protection does not rest on pip here: Tabrion is
  never resolved from an index (direct-URL pins in the lock and in `requirements/tabrion.txt`, checked by the
  "tabrion source (poisoned index)" job), and RC-8 (the lock names a final release) is checked by
  `scripts/check_versions.py`. A 0.3 alpha stays refused on every pip.
- **Deselected pin tests** in QA-20, see above.

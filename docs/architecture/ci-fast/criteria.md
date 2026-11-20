# CI criteria K1 to K9 (Locria Phase N-A)

The owner made these criteria binding on 2026-11-20 (Phase 0R). They protect the CI-FAST speedups while the platform
grows new libraries (`nodestro-session`, `nodestro-ui`) and new security, contract and UI tests. They do not replace
the mandatory checks in each repository's `.github/ci-manifest.json`; no check may be dropped to meet them.

## Baseline

Measured with `tools/cifast.py` (ci-ok pseudo jobs filtered) over 2026-11-14..20, 15 repositories, 4,119 runs and
20,978 jobs. M3 is the critical path of a pull-request commit, queue included. Runner minutes are summed over the jobs
of a green pull-request head.

| Repository | M3 median / p90 (min) | Runner minutes per green PR head, median |
|---|---|---|
| orkexa | 36.5 / 110.3 | 86.0 |
| nodestro-runtime | 22.4 / 62.6 | 77.6 |
| nodestro-api | 15.2 / 72.3 | 30.2 |
| nodestro-sdk | 10.8 / 29.6 | 15.4 |
| nodestro-studio | 23.1 / 62.3 | 118.4 |
| nodestro-server | 16.4 / 24.1 | 26.1 |
| nodestro-desktop | 32.5 / 122.2 | 44.1 |
| nodestro-local-docker | 9.3 / 21.5 | 31.0 |
| nodestro-examples | 8.2 / 25.7 | 10.6 |
| axentra | 36.0 / 91.6 | 33.6 |
| axentra-studio | 28.6 / 79.8 | 25.0 |
| tabrion | 22.2 / 79.7 | 113.3 |
| tabrion-studio | 26.0 / 63.3 | 160.0 |
| nodestro-app-ui | 3.9 / 8.6 | 1.0 |
| all | 22.8 / 68.1 | |

Job queue over all repositories: median 3.1, p90 38.3 minutes (an upper bound: it includes waiting for `needs:`).
Up to 213 jobs ran at the same time on 2026-11-14, so the former plateau of 20 concurrent jobs no longer holds.

## Criteria

| ID | Criterion | Limit |
|---|---|---|
| K1 | M3 median per repository | at most 1.2 times the baseline |
| K2 | Runner minutes per green PR head, median per repository | at most 1.2 times the baseline |
| K3 | New library repositories | M3 median at most 15 min, at most 40 runner minutes per head |
| K4 | Red master pushes that are not lock lag | none in 7 days; the nightly is green on at least 6 of 7 days per repository |
| K5 | `components-at-master.yml` | green on at least 6 of 7 days; red on 2 days in a row is reported |
| K6 | Jobs that end by timeout | none |
| K7 | Queue p90 over all repositories | at most 20 min on days without a mass run; days above 20,000 runner minutes are shown separately |
| K8 | Mandatory checks | no ci-manifest entry is dropped without a "Gate change" reason (existing ci-ok self check) |
| K9 | Collected tests | the number per repository does not drop without a reason in the PR |

A breach of K1, K2 or K5 stops further CI additions in that repository until it is explained or fixed.

## Rules for new tests

- New tests run in the repository of the code they test. Cross-repository checks run on a lock bump and in the
  nightly, not on every library pull request.
- New Python libraries test the lowest and the highest supported Python version on pull requests; the full matrix
  runs in the nightly (CI-FAST AP5).
- Operating-system specific tests (path guard, session peer checks) run on Linux on every pull request, on macOS and
  Windows when their own paths change, and on all three in the nightly.
- No `paths` filter on a job that a ci-manifest lists.

## Measuring

Weekly, by hand (no scheduled job), in a studio checkout on master:

```sh
W=/tmp/ci-raw; O=/tmp/ci-kpis
python3 docs/architecture/ci-fast/tools/cifast.py collect --since <first day> --until <last day> --out "$W" \
  --repos orkexa axentra nodestro-runtime nodestro-examples nodestro-integrations nodestro-api nodestro-sdk \
  axentra-studio nodestro-studio nodestro-server nodestro-desktop nodestro-local-docker nodestro-app-ui \
  tabrion tabrion-studio
python3 docs/architecture/ci-fast/tools/cifast.py kpis --since <first day> --until <last day> --data "$W" --out "$O" \
  --repos <the same list>
```

`kpis` gives M3, the queue, runner minutes per day and the master red rate. Runner minutes per green head and K4's
lock-lag split are not in the tool yet. Until then, count a red master push as lock lag only when the run's lock step
names a paired studio branch (`scripts/studio_lock.sh`, "Lock lag") or the nightly of the same day is green.
The lock step asks GitHub with the workflow token (read-only) whether the paired bump is still open. When GitHub cannot
answer, the step uses the studio master's lock and shows a "Lock lag unknown" warning with the HTTP status; such a red
push counts as lock lag only when the same commit is green once the paired bump is merged.

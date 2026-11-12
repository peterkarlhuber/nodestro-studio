#!/usr/bin/env bash
# CI-FAST AP6: every default browser suite of scripts/e2e.sh, split into two halves that run at the same time on one
# runner (4 CPUs), each half with its own Nodestro servers on its own ports (E2E_PORT_OFFSET 0 and 100).
# Usage: scripts/e2e_halves.sh            run both halves; fails if either fails
#        scripts/e2e_halves.sh --check    only print the halves and check them
# The check fails when the halves together are not exactly the default list of scripts/e2e.sh (a suite missing, in
# both halves, or unknown), so a new suite can never be dropped by the split: it lands in the second half.
# Half "a" holds i18n (about 5.5 of the 14 minutes, measured 2026-11-12) with the smoke test before it (it expects
# an empty start page) and a11y; half "b" is every other default suite, in the default order.
set -euo pipefail
cd "$(dirname "$0")/.."

mapfile -t all < <(scripts/e2e.sh --list)
half_a=(smoke i18n a11y)
half_b=()
for suite in "${all[@]}"; do
  case " ${half_a[*]} " in *" $suite "*) ;; *) half_b+=("$suite") ;; esac
done

# The sum check: each default suite exactly once in the two halves, nothing else.
expected=$(printf '%s\n' "${all[@]}" | sort)
actual=$(printf '%s\n' "${half_a[@]}" "${half_b[@]}" | sort)
if [ "$expected" != "$actual" ] || [ -n "$(printf '%s\n' "${half_a[@]}" "${half_b[@]}" | sort | uniq -d)" ]; then
  echo "::error::The two halves are not exactly the default suites of scripts/e2e.sh"
  diff <(echo "$expected") <(echo "$actual") || true
  exit 1
fi
echo "half a (${#half_a[@]}): ${half_a[*]}"
echo "half b (${#half_b[@]}): ${half_b[*]}"
echo "OK: ${#all[@]} default suites, each in exactly one half"
[ "${1:-}" = "--check" ] && exit 0

E2E_PORT_OFFSET=0 scripts/e2e.sh "${half_a[@]}" > >(sed -u 's/^/[a] /') 2>&1 &
pid_a=$!
E2E_PORT_OFFSET=100 scripts/e2e.sh "${half_b[@]}" > >(sed -u 's/^/[b] /') 2>&1 &
pid_b=$!
status=0
wait "$pid_a" || { status=1; echo "::error::Browser suites, half a (${half_a[*]}) failed"; }
wait "$pid_b" || { status=1; echo "::error::Browser suites, half b (${half_b[*]}) failed"; }
exit "$status"

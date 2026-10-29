#!/usr/bin/env bash
# Browser tests of the complete application, each against its own Nodestro with simulated models.
# Usage: scripts/e2e.sh [smoke|i18n|architect|python|assistant|flow|api ...]   (default: all)
# Needs: the studio installed (pip install -e .), the frontend built (make frontend) and Playwright.
set -euo pipefail
cd "$(dirname "$0")/.."
work="$(mktemp -d)"
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

start() {  # start NAME PORT COMMAND...
  local name=$1 port=$2; shift 2
  "$@" > "$work/$name.log" 2>&1 &
  pids+=($!)
  for _ in $(seq 1 60); do
    curl -sf "http://127.0.0.1:$port/api/meta" > /dev/null && return 0
    sleep 1
  done
  cat "$work/$name.log"; return 1
}

run() {  # run SUITE
  case $1 in
    smoke|i18n)
      if [ -z "${studio_started:-}" ]; then
        start studio 8000 nodestro --data-dir "$work/studio" --no-browser --port 8000
        studio_started=1
      fi
      (cd frontend && npm run "$([ "$1" = smoke ] && echo e2e || echo e2e:i18n)") ;;
    architect) start architect 8010 python tests/e2e_architect_server.py --data-dir "$work/architect" --port 8010
      (cd frontend && npm run e2e:architect) ;;
    python) start python 8020 python tests/e2e_python_server.py --data-dir "$work/python" --port 8020
      (cd frontend && npm run e2e:python) ;;
    assistant) start assistant 8030 python tests/e2e_assistant_server.py --data-dir "$work/assistant" --port 8030
      (cd frontend && npm run e2e:assistant) ;;
    flow) start flow 8040 python tests/e2e_flow_server.py --data-dir "$work/flow" --port 8040
      (cd frontend && npm run e2e:flow) ;;
    api) start api 8050 python tests/e2e_api_server.py --data-dir "$work/api" --port 8050
      (cd frontend && npm run e2e:api) ;;
    *) echo "unknown suite $1" >&2; return 2 ;;
  esac
}

# The smoke test goes first: it expects an empty start page and copies examples from the gallery.
suites=("$@")
[ ${#suites[@]} -eq 0 ] && suites=(smoke i18n architect python assistant flow api)
for suite in "${suites[@]}"; do
  echo "== e2e: $suite"
  run "$suite"
done

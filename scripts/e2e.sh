#!/usr/bin/env bash
# Browser tests of the complete application, each against its own Nodestro with simulated models.
# Usage: scripts/e2e.sh [smoke|i18n|architect|python|assistant|flow|panels|api|mcp|approvals|orchestration|runchat|journeys|welcome|a11y ...]   (default: all)
# The journeys suite writes its report to $JOURNEY_REPORT when set.
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
    flow|panels)
      if [ -z "${flow_started:-}" ]; then
        start flow 8040 python tests/e2e_flow_server.py --data-dir "$work/flow" --port 8040
        flow_started=1
      fi
      (cd frontend && npm run "e2e:$1") ;;
    api) start api 8050 python tests/e2e_api_server.py --data-dir "$work/api" --port 8050
      (cd frontend && npm run e2e:api) ;;
    mcp) start mcp 8070 python tests/e2e_mcp_server.py --data-dir "$work/mcp" --port 8070 --mcp-port 8071
      (cd frontend && npm run e2e:mcp) ;;
    approvals) start approvals 8080 python tests/e2e_approvals_server.py --data-dir "$work/approvals" --port 8080 --wait 20
      (cd frontend && npm run e2e:approvals) ;;
    orchestration) start orchestration 8100 python tests/e2e_orchestration_server.py --data-dir "$work/orchestration" --port 8100
      (cd frontend && npm run e2e:orchestration) ;;
    runchat) start runchat 8110 python tests/e2e_run_chat_server.py --data-dir "$work/runchat" --port 8110
      (cd frontend && npm run e2e:runchat -- http://127.0.0.1:8110 ${E2E_SCREENSHOTS:-}) ;;
    welcome) start welcome 8090 nodestro --data-dir "$work/welcome" --no-browser --port 8090
      (cd frontend && npm run e2e:welcome) ;;
    a11y) start a11y 8095 nodestro --data-dir "$work/a11y" --no-browser --port 8095
      (cd frontend && npm run e2e:a11y -- http://127.0.0.1:8095) ;;
    journeys) start journeys 8060 python tests/e2e_journey_server.py --data-dir "$work/journeys" --port 8060
      (cd frontend && npm run e2e:journeys) ;;
    *) echo "unknown suite $1" >&2; return 2 ;;
  esac
}

# The smoke test goes first: it expects an empty start page and copies examples from the gallery.
suites=("$@")
[ ${#suites[@]} -eq 0 ] && suites=(smoke i18n architect python assistant flow panels api mcp approvals orchestration runchat journeys welcome a11y)
for suite in "${suites[@]}"; do
  echo "== e2e: $suite"
  run "$suite"
done

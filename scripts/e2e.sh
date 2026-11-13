#!/usr/bin/env bash
# Browser tests of the complete application, each against its own Nodestro with simulated models.
# Usage: scripts/e2e.sh --list | [smoke|i18n|architect|python|assistant|reasoning|flow|panels|api|mcp|approvals|budget|orchestration|runchat|journeys|welcome|a11y|settings-ui|publications|missing-model|local-models|local-server|portable ...]   (default: all but portable)
# The journeys suite writes its report to $JOURNEY_REPORT when set.
# E2E_PORT_OFFSET (default 0) moves every server port by that amount (8000 to 8099 by default, so parallel runs on
# one machine do not collide), E2E_BROWSER=firefox|webkit picks another Playwright engine.
# local-models runs only the recorded part of e2e/localModels.mjs (LOCAL_E2E_REAL=0: nothing is downloaded).
# local-server runs the local models end to end against a fake Ollama (tests/fake_ollama.py) over HTTP.
# portable builds a real portable package from the publish dialog; it needs the network on its first run (uv downloads
# Python and wheels, about a minute) and is not in the default list. E2E_EXPORT_CACHE keeps its download cache.
# Needs: the studio installed (pip install -r platform/internal.txt -e .), the frontend built (make frontend) and Playwright.
set -euo pipefail
cd "$(dirname "$0")/.."

# The suites a run without arguments runs, in this order. `scripts/e2e.sh --list` prints them (scripts/e2e_halves.sh
# splits them between two parallel runs and checks that the halves together are exactly this list).
default_suites=(smoke i18n architect python assistant reasoning flow panels api mcp approvals budget orchestration runchat journeys welcome a11y settings-ui publications missing-model local-models local-server)
if [ "${1:-}" = "--list" ]; then
  printf '%s\n' "${default_suites[@]}"
  exit 0
fi
work="$(mktemp -d)"
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

offset=${E2E_PORT_OFFSET:-0}
port() { echo $(($1 + offset)); }
url() { echo "http://127.0.0.1:$(port "$1")"; }

start() {  # start NAME PORT COMMAND...
  local name=$1 port=$2; shift 2
  # Every suite runs on "a computer without Docker" (CI runners have one): the automatic sandbox mode would
  # otherwise run AI-created tools there, and the suites check the blocked state. Doubles stand in where needed.
  DOCKER_HOST=unix:///nonexistent/docker.sock "$@" > "$work/$name.log" 2>&1 &
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
        start studio "$(port 8000)" nodestro --data-dir "$work/studio" --no-browser --port "$(port 8000)"
        studio_started=1
      fi
      (cd frontend && NODESTRO_URL="$(url 8000)" npm run "$([ "$1" = smoke ] && echo e2e || echo e2e:i18n)") ;;
    architect) start architect "$(port 8010)" python tests/e2e_architect_server.py --data-dir "$work/architect" --port "$(port 8010)"
      (cd frontend && NODESTRO_URL="$(url 8010)" npm run e2e:architect) ;;
    python) start python "$(port 8020)" python tests/e2e_python_server.py --data-dir "$work/python" --port "$(port 8020)"
      (cd frontend && NODESTRO_URL="$(url 8020)" npm run e2e:python) ;;
    assistant) start assistant "$(port 8030)" python tests/e2e_assistant_server.py --data-dir "$work/assistant" --port "$(port 8030)"
      (cd frontend && NODESTRO_URL="$(url 8030)" npm run e2e:assistant) ;;
    reasoning) start reasoning "$(port 8035)" python tests/e2e_assistant_server.py --data-dir "$work/reasoning" --port "$(port 8035)"
      (cd frontend && npm run e2e:reasoning -- "$(url 8035)" ${E2E_SCREENSHOTS:-}) ;;
    flow|panels)
      if [ -z "${flow_started:-}" ]; then
        start flow "$(port 8040)" python tests/e2e_flow_server.py --data-dir "$work/flow" --port "$(port 8040)"
        flow_started=1
      fi
      (cd frontend && NODESTRO_URL="$(url 8040)" npm run "e2e:$1") ;;
    api) start api "$(port 8050)" python tests/e2e_api_server.py --data-dir "$work/api" --port "$(port 8050)"
      (cd frontend && NODESTRO_URL="$(url 8050)" npm run e2e:api) ;;
    mcp) start mcp "$(port 8070)" python tests/e2e_mcp_server.py --data-dir "$work/mcp" --port "$(port 8070)" \
        --mcp-port "$(port 8071)" --oauth-port "$(port 8072)" --oauth-mcp-port "$(port 8073)"
      (cd frontend && NODESTRO_URL="$(url 8070)" NODESTRO_MCP_URL="$(url 8071)/mcp" \
        NODESTRO_OAUTH_MCP_URL="$(url 8073)/mcp" npm run e2e:mcp) ;;
    approvals) start approvals "$(port 8080)" python tests/e2e_approvals_server.py --data-dir "$work/approvals" --port "$(port 8080)" --wait 20
      (cd frontend && NODESTRO_URL="$(url 8080)" npm run e2e:approvals) ;;
    budget) start budget "$(port 8085)" python tests/e2e_budget_server.py --data-dir "$work/budget" --port "$(port 8085)"
      (cd frontend && NODESTRO_URL="$(url 8085)" npm run e2e:budget) ;;
    orchestration) start orchestration "$(port 8065)" python tests/e2e_orchestration_server.py --data-dir "$work/orchestration" --port "$(port 8065)"
      (cd frontend && NODESTRO_URL="$(url 8065)" npm run e2e:orchestration) ;;
    runchat) start runchat "$(port 8075)" python tests/e2e_run_chat_server.py --data-dir "$work/runchat" --port "$(port 8075)"
      (cd frontend && npm run e2e:runchat -- "$(url 8075)" ${E2E_SCREENSHOTS:-}) ;;
    welcome) start welcome "$(port 8090)" nodestro --data-dir "$work/welcome" --no-browser --port "$(port 8090)"
      (cd frontend && NODESTRO_URL="$(url 8090)" npm run e2e:welcome) ;;
    a11y) start a11y "$(port 8095)" nodestro --data-dir "$work/a11y" --no-browser --port "$(port 8095)"
      (cd frontend && npm run e2e:a11y -- "$(url 8095)") ;;
    settings-ui) start settings-ui "$(port 8097)" nodestro --data-dir "$work/settings-ui" --no-browser --port "$(port 8097)"
      (cd frontend && npm run e2e:settings-ui -- "$(url 8097)" ${E2E_SCREENSHOTS:-}) ;;
    publications) start publications "$(port 8055)" python tests/e2e_api_server.py --data-dir "$work/publications" --port "$(port 8055)"
      (cd frontend && npm run e2e:publications -- "$(url 8055)" ${E2E_SCREENSHOTS:-}) ;;
    missing-model) start missing-model "$(port 8045)" python tests/e2e_missing_model_server.py --data-dir "$work/missing-model" --port "$(port 8045)"
      (cd frontend && npm run e2e:missing-model -- "$(url 8045)" ${E2E_SCREENSHOTS:-}) ;;
    local-models) start local-models "$(port 8025)" nodestro --data-dir "$work/local-models" --no-browser --port "$(port 8025)"
      (cd frontend && LOCAL_E2E_REAL=0 npm run e2e:local-models -- "$(url 8025)" ${E2E_SCREENSHOTS:-}) ;;
    local-server) start local-server "$(port 8027)" python tests/e2e_local_models_server.py --data-dir "$work/local-server" --port "$(port 8027)"
      (cd frontend && npm run e2e:local-server -- "$(url 8027)" ${E2E_SCREENSHOTS:-}) ;;
    portable) start portable "$(port 8087)" python tests/e2e_portable_server.py --data-dir "$work/portable" --port "$(port 8087)"
      (cd frontend && npm run e2e:portable -- "$(url 8087)" ${E2E_SCREENSHOTS:-}) ;;
    journeys) start journeys "$(port 8060)" python tests/e2e_journey_server.py --data-dir "$work/journeys" --port "$(port 8060)"
      (cd frontend && NODESTRO_URL="$(url 8060)" npm run e2e:journeys) ;;
    *) echo "unknown suite $1" >&2; return 2 ;;
  esac
}

# The smoke test goes first: it expects an empty start page and copies examples from the gallery.
suites=("$@")
[ ${#suites[@]} -eq 0 ] && suites=("${default_suites[@]}")
for suite in "${suites[@]}"; do
  echo "== e2e: $suite"
  run "$suite"
done

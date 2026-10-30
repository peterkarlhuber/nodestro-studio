# Provenance

Source: `peterkarlhuber/nodestro` (now `nodestro-legacy`) at commit
`15e20768dea496820d4f8a286720176b47817da7` (merge of PR #14, version 0.1.0). The "State" column compares every file
byte for byte with the original; "adapted" gives the changed lines (mostly rewritten imports).

511 files unchanged, 25 adapted, 25 new.

This record describes the repository as it was split off. Later changes are in the Git history and the CHANGELOG;
files renamed since then for the English-only documentation policy: `docs/ARCHITEKTUR.md` → `docs/ARCHITECTURE.md`,
`docs/PLATTFORM.md` → `docs/PLATFORM.md`, `docs/PROJEKTBESCHREIBUNG.md` → `docs/PROJECT_DESCRIPTION.md`,
`docs/screenshots/ausfuehrung.png` → `execution.png`, `editor-dunkel.png` → `editor-dark.png`,
`editor-hell.png` → `editor-light.png`.

Folders taken over byte for byte (files summarized):

- `docs/PROJEKTBESCHREIBUNG.md/` – 1 file unchanged
- `docs/design/DESIGN_SYSTEM.md/` – 1 file unchanged
- `docs/design/nodestro-midnight-citron.css/` – 1 file unchanged
- `docs/design/nodestro-theme-tokens.json/` – 1 file unchanged
- `docs/design/preview-dark.png/` – 1 file unchanged
- `docs/design/preview-light.png/` – 1 file unchanged
- `docs/screenshots/assistant.png/` – 1 file unchanged
- `docs/screenshots/ausfuehrung.png/` – 1 file unchanged
- `docs/screenshots/editor-dunkel.png/` – 1 file unchanged
- `docs/screenshots/editor-hell.png/` – 1 file unchanged
- `docs/screenshots/tools.png/` – 1 file unchanged
- `frontend/e2e/i18n.mjs/` – 1 file unchanged
- `frontend/e2e/smoke.mjs/` – 1 file unchanged
- `frontend/eslint.config.js/` – 1 file unchanged
- `frontend/index.html/` – 1 file unchanged
- `frontend/public/favicon.svg/` – 1 file unchanged
- `frontend/src/App.tsx/` – 1 file unchanged
- `frontend/src/api/` – 2 files unchanged
- `frontend/src/architect/` – 9 files unchanged
- `frontend/src/assistant/` – 12 files unchanged
- `frontend/src/automation/` – 4 files unchanged
- `frontend/src/components/` – 15 files unchanged
- `frontend/src/docs/` – 112 files unchanged
- `frontend/src/editor/` – 20 files unchanged
- `frontend/src/i18n/` – 249 files unchanged
- `frontend/src/layout/` – 2 files unchanged
- `frontend/src/lib/` – 20 files unchanged
- `frontend/src/library/` – 4 files unchanged
- `frontend/src/main.tsx/` – 1 file unchanged
- `frontend/src/pages/` – 20 files unchanged
- `frontend/src/publish/` – 8 files unchanged
- `frontend/src/python/` – 4 files unchanged
- `frontend/src/routes.tsx/` – 1 file unchanged
- `frontend/src/runs/` – 5 files unchanged
- `frontend/src/styles/` – 2 files unchanged
- `frontend/src/test/` – 1 file unchanged
- `frontend/src/vite-env.d.ts/` – 1 file unchanged
- `frontend/tsconfig.json/` – 1 file unchanged
- `src/nodestro_studio/__main__.py/` – 1 file unchanged

| File | Original | State |
| --- | --- | --- |
| `.github/workflows/ci.yml` | — | new |
| `.github/workflows/platform.yml` | — | new |
| `.gitignore` | — | new |
| `CHANGELOG.md` | — | new |
| `LICENSE` | — | new |
| `Makefile` | — | new |
| `README.md` | — | new |
| `docs/ARCHITEKTUR.md` | `docs/ARCHITEKTUR.md` | adapted (+44 −35 lines) |
| `docs/PLATTFORM.md` | — | new |
| `frontend/e2e/api.mjs` | `frontend/e2e/api.mjs` | adapted (+3 −2 lines) |
| `frontend/e2e/architect.mjs` | `frontend/e2e/architect.mjs` | adapted (+1 −1 lines) |
| `frontend/e2e/assistant.mjs` | `frontend/e2e/assistant.mjs` | adapted (+1 −1 lines) |
| `frontend/e2e/flow.mjs` | `frontend/e2e/flow.mjs` | adapted (+1 −1 lines) |
| `frontend/e2e/python.mjs` | `frontend/e2e/python.mjs` | adapted (+1 −1 lines) |
| `frontend/package-lock.json` | `frontend/package-lock.json` | adapted (+2 −2 lines) |
| `frontend/package.json` | `frontend/package.json` | adapted (+2 −2 lines) |
| `frontend/src/api/types.ts` | `frontend/src/api/types.ts` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/de/api-und-export.md` | `frontend/src/docs/chapters/de/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/en/api-und-export.md` | `frontend/src/docs/chapters/en/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/es/api-und-export.md` | `frontend/src/docs/chapters/es/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/fr/api-und-export.md` | `frontend/src/docs/chapters/fr/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/it/api-und-export.md` | `frontend/src/docs/chapters/it/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/src/docs/chapters/pt-BR/api-und-export.md` | `frontend/src/docs/chapters/pt-BR/api-und-export.md` | adapted (+1 −1 lines) |
| `frontend/vite.config.ts` | `frontend/vite.config.ts` | adapted (+1 −1 lines) |
| `platform/versions.json` | — | new |
| `pyproject.toml` | — | new |
| `scripts/check_imports.py` | — | new |
| `scripts/check_versions.py` | — | new |
| `scripts/checkout_components.py` | — | new |
| `scripts/e2e.sh` | — | new |
| `src/nodestro_studio/__init__.py` | `backend/src/nodestro/__init__.py` | adapted (+7 −1 lines) |
| `src/nodestro_studio/app.py` | — | new |
| `src/nodestro_studio/cli.py` | `backend/src/nodestro/cli.py` | adapted (+8 −38 lines) |
| `src/nodestro_studio/py.typed` | — | new |
| `src/nodestro_studio/static/.gitkeep` | — | new |
| `tests/architect_script.py` | `backend/tests/architect_script.py` | adapted (+1 −1 lines) |
| `tests/conftest.py` | `backend/tests/conftest.py` | adapted (+9 −228 lines) |
| `tests/e2e_api_server.py` | `backend/tests/e2e_api_server.py` | adapted (+4 −7 lines) |
| `tests/e2e_architect_server.py` | `backend/tests/e2e_architect_server.py` | adapted (+4 −6 lines) |
| `tests/e2e_assistant_server.py` | `backend/tests/e2e_assistant_server.py` | adapted (+4 −7 lines) |
| `tests/e2e_flow_server.py` | `backend/tests/e2e_flow_server.py` | adapted (+4 −7 lines) |
| `tests/e2e_python_server.py` | `backend/tests/e2e_python_server.py` | adapted (+4 −7 lines) |
| `tests/test_api_docs.py` | — | new |
| `tests/test_assistant_docs.py` | — | new |
| `tests/test_cli.py` | — | new |
| `tests/test_example_docs.py` | — | new |
| `tests/test_platform.py` | — | new |
| `tests/test_upgrade.py` | — | new |
| `tests/upgrade/legacy-0.1.zip` | — | new |
| `tests/upgrade/make_legacy_data.py` | — | new |

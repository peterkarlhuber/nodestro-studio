# Herkunft

Quelle: `peterkarlhuber/nodestro` (heute `nodestro-legacy`) am Commit
`15e20768dea496820d4f8a286720176b47817da7` (Merge von PR #14, Version 0.1.0). Die Spalte „Stand“ vergleicht jede
Datei byte-genau mit dem Original; „angepasst“ nennt die geänderten Zeilen (meist umgeschriebene Importe).

511 Dateien unverändert, 25 angepasst, 25 neu.

Byte-genau übernommene Ordner (Dateien zusammengefasst):

- `docs/PROJEKTBESCHREIBUNG.md/` – 1 Dateien unverändert
- `docs/design/DESIGN_SYSTEM.md/` – 1 Dateien unverändert
- `docs/design/nodestro-midnight-citron.css/` – 1 Dateien unverändert
- `docs/design/nodestro-theme-tokens.json/` – 1 Dateien unverändert
- `docs/design/preview-dark.png/` – 1 Dateien unverändert
- `docs/design/preview-light.png/` – 1 Dateien unverändert
- `docs/screenshots/assistant.png/` – 1 Dateien unverändert
- `docs/screenshots/ausfuehrung.png/` – 1 Dateien unverändert
- `docs/screenshots/editor-dunkel.png/` – 1 Dateien unverändert
- `docs/screenshots/editor-hell.png/` – 1 Dateien unverändert
- `docs/screenshots/tools.png/` – 1 Dateien unverändert
- `frontend/e2e/i18n.mjs/` – 1 Dateien unverändert
- `frontend/e2e/smoke.mjs/` – 1 Dateien unverändert
- `frontend/eslint.config.js/` – 1 Dateien unverändert
- `frontend/index.html/` – 1 Dateien unverändert
- `frontend/public/favicon.svg/` – 1 Dateien unverändert
- `frontend/src/App.tsx/` – 1 Dateien unverändert
- `frontend/src/api/` – 2 Dateien unverändert
- `frontend/src/architect/` – 9 Dateien unverändert
- `frontend/src/assistant/` – 12 Dateien unverändert
- `frontend/src/automation/` – 4 Dateien unverändert
- `frontend/src/components/` – 15 Dateien unverändert
- `frontend/src/docs/` – 112 Dateien unverändert
- `frontend/src/editor/` – 20 Dateien unverändert
- `frontend/src/i18n/` – 249 Dateien unverändert
- `frontend/src/layout/` – 2 Dateien unverändert
- `frontend/src/lib/` – 20 Dateien unverändert
- `frontend/src/library/` – 4 Dateien unverändert
- `frontend/src/main.tsx/` – 1 Dateien unverändert
- `frontend/src/pages/` – 20 Dateien unverändert
- `frontend/src/publish/` – 8 Dateien unverändert
- `frontend/src/python/` – 4 Dateien unverändert
- `frontend/src/routes.tsx/` – 1 Dateien unverändert
- `frontend/src/runs/` – 5 Dateien unverändert
- `frontend/src/styles/` – 2 Dateien unverändert
- `frontend/src/test/` – 1 Dateien unverändert
- `frontend/src/vite-env.d.ts/` – 1 Dateien unverändert
- `frontend/tsconfig.json/` – 1 Dateien unverändert
- `src/nodestro_studio/__main__.py/` – 1 Dateien unverändert

| Datei | Original | Stand |
| --- | --- | --- |
| `.github/workflows/ci.yml` | — | neu |
| `.github/workflows/platform.yml` | — | neu |
| `.gitignore` | — | neu |
| `CHANGELOG.md` | — | neu |
| `LICENSE` | — | neu |
| `Makefile` | — | neu |
| `README.md` | — | neu |
| `docs/ARCHITEKTUR.md` | `docs/ARCHITEKTUR.md` | angepasst (+44 −35 Zeilen) |
| `docs/PLATTFORM.md` | — | neu |
| `frontend/e2e/api.mjs` | `frontend/e2e/api.mjs` | angepasst (+3 −2 Zeilen) |
| `frontend/e2e/architect.mjs` | `frontend/e2e/architect.mjs` | angepasst (+1 −1 Zeilen) |
| `frontend/e2e/assistant.mjs` | `frontend/e2e/assistant.mjs` | angepasst (+1 −1 Zeilen) |
| `frontend/e2e/flow.mjs` | `frontend/e2e/flow.mjs` | angepasst (+1 −1 Zeilen) |
| `frontend/e2e/python.mjs` | `frontend/e2e/python.mjs` | angepasst (+1 −1 Zeilen) |
| `frontend/package-lock.json` | `frontend/package-lock.json` | angepasst (+2 −2 Zeilen) |
| `frontend/package.json` | `frontend/package.json` | angepasst (+2 −2 Zeilen) |
| `frontend/src/api/types.ts` | `frontend/src/api/types.ts` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/de/api-und-export.md` | `frontend/src/docs/chapters/de/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/en/api-und-export.md` | `frontend/src/docs/chapters/en/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/es/api-und-export.md` | `frontend/src/docs/chapters/es/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/fr/api-und-export.md` | `frontend/src/docs/chapters/fr/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/it/api-und-export.md` | `frontend/src/docs/chapters/it/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/src/docs/chapters/pt-BR/api-und-export.md` | `frontend/src/docs/chapters/pt-BR/api-und-export.md` | angepasst (+1 −1 Zeilen) |
| `frontend/vite.config.ts` | `frontend/vite.config.ts` | angepasst (+1 −1 Zeilen) |
| `platform/versions.json` | — | neu |
| `pyproject.toml` | — | neu |
| `scripts/check_imports.py` | — | neu |
| `scripts/check_versions.py` | — | neu |
| `scripts/checkout_components.py` | — | neu |
| `scripts/e2e.sh` | — | neu |
| `src/nodestro_studio/__init__.py` | `backend/src/nodestro/__init__.py` | angepasst (+7 −1 Zeilen) |
| `src/nodestro_studio/app.py` | — | neu |
| `src/nodestro_studio/cli.py` | `backend/src/nodestro/cli.py` | angepasst (+8 −38 Zeilen) |
| `src/nodestro_studio/py.typed` | — | neu |
| `src/nodestro_studio/static/.gitkeep` | — | neu |
| `tests/architect_script.py` | `backend/tests/architect_script.py` | angepasst (+1 −1 Zeilen) |
| `tests/conftest.py` | `backend/tests/conftest.py` | angepasst (+9 −228 Zeilen) |
| `tests/e2e_api_server.py` | `backend/tests/e2e_api_server.py` | angepasst (+4 −7 Zeilen) |
| `tests/e2e_architect_server.py` | `backend/tests/e2e_architect_server.py` | angepasst (+4 −6 Zeilen) |
| `tests/e2e_assistant_server.py` | `backend/tests/e2e_assistant_server.py` | angepasst (+4 −7 Zeilen) |
| `tests/e2e_flow_server.py` | `backend/tests/e2e_flow_server.py` | angepasst (+4 −7 Zeilen) |
| `tests/e2e_python_server.py` | `backend/tests/e2e_python_server.py` | angepasst (+4 −7 Zeilen) |
| `tests/test_api_docs.py` | — | neu |
| `tests/test_assistant_docs.py` | — | neu |
| `tests/test_cli.py` | — | neu |
| `tests/test_example_docs.py` | — | neu |
| `tests/test_platform.py` | — | neu |
| `tests/test_upgrade.py` | — | neu |
| `tests/upgrade/legacy-0.1.zip` | — | neu |
| `tests/upgrade/make_legacy_data.py` | — | neu |

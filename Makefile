.PHONY: install frontend dev check test lint e2e example-docs check-versions check-dependency-policy check-imports platform-local

install: frontend
	pip install -r platform/internal.txt -e ".[dev]"

frontend:
	cd frontend && npm ci && npm run build

dev:
	@echo "API:        nodestro --reload --no-browser"
	@echo "Interface:  cd frontend && npm run dev"

test:
	pytest
	cd frontend && npm test

lint:
	ruff check .
	ruff format --check .
	mypy
	cd frontend && npm run lint && npm run typecheck

check: lint test check-imports

# All browser suites, each against its own Nodestro with simulated models (needs `make install` and Playwright).
e2e:
	scripts/e2e.sh

# Rewrites the per-example part of the "beispiele" documentation chapter from the templates.
example-docs:
	python -m nodestro_examples.docs

# The pins of platform/versions.json against this studio and every component (reads GitHub).
check-versions:
	python scripts/check_versions.py

# The same with sibling checkouts (../tabrion, ../axentra, ../orkexa, ../nodestro-runtime, ...) at the pinned commits.
platform-local:
	python scripts/check_versions.py --local ..

check-dependency-policy:
	python scripts/check_dependency_policy.py

check-imports:
	python scripts/check_imports.py

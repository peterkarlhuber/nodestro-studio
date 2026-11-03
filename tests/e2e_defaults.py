"""The cloud default models for the e2e servers.

A new installation defaults to local models (Ollama). The e2e servers answer with a scripted client shaped like the
cloud models, and several suites check the model names they show, so each server keeps the defaults of an existing
installation.
"""

from __future__ import annotations

from typing import Any

from nodestro_runtime.schemas import DEFAULT_AGENT_MODEL, DEFAULT_ASSISTANT_MODEL, SettingsIn


def keep_cloud_defaults(app: Any) -> Any:
    app.state.nodestro.update_settings(
        SettingsIn(default_model=DEFAULT_AGENT_MODEL, assistant_model=DEFAULT_ASSISTANT_MODEL)
    )
    return app

# Settings and operation

This chapter describes all settings, how to install and start Nodestro, and the keyboard shortcuts.

## AI providers {#anbieter}
<!-- keywords: api key, provider, anthropic, openai, gemini, ollama, vllm, openai-compatible, base url, environment variable, .env, capabilities -->

Nodestro runs agents through the Orkexa library and works with several **AI providers** at the same time: **Anthropic**, **OpenAI**, **Google Gemini** and your own servers through an **OpenAI-compatible endpoint**, **Ollama** or **vLLM**. Every agent uses the provider of its model. If that provider is not set up, the run does not start; Nodestro never silently switches to another provider. If the provider of the default model is missing, “Set up AI provider” appears at the top right.

Under *Settings → AI providers* every provider has its own section:

- **Anthropic, OpenAI, Google Gemini:** enter the API key and **Save**. The key is stored in the local database, never shown again and sent only to this provider. **Remove** deletes it.
- **OpenAI-compatible endpoint, Ollama, vLLM:** enter the server's **base URL** (for example `http://localhost:11434/v1` for Ollama) and **Save endpoint**; an API key is optional. The provider only counts as set up once a base URL is saved.
- **What the models can do:** for your own servers you state whether their models handle tools, structured output, images, PDF documents, reasoning effort and further capabilities. Nodestro assumes nothing: an option a model cannot do, or whose support is unknown, is reported as an error by the check instead of being left out.
- **Test connection** only asks the provider for its list of models; this costs nothing.

You can also set keys as **environment variables**, before starting or in a **`.env` file** in the folder where you start `nodestro`. Environment variables take **precedence** over stored keys:

| Provider | Environment variable |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |
| OpenAI-compatible, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (optional) |

A key from earlier versions (back then for Anthropic only) automatically becomes Anthropic's key in these settings on the first start.

## Assistant model and default model {#modelle}
<!-- keywords: default model, assistant model, new agents -->

- **Default model for new agents:** new, empty agents start with this provider and model (from the palette, via *Add agent*, in new workflows and as an empty template). In AI drafts it serves as a replacement if the architect suggests a model that is not allowed. Existing agents remain unchanged.
- **Model for the assistants:** this model drafts agents from your description, writes tools as the coding agent, suggests memory structures and answers your questions as the [Nodestro Assistant](/docs/assistent). A strong model (default: Claude Opus 5.5 from Anthropic) gives better suggestions. AI drafts only suggest models of providers that are set up.

Both fields consist of **provider** and **model**. Pick the model from the list or type any model id of the provider, for example `gpt-5.5` for OpenAI or `llama3.1:8b` for Ollama. It is stored as `provider:model` (such as `openai:gpt-5.5`); older entries without a provider such as `claude-sonnet-5-5` count as Anthropic models.

Save changes with **Save** in the *Models and budget* section.

## Default budget {#budget}
<!-- keywords: default budget, budget, limit -->

The **Default budget per run** (initially 2 USD) applies to all workflows without a budget of their own. Empty means no limit. How the budget works is explained under [Budget per run](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: choose sandbox, docker, python process, docker available -->

Here you choose where your own and AI-created tools run: **Python process** or **Docker**. The change takes effect immediately. A note shows whether Docker was found; if Docker is selected but not reachable, tool tests and calls fail. Details are under [The sandbox](/docs/tools#sandbox).

## Language {#sprache}
<!-- keywords: language, english, german, spanish, french, portuguese, italian, browser language, translation, localization -->

Nodestro is available in **German, English, Spanish, French, Portuguese (Brazil) and Italian**. Under **Interface language** you choose one of them or **Automatic (browser language)**.

- **First start:** Nodestro uses the language of your browser. If it is not supported, English appears.
- **Your own choice:** a selected language always takes precedence and stays saved, even after a restart. Nodestro remembers it in the browser and in the settings; another browser adopts it as long as it has no choice of its own.
- **Immediate effect:** switching needs no restart and starts neither a workflow nor an AI call.

The language only affects the **interface**: menus, notes, error messages, this documentation and number and date formats. Costs are always shown in US dollars, in the format of the selected language. For server error messages you can see the original text under **Technical details**.

**Your content stays unchanged.** Agents, prompts, workflows, tools, knowledge, memory and results are never translated automatically. An existing agent keeps answering in the language of its prompt, whichever interface language you choose.

**AI assistants:** new drafts (agents, memory structures) are written in the interface language unless your description asks for another language. Code, identifiers and JSON keys always stay English.

## Appearance {#darstellung}
<!-- keywords: theme, dark, light, dark mode, light mode, colour scheme, design, midnight citron -->

At the top right you switch between **Dark** and **Light**. The choice is saved in the browser. Both variants follow the *Midnight Citron* design system. On narrow screens the sidebar becomes a toolbar.

## Backup and restore {#backup}
<!-- keywords: backup, restore, export, zip, move, data backup -->

**Download backup** saves all data in one ZIP file: workflows with versions, agent templates, custom tools, knowledge files, memory, executions, usage data, favorites, tags and settings. The database is saved as a consistent snapshot, even while a run is working.

The **API keys** of the AI providers are never written into the backup, nor are base URLs that contain credentials. Restoring keeps the keys of this computer.

**Restore from file** first checks the file completely: format, the checksum of every file, the database and every stored workflow and run. Only then does Nodestro show what the backup contains, compared with the current state. Data is only replaced after explicit confirmation and only when no run is active. Before that, Nodestro automatically saves a backup of the current state (`before-restore-….zip` in the `backups` folder of the data directory); it appears among the safety backups on this computer and can be restored the same way. If anything fails, the previous data stays unchanged.

## System diagnosis {#diagnose}
<!-- keywords: diagnosis, system check, check, troubleshoot, connection, docker, sandbox, version, problem -->

**Run diagnosis** checks whether Nodestro works completely on this computer and shows **OK**, **Warning** or **Error** for every point, with an explanation and a suggested fix:

- versions of Nodestro, Orkexa, Python, SQLite and the operating system
- database (readable, writable, undamaged, full-text search)
- data, tool and backup directories writable, free disk space
- AI providers: which are set up and whether the providers of the default and the assistant model are among them (without showing keys)
- Docker and the tool sandbox with a small test tool
- PDF support and the built interface

The diagnosis is free and sends nothing to the internet. **Test connection** additionally asks the provider of the default model for its list of models; in each provider's section under [AI providers](/docs/einstellungen#anbieter) you test it on its own. This uses no tokens and costs nothing. API keys and other credentials are never shown.

## Installation and start {#installation}
<!-- keywords: installation, start, command line, cli, port, host, data-dir, no-browser, reload, python, node -->

Requirements: Python 3.10 or newer and Node.js 20 or newer (only for building the interface), optionally Docker.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro starts at `http://localhost:8000` and opens the browser. Options of the `nodestro` command:

| Option | Environment variable | Meaning |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Address (default `127.0.0.1`, this computer only) |
| `--port` | `NODESTRO_PORT` | Port (default `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Data directory (default `~/.nodestro`) |
| – | `NODESTRO_ALLOWED_HOSTS` | Further host names Nodestro answers under, e.g. behind a reverse proxy (comma-separated). Other host names and changes from foreign web pages are refused, so no web page in the browser can operate Nodestro |
| `--no-browser` | – | Do not open the browser automatically |
| `--reload` | – | Restart on code changes (development) |

Stop with **Ctrl+C**. Running runs are cancelled.

> **Security:** Nodestro has no user management. Do not make it reachable via `--host 0.0.0.0` on untrusted networks, because anyone who can reach the interface can start runs with your API keys.

## Keyboard shortcuts {#tastenkuerzel}
<!-- keywords: keyboard shortcuts, shortcuts, keyboard, accessibility -->

<!-- widget: shortcuts -->

In addition, everywhere: **Tab** moves to the next control and shows its explanation, **Esc** closes dialogs and explanations, **Enter** or **Space** activates buttons.

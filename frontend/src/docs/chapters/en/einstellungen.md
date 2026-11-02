# Settings and operation

This chapter describes all settings, how to install and start Nodestro, and the keyboard shortcuts.

## AI providers {#anbieter}
<!-- keywords: api key, provider, anthropic, openai, gemini, ollama, vllm, openai-compatible, base url, environment variable, .env, capabilities -->

Nodestro runs agents through the Orkexa library and works with several **AI providers** at the same time: **Anthropic**, **OpenAI**, **Google Gemini** and your own servers through an **OpenAI-compatible endpoint**, **Ollama** or **vLLM**. Every agent uses the provider of its model. If that provider is not set up, the run does not start; Nodestro never silently switches to another provider. If the provider of the default model is missing, “Set up AI provider” appears at the top right, or “Default model needs …” once another provider is set up.

Under *Settings → AI providers* every provider has its own section:

- **Anthropic, OpenAI, Google Gemini:** enter the API key and **Save**. The key is stored in the local database, never shown again and sent only to this provider. **Remove** deletes it.
- **OpenAI-compatible endpoint, Ollama, vLLM:** enter the server's **base URL** (for example `http://localhost:11434/v1` for Ollama) and **Save endpoint**; an API key is optional. The provider only counts as set up once a base URL is saved.
- **Amazon Bedrock (AWS):** no API key; choose an AWS region and how Nodestro signs in to AWS, see [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
- **What the models can do:** for your own servers you state whether their models handle tools, structured output, images, PDF documents, reasoning effort and further capabilities. Nodestro assumes nothing: an option a model cannot do, or whose support is unknown, is reported as an error by the check instead of being left out.
- **Test connection** only asks the provider for its list of models; this costs nothing.
- **First provider:** if you save a key while the default model's provider is not set up yet, new agents use a model of this provider from now on; a message says which one. This only changes the settings: existing workflows keep their models.

You can also set keys as **environment variables**, before starting or in a **`.env` file** in the folder where you start `nodestro`. Environment variables take **precedence** over stored keys:

| Provider | Environment variable |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |
| OpenAI-compatible, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (optional) |

A key from earlier versions (back then for Anthropic only) automatically becomes Anthropic's key in these settings on the first start.

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, region, iam, role, profile, sso, inference profile, arn, eu, data residency, eu only, converse, aws_region, sts -->

**Amazon Bedrock** runs Claude, Amazon Nova and other models through your own **AWS account**, in the **AWS region** you choose; the costs appear on your AWS bill. Bedrock has **no API key field**: Nodestro signs in with AWS credentials and never stores AWS access keys. An IAM role or an AWS profile is not a key, it only tells AWS who is asking.

**Sign-in on the desktop.** Under *Settings → AI providers → Amazon Bedrock (AWS)* choose:

- **AWS default credentials (environment, SSO, instance role):** whatever the AWS tools find on this computer, for example after `aws sso login`, from `AWS_*` environment variables or an instance role.
- **AWS profile:** a named profile from `~/.aws/config`; enter its **name** only, the credentials stay in your AWS configuration.

In Nodestro Local (a container) only the default credentials are offered.

**Sign-in on a server.** The server's own AWS credentials are never used for a workspace. Bedrock is off until the operator assigns the workspace its own **AWS role**; the card then says *Role assigned by the operator*, and you can neither see nor change the role. Without one it says *not available on this server*: ask your operator. The operator can also limit the regions and require EU-only data residency for every workspace (see [Nodestro on a server](/docs/einstellungen#server)).

**Region.** Enter the region requests go to and AWS bills, for example `eu-central-1` (Frankfurt). The field suggests common regions and refuses names that are not AWS regions. The model must be enabled for your account in that region.

**Model.** In the agent choose the provider *Amazon Bedrock (AWS)*. The list shows **suggested** models (EU inference profiles of Claude and Amazon Nova); a suggestion does not mean the model is enabled for your account. You can type any **model id** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **inference profile id** (`eu.anthropic.claude-sonnet-5-5`) or **ARN** (for example an application inference profile); it is stored as `bedrock:<id>` and passed on exactly as typed, colons included (see [Model](/docs/agenten#modell)).

**EU-only data residency.** With the toggle on, Nodestro checks before the first request that the region and every region the model or inference profile can route to are EU regions (Frankfurt, Stockholm, Milan, Spain, Ireland, Paris), and sends nothing otherwise. Global inference profiles (`global.…`) are always refused; London and Zurich are in Europe but not in the EU. The check covers the configuration Nodestro sends requests with. It **does not guarantee** that AWS processes everything in the EU: model invocation logging, abuse detection with its retention and the other settings of your AWS account are outside Nodestro. Enforce it account-wide with IAM and service control policies. If your operator requires EU-only, the toggle stays on.

**Check connection.** The button signs in to AWS (`sts:GetCallerIdentity`) and makes one free read call to Bedrock (a list of models). **No model is invoked, so it costs nothing.** The badge then reads *Connection checked* or *Check failed* with the reason; before that it reads *Not set up* or *Set up*.

**Minimal IAM permissions** of the role or user:

- `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` on the model or inference profile (the Converse API uses these); with an inference profile also on the foundation model in every destination region;
- `bedrock:GetInferenceProfile` on the profile (EU-only check) and `bedrock:GetGuardrail` if you use a guardrail;
- `sts:GetCallerIdentity` and `bedrock:ListFoundationModels` for *Check connection*.

**Prices.** Bedrock is priced **per region**, never with Anthropic's prices, also for Claude. A price applies only to the regions it lists; a region it does not list has an **unknown** cost, never 0, and the strict price mode then refuses the request. Enter your own prices with their regions under [Model prices](/docs/nutzung#preise). Your AWS bill can contain more than Nodestro counts (for example invocation logging, guardrails or other AWS services).

**What Bedrock offers.** Tools, streaming, images and PDF documents, structured output and reasoning effort depend on the model; Nodestro shows options a model does not support, or whose support is unknown (a typed ARN, an application inference profile), as switched off with the reason. **Not available on Bedrock**, also not for Claude: server tools such as web search, thinking modes, Anthropic's prompt caching settings, fallback models, batches and citations.

**Tools and AWS credentials.** On a desktop Nodestro keeps AWS credentials away from tools (environment variables and AWS SDK lookups). Tool code in the plain subprocess sandbox still runs as your user and could read the files in `~/.aws` directly. If real AWS credentials are on the machine, run your own and AI-generated tools in the built-in sandbox or in containers (see [Sandbox](/docs/einstellungen#sandbox)).

**Troubleshooting by message:**

| Message | What to do |
|---|---|
| No AWS credentials were found | Sign in (`aws sso login`), check the profile or the environment, then *Check connection*. |
| AWS did not accept the credentials | They are wrong or expired: sign in again. |
| AWS refused access | Grant the permissions above and enable the model in the AWS console. |
| The AWS profile … does not exist | Check the profile name against `~/.aws/config`. |
| Not an AWS region name / not valid | Use a name like `eu-central-1`. |
| Not known in this region | Use a model id or inference profile offered in this region. |
| Could not be reached | Check network, proxy and region. |
| Could break the EU-only data residency | Use an EU region and an `eu.` profile or a model of that region. |
| Not available on this server | Ask your operator to assign an AWS role to the workspace. |

## Assistant model and default model {#modelle}
<!-- keywords: default model, assistant model, new agents -->

- **Default model for new agents:** new, empty agents start with this provider and model (from the palette, in new workflows and as an empty template). In AI drafts it serves as a replacement if the architect suggests a model that is not allowed. Existing agents remain unchanged.
- **Model for the assistants:** this model drafts agents from your description, writes tools as the coding agent, suggests memory structures and answers your questions as the [Nodestro Assistant](/docs/assistent). A strong model (default: Claude Opus 5.5 from Anthropic) gives better suggestions. AI drafts only suggest models of providers that are set up.

Both fields consist of **provider** and **model**. Pick the model from the list or type any model id of the provider, for example `gpt-5.5` for OpenAI or `llama3.1:8b` for Ollama. It is stored as `provider:model` (such as `openai:gpt-5.5`); older entries without a provider such as `claude-sonnet-5-5` count as Anthropic models.

If the default model belongs to a provider that is not set up while another one is, a notice above the model choice says that new agents and example copies cannot run with it and offers the matching model of the provider that is set up (*Use …*). Existing workflows keep their models either way.

Save changes with **Save** in the *Models and budget* section.

## Default budget {#budget}
<!-- keywords: default budget, budget, limit -->

The **Default budget per run** (initially 2 USD) applies to all workflows without a budget of their own. Empty means no limit. How the budget works is explained under [Budget per run](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: choose sandbox, automatic, docker, python process, docker available, built-in sandbox, linux sandbox, macos, windows, blocked, experimental -->

Here you choose where tools run. The change takes effect immediately.

| Mode | Your own tools | AI-created tools and tools of unknown origin |
|---|---|---|
| **Automatic** (default) | Python process | built-in Linux sandbox if it is available, otherwise Docker while it is running, otherwise **blocked** |
| **Python process** | Python process | only the built-in Linux sandbox, otherwise **blocked**; Docker is not used |
| **Docker** | Docker | Docker; if Docker is not running, no tool runs |

Nodestro never falls back to an unprotected process for AI-created code. If you never chose a mode, Nodestro uses *Automatic*; a mode you chose in an earlier version stays.

Below the choice Nodestro shows:

- the **computer running Nodestro** with its operating system. This is the computer of the Nodestro runtime, not the device of your browser: if you open Nodestro on a server from a Mac, the server's system counts;
- where AI-created tools and your own tools run **now**, or that they are **blocked** and why;
- every **sandbox on this computer** with its state: *Approved* (may run AI-created code), *Experimental, not used*, *Not available*, *Not isolated* (the Python process) or *Not used here*.

The built-in Linux sandbox is approved on Ubuntu 24.04 and Debian 13 (64-bit Intel or AMD) once its self-test passed. On macOS Nodestro has an **experimental** sandbox: it is implemented and tested, but not independently reviewed yet, so Nodestro shows it and does not use it. On Windows there is no native sandbox yet. On both, AI-created tools therefore need Docker. Details are under [The sandbox](/docs/tools#sandbox) and [Trust and isolation](/docs/tools#vertrauen).

On a server and in Nodestro Local Docker every tool runs in a container; the setting cannot be changed there.

## Installing Docker {#sandbox-docker}
<!-- keywords: install docker, docker desktop, docker engine, macos, windows, linux, wsl, start docker, docker not running -->

AI-created tools need Docker on macOS and Windows, and on Linux systems where the built-in sandbox is not available. Nodestro only needs a running Docker; the container image is built automatically on first use.

- **macOS:** install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon or Intel), open it once and wait until it says it is running.
- **Windows:** install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) with the WSL 2 backend, restart if asked, and start Docker Desktop.
- **Linux:** install [Docker Engine](https://docs.docker.com/engine/install/) for your distribution and allow your user to use it (group `docker`), or use Docker Desktop for Linux.

Then open *Settings → Sandbox*: with **Automatic** Nodestro uses Docker as soon as it is running; *Docker available* is shown and AI-created tools are no longer blocked. If Docker stops, they are blocked again until it runs; Nodestro does not switch to the Python process.

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

At the top right you switch between **Dark** and **Light**. The choice is saved in the browser. Both variants follow the *Midnight Citron* design system. On narrow screens the sidebar is hidden: the menu button at the top left (**Show all pages**) opens it as a panel, and **Esc** closes it again.

## Backup and restore {#backup}
<!-- keywords: backup, restore, export, zip, move, data backup -->

**Download backup** saves all data in one ZIP file: workflows with versions, agent templates, custom tools, knowledge files, memory, runs, usage data, favorites, tags and settings. The database is saved as a consistent snapshot, even while a run is working.

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
| `--host` | `NODESTRO_HOST` | Address (default `127.0.0.1`). Only addresses of this computer (`127.0.0.1`, `::1`, `localhost`) are accepted, because Nodestro has no login yet |
| `--port` | `NODESTRO_PORT` | Port (default `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Data directory (default `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Operating profile (default `desktop`). `server` cannot be started yet |
| – | `NODESTRO_ALLOWED_HOSTS` | Further names of this computer Nodestro answers under (comma-separated, e.g. `studio.localhost`). Other host names, changes from foreign web pages and requests forwarded by a proxy are refused, so no web page in the browser can operate Nodestro |
| `--no-browser` | – | Do not open the browser automatically |
| `--reload` | – | Restart on code changes (development) |

Stop with **Ctrl+C**. Running runs are cancelled.

> **Security:** Nodestro has no user management yet, so it only answers this computer. `--host 0.0.0.0`, other network addresses or network names in `NODESTRO_ALLOWED_HOSTS` stop the start, and Nodestro cannot be put behind a reverse proxy. To let other devices use a workflow, publish it as an API: published APIs use API keys and have their own network access (see *API and export*).

## Nodestro on a server {#server}
<!-- keywords: server, sign in, sign-in, sign out, role, roles, permission, permissions, workspace, tenant, read only, members, nodestro-server, set-role, remove-member, revoke-sessions, session expired -->

Nodestro Studio can also run on a **Nodestro server** of your organization. You then sign in through your organization's sign-in service, and your data is stored on that server instead of on your computer. The desktop app and the `nodestro` command have no sign-in and no roles; nothing in this section applies there.

**Signing in and out.** When you open Nodestro, the server takes you to the sign-in and back. Your name and role are shown at the top right. A click opens your account: name, role, **workspace**, your permissions and **Sign out**. When your session ends, the next action takes you to the sign-in again and then back to the same page. If a sign-in fails (for example because it took too long), a notice at the top of the page says what happened, with **Sign in again**.

**Workspaces.** Workflows, runs, knowledge and settings belong to a workspace. If you are a member of several workspaces, switch in your account under **Switch workspace**; Nodestro then loads the start page of the other workspace. The settings apply to your current workspace on this server.

**Roles and permissions.** Every role comes with fixed permissions:

| Role | Permissions |
|---|---|
| **Owner** | Read, Edit, Run, Administer |
| **Administrator** | Read, Edit, Run, Administer |
| **Editor** | Read, Edit, Run |
| **Operator** | Read, Run |
| **Viewer** | Read |

- **Read:** look at everything, including runs and the documentation.
- **Edit:** create and change workflows, agent templates, knowledge and memory.
- **Run:** start workflows, cancel and continue runs, decide approvals.
- **Administer:** settings, AI providers, connected services, rules for tool calls, publishing APIs and API keys.
- **Manage the installation** belongs to no role: backup, system diagnostics and network access for published APIs are not shown on a server; the operator looks after them.

**Nodestro shows up front what your role cannot do.** Such controls are hidden or blocked, with the reason next to them, for example *Your role (Viewer) cannot do this: it needs the permission “Edit”. Ask an administrator of your Nodestro server.* As a **Viewer** or **Operator** you see a notice at the top of every page that you can look at everything but not change anything (and, as a viewer, not run anything). The server still checks every request itself.

**Members and roles** are managed by the server's operator with commands of the `nodestro-server` command line; Nodestro Studio has no page for this:

- `nodestro-server members TENANT` lists the members of a workspace with their roles.
- `nodestro-server set-role TENANT USER ROLE` adds a person or changes their role (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` removes a person from the workspace and ends their sessions there.
- `nodestro-server revoke-sessions USER` ends every session of a person (memberships stay).

`USER` is a user id (`u_…`), a verified e-mail address or the subject at the sign-in service. The server only knows a person once they have signed in once; a workspace always keeps at least one owner. Details are in the runbook of the nodestro-server repository (`docs/RUNBOOK.md`, section *Members*). If the sign-in says that your account has no access yet, ask an administrator to add you.

**Data.** At the bottom of the sidebar, **Your organization's server** replaces *Local & private*: your data stays on that server and goes only to the AI providers your operator allows. Backups and the installation are looked after by the operator. Statements such as "runs only on your computer" apply only to the desktop app and the `nodestro` command.

## Keyboard shortcuts {#tastenkuerzel}
<!-- keywords: keyboard shortcuts, shortcuts, keyboard, accessibility -->

<!-- widget: shortcuts -->

In addition, everywhere: **Tab** moves to the next control and shows its explanation, **Esc** closes dialogs and explanations, **Enter** or **Space** activates buttons.

# Settings and operation

This chapter describes all settings, how to install and start Nodestro, and the keyboard shortcuts.

## Finding your way in the settings {#ueberblick}
<!-- keywords: settings, gear, open settings, search settings, find a setting, width, wider, resize, navigation, advanced, ctrl+comma -->

- **Opening:** the gear at the top right of every page, or *Ctrl+,* (*⌘,* on a Mac). The settings remember where you came from: **Back** above the navigation (or *Ctrl+,* again) takes you there. A page with unsaved changes, such as the workflow editor, asks first.
- **Search:** *Find a setting …* above the navigation searches the names, explanations and help texts of single settings, in the interface language. Arrow keys choose a hit, **Enter** jumps to it: closed parts open, the setting is highlighted and its field gets the focus.
- **Navigation:** the list on the right shows the sections by topic and marks the one you are reading. In a narrow window it is a bar above the content with the search and *Go to section*.
- **Width:** drag the edge between the content and the navigation to make the settings wider or narrower. With the keyboard, focus the edge (Tab) and use the arrow keys (with Shift in larger steps), Home and End. A double-click on the edge or **Standard width** in the navigation restores the default. The width is saved in this browser.
- **Basic and advanced:** related settings stand together under a heading. Parts marked *Advanced* (for example what the models of an OpenAI-compatible endpoint can do) are closed until you need them; their badge says how many values differ from the standard.
- **Saving:** most settings take effect at once. *Models and budget* has its own **Save** button; if you leave the page with unsaved changes there, Nodestro asks first.

## Local models {#lokale-modelle}
<!-- keywords: local model, ollama, offline, no api key, qwen, download, recommendation, hardware, gpu, ram, model server, mistral, european, reasoning effort -->

→ [Open in Nodestro](/settings#settings-local-models)

Nodestro can run agents, assistants and the knowledge search on **local models** with Ollama, without an API key: prompts and documents stay on this computer. A new installation uses local models by default (agents `ollama:qwen3.5:4b`, assistant `ollama:qwen3.5:9b`); an updated installation keeps the models it had.

*Settings → Local models* shows:

- **State:** whether the model server runs and who provides it. On the desktop Nodestro starts its own server (a separate process on this computer, with its own model folder); in Nodestro Local Docker it is a separate container; on a server the operator provides it. An Ollama you already run is used only if you save its address for the Ollama provider.
- **Runtime:** if it is missing, **Download and install** fetches the pinned version once and checks its SHA-256. Without internet, install it from its release archive (see [Offline import](/docs/einstellungen#offline-import)). Each step and its progress is shown; see [Setup and downloads](/docs/einstellungen#lokale-einrichtung).
- **Recommended for this computer:** a model per task (sorting, writing, agents with tools, analysis, assistant, semantic search) from the task's needs, the memory of this computer and the installed models. An installed model that is good enough comes first; *Suitable* and *Limited* mean a larger model would do better; the reason is shown under the model. Suggestions never change an agent: you choose its model in the editor.
- **Models:** the suggested models with download size, memory needed and license; **Checked** means the installed build is the one Nodestro verified.

**Prefer European models:** Qwen stays the standard. With the switch on, the recommendations suggest models of the European publisher Mistral AI when they are equally suited (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b`, and `devstral-small-2:24b` for programming), even if they still need a download; an installed model stays the first alternative. A weaker model is never suggested, and the switch never uses a cloud service: all these models run on this computer. A model you give an agent yourself always wins, and the strict offline mode still refuses downloads. For semantic search the switch suggests the European model `mdenseon:307m` (LightOn) while no embedding model is installed yet. It does not come from the Ollama library: **Download** fetches the pinned original files (1.2 GB), checks their SHA-256, builds the model from them and keeps it only if it reproduces the reference vectors exactly. An existing index stays with its model; switching means rebuilding the index.

**Reasoning effort:** local models that can “think” do so without a limit from effort *Medium* up, and the thinking counts toward the maximum output length. On a computer without a graphics card a small model can take many minutes for it. For fast steps (sorting, extraction, short structured answers) choose *Low*: the model then answers without thinking. The model server Nodestro starts gives every model 32,768 tokens of context for prompt, thinking and answer together. Start an Ollama you run yourself with `OLLAMA_CONTEXT_LENGTH=32768`; its default of 4,096 tokens is too small for agents.

Costs: local models have **no external API billing**. Nodestro does not record local operating costs (hardware, energy), so runs show “local, no API billing” instead of a total of 0, and mixed runs add the number of local requests to the cost.

## Setup and downloads: progress and errors {#lokale-einrichtung}
<!-- keywords: set up, setup, install, progress, step, download progress, percent, transfer rate, remaining time, stalled, cancel, resume, continue, retry, disk full, no space, network error, proxy, interrupted, external ollama -->

**Download and install** (and **Start**) set the model server up as one task with steps that follow what Nodestro actually does: *check this system and what is installed*, *check the prerequisites* (strict offline mode, a writable folder, free space), *download Ollama*, *verify the download (SHA-256)*, *install Ollama*, *configure the server* (model folder, context window), *start the server*, *check that the server answers*, *detect the GPU and hardware* and *model server ready*. A step that is not needed is marked *not needed* with the reason, for example when the runtime is part of the desktop app or is installed already. The running step says “Step 3 of 10”; below it, “No action needed” means you can keep working while it continues in the background. In Nodestro Local Docker and for your own Ollama, **Check the model server** only checks that the server answers and which hardware it uses: Nodestro never starts, stops or changes such a server. An Ollama you run yourself on this computer is left alone also while Nodestro sets up its own server next to it.

Model downloads follow Ollama's own steps: *check free space*, *get the model's file list*, *download the model files*, *verify the files (SHA-256)* and *finish the installation*. Each model has its own entry under **Tasks**, and its row in the model list shows the running step instead of the download button. Several models can download at the same time; the same model downloads only once.

What the progress shows is measured, never estimated:

- **A percentage** only for a step that counts bytes (a download, the checksum of the runtime). Any other running step has a moving bar without a value.
- **Bytes:** “400 MB of 1.5 GB”. Ollama names each file of a model only when it starts it, so a model download shows the current file (“File 2: 225 MB of 525 MB”) and the total downloaded so far; the total size is known once Ollama verifies the files.
- **Transfer rate** after a few seconds of measurement, and **remaining time** only while the rate is steady (for a model: the time for the current file). When no data arrives for a while, the entry says so: the download retries on its own for a while before it fails.
- **Continued:** the part an earlier, interrupted attempt left (a canceled download, a lost connection, a closed app) is kept and counted; **Continue** or **Try again** downloads only the rest.

When something fails, the entry says **Action needed**, what happened and what to do: check the internet connection or proxy, free up space or choose another [model folder](/docs/einstellungen#offline-import), install from a release archive in the strict offline mode, and so on. Before a download Nodestro compares the free space of the model folder with the model's size and refuses at once if it does not fit. **Technical details** show the steps' details (paths, versions, addresses), the files of a model and a log.

Tasks are kept by Nodestro, not by the page: after a reload of the page the running setup and downloads appear again with their progress. If Nodestro is closed while a task runs, the task is listed as interrupted the next time; **Continue** picks it up where it stopped. Only one setup runs at a time, also across several Nodestro windows.

## Required model not installed {#modell-fehlt}
<!-- keywords: missing model, model not installed, required model, download model, choose another model, model not found, continue, server unreachable, permission, administrator, unattended, schedule, fix -->

When the Workflow Architect, the assistant, an agent's design or test, a run or the knowledge search needs a local model that cannot be used right now, Nodestro does not start the action and opens one dialog instead. It says **why**: the model is not installed (with the download size, the free space of the [model folder](/docs/einstellungen#offline-import) and the memory it needs), the local models are not set up yet, the model server does not start or answer, the disk is too full, the model cannot do what the step needs (tool calls, structured results, images, embeddings), it is probably too large for this computer, or the name is not a local model. It also says **where** the model belongs: this computer, the Local Docker container, a model server you configured, or the Nodestro server.

The dialog offers only what you may do here: **Download model** (also **Continue download** after an interrupted one), **Set up local models**, **Check again**, **Choose another model** or **Copy model name** for an administrator. Without permission to install, on a Nodestro server (its operator installs models) and in the strict offline mode nothing is downloaded, and the dialog says so. If the same model is downloading already, for example in another window, the dialog follows that download; a second one never starts.

Your inputs stay where they are: the description for the Workflow Architect, the message and its files in the assistant, the test input or the run inputs. Once the download is done, Nodestro checks that the model is really there and can do the step; then **Continue** starts the action once with the same inputs. If you tick **Continue automatically when the model is ready**, it continues by itself, once. You can close the dialog while the download runs: it keeps going under **Tasks**. **Choose another model** lists only ready models that can do the step, local ones and cloud models (which may cost); the choice applies to this one action and does not change your settings.

Schedules, batch runs and published APIs never download anything. A run that cannot start reports the missing model (for example in the schedule's last run) with **Fix**, which opens the same dialog without continuing anything by itself.

## This computer, context window and speed {#lokale-hardware}
<!-- keywords: hardware, gpu, cpu only, ram, context window, ollama_context_length, speed, tokens per second, measure, cpu saving mode, reasoning reduced -->

*Settings → Local models → This computer* shows what Nodestro detected: system, CPU cores, memory, the graphics card and its memory, whether the model server runs (and on the GPU or the CPU), and its **context window**: set by Nodestro for the server it starts, reported by a running server, or not known yet for your own Ollama. The column **On this computer** in the model list says whether a model runs on the GPU, on the CPU (slower), is too slow without a GPU or too large for this memory.

Hints appear above the list when they apply: a context window that is too small (for your own Ollama: set `OLLAMA_CONTEXT_LENGTH=32768` on its computer and restart it), no graphics card (expect slow answers; small models and effort *Low* for simple steps work best), too little memory, a model that does not fit, or a model that was measured as slow. The workflow check warns too, when the context window is below 16,384 tokens or an agent's answer limit does not fit it.

**Speed:** Nodestro does not estimate speeds. **Measure speed** on an installed language model runs one short generation on this computer and shows the measured tokens per second, when it was measured and whether the model ran on the GPU or the CPU.

**CPU saving mode for thinking models** (on by default): on a computer without a graphics card, agents with effort *Medium* on local thinking models answer without the long thinking phase. Effort *High* and a reasoning option set explicitly are never reduced. Every step answered this way carries the badge “Reasoning reduced: CPU saving mode” in the run and in the agent test. Switch the mode off to let agents always think as configured.

## Offline import and model folder {#offline-import}
<!-- keywords: offline, air gap, usb, gguf, offline package, sha-256, external ssd, model folder, copy -->

For computers without internet, *Settings → Local models → Offline import* imports from a path on the computer that runs Nodestro (in Local Docker: inside its import folder):

- **Offline package:** a folder made on a computer with internet (`orkexa-local export`). Every file is checked against its SHA-256 before it is used.
- **GGUF file:** a model file; give it the name agents use (for example `my-model:q4`) and, for models that read images, the vision projector (`mmproj`).

**Model folder:** models are large. Choose another folder, for example on an external SSD: **Copy them there and check them** copies every model, checks it and only then switches (the old folder is kept); **Use the folder as it is** switches to a folder that already holds Ollama models.

## Building a model from local files {#modell-bauen}
<!-- keywords: build, mdenseon, safetensors, template, gguf, air gap, checksum, reference vectors, embedding, reindex -->

Some models are not in the Ollama library and are built from their original files: currently the European embedding model `mdenseon:307m` (LightOn, Apache-2.0). With internet, **Download** in the model list fetches the files and builds the model. Without internet (or in the strict offline mode), use *Settings → Local models → Build from local files*: copy the two files from a computer with internet, enter their paths on the computer that runs Nodestro (in Local Docker: inside its import folder) and choose **Build and check**. Nothing is downloaded.

- **Weights file:** `model.safetensors` from `lightonai/mDenseOn`, revision `a5fdb000f7a21da96c3bddde3a782ef777316df3`, 1,227,771,776 bytes, SHA-256 `a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c`.
- **Template file:** `mmBERT-Base-307M-F16.gguf` from `mykor/mmBERT-base-GGUF`, revision `66e31bd2787f6b5fe9b762a664f4899af38b0605`; SHA-256 of its first 6,036,928 bytes `a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901`. The whole file or just these first bytes (its header) is enough.

Nodestro checks both files against these checksums, writes the model file, creates the model in the model server and embeds reference texts: the model is kept only if every vector matches the reference. The list shows the step that is running; **Cancel** stops the build. If it fails, the message says why: a file that does not match the checksum (wrong file, wrong revision or incomplete copy), a file that is missing, a file that does not fit the model, or reference vectors that do not match (the model is removed again). **Try again** starts it once more with the same paths.

After the build, the model is listed as an embedding model. An existing semantic index stays with its model: choose the new model under [Knowledge search](/docs/wissen#suchverfahren) and rebuild the index; searches keep using the old index until the new one is complete.

## Strict offline mode {#offline}
<!-- keywords: strict offline, air gap, no cloud, preflight, downloads refused -->

With **Strict offline mode** on, the check before every run refuses cloud models (also as fallback, judge or orchestrator model), a model server that is not on this computer, server tools such as web search and remote MCP services; downloads are refused too. Local models, local tools and local MCP servers keep working. The mode does not change any workflow: it only refuses what would leave the computer.

## AI providers {#anbieter}
<!-- keywords: api key, provider, anthropic, openai, gemini, ollama, vllm, openai-compatible, base url, environment variable, .env, capabilities -->

→ [Open in Nodestro](/settings#settings-providers)

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

Administrators also set the **Maximum run budget** (empty: no cap): no run may start with or be raised above it. The **Budget decision deadline** (1 to 720 hours, initially 24) says how long a paused run waits for a [budget decision](/docs/workflows#budget-freigabe) before it fails. Who may decide is explained under [Who may decide](/docs/workflows#budget-rechte).

## Model output limits {#ausgabelimits}
<!-- keywords: output limit, max tokens, max_tokens, truncated, cut off, architect limit, context window -->

Nodestro's own AI steps (the Workflow Architect, the assistants, questions about a run, orchestrator decisions and the quality check) have no agent settings of their own. Under **Model output limits** you set how many tokens each step may answer with; an empty field uses the built-in default (for example 32,000 for the architect's workflow plan and 8,000 for its analysis). Agents keep their own *Max. tokens* in the [agent editor](/docs/agenten#limits).

The value that is sent comes from three levels: your setting, else the default, at most the model's documented maximum output (or half of its context window for a local model whose maximum is not known). The table shows the value sent to the assistant model and says when it was lowered; nothing is shortened silently.

The limit includes the model's thinking. A higher limit allows longer answers but never bypasses a budget: before each request, the cost check reserves exactly this value.

**Retry answers that were cut off:** when an answer of the Workflow Architect reaches its limit, it is asked once more with a doubled limit, at most the *Highest limit for a retry* (initially 64,000) and the model's maximum. The retry is sent only if its full cost fits into what is left of the job's budget. Otherwise, or with the retry switched off, the job stops with a message that names the step and its limit.

## Sandbox {#sandbox}
<!-- keywords: choose sandbox, automatic, docker, python process, docker available, built-in sandbox, linux sandbox, macos, windows, blocked, experimental -->

→ [Open in Nodestro](/settings#settings-sandbox)

Here you choose where tools run. The change takes effect immediately.

| Mode | Your own tools | AI-created tools and tools of unknown origin |
|---|---|---|
| **Automatic** (default, recommended) | Python process | only Docker, once it passed Nodestro's checks; otherwise **blocked** |
| **Linux sandbox** (optional, Linux only) | Python process | only the built-in Linux sandbox, otherwise **blocked**; without third-party Python packages, so tools that need them are **blocked**; Docker is not used |
| **Python process** (trusted use only) | Python process | always **blocked**; neither Docker nor the built-in Linux sandbox is used |
| **Docker** | Docker | Docker; if Docker is not running, no tool runs |

Nodestro never falls back to an unprotected process for AI-created code, and *Automatic* never falls back to the built-in Linux sandbox either: it is used only when you choose **Linux sandbox**. If you never chose a mode, Nodestro uses *Automatic*; a mode you chose in an earlier version stays. If you chose **Python process** in an earlier version, AI-created tools are now blocked: that mode no longer runs them in a built-in sandbox. Choose **Automatic** and start Docker, or, on Linux, **Linux sandbox**.

Below the choice Nodestro shows:

- the **computer running Nodestro** with its operating system. This is the computer of the Nodestro runtime, not the device of your browser: if you open Nodestro on a server from a Mac, the server's system counts;
- where AI-created tools and your own tools run **now**, or that they are **blocked** and why;
- every **sandbox on this computer** with its state: *Approved* (may run AI-created code), *Experimental, not used*, *Not available*, *Not isolated* (the Python process) or *Not used here*.

The built-in Linux sandbox is approved on Ubuntu 24.04 and Debian 13 (64-bit Intel or AMD) once its self-test passed; on ARM64 it is not available. Nodestro has no native sandbox on macOS and Windows: the earlier experimental macOS sandbox was removed, and its row says so. On both systems AI-created tools therefore need Docker or a compatible engine. Details are under [The sandbox](/docs/tools#sandbox) and [Trust and isolation](/docs/tools#vertrauen).

On a server and in Nodestro Local Docker every tool runs in a container; the setting cannot be changed there.

## Installing Docker {#sandbox-docker}
<!-- keywords: install docker, docker desktop, docker engine, macos, windows, linux, wsl, start docker, docker not running, colima, orbstack, podman, rootless, docker group, engine check -->

Docker, or a compatible container engine, is required for AI-created tools on every system with *Automatic*; on Linux, the **Linux sandbox** mode is the only alternative, without third-party packages. Nodestro itself starts without Docker; only AI-created tools stay blocked until a suitable engine runs. Nodestro finds a running engine by itself and builds the container image on first use.

- **macOS:** install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon or Intel), open it once and wait until it says it is running. [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) and [Podman](https://podman.io/) are accepted too, if they pass Nodestro's checks.
- **Windows:** install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) with the WSL 2 backend, restart if asked, and start Docker Desktop. It must run Linux containers. Podman is accepted too, if it passes Nodestro's checks.
- **Linux:** install [Docker Engine](https://docs.docker.com/engine/install/) for your distribution. We recommend [rootless Docker](https://docs.docker.com/engine/security/rootless/) with cgroup v2 delegation, so that the limits hold. Adding your user to the group `docker` works too, but members of the docker group are effectively root on this computer. Podman is accepted as well.

**Nodestro checks the engine itself.** Before an engine runs AI-created code, Nodestro checks its limits and its system call filter (seccomp) and starts a small test container. Inside it, the code must run as an unprivileged user without special privileges, without network, on a read-only file system, with enforced limits for memory, processes, CPU and open files, and without secrets in the environment. Nodestro refuses an engine that fails a check, whatever its name, and *Settings → Sandbox* shows which check failed. The checks are never relaxed. Nodestro checks in the background, so the page never waits for Docker; while the check runs, the Docker row says *Checking* and updates by itself. After starting or changing the engine, click **Check again**. Administrators can also click **Run self-test** to start the test container right away (**Prepare sandbox** when the sandbox image is still missing). Only administrators start a new check, and at most every 10 seconds: otherwise the page says that nothing new was checked (and when to try again) and keeps showing the last result. Other users see the state and each check without technical details.

**Which engine?** On Linux, Docker Engine is the most direct choice, ideally rootless with cgroup v2 delegation; rootful Podman works too. Rootless Podman can fail the checks, because it may not apply all of the sandbox's file limits. On macOS and Windows, use Docker Desktop or one of the alternatives above. Whichever engine you choose, its name does not decide: Nodestro relies on its own checks on your computer.

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

## Reasoning display {#denken-anzeige}
<!-- keywords: thinking, reasoning, reasoning summary, thoughts, live, status, redacted, not transmitted, summaries -->

While a model works, Nodestro shows what its provider transmits of the reasoning: in the assistant, the team leader chat of a run, workflow runs, the Workflow Architect and the agent test. **Nodestro never writes, completes or paraphrases reasoning itself.** If a provider keeps the reasoning to itself, you only see that the model is thinking, and why there is no text.

The display always keeps reasoning apart from the answer (dashed frame, its own label) and names one of these states:

| State | Meaning |
|---|---|
| *Thinking…* | A reasoning phase is running; no text has arrived (yet), or the text is hidden. |
| *Thinking text* | The model's reasoning as it was generated (open-weight models, e.g. via Ollama or vLLM). |
| *Reasoning summary* | A summary the provider writes of reasoning it does not expose (OpenAI, Gemini, Claude). |
| *Reasoning not transmitted* | The model reasoned, but the provider sent no text (encrypted, omitted or not requested). |
| *Reasoning not exposed* | The model does not reason, or its provider never sends reasoning. |

**Display in this browser** (section *Reasoning display*): *Show live* opens the text while it arrives, *Collapsed* (default) shows the activity and keeps the text one click away, *Status only* never shows the text. The assistant and the team leader chat have their own choice per conversation (**Reasoning** below the input or the introduction); *Default* follows the global choice. The choice stays in this browser and changes no workflow and no conversation.

**Showing is not enabling.** Whether and how much a model reasons is set on the agent ([Thinking and effort](/docs/agenten#denken)). Some providers send text only on request:

| Provider | What arrives live | How to get text |
|---|---|---|
| Anthropic (Claude 4 and later) | summary | the agent's *Show thoughts* option (*Show summarized*) |
| OpenAI (reasoning models) | summary; the reasoning itself never | **Request reasoning summaries** (administrators; OpenAI may require a verified organization) |
| OpenAI GPT-4o, GPT-4.1 | nothing: they do not reason | – |
| Gemini 2.5 and later | summary (thought summaries) | **Request reasoning summaries** |
| Amazon Bedrock | Claude: summary; other reasoning models: thinking text where the model sends it | the agent's request options |
| Ollama, vLLM, OpenAI-compatible servers | thinking text where the server separates it | server configuration (e.g. a reasoning parser) |

Requesting summaries changes no answer and no cost: reasoning tokens are billed by the provider whether text is transmitted or not. The agent's thinking options show what its model transmits (*Live reasoning: …*).

## Backup and restore {#backup}
<!-- keywords: backup, restore, export, zip, move, data backup -->

→ [Open in Nodestro](/settings#settings-backup)

**Download backup** saves all data in one ZIP file: workflows with versions, agent templates, custom tools, knowledge files, memory, runs, usage data, favorites, tags and settings. The database is saved as a consistent snapshot, even while a run is working.

The **API keys** of the AI providers are never written into the backup, nor are base URLs that contain credentials. Restoring keeps the keys of this computer.

**Restore from file** first checks the file completely: format, the checksum of every file, the database and every stored workflow and run. Only then does Nodestro show what the backup contains, compared with the current state. Data is only replaced after explicit confirmation and only when no run is active. Before that, Nodestro automatically saves a backup of the current state (`before-restore-….zip` in the `backups` folder of the data directory); it appears among the safety backups on this computer and can be restored the same way. If anything fails, the previous data stays unchanged.

## System diagnosis {#diagnose}
<!-- keywords: diagnosis, system check, check, troubleshoot, connection, docker, sandbox, version, problem -->

→ [Open in Nodestro](/settings#settings-diagnostics)

**Run diagnosis** checks whether Nodestro works completely on this computer and shows **OK**, **Warning** or **Error** for every point, with an explanation and a suggested fix:

- versions of Nodestro, Orkexa, Python, SQLite and the operating system
- database (readable, writable, undamaged, full-text search)
- data, tool and backup directories writable, free disk space
- AI providers: which are set up and whether the providers of the default and the assistant model are among them (without showing keys)
- Docker and the tool sandbox with a small test tool
- PDF support and the built interface

The diagnosis is free and sends nothing to the internet. **Test connection** additionally asks the provider of the default model for its list of models; in each provider's section under [AI providers](/docs/einstellungen#anbieter) you test it on its own. This uses no tokens and costs nothing. API keys and other credentials are never shown.

**Database permissions** (desktop app): when other users of this computer may read the database files, the diagnosis says so and offers **Repair permissions…** (available once no runs are active). Nodestro then restarts in repair mode, shows every file with its current and its new permissions and changes them only after you confirm; only the permissions change, never the content. When other users may even change the database, Nodestro opens this repair mode by itself at start and nothing else until it is repaired or you repair it by hand with the `chmod 600 …` command shown there. Symbolic links, files with another name (hard links) and files of other users are never changed.

## Installation and start {#installation}
<!-- keywords: installation, start, command line, cli, port, host, data-dir, no-browser, reload, python, node -->

Requirements: Python 3.11 or newer and Node.js 20 or newer (only for building the interface), optionally Docker.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -r platform/internal.txt -e .
nodestro
```

Nodestro starts at `http://localhost:8000` and opens the browser. Options of the `nodestro` command:

| Option | Environment variable | Meaning |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Address (default `127.0.0.1`). Only addresses of this computer (`127.0.0.1`, `::1`, `localhost`) are accepted, because Nodestro has no login yet |
| `--port` | `NODESTRO_PORT` | Port (default `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Data directory (default `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Operating profile (default `desktop`). A Nodestro server is not started with this command: it runs as the separate Nodestro server distribution that your organization's operator installs |
| – | `NODESTRO_ALLOWED_HOSTS` | Further names of this computer Nodestro answers under (comma-separated, e.g. `studio.localhost`). Other host names, changes from foreign web pages and requests forwarded by a proxy are refused, so no web page in the browser can operate Nodestro |
| `--no-browser` | – | Do not open the browser automatically |
| `--reload` | – | Restart on code changes (development) |

Stop with **Ctrl+C**. Running runs are canceled.

> **Security:** Nodestro has no user management yet, so it only answers this computer. `--host 0.0.0.0`, other network addresses or network names in `NODESTRO_ALLOWED_HOSTS` stop the start, and Nodestro cannot be put behind a reverse proxy. To let other devices use a workflow, publish it as an API: published APIs use API keys and have their own network access (see *API and export*).

## Nodestro on a server {#server}
<!-- keywords: server, sign in, sign-in, sign out, role, roles, permission, permissions, workspace, tenant, read only, members, nodestro-server, set-role, remove-member, revoke-sessions, session expired -->

Nodestro Studio can also run on a **Nodestro server** of your organization. You then sign in through your organization's sign-in service, and your data is stored on that server instead of on your computer. Nodestro started with the `nodestro` command has no sign-in and no roles; nothing in this section applies there.

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

**Members and roles.** Owners and administrators of a workspace manage its members in **Settings › Members and roles**: change a member's role or remove them (their sessions in this workspace end at once). Only owners give, take or change the owner role, and a workspace always keeps at least one owner; every change is recorded in the workspace's access audit trail. New members join with a setup link; invitations are not available yet. The server's operator can do the same with commands of the `nodestro-server` command line:

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

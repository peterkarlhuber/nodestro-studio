# Tools

Tools are functions an agent can call by itself to calculate, look up or carry out something exactly. This chapter explains the kinds of tools, how you write your own or have the AI create them, and how Nodestro runs them safely.

## How tools work {#ueberblick}
<!-- keywords: tool, function, function calling, tool use, kinds, built-in, own, ai-generated -->

A tool has a **name**, a **description** and an **input schema** (the parameters). The model sees this information and decides whether a call helps. If it calls a tool, Nodestro runs the function and returns the result to the model. Such a round is called a **tool round**; an agent can make several in a row.

The **Tools** page has three sections: *Library*, *Write it yourself* and *Create with AI*. There are four kinds of tools:

| Kind | Origin | Execution |
|---|---|---|
| **Built-in** | Shipped with Nodestro, written and checked by hand | in the Nodestro process |
| **Your own tool** | Created by you under *Write it yourself* | in the sandbox |
| **Created by AI** | Written by the coding agent, approved by you | in the sandbox |
| **Server tools** | From Anthropic (web search, web fetch, code execution) | on Anthropic's servers |

You assign tools from the library in an agent's inspector, and switch on server tools there (see [Assigning tools](/docs/agenten#tools)).

## Built-in tools {#eingebaut}
<!-- keywords: calculator, current_datetime, date, time, days_between, days, text_statistics -->

| Tool | Purpose | Example input |
|---|---|---|
| `calculator` | Calculates an expression exactly: `+ - * / // % **`, parentheses, `pi`, `e` and `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Current date, time and weekday in a time zone (default *Europe/Vienna*). | `{"timezone": "Europe/Berlin"}` |
| `days_between` | Calendar days between two dates (negative if the end is earlier). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Counts the characters, words, sentences and paragraphs of a text. | `{"text": "…"}` |

Language models make mistakes in mental arithmetic. Give agents that work with numbers the `calculator` and tell them in the system prompt to use it.

The library shows the descriptions of built-in tools in the interface language. The model always gets the original English description, so existing agents behave the same in every language.

## Server tools from Anthropic {#server-tools}
<!-- keywords: web search, web fetch, code execution, server tools, sources -->

| Server tool | Effect | Notes |
|---|---|---|
| **Web search** | Searches the web and cites the sources. | Costs an extra $10 per 1,000 searches; at most 5 searches per request. |
| **Web fetch** | Loads the content of a web page or PDF from a URL. | At most 5 fetches per request. |
| **Code execution** | Runs Python in a sandbox at Anthropic. | Do not use together with web search or web fetch (the check warns you). |

Server tools run at Anthropic, not on your computer. Their calls also appear in the execution.

## The tool library {#bibliothek}
<!-- keywords: library, try, test, input schema, view code -->

On the left are all tools with kind and description, on the right the details of the selected tool:

- **Input schema:** the parameters as a JSON schema, as the model sees them.
- **View code and tests** (for your own and AI-created tools).
- **Try it:** enter a JSON input (Nodestro prefills a skeleton) and click **Run**. The tool runs exactly as an agent would call it, so your own tools run in the sandbox. This costs nothing because no model is involved. Errors are shown in red.

## Writing your own tools {#selbst-schreiben}
<!-- keywords: own tool, python, write function, docstring, types, tests, write it yourself -->

Under **Write it yourself** you create a tool as a Python function. Nodestro prefills an example (Celsius to Fahrenheit).

1. **Function name:** exactly the name of the function in the code. It becomes the tool name.
2. **Code:** a function with **type hints** for all parameters and the return value, and a Google-style **docstring**. The first line becomes the description; the `Args:` section describes the parameters.
3. **Tests:** `test_*` functions that import the tool with `from tool import <name>` and check it with `assert`.
4. **Check and test** runs the static check and the tests without saving.
5. **Save** checks again and only saves if everything passed.

**Example:**

```python
def net_price(gross: float, vat_percent: float = 20.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 20 for 20 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_austrian_vat():
    assert net_price(120) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

A good description is crucial: the model chooses tools only by name, description and parameter descriptions.

## Rules for your own code {#regeln}
<!-- keywords: rules, static check, imports, allowed modules, forbidden, open, eval, reserved, security -->

Your own and AI-created code is **checked statically** before every run. Pure computation without input and output is allowed:

- **Allowed imports:** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- **Third-party libraries** such as `numpy` or `pandas` are allowed once you approve them. They run in a separate environment (see [Python libraries](/docs/python-bibliotheken#erkennung)). Such libraries can access the network and files: only approve what you know.
- **Forbidden** are, among others, `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, access to double-underscore attributes, `global`, `async`/`await` and statements outside functions (except imports, classes and assignments).
- **No network or file access from the standard library:** modules such as `os`, `socket` or `urllib` are not allowed.
- **Reserved names:** the names of built-in tools as well as `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` and `load_tool` are taken.
- **Tests are required:** nothing is saved without at least one passing test.

The **check result** shows errors from the static check, each test with passed or error message, and the sandbox output.

## Having the AI create tools {#ki-erstellen}
<!-- keywords: ai tool, coding agent, generate, have a tool created, dynamic, requirement -->

Under **Create with AI** you describe what the tool should do (at least 10 characters), for example "Calculate the annuity of a loan from amount, annual interest rate in percent and term in months."

Then, in the background:

1. The **coding agent** (the assistant model from the settings) writes the function and tests.
2. Code and tests are **checked statically**, and the tests run in the **sandbox**.
3. If something fails, the coding agent receives the error message and corrects its proposal; **at most three attempts** in total.
4. When all tests pass, the job waits for your **approval**.

Every job shows its status, number of attempts and costs. Under *View attempts* you find the code of every attempt.

You can write the requirement in any language. The tool itself is always written in English (code, names, docstring and tests), because the docstring becomes the description agents read.

**Well suited** are pure computations: formulas, conversions, date calculations, text analyses, validations. **Not possible** are tools that need the internet, files or external services (see [Rules](/docs/tools#regeln)).

## Approval {#freigabe}
<!-- keywords: approval, approve, reject, check, permit -->

Before an AI-created tool is added, you see its code, tests and test results. Check:

- Does the function do exactly what you described?
- Do the tests cover the important cases, including edge cases?
- Is the description clear, so that agents use the tool correctly?

**Approve** adds the tool to the library; all agents can then use it. **Reject** discards it. Without a decision, a job is rejected automatically after **one hour**.

> **Note:** jobs are only kept in memory. If you stop Nodestro, the job list disappears; approved tools are kept.

## The sandbox {#sandbox}
<!-- keywords: sandbox, docker, subprocess, python process, isolation, security, timeout, built-in sandbox, linux sandbox, landlock, seccomp -->

Your own and AI-created tools **never run in the Nodestro process**. Tests and every later call run in a sandbox:

| Sandbox | Isolation | Limits |
|---|---|---|
| **Python process** (default for your own tools) | separate process with an empty environment in a temporary directory; **not** a security boundary | 15 seconds, 1 GB memory |
| **Built-in Linux sandbox** (automatic for AI-created tools on Ubuntu 24.04 and Debian 13) | no network, no access to your files, keys, the Nodestro data or other programs; no new processes; only its own temporary folder is writable | 15 seconds (60 with libraries), 1 GB memory, 64 MB temporary files |
| **Docker** (automatic for AI-created tools where the built-in sandbox is not available, also on macOS and Windows) | throwaway container without network, with a read-only file system, without privileges | 20 seconds, 512 MB memory, 1 CPU |

The built-in Linux sandbox needs nothing to install: it uses functions of the Linux kernel (Landlock and seccomp). Nodestro checks once at the start whether they are there and work; *Settings → Sandbox* shows the result and, if it is not available, why. It does not protect against errors in the Linux kernel itself and does not hide whether a file exists elsewhere; Docker remains available as an alternative.

You choose the sandbox in the [settings](/docs/einstellungen#sandbox); *Automatic* picks it for you. Docker must be installed and running ([Installing Docker](/docs/einstellungen#sandbox-docker)); otherwise tests and calls of tools that need it fail. On macOS Nodestro also has an experimental sandbox; it is shown in the settings but not used until it has been independently reviewed. If a call exceeds the time limit, it counts as an error and the process is stopped.

## Trust and isolation {#vertrauen}
<!-- keywords: trust, untrusted, origin, ai-generated, docker required, isolation required, blocked, restricted, needs isolation -->

Nodestro decides by the **origin of the code** where it may run:

| Origin | Shown as | Without isolation (only *Python process*) | Built-in Linux sandbox or Docker |
|---|---|---|---|
| Built-in tools and integrations | *Built-in* | in the Nodestro process | in the Nodestro process |
| Written by you under *Write it yourself* | *Written by you* | runs, without isolation on this computer | runs (in the *Python process*, or isolated in Docker) |
| Created by AI (also after your approval), tool drafts of the AI architect, tools of unknown origin | *Needs isolation* | **blocked** | runs isolated |

The Python process is not a security boundary: code in it runs with your rights. Therefore Nodestro never runs AI-generated code there, and neither your approval nor a setting changes that; there is no switch to run it there anyway. Where the built-in Linux sandbox is available, Nodestro uses it automatically for such code; otherwise, in the *Automatic* mode, Docker while it is running. Without either:

- **Create with AI** does not start, and tool drafts cannot be tested or approved;
- agents with a tool that needs isolation cannot run; the workflow check reports it before the start;
- tools that need isolation cannot use third-party libraries.

Tools saved before this version, and all tools after restoring a backup, count as of unknown origin, also the ones you wrote yourself, because their origin was not recorded. With isolation they keep working. A new version of such a tool, or a copy of its code in a new tool, keeps that status.

## Connected services {#verbundene-dienste}
<!-- keywords: mcp, model context protocol, external service, connected services, server, token, approval, changed -->

With the **Model Context Protocol (MCP)** you connect external services, for example a document search or a ticket system. Their tools are available to agents like any other tool, but only after your review. You find them under *Tools → Connected services*.

1. **Connect a service:** name and address of the MCP endpoint (`https` only), an access token if needed. On the desktop, **Allow a local development server** permits `http://127.0.0.1` or `http://localhost` for a server you develop on this computer. The dialog checks the address while you type and says what is wrong; errors when saving stay in the dialog.
2. **Test the connection:** Nodestro negotiates the protocol version and lists the service's tools. Every tool starts as **New**.
3. **Review and classify:** you see the service's description, parameters and statements. This is **foreign text**: Nodestro shows it but never treats it as an instruction. Classify the tool: **Read only**, **Changes data** or **Deletes or destroys**. The service's statement is only a hint. "Changes data" is preselected, or "Deletes or destroys" if the service states that. If you choose a less strict class than the service states, a notice explains the consequences, and **Approve** only works once you switch on **I checked the tool: the less strict classification is right**.
4. **Approve:** only then do agents see the tool, as `mcp__<service>__<tool>`. You assign it to an agent like any other tool.

For now only tools you classify as **read only** can be used; tools that change data stay blocked until approval per call exists. A reading tool still receives everything the agent sends it: connect only services you trust with that data.

**Changes:** Nodestro keeps a fingerprint of every approved definition and checks it before every call. When the service changes a tool, it is **blocked**; runs that use it fail with a clear message. You see the change side by side (approved so far, offered now) and approve or reject it.

**Access tokens** are stored encrypted: on the desktop with a key from the operating system's keychain, on the server with the server key, separately per tenant. Without a secure key store a token is kept only until the app closes. Tokens never appear in workflows, exports or logs.

**Limits:** Nodestro never connects to internal, local or metadata addresses, checks every resolved address at the moment it connects and ignores proxy settings of the environment. On a server the operator allows addresses with `NODESTRO_MCP_ENDPOINTS`. Schedules, batches and published APIs use service tools only when the operator explicitly enables it. Nodestro does not know what external services cost; their cost shows as **unknown**, never as zero.

**Operation:** under *Operation* administrators see how many service calls are running, the operator's limits and, per service, calls, failures and the duration of the last call. A service that fails several times in a row is paused briefly.

## Signing in to a service {#mcp-anmeldung}
<!-- keywords: mcp, oauth, sign in, login, authorization, access, renew -->

Some services do not use a fixed token but a **sign-in (OAuth)**. Choose *OAuth* as the sign-in when you connect the service and save. Then click **Sign in**: Nodestro opens the service's sign-in page, you confirm the access there and return to *Tools → Connected services*. Test the connection to load the tools.

- Nodestro stores the access encrypted like a token and renews it itself. You see where you are signed in, with which permissions and when the access renews; the access itself is never shown.
- **Sign out** removes the stored access. When the service asks for a new sign-in, runs that use it fail with a clear message until you sign in again.
- On a server the operator sets up the public address of Nodestro; the return from the sign-in goes only there.

## A service's documents {#mcp-dokumente}
<!-- keywords: mcp, resources, documents, context, read -->

If a service offers **documents** (MCP resources), testing the connection shows one more tool, `resources/read`, marked *The service's documents*. You review it like any other tool: its description lists the documents an agent may read.

- Only the listed documents can be read; address patterns and other addresses are excluded.
- If the service changes its list, the tool is blocked until you have reviewed the new list.
- Contents are external data like every result of a service. Nodestro does not pass binary content such as images to the model.
- Nodestro does not let a service ask you questions, make its own model calls or access your folders.

## Local servers {#lokale-dienste}
<!-- keywords: mcp, stdio, local server, pypi, container, docker, packages -->

Besides remote services you can run a **local MCP server** from PyPI, for example a time or calculation service. Choose *Local server* as the kind, list the packages (one per line) and the module that is started with `python -m`.

1. **Review the packages:** Nodestro resolves the exact versions with hashes. You see them and approve them, as for the libraries of a tool. Nothing is installed before that.
2. **Installation:** the packages go into a separate container image.
3. **Test the connection:** the server starts in an isolated container and lists its tools. From here on, review and approval are the same as for remote services.

The container has **no network**, no access to your files, keys or other processes, and limited memory and processes. That is why local servers are only available when the Docker sandbox is used; servers that need the internet or Node.js cannot be run this way. A local server takes no token and no sign-in.

## Versions and deleting {#versionen}
<!-- keywords: version, delete, revoke, update, overwrite -->

If you save your own tool under a name that already exists, a **new version** is created; the previous one is revoked. Agents always use the current version. The library shows the version number.

**Delete** revokes a tool. Agents it is assigned to then report "Unknown tools" and cannot start until you remove the tool there or create it again. Built-in tools cannot be deleted. Below the description, **Used in** shows which workflows and library agents use the tool; the delete dialog names them before deleting. Published APIs are left out on purpose: they contain their own copy of the tool.

## Understanding tool errors {#fehler}
<!-- keywords: tool errors, failed, timeout, sandbox error, invalid input -->

In the execution, every tool call can be expanded: input, result, time and duration. Failed calls are marked. Typical causes:

- **Invalid input:** the model filled in parameters incorrectly. Improve the parameter descriptions in the docstring.
- **Expected tool error** (for example division by zero): the agent sees the message and can try again.
- **Timeout or crash in the sandbox:** check the tool under *Try it* with the same input.
- **Docker not reachable:** start Docker or switch to the *Python process* sandbox.

Whether unexpected errors end the agent is controlled by the [Tool errors](/docs/agenten#tool-fehler) setting.

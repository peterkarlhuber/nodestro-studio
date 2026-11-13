# Service connections

Some built-in tools reach an outside service, for example a web search, a mail server or a webhook. What they need for that (the address, settings and one secret) is a **service connection**. This chapter explains the tool specs, how you set up a connection and how an agent uses it.

## Tool specs {#tool-steckbrief}
<!-- keywords: tool spec, category, network, offline, connection type, time limit, call limit, filter -->

Every built-in tool has a **spec**: its category (*Compute*, *Data*, *Files*, *Web*, *Communication*), whether it needs the internet, whether it **works offline**, which kind of connection it needs, its time limit and how often an agent may call it in one run. The [Tools](/tools) page shows these facts as badges and lets you filter the built-in tools by them.

A call that takes longer than the time limit stops with an error; once a tool reaches its call limit, the agent gets an error for further calls and answers with what it has. In the strict offline mode, tools that need the internet are refused before the run starts. Nodestro's own built-in tools are listed in [Built-in tools](/docs/tools#eingebaut).

## Setting up a connection {#einrichten}
<!-- keywords: connection, service connection, web search, smtp, mail server, webhook, settings, provider -->

You manage connections under *Tools → Connections*. **Add connection** asks for the type (web search, mail server or webhook), the provider where the type offers several, a name and the type's settings, such as the server address and the sender address of a mail server. Addresses must use `https` (on your own computer, `http` to a local server is allowed) and must not contain a password; internal addresses are refused.

Every connection shows the hosts it may reach, derived from its settings, and the agents that use it. Only administrators can add, change, check or delete connections; everyone else sees them read-only. Nodestro records who changed which connection, never the values.

A connection that agents still use is not deleted right away: Nodestro names the agents and offers **Delete anyway**. Their check then reports the missing connection.

## The secret {#geheimnis}
<!-- keywords: secret, api key, password, signing key, vault, encrypted, session -->

A connection has at most one secret: an API key, a password or a signing key. You set it in the connection's details after saving. The secret is **written only**: Nodestro never shows it again, not in the interface, not in exports and not in logs. You only see **Secret set** or **No secret** and where it is kept.

Secrets are stored encrypted, like the access tokens of connected services: on the desktop with a key from the operating system's keychain, on a server with the server key, separately per tenant. Without a secure key store the secret is kept **for this session only** and must be entered again after a restart. **Replace secret** overwrites it, **Remove secret** deletes it.

## Checking a connection {#pruefen}
<!-- keywords: check, status, works, check failed, error code -->

**Check connection** tests the connection and shows the result: *Works*, *Check failed* or *Not checked*, with the time of the check and, on failure, the error code. For now the check of mail servers and webhooks only checks the settings; it does not contact the service yet. Changing the settings, the provider or the secret resets the status to *Not checked*. A connection that has not been checked successfully shows a warning in the check before a run.

## Using a connection in an agent {#zuweisen}
<!-- keywords: agent, inspector, tool settings, connection picker -->

When you assign a built-in tool that needs a connection, the agent's inspector shows a picker below the tools with the connections of the right type (see [Assigning tools](/docs/agenten#tools)). Without a chosen connection the agent check shows an error. The model never sees the connection, its settings or its secret; it only sees the tool.

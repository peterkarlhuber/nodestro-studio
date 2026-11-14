# Web search and reading web pages

Two built-in tools give an agent the web: `search_web` searches through a search service you choose, and `fetch_web_page` reads a single page. This chapter explains what they do, how you choose a search service, what it costs, where the tools are available and how you check which sources a run used.

## The two tools {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, web search, read page, internet, built-in tool -->

- **`search_web`** searches the web or news and returns hits with title, address, a short snippet and, where known, the date. It needs a **search service**, a service connection of the type *Web search* (see [Service connections](/docs/verbindungen)).
- **`fetch_web_page`** reads one page (HTML, text or PDF) and returns its text. It needs no connection. Internal network addresses, addresses with a user name or password and ports other than the standard web ports are refused.

You assign both like any other tool in the agent's **Tools** section (see [Assigning tools](/docs/agenten#tools)). The inspector marks them with the **Internet** badge. A good pair: the agent searches with `search_web` and reads the most promising hits with `fetch_web_page` before relying on more than a snippet.

## Choosing a search service {#suchdienst}
<!-- keywords: search service, provider, ddgs, brave, tavily, mojeek, searxng, test provider, api key -->

Under *Tools → Connections → Set up search service* you set up a search service. Nodestro chooses none for you: each card says honestly what the service needs and what to expect.

| Service | Key | Notes |
|---|---|---|
| DDGS | no | Free and without any guarantee. It uses other search engines, which may block it or change at any time. Not offered on a Nodestro server. |
| Brave Search | yes | Results must not be stored. About 5 USD per 1000 requests. |
| Tavily | yes | Billed by plan: enter your price per request. |
| Mojeek | yes | Operated in Europe. Billed by plan: enter your price per request. |
| SearXNG | optional | Your own server: enter its address. |
| Test provider | any | Offline test provider for trying things out: made-up hits, no internet. |

Check the terms and prices of a service yourself before you use it; Nodestro does not recommend any of them. Then assign the connection to `search_web` in the agent's inspector.

## Costs and limits {#kosten}
<!-- keywords: costs, price per request, budget, max calls, max results, allowed domains, blocked domains, advanced -->

A paid search costs money per request. Nodestro books each request with the service's price into the run's costs and checks the run budget before a paid request. Brave's documented price is used unless the connection names its own; Tavily and Mojeek need the price per request in the connection, otherwise `search_web` is not called. DDGS, SearXNG and the test provider cost nothing in Nodestro.

Under **Advanced** below each web tool in the agent's inspector you narrow what the agent may do: the maximum results per search, region, language and time range for searches, **allowed** and **blocked domains**, the maximum characters per page and the maximum calls per run. Empty fields keep the defaults; `search_web` allows at most 10 calls per run, `fetch_web_page` at most 20.

## Offline mode and servers {#offline-server}
<!-- keywords: offline, strict offline mode, server, server profile, operator, not available -->

Both tools need the internet. In the strict offline mode the check before a run refuses them. On a Nodestro server they are not offered: the check reports them, and every call is refused. The operator of the server can switch them on with `NODESTRO_WEB_TOOLS_SERVER=1`. DDGS is never offered on a server.

## Sources of a run {#quellen}
<!-- keywords: sources, web sources, source ledger, S1, cited sources, read, hit only, structured result -->

Every search hit and every page the web tools see is recorded in the run with an id (`S1`, `S2` …). The run's detail view shows them under **Web sources** with title, domain, time and status: **Read** when the page was read, **Hit only** when it only appeared in a search. Links open in a new tab. Only the addresses and titles are kept, never the page text, and only in that run.

An agent can be required to cite its sources: in a structured result, switch on **Cites web sources** for a text or list field (see [Output format](/docs/agenten#ausgabeformat)). Every value must then name a recorded source by its id or address. If the agent names a source it did not find, it gets one correction; if it still does, the step fails, so a made-up source is never delivered.

## The web research example {#beispiel}
<!-- keywords: web research, example, research agent, answer with sources, source list, retrieved, thorough -->

The **Web research with sources** example among the [example workflows](/docs/beispiele) answers a question with sources. When you copy it, choose one of your search services under **Services for the tools**, or set one up with **Set up search service**; nothing is preselected. Without a choice the copy is still created, and the check before a run reminds you to choose a connection in the agent.

The result holds the answer, the findings and contradictions with source ids such as `[S1]`, the gaps, the **source list** and the **retrieval time**. Nodestro writes the source list and the retrieval time after the step from the recorded sources, not the model. In the agent you set this for each text field under **Web sources**: **Cites web sources**, **Cites a source per statement [S1]**, **Source list (filled in)** or **Retrieval time (filled in)**. With **Thorough research** on the start form the agent searches and reads more (8 searches and 12 pages instead of 3 and 4).

## Page text is data {#sicherheit}
<!-- keywords: security, prompt injection, manipulation, external content, untrusted -->

Search hits and page texts come from strangers. Nodestro marks them for the model as external content that is data, not instructions. Pages can still contain attempts to manipulate the agent, for example hidden text that tells it to ignore its task or to send data somewhere. Give agents with web tools only the other tools they need, use [approvals](/docs/tools#freigabe) for tools that change things, and check results that rely on web sources before you act on them.

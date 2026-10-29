# Usage and costs

Nodestro counts the tokens of every request to an AI provider and estimates the costs. This chapter explains the kinds of tokens, how costs are calculated, how caching saves money and what the *Usage* page shows.

## Overview {#ueberblick}
<!-- keywords: usage, costs, tokens, statistics, consumption, billing -->

You see tokens and costs in four places:

- on every agent node after a run,
- in the editor's *Execution overview* (live),
- in the detail view of every execution, in total and per agent,
- on the **Usage** page, summarized by day, workflow and model.

All costs are **estimates based on list prices**; the billing of each provider is authoritative. Nodestro knows prices only for Anthropic models. For other models the costs stay **unknown** (shown as “–”): they are never counted as 0, and a budget only limits costs with a known price. Amounts are always in US dollars, with up to six decimal places and in the number format of the selected language (for example "$0.0042" in English, "0,0042 $" in German).

## Kinds of tokens {#tokens}
<!-- keywords: token, input, output, cache read, cache write, thinking tokens, requests -->

| Kind | Meaning |
|---|---|
| **Input** | Everything sent to the model that does not come from the cache: system prompt, task, conversation, tool results, knowledge. |
| **Output** | Everything the model writes, **including thinking** and tool calls. |
| **From cache** | Input read from the prompt cache; much cheaper. |
| **To cache** | Input written to the cache; slightly more expensive than normal input. |
| **Thinking** | The share of the output spent on thoughts (if the API reports it). |

**API requests** counts the individual calls to the API. An agent needs at least one request, plus one per tool round, and the quality check needs more for every check and revision. Hover over an agent's token count to see the breakdown.

## How costs are calculated {#kosten}
<!-- keywords: calculate costs, price, price list, estimate, mtok, web search costs, unknown price -->

For every request, Nodestro multiplies the kinds of tokens by the model's prices (in US dollars per million tokens) and adds fees for web searches ($10 per 1,000 searches). The sum of all requests gives the costs of the agent and the run; if one part is unknown, the sum is unknown too. The price list comes from the Orkexa library (Anthropic models):

<!-- widget: models -->

If an execution shows **"–"** instead of an amount, at least one request could not be priced (for example an unknown model). Nodestro then prefers to show no amount rather than one that is too low. Such requests count as 0 towards the budget.

## Caching {#caching}
<!-- keywords: caching, prompt caching, cache, save, ttl, 5 minutes, 1 hour, cache write -->

With **Prompt caching** (per agent under *Advanced*, on by default), the API remembers the unchanging beginning of a request. Follow-up requests with the same beginning read it from the cache:

- **Reading** from the cache costs only about 2.5 to 10% of the normal input price, depending on the model.
- **Writing** to the 5-minute cache costs 1.25 times the input price, to the 1-hour cache 2 times.

Caching pays off especially when an agent makes **several requests** (tool rounds, quality check, memory) or when the same workflow runs **several times in quick succession**. Knowledge in *In context* mode is at the beginning of the prompt and therefore benefits most.

**Cache duration:** the 5-minute cache is extended every time it is used. Choose *1 hour* only if there are often more than five minutes between requests.

How much came from the cache is shown in the token breakdown ("from cache", "to cache").

## The Usage page {#statistik}
<!-- keywords: usage page, statistics, chart, per day, by workflow, by model, period, agent test, assistant, origin -->

Choose the period at the top (7, 30 or 90 days). The page shows:

- **Key figures:** runs, other AI operations, API requests, tokens (input and output) and estimated cost.
- **Cost per day** as a bar chart; hover over a bar for cost and number of runs.
- **By workflow** and **By model** as tables with count, tokens, cost and share of the total cost.
- **By origin:** workflow runs, agent tests, agent design with AI, memory assistant and tool creation with AI.
- **Latest AI operations outside workflows** with time, model, tokens and cost.

Runs are assigned by their **start time**. In *By model* each agent counts towards the model in its configuration; the cost of its quality check is included. The other AI operations count towards the model they used. Every request is counted exactly once: workflow runs from the stored runs, everything else from a separate log. **Imported traces** are not included.

## Saving costs {#sparen}
<!-- keywords: save, cheaper, reduce costs, optimize, tips -->

- **Smallest suitable model:** Haiku for simple steps, Sonnet for most, Opus only where needed.
- **Lower the effort:** *Low* or *Medium* is enough for many tasks and saves thinking tokens.
- **Leave caching on.**
- **Use knowledge selectively:** *Search* or *On demand* instead of large files *In context*.
- **Limit max. tokens and tool rounds** so that an agent does not go astray.
- **Set a budget** so that a run never costs more than planned.
- **Use the quality check selectively:** every check and revision costs extra.

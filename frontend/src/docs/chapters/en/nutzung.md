# Usage and costs

Nodestro counts the tokens of every request to an AI provider and estimates the costs. This chapter explains the kinds of tokens, how costs are calculated, how caching saves money and what the *Usage* page shows.

## Overview {#ueberblick}
<!-- keywords: usage, costs, tokens, statistics, consumption, billing -->

You see tokens and costs in four places:

- on every agent node after a run,
- in the editor's *Run overview* (live),
- in the detail view of every execution, in total and per agent,
- on the **Usage** page, summarized by day, workflow and model.

All costs are **estimates based on list prices**; the billing of each provider is authoritative. Which prices apply is shown under [Model prices](/docs/nutzung#preise). If no price is known for a model, the costs stay **unknown** (shown as “–”): they are never counted as 0, and a budget only limits costs with a known price. Amounts are always in US dollars, with up to six decimal places and in the number format of the selected language (for example "$0.0042" in English, "0,0042 $" in German).

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

For every request, Nodestro multiplies the kinds of tokens by the model's prices (in US dollars per million tokens) and adds fees for web searches ($10 per 1,000 searches). The sum of all requests gives the costs of the agent and the run; if one part is unknown, the sum is unknown too. The Orkexa library does the calculation, with the price list that Nodestro keeps up to date. The prices of the models in the catalog:

<!-- widget: models -->

If an execution shows **"–"** instead of an amount, at least one request could not be priced (for example an unknown model). Nodestro then prefers to show no amount rather than one that is too low. If only part is unknown, the *Usage* page shows “at least …”: the sum of the known costs is then a lower bound. Only the known part counts towards the budget; in strict price mode such requests are not sent at all.

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

## Model prices {#preise}
<!-- keywords: model prices, price list, update prices, sync, litellm, stale, individual price, contract price, review, price change -->

**Settings → Model prices** lists every price with its status, quality, source and the time of the last check. Prices come from three sources, in this order:

1. the verified prices of the Orkexa library,
2. a reviewed price file the operator provides (`NODESTRO_PRICE_SNAPSHOT_FILE`),
3. the public price list of the LiteLLM project (turn it off with `NODESTRO_PRICE_LITELLM=off`).

Nodestro checks the prices every 24 hours and when you click *Check prices now*. If a price changes by more than 20 % and no official source confirms it, the new price list is not applied but waits for your **review**: *Apply* or *Reject*. Invalid prices (negative, implausibly high, wrong currency) are never applied.

| Status | Meaning |
|---|---|
| **Current** | Checked recently. |
| **Not checked for a while** / **Out of date** | Not checked for more than 48 hours or 7 days; costs are still calculated, but marked. |
| **Waiting for review** | A large change waits for your decision; until then the previous price applies. |
| **Individual** | A price you set. |
| **Unknown** | No price known; the costs stay unknown. |

You set **individual prices**, for example contract prices or corrections, with the pencil in the table. They win over the reference price; *Back to the reference price* makes the price list apply again. Every change is in the **change history**, and every stored usage remembers the price version and source it was calculated with (at the bottom of the *Usage* page).

**Without internet** the last valid prices stay in use; they only age into *Not checked for a while* and *Out of date*. With `NODESTRO_PRICE_SYNC=off` a price only changes when you start the check yourself.

**On a server** the operator maintains the reference prices: a worker checks them, and the operator decides reviews with `nodestro-server pricing approve` or `reject`. Workspaces see the reference prices read-only and can set their own individual prices.

## Price mode {#preismodus}
<!-- keywords: price mode, strict, standard, refuse unknown price, stale price -->

The **price mode** under *Settings → Model prices* decides what happens with missing or old prices:

- **Standard:** requests run; their costs show as unknown or as a lower bound, and stale prices are marked.
- **Strict:** a request to a model without a known price, or with a price not checked for more than 7 days, is refused before it costs anything. This keeps a budget even when a price is missing.

## Comparing with provider bills {#abgleich}
<!-- keywords: reconciliation, bill, billing, openai costs, anthropic cost report, admin key, deviation -->

Optionally, Nodestro compares its estimates with what **OpenAI** and **Anthropic** actually billed, per day and model (*Settings → Compare with provider bills*). This needs an **admin key** of the provider's billing API, separate from the normal API keys. The comparison only reads.

- **Desktop:** admin keys are not stored. Set `NODESTRO_OPENAI_ADMIN_KEY` or `NODESTRO_ANTHROPIC_ADMIN_KEY`, or enter a key for one comparison only.
- **Server:** the key is stored encrypted and never shown again.

A row **deviates** when the difference is more than 5 % **and** more than 1 US dollar (both thresholds can be changed). The last days count as *not final yet*, because providers complete their bills later. Days on which Nodestro itself does not know some costs show as *Estimate incomplete*.

## Saving costs {#sparen}
<!-- keywords: save, cheaper, reduce costs, optimize, tips -->

- **Smallest suitable model:** Haiku for simple steps, Sonnet for most, Opus only where needed.
- **Lower the effort:** *Low* or *Medium* is enough for many tasks and saves thinking tokens.
- **Leave caching on.**
- **Use knowledge selectively:** *Search* or *On demand* instead of large files *In context*.
- **Limit max. tokens and tool rounds** so that an agent does not go astray.
- **Set a budget** so that a run never costs more than planned.
- **Use the quality check selectively:** every check and revision costs extra.

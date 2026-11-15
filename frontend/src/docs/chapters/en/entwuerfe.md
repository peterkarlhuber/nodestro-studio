# E-mail and webhook drafts

Agents can **prepare** an e-mail or the payload of a webhook call, but they cannot send it. The draft lands in the run's result files; you check it and send it yourself. This chapter explains the two draft tools, where you find their drafts, how you check a connection with a test send and why Nodestro does not send anything by itself for now.

## Overview {#ueberblick}
<!-- keywords: draft, e-mail draft, webhook draft, draft_email, draft_webhook, does not send, communication, offline -->

Nodestro ships two built-in tools of the category *Communication*:

- **E-mail draft** (`draft_email`) writes an e-mail as an `.eml` file.
- **Webhook draft** (`draft_webhook`) writes the JSON payload of a webhook call as a `.json` file.

Both carry the badge **Does not send** on the [Tools](/tools) page and in the agent's tool picker. They need no internet and no connection, work offline and write at most **10 drafts per run**. Assign them to an agent like any other tool (see [Assigning tools](/docs/agenten#tools)) and tell the agent in its task when to write a draft, for example "Prepare a payment reminder to the customer for every overdue invoice".

## E-mail drafts {#e-mail}
<!-- keywords: draft_email, eml, recipients, to, cc, subject, html, attachments, sender address, from_address, mail program -->

An e-mail draft has its recipients (*To* and *Cc*, at most 50 together), a one-line subject (at most 200 characters), the text and, if wanted, an HTML version. From the HTML version Nodestro removes scripts, styles, images, forms and everything else except plain text, headings, lists, tables and links.

**Attachments** come only from the run itself: from the files it was started with and the result files it has written so far. A draft has at most 10 attachments and is at most 10 MB with them.

You set the **sender address** in the agent: once the tool is assigned, the agent's tools show an expandable area with the field *Sender address*. The model neither sees nor changes it. If the field stays empty, your mail program fills in the sender.

## Webhook drafts {#webhook}
<!-- keywords: draft_webhook, json, payload, json schema, schema, payload_schema, check -->

A webhook draft holds the JSON payload that is meant to go to a webhook later: an object or a list, at most 256 KB.

In the tool's expandable area in the agent you can store a **payload schema** as a JSON object (JSON Schema). The tool then writes only payloads that match it; otherwise the agent gets an error naming the places that do not match. Nodestro checks these keywords: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` and `maxItems`. A schema with other keywords is refused, so it never looks stricter than it is checked.

## Drafts in a run {#im-lauf}
<!-- keywords: result files, draft card, download, download .eml, open in mail program, not sent, preview -->

Drafts appear in the run's detail view under **Result files** as a card of their own, marked **Not sent** (see [Result files](/docs/dateien#ergebnisdateien)). The card of an e-mail draft shows the sender, the recipients, Cc, the subject, whether there is an HTML version, the attachments with their sizes and the size of the whole message. Nodestro does not show the text of the e-mail; open the file for that.

- **Download .eml** saves the draft.
- **Open in mail program** downloads the same file. Open it with your mail program, for example by double-clicking it. Many mail programs open it as a new message you can check, change and send; others show it as a received message that you can forward or copy from.

The card of a webhook draft shows the size and whether the payload was checked against a schema; **Download .json** saves it.

## Test send of a connection {#testversand}
<!-- keywords: send test, test send, test address, test_address, mail server, smtp, webhook, limit, five per hour, confirmation, check -->

Whether a connection to a mail server or webhook really works, you check under *Tools → Connections* (see [Service connections](/docs/verbindungen#pruefen)). **Check connection** contacts the service: with a mail server Nodestro signs in encrypted and signs out again, with a webhook it asks the address without sending a payload.

**Send test** goes one step further and sends a fixed test message:

- **Mail server:** a short test e-mail to the connection's **test address** and to no other. For this, enter your own address as *Test address* in the connection's settings.
- **Webhook:** a small, signed test call to the webhook's address, with the connection's method. Any answer with a 2xx status counts as success.

Before anything is sent, a confirmation dialog names exactly where the test goes. You send it yourself, and Nodestro records every attempt with your name in the connection's changes. Only administrators can test. Each connection allows **at most 5 test sends per hour**, and all connections together at most 20 per hour. On a Nodestro server, the check and the test reach a mail server only through the ports 25, 465, 587 and 2525.

## Why nothing is sent automatically {#kein-versand}
<!-- keywords: no sending, send automatically, approval per call, security, later version, agent does not send -->

An e-mail or a webhook call cannot be taken back. That is why in this version no agent and no workflow can send anything by itself: the draft tools have no way into the network, and the test send is only possible from the interface by a person, never from a run.

A later version will add sending from workflows, with an **approval for every single call**: a person sees the recipients and the content and decides before anything leaves. Until then, drafts are the safe way: the agent does the writing for you, the sending stays with you.

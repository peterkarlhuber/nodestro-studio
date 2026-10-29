# Nodestro Assistant

The Nodestro Assistant is a chat that helps you everywhere in Nodestro. It answers questions about using Nodestro based on this documentation, discusses workflows, agents, tools, memory, knowledge and runs that you explicitly show it, and on request prepares a handover to the Workflow Architect, the agent designer or tool generation. It never changes anything itself.

## Overview {#ueberblick}
<!-- keywords: assistant, chat, open, panel, sidebar, shortcut, ctrl j, wide, help -->

Open the assistant with **Assistant** at the top right of the header or with **Ctrl+J** (macOS: **⌘J**). It appears as a panel on the right; the same button or **Close** hides it again. **Wider** gives the chat more room; on small screens it lies over the page.

The chat stays as it is while you move between pages, and also after a reload. Answers appear live; Markdown with lists, tables and code blocks is formatted. While an answer is being written, you see what the assistant is actually doing: searching the documentation, reading sections, processing attachments, writing the answer or preparing a handover.

The assistant uses the **model for the assistants** from the [settings](/docs/einstellungen#modelle) and the access to its provider. If that provider is not set up, you can open the chat but not send a question.

## Questions about the documentation {#fragen}
<!-- keywords: question, documentation, sources, citation, link, invented, not documented, how to -->

The assistant answers questions such as "How do I test my agent?" or "What is the difference between knowledge and memory?" from this built-in documentation. It searches for the matching sections, reads them and links to them in its answer. Below the answer, the sections it read are listed as **Sources**; a click opens them.

The documentation is its only source of knowledge about Nodestro. If it cannot find something there, it says so explicitly instead of inventing a feature. General knowledge, for example about prompt design, is marked as such.

## Attaching objects {#anhaenge}
<!-- keywords: attach, attachment, context, paperclip, discuss, workflow, agent, tool, memory, knowledge, run, trace -->

So that the assistant can discuss a specific object, you attach it. There are two ways:

- **Discuss with assistant** in the view itself: in the workflow editor, in the agent inspector, in the agent library, on a tool, on a run, in a memory space and on a knowledge file.
- The **paperclip** in the input field opens a picker with all workflows, agent templates, tools, memory spaces, knowledge files and runs.

What the assistant receives depends on the kind:

| Kind | Content |
| --- | --- |
| Workflow | agents, connections, execution order, settings and the result of the [pre-run check](/docs/workflows#pruefung) |
| Agent | the complete configuration with tools, knowledge and configuration notes |
| Tool | code, tests, input schema, Python libraries with approvals, and where it is used |
| Memory | the list of files; the content only of files you explicitly select |
| Knowledge | name, description and type; the text only if you turn on **Include content** |
| Run | status, input, results, errors, tool calls, tokens and cost of every agent |

You can attach several objects at once and remove each one with **×**. An attachment stays active until you remove it and goes along with every further message. The attachments are always visible above the input field.

## Context suggestions {#vorschlaege}
<!-- keywords: suggestion, suggested, current workflow, automatic, confirm, ignore -->

While the assistant is open, it suggests the object of the current view as context, for example the workflow in the editor or the open run. Suggestions have a dashed border and are marked **Suggestion**; attached objects have a solid border.

A suggestion is not sent. Only **Add** turns it into an attachment; **Ignore** hides it for this chat. Suggestions come from the view you have open, without any AI call.

## Versions and unsaved changes {#versionen}
<!-- keywords: version, draft, unsaved, saved, changed, refresh context, outdated, deleted -->

When you attach an object, Nodestro records its state. Every message remembers exactly the states it was sent with; you see them below your message as **Sent with**. A click shows what the assistant actually received.

If an attached object changes afterwards, the attachment is marked **changed**. **Refresh context** uses the new state for the following messages. Earlier messages and answers stay as they are and keep their state from that time. If an object is deleted, the attachment shows **no longer exists**; the chat keeps working.

If the workflow in the editor has unsaved changes, you decide: **Saved version** sends the last saved state, **Unsaved draft** the current state of the editor. A draft is labelled **Draft** in the chat. If you keep editing afterwards, it is marked as changed too.

## Analyses {#analyse}
<!-- keywords: analysis, improve, review, find errors, optimize, reduce cost, executed, tested -->

With attached objects, the assistant can for example look for weak points in a workflow, improve a system prompt, explain why a run failed or point out missing tests for a tool.

It works only with the data you attached. It does not run or test anything, and it does not claim to. Whether an improvement works is for you to check, for example with the [agent test](/docs/agenten#agent-testen) or a new run.

## Handover to other functions {#uebergabe}
<!-- keywords: handover, apply, architect, implement, create agent, create tool, apply suggestion -->

If you explicitly ask for an improvement to be implemented, the assistant prepares a handover. It appears as a card in the answer. The button on the card opens the matching existing function, already filled in with the description:

- **[Workflow Architect](/docs/ki-architekt)**: revise an attached workflow or design a new one.
- **[Agent designer](/docs/agenten#ki-entwurf)**: describe a new agent for an attached workflow.
- **Tool generation** under *Tools → Create with AI*: let the coding agent write a new tool.

Nothing starts there until you start it, and you review the result as usual before anything changes. The assistant itself does not change workflows, does not run tools and does not apply anything without your confirmation.

## Managing chats {#verlauf}
<!-- keywords: history, chats, conversation, new chat, rename, delete, title, continue -->

**New chat** starts a new conversation, **History** shows all previous ones. There you open a chat to continue it, rename it or delete it. Nodestro creates the title from your first question, without an AI call.

Chats are stored locally in the Nodestro database and are part of [backup and restore](/docs/einstellungen#backup). They are never translated; a chat stays in the language it was written in.

## Privacy and security {#datenschutz}
<!-- keywords: privacy, security, api key, secret, password, masked, sent, prompt injection, instructions -->

Only what you write, what you attached and the documentation sections the assistant reads go to the model. The object you have open is never sent automatically.

API keys, passwords, tokens and similar values are replaced with placeholders before sending, including your stored API key. A note on the attachment shows when something was replaced. To see exactly what was sent, click an attachment or **Sent with**.

Very large objects are shortened; the attachment is then marked **partial**, and the assistant knows that it saw only part of it. Instructions inside attached content, for example in a knowledge file or a tool output, are treated by the assistant as data, not as instructions to itself.

## Cost {#kosten}
<!-- keywords: cost, tokens, usage, price, chat cost, billed -->

Every answer is one or more requests to the model. Below each answer you see its tokens and estimated cost, and the chat header shows the total for the chat. On the [usage page](/docs/nutzung), all requests appear under the source **Nodestro Assistant**, each exactly once.

For a cancelled answer, part of the cost has already been incurred; it is estimated and marked **estimated**.

## Cancelling and errors {#fehler}
<!-- keywords: cancel, stop, error, try again, retry, invalid key, model unavailable, connection -->

**Stop** cancels a running answer; what was written so far stays. If an answer fails, the assistant names the reason, for example a missing or invalid API key, an unavailable model, a broken connection or too much context. **Try again** repeats the last answer.

The chat is never lost. If Nodestro is stopped while an answer is being written, the answer is marked as interrupted after the restart.

## Language {#sprache}
<!-- keywords: language, english, german, answer language, translate -->

The assistant answers in the interface language (see [Language](/docs/einstellungen#sprache)) unless you explicitly ask for another one. It reads the documentation in the same language. Technical identifiers such as tool names, field names and code stay in English.

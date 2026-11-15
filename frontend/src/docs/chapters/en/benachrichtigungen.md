# Notifications

Nodestro tells you at the **bell** in the top bar when something needs your attention: a run failed, a step waits for your approval, or an agent wrote you a message. Notifications stay inside Nodestro; nothing is sent by e-mail.

## What notifies {#ueberblick}
<!-- keywords: notification, bell, event, failed run, approval, budget decision, quality check, finished run, inbox -->

A notification is created for these events of a run:

- **A run fails**: the run ended with an error.
- **A step waits for approval**: an approval step waits for a person's decision.
- **A run waits for a budget decision**: the run's budget is used up and someone has to raise it or end the run (see [Budget decisions during a run](/docs/workflows#budget-freigabe)).
- **A quality check fails**: a result did not pass its check, for example by a judge (see [Quality check](/docs/agenten#qualitaet)).
- **A run finishes**: every finished run, successful ones too.

In addition, an agent can write you a short message with the tool **Message to me** (see below).

## Rules per workflow {#regeln}
<!-- keywords: notification rules, workflow settings, events, default, failed runs, approvals, switch off -->

Each workflow decides which of its events notify. Open the workflow in the editor, click an empty spot on the canvas so that no step is selected, and find the **Notifications** section in the workflow settings (see [Workflow settings](/docs/workflows#einstellungen)). Tick the events you want; the rules are saved with the workflow, like its budget and limits.

By default a workflow notifies about **failed runs** and **steps waiting for approval**. Workflows saved before notifications existed get this default too. Untick every event to switch notifications off for a workflow. Notifying about every finished run is useful for rare, important runs; for frequent ones it quickly becomes a lot.

## Who is notified {#empfaenger}
<!-- keywords: recipients, members, starter, access, who gets notified, person who started -->

In the same section you choose who gets the notifications:

- **Everyone with access**: everyone who may see the workflow. On the desktop app that is you.
- **Only the person who started the run**: others with access are not notified.

## The bell {#glocke}
<!-- keywords: bell, unread, counter, badge, mark as read, mark all as read, open run, load more, keyboard, escape -->

The number on the bell counts your unread notifications. Click the bell (or focus it and press Enter) to open the list, newest first. Each entry shows what happened, the workflow and when. Unread entries are highlighted.

- **Open run** opens the run's detail view and marks the entry as read (see [The detail view](/docs/ausfuehrungen#details)).
- **Mark as read** (the check mark) marks a single entry, **Mark all as read** all of them.
- **Load more** shows older notifications.
- Escape closes the list and returns to the bell.

Nodestro reads the unread count about once a minute while the window is visible, and the whole list each time you open it. Screen readers announce new notifications politely.

## Messages from agents {#agenten-nachrichten}
<!-- keywords: notify_user, message to me, agent message, tool, level, title, three messages, plain text, from an agent -->

The built-in tool **Message to me** (`notify_user`) lets an agent send you a short message with a title, the text and a level (info, success, warning or error). Assign it to an agent like any other tool (see [Assigning tools](/docs/agenten#tools)) and tell the agent in its task when to use it, for example "Send me a message when you find a contract with a notice period under 30 days".

- An agent can send **at most 3 messages per run**. Further attempts are refused, and the agent learns about it.
- The message is shown as **plain text**: no formatting, no clickable links. It is clearly marked **From an agent**, because a model wrote it. Treat it like any other model output.
- The tool sends nothing outside Nodestro and works offline.

## Storage and privacy {#aufbewahrung}
<!-- keywords: retention, 90 days, delete, e-mail, webhook, privacy, server, platform inbox, inside nodestro -->

Notifications are kept for **90 days** and then deleted, read or not.

Nothing leaves Nodestro: there is no e-mail, no webhook and no push message. Sending notifications elsewhere is planned for a later version.

On a Nodestro server connected to the platform's inbox, the bell shows that inbox instead of Nodestro's own. Its notifications may arrive in English with their own wording; the rules per workflow apply the same way.

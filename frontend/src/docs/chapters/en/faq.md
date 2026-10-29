# Troubleshooting and FAQ

Here you find solutions for common messages and answers to typical questions.

## Common errors {#haeufige-fehler}
<!-- keywords: errors, problem, solution, message, troubleshooting, does not work, broken -->

| Message or symptom | Cause | Solution |
|---|---|---|
| "No API key for …" | The model's provider is not set up. | Enter the key under *Settings → AI providers* or set the provider's environment variable, for example `ANTHROPIC_API_KEY`. |
| "Start workflow" is greyed out | There are problems in the workflow or a run is active. | Hover over the button; the problems are listed in the inspector when nothing is selected. |
| "The workflow contains a cycle …" | A connection leads back. | Delete the connection that leads back. |
| "Unknown tools: …" | An assigned tool was deleted or is missing after an import. | Remove the tool in the inspector or create it again in the tool library. |
| "… does not allow a forced tool …" | The model does not allow a forced tool. | Set tool choice to *Automatic*. |
| "Thinking cannot be turned off for …" | The model does not allow thinking *Off*. | Set thinking to *Model default* and lower the effort. |
| "'Only between tool calls' is supported only by …" | Only Sonnet 5.5 up to effort *High* supports this. | Adjust the model or the effort. |
| "This way of showing thoughts does not fit the thinking setting" | *Show thoughts* does not fit thinking *Off* or *Only between tool calls*. | Change one of the two settings. |
| "Invalid field name …" | A field name in the output format contains special characters or starts with a digit. | Use only letters, digits and `_`. |
| "Citations cannot be combined with a structured output format" | Both options are on. | Switch one of them off. |
| "Example messages must …" | The examples do not alternate properly. | Start with the user, alternate, end with the assistant. |
| "Persistent memory needs a memory space" | Memory *Persistent* without a space. | Choose or create a space. |
| Docker errors with tools | Docker is selected but not running. | Start Docker or choose the *Python process* sandbox. |
| Agent was *skipped* | A predecessor failed. | Look at the first red agent in the timeline and fix it. |
| Result contains "{{Name}}" literally | The placeholder does not match any direct predecessor (for example after renaming). | Insert the placeholder again using the buttons below the task. |
| Trace import: "This is an exported workflow …" | The file is a workflow export. | Open it under *Workflows → Import*. |

Messages appear in the interface language; **Technical details** shows the server's original text. Errors that only occur during a run are explained under [Interpreting errors](/docs/ausfuehrungen#fehler).

## Frequently asked questions {#fragen}
<!-- keywords: faq, questions, answers, how can i, why -->

**Does editing workflows cost anything?**
No. Costs only arise for runs and for the AI assistants (designing agents, creating tools, suggesting memory). The check in the editor, the knowledge search and *Try it* for tools are free.

**Why does the cost estimate differ from my invoice?**
Nodestro calculates with list prices. Discounts, taxes, other platforms or special conditions are not taken into account.

**Can an agent see the result of an agent that is not directly before it?**
No, only its direct predecessors. Connect it to the agent you want as well; you can always reach the original input with `{{run.input}}`.

**Can I branch a workflow depending on the result?**
Yes, with a [decision](/docs/verzweigungen#entscheidung): it checks the result with fixed rules and opens the matching branch. There are no loops.

**How do I transfer a workflow to another computer?**
With *Export* and *Import*. You have to create knowledge files, memory spaces and your own tools there separately.

**How do I show someone a run?**
With *Export trace*. The other person opens the file under *Executions → Import trace*, without running the workflow again.

**Is my API key stored in the workflow export or the trace?**
No. The keys are only in environment variables or in the local database and go neither into exports nor into backups.

**Why does an agent not see a knowledge file?**
Check whether it is assigned in the inspector and which mode is selected. Images and scanned PDFs cannot be found in *Search* mode.

**What happens to running runs when I stop Nodestro?**
They are cancelled. Whatever was saved up to that point is kept as an execution.

**Does switching the language change my agents?**
No. The language only changes the interface. Agents, prompts and results stay as they are, and agents keep answering in the language of their prompts. See [Language](/docs/einstellungen#sprache).

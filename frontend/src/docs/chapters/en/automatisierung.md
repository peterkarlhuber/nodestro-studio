# Automation

Under *Automate & test* in the navigation, workflows run without clicking *Start*: **batch runs** handle many inputs at once, **test series** measure a workflow's quality and **schedules** start workflows regularly. Every single run is an ordinary run with trace, budget and usage; approvals wait for a person as always.

## Batch runs {#stapel}
<!-- keywords: batch, many inputs, csv, excel, xlsx, json, table, columns, mapping, export -->

A **batch run** runs a workflow for every row of a table, for example for 200 customer requests.

1. On the **Batch runs** page choose *New batch run* and pick the workflow.
2. Upload a table: CSV (comma or semicolon), Excel (XLSX) or JSON (a list of objects), at most 1,000 rows and 10 MB.
3. Map every column to a field of the [input form](/docs/verzweigungen#eingabeformular) or to the free input, or ignore it. Nodestro suggests matching mappings.
4. The preview counts valid and invalid rows and shows the estimated cost. Invalid rows do not run.
5. Start. The detail page shows progress, cost and every row with its status and a link to its run.

A batch can be **paused** (running runs finish, new ones do not start), **continued** and **cancelled**. An error in one row does not stop the others. If Nodestro stopped during a batch, it is *interrupted* and can be continued. You download the results as CSV or JSON.

## Limits, cost and own tools {#grenzen}
<!-- keywords: limits, cost limit, failure limit, concurrency, parallel, estimate, cost, rate limit, own tools -->

- **At the same time:** how many runs run in parallel (1 to 8). More is faster but may hit the API's rate limits.
- **Cost limit (USD):** the batch stops as soon as the total is reached. The [budget per run](/docs/workflows#budget) applies to every single run as well.
- **Failures at most:** the batch stops after that many failed runs.
- **Estimated cost:** from the latest successful runs of the workflow, times the number of runs. If there is no successful run yet, Nodestro only names the maximum from budget times count.
- **Own tools** that may act outside Nodestro (such as sending messages) would be called in every run. You have to confirm this explicitly before the start.
- Runs that wait for an **approval** take no slot; they continue as soon as someone decides.

The cost of all runs appears under [Usage](/docs/nutzung) as always, each counted once.

## Test series {#testreihen}
<!-- keywords: test series, benchmark, test case, check rule, quality, regression, expected result, passed -->

A **test series** belongs to a workflow and holds fixed **test cases**: an input (form values, free text, files), **check rules** for the result and optionally criteria for an [AI rating](/docs/automatisierung#ki-bewertung).

- Check rules use the same comparisons as [decisions](/docs/verzweigungen#regeln), for example `category equals complaint` or `total greater than 100`. They are exact and cost nothing.
- *Run test series* picks the workflow version (current state or an older one), limits as for batch runs, and whether the AI should rate.
- A case has **passed** when its run succeeded, every check rule holds and, if rated, the AI passed it.
- The evaluation shows pass rate, AI rating, tokens, cost and duration, plus the details of every case.

A test series has at most 200 cases. Invalid cases (such as a required field without a value) are reported before the start and skipped.

## Test case from a failed run {#testfall-aus-lauf}
<!-- keywords: test case from run, failure as test, regression, failed, add, redacted -->

When a run has failed, click **Add as test case** in its details. Nodestro proposes a test case with the same input: form values, free text and files.

- API keys, tokens and passwords are always replaced by placeholders such as `[API_KEY_1]`, and personal data (e-mail addresses, phone numbers, IBANs …) too while the switch is on. Detection is pattern-based and does not find everything; check the preview.
- Files are used as they are stored, not copied and not redacted. Deleted files are left out and named, as are values that no longer fit the current form.
- Nothing is saved until you pick a test series (or create a new one) and click **Add to test series**. The run itself stays unchanged.
- The case keeps its **origin** (run, error, what was replaced) and shows it in the test series. You add checks and criteria there.

When a new case changes a test series that a [release gate](/docs/api-und-export#freigabe-gate) uses, the series must run again before the next release.

## AI rating {#ki-bewertung}
<!-- keywords: ai rating, judge, llm as judge, criteria, rating, score -->

For cases with criteria (one per line), a separate AI model rates the result, optionally against an **expected result**. The default is the model of the AI assistants; in the test series you can pick a model of your own from any provider that is set up.

The verdict is marked as an **AI rating** everywhere and does not replace a check rule. It costs extra; that cost appears in the evaluation and under [Usage](/docs/nutzung) as *AI rating of test series*.

## Comparing test runs {#testreihen-vergleichen}
<!-- keywords: compare, compare versions, better, worse, regression, before after -->

Pick two runs in the list of test runs and click *Compare*. The table shows the pass rate of both runs and, for every case, whether it passed, marked as **better**, **worse**, **same** or **changed**.

This is how you check after every change to agents, prompts or tools whether the workflow got better, and how you test an older [version](/docs/workflows#versionen) against the current state.

## Comparing models {#modelle-vergleichen}
<!-- keywords: compare models, other model, cheaper, faster, model choice, variant -->

Whether a cheaper or stronger model is good enough for an agent, you check with the same test series. In the start dialog, switch on **Test other models** and choose another model for single agents. The test cases and the AI judge stay the same, and the saved workflow does not change.

Such a run needs a **cost limit** under [Limits](/docs/automatisierung#grenzen), because earlier runs used other models and say nothing about the cost. In the list it carries the label **Model comparison** and names the replaced models. Then compare it with a run of the saved version. It does not count as the test result of that version, because it tested a variant. If a model fits, set it in the agent itself.

## Model choice from measurements {#modellwahl-nach-messwerten}
<!-- keywords: model choice, recommendation, cheapest model, policy, measurements, pass rate, apply model -->

Below the test runs of a series, **Model choice from measurements** shows which model an agent should use by your rule. Nodestro rates nothing on its own: only what finished test runs measured counts.

- **Goal:** lowest cost, shortest run time or highest pass rate. Ties go to the higher pass rate, then the model name.
- **Minimum pass rate:** empty means another model must pass at least as many cases as the current model did in its measured run.
- **Must not lose a case:** when on, a model drops out if it fails a case the current model passed.
- **Unknown costs** never count as 0. A model without known costs cannot win the goal *lowest cost*.

A measurement is only the newest finished run per model with the same workflow state (apart from the models; positions and names do not count), the same test cases and AI rating, the same models in every other agent, and a result for every case. When a prompt or a test case changes, run the tests again. The list names which runs were not used and why. Without a matching measurement the current model stays.

*Use* sets the recommended model in the agent and saves the workflow as a new [version](/docs/workflows#versionen). Nothing changes before that. The AI rating is shown, but it only counts through whether cases passed.

## Schedules {#zeitplaene}
<!-- keywords: schedule, cron, regular, daily, weekly, monthly, hourly, time zone, missed -->

A **schedule** starts a workflow once or regularly, with fixed inputs (form values, text, files).

- **Rhythm:** once, every few hours, daily, on chosen weekdays, or monthly on a day (in shorter months on the last day).
- **Time zone:** times apply in the chosen time zone, also across daylight saving changes. A time that does not exist when clocks go forward runs one hour later; one that occurs twice when clocks go back runs once.
- **Next starts:** the dialog shows the next dates before you save.
- **Off until switched on:** a new schedule is off. When you switch it on, Nodestro checks everything a run needs: the workflow, the inputs, a [budget per run](/docs/einstellungen#budget) and the confirmation of own tools. If it does not pass, it stays off and the reason is shown.

Schedules only run while Nodestro runs. Times that passed while Nodestro was off count as **missed**: *Skip* ignores them, *Catch up once* starts a single run at the next start, however many were missed. Runs from schedules carry the origin *Schedule* in [Runs](/docs/ausfuehrungen#liste).

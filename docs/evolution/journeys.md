# Journey baseline (UX-J)

> Part of the product evolution plan, see [README.md](README.md). Measured on 2026-10-31 on studio master
> `25a7b7f` (after UX-1 to UX-3) plus the link fix of this step.

## What it measures

`frontend/e2e/journeys.mjs` walks through the six user tasks of the draft plan in Chromium. It runs against
`tests/e2e_journey_server.py`, a studio whose model answers every request: text agents get a fixed text,
structured agents get a filled sample, and quality checks pass. No provider key is needed and nothing is paid
for. `scripts/e2e.sh journeys` runs it, and so does CI as part of the browser suites. The report
(`journeys.json`, `journeys.md`) is written to `$JOURNEY_REPORT`. CI uploads it as the `journeys` artifact.

For each journey it counts what the interface asks of a person until the goal is reached:

- **Actions:** clicks, typing into a field (one action per field), choosing a file or an option, key presses.
- **Dialogs:** dialogs that open (`<dialog open>` and `role="dialog"`).
- **Page changes:** route changes inside the studio.
- **Controls at goal:** visible interactive controls in the page content or the open dialog where the goal is
  reached. The navigation bar is not counted.

A journey fails only when its goal cannot be reached. The counts are reported, not asserted. A change that makes
a path longer therefore shows up in the report and in review, not as a red build.

## What it cannot show

- It measures interface cost only. The script knows every label in advance; it never searches, hesitates or
  takes a wrong turn.
- It says nothing about comprehension, confidence or satisfaction. That needs moderated task tests with 3–5
  people (decision D7). Until those happen, every statement below about difficulty is a hypothesis.
- It runs in Chromium with the German interface in a 1500×940 window. Other languages, narrow windows and
  keyboard-only use can differ.
- The model answers instantly and never fails. Waiting for a real provider and failing runs are not covered.
- Seconds depend on the machine and are informational only.

## The journeys

| Id | Draft user task | Path the script takes | Goal |
| --- | --- | --- | --- |
| J1 | "I want a structured evaluation of an invoice/PDF." | Start page → *All 24 examples* → search "Vertrag" → preview *Contract review* → copy → *Start workflow* → choose a PDF → *Start* | the run succeeds; its result is in the execution overview |
| J2 | "I want to take an example, understand it, change it and start it." | Featured *Blog article* → preview → copy → select the first agent → extend the system prompt → *Save* → *Start workflow* → *Start* | the changed prompt is saved and the run succeeds |
| J3 | "I want to give an agent knowledge without learning technical concepts first." | Open a workflow → select the agent → open *Knowledge* → link *Knowledge* → upload a file → back to *Workflows* → workflow → agent → *Knowledge* → tick the file → *Save* | the file is assigned and saved |
| J3b | the same task, after UX-K | Open a workflow → select the agent → open *Knowledge* → *Upload file* → *Save* | the file is stored in Knowledge, assigned and saved |
| J4 | "My workflow fails: where is the problem and how do I fix it?" | Open a workflow whose start is blocked → the problem in the editor's list → *Problems in: Quality check* → *Add criterion* → type it | the start is enabled again |
| J5 | "I want to set an advanced property precisely without fighting a simplified UI." | Open a workflow → select the agent → open *Advanced* → set *Max tokens* → *Save* | the value is saved and the closed summary names it |
| J6 | "Can I trust this workflow version on quality, cost and allowed actions?" | Open the copied contract review → *Test series* → its series → *Run test series* → confirm → *Workflows* → workflow → *API & Export* | the test results and the release pre-check have been seen |

There is no invoice example, so J1 uses the contract review example, which reads an uploaded PDF and returns
structured output. In J4 the blocking problem is a design-time one: a quality check without criteria. A model that
answers everything cannot make a run fail.

## Baseline

| Journey | Actions | Dialogs | Page changes | Controls at goal |
| --- | ---: | ---: | ---: | ---: |
| J1 PDF to structured result | 7 | 2 | 2 | 46 |
| J2 change and start an example | 7 | 2 | 1 | 66 |
| J3 give an agent knowledge | 10 | 0 | 4 | 64 |
| J3b give an agent knowledge, upload in the inspector (UX-K) | 5 | 0 | 1 | 66 |
| J4 find and fix a blocking problem | 5 | 0 | 1 | 66 |
| J5 set an advanced property | 5 | 0 | 1 | 86 |
| J6 check quality and release state | 8 | 2 | 5 | 15 |

Two runs on the same machine, one with fresh data and one with existing data, gave identical counts.

## Observations

**V** means verified in the run. **H** means a hypothesis until moderated tests.

- **V, fixed in this step.** In J3 the *Knowledge* section says "No files yet. Upload them under Knowledge", but
  the link was empty and invisible. Seven translated hints marked their link as `<link>`, which `<Trans>`
  treats as a void HTML element. The markup is now `<a>`, and a language-file test rejects void element names.
- **V.** J3 is the longest journey: 10 actions and 4 page changes. Knowledge can only be uploaded on the
  Knowledge page. Giving a new file to an agent therefore means leaving the editor and finding the workflow and
  the agent again. Uploading straight from the agent's Knowledge section would be the obvious candidate, but it
  changes where files are created. It needs its own decision before UX-4/UX-6. **H:** this is where new users
  give up.
- **V.** J6 needs 5 page changes. The test results and the release pre-check live on different pages. The
  publish dialog does not show the latest test result. This confirms the gap that Q-1 closes.
- **V.** J5 ends on 86 visible controls with *Advanced* open. The summary names the change once the section is
  closed (UX-2), so the dense view is needed only while editing. **H:** whether that density hinders experts
  is open.
- **V.** J4 takes 5 actions thanks to the problem list and the *Problems in* link (UX-2). This baseline was taken
  after UX-2, so it does not show the earlier state.

## After UX-K

J3b walks J3's task through the upload in the agent's *Knowledge* section (UX-K, [ux-k.md](ux-k.md)): 5 actions
and 1 page change instead of 10 and 4, measured on the same server. J3 still takes its old path through the
Knowledge page, which keeps working, and stays at 10 actions and 4 page changes. The upload button adds one or two
visible controls wherever the Knowledge section is open (J3 65, J5 88 instead of 64 and 86). As before, this is
interface cost, not evidence that people find the button.

## Deviation from the plan

The plan put UX-J right after UX-1, so that UX-2 to UX-4 would be measured against it. It landed after UX-3, so
this baseline already includes UX-1 to UX-3. Those three steps fixed visibility, not path length. Their effect is
not visible in these counts and has not been reconstructed. UX-4 (entry points) and UX-8 will be compared with
this baseline.

## Comparing later

Run `scripts/e2e.sh journeys` with `JOURNEY_REPORT` set, or download the `journeys` artifact of a CI run. Put the
table next to the baseline above. A journey whose path changes on purpose must change its script in the same pull
request, and the pull request names the old and new counts.

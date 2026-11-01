# Example workflows

Nodestro comes with 24 ready-made multi-agent workflows, one for each typical field of application. Every example contains agents with system prompts, the connections, a prepared test task with invented data and a clearly described result. This chapter explains the gallery, copying and adapting, and describes each example on its own.

## The gallery {#galerie}
<!-- keywords: examples, templates, gallery, library, featured, categories, start page -->

The gallery is on the **Workflows** page below your own workflows, clearly separated from them. It shows a few featured examples and the six categories. **View all 24 examples** opens the full gallery, also in the workflow area.

In the full gallery you search by name, field and description and filter by category. Each card shows the field, name, description, number of agents, level and pattern. Examples from sensitive fields carry the badge **Needs expert check**. The [search](/docs/start#suche) finds examples too.

## Preview and copy {#uebernehmen}
<!-- keywords: preview, copy, template, unchanged, free -->

Clicking a card opens the **preview**: the flow as a diagram, each agent with its role, model, tools and the results it receives, the guide and the test task. The preview stores nothing and calls no model.

**Copy to my workflows** creates your own workflow and opens it in the editor. The copy is independent: you can change everything, and the template always stays unchanged. If you copy an example twice, you get two separate workflows. The copy starts with version 1 in the [version history](/docs/workflows#versionen).

If **Add the test cases as a test series** is ticked (the default), the copy also gets a [test series](/docs/automatisierung#testreihen) with the prepared test cases; the sample files they need are stored as input files of the copy. Copying never starts a run, never creates a [schedule](/docs/automatisierung#zeitplaene) and never publishes an [API](/docs/api-und-export#veroeffentlichen); you decide on those later yourself.

Examples are never created automatically; only what you copy appears among your workflows. Costs only arise when you run a copy. The examples use Anthropic models; that [provider set up](/docs/einstellungen#anbieter) is all they need, and you can switch a copy's models to another provider at any time. No example requires other services, accounts or paid data sources.

## Languages {#sprachen}
<!-- keywords: language, translation, german, english, copy, prompts -->

The gallery and the preview appear in the interface language. The copy's names, descriptions, system prompts, tasks and test task are created in the language you choose under **Language of the copy** in the preview; it defaults to the interface language.

A saved copy stays in its language, even if you switch the interface later. Technical identifiers such as the field names of structured output and the names of tools are English in every language.

## Patterns and roles {#muster}
<!-- keywords: sequential, parallel, review, judge, quality check, roles, structure -->

The examples use only as many agents as the task needs, usually three or four.

- **Sequential:** the agents work one after another; each builds on the result of the one before.
- **Parallel:** several agents work on the same input at the same time, and another one combines the results.
- **Branching:** a decision or an approval picks the path; not every agent runs in every run (see [Branches and approvals](/docs/verzweigungen)).
- **Review:** a reviewing agent checks the work of the others and often delivers structured output with fixed fields.
- **Quality check:** for some agents a built-in [quality check](/docs/agenten#qualitaet) rates the result against fixed criteria and has it revised if needed.

The cards in the gallery also show which building blocks an example uses: decision, approval, input form, sub-workflow, result files, files as input, knowledge proposals or memory.

The roles in the preview describe what an agent does: research, analysis, planning, review or writing. Calculations use the built-in tools such as the calculator and date arithmetic; they cost nothing extra.

## Test data {#testdaten}
<!-- keywords: test task, test data, synthetic, invented, sample data -->

Every test task starts with the note **SYNTHETIC SAMPLE DATA**. Companies, people, figures and rules are invented and only meant for trying things out. After copying, the test task is the suggested input of the start node; replace it there with your own data.

## Sample files and test cases {#beispieldateien}
<!-- keywords: sample files, test cases, test series, file, upload, pdf, excel, word, zip -->

Many examples have an optional [file field](/docs/datei-eingaben#datei-felder), for example for a downtime log as Excel, offers as PDF and Word or a contract as a Word file. The preview offers small, fictional **sample files** to download that match the test task. You can put them into the file field when you start the copy and try out how the example works with files. Without a file, the agents work with the text as before.

Every example also has **test cases**, for example one case with text, one with a sample file and, for examples with a decision, one case for each path. Each test case contains checks on fields of the result. Copied test cases appear as a test series of the copy; they only run when you start the test series, and then cost the same as normal runs.

The run stores result files such as PDF, Word or Excel under [Files](/docs/dateien). If an agent proposes findings for knowledge, only what you explicitly adopt is stored.

## Sensitive fields {#sensible-bereiche}
<!-- keywords: finance, law, hr, administration, review, liability, advice, caution -->

Six examples concern finance, law, HR or administration: financial analysis, recruiting, contract review, household budget, property comparison and citizen enquiry. Their agents get an additional instruction in the system prompt to name uncertainties and list the points a qualified person must check.

The results are working aids, not advice and not a decision. Check them professionally before you use, send or publish them.

## Adapting examples {#anpassen}
<!-- keywords: adapt, change, own data, knowledge, model, prompt -->

- **Your own data:** replace the test task in the start node or enter your own input when you start.
- **Your own files:** put documents for a single run directly into the file field when you start; you do not need a knowledge collection for that.
- **Knowledge:** upload documents you need permanently as [knowledge](/docs/wissen#modi) and assign them to the matching agent.
- **Prompts and tasks:** the tasks refer to their predecessors with [placeholders](/docs/workflows#platzhalter). If you rename an agent, adjust the placeholders.
- **Current data:** for live information you can add the web search [server tool](/docs/tools#server-tools); it costs extra per search.

The sections below name concrete adjustments for each example.

<!-- examples:start -->

## All 24 examples at a glance {#uebersicht}

Every example is in the gallery and has its own section below.

| No. | Example | Field | Agents | Pattern |
|---|---|---|---|---|
| 1 | Analyse machine downtime | Manufacturing and industry | 3 | branching |
| 2 | Investigate a complaint with 8D | Quality management | 5 | branching |
| 3 | Compare supplier offers | Logistics and purchasing | 3 | parallel |
| 4 | SWOT strategy for a small business | Companies and SMEs | 4 | parallel |
| 5 | Financial analysis | Finance and investments | 3 | sequential |
| 6 | Blog article | Marketing and content | 3 | sequential |
| 7 | Prepare a tailored offer | Sales | 3 | sequential |
| 8 | Answer customer enquiries | Customer service | 4 | branching |
| 9 | Advertise a job and prepare interviews | Human resources | 5 | branching |
| 10 | Turn a research question into hypotheses | Research and development | 3 | adaptive (orchestration) |
| 11 | Code review with tests | Software development | 3 | parallel |
| 12 | Structure a contract and find check points | Legal and administration | 5 | branching |
| 13 | Create a personal learning plan | Education and training | 4 | parallel |
| 14 | Check a household budget and save | Private individuals – finances | 3 | sequential |
| 15 | Plan a personal trip | Private individuals – travel | 4 | branching |
| 16 | Evaluate a business idea | Self-employed and founders | 2 | adaptive (orchestration) |
| 17 | Develop a social media strategy | Influencers and content creators | 3 | sequential |
| 18 | Compare property offers | Real estate | 3 | parallel |
| 19 | Analyse construction delays | Construction | 3 | adaptive (orchestration) |
| 20 | Develop and cost a menu | Hospitality | 3 | sequential |
| 21 | Crop planning for a farm | Agriculture | 3 | sequential |
| 22 | Plan a club festival | Clubs and associations | 4 | parallel |
| 23 | Develop a fundraising campaign | Non-profit organisations | 3 | branching |
| 24 | Answer a citizen enquiry | Public institutions | 3 | sequential |

## 1 · Analyse machine downtime {#production-downtime}
<!-- keywords: manufacturing and industry, downtime analyst, root-cause analyst, action planner -->

**Field:** Manufacturing and industry · **Agents:** 3 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, input form, sub-workflow, result files, files as input

Downtime costs production time, but patterns are easily lost in long logs. The workflow turns a downtime log into a justified, prioritised list of measures.

**How the agents work together:** Two agents work in parallel: the downtime analyst calculates totals, shares and a Pareto ranking with the calculator tool, while the root-cause analyst develops hypotheses along the 6M. The action planner combines both, and a built-in quality check makes sure every measure is justified. If the downtime share is above the 3 % target, a decision node starts a quality sub-workflow that rates the risks of the measures and plans how they are secured.

| Agent | Task | Receives |
|---|---|---|
| **Downtime analyst** | Evaluates the log quantitatively and calculates with the calculator tool. (structured output; Tools: `calculator`) | Downtime log |
| **Root-cause analyst** | Develops root-cause hypotheses along the 6M and proposes checks. | Downtime log |
| **Action planner** | Combines the analysis and hypotheses into prioritised measures. (with quality check) | Downtime analyst, Root-cause analyst |

**Input:** A downtime log (date, shift, machine, duration, fault code, note) and the planned production time. You can paste the log into the text as a table or put it into the optional file field as a CSV or Excel file; the sample file “Downtime_log_L2_weeks14-15.xlsx” contains the same twelve fictional entries as the test task.

**Sample files:** `Downtime_log_L2_weeks14-15.xlsx`

**Test cases:** Log in the text, target missed (4.6 %); Quiet fortnight, target met; Log as an Excel file

**Result:** A prioritised table of immediate actions, investigations and permanent measures, each with expected effect, effort, responsible role and indicator, plus the data analysis with the downtime share and the three most important next steps. The run also saves everything as Markdown and as an Excel file with the tables.

**What is decided automatically and when a person steps in:** Automatic: the downtime analyst checks every figure with the calculator tool. A quality check rates the action plan against three criteria (linked to the findings, prioritised, owners and metrics) and has the action planner revise it once if it falls short. A condition compares the downtime share with the 3 % target: above it, the quality assurance sub-workflow runs (risk assessment with a simplified FMEA and a verification plan); otherwise it is skipped. The run shows which branch was taken. No step waits for a person: causes are hypotheses to be verified on the shop floor, and the measures are proposals for the responsible production manager.

**Why this architecture:** The quantitative evaluation and the root-cause search look at the same log from different angles and do not depend on each other, so they run in parallel and only the action planner brings them together. The quality assurance runs only when the target is missed, because only then are more extensive measures to be expected whose risks need securing; on target it would cost time and money for nothing. It is a sub-workflow so that the same building block can be reused and tested on its own. An orchestrator is not needed, because every downtime log needs the same steps.

**Adapting it:** Put an export from your MES or spreadsheet into the file field; long logs work too, because the agents read large files selectively. For a weekly evaluation you can run the copy on a schedule. In the system prompt of the action planner you can add your methodology, for example TPM pillars or a fixed rating scheme.

## 2 · Investigate a complaint with 8D {#quality-8d}
<!-- keywords: quality management, problem description d1–d3, root-cause analysis d4, action planning d5–d7, 8d report, emergency containment -->

**Field:** Quality management · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, approval, input form, result files, files as input, knowledge proposals, knowledge files

Complaints call for fast containment and a sound root-cause analysis. The 8D method defines the steps; the workflow works through them in a structured way and documents them consistently. It also checks whether the defect has happened before: a cause that comes back means an earlier corrective action did not work, and that belongs in the report.

**How the agents work together:** A sequential chain: the first agent describes the problem and the containment actions (D1 to D3). The second searches the company's past 8D reports for comparable cases and looks for the causes of occurrence and non-detection (D4), stating whether a cause is a repeat or new. The third plans corrective and preventive actions (D5 to D7). The report agent compiles everything into a structured 8D report. A decision node checks the severity: in critical cases an extra agent plans the emergency containment for the next 24 hours. Before the report goes to the customer, a person releases it.

| Agent | Task | Receives |
|---|---|---|
| **Problem description D1–D3** | Describes the team, the problem (is/is not) and the containment actions. (structured output) | Complaint |
| **Root-cause analysis D4** | Searches past 8D reports and looks for the causes of occurrence and non-detection with 5 Whys. | Problem description D1–D3, Complaint |
| **Action planning D5–D7** | Plans corrective actions, their verification and prevention. | Root-cause analysis D4 |
| **8D report** | Compiles all steps into a structured 8D report. (structured output) | Problem description D1–D3, Root-cause analysis D4, Action planning D5–D7, Emergency containment |
| **Emergency containment** | Plans the containment for the next 24 hours in critical cases. | Severity |

**Input:** The customer's complaint with part, batch, defect and defect rate, plus known internal information on production, material and inspection. You can also attach the complaint letter, measurement data and photos of the defect as files; the sample files contain a fictional complaint letter (PDF) and measurements (Excel). The past 8D reports come from the knowledge collection; a fictional archive of four closed reports is included.

**Sample files:** `Complaint_G-220_batch_24-117.pdf`, `Measurements_snap-fit_hooks.xlsx`

**Test cases:** Complaint in the text; Complaint letter and measurements as files

**Result:** A structured 8D report with one field each for D1 to D8 and a list of open points the team still has to clarify; the root-cause analysis names the past reports it used. After approval, the run saves the report as a PDF and as an editable Word file. This closes the learning loop: the report agent proposes the finished 8D report for knowledge, a person decides whether it is stored, and stored reports end up in the same collection as the past reports, so the root-cause analysis finds them in future cases.

**What is decided automatically and when a person steps in:** Automatic: the decision node adds the emergency containment only when the problem description marks the case as critical; the root-cause analysis decides which past reports are relevant and cites them, so every reference can be checked. There are no loops; each step runs once. A person decides twice: before files are created, someone releases the 8D report (rejecting it stops the run without files), and a person decides whether the finished report is stored as knowledge. The report remains a draft until it is released.

**Why this architecture:** 8D prescribes a fixed order in which each discipline builds on the previous one, so a sequential chain fits better than an orchestrator; only the emergency containment depends on the case and is therefore a branch. The past reports are searchable knowledge instead of text in the prompt: the archive grows with every stored case, the search brings only the relevant passages, and citations show where a repeat cause comes from. A review loop was deliberately left out, because the release by a person at the end checks the whole report anyway.

**Knowledge files (synthetic, created when copying):** Past_8D_reports_Plastiform: Fictional archive of four closed 8D reports of the plastic housing supplier Plastiform Ltd.; one of them is a comparable case.

**Adapting it:** Replace the test data with your complaint and attach inspection records, drawings or photos directly. Replace the fictional past reports in the knowledge collection with your own closed 8D reports (Markdown, PDF or Word); clear headings with part, defect and cause per report make the search more precise. If you use your own form, adjust the fields of the report agent under “Output format”.

## 3 · Compare supplier offers {#supplier-comparison}
<!-- keywords: logistics and purchasing, cost analyst, risk analyst, purchasing recommendation -->

**Field:** Logistics and purchasing · **Agents:** 3 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** input form, result files, files as input, optional MCP connection

The lowest unit price is rarely the cheapest offer, and a supplier's promises are not its track record. The workflow compares offers by total cost and supply risk, checks the suppliers' history where it is available, and justifies a recommendation for purchasing.

**How the agents work together:** The cost analyst and the risk analyst work in parallel. One calculates the total cost of ownership per offer with the calculator tool, the other assesses lead time, dependencies, capacity and quality. If your copy is connected to the ERP system, the risk analyst reads each supplier's scorecard read-only with list_suppliers and supplier_scorecard; without a connection it uses an attached ERP export or only the offers and says which history is missing. The purchasing recommendation weighs both and delivers a structured result.

| Agent | Task | Receives |
|---|---|---|
| **Cost analyst** | Calculates the total cost per offer with the calculator tool. (Tools: `calculator`) | Offers |
| **Risk analyst** | Assesses lead time, dependencies, capacity and quality risks. | Offers |
| **Purchasing recommendation** | Weighs costs and risks and recommends a supplier. (structured output) | Cost analyst, Risk analyst |

**Input:** Several offers with price, freight, lead time, minimum quantity, payment terms and quality data, plus your internal cost rates. You can write the offers into the text or attach them as files, even mixed as PDF, Word and Excel; the three sample files show exactly that. Optionally attach an ERP export of the supplier scorecards (Excel or CSV); the sample export deliberately does not contain the supplier of offer B, which is new and has no history yet.

**Sample files:** `Offer_A_Example_Precision.pdf`, `Offer_B_Example_Components.docx`, `Offer_C_Sample_Metal_Parts.xlsx`, `ERP_supplier_scorecards.xlsx`

**Test cases:** Three offers in the text; Three offers as PDF, Word and Excel; Three offers as files plus ERP export

**Result:** A structured recommendation with ranking, reasons, risks, negotiation points and the assumptions made. The risk assessment states for each supplier where its history comes from: the ERP system, the attached export or only the offer. The run also saves the recommendation as a PDF report and as an Excel file with one sheet per list.

**What is decided automatically and when a person steps in:** Automatic: both analyses and the weighing run without stopping; the calculator does the arithmetic, and the run records every step and tool call. The ERP connection is optional and only reads: the copy gets the tools list_suppliers and supplier_scorecard only if you connect it to an MCP server whose tools an administrator approved as read-only; otherwise it runs in a clearly labelled offline mode and never pretends to have ERP data. Runs without a person present (schedules, test series, batch processing) may not use MCP tools unless an administrator explicitly allows unattended MCP, so use a connected copy interactively. No step waits for an approval: the recommendation is a draft, and the sourcing decision stays with you.

**Why this architecture:** Cost and risk are independent questions, so two specialists work in parallel and a third weighs their results; that is faster and easier to check than one agent doing everything. Supplier history comes through an integration because it lives in the ERP system and changes constantly; a knowledge file would go stale, and the offline mode with an export keeps the example usable without a connection. There is no loop and no approval step, because the result is a recommendation, not an action.

**Optional connection: ERP system (supplier scorecards)** (Tools: `list_suppliers`, `supplier_scorecard`). Read-only access through MCP to your ERP system's supplier data: list_suppliers lists the suppliers, supplier_scorecard returns a supplier's scorecard of the last 12 months (on-time delivery, quality in ppm, complaints, open 8D reports, last audit). The risk analyst uses it to check the offers against the recorded history.

**Setup:** An administrator adds your company's ERP MCP server under Tools → Connected services and approves the two tools list_suppliers and supplier_scorecard as read-only. When you copy the example, pick that server as the connection; without one, the copy runs in offline mode. To try it without an ERP system, run `python -m nodestro_examples.demo_mcp --language en` on the computer with the Nodestro desktop app, add http://127.0.0.1:8765/mcp under Tools → Connected services with the consent for a local development server, approve its tools as read-only and pick it when copying. The demo server only reads and serves the synthetic data of the sample export, never real company data. Runs without a person present (schedules, test series, batch processing) may not use MCP tools unless an administrator explicitly allows unattended MCP.

**Without a connection:** Offline mode: no ERP system is connected. The risk analyst uses only an attached ERP export or the offers and names the missing supplier history; it does not look anything up.

**Adapting it:** Attach your offers as files and enter demand and cost rates in the text. To use real supplier history, have the ERP integration set up and choose the server when you copy the example; otherwise attach a scorecard export. If you have fixed weightings (for example 50 % cost, 30 % risk, 20 % quality), add them to the system prompt of the purchasing recommendation. Framework agreements can be stored as knowledge and assigned to the risk analyst.

## 4 · SWOT strategy for a small business {#sme-swot}
<!-- keywords: companies and smes, internal analysis, environment analysis, strategy developer, critical reviewer -->

**Field:** Companies and SMEs · **Agents:** 4 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** result files

Many small businesses know their problems, but not the best order in which to tackle them. The workflow creates a SWOT analysis, derives strategies from it and has them challenged by a critical reviewer.

**How the agents work together:** The internal analysis (strengths, weaknesses) and the environment analysis (opportunities, threats) run in parallel. The strategy developer combines both into strategies following the TOWS matrix and a 90-day plan. The critical reviewer looks for weak points and missing information; the result contains strategy and review. At the end the result is saved with the run as a Markdown and a PDF file.

| Agent | Task | Receives |
|---|---|---|
| **Internal analysis** | Works out strengths and weaknesses from the company data. | Company profile |
| **Environment analysis** | Derives opportunities and threats from the market and environment. | Company profile |
| **Strategy developer** | Develops strategies following the TOWS matrix and a 90-day plan. | Internal analysis, Environment analysis |
| **Critical reviewer** | Challenges the strategy and uncovers weak points. (structured output) | Strategy developer, Company profile |

**Input:** A short company profile with key figures, offering, strengths, problems, market environment and goals.

**Test cases:** Joinery with succession not settled

**Result:** A SWOT matrix with derived strategies and a 90-day plan, plus a structured critical review with verdict, weak points, missing information and next steps.

**What is decided automatically and when a person steps in:** Everything runs automatically and no step waits for a person. The critical reviewer receives the strategy and the original company profile and returns a structured verdict with robust points, weak points, missing information and next steps; it does not send the strategy back, so its criticism stays visible in the result. The environment analysis has no web research: it works from the profile and general industry knowledge and marks what must be checked locally. Strategy and 90-day plan are a draft for your own decision.

**Why this architecture:** Strengths and weaknesses come from inside the company, opportunities and threats from the market; the two analyses are independent of each other and therefore run in parallel. The strategy needs both, so it follows as a fixed step. The reviewer is a separate agent that also sees the original profile, so it checks the strategy against the facts and not only against its own reasoning. A revision loop was deliberately left out: a strategy should not be polished until the reviewer agrees, because open contradictions are valuable information for whoever decides.

**Adapting it:** Describe your company in the same style. The more precise the figures and goals, the more concrete the strategy. You can upload industry studies or customer surveys as knowledge and assign them to the environment analysis.

## 5 · Financial analysis {#financial-analysis}
<!-- keywords: finance and investments, research agent, analysis agent, review agent -->

**Field:** Finance and investments · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** input form, result files, files as input, knowledge proposals

Figures from annual reports are quickly quoted but rarely recalculated and put into context. The workflow extracts the figures, calculates margins and growth exactly and has the result reviewed critically.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** A sequential chain of three agents: the research agent organises the figures with period and unit, the analysis agent calculates key figures with the calculator tool, and the review agent checks the calculations and logic and summarises the result in a structured way.

| Agent | Task | Receives |
|---|---|---|
| **Research Agent** | Collects figures and context for the financial data. | Task |
| **Analysis Agent** | Calculates margins, growth and stability ratios with the calculator tool. (Tools: `calculator`) | Research Agent |
| **Review Agent** | Reviews the analysis and summarises it in a structured way. (structured output) | Analysis Agent, Research Agent |

**Input:** A company's financial figures for at least two years, for example from an annual report or quarterly statement, plus known one-off effects. You can paste the figures or attach them as an Excel, CSV or PDF file; the sample file contains the figures of the test task.

**Sample files:** `Figures_Example_Industries_plc.xlsx`

**Test cases:** Figures in the text; Figures as an Excel file

**Result:** A structured review with summary, key figures, errors or risks found, limits of the analysis and whether the analysis is considered correct, also as a PDF and Excel file. The research agent proposes the extracted figures for knowledge; only what you confirm is adopted. The result is not investment advice.

**What is decided automatically and when a person steps in:** Automatic: the research agent extracts the figures, the analysis agent calculates every key figure with the calculator tool and the review agent checks calculations and logic against the extracted figures. Its yes/no verdict states whether the analysis is considered correct; this verdict neither stops the run nor triggers a recalculation, so errors found remain visible in the result. A person decides about knowledge: the extracted figures are only adopted if you confirm them. The result is not investment advice; before decisions, someone responsible for the figures should check it.

**Why this architecture:** Each step needs the result of the previous one: without clean figures there are no correct ratios, and without ratios there is nothing to review. That is why a strict chain fits better than parallel work or an orchestrator. Calculating with the calculator tool instead of the language model and having a separate agent review the result prevents plausible-looking but wrong ratios. The review also receives the extracted figures, so it can trace each ratio back to its source.

**Adapting it:** Attach the annual report or your table of figures directly. Add further figures, such as gearing or free cash flow, in the system prompt of the analysis agent. For many companies one after another, use batch processing with one row per company.

## 6 · Blog article {#blog-article}
<!-- keywords: marketing and content, brief, writer, editor -->

**Field:** Marketing and content · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** result files

Good articles grow from a clear brief: who reads them, from which angle and with which key messages. The workflow works like a small editorial team and checks the result before it is published.

**How the agents work together:** A fast model drafts a structured brief with audience, angle, outline and key messages. The writer turns it into the article; a built-in quality check makes sure it follows the outline and answers the readers' questions, and sends it back for one revision if not. A fast editor checks length and readability with the text statistics tool and marks unverified claims.

| Agent | Task | Receives |
|---|---|---|
| **Brief** | Defines audience, angle, outline and key messages in one structured brief. (structured output) | Topic |
| **Writer** | Writes the article from the brief. (with quality check) | Brief |
| **Editor** | Checks length and readability and delivers the final version. (Tools: `text_statistics`) | Writer |

**Input:** A topic in one sentence. Optionally add the audience, tone or desired length directly in the input.

**Test cases:** Topic in one sentence

**Result:** A finished article in Markdown with headings, a meta description and short editorial notes with word count and pointers to claims that should be backed up before publication. The run also saves the result as a Markdown and an HTML file that you can paste into your CMS.

**What is decided automatically and when a person steps in:** Automatic: brief, article and editing run one after the other; no step waits for a person. A separate quality check rates the article against two criteria (follows the outline, answers the readers' questions) and, if one is not met, has the writer revise it once. The editor does not change the content; it flags claims that need a source. The article is a draft: you decide whether and where it is published.

**Why this architecture:** One structured brief replaces two parallel planners whose results the writer had to reconcile: the outline used to be drafted without knowing the audience. Now audience, angle, outline and key messages come from one idea and reach the writer as clearly separated fields. The writer has a quality check with automatic revision because that is where most weaknesses arise. As a beginner example, the workflow deliberately stays a short chain without branches, loops or approvals, so every step can be followed in the run.

**Adapting it:** Change the topic in the input. You can upload your style guide as knowledge and assign it to the writer and the editor. Set the desired length in the writer's system prompt, and the number of sections or key messages in the system prompt of the brief.

## 7 · Prepare a tailored offer {#sales-offer}
<!-- keywords: sales, needs analyst, solution consultant, offer writer -->

**Field:** Sales · **Agents:** 3 · **Pattern:** sequential · **Level:** Advanced · **Building blocks:** approval, revision loop, input form, result files, files as input

A good offer answers the customer's actual need, not just their keywords. The workflow clarifies the need, calculates a suitable solution and drafts a complete offer that a person approves.

**How the agents work together:** The needs analyst separates explicit and unspoken requirements and collects open questions. The solution consultant puts together items from the price list and calculates with the calculator tool, including a variant within budget. The offer writer drafts the offer; a built-in quality check verifies completeness and prices. An input form takes the key facts (customer, deadline, budget, weekend assembly). A person then approves the draft; a rejection with a comment sends it back to the offer writer through a loop, who revises it and submits it again.

| Agent | Task | Receives |
|---|---|---|
| **Needs analyst** | Works out explicit and unspoken requirements. | Customer request |
| **Solution consultant** | Puts together suitable items and calculates with the calculator tool. (Tools: `calculator`) | Needs analyst, Customer request |
| **Offer writer** | Writes the draft offer for the customer. (with quality check; Tools: `calculator`) | Needs analyst, Solution consultant |

**Input:** The customer's request and your price list with discounts and terms. The form takes the key data; you can write the price list into the text or attach it as an Excel, CSV or PDF file, as the sample file shows.

**Sample files:** `Price_list_office_furniture.xlsx`

**Test cases:** Request and price list in the text; Price list as an Excel file

**Result:** A draft offer with cover letter, item table, totals, variants, assumptions and open questions. Only after your approval does the run save the offer as a PDF and as an editable Word file; sending it to the customer remains your step.

**What is decided automatically and when a person steps in:** Automatic: needs analysis, calculation and draft run without waiting; a separate quality check rates the offer against three criteria (all requirements covered, prices consistent with the calculation, open points named) and has it revised once if needed. Then a person decides: approving creates the files, rejecting requires a comment and sends the offer back to the offer writer together with the previous draft. The loop allows at most three revision rounds; after that the run ends as failed. The needs analysis and the solution consultant's calculation are not repeated; if the comment changes quantities, discounts or delivery items, the offer writer recalculates the affected totals with the calculator tool. The workflow never sends anything to the customer.

**Why this architecture:** Every request needs the same steps in the same order, so a fixed chain fits better than an orchestrator. Prices are calculated with the calculator tool in a step of their own, so the writer takes list prices from there instead of inventing them. The loop at the approval exists because rejections are usually small corrections such as wording, a discount note or a missing open question; revising with the comment is faster than starting over. It deliberately leads back only to the offer writer, who recalculates changed quantities or discounts with the calculator tool but adds no new list prices, so the checked basis of the solution stays intact.

**Adapting it:** Attach your current price list as a file; then the customer request is enough as text. Add payment terms and standard wording in the system prompt of the offer writer.

## 8 · Answer customer enquiries {#customer-service}
<!-- keywords: customer service, classifier, policy checker, reply writer, de-escalation -->

**Field:** Customer service · **Agents:** 4 · **Pattern:** branching · **Level:** Beginner · **Building blocks:** decision, approval, revision loop, input form, files as input, optional MCP connection

In customer service many enquiries arrive at once, and each needs the right rule, the right order data and the right tone. The workflow sorts the enquiries, checks policies and deadlines against the order data and prepares replies for approval.

**How the agents work together:** A fast classifier sorts each enquiry by topic, urgency and mood. The policy checker applies the service policy and recalculates deadlines with the date tool; if your copy is connected to the shop system, it looks up each order read-only with get_order, otherwise it uses the order data in the enquiries or an attached order export. The reply writer drafts the replies; a quality check makes sure nothing is promised beyond the policy. A decision node sends escalations to a de-escalation agent first. Every draft waits for approval; a rejection with a comment sends the drafts back to the reply writer through a loop, who revises them and submits them for approval again (at most three rounds).

| Agent | Task | Receives |
|---|---|---|
| **Classifier** | Sorts each enquiry by topic, urgency and mood. (structured output) | Enquiries |
| **Policy checker** | Applies the service policy and checks deadlines with the date tool. (Tools: `days_between`) | Classifier, Enquiries |
| **Reply writer** | Writes friendly draft replies for approval. (with quality check) | Classifier, Policy checker, De-escalation |
| **De-escalation** | Prepares how to handle upset customers and what needs approval. | Escalation? |

**Input:** Several customer enquiries with order numbers, today's date and your service policy, as an extract in the text or as a file (PDF, Word, Markdown); the sample file contains a more detailed policy. Order and delivery dates come from the enquiries, from an attached order export of your shop system (JSON, CSV or Excel) or, when connected, directly from the shop system; the sample export contains the three orders of the sample enquiries.

**Sample files:** `Service_policy_Sample_Kitchen.pdf`, `Shop_orders_Sample_Kitchen.json`

**Test cases:** Four enquiries, one of them angry; One friendly product question; Policy as a PDF file; Order numbers only, order export attached

**Result:** For each enquiry a classification, the applicable rule with a deadline check and a draft reply that a person approves before sending. The policy check states where the order data come from (shop system, export or enquiry) and which are missing.

**What is decided automatically and when a person steps in:** Automatic: classification, the escalation decision (to de-escalation when at least one customer is upset or asks for more than the policy allows), the policy check and the drafts; the date tool calculates deadlines, a quality check tests the drafts against three criteria (policy compliant, tone, no promises), and every step is recorded. A person approves every draft before anything is sent: a rejection needs a comment and sends the drafts back to the reply writer; after at most three rounds the run ends as failed if the drafts are still rejected. The replies remain drafts; nothing is sent automatically. The shop connection is optional and only reads: the copy gets get_order only if you connect it to an MCP server whose tool an administrator approved as read-only; otherwise it runs in a clearly labelled offline mode. Runs without a person present (schedules, test series, batch processing) may not use MCP tools unless an administrator explicitly allows unattended MCP.

**Why this architecture:** The steps build on each other (sort, check, write), so a fixed chain with one branch for escalations is enough; an orchestrator would add cost without benefit, and a fast model suffices for sorting. Order data come through an integration because they live in the shop system and change by the hour; the offline mode with an export keeps the example usable without a connection. The approval with a revision loop stays because the replies go to customers: a person has the last word.

**Optional connection: Shop system (orders)** (Tools: `get_order`). Read-only order lookup in your shop system through MCP: get_order returns an order's order and delivery dates, status, items and the carrier's latest note. The policy checker uses it to check deadlines against real order data instead of the customers' statements.

**Setup:** An administrator adds your shop system's MCP server under Tools → Connected services and approves its tool get_order as read-only. When you copy the example, pick that server as the connection; without one, the copy runs in offline mode. To try it without a shop system, run `python -m nodestro_examples.demo_mcp --language en` on the computer with the Nodestro desktop app, add http://127.0.0.1:8765/mcp under Tools → Connected services with the consent for a local development server, approve its tools as read-only and pick it when copying. The demo server only reads and serves the synthetic orders of the sample export, never real customer data. Runs without a person present (schedules, test series, batch processing) may not use MCP tools unless an administrator explicitly allows unattended MCP.

**Without a connection:** Offline mode: no shop system is connected. The policy checker uses only the order data in the enquiries or in an attached order export and lists missing order data; it does not look anything up.

**Adapting it:** Attach your complete policy and FAQ as a file, or upload them as knowledge and assign them to the policy checker if they apply permanently. To check orders live, have the shop integration set up and choose the server when you copy the example. Set your brand's tone (formal or informal, sign-off) in the system prompt of the reply writer. Batch processing handles many enquiries at once, but runs without a person present may not use the shop connection, so give batches an order export.

## 9 · Advertise a job and prepare interviews {#hr-recruiting}
<!-- keywords: human resources, job profile, job advert, interview guide, fairness reviewer, revision -->

**Field:** Human resources · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, approval, result files

Good hiring starts with a clear profile and fair, comparable interviews. The workflow turns loose notes into a job profile, an advert and an interview guide, checks everything for fairness and leaves the release to a person.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The profile agent organises tasks and requirements. From this, the job advert and the interview guide are created in parallel. The fairness reviewer checks both for discriminatory or inadmissible wording, for example about age or mother tongue, and names what a person must check. If it raises objections, a decision node routes the documents to a revision that applies its suggestions; otherwise the first versions stand. Finally the hiring manager or HR reviews advert, guide, fairness review and any revision and releases the documents.

| Agent | Task | Receives |
|---|---|---|
| **Job profile** | Organises tasks, essential and desirable requirements and competencies. | Hiring need |
| **Job advert** | Writes an appealing, inclusive job advert. | Job profile |
| **Interview guide** | Prepares structured interview questions with rating anchors. | Job profile |
| **Fairness reviewer** | Checks the advert and the guide for discrimination and inadmissible questions. (structured output) | Job advert, Interview guide |
| **Revision** | Applies the changes suggested by the fairness review to the advert and the guide. | Revision needed? |

**Input:** Notes on the position: tasks, desired qualifications, team, conditions and pay.

**Test cases:** Notes with problematic wishes

**Result:** Job profile, job advert and interview guide with rating anchors, a structured fairness review and, if there were objections, a revised version with a list of changes. The run creates the Word file only after the release.

**What is decided automatically and when a person steps in:** Automatic: the fairness reviewer returns a structured verdict; if the documents are not usable without changes, a decision node sends them to the revision, otherwise they go straight to the release. Which branch was taken is visible in the run. The final decision stays with a person: the hiring manager or HR checks all documents at the release; a rejection requires a comment and ends the run, and only an approval creates the Word file. The workflow only produces documents: it never sees, assesses or ranks real candidates.

**Why this architecture:** Advert and guide depend only on the profile, so they are created in parallel and reviewed together, which keeps requirements and wording consistent. The fairness review acts as an automatic gate: the revision costs an extra step only when there are objections. There is deliberately no loop of review and revision, because fairness and legal questions should not be settled by models agreeing with each other; the person at the release sees the review, the revision and the open points side by side. Screening candidates is deliberately left out, as it would be high-risk AI under the EU AI Act.

**Adapting it:** Replace the notes with your hiring need. You can store your employer profile and benefits as knowledge and assign them to the advert agent. Add the legal requirements of your country to the system prompt of the fairness reviewer. Do not extend the workflow to screening, rating or ranking applicants without a legal review: under the EU AI Act such systems are high-risk AI.

## 10 · Turn a research question into hypotheses {#research-hypotheses}
<!-- keywords: research and development, question analyst, research coordinator, study planner -->

**Field:** Research and development · **Agents:** 3 · **Pattern:** adaptive (orchestration) · **Level:** Advanced · **Building blocks:** orchestrator with teams, input form, result files, files as input, knowledge proposals, budget and limits

Good research starts with a precise, testable question and the right methods. A material test needs a power analysis, an interview study needs a sampling plan and a consent form, and many questions need both. The workflow analyses the question and lets a research coordinator bring in exactly the method teams the question needs.

**How the agents work together:** The question analyst structures the question and summarises attached data, because the teams work without the files. The research coordinator, an orchestrator, always starts with the hypothesis team and then decides: measurable outcomes go to the statistics team, whose study design and significance level it sets as parameters; experiences and reasons go to the qualitative methods team; people or personal data bring in the ethics and data protection team. If a team finds a hypothesis untestable, the coordinator sends it back to the hypothesis team once. The study planner turns everything into a plan.

| Agent | Task | Receives |
|---|---|---|
| **Question analyst** | Clarifies aim, variables, constraints and knowledge gaps. | Research question |
| **Research coordinator** | Decides which method teams the question needs and sets the statistics team's parameters. (Orchestrator) | Question analyst |
| **Study planner** | Derives the study plan from the analysis and the method teams' results. | Question analyst, Research coordinator |

**Teams the orchestrator can deploy:**

| Team | Task | Capabilities |
|---|---|---|
| **Hypothesis team** | Turns an analysed research question into testable hypotheses with null hypotheses and measurable predictions; revises them after a methods critique. | hypotheses, operationalisation |
| **Statistics team** | Checks quantitative hypotheses against the data, evaluates pilot data with the calculator and estimates the sample size for a given design, significance level and power. (Parameters: Study design, Significance level α, Target power) | statistics, power analysis, quantitative methods |
| **Qualitative methods team** | Plans interviews, observations or focus groups for questions about experiences, reasons and behaviour: sampling, guide and analysis. | qualitative methods, interviews, observation |
| **Ethics and data protection team** | Checks studies with people or personal data: consent, data minimisation, anonymisation, participation of employee representatives and ethics review. | research ethics, data protection, informed consent |

**Input:** A research question with its aim, existing data from pilot tests and constraints such as material, time and equipment. You can attach measurement data and documents as files; the sample file contains the pilot test ratings per panel.

**Sample files:** `Pilot_test_PL-7.csv`

**Test cases:** Question and pilot test in the text; Pilot test data as CSV; Interview study without measurements

**Result:** A study plan with hypotheses, design, sample size, measurement or interview method, analysis, stopping criteria and the open risks, also as a Word file. The orchestration view of the run shows which method teams were involved, with which parameters, and which were left out and why. The study planner proposes the plan for knowledge; you decide whether it is stored.

**What is decided automatically and when a person steps in:** Automatic: the coordinator decides which method teams work and fills the statistics team's form (design, significance level, power); every decision is recorded with its reason. Limits: at most 7 decisions, each team at most twice, a budget of USD 4 per run. No step waits for a person; the plan is a draft for the responsible researcher.

**Why this architecture:** A fixed chain would always run a statistics critique, even for an interview study where it has nothing to compute, and would never involve ethics unless someone remembered to add it. The coordinator chooses per question and passes the statistics team structured parameters instead of free text, so the power analysis works with a defined design. Analysis and final plan stay fixed steps: every study needs them.

**Adapting it:** Replace question and pilot test with your own and attach measurement data directly. Add your statistical guidelines to the statistics team's agent. If your field needs another method team, for example a laboratory team, save it as a workflow with a clear description and add it to the coordinator's teams.

## 11 · Code review with tests {#code-review}
<!-- keywords: software development, bug analyst, security reviewer, fix and tests -->

**Field:** Software development · **Agents:** 3 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** input form, result files, files as input

A second look finds bugs before they reach production. The workflow checks code for logic errors and security problems at the same time and delivers an improved version with tests.

**How the agents work together:** The bug analyst and the security reviewer work on the same code in parallel. The improvement agent combines the findings and writes corrected code and pytest tests; a built-in quality check makes sure every finding is handled and covered by tests.

| Agent | Task | Receives |
|---|---|---|
| **Bug analyst** | Looks for logic errors, edge cases and deviations from the description. | Source code |
| **Security reviewer** | Checks the code for security vulnerabilities and unsafe patterns. | Source code |
| **Fix and tests** | Writes corrected code and pytest tests for all findings. (with quality check) | Bug analyst, Security reviewer, Source code |

**Input:** A code snippet with short context: language, purpose and environment, or a whole project as a ZIP archive or individual files in the file field. Archives are only read, never executed. The code stays unchanged in its language; explanations appear in the interface language. The sample file is a small Python project with built-in bugs.

**Sample files:** `discount-calculator.zip`

**Test cases:** Code snippet in the text; Project as a ZIP archive

**Result:** A list of findings sorted by severity, the corrected code and pytest tests covering every finding, also as a Markdown file. The tests are not run automatically; run them locally.

**What is decided automatically and when a person steps in:** Automatic: a quality check by a second model reads the answer of Fix and tests against three criteria (every finding addressed, a test for every fixed finding, complete code without placeholders); if a criterion fails, the agent revises its answer once, and the check result is recorded with the run. The check judges the text, it does not run the code. No step waits for a person, no own budget is set (your workspace's default budget applies), and uploaded archives are only read, never executed. Corrected code and tests are a proposal: review them and run the tests locally before you adopt anything.

**Why this architecture:** Bugs and security problems are two independent views of the same code, so the bug analyst and the security reviewer work in parallel and neither waits for the other; the fix agent also gets the original code so it can merge and deduplicate their findings. The quality check with one revision is there because forgetting a single finding or test is the typical mistake when combining two reviews. A coordinator was deliberately not used, because every review needs both views; executing the code or tests in the workflow was left out too, so that unknown code never runs on the platform.

**Adapting it:** Attach your project as a ZIP or paste code and name the language and framework. For other languages, adjust the test framework in the fix agent, for example Jest or JUnit. Your coding guidelines can be stored as knowledge. Through the workflow API, the review can also be triggered from a CI pipeline.

## 12 · Structure a contract and find check points {#contract-review}
<!-- keywords: legal and administration, contract structurer, clause explainer, check-point analyst, contract overview, critical clauses -->

**Field:** Legal and administration · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, input form, result files, files as input, knowledge proposals, knowledge files

Contracts are long, and important clauses hide in the details. Whether a clause is acceptable also depends on the company's own standards. The workflow outlines a contract, explains it in plain language and checks it against the customer's contract playbook, so that a qualified person sees at once where it deviates. It does not replace legal advice.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The structurer captures parties, term, services and deadlines. Building on this, the clause explainer (plain language) and the check-point analyst work in parallel; both read the contract themselves, as text or as an uploaded file. The check-point analyst searches the company's contract playbook for every clause, cites the playbook section and rates the clause as standard, fallback, deviation or red line. If a red line or another critical clause is found, a decision node adds an in-depth review of these clauses. The report agent combines everything into a structured overview with questions for legal advice.

| Agent | Task | Receives |
|---|---|---|
| **Contract structurer** | Records parties, subject, term, fees and deadlines. | Contract text |
| **Clause explainer** | Explains each clause in plain language. | Contract structurer, Contract text |
| **Check-point analyst** | Checks every clause against the customer's contract playbook and finds unusual, one-sided or missing provisions. (structured output) | Contract structurer, Contract text |
| **Contract overview** | Combines explanations and check points into a structured overview. (structured output) | Clause explainer, Check-point analyst, Critical clauses |
| **Critical clauses** | Examines critical clauses in depth and prepares negotiation questions. | Critical clauses? |

**Input:** The contract as a file (PDF, Word, Markdown or text) in the field “Contract as a file” or as text, ideally with section numbers. Upload the file directly when you start; the contract does not belong in the knowledge collection. The playbook comes from the knowledge collection; the fictional playbook of Sample Trading KG is included. The sample file contains the fictional contract of the test task.

**Sample files:** `Software_service_agreement_sample.docx`

**Test cases:** Contract in the text, with critical clauses; Contract as a Word file, no text; Balanced maintenance contract

**Result:** A structured overview with summary, key data, explained clauses, check points and questions for a lawyer, also as a PDF and as an editable Word file. Each check point names the playbook section it was measured against, and topics the playbook does not cover are marked as such. The structurer proposes the key data of the contract for knowledge, for example for a contract register; only what you confirm is stored. The result is a working aid and not legal advice.

**What is decided automatically and when a person steps in:** Automatic: the check-point analyst rates every clause against the playbook and counts the critical ones; every red line counts as critical. If the count is above zero, the decision node adds the in-depth review of the critical clauses, otherwise it is skipped. No step waits for a person, and the workflow sends nothing. The overview and its questions are the basis for review by a lawyer; the people involved decide what is negotiated.

**Why this architecture:** Explaining and checking are independent of each other and therefore run in parallel on the structure. The playbook is searchable knowledge instead of text in the prompt: legal maintains it in one place, the search brings only the relevant section, and the citation makes every rating traceable. The in-depth review is a branch because it is only worth its cost when a red line is crossed. An orchestrator was not used, because every contract needs the same steps.

**Knowledge files (synthetic, created when copying):** Contract_playbook_Sample_Trading: Fictional contract playbook of Sample Trading KG for software and cloud contracts: standard position, fallback and red line per topic.

**Adapting it:** Upload your contract as a file when you start or paste it in. Replace the fictional playbook in the knowledge collection with your own, ideally with the same structure per topic: standard position, acceptable fallback and red line. Topics that matter to you, such as insurance or audit rights, only need to be added to the playbook; the check-point analyst finds them by search.

## 13 · Create a personal learning plan {#learning-plan}
<!-- keywords: education and training, learning assessment, learning planner, tutor, quiz author -->

**Field:** Education and training · **Agents:** 4 · **Pattern:** parallel · **Level:** Beginner · **Building blocks:** input form, result files, files as input, memory

Learning works better with a plan that starts where you are. The workflow creates a personal learning plan, explains the first topics and checks understanding with a quiz.

**How the agents work together:** The learning assessment determines the starting point and gaps, and the learning planner turns this into a weekly plan. On this basis, the tutor (learning content for the chosen week, based on your course materials if you like) and the quiz author (knowledge check with answers) work in parallel. The result contains all three parts. The learning assessment and the learning planner share a memory: they first read the progress of earlier weeks and update it at the end, so each week builds on the previous one.

| Agent | Task | Receives |
|---|---|---|
| **Learning assessment** | Determines the starting point, the learning goal and the gaps. | Learning goal |
| **Learning planner** | Creates a weekly plan with learning goals and exercises. | Learning assessment |
| **Tutor** | Explains the content of the first week with examples and exercises. | Learning planner, Learning goal |
| **Quiz author** | Creates a knowledge check with answers for the first week. | Learning planner |

**Input:** Who is learning, the learning goal, available time, prior knowledge and preferred learning style. In the form you choose the week to work out and can attach your own course materials; the sample file is a short guide to pivot tables. From the second week on, add a short note on how the last week went (quiz result, what was difficult); level, goals, completed topics and difficulties of earlier weeks are remembered.

**Sample files:** `Quick_guide_pivot_tables.docx`

**Test cases:** Week 1 without materials; Week 2 with course handout

**Result:** A four-week learning plan with goals for each week, clear explanations with exercises for the chosen week and a quiz with answers and explanations, also as a PDF to print.

**What is decided automatically and when a person steps in:** Automatic: at the start of each run, the learning assessment and the learning planner read the memory “learning-progress” and update it at the end. It holds the learner's level, goals, completed topics, difficulties and the plan in short form, but no sensitive personal data. The memory belongs to your copy and persists across runs; in the workflow editor you can see and delete its entries at the memory of either of the two agents, for example to correct a wrong entry or to start over with another learner. In the first week the memory is empty and the workflow works from your description alone. No step waits for a person: plan, explanations and quiz are suggestions that you adapt to your own pace.

**Why this architecture:** Learning stretches over weeks, but every run starts afresh. Without memory you would have to describe your progress again every week, and the plan would be rebuilt from scratch instead of building on the previous week. The memory carries exactly this changing state, while course materials that stay the same belong in knowledge. Only the assessment and the planner remember, because they decide what comes next; the tutor and the quiz author work in parallel on the chosen week of the plan and need no history of their own.

**Adapting it:** Describe your own learning goal; it works for almost any topic. For the following weeks, start the workflow again and change the week in the form. Course materials you use permanently can be uploaded as knowledge and assigned to the tutor.

## 14 · Check a household budget and save {#household-budget}
<!-- keywords: private individuals – finances, budget analyst, savings adviser, reality check -->

**Field:** Private individuals – finances · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** input form, result files, files as input

At the end of the month there is often less left than expected. The workflow recalculates a household budget, finds savings potential and checks whether the suggestions are realistic in everyday life.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The budget analyst calculates totals, surplus and shares per category with the calculator tool. The savings adviser estimates concrete savings, also recalculated. The reality check receives both results, checks feasibility and delivers a structured result.

| Agent | Task | Receives |
|---|---|---|
| **Budget analyst** | Calculates income, spending, surplus and shares with the calculator tool. (Tools: `calculator`) | Household budget |
| **Savings adviser** | Finds concrete ways to save and estimates their effect. (Tools: `calculator`) | Budget analyst, Household budget |
| **Reality check** | Checks the suggestions for feasibility and summarises them. (structured output) | Budget analyst, Savings adviser |

**Input:** A household's income, fixed and variable expenses and a savings goal. Instead of typing everything in, you can attach bank transactions or a household book as a CSV or Excel file; the sample file contains a fictional month.

**Sample files:** `Bank_transactions_March_2026.csv`

**Test cases:** Budget in the text; Bank transactions as CSV

**Result:** A structured budget check with the current monthly surplus, savings potential, measures, quick first steps and notes, also as an Excel file. It does not replace financial or debt advice.

**What is decided automatically and when a person steps in:** Automatic: the budget analyst and the savings adviser calculate every total with the calculator tool, and the reality check returns fixed fields (monthly surplus, savings potential, measures, quick wins, caveats) that go into the Excel file. The example is marked as sensitive: every agent is told to name the points a qualified person should check and not to sound more certain than the data allows. There is no approval step and no automatic revision; no own budget is set (your workspace's default budget applies). Nothing is transferred, cancelled or booked: the result is a working aid for your own decisions, not financial or debt advice.

**Why this architecture:** Each step builds on the previous one: savings can only be estimated once the budget is known, and only checked once both exist, so a fixed chain is enough. The calculator tool makes the figures computed rather than guessed, and the structured fields make the surplus and potential comparable from run to run. A separate, lean reality check was chosen instead of a loop because its job is to drop unrealistic ideas, not to polish text. Deliberately not used: a bank connection and memory, so that personal account data is only handed over as a file for this one run and is not kept between runs.

**Adapting it:** Attach your own bank transactions or enter your figures; add personal priorities, such as “the car stays”, in the text. Bank statements contain personal data: they stay with you and are only passed to the model for this run.

## 15 · Plan a personal trip {#travel-plan}
<!-- keywords: private individuals – travel, route planner, budget planner, organisation planner, travel documents -->

**Field:** Private individuals – travel · **Agents:** 4 · **Pattern:** branching · **Level:** Beginner · **Building blocks:** decision, input form, result files

A good trip fits the interests, budget and limitations of everyone travelling. The workflow plans a route, recalculates the budget and creates a checklist for the organisation.

**How the agents work together:** The route planner drafts a day-by-day plan around interests and constraints. The budget planner calculates nights and costs with the calculator and date tools. The organisation planner combines everything into a travel plan with a checklist; a quality check verifies budget and constraints. An input form takes destination, dates, travellers and budget. For trips abroad, a decision node adds a checklist for documents and entry rules.

| Agent | Task | Receives |
|---|---|---|
| **Route planner** | Drafts a daily plan around interests and limitations. | Travel wishes |
| **Budget planner** | Calculates nights and costs with the calculator and date tools. (Tools: `calculator`, `days_between`) | Route planner |
| **Organisation planner** | Combines route and budget into a travel plan with a checklist. (with quality check) | Route planner, Budget planner, Travel documents |
| **Travel documents** | Lists documents, insurance and entry rules for trips abroad. | Abroad? |

**Input:** Who is travelling, destination and dates, budget, interests and limitations.

**Test cases:** Family trip to Lisbon (abroad); Weekend in your own country

**Result:** A travel plan with daily schedule, budget table and checklist, also as a PDF to take along. Prices and opening hours are estimates from general knowledge and must be checked before booking, because the workflow uses no live data.

**What is decided automatically and when a person steps in:** Automatic: the decision node reads the form field “Trip abroad” and runs the travel documents agent only when it is ticked; the budget planner counts the nights with the date tool and adds up costs with the calculator. A quality check by a second model reads the organisation planner's plan against three criteria (within budget, all limitations respected, unverified details marked); if one fails, the plan is revised once and the check result is recorded with the run. No step waits for a person and no own budget is set (your workspace's default budget applies). Nothing is booked: prices, opening hours and entry rules are estimates you check before booking.

**Why this architecture:** Route, budget and organisation build on each other, so they form a chain; only the documents checklist depends on a yes/no answer, which a decision node settles from the form, so a domestic weekend does not pay for a passport list. Nights and totals come from tools because date and sum errors are the typical weakness of language models. Live web search was deliberately not built in: its results change from day to day, so runs would not be reproducible, the example would depend on a paid server tool and could not be passed on as is; instead every price is marked as an estimate, and you can add web search yourself.

**Adapting it:** Enter your travel wishes. If you want current prices and opening hours, you can add the "web search" server tool to the route planner; it costs extra per search.

## 16 · Evaluate a business idea {#business-idea}
<!-- keywords: self-employed and founders, founding coach, investor jury -->

**Field:** Self-employed and founders · **Agents:** 2 · **Pattern:** adaptive (orchestration) · **Level:** Advanced · **Building blocks:** orchestrator with teams, result files, budget and limits

Before founding a business, a sober look at the market, figures and risks pays off. But not every idea needs the same experts: a bicycle repair service needs no licensing specialist, a drinks start-up does. The workflow lets a founding coach assemble the right expert teams and an investor jury reach a justified verdict.

**How the agents work together:** The founding coach is an orchestrator: it reads the idea and decides which of five expert teams to involve. Market, profitability and risks work in parallel for every idea; regulation and operations join only when the idea calls for them. When results contradict each other, the coach asks one team a targeted follow-up question. The investor jury then weighs all reports and gives a structured verdict with a score.

| Agent | Task | Receives |
|---|---|---|
| **Founding coach** | Decides which expert teams the idea needs, lets them work in parallel and asks follow-up questions. (Orchestrator) | Business idea |
| **Investor jury** | Weighs market, figures and risks and reaches a verdict. (structured output) | Business idea, Founding coach |

**Teams the orchestrator can deploy:**

| Team | Task | Capabilities |
|---|---|---|
| **Market team** | Estimates target groups, demand, willingness to pay and competition of a business idea. | market analysis, target groups, competition |
| **Profitability team** | Calculates contribution margin, break-even, payback and scenarios of a business idea with the calculator tool. | profitability, break-even, financial planning |
| **Risk team** | Looks for the weak points of a business idea and cheap ways to test them before founding. | risk analysis, validation experiments |
| **Regulation team** | Identifies the permits, registrations, labelling, hygiene, insurance and data protection duties a business idea touches. | regulation, permits, licences, data protection |
| **Operations team** | Checks whether a business idea can be delivered as described: processes, capacity, equipment, suppliers and logistics. | operations, technology, logistics, suppliers |

**Input:** A description of the idea with offering, target groups, prices, costs, capacity and known competitors.

**Test cases:** Mobile bicycle repair service; Kombucha brewery (regulated food)

**Result:** A structured verdict (pursue, adapt or drop) with a score, strengths, risks, assumptions to test and concrete next steps, also as a PDF report. In the run, the orchestration view shows which teams the coach chose, why, with which task and what each team delivered.

**What is decided automatically and when a person steps in:** Automatic: the coach decides which teams work, in which order and with which task; each decision is recorded with its reason. Limits keep this in check: at most 6 decisions, each team at most twice, at most 3 teams at the same time and a budget of USD 3 per run. No step waits for a person; the verdict is the basis for your own decision.

**Why this architecture:** A fixed workflow would either run all five experts every time and pay for a licensing analysis a bike repair service does not need, or leave them out when they matter. The coach makes exactly this choice, visibly and within limits. The jury stays a fixed step, because a comparable, structured verdict should not depend on how the coach split the work.

**Adapting it:** Describe your idea with your own figures. To add an expert, for example for tax questions, save a workflow with a clear description and capabilities and add it to the coach's teams; the coach then decides by itself when it is needed. Your own market data can be uploaded as knowledge and assigned to the market analyst in the market team.

## 17 · Develop a social media strategy {#creator-strategy}
<!-- keywords: influencers and content creators, strategy agent, idea developer, content planner -->

**Field:** Influencers and content creators · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** input form, result files, files as input, memory

Publishing regularly needs a clear direction and a plan that fits your own time budget. The workflow derives a strategy from the metrics, collects suitable ideas and plans publication.

**How the agents work together:** A chain of three agents: the strategy agent sets positioning, content pillars and goals and evaluates attached statistics for this, the idea developer formulates concrete post ideas with a hook, and the content planner spreads them over four weeks. The idea developer remembers its suggestions in a memory so that later runs do not repeat ideas. A quality check verifies that frequency and mix are realistic.

| Agent | Task | Receives |
|---|---|---|
| **Strategy agent** | Defines positioning, content pillars and measurable goals. | Creator profile |
| **Idea developer** | Develops concrete post ideas with hook and format. | Strategy agent |
| **Content planner** | Spreads the ideas over a realistic four-week plan. (with quality check) | Strategy agent, Idea developer |

**Input:** Profile with platforms, figures, successful posts, audience, goals, available time and start date. You can also attach statistics as screenshots or as a CSV/Excel export; the sample file is such an export.

**Sample files:** `Post_statistics_March.csv`

**Test cases:** Profile in the text; Profile with statistics export

**Result:** A four-week content plan with date, platform, format, idea, hook and call to action, introduced by a short summary of the strategy, also as an Excel file for further planning.

**What is decided automatically and when a person steps in:** Automatic: the idea developer reads the memory “creator-ideas” before it starts and, at the end of every run, saves the working titles of its new ideas there itself, without a confirmation step; you can view or clear the memory under Memory. A quality check by a second model reads the content planner's calendar against three criteria (frequency fits the time budget, pillars balanced, goals supported); if one fails, the calendar is revised once and the check result is recorded with the run. No step waits for a person and no own budget is set (your workspace's default budget applies). Nothing is published: the plan is a draft that you adjust and post yourself.

**Why this architecture:** Strategy, ideas and calendar build strictly on each other, so a chain of three agents is enough; the content planner also gets the strategy directly so it can check the mix against the pillars. Memory sits only on the idea developer, because repeated ideas are the real problem with monthly runs, while the strategy should be derived afresh from current figures. Deliberately not used: live web search for trends and a connection to the platforms, because trend results change daily and would make runs neither reproducible nor portable, and because a draft plan should not be posted automatically; the strategy rests on your own statistics instead.

**Adapting it:** Enter your profile and figures or attach screenshots of your statistics. Add your brand style and no-go topics in the system prompt of the idea developer. You can find the memory “creator-ideas” under Memory; clear it if you want to start afresh. For a monthly plan you can run the copy on a schedule.

## 18 · Compare property offers {#real-estate}
<!-- keywords: real estate, yield calculator, property and location analyst, opportunity and risk assessment -->

**Field:** Real estate · **Agents:** 3 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** input form, result files, files as input

With property, figures and location decide together. The workflow recalculates yield and cash flow, analyses the property and its location and sets opportunities against risks.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The yield calculator works out gross and net rental yield and the monthly cash flow with the calculator tool, while the property and location analyst assesses condition, reserves and surroundings in parallel. The assessment combines both in a structured comparison.

| Agent | Task | Receives |
|---|---|---|
| **Yield calculator** | Calculates yield, financing and cash flow with the calculator tool. (Tools: `calculator`) | Offers |
| **Property and location analyst** | Assesses condition, reserves, lettability and location. | Offers |
| **Opportunity and risk assessment** | Sets the figures against the property assessment and compares in a structured way. (structured output) | Yield calculator, Property and location analyst |

**Input:** At least two offers with purchase price, area, rent, service charge, reserves and location, plus your financing assumptions. Attach listings, minutes and floor plans as PDF, Word or image; the sample files contain a listing with an extract from the minutes and a floor plan for offer 2.

**Sample files:** `Listing_offer_2_period_building.pdf`, `Floor_plan_offer_2.png`

**Test cases:** Two offers in the text; With listing and floor plan

**Result:** A structured comparison with key figures, preferred offer, opportunities, risks and points to check before a decision, also as a PDF. It does not replace financial, tax or legal advice or a viewing.

**What is decided automatically and when a person steps in:** Automatic: both analyses run in parallel on every run, and the yield calculator works out every key figure with the calculator tool, so each calculation can be traced in the run. No step waits for a person and no quality check revises the result; you can attach at most 8 files. Because property decisions are sensitive, every agent is instructed to name the points a qualified person has to check and not to convey more certainty than the data supports. No budget of its own is set, so your workspace's default budget applies; the comparison is a working aid for your own decision, not a recommendation to buy.

**Why this architecture:** Yield and location are independent questions, so they run in parallel and only the assessment weighs them against each other; the fixed structure (comparison, preferred offer, risks, checks) makes offers comparable from run to run. An orchestrator would add nothing, because every comparison needs both analyses. There is deliberately no live web search for asking prices or rent levels: the results would change from run to run and could not be traced, whereas your listings, minutes and a stored rent index keep the basis fixed and checkable.

**Adapting it:** Enter your offers and financing data and attach listings, minutes of owners' meetings or floor plans directly. A rent index you need again and again can be stored as knowledge and assigned to the property and location analyst.

## 19 · Analyse construction delays {#construction-delay}
<!-- keywords: construction, schedule analyst, site coordinator, report to the client -->

**Field:** Construction · **Agents:** 3 · **Pattern:** adaptive (orchestration) · **Level:** Advanced · **Building blocks:** orchestrator with teams, approval, input form, result files, files as input, output contract, budget and limits

Delays on site have different causes, and each cause needs different expertise: frost needs documentation, a late supplier needs a notice of hindrance to the right party, a design change ordered by the client may justify an extension of time, and staffing gaps need an acceleration plan. The workflow calculates the deviations and lets a site coordinator bring in exactly the specialist teams the situation needs.

**How the agents work together:** The schedule analyst calculates the delay of every milestone with the date tool and lists the suspected causes. The site coordinator, an orchestrator, first puts together a team of at most three from the four specialist teams and then hands out tasks: the site team for weather, ground and design changes, the supply team for suppliers and subcontractors, the claims team for notices of hindrance and extensions of time, the recovery team for acceleration measures with cost. Teams work in parallel where they are independent. The claims team stops for a person: its draft notice is only used after the responsible site manager has signed it off. The report agent writes the status report, and before it reaches the client a person approves it.

| Agent | Task | Receives |
|---|---|---|
| **Schedule analyst** | Calculates delays and the critical path with the date and calculator tools. (structured output; Tools: `days_between`, `calculator`) | Project status |
| **Site coordinator** | Staffs the specialist teams the delay needs and hands out their tasks. (Orchestrator) | Schedule analyst |
| **Report to the client** | Summarises schedule, causes, claims and measures factually for the client. | Schedule analyst, Site coordinator |

**Teams the orchestrator can deploy:**

| Team | Task | Capabilities |
|---|---|---|
| **Site and design team** | Examines technical causes of construction delays: weather, ground conditions, design changes and site sequencing; attributes delay days with evidence. | technical causes, design changes, ground conditions, weather |
| **Supply chain team** | Examines delays caused by suppliers, material deliveries and subcontractor staffing; attributes delay days with evidence. | supply chain, subcontractors, material delivery |
| **Claims team** | Drafts notices of hindrance and assesses extension-of-time claims for delays outside the contractor's sphere; a site manager signs off the draft. (stops for an approval) | contract, claims, notice of obstruction |
| **Recovery team** | Develops acceleration measures for a delayed construction project with days recovered, extra cost and a new completion forecast. | recovery planning, acceleration, cost estimate |

**Input:** A schedule overview with planned and actual milestones, remarks on causes, report date and contractual conditions, as text or as files: schedule as Excel, site diary as PDF, photos as images. The sample files contain a schedule and an extract from the site diary.

**Sample files:** `Schedule_day_care_Sunny_View.xlsx`, `Site_diary_extract_April_May.pdf`

**Test cases:** Schedule overview in the text; Schedule and site diary as files

**Result:** A factual status report with schedule situation, causes and responsibilities, notices and extension claims, recovery measures with cost, decisions needed and risks; after approval as a PDF and an editable Word file. The orchestration view shows which teams the coordinator staffed, what each delivered as structured data and why. Questions on contractual penalties and extensions of time remain subject to expert and legal review.

**What is decided automatically and when a person steps in:** Automatic: the coordinator chooses at most three teams, runs at most two at a time and gives each team at most two tasks; every staffing and task decision is recorded with its reason. A person decides twice: the site manager signs off the draft notice of hindrance inside the claims team (rejecting it stops the run), and a person approves the status report before files are created. Limits: at most 8 coordinator decisions, 50 steps, 40 minutes and USD 4 per run.

**Why this architecture:** A fixed chain treated every delay alike: one cause analyst, one countermeasure planner, regardless of whether the problem was frost or a missing notice. With the coordinator, a pure weather delay does not cost a claims review, while a client-ordered design change brings in the claims team with its sign-off. The teams return structured results (days, responsibility, evidence), so the report can add them up instead of rewording prose. The schedule calculation, the report and the final approval stay fixed steps because every report needs them.

**Adapting it:** Export your schedule from your project software as Excel and attach the site diary and photos. Adapt the claims team to your contract type (for example VOB/B, FIDIC or your own conditions) and enter your company's cost rates in the recovery team. If you need another specialist, such as building services, save it as a workflow with a clear description and add it to the coordinator's teams.

## 20 · Develop and cost a menu {#restaurant-menu}
<!-- keywords: hospitality, concept developer, costing, menu writer -->

**Field:** Hospitality · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** input form, result files, files as input

A menu has to please guests and pay off. The workflow develops dishes for a target group, calculates food cost and prices and writes appetising menu texts.

**How the agents work together:** A chain of three agents: the concept developer puts together dishes with recipes, the costing calculates food cost and selling prices with the calculator tool, and the menu writer writes the menu. A quality check verifies target group, prices and the note on allergens. The result contains the costing and the menu.

| Agent | Task | Receives |
|---|---|---|
| **Concept developer** | Puts together suitable dishes with recipes and quantities. | Concept |
| **Costing** | Calculates food cost and selling prices with the calculator tool. (Tools: `calculator`) | Concept developer, Concept |
| **Menu writer** | Writes the lunch menu with appetising descriptions. (with quality check) | Costing, Concept developer |

**Input:** Type of business, target group, number and type of dishes, target food cost, price range and purchase prices. You can paste the purchase prices or attach them as a CSV or Excel file, as the sample file shows.

**Sample files:** `Purchase_prices_Example_Mill.csv`

**Test cases:** Lunch menu with prices in the text; Purchase prices as CSV

**Result:** A costing table with food cost and price per dish and a finished lunch menu with short descriptions, also as a Word file for layout and as an Excel file with the costing tables. Allergens and additives must be checked and labelled on the basis of the actual recipes.

**What is decided automatically and when a person steps in:** Automatic: the three steps always run in the same order; the costing calculates with the calculator tool and receives your purchase prices directly from the input, at most one CSV or Excel file of up to 5 MB. A quality check measures the menu against three criteria (target group, prices matching the costing, note on allergens); if one fails, the menu writer revises the menu once, and the result of the check is recorded in the run with its feedback (if it still fails, the workflow continues and the check counts as not passed). No step waits for a person, and no budget of its own is set, so your workspace's default budget applies. Menu and costing are drafts: you check prices, portion sizes and allergen labelling before printing.

**Why this architecture:** Each step builds on the previous one: no costing without dishes, no menu without prices, so a fixed chain fits; the costing also gets the price list directly, so it does not depend on the concept developer repeating figures. The quality check sits on the menu because that is where prices can drift away from the costing. Deliberately not used: an orchestrator, because the steps are always the same, and a live web search for wholesale prices, which would vary from run to run and not match your supplier; your own price list keeps the costing reproducible.

**Adapting it:** Attach your current purchase price list and describe your target group. Upload your standard recipes as knowledge and assign them to the costing; add house rules such as portion sizes in the concept developer. For the change every two weeks you can run the copy on a schedule.

## 21 · Crop planning for a farm {#farm-planning}
<!-- keywords: agriculture, rotation planner, gross margin calculation, plausibility check -->

**Field:** Agriculture · **Agents:** 3 · **Pattern:** sequential · **Level:** Advanced · **Building blocks:** input form, result files, files as input

Crop planning has to take rotation, soils, contracts and profitability into account at the same time. The workflow proposes a crop rotation, calculates gross margins and checks the plan against your own rules.

**How the agents work together:** A chain of three agents: the rotation planner assigns a crop to each field, the gross margin calculation works out each field and the total with the calculator tool, and the plausibility check verifies rules and risks and delivers a structured result.

| Agent | Task | Receives |
|---|---|---|
| **Rotation planner** | Assigns a crop to each field according to rules and soil. | Farm data |
| **Gross margin calculation** | Calculates gross margins per field and in total with the calculator tool. (Tools: `calculator`) | Rotation planner, Farm data |
| **Plausibility check** | Checks the plan against rules and risks and summarises it. (structured output) | Rotation planner, Gross margin calculation |

**Input:** Fields with size, soil and previous crop, your planning rules and assumptions on revenue and costs per hectare. You can attach fields and assumptions as an Excel or CSV file; the sample file contains both tables of the test task.

**Sample files:** `Field_records_Example_Farm.xlsx`

**Test cases:** Farm in the text; Field records as an Excel file

**Result:** A cropping plan per field with gross margin, a rule check, risks and open questions, also as an Excel file. Legal requirements, for example on fertilisation or subsidy conditions, must be checked against the current local rules.

**What is decided automatically and when a person steps in:** Automatic: the three steps always run in the same order; the gross margin calculation works out every field and the total with the calculator tool, so the figures can be traced in the run. There is no automatic revision: the plausibility check does not change the plan but lists rule checks, risks and open questions in a structured result with the total gross margin as a number. No step waits for a person; you can attach up to 3 files of 10 MB each, and no budget of its own is set, so your workspace's default budget applies. The plan is a draft that you check against the current local rules before ordering seed or applying for subsidies.

**Why this architecture:** Crop choice comes first, the gross margins depend on it and the review needs both, so a fixed chain fits; the plausibility check also receives the rotation directly to measure it against your rules. A separate review step that names violations openly was chosen deliberately over a quality loop that would quietly rewrite the plan, because deviations in a rotation are trade-offs for you to decide. No live web search for prices or requirements and no orchestrator: prices and rules found online change daily and differ by region, your own assumptions keep the calculation reproducible, and the steps are the same for every farm.

**Adapting it:** Attach your field records and costing data as Excel and enter your planning rules. Soil samples you need every year can be uploaded as knowledge and assigned to the rotation planner.

## 22 · Plan a club festival {#club-event}
<!-- keywords: clubs and associations, schedule planner, budget planner, communication planner, board paper -->

**Field:** Clubs and associations · **Agents:** 4 · **Pattern:** parallel · **Level:** Beginner · **Building blocks:** result files

Club festivals are organised by volunteers in their free time. The workflow creates the schedule, tasks, budget and communication and summarises everything in a paper for the board meeting.

**How the agents work together:** The schedule planner and the budget planner work in parallel; one counts back from the festival with the date tool, the other calculates the budget with the calculator tool. The communication planner prepares invitations and posts in line with the schedule. The board paper combines everything; a quality check looks at completeness and responsibilities.

| Agent | Task | Receives |
|---|---|---|
| **Schedule planner** | Plans the timeline, tasks and shifts backwards from the festival day. (Tools: `days_between`) | Key facts |
| **Budget planner** | Calculates income, spending and buffer with the calculator tool. (Tools: `calculator`) | Key facts |
| **Communication planner** | Prepares invitations, posts and a press release. | Schedule planner |
| **Board paper** | Summarises planning, budget and communication for the board. (with quality check) | Schedule planner, Budget planner, Communication planner |

**Input:** Occasion, date, place, number of guests, programme wishes, helpers, budget and known costs.

**Test cases:** Summer festival for the club anniversary

**Result:** A board paper with a timeline up to the event, tasks and responsibilities, shift plan, budget with surplus or shortfall, communication plan and proposed resolutions, also as a Word file to send to the board.

**What is decided automatically and when a person steps in:** Automatic: schedule and budget are created in parallel; the schedule planner counts back from the festival date with the date tool and the budget planner calculates with the calculator tool. A quality check measures the board paper for completeness, responsibilities and consistency with the budget; if a criterion fails, the paper is revised once, and the result of the check is recorded in the run with its feedback (if it still fails, the workflow continues and the check counts as not passed). No step waits for a person and nothing is sent; no budget of its own is set, so your workspace's default budget applies. The paper is a draft whose proposed resolutions the board decides on.

**Why this architecture:** Schedule and budget do not depend on each other and run in parallel, while the communication planner needs the schedule and therefore follows it; the board paper brings everything together. There is deliberately no approval step in the workflow, because the real approval is the board meeting itself, and no email or calendar integration, because volunteers send invitations themselves once the board has decided. An orchestrator would add nothing, since every festival needs the same four parts.

**Adapting it:** Enter the key facts of your festival. Permits and conditions differ by municipality; add known requirements to the input. Logos and poster templates can be stored as knowledge.

## 23 · Develop a fundraising campaign {#nonprofit-campaign}
<!-- keywords: non-profit organisations, campaign developer, impact analyst, credibility reviewer -->

**Field:** Non-profit organisations · **Agents:** 3 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, revision loop, result files, knowledge proposals

Fundraising campaigns need a moving story, but also honest statements about impact. The workflow develops a campaign, assesses the possible impact and checks whether promises are credible and ethically sound.

**How the agents work together:** The campaign developer and the impact analyst work in parallel: one designs message, target groups and measures, the other builds an impact model with indicators and calculates the cost per child with the calculator tool. The credibility reviewer checks both. If it rates the campaign as not credible, a condition sends it back to the campaign developer together with the review's notes; the revised campaign is reviewed again, at most twice. The result contains all three parts.

| Agent | Task | Receives |
|---|---|---|
| **Campaign developer** | Designs the message, target groups, channels and schedule of the campaign. | Project description |
| **Impact analyst** | Builds an impact model with indicators and the cost per child. (Tools: `calculator`) | Project description |
| **Credibility reviewer** | Checks statements for exaggeration, ethics and evidence. (structured output) | Campaign developer, Impact analyst |

**Input:** Organisation, project, results so far, goal, funding need, campaign period and existing channels.

**Test cases:** Reading buddies at primary schools

**Result:** A campaign concept with timeline and draft texts, an impact model with indicators and a structured review for exaggerated claims, ethical notes and a plan for measuring impact, also as a Word file. The impact analyst proposes its impact model for knowledge, for example for later funding applications; only what you confirm is stored.

**What is decided automatically and when a person steps in:** Automatic: the credibility reviewer's yes/no verdict on credibility decides whether the campaign goes back for revision; the run shows which branch was taken. The campaign developer revises at most twice, each time with the reviewer's notes and its previous draft. If the campaign is still not rated credible after that, the run continues to the result anyway, and the review's notes show what is still open. No step waits for a person: texts and figures are drafts that your organisation checks before publishing, especially statements about impact and photos of children. Proposed impact models are only stored as knowledge if you confirm them.

**Why this architecture:** Credibility problems are best fixed by whoever wrote the text, so the review leads back to the campaign developer instead of only listing problems. The loop is limited to two rounds: a campaign that still overstates after that needs better evidence from the organisation, not more rewording. The impact model stays outside the loop because it is based on the project data, not on the campaign texts. There is no approval step, because the campaign remains a draft and is published outside the workflow anyway.

**Adapting it:** Describe your project and your results as honestly as possible. Upload annual reports or evaluations as knowledge and assign them to the impact analyst.

## 24 · Answer a citizen enquiry {#citizen-inquiry}
<!-- keywords: public institutions, concern analysis, information preparation, draft reply -->

**Field:** Public institutions · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** approval, revision loop, input form, result files, files as input, knowledge proposals, knowledge files

Citizen enquiries often contain several concerns and must be answered correctly, clearly and without hasty commitments. The workflow breaks the enquiry down, finds the relevant rules of the municipality, prepares a reply and leaves the decision to send it with the case worker.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** A chain of three agents and an approval: the concern analysis separates the concerns and assigns responsibilities. The information preparation searches the municipality's stored rules and the documents of the enquiry, cites the passages it uses and says when no rule covers a concern. The draft reply writes a citizen-friendly answer; a quality check makes sure only documented rules are cited and no binding commitments are made. The case worker then checks the reply; a rejection with a comment sends it back to the draft reply for revision.

| Agent | Task | Receives |
|---|---|---|
| **Concern analysis** | Separates the concerns and assigns responsibilities and urgency. | Citizen enquiry |
| **Information preparation** | Searches the municipality's rules and cites the relevant passages for each concern. | Concern analysis, Citizen enquiry |
| **Draft reply** | Writes a factual, citizen-friendly reply for approval. (with quality check) | Concern analysis, Information preparation |

**Input:** The citizen's enquiry, optionally with internal information on the case, as text or as files. You can also attach photos from the enquiry. The municipality's rules come from the knowledge collection; a fictional set of rules of Sampletown is included. The sample file is a fictional guidance note of the municipality.

**Sample files:** `Guidance_outbuildings_and_lighting.pdf`

**Test cases:** Garden shed and street lamp; Rules as a guidance note file

**Result:** A draft reply in plain language with responsibilities, next steps and notes for the case worker; after release also as a Word file for your letterhead. The Word file is sanitized: personal data such as names, addresses, phone numbers and email addresses, and credentials, are replaced by placeholders, so you insert the recipient's details from the case file yourself. The information preparation proposes the rules it found, with references, for knowledge; only what you confirm is stored.

**What is decided automatically and when a person steps in:** Automatic: the concern analysis, the rule search with citations and the quality check of the draft (only documented rules, plain language, no binding commitment). A person decides: the case worker checks every reply before it is sent. A rejection requires a comment and sends the draft back to the draft reply with this feedback; after at most 2 revisions a further rejection makes the run fail without a file. The workflow sends nothing itself; the released reply is still a draft that the case worker sends through the usual channels.

**Why this architecture:** Every enquiry needs the same steps, so a fixed chain is enough and an orchestrator would only add cost. The rules are searchable knowledge instead of text pasted into each enquiry: the information preparation finds the relevant passages, cites them and notices when nothing fits. The approval with a revision loop is there because a reply to a citizen has an effect outside the administration and the case worker knows the case best. A connection to the mail system was deliberately left out, so sending remains a human decision.

**Knowledge files (synthetic, created when copying):** Rules_municipality_Sampletown: Fictional rules of the municipality of Sampletown on outbuildings, development plan no. 17, street lighting, bulky waste, trees and the handling of enquiries.

**Adapting it:** Replace the fictional rules in the knowledge collection with your by-laws, guidance notes and lists of responsibilities; clear headings and section numbers make the citations precise. Add letterhead and sign-off in the system prompt of the draft reply. Use batch processing to handle many enquiries at once.

<!-- examples:end -->

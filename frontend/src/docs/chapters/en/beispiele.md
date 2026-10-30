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
| 6 | Blog article | Marketing and content | 4 | parallel |
| 7 | Prepare a tailored offer | Sales | 3 | sequential |
| 8 | Answer customer enquiries | Customer service | 5 | branching |
| 9 | Advertise a job and prepare interviews | Human resources | 5 | branching |
| 10 | Turn a research question into hypotheses | Research and development | 4 | sequential |
| 11 | Code review with tests | Software development | 3 | parallel |
| 12 | Structure a contract and find check points | Legal and administration | 5 | branching |
| 13 | Create a personal learning plan | Education and training | 4 | parallel |
| 14 | Check a household budget and save | Private individuals – finances | 3 | sequential |
| 15 | Plan a personal trip | Private individuals – travel | 4 | branching |
| 16 | Evaluate a business idea | Self-employed and founders | 4 | parallel |
| 17 | Develop a social media strategy | Influencers and content creators | 3 | sequential |
| 18 | Compare property offers | Real estate | 3 | parallel |
| 19 | Analyse construction delays | Construction | 4 | parallel |
| 20 | Develop and cost a menu | Hospitality | 3 | sequential |
| 21 | Crop planning for a farm | Agriculture | 3 | sequential |
| 22 | Plan a club festival | Clubs and associations | 4 | parallel |
| 23 | Develop a fundraising campaign | Non-profit organisations | 3 | parallel |
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

**Adapting it:** Put an export from your MES or spreadsheet into the file field; long logs work too, because the agents read large files selectively. For a weekly evaluation you can run the copy on a schedule. In the system prompt of the action planner you can add your methodology, for example TPM pillars or a fixed rating scheme.

## 2 · Investigate a complaint with 8D {#quality-8d}
<!-- keywords: quality management, problem description d1–d3, root-cause analysis d4, action planning d5–d7, 8d report, emergency containment -->

**Field:** Quality management · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, approval, input form, result files, files as input, knowledge proposals

Complaints call for fast containment and a sound root-cause analysis. The 8D method defines the steps; the workflow works through them in a structured way and documents them consistently.

**How the agents work together:** A sequential chain: the first agent describes the problem and the containment actions (D1 to D3), the second looks for the causes of occurrence and non-detection (D4), the third plans corrective and preventive actions (D5 to D7). The report agent compiles everything into a structured 8D report. A decision node checks the severity: in critical cases an extra agent plans the emergency containment for the next 24 hours. Before the report goes to the customer, a person releases it.

| Agent | Task | Receives |
|---|---|---|
| **Problem description D1–D3** | Describes the team, the problem (is/is not) and the containment actions. (structured output) | Complaint |
| **Root-cause analysis D4** | Looks for the causes of occurrence and non-detection with 5 Whys. | Problem description D1–D3, Complaint |
| **Action planning D5–D7** | Plans corrective actions, their verification and prevention. | Root-cause analysis D4 |
| **8D report** | Compiles all steps into a structured 8D report. (structured output) | Problem description D1–D3, Root-cause analysis D4, Action planning D5–D7, Emergency containment |
| **Emergency containment** | Plans the containment for the next 24 hours in critical cases. | Severity |

**Input:** The customer's complaint with part, batch, defect and defect rate, plus known internal information on production, material and inspection. You can also attach the complaint letter, measurement data and photos of the defect as files; the sample files contain a fictional complaint letter (PDF) and measurements (Excel).

**Sample files:** `Complaint_G-220_batch_24-117.pdf`, `Measurements_snap-fit_hooks.xlsx`

**Test cases:** Complaint in the text; Complaint letter and measurements as files

**Result:** A structured 8D report with one field each for D1 to D8 and a list of open points the team still has to clarify. After approval, the run saves the report as a PDF and as an editable Word file. The report agent also proposes findings for knowledge; only what you explicitly adopt is stored.

**Adapting it:** Replace the test data with your complaint and attach inspection records, drawings or photos directly. If you use your own form, adjust the fields of the report agent under “Output format”. Findings you adopted from earlier complaints can be assigned to the root-cause analysis as knowledge.

## 3 · Compare supplier offers {#supplier-comparison}
<!-- keywords: logistics and purchasing, cost analyst, risk analyst, purchasing recommendation -->

**Field:** Logistics and purchasing · **Agents:** 3 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** input form, result files, files as input

The lowest unit price is rarely the cheapest offer. The workflow compares offers by total cost and supply risk and justifies a recommendation for purchasing.

**How the agents work together:** The cost analyst and the risk analyst work in parallel. One calculates the total cost of ownership per offer with the calculator tool, the other assesses lead time, dependencies and quality. The purchasing recommendation weighs both and delivers a structured result.

| Agent | Task | Receives |
|---|---|---|
| **Cost analyst** | Calculates the total cost per offer with the calculator tool. (Tools: `calculator`) | Offers |
| **Risk analyst** | Assesses lead time, dependencies, capacity and quality risks. | Offers |
| **Purchasing recommendation** | Weighs costs and risks and recommends a supplier. (structured output) | Cost analyst, Risk analyst |

**Input:** Several offers with price, freight, lead time, minimum quantity, payment terms and quality data, plus your internal cost rates. You can write the offers into the text or attach them as files, even mixed as PDF, Word and Excel; the three sample files show exactly that.

**Sample files:** `Offer_A_Example_Precision.pdf`, `Offer_B_Example_Components.docx`, `Offer_C_Sample_Metal_Parts.xlsx`

**Test cases:** Three offers in the text; Three offers as PDF, Word and Excel

**Result:** A structured recommendation with ranking, reasons, risks, negotiation points and the assumptions made. The run also saves it as a PDF report and as an Excel file with one sheet per list.

**Adapting it:** Attach your offers as files and enter demand and cost rates in the text. If you have fixed weightings (for example 50 % cost, 30 % risk, 20 % quality), add them to the system prompt of the purchasing recommendation. Framework agreements or supplier ratings can be stored as knowledge and assigned to the risk analyst.

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

**Adapting it:** Attach the annual report or your table of figures directly. Add further figures, such as gearing or free cash flow, in the system prompt of the analysis agent. For many companies one after another, use batch processing with one row per company.

## 6 · Blog article {#blog-article}
<!-- keywords: marketing and content, audience, outline, writer, editor -->

**Field:** Marketing and content · **Agents:** 4 · **Pattern:** parallel · **Level:** Beginner · **Building blocks:** result files

Good articles grow from a clear audience and a well-thought-out outline. The workflow splits the work like an editorial team and checks the result before it is published.

**How the agents work together:** Audience and outline are created in parallel with a fast model. The writer turns them into the article; a built-in quality check makes sure it follows the outline and answers the readers' questions. The editor checks length and readability with the text statistics tool and marks unverified claims.

| Agent | Task | Receives |
|---|---|---|
| **Audience** | Describes the readers, their questions and what they already know. | Topic |
| **Outline** | Drafts the title and the outline. | Topic |
| **Writer** | Writes the article from the outline and the audience. (with quality check) | Audience, Outline |
| **Editor** | Checks length and readability and delivers the final version. (Tools: `text_statistics`) | Writer |

**Input:** A topic in one sentence. Optionally add the audience, tone or desired length directly in the input.

**Test cases:** Topic in one sentence

**Result:** A finished article in Markdown with headings, a meta description and short editorial notes with word count and pointers to claims that should be backed up before publication. The run also saves the result as a Markdown and an HTML file that you can paste into your CMS.

**Adapting it:** Change the topic in the input. You can upload your style guide as knowledge and assign it to the writer and the editor. Set the desired length in the writer's system prompt.

## 7 · Prepare a tailored offer {#sales-offer}
<!-- keywords: sales, needs analyst, solution consultant, offer writer -->

**Field:** Sales · **Agents:** 3 · **Pattern:** sequential · **Level:** Advanced · **Building blocks:** approval, input form, result files, files as input

A good offer answers the customer's actual need, not just their keywords. The workflow clarifies the need, calculates a suitable solution and drafts a complete offer.

**How the agents work together:** The needs analyst separates explicit and unspoken requirements and collects open questions. The solution consultant puts together items from the price list and calculates with the calculator tool, including a variant within budget. The offer writer drafts the offer; a built-in quality check verifies completeness and prices. An input form takes the key facts (customer, deadline, budget, weekend assembly); before sending, a person approves the offer.

| Agent | Task | Receives |
|---|---|---|
| **Needs analyst** | Works out explicit and unspoken requirements. | Customer request |
| **Solution consultant** | Puts together suitable items and calculates with the calculator tool. (Tools: `calculator`) | Needs analyst, Customer request |
| **Offer writer** | Writes the draft offer for the customer. (with quality check) | Needs analyst, Solution consultant |

**Input:** The customer's request and your price list with discounts and terms. The form takes the key data; you can write the price list into the text or attach it as an Excel, CSV or PDF file, as the sample file shows.

**Sample files:** `Price_list_office_furniture.xlsx`

**Test cases:** Request and price list in the text; Price list as an Excel file

**Result:** A draft offer with cover letter, item table, totals, variants, assumptions and open questions. Only after your approval does the run save the offer as a PDF and as an editable Word file.

**Adapting it:** Attach your current price list as a file; then the customer request is enough as text. Add payment terms and standard wording in the system prompt of the offer writer.

## 8 · Answer customer enquiries {#customer-service}
<!-- keywords: customer service, classifier, policy checker, reply writer, de-escalation, revision -->

**Field:** Customer service · **Agents:** 5 · **Pattern:** branching · **Level:** Beginner · **Building blocks:** decision, approval, input form, files as input

In customer service many enquiries arrive at once, and each needs the right rule and the right tone. The workflow sorts the enquiries, checks policies and deadlines and prepares replies for approval.

**How the agents work together:** A fast classifier sorts each enquiry by topic, urgency and mood. The policy checker applies the service policy and recalculates deadlines with the date tool. The reply writer drafts the replies; a quality check makes sure nothing is promised beyond the policy. A decision node sends escalations to a de-escalation agent first. Every draft waits for approval; a rejection with feedback leads to a revised version.

| Agent | Task | Receives |
|---|---|---|
| **Classifier** | Sorts each enquiry by topic, urgency and mood. (structured output) | Enquiries |
| **Policy checker** | Applies the service policy and checks deadlines with the date tool. (Tools: `days_between`) | Classifier, Enquiries |
| **Reply writer** | Writes friendly draft replies for approval. (with quality check) | Classifier, Policy checker, De-escalation |
| **De-escalation** | Prepares how to handle upset customers and what needs approval. | Escalation? |
| **Revision** | Revises the drafts according to the reviewer's feedback. | Approve replies |

**Input:** Several customer enquiries with order and delivery data, today's date and your service policy, as an extract in the text or as a file (PDF, Word, Markdown); the sample file contains a more detailed policy.

**Sample files:** `Service_policy_Sample_Kitchen.pdf`

**Test cases:** Four enquiries, one of them angry; One friendly product question; Policy as a PDF file

**Result:** For each enquiry a classification, the applicable rule with a deadline check and a draft reply that a person approves before sending.

**Adapting it:** Attach your complete policy and FAQ as a file, or upload them as knowledge and assign them to the policy checker if they apply permanently. Set your brand's tone (formal or informal, sign-off) in the system prompt of the reply writer. Use batch processing to handle many enquiries at once.

## 9 · Advertise a job and prepare interviews {#hr-recruiting}
<!-- keywords: human resources, job profile, job advert, interview guide, fairness reviewer, revision -->

**Field:** Human resources · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, result files

Good hiring starts with a clear profile and fair, comparable interviews. The workflow turns loose notes into a job profile, an advert and an interview guide and checks everything for fairness.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The profile agent organises tasks and requirements. From this, the job advert and the interview guide are created in parallel. The fairness reviewer checks both for discriminatory or inadmissible wording, for example about age or mother tongue, and names what a person must check. If it raises objections, a decision node routes the documents to a revision that applies its suggestions; otherwise the first versions stand.

| Agent | Task | Receives |
|---|---|---|
| **Job profile** | Organises tasks, essential and desirable requirements and competencies. | Hiring need |
| **Job advert** | Writes an appealing, inclusive job advert. | Job profile |
| **Interview guide** | Prepares structured interview questions with rating anchors. | Job profile |
| **Fairness reviewer** | Checks the advert and the guide for discrimination and inadmissible questions. (structured output) | Job advert, Interview guide |
| **Revision** | Applies the changes suggested by the fairness review to the advert and the guide. | Revision needed? |

**Input:** Notes on the position: tasks, desired qualifications, team, conditions and pay.

**Test cases:** Notes with problematic wishes

**Result:** Job profile, job advert and interview guide with rating anchors, a structured fairness review and, if there were objections, a revised version with a list of changes, also as a Word file. The documents must be approved by HR or a qualified person before publication.

**Adapting it:** Replace the notes with your hiring need. You can store your employer profile and benefits as knowledge and assign them to the advert agent. Add the legal requirements of your country to the system prompt of the fairness reviewer. Do not extend the workflow to screening, rating or ranking applicants without a legal review: under the EU AI Act such systems are high-risk AI.

## 10 · Turn a research question into hypotheses {#research-hypotheses}
<!-- keywords: research and development, question analyst, hypothesis developer, methods critic, experiment planner -->

**Field:** Research and development · **Agents:** 4 · **Pattern:** sequential · **Level:** Advanced · **Building blocks:** input form, result files, files as input, knowledge proposals

Good research starts with a precise, testable question. The workflow breaks down a research question, formulates hypotheses, has them criticised methodologically and derives a realistic experimental plan.

**How the agents work together:** A sequential chain with a look back: the analyst clarifies variables and assumptions, the hypothesis agent formulates testable hypotheses with null hypotheses, the methods critic checks them against the pilot data with the calculator tool and names confounders. The experiment planner uses hypotheses and critique together.

| Agent | Task | Receives |
|---|---|---|
| **Question analyst** | Clarifies aim, variables, constraints and knowledge gaps. | Research question |
| **Hypothesis developer** | Formulates testable hypotheses with predictions and null hypotheses. | Question analyst |
| **Methods critic** | Checks hypotheses for testability, confounders and the data available. (Tools: `calculator`) | Hypothesis developer, Research question |
| **Experiment planner** | Derives an experimental plan from the hypotheses and the critique. | Hypothesis developer, Methods critic |

**Input:** A research question with its aim, existing data from pilot tests and constraints such as material, time and equipment. You can attach measurement data and documents as files; the sample file contains the pilot test ratings per panel.

**Sample files:** `Pilot_test_PL-7.csv`

**Test cases:** Question and pilot test in the text; Pilot test data as CSV

**Result:** An experiment plan with hypotheses, factors and levels, sample size, measurement method, analysis and stopping criteria, plus the open risks, also as a Word file. The experiment planner proposes the plan for knowledge; you decide whether it is stored.

**Adapting it:** Replace the question and pilot test with your own and attach measurement data directly. Literature you need again and again can be uploaded as knowledge in “Search” mode and assigned to the question analyst so that it works with quotations. Add your statistical guidelines to the methods critic.

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

**Adapting it:** Attach your project as a ZIP or paste code and name the language and framework. For other languages, adjust the test framework in the fix agent, for example Jest or JUnit. Your coding guidelines can be stored as knowledge. Through the workflow API, the review can also be triggered from a CI pipeline.

## 12 · Structure a contract and find check points {#contract-review}
<!-- keywords: legal and administration, contract structurer, clause explainer, check-point analyst, contract overview, critical clauses -->

**Field:** Legal and administration · **Agents:** 5 · **Pattern:** branching · **Level:** Advanced · **Building blocks:** decision, input form, result files, files as input, knowledge proposals

Contracts are long, and important clauses hide in the details. The workflow outlines a contract, explains it in plain language and collects points a qualified person should check. It does not replace legal advice.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** The structurer captures parties, term, services and deadlines. Building on this, the clause explainer (plain language) and the check-point analyst (unusual or one-sided provisions) work in parallel; both read the contract themselves, as text or as an uploaded file. If the check-point analyst finds critical clauses, a decision node adds an in-depth review of these clauses. The report agent combines everything into a structured overview with questions for legal advice.

| Agent | Task | Receives |
|---|---|---|
| **Contract structurer** | Records parties, subject, term, fees and deadlines. | Contract text |
| **Clause explainer** | Explains each clause in plain language. | Contract structurer, Contract text |
| **Check-point analyst** | Finds unusual, one-sided or missing provisions. (structured output) | Contract structurer, Contract text |
| **Contract overview** | Combines explanations and check points into a structured overview. (structured output) | Clause explainer, Check-point analyst, Critical clauses |
| **Critical clauses** | Examines critical clauses in depth and prepares negotiation questions. | Critical clauses? |

**Input:** The contract as a file (PDF, Word, Markdown or text) in the field “Contract as a file” or as text, ideally with section numbers. Upload the file directly when you start; you do not need a knowledge collection for it. The sample file contains the fictional contract of the test task.

**Sample files:** `Software_service_agreement_sample.docx`

**Test cases:** Contract in the text, with critical clauses; Contract as a Word file, no text; Balanced maintenance contract

**Result:** A structured overview with summary, key data, explained clauses, check points and questions for a lawyer, also as a PDF and as an editable Word file. The structurer proposes the key data of the contract for knowledge, for example for a contract register; only what you confirm is stored.

**Adapting it:** Upload your contract as a file when you start or paste it in. Add your own criteria, such as minimum requirements for liability or data protection, in the system prompt of the check-point analyst. Model contracts to compare against can be stored as knowledge and assigned to the check-point analyst.

## 13 · Create a personal learning plan {#learning-plan}
<!-- keywords: education and training, learning assessment, learning planner, tutor, quiz author -->

**Field:** Education and training · **Agents:** 4 · **Pattern:** parallel · **Level:** Beginner · **Building blocks:** input form, result files, files as input

Learning works better with a plan that starts where you are. The workflow creates a personal learning plan, explains the first topics and checks understanding with a quiz.

**How the agents work together:** The learning assessment determines the starting point and gaps, and the learning planner turns this into a weekly plan. On this basis, the tutor (learning content for the chosen week, based on your course materials if you like) and the quiz author (knowledge check with answers) work in parallel. The result contains all three parts.

| Agent | Task | Receives |
|---|---|---|
| **Learning assessment** | Determines the starting point, the learning goal and the gaps. | Learning goal |
| **Learning planner** | Creates a weekly plan with learning goals and exercises. | Learning assessment |
| **Tutor** | Explains the content of the first week with examples and exercises. | Learning planner, Learning goal |
| **Quiz author** | Creates a knowledge check with answers for the first week. | Learning planner |

**Input:** Who is learning, the learning goal, available time, prior knowledge and preferred learning style. In the form you choose the week to work out and can attach your own course materials; the sample file is a short guide to pivot tables.

**Sample files:** `Quick_guide_pivot_tables.docx`

**Test cases:** Week 1 without materials; Week 2 with course handout

**Result:** A four-week learning plan with goals for each week, clear explanations with exercises for the chosen week and a quiz with answers and explanations, also as a PDF to print.

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

**Adapting it:** Enter your travel wishes. If you want current prices and opening hours, you can add the "web search" server tool to the route planner; it costs extra per search.

## 16 · Evaluate a business idea {#business-idea}
<!-- keywords: self-employed and founders, market analyst, profitability calculator, risk analyst, investor jury -->

**Field:** Self-employed and founders · **Agents:** 4 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** result files

Before starting a business it pays to take a sober look at the market, figures and risks. The workflow has three experts examine the idea at the same time and a jury reach a justified verdict.

**How the agents work together:** Three agents work in parallel: the market analyst estimates target groups and competition, the profitability calculator works out break-even and scenarios with the calculator tool, the risk analyst looks for weak points. The investor jury weighs everything and delivers a structured verdict with a score.

| Agent | Task | Receives |
|---|---|---|
| **Market analyst** | Estimates target groups, demand and competition. | Business idea |
| **Profitability calculator** | Calculates contribution margin, break-even and scenarios with the calculator tool. (Tools: `calculator`) | Business idea |
| **Risk analyst** | Looks for weak points and risks of the idea. | Business idea |
| **Investor jury** | Weighs market, figures and risks and reaches a verdict. (structured output) | Market analyst, Profitability calculator, Risk analyst |

**Input:** A description of the idea with offering, target groups, prices, costs, capacity and known competitors.

**Test cases:** Mobile bicycle repair service

**Result:** A structured verdict (pursue, adapt or drop) with a score, strengths, risks, assumptions to test and concrete next steps for validation, also as a PDF report.

**Adapting it:** Describe your idea with your figures. The more honest the assumptions, the more useful the verdict. Upload your own market data or survey results as knowledge and assign them to the market analyst.

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

**Adapting it:** Enter your offers and financing data and attach listings, minutes of owners' meetings or floor plans directly. A rent index you need again and again can be stored as knowledge and assigned to the property and location analyst.

## 19 · Analyse construction delays {#construction-delay}
<!-- keywords: construction, schedule analyst, cause analyst, countermeasure planner, report to the client -->

**Field:** Construction · **Agents:** 4 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** approval, input form, result files, files as input

Delays on site add up, and clients quickly need a clear picture. The workflow calculates deviations, classifies causes, develops countermeasures and writes a status report.

**How the agents work together:** The schedule analyst and the cause analyst work in parallel. One calculates delays and float with the date and calculator tools, the other sorts causes by area of responsibility and documentation needs; both also evaluate attached schedules, site diaries and photos. The countermeasure planner develops acceleration options, and the report agent summarises everything for the client. Before the report leaves the project team, a person approves it.

| Agent | Task | Receives |
|---|---|---|
| **Schedule analyst** | Calculates delays, float and consequences with the date and calculator tools. (Tools: `days_between`, `calculator`) | Project status |
| **Cause analyst** | Classifies causes by area of responsibility and documentation needs. | Project status |
| **Countermeasure planner** | Develops acceleration measures with cost and effect. | Schedule analyst, Cause analyst |
| **Report to the client** | Summarises schedule position, causes and measures factually. | Schedule analyst, Countermeasure planner, Cause analyst |

**Input:** A schedule overview with planned and actual milestones, remarks on causes, report date and contractual conditions, as text or as files: schedule as Excel, site diary as PDF, photos as images. The sample files contain a schedule and an extract from the site diary.

**Sample files:** `Schedule_day_care_Sunny_View.xlsx`, `Site_diary_extract_April_May.pdf`

**Test cases:** Schedule overview in the text; Schedule and site diary as files

**Result:** A factual status report with schedule situation, causes, countermeasures, decisions needed and risks. After approval, the run saves it as a PDF and as an editable Word file. Questions on contractual penalties and extensions of time remain subject to expert and legal review.

**Adapting it:** Export your schedule from your project software as Excel and attach the site diary and photos. For a regular report you can run the copy on a schedule; the approval then waits for you.

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

**Adapting it:** Enter the key facts of your festival. Permits and conditions differ by municipality; add known requirements to the input. Logos and poster templates can be stored as knowledge.

## 23 · Develop a fundraising campaign {#nonprofit-campaign}
<!-- keywords: non-profit organisations, campaign developer, impact analyst, credibility reviewer -->

**Field:** Non-profit organisations · **Agents:** 3 · **Pattern:** parallel · **Level:** Advanced · **Building blocks:** result files, knowledge proposals

Fundraising campaigns need a moving story, but also honest statements about impact. The workflow develops a campaign, assesses the possible impact and checks whether promises are credible and ethically sound.

**How the agents work together:** The campaign developer and the impact analyst work in parallel: one designs message, target groups and measures, the other builds an impact model with indicators and calculates the cost per child with the calculator tool. The credibility reviewer checks both; the result contains all three parts.

| Agent | Task | Receives |
|---|---|---|
| **Campaign developer** | Designs the message, target groups, channels and schedule of the campaign. | Project description |
| **Impact analyst** | Builds an impact model with indicators and the cost per child. (Tools: `calculator`) | Project description |
| **Credibility reviewer** | Checks statements for exaggeration, ethics and evidence. (structured output) | Campaign developer, Impact analyst |

**Input:** Organisation, project, results so far, goal, funding need, campaign period and existing channels.

**Test cases:** Reading buddies at primary schools

**Result:** A campaign concept with timeline and draft texts, an impact model with indicators and a structured review for exaggerated claims, ethical notes and a plan for measuring impact, also as a Word file. The impact analyst proposes its impact model for knowledge, for example for later funding applications; only what you confirm is stored.

**Adapting it:** Describe your project and your results as honestly as possible. Upload annual reports or evaluations as knowledge and assign them to the impact analyst.

## 24 · Answer a citizen enquiry {#citizen-inquiry}
<!-- keywords: public institutions, concern analysis, information preparation, draft reply -->

**Field:** Public institutions · **Agents:** 3 · **Pattern:** sequential · **Level:** Beginner · **Building blocks:** input form, result files, files as input, knowledge proposals

Citizen enquiries often contain several concerns and must be answered correctly, clearly and without hasty commitments. The workflow breaks the enquiry down, finds the relevant rules in the information provided and prepares a reply.

> Needs expert check: the results are working aids and must be checked by a qualified person.

**How the agents work together:** A chain of three agents: the concern analysis separates the concerns and assigns responsibilities, the information preparation looks up the relevant rules only in the extract provided, and the draft reply writes a citizen-friendly answer. A quality check makes sure only documented rules are cited and no binding commitments are made.

| Agent | Task | Receives |
|---|---|---|
| **Concern analysis** | Separates the concerns and assigns responsibilities and urgency. | Citizen enquiry |
| **Information preparation** | Looks up the relevant rules only in the information provided. | Concern analysis, Citizen enquiry |
| **Draft reply** | Writes a factual, citizen-friendly reply for approval. (with quality check) | Concern analysis, Information preparation |

**Input:** The citizen's enquiry and the relevant internal information, rules and responsibilities, as an extract in the text or as files. You can also attach photos from the enquiry. The sample file is a fictional guidance note of the municipality.

**Sample files:** `Guidance_outbuildings_and_lighting.pdf`

**Test cases:** Garden shed and street lamp; Rules as a guidance note file

**Result:** A draft reply in plain language with responsibilities, next steps and notes for the case worker, also as a Word file for your letterhead. The information preparation proposes the rules it found, with references, for knowledge so that later enquiries can use them; only what you confirm is stored. The draft must be checked and approved by an expert before it is sent.

**Adapting it:** Attach your by-laws and guidance notes or upload them permanently as knowledge (“Search” mode with quotations) and assign them to the information preparation. Add letterhead and sign-off in the system prompt of the draft reply. Use batch processing to handle many enquiries at once.

<!-- examples:end -->

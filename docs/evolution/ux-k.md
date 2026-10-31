# UX-K: upload knowledge from the agent inspector

> Part of the product evolution plan, see [README.md](README.md). Requested by Peter on 2026-10-31 after the
> journey baseline: J3 ("give an agent knowledge") is the longest journey, at 10 actions and 4 page changes
> ([journeys.md](journeys.md)).

## Problem

The *Knowledge* section of an agent can only pick files that already exist in Knowledge. With none there, it says
"No files yet. Upload them under Knowledge". A person has to leave the editor, upload the file on the Knowledge
page, find the workflow and the agent again, open the section and tick the file. In J3 that is 4 page changes.

## What exists and is reused

| Piece | Where | Reused as is |
| --- | --- | --- |
| Upload | `POST /api/knowledge` (`nodestro_api/api.py`, `upload_knowledge`), client `api.uploadKnowledge(files, description, collection)` | yes: the same endpoint, form fields and permission (`EDIT`). One request is one decision: when any file is refused, none is kept (server-side rollback). |
| Storage and indexing | `Knowledge.add` in the runtime: type detection, text extraction, chunking, search index, OCR state | yes, unchanged |
| Validation and errors | server-side type and size checks; errors carry problem codes that `ProblemText` / `toast.error` already translate into six languages | yes |
| Assignment | `agent.knowledge.file_ids`, changed through the form's `update()` (editor undo history, unsaved-changes state, *Save*) | yes: an uploaded file is assigned with the same `update()` a pick from the list uses |
| Accepted formats | `ACCEPT` list in `pages/KnowledgePage.tsx` | moved to `lib/knowledge.ts` and shared, so both upload places offer the same formats |

There is no second knowledge store, no new endpoint, no new storage mechanism and no change to the API, the
runtime, the pins or the security rules.

## Storage semantics, stated in the interface

There are two kinds of files, and the difference is shown where it matters:

- **Agent knowledge (this step).** The file is stored permanently in **Knowledge**, the same library the
  Knowledge page manages. It can be used by other agents, searched, given a collection, run through OCR and
  deleted there. The agent only holds a *reference* (`knowledge.file_ids`).
- **Workflow input files (unchanged).** These are files given to a single run in the start dialog ("Hochgeladene
  Dateien gehören nur zu diesem Lauf (nicht zum Wissen)"), or start-form file fields. They belong to that run.
  They become knowledge only through the existing, explicit adoption flow (`/knowledge/adopt`).

Two moments are saved separately, and the section says so in one line next to the upload button:

1. The **upload** is saved at once. The file is in Knowledge from then on.
2. The **assignment** is an ordinary change to the agent. It marks the workflow (or library agent) as changed and
   is kept when you save. *Undo* and *Discard* remove the assignment, not the file. A file whose assignment was
   discarded stays in Knowledge, unassigned, where it can be deleted. Nothing is deleted behind the user's back.

## UX

In the *Knowledge* section, below the assigned chips:

- An **Upload file** button (icon and text), with the hint: "Saved permanently in Knowledge and assigned to this
  agent. The assignment is saved with the workflow." The section's own help tip links to the Knowledge chapter.
- Multiple files at once, with the same formats as the Knowledge page. While uploading, the button shows that it
  is busy and is disabled.
- On success: the files appear as assigned chips at once, and a toast names the file(s). The section stays open.
- On failure: the server's translated message appears as a toast. Nothing is assigned, and because of the
  rollback nothing is stored either.
- The empty-library hint changes from "No files yet. Upload them under Knowledge." to "No files in Knowledge yet.
  Upload one here or under Knowledge." The working link to the Knowledge page stays.
- The pick list for existing files is unchanged.

## Alternatives considered

| Option | What it is | Verdict |
| --- | --- | --- |
| **A. Upload, then assign as an unsaved change** | as above | **chosen.** It reuses the endpoint and the assignment path, keeps the save semantics of the editor and keeps undo honest. |
| B. Upload and save the workflow automatically | upload, assign, then save the workflow | rejected: an implicit save would also save every other pending edit, which would break the editor's save semantics. |
| C. Hold the file in the browser until the workflow is saved | defer the upload to *Save* | rejected: it is a new client-side storage mechanism, loses OCR and indexing feedback, and makes *Save* fail late on a file problem. |
| D. Link to the Knowledge page with a "return and assign" parameter | keeps uploading in one place | rejected for now: still two page changes, needs new routing state, and gains little over A. |
| E. A drop zone in the section | drag and drop onto the section | deferred: it can be added later on top of A. A button is enough for the first step and keeps the section compact. |

## Security and privacy

Nothing changes:

- The same endpoint, permission check (`EDIT`) and server-side validation apply.
- Files stay on this computer, in the same store as before.
- No telemetry is added.

The open item from the API review (knowledge content served inline without CSP or `nosniff`) is neither touched
nor made worse. It is tracked separately.

## Backward compatibility

- Stored workflows and agents load and save byte-identical.
- `knowledge.file_ids` keeps its meaning.
- The Knowledge page, the pick list, the start dialog's run files and the adoption flow are unchanged.
- The agent library page (`AgentsPage`) uses the same form. An upload there assigns the file to the library agent
  in the same way, with the same save semantics.

## Acceptance criteria

1. A file uploaded in the section appears in Knowledge (`GET /api/knowledge`) and as an assigned chip. The workflow
   is marked as changed. After *Save*, `knowledge.file_ids` contains it.
2. *Undo* removes the assignment. The file stays in Knowledge.
3. A refused upload shows the translated error and assigns nothing. The form is not changed (`onChange` is not
   called).
4. The section text states that the file is stored permanently in Knowledge, and the start dialog keeps its
   "only for this run" wording.
5. No new endpoint, no API, runtime or pin change. The upload goes through `api.uploadKnowledge`.
6. Texts in six languages. The i18n tests pass, and so does a component test in German.
7. A new journey **J3b** walks the same task through the new path and is reported next to J3. Expected, not
   promised: fewer actions and no page change. The numbers are reported as measured.

## Tests

- Component test (`AgentForm.test.tsx`):
  - an upload calls `POST /knowledge`, assigns the returned id through `onChange`, and shows the chip;
  - a refused upload calls no `onChange`;
  - the storage note is shown.
- Journey J3b in `frontend/e2e/journeys.mjs`, reported in `docs/evolution/journeys.md` next to J3.
- Existing suites unchanged and green.

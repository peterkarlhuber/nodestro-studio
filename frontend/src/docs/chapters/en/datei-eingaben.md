# Files as input

Workflows can take files directly as input: contracts, invoices, spreadsheets, images or whole ZIP archives. You upload them when starting, without taking them over into knowledge first. Nodestro checks and reads them locally and gives the agents exactly as much of them as they need.

## Overview {#ueberblick}
<!-- keywords: file, files, upload, input, document, attachment, start -->

- In the input form of the **Start** node you add fields of type **File**. When starting, you drop files into the field or choose them.
- Without a form, too, you can upload files or choose them from knowledge under *Files* in the start dialog.
- Uploaded files belong to the **run**, not to knowledge. They are listed in the run's detail view under *Received files*.
- What should be available to all agents permanently you take over [into knowledge](/docs/wissen#sammlungen) explicitly.

## File fields {#datei-felder}
<!-- keywords: file field, form, drag and drop, drop, folder, choose -->

A file field takes files by dropping them or via **Choose files**. Every file is uploaded and checked right away. The list shows name, format, size, the state and, if refused, the reason. Before the start you can remove files again and use the eye symbol to see what Nodestro read.

The run starts only when all files are uploaded. Refused files never become part of the run.

In an agent's task, `{{form.<name>}}` stands for the names of the field's files. The agent also gets the contents, as described under [Hand-over to agents](/docs/datei-eingaben#uebergabe). More about forms: [Input forms](/docs/verzweigungen#eingabeformular).

## Field settings {#feld-einstellungen}
<!-- keywords: settings, accepted types, several files, maximum, size, mb, limit -->

In the inspector of the Start node every file field has these settings:

| Setting | Meaning |
|---|---|
| Accepted file types | groups (text, data, documents, images, ZIP archives) or single formats; nothing selected accepts all |
| Several files | off: exactly one file; on: several files |
| Maximum number of files | optional upper limit for several files |
| Maximum MB per file | 20 MB by default, at most 50 MB |
| Hand-over to agents | *Automatic*, *Always the content* or *Overview, content on request* |

## Required and optional fields {#optionale-felder}
<!-- keywords: required, optional, empty, missing, not provided, is empty -->

Every field, not only file fields, is either **required** or **optional**. A required field must be filled before the start. An empty optional field stays empty:

- In an agent's task it shows as “(not provided)”, so the agent recognises that nothing was given.
- Decision nodes see an empty value and can test it with *is empty*.
- Empty file fields create no file references. This also holds for sub-workflows, published APIs and exported projects.

## Supported formats {#formate}
<!-- keywords: formats, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, image, zip -->

| Group | Formats | What Nodestro reads |
|---|---|---|
| Text | TXT, Markdown, source code | the text |
| Data | CSV, JSON, Excel (XLSX) | tables with columns; Excel with all sheets |
| Documents | PDF, Word (DOCX) | text with headings and tables; pages for PDFs |
| Images | PNG, JPG, WebP | the image; recognised text when OCR is on |
| Archives | ZIP | the folder structure and every contained file on its own |

Nodestro checks the **real content**, not only the extension: a renamed file, a damaged file or invalid JSON is refused with an understandable reason. Scanned PDFs without a text layer are read with OCR when text recognition is on. Excel formulas are never calculated; the stored value is read.

## Several files and folders {#mehrere-dateien}
<!-- keywords: several files, folder, directory, collection, relative paths -->

With **Choose folder**, or by dropping a folder, you upload all files in it. The relative paths stay in the file name (e.g. `Receipts/2024/Invoice.pdf`). Hidden system files are skipped. For very many files a ZIP archive works better.

## ZIP archives {#zip-archive}
<!-- keywords: zip, archive, unpack, tree, structure, folder, single files -->

A ZIP archive is a structured collection. Nodestro shows its contents as a tree with sizes and marks what can be read. Click a file in the tree to see what Nodestro reads from it.

Agents first get an **overview** of the archive and then read single files with the `input_files` tool (commands `list`, `read` and `search`). This keeps a large archive within the context. Archives inside the archive are listed but not opened.

## Hand-over to agents {#uebergabe}
<!-- keywords: hand-over, context, large files, tokens, context limit, multimodal, image, ocr, overview -->

Agents that get input from the Start node receive the run's files. Nodestro chooses the form so that structure is kept and the context does not overflow:

- **Text and tables** go to the agent as text as long as they fit (about 60,000 characters per file, 150,000 for all files together).
- **PDFs** with a text layer go to the agent as a document (text and layout), up to 100 pages.
- **Images** the agent sees itself when the model understands images. Otherwise this is noted. With OCR you see whether the agent got the recognised text or the image.
- **Large files and archives** come as an overview. The agent reads the parts it needs with `input_files`, e.g. certain pages, a sheet or ranges of rows.

The *Hand-over to agents* setting forces the content or the overview. For agents, uploaded content is always **data, not instructions**: Nodestro marks it accordingly.

## Tracing {#nachvollziehen}
<!-- keywords: trace, context, which files, preview, sent to model, transparency -->

- An agent's **input preview** shows before the start which files it gets and in which form.
- In a run's detail view the *Context* tab of each step shows which files went to the model and how (as text, as PDF document, as image, as recognised text or as overview).
- Calls of `input_files` are listed with input and output under *Tools*.
- *Received files* lists everything the run got and whether it has been taken over into knowledge since.

## Input or knowledge? {#eingabe-oder-wissen}
<!-- keywords: difference, input, knowledge, memory, permanent, once -->

| | File as input | Knowledge | Memory |
|---|---|---|---|
| For | material of this one run | documents for many runs and agents | notes an agent writes itself |
| Stored | with the run | on the *Knowledge* page | in the memory space |
| Searchable | only within the run | yes, for assigned agents | through the memory tool |

Input files never end up in knowledge automatically.

## Take over into knowledge {#knowledge-uebernahme}
<!-- keywords: take over, knowledge, collection, confirm, origin, duplicate, result -->

With **To knowledge** you explicitly take over:

- uploaded files of a run, single files from the tree for ZIP archives,
- result files (see [Result files](/docs/dateien#ergebnisdateien)),
- the result of a step and agent proposals.

Before storing, the dialog shows what would be stored, whether the file is searchable, whether the same content exists already (it is not stored twice) and similar content. Generated texts can be edited before storing and marked as *extracted from sources*, *generated by an agent* or *assumption*. You choose a collection or create a new one.

Nothing is stored before your confirmation, and only exactly the checked content: if you change something afterwards, you check again. Every file keeps its origin (workflow, step, agent, run, time, source files). Running workflows do not change.

## Agent proposals {#vorschlaege}
<!-- keywords: proposal, proposals, agent proposes, propose_knowledge, propose knowledge -->

In an agent's *Knowledge* section, switch on **May propose content for knowledge**. The agent then gets the `propose_knowledge` tool, and its result is offered as a proposal after the run. Proposals appear at the step in the run and are stored only once you have checked and confirmed them.

## Sub-workflows, tests and schedules {#sub-workflows}
<!-- keywords: sub-workflow, test series, batch, schedule, approval, resume, restart -->

- **Sub-workflows:** a file field of the sub-workflow gets the files of one field with `{{form.<field>}}` or all files of the run with `{{files}}`. The same stored files are passed on, no copies.
- **Approvals and resuming:** files stay stored while a run is waiting, running or paused, also across a restart of Nodestro.
- **Test cases and schedules:** files you upload there stay stored for the test case or [schedule](/docs/automatisierung#zeitplaene) and are used by every run. Files of earlier runs are never reused silently.

## Files through the API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, upload, curl, export, fastapi -->

Published workflows accept files in two ways:

- as JSON with `name`, `media_type` and `content_base64` in the file field's value,
- as `multipart/form-data`: one part per file named after the file field, the other fields as JSON in the part `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/check-contracts/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"customer": "ACME"}' \
  -F "contract=@contract.pdf"
```

The same checks and limits as in Nodestro apply. An [exported FastAPI project](/docs/api-und-export#export) processes files with the same runtime. Uploaded files are never part of the export.

## Storage and clean-up {#speicherung}
<!-- keywords: storage, clean up, delete, disk space, backup, restore -->

Uploaded files are kept in the data folder under `inputs`, not in the database and not in the workflow. Identical content is stored only once.

- Files of queued, running or paused runs are never removed.
- At start, Nodestro cleans up files nothing has used for more than a day. Under *Settings* you see the space used and remove unused files or files of finished runs above a certain age.
- Deleting a run releases its files if nothing else uses them.
- Backups contain the input files and restore them.

## Security {#sicherheit}
<!-- keywords: security, zip bomb, path, symlink, execute, macro, trust -->

- Archives are never run and never unpacked to disk. Nodestro reads single entries in memory.
- Unsafe paths (such as `../`), links, encrypted entries and program files are skipped and marked in the tree.
- Limits protect against ZIP bombs: archives with more than 5,000 entries, more than 512 MB unpacked or suspicious compression are refused; single entries above 25 MB are skipped.
- The contents of uploaded files are untrusted. Agents do not follow instructions in them as system instructions.

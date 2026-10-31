# Knowledge

Under *Knowledge* you store files that agents use as background material: manuals, reports, contracts, tables or images. This chapter explains formats, the three ways of using knowledge and how search works.

## Overview {#ueberblick}
<!-- keywords: knowledge, knowledge base, files, background knowledge, rag, documents -->

Knowledge works in three steps:

1. **Upload** on the *Knowledge* page. Texts and PDFs are automatically indexed for full-text search.
2. **Assign** in an agent's inspector (*Knowledge* section). An agent only sees the files assigned to it.
3. **Choose a mode:** *In context*, *On demand* or *Search*.

A file can be assigned to any number of agents.

## Uploading files {#hochladen}
<!-- keywords: upload, drag and drop, drag, description -->

Click **Upload files** or drag files onto the drop area; several at once are possible. Each file shows its size, type, number of indexed sections and age. The file name opens the original in a new tab.

If you upload **exactly the same file** again, no duplicate is created: the identifier is derived from the content, and the name and description are updated.

You can also upload files directly in an agent's *Knowledge* section; they land here, without a collection, and are assigned to that agent at once ([Agents](/docs/agenten#wissen)).

## Formats and limits {#formate}
<!-- keywords: formats, pdf, image, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, size, limit, mb -->

| Kind | Formats | Size | Searchable |
|---|---|---|---|
| Documents | PDF | up to 20 MB | yes, page by page (PDFs with a text layer or after OCR) |
| Office | Word (DOCX), Excel (XLSX), converted to Markdown | up to 20 MB | yes |
| Texts | TXT, Markdown, CSV, JSON, YAML, HTML, XML | up to 20 MB | yes |
| Images | PNG, JPEG, GIF, WebP | up to 5 MB | no |

Texts must be UTF-8 encoded. Word and Excel are converted on upload; formulas are shown, never calculated (see [Word and Excel](/docs/dateien#dokumentformate)). **Scanned PDFs** without a text layer are stored and can be read in context or on demand, but only become searchable after [text recognition (OCR)](/docs/dateien#ocr).

## Indexing {#indexierung}
<!-- keywords: index, indexing, sections, chunks, fts5, full text -->

When you upload, Nodestro splits the text into **sections** of about 1,500 characters with 200 characters of overlap, at paragraph boundaries. PDFs are indexed page by page; hits then carry titles such as "Report, p. 3". The number of sections is shown next to each file.

The index is an SQLite full-text search (FTS5 with BM25 ranking) right in the Nodestro database. No external service and no embedding model is needed, and indexing costs nothing.

## The three modes {#modi}
<!-- keywords: in context, on demand, search, context, files tool, search tool, mode -->

| Mode | What the agent gets | Suitable for | Costs |
|---|---|---|---|
| **In context** | All assigned files in full at the beginning of the prompt. | A few short documents that are always needed (style guide, price list). Images too. | Every request contains all files; caching makes repetitions cheap. |
| **On demand** | A catalogue (name, type, size, description) and the `files` tool, with which it loads individual files in full. | Medium-sized collections where only some files matter for each task. Images and scanned PDFs too. | Only loaded files cost tokens. |
| **Search** | The `search` tool, which returns the best-matching sections with their source (RAG). | Large documents and collections from which individual facts are needed. | Only sections found cost tokens. |

**Recommendations:**

- In *On demand* mode, the agent decides which file to load based on the **description**. Keep descriptions meaningful.
- In *Search* mode, the agent can search several times with different terms. Tell it in the system prompt to back up statements with sources.
- Images and PDFs without text are invisible in *Search* mode.

## Citations {#zitate}
<!-- keywords: citations, sources, passages, back up -->

**Enable citations** applies to *In context* mode: the answer then refers to the exact passages in the documents. In *Search* mode, the search results always include sources.

Citations **cannot be combined with a structured output format**; the check reports this as an error.

## Attaching files at the start {#start-dateien}
<!-- keywords: attach files, start dialog, one-off, per run, attachment -->

In the start dialog you can select knowledge files under **Attach files** for **this one run**. They are put directly into the context of the first agents, that is, the agents connected to the start or without predecessors. Later agents do not receive them, only the results of their predecessors.

This way you can, for example, start a workflow with a different contract each time without reconfiguring the agents. The file must have been uploaded under *Knowledge* first.

## Trying the search {#suche}
<!-- keywords: test search, search term, score, hits, bm25, accents -->

On the right of the *Knowledge* page you test the search across **all** indexed files, exactly as an agent uses it in *Search* mode (the agent only searches its assigned files). Each hit shows its title, a text excerpt and the **score** (relevance; higher is better).

Properties of the search:

- Accents and umlauts are normalized: "cafe" finds "café".
- Words also match as the start of a word: "guarantee" finds "guarantees".
- It is a keyword search, not a semantic search: synonyms are not found. Phrase search terms the way they appear in the document.

The filter field on the left only searches file names and descriptions.

## Collections and origin {#sammlungen}
<!-- keywords: collection, collections, organise, origin, taken over, searchable -->

Collections group knowledge files, e.g. “Contracts” or “Product data”. When uploading, choose a collection under *Upload into collection*; you can change it for every file later. The chips above the list filter by collection. Agents still get exactly the files assigned to them.

Content from runs (uploaded files, result files, results and agent proposals) only reaches knowledge after your confirmation, see [Take over into knowledge](/docs/datei-eingaben#knowledge-uebernahme). Such files show under *Origin* which workflow, step and run they come from and whether the content was extracted, generated or is an assumption.

## Managing files {#verwalten}
<!-- keywords: edit description, delete, manage, remove -->

- **Description:** enter it right next to the file; it is saved when you leave the field. Good descriptions name content, period and purpose, for example "Annual report 2025 with balance sheet and risk report".
- **Delete:** bin symbol. The file and its index are removed. Agents it was assigned to keep running and simply no longer receive it.

## Tips and common mistakes {#tipps}
<!-- keywords: tips, mistakes, agent finds nothing, too expensive, context too large -->

- **The agent finds nothing:** check under *Try the search* whether the file is indexed and the term is found. If the file is a scanned PDF, use *On demand*.
- **Runs get expensive:** many large files *In context* fill every request. Switch to *On demand* or *Search*.
- **Context window exceeded:** too many or too large files in context lead to an API error. Spread the knowledge or use search.
- **Answer without sources:** explicitly ask in the system prompt for statements to be backed up with sources.

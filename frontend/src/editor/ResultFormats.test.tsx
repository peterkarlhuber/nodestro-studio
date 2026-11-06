// The result file formats in the interface: the result node's "Result files" (Properties → Result), the run's
// "Create file" dialog and its file list. Word and Excel once showed as "flow.files.formats.docx" and
// "flow.files.formats.xlsx"; every format must read as a name with its extension, in every language.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { ReportFormat, ResultFile, Run, Workflow } from "../api/types";
import i18n, { LANGUAGES, setLanguage } from "../i18n";
import { newNode } from "../lib/defaults";
import { RESULT_FORMATS, RESULT_FORMAT_IDS, canPreview, isResultFormat, resultFormatLabel } from "../lib/resultFormats";
import { ResultFiles } from "../runs/ResultFiles";
import { bundles } from "../test/locales";
import { OutputFilesEditor } from "./FlowInspectors";
import { useEditor } from "./store";

/** Text that looks like a translation key ("flow.files.formats.docx") instead of a sentence. */
const KEY_LIKE = /\b[a-z][a-zA-Z]+(\.[a-zA-Z0-9_]+){2,}\b/;

function workflow(files: { format: ReportFormat; name: string; sanitize: boolean }[]): Workflow {
  const out = { ...newNode("output", { x: 600, y: 0 }), id: "out", label: "Ergebnis", output: { files } };
  return {
    id: "wf_1",
    name: "Kosten",
    description: "",
    budget_usd: null,
    nodes: [{ ...newNode("start"), id: "start", label: "Start" }, out],
    edges: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function Inspector() {
  const node = useEditor((state) => state.nodes.find((item) => item.id === "out"));
  return node ? <OutputFilesEditor node={node} /> : null;
}

function wrap(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("the format table", () => {
  it("keeps the stored ids, their order and the preview of Markdown, HTML and PDF", () => {
    expect(RESULT_FORMAT_IDS).toEqual(["md", "json", "csv", "html", "pdf", "docx", "xlsx"]);
    for (const format of RESULT_FORMATS) expect(format.extension).toBe(format.id);
    expect(RESULT_FORMAT_IDS.filter(canPreview)).toEqual(["md", "html", "pdf"]);
    expect(isResultFormat("docx")).toBe(true);
    expect(isResultFormat("DOCX")).toBe(false);
    expect(isResultFormat("doc")).toBe(false);
    expect(canPreview("unknown")).toBe(false);
  });

  it.each(LANGUAGES)("names every format with its extension in %s", async (language) => {
    await setLanguage(language, false);
    const labels = RESULT_FORMAT_IDS.map((id) => resultFormatLabel(i18n.t.bind(i18n), id));
    expect(new Set(labels).size).toBe(labels.length);
    RESULT_FORMATS.forEach((format, index) => {
      expect(labels[index]).not.toMatch(KEY_LIKE);
      expect(labels[index]).toContain(`(.${format.extension})`);
      // The text comes from the language itself, not from the English fallback.
      const own = ((bundles[language].flow as Record<string, Record<string, Record<string, string>>>).files.formats ?? {})[format.id];
      expect(own, `${language}: flow.files.formats.${format.id}`).toBe(labels[index]);
    });
    expect(labels[5]).toMatch(/Word/);
    expect(labels[6]).toMatch(/Excel/);
  });
});

describe("Properties → Result → Result files", () => {
  beforeEach(() =>
    useEditor.getState().load(
      workflow([
        { format: "docx", name: "Bericht", sanitize: false },
        { format: "xlsx", name: "", sanitize: false },
      ]),
    ),
  );

  it("shows stored Word and Excel entries by name and offers every format", () => {
    wrap(<Inspector />);
    const pickers = screen.getAllByRole("combobox", { name: "Format" });
    expect(pickers).toHaveLength(2);
    expect((pickers[0] as HTMLSelectElement).selectedOptions[0].textContent).toBe("Word-Dokument (.docx)");
    expect((pickers[1] as HTMLSelectElement).selectedOptions[0].textContent).toBe("Excel-Arbeitsmappe (.xlsx)");
    const options = within(pickers[0]).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("value"))).toEqual([...RESULT_FORMAT_IDS]);
    for (const option of options) expect(option.textContent).not.toMatch(KEY_LIKE);
  });

  it("stores the format id, unchanged, when Word or Excel is chosen", async () => {
    wrap(<Inspector />);
    const [first, second] = screen.getAllByRole("combobox", { name: "Format" });
    await userEvent.selectOptions(first, "xlsx");
    await userEvent.selectOptions(second, "md");
    await userEvent.selectOptions(second, "docx");
    expect(useEditor.getState().nodes.find((node) => node.id === "out")?.output?.files.map((file) => file.format)).toEqual([
      "xlsx",
      "docx",
    ]);
  });

  it("follows a language switch at once", async () => {
    wrap(<Inspector />);
    await act(() => setLanguage("fr", false));
    const [first] = screen.getAllByRole("combobox", { name: "Format" });
    expect((first as HTMLSelectElement).selectedOptions[0].textContent).toBe("Document Word (.docx)");
    await act(() => setLanguage("pt-BR", false));
    expect(screen.getAllByRole("combobox")[1]).toHaveDisplayValue("Pasta de trabalho do Excel (.xlsx)");
  });
});

describe("the result files of a run", () => {
  const run = {
    id: "run_1",
    status: "succeeded",
    workflow_name: "Kosten",
    workflow: workflow([]),
    nodes: {},
  } as unknown as Run;
  const file = (format: ReportFormat, name: string): ResultFile => ({
    id: `file_${format}`,
    run_id: "run_1",
    name,
    format,
    media_type: RESULT_FORMATS.find((item) => item.id === format)!.mediaType,
    size: 2048,
    created_at: "2026-11-06T09:00:00Z",
    source: "output",
    node_id: "out",
    sanitized: false,
    error_code: null,
    error: null,
    error_params: {},
  });

  it("lists Word and Excel files for download with their names, without a preview", async () => {
    vi.spyOn(api, "resultFiles").mockResolvedValue([file("docx", "Kosten.docx"), file("xlsx", "Kosten.xlsx"), file("pdf", "Kosten.pdf")]);
    wrap(<ResultFiles run={run} />);
    const word = await screen.findByText("Kosten.docx");
    const row = (name: string) => screen.getByText(name).closest("li") as HTMLElement;
    expect(within(row("Kosten.docx")).getByText("DOCX")).toBeInTheDocument();
    const download = within(row("Kosten.docx")).getByRole("link");
    expect(download.getAttribute("download")).toBe("Kosten.docx");
    expect(download.getAttribute("href")).toBe(api.resultFileUrl("run_1", "file_docx"));
    expect(within(row("Kosten.xlsx")).getByRole("link").getAttribute("download")).toBe("Kosten.xlsx");
    // Only formats a browser can show get the eye button.
    const viewName = (name: string) => i18n.t("flow.files.view", { name });
    expect(within(row("Kosten.docx")).queryByRole("button", { name: viewName("Kosten.docx") })).toBeNull();
    expect(within(row("Kosten.xlsx")).queryByRole("button", { name: viewName("Kosten.xlsx") })).toBeNull();
    expect(within(row("Kosten.pdf")).getByRole("button", { name: viewName("Kosten.pdf") })).toBeInTheDocument();
    expect(word.closest("section")?.textContent).not.toMatch(KEY_LIKE);
  });

  it("creates a Word file later with the format id the API expects", async () => {
    vi.spyOn(api, "resultFiles").mockResolvedValue([]);
    const create = vi.spyOn(api, "createResultFile").mockResolvedValue(file("docx", "Kosten.docx"));
    wrap(<ResultFiles run={run} />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("flow.files.create") }));
    const dialog = await screen.findByRole("dialog");
    const picker = within(dialog).getByRole("combobox", { name: "Format" });
    const labels = within(picker)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(labels).toContain("Word-Dokument (.docx)");
    expect(labels).toContain("Excel-Arbeitsmappe (.xlsx)");
    for (const label of labels) expect(label).not.toMatch(KEY_LIKE);
    fireEvent.change(picker, { target: { value: "docx" } });
    await userEvent.click(within(dialog).getByRole("button", { name: i18n.t("flow.files.createButton") }));
    await waitFor(() => expect(create).toHaveBeenCalledWith("run_1", { format: "docx", name: "", node_id: null, sanitize: false }));
  });
});

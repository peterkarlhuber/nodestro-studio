import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, api, uploadForm } from "../api/client";
import type { AssistantFile, AssistantFileSupport, Conversation, SentFile } from "../api/types";
import { ComposerFileChips, ConversationFiles, SentFileChips, useFileDrop } from "./AssistantFiles";
import { type ComposerFiles, precheckFile, supportKey, useComposerFiles } from "./useComposerFiles";

const SUPPORT: AssistantFileSupport = {
  model: "anthropic:claude-sonnet-4-6",
  max_file_mb: 50,
  max_files_per_message: 2,
  max_files_per_conversation: 50,
  images: true,
  pdfs: true,
  formats: [
    { key: "pdf", group: "document", extensions: [".pdf"], indexable: true },
    { key: "xlsx", group: "data", extensions: [".xlsx"], indexable: true },
    { key: "png", group: "image", extensions: [".png"], indexable: false },
  ],
};

function file(extra: Partial<AssistantFile> = {}): AssistantFile {
  return {
    id: "in_000000000001",
    name: "bericht.pdf",
    format: "pdf",
    group: "document",
    media_type: "application/pdf",
    size: 2048,
    info: { pages: 3 },
    notes: [],
    outline: "PDF with 3 pages",
    chars: 1200,
    added_at: "2026-11-06T10:00:00Z",
    sent_at: null,
    mode: "document",
    mode_notes: [],
    knowledge_ids: [],
    ...extra,
  };
}

function composer(extra: Partial<ComposerFiles> = {}): ComposerFiles {
  return {
    support: SUPPORT,
    files: [],
    selected: [],
    uploads: [],
    uploading: false,
    limit: 10,
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    dismiss: vi.fn(),
    reuse: vi.fn(),
    sent: vi.fn(),
    reset: vi.fn(),
    store: vi.fn(),
    ...extra,
  };
}

function conversation(files: AssistantFile[]): Conversation {
  return {
    id: "chat_1",
    title: "",
    auto_title: true,
    created_at: "2026-11-06T10:00:00Z",
    updated_at: "2026-11-06T10:00:00Z",
    usage: {} as Conversation["usage"],
    messages: 0,
    history: [],
    streaming: null,
    attachment_states: [],
    file_states: files,
  };
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(supportKey, SUPPORT);
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("assistant files: before uploading", () => {
  it("refuses unsupported, empty and oversized files in the browser", () => {
    expect(precheckFile({ name: "setup.exe", size: 10 }, SUPPORT)?.code).toBe("input.unsupported_format");
    expect(precheckFile({ name: "leer.pdf", size: 0 }, SUPPORT)?.code).toBe("input.empty");
    expect(precheckFile({ name: "riesig.pdf", size: 51 * 1024 * 1024 }, SUPPORT)).toEqual({
      code: "input.too_large",
      params: { name: "riesig.pdf", limit_mb: 50 },
    });
    expect(precheckFile({ name: "tabelle.xlsx", size: 2000 }, SUPPORT)).toBeNull();
  });
});

describe("assistant files: the composer", () => {
  it("shows name, type, size, the path to the model and every upload state", () => {
    const remove = vi.fn(async () => undefined);
    const dismiss = vi.fn();
    const files = composer({
      selected: [file(), file({ id: "in_000000000002", name: "kosten.xlsx", format: "xlsx", group: "data", mode: "text", sent_at: "2026-11-06T10:01:00Z" })],
      uploads: [
        { key: "u1", name: "foto.png", size: 4096, status: "uploading" },
        { key: "u2", name: "setup.exe", size: 10, status: "error", problem: { code: "input.unsupported_format", params: { name: "setup.exe", suffix: "exe" } } },
      ],
      uploading: true,
      remove,
      dismiss,
    });
    render(<ComposerFileChips files={files} />);
    const chips = screen.getAllByTestId("composer-file");
    expect(chips.map((chip) => chip.dataset.state)).toEqual(["ready", "ready", "uploading", "error"]);
    expect(chips[0]).toHaveTextContent("bericht.pdf");
    expect(chips[0]).toHaveTextContent("PDF · 2,0 kB");
    expect(chips[0]).toHaveTextContent("PDF nativ");
    expect(chips[1]).toHaveTextContent("Extrahierter Text");
    expect(chips[1]).toHaveTextContent("Erneut");
    expect(chips[2]).toHaveTextContent("Wird hochgeladen und gelesen");
    expect(screen.getByRole("alert")).toHaveTextContent("setup.exe");
    expect(screen.getByTestId("composer-files-model")).toHaveTextContent("claude-sonnet-4-6 liest PDFs und Bilder nativ.");

    fireEvent.click(screen.getByRole("button", { name: "bericht.pdf aus der Nachricht entfernen" }));
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: "in_000000000001" }));
    fireEvent.click(screen.getByRole("button", { name: "setup.exe ausblenden" }));
    expect(dismiss).toHaveBeenCalledWith("u2");
  });

  it("says why a model cannot read a file", () => {
    const files = composer({ selected: [file({ name: "foto.png", format: "png", group: "image", mode: "unavailable", mode_notes: ["input.model_no_images"] })] });
    render(<ComposerFileChips files={files} />);
    const tag = screen.getByTestId("file-mode");
    expect(tag).toHaveTextContent("Nicht lesbar");
    expect(tag.getAttribute("aria-label")).toMatch(/Bild/);
  });

  it("takes files dropped on the composer", () => {
    const onFiles = vi.fn();
    function Zone() {
      const drop = useFileDrop(onFiles);
      return (
        <div data-testid="zone" data-dragging={drop.dragging} {...drop.props}>
          zone
        </div>
      );
    }
    render(<Zone />);
    const zone = screen.getByTestId("zone");
    const pdf = new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" });
    const dataTransfer = { types: ["Files"], files: [pdf], dropEffect: "none" };
    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone.dataset.dragging).toBe("true");
    fireEvent.drop(zone, { dataTransfer });
    expect(zone.dataset.dragging).toBe("false");
    expect(onFiles).toHaveBeenCalledWith([pdf]);
    // Dragged text is not a file: nothing happens.
    fireEvent.drop(zone, { dataTransfer: { types: ["text/plain"], files: [] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
  });
});

describe("assistant files: uploading", () => {
  it("uploads each file on its own and keeps refused ones with the reason", async () => {
    const upload = vi.spyOn(api, "uploadAssistantFile").mockImplementation(async (_id, chosen) => [
      chosen.name === "kaputt.pdf"
        ? { name: chosen.name, file: null, problem: { code: "input.damaged", params: { name: chosen.name }, message: "" } }
        : { name: chosen.name, file: file({ name: chosen.name }), problem: null },
    ]);
    const ensure = vi.fn(async () => "chat_1");
    const { result } = renderHook(() => useComposerFiles(conversation([]), ensure), { wrapper: wrapper() });
    await act(async () => {
      await result.current.add([
        new File(["%PDF-1.4"], "gut.pdf"),
        new File(["%PDF"], "kaputt.pdf"),
        new File(["MZ"], "setup.exe"),
        new File(["x"], "zu-viel.pdf"),
      ]);
    });
    // The browser refused the program; the message holds two files, so the fourth is refused too.
    expect(upload.mock.calls.map((call) => call[1].name)).toEqual(["gut.pdf", "kaputt.pdf"]);
    expect(ensure).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.uploading).toBe(false));
    expect(result.current.uploads.map((item) => [item.name, item.status, item.problem?.code])).toEqual([
      ["setup.exe", "error", "input.unsupported_format"],
      ["zu-viel.pdf", "error", "assistant.too_many_message_files"],
      ["kaputt.pdf", "error", "input.damaged"],
    ]);
  });

  it("deletes a waiting file and only unselects a reused one", async () => {
    const waiting = file();
    const earlier = file({ id: "in_000000000002", name: "alt.pdf", sent_at: "2026-11-06T09:00:00Z" });
    const removed = vi.spyOn(api, "removeAssistantFile").mockResolvedValue(conversation([earlier]));
    const { result } = renderHook(() => useComposerFiles(conversation([waiting, earlier]), async () => "chat_1"), { wrapper: wrapper() });
    expect(result.current.selected.map((item) => item.name)).toEqual(["bericht.pdf"]);
    act(() => result.current.reuse(earlier));
    expect(result.current.selected.map((item) => item.name)).toEqual(["bericht.pdf", "alt.pdf"]);
    await act(async () => result.current.remove(earlier));
    expect(removed).not.toHaveBeenCalled();
    expect(result.current.selected.map((item) => item.name)).toEqual(["bericht.pdf"]);
    await act(async () => result.current.remove(waiting));
    expect(removed).toHaveBeenCalledWith("chat_1", waiting.id);
  });
});

describe("assistant files: the conversation and its messages", () => {
  it("lists the chat's files with use again, preview, download, knowledge and delete", () => {
    const reuse = vi.fn();
    const earlier = file({ sent_at: "2026-11-06T09:00:00Z", knowledge_ids: ["kf_1"] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ConversationFiles conversationId="chat_1" files={composer({ files: [earlier, file({ id: "in_000000000003", name: "neu.png", group: "image", format: "png", mode: "image" })], reuse })} />
      </QueryClientProvider>,
    );
    const toggle = screen.getByTestId("conversation-files-toggle");
    expect(toggle).toHaveTextContent("2 Dateien in diesem Chat");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    const rows = screen.getAllByTestId("conversation-file");
    expect(rows[0]).toHaveTextContent("Im Wissen");
    expect(rows[1]).toHaveTextContent("Nächste Nachricht");
    // Only files sent before can be used again; a waiting one goes with the next message anyway.
    expect(screen.getAllByTestId("conversation-file-reuse")).toHaveLength(1);
    fireEvent.click(screen.getByTestId("conversation-file-reuse"));
    expect(reuse).toHaveBeenCalledWith(earlier);
    expect(screen.getByRole("link", { name: "bericht.pdf herunterladen" })).toHaveAttribute(
      "href",
      "/api/assistant/conversations/chat_1/files/in_000000000001/content",
    );
  });

  it("shows the files a message carried and how the model received them", () => {
    const sent: SentFile[] = [
      { file_id: "in_1", name: "bericht.pdf", format: "pdf", group: "document", size: 2048, mode: "document", notes: [], chars: 0 },
      { file_id: "in_2", name: "gross.xlsx", format: "xlsx", group: "data", size: 4096, mode: "overview", notes: ["input.too_large_inline"], chars: 0 },
    ];
    render(<SentFileChips files={sent} />);
    expect(screen.getAllByTestId("file-mode").map((tag) => tag.textContent)).toEqual(["PDF nativ", "Übersicht"]);
  });
});

describe("assistant files: upload progress (ST-055)", () => {
  it("shows the sent share of each file, then that the server reads it", () => {
    const files = composer({
      uploads: [
        { key: "u1", name: "gross.pdf", size: 40_000_000, status: "uploading", progress: 0.42 },
        { key: "u2", name: "fertig.pdf", size: 40_000_000, status: "uploading", progress: 1 },
        { key: "u3", name: "alt.pdf", size: 4096, status: "uploading" },
      ],
      uploading: true,
    });
    render(<ComposerFileChips files={files} />);
    const chips = screen.getAllByTestId("composer-file");
    expect(chips[0]).toHaveTextContent("Wird hochgeladen");
    expect(screen.getByTestId("composer-file-percent")).toHaveTextContent(/42\s%/);
    const bar = screen.getByRole("progressbar", { name: "Hochladen von gross.pdf" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    // All bytes sent: the server checks and reads the file, without a bar.
    expect(chips[1]).toHaveTextContent("Wird gelesen");
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    // Without measured progress the earlier sentence stays.
    expect(chips[2]).toHaveTextContent("Wird hochgeladen und gelesen");
    // Only the phase is announced, never every percent.
    expect(screen.getAllByRole("status").map((item) => item.textContent)).toEqual(["Wird hochgeladen", "Wird gelesen …", "Wird hochgeladen und gelesen …"]);
  });

  it("keeps the progress of a running upload in whole percent", async () => {
    let report: (share: number) => void = () => {};
    let finish: () => void = () => {};
    const upload = vi.spyOn(api, "uploadAssistantFile").mockImplementation(
      (_id, chosen, onProgress) =>
        new Promise((resolve) => {
          report = onProgress ?? (() => {});
          finish = () => resolve([{ name: chosen.name, file: file({ name: chosen.name }), problem: null }]);
        }),
    );
    const { result } = renderHook(() => useComposerFiles(conversation([]), async () => "chat_1"), { wrapper: wrapper() });
    let adding: Promise<void> = Promise.resolve();
    act(() => {
      adding = result.current.add([new File(["%PDF-1.4"], "gross.pdf")]);
    });
    await waitFor(() => expect(result.current.uploads).toHaveLength(1));
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    act(() => report(0.4239));
    expect(result.current.uploads[0].progress).toBe(0.42);
    act(() => report(1));
    expect(result.current.uploads[0].progress).toBe(1);
    await act(async () => {
      finish();
      await adding;
    });
    expect(result.current.uploads).toEqual([]);
  });
});

describe("uploadForm", () => {
  class FakeXhr {
    static last: FakeXhr | null = null;
    upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null; onload: (() => void) | null } = {
      onprogress: null,
      onload: null,
    };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    status = 0;
    statusText = "";
    responseText = "";
    headers: Record<string, string> = {};
    method = "";
    url = "";
    body: unknown = null;
    constructor() {
      FakeXhr.last = this;
    }
    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }
    send(body: unknown) {
      this.body = body;
    }
  }

  afterEach(() => vi.unstubAllGlobals());

  it("reports the sent share and resolves with the JSON answer", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const shares: number[] = [];
    const form = new FormData();
    const done = uploadForm<{ ok: boolean }>("/assistant/conversations/c/files", form, (share) => shares.push(share));
    const xhr = FakeXhr.last!;
    expect([xhr.method, xhr.url, xhr.body]).toEqual(["POST", "/api/assistant/conversations/c/files", form]);
    expect(xhr.headers["Accept-Language"]).toBe("de");
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 50, total: 0 });
    xhr.upload.onload?.();
    Object.assign(xhr, { status: 200, responseText: JSON.stringify({ ok: true }) });
    xhr.onload?.();
    await expect(done).resolves.toEqual({ ok: true });
    expect(shares).toEqual([0.25, 1]);
  });

  it("rejects with the API's problem code, and with a network error", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const refused = uploadForm("/x", new FormData(), () => {});
    Object.assign(FakeXhr.last!, {
      status: 413,
      statusText: "Payload Too Large",
      responseText: JSON.stringify({ detail: "The request is too large", code: "request.too_large", params: { limit_mb: 50 } }),
    });
    FakeXhr.last!.onload?.();
    await expect(refused).rejects.toMatchObject({ status: 413, code: "request.too_large", params: { limit_mb: 50 } });
    const lost = uploadForm("/x", new FormData(), () => {});
    FakeXhr.last!.onerror?.();
    await expect(lost).rejects.toBeInstanceOf(ApiError);
  });

  it("is the plain request without a progress callback", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([1]), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    FakeXhr.last = null;
    await expect(uploadForm("/x", new FormData())).resolves.toEqual([1]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(FakeXhr.last).toBeNull();
  });
});

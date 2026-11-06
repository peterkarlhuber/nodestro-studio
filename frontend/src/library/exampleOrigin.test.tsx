import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "../api/client";
import type { ExampleDetail, InputField, InputFile, WorkflowOrigin } from "../api/types";
import { FormFields } from "../components/FormFields";
import { OfflineBadge, offlineIntegrations, useOriginSamples } from "./exampleOrigin";

const ORIGIN: WorkflowOrigin = {
  kind: "example",
  example_id: "offer-from-inquiry",
  version: "0.3.0",
  language: "de",
  offline: ["crm"],
  connected: [],
  copied_at: "2026-11-06T10:00:00Z",
};

const EXAMPLE = {
  id: "offer-from-inquiry",
  name: "Angebot aus Anfrage",
  integrations: [{ id: "crm", kind: "mcp", name: "CRM-System", description: "", setup: "", tools: [], offline: "" }],
  samples: [
    { id: "inquiry", field: "inquiry", field_label: "Anfrage", format: "pdf", file_name: "anfrage.pdf", description: "Eine erfundene Anfrage" },
    { id: "other", field: "renamed", field_label: "Alt", format: "txt", file_name: "alt.txt", description: "" },
  ],
} as unknown as ExampleDetail;

const FILE_FIELD: InputField = {
  name: "inquiry",
  label: "Anfrage",
  type: "file",
  description: "",
  required: true,
  default: null,
  options: [],
  multiple: false,
  max_size_mb: 10,
};

const PDF = { key: "pdf", group: "document" as const, extensions: [".pdf"], indexable: true };

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client()}>{children}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("the origin of an example copy (RT-055)", () => {
  it("lists the integrations that run on sample data, and none for other workflows", () => {
    expect(offlineIntegrations(ORIGIN)).toEqual(["crm"]);
    expect(offlineIntegrations(null)).toEqual([]);
    expect(offlineIntegrations(undefined)).toEqual([]);
    expect(offlineIntegrations({ ...ORIGIN, offline: [] })).toEqual([]);
    // A kind this interface does not know yet is not interpreted.
    expect(offlineIntegrations({ ...ORIGIN, kind: "template" as "example" })).toEqual([]);
  });
});

describe("the sample data badge (ST-031)", () => {
  it("names the example and its offline connections in the copy's language", async () => {
    const example = vi.spyOn(api, "example").mockResolvedValue(EXAMPLE);
    render(<OfflineBadge origin={ORIGIN} />, { wrapper });
    const badge = screen.getByTestId("offline-badge");
    expect(badge).toHaveTextContent("Beispieldaten");
    expect(badge).toHaveAttribute("tabindex", "0");
    expect(example).toHaveBeenCalledWith("offer-from-inquiry", "de");
    await userEvent.tab();
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("„Angebot aus Anfrage“: CRM-System läuft offline"));
  });

  it("falls back to the ids when the example is gone", async () => {
    vi.spyOn(api, "example").mockRejectedValue(new ApiError("gone", 404, "library.unknown"));
    render(<OfflineBadge origin={{ ...ORIGIN, offline: ["crm", "mail"] }} />, { wrapper });
    await waitFor(() => expect(api.example).toHaveBeenCalled());
    await userEvent.tab();
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("„offer-from-inquiry“: crm, mail laufen offline"));
  });

  it("is not shown for a connected copy or a workflow without origin", () => {
    const example = vi.spyOn(api, "example");
    const view = render(<OfflineBadge origin={{ ...ORIGIN, offline: [], connected: ["crm"] }} />, { wrapper });
    expect(screen.queryByTestId("offline-badge")).toBeNull();
    view.rerender(<OfflineBadge origin={null} />);
    expect(screen.queryByTestId("offline-badge")).toBeNull();
    expect(example).not.toHaveBeenCalled();
  });
});

describe("sample files in the run dialog (ST-007)", () => {
  it("offers the samples of the copy's file fields only while the dialog is open", async () => {
    const example = vi.spyOn(api, "example").mockResolvedValue(EXAMPLE);
    const closed = renderHook(() => useOriginSamples(ORIGIN, [FILE_FIELD], false), { wrapper });
    expect(closed.result.current).toEqual({});
    expect(example).not.toHaveBeenCalled();
    const open = renderHook(() => useOriginSamples(ORIGIN, [FILE_FIELD], true), { wrapper });
    await waitFor(() => expect(open.result.current.inquiry?.map((offer) => offer.fileName)).toEqual(["anfrage.pdf"]));
    // The sample of a field the copy no longer has is not offered.
    expect(Object.keys(open.result.current)).toEqual(["inquiry"]);
    const none = renderHook(() => useOriginSamples(null, [FILE_FIELD], true), { wrapper });
    expect(none.result.current).toEqual({});
  });

  it("uploads a sample with one click like a chosen file", async () => {
    vi.spyOn(api, "inputFormats").mockResolvedValue({ formats: [PDF], limits: {} });
    vi.spyOn(api, "knowledge").mockResolvedValue([]);
    const stored: InputFile = {
      id: "in_1",
      name: "anfrage.pdf",
      size: 4,
      format: "pdf",
      group: "document",
      media_type: "application/pdf",
      created_at: "2026-11-06T10:00:00Z",
      origin: "studio",
      info: {},
      notes: [],
      outline: "",
      chars: 0,
      entries: [],
      knowledge_ids: [],
    };
    vi.spyOn(api, "inputFile").mockResolvedValue(stored);
    const upload = vi.spyOn(api, "uploadInputs").mockResolvedValue([{ name: "anfrage.pdf", file: stored, problem: null }]);
    const load = vi.fn(async () => new File(["%PDF"], "anfrage.pdf", { type: "application/pdf" }));
    const onChange = vi.fn();
    const pending = vi.fn();
    function Form({ values }: { values: Record<string, unknown> }) {
      return (
        <FormFields
          fields={[FILE_FIELD]}
          values={values}
          onChange={onChange}
          onPendingChange={pending}
          samples={{ inquiry: [{ id: "inquiry", fileName: "anfrage.pdf", description: "Eine erfundene Anfrage", load }] }}
        />
      );
    }
    const view = render(<Form values={{}} />, { wrapper });
    expect(screen.getByRole("group", { name: "Beispieldateien des Beispiels:" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "anfrage.pdf verwenden" })).toBeEnabled());
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "anfrage.pdf verwenden" })));
    expect(load).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith([{ file: expect.any(File), name: "anfrage.pdf" }], expect.objectContaining({ origin: "studio" }));
    expect(onChange).toHaveBeenLastCalledWith({ inquiry: ["in_1"] });
    // While the sample was fetched and uploaded, the field counted a running upload (the run waits for it).
    expect(pending.mock.calls.some(([, count]) => count > 0)).toBe(true);
    view.rerender(<Form values={{ inquiry: ["in_1"] }} />);
    expect(screen.getByRole("button", { name: "anfrage.pdf hinzugefügt" })).toBeDisabled();
  });

  it("shows why a sample could not be fetched", async () => {
    vi.spyOn(api, "inputFormats").mockResolvedValue({ formats: [PDF], limits: {} });
    vi.spyOn(api, "knowledge").mockResolvedValue([]);
    const upload = vi.spyOn(api, "uploadInputs");
    const load = vi.fn(async () => {
      throw new ApiError("offline", 0, "network");
    });
    render(
      <FormFields
        fields={[FILE_FIELD]}
        values={{}}
        onChange={vi.fn()}
        samples={{ inquiry: [{ id: "inquiry", fileName: "anfrage.pdf", description: "", load }] }}
      />,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "anfrage.pdf verwenden" })).toBeEnabled());
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "anfrage.pdf verwenden" })));
    expect(upload).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "anfrage.pdf verwenden" })).toBeEnabled();
  });
});

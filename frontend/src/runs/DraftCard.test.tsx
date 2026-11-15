// Drafts in a run's result files (NAL-A4): an e-mail or webhook draft an agent prepared shows as a card with what it
// contains (never the body), the download and the note that nothing was sent.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { ResultFile, Run } from "../api/types";
import { draftPreview } from "./DraftCard";
import { ResultFiles } from "./ResultFiles";

const run = { id: "run_1", status: "succeeded", workflow_name: "Mahnungen", workflow: { nodes: [] }, nodes: {} } as unknown as Run;

const base: ResultFile = {
  id: "file_1",
  run_id: "run_1",
  name: "Zahlungserinnerung.eml",
  format: "eml",
  media_type: "message/rfc822",
  size: 4200,
  created_at: "2026-11-15T09:00:00Z",
  source: "tool",
  node_id: "writer",
  sanitized: false,
  error_code: null,
  error: null,
  error_params: {},
};

const EMAIL: ResultFile = {
  ...base,
  preview: {
    kind: "email",
    from: "billing@example.com",
    to: ["kunde@example.org", "buchhaltung@example.org"],
    cc: [],
    subject: "Erinnerung: Rechnung 2026-117",
    html: true,
    attachments: [{ name: "Rechnung-2026-117.pdf", media_type: "application/pdf", size: 52_000 }],
    size: 4200,
    // A preview never carries the body; even if one did, the card must not show it.
    body_text: "GEHEIMER TEXT DER NACHRICHT",
  },
};

const WEBHOOK: ResultFile = {
  ...base,
  id: "file_2",
  name: "webhook.json",
  format: "json",
  media_type: "application/json",
  size: 310,
  preview: { kind: "webhook", size: 310, schema: true },
};

function show(files: ResultFile[]) {
  vi.spyOn(api, "resultFiles").mockResolvedValue(files);
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ResultFiles run={run} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("draftPreview", () => {
  it("takes only files a draft tool wrote, with a known preview and without an error", () => {
    expect(draftPreview(EMAIL)?.kind).toBe("email");
    expect(draftPreview(WEBHOOK)?.kind).toBe("webhook");
    expect(draftPreview({ ...EMAIL, source: "output" })).toBeNull();
    expect(draftPreview({ ...EMAIL, preview: undefined })).toBeNull();
    expect(draftPreview({ ...EMAIL, preview: { kind: "sms" } })).toBeNull();
    expect(draftPreview({ ...EMAIL, error_code: "report.failed" })).toBeNull();
  });
});

describe("the draft card of an e-mail", () => {
  it("shows sender, recipients, subject, HTML and attachments, says that nothing was sent and hides the body", async () => {
    show([EMAIL]);
    const card = within(await screen.findByRole("article", { name: "E-Mail-Entwurf: Zahlungserinnerung.eml" }));
    expect(card.getByText("Nicht verschickt")).toBeInTheDocument();
    expect(card.getByText(/Es wurde nichts verschickt/)).toBeInTheDocument();
    expect(card.getByText("billing@example.com")).toBeInTheDocument();
    expect(card.getByText("kunde@example.org, buchhaltung@example.org")).toBeInTheDocument();
    expect(card.getByText("Erinnerung: Rechnung 2026-117")).toBeInTheDocument();
    expect(card.getByText("Rechnung-2026-117.pdf")).toBeInTheDocument();
    expect(card.getByText("(52,0 kB)")).toBeInTheDocument();
    expect(card.getByText("ja")).toBeInTheDocument(); // HTML version
    expect(card.getByText("keine")).toBeInTheDocument(); // no Cc
    expect(document.body.textContent).not.toContain("GEHEIMER TEXT");
  });

  it("downloads the .eml file, also from “Open in mail program”, which says that it is a download", async () => {
    show([EMAIL]);
    const card = within(await screen.findByRole("article"));
    const download = card.getByRole("link", { name: ".eml herunterladen" });
    const open = card.getByRole("link", { name: "Im Mailprogramm öffnen" });
    for (const link of [download, open]) {
      expect(link).toHaveAttribute("href", api.resultFileUrl("run_1", "file_1"));
      expect(link).toHaveAttribute("download", "Zahlungserinnerung.eml");
    }
    expect(open).toHaveAttribute("title", expect.stringContaining("Lädt die .eml-Datei herunter"));
    expect(open).toHaveAccessibleDescription(expect.stringContaining("Nodestro verschickt nichts"));
    // Never shown in the page: a mail file has no preview button.
    expect(screen.queryByRole("button", { name: /ansehen/i })).not.toBeInTheDocument();
  });

  it("names a missing sender and deletes the draft on confirmation", async () => {
    const remove = vi.spyOn(api, "deleteResultFile").mockResolvedValue(undefined);
    show([{ ...EMAIL, preview: { ...EMAIL.preview, from: null, attachments: [] } }]);
    const card = within(await screen.findByRole("article"));
    expect(card.getByText("nicht gesetzt; dein Mailprogramm trägt den Absender ein")).toBeInTheDocument();
    await userEvent.click(card.getByRole("button", { name: "Zahlungserinnerung.eml löschen" }));
    await userEvent.click(card.getByRole("button", { name: /Zahlungserinnerung.eml löschen: / }));
    expect(remove).toHaveBeenCalledWith("run_1", "file_1");
  });
});

describe("the draft card of a webhook payload", () => {
  it("shows size and schema check and downloads the .json file", async () => {
    show([WEBHOOK]);
    const card = within(await screen.findByRole("article", { name: "Webhook-Entwurf: webhook.json" }));
    expect(card.getByText("Gegen ein Schema geprüft")).toBeInTheDocument();
    expect(card.getByText("ja")).toBeInTheDocument();
    expect(card.getByText("310 Byte")).toBeInTheDocument();
    expect(card.getByText(/diese Webhook-Daten vorbereitet/)).toBeInTheDocument();
    expect(card.getByRole("link", { name: ".json herunterladen" })).toHaveAttribute("download", "webhook.json");
    expect(card.queryByRole("link", { name: "Im Mailprogramm öffnen" })).not.toBeInTheDocument();
  });

  it("lists other files of the run as before", async () => {
    show([WEBHOOK, { ...base, id: "file_3", name: "Bericht.md", format: "md", source: "output", preview: {} }]);
    await screen.findByRole("article");
    const row = screen.getByText("Bericht.md").closest("li") as HTMLElement;
    expect(within(row).queryByRole("article")).toBeNull();
    expect(within(row).getByText(/vom Ergebnis-Knoten/)).toBeInTheDocument();
  });
});

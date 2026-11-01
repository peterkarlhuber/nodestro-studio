// Small help and microcopy fixes from the UX audit (TX-11, TX-14, AD-17, AX-09 and the agent design cost note).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import { DesignAgentDialog } from "./DesignAgentDialog";

// Read from the files, so the check does not depend on how the app loads its languages.
const files = import.meta.glob<Record<string, unknown>>("../i18n/locales/*/*.json", { eager: true, import: "default" });
const LANGUAGES = ["en", "de", "fr", "es", "it", "pt-BR"];
function text(language: string, key: string): string {
  const [area, ...path] = key.split(".");
  let value: unknown = files[`../i18n/locales/${language}/${area}.json`];
  for (const part of path) value = (value as Record<string, unknown>)?.[part];
  return String(value);
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("microcopy", () => {
  it("announces the cost of an agent design before the proposal is created", () => {
    vi.spyOn(api, "meta").mockResolvedValue({ models: [] } as never);
    render(wrap(<DesignAgentDialog open onClose={() => {}} onApply={() => {}} />));
    expect(screen.getByTestId("design-cost-note")).toHaveTextContent("kostet einen kleinen Betrag");
  });

  it("promises only what pattern detection can keep when sanitizing a trace", () => {
    for (const language of LANGUAGES)
      expect(text(language, "export.alwaysSecrets")).not.toMatch(/Always removed|Immer entfernt|Toujours supprimés|Siempre se eliminan|Sempre rimossi|Sempre removidos/);
    expect(text("en", "export.alwaysSecrets")).toContain("when recognized");
  });

  it("explains Orkexa and the price quality in plain words, and names the comparison's row header", () => {
    for (const language of LANGUAGES) {
      expect(text(language, "pricing.intro")).toMatch(/Orkexa, .*Nodestro/);
      expect(text(language, "usage.cost.quality")).toContain("{{quality}} (");
      expect(text(language, "compare.rowHeader")).not.toBe("undefined");
      expect(text(language, "errors.export.private_repository")).toContain(text(language, "publish.export.libraryBundle"));
    }
  });
});

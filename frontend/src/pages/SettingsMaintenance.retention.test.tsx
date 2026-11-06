import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import { toast } from "../components/toast";
import { InputStoragePanel, retentionInput } from "./SettingsMaintenance";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("retention of assistant chat files (API-056)", () => {
  it("reads whole days from 1 to 3650, empty as keep", () => {
    expect(retentionInput("")).toEqual({ value: null, invalid: false });
    expect(retentionInput(" 30 ")).toEqual({ value: 30, invalid: false });
    expect(retentionInput("0").invalid).toBe(true);
    expect(retentionInput("3651").invalid).toBe(true);
    expect(retentionInput("1.5").invalid).toBe(true);
  });

  it("lets an administrator set and clear the period", async () => {
    vi.spyOn(api, "inputStorage").mockResolvedValue({ files: 0, bytes: 0, unreferenced: 0, in_use: 0 } as never);
    vi.spyOn(api, "assistantFileRetention").mockResolvedValue({ retention_days: null });
    const save = vi.spyOn(api, "saveAssistantFileRetention").mockImplementation(async (days) => ({ retention_days: days }));
    render(<InputStoragePanel />, { wrapper });
    const input = await screen.findByLabelText("Chat-Dateien des Assistenten behalten (Tage)");
    const button = screen.getByTestId("assistant-retention-save");
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: "0" } });
    expect(screen.getByText("Gib ganze Tage von 1 bis 3650 ein oder lass das Feld leer.")).toBeInTheDocument();
    expect(button).toBeDisabled();
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.click(button);
    await waitFor(() => expect(save).toHaveBeenCalledWith(30));
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(button);
    await waitFor(() => expect(save).toHaveBeenLastCalledWith(null));
  });

  it("shows nothing on an API without the route", async () => {
    vi.spyOn(api, "inputStorage").mockResolvedValue({ files: 0, bytes: 0, unreferenced: 0, in_use: 0 } as never);
    const read = vi.spyOn(api, "assistantFileRetention").mockResolvedValue(null);
    render(<InputStoragePanel />, { wrapper });
    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(screen.queryByTestId("assistant-retention")).toBeNull();
  });

  it("names the removed chat files after a clean-up", async () => {
    vi.spyOn(api, "inputStorage").mockResolvedValue({ files: 3, bytes: 10, unreferenced: 1, in_use: 0 } as never);
    vi.spyOn(api, "assistantFileRetention").mockResolvedValue({ retention_days: 7 });
    vi.spyOn(api, "cleanupInputs").mockResolvedValue({ removed: 1, freed_bytes: 10, kept_in_use: 0, assistant_files_expired: 2 });
    const success = vi.spyOn(toast, "success");
    render(<InputStoragePanel />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Ungenutzte Dateien entfernen" }));
    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(String(success.mock.calls.at(-1)?.[0])).toMatch(/2 Chat-Dateien des Assistenten nach Ablauf der Aufbewahrung entfernt\./);
  });
});

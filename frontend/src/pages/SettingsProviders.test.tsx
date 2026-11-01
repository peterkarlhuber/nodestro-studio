import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../api/hooks";
import { Toaster } from "../components/toast";
import type { Settings } from "../api/types";
import { CHECK_KEY, DefaultModelNotice, ProviderSettings } from "./SettingsProviders";

const status = (id: string, configured: boolean) => ({
  id,
  label: id,
  configured,
  key_source: configured ? "settings" : "none",
  env_var: null,
  key_stored: configured,
  base_url: null,
  base_url_default: null,
  capabilities: {},
});

const settings = (configured: string[], defaultModel = "anthropic:claude-sonnet-5-5"): Settings =>
  ({
    providers: ["anthropic", "openai"].map((id) => status(id, configured.includes(id))),
    default_provider: defaultModel.split(":")[0],
    default_model: defaultModel,
    assistant_model: "anthropic:claude-opus-5-5",
  }) as unknown as Settings;

const META = {
  capabilities: [],
  providers: ["anthropic", "openai"].map((id) => ({
    id,
    label: id,
    needs_key: true,
    env_vars: [`${id.toUpperCase()}_API_KEY`],
    base_url: false,
    default_base_url: null,
    declare_capabilities: false,
    example_model: "",
  })),
  models: [
    { id: "anthropic:claude-sonnet-5-5", provider: "anthropic", label: "Claude Sonnet 5.5", recommended: true },
    { id: "openai:gpt-5.5", provider: "openai", label: "GPT-5.5", recommended: true },
  ],
};

function serve(after: Settings) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      let answer: unknown = [];
      if (url === "/api/meta") answer = META;
      else if (method === "PUT" && body?.providers) answer = after;
      else if (method === "PUT") answer = { ...after, ...body, default_provider: "openai" };
      return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}

/** A change of the models, not of a provider's key. */
const modelChange = (call: { method: string; body: unknown }) =>
  call.method === "PUT" && Boolean(call.body) && !(call.body as { providers?: unknown }).providers;

function show(node: React.ReactNode, client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        {node}
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("provider settings", () => {
  it("asks the editor's check again and lets new agents follow the first provider set up", async () => {
    const calls = serve(settings(["openai"]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(keys.meta, META);
    client.setQueryData([...CHECK_KEY, { nodes: [] }], { ok: false });
    show(<ProviderSettings settings={settings([])} />, client);
    const card = document.querySelector("[data-provider='openai']") as HTMLElement;
    await userEvent.type(within(card).getByLabelText(/openai/i), "sk-test");
    await userEvent.click(within(card).getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(calls.some(modelChange)).toBe(true));
    const change = calls.find(modelChange)!;
    // Both the default and the assistant model belonged to Anthropic, which has no key.
    expect(change.body).toEqual({ default_model: "openai:gpt-5.5", assistant_model: "openai:gpt-5.5" });
    expect(client.getQueryState([...CHECK_KEY, { nodes: [] }])?.isInvalidated).toBe(true);
    expect(await screen.findByText(/Neue Agenten nutzen jetzt GPT-5.5/)).toBeInTheDocument();
  });

  it("keeps the default model when its provider is set up", async () => {
    const calls = serve(settings(["anthropic", "openai"]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(keys.meta, META);
    show(<ProviderSettings settings={settings(["anthropic"])} />, client);
    const card = document.querySelector("[data-provider='openai']") as HTMLElement;
    await userEvent.type(within(card).getByLabelText(/openai/i), "sk-test");
    await userEvent.click(within(card).getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(calls.filter((call) => call.method === "PUT").length).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls.some(modelChange)).toBe(false);
  });

  it("offers the configured provider's model when the default model's provider is missing", async () => {
    serve(settings(["openai"]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(keys.meta, META);
    show(<DefaultModelNotice settings={settings(["openai"])} />, client);
    expect(screen.getByTestId("default-model-notice")).toHaveTextContent("Das Standardmodell gehört zu Anthropic");
    expect(screen.getByRole("button", { name: "GPT-5.5 (OpenAI) verwenden" })).toBeInTheDocument();
  });

  it("says nothing while the default model's provider is set up or nothing is set up", () => {
    const client = new QueryClient();
    client.setQueryData(keys.meta, META);
    show(<DefaultModelNotice settings={settings(["anthropic"])} />, client);
    expect(screen.queryByTestId("default-model-notice")).toBeNull();
    cleanup();
    show(<DefaultModelNotice settings={settings([])} />, client);
    expect(screen.queryByTestId("default-model-notice")).toBeNull();
  });
});

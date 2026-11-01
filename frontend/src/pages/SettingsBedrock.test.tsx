import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessKeys, type Me } from "../api/access";
import { keys, useSettings } from "../api/hooks";
import type { ProviderStatus, Settings } from "../api/types";
import { Toaster } from "../components/toast";
import i18n from "../i18n";
import { problemText } from "../lib/errors";
import { bedrockProfile, regionProblem } from "./SettingsBedrock";
import { ProviderSettings } from "./SettingsProviders";

const BEDROCK_INFO = {
  id: "bedrock",
  label: "Amazon Bedrock (AWS)",
  needs_key: false,
  env_vars: [],
  base_url: false,
  default_base_url: null,
  declare_capabilities: false,
  example_model: "eu.anthropic.claude-sonnet-5-5",
  auth: "aws",
  region_env_vars: ["AWS_REGION", "AWS_DEFAULT_REGION"],
};

const meta = (profile: string) => ({ profile, capabilities: [], providers: [BEDROCK_INFO], models: [] });

function bedrock(patch: Partial<ProviderStatus> = {}): ProviderStatus {
  return {
    id: "bedrock",
    label: "Amazon Bedrock (AWS)",
    configured: false,
    key_source: "not_needed",
    env_var: null,
    key_stored: false,
    base_url: null,
    base_url_default: null,
    capabilities: {},
    auth: "default_chain",
    region: null,
    profile_name: null,
    data_residency: null,
    data_residency_forced: false,
    auth_methods: ["default_chain", "profile"],
    allowed_regions: null,
    operator_role: null,
    verification: { state: "not_configured", checked_at: null, code: "provider.not_configured" },
    ...patch,
  };
}

const settings = (status: ProviderStatus): Settings =>
  ({
    providers: [status],
    default_provider: "anthropic",
    default_model: "anthropic:claude-sonnet-5-5",
    assistant_model: "anthropic:claude-opus-5-5",
  }) as unknown as Settings;

const ADMIN: Me = { user_id: "u1", tenant_id: "t1", role: "admin", permissions: ["read", "edit", "run", "admin", "install"], tenants: { t1: "admin" } };
const MEMBER: Me = { ...ADMIN, role: "member", permissions: ["read", "edit", "run"] };

function serve(answers: { put?: Settings; verify?: ProviderStatus } = {}) {
  const calls: { method: string; url: string; body: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      let answer: unknown = [];
      if (method === "PUT" && url === "/api/settings") answer = answers.put;
      if (method === "POST" && url === "/api/settings/providers/bedrock/verify") answer = answers.verify;
      return new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}

function show(status: ProviderStatus, profile = "desktop", me: Me | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(keys.meta, meta(profile));
  client.setQueryData(accessKeys.me, me);
  client.setQueryData(keys.settings, settings(status));
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Page />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { card: screen.getByTestId("bedrock-settings"), client };
}

/** Like the settings page: the providers follow the settings query, so a saved or checked status shows at once. */
function Page() {
  const data = useSettings().data;
  return data ? <ProviderSettings settings={data} /> : null;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Amazon Bedrock settings", () => {
  it("has no API key field and explains that AWS credentials are used instead", () => {
    serve();
    const { card } = show(bedrock());
    expect(within(card).queryByLabelText(/API/i)).toBeNull();
    expect(card.querySelector("input[type='password']")).toBeNull();
    expect(card).toHaveTextContent(i18n.t("bedrock.notApiKey"));
    expect(screen.getByTestId("bedrock-status")).toHaveAttribute("data-state", "not_configured");
  });

  it("saves region, profile and EU-only residency on the desktop", async () => {
    const saved = bedrock({ configured: true, region: "eu-central-1", auth: "profile", profile_name: "work", data_residency: "eu_only", verification: { state: "configured", checked_at: null, code: null } });
    const calls = serve({ put: settings(saved) });
    const { card } = show(bedrock());
    await userEvent.click(within(card).getByRole("radio", { name: i18n.t("bedrock.auth.profile") }));
    await userEvent.type(within(card).getByPlaceholderText("my-profile"), "work");
    const region = within(card).getByPlaceholderText("eu-central-1");
    await userEvent.type(region, "eu-central-1");
    await userEvent.click(within(card).getByRole("switch"));
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("bedrock.save") }));
    await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
    expect(calls.find((call) => call.method === "PUT")!.body).toEqual({
      providers: { bedrock: { region: "eu-central-1", auth: "profile", profile_name: "work", data_residency: "eu_only" } },
    });
  });

  it("refuses an invalid region and a non-EU region with EU-only residency", async () => {
    serve();
    const { card } = show(bedrock({ data_residency: "eu_only" }));
    const region = within(card).getByPlaceholderText("eu-central-1");
    const save = within(card).getByRole("button", { name: i18n.t("bedrock.save") });
    await userEvent.type(region, "frankfurt");
    expect(region).toHaveAttribute("aria-invalid", "true");
    expect(save).toBeDisabled();
    await userEvent.clear(region);
    await userEvent.type(region, "eu-west-2");
    expect(region).toHaveAttribute("aria-invalid", "true");
    expect(card).toHaveTextContent(i18n.t("bedrock.region.notEu", { regions: "eu-central-1, eu-north-1, eu-south-1, eu-south-2, eu-west-1, eu-west-3" }));
    expect(save).toBeDisabled();
  });

  it("shows the operator's role read-only on a server and keeps an enforced EU residency on", () => {
    serve();
    const { card } = show(
      bedrock({ auth: "operator_role", auth_methods: ["operator_role"], operator_role: true, data_residency: "eu_only", data_residency_forced: true }),
      "server",
      ADMIN,
    );
    expect(within(card).getByTestId("bedrock-operator-role")).toHaveTextContent(i18n.t("bedrock.auth.operator_role"));
    expect(within(card).queryByRole("radio")).toBeNull();
    const toggle = within(card).getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toBeDisabled();
    expect(card).toHaveTextContent(i18n.t("bedrock.residency.forced"));
  });

  it("says to ask the operator when a server assigned no role", () => {
    serve();
    const { card } = show(
      bedrock({ auth: "operator_role", auth_methods: ["operator_role"], operator_role: false, verification: { state: "not_configured", checked_at: null, code: "provider.bedrock_not_available" } }),
      "server",
      ADMIN,
    );
    expect(within(card).getByTestId("bedrock-not-available")).toHaveTextContent(i18n.t("bedrock.auth.notAvailable"));
    expect(within(card).queryByPlaceholderText("eu-central-1")).toBeNull();
    expect(within(card).queryByRole("button", { name: i18n.t("bedrock.save") })).toBeNull();
    expect(within(card).getByRole("button", { name: i18n.t("bedrock.verify.button") })).toBeDisabled();
  });

  it("lets only admins change the settings on a server", () => {
    serve();
    const { card } = show(
      bedrock({ configured: true, region: "eu-central-1", auth: "operator_role", auth_methods: ["operator_role"], operator_role: true }),
      "server",
      MEMBER,
    );
    expect(within(card).getByPlaceholderText("eu-central-1")).toBeDisabled();
    expect(within(card).getByRole("switch")).toBeDisabled();
    expect(screen.getByTestId("permission-note-admin")).toBeInTheDocument();
  });

  it("checks the connection and shows the failure with its code", async () => {
    const failed = bedrock({
      configured: true,
      region: "eu-central-1",
      verification: { state: "failed", checked_at: "2026-11-01T10:00:00Z", code: "provider.aws_access_denied" },
    });
    const calls = serve({ verify: failed });
    const { card } = show(bedrock({ configured: true, region: "eu-central-1", verification: { state: "configured", checked_at: null, code: null } }));
    expect(card).toHaveTextContent(i18n.t("bedrock.verify.hint"));
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("bedrock.verify.button") }));
    await waitFor(() => expect(screen.getByTestId("bedrock-status")).toHaveAttribute("data-state", "failed"));
    expect(calls.some((call) => call.method === "POST" && call.url === "/api/settings/providers/bedrock/verify")).toBe(true);
    expect(screen.getByTestId("bedrock-status-code")).toHaveTextContent(problemText(i18n.t, { code: "provider.aws_access_denied" }));
  });
});

describe("Bedrock helpers", () => {
  it("validates region names, operator allowlists and EU-only", () => {
    expect(regionProblem("", { euOnly: true })).toBeNull();
    expect(regionProblem("eu-central-1", { euOnly: true })).toBeNull();
    expect(regionProblem("us-gov-west-1", { euOnly: false })).toBeNull();
    expect(regionProblem("EU-1", { euOnly: false })?.key).toBe("bedrock.region.invalid");
    expect(regionProblem("eu-central-2", { euOnly: true })?.key).toBe("bedrock.region.notEu");
    expect(regionProblem("eu-west-1", { euOnly: false, allowed: ["eu-central-1"] })?.key).toBe("bedrock.region.notAllowed");
  });

  it("tells a server from a desktop by the allowed sign-in methods", () => {
    expect(bedrockProfile(bedrock())).toBe("desktop");
    expect(bedrockProfile(bedrock({ auth_methods: ["default_chain"] }))).toBe("desktop");
    expect(bedrockProfile(bedrock({ auth_methods: ["operator_role"] }))).toBe("server");
  });
});

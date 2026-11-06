import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessKeys, type Me } from "../api/access";
import { keys } from "../api/hooks";
import { type Member, memberActions, memberName } from "../api/members";
import { Toaster } from "../components/toast";
import i18n from "../i18n";
import { MembersPanel } from "./SettingsMembers";

const meta = (profile: string) => ({ profile, capabilities: [], providers: [], models: [] });

const me = (role: string, permissions: string[]): Me => ({
  user_id: "u_me",
  name: "Me",
  email: null,
  tenant_id: "acme",
  role,
  permissions,
  tenants: { acme: role },
});

const MEMBERS: Member[] = [
  { user_id: "u_me", name: "Me", email: "me@example.com", role: "admin", you: true },
  { user_id: "u_olga", name: "Olga", email: null, role: "owner", you: false },
  { user_id: "u_erin", name: null, email: "erin@example.com", role: "editor", you: false },
];

function serve(members: Member[] = MEMBERS) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      if (method === "GET" && url === "/api/members") return Response.json(members);
      if (method === "PUT") return Response.json({ ...members[2], role: (body as { role: string }).role });
      if (method === "DELETE") return new Response(null, { status: 204 });
      return Response.json({});
    }),
  );
  return calls;
}

function show(profile: string, who: Me | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(keys.meta, meta(profile));
  client.setQueryData(accessKeys.me, who);
  render(
    <QueryClientProvider client={client}>
      <MembersPanel />
      <Toaster />
    </QueryClientProvider>,
  );
}

describe("member actions", () => {
  it("offers the owner role only to owners and keeps owners out of an administrator's reach", () => {
    expect(memberActions("owner", { role: "owner" })).toEqual({ roles: ["owner", "admin", "editor", "operator", "viewer"], manageable: true });
    expect(memberActions("admin", { role: "owner" })).toEqual({ roles: ["owner"], manageable: false });
    expect(memberActions("admin", { role: "editor" })).toEqual({ roles: ["admin", "editor", "operator", "viewer"], manageable: true });
    expect(memberName({ name: null, email: null, user_id: "u_x" })).toBe("u_x");
  });
});

describe("MembersPanel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders nothing on the desktop or without the permission admin", () => {
    const calls = serve();
    show("desktop", null);
    expect(screen.queryByRole("heading", { name: i18n.t("admin.members.title") })).toBeNull();
    cleanup();
    show("server", me("editor", ["edit", "read", "run"]));
    expect(screen.queryByTestId("members")).toBeNull();
    expect(calls).toEqual([]); // nothing was asked
  });

  it("lists the members and changes a role for an administrator", async () => {
    const calls = serve();
    show("server", me("admin", ["admin", "edit", "read", "run"]));
    const rows = await screen.findAllByTestId("member-row");
    expect(rows).toHaveLength(3);
    const erin = rows.find((row) => row.dataset.user === "u_erin")!;
    const olga = rows.find((row) => row.dataset.user === "u_olga")!;
    // The owner is shown but out of an administrator's reach; the owner role is not offered to the editor.
    expect(within(olga).getByRole("combobox")).toBeDisabled();
    expect(within(olga).queryByTestId("member-remove")).toBeNull();
    const select = within(erin).getByRole("combobox", { name: i18n.t("admin.members.roleOf", { name: "erin@example.com" }) });
    expect([...select.querySelectorAll("option")].map((option) => option.value)).toEqual(["admin", "editor", "operator", "viewer"]);
    fireEvent.change(select, { target: { value: "viewer" } });
    await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
    expect(calls.find((call) => call.method === "PUT")).toEqual({ method: "PUT", url: "/api/members/u_erin/role", body: { role: "viewer" } });
    expect(within(rows.find((row) => row.dataset.user === "u_me")!).getByText(i18n.t("admin.members.you"))).toBeInTheDocument();
  });

  it("removes a member only after the second click", async () => {
    const calls = serve();
    show("server", me("owner", ["admin", "edit", "read", "run"]));
    const rows = await screen.findAllByTestId("member-row");
    const erin = rows.find((row) => row.dataset.user === "u_erin")!;
    fireEvent.click(within(erin).getByTestId("member-remove"));
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);
    fireEvent.click(within(erin).getByTestId("member-remove"));
    await waitFor(() => expect(calls.some((call) => call.method === "DELETE" && call.url === "/api/members/u_erin")).toBe(true));
  });
});

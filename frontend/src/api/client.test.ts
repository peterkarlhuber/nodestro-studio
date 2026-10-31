import { afterEach, describe, expect, it, vi } from "vitest";

describe("the login redirect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const location = () => ({ pathname: "/runs", search: "?tab=2", hash: "#top", assign: vi.fn() });

  it("goes to the login once and returns to the current page", async () => {
    const { startLogin } = await import("./client");
    const here = location();
    startLogin(here);
    startLogin(here);
    expect(here.assign).toHaveBeenCalledTimes(1);
    expect(here.assign).toHaveBeenCalledWith("/api/auth/login?return_to=%2Fruns%3Ftab%3D2%23top");
  });

  it("starts only for a missing login, never for the desktop app's refusals", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/", search: "", hash: "", assign } });
    const answer = (code: string) =>
      new Response(JSON.stringify({ detail: "no", code, params: {} }), { status: 401 });
    const fetch = vi.fn(async () => answer("access.launch_required"));
    vi.stubGlobal("fetch", fetch);
    const { api } = await import("./client");
    await expect(api.workflows()).rejects.toMatchObject({ status: 401, code: "access.launch_required" });
    expect(assign).not.toHaveBeenCalled();
    fetch.mockImplementation(async () => answer("access.login_required"));
    await expect(api.workflows()).rejects.toMatchObject({ status: 401, code: "access.login_required" });
    expect(assign).toHaveBeenCalledWith("/api/auth/login?return_to=%2F");
  });
});

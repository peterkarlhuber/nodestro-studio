import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Run } from "../api/types";
import { useEditor } from "./store";
import { endedWithoutAccess, useRunStream } from "./useRunStream";

class FakeSource {
  static last: FakeSource | null = null;
  listeners = new Map<string, (message: MessageEvent) => void>();
  closed = false;
  onerror: (() => void) | null = null;
  constructor(readonly url: string) {
    FakeSource.last = this;
  }
  addEventListener(type: string, listener: (message: MessageEvent) => void) {
    this.listeners.set(type, listener);
  }
  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) } as MessageEvent);
  }
  close() {
    this.closed = true;
  }
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useEditor.getState().setRun(null);
});

describe("useRunStream", () => {
  it("tells an end because access ended from the end of a run", () => {
    expect(endedWithoutAccess(JSON.stringify({ reason: "access_ended" }))).toBe(true);
    expect(endedWithoutAccess(JSON.stringify({}))).toBe(false);
    expect(endedWithoutAccess(JSON.stringify({ status: "succeeded" }))).toBe(false);
    expect(endedWithoutAccess("not json")).toBe(false);
  });

  it("keeps the shown run and checks the sign-in when access ended", () => {
    vi.stubGlobal("EventSource", FakeSource);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const shown = { id: "run_1", status: "running", nodes: {} } as unknown as Run;
    useEditor.getState().setRun(shown);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    renderHook(() => useRunStream("run_1"), { wrapper });
    FakeSource.last!.emit("end", { reason: "access_ended" });
    expect(FakeSource.last!.closed).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useEditor.getState().run).toBe(shown);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["auth", "me"] });
  });

  it("reads the run once more after a normal end", () => {
    vi.stubGlobal("EventSource", FakeSource);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "run_1", status: "succeeded", nodes: {} }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
    renderHook(() => useRunStream("run_1"), { wrapper });
    FakeSource.last!.emit("end", {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

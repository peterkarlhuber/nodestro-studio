import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { WorkflowCheck } from "../api/types";
import { CheckList } from "./CheckList";

afterEach(cleanup);

const check = (code: string): WorkflowCheck =>
  ({
    ok: false,
    problems: [],
    agents: {
      calc: [{ level: "error", field: "tools", code, params: { name: "double", trust: "untrusted", reason: "docker-unreachable" }, message: "untrusted" }],
    },
    errors: 1,
    warnings: 0,
  }) as unknown as WorkflowCheck;

describe("CheckList", () => {
  it("offers the way to Settings → Sandbox for AI-created code without a sandbox", () => {
    render(
      <MemoryRouter initialEntries={["/workflows/wf_1"]}>
        <CheckList check={check("sandbox.isolation_required")} />
      </MemoryRouter>,
    );
    const link = screen.getByTestId("sandbox-setup-link");
    expect(link).toHaveTextContent("Einstellungen → Sandbox öffnen");
    expect(link).toHaveAttribute("href", "/settings?from=%2Fworkflows%2Fwf_1#settings-sandbox");
  });

  it("offers no such link for other problems", () => {
    render(
      <MemoryRouter>
        <CheckList check={check("check.tool_unknown")} />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("sandbox-setup-link")).toBeNull();
  });
});

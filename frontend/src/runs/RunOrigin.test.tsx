import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { Run } from "../api/types";
import { RunOrigin } from "./RunOrigin";

afterEach(cleanup);

function show(run: Partial<Run>) {
  const full = { id: "run_1", workflow_id: "wf_1", trigger: "manual", nodes: {}, workflow: { nodes: [], edges: [] }, ...run } as unknown as Run;
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <RunOrigin run={full} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RunOrigin (NJR-11)", () => {
  it("shows the version alone as a plain line, not as a notice", () => {
    const { container } = show({ workflow_version: 1 });
    expect(screen.getByTestId("run-version")).toHaveTextContent("1");
    expect(container.querySelector(".callout")).toBeNull();
  });

  it("keeps the notice when the run has an origin to tell", () => {
    const { container } = show({ workflow_version: 2, trigger: "schedule" });
    expect(container.querySelector(".callout")).not.toBeNull();
    expect(screen.queryByTestId("run-version")).toBeNull();
  });

  it("shows nothing without origin and version", () => {
    const { container } = show({ workflow_version: null });
    expect(container).toBeEmptyDOMElement();
  });
});

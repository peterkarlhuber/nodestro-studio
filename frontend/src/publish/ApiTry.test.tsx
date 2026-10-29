import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { ApiOverview, Publication } from "../api/types";
import { ApiTry } from "./ApiTry";

const PUBLICATION = { id: "pub_1", enabled: true } as Publication;
const OVERVIEW = { releases: [] } as unknown as ApiOverview;

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ApiTry overview={OVERVIEW} publication={PUBLICATION} onChanged={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ApiTry", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("checks the example request only once it has loaded", async () => {
    let loaded: (value: Awaited<ReturnType<typeof api.apiDocs>>) => void = () => undefined;
    vi.spyOn(api, "apiDocs").mockReturnValue(new Promise((resolve) => (loaded = resolve)));
    const testApi = vi.spyOn(api, "testApi").mockResolvedValue({ valid: true, input_text: "ok" } as never);
    show();
    const validate = screen.getByTestId("api-try-validate");
    // Before, a click here checked an empty body instead of the example.
    expect(validate).toBeDisabled();
    expect(screen.getByTestId("api-try-run")).toBeDisabled();
    loaded({ examples: { request: { values: { kunde: "ACME" } } } } as never);
    await waitFor(() => expect(validate).toBeEnabled());
    fireEvent.click(validate);
    await waitFor(() => expect(testApi).toHaveBeenCalledWith("pub_1", { values: { kunde: "ACME" } }, true, null));
  });
});

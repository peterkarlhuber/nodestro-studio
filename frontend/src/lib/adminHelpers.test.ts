import { describe, expect, it } from "vitest";

import type { Workflow } from "../api/types";
import { needsEffortOff } from "../editor/CheckList";
import { changedOnServer } from "../editor/SaveConflictDialog";
import { initialAccess, isDowngrade, urlProblem } from "../pages/ToolsServices";
import { collapseFieldErrors, fieldLabels, fieldPath } from "../publish/RequestProblems";
import { baseUrlFrom, pythonLiteral, pythonSdk, typescriptSdk } from "../publish/sdkSnippets";
import { nameFromFile, workflowFileProblem } from "./workflowFile";

describe("workflow import check (AD-08)", () => {
  it("refuses what is not a workflow export and accepts an export", () => {
    expect(workflowFileProblem({ foo: 1 })).toEqual({ code: "no_nodes" });
    expect(workflowFileProblem([1, 2])).toEqual({ code: "not_object" });
    expect(workflowFileProblem({ nodes: [{ id: "a", type: "agent" }, { id: "b" }] })).toEqual({ code: "node_invalid", index: 2 });
    expect(workflowFileProblem({ nodes: [{ id: "a", type: "agent" }], edges: {} })).toEqual({ code: "edges_invalid" });
    expect(workflowFileProblem({ nodes: [{ id: "a", type: "agent" }], edges: [{ source: "a" }] })).toEqual({ code: "edge_invalid", index: 1 });
    expect(workflowFileProblem({ name: "X", nodes: [{ id: "a", type: "start" }], edges: [{ id: "e", source: "a", target: "a" }] })).toBeNull();
  });

  it("names a workflow without a name after its file", () => {
    expect(nameFromFile("Offer_writer.nodestro.json")).toBe("Offer writer");
    expect(nameFromFile("x.json")).toBe("x");
  });
});

describe("MCP review and form (AD-06, AD-13)", () => {
  it("starts at the service's stated class when it is stricter, never lower", () => {
    expect(initialAccess("destructive")).toBe("destructive");
    expect(initialAccess("read")).toBe("write");
    expect(initialAccess("write")).toBe("write");
    expect(isDowngrade("write", "destructive")).toBe(true);
    expect(isDowngrade("read", "write")).toBe(true);
    expect(isDowngrade("destructive", "write")).toBe(false);
    expect(isDowngrade("write", "read")).toBe(false);
  });

  it("refuses plain http before saving, except for a local development server that is switched on", () => {
    expect(urlProblem("https://mcp.example.com/mcp", true, false)).toBeNull();
    expect(urlProblem("http://mcp.example.com/mcp", true, true)).toBe("https_required");
    expect(urlProblem("http://127.0.0.1:8389/mcp", true, false)).toBe("loopback_toggle");
    expect(urlProblem("http://localhost:8389/mcp", true, true)).toBeNull();
    expect(urlProblem("http://127.0.0.1:8389/mcp", false, true)).toBe("https_required");
  });
});

describe("readable 422 field errors (AD-15)", () => {
  it("drops union branches and reports each field once", () => {
    expect(fieldPath("values.qty.int")).toBe("values.qty");
    expect(fieldPath("values.when.function-after[check(), str]")).toBe("values.when");
    expect(
      collapseFieldErrors([
        { field: "values.customer", code: "missing" },
        { field: "values.qty.int", code: "int_parsing" },
        { field: "values.qty.float", code: "float_parsing" },
      ]),
    ).toEqual([
      { path: "values.customer", kind: "missing", message: undefined },
      { path: "values.qty", kind: "number", message: undefined },
    ]);
  });

  it("reads the field labels from the OpenAPI document", () => {
    const labels = fieldLabels({ components: { schemas: { Values: { properties: { qty: { title: "Quantity" } } } } } });
    expect(labels.get("qty")).toBe("Quantity");
  });
});

describe("SDK examples (AD-16)", () => {
  const request = { values: { customer: "ACME", urgent: true, note: null, qty: 2 } };

  it("takes the base address from the curl example", () => {
    expect(baseUrlFrom({ start: "curl -s -X POST http://127.0.0.1:8387/api/published/offers/runs" }, "x")).toBe("http://127.0.0.1:8387");
    expect(baseUrlFrom({}, "https://studio.example.com")).toBe("https://studio.example.com");
  });

  it("writes Python with Python literals and the SDK's calls", () => {
    expect(pythonLiteral(request)).toContain('"urgent": True');
    expect(pythonLiteral(request)).toContain('"note": None');
    const code = pythonSdk("http://127.0.0.1:8387", "offers", request);
    expect(code).toContain('PublishedWorkflow("http://127.0.0.1:8387", "offers", api_key=os.environ["NODESTRO_API_KEY"])');
    expect(code).toContain("api.wait_for_result(started[\"run_id\"], timeout=600)");
  });

  it("writes TypeScript with the SDK's calls", () => {
    const code = typescriptSdk("http://127.0.0.1:8387", "offers", request);
    expect(code).toContain('new PublishedWorkflow("http://127.0.0.1:8387", "offers", { apiKey: process.env.NODESTRO_API_KEY! })');
    expect(code).toContain("api.waitForResult(started.run_id, { timeoutMs: 600_000 })");
  });
});

describe("concurrent edits (AD-07)", () => {
  const base = { id: "wf", name: "A", description: "x", nodes: [], edges: [], updated_at: "1" } as unknown as Workflow;

  it("is a conflict only when the server copy is newer and differs", () => {
    expect(changedOnServer(base, { ...base })).toBe(false);
    expect(changedOnServer(base, { ...base, updated_at: "2" })).toBe(false);
    expect(changedOnServer(base, { ...base, updated_at: "2", description: "y" })).toBe(true);
    expect(changedOnServer(null, { ...base, updated_at: "2", description: "y" })).toBe(false);
  });
});

describe("OpenAI-compatible effort (AD-09)", () => {
  it("recognises the library's refusal of the effort setting", () => {
    expect(
      needsEffortOff({
        code: "config.library",
        message: "effort on an OpenAI-compatible endpoint needs CompatibleOptions(send_reasoning_effort=True) ...",
      }),
    ).toBe(true);
    expect(needsEffortOff({ code: "config.library", message: "something else" })).toBe(false);
  });
});

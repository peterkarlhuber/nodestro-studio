// Examples for the official clients of nodestro-sdk (AD-16): `nodestro_client.PublishedWorkflow` (Python) and
// `PublishedWorkflow` from `@nodestro/client` (TypeScript). The calls follow the SDK's README: start (with an
// idempotency key, so a retry never starts a second run), then wait for the result.

const SDK_REPOSITORY = "https://github.com/peterkarlhuber/nodestro-sdk";

/** The installation's base address from a generated curl example (".../api/published/<slug>/..."). */
export function baseUrlFrom(curl: Record<string, string> | undefined, fallback: string): string {
  for (const command of Object.values(curl ?? {})) {
    const match = /(https?:\/\/[^\s'"]+?)\/api\/published\//.exec(command);
    if (match) return match[1];
  }
  return fallback;
}

/** A JSON value as a Python literal (True/False/None, strings JSON-escaped, which Python reads the same). */
export function pythonLiteral(value: unknown, indent = 0): string {
  const pad = (level: number) => " ".repeat(level * 4);
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "None";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return `[\n${value.map((item) => pad(indent + 1) + pythonLiteral(item, indent + 1)).join(",\n")},\n${pad(indent)}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return "{}";
  return `{\n${entries.map(([key, item]) => `${pad(indent + 1)}${JSON.stringify(key)}: ${pythonLiteral(item, indent + 1)}`).join(",\n")},\n${pad(indent)}}`;
}

export function pythonSdk(base: string, slug: string, request: unknown): string {
  return [
    "# pip install \"nodestro-client @ git+" + SDK_REPOSITORY + ".git@<commit>#subdirectory=python\"",
    "import os",
    "",
    "from nodestro_client import NodestroAPIError, NodestroClientError, PublishedWorkflow",
    "",
    "try:",
    `    with PublishedWorkflow(${JSON.stringify(base)}, ${JSON.stringify(slug)}, api_key=os.environ["NODESTRO_API_KEY"]) as api:`,
    `        started = api.start(${pythonLiteral(request, 2)})  # carries an Idempotency-Key: safe to retry`,
    "        result = api.wait_for_result(started[\"run_id\"], timeout=600)",
    "        print(result[\"output\"])",
    "except NodestroAPIError as error:  # the API answered with an error",
    "    print(error.status, error.code, error.params)",
    "except NodestroClientError as error:  # unreachable, timed out, run failed, ...",
    "    print(error)",
    "",
  ].join("\n");
}

export function typescriptSdk(base: string, slug: string, request: unknown): string {
  const body = JSON.stringify(request ?? {}, null, 2).replace(/\n/g, "\n  ");
  return [
    "// Build the package from the repository (see its README): npm install /path/to/nodestro-client-<version>.tgz",
    'import { NodestroAPIError, NodestroClientError, PublishedWorkflow } from "@nodestro/client";',
    "",
    `const api = new PublishedWorkflow(${JSON.stringify(base)}, ${JSON.stringify(slug)}, { apiKey: process.env.NODESTRO_API_KEY! });`,
    "try {",
    `  const started = await api.start(${body}); // carries an Idempotency-Key: safe to retry`,
    "  const result = await api.waitForResult(started.run_id, { timeoutMs: 600_000 });",
    "  console.log(result.output);",
    "} catch (error) {",
    "  if (error instanceof NodestroAPIError) console.error(error.status, error.code, error.params);",
    "  else if (error instanceof NodestroClientError) console.error(error.message);",
    "  else throw error;",
    "}",
    "",
  ].join("\n");
}

export { SDK_REPOSITORY };

import { describe, expect, it } from "vitest";

import i18n from "../i18n";
import { problemText } from "./errors";

const t = i18n.getFixedT("en");

describe("request and routing codes of the API", () => {
  it("lists the fields of a validation answer in either shape", () => {
    expect(problemText(t, { code: "request.invalid", params: { fields: "name, age" } })).toBe(
      "The request does not fit the API's input: name, age.",
    );
    const errors = [
      { field: "body.name", kind: "missing" },
      { field: "body.name", kind: "text" },
      { field: "body.age", kind: "number" },
    ];
    expect(problemText(t, { code: "request.invalid", params: { errors } })).toBe(
      "The request does not fit the API's input: body.name, body.age.",
    );
    expect(problemText(t, { code: "request.invalid", params: { errors: [] } })).toBe(t("errors.request.invalid_plain"));
    expect(problemText(t, { code: "request.invalid", params: {} })).not.toContain("{{");
  });

  it("names the size limit when the server sends it", () => {
    expect(problemText(t, { code: "request.too_large", params: { limit_mb: 25 } })).toContain("25 MB");
    expect(problemText(t, { code: "request.too_large", params: {} })).toBe(t("errors.request.too_large"));
  });

  it.each(["request.malformed", "route.not_found", "method.not_allowed"])("has its own sentence for %s", (code) => {
    expect(problemText(t, { code, params: {}, message: "Not Found" })).toBe(t(`errors.${code}`));
  });

  it("names the taken publication name", () => {
    expect(problemText(t, { code: "publication.slug_taken", params: { slug: "offer" } })).toContain("offer");
  });
});

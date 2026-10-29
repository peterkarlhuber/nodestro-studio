import { describe, expect, it } from "vitest";

import { progress, rowsFromRecords } from "./batch";

describe("rowsFromRecords", () => {
  it("maps columns to form fields and the free-text input", () => {
    const rows = rowsFromRecords([{ Kunde: "ACME", Text: "Hallo", Notiz: "x" }], { Kunde: "customer", Text: "input" });
    expect(rows).toEqual([{ values: { customer: "ACME" }, input: "Hallo", file_ids: [] }]);
  });

  it("joins unmapped columns into the input when nothing is mapped", () => {
    const rows = rowsFromRecords([{ a: "1", b: "", c: "3" }], {});
    expect(rows[0].input).toBe("a: 1\nc: 3");
  });
});

describe("progress", () => {
  it("counts finished items of every kind", () => {
    expect(progress({ total: 4, succeeded: 1, failed: 1, cancelled: 0, skipped: 0, invalid: 1 })).toBe(0.75);
    expect(progress({ total: 0, succeeded: 0, failed: 0, cancelled: 0, skipped: 0, invalid: 0 })).toBe(0);
  });
});

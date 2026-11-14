import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OutputField } from "../api/types";
import { OutputFieldsEditor } from "./OutputFieldsEditor";

afterEach(cleanup);

const fields: OutputField[] = [
  { name: "analysis", type: "string", description: "", required: true },
  { name: "share", type: "number", description: "", required: true },
];

describe("OutputFieldsEditor", () => {
  it("lets an agent mark a number field as a key figure that must come from a tool", () => {
    const onChange = vi.fn();
    render(<OutputFieldsEditor fields={fields} onChange={onChange} idPrefix="f" checkable />);
    // Only the number field offers the switch.
    const boxes = screen.getAllByRole("checkbox", { name: /tool/i });
    expect(boxes).toHaveLength(1);
    fireEvent.click(boxes[0]);
    expect(onChange).toHaveBeenCalledWith([fields[0], { ...fields[1], source: "tool" }]);
  });

  it("does not offer the switch for a workflow's output contract", () => {
    render(<OutputFieldsEditor fields={fields} onChange={() => {}} idPrefix="f" />);
    expect(screen.queryByRole("checkbox", { name: /tool/i })).toBeNull();
  });
});

describe("cited web sources (NAL-A2)", () => {
  it("are offered for text fields of an agent and written as source ledger", () => {
    const onChange = vi.fn();
    render(<OutputFieldsEditor fields={fields} onChange={onChange} idPrefix="f" checkable />);
    const boxes = screen.getAllByRole("checkbox", { name: "Nennt Webquellen" });
    expect(boxes).toHaveLength(1);
    fireEvent.click(boxes[0]);
    expect(onChange).toHaveBeenCalledWith([{ ...fields[0], source: "ledger" }, fields[1]]);
  });

  it("are not offered for a workflow's output contract", () => {
    render(<OutputFieldsEditor fields={fields} onChange={() => {}} idPrefix="f" />);
    expect(screen.queryByRole("checkbox", { name: "Nennt Webquellen" })).toBeNull();
  });
});

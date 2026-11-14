import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

describe("web sources of text fields (NAL-A2, NAL-B2)", () => {
  it("are offered for text fields of an agent and written as the chosen source", () => {
    const onChange = vi.fn();
    render(<OutputFieldsEditor fields={fields} onChange={onChange} idPrefix="f" checkable />);
    const selects = screen.getAllByRole("combobox", { name: /^Webquellen für/ });
    expect(selects).toHaveLength(1);
    expect((selects[0] as HTMLSelectElement).value).toBe("model");
    const offered = within(selects[0]!).getAllByRole("option").map((option) => (option as HTMLOptionElement).value);
    expect(offered).toEqual(["model", "ledger", "ledger_cited", "ledger_list", "ledger_range"]);
    fireEvent.change(selects[0]!, { target: { value: "ledger_cited" } });
    expect(onChange).toHaveBeenCalledWith([{ ...fields[0], source: "ledger_cited" }, fields[1]]);
  });

  it("show a field filled from the ledger with its source", () => {
    render(
      <OutputFieldsEditor fields={[{ ...fields[0]!, source: "ledger_list" }, fields[1]!]} onChange={() => {}} idPrefix="f" checkable />,
    );
    expect((screen.getByRole("combobox", { name: /^Webquellen für/ }) as HTMLSelectElement).value).toBe("ledger_list");
  });

  it("are not offered for a workflow's output contract", () => {
    render(<OutputFieldsEditor fields={fields} onChange={() => {}} idPrefix="f" />);
    expect(screen.queryByRole("combobox", { name: /^Webquellen für/ })).toBeNull();
  });
});

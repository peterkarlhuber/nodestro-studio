// Editor dialogs mount on first opening and keep their state afterwards (ST-004).

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { MountWhenOpened } from "./MountWhenOpened";

afterEach(cleanup);

let mounts = 0;

function Dialog({ open }: { open: boolean }) {
  const [text, setText] = useState(() => {
    mounts += 1;
    return "";
  });
  return open ? <input aria-label="Eingabe" value={text} onChange={(event) => setText(event.target.value)} /> : null;
}

function Host() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(!open)}>
        umschalten
      </button>
      <MountWhenOpened open={open}>
        <Dialog open={open} />
      </MountWhenOpened>
    </>
  );
}

describe("MountWhenOpened", () => {
  it("mounts nothing until the first opening, then keeps the dialog and its state", async () => {
    mounts = 0;
    render(<Host />);
    expect(mounts).toBe(0);
    await userEvent.click(screen.getByRole("button", { name: "umschalten" }));
    expect(mounts).toBe(1);
    await userEvent.type(screen.getByRole("textbox", { name: "Eingabe" }), "Entwurf");
    await userEvent.click(screen.getByRole("button", { name: "umschalten" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "umschalten" }));
    expect(screen.getByRole("textbox", { name: "Eingabe" })).toHaveValue("Entwurf");
    expect(mounts).toBe(1);
  });
});

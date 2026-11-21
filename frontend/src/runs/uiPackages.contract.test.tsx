// Contract with the shared UI packages (N-16): what the studio uses from @nodestro/ui-core and @nodestro/ui-ai
// exists and behaves as the studio expects. A version bump of the vendored tarballs that renames a key, drops a prop
// or changes the remember options fails here (and in the type check), not unnoticed in the product.

import { RememberOptions, aiMessages, type RememberChoice } from "@nodestro/ui-ai";
import { LOCALES, UiTextProvider } from "@nodestro/ui-core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LANGUAGES } from "../i18n";
import { REMEMBER_TEXTS, type RememberChoice as StudioChoice } from "./ToolApprovalCard";

afterEach(cleanup);

describe("@nodestro/ui-ai as the studio uses it", () => {
  it("covers the studio's six languages", () => {
    expect([...LOCALES].sort()).toEqual([...LANGUAGES].sort());
  });

  it("still has every key the studio answers with its own texts", () => {
    for (const key of Object.keys(REMEMBER_TEXTS)) expect(aiMessages.en).toHaveProperty([key]);
  });

  it("takes the studio's choice as it is and answers with the studio's texts", async () => {
    const choice: StudioChoice = { duration: "call", scope: "agent", until: "" };
    const onChange = vi.fn<(value: RememberChoice) => void>();
    render(
      <UiTextProvider locale="de" translate={(key, values) => (key === "ai.remember.scopes.agent" ? `Agent ${values?.agent}` : undefined)}>
        <RememberOptions value={{ ...choice, duration: "until_revoked" }} onChange={onChange} agent="wf/a" data-testid="remember">
          <p data-testid="note">Hinweis</p>
        </RememberOptions>
      </UiTextProvider>,
    );
    expect(screen.getByTestId("remember").tagName).toBe("FIELDSET");
    expect(screen.getByTestId("note")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Agent wf/a" })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Wie lange"), "until");
    expect(onChange).toHaveBeenCalledWith({ duration: "until", scope: "agent", until: "" });
  });
});

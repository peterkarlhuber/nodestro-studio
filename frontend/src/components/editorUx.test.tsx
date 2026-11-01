import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { History } from "lucide-react";

import { removeWithUndo } from "../editor/actions";
import { useEditor } from "../editor/store";
import { newNode } from "../lib/defaults";
import { modelName } from "./ModelPicker";
import { Toaster, useToasts } from "./toast";
import { Button, DisabledReason, MenuButton } from "./ui";
import { UnsavedChangesModal } from "./UnsavedChanges";

afterEach(() => {
  cleanup();
  useToasts.setState({ toasts: [] });
});

describe("DisabledReason (TX-10, OB-01)", () => {
  it("keeps the control focusable, ignores clicks and shows the reason with a link to the fix", async () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <DisabledReason reason="Kein API-Schlüssel für Anthropic." action={{ label: "Einstellungen öffnen", to: "/settings" }}>
          <Button onClick={onClick}>Workflow starten</Button>
        </DisabledReason>
      </MemoryRouter>,
    );
    const button = screen.getByRole("button", { name: "Workflow starten" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Kein API-Schlüssel für Anthropic.");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    // Keyboard users reach the link to the fix and the control itself (a native disabled button is skipped).
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Einstellungen öffnen" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Einstellungen öffnen" })).toHaveAttribute("href", "/settings");
    await userEvent.tab();
    expect(button).toHaveFocus();
  });

  it("passes the control through unchanged without a reason", async () => {
    const onClick = vi.fn();
    render(
      <DisabledReason reason={null}>
        <Button onClick={onClick}>Workflow starten</Button>
      </DisabledReason>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Workflow starten" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByTestId("disabled-reason")).toBeNull();
  });
});

describe("MenuButton (ED-16)", () => {
  it("opens a menu, moves with the arrow keys and closes with Escape", async () => {
    const onVersions = vi.fn();
    render(
      <MenuButton
        label="Weitere Aktionen"
        items={[
          { label: "Versionen", icon: History, onSelect: onVersions },
          { label: "Als Datei exportieren", onSelect: vi.fn() },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Weitere Aktionen" });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Versionen" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Als Datei exportieren" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Versionen" }));
    expect(onVersions).toHaveBeenCalled();
  });
});

describe("UnsavedChangesModal (ED-19, ED-21)", () => {
  it("offers to keep editing, to discard or to save", async () => {
    const onStay = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();
    render(<UnsavedChangesModal open onStay={onStay} onDiscard={onDiscard} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: "Weiter bearbeiten" }));
    await userEvent.click(screen.getByRole("button", { name: "Verwerfen" }));
    await userEvent.click(screen.getByRole("button", { name: "Speichern und weiter" }));
    expect(onStay).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("removing a node (ED-15)", () => {
  it("shows a toast whose Undo brings the node back", async () => {
    const start = { ...newNode("start"), id: "start" };
    const agent = { ...newNode("agent", { x: 300, y: 0 }, { name: "Schreiber" }), id: "a", label: "Schreiber" };
    useEditor.getState().load({
      id: "wf_t",
      name: "T",
      description: "",
      budget_usd: null,
      nodes: [start, agent],
      edges: [{ id: "e", source: "start", target: "a" }],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Toaster />
      </QueryClientProvider>,
    );
    act(() => removeWithUndo(["a"]));
    expect(useEditor.getState().nodes).toHaveLength(1);
    expect(screen.getByText("„Schreiber“ entfernt.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(useEditor.getState().nodes).toHaveLength(2);
    expect(useEditor.getState().edges).toHaveLength(1);
  });
});

describe("model names (ED-23)", () => {
  it("shows the catalog label and keeps an unknown id", () => {
    const models = [{ id: "anthropic:claude-sonnet-5-5", label: "Claude Sonnet 5.5" }];
    expect(modelName(models, "claude-sonnet-5-5")).toBe("Claude Sonnet 5.5");
    expect(modelName(models, "openai:my-model")).toBe("openai:my-model");
    expect(modelName(undefined, "anthropic:claude-sonnet-5-5")).toBe("claude-sonnet-5-5");
  });
});

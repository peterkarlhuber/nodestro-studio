import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { Problem } from "../api/types";
import { ToolWarnings, isToolWarning } from "./shared";

const params = { tool: "mailer", node: "Writer", workflow: "Newsletter", trigger: "schedule" };
const warning = (code: string): Problem => ({ code, params, message: "refused" });

afterEach(cleanup);

describe("ToolWarnings", () => {
  it("names the agent, the tool and the fix for every refused call, and links to the Approvals page", () => {
    render(
      <MemoryRouter>
        <ToolWarnings items={[warning("tool.unattended_pre_grant_missing"), warning("tool.unattended_api")]} />
      </MemoryRouter>,
    );
    const box = screen.getByTestId("tool-warnings");
    const lines = within(box).getAllByRole("listitem");
    expect(lines).toHaveLength(2);
    expect(lines[0]!.textContent).toContain("Writer (Newsletter)");
    expect(lines[0]!.textContent).toContain("Gib mailer auf der Seite „Freigaben“ für diesen Zeitplan vorab frei");
    expect(lines[1]!.textContent).toContain("Veröffentlichte APIs haben noch keinen eigenen Freigabeschritt");
    expect(within(box).getByRole("link").getAttribute("href")).toBe("/approvals");
    expect(box.textContent).toContain("Nichts wird automatisch freigegeben");
  });

  it("shows nothing without warnings and tells tool warnings from other notes", () => {
    const { container } = render(
      <MemoryRouter>
        <ToolWarnings items={[]} />
      </MemoryRouter>,
    );
    expect(container.textContent).toBe("");
    expect(isToolWarning(warning("tool.unattended_mcp"))).toBe(true);
    expect(isToolWarning(warning("schedule.approvals"))).toBe(false);
  });

  it("has a text for every warning code in every language", async () => {
    const codes = ["pre_grant_missing", "pre_grant_outdated", "not_started", "api", "destructive", "mcp", "denied"];
    for (const lang of ["de", "en", "es", "fr", "it", "pt-BR"]) {
      const errors = (await import(`../i18n/locales/${lang}/errors.json`)).default as { tool: Record<string, string> };
      const automation = (await import(`../i18n/locales/${lang}/automation.json`)).default as {
        toolWarnings: Record<string, string>;
        schedule: Record<string, string>;
      };
      for (const code of codes) {
        const text = errors.tool[`unattended_${code}`];
        expect(text, `${lang} ${code}`).toBeTruthy();
        expect(text).toContain("{{tool}}");
      }
      expect(Object.keys(automation.toolWarnings).sort()).toEqual(["hint", "open", "title"]);
      expect(automation.schedule.enabledWithWarnings).toBeTruthy();
    }
  });
});

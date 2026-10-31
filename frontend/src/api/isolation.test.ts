import { describe, expect, it } from "vitest";
import en from "../i18n/locales/en/settings.json";
import { isolationAvailable } from "./types";

describe("whether AI-created code can run (ADR-0006)", () => {
  const status = (available: boolean, reason = "") => ({ available, reason, detail: "", system: "ubuntu 24.04" });

  it("needs Docker or the built-in Linux sandbox", () => {
    expect(isolationAvailable({ sandbox: "docker" })).toBe(true);
    expect(isolationAvailable({ sandbox: "subprocess", builtin_sandbox: status(true) })).toBe(true);
    expect(isolationAvailable({ sandbox: "subprocess", builtin_sandbox: status(false, "landlock") })).toBe(false);
    // An older API without the field: no isolation is assumed.
    expect(isolationAvailable({ sandbox: "subprocess" })).toBe(false);
  });

  it("explains every reason the API reports", () => {
    const reasons = ["platform", "untested-system", "landlock", "seccomp", "root", "paths", "verify", "failed"];
    for (const reason of reasons) {
      expect(en.sandbox.reason[reason as keyof typeof en.sandbox.reason]).toBeTruthy();
    }
  });
});

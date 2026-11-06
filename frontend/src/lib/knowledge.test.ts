// Knowledge sources an agent used, read from its recorded search calls (ST-013, AD-19).

import { describe, expect, it } from "vitest";

import { usedSources } from "./knowledge";

const call = (output: string | null, is_error = false) => ({ output, is_error });

describe("usedSources", () => {
  it("lists each file and page once, in the order found, with the number of passages", () => {
    const output = [
      "[search_result 'kf_1' 'Handbook.pdf, p. 3'] Returns are free within 30 days.",
      "(Original: file kf_1, loadable with the files tool)",
      "[search_result 'kf_2' 'notes.md'] Ship from the Berlin warehouse.",
      "[search_result 'kf_1' 'Handbook.pdf, p. 3'] Refunds take a week.",
    ].join("\n");
    expect(usedSources([call(output), call("[search_result 'kf_3' \"Bob's list.txt\"] x")])).toEqual([
      { source: "kf_1", title: "Handbook.pdf, p. 3", passages: 2 },
      { source: "kf_2", title: "notes.md", passages: 1 },
      { source: "kf_3", title: "Bob's list.txt", passages: 1 },
    ]);
  });

  it("ignores failed calls, other tools and a search without results", () => {
    expect(
      usedSources([
        call("No results found."),
        call("[search_result 'kf_1' 'a.md'] text", true),
        call("The page says [search_result 'x' 'y'] inline"),
        call(null),
      ]),
    ).toEqual([]);
  });
});

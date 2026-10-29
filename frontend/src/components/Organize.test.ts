import { describe, expect, it } from "vitest";

import type { OrganizeState } from "../api/types";
import { NO_FILTER, applyOrganize, tagsOf } from "./Organize";

const state: OrganizeState = {
  items: {
    "workflow:b": { favorite: true, tags: ["Kunde A"] },
    "workflow:c": { favorite: false, tags: ["kunde a", "Entwurf"] },
    "tool:x": { favorite: false, tags: ["Intern"] },
  },
  tags: ["Entwurf", "Intern", "Kunde A"],
};
const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("favorites and tags", () => {
  it("puts favorites first and keeps the order otherwise", () => {
    expect(applyOrganize(items, "workflow", (item) => item.id, NO_FILTER, state).map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("filters by favorites and by tag, ignoring case", () => {
    const ids = (filter: typeof NO_FILTER) => applyOrganize(items, "workflow", (item) => item.id, filter, state).map((item) => item.id);
    expect(ids({ favorites: true, tag: "" })).toEqual(["b"]);
    expect(ids({ favorites: false, tag: "KUNDE A" })).toEqual(["b", "c"]);
    expect(ids({ favorites: false, tag: "Intern" })).toEqual([]);
  });

  it("lists the tags of one kind", () => {
    expect(tagsOf(state, "workflow")).toEqual(["Entwurf", "Kunde A"]);
    expect(tagsOf(state, "tool")).toEqual(["Intern"]);
  });
});

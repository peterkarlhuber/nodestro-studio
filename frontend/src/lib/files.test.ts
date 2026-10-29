import { describe, expect, it } from "vitest";

import type { ArchiveEntry, FileFormatInfo } from "../api/types";
import { acceptAttribute, acceptedKeys, archiveTree, formatOfName, precheck, remainingSlots, suffixOf } from "./files";

const FORMATS: FileFormatInfo[] = [
  { key: "txt", group: "text", extensions: [".txt"], indexable: true },
  { key: "pdf", group: "document", extensions: [".pdf"], indexable: true },
  { key: "png", group: "image", extensions: [".png"], indexable: false },
  { key: "jpg", group: "image", extensions: [".jpg", ".jpeg"], indexable: false },
  { key: "zip", group: "archive", extensions: [".zip"], indexable: false },
];

const entry = (path: string, is_dir = false): ArchiveEntry => ({
  path,
  size: 1,
  compressed: 1,
  is_dir,
  format: null,
  group: null,
  status: "ok",
  reason: null,
});

describe("file inputs", () => {
  it("reads suffixes and formats", () => {
    expect(suffixOf("Belege/2024/Rechnung.PDF")).toBe("pdf");
    expect(suffixOf(".env")).toBe("");
    expect(formatOfName("foto.jpeg", FORMATS)?.key).toBe("jpg");
    expect(formatOfName("programm.exe", FORMATS)).toBeNull();
  });

  it("accepts formats, groups and extensions", () => {
    expect([...acceptedKeys(undefined, FORMATS)]).toHaveLength(FORMATS.length);
    expect([...acceptedKeys(["image", ".pdf"], FORMATS)].sort()).toEqual(["jpg", "pdf", "png"]);
    expect(acceptAttribute(acceptedKeys(["image"], FORMATS), FORMATS)).toBe(".png,.jpg,.jpeg");
  });

  it("checks files before the upload", () => {
    const field = { accept: ["pdf"], max_size_mb: 1 };
    expect(precheck({ name: "a.pdf", size: 10 }, field, FORMATS)).toEqual({ ok: true });
    expect(precheck({ name: "a.exe", size: 10 }, field, FORMATS)).toMatchObject({ code: "input.unsupported_format" });
    expect(precheck({ name: "a.png", size: 10 }, field, FORMATS)).toMatchObject({ code: "input.type_not_accepted" });
    expect(precheck({ name: "a.pdf", size: 2 * 1024 * 1024 }, field, FORMATS)).toMatchObject({ code: "input.too_large" });
    expect(precheck({ name: "a.pdf", size: 0 }, field, FORMATS)).toMatchObject({ code: "input.empty" });
  });

  it("counts the remaining slots of a field", () => {
    expect(remainingSlots({ multiple: false }, 0)).toBe(1);
    expect(remainingSlots({ multiple: false }, 1)).toBe(0);
    expect(remainingSlots({ multiple: true, max_files: 3 }, 1)).toBe(2);
    expect(remainingSlots({ multiple: true }, 7)).toBeNull();
  });

  it("builds an archive tree with folders first", () => {
    const tree = archiveTree([entry("z.txt"), entry("docs/", true), entry("docs/b.txt"), entry("docs/sub/a.txt")]);
    expect(tree.map((node) => node.name)).toEqual(["docs", "z.txt"]);
    expect(tree[0].children.map((node) => node.name)).toEqual(["sub", "b.txt"]);
    expect(tree[0].children[0].children[0].entry?.path).toBe("docs/sub/a.txt");
  });
});

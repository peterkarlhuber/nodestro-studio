// Files as workflow inputs: which formats a field accepts and what the browser can check before uploading.
//
// The backend decides (it checks the real content); these checks only spare the user an upload
// that would be refused anyway and keep the messages next to the file.

import type { TFunction } from "i18next";

import type { ArchiveEntry, FileFormatInfo, FormatGroup, InputField } from "../api/types";

export const FORMAT_GROUPS: FormatGroup[] = ["text", "data", "document", "image", "archive"];

/** The default size limit of a file field in MB (as the backend's DEFAULT_FIELD_MB). */
export const DEFAULT_FIELD_MB = 20;

/** The suffix of a file name, lower case and without the dot ("" when there is none). */
export function suffixOf(name: string): string {
  const base = name.split("/").pop() ?? name;
  const index = base.lastIndexOf(".");
  return index > 0 ? base.slice(index + 1).toLowerCase() : "";
}

/** The format of a file name, from the list of the backend. */
export function formatOfName(name: string, formats: FileFormatInfo[]): FileFormatInfo | null {
  const suffix = suffixOf(name);
  if (!suffix) return null;
  return formats.find((format) => format.extensions.some((extension) => extension.replace(/^\./, "") === suffix)) ?? null;
}

/** The format keys a field accepts: its formats and groups; everything when it names none. */
export function acceptedKeys(accept: string[] | undefined, formats: FileFormatInfo[]): Set<string> {
  const wanted = (accept ?? []).map((item) => item.trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
  if (!wanted.length) return new Set(formats.map((format) => format.key));
  return new Set(
    formats
      .filter(
        (format) =>
          wanted.includes(format.key) ||
          wanted.includes(format.group) ||
          format.extensions.some((extension) => wanted.includes(extension.replace(/^\./, ""))),
      )
      .map((format) => format.key),
  );
}

/** The ``accept`` attribute of the file picker. */
export function acceptAttribute(keys: Set<string>, formats: FileFormatInfo[]): string {
  return formats
    .filter((format) => keys.has(format.key))
    .flatMap((format) => format.extensions)
    .join(",");
}

/** The extensions of the accepted formats, for the hint below the drop zone (".pdf, .docx"). */
export function acceptedLabel(keys: Set<string>, formats: FileFormatInfo[]): string {
  return formats
    .filter((format) => keys.has(format.key))
    .map((format) => format.extensions[0])
    .join(", ");
}

export type Precheck =
  | { ok: true }
  | { ok: false; code: "input.unsupported_format" | "input.type_not_accepted" | "input.too_large" | "input.empty"; params: Record<string, unknown> };

/** What the browser can tell about one file before it is uploaded. */
export function precheck(
  file: { name: string; size: number },
  field: Pick<InputField, "accept" | "max_size_mb">,
  formats: FileFormatInfo[],
): Precheck {
  const format = formatOfName(file.name, formats);
  if (!format) return { ok: false, code: "input.unsupported_format", params: { name: file.name, suffix: suffixOf(file.name) } };
  const keys = acceptedKeys(field.accept, formats);
  if (!keys.has(format.key))
    return { ok: false, code: "input.type_not_accepted", params: { name: file.name, accepted: acceptedLabel(keys, formats) } };
  const limit = field.max_size_mb || DEFAULT_FIELD_MB;
  if (file.size > limit * 1024 * 1024) return { ok: false, code: "input.too_large", params: { name: file.name, limit_mb: limit } };
  if (file.size === 0) return { ok: false, code: "input.empty", params: { name: file.name } };
  return { ok: true };
}

/** How many files a field still takes (``null``: no limit). */
export function remainingSlots(field: Pick<InputField, "multiple" | "max_files">, given: number): number | null {
  if (field.multiple === false) return Math.max(0, 1 - given);
  return field.max_files ? Math.max(0, field.max_files - given) : null;
}

export interface TreeNode {
  name: string;
  path: string;
  entry: ArchiveEntry | null;
  children: TreeNode[];
}

/** The entries of an archive as a tree (folders first, then files, each alphabetically). */
export function archiveTree(entries: ArchiveEntry[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", entry: null, children: [] };
  for (const entry of entries) {
    const parts = entry.path.split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join("/");
      let child = node.children.find((item) => item.name === part);
      if (!child) {
        child = { name: part, path, entry: null, children: [] };
        node.children.push(child);
      }
      if (index === parts.length - 1 && !entry.is_dir) child.entry = entry;
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((node) => ({ ...node, children: sort(node.children) }))
      .sort((a, b) => Number(Boolean(a.entry)) - Number(Boolean(b.entry)) || a.name.localeCompare(b.name));
  return sort(root.children);
}

/** Files of a dropped folder, with their path relative to the dropped item ("Belege/2024/a.pdf"). */
export async function filesOfDrop(items: DataTransferItemList | null, fallback: FileList | null): Promise<{ file: File; name: string }[]> {
  const entries = items
    ? Array.from(items)
        .map((item) => (typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null))
        .filter((entry): entry is FileSystemEntry => entry !== null)
    : [];
  if (!entries.length) return Array.from(fallback ?? []).map((file) => ({ file, name: file.name }));
  const found: { file: File; name: string }[] = [];
  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (found.length > 1000) return;
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      found.push({ file, name: `${prefix}${file.name}` });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // A directory reader returns its entries in batches until an empty one.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch.length) break;
        for (const child of batch) await walk(child, `${prefix}${entry.name}/`);
      }
    }
  };
  for (const entry of entries) await walk(entry, "");
  return found;
}

/** The closed summary of a file field's options: formats · size · count · delivery (UX-6a). */
export function fileFieldSummary(t: TFunction, field: InputField, formats: FileFormatInfo[]): string {
  const accept = field.accept ?? [];
  const named = accept.map((key) =>
    (FORMAT_GROUPS as string[]).includes(key)
      ? t(`inputs.groups.${key}`)
      : (formats.find((format) => format.key === key)?.extensions[0] ?? key),
  );
  const count =
    field.multiple === false
      ? t("inputs.config.summary.one")
      : field.max_files
        ? t("inputs.config.summary.upTo", { count: field.max_files })
        : t("inputs.config.summary.many");
  return [
    named.length ? named.join(", ") : t("inputs.config.summary.allFormats"),
    t("inputs.config.summary.size", { mb: field.max_size_mb ?? DEFAULT_FIELD_MB }),
    count,
    t(`inputs.config.deliveryModes.${field.delivery ?? "auto"}`),
  ].join(" · ");
}

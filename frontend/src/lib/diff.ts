// A line diff (longest common subsequence) for comparing outputs side by side.

export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

/** Lines beyond this many per side are compared as a whole block, to keep the diff fast. */
const MAX_LINES = 1500;

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    if (before === after) return a.map((text) => ({ type: "same", text }));
    return [...a.map((text) => ({ type: "removed" as const, text })), ...b.map((text) => ({ type: "added" as const, text }))];
  }
  // lengths[i][j]: length of the common subsequence of a[i..] and b[j..]
  const lengths: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1)
    for (let j = b.length - 1; j >= 0; j -= 1)
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      result.push({ type: "removed", text: a[i] });
      i += 1;
    } else {
      result.push({ type: "added", text: b[j] });
      j += 1;
    }
  }
  for (; i < a.length; i += 1) result.push({ type: "removed", text: a[i] });
  for (; j < b.length; j += 1) result.push({ type: "added", text: b[j] });
  return result;
}

/** Any value as comparable text: strings as they are, everything else as indented JSON. */
export function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

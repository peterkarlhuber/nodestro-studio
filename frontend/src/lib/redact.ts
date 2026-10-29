// Hide credentials before showing configuration values (e.g. request options in the context view).

const SECRET_KEY =
  /(api[_-]?key|apikey|authorization|auth[_-]?token|access[_-]?token|refresh[_-]?token|token|secret|client[_-]?secret|password|passwd|passwort|pwd|cookie|session[_-]?id|private[_-]?key|x-api-key)$/i;
const SECRET_TEXT = /\b(sk-ant-[A-Za-z0-9_-]{6,}|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abprs]-[A-Za-z0-9-]{10,})/g;

export const HIDDEN = "••••••";

export function redact(value: unknown, key?: string): unknown {
  if (key !== undefined && SECRET_KEY.test(key) && value !== "" && value !== null && typeof value !== "object") return HIDDEN;
  if (typeof value === "string") return value.replace(SECRET_TEXT, HIDDEN);
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  return value;
}

// Client-side checks that mirror the backend's rules, for immediate feedback while typing.

const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** A problem with an output field name, checked like the backend does (Python identifiers): its translation key. */
export function fieldNameProblem(name: string, names: string[]): string | null {
  if (!name) return "agent.output.problems.empty";
  if (!FIELD_NAME.test(name)) return "agent.output.problems.digit";
  if (names.filter((other) => other === name).length > 1) return "agent.output.problems.duplicate";
  return null;
}

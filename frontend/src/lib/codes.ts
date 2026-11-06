// Backend codes as text keys. A code like "model.pass_rate_low" names its text by the part after the prefix; doing
// that with String.replace gives a plain string, which i18n/dynamicKeys.test.ts cannot enumerate. codeSuffix keeps
// a union of codes a union of suffixes, so the test checks that every code the backend sends has a text (ST-060).

/** The part of the code ``C`` after ``P``; a code without the prefix stays as it is. */
export type CodeSuffix<P extends string, C extends string> = C extends `${P}${infer S}` ? S : C;

/** "model.pass_rate_low" with prefix "model." → "pass_rate_low" (typed). A code without the prefix stays as it is. */
export function codeSuffix<P extends string, C extends string>(prefix: P, code: C): CodeSuffix<P, C> {
  return (code.startsWith(prefix) ? code.slice(prefix.length) : code) as CodeSuffix<P, C>;
}

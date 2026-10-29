import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { diffLines } from "../lib/diff";
import { Segmented } from "./ui";

/** A line diff of two texts; "side" shows both texts next to each other instead. */
export function TextDiff({ a, b }: { a: string; b: string }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"diff" | "side">("diff");
  const lines = useMemo(() => (mode === "diff" ? diffLines(a, b) : []), [a, b, mode]);
  if (a === b)
    return (
      <>
        <p className="muted small">{t("compare.identical")}</p>
        {a ? <pre className="code-block code-block--prose compare__text">{a}</pre> : null}
      </>
    );
  return (
    <div className="stack-sm">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "diff", label: t("compare.viewDiff") },
          { value: "side", label: t("compare.viewSide") },
        ]}
        label={t("compare.view")}
      />
      {mode === "diff" ? (
        <pre className="code-block code-block--prose diff" data-testid="output-diff">
          {lines.map((line, index) => (
            <span key={index} className={`diff__line diff__line--${line.type}`}>
              <span className="diff__sign" aria-hidden>
                {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
              </span>
              <span className="sr-only">{line.type === "same" ? "" : t(`compare.line.${line.type}`)}</span>
              {line.text || " "}
              {"\n"}
            </span>
          ))}
        </pre>
      ) : (
        <div className="compare__columns">
          <pre className="code-block code-block--prose compare__text">{a || "–"}</pre>
          <pre className="code-block code-block--prose compare__text">{b || "–"}</pre>
        </div>
      )}
    </div>
  );
}

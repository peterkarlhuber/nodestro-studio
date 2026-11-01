// A tool's coded error output in the interface language, above the original text (AD-12).

import { AlertTriangle } from "lucide-react";

import { ProblemText } from "../lib/errors";
import { codedToolOutput } from "../lib/toolOutput";

export function ToolOutputProblem({ output }: { output: string | null | undefined }) {
  const coded = codedToolOutput(output);
  if (!coded) return null;
  return (
    <p className="small text-danger" data-testid="tool-output-problem">
      <AlertTriangle size={12} aria-hidden /> <ProblemText item={{ code: coded.code, params: coded.params }} compact />
    </p>
  );
}

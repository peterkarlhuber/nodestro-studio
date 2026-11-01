// A detail page whose object does not exist (or could not be loaded): a clear heading, the reason and the way back
// to its list, instead of a lone error box or an endless spinner (OB-15).

import { ArrowLeft, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { ErrorText } from "../lib/errors";
import { EmptyState } from "./ui";

export type MissingKind = "workflow" | "run" | "batch" | "suite";

const BACK: Record<MissingKind, string> = {
  workflow: "/",
  run: "/executions",
  batch: "/batches",
  suite: "/tests",
};

/** Whether a failed request means "this object does not exist" (and retrying will not help). */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function NotFoundState({ kind, error }: { kind: MissingKind; error?: unknown }) {
  const { t } = useTranslation();
  const missing = !error || isNotFound(error);
  return (
    <div className="page" data-testid="not-found-state">
      <EmptyState
        level={1}
        icon={SearchX}
        title={missing ? t(`notFound.object.${kind}.title`) : t("notFound.object.failedTitle")}
        action={
          <Link to={BACK[kind]} className="nd-button">
            <ArrowLeft size={14} aria-hidden /> {t(`notFound.object.${kind}.back`)}
          </Link>
        }
      >
        {missing ? t(`notFound.object.${kind}.text`) : <ErrorText error={error} compact />}
      </EmptyState>
    </div>
  );
}

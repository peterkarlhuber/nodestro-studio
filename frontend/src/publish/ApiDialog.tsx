// "API & Export": publish saved versions of the open workflow as a local API, manage access,
// try it, read its documentation and generate a standalone FastAPI project from it.
//
// Only explicitly published versions are served; saving the workflow never changes them.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { Callout, DocLink, Modal, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { ApiAccess } from "./ApiAccess";
import { ApiDocsPanel } from "./ApiDocsPanel";
import { ApiExport } from "./ApiExport";
import { ApiOverviewPanel } from "./ApiOverviewPanel";
import { ApiSettings } from "./ApiSettings";
import { ApiTry } from "./ApiTry";

export type ApiTab = "overview" | "access" | "try" | "docs" | "settings" | "export";

const TABS: ApiTab[] = ["overview", "access", "try", "docs", "settings", "export"];

export const apiKeys = {
  overview: (workflowId: string) => ["api", "overview", workflowId] as const,
  keys: ["api", "keys"] as const,
  network: ["api", "network"] as const,
};

export function ApiDialog({
  open,
  onClose,
  workflowId,
  dirty,
  save,
}: {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  /** Unsaved changes in the editor: only saved versions can be published. */
  dirty: boolean;
  save: (note?: string) => Promise<string | null>;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ApiTab>("overview");
  const queryClient = useQueryClient();
  const overview = useQuery({
    queryKey: apiKeys.overview(workflowId),
    queryFn: () => api.apiOverview(workflowId),
    enabled: open,
    refetchInterval: open ? 10_000 : false,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["api"] });
  const publication = overview.data?.publication ?? null;

  return (
    <Modal title={t("publish.title")} open={open} onClose={onClose} xl>
      <div className="api-dialog" data-testid="api-dialog">
        <p className="muted small api-dialog__intro">
          <Plug size={14} aria-hidden /> {t("publish.intro")} <DocLink to="api-und-export" label={t("publish.docsLink")} />
        </p>
        <div className="tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? "selected" : undefined}
              disabled={item !== "overview" && item !== "access" && !publication}
              onClick={() => setTab(item)}
              data-testid={`api-tab-${item}`}
            >
              {t(`publish.tabs.${item}`)}
            </button>
          ))}
        </div>
        <div className="tab-panel" role="tabpanel">
          {overview.isLoading ? <Spinner /> : null}
          {overview.error ? (
            <Callout tone="danger">
              <ErrorText error={overview.error} />
            </Callout>
          ) : null}
          {overview.data ? (
            <>
              {tab === "overview" ? (
                <ApiOverviewPanel overview={overview.data} dirty={dirty} save={save} onChanged={refresh} onTab={setTab} />
              ) : null}
              {tab === "access" ? <ApiAccess overview={overview.data} onChanged={refresh} /> : null}
              {tab === "try" && publication ? <ApiTry overview={overview.data} publication={publication} onChanged={refresh} /> : null}
              {tab === "docs" && publication ? <ApiDocsPanel publication={publication} /> : null}
              {tab === "settings" && publication ? <ApiSettings publication={publication} onChanged={refresh} /> : null}
              {tab === "export" && publication ? <ApiExport overview={overview.data} publication={publication} onChanged={refresh} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

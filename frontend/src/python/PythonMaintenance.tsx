// Settings › Maintenance: the managed Python environments, their size and owners, and cleanup.

import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { EnvironmentInfo } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, Callout, HelpTip, Hint, IconButton, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes, relativeTime } from "../lib/format";
import { useDependencyRefresh } from "./DependencyDialog";

function owner(t: (key: string, values?: Record<string, unknown>) => string, env: EnvironmentInfo): string {
  if (env.kind === "workflow") return t("python.maintenance.ownerWorkflow", { name: env.label || env.ref });
  if (env.kind === "tool") return t("python.maintenance.ownerTool", { name: env.ref });
  if (env.kind === "mcp") return t("python.maintenance.ownerMcp", { name: env.label || env.ref });
  return env.scope;
}

export function PythonMaintenance() {
  const { t } = useTranslation();
  const refresh = useDependencyRefresh();
  const status = useQuery({ queryKey: keys.python, queryFn: api.pythonStatus });
  const remove = useMutation({
    mutationFn: (env: EnvironmentInfo) => api.removeEnvironment(env.kind ?? "workflow", env.ref, env.orphaned),
    onSuccess: () => {
      refresh();
      toast.success(t("python.maintenance.removed"));
    },
    onError: toast.error,
  });
  const cleanup = useMutation({
    mutationFn: api.cleanupEnvironments,
    onSuccess: (result) => {
      refresh();
      toast.success(t("python.maintenance.cleaned", { count: result.removed.length }));
    },
    onError: toast.error,
  });
  const data = status.data;
  const orphaned = data?.environments.filter((env) => env.orphaned).length ?? 0;
  return (
    <section className="panel stack" aria-labelledby="settings-python" data-testid="python-maintenance">
      <h2 className="panel__title" id="settings-python">
        <Package size={15} aria-hidden /> {t("python.maintenance.title")}{" "}
        <HelpTip id="python.maintenance" label={t("python.maintenance.title")} />
      </h2>
      <p className="muted small">{t("python.maintenance.intro")}</p>
      {status.isLoading ? <Spinner /> : null}
      {status.error ? (
        <Callout tone="danger">
          <ErrorText error={status.error} />
        </Callout>
      ) : null}
      {data ? (
        <>
          <p className="small">
            {data.uv_available
              ? t("python.maintenance.uv", { version: data.uv_version ?? "?", python: data.python_version })
              : t("python.maintenance.noUv")}{" "}
            · {t("python.maintenance.cache", { size: formatBytes(data.cache_bytes) })}
          </p>
          {data.environments.length ? (
            <div className="table-wrap">
              <table className="table table--compact">
                <thead>
                  <tr>
                    <th>{t("python.maintenance.owner")}</th>
                    <th>{t("python.maintenance.packages")}</th>
                    <th>{t("python.maintenance.size")}</th>
                    <th>{t("python.maintenance.installed")}</th>
                    <th aria-label={t("python.maintenance.actions")} />
                  </tr>
                </thead>
                <tbody>
                  {data.environments.map((env) => (
                    <tr key={env.scope} data-scope={env.scope}>
                      <td className="table__primary">
                        {owner(t, env)}{" "}
                        {env.orphaned ? <Badge tone="warning">{t("python.maintenance.orphaned")}</Badge> : null}
                      </td>
                      <td>{env.packages}</td>
                      <td>{env.path ? formatBytes(env.size_bytes) : t("python.maintenance.notOnDisk")}</td>
                      <td>{env.installed_at ? relativeTime(env.installed_at) : "–"}</td>
                      <td>
                        {env.path || env.orphaned ? (
                          <IconButton
                            icon={Trash2}
                            label={env.orphaned ? t("python.maintenance.forget") : t("python.maintenance.remove")}
                            onClick={() => remove.mutate(env)}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">{t("python.maintenance.none")}</p>
          )}
          <div className="row-gap">
            <Hint id="python.cleanup">
              <Button icon={Trash2} busy={cleanup.isPending} onClick={() => cleanup.mutate()} data-testid="python-cleanup">
                {t("python.maintenance.cleanup", { count: orphaned })}
              </Button>
            </Hint>
          </div>
        </>
      ) : null}
    </section>
  );
}

// Approve third-party libraries: the overview first (nothing installed), then the installation
// with its progress. Used for workflows (their environment) and single tools (their test environment).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { DependencyPlan, DependencyScope, PythonEnvironment } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, DocLink, Modal, Spinner } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { PlanTable } from "./PlanTable";

/** Invalidate everything that shows dependency states. */
export function useDependencyRefresh() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["check"] });
    void queryClient.invalidateQueries({ queryKey: ["dependencies"] });
    void queryClient.invalidateQueries({ queryKey: keys.python });
  }, [queryClient]);
}

/** Follows an installation until it ended; the environment document carries step and log. */
export function useInstallation(kind: DependencyScope, ref: string, active: boolean) {
  return useQuery({
    queryKey: ["installation", kind, ref],
    queryFn: () => api.pythonEnvironment(kind, ref),
    enabled: active,
    refetchInterval: (query) => (query.state.data?.install.status === "installing" || !query.state.data ? 700 : false),
  });
}

export function InstallProgress({ env }: { env: PythonEnvironment | undefined }) {
  const { t } = useTranslation();
  if (!env) return <Spinner label={t("python.install.starting")} />;
  const state = env.install;
  return (
    <div className="stack-sm" aria-live="polite" data-testid="install-progress" data-status={state.status}>
      {state.status === "installing" ? (
        <Spinner label={t(`python.step.${(state.step ?? "deps.step.queued").replace("deps.step.", "")}`)} />
      ) : state.status === "installed" ? (
        <Callout tone="brand">
          <CheckCircle2 size={14} aria-hidden /> {t("python.install.done", { count: env.packages.length })}
        </Callout>
      ) : state.error ? (
        <Callout tone="danger">
          {t("python.install.failed")} <ProblemText item={state.error} />
        </Callout>
      ) : null}
      {state.log.length ? (
        <details>
          <summary className="small">{t("python.install.log")}</summary>
          <pre className="code-block install-log">{state.log.join("\n")}</pre>
        </details>
      ) : null}
    </div>
  );
}

export function DependencyDialog({
  open,
  onClose,
  kind,
  refName,
  label,
  loadPlan,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  kind: DependencyScope;
  refName: string;
  label: string;
  loadPlan: () => Promise<DependencyPlan>;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const refresh = useDependencyRefresh();
  const [attempt, setAttempt] = useState(0);
  const [installing, setInstalling] = useState(false);
  const plan = useQuery({
    queryKey: ["dependency-plan", kind, refName, attempt],
    queryFn: loadPlan,
    enabled: open && !installing,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const installation = useInstallation(kind, refName, open && installing);
  const approve = useMutation({
    mutationFn: (id: string) => api.approveDependencyPlan(id),
    onSuccess: () => {
      setInstalling(true);
      refresh();
    },
    onError: toast.error,
  });
  const retry = useMutation({
    mutationFn: () => api.reinstallEnvironment(kind, refName),
    onSuccess: () => void installation.refetch(),
    onError: toast.error,
  });
  const env = installation.data;
  const finished = installing && env && env.install.status !== "installing";
  const close = () => {
    if (finished) {
      refresh();
      if (env?.install.status === "installed") onDone?.();
    }
    setInstalling(false);
    setAttempt((value) => value + 1);
    onClose();
  };
  const data = plan.data;
  const canApprove = Boolean(data && !data.error && data.packages.length && !data.issues.some((issue) => issue.blocking));
  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title={t("python.dialog.title", { name: label })}
      footer={
        installing ? (
          <>
            {finished && env?.install.status === "failed" ? (
              <Button icon={RefreshCw} busy={retry.isPending} onClick={() => retry.mutate()}>
                {t("python.install.retry")}
              </Button>
            ) : null}
            <Button variant={finished ? "primary" : "default"} disabled={!finished} onClick={close}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              icon={ShieldCheck}
              disabled={!canApprove}
              busy={approve.isPending}
              onClick={() => data && approve.mutate(data.id)}
              data-testid="approve-dependencies"
            >
              {data && !data.needs_approval ? t("python.dialog.confirm") : t("python.dialog.approve")}
            </Button>
          </>
        )
      }
    >
      <div className="stack" data-testid="dependency-dialog">
        {installing ? (
          <InstallProgress env={env} />
        ) : (
          <>
            <p className="small">
              <Package size={14} aria-hidden /> {t(kind === "workflow" ? "python.dialog.introWorkflow" : "python.dialog.introTool", { name: label })}{" "}
              <DocLink to="python-bibliotheken#freigabe" label={t("python.docs")} />
            </p>
            {plan.isLoading ? <Spinner label={t("python.dialog.resolving")} /> : null}
            {plan.error ? (
              <Callout tone="danger">
                <ErrorText error={plan.error} />
              </Callout>
            ) : null}
            {data ? <PlanTable plan={data} /> : null}
            {data && canApprove ? (
              <Callout tone="warning">
                {data.needs_approval ? t("python.dialog.warning") : t("python.dialog.unchanged")}{" "}
                {t("python.dialog.codeSeparate")}
              </Callout>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

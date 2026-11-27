// The owner's consents for private memory spaces (RT-089d, nodestro-api /api/memory-consents). On a server, a shared
// workflow may use a person's memory space only after that person allowed exactly its current content: the
// workflow with every workflow it starts, each in one version (a digest). The owner reviews what a consent would
// cover, allows it, sees every consent and withdraws one. The section shows only where the API offers consents (a
// member of a server); elsewhere it is not asked, and a 404 memory.consent_unavailable hides it too.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Eye, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { ApiError, api } from "../api/client";
import { keys, useMemorySpaces, useWorkflows } from "../api/hooks";
import type { MemoryConsent, MemoryConsentPreview } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, ConfirmIconButton, Field, HelpTip, Select, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";

/** A changed workflow, tool or connection since the preview: the grant was refused and needs a new review. */
export function isStale(error: unknown): boolean {
  return error instanceof ApiError && error.code === "memory.consent_stale";
}

/** Consents are offered here: the list answers (a 404 ``memory.consent_unavailable`` means not on this installation). */
export function consentsOffered(error: unknown, loaded: boolean): boolean {
  if (loaded) return true;
  return !(error instanceof ApiError && (error.status === 404 || error.code === "memory.consent_unavailable"));
}

export function MemoryConsents({ space }: { space: string | null }) {
  const { t } = useTranslation();
  // Only a server has owners of memory spaces; elsewhere nothing is asked (no 404 in the console).
  const server = useAccess().profile === "server";
  const consents = useQuery({ queryKey: keys.memoryConsents, queryFn: api.memoryConsents, retry: false, enabled: server });
  if (!server || consents.isLoading) return null;
  if (!consentsOffered(consents.error, Boolean(consents.data))) return null;
  return (
    <section className="panel stack" aria-labelledby="memory-consents-title" data-testid="memory-consents">
      <h2 className="panel__title" id="memory-consents-title">
        <ShieldCheck size={15} aria-hidden /> {t("memory.consents.title")}{" "}
        <HelpTip id="memory.consents" label={t("memory.consents.title")} />
      </h2>
      <p className="muted small">{t("memory.consents.intro")}</p>
      {consents.error ? (
        <Callout tone="danger">
          <ErrorText error={consents.error} />
        </Callout>
      ) : null}
      <GrantConsent space={space} />
      {consents.data ? <ConsentList consents={consents.data} /> : null}
    </section>
  );
}

function GrantConsent({ space: selected }: { space: string | null }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const spaces = useMemorySpaces();
  const workflows = useWorkflows();
  const [space, setSpace] = useState(selected ?? "");
  const [workflowId, setWorkflowId] = useState("");
  const [preview, setPreview] = useState<MemoryConsentPreview | null>(null);
  const review = useMutation({
    mutationFn: () => api.memoryConsentPreview(workflowId),
    onSuccess: (data) => {
      grant.reset();
      setPreview(data);
    },
  });
  const grant = useMutation({
    mutationFn: (shown: MemoryConsentPreview) => api.grantMemoryConsent(space, shown.workflow_id, shown.digest),
    onSuccess: () => {
      toast.success(t("memory.consents.granted", { space }));
      setPreview(null);
      void queryClient.invalidateQueries({ queryKey: keys.memoryConsents });
    },
  });
  const choose = (change: () => void) => {
    change();
    setPreview(null);
    review.reset();
    grant.reset();
  };
  const spaceOptions = (spaces.data ?? []).map((item) => ({ value: item.name, label: item.name }));
  const workflowOptions = (workflows.data ?? []).map((item) => ({ value: item.id, label: item.name }));
  const stale = isStale(grant.error);
  return (
    <div className="stack-sm" data-testid="consent-grant">
      <div className="grid-2">
        <Field label={t("memory.consents.space")}>
          <Select
            value={space}
            placeholder={t("memory.consents.chooseSpace")}
            options={spaceOptions}
            onChange={(value) => choose(() => setSpace(value))}
            data-testid="consent-space"
          />
        </Field>
        <Field label={t("memory.consents.workflow")} hint={t("memory.consents.workflowHint")}>
          <Select
            value={workflowId}
            placeholder={t("memory.consents.chooseWorkflow")}
            options={workflowOptions}
            onChange={(value) => choose(() => setWorkflowId(value))}
            data-testid="consent-workflow"
          />
        </Field>
      </div>
      <div>
        <Button icon={Eye} disabled={!space || !workflowId} busy={review.isPending} onClick={() => review.mutate()} data-testid="consent-review">
          {t("memory.consents.review")}
        </Button>
      </div>
      {review.error ? (
        <Callout tone="danger">
          <ErrorText error={review.error} />
        </Callout>
      ) : null}
      {preview ? (
        <div className="stack-sm" data-testid="consent-preview">
          <p className="small">{t("memory.consents.covers", { space, count: preview.targets.length })}</p>
          <ul className="small stack-sm">
            {preview.targets.map((target) => (
              <li key={target.workflow_id}>
                <Link to={`/workflows/${encodeURIComponent(target.workflow_id)}`}>{target.name || target.workflow_id}</Link>{" "}
                <span className="muted">
                  {target.version == null ? t("memory.consents.latest") : t("memory.consents.version", { version: target.version })}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small">{t("memory.consents.exactly")}</p>
          {stale ? (
            <Callout tone="warning">
              <span data-testid="consent-stale">{t("memory.consents.stale")}</span>
            </Callout>
          ) : grant.error ? (
            <Callout tone="danger">
              <ErrorText error={grant.error} />
            </Callout>
          ) : null}
          <div className="row-gap">
            {stale ? (
              <Button variant="primary" icon={Eye} busy={review.isPending} onClick={() => review.mutate()} data-testid="consent-review-again">
                {t("memory.consents.reviewAgain")}
              </Button>
            ) : (
              <Button variant="primary" icon={ShieldCheck} busy={grant.isPending} onClick={() => grant.mutate(preview)} data-testid="consent-allow">
                {t("memory.consents.allow")}
              </Button>
            )}
            <Button variant="ghost" onClick={() => choose(() => undefined)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConsentList({ consents }: { consents: MemoryConsent[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const revoke = useMutation<void, Error, string>({
    mutationFn: (id) => api.revokeMemoryConsent(id),
    onSuccess: () => {
      toast.success(t("memory.consents.revoked"));
      void queryClient.invalidateQueries({ queryKey: keys.memoryConsents });
    },
  });
  if (!consents.length) return <p className="small">{t("memory.consents.none")}</p>;
  return (
    <div className="stack-sm">
      <div className="table-wrap">
        <table className="table table--compact small" data-testid="consent-list">
          <thead>
            <tr>
              <th>{t("memory.consents.space")}</th>
              <th>{t("memory.consents.for")}</th>
              <th>{t("memory.consents.at")}</th>
              <th>
                <span className="sr-only">{t("memory.consents.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {consents.map((consent) => (
              <tr key={consent.id} data-testid={`consent-${consent.id}`}>
                <td>
                  <strong>{consent.space}</strong>
                </td>
                <td>
                  {consent.subject === "agent" ? (
                    t("memory.consents.agentTest")
                  ) : (
                    <>
                      {consent.workflow_id ? (
                        <Link to={`/workflows/${encodeURIComponent(consent.workflow_id)}`}>{consent.workflow_name || consent.workflow_id}</Link>
                      ) : (
                        consent.workflow_name
                      )}{" "}
                      <span className="muted">
                        {consent.workflow_version == null
                          ? t("memory.consents.latest")
                          : t("memory.consents.version", { version: consent.workflow_version })}
                      </span>
                    </>
                  )}
                </td>
                <td>{consent.at ? formatDate(consent.at) : ""}</td>
                <td>
                  <ConfirmIconButton
                    icon={Ban}
                    label={t("memory.consents.revoke")}
                    confirmLabel={t("memory.consents.revokeConfirm")}
                    busy={revoke.isPending && revoke.variables === consent.id}
                    onConfirm={() => revoke.mutate(consent.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {revoke.error ? (
        <Callout tone="danger">
          <ErrorText error={revoke.error} />
        </Callout>
      ) : null}
      {revoke.isPending ? <Spinner /> : null}
    </div>
  );
}

// Status of the workflow's API, publishing a saved version, published versions and rollback.

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Power, RotateCcw, Rocket, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { ApiOverview } from "../api/types";
import { TestStatus } from "../automation/TestStatus";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, Hint, Modal, Spinner, StatusBadge, TextInput, Toggle } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";
import type { ApiTab } from "./ApiDialog";
import { CopyButton, Problems } from "./common";

export function ApiOverviewPanel({
  overview,
  dirty,
  save,
  onChanged,
  onTab,
}: {
  overview: ApiOverview;
  dirty: boolean;
  save: (note?: string) => Promise<string | null>;
  onChanged: () => void;
  onTab: (tab: ApiTab) => void;
}) {
  const { t } = useTranslation();
  const publication = overview.publication;
  const latest = overview.releases[0] ?? null;
  const version = overview.current_version;
  const newer = Boolean(version && (!latest || latest.workflow_version !== version));
  const [note, setNote] = useState("");
  const [slug, setSlug] = useState("");
  const [activate, setActivate] = useState(true);
  const [offOpen, setOffOpen] = useState(false);
  const [cancelRunning, setCancelRunning] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const check = useQuery({
    queryKey: ["api", "check", overview.workflow_id, version],
    queryFn: () => api.apiCheck(overview.workflow_id, version),
    enabled: Boolean(version) && newer,
  });
  const publish = useMutation({
    mutationFn: () =>
      api.publishApi(overview.workflow_id, { version, note, slug: publication ? null : slug.trim() || null, activate }),
    onSuccess: (result) => {
      toast.success(t("publish.overview.published", { number: result.release.number }));
      setNote("");
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const activateRelease = useMutation({
    mutationFn: (number: number) => api.activateRelease(publication!.id, number),
    onSuccess: (_, number) => {
      toast.success(t("publish.versions.activated", { number }));
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const enable = useMutation({
    mutationFn: (enabled: boolean) => api.setPublicationEnabled(publication!.id, enabled, cancelRunning),
    onSuccess: (result) => {
      setOffOpen(false);
      if (result.cancelled) toast.info(t("publish.overview.cancelled", { count: result.cancelled }));
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const remove = useMutation({
    mutationFn: () => api.deletePublication(publication!.id),
    onSuccess: () => {
      setDeleteOpen(false);
      onChanged();
    },
    onError: (error) => toast.error(error),
  });

  return (
    <div className="stack">
      {publication ? (
        <section className="card api-status" data-testid="api-status">
          <div className="api-status__head">
            <strong>{publication.name}</strong>
            {publication.enabled ? (
              <Badge tone="success" icon={CheckCircle2}>
                {t("publish.overview.on")}
              </Badge>
            ) : (
              <Badge tone="warning" icon={Power}>
                {t("publish.overview.off")}
              </Badge>
            )}
            {publication.active_release ? <Badge>{t("publish.versions.number", { number: publication.active_release })}</Badge> : null}
            <Badge icon={ShieldCheck}>{t("publish.overview.localOnly")}</Badge>
            {overview.network_urls.length ? <Badge tone="warning">{t("publish.overview.inNetwork")}</Badge> : null}
          </div>
          {overview.local_url ? (
            <div className="api-url">
              <code data-testid="api-url">{overview.local_url}</code>
              <CopyButton text={overview.local_url} />
            </div>
          ) : null}
          {overview.network_urls.map((url) => (
            <div className="api-url" key={url}>
              <code>{url}</code>
              <CopyButton text={url} />
            </div>
          ))}
          <p className="muted small">
            {t("publish.overview.keys", { count: overview.keys })}{" "}
            {overview.keys === 0 ? (
              <Button size="sm" variant="ghost" onClick={() => onTab("access")}>
                {t("publish.overview.createKey")}
              </Button>
            ) : null}
          </p>
          {overview.pending_approvals ? (
            <Callout tone="warning">
              {t("publish.overview.pendingApprovals", { count: overview.pending_approvals })}{" "}
              <Link to="/approvals">{t("publish.overview.openApprovals")}</Link>
            </Callout>
          ) : null}
          {overview.missing_resources.length ? (
            <Callout tone="danger">{t("publish.overview.missing", { names: overview.missing_resources.join(", ") })}</Callout>
          ) : null}
          <div className="row-gap">
            {publication.enabled ? (
              <Hint id="publish.disable">
                <Button icon={Power} variant="ghost" onClick={() => setOffOpen(true)}>
                  {t("publish.overview.switchOff")}
                </Button>
              </Hint>
            ) : (
              <>
                <Button icon={Power} onClick={() => enable.mutate(true)} busy={enable.isPending}>
                  {t("publish.overview.switchOn")}
                </Button>
                <Button icon={Trash2} variant="danger" onClick={() => setDeleteOpen(true)}>
                  {t("publish.overview.delete")}
                </Button>
              </>
            )}
          </div>
        </section>
      ) : (
        <Callout tone="brand">{t("publish.overview.notPublished")}</Callout>
      )}

      <section className="stack-sm">
        <h3 className="api-heading">{publication ? t("publish.overview.newVersion") : t("publish.overview.publishTitle")}</h3>
        {dirty ? (
          <Callout tone="warning">
            {t("publish.overview.unsaved")}{" "}
            <Button size="sm" icon={Save} onClick={() => void save()}>
              {t("publish.overview.saveFirst")}
            </Button>
          </Callout>
        ) : null}
        {!version ? <p className="muted">{t("publish.overview.neverSaved")}</p> : null}
        {version && !newer ? <p className="muted small">{t("publish.overview.upToDate", { version })}</p> : null}
        {version && newer ? (
          <>
            <p className="small">{t("publish.overview.willPublish", { version })}</p>
            <TestStatus workflowId={overview.workflow_id} version={version} />
            {check.isLoading ? <Spinner /> : null}
            {check.error ? (
              <Callout tone="danger">
                <ErrorText error={check.error} />
              </Callout>
            ) : null}
            {check.data ? (
              <>
                <p className="small" data-testid="api-check-summary">
                  {check.data.ok
                    ? t("publish.check.ok", { warnings: check.data.warnings })
                    : t("publish.check.blocked", { count: check.data.errors })}
                </p>
                <Problems problems={check.data.problems} agents={check.data.agents} />
                <ul className="api-facts small muted">
                  <li>{t("publish.check.approvals", { count: check.data.approvals })}</li>
                  {check.data.subworkflows.length ? <li>{t("publish.check.subworkflows", { names: check.data.subworkflows.join(", ") })}</li> : null}
                  {check.data.tools.length ? <li>{t("publish.check.tools", { names: check.data.tools.join(", ") })}</li> : null}
                  {check.data.libraries.length ? <li>{t("publish.check.libraries", { names: check.data.libraries.join(", ") })}</li> : null}
                </ul>
              </>
            ) : null}
            <div className="grid-2">
              <Field label={t("publish.overview.note")} tip="publish.note">
                <TextInput value={note} maxLength={200} onChange={(event) => setNote(event.target.value)} />
              </Field>
              {!publication ? (
                <Field label={t("publish.overview.slug")} hint={t("publish.overview.slugHint")} tip="publish.slug">
                  <TextInput value={slug} maxLength={48} onChange={(event) => setSlug(event.target.value.toLowerCase())} />
                </Field>
              ) : null}
            </div>
            {publication ? (
              <Toggle checked={activate} onChange={setActivate} label={t("publish.overview.activate")} description={t("publish.overview.activateHint")} />
            ) : null}
            <div>
              <Hint id="publish.publish">
                <Button
                  variant="primary"
                  icon={Rocket}
                  disabled={dirty || !check.data?.ok}
                  busy={publish.isPending}
                  onClick={() => publish.mutate()}
                  data-testid="api-publish"
                >
                  {t("publish.overview.publish", { version })}
                </Button>
              </Hint>
            </div>
          </>
        ) : null}
      </section>

      {overview.releases.length ? (
        <section className="stack-sm">
          <h3 className="api-heading">{t("publish.versions.title")}</h3>
          <p className="muted small">{t("publish.versions.hint")}</p>
          <ul className="api-versions" data-testid="api-versions">
            {overview.releases.map((release) => (
              <li key={release.id} className="api-version">
                <strong>{t("publish.versions.number", { number: release.number })}</strong>
                {release.active ? <Badge tone="success">{t("publish.versions.active")}</Badge> : null}
                <span className="muted small">{formatDate(release.created_at)}</span>
                {release.workflow_version ? (
                  <span className="muted small">{t("publish.versions.fromVersion", { version: release.workflow_version })}</span>
                ) : null}
                <span className="muted small">{t("publish.versions.runs", { count: release.runs })}</span>
                {release.note ? <span className="small">{release.note}</span> : null}
                {!release.active ? (
                  <Hint id="publish.rollback">
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => activateRelease.mutate(release.number)}>
                      {t("publish.versions.activate")}
                    </Button>
                  </Hint>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {overview.runs.length ? (
        <section className="stack-sm">
          <h3 className="api-heading">{t("publish.runs.title")}</h3>
          <ul className="api-runs">
            {overview.runs.map((run) => (
              <li key={run.id}>
                <StatusBadge status={run.status} />
                <Link to={`/executions/${run.id}`}>{formatDate(run.created_at)}</Link>
                {run.release_number ? <span className="muted small">{t("publish.versions.number", { number: run.release_number })}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal
        title={t("publish.overview.switchOffTitle")}
        open={offOpen}
        onClose={() => setOffOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOffOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" icon={Power} busy={enable.isPending} onClick={() => enable.mutate(false)}>
              {t("publish.overview.switchOff")}
            </Button>
          </>
        }
      >
        <p>{t("publish.overview.switchOffText")}</p>
        <Toggle checked={cancelRunning} onChange={setCancelRunning} label={t("publish.overview.cancelRunning")} />
      </Modal>
      <Modal
        title={t("publish.overview.deleteTitle")}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" icon={Trash2} busy={remove.isPending} onClick={() => remove.mutate()}>
              {t("publish.overview.delete")}
            </Button>
          </>
        }
      >
        <p>{t("publish.overview.deleteText")}</p>
      </Modal>
    </div>
  );
}

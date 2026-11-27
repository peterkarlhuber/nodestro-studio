// Granted folders (N-10): an administrator grants a folder of this computer for reading, sees every grant with its
// state and access log, and revokes it. Only while granted folders are switched on (off by default, never on a
// server) and for administrators; the API checks both again and checks every path itself. The page never switches
// the feature on: while it is off it only says so.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Ban, Check, Folder, FolderLock, FolderOpen, History, Home, Plus } from "lucide-react";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AccessMode, FolderAccessEntry, FolderGrantIn, FolderGrantView } from "../api/types";
import { PermissionNote } from "../components/Access";
import { Badge, Button, Callout, ConfirmIconButton, Field, Modal, PageHeader, Select, Spinner, TextArea, TextInput, Toggle } from "../components/ui";
import { toast } from "../components/toast";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";

/** Folder tool actions of the access log (nodestro_runtime.folder_grants.TOOL_ACTIONS). */
const ACTIONS = ["folder.listed", "folder.read", "folder.searched"] as const;
type FolderAction = (typeof ACTIONS)[number];
const OUTCOMES = ["success", "failure", "denied"] as const;
type Outcome = (typeof OUTCOMES)[number];

/** One entry per line, without empty lines. */
export function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export interface GrantDraft {
  name: string;
  path: string;
  include: string;
  exclude: string;
  scope: "all" | "agents";
  agents: string;
  mode: AccessMode;
  /** A local date and time from the input, or empty: until revoked. */
  expires: string;
  defaultExcludes: boolean;
  /** Keep a search index of the folder (N-12); off unless the person turns it on. */
  index: boolean;
}

export const EMPTY_DRAFT: GrantDraft = {
  name: "",
  path: "",
  include: "",
  exclude: "",
  scope: "all",
  agents: "",
  mode: "supervised",
  expires: "",
  defaultExcludes: true,
  index: false,
};

/** The request body of a draft. The server checks the path, the patterns and the expiry. */
export function grantBody(draft: GrantDraft): FolderGrantIn {
  return {
    name: draft.name.trim(),
    path: draft.path.trim(),
    include: lines(draft.include),
    exclude: lines(draft.exclude),
    scope: draft.scope,
    agents: draft.scope === "agents" ? lines(draft.agents) : [],
    mode: draft.mode,
    expires_at: draft.expires ? new Date(draft.expires).toISOString() : null,
    default_excludes: draft.defaultExcludes,
    index: draft.index,
  };
}

export function FoldersPage() {
  const { t } = useTranslation();
  const state = useQuery({ queryKey: keys.folderState, queryFn: api.folderState, retry: false });
  const access = useAccess();
  // Nothing that needs the administrator is read before it is known who is signed in.
  const known = access.profile !== "unknown";
  const admin = access.can("admin");
  return (
    <div className="page">
      <PageHeader title={t("approvals.folders.title")} doc="verzweigungen#ordner" description={t("approvals.folders.description")} />
      <div className="page__body stack">
        <p className="small">
          <Link to="/approvals">{t("approvals.access.back")}</Link>
        </p>
        {state.isLoading ? <Spinner /> : null}
        {state.error ? <ErrorText error={state.error} /> : null}
        {state.data && !state.data.enabled ? (
          <Callout tone="info">
            <span data-testid="folders-off">
              <strong>{t("approvals.folders.offTitle")}</strong> {t("approvals.folders.off")}
            </span>
          </Callout>
        ) : null}
        {state.data?.enabled && known ? (
          admin ? (
            <>
              <GrantForm />
              <FolderList />
            </>
          ) : (
            <PermissionNote permission="admin" />
          )
        ) : null}
      </div>
    </div>
  );
}

/**
 * The path of the folder to grant: chosen in the folder browser (``browse``, N-11) or typed by hand, which stays the
 * fallback (the browser needs the window's own session). The server checks the path and names why a folder cannot
 * be granted.
 */
export function FolderPathField({ value, onChange, browse }: { value: string; onChange: (path: string) => void; browse?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Field label={t("approvals.folders.path")} hint={t("approvals.folders.pathHint")} action={browse}>
      <TextInput
        value={value}
        required
        maxLength={4096}
        spellCheck={false}
        autoComplete="off"
        placeholder={t("approvals.folders.pathPlaceholder")}
        onChange={(event) => onChange(event.target.value)}
        data-testid="folder-path"
      />
    </Field>
  );
}

function GrantForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GrantDraft>(EMPTY_DRAFT);
  const set = <K extends keyof GrantDraft>(key: K, value: GrantDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const grant = useMutation({
    mutationFn: () => api.grantFolder(grantBody(draft)),
    onSuccess: (view) => {
      toast.success(t("approvals.folders.granted", { name: view.folder.name }));
      setDraft(EMPTY_DRAFT);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: keys.folders });
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    grant.mutate();
  };
  if (!open)
    return (
      <div>
        <Button variant="primary" icon={Plus} onClick={() => setOpen(true)} data-testid="folder-grant-open">
          {t("approvals.folders.grant")}
        </Button>
      </div>
    );
  return (
    <section className="panel stack" aria-labelledby={`${formId}-title`} id={formId} data-testid="folder-grant-form">
      <h2 className="panel__title" id={`${formId}-title`}>
        {t("approvals.folders.grantTitle")}
      </h2>
      <p className="muted small">{t("approvals.folders.grantText")}</p>
      <form className="stack" onSubmit={submit}>
        <div className="grid-2">
          <Field label={t("approvals.folders.name")} hint={t("approvals.folders.nameHint")}>
            <TextInput value={draft.name} required maxLength={80} onChange={(event) => set("name", event.target.value)} data-testid="folder-name" />
          </Field>
          <FolderPathField
            value={draft.path}
            onChange={(path) => set("path", path)}
            browse={<FolderPicker start={draft.path.trim() || null} onChoose={(path) => set("path", path)} />}
          />
          <Field label={t("approvals.folders.include")} hint={t("approvals.folders.includeHint")}>
            <TextArea rows={3} value={draft.include} spellCheck={false} onChange={(event) => set("include", event.target.value)} />
          </Field>
          <Field label={t("approvals.folders.exclude")} hint={t("approvals.folders.excludeHint")}>
            <TextArea rows={3} value={draft.exclude} spellCheck={false} onChange={(event) => set("exclude", event.target.value)} />
          </Field>
          <Field label={t("approvals.folders.scope")}>
            <Select
              value={draft.scope}
              onChange={(value) => set("scope", value === "agents" ? "agents" : "all")}
              options={[
                { value: "all", label: t("approvals.access.allAgents") },
                { value: "agents", label: t("approvals.folders.someAgents") },
              ]}
              data-testid="folder-scope"
            />
          </Field>
          <Field label={t("approvals.folders.mode")}>
            <Select
              value={draft.mode}
              onChange={(value) => set("mode", value === "unattended" ? "unattended" : "supervised")}
              options={[
                { value: "supervised", label: t("approvals.folders.modes.supervised") },
                { value: "unattended", label: t("approvals.folders.modes.unattended") },
              ]}
            />
          </Field>
          {draft.scope === "agents" ? (
            <Field label={t("approvals.folders.agents")} hint={t("approvals.folders.agentsHint")}>
              <TextArea rows={3} value={draft.agents} required spellCheck={false} onChange={(event) => set("agents", event.target.value)} data-testid="folder-agents" />
            </Field>
          ) : null}
          <Field label={t("approvals.folders.expires")} hint={t("approvals.folders.expiresHint")}>
            <TextInput type="datetime-local" value={draft.expires} onChange={(event) => set("expires", event.target.value)} />
          </Field>
        </div>
        <Toggle
          checked={draft.index}
          onChange={(value) => set("index", value)}
          label={t("approvals.folders.index.toggle")}
          description={t("approvals.folders.index.toggleHint")}
        />
        <Toggle
          checked={draft.defaultExcludes}
          onChange={(value) => set("defaultExcludes", value)}
          label={t("approvals.folders.defaultExcludes")}
          description={t("approvals.folders.defaultExcludesHint")}
        />
        {grant.error ? (
          <Callout tone="danger">
            <span data-testid="folder-grant-error">
              <ErrorText error={grant.error} />
            </span>
          </Callout>
        ) : null}
        <div className="row-gap">
          <Button type="submit" variant="primary" icon={FolderLock} busy={grant.isPending} data-testid="folder-grant-submit">
            {t("approvals.folders.grantSubmit")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              grant.reset();
              setOpen(false);
            }}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}

/** The folder browser (N-11): sub-folders only, never files; the server hides system and credential folders. */
export function FolderPicker({ start, onChoose }: { start: string | null; onChoose: (path: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const listing = useQuery({
    queryKey: ["folders", "browse", path ?? ""],
    queryFn: () => api.browseFolders(path),
    enabled: open,
    retry: false,
    staleTime: 0,
  });
  const data = listing.data;
  const show = (target: string | null) => setPath(target);
  return (
    <>
      <Button
        size="sm"
        icon={FolderOpen}
        onClick={() => {
          setPath(start);
          setOpen(true);
        }}
        data-testid="folder-browse"
      >
        {t("approvals.folders.browse.open")}
      </Button>
      <Modal
        title={t("approvals.folders.browse.title")}
        open={open}
        onClose={() => setOpen(false)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              icon={Check}
              disabled={!data}
              onClick={() => {
                if (!data) return;
                onChoose(data.path);
                setOpen(false);
              }}
              data-testid="folder-browse-choose"
            >
              {t("approvals.folders.browse.choose")}
            </Button>
          </>
        }
      >
        <div className="stack-sm" data-testid="folder-browser">
          <p className="muted small">{t("approvals.folders.browse.text")}</p>
          {data?.places.length ? (
            <div className="row-gap" role="group" aria-label={t("approvals.folders.browse.places")}>
              {data.places.map((place) => (
                <Button key={`${place.kind}-${place.path}`} size="sm" variant="ghost" onClick={() => show(place.path)}>
                  {t(`approvals.folders.browse.place.${place.kind}`)} <code>{place.path}</code>
                </Button>
              ))}
            </div>
          ) : null}
          {listing.error ? (
            <Callout tone="danger">
              <span data-testid="folder-browse-error">
                <ErrorText error={listing.error} />
              </span>
            </Callout>
          ) : null}
          {listing.error && path !== null ? (
            <div>
              <Button size="sm" variant="ghost" icon={Home} onClick={() => show(null)}>
                {t("approvals.folders.browse.home")}
              </Button>
            </div>
          ) : null}
          {listing.isFetching && !data ? <Spinner /> : null}
          {data ? (
            <>
              <p className="small">
                {t("approvals.folders.browse.current")} <code data-testid="folder-browse-path">{data.path}</code>
              </p>
              <ul className="list" aria-label={t("approvals.folders.browse.folders", { path: data.path })}>
                {data.parent ? (
                  <li>
                    <button type="button" className="list__item" onClick={() => show(data.parent)} data-testid="folder-browse-up">
                      <span className="row-gap">
                        <ArrowUp size={14} aria-hidden /> {t("approvals.folders.browse.up")}
                      </span>
                    </button>
                  </li>
                ) : null}
                {data.folders.map((folder) => (
                  <li key={folder.path}>
                    <button type="button" className="list__item" onClick={() => show(folder.path)} data-testid="folder-browse-item">
                      <span className="row-gap">
                        <Folder size={14} aria-hidden /> {folder.name}
                        {folder.link ? <span className="muted"> {t("approvals.folders.browse.link")}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!data.folders.length ? <p className="small muted">{t("approvals.folders.browse.empty")}</p> : null}
              {data.truncated ? <p className="small muted">{t("approvals.folders.browse.truncated")}</p> : null}
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function FolderList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [shown, setShown] = useState<string | null>(null);
  // While an index is being built, its state is read again every few seconds.
  const folders = useQuery({
    queryKey: keys.folders,
    queryFn: api.folders,
    retry: false,
    refetchInterval: (query) => (query.state.data?.some((view) => view.index_state?.state === "indexing") ? 5_000 : false),
  });
  const revoke = useMutation<FolderGrantView, Error, string>({
    mutationFn: (id) => api.revokeFolder(id),
    onSuccess: () => {
      toast.success(t("approvals.access.revoked"));
      void queryClient.invalidateQueries({ queryKey: keys.folders });
    },
  });
  return (
    <section className="stack-sm" aria-labelledby="folders-list-title" data-testid="folders-list">
      <h2 className="panel__title" id="folders-list-title">
        {t("approvals.folders.listTitle")}
      </h2>
      <p className="muted small">{t("approvals.folders.listText")}</p>
      {folders.isLoading ? <Spinner /> : null}
      {folders.error ? <ErrorText error={folders.error} /> : null}
      {folders.data?.length ? (
        <div className="table-wrap">
          <table className="table table--compact small">
            <thead>
              <tr>
                <th>{t("approvals.folders.name")}</th>
                <th>{t("approvals.folders.path")}</th>
                <th>{t("approvals.access.forWhom")}</th>
                <th>{t("approvals.access.by")}</th>
                <th>{t("approvals.access.state")}</th>
                <th>
                  <span className="sr-only">{t("approvals.folders.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {folders.data.map((view) => {
                const { folder } = view;
                const logId = `folder-log-${folder.id}`;
                return [
                  <tr key={folder.id} data-testid={`folder-${folder.id}`}>
                    <td>
                      <strong>{folder.name}</strong>
                    </td>
                    <td>
                      <code>{folder.path}</code>
                    </td>
                    <td>
                      {view.scope === "all" ? t("approvals.access.allAgents") : view.agents.map((agent) => <code key={agent}>{agent} </code>)}
                      <div className="muted">{t(`approvals.folders.modes.${view.mode}`)}</div>
                    </td>
                    <td>{t("approvals.access.byLine", { name: folder.created_by, time: formatDate(folder.created_at) })}</td>
                    <td>
                      <Badge tone={view.status === "active" ? "success" : "idle"}>{t(`approvals.access.states.${view.status}`)}</Badge>{" "}
                      <span className="muted">
                        {view.status === "revoked"
                          ? t("approvals.access.revokedBy", { name: view.revoked_by ?? "", time: formatDate(view.revoked_at) })
                          : view.expires_at
                            ? t("approvals.access.expires", { time: formatDate(view.expires_at) })
                            : t("approvals.access.untilRevoked")}
                      </span>
                      <IndexState view={view} />
                    </td>
                    <td>
                      <div className="row-gap">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={History}
                          aria-expanded={shown === folder.id}
                          aria-controls={logId}
                          onClick={() => setShown((current) => (current === folder.id ? null : folder.id))}
                          data-testid={`folder-log-toggle-${folder.id}`}
                        >
                          {t("approvals.folders.log")}
                        </Button>
                        {view.status === "active" ? (
                          <ConfirmIconButton
                            icon={Ban}
                            label={t("approvals.access.revoke")}
                            confirmLabel={t("approvals.access.revokeConfirm")}
                            busy={revoke.isPending && revoke.variables === folder.id}
                            onConfirm={() => revoke.mutate(folder.id)}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>,
                  shown === folder.id ? (
                    <tr key={`${folder.id}-log`}>
                      <td colSpan={6} id={logId}>
                        <AccessLog folderId={folder.id} name={folder.name} />
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
      ) : folders.data ? (
        <p className="small">{t("approvals.folders.none")}</p>
      ) : null}
      {revoke.error ? (
        <Callout tone="danger">
          <ErrorText error={revoke.error} />
        </Callout>
      ) : null}
    </section>
  );
}

const INDEX_TONE = { indexing: "running", ready: "success", budget_exceeded: "warning", failed: "danger", off: "idle" } as const;

/** The state of a grant's search index (N-12): counts and an error code from the API, never a file name. */
export function IndexState({ view }: { view: FolderGrantView }) {
  const { t } = useTranslation();
  const index = view.index_state;
  // Without an index (or from an API that does not tell) nothing is shown; a grant with one that ended says "off".
  if (!index || (index.state === "off" && !view.folder.index)) return null;
  return (
    <div className="small" data-testid={`folder-index-${view.folder.id}`} data-state={index.state}>
      <Badge tone={INDEX_TONE[index.state]}>{t(`approvals.folders.index.states.${index.state}`)}</Badge>{" "}
      {index.state === "ready" || index.state === "budget_exceeded" ? (
        <span className="muted">
          {t("approvals.folders.index.counts", { count: index.files ?? 0, chunks: index.chunks ?? 0 })}
          {index.skipped ? ` · ${t("approvals.folders.index.skipped", { count: index.skipped })}` : ""}
          {index.last_indexed_at ? ` · ${t("approvals.folders.index.at", { time: formatDate(index.last_indexed_at) })}` : ""}
        </span>
      ) : null}
      {index.state === "budget_exceeded" ? <div className="muted">{t("approvals.folders.index.budget")}</div> : null}
      {index.state === "failed" ? <div className="muted">{index.code ? problemText(t, { code: index.code }) : t("approvals.folders.index.failed")}</div> : null}
      {index.state === "off" ? <div className="muted">{t("approvals.folders.index.offEnded")}</div> : null}
    </div>
  );
}

function actionLabel(t: ReturnType<typeof useTranslation>["t"], action: string): string {
  return (ACTIONS as readonly string[]).includes(action) ? t(`approvals.folders.actionNames.${action as FolderAction}`) : action;
}

function outcomeLabel(t: ReturnType<typeof useTranslation>["t"], outcome: string): string {
  return (OUTCOMES as readonly string[]).includes(outcome) ? t(`approvals.folders.outcomes.${outcome as Outcome}`) : outcome;
}

/** The access log of one grant: which agent called which folder tool, in which run, with what outcome. */
function AccessLog({ folderId, name }: { folderId: string; name: string }) {
  const { t } = useTranslation();
  const log = useQuery({ queryKey: keys.folderAccesses(folderId), queryFn: () => api.folderAccesses(folderId), retry: false });
  if (log.isLoading) return <Spinner />;
  if (log.error) return <ErrorText error={log.error} />;
  if (!log.data?.length) return <p className="small muted">{t("approvals.folders.logNone")}</p>;
  return (
    <ul className="small stack-sm" aria-label={t("approvals.folders.logOf", { name })} data-testid={`folder-log-${folderId}`}>
      {log.data.map((entry: FolderAccessEntry, index) => (
        <li key={`${entry.at}-${index}`}>
          <span className="muted">{formatDate(entry.at)}</span> · {actionLabel(t, entry.action)}
          {entry.agent ? (
            <>
              {" · "}
              <code>{entry.agent}</code>
            </>
          ) : null}
          {" · "}
          <Badge tone={entry.outcome === "success" ? "success" : entry.outcome === "denied" ? "danger" : "warning"}>{outcomeLabel(t, entry.outcome)}</Badge>
          {entry.code ? <span className="muted"> {problemText(t, { code: entry.code })}</span> : null}
          {entry.run_id ? (
            <>
              {" · "}
              <Link to={`/executions/${encodeURIComponent(entry.run_id)}`}>{t("approvals.folders.openRun")}</Link>
            </>
          ) : null}
          {entry.conversation_id ? (
            <>
              {" · "}
              <Link to={`/conversations/${encodeURIComponent(entry.conversation_id)}`}>{t("approvals.folders.openConversation")}</Link>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** The way from the Approvals page to this page: for administrators, except on a server (it has no folders). */
export function FoldersLink() {
  const { t } = useTranslation();
  const access = useAccess();
  if (!access.can("admin") || access.profile === "server") return null;
  return (
    <p className="small" data-testid="folders-link">
      <FolderLock size={14} aria-hidden /> <Link to="/approvals/folders">{t("approvals.folders.link")}</Link>
    </p>
  );
}

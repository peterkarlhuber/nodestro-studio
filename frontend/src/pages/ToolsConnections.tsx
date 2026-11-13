// Tools → Connections (NAL-A1, nodestro-runtime ADR-0001): the service connections built-in tools use (web search,
// mail, webhooks). Each has settings from its type's schema and one secret that is written only: the interface never
// gets it back, it only shows whether one is set and where it is kept. The runtime enforces every rule.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cable, CheckCircle2, History, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { ApiError } from "../api/client";
import {
  type CheckStatus,
  type Connection,
  type ConnectionStatus,
  type ConnectionTypeInfo,
  connectionKeys,
  connectionsApi,
  settingsFields,
  settingsText,
  settingsValues,
  useConnectionEvents,
  useConnectionStatus,
  useConnectionTypes,
  useConnections,
} from "../api/connections";
import { PermissionNote } from "../components/Access";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  ConfirmIconButton,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Section,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";
import { ErrorText, ProblemText, codedError } from "../lib/errors";
import { type Tone, formatDate, relativeTime } from "../lib/format";

const CHECK_TONE: Record<CheckStatus, Tone> = { unchecked: "idle", ok: "success", failed: "danger" };

/** The readable name of a connection type (types other packages register fall back to their name). */
export function useTypeLabel() {
  const { t } = useTranslation();
  return (type: string) => t(`tools.connections.types.${type}`, { defaultValue: type });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: connectionKeys.all });
}

export function ConnectionsTab() {
  const { t } = useTranslation();
  const status = useConnectionStatus();
  const types = useConnectionTypes();
  const connections = useConnections();
  const admin = useAccess().can("admin");
  const typeLabel = useTypeLabel();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (connections.isLoading || status.isLoading || types.isLoading) return <Spinner />;
  const failed = connections.error ?? status.error ?? types.error;
  if (failed)
    return (
      <Callout tone="danger">
        <ErrorText error={failed} />
      </Callout>
    );
  const list = connections.data ?? [];
  const current = list.find((item) => item.id === selected) ?? list[0] ?? null;
  const typeOf = (name: string) => types.data?.find((item) => item.name === name);
  return (
    <div className="stack" data-testid="connections">
      <p className="muted small">{t("tools.connections.intro")}</p>
      {status.data && !status.data.secret_vault ? <Callout tone="info">{t("tools.connections.noVault")}</Callout> : null}
      <PermissionNote permission="admin" />
      <div className="row-between">
        <h2 className="panel__title">{t("tools.connections.title")}</h2>
        {admin ? (
          <Button icon={Plus} onClick={() => setAdding(true)} disabled={!types.data?.length}>
            {t("tools.connections.add")}
          </Button>
        ) : null}
      </div>
      {!list.length ? (
        <EmptyState icon={Cable} title={t("tools.connections.empty")}>
          {t("tools.connections.emptyText")}
        </EmptyState>
      ) : (
        <div className="master-detail">
          <ul className="list" aria-label={t("tools.connections.title")}>
            {list.map((item) => (
              <li key={item.id} className="list__row">
                <button
                  type="button"
                  className={`list__item ${current?.id === item.id ? "selected" : ""}`}
                  onClick={() => setSelected(item.id)}
                  aria-current={current?.id === item.id || undefined}
                >
                  <span className="list__title">
                    {item.name}
                    <CheckBadge connection={item} />
                  </span>
                  <span className="list__text">
                    {typeLabel(item.type)} · {item.provider}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {current && status.data ? (
            <ConnectionDetail
              key={current.id}
              connection={current}
              type={typeOf(current.type)}
              status={status.data}
              onRemoved={() => setSelected(null)}
            />
          ) : null}
        </div>
      )}
      {admin ? <EventsSection /> : null}
      {adding && types.data ? (
        <ConnectionForm
          types={types.data}
          onClose={() => setAdding(false)}
          onSaved={(saved) => {
            setAdding(false);
            setSelected(saved.id);
          }}
        />
      ) : null}
    </div>
  );
}

function CheckBadge({ connection }: { connection: Connection }) {
  const { t } = useTranslation();
  const status = connection.check.status;
  return <Badge tone={CHECK_TONE[status]}>{t(`tools.connections.check.${status}`)}</Badge>;
}

function ConnectionDetail({
  connection,
  type,
  status,
  onRemoved,
}: {
  connection: Connection;
  type: ConnectionTypeInfo | undefined;
  status: ConnectionStatus;
  onRemoved: () => void;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const typeLabel = useTypeLabel();
  const admin = useAccess().can("admin");
  const [editing, setEditing] = useState(false);
  const [inUse, setInUse] = useState<unknown>(null);
  const check = useMutation({
    mutationFn: () => connectionsApi.check(connection.id),
    onSuccess: refresh,
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: (force: boolean) => connectionsApi.remove(connection.id, force),
    onSuccess: () => {
      refresh();
      toast.success(t("tools.connections.removed", { name: connection.name }));
      onRemoved();
    },
    onError: (error) => {
      // Agents still bind it: say which, and offer to delete it anyway (their check then reports the gap).
      if (error instanceof ApiError && error.code === "connection.in_use") setInUse(error);
      else toast.error(error);
    },
  });
  const result = connection.check;
  return (
    <section className="panel stack" aria-label={t("tools.connections.connection", { name: connection.name })}>
      <div className="row-between">
        <div>
          <h2 className="panel__title">
            {connection.name} <CheckBadge connection={connection} />
          </h2>
          <p className="muted small">
            {typeLabel(connection.type)} · {connection.provider}
            {connection.description ? ` · ${connection.description}` : ""}
          </p>
        </div>
        {admin ? (
          <div className="row-gap">
            <IconButton icon={Pencil} label={t("tools.connections.edit")} onClick={() => setEditing(true)} />
            <ConfirmIconButton
              icon={Trash2}
              label={t("tools.connections.remove")}
              confirmLabel={t("tools.connections.removeConfirm")}
              busy={remove.isPending}
              onConfirm={() => remove.mutate(false)}
            />
          </div>
        ) : null}
      </div>
      {inUse ? (
        <div data-testid="connection-in-use">
          <Callout tone="warning">
            <ProblemText item={codedError(inUse)} compact />{" "}
            <Button variant="ghost" icon={Trash2} busy={remove.isPending} onClick={() => remove.mutate(true)}>
              {t("tools.connections.removeAnyway")}
            </Button>
          </Callout>
        </div>
      ) : null}
      <dl className="stack-sm small">
        {Object.entries(connection.settings).map(([key, value]) => (
          <div key={key}>
            <dt className="muted">{t(`tools.connections.field.${key}`, { defaultValue: key })}</dt>
            <dd>
              <code>{value === null || value === undefined ? "–" : String(value)}</code>
            </dd>
          </div>
        ))}
      </dl>
      <p className="muted small">
        {connection.egress.length
          ? t("tools.connections.egress", { hosts: connection.egress.join(", ") })
          : t("tools.connections.noEgress")}
      </p>
      <p className="muted small" data-testid="connection-used-by">
        {connection.used_by.length
          ? t("tools.connections.usedBy", { names: connection.used_by.join(", ") })
          : t("tools.connections.unused")}
      </p>
      <SecretPanel connection={connection} type={type} status={status} admin={admin} />
      <div className="stack-sm" data-testid="connection-check">
        <p className="small">
          <Badge tone={CHECK_TONE[result.status]}>{t(`tools.connections.check.${result.status}`)}</Badge>
          {result.kind ? ` ${t(`tools.connections.checkKind.${result.kind}`)}` : ""}
          {result.checked_at ? (
            <span className="muted"> · {t("tools.connections.checked", { when: relativeTime(result.checked_at) })}</span>
          ) : null}
        </p>
        {result.status === "failed" && result.code ? (
          <Callout tone="danger">
            <ProblemText item={{ code: result.code, params: {} }} compact />{" "}
            <code className="small">{result.code}</code>
          </Callout>
        ) : null}
        {admin && type?.checkable !== false ? (
          <div>
            <Button icon={CheckCircle2} busy={check.isPending} onClick={() => check.mutate()}>
              {t("tools.connections.checkButton")}
            </Button>
          </div>
        ) : null}
      </div>
      {editing && type ? (
        <ConnectionForm types={[type]} connection={connection} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      ) : null}
    </section>
  );
}

/** The write-only secret: set, replace or remove it; it is never read back. */
function SecretPanel({
  connection,
  type,
  status,
  admin,
}: {
  connection: Connection;
  type: ConnectionTypeInfo | undefined;
  status: ConnectionStatus;
  admin: boolean;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [secret, setSecret] = useState("");
  const save = useMutation({
    mutationFn: (value: string) => connectionsApi.setSecret(connection.id, value),
    onSuccess: (_saved, value) => {
      setSecret("");
      refresh();
      toast.success(t(value ? "tools.connections.secretSaved" : "tools.connections.secretRemoved"));
    },
    onError: toast.error,
  });
  const label = t(`tools.connections.secretLabel.${type?.secret_label ?? "api_key"}`, {
    defaultValue: type?.secret_label ?? "",
  });
  return (
    <div className="stack-sm" data-testid="connection-secret">
      <p className="small">
        <KeyRound size={12} aria-hidden />{" "}
        {connection.secret_set ? (
          <>
            <Badge tone="success">{t("tools.connections.secretSet")}</Badge>{" "}
            {connection.secret_storage !== "none" ? (
              <span className="muted">{t(`tools.connections.storage.${connection.secret_storage}`)}</span>
            ) : null}
          </>
        ) : (
          <Badge tone={type?.secret_required ? "warning" : "idle"}>{t("tools.connections.noSecret")}</Badge>
        )}
      </p>
      {!connection.secret_set && type?.secret_required ? (
        <p className="muted small">{t("tools.connections.secretRequired")}</p>
      ) : null}
      {admin ? (
        <>
          <Field
            label={label}
            htmlFor={`connection-secret-${connection.id}`}
            hint={t(status.secret_vault ? "tools.connections.secretVault" : "tools.connections.secretSession")}
          >
            <TextInput
              id={`connection-secret-${connection.id}`}
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              maxLength={8192}
            />
          </Field>
          <div className="row-gap">
            <Button icon={KeyRound} busy={save.isPending && save.variables !== ""} disabled={!secret} onClick={() => save.mutate(secret)}>
              {t(connection.secret_set ? "tools.connections.secretReplace" : "tools.connections.secretSave")}
            </Button>
            {connection.secret_set ? (
              <Button variant="ghost" busy={save.isPending && save.variables === ""} onClick={() => save.mutate("")}>
                {t("tools.connections.secretRemove")}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ConnectionForm({
  types,
  connection,
  onClose,
  onSaved,
}: {
  types: ConnectionTypeInfo[];
  connection?: Connection;
  onClose: () => void;
  onSaved: (connection: Connection) => void;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const typeLabel = useTypeLabel();
  const [typeName, setTypeName] = useState(connection?.type ?? types[0]?.name ?? "");
  const type = types.find((item) => item.name === typeName);
  const fields = type ? settingsFields(type.settings_schema) : [];
  const [provider, setProvider] = useState(connection?.provider ?? type?.providers[0] ?? "generic");
  const [name, setName] = useState(connection?.name ?? "");
  const [description, setDescription] = useState(connection?.description ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => settingsText(fields, connection?.settings));
  const chooseType = (next: string) => {
    const chosen = types.find((item) => item.name === next);
    setTypeName(next);
    setProvider(chosen?.providers[0] ?? "generic");
    setValues(settingsText(chosen ? settingsFields(chosen.settings_schema) : []));
  };
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        provider,
        description: description.trim(),
        settings: settingsValues(fields, values),
      };
      return connection ? connectionsApi.update(connection.id, body) : connectionsApi.create({ type: typeName, ...body });
    },
    onSuccess: (saved) => {
      refresh();
      toast.success(t("tools.connections.saved", { name: saved.name }));
      onSaved(saved);
    },
    // The problem stays in the dialog, next to the form.
  });
  const missing = fields.some((field) => field.required && !(values[field.name] ?? "").trim());
  return (
    <Modal
      title={connection ? t("tools.connections.editTitle", { name: connection.name }) : t("tools.connections.addTitle")}
      open
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button busy={save.isPending} disabled={!name.trim() || !type || missing} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label={t("tools.connections.type")} htmlFor="connection-type">
          <Select
            id="connection-type"
            value={typeName}
            onChange={chooseType}
            disabled={Boolean(connection)}
            options={types.map((item) => ({ value: item.name, label: typeLabel(item.name) }))}
          />
        </Field>
        {type && type.providers.length > 1 ? (
          <Field label={t("tools.connections.provider")} htmlFor="connection-provider">
            <Select
              id="connection-provider"
              value={provider}
              onChange={setProvider}
              options={type.providers.map((item) => ({ value: item, label: item }))}
            />
          </Field>
        ) : null}
        <Field label={t("tools.connections.name")} htmlFor="connection-name">
          <TextInput id="connection-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </Field>
        <Field label={t("tools.connections.description")} htmlFor="connection-description">
          <TextInput
            id="connection-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
        </Field>
        {fields.map((field) => {
          const id = `connection-setting-${field.name}`;
          const label = t(`tools.connections.field.${field.name}`, { defaultValue: field.title });
          const set = (value: string) => setValues((current) => ({ ...current, [field.name]: value }));
          return (
            <Field key={field.name} label={field.required ? `${label} *` : label} htmlFor={id}>
              {field.kind === "enum" ? (
                <Select
                  id={id}
                  value={values[field.name] ?? ""}
                  onChange={set}
                  placeholder={field.required ? undefined : ""}
                  options={field.options.map((option) => ({ value: option, label: option }))}
                />
              ) : (
                <TextInput
                  id={id}
                  type={field.kind === "string" ? "text" : "number"}
                  step={field.kind === "integer" ? 1 : "any"}
                  value={values[field.name] ?? ""}
                  onChange={(event) => set(event.target.value)}
                />
              )}
            </Field>
          );
        })}
        <p className="muted small">{t("tools.connections.secretLater")}</p>
        {save.error ? (
          <Callout tone="danger">
            <ErrorText error={save.error} />
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}

function EventsSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const events = useConnectionEvents(open);
  return (
    <Section title={t("tools.connections.events")} icon={History} open={open} onToggle={setOpen}>
      {events.isLoading ? <Spinner /> : null}
      {events.error ? <ErrorText error={events.error} /> : null}
      {events.data && !events.data.length ? <p className="muted small">{t("tools.connections.noEvents")}</p> : null}
      {events.data?.length ? (
        <ul className="stack-sm small">
          {events.data.map((event) => (
            <li key={event.id}>
              <span className="muted">{formatDate(event.at)}</span> {t(`tools.connections.event.${event.kind}`)}{" "}
              <code>{event.connection_id}</code>
              {event.actor ? <span className="muted"> · {event.actor}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

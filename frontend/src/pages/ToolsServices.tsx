// Tools → Connected services (ADR-0007, WP-4): remote MCP servers, the connection test, the tools they offer and the
// administrator's decision per tool (classification, diff review of changed definitions). The runtime enforces every
// rule; this page shows the state and edits the configuration. Texts from a service are shown as foreign text.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, History, Pencil, PlugZap, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { keys } from "../api/hooks";
import {
  type McpAccess,
  type McpServer,
  type McpServerIn,
  type McpStatus,
  type McpTool,
  definitionChanges,
  mcpApi,
  mcpKeys,
  needsDecision,
  useMcpEvents,
  useMcpServers,
  useMcpStatus,
  useMcpTools,
} from "../api/mcp";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  ConfirmIconButton,
  EmptyState,
  Field,
  HelpTip,
  IconButton,
  Modal,
  Section,
  Segmented,
  Select,
  Spinner,
  TextInput,
  Toggle,
} from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { type Tone, formatDate, relativeTime } from "../lib/format";

const ACCESS: McpAccess[] = ["read", "write", "destructive"];
const STATUS_TONE: Record<McpTool["status"], Tone> = {
  new: "warning",
  changed: "danger",
  approved: "success",
  rejected: "idle",
  removed: "idle",
};

export function ServicesTab() {
  const { t } = useTranslation();
  const status = useMcpStatus();
  const servers = useMcpServers();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (servers.isLoading || status.isLoading) return <Spinner />;
  if (servers.error) return <Callout tone="danger"><ErrorText error={servers.error} /></Callout>;
  const list = servers.data ?? [];
  const current = list.find((item) => item.id === selected) ?? list[0] ?? null;
  return (
    <div className="stack" data-testid="mcp-services">
      <p className="muted small">
        {t("tools.services.intro")} <HelpTip id="tools.services" label={t("tools.services.title")} />
      </p>
      {status.data ? <StatusNotes status={status.data} /> : null}
      <div className="row-between">
        <h2 className="panel__title">{t("tools.services.title")}</h2>
        <Button icon={Plus} onClick={() => setAdding(true)} disabled={status.data?.endpoint_list?.length === 0}>
          {t("tools.services.add")}
        </Button>
      </div>
      {!list.length ? (
        <EmptyState icon={PlugZap} title={t("tools.services.empty")}>
          {t("tools.services.emptyText")}
        </EmptyState>
      ) : (
        <div className="master-detail">
          <ul className="list" aria-label={t("tools.services.title")}>
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
                    <ServerBadge server={item} />
                  </span>
                  <span className="list__text">
                    <code>{item.url}</code>
                  </span>
                  <span className="list__text">
                    {t("tools.services.counts", {
                      approved: item.tools_approved,
                      total: item.tools_total,
                      pending: item.tools_pending,
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {current && status.data ? (
            <ServerDetail key={current.id} server={current} status={status.data} onRemoved={() => setSelected(null)} />
          ) : null}
        </div>
      )}
      <EventsSection />
      {adding && status.data ? (
        <ServerForm
          status={status.data}
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

/** What this installation allows: SDK, token storage, the operator's endpoint list, unattended use. */
function StatusNotes({ status }: { status: McpStatus }) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm" data-testid="mcp-status">
      {!status.available ? <Callout tone="warning">{t("tools.services.unavailable")}</Callout> : null}
      {status.endpoint_list !== null ? (
        status.endpoint_list.length ? (
          <Callout tone="info">
            {t("tools.services.endpointList", { list: status.endpoint_list.join(", ") })}
          </Callout>
        ) : (
          <Callout tone="warning">{t("tools.services.endpointListEmpty")}</Callout>
        )
      ) : null}
      {!status.token_vault ? <Callout tone="info">{t("tools.services.noVault")}</Callout> : null}
      <p className="muted small">
        {t(status.write_tools_enabled ? "tools.services.writeEnabled" : "tools.services.readOnlyMvp")}{" "}
        {t(status.unattended_enabled ? "tools.services.unattendedOn" : "tools.services.unattendedOff")}
      </p>
    </div>
  );
}

function ServerBadge({ server }: { server: McpServer }) {
  const { t } = useTranslation();
  if (!server.enabled) return <Badge tone="idle">{t("tools.services.disabled")}</Badge>;
  if (server.last_error_code) return <Badge tone="danger">{t("tools.services.error")}</Badge>;
  if (server.tools_pending) return <Badge tone="warning">{t("tools.services.pending", { count: server.tools_pending })}</Badge>;
  if (!server.last_checked_at) return <Badge tone="idle">{t("tools.services.unchecked")}</Badge>;
  return <Badge tone="success">{t("tools.services.connected")}</Badge>;
}

function serverInput(server: McpServer, change: Partial<McpServerIn> = {}): McpServerIn {
  return {
    name: server.name,
    url: server.url,
    enabled: server.enabled,
    allow_loopback: server.allow_loopback,
    auth: server.auth,
    timeout_seconds: server.timeout_seconds,
    max_output_chars: server.max_output_chars,
    max_parallel_calls: server.max_parallel_calls,
    ...change,
  };
}

function useRefresh() {
  const queryClient = useQueryClient();
  return (serverId?: string) => {
    void queryClient.invalidateQueries({ queryKey: mcpKeys.servers });
    void queryClient.invalidateQueries({ queryKey: mcpKeys.events });
    void queryClient.invalidateQueries({ queryKey: keys.tools });
    if (serverId) void queryClient.invalidateQueries({ queryKey: mcpKeys.tools(serverId) });
  };
}

function ServerDetail({ server, status, onRemoved }: { server: McpServer; status: McpStatus; onRemoved: () => void }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const tools = useMcpTools(server.id);
  const [editing, setEditing] = useState(false);
  const discover = useMutation({
    mutationFn: () => mcpApi.discover(server.id),
    onSuccess: (result) => {
      refresh(server.id);
      toast.success(t("tools.services.discovered", { count: result.tools.length }));
    },
    onError: (error) => {
      refresh(server.id);
      toast.error(error);
    },
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => mcpApi.update(server.id, serverInput(server, { enabled })),
    onSuccess: () => refresh(server.id),
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => mcpApi.remove(server.id),
    onSuccess: () => {
      refresh();
      toast.success(t("tools.services.removed", { name: server.name }));
      onRemoved();
    },
    onError: toast.error,
  });
  const waiting = (tools.data ?? []).filter(needsDecision);
  const others = (tools.data ?? []).filter((tool) => !needsDecision(tool));
  return (
    <section className="panel stack" aria-label={t("tools.services.server", { name: server.name })}>
      <div className="row-between">
        <div>
          <h2 className="panel__title">
            {server.name} <ServerBadge server={server} />
          </h2>
          <p className="muted small">
            <code>{server.url}</code>
            {server.protocol_version ? ` · ${t("tools.services.protocol", { version: server.protocol_version })}` : ""}
            {server.server_name ? ` · ${server.server_name}${server.server_version ? ` ${server.server_version}` : ""}` : ""}
            {server.last_checked_at ? ` · ${t("tools.services.checked", { when: relativeTime(server.last_checked_at) })}` : ""}
          </p>
          <p className="muted small">
            {t(`tools.services.auth.${server.auth}`)}
            {server.token_set ? ` · ${t(`tools.services.storage.${server.token_storage}`)}` : ""}
            {server.allow_loopback ? ` · ${t("tools.services.loopbackOn")}` : ""}
          </p>
        </div>
        <div className="row-gap">
          <IconButton icon={Pencil} label={t("tools.services.edit")} onClick={() => setEditing(true)} />
          <ConfirmIconButton
            icon={Trash2}
            label={t("tools.services.remove")}
            confirmLabel={t("tools.services.removeConfirm")}
            busy={remove.isPending}
            onConfirm={() => remove.mutate()}
          />
        </div>
      </div>
      {server.last_error_code ? (
        <Callout tone="danger">
          <ProblemText item={{ code: server.last_error_code, params: server.last_error_params }} />
        </Callout>
      ) : null}
      <div className="row-gap">
        <Button icon={RefreshCw} busy={discover.isPending} onClick={() => discover.mutate()} disabled={!status.available}>
          {t("tools.services.test")}
        </Button>
        <Toggle
          checked={server.enabled}
          onChange={(value) => toggle.mutate(value)}
          disabled={toggle.isPending}
          label={t("tools.services.enabled")}
        />
      </div>
      {tools.isLoading ? <Spinner /> : null}
      {tools.data && !tools.data.length ? <p className="muted small">{t("tools.services.noTools")}</p> : null}
      {waiting.length ? (
        <div className="stack-sm" data-testid="mcp-waiting">
          <h3 className="small strong">
            <ShieldAlert size={14} aria-hidden /> {t("tools.services.waiting", { count: waiting.length })}
          </h3>
          {waiting.map((tool) => (
            <ToolReview key={tool.name} tool={tool} status={status} />
          ))}
        </div>
      ) : null}
      {others.length ? (
        <ul className="stack-sm mcp-tools" aria-label={t("tools.services.tools")}>
          {others.map((tool) => (
            <li key={tool.name}>
              <ToolRow tool={tool} status={status} />
            </li>
          ))}
        </ul>
      ) : null}
      {editing ? (
        <ServerForm status={status} server={server} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      ) : null}
    </section>
  );
}

function ToolRow({ tool, status }: { tool: McpTool; status: McpStatus }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="mcp-tool">
      <div className="row-between">
        <span>
          <code>{tool.name}</code> <Badge tone={STATUS_TONE[tool.status]}>{t(`tools.services.status.${tool.status}`)}</Badge>{" "}
          {tool.status === "approved" ? <Badge tone="idle">{t(`tools.services.access.${tool.access}`)}</Badge> : null}
        </span>
        <Button variant="ghost" onClick={() => setOpen((value) => !value)}>
          {t(open ? "tools.services.close" : "tools.services.review")}
        </Button>
      </div>
      {tool.usable ? (
        <p className="muted small">
          <CheckCircle2 size={12} aria-hidden /> {t("tools.services.usable", { name: tool.tool_name })}
        </p>
      ) : tool.refusal && tool.status === "approved" ? (
        <p className="muted small">
          <Ban size={12} aria-hidden /> <ProblemText item={{ code: tool.refusal, params: {} }} compact />
        </p>
      ) : null}
      {open ? <ToolReview tool={tool} status={status} embedded /> : null}
    </div>
  );
}

/** The administrator's review: the definition as foreign text, what changed, the classification and the decision. */
function ToolReview({ tool, status, embedded }: { tool: McpTool; status: McpStatus; embedded?: boolean }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [access, setAccess] = useState<McpAccess>(tool.status === "approved" ? tool.access : "write");
  const changes = tool.status === "changed" ? definitionChanges(tool.approved_definition, tool.definition) : [];
  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      mcpApi.decide(tool.server_id, tool.name, approve ? { approve, access, expected_hash: tool.hash } : { approve }),
    onSuccess: (result) => {
      refresh(tool.server_id);
      toast.success(t(result.status === "approved" ? "tools.services.approvedToast" : "tools.services.rejectedToast", { name: tool.name }));
    },
    onError: (error) => {
      refresh(tool.server_id);
      toast.error(error);
    },
  });
  const definition = tool.definition;
  return (
    <div className={embedded ? "stack-sm" : "panel stack-sm"} data-testid={`mcp-review-${tool.name}`}>
      {!embedded ? (
        <div className="row-between">
          <span>
            <code>{tool.name}</code> <Badge tone={STATUS_TONE[tool.status]}>{t(`tools.services.status.${tool.status}`)}</Badge>
          </span>
        </div>
      ) : null}
      {changes.length ? (
        <div className="stack-sm" data-testid="mcp-diff">
          <Callout tone="danger">{t("tools.services.changedText")}</Callout>
          {changes.map((change) => (
            <div key={change.field} className="mcp-diff">
              <div className="small strong">{t(`tools.services.field.${change.field}`)}</div>
              <div className="mcp-diff__columns">
                <div>
                  <div className="muted small">{t("tools.services.before")}</div>
                  <pre className="code-block mcp-diff__before">{change.before || "–"}</pre>
                </div>
                <div>
                  <div className="muted small">{t("tools.services.after")}</div>
                  <pre className="code-block mcp-diff__after">{change.after || "–"}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Field label={t("tools.services.description")} hint={t("tools.services.foreignText")}>
        <blockquote className="foreign-text" lang="">
          {definition.title ? <strong>{definition.title}</strong> : null}
          <div>{definition.description || t("tools.services.noDescription")}</div>
        </blockquote>
      </Field>
      <Section title={t("tools.services.schema")}>
        <pre className="code-block">{JSON.stringify(definition.input_schema, null, 2)}</pre>
        {Object.keys(definition.annotations).length ? (
          <pre className="code-block">{JSON.stringify(definition.annotations, null, 2)}</pre>
        ) : null}
      </Section>
      <Field label={t("tools.services.classify")} hint={t("tools.services.suggested", { access: t(`tools.services.access.${tool.suggested_access}`) })}>
        <Segmented<McpAccess>
          label={t("tools.services.classify")}
          value={access}
          onChange={setAccess}
          options={ACCESS.map((value) => ({ value, label: t(`tools.services.access.${value}`) }))}
        />
      </Field>
      <p className="muted small">{t(`tools.services.accessHint.${access}`)}</p>
      {access !== "read" && !status.write_tools_enabled ? (
        <Callout tone="warning">{t("tools.services.writeBlocked")}</Callout>
      ) : null}
      <p className="muted small">{t("tools.services.argumentsNote")}</p>
      <div className="row-gap">
        {tool.status !== "removed" ? (
          <Button icon={CheckCircle2} busy={decide.isPending && decide.variables === true} onClick={() => decide.mutate(true)}>
            {t(tool.status === "changed" ? "tools.services.acceptChange" : "tools.services.approve")}
          </Button>
        ) : null}
        {tool.status !== "rejected" ? (
          <Button variant="ghost" icon={Ban} busy={decide.isPending && decide.variables === false} onClick={() => decide.mutate(false)}>
            {t("tools.services.reject")}
          </Button>
        ) : null}
      </div>
      {tool.approved_at ? (
        <p className="muted small">
          {t("tools.services.approvedBy", { who: tool.approved_by ?? "–", when: formatDate(tool.approved_at) })}
        </p>
      ) : null}
      <p className="muted small">
        {t("tools.services.hash")} <code>{tool.hash.slice(0, 12)}</code>
      </p>
    </div>
  );
}

function ServerForm({
  status,
  server,
  onClose,
  onSaved,
}: {
  status: McpStatus;
  server?: McpServer;
  onClose: () => void;
  onSaved: (server: McpServer) => void;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [name, setName] = useState(server?.name ?? "");
  const [url, setUrl] = useState(server?.url ?? "https://");
  const [auth, setAuth] = useState<"none" | "bearer">(server?.auth === "bearer" ? "bearer" : "none");
  const [token, setToken] = useState("");
  const [dropToken, setDropToken] = useState(false);
  const [loopback, setLoopback] = useState(server?.allow_loopback ?? false);
  const [timeout, setTimeoutSeconds] = useState(String(server?.timeout_seconds ?? 60));
  const save = useMutation({
    mutationFn: () => {
      const body: McpServerIn = {
        ...(server ? serverInput(server) : {}),
        name: name.trim(),
        url: url.trim(),
        auth,
        allow_loopback: status.loopback_possible && loopback,
        timeout_seconds: Number(timeout) || 60,
      };
      if (auth === "none") body.token = server?.token_set ? "" : undefined;
      else if (dropToken) body.token = "";
      else if (token) body.token = token;
      return server ? mcpApi.update(server.id, body) : mcpApi.add(body);
    },
    onSuccess: (saved) => {
      refresh(saved.id);
      toast.success(t("tools.services.saved", { name: saved.name }));
      onSaved(saved);
    },
    onError: toast.error,
  });
  return (
    <Modal
      title={server ? t("tools.services.editTitle", { name: server.name }) : t("tools.services.addTitle")}
      open
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button busy={save.isPending} disabled={!name.trim() || !url.trim()} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label={t("tools.services.name")} htmlFor="mcp-name">
          <TextInput id="mcp-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </Field>
        <Field label={t("tools.services.url")} htmlFor="mcp-url" hint={t("tools.services.urlHint")}>
          <TextInput id="mcp-url" value={url} onChange={(event) => setUrl(event.target.value)} inputMode="url" />
        </Field>
        <Field label={t("tools.services.authLabel")} htmlFor="mcp-auth">
          <Select
            id="mcp-auth"
            value={auth}
            onChange={(value) => setAuth(value as "none" | "bearer")}
            options={[
              { value: "none", label: t("tools.services.auth.none") },
              { value: "bearer", label: t("tools.services.auth.bearer") },
            ]}
          />
        </Field>
        {auth === "bearer" ? (
          <Field
            label={t("tools.services.token")}
            htmlFor="mcp-token"
            hint={t(status.token_vault ? "tools.services.tokenVault" : "tools.services.tokenSession")}
          >
            <TextInput
              id="mcp-token"
              type="password"
              autoComplete="off"
              value={token}
              disabled={dropToken}
              placeholder={server?.token_set ? t("tools.services.tokenKept") : ""}
              onChange={(event) => setToken(event.target.value)}
            />
          </Field>
        ) : null}
        {auth === "bearer" && server?.token_set ? (
          <Toggle checked={dropToken} onChange={setDropToken} label={t("tools.services.tokenRemove")} />
        ) : null}
        {status.loopback_possible ? (
          <Toggle
            checked={loopback}
            onChange={setLoopback}
            label={t("tools.services.loopback")}
            description={t("tools.services.loopbackHint")}
          />
        ) : null}
        <Field label={t("tools.services.timeout")} htmlFor="mcp-timeout">
          <TextInput
            id="mcp-timeout"
            type="number"
            min={1}
            max={300}
            value={timeout}
            onChange={(event) => setTimeoutSeconds(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

function EventsSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const events = useMcpEvents(open);
  return (
    <Section title={t("tools.services.events")} icon={History} open={open} onToggle={setOpen}>
      {events.isLoading ? <Spinner /> : null}
      {events.error ? <ErrorText error={events.error} /> : null}
      {events.data && !events.data.length ? <p className="muted small">{t("tools.services.noEvents")}</p> : null}
      {events.data?.length ? (
        <ul className="stack-sm small">
          {events.data.map((event) => (
            <li key={event.id}>
              <span className="muted">{formatDate(event.at)}</span> {t(`tools.services.event.${event.kind}`, { defaultValue: event.kind })}
              {event.tool ? (
                <>
                  {" "}
                  <code>{event.tool}</code>
                </>
              ) : null}
              {event.actor ? <span className="muted"> · {event.actor}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

// Tools → Connected services (ADR-0007, WP-4): remote MCP servers, the connection test, the tools they offer and the
// administrator's decision per tool (classification, diff review of changed definitions). The runtime enforces every
// rule; this page shows the state and edits the configuration. Texts from a service are shown as foreign text.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Ban, CheckCircle2, History, LogIn, LogOut, Pencil, PlugZap, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { keys } from "../api/hooks";
import {
  type McpAccess,
  type McpServer,
  type McpServerIn,
  type McpStatus,
  type McpTool,
  type McpTransport,
  definitionChanges,
  mcpApi,
  mcpKeys,
  needsDecision,
  useMcpEvents,
  useMcpServers,
  useMcpStats,
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
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { type Tone, formatDate, relativeTime } from "../lib/format";
import { McpServerDependencies } from "../python/DependencyPanel";

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
  useOAuthReturn(setSelected);
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
      <StatsSection servers={list} />
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

/** The server whose sign-in left the page, so the return shows it again (this tab only). */
const OAUTH_SERVER_KEY = "nodestro.mcp.oauthServer";

function rememberOAuthServer(id: string) {
  try {
    sessionStorage.setItem(OAUTH_SERVER_KEY, id);
  } catch {
    // Without storage the return shows the first service.
  }
}

function takeOAuthServer(): string | null {
  try {
    const id = sessionStorage.getItem(OAUTH_SERVER_KEY);
    sessionStorage.removeItem(OAUTH_SERVER_KEY);
    return id;
  } catch {
    return null;
  }
}

/** The browser's return from an OAuth sign-in: /tools?tab=services&oauth=connected or &oauth_error=<code>. */
function useOAuthReturn(select: (id: string) => void) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const connected = params.get("oauth");
  const failed = params.get("oauth_error");
  useEffect(() => {
    if (!connected && !failed) return;
    if (connected === "connected") toast.success(t("tools.services.oauth.connected"));
    if (failed) toast.error(new Error(t(`errors.${failed}`, { defaultValue: t("tools.services.oauth.failed", { code: failed }) })));
    void queryClient.invalidateQueries({ queryKey: mcpKeys.all });
    const server = takeOAuthServer();
    if (server) select(server);
    const next = new URLSearchParams(params);
    next.delete("oauth");
    next.delete("oauth_error");
    setParams(next, { replace: true });
  }, [connected, failed, params, setParams, queryClient, t, select]);
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
      {!status.stdio_possible ? <p className="muted small">{t("tools.services.stdioUnavailable")}</p> : null}
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
  const where: Partial<McpServerIn> =
    server.transport === "stdio" ? { transport: "stdio", stdio: server.stdio } : { transport: "http", url: server.url };
  return {
    name: server.name,
    ...where,
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
  const signIn = useMutation({
    mutationFn: () => mcpApi.oauthStart(server.id),
    // The authorization server's page; it returns to /tools?tab=services (handled by useOAuthReturn).
    onSuccess: (result) => {
      rememberOAuthServer(server.id);
      window.location.assign(result.authorization_url);
    },
    onError: (error) => {
      refresh(server.id);
      toast.error(error);
    },
  });
  const signOut = useMutation({
    mutationFn: () => mcpApi.oauthSignOut(server.id),
    onSuccess: () => {
      refresh(server.id);
      toast.success(t("tools.services.oauth.signedOut", { name: server.name }));
    },
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
            {server.transport === "stdio" ? t("tools.services.local") : t(`tools.services.auth.${server.auth}`)}
            {server.token_set ? ` · ${t(`tools.services.storage.${server.token_storage}`)}` : ""}
            {server.allow_loopback ? ` · ${t("tools.services.loopbackOn")}` : ""}
          </p>
          {server.auth === "oauth" ? <OAuthSummary server={server} /> : null}
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
      {server.transport === "stdio" ? <McpServerDependencies serverId={server.id} name={server.name} /> : null}
      <div className="row-gap">
        {server.auth === "oauth" ? (
          server.token_set ? (
            <Button variant="ghost" icon={LogOut} busy={signOut.isPending} onClick={() => signOut.mutate()}>
              {t("tools.services.oauth.signOut")}
            </Button>
          ) : (
            <Button icon={LogIn} busy={signIn.isPending} onClick={() => signIn.mutate()} disabled={!status.available}>
              {t("tools.services.oauth.signIn")}
            </Button>
          )
        ) : null}
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

/** What the sign-in left behind (issuer, scope, expiry); the credentials themselves stay sealed in the runtime. */
function OAuthSummary({ server }: { server: McpServer }) {
  const { t } = useTranslation();
  const text = (key: string) => (typeof server.oauth[key] === "string" ? (server.oauth[key] as string) : null);
  const issuer = text("issuer");
  const scope = text("scope");
  const expires = text("expires_at");
  const pending = text("pending_until");
  return (
    <p className="muted small" data-testid="mcp-oauth">
      {server.token_set ? t("tools.services.oauth.signedIn") : t("tools.services.oauth.notSignedIn")}
      {issuer ? ` · ${t("tools.services.oauth.issuer", { issuer })}` : ""}
      {scope ? ` · ${t("tools.services.oauth.scope", { scope })}` : ""}
      {expires ? ` · ${t("tools.services.oauth.expires", { when: relativeTime(expires) })}` : ""}
      {pending && !server.token_set ? ` · ${t("tools.services.oauth.pending")}` : ""}{" "}
      <HelpTip id="tools.servicesOAuth" label={t("tools.services.auth.oauth")} />
    </p>
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
  const [transport, setTransport] = useState<McpTransport>(server?.transport ?? "http");
  const [url, setUrl] = useState(server?.transport === "stdio" ? "https://" : (server?.url ?? "https://"));
  const [module, setModule] = useState(server?.stdio?.module ?? "");
  const [requirements, setRequirements] = useState((server?.stdio?.requirements ?? []).join("\n"));
  const [args, setArgs] = useState((server?.stdio?.args ?? []).join("\n"));
  const [auth, setAuth] = useState<"none" | "bearer" | "oauth">(server?.auth ?? "none");
  const [token, setToken] = useState("");
  const [dropToken, setDropToken] = useState(false);
  const [loopback, setLoopback] = useState(server?.allow_loopback ?? false);
  const [timeout, setTimeoutSeconds] = useState(String(server?.timeout_seconds ?? 60));
  const save = useMutation({
    mutationFn: () => {
      const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);
      const local = transport === "stdio";
      const body: McpServerIn = {
        ...(server ? serverInput(server) : {}),
        name: name.trim(),
        transport,
        url: local ? undefined : url.trim(),
        stdio: local
          ? { ...(server?.stdio ?? {}), module: module.trim(), requirements: lines(requirements), args: lines(args) }
          : null,
        // A local server takes no token and no sign-in (mcp.stdio_invalid).
        auth: local ? "none" : auth,
        allow_loopback: !local && status.loopback_possible && loopback,
        timeout_seconds: Number(timeout) || 60,
      };
      if (local || auth === "none" || auth === "oauth") body.token = auth !== "oauth" && server?.token_set ? "" : undefined;
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
          <Button
            busy={save.isPending}
            disabled={!name.trim() || (transport === "stdio" ? !module.trim() || !requirements.trim() : !url.trim())}
            onClick={() => save.mutate()}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label={t("tools.services.name")} htmlFor="mcp-name">
          <TextInput id="mcp-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </Field>
        {status.stdio_possible || server?.transport === "stdio" ? (
          <Field label={t("tools.services.transport")} hint={t(`tools.services.transportHint.${transport}`)}>
            <Segmented<McpTransport>
              label={t("tools.services.transport")}
              value={transport}
              onChange={setTransport}
              options={[
                { value: "http", label: t("tools.services.transports.http") },
                { value: "stdio", label: t("tools.services.transports.stdio") },
              ]}
            />
          </Field>
        ) : null}
        {transport === "stdio" ? (
          <>
            <Field label={t("tools.services.requirements")} htmlFor="mcp-requirements" hint={t("tools.services.requirementsHint")}>
              <TextArea
                id="mcp-requirements"
                rows={3}
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder="mcp-server-time"
              />
            </Field>
            <Field label={t("tools.services.module")} htmlFor="mcp-module" hint={t("tools.services.moduleHint")}>
              <TextInput id="mcp-module" value={module} onChange={(event) => setModule(event.target.value)} placeholder="mcp_server_time" />
            </Field>
            <Field label={t("tools.services.args")} htmlFor="mcp-args" hint={t("tools.services.argsHint")}>
              <TextArea id="mcp-args" rows={2} value={args} onChange={(event) => setArgs(event.target.value)} />
            </Field>
            <Callout tone="info">{t("tools.services.localNote")}</Callout>
          </>
        ) : (
          <>
            <Field label={t("tools.services.url")} htmlFor="mcp-url" hint={t("tools.services.urlHint")}>
              <TextInput id="mcp-url" value={url} onChange={(event) => setUrl(event.target.value)} inputMode="url" />
            </Field>
            <Field label={t("tools.services.authLabel")} htmlFor="mcp-auth" hint={auth === "oauth" ? t("tools.services.oauth.hint") : undefined}>
              <Select
                id="mcp-auth"
                value={auth}
                onChange={(value) => setAuth(value as "none" | "bearer" | "oauth")}
                options={[
                  { value: "none", label: t("tools.services.auth.none") },
                  { value: "bearer", label: t("tools.services.auth.bearer") },
                  { value: "oauth", label: t("tools.services.auth.oauth") },
                ]}
              />
            </Field>
          </>
        )}
        {transport === "http" && auth === "bearer" ? (
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
        {transport === "http" && auth === "bearer" && server?.token_set ? (
          <Toggle checked={dropToken} onChange={setDropToken} label={t("tools.services.tokenRemove")} />
        ) : null}
        {transport === "http" && status.loopback_possible ? (
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

/** Calls in flight, the operator's limits and each server's health since the start (WP-7; administrators). */
function StatsSection({ servers }: { servers: McpServer[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const stats = useMcpStats(open);
  const names = new Map(servers.map((item) => [item.id, item.name]));
  return (
    <Section title={t("tools.services.stats.title")} icon={Activity} open={open} onToggle={setOpen}>
      {stats.isLoading ? <Spinner /> : null}
      {stats.error ? <ErrorText error={stats.error} /> : null}
      {stats.data ? (
        <div className="stack-sm small" data-testid="mcp-stats">
          <p className="muted">
            {t("tools.services.stats.active", { count: stats.data.active_calls })}{" "}
            {t("tools.services.stats.limits", {
              parallel: stats.data.limits.max_parallel ?? "–",
              perMinute: stats.data.limits.calls_per_minute ?? "–",
              servers: stats.data.limits.max_servers ?? "–",
            })}
          </p>
          {Object.keys(stats.data.servers).length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("tools.services.stats.server")}</th>
                  <th>{t("tools.services.stats.calls")}</th>
                  <th>{t("tools.services.stats.failures")}</th>
                  <th>{t("tools.services.stats.duration")}</th>
                  <th>{t("tools.services.stats.state")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.data.servers).map(([id, health]) => (
                  <tr key={id}>
                    <td>{names.get(id) ?? id}</td>
                    <td>{health.calls}</td>
                    <td>{health.failures}</td>
                    <td>{health.last_duration_ms === null ? "–" : `${health.last_duration_ms} ms`}</td>
                    <td>
                      {health.cooling_down_seconds > 0 ? (
                        <Badge tone="danger">{t("tools.services.stats.paused", { seconds: Math.ceil(health.cooling_down_seconds) })}</Badge>
                      ) : health.last_error_code ? (
                        <Badge tone="warning">
                          <ProblemText item={{ code: health.last_error_code, params: {} }} compact />
                        </Badge>
                      ) : (
                        <Badge tone="success">{t("tools.services.stats.ok")}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">{t("tools.services.stats.none")}</p>
          )}
        </div>
      ) : null}
    </Section>
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

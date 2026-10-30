// Who may call the API (keys with permissions) and from where (this computer, or the network).

import { useMutation, useQuery } from "@tanstack/react-query";
import { Ban, KeyRound, RefreshCw, ShieldAlert, Trash2, Wifi } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { ApiOverview, ApiScope, NetworkConfig, NewApiKey } from "../api/types";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, Field, Hint, IconButton, Modal, TextInput, Toggle } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { apiKeys } from "./ApiDialog";
import { CodeBlock } from "./common";

const SCOPES: ApiScope[] = ["run", "read", "approve"];

function ShownOnce({ created, onClose }: { created: NewApiKey | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("publish.keys.createdTitle")}
      open={Boolean(created)}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t("publish.keys.stored")}
        </Button>
      }
    >
      <Callout tone="warning">{t("publish.keys.onlyOnce")}</Callout>
      {created ? <CodeBlock text={created.token} testId="api-new-key" /> : null}
      <p className="muted small">{t("publish.keys.howToUse")}</p>
    </Modal>
  );
}

export function ApiAccess({ overview, onChanged }: { overview: ApiOverview; onChanged: () => void }) {
  const { t } = useTranslation();
  const publication = overview.publication;
  const keys = useQuery({ queryKey: apiKeys.keys, queryFn: api.apiKeys });
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["run", "read"]);
  const [created, setCreated] = useState<NewApiKey | null>(null);
  const network = overview.network;
  const [config, setConfig] = useState<NetworkConfig>({
    enabled: network.enabled,
    host: network.host,
    port: network.port,
    tls_certfile: network.tls_certfile,
    tls_keyfile: network.tls_keyfile,
  });
  const [networkOpen, setNetworkOpen] = useState(false);

  const create = useMutation({
    mutationFn: () => api.createApiKey({ name: name.trim(), scopes, publications: publication ? [publication.id] : [] }),
    onSuccess: (result) => {
      setCreated(result);
      setName("");
      void keys.refetch();
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => {
      void keys.refetch();
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const rotate = useMutation({
    mutationFn: (id: string) => api.rotateApiKey(id),
    onSuccess: (result) => {
      setCreated(result);
      void keys.refetch();
    },
    onError: (error) => toast.error(error),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteApiKey(id),
    onSuccess: () => void keys.refetch(),
    onError: (error) => toast.error(error),
  });
  const applyNetwork = useMutation({
    mutationFn: (next: NetworkConfig) => api.configureApiNetwork(next),
    onSuccess: (status) => {
      setNetworkOpen(false);
      if (status.error_code) toast.error(new Error(status.error ?? status.error_code));
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const share = useMutation({
    mutationFn: (value: boolean) => api.updatePublication(publication!.id, { network: value }),
    onSuccess: onChanged,
    onError: (error) => toast.error(error),
  });

  const mine = (keys.data ?? []).filter((key) => !publication || key.publications.includes(publication.id));

  return (
    <div className="stack">
      <section className="stack-sm">
        <h3 className="api-heading">
          <KeyRound size={15} aria-hidden /> {t("publish.keys.title")}
        </h3>
        <p className="muted small">{t("publish.keys.intro")}</p>
        {!publication ? <Callout tone="info">{t("publish.keys.publishFirst")}</Callout> : null}
        {publication ? (
          <div className="api-key-form">
            <Field label={t("publish.keys.name")} tip="publish.keyName">
              <TextInput value={name} maxLength={80} onChange={(event) => setName(event.target.value)} data-testid="api-key-name" />
            </Field>
            <Field label={t("publish.keys.scopes")} tip="publish.scopes">
              <div className="row-gap">
                {SCOPES.map((scope) => (
                  <label key={scope} className="checkbox">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      onChange={(event) =>
                        setScopes(event.target.checked ? [...scopes, scope] : scopes.filter((item) => item !== scope))
                      }
                    />{" "}
                    {t(`publish.scopes.${scope}`)}
                  </label>
                ))}
              </div>
            </Field>
            <Button
              icon={KeyRound}
              disabled={!name.trim() || !scopes.length}
              busy={create.isPending}
              onClick={() => create.mutate()}
              data-testid="api-key-create"
            >
              {t("publish.keys.create")}
            </Button>
          </div>
        ) : null}
        {mine.length ? (
          <table className="table small">
            <thead>
              <tr>
                <th>{t("publish.keys.name")}</th>
                <th>{t("publish.keys.prefix")}</th>
                <th>{t("publish.keys.scopes")}</th>
                <th>{t("publish.keys.lastUsed")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mine.map((key) => (
                <tr key={key.id} data-testid="api-key-row">
                  <td>
                    {key.name} {key.revoked_at ? <Badge tone="danger">{t("publish.keys.revoked")}</Badge> : null}
                  </td>
                  <td>
                    <code>{key.prefix}…</code>
                  </td>
                  <td>{key.scopes.map((scope) => t(`publish.scopes.${scope}`)).join(", ")}</td>
                  <td>{key.last_used_at ? formatDate(key.last_used_at) : t("publish.keys.never")}</td>
                  <td className="api-key-actions">
                    {key.revoked_at ? (
                      <ConfirmIconButton icon={Trash2} label={t("publish.keys.delete")} onConfirm={() => remove.mutate(key.id)} />
                    ) : (
                      <>
                        <IconButton icon={RefreshCw} label={t("publish.keys.rotate")} onClick={() => rotate.mutate(key.id)} />
                        <IconButton icon={Ban} label={t("publish.keys.revoke")} onClick={() => revoke.mutate(key.id)} />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : publication ? (
          <p className="muted small">{t("publish.keys.none")}</p>
        ) : null}
      </section>

      <section className="stack-sm">
        <h3 className="api-heading">
          <Wifi size={15} aria-hidden /> {t("publish.network.title")}
        </h3>
        <p className="muted small">{t("publish.network.intro")}</p>
        <div className="row-gap">
          <Badge tone={network.running ? "warning" : "success"}>
            {network.running ? t("publish.network.running", { port: network.port }) : t("publish.network.off")}
          </Badge>
          {network.tls ? <Badge tone="success">{t("publish.network.tls")}</Badge> : null}
          <Hint id="publish.network">
            <Button size="sm" variant="ghost" onClick={() => setNetworkOpen(true)} data-testid="api-network-settings">
              {t("publish.network.configure")}
            </Button>
          </Hint>
        </div>
        {network.error_code ? (
          <Callout tone="danger">
            <ProblemText item={{ code: network.error_code, message: network.error }} />
          </Callout>
        ) : null}
        {network.urls.map((url) => (
          <code key={url} className="small">
            {url}
          </code>
        ))}
        {publication ? (
          <Toggle
            checked={publication.network}
            onChange={(value) => share.mutate(value)}
            label={t("publish.network.share")}
            description={network.running ? t("publish.network.shareHint") : t("publish.network.shareInactive")}
            tip="publish.networkShare"
          />
        ) : null}
      </section>

      <ShownOnce created={created} onClose={() => setCreated(null)} />
      <Modal
        title={t("publish.network.title")}
        open={networkOpen}
        onClose={() => setNetworkOpen(false)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setNetworkOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" busy={applyNetwork.isPending} onClick={() => applyNetwork.mutate(config)} data-testid="api-network-apply">
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="stack">
          <Callout tone="warning">
            <ShieldAlert size={14} aria-hidden /> {t("publish.network.warning")}
          </Callout>
          <Toggle
            checked={config.enabled}
            onChange={(enabled) => setConfig({ ...config, enabled })}
            label={t("publish.network.enable")}
            description={t("publish.network.enableHint")}
          />
          <div className="grid-2">
            <Field label={t("publish.network.host")} hint={t("publish.network.hostHint")}>
              <TextInput value={config.host} onChange={(event) => setConfig({ ...config, host: event.target.value })} />
            </Field>
            <Field label={t("publish.network.port")}>
              <TextInput
                type="number"
                min={1024}
                max={65535}
                value={config.port}
                onChange={(event) => setConfig({ ...config, port: Number(event.target.value) })}
              />
            </Field>
            <Field label={t("publish.network.certificate")} hint={t("publish.network.tlsHint")}>
              <TextInput value={config.tls_certfile} onChange={(event) => setConfig({ ...config, tls_certfile: event.target.value })} />
            </Field>
            <Field label={t("publish.network.privateKey")}>
              <TextInput value={config.tls_keyfile} onChange={(event) => setConfig({ ...config, tls_keyfile: event.target.value })} />
            </Field>
          </div>
          {!config.tls_certfile ? <p className="muted small">{t("publish.network.plain")}</p> : null}
        </div>
      </Modal>
    </div>
  );
}

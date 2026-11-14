// "Set up search service" (NAL-A2): one card per search provider with an honest note on cost, key and limits, and a
// normal `search` connection created through the connections API. Nothing is preselected (owner decision E-3 is
// open): the person reads the notes and picks one. Providers the installation does not offer in its mode (DDGS on a
// server) are not shown; the runtime refuses them anyway (`connection.provider_unsupported_mode`).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type Connection,
  type ConnectionStatus,
  type ConnectionTypeInfo,
  connectionKeys,
  connectionsApi,
  needsSecret,
  offersProvider,
} from "../api/connections";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, Modal, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";

/** The providers with a note of their own, in the order the dialog shows them; others follow with a plain card. */
export const SEARCH_PROVIDERS = ["ddgs", "brave", "tavily", "mojeek", "searxng", "test"] as const;
/** Product names stay as they are in every language; the offline test provider has a translated name. */
const PROVIDER_NAMES: Record<string, string> = {
  ddgs: "DDGS",
  brave: "Brave Search",
  tavily: "Tavily",
  mojeek: "Mojeek",
  searxng: "SearXNG",
};
/** Providers that bill by plan: the connection must name the price of one request (else `search.price_unknown`). */
const PRICE_REQUIRED = new Set(["tavily", "mojeek"]);

/** The search providers this installation offers, in the dialog's order. */
export function offeredSearchProviders(type: ConnectionTypeInfo, mode: ConnectionStatus["mode"]): string[] {
  const known: readonly string[] = SEARCH_PROVIDERS;
  const order = [...known.filter((name) => type.providers.includes(name)), ...type.providers.filter((name) => !known.includes(name))];
  return order.filter((name) => offersProvider(type, name, mode));
}

export function SearchSetupDialog({
  type,
  status,
  onClose,
  onSaved,
}: {
  type: ConnectionTypeInfo;
  status: ConnectionStatus;
  onClose: () => void;
  onSaved: (connection: Connection) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const providers = offeredSearchProviders(type, status.mode);
  const [provider, setProvider] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [price, setPrice] = useState("");
  const label = (item: string) => (item === "test" ? t("tools.connections.search.testName") : (PROVIDER_NAMES[item] ?? item));
  const choose = (item: string) => {
    // The name follows the choice until the person types their own.
    if (!name.trim() || (provider && name === label(provider))) setName(label(item));
    setProvider(item);
  };
  const withKey = provider !== null && needsSecret(type, provider);
  const withEndpoint = provider === "searxng";
  const withPrice = provider !== null && PRICE_REQUIRED.has(provider);
  const save = useMutation({
    mutationFn: async () => {
      const settings: Record<string, unknown> = {};
      if (withEndpoint) settings.endpoint = endpoint.trim();
      if (withPrice) settings.price_per_request_usd = Number(price);
      const created = await connectionsApi.create({ type: type.name, name: name.trim(), provider: provider!, settings });
      if (!withKey || !key) return created;
      try {
        return await connectionsApi.setSecret(created.id, key);
      } catch (error) {
        // The connection exists; the key can be entered again in its details.
        toast.error(error);
        return created;
      }
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: connectionKeys.all });
      toast.success(t("tools.connections.search.done", { name: saved.name }));
      onSaved(saved);
    },
  });
  const priceValid = !withPrice || (price.trim() !== "" && Number.isFinite(Number(price)) && Number(price) >= 0);
  const ready = provider !== null && name.trim() !== "" && (!withKey || key !== "") && (!withEndpoint || endpoint.trim() !== "") && priceValid;
  return (
    <Modal
      title={t("tools.connections.search.title")}
      open
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button busy={save.isPending} disabled={!ready} onClick={() => save.mutate()}>
            {t("tools.connections.search.create")}
          </Button>
        </>
      }
    >
      <div className="stack" data-testid="search-setup">
        <p className="muted small">{t("tools.connections.search.intro")}</p>
        {providers.length ? (
          <fieldset className="search-providers stack-sm">
            <legend className="nd-field-label">{t("tools.connections.search.choose")}</legend>
            {providers.map((item) => (
              <label key={item} className="search-provider" data-testid={`search-provider-${item}`}>
                <input type="radio" name="search-provider" value={item} checked={provider === item} onChange={() => choose(item)} />
                <span className="search-provider__text">
                  <span>
                    <strong>{label(item)}</strong>{" "}
                    <Badge tone={needsSecret(type, item) ? "warning" : "idle"}>
                      {t(needsSecret(type, item) ? "tools.connections.search.needsKey" : "tools.connections.search.noKey")}
                    </Badge>
                  </span>
                  <small className="muted">{t(`tools.connections.search.note.${item}`, { defaultValue: "" })}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <Callout tone="info">{t("tools.connections.search.none")}</Callout>
        )}
        {provider ? (
          <>
            <Field label={t("tools.connections.name")}>
              <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
            </Field>
            {withEndpoint ? (
              <Field label={`${t("tools.connections.search.endpoint")} *`} hint={t("tools.connections.search.endpointHint")}>
                <TextInput type="url" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} maxLength={2000} />
              </Field>
            ) : null}
            {withPrice ? (
              <Field label={`${t("tools.connections.search.price")} *`} hint={t("tools.connections.search.priceHint")}>
                <TextInput type="number" min={0} max={100} step="any" value={price} onChange={(event) => setPrice(event.target.value)} />
              </Field>
            ) : null}
            {withKey ? (
              <Field
                label={`${t(`tools.connections.secretLabel.${type.secret_label}`, { defaultValue: type.secret_label })} *`}
                hint={t(status.secret_vault ? "tools.connections.secretVault" : "tools.connections.secretSession")}
              >
                <TextInput type="password" autoComplete="off" value={key} onChange={(event) => setKey(event.target.value)} maxLength={8192} />
              </Field>
            ) : null}
          </>
        ) : null}
        {save.error ? (
          <Callout tone="danger">
            <ErrorText error={save.error} />
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}

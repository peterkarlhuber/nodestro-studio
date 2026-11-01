// Amazon Bedrock in the settings: no API key, but an AWS region, how Nodestro signs in to AWS and an optional EU-only
// data residency. Desktop installations use the computer's AWS credentials (default chain or a named profile); on a
// server the operator assigns an AWS role to the workspace, which the workspace never sees. Nothing secret is ever
// entered or shown here. The status follows the explicit "Check connection" (no model is invoked, no costs).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud, Save, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { keys } from "../api/hooks";
import {
  AWS_REGION_PATTERN,
  type BedrockAuth,
  type ProviderInfo,
  type ProviderStatus,
  type ProviderVerificationState,
  type Settings,
} from "../api/types";
import { providerLabel } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Field, Section, Segmented, TextInput, Toggle } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatDate, type Tone } from "../lib/format";
import { providerOf } from "../lib/providers";
import { CHECK_KEY } from "./SettingsProviders";

/** AWS regions in EU member states: Orkexa's eu_only allowlist (London and Zurich are in Europe, not in the EU). */
export const EU_REGIONS = ["eu-central-1", "eu-north-1", "eu-south-1", "eu-south-2", "eu-west-1", "eu-west-3"] as const;

/** Suggestions for the region field (any valid region name can be typed). */
export const COMMON_REGIONS = [
  ...EU_REGIONS,
  "eu-west-2",
  "eu-central-2",
  "us-east-1",
  "us-east-2",
  "us-west-2",
  "ca-central-1",
  "sa-east-1",
  "ap-northeast-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-south-1",
];

/** The AWS profile names the runtime accepts (names only; the credentials stay in ~/.aws). */
const PROFILE_PATTERN = /^[A-Za-z0-9_.+=,@-]{1,64}$/;

const STATE_TONE: Record<ProviderVerificationState, Tone> = {
  not_configured: "idle",
  configured: "running",
  verified: "success",
  failed: "danger",
};

/** What the region field says is wrong with a typed region (null: fine or empty). */
export function regionProblem(
  region: string,
  { allowed, euOnly }: { allowed?: string[] | null; euOnly: boolean },
): { key: string; values?: Record<string, string> } | null {
  const value = region.trim();
  if (!value) return null;
  if (!AWS_REGION_PATTERN.test(value)) return { key: "bedrock.region.invalid" };
  if (allowed && !allowed.includes(value)) return { key: "bedrock.region.notAllowed", values: { regions: allowed.join(", ") } };
  if (euOnly && !(EU_REGIONS as readonly string[]).includes(value)) return { key: "bedrock.region.notEu", values: { regions: EU_REGIONS.join(", ") } };
  return null;
}

/** The profile this installation runs in, from the sign-in methods it allows. */
export function bedrockProfile(status: ProviderStatus): "server" | "desktop" {
  const methods = status.auth_methods ?? [];
  return methods.length > 0 && methods.every((method) => method === "operator_role") ? "server" : "desktop";
}

export function BedrockCard({ info, status, settings }: { info: ProviderInfo; status: ProviderStatus; settings: Settings }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const access = useAccess();
  const admin = access.can("admin");
  const listId = useId();
  const profile = bedrockProfile(status);
  const methods = (status.auth_methods ?? ["default_chain", "profile"]).filter((method) => method !== "operator_role");
  const available = profile === "desktop" || status.operator_role === true;
  const forced = status.data_residency_forced === true;
  const [region, setRegion] = useState(status.region ?? "");
  const [auth, setAuth] = useState<BedrockAuth>(status.auth ?? (profile === "server" ? "operator_role" : "default_chain"));
  const [profileName, setProfileName] = useState(status.profile_name ?? "");
  const [euOnly, setEuOnly] = useState(status.data_residency === "eu_only");
  useEffect(() => {
    setRegion(status.region ?? "");
    setAuth(status.auth ?? (profile === "server" ? "operator_role" : "default_chain"));
    setProfileName(status.profile_name ?? "");
    setEuOnly(status.data_residency === "eu_only");
  }, [status.region, status.auth, status.profile_name, status.data_residency, profile]);

  const store = (next: ProviderStatus | Settings) => {
    if ("providers" in next) queryClient.setQueryData(keys.settings, next);
    else
      queryClient.setQueryData<Settings>(keys.settings, (old) =>
        old ? { ...old, providers: old.providers.map((item) => (item.id === next.id ? next : item)) } : old,
      );
    void queryClient.invalidateQueries({ queryKey: CHECK_KEY });
  };
  const save = useMutation({
    mutationFn: () =>
      api.saveProvider(info.id, {
        region: region.trim(),
        ...(profile === "desktop" ? { auth, profile_name: auth === "profile" ? profileName.trim() : "" } : {}),
        ...(forced ? {} : { data_residency: euOnly ? "eu_only" : "" }),
      }),
    onSuccess: (data) => {
      store(data);
      toast.success(t("settings.saved"));
    },
    onError: toast.error,
  });
  const verify = useMutation({
    mutationFn: () => api.verifyProvider(info.id),
    onSuccess: (data) => {
      store(data);
      if (data.verification?.state === "verified") toast.success(t("bedrock.verify.done"));
    },
  });

  const name = providerLabel(t, info.id);
  const used = [settings.default_model, settings.assistant_model].some((model) => providerOf(model) === info.id);
  const state: ProviderVerificationState = status.verification?.state ?? (status.configured ? "configured" : "not_configured");
  const effectiveEu = forced || euOnly;
  const problem = regionProblem(region, { allowed: status.allowed_regions, euOnly: effectiveEu });
  const profileInvalid = profile === "desktop" && auth === "profile" && !PROFILE_PATTERN.test(profileName.trim());
  const suggestions = (status.allowed_regions ?? COMMON_REGIONS).filter(
    (item) => !effectiveEu || (EU_REGIONS as readonly string[]).includes(item),
  );
  const changed =
    region.trim() !== (status.region ?? "") ||
    (profile === "desktop" && (auth !== (status.auth ?? "default_chain") || (auth === "profile" && profileName.trim() !== (status.profile_name ?? "")))) ||
    (!forced && euOnly !== (status.data_residency === "eu_only"));
  const editable = admin && available;
  const canSave = editable && changed && region.trim() !== "" && !problem && !profileInvalid;
  const code = status.verification?.code;

  return (
    <Section
      title={name}
      icon={Cloud}
      defaultOpen={status.configured || used}
      summary={
        <Badge tone={STATE_TONE[state] === "idle" && used ? "warning" : STATE_TONE[state]}>{t(`bedrock.state.${state}`)}</Badge>
      }
    >
      <div className="stack" data-provider={info.id} data-testid="bedrock-settings">
        <p className="muted small">{t("bedrock.intro")}</p>
        <Callout tone="info">{t("bedrock.notApiKey")}</Callout>

        <div className="stack-sm" data-testid="bedrock-status" data-state={state}>
          <p className="small">
            <Badge tone={STATE_TONE[state]}>{t(`bedrock.state.${state}`)}</Badge>{" "}
            {available || state !== "not_configured" ? t(`bedrock.stateText.${state}`) : null}
            {status.verification?.checked_at ? (
              <span className="muted"> {t("bedrock.verify.checkedAt", { time: formatDate(status.verification.checked_at) })}</span>
            ) : null}
          </p>
          {/* "Not set up" and "no role on this server" are said by the form itself. */}
          {code && (state === "failed" || state === "not_configured") && code !== "provider.not_configured" && code !== "provider.bedrock_not_available" ? (
            <Callout tone={state === "failed" ? "danger" : "warning"}>
              <span data-testid="bedrock-status-code" data-code={code}>
                <ProblemText item={{ code, params: { provider: info.id, region: status.region ?? "" } }} />
              </span>
            </Callout>
          ) : null}
        </div>

        <Field label={t("bedrock.auth.label")}>
          {profile === "server" ? (
            status.operator_role ? (
              <p className="small" data-testid="bedrock-operator-role">
                <ShieldCheck size={13} aria-hidden /> <strong>{t("bedrock.auth.operator_role")}</strong> {t("bedrock.auth.operatorHint")}
              </p>
            ) : (
              <Callout tone="warning">
                <span data-testid="bedrock-not-available">{t("bedrock.auth.notAvailable")}</span>
              </Callout>
            )
          ) : (
            <div className="stack-sm">
              <Segmented<BedrockAuth>
                label={t("bedrock.auth.label")}
                value={auth}
                disabled={!editable || methods.length < 2}
                onChange={setAuth}
                options={methods.map((method) => ({ value: method, label: t(`bedrock.auth.${method}`) }))}
              />
              <p className="field__hint">{t(`bedrock.auth.${auth}Hint`)}</p>
            </div>
          )}
        </Field>

        {profile === "desktop" && auth === "profile" ? (
          <Field
            label={t("bedrock.profile.label")}
            hint={profileInvalid && profileName.trim() ? t("bedrock.profile.invalid") : t("bedrock.profile.hint")}
          >
            <TextInput
              value={profileName}
              disabled={!editable}
              autoComplete="off"
              spellCheck={false}
              placeholder="my-profile"
              aria-invalid={profileInvalid && profileName.trim() !== ""}
              onChange={(event) => setProfileName(event.target.value)}
            />
          </Field>
        ) : null}

        {available ? (
          <>
            <Field
              label={t("bedrock.region.label")}
              hint={problem ? t(problem.key, problem.values) : t("bedrock.region.hint")}
            >
              <TextInput
                value={region}
                list={listId}
                disabled={!editable}
                autoComplete="off"
                spellCheck={false}
                placeholder="eu-central-1"
                aria-invalid={problem !== null}
                aria-label={t("bedrock.region.for", { provider: name })}
                onChange={(event) => setRegion(event.target.value.trim().toLowerCase())}
              />
            </Field>
            <datalist id={listId}>
              {suggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <Toggle
              label={t("bedrock.residency.label")}
              description={forced ? t("bedrock.residency.forced") : t("bedrock.residency.hint")}
              checked={effectiveEu}
              disabled={!editable || forced}
              onChange={setEuOnly}
            />
            <p className="field__hint">{t("bedrock.residency.limits")}</p>
          </>
        ) : null}

        <div className="row-gap">
          {available ? (
            <Button variant="primary" icon={Save} disabled={!canSave} busy={save.isPending} onClick={() => save.mutate()}>
              {t("bedrock.save")}
            </Button>
          ) : null}
          <Button
            icon={ShieldCheck}
            busy={verify.isPending}
            disabled={!status.configured || !access.can("install")}
            onClick={() => verify.mutate()}
            data-testid="bedrock-verify"
          >
            {t("bedrock.verify.button")}
          </Button>
        </div>
        <p className="muted small">{t("bedrock.verify.hint")}</p>
        {verify.error ? (
          <Callout tone="danger">
            <ErrorText error={verify.error} />
          </Callout>
        ) : null}
      </div>
    </Section>
  );
}

import { Container } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SandboxBackendStatus, SandboxMode, Settings } from "../api/types";
import { Badge, Callout, DocLink, HelpTip, Segmented } from "../components/ui";
import type { Tone } from "../lib/format";

const STATE_TONE: Record<SandboxBackendStatus["state"], Tone> = {
  approved: "success",
  experimental: "warning",
  unavailable: "idle",
  "not-isolating": "idle",
  "not-applicable": "idle",
};

/** A backend's name in the interface language. */
function useBackendName() {
  const { t } = useTranslation();
  return (name: string) => t(`settings.sandbox.backend.${name}`, { defaultValue: name });
}

/** Why a backend is not approved: a sentence for known reasons, the built-in sandbox's reasons as before. */
function BackendReason({ backend, system }: { backend: SandboxBackendStatus; system: string }) {
  const { t } = useTranslation();
  if (!backend.reason || backend.state === "approved") return null;
  const builtin = backend.name === "linux-builtin";
  const key = builtin ? `settings.sandbox.reason.${backend.reason}` : `settings.sandbox.backendReason.${backend.reason}`;
  return (
    <span className="muted small">
      {t(key, { defaultValue: t("settings.sandbox.backendReason.unknown"), system })}
    </span>
  );
}

/**
 * Settings → Sandbox: the mode, where code runs now on the runtime's computer (not the browser's), every
 * backend with its state, and why AI-created code is blocked. Older runtimes without ``sandbox_selection`` show
 * the earlier view (Docker and built-in sandbox badges).
 */
export function SandboxPanel({
  settings,
  admin,
  onMode,
}: {
  settings: Settings;
  admin: boolean;
  onMode: (sandbox: SandboxMode) => void;
}) {
  const { t } = useTranslation();
  const backendName = useBackendName();
  const selection = settings.sandbox_selection ?? null;
  const backends = settings.sandbox_backends ?? [];
  const desktop = !selection || selection.profile === "desktop";
  const builtin = settings.builtin_sandbox;
  const modes: { value: SandboxMode; label: string }[] = [
    ...(selection ? [{ value: "auto" as const, label: t("settings.sandbox.auto") }] : []),
    { value: "subprocess", label: t("settings.sandbox.subprocess") },
    { value: "docker", label: "Docker" },
  ];
  return (
    <section className="panel stack" aria-labelledby="settings-sandbox">
      <h2 className="panel__title" id="settings-sandbox">
        <Container size={15} aria-hidden /> {t("settings.sandbox.title")}{" "}
        <HelpTip id="settings.sandbox" label={t("settings.sandbox.label")} />
        <DocLink to="einstellungen#sandbox" />
      </h2>
      <p className="muted small">{t("settings.sandbox.text")}</p>
      {desktop ? (
        <div className="row-gap">
          <Segmented
            label={t("settings.sandbox.label")}
            value={settings.sandbox}
            disabled={!admin}
            onChange={onMode}
            options={modes}
          />
          <Badge tone={settings.docker_available ? "success" : "idle"}>
            {settings.docker_available ? t("settings.sandbox.dockerAvailable") : t("settings.sandbox.dockerMissing")}
          </Badge>
        </div>
      ) : (
        <p className="muted small" data-testid="sandbox-containers-only">
          {t("settings.sandbox.containersOnly")}
        </p>
      )}
      {selection && desktop ? <p className="muted small">{t(`settings.sandbox.modeHint.${selection.mode}`)}</p> : null}

      {selection ? (
        <dl className="sandbox-summary" data-testid="sandbox-selection">
          <dt>{t("settings.sandbox.runtime")}</dt>
          <dd data-testid="sandbox-runtime">
            {t(`settings.sandbox.os.${selection.os}`, { defaultValue: selection.os })} ({selection.arch}){" "}
            <span className="muted small">{t("settings.sandbox.runtimeHint")}</span>
          </dd>
          <dt>{t("settings.sandbox.untrustedRunsIn")}</dt>
          <dd data-testid="sandbox-untrusted">
            {selection.blocked ? (
              <Badge tone="danger">{t("settings.sandbox.blockedBadge")}</Badge>
            ) : (
              <Badge tone="success">{backendName(selection.untrusted)}</Badge>
            )}
          </dd>
          <dt>{t("settings.sandbox.userRunsIn")}</dt>
          <dd data-testid="sandbox-user-authored">
            {selection.user_authored ? (
              <Badge tone="idle">{backendName(selection.user_authored)}</Badge>
            ) : (
              <Badge tone="danger">{t("settings.sandbox.blockedBadge")}</Badge>
            )}
          </dd>
        </dl>
      ) : (
        builtin && (
          <div className="row-gap">
            <span data-testid="builtin-sandbox">
              <Badge tone={builtin.available ? "success" : "idle"}>
                {builtin.available ? t("settings.sandbox.builtinActive") : t("settings.sandbox.builtinMissing")}
              </Badge>
            </span>
          </div>
        )
      )}

      {selection?.blocked ? (
        <Callout tone="warning">
          <span data-testid="sandbox-blocked">
            {selection.reason === "docker-unreachable"
              ? t("settings.sandbox.dockerUnreachable")
              : t(`settings.sandbox.blocked.${selection.mode === "subprocess" ? "subprocess" : "auto"}`)}
          </span>{" "}
          <DocLink to="einstellungen#sandbox-docker" label={t("settings.sandbox.installDocker")} />
        </Callout>
      ) : null}
      {!selection && settings.sandbox === "docker" && !settings.docker_available ? (
        <Callout tone="warning">{t("settings.sandbox.dockerUnreachable")}</Callout>
      ) : null}

      {!selection && builtin && !builtin.available && builtin.reason !== "server" ? (
        <p className="muted small" data-testid="builtin-sandbox-reason">
          {t(`settings.sandbox.reason.${builtin.reason}`, {
            defaultValue: t("settings.sandbox.reason.failed"),
            system: builtin.system,
          })}{" "}
          {builtin.detail ? <code>{builtin.detail}</code> : null}
        </p>
      ) : null}

      {backends.length > 0 ? (
        <table className="table table--compact" data-testid="sandbox-backends">
          <caption className="muted small">{t("settings.sandbox.backendsTitle")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("settings.sandbox.column.backend")}</th>
              <th scope="col">{t("settings.sandbox.column.state")}</th>
              <th scope="col">{t("settings.sandbox.column.why")}</th>
            </tr>
          </thead>
          <tbody>
            {backends.map((backend) => (
              <tr key={backend.name} data-testid={`sandbox-backend-${backend.name}`}>
                <td>{backendName(backend.name)}</td>
                <td>
                  <Badge tone={STATE_TONE[backend.state] ?? "idle"}>{t(`settings.sandbox.state.${backend.state}`)}</Badge>
                </td>
                <td>
                  <BackendReason backend={backend} system={builtin?.system ?? ""} />
                  {backend.detail && backend.state !== "approved" ? (
                    <>
                      {" "}
                      <code className="small">{backend.detail}</code>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

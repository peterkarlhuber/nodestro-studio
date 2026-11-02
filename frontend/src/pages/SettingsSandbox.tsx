import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Container, FlaskConical, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { SandboxBackendStatus, SandboxCheck, SandboxMode, Settings } from "../api/types";
import { dockerReasonKey } from "../api/types";
import { Badge, Button, Callout, DocLink, HelpTip, Segmented } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate, type Tone } from "../lib/format";

const STATE_TONE: Record<SandboxBackendStatus["state"], Tone> = {
  approved: "success",
  experimental: "warning",
  unavailable: "idle",
  "not-isolating": "idle",
  "not-applicable": "idle",
  checking: "running",
};

/** The Docker status of ``GET /api/sandbox/status``; kept only while the settings page shows it. */
export const DOCKER_STATUS_KEY = ["sandbox", "status"] as const;
/** Seconds the server may wait for a running check per poll (at most 5). */
const POLL_WAIT = 2;
/** The reason behind a failed check when the backend reports none of its own. */
const CHECK_REASON: Record<string, string> = {
  cli: "docker-missing",
  daemon: "docker-unreachable",
  image: "docker-image",
  "self-test": "docker-selftest",
};

/** Whether the runtime reports the Docker checks (2026-11-02 and later); older runtimes keep the earlier view. */
function reportsChecks(backend: SandboxBackendStatus | undefined): backend is SandboxBackendStatus & { checks: SandboxCheck[] } {
  return !!backend && backend.name === "docker" && Array.isArray(backend.checks);
}

/** Whether the page is visible; polling stops while it is hidden. */
function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/**
 * The Docker row, kept current: the settings' row until the user asks for a check, then the answers of
 * ``/api/sandbox/status``, polled (with a bounded server-side wait) while the state is ``checking`` and the page is
 * visible. When a check settles, the settings are read again (where AI-created code runs may have changed).
 */
function useDockerStatus(row: SandboxBackendStatus | undefined, pollInterval: number) {
  const queryClient = useQueryClient();
  const visible = usePageVisible();
  const live = reportsChecks(row);
  const cached = queryClient.getQueryData<SandboxBackendStatus>(DOCKER_STATUS_KEY);
  const current = cached ?? row;
  const query = useQuery({
    queryKey: DOCKER_STATUS_KEY,
    queryFn: () => api.sandboxStatus({ wait: POLL_WAIT }),
    enabled: live && visible && current?.state === "checking",
    refetchInterval: (state) => (state.state.data?.state === "checking" ? pollInterval : false),
    refetchIntervalInBackground: false,
    gcTime: 0,
    retry: false,
  });
  const docker = query.data ?? row;
  const settled = docker?.state !== "checking";
  const fetched = query.data !== undefined;
  useEffect(() => {
    if (fetched && settled) void queryClient.invalidateQueries({ queryKey: keys.settings });
  }, [fetched, settled, docker?.reason, queryClient]);
  const take = (status: SandboxBackendStatus) => queryClient.setQueryData(DOCKER_STATUS_KEY, status);
  const recheck = useMutation({ mutationFn: () => api.sandboxStatus({ refresh: true }), onSuccess: take });
  const selfTest = useMutation({ mutationFn: () => api.sandboxSelfTest(), onSuccess: take });
  return { docker, live, recheck, selfTest, error: query.error };
}

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
  const key = builtin
    ? `settings.sandbox.reason.${backend.reason}`
    : (dockerReasonKey(backend.reason) ?? `settings.sandbox.backendReason.${backend.reason}`);
  return (
    <span className="muted small">
      {t(key, { defaultValue: t("settings.sandbox.backendReason.unknown"), system })}
    </span>
  );
}

/** One check of the Docker sandbox: passed or failed, and for a failed one why in the interface language. */
function DockerCheckRow({ check, reason }: { check: SandboxCheck; reason: string }) {
  const { t } = useTranslation();
  const why = check.ok ? null : (dockerReasonKey(reason) ?? dockerReasonKey(CHECK_REASON[check.name] ?? ""));
  return (
    <li data-testid={`sandbox-check-${check.name}`} data-ok={check.ok}>
      <Badge tone={check.ok ? "success" : "danger"} icon={check.ok ? CheckCircle2 : XCircle}>
        {check.ok ? t("settings.sandbox.docker.passed") : t("settings.sandbox.docker.failed")}
      </Badge>{" "}
      {t(`settings.sandbox.docker.check.${check.name}`, { defaultValue: check.name })}
      {why ? (
        <>
          {" "}
          <span className="muted small" data-testid={`sandbox-check-${check.name}-reason`}>
            {t(why)}
          </span>
        </>
      ) : null}
      {check.detail && !check.ok ? (
        <>
          {" "}
          <code className="small">{check.detail}</code>
        </>
      ) : null}
    </li>
  );
}

/** The Docker sandbox's engine, checks and actions (runtimes that report the checks). */
function DockerDetails({
  docker,
  admin,
  recheck,
  selfTest,
  error,
}: {
  docker: SandboxBackendStatus & { checks: SandboxCheck[] };
  admin: boolean;
  recheck: { mutate: () => void; isPending: boolean; error: unknown };
  selfTest: { mutate: () => void; isPending: boolean; error: unknown };
  error: unknown;
}) {
  const { t } = useTranslation();
  const checking = docker.state === "checking";
  const rootful = docker.notes.some((note) => /docker group/i.test(note));
  const reasonKey = dockerReasonKey(docker.reason);
  const problem = recheck.error ?? selfTest.error ?? error;
  return (
    <div className="stack" data-testid="sandbox-docker" data-state={docker.state}>
      <div className="row-gap">
        {checking ? (
          <Badge tone="running">
            <span data-testid="sandbox-docker-checking">{t("settings.sandbox.docker.checking")}</span>
          </Badge>
        ) : docker.state === "approved" ? (
          <Badge tone="success">
            <span data-testid="sandbox-docker-ready">{t("settings.sandbox.docker.ready")}</span>
          </Badge>
        ) : null}
        {docker.engine ? (
          <span className="small" data-testid="sandbox-docker-engine">
            {t("settings.sandbox.docker.engine")}: <code>{docker.engine}</code>
          </span>
        ) : null}
        {docker.rootless === true || docker.rootless === false ? (
          <span data-testid="sandbox-docker-rootless">
            <Badge tone={docker.rootless ? "success" : "warning"}>
              {docker.rootless ? t("settings.sandbox.docker.rootless") : t("settings.sandbox.docker.rootful")}
            </Badge>
          </span>
        ) : null}
        {docker.cgroup_version ? (
          <span data-testid="sandbox-docker-cgroup">
            <Badge tone={docker.cgroup_version === "2" ? "success" : "warning"}>
              {t("settings.sandbox.docker.cgroup", { version: docker.cgroup_version })}
            </Badge>
          </span>
        ) : null}
      </div>
      {!checking && docker.state !== "approved" && reasonKey ? (
        <p className="small" data-testid="sandbox-docker-reason">
          {t(reasonKey)}
        </p>
      ) : null}
      {docker.checks.length > 0 ? (
        <>
          <span className="muted small">{t("settings.sandbox.docker.checksTitle")}</span>
          <ul className="plain-list stack" data-testid="sandbox-docker-checks">
            {docker.checks.map((check) => (
              <DockerCheckRow key={check.name} check={check} reason={docker.reason} />
            ))}
          </ul>
        </>
      ) : null}
      {rootful ? (
        <Callout tone="warning">
          <span data-testid="sandbox-docker-rootful">{t("settings.sandbox.docker.rootfulNote")}</span>
        </Callout>
      ) : null}
      {docker.tested_at ? (
        <p className="muted small" data-testid="sandbox-docker-tested">
          {t("settings.sandbox.docker.testedAt", { date: formatDate(docker.tested_at) })}
        </p>
      ) : null}
      <div className="row-gap">
        <Button icon={RefreshCw} size="sm" busy={recheck.isPending} disabled={checking} onClick={() => recheck.mutate()}>
          {t("settings.sandbox.docker.recheck")}
        </Button>
        {admin ? (
          <>
            <Button icon={FlaskConical} size="sm" busy={selfTest.isPending} disabled={checking} onClick={() => selfTest.mutate()}>
              {docker.reason === "docker-image" ? t("settings.sandbox.docker.prepare") : t("settings.sandbox.docker.selfTest")}
            </Button>
            <span className="muted small">{t("settings.sandbox.docker.selfTestHint")}</span>
          </>
        ) : null}
      </div>
      {problem ? <ErrorText error={problem} compact /> : null}
    </div>
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
  pollInterval = 2000,
}: {
  settings: Settings;
  admin: boolean;
  onMode: (sandbox: SandboxMode) => void;
  /** Milliseconds between two status reads while Docker is being checked. */
  pollInterval?: number;
}) {
  const { t } = useTranslation();
  const backendName = useBackendName();
  const selection = settings.sandbox_selection ?? null;
  const reported = settings.sandbox_backends ?? [];
  const { docker, live, recheck, selfTest, error } = useDockerStatus(
    reported.find((backend) => backend.name === "docker"),
    pollInterval,
  );
  const backends = reported.map((backend) => (backend.name === "docker" && docker ? docker : backend));
  const dockerReason = live && docker && docker.state !== "approved" ? docker.reason : "";
  const dockerReasonText = dockerReasonKey(dockerReason);
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
            {selection.mode === "subprocess"
              ? t("settings.sandbox.blocked.subprocess")
              : dockerReason === "docker-checking"
                ? t("settings.sandbox.blocked.checking")
                : dockerReasonText && dockerReason !== "docker-missing" && dockerReason !== "docker-unreachable"
                  ? t("settings.sandbox.blocked.dockerRefused")
                  : selection.reason === "docker-unreachable"
                    ? t("settings.sandbox.dockerUnreachable")
                    : t("settings.sandbox.blocked.auto")}
          </span>{" "}
          {selection.mode !== "subprocess" && dockerReasonText ? (
            <>
              <span data-testid="sandbox-blocked-reason">{t(dockerReasonText)}</span>{" "}
            </>
          ) : null}
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

      {live && reportsChecks(docker) ? (
        <DockerDetails docker={docker} admin={admin} recheck={recheck} selfTest={selfTest} error={error} />
      ) : null}
    </section>
  );
}

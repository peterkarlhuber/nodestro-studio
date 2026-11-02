import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Container, FlaskConical, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { SandboxBackendStatus, SandboxCheck, SandboxMode, SandboxSelection, SandboxStatus, Settings } from "../api/types";
import { dockerReasonKey, isDockerReason } from "../api/types";
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

/** What a forced check (Check again, Run self-test) answered when it did not start a new check (API DS-6). */
export interface CheckOutcome {
  /** ``throttled``: a check ran less than 10 s ago; ``ignored``: only administrators start checks. */
  kind: "throttled" | "ignored";
  /** Whole seconds until the next check may start (``throttled``). */
  seconds: number;
}

/** The outcome of a forced check's answer; null when it started one, or the API predates these fields. */
export function checkOutcome(answer: SandboxStatus): CheckOutcome | null {
  if (answer.refresh_ignored) return { kind: "ignored", seconds: 0 };
  if (answer.throttled) return { kind: "throttled", seconds: Math.max(1, Math.ceil(answer.retry_after ?? 10)) };
  return null;
}

/**
 * The Docker row, kept current: the settings' row until the user asks for a check, then the answers of
 * ``/api/sandbox/status``, polled (with a bounded server-side wait) while the state is ``checking`` and the page is
 * visible. When a check settles, the settings are read again (where AI-created code runs may have changed).
 *
 * One status wins at any time, and the table, the Docker details and the blocked notice all read it (DS-13): an
 * answer of the status routes until the settings bring a newer Docker row, then that row.
 */
function useDockerStatus(row: SandboxBackendStatus | undefined, pollInterval: number) {
  const queryClient = useQueryClient();
  const visible = usePageVisible();
  const live = reportsChecks(row);
  // When the settings' row last changed: an answer older than that is stale.
  const [seen, setSeen] = useState(() => ({ row, at: 0 }));
  if (seen.row !== row) setSeen({ row, at: Date.now() });
  const pick = (data: SandboxStatus | undefined, updatedAt: number): SandboxStatus | SandboxBackendStatus | undefined =>
    data !== undefined && updatedAt >= seen.at ? data : row;
  const cached = queryClient.getQueryState<SandboxStatus>(DOCKER_STATUS_KEY);
  const current = pick(cached?.data, cached?.dataUpdatedAt ?? 0);
  const query = useQuery({
    queryKey: DOCKER_STATUS_KEY,
    queryFn: () => api.sandboxStatus({ wait: POLL_WAIT }),
    enabled: live && visible && current?.state === "checking",
    refetchInterval: (state) => (state.state.data?.state === "checking" ? pollInterval : false),
    refetchIntervalInBackground: false,
    gcTime: 0,
    retry: false,
  });
  const docker: (SandboxStatus | SandboxBackendStatus) | undefined = pick(query.data, query.dataUpdatedAt);
  const settled = docker?.state !== "checking";
  const fetched = query.data !== undefined;
  useEffect(() => {
    if (fetched && settled) void queryClient.invalidateQueries({ queryKey: keys.settings });
  }, [fetched, settled, docker?.reason, queryClient]);
  // A forced check that did not run: not a new result. Shown until the window has passed (throttled) or the next
  // request (ignored); the button of a throttled path waits as long.
  const [outcome, setOutcome] = useState<{ action: "recheck" | "selfTest"; result: CheckOutcome } | null>(null);
  useEffect(() => {
    if (outcome?.result.kind !== "throttled") return;
    const timer = setTimeout(() => setOutcome(null), outcome.result.seconds * 1000);
    return () => clearTimeout(timer);
  }, [outcome]);
  const take = (action: "recheck" | "selfTest") => (answer: SandboxStatus) => {
    // The answer is the current status either way (a running or the last check), so the view follows it.
    queryClient.setQueryData(DOCKER_STATUS_KEY, answer);
    const result = checkOutcome(answer);
    setOutcome(result ? { action, result } : null);
  };
  const recheck = useMutation({
    mutationFn: () => {
      setOutcome(null);
      return api.sandboxStatus({ refresh: true });
    },
    onSuccess: take("recheck"),
  });
  const selfTest = useMutation({
    mutationFn: () => {
      setOutcome(null);
      return api.sandboxSelfTest();
    },
    onSuccess: take("selfTest"),
  });
  return { docker, live, recheck, selfTest, outcome, error: query.error };
}

/**
 * Where AI-created code runs, from the same Docker status the table shows (DS-13), so the summary, the notice and
 * the table never disagree while the settings are read again. Docker decides in Docker mode, on a server, and in
 * automatic mode unless an older runtime chose the built-in Linux sandbox there; elsewhere the selection stays.
 */
export function effectiveSelection(
  selection: SandboxSelection | null,
  docker: SandboxBackendStatus | undefined,
  live: boolean,
): SandboxSelection | null {
  if (!selection || !docker || !live) return selection;
  const containers = selection.mode === "docker" || selection.profile !== "desktop";
  const dockerDecides = containers || (selection.mode === "auto" && selection.untrusted !== "linux-builtin");
  if (!dockerDecides) return selection;
  const approved = docker.state === "approved";
  return {
    ...selection,
    blocked: !approved,
    untrusted: approved ? "docker" : "",
    user_authored: containers ? (approved ? "docker" : "") : selection.user_authored,
    reason: approved ? "" : docker.reason || selection.reason,
  };
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
  outcome,
  error,
}: {
  docker: SandboxStatus & { checks: SandboxCheck[] };
  admin: boolean;
  recheck: { mutate: () => void; isPending: boolean; error: unknown };
  selfTest: { mutate: () => void; isPending: boolean; error: unknown };
  outcome: { action: "recheck" | "selfTest"; result: CheckOutcome } | null;
  error: unknown;
}) {
  const { t } = useTranslation();
  const checking = docker.state === "checking";
  // The docker-group note of a rootful daemon, from the structured field (not the English note text).
  const rootful = docker.rootless === false;
  const waiting = (action: "recheck" | "selfTest") => outcome?.action === action && outcome.result.kind === "throttled";
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
      {docker.redacted ? (
        <p className="muted small" data-testid="sandbox-docker-redacted">
          {t("settings.sandbox.docker.redacted")}
        </p>
      ) : null}
      {outcome ? (
        <Callout tone="info">
          <span data-testid="sandbox-docker-not-run" data-kind={outcome.result.kind}>
            {outcome.result.kind === "throttled"
              ? t("settings.sandbox.docker.throttled", { seconds: outcome.result.seconds })
              : t("settings.sandbox.docker.refreshIgnored")}
          </span>
        </Callout>
      ) : null}
      <div className="row-gap">
        <Button
          icon={RefreshCw}
          size="sm"
          busy={recheck.isPending}
          disabled={checking || waiting("recheck")}
          onClick={() => recheck.mutate()}
        >
          {t("settings.sandbox.docker.recheck")}
        </Button>
        {admin ? (
          <>
            <Button
              icon={FlaskConical}
              size="sm"
              busy={selfTest.isPending}
              disabled={checking || waiting("selfTest")}
              onClick={() => selfTest.mutate()}
            >
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

/** Whether Docker's reason explains a block: not in the subprocess and linux modes, which never use Docker. */
function dockerDecides(selection: SandboxSelection): boolean {
  return selection.profile !== "desktop" || (selection.mode !== "subprocess" && selection.mode !== "linux");
}

/** The first sentence of the blocked notice: the mode's own, or why Docker does not run AI-created code. */
function blockedLead(t: (key: string) => string, selection: SandboxSelection, dockerReason: string): string {
  if (!dockerDecides(selection)) return t(`settings.sandbox.blocked.${selection.mode}`);
  if (dockerReason === "docker-checking") return t("settings.sandbox.blocked.checking");
  if (dockerReason && dockerReason !== "docker-missing" && dockerReason !== "docker-unreachable")
    return t("settings.sandbox.blocked.dockerRefused");
  // Docker mode needs Docker for every tool; automatic mode only for AI-created ones.
  if (selection.mode === "docker" && (dockerReason || selection.reason === "docker-unreachable"))
    return t("settings.sandbox.dockerUnreachable");
  return t("settings.sandbox.blocked.auto");
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
  const reportedSelection = settings.sandbox_selection ?? null;
  const reported = settings.sandbox_backends ?? [];
  const { docker, live, recheck, selfTest, outcome, error } = useDockerStatus(
    reported.find((backend) => backend.name === "docker"),
    pollInterval,
  );
  // One Docker status for the table, the summary and the notice (DS-13).
  const backends = reported.map((backend) => (backend.name === "docker" && docker ? docker : backend));
  const selection = effectiveSelection(reportedSelection, docker, live);
  const dockerReason = selection?.blocked && isDockerReason(selection.reason) ? selection.reason : "";
  const dockerReasonText = dockerReasonKey(dockerReason);
  const desktop = !selection || selection.profile === "desktop";
  const builtin = settings.builtin_sandbox;
  // The built-in Linux sandbox is an explicit choice on a Linux computer (runtimes since DS-3).
  const offerLinux = !!selection && (selection.os === "linux" || settings.sandbox === "linux");
  const modes: { value: SandboxMode; label: string }[] = [
    ...(selection ? [{ value: "auto" as const, label: t("settings.sandbox.auto") }] : []),
    ...(offerLinux ? [{ value: "linux" as const, label: t("settings.sandbox.linux") }] : []),
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
      {selection && desktop ? (
        <div className="stack" data-testid="sandbox-modes">
          <span className="muted small">{t("settings.sandbox.modesTitle")}</span>
          <ul className="plain-list stack">
            {modes.map((mode) => (
              <li
                key={mode.value}
                className={mode.value === selection.mode ? "small" : "muted small"}
                data-testid={`sandbox-mode-hint-${mode.value}`}
                aria-current={mode.value === selection.mode ? "true" : undefined}
              >
                {t(`settings.sandbox.modeHint.${mode.value}`)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
          <span data-testid="sandbox-blocked">{blockedLead(t, selection, dockerReason)}</span>{" "}
          {dockerDecides(selection) && dockerReasonText ? (
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
        <DockerDetails docker={docker} admin={admin} recheck={recheck} selfTest={selfTest} outcome={outcome} error={error} />
      ) : null}
    </section>
  );
}

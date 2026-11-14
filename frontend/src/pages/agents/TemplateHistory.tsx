// Where an agent template comes from and its saved versions (NAL-B1). Every changed save is a version; a version can be
// compared with the form's state and taken back into the form ("Restore"), which becomes a new version when saved.

import { BookOpen, FileInput, History, RotateCcw, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useTemplateVersions } from "../../api/hooks";
import type { AgentConfig, AgentTemplate, AgentTemplateVersion } from "../../api/types";
import { Badge, Button, Callout, Modal, Section, Spinner } from "../../components/ui";
import { ErrorText } from "../../lib/errors";
import { formatDate } from "../../lib/format";

/** The fields a comparison shows, in this order. */
const COMPARED = ["name", "description", "model", "system_prompt", "task_template", "tools", "output", "quality"] as const;
type Compared = (typeof COMPARED)[number];

/** ``builtin:nodestro-examples@0.3.0+r1/summary`` -> ``{kind: "builtin", version: "0.3.0+r1"}``. */
export function originOf(origin: string | undefined): { kind: "user" | "builtin" | "import"; version?: string } {
  if (origin?.startsWith("builtin:")) return { kind: "builtin", version: origin.split("@")[1]?.split("/")[0] };
  if (origin?.startsWith("import:")) return { kind: "import" };
  return { kind: "user" };
}

export function OriginBadge({ template }: { template: AgentTemplate }) {
  const { t } = useTranslation();
  const origin = originOf(template.meta?.origin);
  const icon = origin.kind === "builtin" ? BookOpen : origin.kind === "import" ? FileInput : User;
  return (
    <span data-testid="template-origin">
      <Badge tone={origin.kind === "user" ? "idle" : "running"} icon={icon}>
        {t(`agentHistory.origin.${origin.kind}`, { version: origin.version ?? "" })}
      </Badge>
    </span>
  );
}

function shown(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

/** The fields in which ``older`` differs from ``current``. */
export function differences(older: AgentConfig, current: AgentConfig): Compared[] {
  return COMPARED.filter((field) => JSON.stringify(older[field] ?? null) !== JSON.stringify(current[field] ?? null));
}

export function TemplateHistory({
  template,
  draft,
  onRestore,
}: {
  template: AgentTemplate;
  /** The form's state, which a version is compared with. */
  draft: AgentConfig;
  onRestore: (agent: AgentConfig) => void;
}) {
  const { t } = useTranslation();
  const versions = useTemplateVersions(template.id);
  const [compared, setCompared] = useState<AgentTemplateVersion | null>(null);
  const list = versions.data ?? [];
  return (
    <Section
      id="template-history"
      title={t("agentHistory.title")}
      icon={History}
      summary={<span className="muted small">{t("agentHistory.count", { count: template.version ?? 1 })}</span>}
    >
      <div className="stack-sm" data-testid="template-history">
        <OriginBadge template={template} />
        {versions.isLoading ? <Spinner /> : null}
        {versions.error ? (
          <Callout tone="danger">
            <ErrorText error={versions.error} />
          </Callout>
        ) : null}
        <ol className="stack-sm">
          {list.map((item) => (
            <li key={item.version} className="row-gap" data-testid={`template-version-${item.version}`}>
              <span>
                <strong>{t("agentHistory.version", { version: item.version })}</strong>{" "}
                <span className="muted small">
                  {formatDate(item.created_at)}
                  {item.note ? ` · ${item.note}` : ""}
                </span>
              </span>
              {item.version === template.version ? (
                <Badge tone="success">{t("agentHistory.current")}</Badge>
              ) : (
                <Button variant="ghost" onClick={() => setCompared(item)}>
                  {t("agentHistory.compare")}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </div>
      {compared ? (
        <Modal
          open
          wide
          title={t("agentHistory.compareTitle", { version: compared.version })}
          onClose={() => setCompared(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setCompared(null)}>
                {t("common.close")}
              </Button>
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={() => {
                  onRestore(structuredClone(compared.agent));
                  setCompared(null);
                }}
              >
                {t("agentHistory.restore")}
              </Button>
            </>
          }
        >
          <CompareTable older={compared.agent} current={draft} version={compared.version} />
          <p className="muted small">{t("agentHistory.restoreHint")}</p>
        </Modal>
      ) : null}
    </Section>
  );
}

function CompareTable({ older, current, version }: { older: AgentConfig; current: AgentConfig; version: number }) {
  const { t } = useTranslation();
  const changed = differences(older, current);
  if (!changed.length) return <p data-testid="template-compare-same">{t("agentHistory.same")}</p>;
  return (
    <table className="table" data-testid="template-compare">
      <thead>
        <tr>
          <th scope="col">{t("agentHistory.field")}</th>
          <th scope="col">{t("agentHistory.version", { version })}</th>
          <th scope="col">{t("agentHistory.form")}</th>
        </tr>
      </thead>
      <tbody>
        {changed.map((field) => (
          <tr key={field}>
            <th scope="row">{t(`agentHistory.fields.${field}`)}</th>
            <td>
              <pre className="code-block">{shown(older[field])}</pre>
            </td>
            <td>
              <pre className="code-block">{shown(current[field])}</pre>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// The shipped agent templates (NAL-B1): ready-made single agents that a person takes over as a template of their own.
// Reading stores nothing; "Use as my template" copies the agent (version 1, origin builtin:...). A newer Nodestro
// version never changes a copy.

import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Copy, WifiOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../../api/client";
import { useLibraryAgents } from "../../api/hooks";
import type { AgentTemplate, LibraryAgentSummary } from "../../api/types";
import { agentIcon } from "../../components/icons";
import { toast } from "../../components/toast";
import { Badge, Button, Callout, Modal, Section, Spinner } from "../../components/ui";
import { currentLanguage } from "../../i18n";
import { ErrorText } from "../../lib/errors";
import { ExampleServices } from "../../library/ExampleServices";

export function LibraryAgents({ onCopied }: { onCopied: (template: AgentTemplate) => void }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language || currentLanguage();
  const agents = useLibraryAgents(language);
  const [open, setOpen] = useState<string | null>(null);
  const all = agents.data ?? [];
  return (
    <Section
      id="library-agents"
      title={t("agentLibrary.title")}
      icon={BookOpen}
      summary={<span className="muted small">{t("agentLibrary.count", { count: all.length })}</span>}
    >
      <div className="stack-sm" data-testid="library-agents">
        <p className="muted small">{t("agentLibrary.intro")}</p>
        {agents.isLoading ? <Spinner /> : null}
        {agents.error ? (
          <Callout tone="danger">
            <ErrorText error={agents.error} />
          </Callout>
        ) : null}
        <div className="card-grid">
          {all.map((agent) => (
            <LibraryAgentCard key={agent.id} agent={agent} onOpen={() => setOpen(agent.id)} />
          ))}
        </div>
      </div>
      {open ? (
        <LibraryAgentDialog
          key={open}
          id={open}
          language={language}
          onClose={() => setOpen(null)}
          onCopied={(template) => {
            setOpen(null);
            onCopied(template);
          }}
        />
      ) : null}
    </Section>
  );
}

function LibraryAgentCard({ agent, onOpen }: { agent: LibraryAgentSummary; onOpen: () => void }) {
  const { t } = useTranslation();
  const Icon = agentIcon(agent.icon);
  return (
    <article className="card">
      <button type="button" className="card__main card--button" onClick={onOpen} data-testid={`library-agent-${agent.id}`}>
        <div className="card__head">
          <span className="card__avatar">
            <Icon size={16} aria-hidden />
          </span>
          <div>
            <h3>{agent.name}</h3>
            <span className="muted small">{t(`agentLibrary.category.${agent.category}`)}</span>
          </div>
        </div>
        <p className="card__text">{agent.meta.summary || agent.description}</p>
        {agent.meta.requirements.offline_capable ? null : (
          <Badge tone="warning" icon={WifiOff}>
            {t("agentLibrary.needsInternet")}
          </Badge>
        )}
      </button>
    </article>
  );
}

function LibraryAgentDialog({
  id,
  language,
  onClose,
  onCopied,
}: {
  id: string;
  language: string;
  onClose: () => void;
  onCopied: (template: AgentTemplate) => void;
}) {
  const { t } = useTranslation();
  const detail = useQuery({ queryKey: ["library-agent", id, language], queryFn: () => api.libraryAgent(id, language) });
  const [services, setServices] = useState<Record<string, string>>({});
  const copy = useMutation({
    mutationFn: () =>
      api.copyLibraryAgent(id, {
        language,
        // Only the kinds a connection was chosen for; a kind left open is named by the template's check.
        services: Object.fromEntries(Object.entries(services).filter(([, value]) => value)),
      }),
    onSuccess: (template) => {
      toast.success(t("agentLibrary.copied", { name: template.agent.name }));
      onCopied(template);
    },
    onError: toast.error,
  });
  const data = detail.data;
  const requirements = data?.meta.requirements;
  return (
    <Modal
      open
      wide
      title={data?.name ?? t("agentLibrary.title")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Copy} busy={copy.isPending} disabled={!data} onClick={() => copy.mutate()}>
            {t("agentLibrary.use")}
          </Button>
        </>
      }
    >
      {detail.isLoading ? <Spinner /> : null}
      {detail.error ? (
        <Callout tone="danger">
          <ErrorText error={detail.error} />
        </Callout>
      ) : null}
      {data && requirements ? (
        <div className="stack" data-testid="library-agent-detail">
          <p>{data.help}</p>
          <section className="stack-sm">
            <h3>{t("agentLibrary.examples")}</h3>
            <ul>
              {data.meta.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </section>
          <section className="stack-sm">
            <h3>{t("agentLibrary.needs")}</h3>
            <ul className="muted small">
              <li>{t("agentLibrary.tier", { tier: t(`agentLibrary.tiers.${requirements.min_tier ?? "standard"}`) })}</li>
              {requirements.tools.length ? <li>{t("agentLibrary.tools", { tools: requirements.tools.join(", ") })}</li> : null}
              <li>{requirements.offline_capable ? t("agentLibrary.offline") : t("agentLibrary.online")}</li>
            </ul>
          </section>
          <ExampleServices example={{ services: requirements.services }} value={services} onChange={setServices} />
          <p className="muted small">
            {t("agentLibrary.versionNote", { version: data.version, tests: data.meta.tests.length })}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

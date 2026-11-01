// The format 2 parts of an example's preview: the teams an orchestrator delegates to, the knowledge files a copy
// creates and the optional connections (integrations) with the choice of an MCP server for the copy.
//
// The gallery never pretends a connection: an integration is offline (sample data) unless the person picks a
// server, and the backend checks that the server offers every tool approved as read-only before anything is copied.

import { BookOpen, PlugZap, UserCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { useMcpServers } from "../api/mcp";
import type { ExampleDetail, ExampleIntegration, ExampleKnowledge, ExampleTeam } from "../api/types";
import { Badge, Callout, Field, Select } from "../components/ui";
import { ProblemText, codedError } from "../lib/errors";
import { OFFLINE } from "./examples";

/** The teams of an orchestrated example: what each can do, what it delivers and whether it stops for a person. */
export function TeamList({ teams }: { teams: ExampleTeam[] }) {
  const { t } = useTranslation();
  return (
    <>
      <h3 className="example-preview__icon-title">
        <Users size={14} aria-hidden /> {t("library.preview.teams")}
      </h3>
      <p className="muted small">{t("library.preview.teamsNote")}</p>
      <ul className="example-teams" data-testid="example-teams">
        {teams.map((team) => (
          <li key={team.part_id} className="example-teams__item" data-testid={`example-team-${team.part_id}`}>
            <div className="example-agents__head">
              <strong>{team.name}</strong>
              {team.approval ? (
                <Badge tone="warning" icon={UserCheck}>
                  {t("library.preview.teamApproval")}
                </Badge>
              ) : null}
            </div>
            <p className="muted small">{team.description}</p>
            {team.capabilities.length ? (
              <div className="chip-row" aria-label={t("library.preview.capabilities")}>
                {team.capabilities.map((capability) => (
                  <span key={capability} className="chip">
                    {capability}
                  </span>
                ))}
              </div>
            ) : null}
            {team.agents.length ? (
              <p className="small">{t("library.preview.teamAgents", { names: team.agents.map((agent) => agent.name).join(", ") })}</p>
            ) : null}
            {team.parameters.length ? (
              <p className="small">{t("library.preview.teamParameters", { names: team.parameters.join(", ") })}</p>
            ) : null}
            {team.contract.length ? (
              <p className="small">{t("library.preview.teamContract", { names: team.contract.join(", ") })}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

/** The synthetic reference documents a copy stores in the knowledge base. */
export function KnowledgeList({ files }: { files: ExampleKnowledge[] }) {
  const { t } = useTranslation();
  return (
    <>
      <h3 className="example-preview__icon-title">
        <BookOpen size={14} aria-hidden /> {t("library.preview.knowledge")}
      </h3>
      <p className="muted small">{t("library.preview.knowledgeNote")}</p>
      <ul className="example-samples" data-testid="example-knowledge">
        {files.map((file) => (
          <li key={file.id}>
            <strong>{file.name}</strong>
            <span className="muted small"> · {file.description}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Why the backend refused the chosen server for this integration, if it did. */
function refusal(error: unknown, integration: string): ApiError | null {
  if (!(error instanceof ApiError) || error.code !== "library.integration_unavailable") return null;
  return error.params.integration === integration ? error : null;
}

function IntegrationBox({
  integration,
  servers,
  server,
  onServer,
  error,
}: {
  integration: ExampleIntegration;
  servers: { id: string; name: string }[];
  server: string;
  onServer: (server: string) => void;
  error: unknown;
}) {
  const { t } = useTranslation();
  const refused = refusal(error, integration.id);
  const missing = String(refused?.params.missing ?? "");
  const notReadOnly = String(refused?.params.not_read_only ?? "");
  const select = `example-connection-${integration.id}`;
  return (
    <section className="example-integration" data-testid={`example-integration-${integration.id}`} aria-labelledby={`${select}-title`}>
      <span className="example-integration__label">{t("library.connect.optional")}</span>
      <h4 id={`${select}-title`}>{integration.name}</h4>
      <p className="small">{integration.description}</p>
      <p className="small">{t("library.connect.tools", { tools: integration.tools.join(", ") })}</p>
      <dl className="example-guide">
        <div>
          <dt>{t("library.connect.setup")}</dt>
          <dd>{integration.setup}</dd>
        </div>
        <div>
          <dt>{t("library.connect.offline")}</dt>
          <dd>{integration.offline}</dd>
        </div>
      </dl>
      <Field label={t("library.connect.choice")} htmlFor={select}>
        <Select
          id={select}
          value={server}
          onChange={onServer}
          disabled={!servers.length}
          options={[
            { value: OFFLINE, label: t("library.connect.offlineMode") },
            ...servers.map((item) => ({ value: item.id, label: t("library.connect.server", { name: item.name }) })),
          ]}
        />
      </Field>
      {server !== OFFLINE && !refused ? <p className="muted small">{t("library.connect.checked")}</p> : null}
      {refused ? (
        <Callout tone="danger">
          <ProblemText item={codedError(refused)} />
          {missing ? <p className="small">{t("library.connect.missing", { tools: missing })}</p> : null}
          {notReadOnly ? <p className="small">{t("library.connect.notReadOnly", { tools: notReadOnly })}</p> : null}
        </Callout>
      ) : null}
    </section>
  );
}

/**
 * The optional connections of an example and, per connection, the choice for the copy: offline mode (the
 * default) or one of the configured MCP servers. Only enabled servers are offered; whether a server really
 * offers the tools is checked by the backend when copying.
 */
export function ExampleConnections({
  example,
  value,
  onChange,
  error,
}: {
  example: Pick<ExampleDetail, "integrations">;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  /** The last error of the copy; a refused server is explained at its integration. */
  error: unknown;
}) {
  const { t } = useTranslation();
  const servers = useMcpServers();
  const usable = (servers.data ?? []).filter((server) => server.enabled);
  return (
    <>
      <h3 className="example-preview__icon-title">
        <PlugZap size={14} aria-hidden /> {t("library.connect.title", { count: example.integrations.length })}
      </h3>
      <p className="muted small">{t("library.connect.intro")}</p>
      {servers.isSuccess && !usable.length ? (
        <Callout tone="info">
          {t("library.connect.noServers")} <Link to="/tools?tab=services">{t("library.connect.setUp")}</Link>
        </Callout>
      ) : null}
      {example.integrations.map((integration) => (
        <IntegrationBox
          key={integration.id}
          integration={integration}
          servers={usable}
          server={value[integration.id] ?? OFFLINE}
          onServer={(server) => onChange({ ...value, [integration.id]: server })}
          error={error}
        />
      ))}
    </>
  );
}

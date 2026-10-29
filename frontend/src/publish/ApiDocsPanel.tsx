// The documentation of the published API: endpoints with their permissions, examples and the
// OpenAPI description. Everything here is generated from the published version, without AI.

import { useQuery } from "@tanstack/react-query";
import { FileJson } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { Publication } from "../api/types";
import { Button, Callout, Section, Segmented, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { CodeBlock, downloadJson } from "./common";

type Example = "curl" | "python" | "responses";

export function ApiDocsPanel({ publication }: { publication: Publication }) {
  const { t } = useTranslation();
  const docs = useQuery({ queryKey: ["api", "docs", publication.id, null], queryFn: () => api.apiDocs(publication.id) });
  const [example, setExample] = useState<Example>("curl");
  if (docs.isLoading) return <Spinner />;
  if (docs.error)
    return (
      <Callout tone="danger">
        <ErrorText error={docs.error} />
      </Callout>
    );
  if (!docs.data) return null;
  const { examples, openapi, number } = docs.data;
  return (
    <div className="stack">
      <p className="muted small">{t("publish.docs.intro", { number })}</p>
      <div className="row-gap">
        <Button icon={FileJson} onClick={() => downloadJson(openapi, `${publication.slug}-openapi.json`)} data-testid="api-openapi">
          {t("publish.docs.openapi")}
        </Button>
      </div>
      <Callout tone="info">{t("publish.docs.auth")}</Callout>
      <table className="table small" data-testid="api-endpoints">
        <thead>
          <tr>
            <th>{t("publish.docs.method")}</th>
            <th>{t("publish.docs.path")}</th>
            <th>{t("publish.docs.purpose")}</th>
            <th>{t("publish.docs.scope")}</th>
          </tr>
        </thead>
        <tbody>
          {examples.endpoints.map((endpoint) => (
            <tr key={`${endpoint.method} ${endpoint.path}`}>
              <td>
                <code>{endpoint.method}</code>
              </td>
              <td>
                <code>{endpoint.path}</code>
              </td>
              <td>{t(`publish.docs.purposes.${endpoint.purpose}`)}</td>
              <td>{t(`publish.scopes.${endpoint.scope}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Section title={t("publish.docs.request")} defaultOpen>
        <CodeBlock text={JSON.stringify(examples.request, null, 2)} />
      </Section>
      <Segmented<Example>
        label={t("publish.docs.examples")}
        value={example}
        onChange={setExample}
        options={[
          { value: "curl", label: "curl" },
          { value: "python", label: "Python" },
          { value: "responses", label: t("publish.docs.responses") },
        ]}
      />
      {example === "curl"
        ? Object.entries(examples.curl).map(([name, command]) => (
            <div key={name} className="stack-sm">
              <strong className="small">{t(`publish.docs.curl.${name}`)}</strong>
              <CodeBlock text={command} />
            </div>
          ))
        : null}
      {example === "python" ? <CodeBlock text={examples.python} /> : null}
      {example === "responses"
        ? Object.entries(examples.responses).map(([name, value]) => (
            <div key={name} className="stack-sm">
              <strong className="small">{t(`publish.docs.response.${name}`)}</strong>
              <CodeBlock text={typeof value === "string" ? value : JSON.stringify(value, null, 2)} />
            </div>
          ))
        : null}
      <Section title={t("publish.docs.statuses")}>
        <ul className="small">
          {(["queued", "running", "awaiting_approval", "succeeded", "failed", "cancelled"] as const).map((status) => (
            <li key={status}>
              <code>{status}</code>: {t(`publish.docs.status.${status}`)}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

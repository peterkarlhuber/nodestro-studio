// Try the API inside Nodestro: validate a request body exactly like the API does, or start a
// real run of the published version (it costs like any run and shows up in the history).

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCheck, Play } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api, ApiError } from "../api/client";
import type { ApiOverview, ApiRunStatus, ApiValidation, Publication } from "../api/types";
import { Button, Callout, Field, Hint, Select, Spinner, TextArea } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { CodeBlock } from "./common";

export function ApiTry({
  overview,
  publication,
  onChanged,
}: {
  overview: ApiOverview;
  publication: Publication;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [number, setNumber] = useState<number | null>(null);
  const docs = useQuery({
    queryKey: ["api", "docs", publication.id, number],
    queryFn: () => api.apiDocs(publication.id, number),
  });
  const [body, setBody] = useState<string | null>(null);
  const text = body ?? (docs.data ? JSON.stringify(docs.data.examples.request, null, 2) : "");
  const [result, setResult] = useState<ApiValidation | ApiRunStatus | null>(null);
  const [parseError, setParseError] = useState(false);

  const send = useMutation({
    mutationFn: (dryRun: boolean) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text || "{}") as Record<string, unknown>;
      } catch {
        setParseError(true);
        throw new ApiError("invalid JSON", 400, "request.not_json");
      }
      setParseError(false);
      return api.testApi(publication.id, parsed, dryRun, number);
    },
    onSuccess: (answer) => {
      setResult(answer);
      if ("run_id" in answer) onChanged();
    },
    onError: () => setResult(null),
  });

  return (
    <div className="stack">
      <p className="muted small">{t("publish.try.intro")}</p>
      {!publication.enabled ? <Callout tone="warning">{t("publish.try.disabled")}</Callout> : null}
      <Field label={t("publish.try.version")}>
        <Select
          value={number ? String(number) : ""}
          onChange={(value) => {
            setNumber(value ? Number(value) : null);
            setBody(null);
          }}
          options={[
            { value: "", label: t("publish.try.activeVersion") },
            ...overview.releases.map((release) => ({ value: String(release.number), label: t("publish.versions.number", { number: release.number }) })),
          ]}
        />
      </Field>
      {docs.isLoading ? <Spinner /> : null}
      <Field label={t("publish.try.body")} hint={t("publish.try.bodyHint")}>
        <TextArea rows={10} className="code-input" value={text} onChange={(event) => setBody(event.target.value)} data-testid="api-try-body" />
      </Field>
      <div className="row-gap">
        <Hint id="publish.validate">
          <Button icon={CheckCheck} busy={send.isPending && send.variables === true} onClick={() => send.mutate(true)} data-testid="api-try-validate">
            {t("publish.try.validate")}
          </Button>
        </Hint>
        <Hint id="publish.testRun">
          <Button
            variant="primary"
            icon={Play}
            disabled={!publication.enabled}
            busy={send.isPending && send.variables === false}
            onClick={() => send.mutate(false)}
            data-testid="api-try-run"
          >
            {t("publish.try.run")}
          </Button>
        </Hint>
      </div>
      {parseError ? <Callout tone="danger">{t("publish.try.notJson")}</Callout> : null}
      {send.error && !parseError ? (
        <Callout tone="danger">
          <ErrorText error={send.error} />
        </Callout>
      ) : null}
      {result && "input_text" in result ? (
        <div className="stack-sm" data-testid="api-try-valid">
          <Callout tone="info">{t("publish.try.valid")}</Callout>
          <p className="small">{t("publish.try.inputText")}</p>
          <CodeBlock text={result.input_text || "–"} />
        </div>
      ) : null}
      {result && "run_id" in result ? (
        <Callout tone="brand">
          <span data-testid="api-try-started">{t("publish.try.started")}</span>{" "}
          <Link to={`/executions/${result.run_id}`}>{t("publish.try.openRun")}</Link>
        </Callout>
      ) : null}
    </div>
  );
}

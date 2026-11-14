// The building blocks of the library as gallery entries of their own (NAL-B3): small workflows that examples run as
// teams or sub-workflows. Reading stores nothing; "Use as workflow" copies the block (and the blocks it runs) as
// ordinary workflows, which the editor's palette then offers as teams.

import { useMutation, useQuery } from "@tanstack/react-query";
import { Blocks, Copy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useExamples } from "../api/hooks";
import { skillsApi, useLibraryParts, type PartSummary } from "../api/skills";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Modal,
  Spinner,
} from "../components/ui";
import { ErrorText } from "../lib/errors";

/** Parts whose name, description or capability tags contain the search text (case-insensitive). */
export function filterParts(
  parts: PartSummary[],
  query: string,
): PartSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return parts;
  return parts.filter((part) =>
    [part.name, part.description, ...part.capabilities].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
}

export function LibraryParts({
  language,
  query,
  open,
  onOpen,
  onClose,
  onCopied,
}: {
  language: string;
  query: string;
  open: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  onCopied: (workflowId: string) => void;
}) {
  const { t } = useTranslation();
  const parts = useLibraryParts(language);
  const examples = useExamples(language);
  const names = new Map(
    (examples.data ?? []).map((example) => [example.id, example.name]),
  );
  const shown = filterParts(parts.data ?? [], query);
  return (
    <>
      <p className="muted small">{t("library.kinds.partsIntro")}</p>
      {parts.isLoading ? <Spinner /> : null}
      {parts.error ? (
        <Callout tone="danger">
          <ErrorText error={parts.error} />
        </Callout>
      ) : null}
      {parts.data ? (
        <p className="muted small" aria-live="polite">
          {t("library.kinds.partsResults", { count: shown.length })}
        </p>
      ) : null}
      {parts.data && !shown.length ? (
        <EmptyState icon={Blocks} title={t("library.kinds.noMatch")} />
      ) : (
        <div className="card-grid" data-testid="library-parts">
          {shown.map((part) => (
            <article
              className="card card--link example-card"
              key={part.id}
              data-testid={`library-part-${part.id}`}
            >
              <button
                type="button"
                className="card__main example-card__main"
                onClick={() => onOpen(part.id)}
              >
                <div className="card__head">
                  <span className="card__avatar">
                    <Blocks size={16} aria-hidden />
                  </span>
                  <div>
                    <h2>{part.name}</h2>
                  </div>
                </div>
                <p className="card__text">{part.description}</p>
                {part.capabilities.length ? (
                  <div className="row-gap example-card__features">
                    {part.capabilities.slice(0, 4).map((tag) => (
                      <Badge key={tag} tone="running">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </button>
              <footer className="card__foot example-card__foot">
                <span className="muted small">
                  {t("library.agents", { count: part.agents })}
                  {part.templates.length ? (
                    <>
                      {" "}
                      ·{" "}
                      {t("library.kinds.usedIn", {
                        names: part.templates
                          .map((id) => names.get(id) ?? id)
                          .join(", "),
                      })}
                    </>
                  ) : null}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}
      {open ? (
        <PartDialog
          key={open}
          id={open}
          language={language}
          names={names}
          onClose={onClose}
          onCopied={onCopied}
        />
      ) : null}
    </>
  );
}

function PartDialog({
  id,
  language,
  names,
  onClose,
  onCopied,
}: {
  id: string;
  language: string;
  names: Map<string, string>;
  onClose: () => void;
  onCopied: (workflowId: string) => void;
}) {
  const { t } = useTranslation();
  const detail = useQuery({
    queryKey: ["library-part", id, language],
    queryFn: () => skillsApi.part(id, language),
  });
  const copy = useMutation({
    mutationFn: () => skillsApi.copyPart(id, language),
    onSuccess: (workflow) => {
      toast.success(t("library.copied", { name: workflow.name }));
      onCopied(workflow.id);
    },
    onError: toast.error,
  });
  const data = detail.data;
  const steps = (data?.workflow.nodes ?? []).filter(
    (node) => node.type === "agent" || node.type === "orchestrator",
  );
  return (
    <Modal
      open
      wide
      title={data?.name ?? t("library.kinds.parts")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon={Copy}
            busy={copy.isPending}
            disabled={!data}
            onClick={() => copy.mutate()}
          >
            {t("library.kinds.useAsWorkflow")}
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
      {data ? (
        <div className="stack" data-testid="library-part-detail">
          <p>{data.description}</p>
          {data.capabilities.length ? (
            <div
              className="row-gap"
              aria-label={t("library.kinds.capabilities")}
            >
              {data.capabilities.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}
          <section className="stack-sm">
            <h3>{t("library.kinds.steps")}</h3>
            <ul>
              {steps.map((node) => (
                <li key={node.id}>
                  <Users size={12} aria-hidden /> {node.label}
                </li>
              ))}
            </ul>
          </section>
          {data.templates.length ? (
            <p className="muted small">
              {t("library.kinds.usedIn", {
                names: data.templates
                  .map((item) => names.get(item) ?? item)
                  .join(", "),
              })}
            </p>
          ) : null}
          <p className="muted small">{t("library.kinds.partCopyNote")}</p>
        </div>
      ) : null}
    </Modal>
  );
}

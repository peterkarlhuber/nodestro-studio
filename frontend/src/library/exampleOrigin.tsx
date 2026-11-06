// What the interface makes of a workflow's origin (nodestro-runtime RT-055: a copy of an example remembers the
// example, its version, its language and which optional connections run offline on sample data):
//
// - OfflineBadge (ST-031, AD-18): the editor and the run page say that a copy runs on sample data, in the copy's
//   header. It reads `origin.offline` only, the list the copy stored when it was made; the badge needs no other
//   marker. Names come from the example (in the copy's language), else the integration ids.
// - useOriginSamples (ST-007, OB-13): the example's sample files, offered as one-click inputs in the run dialog, per
//   file field of the copy's form (matched by field name; a renamed field gets none).
//
// Workflows without an origin (made otherwise, or from a server before RT-055) show neither.

import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { useExample } from "../api/hooks";
import type { InputField, WorkflowOrigin } from "../api/types";
import { Badge, Tooltip } from "../components/ui";

/** The origin when it is a copy of an example the interface understands; null otherwise. */
export function exampleOrigin(origin: WorkflowOrigin | null | undefined): WorkflowOrigin | null {
  if (!origin || origin.kind !== "example" || typeof origin.example_id !== "string" || !origin.example_id) return null;
  return origin;
}

/** The integrations of the copy that run on sample data (never undefined). */
export function offlineIntegrations(origin: WorkflowOrigin | null | undefined): string[] {
  const known = exampleOrigin(origin);
  return Array.isArray(known?.offline) ? known.offline.filter((id) => typeof id === "string" && id) : [];
}

/** A copy that runs (partly) on sample data says so next to its name. */
export function OfflineBadge({ origin }: { origin: WorkflowOrigin | null | undefined }) {
  const { t } = useTranslation();
  const offline = offlineIntegrations(origin);
  const known = offline.length ? exampleOrigin(origin) : null;
  // The example's names in the copy's language; an example that no longer exists (404) leaves the ids.
  const example = useExample(known?.example_id ?? null, known?.language ?? "en");
  if (!known) return null;
  const names = offline.map((id) => example.data?.integrations?.find((item) => item.id === id)?.name || id);
  const tip = t("library.origin.offlineTip", {
    count: names.length,
    names: names.join(", "),
    example: example.data?.name || known.example_id,
  });
  return (
    <Tooltip content={tip}>
      <span className="has-tip offline-badge" tabIndex={0} data-testid="offline-badge">
        <Badge tone="warning" icon={CloudOff}>
          {t("library.origin.offlineBadge")}
        </Badge>
      </span>
    </Tooltip>
  );
}

/** A sample file offered as a one-click input. */
export interface SampleOffer {
  id: string;
  fileName: string;
  description: string;
  load: () => Promise<File>;
}

/**
 * The example's sample files per file field of the copy's form, while ``enabled`` (the run dialog is open). Empty
 * for workflows without an origin, an example that no longer exists, or fields the example has no sample for.
 */
export function useOriginSamples(
  origin: WorkflowOrigin | null | undefined,
  fields: InputField[],
  enabled: boolean,
): Record<string, SampleOffer[]> {
  const known = exampleOrigin(origin);
  const fileFields = new Set(fields.filter((field) => field.type === "file").map((field) => field.name));
  const example = useExample(enabled && known && fileFields.size ? known.example_id : null, known?.language ?? "en");
  const offers: Record<string, SampleOffer[]> = {};
  if (!known || !enabled) return offers;
  for (const sample of example.data?.samples ?? []) {
    if (!fileFields.has(sample.field)) continue;
    (offers[sample.field] ??= []).push({
      id: sample.id,
      fileName: sample.file_name,
      description: sample.description,
      load: () => api.exampleSampleFile(known.example_id, sample.id, known.language, sample.file_name),
    });
  }
  return offers;
}

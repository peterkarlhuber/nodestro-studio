import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSchedules, useWorkflows } from "../api/hooks";
import type { Activation, Schedule, ScheduleIn, ScheduleKind } from "../api/types";
import { FormFields } from "../components/FormFields";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Field,
  HelpTip,
  IconButton,
  Modal,
  PageHeader,
  Select,
  Spinner,
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatDate } from "../lib/format";

const KINDS: ScheduleKind[] = ["once", "hourly", "daily", "weekly", "monthly"];

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function emptySchedule(workflowId = ""): ScheduleIn {
  return {
    name: "",
    workflow_id: workflowId,
    kind: "daily",
    at: "08:00",
    start_date: "",
    weekdays: [0],
    day_of_month: 1,
    every_hours: 1,
    time_zone: browserTimeZone(),
    input: "",
    values: {},
    file_ids: [],
    missed: "skip",
    confirm_external: false,
  };
}

/** A readable rhythm, e.g. "weekly on Mon, Thu at 08:00 (Europe/Berlin)". */
export function rhythm(t: (key: string, options?: Record<string, unknown>) => string, schedule: ScheduleIn): string {
  const days = schedule.weekdays
    .slice()
    .sort()
    .map((day) => t(`automation.schedule.weekdaysShort.${day}`))
    .join(", ");
  return t(`automation.schedule.rhythm.${schedule.kind}`, {
    at: schedule.at,
    date: schedule.start_date,
    days,
    day: schedule.day_of_month,
    hours: schedule.every_hours,
    zone: schedule.time_zone,
  });
}

function ActivationView({ activation }: { activation: Activation }) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm">
      {activation.problems.map((problem, index) => (
        <Callout key={`p${index}`} tone="danger">
          <ProblemText item={problem} />
        </Callout>
      ))}
      {activation.notes.map((note, index) => (
        <Callout key={`n${index}`} tone="warning">
          <ProblemText item={note} />
        </Callout>
      ))}
      {activation.next_runs.length ? (
        <div>
          <span className="nd-field-label">{t("automation.schedule.nextRuns")}</span>
          <ul className="small">
            {activation.next_runs.map((slot) => (
              <li key={slot}>{formatDate(slot)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ScheduleDialog({ schedule, onClose }: { schedule: Schedule | null; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workflows = useWorkflows();
  const [draft, setDraft] = useState<ScheduleIn>(() => (schedule ? { ...schedule } : emptySchedule()));
  const set = (patch: Partial<ScheduleIn>) => setDraft((current) => ({ ...current, ...patch }));
  const zones = useQuery({ queryKey: ["time-zones"], queryFn: api.timeZones, staleTime: Infinity });
  const workflow = useQuery({
    queryKey: keys.workflow(draft.workflow_id),
    queryFn: () => api.workflow(draft.workflow_id),
    enabled: Boolean(draft.workflow_id),
  });
  const preview = useQuery({
    queryKey: ["schedule-preview", draft],
    queryFn: () => api.previewSchedule(draft),
    enabled: Boolean(draft.workflow_id),
  });
  const fields = workflow.data?.nodes.find((node) => node.type === "start")?.start?.fields ?? [];
  const save = useMutation({
    mutationFn: () => (schedule ? api.updateSchedule(schedule.id, draft) : api.createSchedule(draft)),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: keys.schedules });
      toast.success(saved.enabled || !schedule?.enabled ? t("automation.schedule.saved") : t("automation.schedule.savedOff"));
      onClose();
    },
  });
  return (
    <Modal
      title={schedule ? t("automation.schedule.edit") : t("automation.schedule.new")}
      open
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" busy={save.isPending} disabled={!draft.workflow_id} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <p className="muted small">
        {t("automation.schedule.intro")} <HelpTip id="automation.schedule" label={t("nav.schedules")} />
      </p>
      <div className="grid-2">
        <Field label={t("automation.columns.name")}>
          <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label={t("automation.workflow")}>
          <Select
            value={draft.workflow_id}
            placeholder={t("automation.pickWorkflow")}
            onChange={(value) => set({ workflow_id: value, values: {} })}
            options={(workflows.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        </Field>
      </div>
      <div className="grid-3">
        <Field label={t("automation.schedule.kind")}>
          <Select
            value={draft.kind}
            onChange={(value) => set({ kind: value as ScheduleKind })}
            options={KINDS.map((value) => ({ value, label: t(`automation.schedule.kinds.${value}`) }))}
          />
        </Field>
        {draft.kind === "hourly" ? (
          <Field label={t("automation.schedule.everyHours")}>
            <TextInput
              type="number"
              min={1}
              max={24}
              value={draft.every_hours}
              onChange={(e) => set({ every_hours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })}
            />
          </Field>
        ) : null}
        <Field label={draft.kind === "hourly" ? t("automation.schedule.firstAt") : t("automation.schedule.at")}>
          <TextInput type="time" value={draft.at} onChange={(e) => set({ at: e.target.value })} />
        </Field>
        {draft.kind === "monthly" ? (
          <Field label={t("automation.schedule.dayOfMonth")} hint={t("automation.schedule.dayOfMonthHint")}>
            <TextInput
              type="number"
              min={1}
              max={31}
              value={draft.day_of_month}
              onChange={(e) => set({ day_of_month: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
            />
          </Field>
        ) : null}
        <Field label={draft.kind === "once" ? t("automation.schedule.date") : t("automation.schedule.startDate")}>
          <TextInput type="date" value={draft.start_date} onChange={(e) => set({ start_date: e.target.value })} />
        </Field>
      </div>
      {draft.kind === "weekly" ? (
        <fieldset className="weekday-picker">
          <legend className="nd-field-label">{t("automation.schedule.weekdays")}</legend>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <label key={day} className="check-row">
              <input
                type="checkbox"
                checked={draft.weekdays.includes(day)}
                onChange={(e) =>
                  set({ weekdays: e.target.checked ? [...draft.weekdays, day].sort() : draft.weekdays.filter((item) => item !== day) })
                }
              />
              {t(`automation.schedule.weekdaysShort.${day}`)}
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="grid-2">
        <Field label={t("automation.schedule.timeZone")} tip="automation.scheduleTimeZone">
          <Select
            value={draft.time_zone}
            onChange={(value) => set({ time_zone: value })}
            options={(zones.data ?? [draft.time_zone]).map((zone) => ({ value: zone, label: zone }))}
          />
        </Field>
        <Field label={t("automation.schedule.missed")} tip="automation.scheduleMissed">
          <Select
            value={draft.missed}
            onChange={(value) => set({ missed: value as ScheduleIn["missed"] })}
            options={[
              { value: "skip", label: t("automation.schedule.missedSkip") },
              { value: "run_once", label: t("automation.schedule.missedOnce") },
            ]}
          />
        </Field>
      </div>
      {fields.length ? <FormFields fields={fields} values={draft.values} origin="schedule" onChange={(values) => set({ values })} /> : null}
      <Field label={fields.length ? t("flow.form.extraInput") : t("editor.run.input")}>
        <TextArea rows={3} value={draft.input} onChange={(e) => set({ input: e.target.value })} />
      </Field>
      {preview.data?.external_tools.length ? (
        <Toggle
          checked={draft.confirm_external}
          onChange={(value) => set({ confirm_external: value })}
          label={t("automation.external.confirm")}
          description={t("automation.external.text", { tools: preview.data.external_tools.join(", ") })}
          tip="automation.external"
        />
      ) : null}
      {preview.data ? <ActivationView activation={preview.data} /> : null}
      <p className="field__hint">{t("automation.schedule.offUntilEnabled")}</p>
      {save.error ? (
        <Callout tone="danger">
          <ErrorText error={save.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}

export function SchedulesPage() {
  const { t } = useTranslation();
  const schedules = useSchedules();
  const workflows = useWorkflows();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Schedule | null | "new">(null);
  const [refused, setRefused] = useState<{ name: string; activation: Activation } | null>(null);
  const toggle = useMutation({
    mutationFn: (schedule: Schedule) => (schedule.enabled ? api.disableSchedule(schedule.id) : api.enableSchedule(schedule.id)),
    onSuccess: (state) => {
      void queryClient.invalidateQueries({ queryKey: keys.schedules });
      if (state.activation && !state.activation.ok) setRefused({ name: state.schedule.name, activation: state.activation });
    },
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: api.deleteSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.schedules }),
    onError: toast.error,
  });
  const workflowName = (id: string) => workflows.data?.find((item) => item.id === id)?.name ?? id;
  return (
    <div className="page">
      <PageHeader
        title={t("nav.schedules")}
        doc="automatisierung#zeitplaene"
        description={t("automation.schedule.description")}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing("new")}>
            {t("automation.schedule.new")}
          </Button>
        }
      />
      <div className="page__body">
        {schedules.isLoading ? <Spinner /> : null}
        {schedules.data && !schedules.data.length ? (
          <EmptyState icon={CalendarClock} title={t("automation.schedule.empty")}>
            {t("automation.schedule.emptyText")}
          </EmptyState>
        ) : null}
        {schedules.data?.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("automation.schedule.active")}</th>
                  <th>{t("automation.columns.name")}</th>
                  <th>{t("automation.schedule.rhythmColumn")}</th>
                  <th>{t("automation.schedule.next")}</th>
                  <th>{t("automation.schedule.last")}</th>
                  <th>
                    <span className="sr-only">{t("automation.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.data.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>
                      <Toggle
                        checked={schedule.enabled}
                        onChange={() => toggle.mutate(schedule)}
                        label={<span className="sr-only">{t("automation.schedule.toggle", { name: schedule.name || workflowName(schedule.workflow_id) })}</span>}
                      />
                    </td>
                    <td>
                      <strong>{schedule.name || workflowName(schedule.workflow_id)}</strong>
                      <div className="muted small">{workflowName(schedule.workflow_id)}</div>
                    </td>
                    <td className="small">{rhythm(t, schedule)}</td>
                    <td>
                      {schedule.enabled && schedule.next_run_at ? formatDate(schedule.next_run_at) : schedule.completed ? (
                        <Badge>{t("automation.schedule.completed")}</Badge>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="small">
                      {schedule.last_run_id ? (
                        <Link to={`/executions/${schedule.last_run_id}`}>{formatDate(schedule.last_run_at)}</Link>
                      ) : (
                        "–"
                      )}
                      {schedule.last_error_code ? (
                        <div className="text-warning">
                          <ProblemText
                            item={{ code: schedule.last_error_code, params: schedule.last_error_params, message: schedule.last_error }}
                            compact
                          />
                        </div>
                      ) : null}
                      {schedule.missed_total ? (
                        <div className="muted">{t("automation.schedule.missedCount", { count: schedule.missed_total })}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className="row-gap">
                        <IconButton icon={Pencil} label={t("automation.schedule.edit")} onClick={() => setEditing(schedule)} />
                        <IconButton icon={Trash2} label={t("automation.schedule.delete")} onClick={() => remove.mutate(schedule.id)} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      {editing ? <ScheduleDialog schedule={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
      <Modal title={t("automation.schedule.refused")} open={refused !== null} onClose={() => setRefused(null)}>
        {refused ? <ActivationView activation={refused.activation} /> : null}
      </Modal>
    </div>
  );
}

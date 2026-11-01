// Pure helpers of the live run chat (LRC-1): which messages belong together, what a status says and what a team
// leader is doing. Nothing here talks to the server; texts are returned as keys of the runChat area.

import type { ChatTarget, Run, RunChatView, RunMessage, TeamActivity } from "../api/types";
import type { Tone } from "../lib/format";

export type ChatMode = "question" | "instruction";

/** A key of the language files with its values, so the helpers stay free of i18n. */
export interface TextRef {
  key: string;
  values?: Record<string, unknown>;
}

/** Steering codes the API may send in a short form, read as the stable error codes. */
const STEERING_ALIASES: Record<string, string> = {
  unattended: "run_chat.steering_unattended",
  off: "run_chat.steering_off",
  finished: "run_chat.orchestrator_finished",
  not_active: "run_chat.run_not_active",
  imported: "run_chat.imported_run",
};

/** The error code that explains why a team leader takes no instructions (``errors.<code>``); null when it does. */
export function steeringCode(target: Pick<ChatTarget, "steering" | "steering_code"> | null | undefined): string | null {
  if (!target || target.steering) return null;
  const code = target.steering_code ?? "run_chat.steering_off";
  if (code.includes(".")) return code;
  return STEERING_ALIASES[code] ?? `run_chat.${code}`;
}

/** Whether the run's own workflow has an orchestrator node (team runs below it are known only to the chat view). */
export function hasOrchestrator(run: Pick<Run, "workflow"> | null | undefined): boolean {
  return Boolean(run?.workflow?.nodes?.some((node) => node.type === "orchestrator"));
}

/** The stable identity of a team leader: its run and its node. */
export function targetKey(target: Pick<ChatTarget, "run_id" | "node_id">): string {
  return `${target.run_id}:${target.node_id}`;
}

/** The target a message was sent to. */
export function messageTargetKey(message: Pick<RunMessage, "target_run_id" | "node_id">): string {
  return `${message.target_run_id}:${message.node_id}`;
}

/** The team leader shown first: the chosen one if it still exists, else the first that steers, else the first. */
export function pickTarget(targets: ChatTarget[], chosen: string | null): ChatTarget | null {
  if (!targets.length) return null;
  return (
    targets.find((target) => targetKey(target) === chosen) ??
    targets.find((target) => target.status === "running" && target.steering) ??
    targets.find((target) => target.steering) ??
    targets[0]
  );
}

/** One row of the conversation: a question with its answer, an instruction, or an answer whose question is gone. */
export interface ChatEntry {
  message: RunMessage;
  answer: RunMessage | null;
}

/** The conversation with one team leader in order: each question followed by its answer. */
export function conversationEntries(messages: RunMessage[], target: string | null): ChatEntry[] {
  const sorted = [...messages].sort((a, b) => a.seq - b.seq);
  const answers = new Map<string, RunMessage>();
  for (const message of sorted) if (message.kind === "answer" && message.reply_to) answers.set(message.reply_to, message);
  const byId = new Map(sorted.map((message) => [message.id, message]));
  const entries: ChatEntry[] = [];
  for (const message of sorted) {
    if (target !== null && messageTargetKey(message) !== target) continue;
    if (message.kind === "answer") {
      // Shown with its question; on its own only when the question is not part of the view.
      if (message.reply_to && byId.has(message.reply_to)) continue;
      entries.push({ message, answer: null });
      continue;
    }
    const answer = message.kind === "question" ? (answers.get(message.id) ?? (message.answer_id ? byId.get(message.answer_id) : undefined) ?? null) : null;
    entries.push({ message, answer });
  }
  return entries;
}

/** Insert or replace a message (by id) and keep the order of the conversation. */
export function upsertMessage(messages: RunMessage[], message: RunMessage): RunMessage[] {
  const rest = messages.filter((item) => item.id !== message.id);
  return [...rest, message].sort((a, b) => a.seq - b.seq);
}

/** The view after a live ``message`` event. */
export function withMessage(view: RunChatView, message: RunMessage): RunChatView {
  return { ...view, messages: upsertMessage(view.messages, message) };
}

/** The view after a live ``targets`` event (with the run's status when the event names it). */
export function withTargets(
  view: RunChatView,
  targets: ChatTarget[],
  run?: Partial<Pick<RunChatView, "run_status" | "active">>,
): RunChatView {
  return {
    ...view,
    targets,
    run_status: typeof run?.run_status === "string" ? run.run_status : view.run_status,
    active: typeof run?.active === "boolean" ? run.active : view.active,
  };
}

/** Whether a question still waits for its answer (the stream then stays open after the run ended). */
export function hasPendingQuestion(view: RunChatView | null | undefined): boolean {
  return Boolean(view?.messages.some((message) => message.kind === "question" && message.status === "pending"));
}

/** The decision number a person reads (decisions count from 1; the runtime's step from 0). */
export function decisionNumber(step: number | null | undefined): number | null {
  return step === null || step === undefined ? null : step + 1;
}

/** Teams that work right now. */
export function workingTeams(target: Pick<ChatTarget, "teams"> | null | undefined): TeamActivity[] {
  return (target?.teams ?? []).filter((team) => team.status === "running" || team.status === "queued");
}

/** The names of a decision's teams, as the team leader shows them (the member id when the team is not listed). */
export function decisionTeams(members: string[], teams: TeamActivity[]): string[] {
  const names = new Map(teams.map((team) => [team.member, team.name || team.member]));
  return members.map((member) => names.get(member) ?? member);
}

const ACTIONS = new Set(["delegate", "parallel", "staff", "finish"]);

/** What a decision did, for a considered instruction: received and taken into account, never "carried out". */
export interface DecisionView {
  /** runChat.decision.action.<action> */
  actionKey: string;
  teams: string[];
  accepted: boolean;
}

export function decisionView(message: RunMessage, teams: TeamActivity[]): DecisionView | null {
  const decision = message.decision;
  if (!decision) return null;
  const action = decision.action && ACTIONS.has(decision.action) ? decision.action : "other";
  return { actionKey: `runChat.decision.action.${action}`, teams: decisionTeams(decision.members, teams), accepted: decision.accepted };
}

/** The badge of a message: its tone, its text and, for a refusal, the error code behind it. */
export interface StatusView {
  tone: Tone;
  text: TextRef;
  /** ``errors.<code>`` explains why (rejected, expired, failed). */
  code: string | null;
  busy?: boolean;
}

export function messageStatus(message: RunMessage): StatusView | null {
  const n = decisionNumber(message.step);
  if (message.kind === "instruction") {
    switch (message.status) {
      case "queued":
        return { tone: "idle", text: { key: "runChat.status.queued" }, code: null };
      case "delivered":
        return n === null
          ? { tone: "running", text: { key: "runChat.status.deliveredPlain" }, code: null }
          : { tone: "running", text: { key: "runChat.status.delivered", values: { n } }, code: null };
      case "considered":
        return n === null
          ? { tone: "success", text: { key: "runChat.status.consideredPlain" }, code: null }
          : { tone: "success", text: { key: "runChat.status.considered", values: { n } }, code: null };
      case "rejected":
        return { tone: "danger", text: { key: "runChat.status.rejected" }, code: message.code };
      case "expired":
        return { tone: "warning", text: { key: "runChat.status.expired" }, code: message.code };
      default:
        return null;
    }
  }
  if (message.kind === "question") {
    switch (message.status) {
      case "pending":
        return { tone: "running", text: { key: "runChat.status.pending" }, code: null, busy: true };
      case "answered":
        return { tone: "success", text: { key: "runChat.status.answered" }, code: null };
      case "failed":
        return { tone: "danger", text: { key: "runChat.status.failed" }, code: message.code };
      default:
        return null;
    }
  }
  return null;
}

/** The remaining chat budget; null when unknown (never shown as 0). */
export function remainingBudget(view: Pick<RunChatView, "remaining_budget_usd"> | null | undefined): number | null {
  const value = view?.remaining_budget_usd;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}

/** Questions left; null when unknown. */
export function questionsLeft(view: Pick<RunChatView, "questions_left"> | null | undefined): number | null {
  const value = view?.questions_left;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}

/** A new id for one composed message (``client_id``): the same one for every retry, so a retry stores nothing twice. */
export function newClientId(random: () => number = Math.random): string {
  const crypto = (globalThis as { crypto?: Crypto }).crypto;
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = (length: number) =>
    Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join("");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${((Math.floor(random() * 4) + 8).toString(16))}${hex(3)}-${hex(12)}`;
}

/** Why the composer is closed: the run ended, or nothing to talk to. Null when one may write. */
export function composerClosed(view: Pick<RunChatView, "active"> | null | undefined, target: ChatTarget | null): TextRef | null {
  if (!view) return null;
  if (!view.active) return { key: "runChat.ended" };
  if (!target) return { key: "runChat.noTarget" };
  return null;
}

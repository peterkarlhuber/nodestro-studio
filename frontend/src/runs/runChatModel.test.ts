import { describe, expect, it } from "vitest";

import type { ChatTarget, RunChatView, RunMessage } from "../api/types";
import {
  composerClosed,
  conversationEntries,
  decisionNumber,
  decisionView,
  hasOrchestrator,
  hasPendingQuestion,
  messageStatus,
  newClientId,
  pickTarget,
  questionsLeft,
  remainingBudget,
  steeringCode,
  targetKey,
  upsertMessage,
  withTargets,
  workingTeams,
} from "./runChatModel";

function chatMessage(overrides: Partial<RunMessage> = {}): RunMessage {
  return {
    id: "m1",
    run_id: "run_1",
    target_run_id: "run_1",
    node_id: "lead",
    seq: 1,
    kind: "question",
    content: "Wie weit seid ihr?",
    author: "u1",
    author_name: "Ana",
    created_at: "2026-11-01T10:00:00Z",
    status: "pending",
    status_at: "2026-11-01T10:00:00Z",
    code: null,
    step: null,
    decision: null,
    reply_to: null,
    answer_id: null,
    model: null,
    usage: null,
    snapshot_at: null,
    snapshot_digest: null,
    ...overrides,
  };
}

function chatTarget(overrides: Partial<ChatTarget> = {}): ChatTarget {
  return {
    run_id: "run_1",
    node_id: "lead",
    label: "Projektleitung",
    workflow_name: "Bericht",
    path: [],
    depth: 0,
    status: "running",
    decisions: 2,
    max_decisions: 8,
    steering: true,
    steering_code: null,
    teams: [
      { child_run_id: "c1", member: "research", name: "Recherche", status: "running", step: 1, slot: 0, task: "Quellen", working: ["Analyst"] },
      { child_run_id: "c2", member: "writing", name: "Text", status: "succeeded", step: 0, slot: 0, task: "Entwurf", working: [] },
    ],
    ...overrides,
  };
}

function chatView(overrides: Partial<RunChatView> = {}): RunChatView {
  return {
    run_id: "run_1",
    run_status: "running",
    active: true,
    targets: [chatTarget()],
    messages: [],
    limits: { budget_usd: 0.5, max_questions: 30, max_instructions: 20, max_messages: 200, max_pending_questions: 2, questions_per_minute: 6 },
    max_chars: 2000,
    remaining_budget_usd: 0.42,
    questions_left: 27,
    answer_model: "claude-haiku",
    ...overrides,
  };
}

describe("conversationEntries", () => {
  it("puts each answer under its question, in order, and filters by team leader", () => {
    const messages = [
      chatMessage({ id: "a1", seq: 3, kind: "answer", status: "answered", reply_to: "q1", content: "Gut." }),
      chatMessage({ id: "q1", seq: 1, status: "answered", answer_id: "a1" }),
      chatMessage({ id: "i1", seq: 2, kind: "instruction", status: "queued", content: "Kürzer bitte" }),
      chatMessage({ id: "x1", seq: 4, kind: "instruction", status: "queued", node_id: "other" }),
    ];
    const entries = conversationEntries(messages, "run_1:lead");
    expect(entries.map((entry) => entry.message.id)).toEqual(["q1", "i1"]);
    expect(entries[0].answer?.content).toBe("Gut.");
    expect(conversationEntries(messages, null).map((entry) => entry.message.id)).toEqual(["q1", "i1", "x1"]);
  });

  it("keeps an answer whose question is not in the view", () => {
    const entries = conversationEntries([chatMessage({ id: "a9", kind: "answer", reply_to: "gone", status: "answered" })], null);
    expect(entries).toHaveLength(1);
  });
});

describe("messageStatus", () => {
  it("says received and considered for instructions, never done", () => {
    expect(messageStatus(chatMessage({ kind: "instruction", status: "queued" }))?.text.key).toBe("runChat.status.queued");
    expect(messageStatus(chatMessage({ kind: "instruction", status: "delivered", step: 2 }))?.text).toEqual({
      key: "runChat.status.delivered",
      values: { n: 3 },
    });
    expect(messageStatus(chatMessage({ kind: "instruction", status: "considered", step: 0 }))?.text.values).toEqual({ n: 1 });
    expect(messageStatus(chatMessage({ kind: "instruction", status: "considered" }))?.text.key).toBe("runChat.status.consideredPlain");
    const expired = messageStatus(chatMessage({ kind: "instruction", status: "expired", code: "run_chat.run_ended" }));
    expect(expired?.code).toBe("run_chat.run_ended");
    expect(expired?.tone).toBe("warning");
  });

  it("shows questions pending, answered and failed with the reason", () => {
    expect(messageStatus(chatMessage())?.busy).toBe(true);
    expect(messageStatus(chatMessage({ status: "failed", code: "run_chat.answer_failed" }))?.code).toBe("run_chat.answer_failed");
    expect(messageStatus(chatMessage({ kind: "answer", status: "answered" }))).toBeNull();
  });
});

describe("decisions and activity", () => {
  it("names the teams of the decision as the team leader shows them", () => {
    const view = decisionView(
      chatMessage({ kind: "instruction", status: "considered", decision: { action: "parallel", members: ["research", "legal"], accepted: true, reason: "" } }),
      chatTarget().teams,
    );
    expect(view).toEqual({ actionKey: "runChat.decision.action.parallel", teams: ["Recherche", "legal"], accepted: true });
    expect(decisionView(chatMessage({ decision: { action: "weird", members: [], accepted: false, reason: "" } }), [])?.actionKey).toBe(
      "runChat.decision.action.other",
    );
  });

  it("counts working teams and numbers decisions from 1", () => {
    expect(workingTeams(chatTarget()).map((team) => team.member)).toEqual(["research"]);
    expect(decisionNumber(null)).toBeNull();
    expect(decisionNumber(4)).toBe(5);
  });
});

describe("targets", () => {
  it("keeps the chosen team leader and otherwise prefers one that steers and runs", () => {
    const done = chatTarget({ node_id: "a", status: "succeeded", steering: false, steering_code: "run_chat.orchestrator_finished" });
    const live = chatTarget({ node_id: "b" });
    expect(pickTarget([done, live], null)?.node_id).toBe("b");
    expect(pickTarget([done, live], targetKey(done))?.node_id).toBe("a");
    expect(pickTarget([], null)).toBeNull();
  });

  it("reads why a team leader takes no instructions as an error code", () => {
    expect(steeringCode(chatTarget())).toBeNull();
    expect(steeringCode(chatTarget({ steering: false, steering_code: "run_chat.steering_unattended" }))).toBe("run_chat.steering_unattended");
    expect(steeringCode(chatTarget({ steering: false, steering_code: "imported" }))).toBe("run_chat.imported_run");
    expect(steeringCode(chatTarget({ steering: false, steering_code: null }))).toBe("run_chat.steering_off");
  });

  it("finds orchestrators in the run's workflow", () => {
    expect(hasOrchestrator({ workflow: { nodes: [{ type: "orchestrator" }] } } as never)).toBe(true);
    expect(hasOrchestrator({ workflow: { nodes: [{ type: "agent" }] } } as never)).toBe(false);
    expect(hasOrchestrator(null)).toBe(false);
  });
});

describe("view updates", () => {
  it("replaces a message by id and keeps the order", () => {
    const messages = upsertMessage([chatMessage({ id: "a", seq: 2 }), chatMessage({ id: "b", seq: 1 })], chatMessage({ id: "a", seq: 2, status: "answered" }));
    expect(messages.map((item) => `${item.id}:${item.status}`)).toEqual(["b:pending", "a:answered"]);
  });

  it("takes the run state of a targets event", () => {
    const view = withTargets(chatView(), [], { run_status: "succeeded", active: false });
    expect(view.active).toBe(false);
    expect(view.run_status).toBe("succeeded");
    expect(withTargets(chatView(), []).active).toBe(true);
  });

  it("knows pending questions, what is left and when the composer is closed", () => {
    expect(hasPendingQuestion(chatView({ messages: [chatMessage()] }))).toBe(true);
    expect(remainingBudget(chatView({ remaining_budget_usd: null as never }))).toBeNull();
    expect(remainingBudget(chatView())).toBe(0.42);
    expect(questionsLeft(chatView({ questions_left: undefined as never }))).toBeNull();
    expect(composerClosed(chatView({ active: false }), chatTarget())?.key).toBe("runChat.ended");
    expect(composerClosed(chatView(), null)?.key).toBe("runChat.noTarget");
    expect(composerClosed(chatView(), chatTarget())).toBeNull();
  });
});

describe("newClientId", () => {
  it("matches the API's id pattern, also without crypto.randomUUID", () => {
    const pattern = /^[A-Za-z0-9._:-]{1,100}$/;
    expect(newClientId()).toMatch(pattern);
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true });
    try {
      const id = newClientId();
      expect(id).toMatch(pattern);
      expect(id).not.toBe(newClientId());
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: original, configurable: true });
    }
  });
});

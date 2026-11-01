import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Attachment, ChatMessage, Conversation, Handover, WorkflowIn } from "../api/types";
import { AttachmentBar, offerRequest } from "./AttachmentBar";
import { handoverPath } from "./handover";
import { draftFingerprint, useAssistant } from "./store";
import { applyReplyEvent } from "./useConversation";

const WORKFLOW: WorkflowIn = {
  name: "Blog",
  description: "",
  budget_usd: null,
  nodes: [{ id: "start", type: "start", label: "Start", position: { x: 0, y: 0 } }],
  edges: [],
} as unknown as WorkflowIn;

function answer(): ChatMessage {
  return {
    id: "msg_1",
    conversation_id: "chat_1",
    seq: 2,
    role: "assistant",
    content: "",
    status: "streaming",
    error: null,
    context: [],
    sources: [],
    handovers: [],
    steps: [],
    usage: null,
    estimated: false,
    model: null,
    language: "de",
    reply_to: "msg_0",
    attempts: 1,
    created_at: "2026-10-28T10:00:00Z",
    finished_at: null,
  };
}

function conversation(attachments: Partial<Attachment>[] = []): Conversation {
  return {
    id: "chat_1",
    title: "",
    auto_title: true,
    created_at: "2026-10-28T10:00:00Z",
    updated_at: "2026-10-28T10:00:00Z",
    usage: {} as Conversation["usage"],
    messages: 0,
    history: [],
    streaming: null,
    attachment_states: attachments.map((item, index) => ({
      id: `att_${index}`,
      kind: "workflow",
      ref_id: "wf_1",
      label: "Blog",
      variant: "saved",
      version: "v1",
      snapshot_id: `snap_${index}`,
      added_at: "2026-10-28T10:00:00Z",
      refreshed_at: null,
      paths: [],
      include_content: false,
      truncated: false,
      secrets: 0,
      notes: [],
      state: "current",
      ...item,
    })),
  };
}

function reset() {
  useAssistant.setState({ open: false, wide: false, conversationId: null, view: "chat", offers: {}, dismissed: [], pending: null, handover: null, drafts: {} });
}

describe("assistant store", () => {
  beforeEach(reset);

  it("keeps offers per view and removes them with the view", () => {
    const { offer } = useAssistant.getState();
    offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog" });
    offer("run", { kind: "run", refId: "run_1", label: "Lauf" });
    expect(Object.keys(useAssistant.getState().offers)).toEqual(["editor", "run"]);
    offer("editor", null);
    expect(Object.keys(useAssistant.getState().offers)).toEqual(["run"]);
  });

  it("opens the panel with a chosen object only on an explicit request", () => {
    useAssistant.getState().offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog" });
    expect(useAssistant.getState().pending).toBeNull();
    expect(useAssistant.getState().open).toBe(false);
    useAssistant.getState().discuss({ kind: "workflow", ref_id: "wf_1", variant: "saved" });
    expect(useAssistant.getState()).toMatchObject({ open: true, pending: { kind: "workflow", ref_id: "wf_1" } });
  });

  it("shows a dismissed offer again when the user asks to discuss it", () => {
    const offer = { kind: "workflow" as const, refId: "wf_1", label: "Blog", dirty: true, draft: () => WORKFLOW };
    useAssistant.getState().dismiss(offer);
    expect(useAssistant.getState().dismissed).toEqual(["workflow:wf_1"]);
    useAssistant.getState().reveal(offer);
    expect(useAssistant.getState()).toMatchObject({ open: true, dismissed: [], pending: null });
  });

  it("forgets dismissed offers in a new conversation and remembers the panel", () => {
    useAssistant.getState().dismiss({ kind: "run", refId: "run_1", label: "Lauf" });
    useAssistant.getState().setOpen(true);
    useAssistant.getState().setConversation("chat_2");
    expect(useAssistant.getState().dismissed).toEqual([]);
    expect(JSON.parse(localStorage.getItem("nodestro-assistant") ?? "{}")).toEqual({ open: true, wide: false, conversationId: "chat_2" });
  });

  it("hands a proposal only to the view that accepts it", () => {
    const handover = { id: "h1", target: "tool_builder", instruction: "Ein Tool" } as Handover;
    useAssistant.getState().startHandover(handover);
    expect(useAssistant.getState().takeHandover((item) => item.target === "workflow_architect")).toBeNull();
    expect(useAssistant.getState().handover).toBe(handover);
    expect(useAssistant.getState().takeHandover((item) => item.target === "tool_builder")).toBe(handover);
    expect(useAssistant.getState().handover).toBeNull();
  });
});

describe("assistant helpers", () => {
  it("builds the request for the saved version or the draft", () => {
    const offer = { kind: "workflow" as const, refId: "wf_1", label: "Blog", dirty: true, draft: () => WORKFLOW };
    expect(offerRequest(offer, false)).toEqual({ kind: "workflow", ref_id: "wf_1", variant: "saved", workflow: null });
    expect(offerRequest(offer, true)).toEqual({ kind: "workflow", ref_id: "wf_1", variant: "draft", workflow: WORKFLOW });
  });

  it("ignores moved nodes in the draft fingerprint", () => {
    const moved = { ...WORKFLOW, nodes: WORKFLOW.nodes.map((node) => ({ ...node, position: { x: 50, y: 80 } })) };
    expect(draftFingerprint(moved)).toBe(draftFingerprint(WORKFLOW));
    expect(draftFingerprint({ ...WORKFLOW, name: "Blog 2" })).not.toBe(draftFingerprint(WORKFLOW));
  });

  it("opens handovers where the existing function lives", () => {
    const base = { id: "h", instruction: "x", attachment_id: null, variant: null, workflow_name: null };
    expect(handoverPath({ ...base, target: "tool_builder", mode: null, workflow_id: null })).toBe("/tools?tab=generate");
    expect(handoverPath({ ...base, target: "workflow_architect", mode: "create", workflow_id: "wf_1" })).toBe("/");
    expect(handoverPath({ ...base, target: "workflow_architect", mode: "revise", workflow_id: "wf_1" })).toBe("/workflows/wf_1");
    expect(handoverPath({ ...base, target: "agent_designer", mode: null, workflow_id: "wf_1" })).toBe("/workflows/wf_1");
  });

  it("applies live events to the answer", () => {
    let message = answer();
    message = applyReplyEvent(message, { seq: 1, message_id: "msg_1", type: "step", text: "", data: { kind: "docs_search", detail: "Judge" } });
    message = applyReplyEvent(message, { seq: 2, message_id: "msg_1", type: "delta", text: "Hallo ", data: {} });
    message = applyReplyEvent(message, { seq: 3, message_id: "msg_1", type: "delta", text: "Welt", data: {} });
    message = applyReplyEvent(message, {
      seq: 4,
      message_id: "msg_1",
      type: "source",
      text: "",
      data: { ref: "agenten#qualitaet", chapter_title: "Agenten", title: "Qualität", link: "/docs/agenten#qualitaet" },
    });
    expect(message.content).toBe("Hallo Welt");
    expect(message.steps.map((step) => [step.kind, step.detail])).toEqual([["docs_search", "Judge"]]);
    expect(message.sources[0].link).toBe("/docs/agenten#qualitaet");
    const final = { ...message, status: "complete" as const };
    expect(applyReplyEvent(message, { seq: 5, message_id: "msg_1", type: "finished", text: "", data: { message: final } })).toBe(final);
  });
});

describe("context suggestions", () => {
  const fetchSpy = vi.fn();
  beforeEach(() => {
    reset();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const renderBar = (data: Conversation | undefined, onAttach = vi.fn()) => {
    render(<AttachmentBar conversation={data} busy={false} onAttach={onAttach} onRefresh={vi.fn()} onDetach={vi.fn()} />);
    return onAttach;
  };

  it("suggests the open object without sending anything", () => {
    useAssistant.getState().offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog" });
    const onAttach = renderBar(undefined);
    expect(screen.getByTestId("assistant-suggestion")).toHaveTextContent("Vorschlag");
    expect(screen.getByTestId("assistant-suggestion")).toHaveTextContent("Blog");
    expect(onAttach).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("suggestion-add"));
    expect(onAttach).toHaveBeenCalledWith({ kind: "workflow", ref_id: "wf_1", variant: "saved", workflow: null });
  });

  it("lets the user choose between the saved version and the draft", () => {
    useAssistant.getState().offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog", dirty: true, draft: () => WORKFLOW });
    const onAttach = renderBar(undefined);
    expect(screen.getByTestId("suggestion-add")).toHaveTextContent("Gespeicherte Version");
    fireEvent.click(screen.getByTestId("suggestion-add-draft"));
    expect(onAttach).toHaveBeenCalledWith(expect.objectContaining({ variant: "draft", workflow: WORKFLOW }));
  });

  it("does not suggest attached objects, except the draft of an attached saved version", () => {
    useAssistant.getState().offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog" });
    renderBar(conversation([{}]));
    expect(screen.queryByTestId("assistant-suggestion")).toBeNull();
    expect(screen.getByTestId("assistant-attachment")).toHaveTextContent("Blog");

    act(() => useAssistant.getState().offer("editor", { kind: "workflow", refId: "wf_1", label: "Blog", dirty: true, draft: () => WORKFLOW }));
    expect(screen.queryByTestId("suggestion-add")).toBeNull();
    expect(screen.getByTestId("suggestion-add-draft")).toBeInTheDocument();
  });

  it("marks attachments that changed or no longer exist", () => {
    renderBar(conversation([{ state: "changed" }, { id: "att_x", ref_id: "wf_2", label: "Alt", state: "missing" }]));
    const [changed, missing] = screen.getAllByTestId("assistant-attachment");
    expect(changed).toHaveTextContent("geändert");
    expect(changed.querySelector("[data-testid=attachment-refresh]")).not.toBeNull();
    expect(missing).toHaveTextContent("nicht mehr vorhanden");
    expect(missing.querySelector("[data-testid=attachment-refresh]")).toBeNull();
  });
});

describe("the panel takes the focus only when the user opens it (AX-11)", () => {
  it("counts openings, not closings or an open state from the last visit", () => {
    useAssistant.setState({ open: false, focusRequest: 0 });
    useAssistant.getState().toggle();
    expect(useAssistant.getState().focusRequest).toBe(1);
    useAssistant.getState().setOpen(true);
    expect(useAssistant.getState().focusRequest).toBe(1);
    useAssistant.getState().toggle();
    expect(useAssistant.getState()).toMatchObject({ open: false, focusRequest: 1 });
    useAssistant.getState().setOpen(true);
    expect(useAssistant.getState().focusRequest).toBe(2);
    useAssistant.getState().setOpen(false);
  });
});

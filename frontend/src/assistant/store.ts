// The Nodestro Assistant's state in the browser: the panel, the open conversation, what the
// current view offers as context, and handovers on their way to an existing function.
//
// Offers are only suggestions. Nothing is sent to the AI until the user adds an object (a
// click on "Add" in the panel, "Discuss with assistant" in a view, or the picker); the
// backend then takes a snapshot, and only attached snapshots travel with a message.

import { create } from "zustand";

import type { AttachRequest, AttachmentKind, Handover, WorkflowIn } from "../api/types";

/** An object the current view could add to the chat, e.g. the workflow open in the editor. */
export interface ContextOffer {
  kind: AttachmentKind;
  refId: string;
  label: string;
  /** Editor objects: unsaved changes exist, so the user picks the saved version or the draft. */
  dirty?: boolean;
  /** The editor's current (unsaved) workflow, read at the moment the user adds the draft. */
  draft?: () => WorkflowIn;
  /** Only the draft exists (e.g. an agent added in the editor and not saved yet). */
  draftOnly?: boolean;
}

const STORAGE = "nodestro-assistant";

interface Persisted {
  open: boolean;
  wide: boolean;
  conversationId: string | null;
}

function load(): Persisted {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) ?? "{}") as Partial<Persisted>;
    return { open: Boolean(value.open), wide: Boolean(value.wide), conversationId: value.conversationId ?? null };
  } catch {
    return { open: false, wide: false, conversationId: null };
  }
}

function save(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {
    // storage may be unavailable (private mode)
  }
}

export interface AssistantState extends Persisted {
  view: "chat" | "list";
  /** Offers of the views on screen, by a key of the view (e.g. "editor", "editor-node"). */
  offers: Record<string, ContextOffer>;
  /** Offers the user dismissed in this conversation ("<kind>:<refId>"). */
  dismissed: string[];
  /** An object the user chose with "Discuss with assistant"; the panel attaches it. */
  pending: AttachRequest | null;
  /** A proposal the user opened; the target view takes it (and clears it). */
  handover: Handover | null;
  /** Fingerprints of attached editor drafts, to notice later edits in the editor. */
  drafts: Record<string, string>;

  setOpen: (open: boolean) => void;
  toggle: () => void;
  setWide: (wide: boolean) => void;
  setView: (view: "chat" | "list") => void;
  setConversation: (id: string | null) => void;
  offer: (key: string, offer: ContextOffer | null) => void;
  dismiss: (offer: ContextOffer) => void;
  discuss: (request: AttachRequest) => void;
  /** Open the panel with a (possibly dismissed) offer shown, so the user picks saved or draft. */
  reveal: (offer: ContextOffer) => void;
  clearPending: () => void;
  startHandover: (handover: Handover) => void;
  takeHandover: (accept: (handover: Handover) => boolean) => Handover | null;
  rememberDraft: (attachmentId: string, fingerprint: string) => void;
}

export const offerKey = (offer: Pick<ContextOffer, "kind" | "refId">) => `${offer.kind}:${offer.refId}`;

export const useAssistant = create<AssistantState>((set, get) => {
  const persist = () => {
    const { open, wide, conversationId } = get();
    save({ open, wide, conversationId });
  };
  return {
    ...load(),
    view: "chat",
    offers: {},
    dismissed: [],
    pending: null,
    handover: null,
    drafts: {},

    setOpen: (open) => {
      set({ open });
      persist();
    },
    toggle: () => {
      set({ open: !get().open });
      persist();
    },
    setWide: (wide) => {
      set({ wide });
      persist();
    },
    setView: (view) => set({ view }),
    setConversation: (conversationId) => {
      set({ conversationId, dismissed: [], view: "chat" });
      persist();
    },
    offer: (key, offer) =>
      set((state) => {
        const offers = { ...state.offers };
        if (offer) offers[key] = offer;
        else delete offers[key];
        return { offers };
      }),
    dismiss: (offer) => set((state) => ({ dismissed: [...state.dismissed, offerKey(offer)] })),
    discuss: (request) => {
      set({ pending: request, open: true, view: "chat" });
      persist();
    },
    reveal: (offer) => {
      set((state) => ({ open: true, view: "chat", dismissed: state.dismissed.filter((key) => key !== offerKey(offer)) }));
      persist();
    },
    clearPending: () => set({ pending: null }),
    startHandover: (handover) => set({ handover }),
    takeHandover: (accept) => {
      const handover = get().handover;
      if (!handover || !accept(handover)) return null;
      set({ handover: null });
      return handover;
    },
    rememberDraft: (attachmentId, fingerprint) =>
      set((state) => ({ drafts: { ...state.drafts, [attachmentId]: fingerprint } })),
  };
});

/** A stable fingerprint of an editor workflow, to notice changes after it was attached. */
export function draftFingerprint(workflow: WorkflowIn): string {
  const text = JSON.stringify({ ...workflow, nodes: workflow.nodes.map(({ position: _position, ...node }) => node) });
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (Math.imul(31, hash) + text.charCodeAt(index)) | 0;
  return `${text.length}:${hash}`;
}

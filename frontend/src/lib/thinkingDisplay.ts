import { useCallback, useSyncExternalStore } from "react";

// How reasoning (thinking text, reasoning summaries) is shown while models work. A preference of the browser like the
// theme: kept in localStorage, never sent to the server and never part of a workflow or a conversation. It changes
// only what is shown; what a provider transmits is decided by the agent (Anthropic's thinking display) and by the
// workspace setting "reasoning summaries" (OpenAI, Gemini).

/** live: the text shows (opened) while it arrives; collapsed: closed, opened on demand; status: never the text. */
export type ThinkingDisplay = "live" | "collapsed" | "status";
/** A conversation's own choice, or "default" to follow the global one. */
export type ThinkingDisplayChoice = ThinkingDisplay | "default";

export const THINKING_DISPLAYS: ThinkingDisplay[] = ["live", "collapsed", "status"];
export const THINKING_DISPLAY_KEY = "nodestro-thinking-display";
export const THINKING_SCOPES_KEY = "nodestro-thinking-display-scopes";
/** The default: the activity shows live, the text one click away (reasoning can be long and is not the answer). */
export const DEFAULT_THINKING_DISPLAY: ThinkingDisplay = "collapsed";
/** At most this many conversations keep their own choice (the oldest choices are forgotten first). */
const MAX_SCOPES = 200;

const listeners = new Set<() => void>();

function isDisplay(value: unknown): value is ThinkingDisplay {
  return typeof value === "string" && (THINKING_DISPLAYS as string[]).includes(value);
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage may be unavailable (private mode)
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage may be unavailable (private mode): the choice holds until the page is reloaded
  }
  cache = null;
  listeners.forEach((listener) => listener());
}

/** The stored global choice. */
export function storedThinkingDisplay(): ThinkingDisplay {
  const value = read(THINKING_DISPLAY_KEY);
  return isDisplay(value) ? value : DEFAULT_THINKING_DISPLAY;
}

/** The stored per-conversation choices, newest last (a damaged entry counts as none). */
export function storedScopes(): Record<string, ThinkingDisplay> {
  try {
    const parsed = JSON.parse(read(THINKING_SCOPES_KEY) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, value]) => isDisplay(value))) as Record<
      string,
      ThinkingDisplay
    >;
  } catch {
    return {};
  }
}

export function setThinkingDisplay(value: ThinkingDisplay): void {
  write(THINKING_DISPLAY_KEY, value === DEFAULT_THINKING_DISPLAY ? null : value);
}

/** Give ``scope`` (e.g. "conversation:<id>", "run-chat:<run id>") its own choice, or "default" to follow the global. */
export function setScopedThinkingDisplay(scope: string, choice: ThinkingDisplayChoice): void {
  const scopes = storedScopes();
  delete scopes[scope];
  if (choice !== "default") scopes[scope] = choice;
  const entries = Object.entries(scopes).slice(-MAX_SCOPES);
  write(THINKING_SCOPES_KEY, entries.length ? JSON.stringify(Object.fromEntries(entries)) : null);
}

interface Snapshot {
  global: ThinkingDisplay;
  scopes: Record<string, ThinkingDisplay>;
}

let cache: Snapshot | null = null;

function snapshot(): Snapshot {
  cache ??= { global: storedThinkingDisplay(), scopes: storedScopes() };
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THINKING_DISPLAY_KEY || event.key === THINKING_SCOPES_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage); // another tab changed it
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const SERVER: Snapshot = { global: DEFAULT_THINKING_DISPLAY, scopes: {} };

/**
 * The display that applies in ``scope`` (its own choice, else the global one), the scope's own choice and a setter
 * for it. Without a scope the setter changes the global choice.
 */
export function useThinkingDisplay(scope?: string): {
  display: ThinkingDisplay;
  choice: ThinkingDisplayChoice;
  global: ThinkingDisplay;
  setChoice: (choice: ThinkingDisplayChoice) => void;
} {
  const current = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  const own = scope ? current.scopes[scope] : undefined;
  const setChoice = useCallback(
    (choice: ThinkingDisplayChoice) => {
      if (scope) setScopedThinkingDisplay(scope, choice);
      else setThinkingDisplay(choice === "default" ? DEFAULT_THINKING_DISPLAY : choice);
    },
    [scope],
  );
  return { display: own ?? current.global, choice: scope ? (own ?? "default") : current.global, global: current.global, setChoice };
}

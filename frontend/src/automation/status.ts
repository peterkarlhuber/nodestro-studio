import type { BatchItemStatus, BatchStatus, BenchmarkStatus } from "../api/types";
import type { Tone } from "../lib/format";

export const BATCH_TONE: Record<BatchStatus | BenchmarkStatus, Tone> = {
  running: "running",
  evaluating: "running",
  paused: "warning",
  finished: "success",
  cancelled: "warning",
  stopped: "danger",
  interrupted: "danger",
};

export const ITEM_TONE: Record<BatchItemStatus, Tone> = {
  pending: "idle",
  invalid: "danger",
  running: "running",
  paused: "warning",
  succeeded: "success",
  failed: "danger",
  cancelled: "warning",
  skipped: "idle",
};

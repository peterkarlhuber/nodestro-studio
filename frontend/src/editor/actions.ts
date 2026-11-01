// Editor actions shared by the canvas (keyboard) and the inspectors (buttons).

import { toast } from "../components/toast";
import i18n from "../i18n";
import { useEditor } from "./store";

/** Removes nodes at once (Delete, the bin icon) and offers to undo it in a toast, since every node carries settings. */
export function removeWithUndo(ids: string[]): void {
  const state = useEditor.getState();
  const removed = state.nodes.filter((node) => ids.includes(node.id));
  if (!removed.length) return;
  state.removeNodes(ids);
  const message =
    removed.length === 1
      ? i18n.t("editor.canvas.removedOne", { name: removed[0].label || i18n.t(`editor.nodes.${removed[0].type}`) })
      : i18n.t("editor.canvas.removedMany", { count: removed.length });
  // Undo only while the removal is still the last step (another edit since then would be undone instead).
  const step = useEditor.getState().past.at(-1);
  toast.undoable(message, () => {
    if (useEditor.getState().past.at(-1) === step) useEditor.getState().undo();
  });
}

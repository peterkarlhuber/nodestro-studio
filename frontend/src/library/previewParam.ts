// The open example preview lives in the URL (?template=<id>), so it can be linked, Back closes it, and Back from
// the editor after a copy returns to the gallery instead of reopening the preview (OB-10).

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const PUSHED = "examplePreview";

function pushed(state: unknown): boolean {
  return Boolean(state && typeof state === "object" && (state as Record<string, unknown>)[PUSHED]);
}

export function usePreviewParam(name = "template") {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const without = () => {
    const next = new URLSearchParams(params);
    next.delete(name);
    return next;
  };
  return {
    open: params.get(name),
    /** Opens the preview as a history entry of its own. */
    show: (id: string) => {
      const next = new URLSearchParams(params);
      next.set(name, id);
      setParams(next, { state: { [PUSHED]: true } });
    },
    /** Closes it: back to the gallery entry it was opened from, or (a deep link) the gallery without it. */
    close: () => {
      if (pushed(location.state)) navigate(-1);
      else setParams(without(), { replace: true });
    },
    /** Leaves for the copy: the preview's entry becomes the editor, so Back shows the gallery, not the preview. */
    leave: (to: string) => navigate(to, { replace: true }),
  };
}

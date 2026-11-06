// Mounts a dialog the first time it opens and keeps it mounted afterwards (ST-004, F3). Opening the editor then does
// not pay for dialogs nobody opened, while a dialog that was opened keeps its state and its running requests exactly
// as before (closing never unmounts it).

import { type ReactNode, useState } from "react";

export function MountWhenOpened({ open, children }: { open: boolean; children: ReactNode }) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened || open ? <>{children}</> : null;
}

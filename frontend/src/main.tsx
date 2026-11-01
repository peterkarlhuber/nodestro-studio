import "@xyflow/react/dist/base.css";
import "./styles/midnight-citron.css";
import "./styles/app.css";
import "./styles/onboarding.css";
import "./styles/admin.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./i18n";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

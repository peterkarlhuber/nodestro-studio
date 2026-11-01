import type { RouteObject } from "react-router-dom";

import { currentLanguage } from "./i18n";
import { AppShell } from "./layout/AppShell";
import { AgentsPage } from "./pages/AgentsPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { BatchDetailPage, BatchesPage } from "./pages/BatchesPage";
import { ExamplesPage } from "./pages/ExamplesPage";
import { ExecutionsPage } from "./pages/ExecutionsPage";
import { KnowledgePage } from "./pages/KnowledgePage";
import { MemoryPage } from "./pages/MemoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RunComparePage } from "./pages/RunComparePage";
import { RunDetailPage } from "./pages/RunDetailPage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SuitePage, TestsPage } from "./pages/TestsPage";
import { ToolsPage } from "./pages/ToolsPage";
import { UsagePage } from "./pages/UsagePage";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { studioLoader } from "./welcome/firstVisit";

// The docs load on first visit, together with the chapters of the current language only
// (so the page shows complete; other languages load when the user switches).
async function loadDocsPage() {
  const [{ DocsPage }] = await Promise.all([
    import("./pages/DocsPage"),
    import("./docs").then(({ loadChapters }) => loadChapters(currentLanguage())),
  ]);
  return { Component: DocsPage };
}

// The editor carries the canvas (@xyflow/react) and the code editor, so it loads on first visit.
// The router keeps the current page until the code is there, so nothing blinks in between.
async function loadEditorPage() {
  const { EditorPage } = await import("./pages/EditorPage");
  return { Component: EditorPage };
}

// The welcome page is a page of its own outside the Studio frame; its code loads on first visit.
async function loadWelcomePage() {
  const { WelcomePage } = await import("./welcome/WelcomePage");
  return { Component: WelcomePage };
}

export const routes: RouteObject[] = [
  { path: "welcome", lazy: loadWelcomePage, HydrateFallback: () => null },
  {
    element: <AppShell />,
    // Sends the very first visit of the bare start page to /welcome (once per browser).
    loader: studioLoader,
    HydrateFallback: () => null,
    children: [
      { index: true, element: <WorkflowsPage /> },
      { path: "workflows/examples", element: <ExamplesPage /> },
      { path: "workflows/:id", lazy: loadEditorPage },
      { path: "agents", element: <AgentsPage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "knowledge", element: <KnowledgePage /> },
      { path: "memory", element: <MemoryPage /> },
      { path: "executions", element: <ExecutionsPage /> },
      { path: "executions/compare", element: <RunComparePage /> },
      { path: "executions/:id", element: <RunDetailPage /> },
      { path: "approvals", element: <ApprovalsPage /> },
      { path: "batches", element: <BatchesPage /> },
      { path: "batches/:id", element: <BatchDetailPage /> },
      { path: "tests", element: <TestsPage /> },
      { path: "tests/:id", element: <SuitePage /> },
      { path: "schedules", element: <SchedulesPage /> },
      { path: "usage", element: <UsagePage /> },
      { path: "docs", lazy: loadDocsPage },
      { path: "docs/:chapter", lazy: loadDocsPage },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

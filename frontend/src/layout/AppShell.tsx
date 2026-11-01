import {
  Activity,
  BookMarked,
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  Command,
  Diamond,
  FlaskConical,
  Hand,
  KeyRound,
  Layers,
  type LucideIcon,
  Menu,
  Moon,
  Orbit,
  Rows3,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAccess } from "../api/access";
import { useApprovals, useSettings, useToolApprovals } from "../api/hooks";
import logoSmall from "../assets/brand/nodestro-logo-64.png";
import { AssistantPanel } from "../assistant/AssistantPanel";
import { useAssistant } from "../assistant/store";
import { LoginProblemNotice, ReadOnlyNotice, UserMenu } from "../components/Access";
import { Toaster } from "../components/toast";
import { Hint, Segmented } from "../components/ui";
import { isLanguage, setLanguage, storedLanguage } from "../i18n";
import { setDefaultModel } from "../lib/defaults";
import { anyProviderConfigured, missingProviders, providerOf } from "../lib/providers";
import { useTheme } from "../lib/theme";
import { GlobalSearch } from "./GlobalSearch";

interface NavItem {
  to: string;
  /** Key below "nav." in the language files. */
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** A count shown next to the label (e.g. approvals waiting for a decision). */
  badge?: number;
}

// Groups follow the task flow: build a workflow, run and review it, then automate and test it.
const BUILD: NavItem[] = [
  { to: "/", label: "workflows", icon: Diamond, end: true },
  { to: "/agents", label: "agents", icon: Bot },
  { to: "/tools", label: "tools", icon: Command },
  { to: "/knowledge", label: "knowledge", icon: BookOpen },
  { to: "/memory", label: "memory", icon: Brain },
];

const RUN_AND_REVIEW: NavItem[] = [
  { to: "/executions", label: "executions", icon: Rows3 },
  { to: "/approvals", label: "approvals", icon: Hand },
  { to: "/usage", label: "usage", icon: Activity },
];

const AUTOMATE_AND_TEST: NavItem[] = [
  { to: "/tests", label: "tests", icon: FlaskConical },
  { to: "/batches", label: "batches", icon: Layers },
  { to: "/schedules", label: "schedules", icon: CalendarClock },
];

const HELP_ITEMS: NavItem[] = [
  { to: "/docs", label: "docs", icon: BookMarked },
  { to: "/welcome", label: "welcome", icon: Orbit },
];

/** The official Nodestro logo, small enough for the top bar. */
export function BrandMark() {
  return <img className="brand__mark" src={logoSmall} alt="" width={28} height={28} />;
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const { t } = useTranslation();
  return (
    <div className="nav-group">
      <div className="nav-group__title">{title}</div>
      {items.map(({ to, label, icon: Icon, end, badge }) => (
        // The title names the item when the navigation shows icons only (narrow windows, assistant open).
        <NavLink key={to} to={to} end={end} title={t(`nav.${label}`)} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Icon size={16} aria-hidden />
          {t(`nav.${label}`)}
          {badge ? (
            <span className="nav-item__badge" aria-label={t("nav.waiting", { count: badge })}>
              {badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </div>
  );
}

/**
 * Phones: the navigation is a menu that the button in the top bar opens and closes (wider windows always show it).
 * It closes on Escape, on a click beside it and when a page is chosen.
 */
function usePhoneNav() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.(".sidebar, .nav-toggle")) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);
  return { open, setOpen, toggle };
}

export function AppShell() {
  const { t } = useTranslation();
  const phoneNav = usePhoneNav();
  const [theme, setTheme] = useTheme();
  const settings = useSettings();
  const access = useAccess();
  const approvals = useApprovals();
  const toolApprovals = useToolApprovals();
  const waiting = (approvals.data?.length ?? 0) + (toolApprovals.data?.filter((item) => item.status === "pending").length ?? 0);
  // New agents use the default model: without its provider nothing runs.
  const missingKey = missingProviders(settings.data, [settings.data?.default_model]).length > 0;
  // With another provider set up the problem is the default model, not a missing provider (OB-03).
  const providerChip = anyProviderConfigured(settings.data)
    ? t("shell.defaultProviderMissing", { provider: t(`providers.names.${providerOf(settings.data?.default_model ?? "")}`) })
    : t("shell.providerMissing");
  const defaultModel = settings.data?.default_model;
  const savedLanguage = settings.data?.language;
  useEffect(() => {
    if (defaultModel) setDefaultModel(defaultModel);
  }, [defaultModel]);
  useEffect(() => {
    // A language chosen in another browser applies here too, unless this browser has its own choice.
    // A failed fetch of its texts keeps the current language; the settings page can try again.
    if (isLanguage(savedLanguage) && !storedLanguage()) setLanguage(savedLanguage).catch(() => undefined);
  }, [savedLanguage]);
  const assistantOpen = useAssistant((state) => state.open);
  const assistantWide = useAssistant((state) => state.wide);
  useEffect(() => {
    // Ctrl/Cmd+J opens and closes the assistant from anywhere.
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        useAssistant.getState().toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const frame = assistantOpen ? `app app--assistant ${assistantWide ? "app--assistant-wide" : ""}` : "app";
  return (
    <div className={frame}>
      <a className="skip-link" href="#main">
        {t("shell.skipToContent")}
      </a>
      <header className="topbar">
        <button
          ref={phoneNav.toggle}
          type="button"
          className="nav-toggle icon-button"
          aria-expanded={phoneNav.open}
          aria-controls="main-navigation"
          aria-label={phoneNav.open ? t("a11y.nav.close") : t("a11y.nav.open")}
          onClick={() => phoneNav.setOpen(!phoneNav.open)}
          data-testid="nav-toggle"
        >
          {phoneNav.open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
        <Link to="/" className="brand" aria-label={t("shell.home")}>
          <BrandMark />
          <span className="brand__name">
            nodestro<span className="brand__dot">.</span>
          </span>
          <span className="brand__sub">Studio</span>
        </Link>
        <GlobalSearch />
        <div className="topbar__right">
          {missingKey ? (
            <Link to="/settings" className="nd-badge nd-badge--warning" title={providerChip} data-testid="provider-chip">
              <KeyRound size={11} aria-hidden /> <span className="topbar__badge-label">{providerChip}</span>
            </Link>
          ) : null}
          <Hint id="assistant.open">
            <button
              type="button"
              className={`assistant-toggle ${assistantOpen ? "active" : ""}`}
              aria-pressed={assistantOpen}
              aria-label={t("assistant.toggle")}
              onClick={() => useAssistant.getState().toggle()}
              data-testid="assistant-toggle"
            >
              <Sparkles size={15} aria-hidden />
              <span className="assistant-toggle__label">{t("assistant.title")}</span>
            </button>
          </Hint>
          <UserMenu />
          <Segmented
            label={t("shell.theme")}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "dark", label: t("shell.dark"), icon: Moon },
              { value: "light", label: t("shell.light"), icon: Sun },
            ]}
          />
        </div>
      </header>
      <nav
        id="main-navigation"
        className={phoneNav.open ? "sidebar sidebar--open" : "sidebar"}
        aria-label={t("shell.mainNavigation")}
      >
        <NavGroup title={t("nav.groupBuild")} items={BUILD} />
        <NavGroup
          title={t("nav.groupRun")}
          items={RUN_AND_REVIEW.map((item) => (item.label === "approvals" ? { ...item, badge: waiting || undefined } : item))}
        />
        <NavGroup title={t("nav.groupAutomate")} items={AUTOMATE_AND_TEST} />
        <NavGroup title={t("nav.groupHelp")} items={HELP_ITEMS} />
        <div className="sidebar__bottom">
          <NavLink to="/settings" title={t("nav.settings")} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Settings size={16} aria-hidden />
            {t("nav.settings")}
          </NavLink>
          {/* "Runs only on your computer" is true for the desktop app only; a server says where the data is instead. */}
          {access.profile === "desktop" ? (
            <div className="sidebar__note">
              <strong>{t("shell.privateTitle")}</strong>
              <span>{t("shell.privateText")}</span>
            </div>
          ) : access.profile === "server" ? (
            <div className="sidebar__note" data-testid="server-note">
              <strong>{t("admin.server.title")}</strong>
              <span>{t("admin.server.text")}</span>
            </div>
          ) : null}
        </div>
      </nav>
      <main id="main" className="content">
        <LoginProblemNotice />
        <ReadOnlyNotice />
        <Outlet />
      </main>
      {assistantOpen ? <AssistantPanel /> : null}
      <Toaster />
    </div>
  );
}

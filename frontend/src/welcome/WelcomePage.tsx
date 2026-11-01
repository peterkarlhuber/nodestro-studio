import "./welcome.css";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Bot,
  KeyRound,
  CalendarClock,
  Command,
  Diamond,
  Globe2,
  type LucideIcon,
  Moon,
  Pause,
  Play,
  Plug,
  Rows3,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSettings } from "../api/hooks";
import logo from "../assets/brand/nodestro-logo-512.webp";
import { Toaster, toast } from "../components/toast";
import { LANGUAGE_NAMES, LANGUAGES, type Language, currentLanguage, setLanguage } from "../i18n";
import { anyProviderConfigured } from "../lib/providers";
import { useTheme } from "../lib/theme";
import { Constellation } from "./Constellation";
import { markWelcomeSeen } from "./firstVisit";
import { useInView, useReducedMotion } from "./motion";
import { RunIllustration, stageOf, useRunPhases } from "./RunIllustration";

export const SLOGAN = ["Connecting", "Intelligence"] as const;

const PROVIDERS = ["Anthropic", "OpenAI", "Google Gemini", "Ollama", "vLLM"];

const CAPABILITIES: { id: string; to: string; icon: LucideIcon }[] = [
  { id: "workflows", to: "/", icon: Diamond },
  { id: "agents", to: "/agents", icon: Bot },
  { id: "tools", to: "/tools", icon: Command },
  { id: "knowledge", to: "/knowledge", icon: BookOpen },
  { id: "executions", to: "/executions", icon: Rows3 },
  { id: "automation", to: "/tests", icon: CalendarClock },
];

const PRINCIPLES: { id: string; icon: LucideIcon }[] = [
  { id: "local", icon: ShieldCheck },
  { id: "providers", icon: Globe2 },
  { id: "integration", icon: Plug },
];

const STAGES = ["design", "run", "trace"] as const;

/** The slogan, set word by word so each word can rise into place. It is never translated. */
function Slogan({ as: Tag = "h1", id, className }: { as?: "h1" | "h2"; id?: string; className: string }) {
  return (
    <Tag id={id} className={className}>
      {SLOGAN.map((word, index) => (
        <Fragment key={word}>
          {index > 0 ? " " : null}
          <span className="wl-slogan__word" style={{ ["--w" as string]: index }}>
            <span>{word}</span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}

/** Before the first run: workflows need a connection to an AI model; shown only while none is set up (OB-01). */
function ModelNote() {
  const { t } = useTranslation();
  const settings = useSettings();
  if (!settings.data || anyProviderConfigured(settings.data)) return null;
  return (
    <p className="wl-model-note" data-testid="welcome-model-note">
      <KeyRound size={13} aria-hidden /> {t("welcome.hero.modelNeeded")} <Link to="/settings">{t("welcome.hero.modelNeededLink")}</Link>
    </p>
  );
}

/** Language, theme and motion: the same stored choices the Studio uses, so both stay in step. */
function Controls({ motion, onMotion, reduced }: { motion: boolean; onMotion: (value: boolean) => void; reduced: boolean }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();
  const queryClient = useQueryClient();
  const remember = useMutation({
    mutationFn: (language: Language) => api.saveSettings({ language }),
    onSuccess: (data) => queryClient.setQueryData(keys.settings, data),
    onError: toast.error,
  });
  const language = currentLanguage();
  const [loading, setLoading] = useState(false);
  return (
    <div className="wl-controls" role="group" aria-label={t("welcome.toolbar")}>
      <label className="wl-language">
        <span className="sr-only">{t("welcome.language")}</span>
        <Globe2 size={14} aria-hidden />
        <select
          value={language}
          disabled={loading}
          aria-busy={loading || undefined}
          onChange={async (event) => {
            const next = event.target.value as Language;
            // Every language but English is fetched on first use; the picker waits for it.
            setLoading(true);
            try {
              await setLanguage(next);
            } catch (error) {
              toast.errorAbout(t("settings.language.loadFailed"), error);
              return;
            } finally {
              setLoading(false);
            }
            remember.mutate(next);
          }}
          data-testid="welcome-language"
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="wl-icon-button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={`${t("shell.theme")}: ${theme === "dark" ? t("shell.light") : t("shell.dark")}`}
        title={theme === "dark" ? t("shell.light") : t("shell.dark")}
        data-testid="welcome-theme"
      >
        {theme === "dark" ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
      </button>
      {reduced ? null : (
        <button
          type="button"
          className="wl-icon-button"
          aria-pressed={!motion}
          onClick={() => onMotion(!motion)}
          aria-label={motion ? t("welcome.pauseMotion") : t("welcome.playMotion")}
          title={motion ? t("welcome.pauseMotion") : t("welcome.playMotion")}
          data-testid="welcome-motion"
        >
          {motion ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
        </button>
      )}
    </div>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <Link to="/welcome" className="wl-brand" aria-label={t("welcome.home")}>
      <img src={logo} alt="" width={36} height={36} />
      <span className="wl-brand__name">
        nodestro<span className="brand__dot">.</span>
      </span>
    </Link>
  );
}

function HowItWorks({ reduced }: { reduced: boolean }) {
  const { t } = useTranslation();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { phase, replay, playing } = useRunPhases(element, reduced);
  const active = stageOf(phase);
  return (
    <section id="how" className="wl-section wl-how" aria-labelledby="wl-how-title" ref={setElement}>
      <div className="wl-how__copy">
        <p className="wl-kicker">{t("welcome.how.kicker")}</p>
        <h2 id="wl-how-title" className="wl-h2">
          {t("welcome.how.title")}
        </h2>
        <p className="wl-body">{t("welcome.how.intro")}</p>
        <ol className="wl-stages">
          {STAGES.map((stage, index) => (
            <li key={stage} className={`wl-stages__item ${index === active ? "is-active" : ""}`} aria-current={index === active ? "step" : undefined}>
              <span className="wl-stages__index" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{t(`welcome.how.${stage}.title`)}</strong>
                <span>{t(`welcome.how.${stage}.text`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <RunIllustration phase={phase} onReplay={replay} busy={playing} />
    </section>
  );
}

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const [motionWanted, setMotionWanted] = useState(true);
  const [hero, setHero] = useState<HTMLElement | null>(null);
  const heroVisible = useInView(hero);
  const motion = motionWanted && !reduced;

  useEffect(() => {
    // Seeing this page counts as the first visit: the start page opens the Studio from now on.
    markWelcomeSeen();
  }, []);
  useEffect(() => {
    const previous = document.title;
    document.title = t("welcome.documentTitle");
    return () => {
      document.title = previous;
    };
  }, [t, i18n.language]);

  return (
    <div className="wl" data-motion={motion ? (heroVisible ? "on" : "offscreen") : "paused"} data-testid="welcome">
      <a className="skip-link" href="#wl-main">
        {t("welcome.skipToContent")}
      </a>
      <header className="wl-nav wl-shell">
        <Brand />
        <nav className="wl-nav__links" aria-label={t("welcome.home")}>
          <a href="#how">{t("welcome.howItWorks")}</a>
          <Link to="/docs">{t("welcome.docs")}</Link>
        </nav>
        <Controls motion={motionWanted} onMotion={setMotionWanted} reduced={reduced} />
        <Link to="/" className="nd-button nd-button--primary wl-nav__cta" data-testid="welcome-nav-studio">
          {t("welcome.openStudio")}
        </Link>
      </header>

      <main id="wl-main">
        <section className="wl-hero" aria-labelledby="wl-title" ref={setHero}>
          <div className="wl-hero__grid" aria-hidden />
          <div className="wl-shell wl-hero__inner">
            <p className="wl-eyebrow">{t("welcome.hero.eyebrow")}</p>
            <Constellation animate={motion} />
            <Slogan id="wl-title" className="wl-slogan" />
            <p className="wl-lede">{t("welcome.hero.lede")}</p>
            <div className="wl-actions">
              <Link to="/" className="nd-button nd-button--primary wl-cta" data-testid="welcome-open-studio">
                {t("welcome.openStudio")} <ArrowRight size={17} aria-hidden />
              </Link>
              <a href="#how" className="nd-button wl-cta wl-cta--quiet">
                {t("welcome.howItWorks")}
              </a>
            </div>
            <p className="wl-meta">
              <span className="wl-meta__local">
                <ShieldCheck size={13} aria-hidden /> {t("welcome.hero.local")}
              </span>
              <span className="wl-meta__providers">
                {t("welcome.hero.providers")} {PROVIDERS.join(" · ")}
              </span>
            </p>
            <ModelNote />
          </div>
        </section>

        <div className="wl-shell">
          <HowItWorks reduced={reduced} />

          <section className="wl-section" aria-labelledby="wl-capabilities-title">
            <p className="wl-kicker">{t("welcome.capabilities.kicker")}</p>
            <h2 id="wl-capabilities-title" className="wl-h2">
              {t("welcome.capabilities.title")}
            </h2>
            <ul className="wl-capabilities">
              {CAPABILITIES.map(({ id, to, icon: Icon }) => (
                <li key={id}>
                  <Link to={to} className="wl-capability">
                    <span className="wl-capability__icon">
                      <Icon size={18} aria-hidden />
                    </span>
                    <strong>{t(`welcome.capabilities.${id}.title`)}</strong>
                    <span className="wl-capability__text">{t(`welcome.capabilities.${id}.text`)}</span>
                    <span className="wl-capability__open">
                      {t("welcome.capabilities.open")} <ArrowRight size={13} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="wl-principles" aria-label={t("welcome.hero.eyebrow")}>
            {PRINCIPLES.map(({ id, icon: Icon }) => (
              <div key={id} className="wl-principle">
                <h3>
                  <Icon size={18} aria-hidden /> {t(`welcome.principles.${id}.title`)}
                </h3>
                <p>{t(`welcome.principles.${id}.text`)}</p>
              </div>
            ))}
          </section>

          <section className="wl-closing" aria-labelledby="wl-closing-title">
            <img src={logo} alt="" width={88} height={88} className="wl-closing__logo" loading="lazy" />
            <Slogan as="h2" className="wl-slogan wl-slogan--small" />
            <p id="wl-closing-title" className="wl-closing__title">
              {t("welcome.closing.title")}
            </p>
            <p className="wl-body">{t("welcome.closing.text")}</p>
            <div className="wl-actions">
              <Link to="/" className="nd-button nd-button--primary wl-cta">
                {t("welcome.openStudio")} <ArrowRight size={17} aria-hidden />
              </Link>
              <Link to="/workflows/examples" className="nd-button wl-cta wl-cta--quiet">
                {t("welcome.closing.examples")}
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="wl-footer wl-shell">
        <span className="wl-footer__brand">
          <img src={logo} alt="" width={20} height={20} loading="lazy" /> Nodestro · Connecting Intelligence
        </span>
        <span className="wl-footer__links">
          <Link to="/docs">
            <BookMarked size={13} aria-hidden /> {t("welcome.docs")}
          </Link>
          <Link to="/settings">{t("welcome.footer.settings")}</Link>
        </span>
      </footer>
      <Toaster />
    </div>
  );
}

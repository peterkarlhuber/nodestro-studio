// Small, token-styled building blocks used across the app.

import {
  AlertTriangle,
  Ban,
  BookOpen,
  Check,
  ChevronRight,
  CircleDashed,
  CirclePause,
  Hand,
  Info,
  OctagonMinus,
  Loader2,
  type LucideIcon,
  MoreHorizontal,
  SkipForward,
  X,
  XCircle,
} from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type Ref,
  type RefObject,
  type TextareaHTMLAttributes,
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { NodeStatus, RunStatus } from "../api/types";
import { useDocumentTitle } from "../lib/documentTitle";
import { STATUS_TONE, type Tone } from "../lib/format";
import { type HelpId, docPath, helpEntry } from "../lib/help";
import { HelpTip, Tooltip } from "./Tooltip";

export { HelpTip, Tooltip };

type ButtonVariant = "default" | "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  busy?: boolean;
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", icon: Icon, busy, size = "md", children, className = "", disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`nd-button nd-button--${variant} nd-button--${size} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <Loader2 className="spin" size={15} aria-hidden /> : Icon ? <Icon size={15} aria-hidden /> : null}
      {children}
    </button>
  );
});

/** An icon-only button; its label appears as a tooltip on hover and keyboard focus. */
export function IconButton({
  icon: Icon,
  label,
  className = "",
  ref,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; ref?: Ref<HTMLButtonElement> }) {
  return (
    <Tooltip content={label}>
      <button ref={ref} type="button" className={`icon-button ${className}`} aria-label={label} {...rest}>
        <Icon size={16} aria-hidden />
      </button>
    </Tooltip>
  );
}

/**
 * An icon button for an action that cannot be undone (deleting a run, a file, a key): the first
 * click turns it into a labelled "Delete?" button, the second click acts. Escape, leaving the
 * button or a few seconds without a click turn it back, so a stray click never deletes anything.
 */
export function ConfirmIconButton({
  icon,
  label,
  confirmLabel,
  onConfirm,
  busy,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  icon: LucideIcon;
  label: string;
  /** The text of the second step; "Delete?" by default. */
  confirmLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const iconRef = useRef<HTMLButtonElement | null>(null);
  // Escape and the second click hand the focus back to the icon button instead of dropping it to the page.
  const refocus = useRef(false);
  useEffect(() => {
    if (!armed) {
      if (refocus.current) iconRef.current?.focus();
      refocus.current = false;
      return;
    }
    confirmRef.current?.focus();
    const timer = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(timer);
  }, [armed]);
  if (!armed)
    return <IconButton ref={iconRef} icon={icon} label={label} onClick={() => setArmed(true)} disabled={busy} {...rest} />;
  return (
    <Button
      ref={confirmRef}
      size="sm"
      variant="danger"
      icon={icon}
      busy={busy}
      aria-label={`${label}: ${confirmLabel ?? t("common.confirmDelete")}`}
      onClick={() => {
        refocus.current = true;
        setArmed(false);
        onConfirm();
      }}
      onBlur={() => {
        if (!refocus.current) setArmed(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          refocus.current = true;
          setArmed(false);
        }
      }}
      {...rest}
    >
      {confirmLabel ?? t("common.confirmDelete")}
    </Button>
  );
}

/** What a blocked control offers instead: a link to where the cause can be fixed, or an action that shows it. */
export interface ReasonAction {
  label: string;
  /** An app route, e.g. "/settings". */
  to?: string;
  onClick?: () => void;
}

/**
 * A control that cannot be used right now and says why, visibly and next to it (TX-10). A native ``disabled``
 * button can neither be focused nor explain itself on touch, so the control stays focusable with
 * ``aria-disabled``, ignores clicks, and is described by the reason text. ``action`` links to the fix
 * (Settings, the node with the problem). Without a ``reason`` the control is passed through unchanged.
 */
export function DisabledReason({
  reason,
  action,
  children,
  placement = "before",
}: {
  reason?: ReactNode;
  action?: ReasonAction;
  children: ReactElement<{
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    "aria-disabled"?: boolean;
    "aria-describedby"?: string;
  }>;
  /** Where the reason sits: before the control (title bars) or below it (forms, dialog footers). */
  placement?: "before" | "below";
}) {
  const id = useId();
  if (!reason) return children;
  const control = cloneElement(children, {
    disabled: false,
    "aria-disabled": true,
    "aria-describedby": id,
    className: `${children.props.className ?? ""} is-blocked`.trim(),
    onClick: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });
  const actionElement = action ? (
    action.to ? (
      <Link to={action.to} className="disabled-reason__action" onClick={action.onClick}>
        {action.label}
      </Link>
    ) : (
      <button type="button" className="disabled-reason__action" onClick={action.onClick}>
        {action.label}
      </button>
    )
  ) : null;
  const note = (
    <span className="disabled-reason__note" data-testid="disabled-reason">
      <Info size={13} aria-hidden />
      <span id={id} className="disabled-reason__text">
        {reason}
      </span>
      {actionElement}
    </span>
  );
  return (
    <span className={`disabled-reason disabled-reason--${placement}`}>
      {placement === "before" ? note : null}
      {control}
      {placement === "below" ? note : null}
    </span>
  );
}

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  testId?: string;
}

/**
 * A "More" button that opens a short list of secondary actions (a title bar keeps its primary actions visible).
 * Arrow keys move between the items, Escape or a click outside closes the list and returns the focus.
 */
export function MenuButton({ label, items, icon = MoreHorizontal }: { label: string; items: MenuItem[]; icon?: LucideIcon }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!listRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const Icon = icon;
  return (
    <span className="menu-button">
      <Tooltip content={open ? null : label}>
        <button
          ref={buttonRef}
          type="button"
          className="icon-button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => setOpen(!open)}
        >
          <Icon size={16} aria-hidden />
        </button>
      </Tooltip>
      {open ? (
        <div
          ref={listRef}
          id={id}
          role="menu"
          aria-label={label}
          className="menu-button__list"
          onKeyDown={(event) => {
            const entries = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
            const index = entries.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              entries[(index + step + entries.length) % entries.length]?.focus();
            } else if (event.key === "Tab") {
              setOpen(false);
            }
          }}
        >
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className="menu-button__item"
                data-testid={item.testId}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {ItemIcon ? <ItemIcon size={14} aria-hidden /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </span>
  );
}

export function Badge({ tone = "idle", children, icon: Icon }: { tone?: Tone; children: ReactNode; icon?: LucideIcon }) {
  return (
    <span className={`nd-badge nd-badge--${tone}`}>
      {Icon ? <Icon size={11} aria-hidden /> : null}
      {children}
    </span>
  );
}

const STATUS_ICON: Record<NodeStatus | RunStatus, LucideIcon> = {
  idle: CircleDashed,
  waiting: CircleDashed,
  queued: CircleDashed,
  running: Loader2,
  succeeded: Check,
  failed: XCircle,
  skipped: SkipForward,
  blocked: OctagonMinus,
  awaiting_approval: Hand,
  paused: CirclePause,
  cancelled: Ban,
};

/** A status with text and symbol, never colour alone (design principle 4); hovering explains it. */
export function StatusBadge({ status, label }: { status: NodeStatus | RunStatus; label?: string }) {
  const { t } = useTranslation();
  const Icon = STATUS_ICON[status];
  return (
    <Tooltip content={t(`status.${status}.description`)}>
      <span className={`nd-badge nd-badge--${STATUS_TONE[status]}`} data-status={status}>
        <Icon size={11} className={status === "running" ? "spin" : undefined} aria-hidden />
        {label ?? t(`status.${status}.label`)}
      </span>
    </Tooltip>
  );
}

/**
 * What a `Field` tells the control inside it: the id its label points to and the id of its hint. The first
 * TextInput, TextArea or Select in the field claims the id, so every field gets an accessible name without
 * passing `htmlFor` and `id` by hand. A control with its own `id` keeps it, and the label points to that id.
 */
interface FieldControl {
  id: string;
  /** The `htmlFor` the field was given: then only the control with that id links itself. */
  explicit?: string;
  hintId?: string;
  /** Whether a control has already claimed the label (only the first one does). */
  owner: string | null;
  claim: (token: string, id: string) => void;
  release: (token: string) => void;
}

const FieldContext = createContext<FieldControl | null>(null);

/** Links a form control to the label and hint of the surrounding `Field`, if any. */
function useFieldControl(ownId: string | undefined, describedBy: string | undefined) {
  const field = useContext(FieldContext);
  const token = useId();
  const linkable = field && (!field.explicit || ownId === field.explicit);
  const id = ownId ?? (linkable ? field.id : undefined);
  const claim = linkable ? field.claim : undefined;
  const release = linkable ? field.release : undefined;
  useLayoutEffect(() => {
    if (!claim || !release || !id) return;
    claim(token, id);
    return () => release(token);
  }, [claim, release, token, id]);
  if (!field || field.owner !== token) return { id: ownId, describedBy };
  const hint = field.hintId;
  return { id, describedBy: [describedBy, hint].filter(Boolean).join(" ") || undefined };
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
  action,
  tip,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  /** Only needed for a control that is not a TextInput, TextArea or Select; those link themselves. */
  htmlFor?: string;
  action?: ReactNode;
  tip?: HelpId;
}) {
  const baseId = useId();
  const hintId = hint ? `${baseId}-hint` : undefined;
  const [owner, setOwner] = useState<{ token: string; id: string } | null>(null);
  const claim = useCallback(
    (token: string, id: string) =>
      setOwner((current) => (!current || current.token === token ? (current?.id === id ? current : { token, id }) : current)),
    [],
  );
  const release = useCallback((token: string) => setOwner((current) => (current?.token === token ? null : current)), []);
  const context = useMemo<FieldControl>(
    () => ({ id: htmlFor ?? `${baseId}-control`, explicit: htmlFor, hintId, owner: owner?.token ?? null, claim, release }),
    [htmlFor, baseId, hintId, owner, claim, release],
  );
  return (
    <div className="field">
      <div className="field__head">
        <span className="field__label">
          <label className="nd-field-label" htmlFor={htmlFor ?? owner?.id}>
            {label}
          </label>
          {tip ? <HelpTip id={tip} label={typeof label === "string" ? label : undefined} /> : null}
        </span>
        {action}
      </div>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Marks a field for the first focus of a dialog (see `Modal`): React applies `autoFocus` before the dialog opens. */
function autofocusMark(autoFocus: boolean | undefined) {
  return autoFocus ? { "data-autofocus": "" } : undefined;
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className = "", id, "aria-describedby": describedBy, ...rest },
  ref,
) {
  const control = useFieldControl(id, describedBy);
  return (
    <input
      ref={ref}
      className={`nd-input ${className}`}
      id={control.id}
      aria-describedby={control.describedBy}
      {...autofocusMark(rest.autoFocus)}
      {...rest}
    />
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = "", id, "aria-describedby": describedBy, ...rest }, ref) {
    const control = useFieldControl(id, describedBy);
    return (
      <textarea
        ref={ref}
        className={`nd-input nd-textarea ${className}`}
        id={control.id}
        aria-describedby={control.describedBy}
        {...autofocusMark(rest.autoFocus)}
        {...rest}
      />
    );
  },
);

export interface Option {
  value: string;
  label: string;
  hint?: string;
  group?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  id,
  "aria-describedby": describedBy,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const control = useFieldControl(id, describedBy);
  const groups = [...new Set(options.map((o) => o.group ?? ""))];
  const render = (items: Option[]) =>
    items.map((option) => (
      <option key={option.value} value={option.value} title={option.hint}>
        {option.label}
      </option>
    ));
  return (
    <select
      className="nd-input nd-select"
      id={control.id}
      aria-describedby={control.describedBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...autofocusMark(rest.autoFocus)}
      {...rest}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {groups.length > 1
        ? groups.map((group) => (
            <optgroup key={group} label={group}>
              {render(options.filter((o) => (o.group ?? "") === group))}
            </optgroup>
          ))
        : render(options)}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tip,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  tip?: HelpId;
}) {
  const id = useId();
  return (
    <div className="toggle">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle__switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle__thumb" />
      </button>
      <label htmlFor={id} className="toggle__label">
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </label>
      {tip ? <HelpTip id={tip} label={typeof label === "string" ? label : undefined} /> : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T;
  /** ``disabled`` closes one option (say why next to it); ``testId`` names it for browser tests. */
  options: { value: T; label: string; icon?: LucideIcon; disabled?: boolean; testId?: string }[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map(({ value: item, label: text, icon: Icon, disabled: off, testId }) => (
        <button
          key={item}
          type="button"
          role="radio"
          aria-checked={value === item}
          disabled={disabled || off}
          data-testid={testId}
          className={value === item ? "selected" : undefined}
          onClick={() => onChange(item)}
        >
          {Icon ? <Icon size={13} aria-hidden /> : null}
          <span className="segmented__label">{text}</span>
        </button>
      ))}
    </div>
  );
}

/** A collapsible group for progressive disclosure. */
/** Problems inside a section, shown in its summary line so they stay visible while it is closed. */
export interface SectionStatus {
  errors?: number;
  warnings?: number;
}

/**
 * A collapsible group (`<details>`). `defaultOpen` sets the state once, when the section mounts; after that the
 * section stays as the user left it, also when the computed default changes (for example after removing the last
 * item). Pass `open` and `onToggle` to control it from outside. Opening or closing never changes any data.
 */
export function Section({
  title,
  summary,
  children,
  defaultOpen = false,
  open,
  onToggle,
  status,
  icon: Icon,
  tip,
  id,
  className,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Controlled open state; leave it out for a section that keeps its own state. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  status?: SectionStatus;
  icon?: LucideIcon;
  tip?: HelpId;
  /** A stable name of the section, e.g. for remembering its state. */
  id?: string;
  /** Extra classes next to `section`, e.g. for a page's own frame. */
  className?: string;
}) {
  const { t } = useTranslation();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const errors = status?.errors ?? 0;
  const warnings = status?.warnings ?? 0;
  const classes = ["section", tip ? "section--tip" : "", className ?? ""].filter(Boolean).join(" ");
  const details = (
    <details
      className={classes}
      open={isOpen}
      data-section={id}
      onToggle={(event) => {
        const now = event.currentTarget.open;
        if (now === isOpen) return; // the event of a change React made itself
        if (open === undefined) setOwnOpen(now);
        onToggle?.(now);
      }}
    >
      <summary>
        <ChevronRight size={14} className="section__chevron" aria-hidden />
        {Icon ? <Icon size={15} aria-hidden className="section__icon" /> : null}
        <span className="section__title">{title}</span>
        {errors || warnings ? (
          <span className="section__status">
            {errors ? (
              <span className="section__status-item section__status-item--error">
                <XCircle size={12} aria-hidden /> {t("common.sectionErrors", { count: errors })}
              </span>
            ) : null}
            {warnings ? (
              <span className="section__status-item section__status-item--warning">
                <AlertTriangle size={12} aria-hidden /> {t("common.sectionWarnings", { count: warnings })}
              </span>
            ) : null}
          </span>
        ) : null}
        {summary ? <span className="section__summary">{summary}</span> : null}
      </summary>
      <div className="section__body">{children}</div>
    </details>
  );
  if (!tip) return details;
  // The help is a control of its own, so it may not sit inside the <summary> (a button in a button, AX-09). It
  // stands next to the summary at the end of the header row, which keeps room for it, and comes right before the
  // section in the keyboard order (after the summary it would only be reached behind an open section's content).
  return (
    <div className="section-frame">
      <span className="section__tip">
        <HelpTip id={tip} label={title} />
      </span>
      {details}
    </div>
  );
}

const FIELDS = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
const CONTROLS = `${FIELDS}, button:not([disabled]):not(.help-tip)`;
const FOCUSABLE = `${FIELDS}, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])`;

/** The first element matching `selector` that is rendered (a hidden file input cannot take the focus). */
function firstShown(root: HTMLElement, selector: string): HTMLElement | undefined {
  return [...root.querySelectorAll<HTMLElement>(selector)].find((element) => element.getClientRects().length > 0);
}

/**
 * A native modal dialog. Focus: on opening it goes to `initialFocus`, else to the first element marked with
 * `data-autofocus` (TextInput, TextArea and Select set it for `autoFocus`; on a container, its first control), else to the first focusable element
 * (the close button). On closing it returns to the element that had it before, e.g. the button that opened it.
 */
export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  wide,
  xl,
  initialFocus,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Nearly the whole window, e.g. for the Workflow Architect's canvas and log side by side. */
  xl?: boolean;
  /** The element to focus when the dialog opens, e.g. Cancel in a confirmation. */
  initialFocus?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && !dialog.contains(active) ? active : null;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    const marked = initialFocus?.current ?? dialog.querySelector<HTMLElement>("[data-autofocus]");
    // A marked container (e.g. a list of form fields) passes the focus to its first field, else its first button
    // (e.g. "Choose files"); help buttons are skipped.
    const target = marked?.matches(FOCUSABLE) ? marked : marked && (firstShown(marked, FIELDS) ?? firstShown(marked, CONTROLS));
    if (target && dialog.contains(target)) target.focus();
    return () => {
      if (dialog.open) {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      }
      // Give the focus back, unless something else has taken it in the meantime.
      const now = document.activeElement;
      const lost = !now || now === document.body || dialog.contains(now);
      if (lost && opener?.isConnected) opener.focus();
    };
    // initialFocus is read once, when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal--wide" : ""} ${xl ? "modal--xl" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
    >
      {/* Plain divs: a <header>/<footer> in a dialog would count as the page's banner or contentinfo landmark (F5). */}
      <div className="modal__head">
        <h2>{title}</h2>
        <IconButton icon={X} label={t("common.close")} onClick={onClose} />
      </div>
      <div className="modal__body">{children}</div>
      {footer ? <div className="modal__foot">{footer}</div> : null}
    </dialog>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  level = 2,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** h2 by default: an empty state usually sits right under the page title (heading order, AX-08); h1 when it is
   *  the whole page (not found). */
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon size={22} aria-hidden />
      </div>
      <Heading>{title}</Heading>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function Callout({ tone = "info", children }: { tone?: "info" | "warning" | "danger" | "brand"; children: ReactNode }) {
  const Icon = tone === "danger" ? XCircle : tone === "warning" ? AlertTriangle : Info;
  return (
    <div className={`callout callout--${tone}`} role={tone === "danger" ? "alert" : undefined}>
      <Icon size={15} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="spinner" role="status">
      <Loader2 size={18} className="spin" aria-hidden />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
}

export function Chip({ children, onRemove, icon: Icon }: { children: ReactNode; onRemove?: () => void; icon?: LucideIcon }) {
  const { t } = useTranslation();
  return (
    <span className="chip">
      {Icon ? <Icon size={11} aria-hidden /> : null}
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={t("common.removeItem", { name: String(children) })}>
          <X size={11} aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

export function Stat({ label, value, hint, tip }: { label: string; value: ReactNode; hint?: ReactNode; tip?: HelpId }) {
  return (
    <div className="stat">
      <span className="stat__label">
        {label}
        {tip ? <HelpTip id={tip} label={label} /> : null}
      </span>
      <strong className="stat__value">{value}</strong>
      {hint ? <span className="stat__hint">{hint}</span> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
  doc,
  documentTitle,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: ReactNode;
  /** A documentation chapter ("chapter" or "chapter#section") shown as a help link next to the title. */
  doc?: string;
  /** The name in the browser tab when it should say more than the title (default: the title). */
  documentTitle?: string;
}) {
  const { t } = useTranslation();
  useDocumentTitle(documentTitle ?? title);
  return (
    <header className="titlebar">
      <div>
        <div className="titlebar__title">
          <h1>{title}</h1>
          {doc ? <DocLink to={doc} label={t("common.docsFor", { title })} /> : null}
        </div>
        {crumbs ? <div className="breadcrumbs">{crumbs}</div> : null}
        {description ? <p className="titlebar__description">{description}</p> : null}
      </div>
      {actions ? <div className="title-actions">{actions}</div> : null}
    </header>
  );
}

/** A small book icon that opens a documentation chapter or section. */
export function DocLink({ to, label }: { to: string; label?: string }) {
  const { t } = useTranslation();
  const text = label ?? t("common.readInDocs");
  return (
    <Tooltip content={text}>
      <Link to={docPath(to)} className="doc-link" aria-label={text}>
        <BookOpen size={14} aria-hidden />
      </Link>
    </Tooltip>
  );
}

/** Wraps a button or value with a help text (help.<id> in the language files; hover and keyboard focus). */
export function Hint({ id, children }: { id: HelpId; children: Parameters<typeof Tooltip>[0]["children"] }) {
  const { t } = useTranslation();
  const help = helpEntry(t, id);
  return (
    <Tooltip content={help.text} doc={help.doc}>
      {children}
    </Tooltip>
  );
}

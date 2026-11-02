import logoOnDark from "../assets/brand/nodestro-logo-on-dark.png";
import logoOnLight from "../assets/brand/nodestro-logo.png";
import mark from "../assets/brand/nodestro-mark.png";
import markSmall from "../assets/brand/nodestro-mark-128.png";
import { useAppTheme } from "../lib/theme";

// The only place that knows the Nodestro logo files. Everything is derived from the official
// masters in /branding by scripts/derive_branding.py; never edit the PNGs by hand.
//
// - Lockup (symbol + wordmark): the wordmark is black on light surfaces and white on dark ones,
//   chosen from the app theme. The symbol's colours are the same in both files.
// - Symbol only: one file for every surface; used where the product name is already visible or
//   the space is small.
//
// Both images are decorative by default (alt=""): every place that shows them sits inside a link
// or next to text that already names Nodestro. Pass `label` when the image stands alone.

/** Width / height of the trimmed lockup files. */
export const LOCKUP_RATIO = 960 / 212;

export const BRAND_ASSETS = { logoOnLight, logoOnDark, mark, markSmall } as const;

interface LogoProps {
  /** Rendered height in CSS pixels; the width follows the official proportions. */
  height: number;
  className?: string;
  label?: string;
  /** Force a surface instead of following the app theme (e.g. a section that is always dark). */
  surface?: "light" | "dark";
}

export function BrandLogo({ height, className, label, surface }: LogoProps) {
  const theme = useAppTheme();
  const dark = (surface ?? theme) === "dark";
  return (
    <img
      className={className}
      src={dark ? logoOnDark : logoOnLight}
      alt={label ?? ""}
      height={height}
      width={Math.round(height * LOCKUP_RATIO)}
      decoding="async"
      draggable={false}
      data-brand-variant={dark ? "on-dark" : "on-light"}
    />
  );
}

interface MarkProps {
  size: number;
  className?: string;
  label?: string;
  loading?: "lazy" | "eager";
}

export function BrandMark({ size, className, label, loading }: MarkProps) {
  return (
    <img
      className={className}
      src={size <= 64 ? markSmall : mark}
      alt={label ?? ""}
      width={size}
      height={size}
      loading={loading}
      decoding="async"
      draggable={false}
    />
  );
}

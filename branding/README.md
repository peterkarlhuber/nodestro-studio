# Nodestro brand masters

The two PNGs in this folder are the official Nodestro logo as supplied by the brand owner (2026-11-02). They are
the only source of every logo, icon and favicon in this repository. Never edit them, never redraw the logo.

| File | Content |
|---|---|
| `nodestro-logo-transparent.png` | 2048 × 640, transparent background: lime symbol, black wordmark |
| `nodestro-logo-white.png` | The same artwork flattened on white (reference; verified identical by `--check`) |

## Derived files

`scripts/derive_branding.py` produces everything below. The same script is vendored unchanged in the other
repositories that ship a Nodestro, Orkexa or Axentra logo. The only pixel operations it performs are:
removing the light halo that the background knockout left on semi-transparent edge pixels, recolouring the
black wordmark to white for dark surfaces (alpha unchanged), trimming, padding and Lanczos resampling.

| File | Size | Use |
|---|---|---|
| `frontend/src/assets/brand/nodestro-logo.png` | 960 × 212 | Lockup, black wordmark: light surfaces |
| `frontend/src/assets/brand/nodestro-logo-on-dark.png` | 960 × 212 | Lockup, white wordmark: dark and coloured surfaces |
| `frontend/src/assets/brand/nodestro-mark.png` | 512 × 512 | Symbol only (any surface) |
| `frontend/src/assets/brand/nodestro-mark-128.png` | 128 × 128 | Symbol at small sizes |
| `frontend/public/favicon.ico` | 16, 32, 48 | Browser tab |
| `frontend/public/favicon-16.png`, `favicon-32.png` | 16, 32 | PNG favicons |
| `frontend/public/apple-touch-icon.png` | 180 | iOS home screen (opaque dark tile) |
| `frontend/public/icon-192.png`, `icon-512.png` | 192, 512 | Web app icons |
| `frontend/public/icon-maskable-512.png` | 512 | Maskable web app icon (symbol inside the safe zone) |

Use in code: `frontend/src/components/BrandLogo.tsx` (`BrandLogo` for the lockup, theme-matched; `BrandMark` for
the symbol). Do not import the PNGs elsewhere, do not recolour the logo with CSS filters, do not put it on a
white box.

## Regenerate

```sh
python scripts/derive_branding.py --product nodestro --masters branding --check
python scripts/derive_branding.py --product nodestro --masters branding \
  --out frontend/src/assets/brand --favicon-out frontend/public --sets web,favicons
```

The script writes `nodestro-mark-on-dark.png` only for products whose symbol needs a dark-surface variant
(Orkexa); Nodestro's lime symbol works on every surface. Requires Pillow and NumPy.

## GitHub social preview

`branding/social-preview.png` (1280 × 640) is the repository's GitHub social preview, uploaded by hand in the
repository settings. `scripts/social_preview.py` renders it; the same template is vendored unchanged in the
Orkexa and Axentra repositories, so all three previews share one layout: a dark background with a soft glow in
the brand colour, the white-wordmark lockup, a short accent rule and a one-line caption. Only the logo pixels come
from the master.

```sh
python scripts/social_preview.py --product nodestro --masters branding --out branding/social-preview.png \
  --caption "Visual studio for multi-agent workflows"
```

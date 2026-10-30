# Nodestro – Midnight Citron UI Design System (v1.0)

A consistent, provider-independent color system for the visual agent workflow editor. Dark mode is the default view;
light mode is an equivalent working view.

## Design principles

1. **Neutral canvas, clear connections.** Colored areas only for selection, primary actions and important status.
2. **Semantic tokens instead of hard-coded values.** The app references CSS variables such as `var(--nd-surface)`.
3. **Brand ≠ success.** Citron is brand, interaction and selection; green is success, blue is an execution in
   progress, amber is warning, coral is error.
4. **Status always with text and icon.** Color alone is not enough; tool and agent status must be readable without
   color vision.
5. **One base language for both modes.** The same components and spacing, but color values and contrasts adjusted per
   mode.
6. **Visually calm.** Prefer clear typography, few shadows and a dotted canvas instead of dense grids.

## Core colors

| Role | Dark | Light | Purpose |
|---|---|---|---|
| App background | `#151819` | `#F6F7F2` | Main frame |
| Workflow canvas | `#1A2020` | `#EDF0E9` | Canvas with subtle grid dots |
| Panel background | `#202625` | `#FAFBF7` | Sidebar, inspector, execution overview |
| Surface | `#252B2A` | `#FFFFFF` | Agent nodes, inputs, cards |
| Border | `#3B4640` | `#D4DDD2` | Separators and outlines |
| Primary text | `#F1F3ED` | `#1A251F` | Main content |
| Muted text | `#ADBAB1` | `#56685E` | Secondary information |
| Brand accent | `#BED372` | `#546B25` | Call to action, selected agents, active paths |
| Brand soft | `#303923` | `#EBF1D6` | Navigation selection, tool chips |
| Success | `#73D7AE` | `#126A50` | Finished successfully |
| Running | `#8CBDDE` | `#246B97` | Currently running |
| Warning | `#ECC179` | `#905614` | Needs attention |
| Danger | `#F1958B` | `#B43E3A` | Error, cancelled execution |
| Idle | `#AFBBB4` | `#63756A` | Waiting, not started yet |

All color values and additional hover, pressed and focus tokens are in `nodestro-midnight-citron.css` and
`nodestro-theme-tokens.json`.

## Workflow editor

### Top bar
- App identity: white or dark wordmark with a single citron accent.
- **Run workflow:** primary citron button with high text contrast.
- Other actions: neutral surface with a border.

### Canvas
- Muted canvas color with a fine dot grid (22px).
- Connection lines are neutral, and citron on active or selected paths.
- No permanent rainbow of agent type colors; types are distinguished by icon and title.

### Agent node
- Neutral surface and a clear border.
- Selected card: citron border plus a subtle focus ring.
- Node status at the bottom as a badge with its own semantic hue.
- Input and output ports are small and clearly recognizable; an active output may be citron.
- Tool count, model name and memory as quiet additional information.

### Panels
- Building blocks (left), inspector (right) and execution overview (bottom) use the panel background and are
  separated from the canvas by a 1px border line that doubles as a resize handle; it turns citron on hover, focus and
  while dragging.
- Each panel header has the same layout: a short uppercase title and an icon button that hides or shows the panel.
  A hidden side panel leaves a 44px rail.

### Inspector
- Configuration fields follow the same surface, border and text tokens.
- Primary parameters are visible immediately; additional options belong in collapsible groups.
- Tool assignments as subtle chips, no loud backgrounds.

### Execution overview
- Token usage, API calls and costs in calm statistic cards.
- Status is semantic and never based on color alone.

## Typography and shapes

- Font: Inter, falling back to the system sans-serif (no font files required).
- Monospace: system monospace for Python code, model IDs, logs, JSON.
- UI base: 14px; secondary text 12–13px; headings 16–20px; important metrics 20–24px.
- Border radius: 7px (controls), 11px (panels), 15px (nodes), 20px (larger areas).
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 px.
- Focus: a visible 2px ring via `--nd-focus`; not just a color change.
- Motion: short, 130–220ms; respect `prefers-reduced-motion`.

## Usage in the frontend

```html
<link rel="stylesheet" href="nodestro-midnight-citron.css" />
<html lang="en" data-theme="dark">
```

Switching the theme:

```js
document.documentElement.dataset.theme = "light"; // or "dark"
```

Component:

```css
.agent-card {
  color: var(--nd-text);
  background: var(--nd-surface);
  border: 1px solid var(--nd-border);
}
.agent-card[aria-selected="true"] {
  border-color: var(--nd-brand);
}
```

## Notes

- Colors were checked for contrast mathematically for typical foreground/background pairs. This does not replace a
  full WCAG review of the real interface (including small text, hover, icons, transparency and charts).
- The HTML preview is a **design prototype**, not an implemented workflow application. Both themes can be toggled;
  agents and execution data are sample data.
- The theme tokens are independent of React, Vue, Svelte or any other frontend framework.

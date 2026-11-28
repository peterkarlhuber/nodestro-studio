# The settings page: layout and conventions

The settings page (`frontend/src/pages/SettingsPage.tsx`) is one long page of sections. Its navigation, its search
and its "Advanced" parts read the page itself, so a new section needs no registration beyond following the
conventions below. This keeps the page open for sections that other features add.

## Layout

```
.page.settings-page                container (container query "settings-page")
  .page__body.settings-layout      grid: content | edge | navigation
    .settings#settings-content     the sections (each a direct <section> child)
    SettingsResizer                the draggable right edge of the content (role="separator")
    SettingsNav                    back link, search, reset width, "Go to section" select, section list
```

- **Width** (`pages/settingsWidth.ts`): the content is `--settings-width` wide (default 1120 px, 560–1800 px),
  shown as `min(stored width, room left)`. The person drags the edge or uses the keyboard on it (arrow keys,
  Shift for steps of 80 px, Home, End, double-click to reset). The width is a browser preference in
  `localStorage["nodestro-settings-width"]` (absent = default); reads and writes tolerate blocked storage.
- **Narrow room** (`styles/settings.css`, `@container settings-page (max-width: 940px)`): the navigation becomes a
  sticky bar above the content with the search and a "Go to section" select; the edge is hidden. The query looks at
  the page's own width, so the navigation rail, the assistant panel and the browser zoom all count.
- **Entry**: the gear in the top bar (`layout/AppShell.tsx`, `SettingsEntry`) is the only general entry; it links
  to `/settings?from=<current page>` (see `lib/settingsLink.ts`), and **Ctrl+,** / **⌘,** opens the settings or,
  on the settings, returns. Feature pages link to a section with `useSettingsHref("settings-…")`.

## Conventions for a section

1. A section is a direct child of `.settings`:
   `<section className="panel stack" aria-labelledby="settings-x"><h2 className="panel__title" id="settings-x">…`.
   The id starts with `settings-`. Without the `h2.panel__title[id]` the section is neither listed nor searchable.
2. Put the id into `SETTINGS_GROUPS` (`pages/SettingsNav.tsx`) to file it under *Setup*, *Costs*, *Tools and
   files* or *Maintenance*; otherwise it appears under *More*. If other pages link to it, add it to
   `SettingsSection` in `lib/settingsLink.ts` and to the global search's page list (`layout/GlobalSearch.tsx`).
3. Settings use the shared controls, which the search understands: `Field` (label, hint, `tip`), `Toggle` (label,
   description, `tip`), `Section` (collapsible, `tip`). A help icon (the shared `HelpTip` of `@nodestro/ui-core`) carries
   `data-help`, and the search reads that entry (title and text) from the studio's help registry
   (`lib/platformHelp.tsx`), so it also finds a setting by its help. Anything else that should be found gets
   `data-setting="Label"` and optionally `data-setting-text="…"`; parts that must not be found get
   `data-settings-search="skip"`.
4. Group related settings with `SettingsGroup` (an `h3`; `columns` puts short fields side by side on wide screens).
   Put expert settings into `SettingsAdvanced` (a closed `<details>` with an "Advanced" badge and a count of values
   that differ from the standard). Use `<details>` rather than conditional rendering for anything that can be
   hidden: content that is not rendered cannot be found, and a hit inside a closed part opens it. A part that is
   rendered only where it applies (an installation without it never shows it) goes into `CONDITIONAL` in
   `pages/SettingsSearch.tsx` with its section, help id and name: the search then finds it by its help text, leads
   to its section and says that the part is not shown right now.
5. A section with its own Save button keeps unsaved input when other sections save (see
   `pages/settingsModelsForm.ts`) and asks before the page is left (`UnsavedChangesModal`). The provider cards save
   on their own; a card with a typed key, address, capabilities or token limits that are not saved marks itself in
   `useUnsavedProviders`, and leaving the page asks first too.
6. The global search (Ctrl+K) lists every section of `layout/GlobalSearch.tsx`'s page list and, from three typed
   characters on, offers "Search the settings for …", which opens `/settings?search=…` with this page's search
   filled in.
7. Every visible string exists in all six languages; the search works in whatever language is shown.
8. A setting that `GET /api/settings/defaults` names (nodestro-api API-061) gets a `DefaultMark`
   (`pages/SettingsDefaults.tsx`) in the `action` of its `Field` or `Toggle`: a "Changed" badge while the shown
   value differs from the default, and a reset action whose tooltip and accessible name give the default. In a
   section with its own Save button the reset puts the default into the input; elsewhere it saves at once, like the
   control itself. An API without the route (404) shows no marks and no error; the mark is skipped by the search.

## Tooltips

The **?** icon is the shared `HelpTip` of `@nodestro/ui-core` (ST-068), with the studio's help registry
(`lib/platformHelp.tsx`: every id of `lib/help.ts` with its title `helpTitles.<id>`, text `help.<id>` and
documentation section). It opens on hover and keyboard focus, a press pins it; its panel follows the icon in the DOM
(inside a modal dialog it is part of the dialog) and is shown as a manual popover in the browser's top layer: above
modal dialogs (which `showModal()` puts into the top layer, where no z-index reaches) and outside every `overflow`
or `transform`. It stays inside the window (flips below, shifts sideways, scrolls when taller than the window),
Escape closes only the panel, and once pinned Tab leads from the icon into its documentation link and on to the next
control. `npm run lint` refuses a help button of the studio's own (`eslint.config.js`, `src/lint/helpGuard.test.ts`).
`components/Tooltip.tsx` keeps the tooltips of buttons and values (`Tooltip`, `Hint` for help ids) with the same
placement. Help texts should say what a setting does, what it needs and what follows from it, not repeat the label
or the hint beside it.

## Tests

- Unit: `pages/SettingsDefaults.test.tsx`, `pages/settingsWidth.test.ts`, `pages/settingsSearchIndex.test.ts`, `pages/SettingsResizer.test.tsx`,
  `pages/SettingsNav.test.tsx`, `pages/SettingsParts.test.tsx`, `pages/settingsModelsForm.test.ts`,
  `components/Tooltip.test.tsx`, `components/HelpTip.test.tsx`, `layout/settingsEntry.test.ts`.
- Browser: `frontend/e2e/settings-ui.mjs` (`scripts/e2e.sh settings-ui`): tooltips inside modal dialogs
  (`elementFromPoint`, window bounds, phone width, dark mode contrast, keyboard), the width (drag, keyboard,
  persistence, reset, 1280/1920/2560/800/375 px), the search (also in German), the settings entry and the "Changed"
  marks (reset into the input and saved at once, keyboard, 390 px light and dark, an API without the defaults route).

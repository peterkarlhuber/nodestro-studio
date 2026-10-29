# Nodestro – Midnight Citron UI Design System (v1.0)

Ein konsistentes, provider-unabhängiges Farbsystem für den visuellen Agenten-Workflow-Editor. Dunkler Modus ist die Standardansicht, der helle Modus ist eine gleichwertige Arbeitsansicht.

## Designprinzipien

1. **Neutrale Canvas, deutliche Verbindungen.** Farbige Flächen nur für Auswahl, Primäraktionen und wichtige Status.
2. **Semantische Tokens statt Hartcodierung.** Die App referenziert CSS-Variablen wie `var(--nd-surface)`.
3. **Brand ≠ Success.** Citron ist Brand/Interaktion/Auswahl, Grün ist Erfolg, Blau ist gerade laufende Ausführung, Bernstein Warnung, Koralle Fehler.
4. **Status immer mit Text und Symbol.** Farben allein reichen nicht; Tool-/Agentenstatus muss ohne Farbsehen lesbar sein.
5. **Eine Basissprache für beide Modi.** Gleiche Komponenten und Abstände, aber pro Modus angepasste Farbwerte und Kontraste.
6. **Visuell ruhig.** Bevorzugt klare Typografie, wenige Schatten und eine gepunktete Canvas statt dichter Gitternetze.

## Kernfarben

| Rolle | Dark | Light | Zweck |
|---|---|---|---|
| App background | `#151819` | `#F6F7F2` | Hauptrahmen |
| Workflow canvas | `#1A2020` | `#EDF0E9` | Arbeitsfläche + dezente Rasterpunkte |
| Panel background | `#202625` | `#FAFBF7` | Sidebar, Inspector, Ausführung |
| Surface | `#252B2A` | `#FFFFFF` | Agenten-Knoten, Eingaben, Karten |
| Border | `#3B4640` | `#D4DDD2` | Trennungen und Umrandungen |
| Primary text | `#F1F3ED` | `#1A251F` | Hauptinhalt |
| Muted text | `#ADBAB1` | `#56685E` | Sekundärinformation |
| Brand accent | `#BED372` | `#546B25` | CTA, ausgewählte Agenten, aktive Pfade |
| Brand soft | `#303923` | `#EBF1D6` | Navigationsauswahl, Toolchips |
| Success | `#73D7AE` | `#126A50` | Erfolgreich beendet |
| Running | `#8CBDDE` | `#246B97` | Wird gerade ausgeführt |
| Warning | `#ECC179` | `#905614` | Aufmerksamkeit erforderlich |
| Danger | `#F1958B` | `#B43E3A` | Fehler, abgebrochene Ausführung |
| Idle | `#AFBBB4` | `#63756A` | Wartend, noch nicht gestartet |

Alle Farbwerte und zusätzliche Hover-/Pressed-/Focus-Tokens befinden sich in `nodestro-midnight-citron.css` und `nodestro-theme-tokens.json`.

## Workflow-Editor

### Topbar
- App-Identität: weiß/dunkler Schriftzug, einzelner Citron-Akzent.
- **Run workflow:** primärer Citron-Button, hoher Kontrast für Text.
- Andere Aktionen: neutrale Oberfläche mit Rahmen.

### Canvas
- Gedämpfte Canvas-Farbe, feines Punkt-Raster (22px).
- Verbindungsleitungen neutral, bei aktiven oder ausgewählten Pfaden in Citron.
- Kein dauerhafter Regenbogen aus Agenten-Typfarben; Typ per Symbol und Titel unterscheiden.

### Agent Node
- Neutrale Oberfläche und klarer Rand.
- Ausgewählte Karte: Citron-Border plus dezenter Focus-Ring.
- Knotenstatus unten als Badge mit eigenem semantischen Farbton.
- In- und Output-Ports sind klein und klar erkennbar; aktiver Output darf Citron tragen.
- Toolanzahl, Modellname und Memory als leise Zusatzinfos.

### Inspector
- Konfigurationsfelder folgen gleichen Surface-/Border-/Text-Tokens.
- Primäre Parameter sind sofort sichtbar, zusätzliche Optionen gehören in aufklappbare Gruppen.
- Toolzuweisungen als dezente Chips, keine knalligen Hintergründe.

### Ausführungsübersicht
- Tokenverbrauch, API-Aufrufe und Kosten in ruhigen Statistik-Karten.
- Status semantisch, nie ausschließlich farbbasiert.

## Typografie und Formen

- Font: Inter, Fallback auf System-Sans (keine Fontdateien erforderlich).
- Monospace: System-Monospace für Python-Code, Modell-IDs, Logs, JSON.
- UI-Basis: 14px; sekundärer Text 12–13px; Überschriften 16–20px; wichtige Metriken 20–24px.
- Border radius: 7px (Kontrollen), 11px (Panels), 15px (Nodes), 20px (größere Flächen).
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 px.
- Fokus: sichtbarer 2px-Ring über `--nd-focus`; nicht nur Farbwechsel.
- Bewegung: kurz 130–220ms; `prefers-reduced-motion` respektieren.

## Verwendung im Frontend

```html
<link rel="stylesheet" href="nodestro-midnight-citron.css" />
<html lang="de" data-theme="dark">
```

Theme wechseln:

```js
document.documentElement.dataset.theme = "light"; // oder "dark"
```

Komponente:

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

## Hinweise

- Farben wurden für typische Vordergrund-/Hintergrund-Paare rechnerisch auf Kontrast überprüft. Das ersetzt keine umfassende WCAG-Prüfung der realen UI (inklusive kleiner Schrift, Hover, Icons, Transparenz, Diagrammen).
- Die HTML-Vorschau ist ein **Designprototyp**, keine implementierte Workflow-Anwendung. Umschaltbar sind die beiden Themes; Agenten und Ausführungsdaten sind Beispieldaten.
- Die Theme-Tokens sind unabhängig von React/Vue/Svelte oder einem anderen Frontend-Framework.

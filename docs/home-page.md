# Home Page Documentation

## Overview
The home page is the main entry point for the WB-Starter project. It showcases core features, stats, notifications, and audio. All content is validated against `home-page.schema.json` (schemaType: page).

## Page Generator
The home page is **auto-generated** from its schema. No hand-coded HTML.

**Script:** `scripts/generate-page-from-schema.mjs`

```
node scripts/generate-page-from-schema.mjs src/wb-models/home-page.schema.json pages/home.html
```

### How it works
1. Reads any `schemaType: "page"` schema
2. Walks `$layout.rows` top to bottom
3. For each row: outputs heading (h1/h2) then maps `content[]` names to `$view` entries
4. For each `$view` entry: outputs the tag with attributes from `properties` defaults
5. Validates output against `pageRules` (fragment, noInlineStyles, h1/h2 present)
6. Writes result to `data/page-from-schema-result.json`

### Flags
- `--dry-run` — prints HTML to stdout, does not write file
- Second argument overrides output path: `... pages/custom.html`

### Renderers
The generator has a renderer per component type found in `$view`:

| $view tag | Renderer | Data source |
|-----------|----------|-------------|
| wb-cardhero | renderHero | properties.hero.properties defaults |
| wb-container | renderContainer | properties.stats, properties.actions defaults + $view.children tree |
| wb-grid | renderGrid | properties.features defaults |
| wb-stack | renderStack | properties.notifications defaults (outputs wb-cardnotification) |
| wb-audio | renderAudio | properties.audio.properties defaults |

### Rules enforced at generation time
- Zero inline `style=` attributes (pageRules.noInlineStyles)
- Fragment only — no DOCTYPE, html, head, body
- Must contain `<h1>` and at least one `<h2>`

## Schema
- **File:** `src/wb-models/home-page.schema.json`
- **Type:** `page` (defines layout rows, not a component)
- **Validated by:** `tests/behaviors/ui/home-page-permutation.spec.ts` + `tests/pages/page-fragment-compliance.spec.ts`

### Key schema sections
- `pageRules` — fragment, showcase, noInlineStyles, noPageSpecificCSS
- `$layout` — row definitions with columns, width, headings, gap
- `$view` — component tree with tags, attributes, children
- `properties` — default values for all content (stats data, feature text, notification messages)
- `test.site` — assertions the generated page must pass (sections, layout, mobileFirst, fluent)
- `test.matrix` — 12 permutation combinations for component-level testing

## Layout ($layout)
Row-based system. Each row stacks vertically. Columns collapse to 1 on mobile (mobile-first).

| Row | Columns | Width | Heading | Content |
|-----|---------|-------|---------|---------|
| 0 | 1 | full-bleed | h1 (from hero title) | hero |
| 1 | 1 | 900px | "By the Numbers" (h2) | stats |
| 2 | 1 | 1200px | "Features" (h2) | features |
| 3 | 2 (60/40) | 1200px | "Live Demos" (h2) | notifications, audio |

## Page Rules
- `fragment: true` — no DOCTYPE/html/head/body (server wraps it)
- `showcase: false` — no wb-demo wrappers
- `noInlineStyles: true` — zero style= attributes in generated HTML
- `noPageSpecificCSS: true` — no page-specific CSS file

## Components

### Hero (wb-cardhero)
- Variant: cosmic
- Attributes: pretitle, title, subtitle, cta, cta-secondary
- The generator outputs an explicit `<h1>` before the hero tag

### Stats (wb-container > wb-row > wb-cardstats ×4)
- Four stats: 100+ Behaviors, Light DOM Only, <1s Build Time, 100% Standards
- Each wb-cardstats has value, label, icon attributes
- Action buttons below divider: Ripple (x-ripple), Tooltip (x-tooltip), Confetti (x-confetti), Copy (x-copy)

### Features (wb-grid > wb-card[variant=float] ×6)
- Six feature cards with emoji titles and descriptions
- Component Library, Behaviors System, Theme Engine, Data Viz, Accessible, Performance

### Notifications (wb-stack > wb-cardnotification ×4)
- Tag is `wb-cardnotification` (NOT notification-card — that tag does not exist)
- Attribute is `variant` (NOT type — variant is the v3.0 standard)
- All 4 variants: info, success, warning, error
- Each has title and message attributes

### Audio (wb-audio)
- Audio player with EQ visualization
- Attributes: src, show-eq (boolean presence), volume

## CSS Dependencies
- `src/styles/site.css` — provides `display: block` for wb-audio, wb-cardhero, wb-cardstats, notification-card
- `src/styles/behaviors/audio.css` — wb-audio's self-contained styles (.wb-audio class)
- `src/styles/behaviors/notification.css` — notification variant colors
- `.page-layout` class in site.css — flex column with gap for page sections

## Testing

### Delete / Recreate / Test cycle
The intended workflow:
1. Delete `pages/home.html`
2. Run `node scripts/generate-page-from-schema.mjs src/wb-models/home-page.schema.json`
3. Run tests — expect zero failures

### Test files
- **Schema permutation tests:** `tests/behaviors/ui/home-page-permutation.spec.ts`
  - Layout assertions (no wb-demo, no inline styles, fragment, section order)
  - Component assertions (tag counts, attributes, text content, hydration classes)
  - Mobile-first visual assertions (375px breakpoint, grid collapse, no overflow)
  - Fluent layout assertions (no builder artifacts, stat height, no horizontal scroll)
  - Interaction assertions (ripple, tooltip, confetti, copy buttons)
- **Fragment compliance:** `tests/pages/page-fragment-compliance.spec.ts`
  - No DOCTYPE, html, head, body, style blocks
  - No site.css/themes.css links, no WB.init()
  - Must have h1, at least one h2, max 3 inline styles

### Schema-driven test config (test.site)
- `sections` — tag, minInstances, checkAttributes, checkText per section
- `layout` — noWbDemo, noInlineStyles, isFragment, sectionOrder
- `mobileFirst` — breakpoint 375, noOverflow, gridCollapses, noHorizontalScroll
- `fluent` — noDashedBorders, noBuilderBackground, noForcedMinHeight, maxStatHeight 300, maxSectionGap 1000

## Card inventory
All 19 card types are defined in `src/wb-viewmodels/card.js` (~1900 lines). The home page uses: wb-cardhero, wb-cardstats, wb-card (base with variant=float), wb-cardnotification.

## RETIRED
- `page.schema.json` with `requiredZones` (.page__hero, .page__section) — archived to `archive/page.schema.json`
- `notification-card` tag — does not exist. Use `wb-cardnotification`
- `type` attribute on notifications — use `variant` (v3.0 standard)

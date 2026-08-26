# Card Component Overview

The wb-starter card system is built on **composition, not a class hierarchy, and on
semantic HTML, not custom tags**. A card is a plain `<article>` decorated with the
`card` behavior -- either automatically (`autoInject` is on by default site-wide,
`src/core/config.js`, and maps `article` → `card`) or explicitly via
`x-card`. Card variants -- `cardimage`, `cardhero`, `cardprofile`,
`cardstats`, `cardpricing`, and more -- are **independent behaviors**, not subclasses
of a shared base class (there is no such class). Instead they share the card's
semantic structure through Light-DOM markup and add only what is unique to their
purpose via their own `x-behavior` value and extra content.

<div x-demo>
<article title="Hello" variant="elevated">
  <p>Keep related information together in a clear, reusable surface.</p>
  <p><strong>Status:</strong> Ready to review</p>
</article>
</div>

## Card structure

Every card shares the same semantic regions:

- **Header:** Title, subtitle, and optional badge.
- **Main:** The primary card content (user-provided).
- **Footer:** Optional area for footer text or actions.
- **Variants:** Different visual styles (e.g., glass, elevated, clickable).

## Composition for specialized functionality

Each variant composes the shared card structure with the extra markup or behaviors it
needs -- nothing is inherited from a base class:

- `cardimage` composes an image section into the card layout.
- `cardhero` adds a hero banner region and optional call-to-action buttons.
- `cardprofile` composes avatar, user info, and social links.
- `cardstats` adds stat blocks or data visualizations.

Composition keeps variants flexible: new features are added to a specific card type
without affecting any other. Capabilities come from composing behaviors and markup --
the wb-starter way (Light DOM, `x-behavior`-driven, schema-driven properties).

The `card` behavior is the foundational card behavior in the wb-starter library,
designed for maximum flexibility, accessibility, and maintainability. Built on the
Light DOM architecture and the WBServices pattern, it provides a robust foundation for
dozens of card variants (image, hero, testimonial, product, etc.) while ensuring:

- **Consistent UI/UX:** All cards share a unified structure and behavior, making your app look and feel cohesive.
- **Modern Web Standards:** Semantic HTML, ES Modules, and schema-driven properties -- no custom element required.
- **Easy Customization:** Compose new card types with minimal code -- no base class to subclass.
- **Performance & Accessibility:** No Shadow DOM, so styles cascade naturally and accessibility is preserved.

This doc explains the core features, usage, and architectural choices behind the
`card` behavior and its variants.

## Overview

| Property | Value |
|----------|-------|
| Semantic Tag | `<article>` |
| Behavior | `card` |
| Root CSS Class | `x-card` |
| Category | Cards |
| Schema | `src/wb-models/card.schema.json` |

**This is the actual selling point**: `autoInject` is **on by default** site-wide
(`src/core/config.js`) -- a plain `<article>`, zero extra attributes, already becomes
a card automatically. Every example on this page adds `x-card` explicitly
anyway, so the markup stays self-documenting and keeps working exactly the same even
on a page that opts out via `WB.init({ autoInject: false })`.

## Card anatomy

An enhanced `<article>` renders into these named parts. Here it is live, then the
structure with every element labeled:

<div x-demo>
<article
  title="Title + Body"
  subtitle="A labeled content surface"
  badge="LIVE"
  footer="Updated just now"
  elevated>
  <p>The header, main content, and footer remain distinct in Light DOM.</p>
</article>
</div>

```text
<article>                          ← this is the CARD  (the root)
  <header class="x-card__header"> ← this is the HEADER
    <h3 class="x-card__title">    ← this is the TITLE   (from the `title` attribute)
    <div class="x-card__subtitle">← this is the SUBTITLE (optional)
    <span class="x-card__badge">  ← this is the BADGE    (optional)
  <main class="x-card__main">     ← this is MAIN — the BODY, where YOUR content goes
    <p>…</p>
  <footer class="x-card__footer"> ← this is the FOOTER   (optional)
</article>
```

| Part | Element / class | What it is |
|------|-----------------|-----------|
| **Card** | `<article>` | The root element |
| **Header** | `<header class="x-card__header">` | Holds the title, subtitle, and badge |
| **Title** | `<h3 class="x-card__title">` | The card heading — from the `title` attribute |
| **Subtitle** | `.x-card__subtitle` | Secondary heading — from `subtitle` (optional) |
| **Badge** | `.x-card__badge` | Small status pill (optional) |
| **Main** | `<main class="x-card__main">` | **Your content** — everything you put between the tags |
| **Footer** | `<footer class="x-card__footer">` | Footer text / actions — from `footer` (optional) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Card title in header |
| `subtitle` | string | `""` | Subtitle below title |
| `footer` | string | `""` | Footer text |
| `elevated` | boolean | `false` | Add drop shadow |
| `clickable` | boolean | `false` | Make entire card clickable |
| `variant` | string | `"default"` | Style: `default`, `glass`, `bordered`, `flat`, `rack` |
| `hoverable` | boolean | `true` | Enable hover effects |
| `tooltip` | string | `""` | Hover text shown as a themed WB tooltip (not the native browser `title` tooltip) |
| `hoverText` | string | `""` | Alias for `tooltip` (pre-existing name) |
| `badge` | string | `""` | Badge text in header |

## Usage

### Explicit x-card (Recommended)

<div x-demo>
<article
  title="Card Title"
  subtitle="Subtitle text">
  <p>Explicit and self-documenting -- works whether or not the page has autoInject on.</p>
  <p><strong>Tip:</strong> Keep the title specific to the content it introduces.</p>
</article>
</div>

### Relying on autoInject

With `autoInject` on (the site-wide default), the exact same markup works with zero
attributes at all -- shown here for comparison, not as the primary recommendation,
since dropping the explicit `x-card` only works while the page hasn't
opted out:

<div x-demo>
<article
  title="Semantic Card"
  subtitle="Enhanced automatically, no attributes needed">
  <p>autoInject maps a bare &lt;article&gt; to the card behavior by default.</p>
</article>
</div>

### With All Options

<div x-demo>
<article
  title="Featured Card"
  subtitle="A brief description"
  footer="Last updated: Today"
  elevated
  clickable
  variant="glass">
  <p>Review the latest release notes and open the project workspace.</p>
  <p><strong>Next step:</strong> Select the card to continue.</p>
</article>
</div>

### With a Tooltip

`tooltip` (alias: `hoverText`) shows a themed WB tooltip on hover -- not the
unstyled, slow, browser-inconsistent native `title` tooltip (#283):

<div x-demo>
<article
  title="Hover Me"
  tooltip="Extra detail shown on hover">
  <p>Hover this card to reveal a themed tooltip with supporting context.</p>
</article>
</div>

## Variants

### Default
<div x-demo>
<article title="Default Card">
  <p>Standard card styling keeps the content easy to scan.</p>
</article>
</div>

### Glass
<div x-demo>
<article
  title="Glass Card"
  variant="glass">
  <p>Frosted glass effect with blur for layered content.</p>
</article>
</div>

### Elevated
<div x-demo>
<article
  title="Elevated Card"
  elevated>
  <p>Use elevation to separate a focused task from the surrounding page.</p>
</article>
</div>

### Clickable
<div x-demo>
<article
  title="Click Me"
  clickable>
  <p>Click anywhere on this card to activate its interactive state.</p>
</article>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-card` | Always | Base styling |
| `.x-card--elevated` | `elevated` | Drop shadow |
| `.x-card--clickable` | `clickable` | Pointer cursor |
| `.x-card--hoverable` | `hoverable` | Hover effects |
| `.x-card--glass` | `variant="glass"` | Glass effect |
| `.x-card--active` | After click | Active state |

## CSS API (Custom Properties)

| Variable | Description | Default |
|----------|-------------|---------|
| `--bg-secondary` | Background color | `#1f2937` |
| `--border-color` | Border color | `#374151` |
| `--radius-lg` | Border radius | `8px` |
| `--shadow-elevated` | Elevated shadow | `0 4px 12px rgba(0,0,0,0.15)` |
| `--shadow-hover` | Hover shadow | `0 8px 24px rgba(0,0,0,0.2)` |

## Events

### wb:card:click
Fired when a clickable card is clicked.

```javascript
document.querySelector('article.x-card').addEventListener('click', (e) => {
  console.log('Card clicked');
});
```

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `button` | When clickable |
| `tabindex` | `0` | When clickable |

Keyboard support for clickable cards:
- `Enter` - Trigger click
- `Space` - Trigger click

## Methods

Available via JavaScript:

```javascript
import { card } from './wb-viewmodels/card.js';

const el = document.querySelector('article.x-card');

// Update properties
card.update?.(el, { title: 'New Title', elevated: true });
```

## Card Variants

Specialized variants build on the shared card structure. Each one is documented
separately and still uses its own custom tag today (`x-cardimage`, etc.) -- only
this base `card` behavior's own doc has been converted to semantic-only examples so
far:

| Variant | Purpose | Tag |
|---------|---------|-----|
| [cardimage](./cardimage.md) | Featured image | `<div x-cardimage>` |
| [cardhero](./cardhero.md) | Hero banner | `<div x-cardhero>` |
| [cardprofile](./cardprofile.md) | User profile | `<div x-cardprofile>` |
| [cardstats](./cardstats.md) | Statistics | `<div x-cardstats>` |
| [cardpricing](./cardpricing.md) | Pricing tier | `<div x-cardpricing>` |
| [cardbutton](./cardbutton.md) | Action buttons | `<div x-cardbutton>` |
| [cardlink](./cardlink.md) | Navigation link | `<div x-cardlink>` |

## Schema

Located at `src/wb-models/card.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "card.schema.json",
  "title": "Card Component",
  "behavior": "card",
  "baseClass": "x-card",
  "semanticElement": {
    "tagName": "article",
    "implicitRole": "article"
  },
  "properties": {
    "title": { "type": "string", "default": "" },
    "subtitle": { "type": "string", "default": "" },
    "footer": { "type": "string", "default": "" },
    "elevated": { "type": "boolean", "default": false },
    "clickable": { "type": "boolean", "default": false },
    "variant": { 
      "type": "string", 
      "enum": ["default", "glass", "bordered", "flat"],
      "default": "default" 
    }
  }
}
```

## Related

- [Cards Overview](./cards.index.md) - All card components
- [Article Element](../semantic/article.md) - Semantic foundation

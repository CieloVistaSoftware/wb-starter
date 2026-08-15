# Card Component Overview

The wb-starter card system is built on **composition, not a class hierarchy**. Card
variants — `wb-cardimage`, `wb-cardhero`, `wb-cardprofile`, `wb-cardstats`,
`wb-cardpricing`, and more — are **independent components**. They are NOT subclasses
of a shared base class (there is no such class). Instead they share the
card's semantic structure through Light-DOM markup and add only what is unique to their
purpose via `x-*` behaviors and extra content.

<wb-demo>
<wb-card title="Hello" variant="elevated">
  <p>Keep related information together in a clear, reusable surface.</p>
  <p><strong>Status:</strong> Ready to review</p>
</wb-card>
</wb-demo>

## Card structure

Every card shares the same semantic regions:

- **Header:** Title, subtitle, and optional badge.
- **Main:** The primary card content (user-provided).
- **Footer:** Optional area for footer text or actions.
- **Variants:** Different visual styles (e.g., glass, elevated, clickable).

## Composition for specialized functionality

Each variant composes the shared card structure with the extra markup or behaviors it
needs — nothing is inherited from a base class:

- `wb-cardimage` composes an image section into the card layout.
- `wb-cardhero` adds a hero banner region and optional call-to-action buttons.
- `wb-cardprofile` composes avatar, user info, and social links.
- `wb-cardstats` adds stat blocks or data visualizations.

Composition keeps variants flexible: new features are added to a specific card type
without affecting any other. Capabilities come from composing behaviors and markup —
the wb-starter way (Light DOM, `x-*` behaviors, schema-driven properties).

The `wb-card` is the foundational card component in the wb-starter library, designed for maximum flexibility, accessibility, and maintainability. Built on the Light DOM architecture and the WBServices pattern, it provides a robust foundation for dozens of card variants (image, hero, testimonial, product, etc.) while ensuring:

- **Consistent UI/UX:** All cards share a unified structure and behavior, making your app look and feel cohesive.
- **Modern Web Standards:** Custom elements, ES Modules, and schema-driven properties.
- **Easy Customization:** Compose new card types with minimal code — no base class to subclass.
- **Performance & Accessibility:** No Shadow DOM, so styles cascade naturally and accessibility is preserved.

This doc explains the core features, usage, and architectural choices behind `wb-card` and its variants.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-card>` |
| Behavior | `card` |
| Semantic | `<article>` |
| Base Tag | `<wb-card>` |
| Category | Cards |
| Schema | `src/wb-models/card.schema.json` |

## Card anatomy

A `<wb-card>` renders into these named parts. Here it is live, then the structure with
every element labeled:

<wb-demo>
<wb-card
  title="Title + Body"
  subtitle="A labeled content surface"
  badge="LIVE"
  footer="Updated just now"
  elevated>
  <p>The header, main content, and footer remain distinct in Light DOM.</p>
</wb-card>
</wb-demo>

```text
<wb-card>                          ← this is the CARD  (the root, an <article>)
  <header class="wb-card__header"> ← this is the HEADER
    <h3 class="wb-card__title">    ← this is the TITLE   (from the `title` attribute)
    <div class="wb-card__subtitle">← this is the SUBTITLE (optional)
    <span class="wb-card__badge">  ← this is the BADGE    (optional)
  <main class="wb-card__main">     ← this is MAIN — the BODY, where YOUR content goes
    <p>…</p>
  <footer class="wb-card__footer"> ← this is the FOOTER   (optional)
</wb-card>
```

| Part | Element / class | What it is |
|------|-----------------|-----------|
| **Card** | `<wb-card>` → `<article>` | The root component |
| **Header** | `<header class="wb-card__header">` | Holds the title, subtitle, and badge |
| **Title** | `<h3 class="wb-card__title">` | The card heading — from the `title` attribute |
| **Subtitle** | `.wb-card__subtitle` | Secondary heading — from `subtitle` (optional) |
| **Badge** | `.wb-card__badge` | Small status pill (optional) |
| **Main** | `<main class="wb-card__main">` | **Your content** — everything you put between the tags |
| **Footer** | `<footer class="wb-card__footer">` | Footer text / actions — from `footer` (optional) |

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

### Custom Element (Recommended)

<wb-demo>
<wb-card
  title="Card Title"
  subtitle="Subtitle text">
  <p>Use the custom element when the card is already part of your markup.</p>
  <p><strong>Tip:</strong> Keep the title specific to the content it introduces.</p>
</wb-card>
</wb-demo>

### Semantic Element

<!-- 2026-08-15: autoInject now defaults to ON site-wide (src/core/
     config.js) -- x-card is redundant here and has been removed. A bare
     <article> with the right attributes already becomes a card with zero
     extra markup; that's now the default, not a special case. -->
<wb-demo>
<article
  title="Semantic Card"
  subtitle="An article enhanced in place">
  <p>Use <code>x-card</code> when semantic HTML already owns the element.</p>
</article>
</wb-demo>

### With All Options

<wb-demo>
<wb-card
  title="Featured Card"
  subtitle="A brief description"
  footer="Last updated: Today"
  elevated
  clickable
  variant="glass">
  <p>Review the latest release notes and open the project workspace.</p>
  <p><strong>Next step:</strong> Select the card to continue.</p>
</wb-card>
</wb-demo>

### With a Tooltip

`tooltip` (alias: `hoverText`) shows a themed WB tooltip on hover -- not the
unstyled, slow, browser-inconsistent native `title` tooltip (#283):

<wb-demo>
<wb-card
  title="Hover Me"
  tooltip="Extra detail shown on hover">
  <p>Hover this card to reveal a themed tooltip with supporting context.</p>
</wb-card>
</wb-demo>

## Variants

### Default
<wb-demo>
<wb-card title="Default Card">
  <p>Standard card styling keeps the content easy to scan.</p>
</wb-card>
</wb-demo>

### Glass
<wb-demo>
<wb-card
  title="Glass Card"
  variant="glass">
  <p>Frosted glass effect with blur for layered content.</p>
</wb-card>
</wb-demo>

### Elevated
<wb-demo>
<wb-card
  title="Elevated Card"
  elevated>
  <p>Use elevation to separate a focused task from the surrounding page.</p>
</wb-card>
</wb-demo>

### Clickable
<wb-demo>
<wb-card
  title="Click Me"
  clickable>
  <p>Click anywhere on this card to activate its interactive state.</p>
</wb-card>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-card` | Always | Base styling |
| `.wb-card--elevated` | `elevated` | Drop shadow |
| `.wb-card--clickable` | `clickable` | Pointer cursor |
| `.wb-card--hoverable` | `hoverable` | Hover effects |
| `.wb-card--glass` | `variant="glass"` | Glass effect |
| `.wb-card--active` | After click | Active state |

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
document.querySelector('wb-card').addEventListener('click', (e) => {
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
const card = document.querySelector('wb-card');

// Show/hide
card.show();
card.hide();
card.toggle();

// Update properties
card.update({ title: 'New Title', elevated: true });
```

## Card Variants

Specialized variants build on the shared card structure:

| Variant | Purpose | Tag |
|---------|---------|-----|
| [cardimage](./cardimage.md) | Featured image | `<wb-cardimage>` |
| [cardhero](./cardhero.md) | Hero banner | `<wb-cardhero>` |
| [cardprofile](./cardprofile.md) | User profile | `<wb-cardprofile>` |
| [cardstats](./cardstats.md) | Statistics | `<wb-cardstats>` |
| [cardpricing](./cardpricing.md) | Pricing tier | `<wb-cardpricing>` |
| [cardbutton](./cardbutton.md) | Action buttons | `<wb-cardbutton>` |
| [cardlink](./cardlink.md) | Navigation link | `<wb-cardlink>` |

## Schema

Located at `src/wb-models/card.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "card.schema.json",
  "title": "Card Component",
  "behavior": "card",
  "baseClass": "wb-card",
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

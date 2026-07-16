# Card Component Overview

The wb-starter card system is built on **composition, not a class hierarchy**. Card
variants — `wb-cardimage`, `wb-cardhero`, `wb-cardprofile`, `wb-cardstats`,
`wb-cardpricing`, and more — are **independent components**. They are NOT subclasses
of a shared `cardBase` class (there is no such base class). Instead they share the
card's semantic structure through Light-DOM markup and add only what is unique to their
purpose via `x-*` behaviors and extra content.

<wb-demo>
<wb-card title="Hello" variant="elevated">
  <p>It just works.</p>
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

The `wb-card` is the foundational card component in the wb-starter library, designed for maximum flexibility, accessibility, and maintainability. Built on the Light DOM architecture and the WBServices pattern, it provides a robust base for dozens of card variants (image, hero, testimonial, product, etc.) while ensuring:

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
<wb-card title="Title + Body" elevated>
  <p>Simple card with title and hover effect.</p>
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
| `hoverText` | string | `""` | Tooltip on hover |
| `badge` | string | `""` | Badge text in header |

## Usage

### Custom Element (Recommended)

```html
<wb-card
  title="Card Title"
  subtitle="Subtitle text">
  This is the card content.
</wb-card>
```

### Semantic Element

```html
<article
  x-card
  title="Card Title">
  This is the card content.
</article>
```

### With All Options

```html
<wb-card
  title="Featured Card"
  subtitle="A brief description"
  footer="Last updated: Today"
  elevated
  clickable
  variant="glass">
  Main content goes here.
</wb-card>
```

## Variants

### Default
```html
<wb-card title="Default Card"> Standard card styling. </wb-card>
```

### Glass
```html
<wb-card
  title="Glass Card"
  variant="glass">
  Frosted glass effect with blur.
</wb-card>
```

### Elevated
```html
<wb-card
  title="Elevated Card"
  elevated>
  Card with drop shadow.
</wb-card>
```

### Clickable
```html
<wb-card
  title="Click Me"
  clickable>
  Click anywhere on this card.
</wb-card>
```

## Generated Structure

The card generates this semantic HTML:

```html
<article class="wb-card">
  <!-- Header (when title/subtitle set) -->
  <header class="wb-card__header">
    <div class="wb-card__header-content">
      <h3 class="wb-card__title">Title</h3>
      <p class="wb-card__subtitle">Subtitle</p>
    </div>
    <span class="wb-card__badge">Badge</span>
  </header>
  <!-- Main (always present) -->
  <main class="wb-card__main"> User content here... </main>
  <!-- Footer (when footer set) -->
  <footer class="wb-card__footer"> Footer text </footer>
</article>
```

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

The base card is extended by specialized variants:

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

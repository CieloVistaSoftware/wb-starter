# Card - wb-starter v3.0

Base card component using Light DOM architecture and WBServices pattern.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-card>` |
| Behavior | `card` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Schema | `src/wb-models/card.schema.json` |

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
<wb-card title="Card Title" subtitle="Subtitle text">
  This is the card content.
</wb-card>
```

### Semantic Element

```html
<article data-wb="card" data-wb-title="Card Title">
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
<wb-card title="Default Card">
  Standard card styling.
</wb-card>
```

### Glass
```html
<wb-card title="Glass Card" variant="glass">
  Frosted glass effect with blur.
</wb-card>
```

### Elevated
```html
<wb-card title="Elevated Card" elevated>
  Card with drop shadow.
</wb-card>
```

### Clickable
```html
<wb-card title="Click Me" clickable>
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
  <main class="wb-card__main">
    User content here...
  </main>
  
  <!-- Footer (when footer set) -->
  <footer class="wb-card__footer">
    Footer text
  </footer>
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

- [Cards Overview](./index.md) - All card components
- [Article Element](../semantic/article.md) - Semantic foundation

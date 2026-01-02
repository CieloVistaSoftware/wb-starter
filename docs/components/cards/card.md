# Card

The base card component. A self-contained composition with optional header, main content, and footer.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `card` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Icon | 🃏 |

## Inheritance

```
article (semantic) → card.base → card
```

The card **IS-A** article element, inheriting semantic structure and accessibility.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Card title displayed in header |
| `subtitle` | string | `""` | Subtitle displayed below title |
| `footer` | string | `""` | Footer text at bottom of card |
| `hoverText` | string | `""` | Tooltip text shown on hover |
| `elevated` | boolean | `false` | Add drop shadow |
| `clickable` | boolean | `false` | Make entire card clickable |

## Usage

### Basic Card

<article 
  data-wb="card" 
  data-title="Card Title">
  This is the card content.
</article>

```html
<article 
  data-wb="card" 
  data-title="Card Title">
  This is the card content.
</article>
```

### Card with Subtitle

<article 
  data-wb="card" 
  data-title="Card Title" 
  data-subtitle="A brief description">
  Main content goes here.
</article>

```html
<article 
  data-wb="card" 
  data-title="Card Title" 
  data-subtitle="A brief description">
  Main content goes here.
</article>
```

### Card with Footer

<article 
  data-wb="card" 
  data-title="Card Title" 
  data-footer="Last updated: Today">
  Content with footer.
</article>

```html
<article 
  data-wb="card" 
  data-title="Card Title" 
  data-footer="Last updated: Today">
  Content with footer.
</article>
```

### Elevated Card

<article 
  data-wb="card" 
  data-title="Elevated Card" 
  data-elevated="true">
  This card has a shadow.
</article>

```html
<article 
  data-wb="card" 
  data-title="Elevated Card" 
  data-elevated="true">
  This card has a shadow.
</article>
```

### Clickable Card

<article 
  data-wb="card" 
  data-title="Click Me" 
  data-clickable="true">
  Click anywhere on this card.
</article>

```html
<article 
  data-wb="card" 
  data-title="Click Me" 
  data-clickable="true">
  Click anywhere on this card.
</article>
```

## Structure

The card generates semantic HTML structure:

```html
<article class="wb-card">
  <!-- Header (when title is set) -->
  <header class="wb-card__header">
    <h3 class="wb-card__title">Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
  </header>
  
  <!-- Main content (always present) -->
  <main class="wb-card__main">
    User content here...
  </main>
  
  <!-- Footer (when footer is set) -->
  <footer class="wb-card__footer">
    Footer text
  </footer>
</article>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-card` | Always | Base card styling |
| `.wb-card--elevated` | `data-elevated="true"` | Drop shadow |
| `.wb-card--clickable` | `data-clickable="true"` | Pointer cursor, click handling |
| `.wb-card--active` | After click (toggles) | Active state styling |

## Interactions

### Hover

When `hoverable` is true (default):

```css
.wb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
```

### Click

When `clickable` is true:

1. Toggles `.wb-card--active` class
2. Dispatches `wb:card:click` event

### Keyboard

When clickable, card is focusable:

| Key | Action |
|-----|--------|
| `Enter` | Trigger click |
| `Space` | Trigger click |

## Events

### wb:card:click

Fired when a clickable card is clicked.

```javascript
document.querySelector('[data-wb="card"]').addEventListener('wb:card:click', (e) => {
  console.log('Card clicked, active:', e.detail.active);
});
```

| Property | Type | Description |
|----------|------|-------------|
| `detail.active` | boolean | Whether card is now active |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `button` | When clickable |
| `tabindex` | `0` | When clickable |

### Requirements

- Title should use appropriate heading level (H3 by default)
- Clickable cards are focusable and keyboard accessible
- Content should be understandable standalone

## Builder Integration

### Sidebar

```
📁 Cards
└── 🃏 Card
```

### Property Panel

| Group | Properties |
|-------|------------|
| Content | title, subtitle, footer |
| Style | elevated |
| Behavior | clickable |

### Defaults

```json
{
  "title": "Card Title",
  "subtitle": "",
  "footer": "",
  "elevated": false,
  "clickable": false
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `title="Card"` | Header with H3 title |
| `title="Card" subtitle="Sub"` | Header with title and subtitle |
| `title="Card" elevated="true"` | Has `.wb-card--elevated` class |
| `title="Card" clickable="true"` | Has `.wb-card--clickable` class, role="button" |

## Variants

The base card is extended by specialized variants:

| Variant | Purpose |
|---------|---------|
| [cardimage](./cardimage.md) | Featured image |
| [cardhero](./cardhero.md) | Hero banner |
| [cardprofile](./cardprofile.md) | User profile |
| [cardstats](./cardstats.md) | Statistics |
| [cardpricing](./cardpricing.md) | Pricing tier |
| [cardbutton](./cardbutton.md) | Action buttons |
| [cardlink](./cardlink.md) | Navigation link |

## Related

- [Article Element](../semantic/article.md) - Semantic foundation
- [Cards Overview](./index.md) - All card components
